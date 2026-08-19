#!/usr/bin/env python3
"""Print-fidelity check for the plot plan sheet.

A county plan checker scales distances off the printed sheet, so the drawing and
the graphic scale bar must both measure true. This asserts they do. Run it after
any change to build_plot_plan.py, and before printing.

    python3 scripts/verify_sheet.py
"""
import os, sys
import pymupdf

SCALE = 40.0                      # ft per inch
SHEET_W, SHEET_H = 24.0, 18.0     # in
PARCEL_W, PARCEL_H = 583.1, 294.1 # ft, parcel bounding box
BAR_FT = 120.0                    # graphic scale bar span

_here = os.path.dirname(os.path.abspath(__file__))
PDF = os.path.join(_here, '..', 'output', 'Ag_Plot_Plan_17054_Handlebar_rev6.pdf')

fails = []
def check(label, ok, detail):
    print(f"  {'PASS' if ok else 'FAIL'}  {label}: {detail}")
    if not ok:
        fails.append(label)

doc = pymupdf.open(PDF)
page = doc[0]
print(f"Checking {os.path.normpath(PDF)}")

check("sheet size",
      abs(page.rect.width/72 - SHEET_W) < 0.01 and abs(page.rect.height/72 - SHEET_H) < 0.01,
      f"{page.rect.width/72:.2f} x {page.rect.height/72:.2f} in "
      f"(want {SHEET_W} x {SHEET_H}; county minimum 18x24)")

check("single sheet", doc.page_count == 1, f"{doc.page_count} page(s)")

# parcel boundary = the largest stroked path in the drawing field
parcel = None
for dr in page.get_drawings():
    r = dr['rect']
    if r.y1 < 1150 and r.width > 800 and r.height > 300:
        if parcel is None or r.width*r.height > parcel.width*parcel.height:
            parcel = r
if parcel is None:
    check("parcel boundary found", False, "no candidate path")
else:
    w_ft, h_ft = parcel.width/72*SCALE, parcel.height/72*SCALE
    check("drawing true to 1\"=40'",
          abs(w_ft-PARCEL_W) < 1.0 and abs(h_ft-PARCEL_H) < 1.0,
          f"parcel plots {w_ft:.1f} x {h_ft:.1f} ft (want {PARCEL_W} x {PARCEL_H})")

# graphic scale bar: the alternating filled segments in the lower-left box
segs = [dr['rect'] for dr in page.get_drawings()
        if dr['rect'].y0 > 1150 and dr['rect'].x0 < 400
        and 10 < dr['rect'].height < 20 and 40 < dr['rect'].width < 90]
if not segs:
    check("scale bar found", False, "no segments matched")
else:
    span_in = (max(r.x1 for r in segs) - min(r.x0 for r in segs)) / 72
    check("graphic scale bar true",
          abs(span_in - BAR_FT/SCALE) < 0.002,
          f"{BAR_FT:.0f} ft spans {span_in:.4f} in (want {BAR_FT/SCALE:.4f})")

check("vector output (not a raster dump)", len(page.get_images()) == 0,
      f"{len(page.get_images())} embedded image(s)")
check("fonts embedded", len(page.get_fonts()) > 0,
      f"{len(page.get_fonts())} font(s) subset into the file")

txt = page.get_text()
for phrase in ['1" = 40', 'APN 278-361-08-00', '§6157', 'SHEET 1 OF 1']:
    check(f"carries {phrase!r}", phrase in txt, "present" if phrase in txt else "MISSING")

print()
if fails:
    print(f"{len(fails)} check(s) FAILED: {', '.join(fails)}")
    sys.exit(1)
print("All print-fidelity checks passed. Print at 100% — do not 'fit to page'.")
