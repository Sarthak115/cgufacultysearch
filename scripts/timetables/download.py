"""Download every timetable PDF linked from the CGU timetable page.

Usage:  python scripts/timetables/download.py <out_dir>

Writes <out_dir>/pdfs/*.pdf and <out_dir>/manifest.json (url -> file, status).
Links that return an HTML "Page not found" instead of a PDF are recorded as dead.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

PAGE = "https://cgu-odisha.ac.in/academic/time-table/"
UA = {"User-Agent": "Mozilla/5.0 (cgu-faculty-search data refresh)"}
# Only timetable uploads; skip unrelated PDFs (UGC proposal, service rules, ...) linked in the site footer.
SKIP = re.compile(r"UGC-proposal|Xerox-Scan|Service-Rule|STRATEGY|self-disclosure|FDP-Brochure", re.I)


def fetch(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(urllib.parse.quote(url, safe=":/?&=%-._~"), headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def main(out_dir: str) -> None:
    out = Path(out_dir)
    pdf_dir = out / "pdfs"
    pdf_dir.mkdir(parents=True, exist_ok=True)

    html = fetch(PAGE).decode("utf-8", "replace")
    links = sorted(set(re.findall(r'href="([^"]+\.pdf)"', html, re.I)))
    links = [u for u in links if "/wp-content/uploads/" in u and not SKIP.search(u)]
    print(f"{len(links)} timetable links found")

    manifest = []
    for url in links:
        name = re.sub(r"[^\w.\-]+", "_", url.split("/uploads/", 1)[1].replace("/", "_"))
        dest = pdf_dir / name
        status = "ok"
        if not dest.exists():
            for attempt in range(3):
                try:
                    data = fetch(url)
                    break
                except Exception as e:  # network hiccup: retry
                    data, status = b"", f"error: {e}"
                    time.sleep(2)
            if data.startswith(b"%PDF"):
                dest.write_bytes(data)
                status = "ok"
            elif data:
                status = "dead (site returned HTML, not a PDF)"
        manifest.append({"url": url, "file": name if dest.exists() else None, "status": status})
        print(f"  {status:8.8}  {name}")

    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    ok = sum(m["status"] == "ok" for m in manifest)
    print(f"done: {ok} ok, {len(manifest) - ok} not downloaded")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".cache/timetables")
