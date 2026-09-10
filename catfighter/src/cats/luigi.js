/* =====================================================================
   3 — LUIGI. The other twin, and none of the weight.

   LIGHT: quick, mobile, and folds if he gets caught. Comes at you from
   above with the flying body attack and from below with the sweep.

   THE PROBLEM WITH HIM is that he wears his brother's coat. Black and
   white tuxedo, both of them, and colour is the one thing that cannot
   tell them apart. So everything here is aimed at the OUTLINE: turn
   the pair of them black and Mario is a bell — wide, low, an apron
   hanging off a belt — and Luigi is a blade with a long scarf coming
   off the back of it. Nothing on him is decided by pigment.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.luigi = {
  id: 'luigi',
  weightClass: 'light',
    /* Up on his toes and leaning in, with the narrowest base on the
       roster — his feet are about eight units apart against Mario's
       thirty-one, and that alone is half of the twin problem solved.
       Guard is high and tight to the chin rather than out in front:
       a light cat who has to get out of the way keeps his elbows in. */
  stance: { torso: 7, py: 1.8, armF: [16, -10], armB: [4, 10],
            legF: [-4, 5], legB: [4, -5], head: [0, 0, 3] },
    /* Lean everywhere it costs silhouette: girth well under one, the
       longest limbs on the roster, and a waist pulled in hard. `muscle`
       goes UP rather than down — a light fighter is not soft, he is a
       whippet, and the muscle shapes are what stop a thin cat reading as
       a starved one.

       `head` and `limbW` went down a step each after the roster test called
       him and Lilly the same cat: they are both light, both tall-eared and
       both lean, and only the skull and the girth were telling them apart.
       A small skull on long thin limbs is also just the right answer for
       him — it is what makes a figure read as tall, and he is the tallest
       cat on the roster with the least on him. */
  build: { s: 1.05, girth: 0.78, limb: 1.24, head: 0.86, muscle: 1.30,
           headShape: 'long', ear: 'tall', shoulder: 0.86, waist: 0.74, limbW: 0.72 },

  /* ---- HIS LOOK ---------------------------------------------------------

     Three pieces, and each one is doing a different job.

     THE SCARF is the silhouette. It is very long on purpose — about
     three quarters of his own height streaming off the back of his neck
     — because a short one is a neckerchief and reads as nothing at game
     size. It is the only thing on the roster that leaves the body and
     keeps going, so at 384x224 you know which twin is which from the
     shape alone, before a single pixel of him has been identified.

     THE SASH is the value break. A bare chest on a black cat is a black
     hole; one band crossing it diagonally gives the trunk a direction,
     and diagonal is a line nobody else on the roster has.

     THE SLEEVE is the asymmetry. One arm dressed and one bare is what
     stops a symmetrical figure reading as a paper doll, and it puts the
     brightest value on the roster on the arm that does the hitting.

     Bare feet, deliberately: Mario has cream socks and cream feet, so
     Luigi's legs run black all the way to the floor and read as one long
     line. Same coat, opposite leg.

     AND THE FUR ITSELF IS A PIECE OF KIT. Added when the owner asked for
     more detail and realism. See the long note over `tuft` below: on a
     lean cat the outline is the character, and a smooth outline is a
     stick.                                                              */
  look: {
    pieces: function (A, j, f) {
      /* A clean jade. It has to survive being a mid-tone shape on a
         near-black cat, so it is saturated rather than dark — a forest
         green went in first and disappeared into the fur completely at
         game size. Green is also the one hue nobody else on the roster
         has: red on Gracie, crimson on Mario, blue on Lilly. */
      var SCARF = '#2f9e63';
      var SCARF_D = A.shade(SCARF, 0.26);
      /* The two tones the CLOTH is planed with. They are deliberately the
         same numbers `celFill` uses on the fur — shadow is the base mixed
         0.46 towards the one cool dark, the highlight 0.36 towards the
         light — so the scarf is lit by the same lamp as the shoulder it
         sits on even though it is not shaded by the same recipe. */
      var CLOTH_SH = A.shade(SCARF, 0.40);
      var CLOTH_LT = A.lit(SCARF, 0.36);
      var BONE = '#f2ecdc';
      var BONE_D = A.shade(BONE, 0.34);
      var S = f.s;

      /* the spine frame: t runs pelvis(0) to neck(1), w across it and
         positive forward. Same trick as Gracie's gi and Mario's mawashi. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;
      var upx = dx / L, upy = dy / L;            /* along the spine, towards the head */
      function T(t, w) { return { x: p.x + dx * t + fx * w, y: p.y + dy * t + fy * w }; }

      /* ==== FUR ON THE SILHOUETTE ==========================================

         The single biggest thing missing from this cat, and it took the
         owner asking for "more detail" to see it: every edge on him was a
         SMOOTH CURVE. A smooth outline is what vector art looks like. A
         drawn animal has notched, tufted, irregular edges — at the nape, the
         rump, the back of the thigh, the jaw, the length of the tail — and
         on a LEAN cat that is where the whole character lives. A thin figure
         with a smooth outline is a stick; a thin figure with a ragged one is
         a whippet.

         HOW IT IS DONE. Each tuft is a lobe whose root is sunk INTO the
         body and which is added to the `back` layer, so the torso, the limb
         or the skull is painted over it afterwards and the only thing that
         survives is the part standing proud of the outline — exactly the
         mechanism `A.mane` uses. The contour pass has already stroked it, so
         what comes out is fur welded into the silhouette rather than a shape
         stuck on top of it.

         HOW BIG, and this is the whole trick. At game scale a unit is about
         a pixel and the contour is 1.8 units wide on EVERY side of EVERY
         shape, so two tufts four units apart weld into one lump and a tuft
         four units long is swallowed by its own outline. Nothing under about
         five units long reads, and nothing closer together than about eight
         units reads as two. So these are FEW AND LARGE — three jags on a
         forty-unit tail, not a sawtooth. An even comb of little teeth was
         the first thing tried and at 1x it is a furry blur, which is noise,
         which is worse than the smooth curve it replaced.

         And no two are the same. Lengths, spacing and lean are all hand-set
         and deliberately uneven: a real animal is not mirrored, and a row of
         identical spikes reads as machined.

         A LOBE, NOT A SPIKE, and this was the first thing that had to be
         thrown away. The first version drew each tuft as a narrow triangle
         standing straight out of the surface — four of them along the tail,
         three down the back — and it came out a stegosaurus. Fur is not
         thorns: what a drawn cat has is a BROAD, SHALLOW scallop that leans
         hard along the body, wider at the root than it is deep. So `wide` is
         about the same as `out` here and never much less, and `sweep` lays
         the tip over: down the back at the nape, down the leg at the thigh,
         out towards the tip on the tail.                                  */
      function tuft(cx, px, py, dxv, dyv, out, wide, sweep) {
        var l2 = Math.hypot(dxv, dyv) || 1;
        var ux = dxv / l2, uy = dyv / l2;      /* out of the body */
        var vx = -uy, vy = ux;                 /* along the surface */
        /* the roots sit behind the surface, so the tuft grows out of the
           body rather than balancing on it */
        var r1x = px + vx * wide - ux * wide * 0.85, r1y = py + vy * wide - uy * wide * 0.85;
        var r2x = px - vx * wide - ux * wide * 0.85, r2y = py - vy * wide - uy * wide * 0.85;
        var tx = px + ux * out + vx * sweep, ty = py + uy * out + vy * sweep;
        cx.moveTo(r1x, r1y);
        cx.quadraticCurveTo(px + vx * wide * 0.70 + ux * out * 0.62,
                            py + vy * wide * 0.70 + uy * out * 0.62, tx, ty);
        cx.quadraticCurveTo(px - vx * wide * 0.44 + ux * out * 0.30,
                            py - vy * wide * 0.44 + uy * out * 0.30, r2x, r2y);
        cx.closePath();
      }

      /* A point on the edge of a limb and the direction out of it. `t` runs
         0 at `a` to 1 at `b`, `r0`/`r1` are the limb's radii at each end and
         `side` picks which edge: -1 is the trailing one, which is the back
         of a thigh or the point of an elbow whichever way the joint is
         swung. */
      function edge(a, b, t, r0, r1, side) {
        var ex = b.x - a.x, ey = b.y - a.y, el = Math.hypot(ex, ey) || 1;
        var nx = -ey / el * side, ny = ex / el * side;
        var r = r0 + (r1 - r0) * t;
        return { x: a.x + ex * t + nx * r, y: a.y + ey * t + ny * r, nx: nx, ny: ny,
                 ux: ex / el, uy: ey / el };
      }
      function limbTuft(cx, a, b, t, r0, r1, side, out, wide, sweep) {
        var e = edge(a, b, t, r0, r1, side);
        /* `sweep` is given along the limb, so it has to be resolved against
           the limb's own direction rather than the tuft's */
        var sw = (e.ux * -e.ny + e.uy * e.nx) * (sweep || 0);
        tuft(cx, e.x, e.y, e.nx, e.ny, out * S, wide * S, sw * S);
      }

      /* ---- the trunk and the legs -----------------------------------------

         The nape and the shoulder blade break the long smooth back; the two
         at the rump are where the tail leaves and are the ones that stop the
         hindquarters reading as a bag; the britches on the far thigh are the
         classic cat trouser, and they are on the FAR leg because in a
         standing guard that is the leg on the outline — the near one's back
         edge faces into the gap between his feet, where a tuft is a smudge
         nobody can read. The near knee gets one anyway because in the sweep
         and both kicks that leg is thrown out and its underside becomes the
         whole bottom of the silhouette.                                   */
      var RT = f.R_TOP, RM = f.R_MID, RE = f.R_END;
      A.add('back', function (cx) {
        cx.beginPath();
        var q;
        /* the nape and the shoulder blade. Two, not three: the middle one
           made an even row and an even row is a comb. */
        var nape = [[0.88, 0.86, 4.2, 4.0, -1.15], [0.63, 0.98, 3.4, 4.6, -1.30]];
        for (q = 0; q < nape.length; q++) {
          var nb = T(nape[q][0], -f.chestW * nape[q][1]);
          tuft(cx, nb.x, nb.y, -fx, -fy, nape[q][2] * S, nape[q][3] * S,
               nape[q][4] * S);
        }
        /* the rump, where the tail leaves it */
        var rp = T(0.02, -f.hipW * 1.02);
        tuft(cx, rp.x, rp.y, -fx, -fy, 4.0 * S, 4.4 * S, -1.4 * S);
        /* britches on the far thigh */
        limbTuft(cx, j.hipB, j.kneeB, 0.34, RT * 1.10, RM * 0.80, -1, 4.4, 4.6, 1.6);
        /* the near leg, for the poses that throw it out in front, and the
           spring of the calf high on the back of the shin */
        limbTuft(cx, j.hipF, j.kneeF, 0.36, RT * 1.24, RM * 0.86, -1, 3.2, 4.2, 1.4);
        limbTuft(cx, j.kneeF, j.footF, 0.16, RM * 0.86, RE * 0.80, -1, 2.8, 3.6, 1.1);
      }, f.furBack, { flat: true });

      /* ---- the tail --------------------------------------------------------

         A forty-unit smooth banana was the loudest remaining curve on him,
         and it sat right next to the scarf — two smooth arcs of the same
         length making a V, and the eye read them as one piece of kit. Three
         jags on the OUTER edge and a heavier tip fix both at once: the tail
         becomes an animal and the scarf stays cloth.

         Outer edge only, and never the inner one. A tuft on the inside is
         pointing at either the rump or the scarf, and closing either gap is
         how the lasso came back the last three times.                     */
      var TW = 4.0 * S * f.GW;                  /* the rig's own tail width */
      function tailAt(t) {
        var P = j.tail, u = 1 - t;
        var gx = 3 * u * u * (P[1].x - P[0].x) + 6 * u * t * (P[2].x - P[1].x) + 3 * t * t * (P[3].x - P[2].x);
        var gy = 3 * u * u * (P[1].y - P[0].y) + 6 * u * t * (P[2].y - P[1].y) + 3 * t * t * (P[3].y - P[2].y);
        var gl = Math.hypot(gx, gy) || 1;
        var w = TW + (TW * 0.52 - TW) * (t * t * (3 - 2 * t));
        var nx = -gy / gl, ny = gx / gl;         /* the outer side of the curl */
        return { x: u * u * u * P[0].x + 3 * u * u * t * P[1].x + 3 * u * t * t * P[2].x + t * t * t * P[3].x + nx * w,
                 y: u * u * u * P[0].y + 3 * u * u * t * P[1].y + 3 * u * t * t * P[2].y + t * t * t * P[3].y + ny * w,
                 nx: nx, ny: ny, ux: gx / gl, uy: gy / gl };
      }
      A.add('back', function (cx) {
        cx.beginPath();
        /* A thick furry root, a small notch at the waist of the curl and a
           fuller tip — which is how a real tail reads, and NOT three of the
           same lobe evenly spread, which is a fish fin. Uneven spacing does
           most of the work here. */
        var jag = [[0.14, 4.0, 5.6, 1.8], [0.46, 2.0, 3.4, 0.5], [0.80, 3.0, 4.2, 1.5]];
        for (var q = 0; q < jag.length; q++) {
          var e = tailAt(jag[q][0]);
          var sw = (e.ux * -e.ny + e.uy * e.nx) * jag[q][3];
          tuft(cx, e.x, e.y, e.nx, e.ny, jag[q][1] * S, jag[q][2] * S, sw * S);
        }
      }, f.furBack, { flat: true });

      /* ---- the head --------------------------------------------------------

         `headShape: 'long'` gives him a cheek of 0.18 against a broad cat's
         0.86, which is right for a lean face and leaves the skull a smooth
         egg with two ears on it. Two tufts off the back of it and one under
         the jaw put a CAT in the outline; without them he is a ball with a
         face drawn on, which is the exact failure ART.md warns about.

         Drawn in the head's own frame — the skull turns as far as 84 degrees
         on a knockdown and fur painted in body space would slide off the
         face. The frame is rebuilt here rather than asked for because the
         `back` layer is in body coordinates: everything in it has to carry
         its own transform.

         The ear furnishing is on the NEAR ear only. A matched pair is a
         costume; one is an animal.                                       */
      var DEG = Math.PI / 180;
      A.add('back', function (cx) {
        cx.save();
        cx.translate(j.head.x, j.head.y);
        cx.rotate(-(j.headRot || 0) * DEG);
        cx.beginPath();
        var r = j.headR;
        /* the skull is an ellipse rx 0.90, ry 1.34 of headR; the outward
           direction at an angle is (cos/rx, sin/ry), not (cos, sin) */
        var ruff = [[172, 3.4, 3.6, -1.1], [208, 3.8, 3.4, -0.9], [244, 2.8, 2.8, -0.7]];
        for (var q = 0; q < ruff.length; q++) {
          var a2 = ruff[q][0] * DEG, ca = Math.cos(a2), sa = Math.sin(a2);
          tuft(cx, r * 0.90 * ca, r * 1.34 * sa, ca / 0.90, sa / 1.34,
               ruff[q][1] * S, ruff[q][2] * S, ruff[q][3] * S);
        }
        /* the near ear, halfway up its leading edge */
        tuft(cx, r * 0.70, r * 1.34, 0.94, -0.34, 2.8 * S, 2.6 * S, 1.2 * S);
        cx.restore();
      }, f.fur, { flat: true });

      /* A tapering ribbon through a list of {x,y,w}. Built by walking the
         centre line and pushing each point out along the normal, because a
         stroked line cannot taper and a scarf that does not taper is a
         plank. */
      /* The unit normal at a sample, and the cloth's half-width on each side
         of it. They are separate because one point along the banner carries a
         TEAR — see `scarfPts` — and a tear is a bite out of one edge only. */
      function nrm(pts, q) {
        var a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)];
        var ux = b.x - a.x, uy = b.y - a.y, ul = Math.hypot(ux, uy) || 1;
        return { x: -uy / ul, y: ux / ul };
      }
      function halfW(pt, side) {
        return side >= 0 ? (pt.wf === undefined ? pt.w : pt.wf)
                         : (pt.wb === undefined ? pt.w : pt.wb);
      }
      function ribbon(pts, notch) {
        return function (cx) {
          var fwd = [], bwd = [], q;
          for (q = 0; q < pts.length; q++) {
            var u2 = nrm(pts, q);
            fwd.push({ x: pts[q].x + u2.x * halfW(pts[q], 1), y: pts[q].y + u2.y * halfW(pts[q], 1) });
            bwd.push({ x: pts[q].x - u2.x * halfW(pts[q], -1), y: pts[q].y - u2.y * halfW(pts[q], -1) });
          }
          cx.beginPath();
          cx.moveTo(fwd[0].x, fwd[0].y);
          for (q = 1; q < fwd.length; q++) cx.lineTo(fwd[q].x, fwd[q].y);
          /* A swallowtail cut into the tip. A blunt taper ends in a point
             and reads as a rope; the notch is the one detail that says
             cloth, and it survives the drop to game size because it is cut
             into the SILHOUETTE rather than drawn inside it. */
          if (notch) {
            var e = pts[pts.length - 1], d = pts[pts.length - 2];
            var vx2 = d.x - e.x, vy2 = d.y - e.y, vl = Math.hypot(vx2, vy2) || 1;
            cx.lineTo(e.x + vx2 / vl * notch, e.y + vy2 / vl * notch);
          }
          for (q = bwd.length - 1; q >= 0; q--) cx.lineTo(bwd[q].x, bwd[q].y);
          cx.closePath();
        };
      }

      /* Where the scarf is tied. It went at the throat first, a third of
         the way up towards the skull, and the head sat straight on top of
         it — the collar was invisible and the tails appeared to grow out
         of the back of his neck fur. Down on the collarbone the knot is
         in the clear and the tails leave from something. */
      var nk = { x: j.neck.x * 0.82 + j.head.x * 0.18,
                 y: j.neck.y * 0.82 + j.head.y * 0.18 };

      /* `sway` already folds his speed, a slow idle drift and being
         airborne into one number, positive meaning blown backwards. The
         scarf is the piece it was put there for: standing still it barely
         moves, walking forward it lifts and trails, and in the air it is
         straight out behind him. */
      var SW = f.sway;

      /* ---- CLOTH IS NOT FUR, AND MUST NOT BE SHADED LIKE IT -----------------

         `celFill` fills a part in shadow and lays the base back over it
         shifted towards the light, so what survives is a crescent of shadow
         along one edge. That is exactly right for a limb — it is a tube and
         it should read as one — and it is exactly wrong for a scarf, which
         is why the banner came out looking like a bent green pipe. Light
         cloth does not have a rounded form; it has FLAT PLANES with a crisp
         fold between them, and the fold wanders across the width as the
         cloth turns over.

         So the banner is filled FLAT and two planes are laid on it by hand:
         a shadow along the trailing edge and a highlight along the leading
         one, both with a boundary that pinches and swells and crosses the
         middle once. Three tones, same as everything else, but they are
         planes rather than crescents — and at ninety pixels tall that
         difference is the whole difference between cloth and hosepipe.

         It is cheaper as well as better: three flat fills and no clip
         against one clipped four-fill band pass.                          */
      function frac(prof, t) {
        var q = 0;
        while (q < prof.length - 2 && prof[q + 1][0] < t) q++;
        var a = prof[q], b = prof[q + 1];
        var k = (t - a[0]) / ((b[0] - a[0]) || 1);
        if (k < 0) k = 0; else if (k > 1) k = 1;
        return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      }
      /* A strip of a ribbon between two across-fractions: +1 is the trailing
         edge, -1 the leading one. Both run right out to the edge — the plane's
         own contour lands inside the ribbon's, so it leaves no line. */
      function plane(pts, prof, from, to) {
        return function (cx) {
          var q, lo = [], hi = [], N2 = pts.length - 1;
          for (q = 0; q <= N2; q++) {
            var t = q / N2;
            if (t < from || t > to) continue;
            var u2 = nrm(pts, q);
            var k = frac(prof, t);
            var w0 = halfW(pts[q], k[0]), w1 = halfW(pts[q], k[1]);
            lo.push({ x: pts[q].x + u2.x * w0 * k[0], y: pts[q].y + u2.y * w0 * k[0] });
            hi.push({ x: pts[q].x + u2.x * w1 * k[1], y: pts[q].y + u2.y * w1 * k[1] });
          }
          cx.beginPath();
          cx.moveTo(hi[0].x, hi[0].y);
          for (q = 1; q < hi.length; q++) cx.lineTo(hi[q].x, hi[q].y);
          for (q = lo.length - 1; q >= 0; q--) cx.lineTo(lo[q].x, lo[q].y);
          cx.closePath();
        };
      }

      function scarfPts(len, rise, drop, wid, phase, ripple) {
        var pts = [], N = 9;
        var ex = nk.x - len * f.s;
        var ey = nk.y - drop * f.s + SW * 2.6 * f.s;
        for (var q = 0; q <= N; q++) {
          var t = q / N, u = 1 - t;
          /* a quadratic from the knot out to the tip. The control point is
             ABOVE the line between them, so the cloth kicks up as it leaves
             the neck and falls away at the far end — an S, not a rod. The
             first version put the control almost on the line and the tail
             came out as a straight green wire stuck to his collar. */
          var mx = nk.x - len * 0.46 * f.s;
          var my = nk.y + (rise + SW * 1.2) * f.s;
          var px = u * u * nk.x + 2 * u * t * mx + t * t * ex;
          var py = u * u * nk.y + 2 * u * t * my + t * t * ey;
          /* the ripple grows towards the tip — the end of a scarf moves,
             the bit knotted at the throat does not */
          py += Math.sin(t * 4.2 + f.t * 0.13 + phase) * ripple * t * t * f.s;
          /* Tapered the whole way, fat at the knot and about a third of that
             at the tip. It used to hold full width until t=0.7 and then give
             up, which at game size is a garden hose with a flick on the end.
             The exponent is 1.35 rather than 1 because a straight linear
             taper takes the middle down to two pixels, which is where a
             scarf breaks into dashes — this keeps the middle broad enough to
             read and still narrows continuously. */
          pts.push({ x: px, y: py, w: wid * f.s * (1 - 0.66 * Math.pow(t, 1.35)) });
        }
        /* A TEAR, on one edge, at one station. A bite out of the trailing
           edge is a detail that survives the drop to game size because it is
           cut into the SILHOUETTE rather than drawn inside it — the same
           argument as the swallowtail at the tip and the torn cuff on the
           sleeve, and the same language: nothing on this cat is hemmed.

           One edge only. Taking the same bite out of both edges at the same
           station pinches the ribbon to a waist, and a scarf with a waist in
           it reads as a modelling error rather than as damage. The second
           point is half the bite, so the tear has a torn SLOPE back to full
           width instead of a square step. */
        pts[5].wf = pts[5].w * 0.46;
        pts[6].wf = pts[6].w * 0.80;
        return pts;
      }

      /* ONE tail, and it took four rounds of the silhouette test to get
         here. It has to stay clear of the cat's own tail, and that is the
         whole reason these numbers look the way they do.

         Measured off the solved rig, in the units these calls take and
         relative to the knot: his tail leaves the rump at (-12, -32), swings
         back to (-27, -24) and (-33, -10), and curls up to finish at
         (-32, +2) — level with the knot and a third of his height behind
         it. That is exactly where a scarf wants to be, so the two fight
         unless the numbers are chosen against those four points.

         The first pass ignored them. There were two long tails, one running
         52 back across the tail tip and one dropping 26 straight through the
         arc, and the black shape came out with a HOLE through it. A lasso,
         and it was the loudest thing on the roster page. Nudging did not fix
         it: turning the short tail up to clear the arc only moved the hole,
         and the long one still landed on the tail tip and trapped a crescent
         under it. The scarf has to pass OVER the tail with daylight, or the
         wedge between them closes somewhere.

         And it has to lift further than the arithmetic says. Five units of
         clearance is not clearance: every shape here carries a contour
         stroke a couple of pixels wide on each side, so two edges five units
         apart weld shut and you get one fat boomerang behind him with no
         telling cloth from cat. `rise 20, drop -24` puts about thirteen
         units through the crossing, which survives the contour and survives
         the drop to ninety pixels tall.

         The second tail is gone rather than retuned. Every position that
         made it visible put it in the gap between the banner and the tail,
         where it bridged the two and brought the hole back in whichever pose
         was not being looked at — jumpKick and guardHigh, mostly. The one
         place it never bridged was tucked so far behind the trunk that
         nothing of it showed. A shape that either breaks the silhouette or
         cannot be seen is not worth a draw call, and the judges wanted fewer
         bars trailing off him anyway: cloth and tail, a V, and nothing else.
         The collar and the knot below it are what say the banner is tied on.

         Anything that reaches past x=-30 and sits below +8 makes the ring
         again, and it will not show up in colour — `node tools/shot.mjs
         silhouette`, and check the other five poses too, because stand is
         the one pose where the tail is furthest out of the way.

         ONE MORE POSE BROKE IT. The four points above are all measured off
         `stand`; they say nothing about `flyBody` (and `superFly`, which
         reuses its cel), where the pose throws the tail up level with the
         skull instead of back along the ground. The tuned route above never
         goes near that tail position, so on those two moves the banner
         and the tail crossed again and a `node tools/shot.mjs silhouette`
         at 8x on `flyBody` specifically — the default `silhouette` command
         only renders `stand`, which is exactly how this hid — showed the
         same lasso the four points were chosen to prevent, this time
         between the scarf and the tail's OWN arc rather than the old
         second-tail streamer.

         Retuning the route by hand for a second pose would just be trading
         one hidden pose for a third someday, so instead it is CHECKED: the
         tuned route is tried first and kept if the tail never comes closer
         than `CLEAR`; if it does, a shorter, lower route that stays close to
         the collar is tried instead of it. Ground poses never take the
         second route — the tail is nowhere near the collar there — so the
         look everywhere already proven is untouched, and the one pose that
         needed it gets a shorter scarf rather than a hole. */
      /* Coarse on purpose — this runs every frame, on every pose, just to
         confirm the tuned route is still fine, and it only has to catch a
         crossing, not measure one exactly: five points on the ribbon against
         six on the tail is 30 checks, not the 150 a dense grid would cost,
         and the routes above clear by so much once they clear at all that
         the coarseness never changes the answer. */
      function scarfClearance(pts) {
        var minD = 1e9;
        for (var pi = 0; pi < pts.length; pi += 2) {
          for (var tt = 0.12; tt <= 0.98; tt += 0.16) {
            var tp = tailAt(tt);
            var d = Math.hypot(pts[pi].x - tp.x, pts[pi].y - tp.y);
            if (d < minD) minD = d;
          }
        }
        return minD;
      }
      var SCARF_ROUTES = [
        [44, 20.0, -24.0, 5.6, 0.0, 3.2],   /* the tuned route, clear on the ground */
        [34, -20.0, 20.0, 5.2, 0.0, 2.0]    /* dropped low and short, for a tail thrown past it */
      ];
      var CLEAR = 13 * S;
      var BANNER = scarfPts.apply(null, SCARF_ROUTES[0]);
      var bannerClear = scarfClearance(BANNER);
      if (bannerClear < CLEAR) {
        var alt = scarfPts.apply(null, SCARF_ROUTES[1]);
        if (scarfClearance(alt) > bannerClear) BANNER = alt;
      }
      A.add('back', ribbon(BANNER, 6.4 * S), SCARF, { edge: true, flat: true });
      /* the underside, turning over once at about two thirds along */
      A.add('back', plane(BANNER, [[0, 1, 0.05], [0.24, 1, 0.62], [0.44, 1, 0.10],
                                   [0.66, 1, -0.42], [0.84, 1, 0.34], [1, 1, 0.55]],
                          0, 0.97), CLOTH_SH, { flat: true });
      /* and the plane that faces the light, which is doing the opposite */
      A.add('back', plane(BANNER, [[0, -1, -0.62], [0.24, -1, -0.90], [0.44, -1, -0.30],
                                   [0.66, -1, -0.78], [0.84, -1, -0.26], [1, -1, -0.50]],
                          0, 0.97), CLOTH_LT, { flat: true });

      /* The collar the banner is tied to. Without it the cloth grew straight
         out of the fur, which reads as a mistake rather than as a garment. */
      A.add('body', function (cx) {
        A.ellipse(cx, nk.x, nk.y, f.chestW * 0.56, f.chestW * 0.40, 0.22);
      }, SCARF, { band: true, edge: true });
      A.add('body', function (cx) {
        A.ellipse(cx, nk.x - f.chestW * 0.30, nk.y - f.chestW * 0.10,
                  f.chestW * 0.30, f.chestW * 0.26, 0.4);
      }, SCARF_D, { edge: true });

      /* --- the sash. One band from over the back of the shoulder down
             across the chest to the front of the hip. Built as a strip
             with a normal rather than as a hand-placed polygon, so it
             stays the same width when he leans and does not shear into a
             wedge on the sweep. --- */
      var top = T(1.02, -f.chestW * 0.26);
      var bot = T(0.08, f.hipW * 1.26);
      (function () {
        var sx = bot.x - top.x, sy = bot.y - top.y;
        var sl = Math.hypot(sx, sy) || 1;
        var nx2 = -sy / sl, ny2 = sx / sl;
        var W = f.chestW * 0.62;
        function SP(t, k) {
          return { x: top.x + sx * t + nx2 * W * k,
                   y: top.y + sy * t + ny2 * W * k };
        }
        A.add('body', function (cx) {
          /* bowed out a little at the middle: a sash lies on a chest, and
             a chest is round. Dead straight it read as tape. */
          A.smooth(cx, [SP(0, 1), SP(0.5, 1.16), SP(1, 1),
                        SP(1, -1), SP(0.5, -1.16), SP(0, -1)]);
        }, SCARF, { edge: true, flat: true });
        /* Same cloth, same treatment: a flat plane along the trailing edge
           with one crisp fold where it crosses the pectoral, instead of the
           soft crescent the band pass gave it. Two tones is enough here —
           the sash is eleven pixels across and a highlight on it as well
           came out as three stripes and read as corrugated iron. */
        A.add('body', function (cx) {
          A.smooth(cx, [SP(0.02, 1.02), SP(0.34, 1.10), SP(0.62, 1.06), SP(0.98, 1.02),
                        SP(0.98, 0.10), SP(0.62, -0.34), SP(0.34, 0.40), SP(0.02, 0.05)]);
        }, CLOTH_SH, { flat: true });
      })();

      /* the knot where the sash meets the hip, with one short end hanging
         off it. Short on purpose — the long streaming is the scarf's job
         and two long things fight each other. */
      A.add('front', function (cx) {
        var k = T(0.14, f.hipW * 1.16);
        A.ellipse(cx, k.x, k.y, 3.4 * f.s, 2.8 * f.s, 0.5);
      }, SCARF_D, { band: true, edge: true });
      A.add('front', function (cx) {
        var a = T(0.14, f.hipW * 1.20);
        var swing = SW * 1.4;
        cx.beginPath();
        cx.moveTo(a.x - 1.6 * f.s, a.y);
        cx.lineTo(a.x + 1.8 * f.s, a.y);
        cx.lineTo(a.x + 3.0 * f.s + swing * f.s, a.y - 11 * f.s);
        cx.lineTo(a.x + 0.4 * f.s + swing * f.s, a.y - 9.0 * f.s);
        cx.lineTo(a.x - 2.4 * f.s + swing * f.s, a.y - 11.6 * f.s);
        cx.closePath();
      }, SCARF, { edge: true });

      /* --- the ankle wrap. He fights barefoot, so the one thing down
             there is a band of the same cloth just above the foot. It is
             doing a job as well as being kit: his legs are black from hip
             to floor, which is the long line that makes him a blade, and
             without a mark on them the eye has nothing to measure the
             stride by on the walk cycle. Flat-filled — it is about four
             pixels across in the finished picture and cel-shading it
             costs a clip to change nothing anybody can see.

             It sits well up the shin. Down at the joint it read as a
             slipper, which is the one thing a barefoot fighter must not
             be wearing. --- */
      (function () {
        var kx = j.footF.x - j.kneeF.x, ky = j.footF.y - j.kneeF.y;
        function P(t) { return { x: j.kneeF.x + kx * t, y: j.kneeF.y + ky * t }; }
        A.add('front', function (cx) {
          A.limb(cx, P(0.60), P(0.80), f.R_END * 1.28, f.R_END * 1.22, 0);
        }, SCARF, { edge: true, flat: true });
      })();

      /* --- the one sleeve. It flares from the shoulder out to a torn bell
             past the elbow, so the near arm is a wedge and not a tube —
             and the bright value lands on the arm that throws the punch.
             The far arm gets nothing at all: a matched pair is a costume,
             one sleeve is a character. --- */
      A.add('front', function (cx) {
        A.limb(cx, j.shF, j.elbF, f.R_TOP * 1.18, f.R_MID * 1.46, 0.35, 'upperArm');
      }, BONE, { band: true, edge: true });

      (function () {
        var ax = j.elbF.x - j.shF.x, ay = j.elbF.y - j.shF.y;
        var al = Math.hypot(ax, ay) || 1;
        var ux = ax / al, uy = ay / al, px2 = -uy, py2 = ux;
        var W = f.R_MID * 1.46;
        function E(along, across) {
          return { x: j.elbF.x + ux * along * f.s + px2 * across,
                   y: j.elbF.y + uy * along * f.s + py2 * across };
        }
        /* GATHERS, and they are the reason the sleeve is not the same
           material as the banner. Heavy cloth bunches where it is held —
           here at the bell past the elbow — and a crease in a sprite is a
           SHAPE, never a line: a stroked one-pixel crease disappears, and a
           two-pixel one reads as a scratch. So each is a tapered wedge in a
           bone shadow, cut straight across the sleeve, hard-edged. Two, at
           different angles and different lengths, because a matched pair
           reads as printed stripes. */
        function crease(cx, a0, k0, a1, k1, wid) {
          var p0 = E(a0, W * k0), p1 = E(a1, W * k1);
          var q1 = E(a1 + wid * 0.30, W * k1), q0 = E(a0 + wid, W * k0);
          cx.moveTo(p0.x, p0.y); cx.lineTo(p1.x, p1.y);
          cx.lineTo(q1.x, q1.y); cx.lineTo(q0.x, q0.y);
          cx.closePath();
        }
        A.add('front', function (cx) {
          cx.beginPath();
          crease(cx, -6.4, 1.00, -4.0, -0.34, 2.3);
          crease(cx, -2.6, 0.98, -1.4, 0.18, 1.5);
        }, BONE_D, { flat: true });

        /* The cuff, torn rather than sewn, cut with lineTo and never
           smoothed — A.smooth rounds a two-pixel tooth away to nothing and
           the tear is the whole reason the sleeve is not a bandage.

           It is GREEN, not a second shade of bone. In bone it was the same
           value as the sleeve above it and the same value as the tuxedo
           bib beside it, and the whole front of him turned into one pale
           blob at game size. In the scarf's colour it cuts the sleeve off
           at the elbow and ties the kit together: green at the throat, the
           chest, the hip and the cuff, and nowhere else. */
        A.add('front', function (cx) {
          var q, e = E(-1.0, W); cx.beginPath(); cx.moveTo(e.x, e.y);
          var teeth = [3.6, 0.6, 4.4, 1.2, 3.0];
          for (q = 0; q < teeth.length; q++) {
            e = E(teeth[q], W - (W * 2) * (q / (teeth.length - 1)));
            cx.lineTo(e.x, e.y);
          }
          e = E(-1.0, -W); cx.lineTo(e.x, e.y);
          cx.closePath();
        }, SCARF_D, { edge: true });
      })();
    }
  },

  displayName: 'LUIGI',
  subtitle: 'The Twin',
  blurb: 'Same coat, half the cat. Comes in over the top or takes your legs — and you have to guess which.',
  difficulty: 2,
  palette: {
    /* No `kit.scarf`. The rig has one and it is a short pair of tails
       falling off the throat — fine on a cat who is wearing a scarf, no
       use at all to a cat whose scarf IS his silhouette. The one in
       `look` is real geometry, goes into the outline, and streams.

       No `sock` either. It painted his leading shin and foot cream, which
       is Mario's colouring exactly and put the two of them one step
       closer together rather than further apart. His legs run black to
       the floor now.

       `longhair` is off for the same reason: it lays a ruff wider than
       the body behind the trunk and thickens the tail by a third, which
       is bulk, and bulk is the twin he is not. */
    kit: {},
    fur: '#433b3d', fur2: '#2c2628', belly: '#f8f5ee', marks: '#1b1719',
    eye: '#cdd94a', nose: '#e8a2ac', inner: '#c98d95',
    accent: '#2f9e63', accessory: 'none', pattern: 'tuxedo',
    tailTip: '#433b3d',
    line: 'rgba(12,10,11,.6)'
  },
  stats: { walkF: 1.86, walkB: 1.62, jumpVy: 10.2, jumpVx: 3.7, gravity: 0.46,
           health: 600, stunMax: 92, weight: 0.88, hasDash: true },
  mod: { reach: 1.00, damage: 0.90, speed: 0.86 },
  specials: [
    {
      id: 'flyingbody', name: 'Flying Body Attack',
      desc: 'He leaves the floor and arrives shoulder first. An overhead, so crouch-blocking does not stop it.', kind: 'special',
      motion: 'qcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 9, active: 16, recovery: 20,
      damage: [56, 64, 72], stun: [14, 16, 18], chip: 7,
      hitstun: 20, blockstun: 13, knockdown: 'soft',
      /* he is in the air, so it has to be blocked standing */
      hitLevel: 'overhead',
      pushback: 3.0, blockPushback: 3.6,
      airborne: [7, 30],
      hitbox: { x: 8, y: 22, w: 50, h: 40 },
      meterGain: 16, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.flyWind },
             { at: 10, p: Ps.flyBody }, { at: 24, p: Ps.flyBody },
             { at: 30, p: Ps.flyLand }, { at: 45, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 7) {
          f.vy = 5.6 + strength * 0.5;
          f.vx = f.facing * (5.2 + strength * 0.7);
          f.grounded = false;
        }
      }
    },
    {
      id: 'legsweep', name: 'Leg Sweep',
      desc: 'Low, fast, and a hard knockdown. Eight frames of startup — the quickest thing he has for interrupting.', kind: 'special',
      motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 8, active: 6, recovery: 22,
      damage: [30, 34, 38], stun: [9, 10, 12], chip: 5,
      hitstun: 18, blockstun: 12, hitLevel: 'low', knockdown: 'hard',
      pushback: 2.6, blockPushback: 3.0,
      lowProfile: [6, 16],
      hitbox: { x: 12, y: 0, w: 52, h: 18 },
      meterGain: 15, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.sweepWindL },
             { at: 8, p: Ps.sweepLow }, { at: 14, p: Ps.sweepLow },
             { at: 20, p: Ps.sweepWindL }, { at: 36, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr >= 6 && fr < 14) f.vx = f.facing * (2.6 + strength * 0.4);
      }
    }
  ],
  supers: [{
    id: 'superFly', name: 'OVER THE TOP',
    desc: 'Thirty active frames of him in the air, overhead the whole way, invincible for the first ten.', motion: 'qcfx2',
    buttons: ['LK', 'MK', 'HK'], cost: 100,
    startup: 8, active: 30, recovery: 26, freeze: 26,
    damage: 34, stun: 7, chip: 7, multiHit: 5, hitGap: 6,
    hitstun: 18, blockstun: 12, hitLevel: 'overhead', knockdown: 'hard',
    pushback: 2.0, blockPushback: 3.0,
    invuln: [0, 10], airborne: [6, 40],
    hitbox: { x: 6, y: 20, w: 56, h: 46 },
    anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.flyWind },
           { at: 10, p: Ps.flyBody }, { at: 22, p: Ps.jumpKick },
           { at: 32, p: Ps.flyBody }, { at: 44, p: Ps.flyLand },
           { at: 64, p: Ps.stand }],
    moveSelf: function (f, fr) {
      if (fr === 6) { f.vy = 6.4; f.vx = f.facing * 5.4; f.grounded = false; }
      if (fr > 6 && fr < 34) f.vy += 0.20;
    }
  }]
  };
})();
