#!/usr/bin/env python3
"""Verification overlay: draws plan geometry over the registered aerial.
Run from repo root: python3 scripts/make_overlay.py -> output/Verification_Overlay.png
Reads all geometry from data/site_features.json.
"""
import json
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MPoly, Rectangle, Circle, Ellipse
from PIL import Image

F = json.load(open("data/site_features.json"))
reg = F["registration"]
SXX, SYY = reg["ft_per_px_x"], reg["ft_per_px_y"]
W_FT, H_FT = reg["parcel_bbox_ft"]
def poly_px(pts): return [(x*SXX, H_FT-y*SYY) for x, y in pts]

img = Image.open("source/Plot_Plan_Layout.png")
fig, ax = plt.subplots(figsize=(21.9, 11.4), dpi=100)
ax.imshow(img, extent=[0, img.width*SXX, H_FT-img.height*SYY, H_FT])
ax.set_xlim(-10, 593); ax.set_ylim(-12, 300); ax.set_aspect("equal"); ax.axis("off")

SP = F["parcel"]["boundary_stateplane_2230_usft"]
minx = min(p[0] for p in SP); miny = min(p[1] for p in SP)
ax.add_patch(MPoly([(p[0]-minx, p[1]-miny) for p in SP], closed=True, fill=False, ec="magenta", lw=2.5, zorder=5))

for key, s in F["structures_px"].items():
    if "poly" in s:
        p = poly_px(s["poly"])
        ax.add_patch(MPoly(p, closed=True, fill=False, ec="cyan", lw=2.2, zorder=6))
        cx = sum(q[0] for q in p)/len(p); cy = sum(q[1] for q in p)/len(p)
        ax.text(cx, cy, key.upper(), fontsize=8, color="cyan", ha="center", va="center", fontweight="bold", zorder=7)
    elif "rect_ft" in s:
        x, y, w, h = s["rect_ft"]
        ax.add_patch(Rectangle((x, y), w, h, fill=False, ec="cyan", lw=2.2, zorder=6))
        ax.text(x+w/2, y+h/2, key.upper()[:4], fontsize=7, color="cyan", ha="center", fontweight="bold", zorder=7)
    elif "ellipse_ft_center_wh" in s:
        cx, cy, w, h = s["ellipse_ft_center_wh"]
        ax.add_patch(Ellipse((cx, cy), w, h, fill=False, ec="cyan", lw=2, zorder=6))

U = F["utilities"]
ax.add_patch(Circle(tuple(U["well_ft"]), 5, fill=False, ec="yellow", lw=2.5, zorder=7))
ax.text(U["well_ft"][0], U["well_ft"][1]+10, "WELL", fontsize=9, color="yellow", ha="center", fontweight="bold", zorder=7)
for k, c in [("septic_tank_ft_rect", "yellow"), ("leach_ft_rect", "orange")]:
    x, y, w, h = U[k]
    ax.add_patch(Rectangle((x, y), w, h, fill=False, ec=c, lw=2.2, zorder=6))
px, py, pw, phh = 169.5, 173.6, 5, 5
ax.add_patch(Rectangle((px, py), pw, phh, fc="yellow", zorder=7))

road = poly_px(F["roads"]["handlebar_rd"]["centerline_px"])
ax.plot([p[0] for p in road], [p[1] for p in road], color="white", lw=2.5, ls=(0,(8,4)), zorder=6)
drv = poly_px(F["roads"]["driveway"]["centerline_px"])
ax.plot([p[0] for p in drv], [p[1] for p in drv], color="lime", lw=2, ls=(0,(5,3)), zorder=6)
pc = F["pond"]["ellipse_ft_center_wh"]
ax.add_patch(Ellipse((pc[0], pc[1]), pc[2], pc[3], fill=False, ec="deepskyblue", lw=2, zorder=6))

# ---- proposed store + customer parking (rev 7: store = the Mini Barn Market
# building itself, owner-confirmed 8/21/2026; parking on the gravel yard E of it).
STORE = [(72.1,230.5),(82.1,230.5),(82.1,240.5),(72.1,240.5)]   # 10'x10' per owner
ax.add_patch(MPoly(STORE, closed=True, fill=False, ec="red", lw=3, zorder=8))
ax.text(77, 210, "PROPOSED STORE =\nMINI BARN MARKET, 10'x10' (100 SF)", fontsize=9, color="red",
        ha="center", va="top", fontweight="bold", zorder=9)

import math as _m
_P1, _P2 = (97.4, 266.8), (200.3, 255.4)
_L = _m.hypot(_P2[0]-_P1[0], _P2[1]-_P1[1])
_u = ((_P2[0]-_P1[0])/_L, (_P2[1]-_P1[1])/_L); _n = (_u[1], -_u[0]); _t0 = _L-62.0
for _lab, _t, _w in [("VAN",0,9.0),("AISLE",9.0,8.0)]+[("",17.0+i*9.0,9.0) for i in range(5)]:
    _a=(_P1[0]+_u[0]*(_t0+_t), _P1[1]+_u[1]*(_t0+_t))
    _b=(_P1[0]+_u[0]*(_t0+_t+_w), _P1[1]+_u[1]*(_t0+_t+_w))
    _poly=[_a,_b,(_b[0]+_n[0]*18,_b[1]+_n[1]*18),(_a[0]+_n[0]*18,_a[1]+_n[1]*18)]
    ax.add_patch(MPoly(_poly, closed=True, fill=False, ec="red",
                       lw=1.6, ls="--" if _lab=="AISLE" else "-", zorder=8))
ax.text(168, 232, "PROPOSED PARKING - 6 SPACES\n(AGAINST AG-2 BOTTOM LINE)", fontsize=9, color="red",
        ha="center", va="top", fontweight="bold", zorder=9)

ax.set_title("VERIFICATION OVERLAY v3 - plan geometry on registered aerial\n"
             "RED = proposed store and parking (rev 7). Store and barn footprints per owner measurement.",
             fontsize=13, pad=10)
fig.savefig("output/Verification_Overlay_v3.png", bbox_inches="tight", dpi=100)
print("saved output/Verification_Overlay_v3.png")
