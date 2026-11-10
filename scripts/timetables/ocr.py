"""OCR the scanned (image-only) timetables and extract faculty rows.

Usage:  python scripts/timetables/ocr.py <cache_dir> [--master all.faculty.csv] [--only list.json]

Needs Tesseract (https://github.com/UB-Mannheim/tesseract/wiki, `winget install UB-Mannheim.TesseractOCR`).

How it works, per page:
  1. render at 300 dpi, find the table's ruled lines (long dark pixel runs)
  2. OCR the whole page once (word boxes) to find the header row
     ("Course Responsibility | Department | Contact No. | E-mail")
  3. OCR each name / department / phone / email cell separately (much cleaner than whole-page OCR)
  4. feed the cells to the same parser used for text PDFs (extract.parse_table)
OCR'd emails that are 1-2 characters off an address in the master list are corrected to it.

Writes <cache_dir>/records_ocr.json and <cache_dir>/ocr_pages/ (debug text).
"""
import argparse
import concurrent.futures as cf
import csv
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import fitz
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import extract  # noqa: E402

DPI = 300
TESS = shutil.which("tesseract") or r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TMP = Path(tempfile.mkdtemp(prefix="tt-ocr-"))


def tesseract(img: Image.Image, psm=6, tsv=False):
    fd, path = tempfile.mkstemp(suffix=".png", dir=TMP)
    os.close(fd)
    img.save(path)
    args = [TESS, path, "-", "--psm", str(psm), "-l", "eng"] + (["tsv"] if tsv else [])
    out = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    os.remove(path)
    return out


def runs_mask(binary, length, axis):
    """True where `length` consecutive dark pixels run along `axis`."""
    b = binary.astype(np.int32)
    if axis == 0:
        b = b.T
    c = np.cumsum(b, axis=1)
    c = np.pad(c, ((0, 0), (1, 0)))
    win = c[:, length:] - c[:, :-length]
    m = (win == length).any(axis=1)
    return m


def group(idx, gap=4):
    out = []
    for i in idx:
        if out and i - out[-1][1] <= gap:
            out[-1][1] = i
        else:
            out.append([i, i])
    return [(a + b) // 2 for a, b in out]


def page_words(img):
    words = []
    for line in tesseract(img, psm=11 if False else 3, tsv=True).splitlines()[1:]:
        p = line.split("\t")
        if len(p) == 12 and p[11].strip() and float(p[10]) > 0:
            x, y, w, h = map(int, p[6:10])
            words.append((x, y, w, h, p[11]))
    return words


def cells_text(words, y0, y1, x0, x1):
    ws = [w for w in words if y0 <= w[1] + w[3] / 2 <= y1 and x0 <= w[0] + w[2] / 2 <= x1]
    return " ".join(w[4] for w in sorted(ws, key=lambda w: (w[1] // 25, w[0])))


KEYWORDS = re.compile(r"university|subject|department|contact|semester|mon|tue|wed|lunch|credit", re.I)


def upright(img):
    """Some timetables are scanned sideways/upside down. Rotate until the text reads correctly."""
    def hits(im):
        small = im.resize((im.width // 2, im.height // 2))
        return len(KEYWORDS.findall(tesseract(small, psm=3)))
    if hits(img) >= 4:
        return img, 0
    osd = tesseract(img.resize((img.width // 2, img.height // 2)), psm=0)
    m = re.search(r"Rotate:\s*(\d+)", osd)
    order = [int(m.group(1))] if m else []
    order += [a for a in (90, 180, 270) if a not in order]
    best = (hits(img), img, 0)
    for ang in order:
        cand = img.rotate(-ang, expand=True)  # PIL rotates counter-clockwise; tesseract's angle is clockwise
        h = hits(cand)
        if h > best[0]:
            best = (h, cand, ang)
        if h >= 4:
            break
    return best[1], best[2]


def process_page(pdf_name, pno, img, master):
    img, rotated = upright(img)
    gray = np.asarray(img)
    H, W = gray.shape
    dark = gray < 150
    hl = group(np.where(runs_mask(dark, int(W * 0.25), axis=1))[0])  # horizontal rules (y)
    if len(hl) < 6:  # faint/grey ruling on some scans
        dark = gray < 200
        hl = group(np.where(runs_mask(dark, int(W * 0.25), axis=1))[0])
    words = page_words(img)
    full_text = "\n".join(
        " ".join(w[4] for w in ln) for ln in _lines(words))
    ctx = {"file": pdf_name, "page": pno, "ocr": True, "year": extract.academic_year(full_text)}
    recs = []
    for m in extract.COORD.finditer(re.sub(r"\s+", " ", full_text)):
        name, title = extract.clean_name(m.group(1))
        recs.append({"name": name, "title": title, "department": "", "phones": [m.group(2)], "emails": [],
                     "subject": "Class Co-ordinator", "paired": True, "raw": None, **ctx})
    for e in extract.emails_in(full_text.replace(" ", "\n")):
        recs.append({"loose_email": fix_email(e, master), "line": "", **ctx})

    # Header row candidates: rows whose OCR text looks like the faculty-table header, then the row
    # right after "CLASS CO-ORDINATOR" (whole-page OCR sometimes garbles the header itself).
    pairs = list(zip(hl, hl[1:]))
    cands = []
    for k, (a, b) in enumerate(pairs):
        t = cells_text(words, a, b, 0, W).lower()
        if (("responsib" in t or "faculty" in t or "teacher" in t or "course" in t or "subject" in t)
                and ("contact" in t or "mobile" in t or "mail" in t or "depart" in t)):
            cands.append(k)
    for k, (a, b) in enumerate(pairs):
        if "ordinator" in cells_text(words, a, b, 0, W).lower() and k + 1 < len(pairs):
            cands += [k + 1, k + 2]
    cols = None
    for k in dict.fromkeys(c for c in cands if c < len(pairs)):
        header = pairs[k]
        band = dark[header[0] + 5:header[1] - 5]
        if band.size == 0:
            continue
        vx = group(np.where(band.mean(axis=0) > 0.85)[0])
        if len(vx) < 4:
            continue
        spans = list(zip(vx, vx[1:]))
        # OCR every cell of the header and of each data row below it
        bands = [header] + [(a, b) for a, b in pairs[k + 1:] if b - a > 25]
        jobs = [(bi, ci, img.crop((x0 + 6, a + 5, x1 - 6, b - 5)))
                for bi, (a, b) in enumerate(bands) for ci, (x0, x1) in enumerate(spans) if x1 - x0 > 20]
        texts = {}
        with cf.ThreadPoolExecutor(max_workers=6) as ex:
            for (bi, ci, _), txt in zip(jobs, ex.map(lambda j: tesseract(j[2], psm=6), jobs)):
                texts[(bi, ci)] = txt.strip()
        grid = [[texts.get((bi, ci), "") for ci in range(len(spans))] for bi in range(len(bands))]
        rows = []
        for row in grid[1:]:
            if re.search(r"co-?ordinator", " ".join(row), re.I) and not re.search(r"@|\d{10}", " ".join(row)):
                break
            rows.append(row)
        cols = infer_roles(grid[0], rows)
        if cols:
            break
    if not cols:
        return recs + line_mode(words, ctx, master), full_text, "line mode (faculty table not found)"
    # emails never contain spaces; OCR adds them ("jayanta. bera@") and table borders become | [ ]
    if "email" in cols:
        for row in rows:
            row[cols["email"]] = re.sub(r"[\s|\[\]{}]+", "", row[cols["email"]])
    for r in extract.parse_table(rows, cols, ctx):
        r["emails"] = [fix_email(e, master) for e in r["emails"]]
        if r.get("raw"):
            r["raw"]["email"] = " ".join(fix_email(e, master) for e in extract.emails_in(r["raw"]["email"]))
        recs.append(r)
    return recs, full_text, f"{len(rows)} rows, columns {cols}"


DEPT_WORDS = re.compile(r"\b(cse|csit|ece|eee?|me|civil|physics|chem\w*|math\w*|hss|aids|ai&ds|set|mba|pharm\w*|agri\w*|"
                        r"zoology|botany|biotech\w*|marine|skill|electrical|mechanical|english|bba|fth)\b", re.I)
NAME_HINT = re.compile(r"\b(?:dr|mr|mrs|ms|prof)\b\.?", re.I)


def infer_roles(header, rows):
    """Decide which column is name / dept / phone / email from the cell contents.

    OCR often garbles the header ("Course Responsibili", empty "Department" cell), so the
    contents decide; the header only breaks ties.
    """
    hcols = extract.find_columns(header) or {}
    n = len(header)

    def frac(ci, test):
        cells = [r[ci] for r in rows if ci < len(r) and r[ci].strip()]
        return sum(bool(test(c)) for c in cells) / max(len(rows), 1)

    scores = {
        "phone": [frac(c, lambda t: extract.PHONE.search(t) and "@" not in t) for c in range(n)],
        "email": [frac(c, lambda t: "@" in t or "odisha" in t.lower() or "gmail" in t.lower()) for c in range(n)],
        "name": [frac(c, lambda t: NAME_HINT.search(t) and not re.search(r"\d{4}", t)) for c in range(n)],
        "dept": [frac(c, lambda t: DEPT_WORDS.search(t) and len(t) < 40 and not NAME_HINT.search(t)) for c in range(n)],
    }
    cols = {}
    for role in ("email", "phone", "name", "dept"):
        bonus = [0.25 if hcols.get(role) == c else 0 for c in range(n)]
        best = max((c for c in range(n) if c not in cols.values()), key=lambda c: scores[role][c] + bonus[c], default=None)
        if best is not None and scores[role][best] + bonus[best] >= 0.3:
            cols[role] = best
    if "subject" in hcols and hcols["subject"] not in cols.values():
        cols["subject"] = hcols["subject"]
    return cols if "name" in cols and ("phone" in cols or "email" in cols) else None


LINE_NAME = re.compile(r"((?:Prof|Dr|Mr|Mrs|Ms)\.?\s*(?:[A-Z][A-Za-z]*\.?\s*){1,5})")


def line_mode(words, ctx, master):
    """Fallback for tables without detectable rules: one OCR text line = one teacher."""
    out = []
    for ln in _lines(words):
        text = " ".join(w[4] for w in ln)
        # Rows can bleed into each other here, so be strict: one name, at most one phone, and only
        # official emails (merge.py checks those against the name; a stray gmail can't be checked).
        emails = [fix_email(e, master) for e in extract.emails_in(text.replace(" ", ""))]
        emails = [e for e in emails if e.endswith("@cgu-odisha.ac.in")]
        phones = extract.phones_in(text)
        names = LINE_NAME.findall(text)
        if len(names) == 1 and len(phones) <= 1 and (emails or phones):
            raw = re.sub(r"(\s+(?:" + DEPT_WORDS.pattern[3:-3] + r"|AI|DS|IT))+\s*$", "", names[0].strip(), flags=re.I)
            name, title = extract.clean_name(raw)
            if len(name) >= 3:
                out.append({"name": name, "title": title, "department": "", "phones": phones, "emails": emails[:1],
                            "subject": "", "paired": True, "raw": None, "line_mode": True, **ctx})
    return out


def _lines(words):
    lines = {}
    for w in sorted(words, key=lambda w: (w[1], w[0])):
        key = next((k for k in lines if abs(k - w[1]) < 15), w[1])
        lines.setdefault(key, []).append(w)
    return [sorted(v, key=lambda w: w[0]) for _, v in sorted(lines.items())]


def fix_email(e, master):
    e = re.sub(r"^[^a-z0-9]+", "", e.lower())
    if "@" in e:  # OCR-mangled domain: caqu-odisha.ac.in, cgu-oaisna.ac.in, egu-odisha.ac.ln ...
        local, dom = e.split("@", 1)
        if dom != "cgu-odisha.ac.in" and difflib.SequenceMatcher(None, dom, "cgu-odisha.ac.in").ratio() >= 0.75:
            e = local + "@cgu-odisha.ac.in"
    if master and e not in master and e.endswith("cgu-odisha.ac.in"):
        # compare only the part before @ (the shared domain would make every address look similar)
        local = e.split("@")[0]
        best, score = None, 0.0
        for m in master:
            ml = m.split("@")[0]
            if ml[:1] != local[:1]:
                continue
            s = difflib.SequenceMatcher(None, local, ml).ratio()
            if s > score:
                best, score = m, s
        if best and score >= 0.85:
            return best
    return e


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cache")
    ap.add_argument("--master")
    ap.add_argument("--only", help="json list of PDF names (default: scanned.json)")
    a = ap.parse_args()
    cache = Path(a.cache)
    master = []
    if a.master:
        with open(a.master, encoding="utf-8-sig") as f:
            master = [r[0].strip().lower() for r in csv.reader(f) if r and "@" in r[0]]
    names = json.loads(Path(a.only or cache / "scanned.json").read_text())
    dbg = cache / "ocr_pages"
    dbg.mkdir(exist_ok=True)
    out = []
    for name in names:
        doc = fitz.open(cache / "pdfs" / name)
        for pno, page in enumerate(doc, 1):
            pix = page.get_pixmap(dpi=DPI, colorspace=fitz.csGRAY)
            img = Image.frombytes("L", (pix.width, pix.height), pix.samples)
            try:
                recs, text, status = process_page(name, pno, img, master)
            except Exception as e:
                recs, text, status = [], "", f"error: {e}"
            (dbg / f"{name}.p{pno}.txt").write_text(f"# {status}\n{text}", encoding="utf-8")
            people = [r for r in recs if "name" in r]
            print(f"  {len(people):3d} rows  {name} p{pno}  ({status})", flush=True)
            out += recs
    (cache / "records_ocr.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"\n{sum('name' in r for r in out)} person-rows from {len(names)} scanned PDFs")
    shutil.rmtree(TMP, ignore_errors=True)


if __name__ == "__main__":
    main()
