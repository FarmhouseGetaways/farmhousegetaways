/* =====================================================================
   4 — LILLY. Siamese, and built entirely out of angles.

   LIGHT: the fastest cat on the roster and the easiest to hurt. Both her
   moves leave the ground, which is where she wants to be.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  /* The belt, the knot and the weave, handed from `pieces` to `overlay`.
     `drawForm` runs after every costume layer and paints the near thigh's
     quad and hamstring on top of anything hanging over the leg, so the
     gold band had a grey-green smear across it in every guarding pose.
     Nothing in a cat file can be drawn after drawForm except `overlay`, so
     the belt goes into the shape list flat — which is all it is needed
     there for, since what it is doing in the list is putting itself into
     the contour and the silhouette — and `overlay` lays the three tones
     and the weave back over the top. Mario's apron had the same problem
     and this is his fix. Build and paint run back to back inside one
     drawCat call, so there is nothing to go stale in between. */
  var stash = null;

  CF.CatDefs.lilly = {
  id: 'lilly',
  weightClass: 'light',
    /* Poised on the back leg with the front one light, lead paw high and
       open, torso up. Everything about her is ready to leave the ground.

       `py` is 0 and not the 2 it was. She has the longest limbs on the
       roster (limb 1.20) and the smallest scale, and py is in POSE units
       while the legs scale with the build — so a raised pelvis that looked
       right standing left her hovering six units off the floor the moment
       the crouch folded those long legs up under her. Two tests catch it
       and both name this file. The height she wanted comes from the torso
       and the arms instead, which cost nothing on the ground. */
  stance: { torso: 3, py: 0, armF: [26, -38], armB: [-6, 10],
            legF: [-10, -8], legB: [-10, 20] },
  build: { s: 0.96, girth: 0.82, limb: 1.20, head: 0.94, muscle: 1.25,
           headShape: 'narrow', ear: 'tall', shoulder: 0.88, waist: 0.76, limbW: 0.80 },
  /* ---- HER LOOK ---------------------------------------------------------

     The Chun-Li slot, and the one cat on the roster who is hardly ever
     standing on the floor. So the costume is built to be read in the AIR:
     a short fighting dress with the hem cut away high at the front and
     trailing long at the back, a wide sash with two streamers off it, and
     ribbons at both wrists. Four things that move when she does.

     The first pass was a plain tunic and it was useless — a rectangle of
     colour on a cream cat, the same black shape as everybody else. What
     makes her silhouette hers is the CLOTH BEHIND HER: the streamers and
     the long back point of the skirt run out past her tail, so even at
     384x224 the outline says "something is trailing off this one".

     Angles, not curves. Gracie's gi is frayed and soft; Lilly's hem is cut
     with lineTo and every corner is sharp, because she is the angular cat
     and because two rounded skirts in a six-cat line-up is one too many. */
  look: {
    pieces: function (A, j, f) {
      /* Deep jade against her cream, gold at the waist and the ankles so
         the metal on her reads as one set. A red sash was tried first and
         put her in Mario's and Gracie's colour; gold keeps her elegant and
         is the one value that survives a dark stage.

         SILK is a fourth colour and not a fourth tone of the third. The
         belt is a hard woven band and the streamers are light silk, and
         two materials cut from one swatch read as one material however
         they are shaded — so the streamers are paler, greener and lower
         in contrast than the band they are tied to. */
      var DRESS = '#3a838a', FOLD = '#215a63', SASH = '#e6b755', KNOT = '#b3812f';
      var SILK = '#eec674';

      /* Her points, copied out of the palette below because a costume is
         handed the FUR tones and never the marking ones. Her ears, arms,
         legs and tail are all `palette.marks`; fur added at any of those
         places has to match or it reads as a piece of kit rather than as
         part of the animal. THIGH is `shade(marks, 0.10)`, which is what
         the rig fills the near thigh with. */
      var MARK = '#4a352b', THIGH = '#5c4940';

      /* Everything hangs off the spine. T(t, w): t is 0 at the pelvis and 1
         at the neck, w is sideways with + towards the front. Negative t is
         below the pelvis, which is where the hem and the streamers live. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;
      function T(t, w) { return { x: p.x + dx * t + fx * w, y: p.y + dy * t + fy * w }; }
      function line(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, q.y); }

      var sway = Math.max(-6, Math.min(9, f.sway));

      /* ================= FUR ON THE SILHOUETTE =========================

         The biggest single thing separating a drawn sprite from a piece of
         vector art, and the one this cat had none of. Every edge on her
         was a smooth curve: two smooth triangles for ears, a smooth oval
         for a skull, four smooth tubes for limbs. A real cat's outline is
         notched — it breaks at the ear, the cheek, the elbow, the back of
         the thigh — and those notches are what the eye reads as FUR
         rather than as a shape that happens to be cat-coloured.

         `fringe` is one polygon, not n spikes: a zigzag out and a straight
         line back underneath. One shape means one contour stroke and one
         fill instead of n of each, and no seam where two spikes meet.

         WHY THIS DOES NOT COME OUT RINGED IN BLACK. The rig strokes every
         shape in the contour colour BEFORE it fills any of them, so a
         piece's halo is painted out by anything filled after it. A fringe
         added straight after the limb it grows on therefore keeps its
         outline only where it stands proud of that limb — which is exactly
         the part that is doing the work.

         Keep them big. At 384x224 her whole head is nineteen pixels
         across, so a tuft under about three pixels long is a dirty edge
         rather than a tuft, and the contour eats one and three quarters of
         those pixels from each side. Three or four spikes, never eight. */
      function unit(ax, ay) { var l = Math.hypot(ax, ay) || 1; return { x: ax / l, y: ay / l }; }

      /* The outward direction at a bend — the side of the elbow the point
         of the elbow is on. Same construction `drawForm` uses for a
         crease, negated. A straight limb has no outside, so it falls back
         to running on up past the joint, which is where fur at an elbow
         lies when the arm is out straight. */
      function corner(a, b, c) {
        var u1 = unit(a.x - b.x, a.y - b.y), u2 = unit(c.x - b.x, c.y - b.y);
        var mx = -(u1.x + u2.x), my = -(u1.y + u2.y);
        var ml = Math.hypot(mx, my);
        if (ml < 0.34) { var d = unit(b.x - c.x, b.y - c.y); return { x: d.x, y: d.y, bend: 0 }; }
        return { x: mx / ml, y: my / ml, bend: Math.min(1, ml / 1.3) };
      }

      /* at   the middle of the root line, sitting ON the edge it grows from
         out  unit vector the spikes point in
         span how wide the run of them is
         len  the longest spike
         prof one entry per spike, its length as a fraction of `len` — never
              all the same number, because a matched pair of anything reads
              as a decal and a matched row of five reads as a comb
         lean how far the tips are dragged sideways, so the fur lies
         bury how far the root line sits back inside the parent shape */
      function fringe(cx, at, out, span, len, prof, lean, bury) {
        var ax = -out.y, ay = out.x;
        var nSp = prof.length, i, k, pts = [];
        for (i = 0; i <= nSp; i++) {
          k = (i / nSp - 0.5) * span;
          pts.push({ x: at.x + ax * k, y: at.y + ay * k });
          if (i < nSp) {
            var kt = ((i + 0.5) / nSp - 0.5) * span;
            var ln2 = len * prof[i];
            pts.push({ x: at.x + ax * (kt + ln2 * lean) + out.x * ln2,
                       y: at.y + ay * (kt + ln2 * lean) + out.y * ln2 });
          }
        }
        cx.beginPath();
        cx.moveTo(pts[0].x, pts[0].y);
        for (i = 1; i < pts.length; i++) cx.lineTo(pts[i].x, pts[i].y);
        var e = pts[pts.length - 1];
        cx.lineTo(e.x - out.x * bury, e.y - out.y * bury);
        cx.lineTo(pts[0].x - out.x * bury, pts[0].y - out.y * bury);
        cx.closePath();
      }

      /* --- the ears. She and Luigi are the two `tall` ears on the roster
             and hers are the ones that have to be unmistakable, so they get
             the lynx tips.

             The numbers below mirror EARS.tall in rig.js — h 1.34, w 0.86,
             lean 0.14 — because a cat file cannot ask the rig where its own
             ear went. If the lead ever retunes that row, re-render her head
             and move these with it. --- */
      /* A point on the OUTER edge of one ear, `t` of the way up it, with
         the direction that edge faces. Outward is `sign(sx)` and nothing
         cleverer: the first cut took the normal that faced away from the
         ear's leading edge, which on the near ear is the side facing the
         OTHER ear — so both ears grew their fur into the gap between
         them, filled it in, buried the pin and turned a pair of tall
         spikes into a torn crown. The gap is the whole reason the pin is
         there. Fur goes on the outside of the pair and nowhere else. */
      function earAt(sx, t) {
        var r = j.headR, w = 0.86, h = 1.34, ln = 0.14 * sx;
        var root = { x: sx * r * 0.34 * w, y: r * 0.56 };
        var frt  = { x: sx * r * 1.02 * w, y: r * 0.40 };
        var tip  = { x: sx * r * (0.96 + ln * 2) * w, y: r * 1.60 * h };
        var bx = (root.x + frt.x) / 2, by = (root.y + frt.y) / 2;
        var half = Math.hypot(frt.x - root.x, frt.y - root.y) / 2;
        var d = unit(tip.x - bx, tip.y - by);
        var nA = { x: -d.y, y: d.x };
        var out = (nA.x * sx > 0) ? nA : { x: d.y, y: -d.x };
        var hw = half * (1 - t * 0.88);
        return { at: { x: bx + (tip.x - bx) * t + out.x * hw,
                       y: by + (tip.y - by) * t + out.y * hw },
                 out: out, up: d };
      }
      /* The near ear carries three notches and a ragged tip, the far one
         two, lower down and shorter. Nothing on a real animal is
         mirrored, and a matched pair of ear tufts is the first thing that
         gives away a figure built out of one half flipped. */
      A.add('head', function (cx) {
        var e = earAt(1, 0.46);
        fringe(cx, e.at, e.out, j.headR * 0.80, j.headR * 0.30,
               [0.60, 1, 0.72], 0.36, j.headR * 0.26);
      }, MARK, { flat: true });
      A.add('head', function (cx) {
        var e = earAt(1, 0.95);
        fringe(cx, e.at, e.up, j.headR * 0.20, j.headR * 0.26, [1, 0.42], 0.20, j.headR * 0.26);
      }, MARK, { flat: true });
      A.add('head', function (cx) {
        var e = earAt(-0.76, 0.36);
        fringe(cx, e.at, e.out, j.headR * 0.52, j.headR * 0.24, [0.72, 1], 0.32, j.headR * 0.22);
      }, MARK, { flat: true });

      /* --- the cheek. `narrow` has cheek 0.04, which `cheekPath` throws
             away entirely — so her skull is a bare ellipse and the head
             has no fur in its outline at all. A full ruff would cost her
             the elegance she is built out of, so this is three short
             wisps at the back of the JAW and nothing on the crown: the
             outline breaks where a Siamese's coat actually shows in
             profile, and the top of her stays clean.

             It is drawn in the far cheek's tone rather than in `fur`. The
             back of the skull is the darkest thing on her head, and a
             wisp of undiluted cream out of it read as a bone. --- */
      A.add('head', function (cx) {
        var r = j.headR, a2 = 220 * Math.PI / 180;
        var at = { x: Math.cos(a2) * r * 0.80, y: Math.sin(a2) * r * 1.20 };
        var out = unit(Math.cos(a2) / 0.80, Math.sin(a2) / 1.20);
        fringe(cx, at, out, r * 0.60, r * 0.21, [0.62, 1, 0.55, 0.74], -0.34, r * 0.22);
      }, '#94826a', { flat: true });

      /* --- the elbows. Both of them, because the far arm on a points cat
             is one flat dark tube from shoulder to fist and it is the
             emptiest shape on her. They grow with the bend: an arm out
             straight has no elbow to carry fur. --- */
      var eF = corner(j.shF, j.elbF, j.handF);
      A.add('front', function (cx) {
        var at = { x: j.elbF.x + eF.x * f.R_MID * 0.72, y: j.elbF.y + eF.y * f.R_MID * 0.72 };
        fringe(cx, at, eF, f.R_MID * 2.0, f.R_MID * (0.50 + 0.85 * eF.bend),
               [0.72, 1, 0.60], 0.28, f.s * 1.6);
      }, f.furFront, { flat: true });
      var eB = corner(j.shB, j.elbB, j.handB);
      A.add('far', function (cx) {
        var at = { x: j.elbB.x + eB.x * f.R_MID * 0.62, y: j.elbB.y + eB.y * f.R_MID * 0.62 };
        fringe(cx, at, eB, f.R_MID * 1.7, f.R_MID * (0.40 + 0.70 * eB.bend),
               [1, 0.66], 0.24, f.s * 1.6);
      }, MARK, { flat: true });

      /* --- the breeches, off the back of the near thigh. A long-haired
             cat's trousers, and the one place on a fighter where fur can
             stand out far enough to change the outline without getting in
             the way of a limb. --- */
      var tdir = unit(j.kneeF.x - j.hipF.x, j.kneeF.y - j.hipF.y);
      var tb = tdir.y < 0 ? { x: tdir.y, y: -tdir.x } : { x: -tdir.y, y: tdir.x };
      if (tb.x > 0) { tb = { x: -tb.x, y: -tb.y }; }
      A.add('front', function (cx) {
        var g = 0.34;
        var at = { x: j.hipF.x + (j.kneeF.x - j.hipF.x) * g + tb.x * f.R_TOP * 1.02,
                   y: j.hipF.y + (j.kneeF.y - j.hipF.y) * g + tb.y * f.R_TOP * 1.02 };
        fringe(cx, at, tb, f.R_TOP * 2.3, f.R_TOP * 0.62, [0.66, 1, 0.74], 0.34, f.s * 1.8);
      }, THIGH, { flat: true });

      /* --- and the back of the calf, above the anklet. Small, because
             below the knee she is nearly all outline already. --- */
      var sdir = unit(j.footF.x - j.kneeF.x, j.footF.y - j.kneeF.y);
      var sb = sdir.y < 0 ? { x: sdir.y, y: -sdir.x } : { x: -sdir.y, y: sdir.x };
      if (sb.x > 0) { sb = { x: -sb.x, y: -sb.y }; }
      A.add('front', function (cx) {
        var g = 0.46;
        var at = { x: j.kneeF.x + (j.footF.x - j.kneeF.x) * g + sb.x * f.R_MID * 0.82,
                   y: j.kneeF.y + (j.footF.y - j.kneeF.y) * g + sb.y * f.R_MID * 0.82 };
        fringe(cx, at, sb, f.R_MID * 1.5, f.R_MID * 0.72, [1, 0.64], 0.30, f.s * 1.6);
      }, MARK, { flat: true });

      /* --- and the same two notches on the FAR leg, which had neither —
             and it is the leg her whole kit is built around. Crane Kick,
             Flip Attack and her super all throw this leg out straight and
             full length while the near one plants, so a bare brown tube
             here was on screen more than the pair built for the other
             side. 'far' pours right after the back leg is filled and
             before the torso goes down over it, which is exactly where a
             piece belonging to that leg has to land so it is not painted
             out the moment she stands normally.

             Not traced off the near pair — a shorter reach on the thigh,
             a different spike count on the calf — because a matched left
             and right is the surest tell that a figure was built out of
             one half flipped over. */
      var tdirB = unit(j.kneeB.x - j.hipB.x, j.kneeB.y - j.hipB.y);
      var tbB = tdirB.y < 0 ? { x: tdirB.y, y: -tdirB.x } : { x: -tdirB.y, y: tdirB.x };
      if (tbB.x > 0) { tbB = { x: -tbB.x, y: -tbB.y }; }
      A.add('far', function (cx) {
        var g = 0.30;
        var at = { x: j.hipB.x + (j.kneeB.x - j.hipB.x) * g + tbB.x * f.R_TOP * 0.94,
                   y: j.hipB.y + (j.kneeB.y - j.hipB.y) * g + tbB.y * f.R_TOP * 0.94 };
        fringe(cx, at, tbB, f.R_TOP * 1.9, f.R_TOP * 0.50, [0.72, 1, 0.56], 0.30, f.s * 1.7);
      }, MARK, { flat: true });

      var sdirB = unit(j.footB.x - j.kneeB.x, j.footB.y - j.kneeB.y);
      var sbB = sdirB.y < 0 ? { x: sdirB.y, y: -sdirB.x } : { x: -sdirB.y, y: sdirB.x };
      if (sbB.x > 0) { sbB = { x: -sbB.x, y: -sbB.y }; }
      A.add('far', function (cx) {
        var g = 0.42;
        var at = { x: j.kneeB.x + (j.footB.x - j.kneeB.x) * g + sbB.x * f.R_MID * 0.74,
                   y: j.kneeB.y + (j.footB.y - j.kneeB.y) * g + sbB.y * f.R_MID * 0.74 };
        fringe(cx, at, sbB, f.R_MID * 1.2, f.R_MID * 0.56, [1, 0.60], 0.26, f.s * 1.5);
      }, MARK, { flat: true });

      /* A tail-base flare was tried here and pulled again: the sash and the
         long trailing point of the skirt already own this exact patch of
         her — both drawn in later layers so any fur put down first vanished
         under gold cloth in every pose that was checked. The costume IS the
         notch at the root of her tail; a second one under it would be spent
         detail nobody sees. Left as a note so it is not tried again the
         same way.

         A ribbon: a strip that leaves a point at `ang`, bends by `curl`
         along its length and tapers to a swallowtail. Built as an outline
         rather than a stroked line because a stroke cannot taper, and a
         ribbon the same width at the tip as at the knot is a length of
         hose. Six segments — at four the bend is visibly faceted. */
      function ribbon(cx, ax, ay, ang, len, wid, curl, wave, rip) {
        var N = 8, pts = [], i, x = ax, y = ay, th = ang;
        for (i = 0; i <= N; i++) {
          pts.push({ x: x, y: y, th: th, w: Math.max(0.5, wid * (1 - 0.70 * i / N)) });
          x += Math.cos(th) * (len / N);
          y += Math.sin(th) * (len / N);
          /* curl is the steady droop; the sine on top is the ripple running
             down it. Without the ripple a long streamer is a circular arc,
             which at this length reads as a plank rather than as cloth.

             `rip` is how deep that ripple cuts, and it is per-ribbon
             because the amount of it IS the material. The long streamer is
             light silk and takes a lot; the short belt end is the same
             stuff the band is cut from and takes half as much; a wrist
             ribbon four times shorter takes barely any, or it comes out
             as a corkscrew. One number at 0.14 for all three had them all
             behaving like the same cloth. */
          th += curl / N + Math.sin(i / N * Math.PI * 2.2 + (wave || 0)) * (rip === undefined ? 0.14 : rip);
        }
        cx.beginPath();
        for (i = 0; i <= N; i++) {
          var q = pts[i];
          var nx = -Math.sin(q.th) * q.w, ny = Math.cos(q.th) * q.w;
          if (i === 0) cx.moveTo(q.x + nx, q.y + ny); else cx.lineTo(q.x + nx, q.y + ny);
        }
        var e = pts[N], ex = Math.cos(e.th), ey = Math.sin(e.th);
        var enx = -Math.sin(e.th) * e.w, eny = Math.cos(e.th) * e.w;
        cx.lineTo(e.x + enx + ex * e.w * 1.6, e.y + eny + ey * e.w * 1.6);
        cx.lineTo(e.x + ex * e.w * 0.5, e.y + ey * e.w * 0.5);   /* the notch */
        cx.lineTo(e.x - enx + ex * e.w * 1.6, e.y - eny + ey * e.w * 1.6);
        for (i = N; i >= 0; i--) {
          var q2 = pts[i];
          cx.lineTo(q2.x + Math.sin(q2.th) * q2.w, q2.y - Math.cos(q2.th) * q2.w);
        }
        cx.closePath();
      }

      /* --- the two sash streamers. On 'back' and 'front' rather than both
             behind her: a sash tied at the waist has one end on the near
             side of the body and one on the far side, and putting both on
             'back' hid them under the tail, which is the widest dark shape
             on the cat. Different lengths and different bends — a matched
             pair reads as a printed decal. --- */
      var drift = Math.sin(f.t * 0.075) * 0.10;
      A.add('back', function (cx) {
        var k1 = T(0.34, -f.hipW * 1.05);
        ribbon(cx, k1.x, k1.y, Math.PI + 0.14 - sway * 0.045 + drift,
               L * 1.45, f.hipW * 0.52, 0.86 + sway * 0.02, f.t * 0.10, 0.23);
      }, SILK, { edge: true });

      /* --- the dress. Fitted through the waist, cut away at the shoulders
             so the deltoids stay in the outline, on 'body' so the near arm
             passes in front of the cloth. --- */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(0.22, f.hipW * 1.10), T(0.46, f.waistW * 1.22),
          T(0.70, f.chestW * 1.04), T(0.92, f.chestW * 1.12),
          T(1.06, f.chestW * 0.38), T(1.08, -f.chestW * 0.44),
          T(0.98, -f.chestW * 1.14), T(0.60, -f.chestW * 1.20),
          T(0.38, -f.waistW * 1.30), T(0.18, -f.hipW * 1.14)
        ]);
      }, DRESS, { band: true, edge: true });

      /* ONE crease on the bodice, and only one.

         It is seventeen pixels across at 384x224 and a second line on it
         turns to noise — nine folds were drawn here first and at game size
         the whole front of her went to grey hatching. This is the single
         pull a fitted dress actually makes on a twisted torso, running
         from the lead armpit down to the far hip, and it says waist and
         ribcage in one stroke.

         The tone is `A.shade(DRESS, 0.46)`, which is the SAME shadow the
         rig's own cel shading lays on this cloth — so the dress still
         carries three tones and not four. Any other number here and the
         crease is a stripe of a colour that appears nowhere else on her.

         It goes into the list straight after the dress on purpose. The rig
         strokes every shape in the contour colour before it fills any of
         them, so the dress's own fill paints this piece's black halo out;
         and the near arm is drawn after the whole 'body' layer, so an arm
         crossing the chest covers the crease instead of the crease
         crossing the arm. */
      A.add('body', function (cx) {
        cx.beginPath();
        var a = T(0.90, f.chestW * 0.40); cx.moveTo(a.x, a.y);
        line(cx, 0.82, f.chestW * 0.66);
        line(cx, 0.34, -f.hipW * 0.66);
        line(cx, 0.28, -f.hipW * 0.26);
        cx.closePath();
      }, A.shade(DRESS, 0.46), { flat: true });

      /* the standing mandarin collar. It is here for the SILHOUETTE — a
         collar that only shows as a colour change on the neck is worth
         nothing, one that stands proud of it changes the shape of her
         shoulders and neck against the sky. */
      A.add('body', function (cx) {
        cx.beginPath();
        var a = T(0.96, f.chestW * 0.46); cx.moveTo(a.x, a.y);
        line(cx, 1.24, f.chestW * 0.54);
        line(cx, 1.30, -f.chestW * 0.16);
        line(cx, 1.26, -f.chestW * 0.72);
        line(cx, 0.96, -f.chestW * 0.78);
        line(cx, 0.98, -f.chestW * 0.10);
        cx.closePath();
      }, FOLD, { band: true, edge: true });

      /* --- the skirt, and the slit. The hem is a straight diagonal: high
             at the front so the lead thigh is bare from the hip down, long
             at the back so there is cloth streaming past her legs. That
             diagonal is the whole silhouette idea — a symmetrical hem is
             Gracie's, and a symmetrical hem on an acrobat looks like she is
             standing still. On 'front' so it hangs OVER the near thigh. --- */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.30, f.hipW * 1.08); cx.moveTo(a.x, a.y);
        line(cx, 0.06, f.hipW * 1.62);
        line(cx, -0.16, f.hipW * 1.22);      /* the top of the slit */
        line(cx, -0.40, -f.hipW * 0.10);
        line(cx, -0.72, -f.hipW * 1.00);     /* the long trailing point */
        line(cx, -0.48, -f.hipW * 1.70);
        line(cx, -0.04, -f.hipW * 1.76);
        line(cx, 0.16, -f.hipW * 1.40);
        line(cx, 0.30, -f.hipW * 1.10);
        cx.closePath();
      }, DRESS, { band: true, edge: true });

      /* --- the folds in the skirt.

             The skirt is the biggest piece of cloth on her — twenty-four
             pixels by thirty-two at game size — and until now it was one
             flat teal shape with a lit edge, which is what makes cloth
             read as painted card. Three folds hung off the hip it is
             gathered at: two shadows and one catching the light between
             them, all in the tones the cel shading already uses on this
             material, none of them reaching the hem.

             They stop short of the hem deliberately. A fold that runs all
             the way down cuts the one long diagonal that IS her
             silhouette into three short ones. --- */
      function fold(cx, pts) {
        cx.beginPath();
        var a = T(pts[0][0], f.hipW * pts[0][1]); cx.moveTo(a.x, a.y);
        for (var q = 1; q < pts.length; q++) line(cx, pts[q][0], f.hipW * pts[q][1]);
        cx.closePath();
      }
      A.add('front', function (cx) {
        fold(cx, [[0.21, 0.92], [0.16, 0.68], [-0.12, 0.54], [-0.09, 0.86]]);
      }, A.shade(DRESS, 0.46), { flat: true });
      A.add('front', function (cx) {
        fold(cx, [[0.17, 0.30], [0.12, 0.06], [-0.25, -0.34], [-0.20, -0.02]]);
      }, A.shade(DRESS, 0.46), { flat: true });
      /* the one lit fold, narrower than either shadow — cloth catches the
         light on a ridge and loses it over a whole panel */
      A.add('front', function (cx) {
        fold(cx, [[0.19, 0.58], [0.17, 0.44], [-0.17, 0.20], [-0.15, 0.38]]);
      }, A.lit(DRESS, 0.36), { flat: true });

      /* Gold piping along the hem, laid over the skirt.

         Gold on the collar rim was tried first, on the theory that she
         needed a highlight at the TOP of the figure — and it never appeared
         once, because the head is drawn after the body layer and sat on top
         of it in every pose. This is the same idea in the place it can be
         seen. It follows the one long straight diagonal on her, so at game
         size it is a defined edge rather than noise, and it makes the
         biggest shape in the costume read on a dark stage as well as a
         bright one. A border all the way round was tried and lost the
         diagonal in a teal outline; only the cut edge carries it. */
      A.add('front', function (cx) {
        var hem = [[-0.16, 1.22], [-0.40, -0.10], [-0.72, -1.00], [-0.48, -1.70]];
        cx.beginPath();
        var a = T(hem[0][0], f.hipW * hem[0][1]); cx.moveTo(a.x, a.y);
        for (var q = 1; q < hem.length; q++) line(cx, hem[q][0], f.hipW * hem[q][1]);
        for (q = hem.length - 1; q >= 0; q--) line(cx, hem[q][0] + 0.085, f.hipW * hem[q][1] * 0.90);
        cx.closePath();
      }, SASH, { edge: true, flat: true });

      /* --- the wide sash, over both. Wider than the dress at that height
             so it reads as a band laid on top and not a stripe printed on
             it, and gold, which is the one hard value break on a cat who is
             cream above and dark brown below. --- */
      function sashPath(cx) {
        cx.beginPath();
        var a = T(0.10, f.hipW * 1.28); cx.moveTo(a.x, a.y);
        line(cx, 0.40, f.hipW * 1.14);
        line(cx, 0.44, -f.hipW * 1.22);
        line(cx, 0.12, -f.hipW * 1.36);
        cx.closePath();
      }
      /* Three cross threads in the band.

         The dress, the band and the streamers were all shaded by one
         recipe, which is most of why they read as the same stuff dyed
         three colours. A belt is a HARD weave: it does not drape, it does
         not ripple, and what says so at ninety pixels is a repeat across
         it. Three of them, uneven in spacing and in length, because four
         evenly spaced ones read as a machined part.

         One path holding three subpaths, so it costs one fill and not
         three. */
      function weavePath(cx) {
        var ticks = [[0.74, 1.00], [0.06, 0.80], [-0.72, 0.92]];
        var hw = Math.max(0.62, f.hipW * 0.10), q;
        cx.beginPath();
        for (q = 0; q < ticks.length; q++) {
          var w0 = f.hipW * ticks[q][0], t0 = 0.175, t1 = 0.175 + 0.19 * ticks[q][1];
          var a = T(t0, w0 - hw); cx.moveTo(a.x, a.y);
          line(cx, t1, w0 - hw); line(cx, t1, w0 + hw); line(cx, t0, w0 + hw);
          cx.closePath();
        }
      }
      function knotPath(cx) {
        var k = T(0.24, -f.hipW * 1.02);
        A.ellipse(cx, k.x, k.y, f.hipW * 0.42, f.hipW * 0.34, 0.25);
      }
      /* Both go into the list FLAT, which is all the list needs them for —
         what they are doing there is putting themselves into the contour
         and into the silhouette. The three tones go on in `overlay`, after
         `drawForm` has finished painting fur-coloured muscle over the top
         of them. See the note on the overlay itself. */
      A.add('front', sashPath, SASH, { flat: true });
      A.add('front', knotPath, KNOT, { flat: true });

      /* the near end of the sash, added AFTER the skirt on purpose — added
         before it, the skirt painted straight over it and only one streamer
         ever showed.

         The pair went wrong twice before this. Both long, both gold and both
         leaving at the same angle read as a gold X behind her hips — two
         crossed swords, and they buried the skirt. They now differ in every
         way that matters: this one leaves BELOW the sash and falls steeply,
         it is two thirds the length, and it is the darker gold, so the eye
         takes the long flat one first and this one second. */
      A.add('front', function (cx) {
        var k2 = T(0.06, -f.hipW * 1.55);
        ribbon(cx, k2.x, k2.y, Math.PI + 0.92 - sway * 0.045 - drift,
               L * 0.95, f.hipW * 0.38, 0.34 - sway * 0.02, f.t * 0.10 + 1.9);
      }, KNOT, { edge: true });

      /* --- the pin.

             Lilly and Luigi are both `ear: 'tall'`, and turned black they
             were the same pair of spikes on the same narrow skull. Widening
             her ears would have cost her the elegance, which is the whole
             point of her, so the difference goes in the GAP between them:
             a gold pin leaning back out of the crown with a diamond head.
             The first cut had a three-pointed fan on it and sat hard against
             the far ear, where it read as a gold lightning bolt stuck to the
             side of her head; one diamond, and moved forward into the middle
             of the gap, reads as an ornament. It never crosses an ear — Gracie's headband tails taught
             everybody that at this size anything laid over an ear wins the
             ear — it only fills the notch, so from a distance she reads as
             two spikes with something between them and he reads as two
             spikes. Head layer, so it is cel-shaded with the skull and sits
             under the face. --- */
      A.add('head', function (cx) {
        var r = j.headR;
        cx.beginPath();
        cx.moveTo(0.20 * r, 0.74 * r);           /* the shaft, out of the crown */
        cx.lineTo(0.04 * r, 1.88 * r);
        cx.lineTo(-0.20 * r, 2.10 * r);          /* the head: one diamond */
        cx.lineTo(-0.04 * r, 2.40 * r);
        cx.lineTo(0.20 * r, 2.14 * r);
        cx.lineTo(0.16 * r, 1.84 * r);
        cx.lineTo(0.04 * r, 0.70 * r);
        cx.closePath();
      }, SASH, { edge: true });

      /* --- the wrist ribbons.

             First go was a long streamer off each hand. At game size it sat
             directly in front of the fist and read as a gold banana she was
             holding — the worst kind of failure, because it was legible and
             legible as the wrong thing. What she wears now is a CUFF at the
             wrist with a short end trailing off the back of it: the cuff is
             a hard dark band across a cream forearm, which is the part that
             actually reads at 90 pixels, and the end only ever appears
             behind the arm where there is nothing to confuse it with. --- */
      function cuff(layer, h, e, col, k) {
        var ax = h.x - (h.x - e.x) * 0.42, ay = h.y - (h.y - e.y) * 0.42;
        var ang = Math.atan2(h.y - e.y, h.x - e.x);
        A.add(layer, function (cx) {
          var nx = -Math.sin(ang), ny = Math.cos(ang);
          var lx = Math.cos(ang), ly = Math.sin(ang);
          var w = f.R_MID * 1.28 * k.w, l = f.R_MID * 0.72 * k.w;
          cx.beginPath();
          cx.moveTo(ax + nx * w + lx * l, ay + ny * w + ly * l);
          cx.lineTo(ax - nx * w + lx * l * 0.82, ay - ny * w + ly * l * 0.82);
          cx.lineTo(ax - nx * w - lx * l, ay - ny * w - ly * l);
          cx.lineTo(ax + nx * w - lx * l * 0.82, ay + ny * w - ly * l * 0.82);
          cx.closePath();
        }, col, { edge: true, flat: true });
        A.add(layer, function (cx) {
          ribbon(cx, ax, ay, Math.PI + k.ang - sway * 0.030 + drift * 1.4,
                 L * k.len, f.hipW * 0.20, k.curl, 0, 0.07);
        }, col, { edge: true, flat: true });
      }
      /* The far cuff belongs on 'far' and not on 'body'. 'far' is poured
         straight after the far fist, which is where a band round the far
         wrist actually is; on 'body' it was poured after the torso, so any
         pose that brings that hand across the chest — every guard, every
         block — painted the cuff on her belly instead. This is the exact
         thing the layer was added for.

         And the two of them are no longer the same object twice. The near
         one is the bigger band with the longer end, the far one is smaller
         and its ribbon leaves at a different angle, because a matched pair
         of anything on a cat is the loudest tell that the figure was built
         out of one half flipped over. */
      cuff('far', j.handB, j.elbB, FOLD, { w: 0.88, ang: 0.92, len: 0.30, curl: 0.72 });
      cuff('front', j.handF, j.elbF, FOLD, { w: 1.00, ang: 0.64, len: 0.44, curl: 0.48 });

      /* ---- her calf, taken back from `drawForm` for the same reason ----

         `drawForm` mixes its muscle tones from `fig.fur`, which on a seal
         point is the CREAM of her body — and then paints them on a leg
         that is dark brown, because on a points cat the rig fills the
         shins and feet with `palette.marks`. The result was two pale ivory
         ovals on her near shin, one at the knee and one above the anklet,
         and at game size they read as bandages.

         (Only the shin. `drawForm` means to clip its muscle to all four
         near segments at once and does not: `limbPath` opens with
         `beginPath`, so the four calls it stacks up before `clip()` leave
         only the LAST path standing — the near shin. That is a rig bug and
         a rig fix; it is written up in the report rather than worked
         around here. What it means for this file is that the shin is the
         only place her legs are being painted the wrong colour, so the
         shin is the only place that needs taking back.)

         One clip, the shin's own two tones laid back over the top of it,
         and then the calf drawn again in tones mixed from HER leg — so she
         does not lose the anatomy, she gets it in the right colour. The
         anklet has to go back on afterwards: `drawKit` puts it down
         between `drawForm` and here, so the repaint would bury it. */
      function inLeg(a, b, r, pts) {
        return function (cx) {
          var d = unit(b.x - a.x, b.y - a.y);
          var dl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          var px = -d.y, py = d.x, ring = [], q;
          for (q = 0; q < pts.length; q++) {
            ring.push({ x: a.x + d.x * dl * pts[q][0] + px * r * pts[q][1],
                        y: a.y + d.y * dl * pts[q][0] + py * r * pts[q][1] });
          }
          A.smooth(cx, ring);
        };
      }
      function shinPath(cx) {
        A.limb(cx, j.kneeF, j.footF, f.R_MID * 0.86, f.R_END * 0.80, 1.25, 'shin');
      }
      var legR = f.R_TOP * 0.86;
      function alongShin(g) {
        return { x: j.kneeF.x + (j.footF.x - j.kneeF.x) * g,
                 y: j.kneeF.y + (j.footF.y - j.kneeF.y) * g };
      }

      stash = {
        step: 4.2 * f.s, edgeW: 1.15 * f.s,
        shin: {
          path: shinPath, base: MARK, shadow: A.shade(MARK, 0.46),
          calf: [
            { p: inLeg(j.kneeF, j.footF, legR, [[0.02, -1.3], [0.52, -1.3], [0.62, -0.20], [0.08, -0.30]]),
              c: A.lit(MARK, 0.20) },
            { p: inLeg(j.kneeF, j.footF, legR, [[0.52, -1.3], [0.96, -1.3], [0.92, -0.40], [0.60, -0.24]]),
              c: A.shade(MARK, 0.30) }
          ],
          ankA: alongShin(0.74), ankB: alongShin(0.90),
          ankCol: '#d9b26a', ankW: 3.6 * f.s * f.G
        },
        items: [
          { path: sashPath, band: true, edge: true,
            shadow: A.shade(SASH, 0.46), base: SASH, lit: A.lit(SASH, 0.36) },
          { path: weavePath, flat: true, base: A.shade(SASH, 0.40) },
          { path: knotPath, band: true, edge: true,
            shadow: A.shade(KNOT, 0.46), base: KNOT, lit: A.lit(KNOT, 0.36) }
        ]
      };
    },

    /* The belt again, after `drawForm` has had its go at the torso.

       `drawForm` paints the pectoral, the lat and the line down the belly
       INSIDE the body outline, in tones mixed from the cat's FUR. That is
       right while the torso is fur and wrong the moment something is worn
       over it: the belly-line shape runs from t 0.15 to 0.46 and the band
       sits from 0.10 to 0.44, so a pale grey bar was being laid straight
       down the middle of the gold in every single pose, and at game size it
       read as a dent in the belt. Mario's apron had the same problem and
       this is his fix — nothing in a cat file can be drawn after drawForm
       except `overlay`.

       What follows is `celFill`'s recipe written out by hand: fill the
       piece in shadow, clip to it, lay the base tone back over shifted
       towards the light, then the lit band, then the base once more so the
       highlight comes out as a band and not a wash. The light direction is
       the rig's own (0.52, 0.85) — a piece of costume lit by a different
       lamp from the hip it is strapped to is worse than a piece of costume
       with no shading at all. */
    overlay: function (ctx, j, fig) {
      var st = stash;
      if (!st) return;
      var dx = 0.52 * st.step, dy = 0.85 * st.step, i;
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      var sn = st.shin;
      if (sn) {
        ctx.save();
        sn.path(ctx); ctx.clip();
        sn.path(ctx); ctx.fillStyle = sn.shadow; ctx.fill();
        ctx.save();
        ctx.translate(dx, dy);
        sn.path(ctx); ctx.fillStyle = sn.base; ctx.fill();
        ctx.restore();
        for (i = 0; i < sn.calf.length; i++) {
          sn.calf[i].p(ctx); ctx.fillStyle = sn.calf[i].c; ctx.fill();
        }
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = sn.ankCol; ctx.lineWidth = sn.ankW; ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(sn.ankA.x, sn.ankA.y);
        ctx.lineTo(sn.ankB.x, sn.ankB.y);
        ctx.stroke();
        ctx.restore();
      }

      for (i = 0; i < st.items.length; i++) {
        var it = st.items[i];
        if (it.flat) { it.path(ctx); ctx.fillStyle = it.base; ctx.fill(); }
        else {
          it.path(ctx); ctx.fillStyle = it.shadow; ctx.fill();
          ctx.save();
          it.path(ctx); ctx.clip();
          ctx.translate(dx, dy);
          it.path(ctx); ctx.fillStyle = it.base; ctx.fill();
          if (it.band) {
            ctx.translate(dx * 1.15, dy * 1.15);
            it.path(ctx); ctx.fillStyle = it.lit; ctx.fill();
            ctx.translate(dx * 0.9, dy * 0.9);
            it.path(ctx); ctx.fillStyle = it.base; ctx.fill();
          }
          ctx.restore();
        }
        if (it.edge) {
          it.path(ctx); ctx.strokeStyle = fig.line;
          ctx.lineWidth = st.edgeW; ctx.stroke();
        }
      }
      ctx.restore();
    }
  },
  displayName: 'LILLY',
  subtitle: 'The Acrobat',
  blurb: 'Seal point, blue eyes, and never on the floor for long. Hits like a rumour, but she is already behind you.',
  difficulty: 3,
  palette: {
    /* The acrobat. Anklets and a collar with a bell on it, so you can
       hear where she is going to be. */
    kit: { anklets: '#d9b26a' },
    fur: '#e2d5bd', fur2: '#c9b99c', belly: '#f6efe2', marks: '#4a352b',
    eye: '#69b0e8', nose: '#5a4038', inner: '#a8827a',
    muzzleColor: '#6b5042',
    accent: '#2f6f74', accessory: 'collar', pattern: 'siamese',
    tailTip: '#4a352b', longhair: true, points: true,
    line: 'rgba(48,36,28,.5)'
  },
  stats: { walkF: 2.02, walkB: 1.78, jumpVy: 10.6, jumpVx: 4.0, gravity: 0.44,
           health: 570, stunMax: 86, weight: 0.78, hasDash: true, airDash: true },
  mod: { reach: 1.05, damage: 0.82, speed: 0.80 },
  specials: [
    {
      id: 'flipattack', name: 'Flip Attack',
      desc: 'Straight up in four frames, invincible on the way. Her answer to anything coming down at her.', kind: 'special',
      motion: 'dp', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 4, active: 15, recovery: 22,
      damage: [70, 82, 94], stun: [16, 18, 20], chip: 7,
      hitstun: 21, blockstun: 12, knockdown: 'hard',
      pushback: 1.8, blockPushback: 3.2,
      invuln: [0, 6], airborne: [3, 32],
      hitbox: { x: -6, y: 36, w: 40, h: 56 },
      meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.stand }, { at: 3, p: Ps.flipWind },
             { at: 8, p: Ps.flipUp }, { at: 14, p: Ps.flipOver },
             { at: 22, p: Ps.flipDown }, { at: 30, p: Ps.land },
             { at: 41, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 2) { f.vy = 7.6 + strength * 0.6; f.vx = f.facing * 1.4; f.grounded = false; }
      }
    },
    {
      id: 'cranekick', name: 'Crane Kick',
      desc: 'A forward-leaping overhead. It has to be blocked standing, and it closes the distance while it does it.', kind: 'special',
      motion: 'qcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 12, active: 8, recovery: 20,
      damage: [52, 60, 68], stun: [13, 15, 17], chip: 6,
      hitstun: 20, blockstun: 13, hitLevel: 'overhead', knockdown: 'soft',
      pushback: 2.6, blockPushback: 3.2,
      airborne: [9, 28],
      hitbox: { x: 14, y: 26, w: 52, h: 30 },
      meterGain: 16, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.craneUp },
             { at: 12, p: Ps.craneKick }, { at: 19, p: Ps.craneKick },
             { at: 26, p: Ps.craneUp }, { at: 40, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 9) { f.vy = 3.8; f.vx = f.facing * (3.4 + strength * 0.5); f.grounded = false; }
      }
    }
  ],
  supers: [{
    id: 'superCrane', name: 'CRANE ASCENDING',
    desc: 'Thirty-four frames of rising kick, invincible for the first twelve. Nothing gets underneath it.', motion: 'qcfx2',
    buttons: ['LK', 'MK', 'HK'], cost: 100,
    startup: 4, active: 34, recovery: 30, freeze: 26,
    damage: 30, stun: 6, chip: 6, multiHit: 6, hitGap: 6,
    hitstun: 18, blockstun: 12, knockdown: 'hard',
    pushback: 1.4, blockPushback: 2.6,
    invuln: [0, 12], airborne: [3, 44],
    /* Reaches down as well as up: she climbs through the move, and a
       hitbox that only covers where she IS leaves a standing opponent
       underneath her after the first hit. */
    hitbox: { x: -10, y: 6, w: 52, h: 86 },
    anim: [{ at: 0, p: Ps.flipWind }, { at: 4, p: Ps.flipUp },
           { at: 12, p: Ps.flipOver }, { at: 20, p: Ps.craneKick },
           { at: 28, p: Ps.flipOver }, { at: 36, p: Ps.flipDown },
           { at: 48, p: Ps.land }, { at: 68, p: Ps.stand }],
    moveSelf: function (f, fr) {
      if (fr === 3) { f.vy = 7.2; f.vx = f.facing * 2.6; f.grounded = false; }
      /* she hangs, and drifts after them, rather than leaving the screen */
      if (fr > 3 && fr < 34) { f.vy += 0.30; f.vx = f.facing * 2.2; }
    }
  }]
  };
})();
