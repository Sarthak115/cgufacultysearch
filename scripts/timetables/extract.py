"""Extract faculty contact rows from downloaded timetable PDFs.

Usage:  python scripts/timetables/extract.py <cache_dir>

Reads  <cache_dir>/pdfs/*.pdf
Writes <cache_dir>/records.json   one record per (person, timetable row)
       <cache_dir>/scanned.json   PDFs with no text layer (need OCR / manual read)

Each timetable has a table with columns like
  Subject | Course Responsibility | Department | Contact No. | E-mail
The column order differs between departments, so columns are found by header keywords.
"""
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

fitz.TOOLS.mupdf_display_errors(False)

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:in|com|org|net|edu)", re.I)
PHONE = re.compile(r"(?<!\d)(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})(?!\d)")
TITLE = re.compile(r"^(?:prof\.?\s*\(dr\.?\)|dr|prof|mr|mrs|ms|miss|chef|er)\b\.?\s*", re.I)
GROUP_PREFIX = re.compile(r"^(?:\(?\d{0,2}[A-Za-z]{0,2}\)?\s*[-–:]\s*|gr(?:oup)?\.?\s*-?\s*\w+\s*[-–:]\s*|sec(?:tion)?\s*\w+\s*[-–:]\s*)")
NOISE = re.compile(r"\((?:vf|guest|visiting|tbd|new)\)|\bvisiting faculty\b|\btbd\b|\buniversity\s+tt\s+co-?ordinator\b", re.I)
# Lab-group markers such as (A), (B), (A/B), (/B), (a b), (A&B)
GROUP_MARK = re.compile(r"\(\s*/?\s*[A-Za-z0-9]{1,2}(?:\s*[/&,]?\s*[A-Za-z0-9]{1,2})*\s*\)")
TITLE_SPLIT = re.compile(r"(?=\b(?:Prof|Dr|Mr|Mrs|Ms|Miss)\b\.?\s*[A-Z(])")

HEADER_KEYS = {
    "name": ("responsib", "faculty", "teacher", "instructor", "coordinator", "coach", "name"),
    "dept": ("depart", "dept"),
    "email": ("mail",),
    "phone": ("contact", "mobile", "phone", "mob"),
    "subject": ("subject",),
}


def norm_cell(c):
    return (c or "").strip()


def find_columns(row):
    """Return {role: column_index} if this row looks like the faculty-table header."""
    cells = [norm_cell(c).lower().replace("\n", " ") for c in row]
    if any("@" in c for c in cells):
        return None
    cols = {}
    for i, c in enumerate(cells):
        if not c:
            continue
        if "mail" in c and "email" not in cols:
            cols["email"] = i
            if "contact" in c and "phone" not in cols:  # "Email id/ Contact" combined column
                cols["phone"] = i
        elif any(k in c for k in HEADER_KEYS["dept"]) and "dept" not in cols:
            cols["dept"] = i
        elif any(k in c for k in HEADER_KEYS["phone"]) and "phone" not in cols and "coordinator" not in c:
            cols["phone"] = i
        elif any(k in c for k in HEADER_KEYS["name"]) and "name" not in cols and "subject name" not in c and "skill name" not in c:
            cols["name"] = i
        elif c in ("course", "responsibility"):
            cols.setdefault("name", i)
        elif "subject" in c and "abbr" not in c and "code" not in c and "subject" not in cols:
            cols["subject"] = i
    if "name" in cols and ("phone" in cols or "email" in cols):
        return cols
    return None


def clean_name(s):
    s = NOISE.sub(" ", s)
    s = GROUP_MARK.sub(" ", s)
    s = GROUP_PREFIX.sub("", s.strip())
    s = " ".join(tok for tok in s.split() if not re.search(r"\d", tok))  # names never contain digits
    s = re.sub(r"[\s/,;:&-]+$", "", s).strip()
    s = re.sub(r"^[\s/,;:&-]+", "", s)
    s = re.sub(r"\s+", " ", s)
    title_m = TITLE.match(s)
    title = ""
    while title_m:  # "Prof. Dr." etc.
        title = (title + " " + title_m.group(0).strip()).strip()
        s = s[title_m.end():]
        title_m = TITLE.match(s)
    return s.strip(" .-"), title


def _split(text):
    parts = re.split(r"\s*[/;,]\s*|\s+&\s+|\s+and\s+", text)
    out = []
    for p in parts:
        out += [q for q in TITLE_SPLIT.split(p) if q.strip()]
    merged = []
    for p in out:  # a chunk that is only a title ("Prof.", "Dr.") belongs to the next chunk
        if merged and re.fullmatch(r"\s*(?:prof|dr|mr|mrs|ms|miss)\.?\s*\(?", merged[-1], re.I):
            merged[-1] += " " + p
        else:
            merged.append(p)
    return [m.strip() for m in merged if len(re.sub(r"[^A-Za-z]", "", TITLE.sub("", m.strip()))) >= 3]


def split_names(cell, n_hint=0):
    """Split a cell that may hold several teachers.

    Line breaks inside a cell are usually just wrapping, so lines are joined first and the text
    is split on separators (/ ; , &) and before titles (Dr., Mr., ...). If that yields fewer
    names than there are phones/emails in the row, line breaks are treated as separators too.
    """
    text = GROUP_MARK.sub(" ", NOISE.sub(" ", cell))
    names = _split(re.sub(r"\s*\n\s*", " ", text))
    if n_hint > len(names):
        by_line = [n for line in text.split("\n") for n in _split(line)]
        if len(by_line) == n_hint:
            names = by_line
    return names


def phones_in(text):
    # Numbers are often wrapped mid-number ("912\n3795004"): join lines first.
    joined = re.sub(r"(?<=\d)\s*\n\s*(?=\d)", "", text or "")
    return list(dict.fromkeys(re.sub(r"\D", "", m.group(1)) for m in PHONE.finditer(joined)))


def emails_in(text):
    # Emails are often wrapped mid-address ("name@cgu-odisha.a\nc.in"): join lines first.
    joined = re.sub(r"\s*\n\s*", "", text or "")
    found = [e.lower().rstrip(".") for e in EMAIL.findall(joined)]
    if not found:  # wrapped at a space instead
        found = [e.lower() for e in EMAIL.findall(re.sub(r"\s+", "", text or ""))]
    return list(dict.fromkeys(found))


def parse_table(rows, cols, ctx):
    out = []
    last_dept = ""
    for row in rows:
        cells = [norm_cell(c) for c in row]
        get = lambda role: cells[cols[role]] if role in cols and cols[role] < len(cells) else ""
        name_cell = get("name")
        if not name_cell or find_columns(row):
            continue
        email_cell = get("email")
        phone_cell = get("phone")
        emails = emails_in(email_cell) or emails_in(" ".join(c for i, c in enumerate(cells) if i != cols.get("name")))
        phones = phones_in(phone_cell) or phones_in(email_cell)
        dept = re.sub(r"\s+", " ", get("dept"))
        if "@" in dept or re.search(r"\d{5}", dept):  # merged cells shifted an email/phone here
            dept = ""
        dept = dept or last_dept
        last_dept = dept
        names = split_names(name_cell, max(len(emails), len(phones)))
        if not names:
            continue
        paired = len(names) == 1 or len(names) == len(emails) or len(names) == len(phones)
        for i, raw in enumerate(names):
            name, title = clean_name(raw)
            if len(re.sub(r"[^A-Za-z]", "", name)) < 3:
                continue
            if len(names) == 1:
                p, e = phones, emails
            else:
                p = [phones[i]] if len(phones) == len(names) else []
                e = [emails[i]] if len(emails) == len(names) else []
            out.append({
                "name": name, "title": title, "department": dept,
                "phones": p, "emails": e,
                "subject": re.sub(r"\s+", " ", get("subject"))[:80],
                "paired": paired,
                "raw": {"name": name_cell, "phone": phone_cell, "email": email_cell} if not paired else None,
                **ctx,
            })
    return out


def academic_year(text):
    """Academic year a timetable is for, e.g. '2026-27'.

    The "w.e.f." (with effect from) date is trusted first: many 2026 timetables still carry a copied
    label like "(2024-25) W.E.F. 17/08/2026". Some 2026 uploads really are last year's table
    ("(2025-26) W.E.F. 28/07/2025"), which this catches.
    """
    m = re.search(r"w\s*\.?\s*e\s*\.?\s*f\s*\.?\s*[:\-–]?\s*(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(?:20)?(\d\d)\b", text or "", re.I)
    if m:
        mo, y = int(m.group(2)), int(m.group(3))
        start = 2000 + y if mo >= 6 else 2000 + y - 1  # academic year starts mid-year
        return f"{start}-{(start + 1) % 100:02d}"
    m = re.search(r"(20\d\d)\s*[-–/]\s*(?:20)?(\d\d)\b", text or "")
    if m and int(m.group(2)) == (int(m.group(1)) + 1) % 100:
        return f"{m.group(1)}-{m.group(2)}"
    return ""


COORD = re.compile(
    r"(?:class\s+)?co-?ordinator\s*[:\-]?\s*((?:dr|prof|mr|mrs|ms)\.?\s*[A-Za-z. ]{3,60}?)\s*[;,(]?\s*"
    r"(?:mobile|mob|ph|contact)[^0-9]{0,6}(\d{10})", re.I)


def extract_pdf(path):
    doc = fitz.open(path)
    recs, has_text = [], False
    for pno, page in enumerate(doc, 1):
        text = page.get_text()
        if text.strip():
            has_text = True
        ctx = {"file": path.name, "page": pno, "year": academic_year(text)}
        for t in page.find_tables().tables:
            rows = t.extract()
            cols = None
            for ri, r in enumerate(rows):
                cols = find_columns(r)
                if cols:
                    recs += parse_table(rows[ri + 1:], cols, ctx)
                    break
        for m in COORD.finditer(re.sub(r"\s+", " ", text)):
            name, title = clean_name(m.group(1))
            recs.append({"name": name, "title": title, "department": "", "phones": [m.group(2)],
                         "emails": [], "subject": "Class Co-ordinator", "paired": True, "raw": None, **ctx})
        # Safety net: every email on the page, with the text line it sits on.
        for line in text.split("\n"):
            for e in emails_in(line):
                recs.append({"loose_email": e, "line": line.strip()[:160], **ctx})
    return recs, has_text


def main(cache_dir):
    cache = Path(cache_dir)
    pdfs = sorted((cache / "pdfs").glob("*.pdf"))
    records, scanned = [], []
    for p in pdfs:
        try:
            recs, has_text = extract_pdf(p)
        except Exception as e:
            print(f"  ERROR {p.name}: {e}")
            continue
        if not has_text:
            scanned.append(p.name)
            continue
        people = [r for r in recs if "name" in r]
        print(f"  {len(people):3d} rows  {p.name}")
        records += recs
    (cache / "records.json").write_text(json.dumps(records, indent=1, ensure_ascii=False), encoding="utf-8")
    (cache / "scanned.json").write_text(json.dumps(scanned, indent=1), encoding="utf-8")
    people = [r for r in records if "name" in r]
    print(f"\n{len(people)} person-rows from {len(pdfs) - len(scanned)} text PDFs; "
          f"{sum(not r['paired'] for r in people)} need manual pairing; {len(scanned)} scanned PDFs skipped")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".cache/timetables")
