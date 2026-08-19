# Taking this to the county — 17054 Handlebar Rd

Everything you need for the counter, on one page. Read `research/FINDINGS.md` for
the regulatory citations behind every number here.

## What you are asking for

A **Small Agricultural Store** (≤1,500 SF) at 17054 Handlebar Rd, under
**Zoning Ordinance §6157**.

**This does not need a Zoning Verification Permit.** ZO Update 102 (March 2020)
removed it. In the A70 zone a small agricultural store is **permitted by right**
as long as the §6157 standards are met — which is exactly what the plot plan
demonstrates. If a counter tech tells you a ZVP is required, ask them to check
Update 102; that is the document that removed it.

You will still need:

- a **building permit** for the public-accessed areas of the store (commercial
  building code), and
- a **retail food permit** from **DEHQ**, (858) 505-6900.

## Print instructions

- Sheet is **24" × 18"**, drawn at **1" = 40'** engineer scale.
- Print at **100% / actual size — do NOT "fit to page."** If it is scaled the
  drawing no longer measures at 1"=40' and the plans get rejected.
- County minimum sheet size is 18"×24", so 24"×18" is compliant.
- **Bring two complete sets** — PDS 090 item 2 requires two.
- Print the PDF: `output/Ag_Plot_Plan_17054_Handlebar_rev6.pdf`
- Check one dimension with an engineer's scale after printing. The graphic scale
  bar at the bottom left should measure exactly 4 inches from 0 to 160.

## The numbers, and where they come from

| | |
|---|---:|
| Total gross area of the premises | 164,443 SF (3.78 ac) |
| §6157(b)(i) — 50% suitable & available | 82,222 SF required |
| Provided (gross less residential/domestic) | **137,151 SF = 83.4%** |
| §6157(b)(ii) — 25% in active agricultural use | 41,111 SF required |
| Provided (crops 51,365 + poultry 6,331) | **57,696 SF = 35.1%** |
| Margin over the 25% test | **+16,585 SF** |
| Net area excl. road easements (PDS 090 item 12) | 157,251 SF (3.61 ac) |

**The denominator is gross, not net.** §6157(b)(ii) says "25 percent of the total
gross area of the premises." This settles the gross-vs-net question that was open
in the project notes. The parcel passes on either basis — 35.1% of gross, 36.7%
of net — so the answer cannot hurt you.

## Setbacks — no longer guesswork

The parcel's zoning box, pulled live from SanGIS, is
**A70 / L / 2AC / C / G / C / C**. The sixth field is the setback designator:
**C**. Zoning Ordinance §4810 Schedule C, row C:

| Yard | Required |
|---|---|
| Front | 60' from centerline |
| Interior side | 15' from lot line |
| Exterior side | 35' from centerline |
| Rear | 25' from lot line |

The earlier sheet showed 25' interior side "(VERIFY)". That was wrong — it is
15'. Corrected on rev 6.

**The barn holding the store clears every line by 104', 111' and 112'**, so the
store site conforms no matter which frontage the county calls the front yard.

## The three questions to ask at the counter

Ask these in this order. The first is the only one that can change the plan.

**1. Does a demised ≤1,500 SF portion of a larger building satisfy §6157(e)?**
§6157(e) caps the store at 1,500 SF total, including any open roofed display
area. The barn is about 3,400 SF. The sheet shows the store as a demised
50' × 30' = 1,500 SF portion of it, with a note that no other structure will be
used for on-site sales. If the county reads §6157(e) as requiring the *whole
building* to be ≤1,500 SF, the store has to go in a separate ≤1,500 SF structure
instead — so get this answered before spending anything.

**2. Which frontage is the front yard — Whirlwind Ln or Handlebar Rd?**
Handlebar Rd is a private easement, 30' wide where the assessor's map dimensions
it. Schedule C footnote (d) gives a 40' front yard from centerline for a lot
fronting a private easement under 40' wide. Nothing on the plan changes either
way, but it is worth having on the record.

**3. Confirm no Zoning Verification Permit is required** for the small store post
Update 102 — and what the building permit path is for the public areas.

PDS Zoning: **(858) 694-8985**. PDS Building: (858) 565-5920.

## Still open, and honest about it

These are on the sheet as notes rather than hidden:

- **Recorded Parcel Map PM 5062** has not been obtained. The document in
  `reference/` is the *assessor's map* (Book 278 Page 36), not the recorded map.
  The Handlebar Rd easement width and the Whirlwind Ln centerline position both
  come from it. The sheet says so in notes 10 and 12.
- **Preliminary title report** — not obtained. Definitive easement locations.
- **Fence heights** — PDS 090 item 8 asks for the height of free-standing fences,
  walls and gates. Note 13 says existing fencing only, heights to be
  field-verified, none proposed. Measure them on your next walk and they can go
  on the sheet.
- **Tiny home** sits 29' from the west line, inside the 35' exterior side yard.
  Removing it — already the plan — resolves the encroachment. Better to remove it
  before submitting so it comes off the sheet entirely.
- **Greenhouse** is shown honestly as as-built/unpermitted. Ask whether it
  qualifies for the agricultural building exemption.
- **The 200 SF off-site products area** inside the store has not been located
  yet. §6157(g) caps it at 200 SF including refrigeration cases. Decide where it
  goes when the store is laid out.
- **Parking location** is a proposal, not a survey. Six spaces are drawn to
  scale on the bare yard east of the barn, clear of every crop zone. Gravel is
  expressly allowed by §6157(h). Move it if it does not suit how you actually
  want people to drive in.
- **DEHQ handwash / catch tank** — still the open call from the earlier work.

## What is on the sheet

Every PDS 090 item, to scale: parcel boundary with bearings and distances on all
courses, north arrow, vicinity map, all structure footprints labelled
Existing / As-Built / Proposed with a square-footage table, use of each
structure, 400A electrical service, all four yard setbacks, well and leach
lines, owner name and address, APN and net area, driveways and parking with
surface and slope, lot drainage with the pond and area of inundation, easements
with names and centerlines, landscape statement, and stormwater per PDS 272
(land disturbance 0 SF, with the SD-B/SD-G/SD-H baseline measures that apply to
an existing-use site).

## Regenerating the sheet

```bash
cd plot-plan
python3 scripts/build_plot_plan.py     # -> Ag_Plot_Plan_17054_Handlebar.pdf
python3 scripts/make_overlay.py        # -> output/Verification_Overlay_v3.png
```

The build script fails loudly if the notes block or the store compliance box
outgrows its space, so a text edit cannot silently push content off the sheet.

Check `output/Verification_Overlay_v3.png` after any geometry change — it draws
the plan over the aerial photograph, and it is the fastest way to catch a
mistake. It already caught one: the parking bay was first drawn on vegetation
and labelled as existing gravel, and the overlay showed it.
