# CLAUDE.md — 17054 Handlebar Rd Plot Plan & Farm Store Compliance

Context file for Claude Code. Read this first, in full, before touching anything.

---

## 1. The project in one paragraph

Farmhouse Getaways owns a 3.61-acre rural parcel at **17054 Handlebar Road,
Ramona, CA 92065** (APN **278-361-08-00**), zoned **A70 (Limited Agriculture)**
in unincorporated San Diego County. Two goals: (1) produce a submittable plot
plan proving **≥25% of the parcel is in agricultural use**, for County Planning &
Development Services (PDS); (2) establish a permitted **small farm store**
(≤1,500 SF) for retail food sales, via the Department of Environmental Health &
Quality (DEHQ). **Both are now on one sheet** — rev 6 documents the agricultural
operations and the proposed store together, which is what qualifies the parcel
under ZO §6157. See §16.

**Current status: plot plan REV 6 generated — the submittal sheet. It now carries
the Small Agricultural Store itself (1,500 SF in the barn, 6 parking spaces) and
the §6157 compliance block, not just the ag percentage. Compliance is met with
large margin on the correct (gross) basis. See `SUBMITTAL.md` for the
take-to-county packet and `research/FINDINGS.md` for every citation.**

**Two things previously open are now RESOLVED and must not be re-litigated:**

1. **Gross vs net (was §6, "unresolved").** ZO §6157(b)(ii) says "25 percent of
   the **total gross area** of the premises." The denominator is **gross**:
   164,443 SF, so the threshold is **41,111 SF**. Ag total 57,696 SF = **35.1%**.
2. **A70 setbacks (was §13.3, "confirm with PDS").** The parcel's zoning box from
   SanGIS is **A70 / L / 2AC / C / G / C / C** — setback designator **C**.
   ZO §4810 Schedule C row C: front **60'** from ℄, interior side **15'** from lot
   line, exterior side **35'** from ℄, rear **25'** from lot line. The old sheet's
   25' interior side was wrong; it is 15'.

---

## 2. How the owner works — read this before responding

These are hard-won and matter more than any technical detail here.

- **Direct, grounded answers only.** No over-engineering, no speculation, no
  content introduced without a basis in an actual file or a stated requirement.
- **Corrections come firm and fast.** When corrected, acknowledge, fix,
  recalibrate. Do not hedge, over-apologize, or re-litigate.
- **Always prefer the lowest-barrier, lowest-cost compliant path.** Never propose
  the over-built or over-permitted solution.
- **Work is sequenced deliberately.** Finish the core deliverable, then layer
  secondary items. BMPs/erosion control go on **last**, after the base sheet is
  complete — do not introduce them early.
- Owner may accept a less-precise number over a more-precise one to keep moving.
  State the recommendation once, plainly; if overruled, log the decision and
  proceed. (This happened with AG-9 — see §5.)

---

## 3. Parcel facts (established — do not re-derive)

| Item | Value |
|---|---|
| APN | 278-361-08-00 |
| Address | 17054 Handlebar Rd, Ramona, CA 92065 |
| Legal | Parcel 1 of Parcel Map 05062 (File No. 69370, May 1969) |
| Zoning | A70, Limited Agriculture |
| Assessor net area | 3.610 ac = **157,251 SF** |
| Recorded dimensions | ~**550.50' E–W × 285.58' N–S** |
| County GIS polygon (gross) | 164,443 SF = 3.775 ac |
| Difference (~7,192 SF) | Presumed road easement |
| **25% requirement (net)** | **39,313 SF** |
| Design target | ≥40,000 SF for margin |
| Residence | 4BR/2BA, 2,724 SF living area |

**Site orientation — these were owner corrections, get them right:**

- **Handlebar Road** is the private road easement crossing the **EAST portion**
  of the parcel on a N–S curve, entrance at the NE. It is **NOT** along the north
  property line.
- **Whirlwind Lane** runs along the **WEST** frontage.
- **West setback is 35', measured from the CENTERLINE of Whirlwind Lane.**
- A 30' road easement runs along the west boundary.
- Driveway runs E–W from Handlebar Rd: gravel at both ends, dirt mid-segment
  passing the residence. Slope <5% (flat site).
- Pond is an existing irrigation source (pump) and also the area of inundation.
  Lot drains to pond.
- 400A main electrical panel sits adjacent NE of the barn.
- The west-side long structure is a **TINY HOME to be removed** — not a shed.
- NE corner has a storage shed + canopy (existing).
- The Mini Barn Market barn is **not** counted as ag area. Rotated ~56'×53'.
- No County-mandated setback exists between poultry areas and greenhouse/garden
  beds on the same parcel. §3112 setbacks measure only to street centerlines and
  lot lines.

Boundary vertices (NAD83 CA State Plane Zone 6, US survey feet, WKID 2230) live
in `data/parcel_boundary.json` and are hardcoded in the generator script.

---

## 4. Agricultural area table (FROZEN NUMBERING)

Zone numbering is **frozen** to match the owner's own references. **#5 was removed
as a false detection — do not renumber** until field measurements are complete.

| # | Location | Crop | SF |
|---|---|---|---:|
| AG-1 | NW patch around old shed | Fruit trees (orchard) | 688 |
| AG-2 | North strip — west | Fruit trees (orchard) | 4,672 |
| AG-3 | North strip — east | Fruit trees (orchard) | 1,814 |
| AG-4 | Triangle behind Mini Barn Market | Vineyard | 2,074 |
| 5 | — REMOVED (false detection) | — | — |
| AG-6 | Patio patch S of residence | Pepper + nut trees | 1,896 |
| AG-7 | Trellis garden + greenhouse patch | Loofa + vegetables | 2,844 |
| AG-8 | Patch E of bird garden | Vegetables + flowers | 2,521 |
| AG-9 | East field (large) | Orchard 2, fruit trees | 17,125 |
| AG-10 | West strip (~50' wide) | Fruit trees + pumpkin | 7,530 |
| AG-11 | South strip | Fruit trees + pumpkin | 8,467 |
| AG-12 | SE strip along road | Rosemary (herbs) | 1,734 |
| | **Crop subtotal** | | **51,365** |
| BG | Bird garden — coop 10'×10', run 12'×20' | Poultry | 6,331 |
| | **AG TOTAL** | **36.7% of net** | **57,696** |

Residential area (excluded from ag calc): 27,292 SF.

**Margin: 57,696 − 39,313 = 18,383 SF over requirement.** Even a 20% haircut
across every zone leaves the parcel compliant. Compliance is not at risk; the
remaining measurement work is about accuracy, not pass/fail.

---

## 5. AG-9 field measurement — decision log

Owner tape-measured AG-9: **200' (west border along road), 130' (north/upper),
190' (east fence, the only straight side).** The other two sides are **curved,
bowing outward.**

Trace-vs-tape comparison:

| Side | Traced | Measured | Δ |
|---|---:|---:|---:|
| West along road | 204.9' | 200' | +2.4% |
| Upper/north | 132.4' | 130' | +1.8% |
| East fence (straight) | 201.2' | 190' | +5.9% |

**Critical: do NOT use Heron's formula on those three legs.** Heron gives 11,915
SF; the straight-chord triangle gives 11,637 SF. The outward bulge of the two
curved sides is worth ~5,200 SF of real ground. Straight-line triangle math
understates this field by roughly 30%.

Rescaling the traced polygon to the measured legs gives **15,773 SF**.

**Decision: owner elected to keep 17,125 SF** ("it's close enough"). Claude
recommended 15,773 SF as the more defensible figure and was overruled. Logged,
not re-litigated. The sheet carries a method note stating areas are
aerial-derived and field-corroborated.

**Open observation:** the east fence measured 11' shorter than parcel geometry
suggests. If that fence sits inboard of the east property line, there may be
farmable ground not currently counted. Worth checking on the next site visit.

---

## 6. Gross vs. net — RESOLVED: gross

ZO §6157(b)(ii): "At least 50 percent of the area in a) above (**i.e., 25 percent
of the total gross area of the premises**) shall be in actual active
agricultural, horticultural, or animal husbandry use."

**Gross is the denominator.** Gross = the county GIS parcel polygon,
**164,443 SF**, so the requirement is **41,111 SF**. Ag total 57,696 SF =
**35.1% of gross**, margin **+16,585 SF**.

There is a second test people miss — §6157(b)(i): **50% of gross** must be
"suitable and available for agricultural, horticultural, animal husbandry or open
space use" = 82,222 SF. Gross less the residential/domestic area (27,292 SF)
leaves **137,151 SF = 83.4%**. Passes comfortably. Both tests are now on the
sheet.

PDS 090 item 12 still requires **net** area exclusive of road easements
(157,251 SF) to be stated, so both figures belong on the plan for different
reasons. Do not delete either.

---

## 7. Plot plan sheet — rev 5 baseline (superseded by rev 6, see §17)

Generated by `scripts/build_plot_plan.py`. Output: 24"×18" landscape,
**1"=40'**, matplotlib → PDF. At that scale the 550.5'×285.6' parcel plots at
~13.8"×7.1", leaving room for the right-hand panel.

**On the sheet now:**
- Parcel boundary from county GIS, bearing + distance labels on all major courses
- 12 ag zones hatched, labeled, with SF; bird garden cross-hatched; residential
  area dashed green
- Structures with footprints digitized from aerial as rotated polygons: SFD,
  garage, barn, 3 sheds, canopy, trellis garden, greenhouse (as-built,
  unpermitted), coop + run, pool
- Pond with inundation note, drainage arrows to pond
- Well, septic tank, leach lines
- 400A electrical panel
- Handlebar Rd centerline + ~20' travelled way
- Driveway with gravel/dirt segment labels
- **Whirlwind Ln: centerline, 30' road easement line, 35' setback-from-CL line
  with dimension tick** (added rev 5)
- **Interior side / rear setbacks at 25', labeled "(VERIFY)"** (added rev 5)
- North arrow, graphic scale bar, vicinity map, legend, ag summary table,
  structure summary table, 13 notes, title block

**Assumptions flagged in the drawing that must be resolved:**
1. Whirlwind centerline is drawn coincident with the west property line. If the
   recorded PM 5062 shows the CL offset from the PL, the 35' setback line shifts.
   **Still open in rev 6** (note 10).
2. ~~Interior side / rear setbacks at 25' are placeholders.~~ **RESOLVED in
   rev 6 — designator C: interior side 15', rear 25'. See §6.**

Crops fall within setback areas — this is fine and note #11 says so explicitly:
crop areas are non-structural and no structures are proposed within any setback.

---

## 8. Regenerating the sheet

```bash
cd scripts
python3 build_plot_plan.py      # reads ../data/zone_polys.json
                                # writes Ag_Plot_Plan_17054_Handlebar.pdf + preview.png
```

Requires: `matplotlib`, `numpy`. The script expects `zone_polys.json` in its
working directory — copy it in or adjust the path.

Coordinate system: feet, origin at SW corner of the parcel bounding box, north
up. Zone polygons were extracted with origin at NW (y measured down from the
north PL) and already flipped in the JSON, so `y` is measured north-up from the
south bbox edge. Do not flip again.

A `Verification_Overlay.png` (plan geometry over the registered aerial) was
produced for owner sign-off. Regenerate by overlaying the same coordinates on
the aerial.

---

## 9. Method notes for future work

- The aerial layout image (`Plot_Plan_LayoutV1.png`, in the owner's project) is
  **cropped exactly to the parcel boundary — the image edge IS the property
  line.** Never infer property line position from interior image features or
  linework.
- Color coding in that aerial: **green = residential/domestic, excluded from ag
  calculation; red/orange = farming and animal husbandry zones.**
- Zone tracing used OpenCV color-based extraction. Calibration: image width maps
  to 550.50', height to 285.58'.
- Uploaded reference PDFs in this repo may actually be **ZIP archives containing
  JPEG page images** with no OCR text layer. If `pdfinfo` fails with "Couldn't
  find trailer dictionary", run `file` on it — then `unzip`, and read pages with
  PIL: `Image.crop()` → `Image.resize(..., LANCZOS)` to upscale and read fine
  survey notations.

---

## 10. PDS 090 compliance checklist

Every item below must appear to scale or plans get rejected.

- [x] Parcel legally created; plot plan matches legal lot plat 100%
- [x] Min sheet size 18"×24" — using 24"×18"
- [x] Standard engineer scale — 1"=40'
- [x] North arrow
- [x] Vicinity map
- [x] Entire parcel shown, all property line dimensions
- [x] Structure footprints labeled Existing / As-Built / Proposed (never "Future")
- [x] Use of each structure identified + SF summary table
- [x] Electrical service location and size (400A)
- [ ] **Fence/wall/gate heights labeled** — NOT YET ON SHEET
- [~] Front, exterior side, interior side, rear setbacks — drawn, 3 of 4 unverified
- [x] Well and leach lines located
- [x] Owner name, address, parcel address
- [x] APN + net area exclusive of road easements
- [x] Driveways/parking, paving material, slope % and direction
- [ ] **Stormwater BMPs** — DO LAST, after base sheet is final. See PDS 272.
- [~] All existing easements with names, widths, centerlines — Handlebar width
      still TBD from PM 5062
- [ ] Landscape area location and SF if new/modified

---

## 11. Fence rules (PDS 070) — for when fence heights get added

- No building permit for fences ≤6', or open fences to 8' where the top 2' is
  barbed/razor wire on angled supports.
- Zoning Ordinance §6708 heights: main building area — up to the main building's
  max height; front or exterior side yard — **42" max**; rear or interior side
  yard — **72" max**.
- Ramona is a Wildland-Urban Interface area: any fence portion within 5' of a
  building must be non-combustible or approved fire-retardant per County Building
  Code §707A.

---

## 12. Farm store track (parked)

- Operation is a walk-in retail store in the **"small farm store" tier, ≤1,500
  SF**. This tier does **not** require a customer restroom.
- **Do not apply lower-tier exempt-stand strategies** (whole uncut produce only,
  no health permit). The operation exceeds that tier. A70 does permit roadside
  agricultural sales as an accessory use with a 300 SF roofed limit, but that is
  a different, lower pathway than what's being pursued.
- A plumbed handwash sink is required → requires approved wastewater disposal.
- Existing septic is ~400' from the store location. Tie-in is impractical and
  cost-prohibitive.
- **A wastewater holding/catch tank qualifies as approved disposal.** A full
  OWTS/leach field is not necessarily required for a single low-use handwash
  sink.
- Likely solution: self-contained handwash station, fresh water supply +
  wastewater catch tank sized above fresh-water volume, pumped out periodically.
- **Open action: confirm with DEHQ that a catch-tank setup satisfies the
  handwash requirement for this store tier rather than requiring hard plumbing.**

---

## 13. Open items

**Blocking submittal:**
1. Obtain **recorded Parcel Map PM 5062** from the County Recorder — needed for
   Handlebar Rd easement width and centerline, and to confirm Whirlwind
   frontage geometry. Note: `Original_Parcel_Doc_PM_69370.pdf` in `reference/`
   is an **assessor's map** (Book 278, Page 36), **not** the recorded parcel map.
   Critical distinction for plan check.
2. Preliminary title report — definitive easement locations and boundaries,
   particularly the 30' road easement on the west and anything extending onto the
   neighboring property across the road.
3. ~~Confirm interior side / rear setbacks; ask about gross-vs-net.~~
   **DONE — both resolved from the ordinance and the parcel's zoning box. See §6
   above and `research/FINDINGS.md`.** What remains for PDS is the single
   question in §16 below.
4. Add fence, wall, and gate heights to the sheet — still open; note 13 states
   existing fencing only, heights to be field-verified, none proposed.
5. ~~Add stormwater BMPs as the final layer.~~ **DONE — rev 6 carries the PDS 272
   block: land disturbance 0 SF plus the SD-B / SD-G / SD-H baseline measures
   that apply to an existing-use site with no construction.**

**Owner-side:**
6. Field measurements for remaining zones, priority by size: AG-11 (8,467),
   AG-10 (7,530), BG (6,331), AG-2 (4,672); everything else is under 3,000 SF
   and won't move the total. Flag any zone landing >10% off the trace.
7. Sign-off on **Verification Overlay v3** (`output/Verification_Overlay_v3.png`) —
   it now shows the proposed store and parking in red over the aerial.
8. Decide on the tiny home: remove before submittal (then drop from plan), or
   keep shown dashed as "to be removed."
9. Check whether the east fence sits inboard of the east property line.

**Farm store:**
10. Call DEHQ re: catch-tank handwash station (see §12).

---

## 14. Agency contacts

| Agency | Purpose | Phone |
|---|---|---|
| PDS Zoning | Zoning, setbacks, plot plan | (858) 694-8985 |
| PDS Building Division | Building permits, fences | (858) 565-5920 |
| DEHQ Food & Housing | Retail food permitting | (858) 505-6900 |
| Farm Bureau Ag Permit Coordinator | Ag permitting help | (760) 745-3023 |

---

## 15. Repo contents

```
CLAUDE.md                     this file
data/
  zone_polys.json             ag zone + residential polygons, feet, origin SW
  parcel_boundary.json        state plane vertices + derived dimensions
scripts/
  build_plot_plan.py          generates the 24x18 sheet
reference/
  Original_Parcel_Doc_PM_69370.pdf   assessor's map (NOT recorded PM 5062)
  Plot_Plan_Sample_pds090.pdf        minimum plot plan info + sample
  Plot_Plan_Cover_Sheet_pds040.pdf   building plot plan template
  Fences_pds070.pdf                  fence regulations
  pds272.pdf                         stormwater BMP sample presentation
  17054_Property_Detail.png          assessor property detail sheet
```

Note: several reference PDFs are ZIP archives of JPEGs — see §9.


---

## 16. The Small Agricultural Store — the actual goal

The plot plan exists to qualify the parcel for a **Small Agricultural Store,
≤1,500 SF**, under **Zoning Ordinance §6157** (as amended by ZO Update 102,
adopted 26 March 2020). Full standards and citations: `research/FINDINGS.md`.

**Permitted by right.** Update 102 "Removes the Zoning Verification Permit for
Small Agricultural Stores." In A70 there is **no minimum lot size** and **no
discretionary permit** — the store is allowed if the §6157 standards are met.
Still required: a building permit for the public-accessed areas (commercial
building code) and a DEHQ retail food permit.

This is the lowest-barrier path and it is the one the sheet documents. Do not
propose a Large Agricultural Store (1,501–3,000 SF) — that needs an
Administrative Permit and is a materially higher barrier.

### What §6157 requires, and how the sheet answers it

Every criterion is tabulated in the "SMALL AGRICULTURAL STORE COMPLIANCE" box on
the sheet. The ones with teeth:

- **≥50% of gross suitable/available** and **≥25% of gross in active ag use** —
  83.4% and 35.1%. Both pass.
- **Store ≤1,500 SF** including all open roofed display area, conforming to
  §4810 setbacks. Shown as a demised 50'×30' portion of the barn.
- **Minimum 6 parking spaces**, gravel expressly allowed, disabled access per
  CBC ch. 11B. Six drawn to scale, one van accessible.
- **≤200 SF** of the store for products not raised on the property.
- Hours 10 a.m. to legal sunset; one sign ≤4 SF; **events prohibited**.

### The one real obstacle — do not paper over it

**§6157(e) caps the store at 1,500 SF total. The barn is ~3,400 SF.**

The sheet shows the store as a **demised 1,500 SF portion** of the barn, with
note 14 stating no other structure will be used for on-site sales. Whether the
county accepts a demised portion of a larger building, or reads §6157(e) as
requiring the whole building to be ≤1,500 SF, is **the question that decides the
project**. Ask PDS Zoning before spending money. If they require a standalone
building, the store moves to a separate ≤1,500 SF structure and the sheet
changes accordingly.

### Setback compliance is not at risk

The barn clears the west line by 104', the north by 111' and the south by 112'.
Whichever frontage PDS calls the front yard, the store site conforms. Two minor
structures — the NE shed (165 SF) and canopy (285 SF) — do sit inside the 15'
interior side yard, and both are legal under **ZO §4842**: walls ≥3' from the lot
line, combined area within the setback 450 SF against a 1,000 SF limit. Note 5
says so on the sheet.

---

## 17. Rev 6 sheet — what changed and how it is protected

`scripts/build_plot_plan.py` now emits the submittal sheet. **Parcel, zone,
structure, road and utility geometry is unchanged from rev 5** (owner-verified);
everything added is the store layer, corrected setbacks, and presentation.

Added in rev 6: sheet border and margin; the store and parking; the §6157
compliance column; the ag calculation on the gross basis with both thresholds;
ruled tables with a footprint column; a legend with real hatch and linetype
swatches instead of colour names; owner names of record (Cory J. Dzbinski &
Carissa Ultsch, per SanGIS); structure-to-property-line dimensions; a title block
with a revision history; the PDS 272 stormwater block; and a larger vicinity map
with Highland Valley Rd for orientation.

**Two layout guards are built in.** The script raises `SystemExit` if the notes
block would overrun the title block, or if the store compliance box would
overrun its column. Edit note text freely — if it no longer fits, the build fails
loudly instead of silently pushing content off the sheet. Keep those guards.

**Run `scripts/verify_sheet.py` before printing.** It opens the finished PDF and
measures it: sheet size, the parcel plotting true at 1"=40', and the graphic
scale bar spanning exactly 3.00 in for 120 ft. It caught a real defect in rev 6 —
the scale bar was labelled 0–160 ft but measured 2.88 in, which would have made
every distance a checker scaled off it wrong. The sheet also writes to
`output/` regardless of the working directory, so there is no stale-copy trap.

**Always regenerate the verification overlay after a geometry change:**

    python3 scripts/make_overlay.py     # -> output/Verification_Overlay_v3.png

It draws the plan over the aerial. It earned its keep immediately in rev 6: the
parking bay was first placed on vegetation and labelled "existing gravel", and
the overlay showed the grass. It was moved to the bare yard and relabelled
"proposed gravel". Abstract line drawings hide that class of error; the overlay
does not.

## 18. Repo contents (updated)

```
CLAUDE.md                     this file
SUBMITTAL.md                  take-to-county packet: print rules, the numbers,
                              the three questions to ask, what is still open
research/FINDINGS.md          §6157 verbatim, §4810 Schedule C, §4842, the
                              SanGIS zoning box, sources
data/                         zone polys, parcel boundary, ag areas, site features
scripts/build_plot_plan.py    generates the 24x18 sheet (rev 6)
scripts/make_overlay.py       verification overlay on the aerial
scripts/verify_sheet.py       print-fidelity check — run before printing
reference/                    county forms and the assessor's map
source/                       owner aerial + well/septic markup
output/                       rev5 + rev6 PDFs, overlays v2 and v3
```
