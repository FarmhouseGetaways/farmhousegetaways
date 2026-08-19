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
takes a front yard of **40' from the centerline** of that easement. Handlebar Rd
is a private easement measuring 30' where dimensioned on the assessor's map, so
footnote (d) is likely to govern the Handlebar frontage.

The owner's "35' from the centerline of Whirlwind Lane" matches the Schedule C
**exterior side** yard exactly — corroborated, not guessed.

**The old sheet's 25' interior side placeholder was wrong; it is 15'.**

### Which frontage is "front" does not change the outcome

Measured clearances from each structure to the property lines:

| Structure | to W | to E | to S | to N |
|---|---:|---:|---:|---:|
| Barn / **proposed store** | **104'** | 415' | **112'** | **111'** |
| SFD | 322' | 159' | 216' | 27' |
| Garage / accessory | 433' | 104' | 222' | 22' |
| Shed NW | 67' | 496' | 225' | 49' |
| Trellis garden | 230' | 325' | 112' | 157' |
| Greenhouse | 294' | 269' | 96' | 186' |
| Coop / run | 326' | 245' | 75' | 189' |
| Shed NE | 474' | 95' | 277' | **5'** |
| Canopy NE | 495' | 66' | 270' | **12'** |
| Tiny home (to be removed) | **29'** | 533' | 112' | 131' |

The **barn clears every setback under every interpretation** — the store site is
safe whichever frontage PDS calls the front.

Two structures sit inside the 15' interior side setback, and both are legal:
**§4842** allows detached accessory buildings in a required setback provided
walls are ≥3' from the line and their **combined area within the setback does not
exceed 1,000 SF**. Shed NE (165 SF) + canopy NE (285 SF) = **450 SF**, both ≥3'
off the line. Compliant, and now cited on the sheet.

The **tiny home at 29' from the west line encroaches the 35' exterior side
setback** — removal (already planned) resolves it. This is a further reason to
remove it before submittal.

## 4. The one real obstacle: building size

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

## 5. Owners of record

SanGIS Assessor Parcels layer: **DZBINSKI CORY J** and **ULTSCH CARISSA**,
17054 Handlebar Rd, Ramona CA 92065. Doc 512661, 07/19/2021. Now on the title
block, as PDS 090 item 11 requires the owner's name.

## Sources

- ZO Update 102 — https://www.sandiegocounty.gov/content/dam/sdc/pds/zoning/ZO_Update_102.pdf
- Zoning Ordinance Part Four (§4810 Schedule C, §4842) — https://www.sandiegocounty.gov/content/dam/sdc/pds/zoning/z4000.pdf
- SanGIS PDS_Layers MapServer layers 13 (Zoning) and 0 (Assessor Parcels)
- PDS 090 Minimum Plot Plan Information; PDS 272 Stormwater BMP sample
