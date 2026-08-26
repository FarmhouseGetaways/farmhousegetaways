# Regulatory findings — 17054 Handlebar Rd small farm store

Researched 19 Aug 2026. These resolve open items §6 and §13.3 of `CLAUDE.md`.

## 1. The controlling ordinance: Small Agricultural Store

**San Diego County Zoning Ordinance §6157**, as amended by **ZO Update No. 102
(03-20, adopted March 26 2020)** — "Commercial Agriculture Operations →
On-Site Agricultural and/or Horticulture Sales → 2. Agricultural Store, Small."

Verbatim standards:

| ¶ | Requirement |
|---|---|
| a | Permitted in **A70** (also A72, S88, S90, S92; RR only on lots ≥2 ac). **No minimum lot size in A70.** |
| b.i | "At least 50 percent of the **total gross area of the premises** shall be suitable and available for agricultural, horticultural, animal husbandry or open space use" |
| b.ii | "At least 50 percent of the area in a) above (**i.e., 25 percent of the total gross area of the premises**) shall be in actual active agricultural, horticultural, or animal husbandry use" |
| c | Operated by owner or tenant of the property |
| d | One store per legal lot; not allowed with an existing Agricultural Stand or Large Agricultural Store |
| e | "the floor area of the building and all open, roofed areas used for display of products for sale **shall not exceed a total of 1,500 square feet**. No other structures on the property shall be used for on-site sales. The structure shall conform to all setbacks pursuant to **Section 4810**. All areas accessed by the public shall be permitted and constructed in compliance with the applicable commercial building code and shall comply with all applicable requirements of the Department of Environmental Health." |
| g | Retail area for items **not** raised on the property limited to **200 SF**, including refrigeration cases |
| h | "**A minimum of six parking spaces** shall be provided" — may be chip seal, gravel or recycled asphalt; any disabled stalls/aisles/routes per **CBC ch. 11B**, stable, firm, slip-resistant |
| i | Hours: 10 a.m. to legal sunset, seven days |
| j | One on-premise sign, max 4 SF |
| k | Events (weddings, concerts) prohibited; on-site instruction allowed |

**Permit: none.** Update 102 "Removes the Zoning Verification Permit for Small
Agricultural Stores." The small store is permitted **by right** in A70 subject to
these standards. A building permit is still required for public-accessed areas
(commercial building code) plus DEHQ retail food permitting.

*Large* Agricultural Store (1,501–3,000 SF) requires an Administrative Permit —
a higher barrier, and not the path being pursued.

## 2. GROSS vs NET — resolved

The ordinance says **"25 percent of the total gross area of the premises."**
The denominator is **gross**, not net. This settles `CLAUDE.md` §6.

| Basis | Area | 25% threshold | Ag 57,696 SF |
|---|---:|---:|---|
| **Gross (GIS polygon)** | **164,443 SF** | **41,111 SF** | **35.1% — PASSES** |
| Assessor net | 157,251 SF | 39,313 SF | 36.7% — passes |

Margin on the governing gross basis: **+16,585 SF**.

The 50% suitable-and-available test (¶b.i) needs 82,222 SF. Gross less the
residential/domestic area (27,292 SF) leaves **137,151 SF = 83.4%** — passes
with very large margin.

PDS 090 item 12 separately requires *net* area exclusive of road easements to be
stated on the sheet, so both figures belong on the plan, serving different rules.

## 3. Setbacks — resolved from the parcel's own zoning box

Queried SanGIS live (`gis-public.sandiegocounty.gov/arcgis/rest/services/PDS/PDS_Layers/MapServer/13`,
point query at the parcel centroid, 19 Aug 2026). The zoning box returned:

    USEREG A70 · ANIMALREGS L · LOT 2AC · BUILDTYPE C
    HEIGHT G · SETBACK C · SPECIALREGS C

**Setback designator = C.** Zoning Ordinance **§4810 Schedule C**, row C:

| Yard | Requirement |
|---|---|
| Front | **60'** from centerline |
| Interior side | **15'** from lot line |
| Exterior side | **35'** from centerline |
| Rear | **25'** from lot line |

Footnote (d): a lot fronting a private street or easement **less than 40' wide**
takes a front yard of **40' from the centerline** of that easement.
(**Owner corrections 8/21/2026: no road crosses the parcel at all** — the N-S
curve once traced through the east portion, first called Handlebar Rd and then
an "access road easement", does not exist. Access is the driveway, exiting
between AG-9 and AG-12 and continuing ±700' to Handlebar Rd via an easement
across the adjacent parcel. Whether footnote (d) applies to that off-parcel
easement is a PDS counter question; the sheet draws all setbacks from the
property lines.)

The owner's "35' from the centerline of Whirlwind Lane" matches the Schedule C
**exterior side** yard exactly — corroborated, not guessed.

**The old sheet's 25' interior side placeholder was wrong; it is 15'.**

### Which frontage is "front" does not change the outcome

Measured clearances from each structure to the property lines:

Measured to the **actual lot lines** (rev 6 measured to the parcel's bounding
box, which was wrong — see the correction note below):

| Structure | N side (15') | S side (15') | Exterior side, to Whirlwind ℄ (35') |
|---|---:|---:|---:|
| Barn / **proposed store** | **109'** | **105'** | **104'** |
| SFD | 19.6' | 213' | 322' |
| Garage / accessory | 22' | 219' | 433' |
| Shed NW | 46.6' | 218' | 67' |
| Trellis garden | 152' | 105' | 230' |
| Greenhouse | 179' | 90' | 294' |
| Coop / run | 182' | 70' | 326' |
| Shed NE | ~5' | 275' | 474' |
| Canopy NE | ~12' | 268' | 495' |
| Tiny home (to be removed) | 130' | 105' | **29'** ✗ |

**The barn clears every yard by a wide margin, so the store site is safe.** That
is the finding that matters.

The NE shed (165 SF) and canopy (285 SF) sit inside the 15' interior side yard,
and both are legal under **§4842**: walls ≥3' from the lot line, and combined
area within the setback of **450 SF** against a 1,000 SF limit. The tiny home at
29' encroaches the 35' exterior side yard; removal, already planned, resolves it.

### Which line is the front — settled by the owner

**The residence fronts the private access road easement crossing the east
portion, so that is the front yard.** The easement is 30' wide where the
assessor's map dimensions it, so Schedule C footnote (d) gives a **40' front
yard from its centreline**. (8/21/2026: this easement was previously mislabelled
"Handlebar Rd" — Handlebar itself is ~700' away across the adjacent parcel and
does not touch the layout. The geometry and the 40' figure are unchanged; only
the name was wrong.)

That makes **Whirlwind Ln the exterior side yard at 35' from centreline** —
exactly the figure the owner gave from the start — with **north and south as
interior side yards at 15'**.

An earlier draft put the front on Whirlwind. That was wrong; the front follows
the house.

**Final owner decision (8/21/2026, third round): every setback is measured
from the property lines** — N/S interior side 15', west 35' (Whirlwind ℄ at
the west P.L.). A draft that buffered a 40' front yard off the access
easement's curved centreline was rejected ("setbacks should be from the thick
black line, not some imaginary road"); the east yard was drawn as a straight
25' REAR offset instead, as a stand-in.

**Fourth round (8/22/2026, rev 27): the east yard is FRONT, not rear**, and the
line moves from 25' to 40'. The owner: "the east property line should be the
front yard because that is the side where our address road, Handlebar Road,
resides." This matches the finding above rather than contradicting it — the
residence fronts the access road/Handlebar direction, so per Schedule C that
line is the front yard. Footnote (d) gives 40' (private easement under 40'
wide); since no centreline is drawn on this parcel, 40' is measured straight
off the east property line, keeping the owner's standing rule. Whirlwind
(west, 35') is confirmed as the EXTERIOR SIDE yard, not "rear" — Schedule C's
rear figure is 25', which does not apply here; the west label was already
correct and needed no change. Whether PDS would rather measure the front yard
from an off-site easement centreline is left as a counter question
(SUBMITTAL question 1); nothing about the store turns on the answer.

*(Historical note: the clearance table above predates the 8/21/2026 owner
corrections — the "Shed NE" and "Canopy NE" rows were the NEIGHBOUR'S buildings
and are off the sheet, and the store is no longer in the barn; see §4.)*

## 4. The one real obstacle: building size — **RESOLVED, no obstacle**

**Final state (owner, 8/21/2026, second round): the store is the NEW "Mini Barn
Market", a 12'×10' = 120 SF building under construction just W of the 10'×10'
storage building at the NW.** 120 SF against the 1,500 SF cap — nothing below
in this section applies any more; it is kept as the research trail. (First
round had it as the existing 10'×10'; the owner then designated the new 12'×10'
as the store and the 10'×10' as storage only, no sales.)

§6157.e caps the store at **1,500 SF total** — building floor area *plus* all
open roofed display areas.

The barn ("Mini Barn Market") measures roughly **56' × 53' ≈ 3,400 SF** by aerial
digitising (`CLAUDE.md` records ~2,968 SF). Either figure **exceeds 1,500 SF**,
so the barn as a whole cannot be the small store.

Three ways forward, cheapest first:

1. **Demise a ≤1,500 SF store area** within the barn — a permanent separation,
   with the remainder not used for on-site sales (¶e: "No other structures on the
   property shall be used for on-site sales"). The sheet shows a 50' × 30' =
   1,500 SF store area on this basis.
2. Use or build a **separate structure ≤1,500 SF**.
3. **Large Agricultural Store** (1,501–3,000 SF) via Administrative Permit — only
   if the barn is confirmed ≤3,000 SF, and a materially higher barrier.

**Confirm option 1 with PDS before submittal** — whether a demised portion of a
larger building satisfies ¶e, or whether the whole building must be ≤1,500 SF.
This is the single question that decides the farm store path.

## 5. The boundary discrepancy

The sheet draws the **county GIS parcel polygon**: an irregular figure
583.1' × 293.9' enclosing **164,443 SF**.

The **assessor's map** (Book 278, Page 36) shows the record parcel as a clean
rectangle **550.50' × 285.58' = 157,212 SF (3.61 AC)**, side lines N0°43'E, end
lines N89°32'W — which matches the assessor's stated acreage exactly.

The two disagree by about 32.75' in width and 7,231 SF in area — **and that is
the 30' road easement along the west boundary.** The GIS polygon runs out to
the far side of the Whirlwind Ln easement; the record and assessor figures stop
at the net parcel. This is the county's own gross-vs-net distinction, so the
two numbers are consistent rather than contradictory, and the sheet now tables
both (rev 25). PDS 090 item 1
requires the plot plan to "match the legal lot plat/map to 100%", so this is an
acceptance risk at the counter, and **recorded PM 5062 governs**. It has not been
obtained — still the top blocking item.

The sheet discloses this in note 1 and demonstrates the ag tests on **both**
bases (32.3% of GIS gross, 33.8% of the record parcel), so the outcome does not
turn on which is used.

## 6. Owners of record

SanGIS Assessor Parcels layer: **DZBINSKI CORY J** and **ULTSCH CARISSA**,
17054 Handlebar Rd, Ramona CA 92065. Doc 512661, 07/19/2021. Now on the title
block, as PDS 090 item 11 requires the owner's name.

## Sources

- ZO Update 102 — https://www.sandiegocounty.gov/content/dam/sdc/pds/zoning/ZO_Update_102.pdf
- Zoning Ordinance Part Four (§4810 Schedule C, §4842) — https://www.sandiegocounty.gov/content/dam/sdc/pds/zoning/z4000.pdf
- SanGIS PDS_Layers MapServer layers 13 (Zoning) and 0 (Assessor Parcels)
- PDS 090 Minimum Plot Plan Information; PDS 272 Stormwater BMP sample
