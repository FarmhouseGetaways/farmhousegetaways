#!/usr/bin/env python3
"""Sheet 2 — accessible parking details for the small agricultural store.

The county's accessibility plan review (PDS 626B, Parking) checks the items
below. That correction list says its own figures may not be copied onto plans,
so everything here is drawn fresh and cites the CBC section it answers.

    python3 scripts/build_ada_sheet.py   -> output/ADA_Parking_Details_17054_V<N>.pdf

Parking-row geometry is the same as sheet 1 (build_plot_plan.py): six stalls in
a row against AG-2's sloping bottom line, van stall + 8' aisle at the SW end.
"""
import math, os
import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams['hatch.linewidth'] = 0.5
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MPoly, Rectangle, Circle, Wedge, FancyBboxPatch

VERSION = 2
SHEET_W, SHEET_H = 24.0, 18.0
BLUE = '#1f56b8'
DRAFT = True            # the sheet joins the plot plan set as SHEET 2 OF 2 when rev 33 ships

# Owner to supply before submittal — the tow-away sign must carry these (CBC 11B-502.8.2)
TOW_NAME  = "__________________ (TOWING COMPANY)"
TOW_PLACE = "__________________ (STORAGE YARD ADDRESS)"
TOW_PHONE = "(___) ___-____"

# ---- parking row, identical to sheet 1 ------------------------------------
P1, P2 = (97.4, 266.8), (200.3, 255.4)          # AG-2 bottom line, owner-confirmed
L = math.hypot(P2[0]-P1[0], P2[1]-P1[1])
U = ((P2[0]-P1[0])/L, (P2[1]-P1[1])/L)
N = (U[1], -U[0])                                # into the stalls (south)
T0 = L - 62.0
DEPTH = 18.0
def pt(t, d):
    return (P1[0]+U[0]*(T0+t)+N[0]*d, P1[1]+U[1]*(T0+t)+N[1]*d)
def quad(t0, t1, d0, d1):
    return [pt(t0, d0), pt(t1, d0), pt(t1, d1), pt(t0, d1)]
VAN   = (0.0, 9.0)
AISLE = (9.0, 17.0)
STD   = [(17.0 + i*9.0, 26.0 + i*9.0) for i in range(5)]
PAD   = (-2.0, 17.0, 0.0, 23.0)                  # stabilized gravel: van stall + aisle + walk behind
# V2 (owner, 9/15): the county allows gravel for ALL stalls. ZO §6157.a.2.h lets the
# ag-store parking area be chip seal, gravel or recycled asphalt; the accessible stall,
# aisle and route just have to be stable, firm and slip-resistant per CBC 11B. The
# 'concrete or paved' line in PDS 626B is the Building Division's general commercial
# checklist and yields to the ag-store ordinance. So: compacted, stabilized gravel.
WALK_D = (18.5, 22.5)                            # 48" walk across the rear of the pad
MBM = [(57.5, 219.0), (69.5, 219.0), (69.5, 229.0), (57.5, 229.0)]
STG = [(72.1, 230.5), (82.1, 230.5), (82.1, 240.5), (72.1, 240.5)]
PANEL = (82.5, 240.5, 5.0, 5.0)
# accessible route: out of the aisle's rear, behind the van's own stall
# (allowed, CBC 11B-502.7.1), then the rev-7 alignment to the store's N face
ROUTE = [pt(13.0, 20.5), pt(-2.0, 20.5), (115.0, 251.0), (98.0, 252.5),
         (83.0, 247.0), (71.0, 242.0), (66.0, 230.0)]

fig = plt.figure(figsize=(SHEET_W, SHEET_H))
fr = fig.add_axes([0, 0, 1, 1]); fr.set_xlim(0, SHEET_W); fr.set_ylim(0, SHEET_H); fr.axis('off')
fr.add_patch(Rectangle((0.25, 0.25), SHEET_W-0.5, SHEET_H-0.5, fill=False, ec='black', lw=2.2))
fr.add_patch(Rectangle((0.32, 0.32), SHEET_W-0.64, SHEET_H-0.64, fill=False, ec='black', lw=0.7))

def detail_axes(x0, y0, w, h, xlim, ylim):
    a = fig.add_axes([x0/SHEET_W, y0/SHEET_H, w/SHEET_W, h/SHEET_H])
    a.set_xlim(*xlim); a.set_ylim(*ylim); a.set_aspect('equal'); a.axis('off')
    return a
def box_in(x0, y0, w, h):
    fr.add_patch(Rectangle((x0, y0), w, h, fill=False, ec='black', lw=1.1))
def title(x, y, letter, text, scale):
    fr.add_patch(Circle((x+0.22, y+0.12), 0.2, fill=False, ec='black', lw=1.2))
    fr.text(x+0.22, y+0.12, letter, fontsize=11, fontweight='bold', ha='center', va='center')
    fr.text(x+0.52, y+0.19, text, fontsize=10, fontweight='bold', va='center')
    fr.text(x+0.52, y-0.02, scale, fontsize=7.2, va='center')
    fr.plot([x+0.52, x+0.52+len(text)*0.083], [y+0.08, y+0.08], color='black', lw=0.9)

def isa(a, cx, cy, s, fg='white', bg=BLUE, rot=0.0):
    """International Symbol of Accessibility in an s x s square (simplified)."""
    import matplotlib.transforms as mt
    tr = mt.Affine2D().rotate_deg_around(cx, cy, rot) + a.transData
    a.add_patch(Rectangle((cx-s/2, cy-s/2), s, s, fc=bg, ec=bg, transform=tr, zorder=6))
    k = s/10.0
    a.add_patch(Circle((cx-0.6*k, cy+3.1*k), 0.75*k, fc=fg, ec='none', transform=tr, zorder=7))
    body = [(cx-1.1*k, cy+2.0*k), (cx-0.2*k, cy+2.0*k), (cx-0.1*k, cy-0.1*k), (cx+2.0*k, cy-0.1*k),
            (cx+3.0*k, cy-2.8*k), (cx+2.3*k, cy-3.1*k), (cx+1.6*k, cy-1.1*k), (cx-1.2*k, cy-1.1*k)]
    a.add_patch(MPoly(body, closed=True, fc=fg, ec='none', transform=tr, zorder=7))
    a.add_patch(Wedge((cx-0.9*k, cy-1.4*k), 2.6*k, 100, 390, width=0.6*k, fc=fg, ec='none',
                      transform=tr, zorder=7))

# ====================== (A) ENLARGED ACCESSIBLE PARKING PLAN ===============
AX0, AY0, AW, AH, ASC = 0.55, 8.55, 16.5, 8.9, 10.0          # 1" = 10'
box_in(AX0, AY0, AW, AH)
xc, yc = 133.0, 245.5
a = detail_axes(AX0+0.1, AY0+0.6, AW-0.2, AH-1.0,
                (xc-(AW-0.2)*ASC/2, xc+(AW-0.2)*ASC/2), (yc-(AH-1.0)*ASC/2, yc+(AH-1.0)*ASC/2))
title(AX0+0.15, AY0+0.22, "A", "ENLARGED ACCESSIBLE PARKING PLAN",
      "SCALE: 1\" = 10'   ·   SAME GEOMETRY AS SHEET 1   ·   ONE VAN-ACCESSIBLE STALL")

# AG-2 edge and the row
a.plot([P1[0]-8*U[0], P2[0]+6*U[0]], [P1[1]-8*U[1], P2[1]+6*U[1]], color='#8B0000', lw=1.4)
a.text(*pt(-30, -5.5), "EDGE OF AG-2 ORCHARD (SEE SHEET 1)", fontsize=6.4, color='#7a0000',
       rotation=math.degrees(math.atan2(U[1], U[0])), ha='center', va='center')
# paved pad: van stall, aisle and the walk behind them
a.add_patch(MPoly(quad(PAD[0], PAD[1], PAD[2], PAD[3]), closed=True, fc='#d8d0c0', ec='black',
                  lw=1.2, hatch='..', zorder=2))
for t0, t1 in STD:
    a.add_patch(MPoly(quad(t0, t1, 0, DEPTH), closed=True, fc='none', ec='black', lw=1.0, zorder=4))
    c = pt((t0+t1)/2, DEPTH/2)
    a.text(*c, "STD.\n9'x18'\nGRAVEL", fontsize=5.4, ha='center', va='center', zorder=5)
# van stall: blue outline + ISA
a.add_patch(MPoly(quad(*VAN, 0, DEPTH), closed=True, fc='none', ec=BLUE, lw=2.0, zorder=5))
isa(a, *pt(4.5, 11.5), 3.0, rot=math.degrees(math.atan2(U[1], U[0])))
a.text(*pt(4.5, 6.2), "VAN\nACCESSIBLE", fontsize=5.6, ha='center', va='center', color=BLUE,
       fontweight='bold', zorder=7, rotation=math.degrees(math.atan2(U[1], U[0])))
# aisle: blue border, hatch at 36" o.c. max, NO PARKING at the drive end
a.add_patch(MPoly(quad(*AISLE, 0, DEPTH), closed=True, fc='white', ec=BLUE, lw=2.0, zorder=5))
for d in [x*2.5 for x in range(1, 8)]:
    p0, p1 = pt(AISLE[0], d-2.5), pt(AISLE[1], d)
    a.plot([p0[0], p1[0]], [p0[1], p1[1]], color=BLUE, lw=0.8, zorder=5)
a.text(*pt(13.0, 15.5), "NO PARKING", fontsize=5.4, ha='center', va='center', color=BLUE,
       fontweight='bold', zorder=7, rotation=math.degrees(math.atan2(U[1], U[0])),
       bbox=dict(fc='white', ec='none', pad=0.5))
# wheel stops, 2' off the head of every stall
for t0, t1 in [VAN] + STD:
    q = quad(t0+1.5, t1-1.5, 2.0, 2.6)
    a.add_patch(MPoly(q, closed=True, fc='0.35', ec='black', lw=0.6, zorder=6))
# detectable warning where the walk meets the aisle, flush (no curb)
a.add_patch(MPoly(quad(AISLE[0], AISLE[1], 18.0, 21.0), closed=True, fc='#f2c200', ec='black',
                  lw=0.6, hatch='oo', zorder=6))
# accessible route
a.plot([p[0] for p in ROUTE], [p[1] for p in ROUTE], color=BLUE, lw=3.2, ls=(0, (1.2, 0.8)),
       solid_capstyle='butt', zorder=8)
a.annotate('', ROUTE[-1], ROUTE[-2], arrowprops=dict(arrowstyle='-|>', lw=1.6, color=BLUE), zorder=8)
# store, storage, panel
a.add_patch(MPoly(MBM, closed=True, fc='#ffe9b0', ec='#a05a00', lw=1.6, hatch='//', zorder=4))
a.add_patch(MPoly(STG, closed=True, fc='0.82', ec='black', lw=1.1, zorder=4))
a.add_patch(Rectangle(PANEL[:2], PANEL[2], PANEL[3], fc='black', zorder=4))
# sign posts at the head of the van stall and the aisle, outside any walking surface
S1, S2 = pt(4.5, -1.8), pt(13.0, -1.8)
for s, lab in [(S1, "S1"), (S2, "S2")]:
    a.add_patch(Circle(s, 0.8, fc='black', zorder=9))
    a.text(s[0], s[1]+3.0, lab, fontsize=7, fontweight='bold', ha='center', va='center',
           bbox=dict(fc='white', ec='black', lw=0.7, boxstyle='circle,pad=0.25'), zorder=9)

def call(xy, txt, xyt, ha='center'):
    a.annotate(txt, xy, xyt, fontsize=6.3, ha=ha, va='center', zorder=10,
               arrowprops=dict(arrowstyle='-', lw=0.6),
               bbox=dict(fc='white', ec='none', alpha=0.95, pad=1.0))
call(MBM[3], "AS-BUILT STORE ('MINI BARN MARKET') 12'x10'\nACCESSIBLE ENTRANCE — N FACE (FIELD VERIFY)", (80, 214))
call((77, 240.5), "EXIST. STORAGE 10'x10'", (66, 262))
call((85, 245.5), "400A PANEL", (92, 266))
call(pt(8.5, 22.5), "VAN STALL + AISLE + 48\" WALK: COMPACTED, STABILIZED\nGRAVEL — FIRM / STABLE / SLIP-RESISTANT (ZO §6157.a.2.h)\n2.08% (1:48) MAX SLOPE IN ALL DIRECTIONS\nSEE SECTION E", (126, 212))
call(ROUTE[3], "ACCESSIBLE ROUTE ■■■■ 48\" MIN. CLEAR\nTO STORE ENTRANCE — SEE NOTE 6", (100, 280))
call(pt(13, 19.5), "36\" DETECTABLE WARNING, FULL WIDTH\nOF AISLE WHERE WALK ADJOINS IT", (162, 228))
call(pt(21.5, 2.3), "PRECAST WHEEL STOP, TYP. — SEE E", (186, 280))
call(pt(13, 9), "8'-0\" ACCESS AISLE, PASSENGER SIDE:\nBLUE BORDER, HATCH 36\" O.C. MAX.,\n\"NO PARKING\" 12\" LETTERS — SEE B", (184, 213))
call(pt(4.5, 9), "VAN STALL 9'-0\" x 18'-0\"\nISA 36\"x36\" — SEE B", (108, 230))
call(S1, "S1: ISA / VAN ACCESSIBLE /\nMINIMUM FINE $250 — SEE C", (128, 282))
call(S2, "S2: TOW-AWAY SIGN — SEE D", (156, 284))
call(pt(40, 18.0), "5 STANDARD STALLS 9'x18', GRAVEL\n(ZO §6157.a.2.h)", (202, 230))
# north arrow
na = (xc+(AW-0.2)*ASC/2-9, yc+(AH-1.0)*ASC/2-12)
a.annotate('', (na[0], na[1]+6), (na[0], na[1]-6), arrowprops=dict(arrowstyle='-|>', lw=2, color='black'))
a.text(na[0], na[1]+9, 'N', fontsize=11, fontweight='bold', ha='center')

# ====================== (B) VAN STALL + AISLE MARKING ======================
BX0, BY0, BW, BH, BSC = 0.55, 0.55, 6.1, 7.75, 4.0           # 1" = 4'
box_in(BX0, BY0, BW, BH)
b = detail_axes(BX0+0.1, BY0+0.6, BW-0.2, BH-1.05, (-3.4, -3.4+(BW-0.2)*BSC), (-3.0, -3.0+(BH-1.05)*BSC))
title(BX0+0.15, BY0+0.22, "B", "VAN STALL & AISLE MARKING", "SCALE: 1\" = 4'-0\"  ·  CBC 11B-502.2, 502.3, 502.6.4")
b.add_patch(Rectangle((0, 0), 17, 18, fc='#d8d0c0', ec='none', hatch='..', zorder=1))
b.add_patch(Rectangle((0, 0), 9, 18, fc='none', ec=BLUE, lw=2.6, zorder=3))
b.add_patch(Rectangle((9, 0), 8, 18, fc='white', ec=BLUE, lw=2.6, zorder=3))
for k in range(1, 8):
    y0 = k*2.5 - 2.5
    b.plot([9, 17], [y0, y0+2.5], color=BLUE, lw=1.0, zorder=3)
isa(b, 4.5, 9.0, 3.0)
b.text(13, 1.4, "NO PARKING", fontsize=7.4, color=BLUE, fontweight='bold', ha='center', va='center',
       zorder=4, bbox=dict(fc='white', ec='none', pad=0.6))
b.add_patch(Rectangle((1.5, 15.4), 6.0, 0.6, fc='0.35', ec='black', lw=0.6, zorder=4))
def dim(ax_, p0, p1, txt, off=(0, 0), rot=0):
    ax_.annotate('', p1, p0, arrowprops=dict(arrowstyle='<|-|>', lw=0.7, mutation_scale=7))
    ax_.text((p0[0]+p1[0])/2+off[0], (p0[1]+p1[1])/2+off[1], txt, fontsize=6.4, ha='center',
             va='center', rotation=rot, bbox=dict(fc='white', ec='none', pad=0.6))
dim(b, (0, 19.3), (9, 19.3), "9'-0\" MIN.")
dim(b, (9, 19.3), (17, 19.3), "8'-0\" MIN.")
dim(b, (-1.4, 0), (-1.4, 18), "18'-0\" MIN.", rot=90)
dim(b, (3.0, 6.2), (6.0, 6.2), "3'-0\"")
dim(b, (7.0, 7.5), (7.0, 10.5), "3'-0\"", rot=90)
b.plot([4.5, 4.5], [0, 18], color='black', lw=0.5, ls=(0, (6, 2, 1, 2)), zorder=5)
b.text(4.5, 12.3, "℄ STALL", fontsize=5.6, ha='center', zorder=6, bbox=dict(fc='#ececec', ec='none', pad=0.3))
for txt, y in [("HEAD / WHEEL STOP END (AG-2 EDGE)", 20.9), ("DRIVE (VEHICULAR WAY) SIDE", -2.1)]:
    b.text(8.5, y, txt, fontsize=6, ha='center', va='center', style='italic')
bn = ["1. ISA: WHITE ON BLUE, 36\"x36\" MIN., ITS ℄ WITHIN 6\" OF THE STALL ℄ (11B-502.6.4).",
      "2. AISLE: BLUE BORDER; BLUE HATCH LINES 36\" O.C. MAX. (11B-502.3.3).",
      "3. \"NO PARKING\" IN WHITE, 12\" MIN. LETTERS, AT THE DRIVE END, READABLE",
      "    FROM THE VEHICULAR WAY (11B-502.3.3).",
      "4. 9' STALL + 8' AISLE: VAN EXCEPTION TO THE 12' STALL + 5' AISLE (11B-502.2).",
      "5. AISLE ON THE PASSENGER SIDE, FULL STALL LENGTH (11B-502.3.4)."]
for i, n_ in enumerate(bn):
    fr.text(BX0+0.2, BY0+BH-0.22-0.155*i, n_, fontsize=5.6, va='top')

# ====================== (C) SIGN S1 ========================================
CX0, CY0, CW, CH = 6.75, 0.55, 3.35, 7.75
box_in(CX0, CY0, CW, CH)
c = detail_axes(CX0+0.1, CY0+1.55, CW-0.2, CH-1.75, (-34.5, 34.5), (-8, -8+(CH-1.75)/(CW-0.2)*69))
title(CX0+0.1, CY0+0.22, "C", "SIGN S1", "NOT TO SCALE  ·  CBC 11B-502.6, 703.7.2.1")
c.add_patch(Rectangle((-1, -4), 2, 118, fc='0.5', ec='black', lw=0.8))          # post
c.add_patch(Rectangle((-5, -6), 10, 2, fc='0.75', ec='black', lw=0.6, hatch='////'))  # grade
c.add_patch(Rectangle((-6, 80), 12, 6, fc='white', ec='black', lw=1.0))
c.text(0, 83, "MINIMUM\nFINE $250", fontsize=5.4, ha='center', va='center', fontweight='bold')
c.add_patch(Rectangle((-6, 87), 12, 6, fc='white', ec='black', lw=1.0))
c.text(0, 90, "VAN\nACCESSIBLE", fontsize=5.4, ha='center', va='center', fontweight='bold')
c.add_patch(Rectangle((-6, 94), 12, 18, fc=BLUE, ec='black', lw=1.0))
isa(c, 0, 103, 10.5)
c.annotate('', (10, 80), (10, -4), arrowprops=dict(arrowstyle='<|-|>', lw=0.7, mutation_scale=7))
c.text(12, 38, "80\" MIN. TO\nBOTTOM OF\nLOWEST SIGN", fontsize=5.6, va='center')
c.annotate('', (-6, 115), (6, 115), arrowprops=dict(arrowstyle='<|-|>', lw=0.7, mutation_scale=7))
c.text(0, 118, "12\"", fontsize=5.8, ha='center')
c.annotate('', (-9, 94), (-9, 112), arrowprops=dict(arrowstyle='<|-|>', lw=0.7, mutation_scale=7))
c.text(-10.5, 103, "18\"", fontsize=5.8, ha='right', va='center')
c.text(-33, 30, "2\" GALV. STEEL\nPOST IN 12\"Ø x 24\"\nCONCRETE FOOTING", fontsize=5.4, va='center')
sn = ["• ISA SIGN 12\"x18\" = 216 SQ IN (70 MIN.),",
      "  WHITE ON BLUE, REFLECTORIZED.",
      "• \"VAN ACCESSIBLE\" AND \"MINIMUM FINE",
      "  $250\" PLATES BELOW THE ISA SIGN.",
      "• AT THE HEAD OF THE VAN STALL, VISIBLE",
      "  FROM IT, CLEAR OF THE WALK (PLAN A)."]
for i, n_ in enumerate(sn):
    fr.text(CX0+0.15, CY0+1.45-0.14*i, n_, fontsize=5.5, va='top')

# ====================== (D) SIGN S2 — TOW-AWAY =============================
DX0, DY0, DW_, DH = 10.2, 0.55, 3.6, 7.75
box_in(DX0, DY0, DW_, DH)
fr.add_patch(Rectangle((DX0+0.45, DY0+3.2), 2.7, 3.5, fc='white', ec='black', lw=1.6))
tow = ["UNAUTHORIZED VEHICLES", "PARKED IN DESIGNATED", "ACCESSIBLE SPACES NOT", "DISPLAYING DISTINGUISHING",
       "PLACARDS OR SPECIAL LICENSE", "PLATES ISSUED FOR PERSONS", "WITH DISABILITIES WILL BE",
       "TOWED AWAY AT THE OWNER'S", "EXPENSE. TOWED VEHICLES", "MAY BE RECLAIMED AT", TOW_PLACE.split(' (')[0],
       "OR BY TELEPHONING", TOW_PHONE, TOW_NAME.split(' (')[0]]
for i, ln in enumerate(tow):
    fr.text(DX0+1.8, DY0+6.52-0.215*i, ln, fontsize=5.6, ha='center', va='center', fontweight='bold')
fr.annotate('', (DX0+3.15, DY0+7.0), (DX0+0.45, DY0+7.0), arrowprops=dict(arrowstyle='<|-|>', lw=0.7, mutation_scale=7))
fr.text(DX0+1.8, DY0+7.14, "17\" MIN.", fontsize=6, ha='center')
fr.annotate('', (DX0+3.35, DY0+6.7), (DX0+3.35, DY0+3.2), arrowprops=dict(arrowstyle='<|-|>', lw=0.7, mutation_scale=7))
fr.text(DX0+3.45, DY0+4.95, "22\" MIN.", fontsize=6, rotation=90, va='center')
title(DX0+0.1, DY0+0.22, "D", "SIGN S2 — TOW-AWAY", "NOT TO SCALE  ·  CBC 11B-502.8")
dn = ["• 17\"x22\" MIN.; LETTERING 1\" HIGH MIN.",
      "• TEXT PER CBC 11B-502.8.2. THE TOWING COMPANY,",
      "  RECLAIM ADDRESS AND PHONE ARE PART OF THE",
      "  SIGN — OWNER TO FILL IN BEFORE SUBMITTAL.",
      "• POST AT THE HEAD OF THE AISLE, VISIBLE FROM THE",
      "  ACCESSIBLE STALL; SAME POST DETAIL AS S1,",
      "  80\" MIN. TO BOTTOM OF SIGN."]
for i, n_ in enumerate(dn):
    fr.text(DX0+0.15, DY0+2.85-0.225*i, n_, fontsize=5.6, va='top')

# ====================== (E) PAD + WHEEL STOP SECTION =======================
EX0, EY0, EW, EH = 13.9, 0.55, 3.15, 7.75
box_in(EX0, EY0, EW, EH)
e = detail_axes(EX0+0.1, EY0+0.6, EW-0.2, EH-1.05, (-17, 44), (-14, -14+(EH-1.05)/(EW-0.2)*61))
title(EX0+0.1, EY0+0.22, "E", "SURFACE & WHEEL STOP", "NOT TO SCALE  ·  CBC 11B-302, 502.4, 502.7.2")
e.add_patch(Rectangle((0, 40), 40, 4, fc='#d8d0c0', ec='black', lw=1.0, hatch='..'))    # stabilized gravel 4"
e.add_patch(Rectangle((0, 36), 40, 4, fc='white', ec='black', lw=0.8, hatch='xx'))       # base 4"
e.add_patch(Rectangle((0, 30), 40, 6, fc='#d9c7a3', ec='none'))                            # subgrade
e.add_patch(MPoly([(26, 44), (34, 44), (33, 50), (27, 50)], closed=True, fc='0.55', ec='black', lw=1.0))
e.text(30, 53, "PRECAST WHEEL STOP\n6'-0\" L x 6\" H,\n2 ANCHOR PINS", fontsize=5.4, ha='center', va='bottom')
e.text(-2, 42, "4\" STABILIZED\nGRAVEL / DG", fontsize=5.4, ha='right', va='center')
e.text(-2, 35.5, "4\" COMPACTED\nBASE (95%)", fontsize=5.4, ha='right', va='center')
e.text(20, 27, "COMPACTED; NO LOOSE STONE ON THE SURFACE\n2.08% (1:48) MAX. SLOPE ALL DIRECTIONS", fontsize=5.6,
       ha='center', va='top')
e.plot([0, 40], [16, 16], color='black', lw=0.8)
e.add_patch(Rectangle((0, 12), 22, 4, fc='#d8d0c0', ec='black', lw=1.0, hatch='..'))
e.add_patch(Rectangle((22, 12.2), 18, 3.6, fc='#cdb68a', ec='black', lw=0.8, hatch='oo'))
e.text(11, 9.5, "STALL / AISLE", fontsize=5.6, ha='center')
e.text(31, 9.5, "STD. GRAVEL", fontsize=5.6, ha='center')
e.text(20, 4.5, "EDGES FLUSH, 1/4\" MAX.\nVERTICAL CHANGE (11B-303)", fontsize=5.6,
       ha='center', va='top')
en = ["• WHEEL STOPS AT ALL SIX STALLS, 2' OFF",
      "  THE STALL HEAD, KEEPING BUMPERS OUT OF",
      "  THE ORCHARD AND ANY WALKING SURFACE.",
      "• NO OVERHEAD OBSTRUCTION: OPEN SKY,",
      "  98\" MIN. CLEAR (11B-502.5)."]
for i, n_ in enumerate(en):
    fr.text(EX0+0.15, EY0+EH-0.2-0.15*i, n_, fontsize=5.5, va='top')

# ====================== RIGHT PANEL: scoping, notes, title block ===========
RX0, RY0, RW, RH = 17.25, 0.55, 6.2, 16.9
box_in(RX0, RY0, RW, RH)
p = fig.add_axes([RX0/SHEET_W, RY0/SHEET_H, RW/SHEET_W, RH/SHEET_H]); p.set_xlim(0, 1); p.set_ylim(0, 1); p.axis('off')
def pl(y, txt, fs=7, bold=False, x=0.05, ha='left', color='black'):
    p.text(x, y, txt, fontsize=fs, fontweight='bold' if bold else 'normal', ha=ha, va='top', color=color)
def rule(y, lw=0.7):
    p.plot([0.03, 0.97], [y, y], color='black', lw=lw)
y = 0.985
pl(y, "ACCESSIBLE PARKING DETAILS", 12.5, True, x=0.5, ha='center'); y -= 0.022
pl(y, "SMALL AGRICULTURAL STORE — ZO §6157.a.2.h / CBC CH. 11B", 7.6, x=0.5, ha='center'); y -= 0.016
pl(y, "17054 HANDLEBAR ROAD, RAMONA, CA 92065  ·  APN 278-361-08-00", 7.2, True, x=0.5, ha='center'); y -= 0.02
rule(y); y -= 0.012
pl(y, "PARKING SCOPING", 9, True); y -= 0.02
for lab, val in [("TOTAL PARKING SPACES PROVIDED", "6"),
                 ("ACCESSIBLE SPACES REQ'D (CBC TABLE 11B-208.2, 1–25 SPACES)", "1"),
                 ("VAN-ACCESSIBLE REQ'D (11B-208.2.4, 1 PER 6 ACCESSIBLE)", "1"),
                 ("ACCESSIBLE SPACES PROVIDED — VAN ACCESSIBLE", "1"),
                 ("STANDARD SPACES, GRAVEL (ZO §6157.a.2.h)", "5")]:
    pl(y, lab, 6.6); pl(y, val, 6.6, True, x=0.95, ha='right'); y -= 0.0145
y -= 0.004; rule(y); y -= 0.012
pl(y, "ACCESSIBILITY NOTES", 9, True); y -= 0.02
notes = [
 "1.  ONE VAN-ACCESSIBLE STALL, 9'-0\" x 18'-0\" MIN., WITH AN 8'-0\" MIN. ACCESS",
 "     AISLE ON ITS PASSENGER SIDE, FULL STALL LENGTH (CBC 11B-502.2, 502.3).",
 "2.  ALL SIX STALLS GRAVEL PER ZO §6157.a.2.h. THE VAN STALL, AISLE AND ROUTE:",
 "     COMPACTED, STABILIZED GRAVEL — FIRM, STABLE, SLIP-RESISTANT, NO CHANGES IN",
 "     LEVEL, 2.08% (1:48) MAX. SLOPE IN ANY DIRECTION (11B-302, 11B-502.4).",
 "3.  SURFACE IDENTIFICATION PER DETAIL B: ISA 36\"x36\" WHITE ON BLUE; BLUE",
 "     AISLE BORDER AND HATCH 36\" O.C. MAX.; \"NO PARKING\" 12\" MIN. LETTERS",
 "     (11B-502.3.3, 11B-502.6.4).",
 "4.  SIGN S1 (DETAIL C): ISA SIGN 70 SQ IN MIN., REFLECTORIZED, WITH \"VAN",
 "     ACCESSIBLE\" AND \"MINIMUM FINE $250\" BELOW; 80\" MIN. TO THE BOTTOM",
 "     (11B-502.6, 11B-502.6.2, 11B-703.7.2.1).",
 "5.  SIGN S2 (DETAIL D): TOW-AWAY SIGN 17\"x22\" MIN., 1\" MIN. LETTERING, TEXT",
 "     AND TOWING CONTACT PER 11B-502.8, VISIBLE FROM THE ACCESSIBLE STALL.",
 "6.  ACCESSIBLE ROUTE ■■■■ FROM THE AISLE TO THE STORE ENTRANCE: 48\" MIN.",
 "     CLEAR, RUNNING SLOPE 5% MAX., CROSS SLOPE 2.08% MAX., FIRM, STABLE,",
 "     SLIP-RESISTANT (STABILIZED GRAVEL OR DECOMPOSED GRANITE); CHANGES",
 "     IN LEVEL 1/4\" MAX. (11B-208.3, 11B-302, 11B-303, 11B-402, 11B-403).",
 "7.  THE ROUTE LEAVES THE AISLE AT ITS REAR AND PASSES ONLY BEHIND THE VAN",
 "     STALL IT SERVES (11B-502.7.1).",
 "8.  36\" DEEP DETECTABLE WARNING (TRUNCATED DOMES, YELLOW) WHERE THE WALK",
 "     ADJOINS THE AISLE WITHOUT A CURB (11B-247.1.2.5, 11B-705.1).",
 "9.  WHEEL STOPS AT ALL STALLS, SO NO VEHICLE OVERHANGS A WALKING SURFACE",
 "     (11B-502.7.2). NO OVERHEAD OBSTRUCTIONS; 98\" MIN. CLEAR (11B-502.5).",
 "10. STORE ENTRANCE: ACCESSIBLE DOOR AND LANDING PER 11B-404 — CONFIRM",
 "     WITH THE STORE BUILDING PERMIT (PUBLIC-ACCESSED AREAS).",
]
for n_ in notes:
    pl(y, n_, 6.0); y -= 0.0118
y -= 0.004; rule(y); y -= 0.012
pl(y, "LEGEND", 9, True); y -= 0.022
leg = [("pad", "STABILIZED GRAVEL (VAN STALL, AISLE, WALK)"),
       ("route", "ACCESSIBLE ROUTE ■■■■ 48\" MIN."),
       ("dw", "DETECTABLE WARNING, 36\" DEEP"),
       ("ws", "PRECAST WHEEL STOP"),
       ("sign", "SIGN POST (S1, S2)")]
for kind, desc in leg:
    x0, x1, ym = 0.05, 0.16, y-0.006
    if kind == 'pad':
        p.add_patch(Rectangle((x0, ym-0.006), x1-x0, 0.012, fc='#d8d0c0', ec='black', lw=0.8, hatch='..'))
    elif kind == 'route':
        p.plot([x0, x1], [ym, ym], color=BLUE, lw=3.2, ls=(0, (1.2, 0.8)), solid_capstyle='butt')
    elif kind == 'dw':
        p.add_patch(Rectangle((x0, ym-0.006), x1-x0, 0.012, fc='#f2c200', ec='black', lw=0.6, hatch='oo'))
    elif kind == 'ws':
        p.add_patch(Rectangle((x0+0.02, ym-0.003), x1-x0-0.04, 0.006, fc='0.35', ec='black', lw=0.6))
    elif kind == 'sign':
        p.plot([(x0+x1)/2], [ym], marker='o', ms=6, color='black')
    pl(y, desc, 6.6, x=0.2); y -= 0.02

# title block
TB = 0.14
p.add_patch(Rectangle((0, 0), 1, TB, fill=False, ec='black', lw=1.2))
p.plot([0, 1], [TB*0.72, TB*0.72], color='black', lw=0.7)
p.plot([0, 1], [TB*0.44, TB*0.44], color='black', lw=0.7)
p.plot([0.6, 0.6], [0, TB*0.44], color='black', lw=0.7)
pl(TB*0.97, "AGRICULTURAL OPERATIONS & SMALL AGRICULTURAL STORE", 7.4, True, x=0.5, ha='center')
pl(TB*0.86, "ACCESSIBLE PARKING DETAILS", 6.8, x=0.5, ha='center')
pl(TB*0.66, "OWNER: CORY J. DZBINSKI & CARISSA ULTSCH", 6.4, True, x=0.03)
pl(TB*0.56, "17054 HANDLEBAR RD, RAMONA, CA 92065  ·  APN 278-361-08-00", 6.2, x=0.03)
pl(TB*0.38, "SCALE: AS NOTED", 7.0, True, x=0.03)
pl(TB*0.26, f"DETAILS V{VERSION}" + ("  ·  DRAFT FOR OWNER REVIEW" if DRAFT else ""), 6.6, x=0.03)
pl(TB*0.14, "SHEET 2 OF 2", 7.2, True, x=0.03)
pl(TB*0.38, "REV  DATE       DESCRIPTION", 5.4, True, x=0.62)
pl(TB*0.26, "V1    9/15/2026  FIRST ISSUE", 5.4, x=0.62)
pl(TB*0.14, "V2    9/15/2026  GRAVEL FOR ALL STALLS (ZO §6157)", 5.4, x=0.62)
if y < TB + 0.01:
    raise SystemExit(f"LAYOUT: right panel overruns the title block (y={y:.3f}).")

_here = os.path.dirname(os.path.abspath(__file__))
_out = os.path.join(_here, '..', 'output'); os.makedirs(_out, exist_ok=True)
out = os.path.join(_out, f'ADA_Parking_Details_17054_V{VERSION}.pdf')
fig.savefig(out, format='pdf')
print("saved", os.path.normpath(out), f"(panel headroom {y-TB:.3f})")
