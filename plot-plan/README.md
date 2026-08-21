# 17054 Handlebar Rd — Agricultural Operations & Small Agricultural Store Plot Plan

San Diego County compliance package. APN 278-361-08-00, Ramona CA 92065, zoned A70.

**Start with `CLAUDE.md`** for full project context and the decision log.
**`SUBMITTAL.md`** is the take-to-county packet — print rules, the numbers, and
the questions to ask at the counter. **`research/FINDINGS.md`** carries the
regulatory citations behind every figure.

## What this is for

Qualifying the parcel for a **Small Agricultural Store (≤1,500 SF)** under
**Zoning Ordinance §6157**. In A70 that store is **permitted by right** — ZO
Update 102 (March 2020) removed the Zoning Verification Permit — provided the
parcel meets the agricultural-use tests the plot plan documents.

## Status

| Test (ZO §6157(b)) | Required | Provided | |
|---|---:|---:|---|
| 50% of gross suitable & available for ag/open space | 82,222 SF | 137,151 SF | **83.4% — passes** |
| 25% of gross in actual active agricultural use | 41,111 SF | 57,696 SF | **35.1% — passes** |

The denominator is **gross** (164,443 SF) because §6157(b)(ii) says "25 percent
of the total gross area of the premises." Net area (157,251 SF) is stated
separately because PDS 090 item 12 requires it.

Setbacks come from the parcel's own zoning box — **A70/L/2AC/C/G/C/C**, setback
designator **C** — so §4810 Schedule C gives front 60' from ℄, interior side 15',
exterior side 35' from ℄, rear 25'. The residence fronts **Handlebar Rd**, so
that is the front yard at 40' from its centreline under Schedule C footnote (d);
Whirlwind Ln is the exterior side yard at 35' from centreline. The barn holding
the store clears every yard by a wide margin.

**The store is the entire existing Mini Barn Market building** — 10'×10' =
100 SF per the owner — against a 1,500 SF limit, so the old demised-portion
question is closed. The big barn is storage, 2,200 SF.

## Quickstart

```bash
pip install matplotlib numpy pymupdf pillow
python3 scripts/build_plot_plan.py   # -> output/Ag_Plot_Plan_17054_Handlebar_rev6.pdf (24x18, 1"=40')
python3 scripts/make_overlay.py      # -> output/Verification_Overlay_v3.png
python3 scripts/verify_sheet.py      # print-fidelity check — run before printing
```

## Where things are

- `CLAUDE.md` — full context, decision log, open items. Read first.
- `SUBMITTAL.md` — what to do at the county counter.
- `research/FINDINGS.md` — §6157 verbatim, §4810 Schedule C, §4842, the SanGIS zoning box.
- `data/` — parcel boundary, ag zone polygons, area table, site features.
- `scripts/` — sheet generator, aerial overlay, print-fidelity check.
- `reference/` — county forms and the assessor's map.
- `output/` — the sheet and the verification overlays.

## Three traps

1. **Print at 100%, never "fit to page."** The scale bar must measure exactly
   3 inches from 0 to 120. `verify_sheet.py` asserts this on the PDF.
2. **The drawn boundary is the county GIS polygon (164,443 SF); the record
   parcel is 550.50' × 285.58' = 157,212 SF.** They disagree.
   `Original_Parcel_Doc_PM_69370.pdf` is the assessor's map, not the recorded
   Parcel Map PM 5062. Getting the recorded map is the top open item.
3. **Check the aerial overlay after any geometry change.** Abstract line drawings
   hide siting errors; the overlay caught the parking bay drawn on grass.
