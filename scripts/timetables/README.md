# Timetable scraper

Rebuilds `data/faculty.json` from the official CGU timetables. Run it each semester when new timetables are posted.

Needs Python 3.10+ and PyMuPDF (`pip install pymupdf`).

```bash
# 1. download every timetable PDF linked on https://cgu-odisha.ac.in/academic/time-table/
python scripts/timetables/download.py .cache/timetables

# 2. read the faculty table (name / department / phone / email) out of each text PDF
python scripts/timetables/extract.py .cache/timetables

# 3. OCR the scanned PDFs (needs Tesseract: winget install UB-Mannheim.TesseractOCR)
python scripts/timetables/ocr.py .cache/timetables --master path/to/all.faculty.csv

# 4. names + designations + Deans/HODs + office phones from the official website
python scripts/website/scrape_site.py .cache/website

# 5. merge everything with the current directory + the official ALL.FACULTY email export
python scripts/timetables/merge.py \
  --records .cache/timetables/records.json .cache/timetables/records_ocr.json \
  --website .cache/website/website.json \
  --base data/faculty.json \
  --master path/to/all.faculty.csv \
  --scanned .cache/timetables/scanned.json \
  --out data/faculty.json --report data/review-report.md      # also writes data/offices.json
```

Faculty are stored **by department only** — subjects, semesters and groups from the timetables are
never written to `data/`. The timetable's academic year comes from its "w.e.f." date (some uploads are
last year's tables); people seen only in older timetables are flagged "may have left".

Then read `data/review-report.md` and fix what it flags.

## How matching works
- An email is attached to a name only if the address resembles the name
  (`hiranmayee.mohapatra@` ↔ "Dr. H. Mohapatra"). Otherwise it is reported instead of used.
- Two records are the same person if they share an email, or share a phone number and have compatible
  names ("H. Mohapatra" ~ "Hiranmayee Mohapatra", "Mahapatra" ~ "Mohapatra"), or have the same full name.
- Roll-number emails (`2401070047@…`) and department mailboxes (`hss@`, `civil@`) are ignored for people.

## Known gaps
- Scanned (image-only) PDFs have no text and are listed in `scanned.json`; they need OCR or manual reading.
- Some links on the university page are dead (recorded in `manifest.json`).
