/* =====================================================================
   2 — MARIO. Huge and fat, and it is the whole plan.

   HEAVY: hardest to hurt, hardest to shift, slowest to arrive. His two
   moves are both about closing that distance and then being enormous.

   He is the E.Honda slot, so he is dressed as one: a mawashi wound
   twice round the middle, a stiff apron hanging off the front of it, a
   gold knot with two ends hanging, a topknot, and crimson wraps at the
   wrists and ankles. The apron is the important part — it is the only
   thing on the roster that hangs BELOW the waist, and it turns a round
   cat into a bell. Turn all six black and he is the one you can still
   name.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  /* The apron's path and its tones, handed from `pieces` to `overlay`.
     See the long note by `apronPath` for why it has to travel. */
  var stash = null;

  CF.CatDefs.mario = {
  id: 'mario',
  weightClass: 'heavy',
    /* A sumo's stance, not a wrestler's: weight down, chest over the
       toes, hands out in front at chest height.

       THE ARMS. They used to be armF [34, -74] and armB [30, -80], which
       on top of the base guard put both forearms nearly parallel with the
       ground and buried them in a chest that is 1.62 girth wide. In black
       there was no elbow, no wrist and no fist on either side: the whole
       top half was one mass from hip to crown. A sumo does not guard at
       head height anyway. At [22, -50] the upper arm runs forward and
       down, the forearm comes forward and up, and the fist clears the
       front of the belly as a separate lobe with a notch under it —
       which is the first thing on him you can name in the silhouette.

       THE HEAD used to be sunk 3 units INTO the collar, on the theory
       that a sumo has no neck. All that did was bury the muzzle, so the
       skull read as a bump on top of the shoulder rather than as a head.
       Two units up and the muzzle and the near ear both stand clear —
       and with the mane gone (see `look`) there is finally a notch under
       the jaw in the black shape. He still has the slope: it comes from
       the girth and the shoulder, which are untouched.

       The leg splay is the widest on the roster: at 25 degrees his feet
       are 31 units apart against everybody else's twenty. Splaying legs
       SHORTENS them, so the pelvis had to come back up to compensate —
       py went to -5.4 first and he ended up shin-deep in the boards on
       the back half of the walk cycle, which the floor test caught. */
  stance: { torso: 2, py: -1.6, armF: [22, -50], armB: [14, -34],
            legF: [25, -25], legB: [-24, 22], head: [1.4, 2.0, 0] },
  /* limbW was 1.22, and that is what cost him his hands. R_END is
     3.4 * s * girth * limbW, so at 1.22 the wrist was over seven units
     across and `fistPath` — which is drawn at HAND, not at R_END — sat
     entirely inside the forearm's own silhouette. He was the one cat on
     the roster with no readable fist: both arms simply stopped in a ball.
     At 0.98 the forearm tapers past the knuckles and the wedge stands
     proud of it. The heaviness was never in his wrists; girth 1.62 and
     shoulder 1.36 are untouched and still do all of it. */
  build: { s: 1.12, girth: 1.62, limb: 0.88, head: 0.94, muscle: 0.45,
           headShape: 'broad', ear: 'wide', shoulder: 1.36, waist: 1.30, limbW: 0.98 },

  /* ---- HIS LOOK ---------------------------------------------------------

     Everything here is geometry, not paint. `pieces` adds real shapes into
     the figure's own draw order and they get the same contour and the same
     cel shading as the fur — so the mawashi is lit by the lamp that lights
     his shoulder, and the apron is part of his outline rather than a
     sticker on it. See the COSTUME block in rig.js.                       */
  look: {
    pieces: function (A, j, f) {
      var MAW  = '#7d1f31';                 /* deep crimson mawashi */
      var MAW_D = A.shade(MAW, 0.30);
      /* The wraps started off white, which is what a sumo actually
         tapes with — but he is a black cat with a cream bib and cream
         feet, and four more cream lumps turned his ankles into slippers.
         In his own crimson they read as HIS, they tie the outfit
         together, and the whole cat comes down to three colours: black,
         crimson, one gold knot. */
      var TAPE = '#8f2438';
      var GOLD = '#f2c94c';

      /* THE MANE IS GONE, and that is what gave him a head.

         He used to wear the rig's `mane` — a ring of fur centred between
         neck and skull and wider than the chest. It did give him sloped
         shoulders, and it also filled the whole gap under his jaw, so in
         black the head was not a head, it was a bump on top of the
         shoulder mass. Taking it off is the single change that put a
         notch between jaw and shoulder in the silhouette.

         A dark collar drawn at the neck instead was tried twice, once
         tucked in and once bulging up behind the skull like withers, and
         neither one is visible: at girth 1.62 the shoulders sit well
         INSIDE the body outline, so anything laid over them is a costume
         drawn inside the silhouette — the exact failure the brief opens
         with. His slope now comes from the head delta and the girth,
         which cost nothing and can be seen. */

      /* The spine frame: t runs pelvis(0) to neck(1), w is across it,
         positive forward. Same trick as Gracie's gi. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;
      function T(t, w) { return { x: p.x + dx * t + fx * w,
                                  y: p.y + dy * t + fy * w }; }

      /* ================ FUR, ON THE SILHOUETTE ========================

         The one thing he was most short of. A smooth curve is the most
         obviously synthetic mark there is, and at girth 1.62 Mario carried
         the longest smooth curve on the roster — ear to hip with nothing
         in it, which is exactly the "one amorphous grey mass" complaint.
         A drawn cat notches.

         WHICH LAYER IS THE WHOLE PROBLEM, and getting it wrong is what
         makes a tuft read as a sticker rather than as fur. Pass one of the
         painter strokes EVERY shape with a contour twice `OUTLINE` wide,
         and pass two then fills them in order — so a tuft drawn OVER the
         part it grows from keeps a fat black line round its root, while a
         tuft drawn UNDER it has that root painted out by the part's own
         fill and only the piece standing proud of the outline survives.
         Which is precisely the piece that changes the silhouette.

           torso, rump, far arm  -> 'back'  (before the far limbs, the
                                             long-hair ruff and the torso)
           near arm and near leg -> 'body'  (after the torso, before the
                                             near limbs go down over them)
           the head              -> 'front' (the skull and cheeks are
                                             pushed into the shape list
                                             AFTER every costume layer)

         All four runs are FLAT fills. A wedge four pixels long has no room
         for three tones, and flat skips the clip, which is the expensive
         call — four fur runs cost about as much as one shaded thigh.      */

      /* One wedge of fur, added to whatever path is already open. It is
         deliberately not symmetric: a symmetric triangle repeated along an
         edge is a sawtooth, and a sawtooth reads as a pattern. The barb
         down one side is what makes the run read as hair. */
      function spike(cx, o, ang, len, half, hook) {
        var ca = Math.cos(ang), sa = Math.sin(ang);
        var px = -sa, py = ca;
        cx.moveTo(o.x + px * half, o.y + py * half);
        cx.lineTo(o.x + ca * len, o.y + sa * len);
        cx.lineTo(o.x + ca * len * 0.40 - px * half * (1 + hook),
                  o.y + sa * len * 0.40 - py * half * (1 + hook));
        cx.lineTo(o.x - px * half * 0.85, o.y - py * half * 0.85);
        cx.closePath();
      }
      /* A wedge rooted on the trunk. `t` runs up the spine, `w` across it
         (negative is his back), `lean` swings it off straight-out. Because
         both are in the spine's frame the whole coat follows every pose
         without a second number. */
      function edgeSpike(cx, t, w, lean, len, half, hook) {
        var o = T(t, w);
        var g = w < 0 ? -1 : 1;
        spike(cx, o, Math.atan2(fy * g, fx * g) + lean,
              len * f.s, half * f.s, hook);
      }
      /* the same, rooted on a limb: `u` down the segment, `side` which
         edge of it (+1 leading), `r` how far out the fur starts. */
      function limbSpike(cx, a, b, u, side, r, lean, len, half, hook) {
        var ux = b.x - a.x, uy = b.y - a.y;
        var dl = Math.hypot(ux, uy) || 1;
        ux /= dl; uy /= dl;
        var nx = -uy * side, ny = ux * side;
        var o = { x: a.x + (b.x - a.x) * u + nx * r,
                  y: a.y + (b.y - a.y) * u + ny * r };
        spike(cx, o, Math.atan2(ny, nx) + lean, len * f.s, half * f.s, hook);
      }

      /* HIS BACK, from the rump to the withers. Seven wedges, no two the
         same length, and the two longest are at the shoulder because that
         is where a heavy animal actually carries its coat. The roots sit
         just inside the long-hair ruff (1.16 to 1.20 of the trunk) so what
         you see is the last three or four pixels of each one. */
      A.add('back', function (cx) {
        cx.beginPath();
        edgeSpike(cx, 0.00, -f.hipW * 1.10,   0.42, 5.4, 2.5, 0.55);
        edgeSpike(cx, 0.13, -f.hipW * 1.16,   0.16, 4.2, 2.2, 0.40);
        edgeSpike(cx, 0.31, -f.waistW * 1.14, 0.00, 3.6, 1.9, 0.60);
        edgeSpike(cx, 0.49, -f.chestW * 0.98, -0.14, 4.6, 2.1, 0.35);
        edgeSpike(cx, 0.65, -f.chestW * 1.06, -0.26, 6.0, 2.6, 0.50);
        edgeSpike(cx, 0.79, -f.chestW * 1.04, -0.44, 5.2, 2.3, 0.30);
        edgeSpike(cx, 0.91, -f.chestW * 0.82, -0.66, 3.8, 1.8, 0.55);
        /* the rump, under the tail — a separate clump pointing down and
           back, which is what stops the tail root being a clean join */
        edgeSpike(cx, -0.07, -f.hipW * 0.86,  0.92, 4.4, 2.4, 0.45);
        /* the FAR elbow. Shorter and fewer than the near one on purpose:
           nothing on an animal is a matched pair. */
        limbSpike(cx, j.elbB, j.handB, 0.06, -1, f.R_MID * 0.62, -0.20, 3.4, 1.7, 0.4);
        limbSpike(cx, j.elbB, j.handB, 0.24, -1, f.R_MID * 0.54, -0.05, 2.8, 1.5, 0.4);
      }, f.furBack, { flat: true });

      /* THE GUT, and this is the one that makes him heavy.

         Measure his profile before the change and it is an HOURGLASS. The
         shared torso curve pulls hard in at t 0.36 — that pinch is the
         line in `bodyPoints` the rig is proudest of, and it is right for
         five cats — so Mario ran chest 27 units, waist 12, belt 20. A
         waist narrower than half the chest is a middleweight who has been
         inflated, which is exactly what he looked like, and no amount of
         shading was ever going to say otherwise: you cannot paint mass
         onto a shape that does not have it.

         So the mass is geometry. A lens down the front of the trunk from
         just under the ribs to just above the belt, and because it is in
         'back' — poured before the long-hair ruff and before the torso —
         everything of it that lies inside the body is painted out and what
         is left is the part standing proud, which is the only part that
         was ever wanted. It carries the cel shading, so the underside of
         the belly gets the same hard shadow crescent the thigh does.

         Do not make it bigger than this. At chestW * 1.17 it cleared the
         ruff by twelve units in the middle and read as a second animal
         attached to his front; the top and bottom have to come back INSIDE
         the body outline or it is a lobe rather than a belly. */
      A.add('back', function (cx) {
        A.smooth(cx, [
          T(0.13, f.chestW * 0.58),
          T(0.23, f.chestW * 0.90),
          T(0.33, f.chestW * 1.02),
          T(0.44, f.chestW * 1.04),
          T(0.54, f.chestW * 0.94),
          T(0.60, f.chestW * 0.46),
          T(0.40, f.chestW * 0.16),
          T(0.20, f.chestW * 0.14)
        ]);
      }, f.fur, { band: true });

      /* HIS CHEST, in the cream. He is a tuxedo cat and the bib was a
         painted oval inside the outline — notching the front edge turns it
         into fur that grows out of him.

         TWO THINGS WERE WRONG the first time and both are worth knowing.
         Four wedges spread from t 0.47 to 0.86 came out as two isolated
         white triangles with smooth curve between them, which reads as
         torn paper stuck on rather than as a coat; they have to OVERLAP
         along t so the edge is continuously ragged. And at `shade(belly,
         0.20)` the cream was nearly the paper white of the bib, which is
         the loudest value on the whole cat — against a near-black body
         four bright chips is all your eye sees. Pushed to 0.40 it is a
         warm grey that still separates from the fur and no longer shouts. */
      A.add('back', function (cx) {
        cx.beginPath();
        edgeSpike(cx, 0.56, f.chestW * 1.02, 0.50, 4.4, 2.2, 0.5);
        edgeSpike(cx, 0.65, f.chestW * 1.08, 0.28, 5.8, 2.6, 0.4);
        edgeSpike(cx, 0.73, f.chestW * 1.10, 0.06, 4.6, 2.3, 0.7);
        edgeSpike(cx, 0.81, f.chestW * 1.02, -0.20, 5.4, 2.5, 0.4);
        edgeSpike(cx, 0.89, f.chestW * 0.80, -0.46, 4.0, 2.1, 0.6);
      }, A.shade(f.belly, 0.40), { flat: true });

      /* HIS TAIL. It is the biggest single shape on him after the trunk —
         long-haired, at the far side, and until now a perfectly smooth
         crescent the height of his body.

         It has to go on 'far' rather than 'back', because 'back' is poured
         BEFORE the tail is drawn and the tail would simply cover it. That
         means these are drawn over the tail and keep a contour round their
         roots — which everywhere else on him would be the sticker failure,
         and here costs nothing at all: the tail is the darkest tone on the
         cat and the contour is very nearly the same colour, so the root
         line is invisible and only the notches read. */
      A.add('far', function (cx) {
        var tp = j.tail;
        function onTail(u, side, out, lean, len, half, hook) {
          var a = tp[Math.min(2, Math.floor(u))], b = tp[Math.min(3, Math.floor(u) + 1)];
          limbSpike(cx, a, b, u - Math.floor(u), side, out, lean, len, half, hook);
        }
        /* `out` has to be the tail's own half-width at that point or the
           wedge is simply buried in it — long hair puts that at 5.4 * s *
           GW at the root, which is eight units, and the first pass rooted
           them at four. The control polygon runs outside the curve it
           draws, so these are a shade generous by design. */
        cx.beginPath();
        onTail(0.55, -1, 7.2, 0.10, 5.0, 2.4, 0.5);
        onTail(1.30, -1, 6.4, -0.08, 5.8, 2.6, 0.4);
        onTail(1.80, -1, 5.4, 0.14, 4.4, 2.1, 0.6);
        onTail(2.40,  1, 4.2, -0.30, 3.8, 1.9, 0.4);
      }, f.furBack, { flat: true });

      /* THE NEAR ARM AND LEG. On 'body', so the limb itself is painted
         over the roots a moment later and only the tips are left.

         The thigh run was three wedges hung off the back of the thigh and
         they came out as little grey flags in the gap between his legs —
         a spike needs something behind it to be an edge OF. They are on
         the calf and the back of the knee now, which is below the apron's
         hem and against the far leg, and they read as the coat rather than
         as bunting. */
      A.add('body', function (cx) {
        cx.beginPath();
        /* the back of the near elbow */
        limbSpike(cx, j.elbF, j.handF, 0.04, -1, f.R_MID * 0.66, -0.24, 4.6, 2.1, 0.5);
        limbSpike(cx, j.elbF, j.handF, 0.22, -1, f.R_MID * 0.58, -0.02, 3.6, 1.8, 0.4);
        limbSpike(cx, j.shF, j.elbF, 0.86, -1, f.R_MID * 0.70, 0.22, 3.0, 1.6, 0.6);
        /* the back of the knee and the calf */
        limbSpike(cx, j.hipF, j.kneeF, 0.88, -1, f.R_MID * 0.92, -0.10, 3.6, 2.0, 0.5);
        limbSpike(cx, j.kneeF, j.footF, 0.16, -1, f.R_MID * 0.78, 0.06, 4.2, 2.2, 0.4);
        limbSpike(cx, j.kneeF, j.footF, 0.40, -1, f.R_MID * 0.62, -0.06, 3.0, 1.7, 0.6);
      }, f.furFront, { flat: true });

      /* HIS JOWLS. A head has to read in the OUTLINE at this size, and a
         sumo's face is his jowls — so they are silhouette shapes, not
         markings. Four off the heavy front cheek and two ragged ones off
         the back of the skull, and the two sides are deliberately not a
         pair.

         They go on 'front' and not on 'head'. The head layer is drawn
         after the skull is filled AND cel-shaded, so a tuft there carries
         a contour round its root across the middle of his face. Every
         costume layer is poured before the ears, cheeks, skull and muzzle
         are pushed into the shape list — so 'front' is UNDER the head,
         which is where fur growing out of a head belongs.

         WHERE THE ROOTS GO. A `broad` skull is 1.38 head-radii across, and
         the cheek and jaw shapes carry the outline out to very nearly two —
         so a wedge rooted at 1.2 is simply inside the face and invisible,
         which is what the first pass produced. They start at 1.7 and reach
         2.2.

         And they are shaded to match the part of the head they grow from.
         The skull's own cel shading is clipped to the skull, so a jowl in
         the flat base tone hung off a jaw the rig has taken down to
         SHADE_TO 0.62 comes out as a pale flap under a dark chin. */
      var HR = f.headR, HROT = -(j.headRot || 0) * Math.PI / 180;
      function jowls(list, colour) {
        A.add('front', function (cx) {
          cx.save();
          cx.translate(j.head.x, j.head.y);
          cx.rotate(HROT);
          cx.beginPath();
          for (var q = 0; q < list.length; q++) {
            var w = list[q];
            spike(cx, { x: w[0] * HR, y: w[1] * HR }, w[2],
                  w[3] * HR, w[4] * HR, w[5]);
          }
          cx.restore();
        }, colour, { flat: true });
      }
      /* the near cheek and the jaw, hanging forward and down */
      jowls([[1.72,  0.10, -0.22, 0.46, 0.17, 0.5],
             [1.78, -0.26, -0.52, 0.54, 0.19, 0.4],
             [1.54, -0.60, -0.95, 0.44, 0.17, 0.6],
             [1.08, -0.82, -1.45, 0.38, 0.16, 0.4]], A.shade(f.fur, 0.34));
      /* the back of the skull, two and untidy — never a pair */
      jowls([[-1.24,  0.26, 2.95, 0.46, 0.18, 0.5],
             [-1.18, -0.24, 3.32, 0.36, 0.15, 0.4]], A.shade(f.fur, 0.48));

      /* --- the sagari: the stiff apron off the front of the belt ------

         It hangs by gravity, not along the spine, so it is built in world
         y and only its top edge follows the lean of his body. Solid, with
         two grooves cut into it and a notched hem: five separate strands
         would be under three pixels each at game size and turn to fringe
         mush, which is the whole trap at this resolution.

         Its width is the span from a0 to a1 along the belt. The first
         version ran from the front of the hip to the front of the waist,
         which in a side view is a hand's breadth — it read as a necktie.
         Starting it back near the spine is what makes it a panel, and
         keeping both ends at nearly the same t is what makes it HANG:
         a top edge that climbed the spine made it stick out forwards
         like a shelf instead. */
      var a1 = T(0.09, f.waistW * 1.62);     /* front edge of the belt       */
      var a0 = T(0.01, -f.hipW * 0.10);      /* back edge, at the spine       */
      /* Length. At 32 it reached the floor and hid both legs, so he
         walked without any legs visible — a character whose legs you
         cannot see does not read as moving. Ending it above the knee
         leaves the crimson ankle wraps swinging under the hem, which is
         where the walk cycle now lives. */
      var D = 23 * f.s;
      var flare = 4.2 * f.s;
      /* IT HAS TO SWING. This was a board: the whole panel was built from
         fixed constants, so the largest piece of costume on the roster held
         one shape through the walk, the dash and the jump. A stiff apron
         still swings — it trails behind the hips and rides UP as it goes,
         because it is pivoting about the belt rather than stretching. So
         the hem alone takes `f.sway` and lifts by the same amount either
         way, and the top edge on the belt does not move at all. Only the
         hem, deliberately: swinging the top edge as well shears the panel
         and it stops looking attached to him.

         The LIFT is the read that matters, and it is the one that cannot
         be wrong: a stiff panel rises whichever way the man carrying it
         is going, so `Math.abs`. The sideways swing follows the roster's
         convention — positive sway offset towards the back, the same as
         Ruby's hide and Luigi's scarf. Worth knowing before changing it:
         the rig builds sway as `vx * facing * -0.9`, so walking forward
         makes it NEGATIVE, and the panel therefore leans forward rather
         than trailing. That reads fine on him — he only reaches any real
         speed inside the belly bump, where a skirt shoved out ahead of
         the belly is what you want anyway — but it is a rig-wide sign and
         not something to correct in one cat file. */
      var swing = -f.sway * 1.1 * f.s;
      var lift  = Math.abs(f.sway) * 0.62 * f.s;
      var bx1 = a1.x + flare + swing, by1 = a1.y - D + lift;
      var bx0 = a0.x - flare * 0.7 + swing, by0 = a0.y - D * 0.86 + lift;
      /* The apron hangs from the belt, and the belt follows the pelvis —
         so on a crouch or a sweep it would hang thirty units THROUGH the
         floor, which is what the first long version did. y = 0 is the
         sole plane, so the hem is clamped just above it: standing it
         brushes the ground, crouching it bunches up short, which is what
         a stiff apron does when it lands on something. */
      var FLOOR = 1.6 * f.s;
      if (by1 < FLOOR) by1 = FLOOR;
      if (by0 < FLOOR) by0 = FLOOR;
      function hem(t, lift) {
        return { x: bx1 * t + bx0 * (1 - t),
                 y: by1 * t + by0 * (1 - t) + lift * f.s };
      }
      /* The two notches used to sit at fixed t, so even the fringe was the
         same drawing every frame. They drift a little with the clock and a
         little with the swing — a couple of pixels, which is all it takes
         at ninety pixels tall for the hem to stop looking painted on. */
      var drift = Math.sin(f.t * 0.06) * 0.018 + f.sway * 0.006;
      /* WHERE THE APRON IS PAINTED, and why it is painted twice.

         It sits on 'front', which is right: from the side a sagari hangs
         off the front of the belt and the near leg passes behind it.
         (Moving it to 'body' was tried — the near thigh then covers the
         whole panel and the one thing that makes him a bell is gone.)

         But `drawForm` runs after every layer and paints the near thigh's
         quad and hamstring on top, clipped to the leg — so a mid-grey
         rounded blob sat across the lower half of the red panel in every
         standing and guarding pose. At 1x that is a stain or a hole in
         the garment, not a leg. Nothing in a cat file can be drawn after
         drawForm except `overlay`, so the panel goes in here FLAT — one
         cheap fill, which is all the shape list needs it for, since what
         it is really doing there is putting the apron into the contour
         and into the silhouette — and `overlay` lays the three tones and
         the grooves back over the top afterwards. `stash` is how the two
         halves agree about the path; build and paint run back to back in
         one drawCat call, so there is nothing to go stale between them. */
      function apronPath(cx) {
        var h;
        cx.beginPath();
        cx.moveTo(a0.x, a0.y);
        cx.lineTo(a1.x, a1.y);
        cx.lineTo(bx1, by1);
        /* the hem: two notches, so it reads as stiff panels */
        h = hem(0.70 + drift, 3.6); cx.lineTo(h.x, h.y);
        h = hem(0.64 + drift, 0);   cx.lineTo(h.x, h.y);
        h = hem(0.36 - drift, 3.6); cx.lineTo(h.x, h.y);
        h = hem(0.30 - drift, 0);   cx.lineTo(h.x, h.y);
        cx.lineTo(bx0, by0);
        cx.closePath();
      }
      /* THE FOLDS, and why the panel is no longer cel-shaded at all.

         They were two hairline STROKES, on the reasoning that a filled
         slot this narrow would vanish when the sprite came down to size —
         and a scratched line is not what cloth does. But replacing them
         with wedges laid over `celFill`'s recipe showed up a bigger
         problem underneath, which is worth writing down because it will
         catch the next person who puts a large flat panel on a cat.

         `celFill` makes its tone boundaries by offsetting the piece's own
         outline towards the light, four times. On something round that is
         perfect: you get a crescent of shadow round the dark side and a
         band of light just inside it. On a TALL FLAT PANEL with a
         near-vertical left edge, those four offsets come out as four
         PARALLEL VERTICAL STRIPES down that edge — dark, mid, pale, mid —
         and the largest piece of costume on the roster was wearing a
         length of pink piping down one side. It had been there since the
         panel was drawn and it was invisible until the folds gave the eye
         something to compare it against.

         So the sagari is painted the way cloth is actually drawn in the
         reference: FLAT PLANES with hard edges between them, and no
         offsetting anywhere. A base, a shadow down the back of the panel
         and inside each fold, and a narrow lit strip on the crest just
         forward of each fold. Three tones, vertical, which is what makes
         a hanging panel read as folded rather than as a red card. */
      function beltAt(k) {
        return { x: a1.x * k + a0.x * (1 - k), y: a1.y * k + a0.y * (1 - k) };
      }
      /* one panel of the sagari: `k` along the belt, `t` along the hem */
      function panel(cx, k0, k1, t0, t1) {
        var p = beltAt(k0), h;
        cx.moveTo(p.x, p.y);
        p = beltAt(k1); cx.lineTo(p.x, p.y);
        h = hem(t1, 0.4); cx.lineTo(h.x, h.y);
        h = hem(t0, 0.4); cx.lineTo(h.x, h.y);
        cx.closePath();
      }
      function foldPath(cx) {
        cx.beginPath();
        /* the back of the panel, turned away from the light */
        panel(cx, -0.05, 0.19, -0.05, 0.13);
        /* two folds, the near one wide and the far one not its mirror */
        panel(cx, 0.68, 0.745, 0.56 + drift, 0.72 + drift);
        panel(cx, 0.355, 0.40, 0.25 - drift, 0.355 - drift);
      }
      function crestPath(cx) {
        cx.beginPath();
        panel(cx, 0.745, 0.80, 0.72 + drift, 0.85 + drift);
        panel(cx, 0.40, 0.445, 0.355 - drift, 0.45 - drift);
      }
      A.add('front', apronPath, MAW, { flat: true });
      stash = {
        step: 1.75 * f.s,
        /* THE BIB HAS A SHADOW SIDE NOW.

           `drawPattern` lays the tuxedo bib down as one flat ellipse of
           `belly` with no shading of any kind, and on a cat this wide that
           is the largest single area in the picture — a pale egg painted on
           the front of a shaded animal, which is the decal failure the
           brief opens with, arriving from the rig rather than from the
           costume. It cannot be fixed where it is drawn; nothing in a cat
           file runs between `drawPattern` and the near limbs.

           So `overlay` puts a hard plane down the BACK of it, in the bib's
           own shadow tone. Two rules keep it honest. It has to stay inside
           the ellipse — cream shadow spilling onto fur reads as a stain —
           so it is drawn narrow and it tapers at the top where the ellipse
           does. And it has to stay on the spine side of the trunk, w under
           about a quarter of the chest, because that is the one part of
           the front the near arm never crosses in any pose. */
        bib: {
          col: A.shade(f.belly, 0.30),
          path: function (cx) {
            A.smooth(cx, [
              T(0.45, f.chestW * 0.03), T(0.45, f.chestW * 0.26),
              T(0.62, f.chestW * 0.23), T(0.79, f.chestW * 0.17),
              T(0.79, f.chestW * 0.06)
            ]);
          }
        },
        /* Everything that lies ON the apron, in the order it is painted.
           The tones are worked out here because only `pieces` is handed
           the lamp; `overlay` gets raw canvas and nothing else. */
        items: [{ path: apronPath, flat: true, base: MAW, edge: true,
                  plates: [{ path: foldPath,  col: A.shade(MAW, 0.42) },
                           { path: crestPath, col: A.lit(MAW, 0.30) }] }]
      };

      /* --- the mawashi, in two winds ---------------------------------

         One band is a belt. Two bands with a line between them is cloth
         that has been wound round somebody, and that is the difference
         between Mario and every other cat with a strap on. The lower
         wind is the wider of the two because that is where the bulk is.

         Two things about where it is drawn. It goes on 'front', not
         'body': on 'body' the near thigh's hip mass covers it and all
         you see of a belt at this girth is a sliver at the back, which
         is what the first attempt looked like. And it goes AFTER the
         apron, because the apron is tucked UNDER the belt — drawn
         before it, the apron swallowed the belt whole and the two read
         as one red slab with no waist in it.

         The back of the band is deliberately tighter than the front. Run
         out to the same width both ways and the tail end pokes out past
         his back as a crimson wedge, which reads as a second tail. */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.00, f.hipW * 1.28), T(0.13, f.hipW * 1.44),
          T(0.26, f.waistW * 1.54), T(0.27, -f.waistW * 1.14),
          T(0.12, -f.hipW * 1.08), T(-0.01, -f.hipW * 1.00)
        ]);
      }, MAW, { band: true, edge: true });

      /* the upper wind, a hair narrower and a shade darker, so the two
         read as cloth lying over cloth rather than one thick slab */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.27, f.waistW * 1.52), T(0.38, f.waistW * 1.40),
          T(0.39, -f.waistW * 1.06), T(0.28, -f.waistW * 1.12)
        ]);
      }, MAW_D, { band: true, edge: true });

      /* --- the knot ---------------------------------------------------

         This was a regular hexagon with a lit hexagon inside it, straight
         edges, centred on the belt — which at game size is an inventory
         icon glued to a cat, and the decal failure the brief names by
         name. A knot is not a regular anything: it is an off-centre lump
         with the cord going in one side and two short ends hanging out of
         the bottom, and it is the asymmetry that says "tied" rather than
         "printed".

         It stays gold. He is a very dark cat on mostly dark stages and
         this is the one bright thing on him — it is how your eye finds
         him across the screen, and swapping it for crimson lost him. */
      var pc = T(0.13, f.hipW * 1.22);
      function knotPath(cx) {
        A.smooth(cx, [
          { x: pc.x - 4.6 * f.s, y: pc.y + 1.6 * f.s },
          { x: pc.x - 1.6 * f.s, y: pc.y + 6.0 * f.s },
          { x: pc.x + 3.4 * f.s, y: pc.y + 4.6 * f.s },
          { x: pc.x + 5.4 * f.s, y: pc.y - 0.6 * f.s },
          { x: pc.x + 2.2 * f.s, y: pc.y - 4.4 * f.s },
          { x: pc.x - 3.4 * f.s, y: pc.y - 3.0 * f.s }
        ]);
      }
      /* the two ends, falling out of the bottom of it and swinging with
         the apron they lie on. Different lengths on purpose — a matched
         pair reads as a bow tie. */
      function endLong(cx) {
        A.capsule(cx, { x: pc.x + 1.2 * f.s, y: pc.y - 2.0 * f.s },
                      { x: pc.x + 2.6 * f.s + swing * 0.5, y: pc.y - 9.6 * f.s },
                  2.4 * f.s, 1.5 * f.s);
      }
      function endShort(cx) {
        A.capsule(cx, { x: pc.x - 2.0 * f.s, y: pc.y - 1.8 * f.s },
                      { x: pc.x - 3.2 * f.s + swing * 0.5, y: pc.y - 6.2 * f.s },
                  2.1 * f.s, 1.3 * f.s);
      }
      /* METAL IS NOT CLOTH, and painting it with the same recipe is why
         the plate read as a yellow button. Three things separate the two
         at this size and all three are here:

         THE RANGE. Metal is the one material on a figure that goes from
         nearly black to nearly white — it reflects the sky at the top and
         the ground at the bottom, so its darkest and lightest tones are
         further apart than anything else in the picture. Cloth at
         shade 0.46 / lit 0.36 was a fifth of the range this now uses.

         THE EDGES ARE STRAIGHT. `celFill` offsets the piece's own outline
         to make its tone boundaries, so every boundary is a copy of the
         silhouette — which is exactly right for something soft and exactly
         wrong for something struck. A facet on metal is a FLAT PLANE, so
         these are drawn as slabs square to the light and clipped to the
         knot: the boundary comes out as a straight line across a curved
         object, which is the whole tell.

         THE HIGHLIGHT IS A STRIPE, not the whole lit side. It is bounded
         on both sides and it is only a couple of pixels wide.

         Still three tones. The plate is painted in the darkest one, then
         two planes are laid over it. */
      var LDX = 0.52, LDY = 0.85;           /* the rig's own light */
      /* everything more than `from` along the light, out to `to` */
      function slab(cx, from, to) {
        var S = f.s, px = -LDY, py = LDX, W = 13;
        function P(u, v) {
          return { x: pc.x + (LDX * u + px * v) * S, y: pc.y + (LDY * u + py * v) * S };
        }
        var a = P(from, W), b = P(from, -W), c = P(to, -W), d = P(to, W);
        cx.beginPath();
        cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y);
        cx.lineTo(c.x, c.y); cx.lineTo(d.x, d.y);
        cx.closePath();
      }
      /* The knot lies ON the apron, so it has to be repainted with it —
         otherwise the overlay's crimson buries the one bright thing on
         him, which is what happened the first time it was tried. Flat in
         the shape list for the contour, the metal in the overlay. */
      A.add('front', knotPath,  GOLD, { flat: true });
      A.add('front', endLong,   A.shade(GOLD, 0.16), { flat: true });
      A.add('front', endShort,  A.shade(GOLD, 0.52), { flat: true });
      stash.items.push(
        /* the two cord ends, one catching the light and one not. They were
           0.24 and 0.38 — fourteen points apart, which at this size is one
           colour twice. */
        { path: endLong,  flat: true, base: A.shade(GOLD, 0.16), edge: true },
        { path: endShort, flat: true, base: A.shade(GOLD, 0.52), edge: true },
        { path: knotPath, flat: true, edge: true,
          base: A.shade(GOLD, 0.66),
          plates: [{ path: function (cx) { slab(cx, -1.6, 20); }, col: GOLD },
                   { path: function (cx) { slab(cx, 1.3, 3.7); },
                     col: A.lit(GOLD, 0.62) }] });

      /* --- tape ------------------------------------------------------

         Thick enough to be a lump in the outline, not a painted stripe —
         but only just. The first pass used R_END * 1.4, and at his girth
         R_END is already seven units, so he came out with four white
         beach balls stuck to him. A wrap is a band ROUND a limb: barely
         proud of it, and short. */
      /* IT IS TAPE, SO IT HAS TO BE WOUND. A single capsule of even radius
         is a pill, and a pill on the end of an arm reads as a bandage on a
         wound or as a bracelet — never as something somebody put on
         themselves one turn at a time. Two winds of slightly different
         radius, overlapping, put a STEP in the outline where the second
         crosses the first; the near wrist also gets a loose end tucked
         under, which is the detail that says a person did this.

         `A.capsule` cannot be used to build it: `capsulePath` opens with
         `beginPath`, so two of them in one path function is one capsule.
         This is the same shape without that line, which is what lets both
         winds and the end be a single shape — one contour stroke, one
         fill, instead of three of each on a piece seven pixels across. */
      function bandPath(cx, p0, p1, r0, r1) {
        var bx = p1.x - p0.x, by = p1.y - p0.y;
        var bl = Math.hypot(bx, by) || 0.001;
        var nx = -by / bl, ny = bx / bl;
        cx.moveTo(p0.x + nx * r0, p0.y + ny * r0);
        cx.lineTo(p1.x + nx * r1, p1.y + ny * r1);
        cx.arc(p1.x, p1.y, r1, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
        cx.lineTo(p0.x - nx * r0, p0.y - ny * r0);
        cx.arc(p0.x, p0.y, r0, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
        cx.closePath();
      }
      /* Radius, second time of asking. R_END * 0.86 was still wider than
         the forearm it was wrapped round, so the band filled the limb
         edge to edge — a solid maroon disc in the middle of a grey oval,
         which at game size is what a WOUND looks like, not a wrap. The
         band has to leave fur showing on both sides of it. Short, too:
         starting at 0.74 rather than 0.66 keeps it near the wrist. */
      function wrap(layer, a, b, t0, t1, rad, col, end) {
        var ux = b.x - a.x, uy = b.y - a.y;
        var dl = Math.hypot(ux, uy) || 1;
        var vx = ux / dl, vy = uy / dl, nx = -vy, ny = vx;
        function Pt(t) { return { x: a.x + ux * t, y: a.y + uy * t }; }
        var span = t1 - t0;
        A.add(layer, function (cx) {
          cx.beginPath();
          bandPath(cx, Pt(t0), Pt(t0 + span * 0.66), rad, rad * 1.08);
          bandPath(cx, Pt(t0 + span * 0.50), Pt(t1), rad * 1.04, rad * 0.86);
          if (end) {
            /* the loose end, tucked back under the last turn */
            var o = Pt(t0 + span * 0.34);
            cx.moveTo(o.x + nx * rad * 0.60, o.y + ny * rad * 0.60);
            cx.lineTo(o.x + nx * rad * 1.85 - vx * rad * 0.30,
                      o.y + ny * rad * 1.85 - vy * rad * 0.30);
            cx.lineTo(o.x + nx * rad * 1.05 - vx * rad * 1.30,
                      o.y + ny * rad * 1.05 - vy * rad * 1.30);
            cx.closePath();
          }
        }, col, { edge: true });
        return { Pt: Pt, n: { x: nx, y: ny }, rad: rad, t0: t0, span: span };
      }
      var wA = wrap('front', j.elbF, j.handF, 0.74, 0.96, f.R_END * 0.62, TAPE, true);
      var wB = wrap('front', j.kneeF, j.footF, 0.62, 0.90, f.R_END * 0.68, TAPE, false);
      /* Only the far ANKLE. A far-wrist wrap has to go on 'body' — there
         is no layer between the far limbs and the torso — and on a punch
         the far hand is behind the chest, so it came out as a crimson
         blob sitting on his belly. The far foot is never behind the
         torso, so that one is safe. */
      wrap('body',  j.kneeB, j.footB, 0.64, 0.90, f.R_END * 0.60, A.shade(TAPE, 0.30), false);
      /* The seam between the two winds, on both near wraps in ONE shape.
         A step in the outline is only half of what says "wound": the other
         half is the shadow the overlapping turn throws, and at seven pixels
         across that has to be a hard bar or it is nothing. */
      A.add('front', function (cx) {
        cx.beginPath();
        [wA, wB].forEach(function (w) {
          var o = w.Pt(w.t0 + w.span * 0.58);
          var e = w.Pt(w.t0 + w.span * 0.50);
          cx.moveTo(o.x + w.n.x * w.rad * 1.05, o.y + w.n.y * w.rad * 1.05);
          cx.lineTo(e.x - w.n.x * w.rad * 1.05, e.y - w.n.y * w.rad * 1.05);
          cx.lineTo(e.x - w.n.x * w.rad * 1.05 + (o.x - e.x) * 0.42,
                    e.y - w.n.y * w.rad * 1.05 + (o.y - e.y) * 0.42);
          cx.lineTo(o.x + w.n.x * w.rad * 1.05 + (e.x - o.x) * 0.42,
                    o.y + w.n.y * w.rad * 1.05 + (e.y - o.y) * 0.42);
          cx.closePath();
        });
      }, A.shade(TAPE, 0.52), { flat: true });

      /* --- the topknot -----------------------------------------------

         Head-layer pieces are drawn in the skull's own frame: origin at
         the head, +y up, +x the way he faces, r the skull radius. It sits
         between the ears and leans back, which puts a notch in the top of
         his silhouette that nobody else on the roster has. */
      /* It was a capsule of even thickness leaning back a few degrees, and
         at game size it came out as a grey PIPE growing out of his
         forehead, overlapping the near ear so the two read as one horn.
         The note under the old version said that was the thing to avoid;
         it was not avoided, because a capsule with the same radius at
         both ends cannot read as hair.

         Two changes. It TAPERS — r * 0.34 at the root against r * 0.16 at
         the tip, so it comes to a point — and it lies much further back,
         tip at -r * 0.86 rather than -r * 0.44, which walks it off the
         near ear and puts a clean V between the two of them in the black
         shape instead of a second ear-sized lump. */
      /* THIRD TIME. The taper fixed the pipe and left a different problem:
         it was drawn in `f.fur` with a lit band, and a lit band on `f.fur`
         is mix(fur, LIGHT_TO, 0.36) — which is the same tone, to within a
         couple of values, as the lit crown it sits on. So the knot and the
         top of the skull merged into one pale lobe and the notch the whole
         piece exists for was gone. In `f.fur2` the band lands a long way
         under the crown and the knot reads as a dark mass against a lit
         head, which is what a chonmage looks like from the side.

         It is a folded bundle now rather than a taper: bound narrow at the
         root, opening out, and finishing on a BLUNT end with a notch cut
         out of it. Hair that has been tied has an end; a cone has a point,
         and a point on top of a cat's head is a horn. */
      var r = f.headR;
      A.add('head', function (cx) {
        A.smooth(cx, [
          { x:  r * 0.26, y: r * 0.64 },
          { x:  r * 0.14, y: r * 1.20 },
          { x: -r * 0.10, y: r * 1.72 },
          { x: -r * 0.38, y: r * 1.98 },   /* the blunt end */
          { x: -r * 0.50, y: r * 1.68 },
          { x: -r * 0.24, y: r * 1.40 },   /* the notch under it */
          { x: -r * 0.40, y: r * 1.08 },
          { x: -r * 0.22, y: r * 0.60 }
        ]);
      }, f.fur2, { band: true });
      /* two hairs out of the bundle, because nothing bound is ever tidy */
      A.add('head', function (cx) {
        cx.beginPath();
        spike(cx, { x: -r * 0.24, y: r * 1.86 }, 2.30, r * 0.46, r * 0.10, 0.5);
        spike(cx, { x:  r * 0.02, y: r * 1.56 }, 1.62, r * 0.32, r * 0.08, 0.4);
      }, f.fur2, { flat: true });
      /* the tie at its base. Kept narrow: at r * 0.26 it was as fat as
         the tuft and the whole thing read as a red pipe coming out of
         his head rather than as hair bound at the root. */
      A.add('head', function (cx) {
        A.capsule(cx, { x: r * 0.22, y: r * 0.80 }, { x: -r * 0.20, y: r * 1.00 },
                  r * 0.30, r * 0.28);
        /* In MAW it did not read at all: #7d1f31 against the fur2 the
           bundle is drawn in is four values of luminance apart, and four
           values at ninety pixels tall is the same colour twice. TAPE is
           the tone the wrist and ankle wraps are in, which is the point —
           it is the only crimson above the belt and it is what ties the
           head to the rest of the outfit. */
      }, TAPE, { edge: true, flat: true });
    },

    /* The apron again, after `drawForm` has had its go at the near leg.
       This is `celFill`'s recipe written out by hand: fill the whole panel
       in shadow, clip to it, then lay the base tone back over shifted
       towards the light, and the lit band once more on top of that. The
       light direction is the rig's own (0.52, 0.85) — a piece of costume
       lit by a different lamp from the shoulder above it is worse than a
       piece of costume with no shading at all. */
    overlay: function (ctx, j, fig) {
      var st = stash;
      if (!st) return;
      var dx = 0.52 * st.step, dy = 0.85 * st.step;
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      /* the bib, before anything else. It needs no clip: every point of it
         is inside a fifth of the chest's width and between t 0.24 and 0.70,
         which is well inside the trunk in every pose the rig can solve. */
      if (st.bib) {
        st.bib.path(ctx);
        ctx.fillStyle = st.bib.col;
        ctx.fill();
      }
      for (var i = 0; i < st.items.length; i++) {
        var it = st.items[i];
        if (it.flat) { it.path(ctx); ctx.fillStyle = it.base; ctx.fill(); }
        else {
          it.path(ctx); ctx.fillStyle = it.shadow; ctx.fill();
          ctx.save();
          it.path(ctx); ctx.clip();
          ctx.translate(dx, dy);
          it.path(ctx); ctx.fillStyle = it.base; ctx.fill();
          ctx.translate(dx * 1.15, dy * 1.15);
          it.path(ctx); ctx.fillStyle = it.lit; ctx.fill();
          ctx.translate(dx * 0.9, dy * 0.9);
          it.path(ctx); ctx.fillStyle = it.base; ctx.fill();
          ctx.restore();
        }
        /* Flat planes laid on the finished material — the cloth's folds,
           the metal's struck facet. Clipped to the piece, so a plane can
           be drawn generously and square to the light and still not spill
           a pixel over the edge of the thing it is describing. Each one
           is a tone the piece already has; none of them is a fourth. */
        if (it.plates) {
          ctx.save();
          it.path(ctx); ctx.clip();
          for (var q = 0; q < it.plates.length; q++) {
            it.plates[q].path(ctx);
            ctx.fillStyle = it.plates[q].col;
            ctx.fill();
          }
          ctx.restore();
        }
        if (it.edge) {
          it.path(ctx); ctx.strokeStyle = fig.line;
          ctx.lineWidth = 1.15 * fig.s; ctx.stroke();
        }
      }
      ctx.restore();
    }
  },

  displayName: 'MARIO',
  subtitle: 'The Immovable',
  blurb: 'Enormous, and entirely aware of it. Getting to you takes a while. Being under him does not take long at all.',
  difficulty: 2,
  palette: {
    /* Nothing in the kit at all, and both absences are deliberate.

       No `belt`: the rig's belt is a flat rectangle painted on after the
       fills, and a rectangle cannot be wound round anything — the mawashi
       in `look` is real geometry and goes into the silhouette, which is
       the entire point of him.

       No `mane` either, as of this pass. It was there to fill the gap
       between skull and chest so his shoulders sloped straight off his
       ears — and it worked, at the price of making the head unfindable in
       black. See the note in `look`. */
    kit: {},
    fur: '#4b4243', fur2: '#332c2e', belly: '#e9e2d2', marks: '#211b1d',
    eye: '#d9c04a', nose: '#e8a2ac', inner: '#c98d95',
    accent: '#7a4a3c', accessory: 'none', pattern: 'tuxedo',
    tailTip: '#4b4243', longhair: true, depth: 0.82, line: 'rgba(14,11,12,.6)'
  },
  stats: { walkF: 1.02, walkB: 0.86, jumpVy: 8.8, jumpVx: 2.2, gravity: 0.54,
           health: 800, stunMax: 138, weight: 1.48, hasDash: false },
  mod: { reach: 1.02, damage: 1.22, speed: 1.24 },
  specials: [
    {
      id: 'bellybump', name: 'Belly Bump',
      desc: 'All of him, at once. He shrugs off a hit on the way in, frames 8 to 24, so trading with him is a losing idea.', kind: 'special',
      motion: 'qcf', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
      startup: 13, active: 10, recovery: 26,
      damage: [72, 84, 96], stun: [20, 22, 24], chip: 9,
      hitstun: 20, blockstun: 14, knockdown: 'soft',
      pushback: 4.2, blockPushback: 5.0,
      hitbox: { x: 10, y: 18, w: 48, h: 46 },
      /* He is too big to be interrupted by one jab on the way in. */
      armor: [8, 24], meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.stand }, { at: 8, p: Ps.bellyWind },
             { at: 14, p: Ps.bellyHit }, { at: 23, p: Ps.bellyHit },
             { at: 30, p: Ps.bellyEnd }, { at: 49, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr >= 11 && fr < 24) f.vx = f.facing * (3.6 + strength * 0.6);
      }
    },
    {
      id: 'smother', name: 'The Smother',
      desc: 'A grab, so blocking will not save them. Four frames of startup and a hard knockdown — but thirty-six frames of standing there if it misses.', kind: 'special',
      motion: 'hcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      isCommandThrow: true, range: 56,
      /* A missed command grab has to be a real punish, or the grappler
         just throws it out for free. Big reward, big risk. */
      startup: 4, active: 3, recovery: 36, whiffRecovery: 42,
      damage: [150, 175, 200], stun: [30, 33, 36],
      knockdown: 'hard', meterGain: 24,
      anim: [{ at: 0, p: Ps.smotherWind }, { at: 6, p: Ps.smotherWind },
             { at: 12, p: Ps.smotherDrop }, { at: 30, p: Ps.smotherDrop },
             { at: 43, p: Ps.stand }]
    }
  ],
  supers: [{
    id: 'superSmother', name: 'THE FULL WEIGHT',
    desc: 'Three frames, ungrabbable to block, 330 damage, invincible while it starts. If his meter is full and you are stood next to him, you are already in it.', motion: 'qcfx2',
    buttons: ['LK', 'MK', 'HK'], cost: 100,
    isCommandThrow: true, range: 64,
    startup: 3, active: 3, recovery: 44, freeze: 30, whiffRecovery: 48,
    damage: 330, stun: 44, knockdown: 'hard', invuln: [0, 6],
    anim: [{ at: 0, p: Ps.smotherWind }, { at: 8, p: Ps.smotherWind },
           { at: 16, p: Ps.smotherDrop }, { at: 36, p: Ps.smotherDrop },
           { at: 50, p: Ps.stand }]
  }]
  };
})();
