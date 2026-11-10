"""Scrape faculty names + designations from the official CGU website.

Usage:  python scripts/website/scrape_site.py <cache_dir>

Reads the department / faculty pages listed in the site's page-sitemap, plus the leadership,
administrative-offices, contact and library-staff pages. From each it takes ONLY:
  name, designation, department (from the page), and any email/phone shown next to the name.
(Qualification, date of joining etc. are ignored on purpose — department-only directory.)

Writes <cache_dir>/website.json and caches pages in <cache_dir>/html/.
"""
import html
import json
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://cgu-odisha.ac.in/"
UA = {"User-Agent": "Mozilla/5.0 (cgu-faculty-search data refresh)"}
EXTRA = ["leadership/", "academic-leadership/", "administrative-offices/", "contact-us/",
         "central-library/library-staff/", "central-library/contact-us/"]
PAGE_RE = re.compile(r"/(department-of-[^/]+|faculty-of-[^/]+)/$")

# page slug -> department alias understood by data/departments.json
SLUG_DEPT = {
    "computer-science-and-engineering": "cse", "electrical-engineering": "ee",
    "electrical-and-electronics-engineering": "ee", "electronics-communication-engineering": "ece",
    "mechanical-engineering": "me", "civil-and-environmental-engineering": "civil",
    "chemical-engineering": "chemical", "marine-engineering": "marine", "physics": "physics",
    "chemistry": "chemistry", "mathematics": "math", "humanities": "hss",
    "humanities-and-social-science": "hss", "business-management": "management", "management": "management",
    "agriculture-and-allied-sciences": "agriculture", "pharmacy": "pharmacy",
    "tourism-hospitality": "fth", "airlines-tourism": "fth", "b-sc-in-ath": "fth", "b-sc-in-cpa": "fth",
    "b-sc-in-hha": "fth", "food-beverage-service": "fth", "food-production": "fth", "front-office": "fth",
    "m-sc-ha": "fth", "m-sc-tm": "fth", "physical-and-mathematical-sciences": "",
    "engineering-and-technology": "",
}
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:in|com|org)")
PHONE = re.compile(r"(?<!\d)(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})(?!\d)")
TITLE = re.compile(r"^\s*(?:prof\.?\s*\(\s*dr\.?\s*\)|prof|dr|mr|mrs|ms|miss|er|capt)\b\.?", re.I)
DESIG = re.compile(r"professor|lecturer|dean|director|head|hod|registrar|controller|chancellor|"
                   r"coordinator|officer|librarian|assistant|instructor|trainer|chef|manager|executive", re.I)


def fetch(url, cache):
    f = cache / (re.sub(r"[^\w]+", "_", url.replace(BASE, "")).strip("_") + ".html")
    if f.exists():
        return f.read_text(encoding="utf-8", errors="replace")
    req = urllib.request.Request(url, headers=UA)
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                s = r.read().decode("utf-8", "replace")
            f.write_text(s, encoding="utf-8")
            time.sleep(0.5)  # be polite to the university server
            return s
        except Exception:
            time.sleep(2)
    return ""


class Tables(HTMLParser):
    """Collect every <table> as a list of rows of cell text; also keep the page's text lines."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self.stack, self.lines, self.skip = [], [], [], 0
        self.cur = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self.skip += 1
        elif tag == "table":
            self.stack.append([])
        elif tag == "tr" and self.stack:
            self.stack[-1].append([])
        elif tag in ("td", "th") and self.stack and self.stack[-1]:
            self.stack[-1][-1].append("")
        elif tag in ("br", "p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr"):
            self._flush()

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self.skip = max(0, self.skip - 1)
        elif tag == "table" and self.stack:
            self.tables.append(self.stack.pop())
        elif tag in ("p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th", "a", "span"):
            self._flush()

    def handle_data(self, data):
        if self.skip:
            return
        if self.stack and self.stack[-1] and self.stack[-1][-1]:
            self.stack[-1][-1][-1] += data
        self.cur.append(data)

    def _flush(self):
        t = re.sub(r"\s+", " ", "".join(self.cur)).strip()
        if t:
            self.lines.append(t)
        self.cur = []


def clean(s):
    return re.sub(r"\s+", " ", html.unescape(s or "")).strip(" |:-")


def parse_tables(tables, dept, url):
    out = []
    for t in tables:
        rows = [[clean(c) for c in r] for r in t if any(clean(c) for c in r)]
        hi = next((i for i, r in enumerate(rows[:3]) if any("name" in c.lower() for c in r)
                   and any("designation" in c.lower() for c in r)), None)
        if hi is None:
            continue
        hdr = [c.lower() for c in rows[hi]]
        ni = next(i for i, c in enumerate(hdr) if "name" in c)
        di = next(i for i, c in enumerate(hdr) if "designation" in c)
        for r in rows[hi + 1:]:
            if max(ni, di) >= len(r) or not re.search(r"[A-Za-z]{3}", r[ni]):
                continue
            joined = " ".join(r)
            out.append({"name": r[ni], "designation": r[di], "department": dept, "page": url,
                        "emails": EMAIL.findall(joined), "phones": [re.sub(r"\D", "", m) for m in PHONE.findall(joined)],
                        "kind": "department-table"})
    return out


def parse_people_cards(lines, dept, url, kind):
    """Leadership-style pages: 'Dr. X' / 'Role' / 'email' / 'phone' as consecutive text lines."""
    out, seen = [], set()
    for i, ln in enumerate(lines):
        if not TITLE.match(ln) or len(ln) > 60 or EMAIL.search(ln):
            continue
        role = lines[i + 1] if i + 1 < len(lines) else ""
        if not DESIG.search(role) or len(role) > 120:
            continue
        nxt = " ".join(lines[i + 2:i + 5])
        stop = re.search(r"(?:prof|dr|mr|mrs|ms)\b\.?\s", nxt, re.I)  # don't read the next person's details
        nxt = nxt[:stop.start()] if stop else nxt
        key = (ln, role)
        if key in seen:
            continue
        seen.add(key)
        out.append({"name": ln, "designation": role, "department": dept, "page": url,
                    "emails": EMAIL.findall(nxt), "phones": [re.sub(r"\D", "", m) for m in PHONE.findall(nxt)],
                    "kind": kind})
    return out


def parse_offices(lines, url):
    """administrative-offices: OFFICE NAME ... 'For more information, please contact:' <role> ... Phone: numbers."""
    out, office = [], None
    for i, ln in enumerate(lines):
        if ln.isupper() and 3 < len(ln) < 50 and "OFFICE" in ln or ln in ("STUDENT CENTRE",):
            office = ln.title()
        if ln.lower().startswith("for more information") and office:
            block = " ".join(lines[i + 1:i + 14])
            block = re.split(r"\b[A-Z][A-Z' ]{6,}OFFICE\b|STUDENT CENTRE", block)[0]
            phones = [re.sub(r"\D", "", m) for m in PHONE.findall(block)]
            land = re.findall(r"0\d{3}\s*[-—–]+\s*\d{6,8}", block)
            out.append({"office": office, "contact": lines[i + 1] if i + 1 < len(lines) else "",
                        "phones": phones, "landlines": [re.sub(r"[^\d]", "", x) for x in land],
                        "emails": EMAIL.findall(block), "page": url, "kind": "office"})
    return out


def main(cache_dir):
    cache = Path(cache_dir)
    hdir = cache / "html"
    hdir.mkdir(parents=True, exist_ok=True)
    sm = fetch(BASE + "page-sitemap.xml", hdir)
    urls = sorted({u for u in re.findall(r"<loc>([^<]+)</loc>", sm) if PAGE_RE.search(u)})
    urls += [BASE + p for p in EXTRA]
    records = []
    for url in urls:
        page = fetch(url, hdir)
        if not page:
            print(f"  FAILED {url}")
            continue
        p = Tables()
        p.feed(page)
        p._flush()
        slug = url.rstrip("/").rsplit("/", 1)[-1]
        dept = SLUG_DEPT.get(re.sub(r"^(department|faculty)-of-", "", slug), "")
        recs = parse_tables(p.tables, dept, url)
        kind = "leadership" if "leadership" in url else "card"
        recs += parse_people_cards(p.lines, dept, url, kind)
        if "administrative-offices" in url or "contact-us" in url:
            recs += parse_offices(p.lines, url)
        print(f"  {len(recs):3d}  {url.replace(BASE, '')}")
        records += recs
    (cache / "website.json").write_text(json.dumps(records, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"\n{sum('name' in r for r in records)} people rows, {sum('office' in r for r in records)} office rows")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".cache/website")
