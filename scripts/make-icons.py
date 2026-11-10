"""Render the PNG app icons from app/icon.svg (needs PyMuPDF: pip install pymupdf).

Usage: python scripts/make-icons.py
Reads public/icon.svg. Writes public/icons/apple-icon.png (180), icon-192.png, icon-512.png and
icon-maskable-512.png (full-bleed background with a safe zone, for Android).
"""
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
svg = (ROOT / "public" / "icon.svg").read_text(encoding="utf-8")
# PyMuPDF's SVG renderer doesn't do gradients -> use the solid brand purple for the PNGs
svg = svg.replace('fill="url(#g)"', 'fill="#7c3aed"')
# maskable: square background (no rounded corners) and the cap shrunk into the central 60% safe zone
maskable = re.sub(r'rx="14"', 'rx="0"', svg).replace(
    'transform="translate(12 12) scale(1.6667)"', 'transform="translate(17.6 17.6) scale(1.2)"')


def render(src: str, size: int, out: Path):
    doc = fitz.open("svg", src.encode("utf-8"))
    page = doc[0]
    zoom = size / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=True)
    out.parent.mkdir(parents=True, exist_ok=True)
    pix.save(out)
    print(f"{out.relative_to(ROOT)}  {pix.width}x{pix.height}")


render(svg, 180, ROOT / "public" / "icons" / "apple-icon.png")
render(svg, 192, ROOT / "public" / "icons" / "icon-192.png")
render(svg, 512, ROOT / "public" / "icons" / "icon-512.png")
render(maskable, 512, ROOT / "public" / "icons" / "icon-maskable-512.png")
