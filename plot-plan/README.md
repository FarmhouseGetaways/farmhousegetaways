# 17054 Handlebar Rd — Ag Plot Plan

San Diego County A70 zoning compliance package. APN 278-361-08-00.

**Start with `CLAUDE.md`.** It carries the full project context, site facts,
decision log, and open items. Read it before making changes.

## Quickstart

```bash
pip install matplotlib numpy
cd scripts
cp ../data/zone_polys.json .
python3 build_plot_plan.py
# -> Ag_Plot_Plan_17054_Handlebar.pdf  (24"x18", 1"=40')
# -> preview.png
```

## Where things are

- `CLAUDE.md` — full context. Read first.
- `data/` — parcel boundary, ag zone polygons, area table
- `scripts/build_plot_plan.py` — sheet generator
- `reference/` — county forms and the assessor's map

## The one-line status

Ag area totals 57,696 SF = 36.7% of net parcel, against a 25% / 39,313 SF
requirement. Compliance is met with 18,383 SF of margin. What's left is document
retrieval (recorded PM 5062, title report), two agency confirmations, and three
sheet items: fence heights, verified setbacks, stormwater BMPs.

## Two traps

1. **Reference PDFs are ZIP archives of JPEGs**, not real PDFs. If `pdfinfo`
   errors, run `file` on it, then `unzip` and read the page images.
2. **`Original_Parcel_Doc_PM_69370.pdf` is the assessor's map**, not the recorded
   Parcel Map PM 5062. Getting the actual recorded map is an open blocker.
