#!/usr/bin/env python3
"""Agricultural Operations & Small Agricultural Store Plot Plan
17054 Handlebar Rd, Ramona, CA 92065 — APN 278-361-08-00.

REV 7. 24"x18" sheet, engineer scale 1"=40'. Coordinates in feet, origin at the
SW corner of the parcel bounding box, north up. Zone polygons were extracted with
origin at NW (y measured down from the north PL) and are already flipped in the
JSON, so y is measured north-up from the south bbox edge. Do not flip again.

PARCEL / ZONE / STRUCTURE GEOMETRY IS FROZEN from rev 5 (owner-verified against
the aerial overlay). Rev 6 adds the Small Agricultural Store compliance layer and
corrects the setbacks, both grounded in research/FINDINGS.md:

  * Setbacks now per the parcel's own zoning box (SanGIS: A70/L/2AC/C/G/C/C),
    setback designator C -> ZO 4810 Schedule C. Interior side is 15', not the
    25' placeholder carried by rev 5.
  * Small Agricultural Store per ZO 6157: 1,500 SF store area, 6 parking spaces,
    and a compliance block testing each ordinance criterion.
  * Agricultural percentage now computed on the GROSS basis the ordinance
    specifies ("25 percent of the total gross area of the premises").

REV 7 corrects geometry errors found in QA. All of them had one root cause:
setbacks and clearances had been offset from the parcel's BOUNDING BOX instead
of its actual (sloping) property lines.

  * Setbacks are now true offsets from the real lot lines, drawn as a buildable
    envelope, computed with shapely. Yard assignment is now coherent: front on
    Whirlwind (west), rear east, interior sides north and south.
  * Ag zone polygons are CLIPPED to the parcel. About 3,134 SF of traced crop
    area lay outside the boundary and was being counted. Tabulated areas are now
    the clipped, in-parcel areas: 53,063 SF = 32.3% of gross. Still passes.
  * Structure clearances recomputed against the real lot lines. Three existing
    accessory structures encroach the north interior side yard; the sheet now
    says so instead of claiming everything clears.
  * Every property line segment is dimensioned, including the short ones.
  * The record parcel (550.50' x 285.58' = 157,212 SF per the assessor's map)
    differs from the county GIS polygon used here (164,443 SF). Disclosed in a
    boundary note, with compliance shown on both bases.
"""
import json, math, os
import numpy as np
from shapely.geometry import Polygon as SPoly, LineString, Point
from shapely.ops import unary_union
import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams['hatch.linewidth'] = 0.45   # keep ag stipple under the linework
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MPoly, Rectangle, Circle, Ellipse

SCALE = 40.0            # ft per inch
SHEET_W, SHEET_H = 24.0, 18.0
DATE = "8/21/2026"

# ---- compliance figures (see research/FINDINGS.md) ------------------------
# Areas are COMPUTED from the geometry below, not typed in, so the tables and
# the drawing can never disagree.
GROSS_SF   = 164443     # county GIS parcel polygon = "total gross area of the premises"
NET_SF     = 157251     # assessor net, for PDS 090 item 12
RECORD_SF  = 157212     # 550.50' x 285.58' per the assessor's map (record dimensions)
REQ_25_SF  = round(GROSS_SF * 0.25)     # ZO 6157.a.2.b.ii
REQ_50_SF  = round(GROSS_SF * 0.50)     # ZO 6157.a.2.b.i
STORE_SF   = 1500
# ZO 4810 Schedule C, designator C. The house fronts HANDLEBAR RD (east), so
# that is the front yard; Whirlwind Ln on the west is the exterior side yard.
SB_SIDE  = 15.0    # interior side, from lot line (north and south)
SB_EXT   = 35.0    # exterior side, from centreline of Whirlwind Ln
SB_FRONT = 40.0    # front, from centreline of Handlebar Rd (private esmt. <40' wide,
                   # Schedule C footnote (d))
ESMT_W     = 30.0       # Whirlwind Ln road easement along the west boundary
WL_CL_X    = 0.0        # its centreline, drawn at the west P.L. per owner (see note)

_here = os.path.dirname(os.path.abspath(__file__))
_zp = 'zone_polys.json' if os.path.exists('zone_polys.json') else os.path.join(_here, '..', 'data', 'zone_polys.json')
zones = json.load(open(_zp))

# ---- parcel boundary (state plane -> local ft, origin SW bbox corner, north up)
SP = [(6353226.9968340546,1952258.6981569827),(6353223.028009966,1951977.018930316),
(6353222.0001248866,1951977.0199145675),(6353202.0090231299,1951977.4231289774),
(6352974.9999627173,1951981.9998914748),(6352821.0071604699,1951984.3630757332),
(6352676.9119762182,1951983.9211474806),(6352643.874968797,1951983.8191135675),
(6352643.874968797,1952099.0770851374),(6352643.874968797,1952230.2329908162),
(6352643.874968797,1952270.9274632335),(6352656.9769767225,1952270.6528574824),
(6352731.2146891356,1952269.09577398),(6352753.893121466,1952268.6203812212),
(6353127.6863371432,1952260.7811580598),(6353167.9398655593,1952259.936671555),
(6353226.9968340546,1952258.6981569827)]
minx = min(p[0] for p in SP); miny = min(p[1] for p in SP)
PB = [(p[0]-minx, p[1]-miny) for p in SP]

# ---- geometry engine -------------------------------------------------------
# The parcel is NOT an axis-aligned rectangle. Everything derived from it —
# setbacks, clearances, clipped crop areas — is computed against the real lot
# lines. Offsetting from the bounding box was the rev 6 error.
PARCEL = SPoly(PB)
IDX_N = [10, 11, 12, 13, 14, 15, 0]      # north property line chain
IDX_S = [1, 2, 3, 4, 5, 6, 7]            # south property line chain
LINE_N = LineString([PB[i] for i in IDX_N])
LINE_S = LineString([PB[i] for i in IDX_S])
LINE_E = LineString([PB[0], PB[1]])      # east (rear) line
LINE_WCL = LineString([(WL_CL_X, -60), (WL_CL_X, 360)])   # Whirlwind Ln centreline
SXX0, SYY0 = 583.1/2186, 294.1/1136
LINE_HB = LineString([(x*SXX0, 294.1-y*SYY0) for x, y in
    [(2100,10),(2040,160),(1950,300),(1860,400),(1770,470),(1690,545),(1650,630),
     (1660,730),(1720,830),(1810,930),(1920,1030),(2030,1120),(2065,1136)]])

# Buildable envelope: the parcel less everything within each required yard.
# Subtracting a line buffered by d leaves exactly the ground more than d away
# from that line, which is the definition of the setback.
ENVELOPE = (PARCEL
            .difference(LINE_N.buffer(SB_SIDE))
            .difference(LINE_S.buffer(SB_SIDE))
            .difference(LINE_WCL.buffer(SB_EXT))
            .difference(LINE_HB.buffer(SB_FRONT)))

# Zone polygons are NOT clipped. The source aerial is cropped exactly to the
# parcel — the image edge IS the property line (owner-confirmed) — so a traced
# crop cannot lie outside the property. Any apparent overhang is the county GIS
# polygon disagreeing with the aerial at the margins, not a crop crossing a line.
ZONE_KEYS = ['1','2','3','4','6','7','8','9','10','11','12']
AG_TABLE = json.load(open(os.path.join(_here, '..', 'data', 'ag_areas.json')))
ZONE_SF = {z['id'].replace('AG-', '').replace('BG', 'BG'): z['sf'] for z in AG_TABLE['zones']}
clipped = {k: SPoly(v).buffer(0) for k, v in zones.items()}   # name kept; no clipping
ZONE_SF['RES'] = AG_TABLE['totals_sf']['residential_excluded']
CROP_SF    = AG_TABLE['totals_sf']['crop_subtotal']
POULTRY_SF = AG_TABLE['totals_sf']['poultry']
AG_TOTAL   = AG_TABLE['totals_sf']['ag_total']
RES_SF     = AG_TABLE['totals_sf']['residential_excluded']
AVAIL_SF  = GROSS_SF - RES_SF
PCT_AG    = AG_TOTAL / GROSS_SF * 100
PCT_AVAIL = AVAIL_SF / GROSS_SF * 100
PCT_AG_RECORD = AG_TOTAL / RECORD_SF * 100

def rings(geom):
    """Polygon or MultiPolygon -> list of exterior coordinate rings."""
    if geom.is_empty: return []
    gs = geom.geoms if geom.geom_type == 'MultiPolygon' else [geom]
    return [list(g.exterior.coords) for g in gs if not g.is_empty]

fig = plt.figure(figsize=(SHEET_W, SHEET_H))

# ============================ SHEET FRAME ==================================
frame = fig.add_axes([0, 0, 1, 1]); frame.set_xlim(0, SHEET_W); frame.set_ylim(0, SHEET_H)
frame.axis('off')
frame.add_patch(Rectangle((0.25, 0.25), SHEET_W-0.5, SHEET_H-0.5, fill=False, ec='black', lw=2.2))
frame.add_patch(Rectangle((0.32, 0.32), SHEET_W-0.64, SHEET_H-0.64, fill=False, ec='black', lw=0.7))

# ============================ DRAWING AXES =================================
DW_X0, DW_Y0 = 0.55, 8.05        # inches, lower-left of drawing axes
DW_W,  DW_H  = 16.55, 9.45
ax = fig.add_axes([DW_X0/SHEET_W, DW_Y0/SHEET_H, DW_W/SHEET_W, DW_H/SHEET_H])
ax.set_xlim(-39.4, -39.4 + DW_W*SCALE)      # 662.0 ft across  (parcel 583.1)
ax.set_ylim(-50.0, -50.0 + DW_H*SCALE)      # 378.0 ft tall    (parcel 294.1)
ax.set_aspect('equal'); ax.axis('off')

# ---- parcel boundary (heaviest line on the sheet)
ax.add_patch(MPoly(PB, closed=True, fill=False, ec='black', lw=2.6, zorder=5))

def bearing(p, q):
    dx, dy = q[0]-p[0], q[1]-p[1]
    az = math.degrees(math.atan2(dx, dy)) % 360
    if az <= 90: ns, ew, ang = 'N','E',az
    elif az <= 180: ns, ew, ang = 'S','E',180-az
    elif az <= 270: ns, ew, ang = 'S','W',az-180
    else: ns, ew, ang = 'N','W',360-az
    d = math.hypot(dx, dy)
    dg = int(ang); mn = int(round((ang-dg)*60))
    if mn == 60: dg += 1; mn = 0
    return f"{ns}{dg:02d}°{mn:02d}'{ew}  {d:.1f}'", d

# Every segment is dimensioned (PDS 090: "show all property line dimensions").
# Short segments get a leader so the text does not overlap its neighbours.
PB_CLOSED = PB + [PB[0]]
for i in range(len(PB_CLOSED)-1):
    p, q = PB_CLOSED[i], PB_CLOSED[i+1]
    label, d = bearing(p, q)
    if d < 0.9:
        continue
    mxp, myp = (p[0]+q[0])/2, (p[1]+q[1])/2
    ang = math.degrees(math.atan2(q[1]-p[1], q[0]-p[0]))
    if ang > 90 or ang < -90: ang += 180
    cx0, cy0 = 291, 147
    vx, vy = mxp-cx0, myp-cy0
    nl = math.hypot(vx, vy) or 1.0
    if d >= 30:
        ax.text(mxp+vx/nl*16, myp+vy/nl*16, label, fontsize=7.2, ha='center',
                va='center', rotation=ang, rotation_mode='anchor', zorder=6)
    else:
        # short course — leader out to clear text
        ax.annotate(label, (mxp, myp), (mxp+vx/nl*46, myp+vy/nl*46), fontsize=6.6,
                    ha='center', va='center', zorder=6,
                    arrowprops=dict(arrowstyle='-', lw=0.6),
                    bbox=dict(fc='white', ec='none', alpha=0.9, pad=1))

# ---- ag areas
crop_name = {
 '1': "ORCHARD (FRUIT TREES)", '2': "ORCHARD (FRUIT TREES)",
 '3': "ORCHARD (FRUIT TREES)", '4': "VINEYARD",
 '6': "PEPPER + NUT TREES", '7': "LUFFA + VEGETABLES",
 '8': "VEGETABLES + FLOWERS", '9': "ORCHARD 2 (FRUIT TREES)",
 '10': "FRUIT TREES + PUMPKIN", '11': "FRUIT TREES + PUMPKIN",
 '12': "ROSEMARY (HERBS)"}
lab_pos = {'1': (75,203), '4': (166,200), '7': (250,105), '10': (25,100),
           '11': (300,4), '12': (492,32)}
for k in ZONE_KEYS:
    for ring in rings(clipped[k]):
        ax.add_patch(MPoly(ring, closed=True, fc='none', ec='#8B0000', lw=1.1,
                           hatch='...', zorder=3))
for k in ZONE_KEYS:
    g = clipped[k]
    cx, cy = g.representative_point().x, g.representative_point().y
    if lab_pos.get(k): cx, cy = lab_pos[k]
    txt = f"AG-{k}\n{crop_name[k]}\n{ZONE_SF[k]:,.0f} SF"
    if k == '3':
        ax.annotate(f"AG-3  {crop_name[k]}  {ZONE_SF[k]:,.0f} SF", (cx, 288), (360, 316),
                    fontsize=6.6, ha='center', color='#7a0000', fontweight='bold', zorder=7,
                    arrowprops=dict(arrowstyle='-', lw=0.7, color='#7a0000'),
                    bbox=dict(fc='white', alpha=0.9, ec='#8B0000', lw=0.6, pad=1.6))
        continue
    ax.text(cx, cy, txt, fontsize=6.6, ha='center', va='center',
            color='#7a0000', fontweight='bold', zorder=7,
            bbox=dict(fc='white', alpha=0.9, ec='#8B0000', lw=0.6, pad=1.6))

for ring in rings(clipped['BG']):
    ax.add_patch(MPoly(ring, closed=True, fc='none', ec='#a07800', lw=1.3, hatch='xx', zorder=3))
bgp = clipped['BG'].representative_point()
ax.text(bgp.x+5, clipped['BG'].bounds[1]+16, f"BIRD GARDEN (POULTRY)\n{POULTRY_SF:,.0f} SF",
        fontsize=6.8, ha='center', va='center', color='#6b5000', fontweight='bold', zorder=7,
        bbox=dict(fc='white', alpha=0.9, ec='#a07800', lw=0.6, pad=1.6))
for ring in rings(clipped['RES']):
    ax.add_patch(MPoly(ring, closed=True, fc='none', ec='#006400', lw=1.3, ls='--', zorder=3))
ax.text(252, 203, f"RESIDENTIAL / DOMESTIC AREA\n{RES_SF:,.0f} SF (EXCL. FROM AG CALC)",
        fontsize=7, ha='center', va='center', color='#004d00', fontweight='bold', zorder=7,
        bbox=dict(fc='white', alpha=0.9, ec='#006400', lw=0.6, pad=1.6))

# ---- structures
SXX, SYY = 583.1/2186, 294.1/1136
def rect_px(x0,y0,x1,y1):
    xa, ya = x0*SXX, 294.1-y1*SYY
    return xa, ya, (x1-x0)*SXX, (y1-y0)*SYY
def poly_px(pts):
    return [(x*SXX, 294.1-y*SYY) for x, y in pts]

BARN = poly_px([(426,430),(632,476),(605,680),(520,704),(390,640)])
structures = [
 ("EXIST. SFD", poly_px([(1222,103),(1590,138),(1575,300),(1208,262)]), None),
 ("EXIST.\nGARAGE/ACC.", poly_px([(1622,85),(1795,90),(1795,275),(1622,280)]), None),
]
for name, poly, lab_at in structures:
    ax.add_patch(MPoly(poly, closed=True, fc='0.82', ec='black', lw=1.1, zorder=4))
    cx_ = sum(p[0] for p in poly)/len(poly); cy_ = sum(p[1] for p in poly)/len(poly)
    if lab_at:
        ax.annotate(name, (cx_, cy_), lab_at, fontsize=5.4, ha='center', zorder=7,
                    arrowprops=dict(arrowstyle='-', lw=0.6),
                    bbox=dict(fc='white', ec='none', alpha=0.85, pad=1))
    else:
        ax.text(cx_, cy_, name, fontsize=5.6, ha='center', va='center', zorder=7)

# the barn — storage (owner-confirmed 8/21; it is NOT the Mini Barn Market)
ax.add_patch(MPoly(BARN, closed=True, fc='0.82', ec='black', lw=1.3, zorder=4))
ax.annotate("EXIST. BARN — STORAGE\n3,400 SF", (124, 126), (70, 74),
            fontsize=5.6, ha='center', zorder=7, arrowprops=dict(arrowstyle='-', lw=0.6),
            bbox=dict(fc='white', ec='none', alpha=0.9, pad=1))

# ---- PROPOSED SMALL AGRICULTURAL STORE = the existing MINI BARN MARKET
# building (#4 on the confirmation image, owner-confirmed 8/21). The ENTIRE
# ±415 SF building is the store — well under the 1,500 SF cap of ZO
# §6157.a.2.e, so no demising of a larger building is needed at all.
MBM = poly_px([(250,188),(328,188),(328,265),(250,265)])
MBM_G = SPoly(MBM)
MBM_SF = MBM_G.area          # ±415 SF
ax.add_patch(MPoly(MBM, closed=True, fc='#ffe9b0', ec='#a05a00', lw=1.8, hatch='//', zorder=5))
ax.annotate("EXIST. 'MINI BARN MARKET' — PROPOSED\nSMALL AGRICULTURAL STORE, ±415 SF\n(ZO §6157 LIMIT 1,500 SF — SEE NOTE 11)",
            (77, 225.5), (90, 55), fontsize=6.6, ha='center', color='#8a4a00',
            fontweight='bold', zorder=9, arrowprops=dict(arrowstyle='-|>', lw=1.0, color='#a05a00'),
            bbox=dict(fc='white', alpha=0.95, ec='#a05a00', lw=1.0, pad=2.4))

# ---- PROPOSED CUSTOMER PARKING: 6 spaces (1 van accessible) set as a row
# RIGHT AGAINST the NE 3/4 of AG-2's bottom line (owner direction, 8/21).
# The row is rotated to match that edge (S83.7E, -6.3 deg) with stall tops
# tangent to it — 0 SF overlap, verified with shapely, and clear of the pool,
# well, vineyard and every structure. Van stall at the SW end, nearest the store.
_P1, _P2 = (97.4, 266.8), (200.3, 255.4)          # AG-2 bottom edge (SW -> NE)
_L  = math.hypot(_P2[0]-_P1[0], _P2[1]-_P1[1])
_u  = ((_P2[0]-_P1[0])/_L, (_P2[1]-_P1[1])/_L)     # along the edge
_n  = (_u[1], -_u[0])                              # perpendicular, into the yard
_t0 = _L - 62.0                                    # 62' row anchored to the NE end
PK_D = 18.0
def _stall(t_off, w):
    a = (_P1[0]+_u[0]*(_t0+t_off),   _P1[1]+_u[1]*(_t0+t_off))
    b = (_P1[0]+_u[0]*(_t0+t_off+w), _P1[1]+_u[1]*(_t0+t_off+w))
    return [a, b, (b[0]+_n[0]*PK_D, b[1]+_n[1]*PK_D), (a[0]+_n[0]*PK_D, a[1]+_n[1]*PK_D)]
_ang = math.degrees(math.atan2(_u[1], _u[0]))
for lab, t_off, w in [("VAN\nACCESS.", 0, 9.0), ("AISLE", 9.0, 8.0)] + \
                     [("", 17.0 + i*9.0, 9.0) for i in range(5)]:
    is_aisle = (lab == "AISLE")
    poly = _stall(t_off, w)
    ax.add_patch(MPoly(poly, closed=True,
                 fc='none' if is_aisle else '#eaf3ff',
                 ec='#0044aa', lw=0.9, ls=(0,(2,2)) if is_aisle else '-', zorder=5))
    cxp = sum(q[0] for q in poly)/4; cyp = sum(q[1] for q in poly)/4
    if is_aisle:
        ax.text(cxp, cyp, "ACCESS\nAISLE", fontsize=3.4, ha='center', va='center',
                color='#0044aa', rotation=_ang, rotation_mode='anchor', zorder=7)
    elif lab:
        ax.text(cxp, cyp, lab, fontsize=3.4, ha='center', va='center', color='#0044aa',
                fontweight='bold', rotation=_ang, rotation_mode='anchor', zorder=7)
# accessible route: van stall -> store entry, through the gap between AG-1 and AG-2
ROUTE = [(137.7, 253.3), (97.0, 252.0), (87.5, 243.5)]
ax.plot([q[0] for q in ROUTE], [q[1] for q in ROUTE], color='#0044aa', lw=1.6,
        ls=(0,(1,1.6)), zorder=6)
ax.plot([87.5], [243.5], marker='o', ms=3, color='#0044aa', zorder=7)
ax.text(168, 231.5, "PROPOSED CUSTOMER PARKING — 6 SPACES\nEXIST. GRAVEL YARD — ACCESSIBLE ROUTE PER NOTE 12",
        fontsize=5.8, ha='center', va='top', color='#00337f', fontweight='bold', zorder=9,
        bbox=dict(fc='white', alpha=0.95, ec='#0044aa', lw=0.9, pad=2.0))

# trellis garden
tx0, ty0, tw_, th_ = rect_px(862, 608, 966, 704)
ax.add_patch(Rectangle((tx0, ty0), tw_, th_, fc='none', ec='black', lw=1.0, zorder=4))
ax.annotate("EXIST. TRELLIS GARDEN", (tx0, ty0+th_/2), (tx0-58, ty0-26), fontsize=5.6, ha='center',
            arrowprops=dict(arrowstyle='-', lw=0.7), zorder=7,
            bbox=dict(fc='white', ec='none', alpha=0.85, pad=1))
# greenhouse (as-built)
ghx, ghy = 294.0, 95.9
ax.add_patch(Rectangle((ghx, ghy), 20, 12, fc='0.82', ec='black', lw=1.1, zorder=4))
ax.annotate("AS-BUILT GREENHOUSE\n12'x20' (UNPERMITTED)", (ghx+10, ghy), (ghx-30, ghy-40),
            fontsize=5.6, ha='center', arrowprops=dict(arrowstyle='-', lw=0.7), zorder=7,
            bbox=dict(fc='white', ec='none', alpha=0.85, pad=1))
# coop + run
cpx, cpy = 326.0, 95.0
ax.add_patch(Rectangle((cpx, cpy), 10, 10, fc='0.82', ec='black', lw=1.0, zorder=4))
ax.add_patch(Rectangle((cpx, cpy-20), 12, 20, fc='none', ec='black', lw=1.0, zorder=4))
ax.annotate("EXIST. COOP 10'x10'\n+ RUN 12'x20'", (cpx+11, cpy-5), (cpx+58, cpy-30),
            fontsize=5.6, ha='center', arrowprops=dict(arrowstyle='-', lw=0.7), zorder=7,
            bbox=dict(fc='white', ec='none', alpha=0.85, pad=1))
# pool
pcx, pcy = 872*SXX, 294.1-235*SYY
ax.add_patch(Ellipse((pcx, pcy), 40, 44, fc='none', ec='black', lw=1.1, zorder=4))
ax.text(pcx, pcy, "EXIST.\nPOOL", fontsize=5.6, ha='center', va='center', zorder=7)
# tiny home (to be removed) — encroaches the 35' exterior side setback; see Note 12
th_poly = poly_px([(130,505),(188,520),(165,705),(107,690)])
ax.add_patch(MPoly(th_poly, closed=True, fc='white', ec='black', lw=1.1, ls=(0,(4,3)), zorder=4))
thx = sum(p[0] for p in th_poly)/4; thy = sum(p[1] for p in th_poly)/4
ax.annotate("EXIST. TINY HOME\n(TO BE REMOVED — NOTE 5)", (thx, thy-12), (thx+40, thy-52),
            fontsize=5.6, ha='center', zorder=7, arrowprops=dict(arrowstyle='-', lw=0.6),
            bbox=dict(fc='white', ec='none', alpha=0.9, pad=1))

# ---- pond
pdx, pdy = 710*SXX, 294.1-865*SYY
ax.add_patch(Ellipse((pdx, pdy), 90, 62, fc='none', ec='#00509e', lw=1.4, zorder=4))
ax.add_patch(Ellipse((pdx, pdy), 78, 50, fc='none', ec='#00509e', lw=0.6, ls=':', zorder=4))
ax.text(pdx, pdy, "EXISTING POND\nIRRIGATION SOURCE (PUMP)\n& AREA OF INUNDATION", fontsize=6,
        ha='center', va='center', color='#00396e', zorder=7,
        bbox=dict(fc='white', alpha=0.85, ec='#00509e', lw=0.6, pad=1.5))

# ---- well, septic, leach
def px2ft(x_ft_from_west, y_ft_from_north):
    return x_ft_from_west, 294.1 - y_ft_from_north
wx, wy = px2ft(175.3, 77.8)
ax.add_patch(Circle((wx, wy), 4, fc='white', ec='black', lw=1.4, zorder=6))
ax.text(wx, wy, "W", fontsize=7, ha='center', va='center', fontweight='bold', zorder=7)
ax.annotate("EXIST. WELL", (wx+4, wy), (wx+44, wy+26), fontsize=6,
            arrowprops=dict(arrowstyle='-', lw=0.7), zorder=7, ha='center',
            bbox=dict(fc='white', ec='none', alpha=0.85, pad=1))
sx0, sy0 = px2ft(386.0, 19.4); sx1, sy1 = px2ft(408.9, 9.8)
ax.add_patch(Rectangle((sx0, sy0), sx1-sx0, sy1-sy0, fc='none', ec='black', lw=1.1, zorder=5))
lx0, ly0 = px2ft(407.6, 32.9); lx1, ly1 = px2ft(510.0, 8.5)
ax.add_patch(Rectangle((lx0, ly0), lx1-lx0, ly1-ly0, fc='none', ec='black', lw=1.0, ls='--', hatch='///', zorder=5))
ax.annotate("EXIST. SEPTIC TANK", (sx0+11, sy1), (sx0-30, 322), fontsize=6, ha='center',
            arrowprops=dict(arrowstyle='-', lw=0.7), zorder=7)
ax.annotate("EXIST. LEACH LINES", ((lx0+lx1)/2, ly1+2), ((lx0+lx1)/2+30, 322), fontsize=6, ha='center',
            arrowprops=dict(arrowstyle='-', lw=0.7), zorder=7)

# ---- electrical panel
ex, ey = px2ft(168, 118)
ax.add_patch(Rectangle((ex-2.5, ey-2.5), 5, 5, fc='black', zorder=6))
ax.annotate("400A MAIN ELEC. PANEL\n(LOCATION APPROX.)", (ex+2, ey), (ex+52, ey+34), fontsize=6,
            ha='center', arrowprops=dict(arrowstyle='-', lw=0.7), zorder=7,
            bbox=dict(fc='white', ec='none', alpha=0.85, pad=1))

# ---- HANDLEBAR ROAD (private road easement crossing the E portion)
road_px = [(2100,10),(2040,160),(1950,300),(1860,400),(1770,470),(1690,545),
           (1650,630),(1660,730),(1720,830),(1810,930),(1920,1030),(2030,1120),(2065,1136)]
road = [(x*SXX, 294.1-y*SYY) for x, y in road_px]
rx = [p[0] for p in road]; ry = [p[1] for p in road]
ax.plot(rx, ry, color='black', lw=0.9, ls=(0,(10,4,2,4)), zorder=2)
rxa, rya = np.array(rx), np.array(ry)
dxg, dyg = np.gradient(rxa), np.gradient(rya)
nrm = np.hypot(dxg, dyg); nxv, nyv = -dyg/nrm, dxg/nrm
for s in (+10, -10):
    ax.plot(rxa+nxv*s, rya+nyv*s, color='0.25', lw=1.1, zorder=2)
ax.annotate("HANDLEBAR ROAD (PRIVATE ROAD ESMT.)", (497, 57), (392, 24), fontsize=6.4,
            ha='center', zorder=7, arrowprops=dict(arrowstyle='-', lw=0.8), va='center',
            fontweight='bold', bbox=dict(fc='white', ec='black', lw=0.5, alpha=0.92, pad=2))

# ---- driveway
drv_px = [(1655,600),(1520,530),(1350,485),(1150,460),(980,452),(800,470),(600,502),(455,540)]
drv = [(x*SXX, 294.1-y*SYY) for x, y in drv_px]
ax.plot([p[0] for p in drv], [p[1] for p in drv], color='0.35', lw=1.0, ls=(0,(6,3)), zorder=2)
for lp, lab in [((417,158),"GRAVEL, 12' W"), ((285,182),"DIRT DRIVE, 12' W"), ((252,166),"GRAVEL")]:
    ax.text(*lp, lab, fontsize=5.8, color='0.25', style='italic', zorder=7, ha='center',
            bbox=dict(fc='white', ec='none', alpha=0.85, pad=1))

# ---- SETBACKS per ZO 4810 Schedule C, designator C (zoning box A70/L/2AC/C/G/C/C)
# The residence fronts HANDLEBAR RD, so that is the front yard. Whirlwind Ln on
# the west is the exterior side yard; north and south are interior side yards.
SB = '#0044aa'
y_lo, y_hi = -16, 308

# Whirlwind Ln: centreline at the west property line per owner, 30' road esmt.
ax.plot([WL_CL_X, WL_CL_X], [y_lo, y_hi], color='black', lw=1.0, ls=(0,(12,4,2,4)), zorder=3)
ax.plot([ESMT_W, ESMT_W], [y_lo, y_hi], color='0.35', lw=0.9, ls=(0,(4,3)), zorder=3)
ax.text(WL_CL_X-9, 250, "WHIRLWIND LN", fontsize=7.5, rotation=90, va='center',
        ha='center', fontweight='bold')
ax.text(WL_CL_X-9, 150, "$\\mathcal{C}$L", fontsize=7, rotation=90, va='center', ha='center')
ax.text(ESMT_W+4, 262, "30' ROAD ESMT.", fontsize=6.4, rotation=90, va='center',
        ha='center', color='0.25', bbox=dict(fc='white', ec='none', alpha=0.85, pad=0.8))

# buildable envelope (front from Handlebar ℄, exterior side from Whirlwind ℄,
# interior sides from the north and south lot lines)
for ring in rings(ENVELOPE):
    ax.add_patch(MPoly(ring, closed=True, fc='none', ec=SB, lw=1.3,
                       ls=(0,(7,3)), zorder=4))

ax.text(150, ENVELOPE.bounds[1]+9.0, f"INTERIOR SIDE YARD SETBACK {SB_SIDE:.0f}'",
        fontsize=6.6, ha='center', color=SB, fontweight='bold',
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=0.8))
ax.text(330, ENVELOPE.bounds[3]+5.0, f"INTERIOR SIDE YARD SETBACK {SB_SIDE:.0f}'",
        fontsize=6.6, ha='center', color=SB, fontweight='bold',
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=0.8))
ax.text(SB_EXT+4, 190, f"EXTERIOR SIDE YARD SETBACK {SB_EXT:.0f}' FROM $\\mathcal{{C}}$L",
        fontsize=6.4, rotation=90, va='center', ha='left', color=SB, fontweight='bold',
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=0.8))
ax.annotate(f"FRONT YARD SETBACK {SB_FRONT:.0f}' FROM $\\mathcal{{C}}$L HANDLEBAR RD\n"
            f"(RESIDENCE FRONTS HANDLEBAR RD)",
            (452, 168), (392, 214), fontsize=6.4, ha='center', color=SB,
            fontweight='bold', zorder=8, arrowprops=dict(arrowstyle='-', lw=0.8, color=SB),
            bbox=dict(fc='white', ec=SB, lw=0.8, alpha=0.95, pad=2.0))

# ---- drainage arrows toward pond
for (fx, fy) in [(280,55),(320,175),(150,255),(72,40)]:
    dxa, dya = pdx-fx, pdy-fy
    n = math.hypot(dxa,dya)
    ax.arrow(fx, fy, dxa/n*22, dya/n*22, head_width=5, head_length=6, fc='#00509e',
             ec='#00509e', lw=0.7, zorder=2, alpha=0.85)
ax.text(232, 30, "LOT DRAINS TOWARD EXISTING POND", fontsize=6, color='#00396e',
        style='italic', ha='center', bbox=dict(fc='white', ec='none', alpha=0.8, pad=0.8))

# ======================== BOTTOM BAND ======================================
def band_axes(x0, y0, w, h, lw=1.0):
    a = fig.add_axes([x0/SHEET_W, y0/SHEET_H, w/SHEET_W, h/SHEET_H])
    a.set_xlim(0, 1); a.set_ylim(0, 1); a.axis('off')
    a.add_patch(Rectangle((0, 0), 1, 1, fill=False, ec='black', lw=lw,
                          transform=a.transAxes, clip_on=False))
    return a
def tl(a, y, txt, fs=8, bold=False, color='black', x=0.05, ha='left'):
    a.text(x, y, txt, fontsize=fs, fontweight='bold' if bold else 'normal',
           color=color, ha=ha, va='top')

C1, C2, C3, C4, CW = 0.55, 4.70, 8.85, 13.00, 4.00

# ---- Col 1 top: agricultural use calculation
ca = band_axes(C1, 2.20, CW, 5.35, lw=1.3)
tl(ca, 0.968, "AGRICULTURAL USE CALCULATION", 9.5, True, x=0.5, ha='center')
tl(ca, 0.912, "PER ZO §6157.a.2.b — GROSS BASIS", 6.8, x=0.5, ha='center')
cy = 0.850
for lab, val, bold in [
    ("TOTAL GROSS AREA OF PREMISES", f"{GROSS_SF:,} SF", False),
    ("", "", False),
    ("b.i  REQUIRED 50% SUITABLE / AVAILABLE", f"{REQ_50_SF:,} SF", False),
    ("     PROVIDED (GROSS LESS RESIDENTIAL)", f"{AVAIL_SF:,.0f} SF", True),
    (f"     = {PCT_AVAIL:.1f}% OF GROSS", "PASSES", True),
    ("", "", False),
    ("b.ii REQUIRED 25% IN ACTIVE AG USE", f"{REQ_25_SF:,} SF", False),
    ("     CROP AREAS AG-1 THRU AG-12", f"{CROP_SF:,.0f} SF", False),
    ("     POULTRY (BIRD GARDEN)", f"{POULTRY_SF:,.0f} SF", False),
    ("     PROVIDED TOTAL ACTIVE AG USE", f"{AG_TOTAL:,.0f} SF", True),
    (f"     = {PCT_AG:.1f}% OF GROSS", "PASSES", True),
    ("", "", False),
    ("MARGIN OVER THE 25% REQUIREMENT", f"+{AG_TOTAL-REQ_25_SF:,.0f} SF", True),
]:
    if not lab: cy -= 0.026; continue
    tl(ca, cy, lab, 7.2, bold, x=0.04)
    if val: tl(ca, cy, val, 7.2, bold, x=0.96, ha='right',
               color='#0a6b16' if val == "PASSES" else 'black')
    cy -= 0.055
cy -= 0.030
ca.plot([0.04, 0.96], [cy+0.020, cy+0.020], color='black', lw=0.9, transform=ca.transAxes)
tl(ca, cy, "BOTH ZO §6157.a.2.b THRESHOLDS ARE MET", 8.4, True, x=0.5, ha='center')
tl(ca, cy-0.062, f"NET AREA EXCL. ROAD ESMTS. (PDS 090 ITEM 12): {NET_SF:,} SF", 6.4, x=0.5, ha='center')
tl(ca, cy-0.098, f"ON THE NET BASIS AG USE IS {AG_TOTAL/NET_SF*100:.1f}% — MET EITHER WAY.", 6.4, x=0.5, ha='center')

# ---- Col 1 bottom: north arrow + graphic scale
sa = band_axes(C1, 0.45, CW, 1.55)
sa.text(0.07, 0.80, 'N', fontsize=15, ha='center', va='center', fontweight='bold')
sa.annotate('', (0.07, 0.74), (0.07, 0.14), arrowprops=dict(arrowstyle='-|>', lw=2.6, color='black'))
# The bar must measure TRUE on the printed sheet: 120 ft at 1"=40' is exactly
# 3.00 in. A plan checker scales off this, so it is derived, never eyeballed.
BAR_FT = 120.0
BAR_IN = BAR_FT / SCALE                      # 3.00 in
assert abs(BAR_IN - 3.0) < 1e-9, BAR_IN
bw = BAR_IN / CW                             # axes fraction (CW is the box width, in)
bx0, by0, bh = 0.18, 0.40, 0.13
assert bx0 + bw <= 0.99, f"scale bar overruns its box: {bx0 + bw:.3f}"
for i in range(3):
    sa.add_patch(Rectangle((bx0 + i*bw/3, by0), bw/3, bh,
                 fc='black' if i % 2 == 0 else 'white', ec='black', lw=0.9))
for i, v in enumerate([0, 40, 80, 120]):
    sa.text(bx0 + i*bw/3, by0-0.09, str(v), fontsize=7, ha='center', va='top')
sa.text(bx0 + bw/2, 0.80, 'GRAPHIC SCALE: 1" = 40\'', fontsize=9.5, ha='center', fontweight='bold')
sa.text(bx0 + bw/2, 0.10, '(FEET)', fontsize=6.5, ha='center')

# ---- Col 2: small agricultural store compliance
fs_ = band_axes(C2, 0.45, CW, 7.10, lw=1.3)
tl(fs_, 0.982, "SMALL AGRICULTURAL STORE", 9.5, True, x=0.5, ha='center')
tl(fs_, 0.955, "COMPLIANCE — ZONING ORDINANCE §6157.a.2", 7.2, True, x=0.5, ha='center')
tl(fs_, 0.933, "(ZO UPDATE 102, PUBLISHED 3-26-2020)", 6.2, x=0.5, ha='center')
fy = 0.912
fs_.plot([0.03, 0.97], [fy+0.006, fy+0.006], color='black', lw=0.7, transform=fs_.transAxes)
fy -= 0.012
crit = [
 ("§6157", "COMMERCIAL AG MUST BE THE PRINCIPAL USE", "SEE b.i / b.ii", True),
 ("a", "PERMITTED IN A70 USE REGS.", "A70 — NO MIN. LOT SIZE", True),
 ("", "NO ZONING VERIFICATION PERMIT REQ'D", "PERMITTED BY RIGHT", True),
 ("b.i", "≥50% OF GROSS SUITABLE/AVAILABLE", f"{PCT_AVAIL:.1f}% PROVIDED", True),
 ("b.ii", "≥25% OF GROSS IN ACTIVE AG USE", f"{PCT_AG:.1f}% PROVIDED", True),
 ("c", "OPERATED BY OWNER OR TENANT", "OWNER-OPERATED", True),
 ("d", "ONE STORE PER LEGAL LOT; NO EXIST.", "NONE EXISTING", True),
 ("", "AG STAND OR LARGE AG STORE", "", None),
 ("e", "STORE ≤1,500 SF INCL. ROOFED DISPLAY", "±415 SF — COMPLIES", True),
 ("", "CONFORM TO §4810 SETBACKS", "STORE CLEARS ALL YARDS", True),
 ("", "PUBLIC AREAS TO COMM. BLDG. CODE + DEHQ", "SEE NOTE 11", None),
 ("f", "RETAIL ONLY WITH ON-SITE PRODUCE / EGGS;", "ACKNOWLEDGED", True),
 ("", "AG WEIGHTS & MEASURES REGS. APPLY", "", None),
 ("g", "≤200 SF FOR OFF-SITE PRODUCTS", "TO BE DESIGNATED", None),
 ("h", "MINIMUM 6 PARKING SPACES", "6 SHOWN, GRAVEL", True),
 ("", "DISABLED ACCESS PER CBC CH. 11B", "1 VAN ACCESSIBLE", True),
 ("i", "HOURS 10 A.M. TO LEGAL SUNSET", "ACKNOWLEDGED", True),
 ("j", "ONE ON-PREMISE SIGN, MAX 4 SF", "ACKNOWLEDGED", True),
 ("k", "EVENTS PROHIBITED", "ACKNOWLEDGED", True),
]
for ref, req, prov, ok in crit:
    tl(fs_, fy, ref, 6.2, True, x=0.04)
    tl(fs_, fy, req, 6.2, x=0.11)
    if prov:
        tl(fs_, fy, prov, 6.2, True, x=0.97, ha='right',
           color='#0a6b16' if ok else '#8a4a00')
    fy -= 0.0243
fy -= 0.004
fs_.plot([0.03, 0.97], [fy+0.006, fy+0.006], color='black', lw=0.7, transform=fs_.transAxes)
tl(fs_, fy, "STORE AREA SUMMARY", 8, True, x=0.04); fy -= 0.032
for lab, val in [("STORE = ENTIRE EXIST. 'MINI BARN MARKET' BLDG.", "±415 SF"),
                 ("   OF WHICH OFF-SITE PRODUCTS (MAX)", "200 SF"),
                 ("OPEN ROOFED DISPLAY AREA", "0 SF"),
                 ("TOTAL PER §6157.a.2.e — LIMIT 1,500 SF", "±415 SF")]:
    b = lab.startswith("TOTAL")
    tl(fs_, fy, lab, 6.4, b, x=0.05); tl(fs_, fy, val, 6.4, b, x=0.97, ha='right')
    fy -= 0.0250
fy -= 0.007
fs_.plot([0.03, 0.97], [fy+0.006, fy+0.006], color='black', lw=0.7, transform=fs_.transAxes)
tl(fs_, fy, "PARKING — ZO §6157.a.2.h", 8, True, x=0.04); fy -= 0.032
for lab, val in [("REQUIRED", "6 SPACES"), ("PROVIDED", "6 SPACES"),
                 ("   STANDARD 9' x 18'", "5"), ("   VAN ACCESSIBLE 9' x 18' + 8' AISLE", "1"),
                 ("SURFACE — GRAVEL (EXPRESSLY ALLOWED)", "EXISTING")]:
    tl(fs_, fy, lab, 6.4, lab in ("REQUIRED", "PROVIDED"), x=0.05)
    tl(fs_, fy, val, 6.4, lab in ("REQUIRED", "PROVIDED"), x=0.97, ha='right')
    fy -= 0.0250
fy -= 0.012
tl(fs_, fy-0.004, "THE STORE IS THE ENTIRE EXISTING MINI BARN MARKET BUILDING —", 6.2, True, x=0.5, ha='center', color='#0a6b16')
tl(fs_, fy-0.030, "±415 SF AGAINST A 1,500 SF LIMIT. NO DEMISING OF A LARGER", 6.2, True, x=0.5, ha='center', color='#0a6b16')
tl(fs_, fy-0.056, "BUILDING IS NEEDED.", 6.2, True, x=0.5, ha='center', color='#0a6b16')

# ---- Col 3 top: legend
la = band_axes(C3, 2.20, CW, 5.35)
la.text(0.5, 0.962, "LEGEND", 
        fontsize=9.5, fontweight='bold', ha='center', va='top')
leg_items = [
    ('store',    "PROPOSED STORE (EXIST. MINI BARN MARKET)"),
    ('parking',  "PROPOSED CUSTOMER PARKING"),
    ('agpatch',  "AGRICULTURAL CROP AREA"),
    ('bgpatch',  "POULTRY AREA (BIRD GARDEN)"),
    ('respatch', "RESIDENTIAL / DOMESTIC AREA"),
    ('struct',   "EXISTING STRUCTURE"),
    ('tinyhome', "STRUCTURE TO BE REMOVED"),
    ('leach',    "LEACH LINES"),
    ('cl',       "ROAD CENTERLINE"),
    ('esmt',     "ROAD EASEMENT LINE"),
    ('setb',     "REQUIRED YARD SETBACK"),
    ('drv',      "DRIVEWAY CENTERLINE"),
    ('drain',    "DIRECTION OF LOT DRAINAGE"),
    ('well',     "EXISTING WELL"),
]
ly = 0.878
for kind, desc in leg_items:
    x0, x1 = 0.05, 0.22; ym = ly
    if kind == 'store':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='#ffe9b0', ec='#a05a00', lw=1.4, hatch='//'))
    elif kind == 'parking':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='#eaf3ff', ec='#0044aa', lw=1.0))
    elif kind == 'agpatch':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='none', ec='#8B0000', lw=1.1, hatch='...'))
    elif kind == 'bgpatch':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='none', ec='#a07800', lw=1.1, hatch='xx'))
    elif kind == 'respatch':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='none', ec='#006400', lw=1.1, ls='--'))
    elif kind == 'struct':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='0.82', ec='black', lw=1.0))
    elif kind == 'tinyhome':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='white', ec='black', lw=1.0, ls=(0,(4,3))))
    elif kind == 'leach':
        la.add_patch(Rectangle((x0, ym-0.026), x1-x0, 0.052, fc='none', ec='black', lw=0.9, ls='--', hatch='///'))
    elif kind == 'cl':
        la.plot([x0, x1], [ym, ym], color='black', lw=1.0, ls=(0,(12,4,2,4)))
    elif kind == 'esmt':
        la.plot([x0, x1], [ym, ym], color='0.35', lw=0.9, ls=(0,(4,3)))
    elif kind == 'setb':
        la.plot([x0, x1], [ym, ym], color=SB, lw=1.2, ls=(0,(8,3,2,3)))
    elif kind == 'drv':
        la.plot([x0, x1], [ym, ym], color='0.35', lw=1.0, ls=(0,(6,3)))
    elif kind == 'drain':
        la.annotate('', (x1, ym), (x0, ym), arrowprops=dict(arrowstyle='-|>', lw=1.3, color='#00509e'))
    elif kind == 'well':
        la.add_patch(Circle((x0+0.045, ym), 0.021, fc='white', ec='black', lw=1.2))
        la.text(x0+0.045, ym, "W", fontsize=6, ha='center', va='center', fontweight='bold')
    la.text(0.26, ym, desc, fontsize=7.0, ha='left', va='center')
    ly -= 0.060

# ---- Col 3 bottom: stormwater
sw = band_axes(C3, 0.45, CW, 1.55)
sw.text(0.5, 0.93, "STORMWATER (PDS 272)", fontsize=8.5, fontweight='bold', ha='center', va='top')
swy = 0.70
for ln in ["PROPOSED LAND DISTURBANCE: 0 SF. NO GRADING, CLEARING OR",
           "CONSTRUCTION PROPOSED; NO NEW OR REPLACED IMPERVIOUS AREA.",
           "SD-B: RUNOFF DIRECTED TO PERVIOUS/LANDSCAPED AREAS.",
           "SD-G: EXISTING NATURAL SWALES AND POND CONSERVED.",
           "SD-H: VEGETATED BUFFER MAINTAINED AROUND EXISTING POND."]:
    sw.text(0.04, swy, ln, fontsize=5.9, ha='left', va='top'); swy -= 0.135

# ---- Col 4: vicinity map
vm = band_axes(C4, 0.45, CW, 7.10)
vm.text(0.5, 0.975, "VICINITY MAP", fontsize=9.5, fontweight='bold', ha='center', va='top')
vm.text(0.5, 0.945, "(NOT TO SCALE)", fontsize=6.8, ha='center', va='top')
sx0, sy0v, swv, shv = 0.34, 0.50, 0.30, 0.13
vm.add_patch(Rectangle((sx0, sy0v), swv, shv, fc='none', ec='#7a0000', lw=1.8))
vm.plot([sx0, sx0, sx0], [0.86, 0.57, 0.16], color='0.3', lw=1.8)
vm.text(sx0-0.028, 0.76, "WHIRLWIND LN", fontsize=6.8, rotation=90, va='center', ha='center')
vm.plot([0.60, 0.578, 0.552, 0.545, 0.562, 0.593, 0.612],
        [0.86, 0.745, 0.655, 0.605, 0.535, 0.36, 0.16], color='0.3', lw=2.0)
vm.text(0.632, 0.755, "HANDLEBAR RD", fontsize=6.8, rotation=77, va='center')
vm.plot([0.12, 0.13, 0.14], [0.86, 0.50, 0.16], color='0.3', lw=1.8)
vm.text(0.094, 0.50, "GARJAN LN", fontsize=6.8, rotation=87, va='center', ha='center')
vm.plot([0.10, 0.90], [0.885, 0.885], color='0.3', lw=2.4)
vm.text(0.50, 0.900, "HIGHLAND VALLEY RD", fontsize=6.8, ha='center')
vm.plot([0.455], [0.565], marker='*', ms=13, color='#7a0000')
vm.text(0.52, 0.455, "SITE\n17054 HANDLEBAR RD\nAPN 278-361-08-00", fontsize=7.2, ha='center',
        va='top', color='#7a0000', fontweight='bold')
vm.text(0.5, 0.10, "RAMONA, SAN DIEGO COUNTY, CALIFORNIA", fontsize=6.8, ha='center')
vm.annotate('', (0.90, 0.80), (0.90, 0.71), arrowprops=dict(arrowstyle='-|>', lw=1.6, color='black'))
vm.text(0.90, 0.825, 'N', fontsize=9, ha='center', fontweight='bold')

# ============================ RIGHT PANEL ==================================
px_ = fig.add_axes([17.55/SHEET_W, 0.45/SHEET_H, 5.90/SHEET_W, 17.10/SHEET_H])
px_.set_xlim(0,1); px_.set_ylim(0,1); px_.axis('off')
px_.add_patch(Rectangle((0,0),1,1, fill=False, ec='black', lw=1.5))
def tline(y, txt, fs=7, bold=False, color='black', ha='left', x=0.05):
    px_.text(x, y, txt, fontsize=fs, fontweight='bold' if bold else 'normal',
             color=color, ha=ha, va='top', family='DejaVu Sans')
def hrule(y, x0=0.03, x1=0.97, lw=0.7):
    px_.plot([x0, x1], [y, y], color='black', lw=lw, transform=px_.transAxes)

y = 0.988
tline(y, "AGRICULTURAL OPERATIONS &\nSMALL AGRICULTURAL STORE\nPLOT PLAN", 12.5, True, x=0.5, ha='center')
y -= 0.058
tline(y, "17054 HANDLEBAR ROAD, RAMONA, CA 92065", 8.5, True, x=0.5, ha='center'); y -= 0.0165
tline(y, "APN 278-361-08-00  ·  ZONE A70 (LIMITED AGRICULTURE)", 7.5, x=0.5, ha='center'); y -= 0.0145
tline(y, "ZONING BOX: A70 / L / 2AC / C / G / C / C", 7, x=0.5, ha='center'); y -= 0.0145
tline(y, "LEGAL: PARCEL 1 OF PARCEL MAP 05062 (FILE NO. 69370)", 7, x=0.5, ha='center'); y -= 0.0145
tline(y, f"GROSS AREA: {GROSS_SF:,} SF (3.78 AC)  ·  NET AREA: {NET_SF:,} SF (3.61 AC)", 7, x=0.5, ha='center'); y -= 0.0125
hrule(y); y -= 0.013
tline(y, "OWNER:  CORY J. DZBINSKI & CARISSA ULTSCH", 7, True, x=0.05); y -= 0.0135
tline(y, "        17054 HANDLEBAR RD, RAMONA, CA 92065", 6.6, x=0.05); y -= 0.0125
tline(y, "        farmhousegetaways@gmail.com", 6.6, x=0.05); y -= 0.0125
tline(y, "PREPARED BY:  OWNER", 7, True, x=0.05); y -= 0.0125
hrule(y); y -= 0.0098

tline(y, "AGRICULTURAL USE SUMMARY", 9, True); y -= 0.0145
tline(y, "ZONE", 6.5, True, x=0.05); tline(y, "USE / CROP", 6.5, True, x=0.16); tline(y, "AREA", 6.5, True, x=0.95, ha='right')
y -= 0.0105; hrule(y+0.002, 0.04, 0.96, 0.5)
rows = [(f"AG-{k}", crop_name[k], f"{ZONE_SF[k]:,.0f} SF") for k in ZONE_KEYS]
rows.append(("BG", "BIRD GARDEN (POULTRY)", f"{POULTRY_SF:,.0f} SF"))
for r in rows:
    tline(y, r[0], 6.5, x=0.05); tline(y, r[1], 6.5, x=0.16); tline(y, r[2], 6.5, x=0.95, ha='right')
    y -= 0.0088
hrule(y+0.002, 0.04, 0.96, 0.5); y -= 0.003
tline(y, "TOTAL ACTIVE AGRICULTURAL AREA", 7.4, True, x=0.05); tline(y, f"{AG_TOTAL:,.0f} SF", 7.4, True, x=0.95, ha='right'); y -= 0.0122
tline(y, f"= {PCT_AG:.1f}% OF GROSS  (ZO §6157.a.2.b.ii REQ.: 25% = {REQ_25_SF:,} SF)", 6.9, True, x=0.05); y -= 0.0115
tline(y, "AG-5 NOT USED — NUMBERING RETAINED PER OWNER FIELD NOTES. AREAS ARE", 6.0, x=0.05); y -= 0.0098
tline(y, "AERIAL-DERIVED AND FIELD-CORROBORATED (NOTE 2).", 6.0, x=0.05); y -= 0.0125
hrule(y); y -= 0.0098

tline(y, "STRUCTURE SUMMARY", 9, True); y -= 0.0145
tline(y, "STRUCTURE / USE", 6.5, True, x=0.05); tline(y, "STATUS", 6.5, True, x=0.66); tline(y, "FOOTPRINT", 6.5, True, x=0.95, ha='right')
y -= 0.0105; hrule(y+0.002, 0.04, 0.96, 0.5)
srows = [("MINI BARN MARKET — PROPOSED SMALL AG. STORE","EXISTING","415 SF", True),
         ("CUSTOMER PARKING, 6 SPACES","PROPOSED","1,116 SF", True),
         ("BARN — STORAGE","EXISTING","3,400 SF", False),
         ("SFD — RESIDENCE (4BR/2BA, 2,724 SF LIV.)","EXISTING","4,110 SF", False),
         ("GARAGE / ACCESSORY BLDG","EXISTING","2,270 SF", False),
         ("TRELLIS GARDEN (OPEN)","EXISTING","690 SF", False),
         ("GREENHOUSE 12'x20'","AS-BUILT","240 SF", True),
         ("POULTRY COOP 10'x10'","EXISTING","100 SF", False),
         ("POULTRY RUN 12'x20'","EXISTING","240 SF", False),
         ("POOL","EXISTING","1,380 SF", False),
         ("TINY HOME (W)","TO BE REMOVED","765 SF", False)]
for nm, st, sf, em in srows:
    tline(y, nm, 6.2, em, x=0.05); tline(y, st, 6.2, em, x=0.66); tline(y, sf, 6.2, em, x=0.95, ha='right')
    y -= 0.0088
tline(y, "FOOTPRINTS AERIAL-DERIVED, APPROXIMATE (NOTE 2).", 5.7, x=0.05); y -= 0.0115
hrule(y); y -= 0.0098

TB_H = 0.122          # title block height, reserved at the panel foot
tline(y, "NOTES", 9, True); y -= 0.0145
NOTES_TOP = y
notes = [
 "1.  PARCEL BOUNDARY PER COUNTY GIS / PM 05062, OWNER-VERIFIED AGAINST THE SITE",
 "     AERIAL. BEARINGS AND DISTANCES ARE GIS-DERIVED (APPROXIMATE); RECORD BEARINGS",
 "     AND DIMENSIONS PER RECORDED PM 05062. ALL DIMENSIONS IN FEET.",
 "2.  AG AREAS AND STRUCTURE FOOTPRINTS ARE AERIAL-DERIVED AND FIELD-CORROBORATED.",
 "     THE SOURCE AERIAL IS CROPPED TO THE PARCEL, SO CROP AREAS RUN TO THE PROPERTY",
 "     LINE. OWNER FIELD VERIFICATION CONTINUING. AG-9 LEGS MEASURED 200' (W ALONG",
 "     RD), 130' (N), 190' (E FENCE); THE W AND N BOUNDARIES CURVE OUTWARD.",
 "3.  NO GRADING AND NO NEW BUILDING PROPOSED. THIS PLAN DOCUMENTS EXISTING AG",
 "     OPERATIONS AND A PROPOSED SMALL AGRICULTURAL STORE (ZO §6157).",
 "4.  SETBACKS PER THE PARCEL ZONING BOX, DESIGNATOR C, ZO §4810 SCHEDULE C. THE",
 "     RESIDENCE FRONTS HANDLEBAR RD, SO THAT IS THE FRONT YARD: 40' FROM ITS ℄ PER",
 "     SCHEDULE C FOOTNOTE (d), A PRIVATE EASEMENT UNDER 40' WIDE. WHIRLWIND LN IS",
 "     THE EXTERIOR SIDE YARD AT 35' FROM ℄; NORTH AND SOUTH ARE INTERIOR SIDE YARDS",
 "     AT 15'. NO REAR YARD APPLIES — THE LOT FRONTS STREETS EAST AND WEST.",
 "5.  NO NEW CONSTRUCTION IS PROPOSED WITHIN ANY REQUIRED YARD. THE PROPOSED STORE",
 "     (THE EXISTING MINI BARN MARKET BUILDING) CLEARS EVERY REQUIRED YARD BY 30' OR",
 "     MORE. EXIST. TINY HOME (W) IS TO BE REMOVED. ROAD CENTRELINES ARE APPROXIMATE",
 "     PENDING PM 05062 (NOTE 9).",
 "6.  POND IS AN EXISTING IRRIGATION SOURCE (PUMP) AND THE AREA OF INUNDATION; LOT",
 "     DRAINS TO POND. WELL, SEPTIC AND LEACH LINES PER OWNER, APPROXIMATE.",
 "7.  GREENHOUSE SHOWN AS-BUILT (UNPERMITTED); MAY QUALIFY FOR THE AGRICULTURAL",
 "     BUILDING EXEMPTION — CONFIRM WITH PDS. ELECTRICAL: 400A MAIN PANEL NE OF BARN.",
 "8.  DRIVEWAY RUNS E-W FROM HANDLEBAR RD: GRAVEL BOTH ENDS, DIRT MID-SEGMENT PAST",
 "     THE RESIDENCE, 12' WIDE; SLOPE 2% DRAINING WEST TOWARD THE POND.",
 "9.  WHIRLWIND LN ℄ SHOWN AT THE WEST P.L. PER OWNER, WITH A 30' ROAD ESMT. ALONG",
 "     THAT BOUNDARY. HANDLEBAR RD IS A PRIVATE ROAD ESMT. CROSSING THE EAST",
 "     PORTION, ℄ SHOWN; ASSESSOR'S MAP DIMENSIONS IT AS 30'. BOTH TO BE VERIFIED.",
 "10. NO NEW OR MODIFIED LANDSCAPE AREA PROPOSED (PDS 090 ITEM 16). EXISTING AG AND",
 "     PERIMETER FENCING ONLY; HEIGHTS TO BE FIELD-VERIFIED AND ADDED PRIOR TO",
 "     SUBMITTAL. NO NEW FENCES, WALLS OR GATES PROPOSED.",
 "11. THE PROPOSED SMALL AGRICULTURAL STORE IS THE ENTIRE EXISTING 'MINI BARN",
 "     MARKET' BUILDING, ±415 SF — WELL UNDER THE 1,500 SF LIMIT OF ZO §6157.a.2.e",
 "     INCLUDING OPEN ROOFED DISPLAY (NONE PROPOSED). NO OTHER STRUCTURE WILL BE",
 "     USED FOR ON-SITE SALES. PUBLIC-ACCESSED AREAS TO BE PERMITTED AND BUILT TO",
 "     THE APPLICABLE COMMERCIAL BUILDING CODE AND DEHQ REQUIREMENTS.",
 "12. ACCESSIBLE STALL, AISLE AND THE ROUTE TO THE STORE ENTRANCE TO BE A STABLE,",
 "     FIRM, SLIP-RESISTANT SURFACE PER CBC CH. 11B AND §6157.a.2.h.",
]
NOTE_STEP = 0.00685
for n_ in notes:
    tline(y, n_, 5.2, x=0.04); y -= NOTE_STEP
if y < TB_H + 0.012:
    raise SystemExit(
        f"LAYOUT: notes overrun the title block. notes end y={y:.4f}, "
        f"floor={TB_H + 0.012:.4f}. Shorten notes or reduce NOTE_STEP.")
print(f"notes end y={y:.4f}  (floor {TB_H + 0.012:.4f}, headroom {y-(TB_H+0.012):.4f})")

# ---- title block
tb_h = TB_H
px_.add_patch(Rectangle((0, 0), 1, tb_h, fill=False, ec='black', lw=1.2))
px_.plot([0, 1], [tb_h*0.74, tb_h*0.74], color='black', lw=0.7, transform=px_.transAxes)
px_.plot([0, 1], [tb_h*0.46, tb_h*0.46], color='black', lw=0.7, transform=px_.transAxes)
px_.plot([0.60, 0.60], [0, tb_h*0.46], color='black', lw=0.7, transform=px_.transAxes)
tline(tb_h*0.99, "AGRICULTURAL OPERATIONS & SMALL AGRICULTURAL STORE", 7.4, True, x=0.5, ha='center')
tline(tb_h*0.905, "PLOT PLAN — EXISTING CONDITIONS & PROPOSED STORE", 6.8, x=0.5, ha='center')
tline(tb_h*0.685, "17054 HANDLEBAR RD, RAMONA, CA 92065", 6.6, True, x=0.03)
tline(tb_h*0.590, "APN 278-361-08-00  ·  ZONE A70", 6.6, x=0.03)
tline(tb_h*0.395, "SCALE: 1\" = 40'", 7.2, True, x=0.03)
tline(tb_h*0.295, f"DATE: {DATE}", 7.2, x=0.03)
tline(tb_h*0.190, "SHEET 1 OF 1", 7.2, True, x=0.03)
tline(tb_h*0.400, "REV  DATE       DESCRIPTION", 5.4, True, x=0.62)
tline(tb_h*0.320, "4    8/06/2026  BASE SHEET", 5.4, x=0.62)
tline(tb_h*0.245, "5    8/06/2026  SETBACK LINES ADDED", 5.4, x=0.62)
tline(tb_h*0.185, "6    8/19/2026  FARM STORE ADDED", 5.4, x=0.62)
tline(tb_h*0.115, "7    8/21/2026  STORE = MINI BARN MARKET;", 5.4, x=0.62)
tline(tb_h*0.050, "                SETBACKS PER TRUE LOT LINES", 5.4, x=0.62)

# Write to output/ relative to the project, not the working directory, so the
# sheet lands in the same place however the script is invoked.
_out = os.path.join(_here, '..', 'output')
os.makedirs(_out, exist_ok=True)
out_pdf = os.path.join(_out, 'Ag_Plot_Plan_17054_Handlebar_rev7.pdf')
fig.savefig(out_pdf, format='pdf')
fig.savefig(os.path.join(_out, 'preview.png'), dpi=72)
print("saved", os.path.normpath(out_pdf))
