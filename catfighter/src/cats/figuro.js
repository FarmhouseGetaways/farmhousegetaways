/* =====================================================================
   5 — FIGURO. Lilly's brother, and the strong one.

   MEDIUM: rears up on his back legs and throws hands, then leaves. The
   retreat is the point — he is the only cat who can simply not be there.

   He is the roster's boxer, and that is the whole design of him. A cat
   in a boxing kit is the one silhouette on the line-up nobody can
   mistake: two mitts the size of his head held up by his cheeks, a
   waistband you could read from the back of the room, boots to the knee
   and a towel still over his shoulder because he never went to the
   corner. Everything below is built to survive being turned black.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.figuro = {
  id: 'figuro',
  weightClass: 'medium',
    /* Peek-a-boo: lead glove up by the cheek, elbows tucked in, chin down
       behind it. He is a boxer before he is a cat.

       The back arm stays tucked. Swinging it forward was tried, to get the
       far mitt clear of the skull, and it turned the guard into a man
       reaching for a door handle in every pose the stance touches — which
       is all of them. The mitt is got out of hiding by DRAW ORDER instead;
       see the glove block below. */
  stance: { torso: 4, py: -1, armF: [-30, 52], armB: [-8, 30],
            head: [1, -1.5, 5] },
  /* Thicker through the body and a size smaller in the head than he was.
     Two reasons, and they are the same reason. A boxer at this weight is
     mostly chest, and a small head next to a head-sized mitt makes the mitt
     look enormous — the glove is measured off the skull, so shrinking the
     skull is free emphasis. It also got him out from under Gracie: the
     roster test counts how many silhouette marks two cats share, and at
     girth 1.12 with a 1.00 head the pair of them differed only in the skull
     and the limb weight. */
  build: { s: 1.00, girth: 1.24, limb: 0.98, head: 0.94, muscle: 1.45,
           headShape: 'blocky', ear: 'small', shoulder: 1.26, waist: 0.82, limbW: 1.14 },

  /* ---- HIS LOOK ---------------------------------------------------------

     rig.js already has a `kit.gloves`, and it is two ellipses the size of a
     paw laid over the fists. At 384x224 that is a red bead on the end of an
     arm — it says "holding something", not "boxer". Everything here is built
     in `look.pieces` instead, where it goes through the contour pass and the
     cel shading with the rest of him, and where it can be made big enough to
     change the outline. `kit` is left empty on purpose: the built-in gloves
     and belt are drawn AFTER the costume layers and would have landed on top
     of all of this.                                                       */
  look: {
    pieces: function (A, j, f) {
      /* THREE materials: the red of the kit, the navy of the trunks, and
         one oatmeal for the towel. Everything else is a shade of one of
         those.

         The waistband was sand to begin with, on the theory that a boxer's
         trunks carry a gold band. It disappeared: his belly is cream and
         his fur is tan, and a sand band across the middle of that is three
         near-identical values stacked on top of each other. Made the glove
         red it survives the drop to 384x224, AND it ties the gloves, the
         boots, the band and the towel stripe into one kit rather than four
         separate ideas that happen to be on the same cat. */
      var GLOVE = '#c0392f', CUFF = '#8d2622';
      /* The far mitt in its own darker red. Both gloves the same colour and
         both up by the same cheek is one red mass with a seam in it — the
         near one has to be the lit one and the far one the shadowed one, or
         the guard has no depth and there is no point drawing it twice. */
      var GLOVE_B = '#8e2a26', CUFF_B = '#6b1d1c';
      var TRUNK = '#232c4c', BAND = '#c0392f', TRIM = '#8d2622';
      var BOOT = '#c0392f', BOOTTOP = '#8d2622';
      /* The towel came down from near-white. Measured against the roster he
         was the palest cat in the game — 83 median luminance against 53 for
         the twins — and on the bright stages (the pool floor reads 175) a
         cream towel the size of his back is the brightest thing in the frame
         and the eye goes to it rather than to him. A gym towel is not white
         anyway; it has been through a hot wash a hundred times. Taken all
         the way down to #bdb08c it stopped being a towel and became part of
         his coat, so this is the value that keeps both. */
      var TOWEL = '#cfc3a2';

      /* --- two little frames, because every piece of this kit is aligned to
             a bone rather than to the screen. `frame(a,b)` gives the axis
             from a to b and the one across it; P() places a point in that
             axis in the figure's own units. Written once because a glove
             hand-placed in world coordinates slides off the fist the moment
             he throws a punch — which is what the first pass did. --- */
      /* THE LAMP, in the figure's own coordinates. rig.js offsets every
         cel-shaded fill along (0.52, 0.85) — up and forward — and nothing on
         a cat is allowed to be lit from anywhere else. A costume piece that
         places a highlight by eye instead of by this vector is the thing that
         makes a figure look assembled, so the two places below that put a
         hard highlight down (the glove specular and the boot cap) read it
         from here rather than guessing. */
      var LUX = 0.5218, LUY = 0.8530;
      var LANG = Math.atan2(LUY, LUX) + Math.PI / 2;   /* across the light */

      function frame(a, b) {
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        return { ux: dx / L, uy: dy / L, px: -dy / L, py: dx / L, L: L };
      }
      function P(o, at, u, v) {
        return { x: at.x + o.ux * u + o.px * v, y: at.y + o.uy * u + o.py * v };
      }

      /* the spine, for the trunks — t is 0 at the pelvis and 1 at the neck,
         w is sideways, +w forward */
      var pv = j.pelvis, nk = j.neck;
      var sdx = nk.x - pv.x, sdy = nk.y - pv.y;
      var sL = Math.hypot(sdx, sdy) || 1;
      var sfx = sdy / sL, sfy = -sdx / sL;
      function T(t, w) { return { x: pv.x + sdx * t + sfx * w, y: pv.y + sdy * t + sfy * w }; }
      function seg(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, q.y); }

      /* ================= FUR ON THE OUTLINE =========================

         The single most under-used thing available at this resolution, and
         the reason a cel-shaded figure reads as vector art however well it
         is lit: SMOOTH CURVES. Every edge on him came out of `limbPath` or
         `smoothClosed`, so every edge was a clean arc, and a clean arc is
         what a computer draws. A drawn cat has notches in it — a spur of fur
         off the point of the elbow, a shag on the back of the thigh, a
         cowlick at the throat, a cheek that is not a circle.

         THREE of them, and no more. Legibility first: the cat is ninety
         pixels tall, so a notch has to be two or three pixels deep before it
         survives at all, and a figure with a dozen three-pixel notches round
         it does not read as fur, it crawls. Cost second: each is a path and a
         flat fill on a cat the game draws twice a frame.

         HOW THE THREE WERE CHOSEN, because guessing was wrong twice.

         Attempt one was three `A.tuft` spurs — the point of the near elbow,
         the haunch, the throat. All three failed the same way: `A.tuft` is a
         CREST primitive, it makes long separate quills, and a quill parked on
         a joint whose angle changes every frame ends up somewhere different
         in every pose. The elbow was the clearest failure. A boxer's guard
         folds that elbow in behind the mitt, so the spur came out from BEHIND
         the glove and read as a claw growing out of it; on a frame where the
         arm straightens there is no outside of the bend to sit on at all and
         it shot out past the wrist.

         Attempt two was a ragged copy of the whole torso outline in the
         `back` layer, teeth cut into the ribs, the lats and the rump. In
         principle the best of the lot — it cannot slide, because it IS the
         body's own profile. In practice it was invisible. Filled magenta and
         rendered across four poses it contributed about four pixels in total:
         the towel takes up the whole of his back and the guard arm takes the
         ribs, so there was nothing left of it to see. It cost a path and a
         fill on the second most expensive cat in the game for that. Deleted.

         SO: FLAG EVERY DECORATIVE PIECE IN A COLOUR THAT CANNOT OCCUR AND
         RENDER IT ACROSS FOUR POSES BEFORE YOU KEEP IT. It takes two minutes
         and it is the only way to tell a subtle detail from one that is not
         there. The same test killed a fourth notch on the near upper arm —
         one sliver, at the shoulder, in one pose out of four — and confirmed
         the three below, which show in all four.                            */

      /* 1 and 2 — THE BACKS OF THE THIGHS. The two longest unbroken arcs on
         the figure and the ones the eye follows from the trunks down to the
         boots. Each is ONE closed shape: a saw-toothed edge down the back of
         the limb, returning up the middle of it where nothing can see it.

         It has to go UNDER the limb or the flat fill wipes out the limb's own
         cel shading in a stripe, and the layer that is under a near limb is
         `body` (poured before them) — not `front`, which is over. Same
         reasoning puts the far leg's in `back`.

         The tooth depth is a quarter of the limb radius. At half it read as a
         torn edge on a soft toy; at an eighth it was gone at game scale. */
      function furEdge(layer, a, b, r, from, to, n, out, col) {
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        var ux = dx / L, uy = dy / L;
        /* the BACK of the limb, whichever way round the limb happens to be */
        var px = -uy, py = ux;
        if (px > 0) { px = -px; py = -py; }
        A.add(layer, function (cx) {
          var i, t, w;
          cx.beginPath();
          for (i = 0; i <= n; i++) {
            t = from + (to - from) * (i / n);
            w = r * (i % 2 ? 1 + out : 0.90);
            cx.lineTo(a.x + ux * L * t + px * w, a.y + uy * L * t + py * w);
          }
          for (i = n; i >= 0; i--) {
            t = from + (to - from) * (i / n);
            cx.lineTo(a.x + ux * L * t - px * r * 0.45, a.y + uy * L * t - py * r * 0.45);
          }
          cx.closePath();
        }, col, { flat: true });
      }
      furEdge('body', j.hipF, j.kneeF, f.R_TOP * 1.10, 0.18, 0.86, 5, 0.26, f.furFront);
      furEdge('back', j.hipB, j.kneeB, f.R_TOP * 1.02, 0.20, 0.88, 5, 0.24, f.furBack);

      /* 3 — THE CHEEK. A head is about twenty-five pixels across at game
         scale and nothing drawn inside it survives, so the only place a face
         can be given any texture at all is its OUTLINE. His was a clean dome
         with two triangles on top.

         TWO THINGS WENT WRONG BEFORE THIS WORKED, and both are worth knowing
         because neither is obvious from the code:

         1. `A.tuft` on the `head` layer came out as a black scribble down his
            jaw. A tuft's spikes are a fifth as wide as they are long, the
            contour pass strokes every shape at twice OUTLINE, and at this
            size that stroke is wider than the spike — so the fill has nothing
            left to cover and all you see is the outline. Anything on a cat
            has to be FATTER than about four pixels or the contour eats it.
         2. The `head` layer is drawn AFTER the skull is painted, so a piece
            there paints over the face and carries a hard line round its inner
            edge — across the cheek, where fur meets fur and a line is exactly
            what turns a part into a sticker.

         So the ruff goes in `front`, which is drawn BEFORE the head: the
         skull lands on top of it and all that survives is the three teeth
         standing proud of the jaw, contoured into the silhouette with no
         line anywhere near the face. It costs the head's own frame being
         rebuilt here by hand, which is the eight lines below. */
      var hrot = -(j.headRot || 0) * Math.PI / 180;
      var hc = Math.cos(hrot), hs = Math.sin(hrot);
      function H(lx, ly) {
        return { x: j.head.x + lx * hc - ly * hs, y: j.head.y + lx * hs + ly * hc };
      }
      A.add('front', function (cx) {
        var i, a, rr, n = 7, p;
        cx.beginPath();
        for (i = 0; i <= n; i++) {
          a = (188 + 76 * (i / n)) * Math.PI / 180;
          rr = f.headR * (i % 2 ? 1.30 : 1.02);
          p = H(Math.cos(a) * rr, Math.sin(a) * rr);
          if (i) cx.lineTo(p.x, p.y); else cx.moveTo(p.x, p.y);
        }
        for (i = n; i >= 0; i--) {
          a = (188 + 76 * (i / n)) * Math.PI / 180;
          p = H(Math.cos(a) * f.headR * 0.72, Math.sin(a) * f.headR * 0.72);
          cx.lineTo(p.x, p.y);
        }
        cx.closePath();
      }, f.fur2, { flat: true });

      /* ================= THE GLOVES =================================

         The one shape that has to work. `r` is set off the skull radius so
         they are literally head-sized: the mitt spans about 2.2r across and
         the head is 2 headR, and at 1:1 that is a 20-pixel red mass either
         side of a 22-pixel face. Anything smaller and he is a cat holding
         his paws up, which is every other cat on the roster.

         THREE pieces per hand, and every one of them is in the outline:
         the mass, a thumb lobe proud of the leading edge, and a cuff
         narrower than the mitt so there is a wrist. That is the whole list
         on purpose. It used to be five — a cream wrap showing past the cuff
         and a pale lace panel along the knuckles as well — and both were
         sub-pixel at 384x224: invisible in every 1x screenshot, a smear of
         cream on his chest at 8x, and four clips and four fills a frame on
         what was then the most expensive cat in the game.

         The mitt straddles the wrist rather than sitting in front of it.
         Drawn forward of the joint — which is where a glove actually is —
         the fur fist rig.js draws at `handF` poked out round the back of it
         as a tan lump on his chest in every guard pose. The back of the ring
         and the cuff between them now bury that fist completely.        */
      /* The mass. Fat and round at the knuckles, pinched in towards the
         wrist — a glove is a ball on a stick, and the pinch is what stops it
         reading as a cushion. The first version was near enough a circle at
         both ends and, with a cuff the same width beside it, came out as an
         armchair: three rounded rectangles of a size, stacked. */
      var ring = [[-0.78, 0.44], [-0.26, 0.92], [0.42, 1.06], [1.00, 0.88],
                  [1.30, 0.20], [1.22, -0.48], [0.76, -0.94],
                  [0.06, -1.06], [-0.54, -0.78], [-0.82, -0.30]];
      /* THE OTHER GLOVE IS A DIFFERENT DRAWING.
         A real animal is not mirrored and neither is a pair of gloves that
         has been worn: the two were the same ten numbers at two sizes, which
         is the giveaway that a machine drew them. This one is squarer across
         the knuckles, flatter on top and rounder underneath — the same object
         seen from a slightly different angle, which is what the far one
         actually is. It is one array; it costs nothing. */
      var ringB = [[-0.74, 0.50], [-0.20, 0.86], [0.52, 0.96], [1.06, 0.74],
                   [1.24, 0.10], [1.10, -0.56], [0.62, -1.00],
                   [-0.04, -1.06], [-0.58, -0.72], [-0.80, -0.22]];

      function glove(layer, hand, elb, r, mit, cuf, far, ringPts, thumbV) {
        var o = frame(elb, hand);
        var pts = [], i;
        for (i = 0; i < ringPts.length; i++) pts.push(P(o, hand, ringPts[i][0] * r, ringPts[i][1] * r));

        /* The far mitt is NOT flat. It is the second largest single shape on
           him — a head-sized red mass held up beside his cheek — and a flat
           fill on something that size is a paper cut-out, whatever it costs.
           It gets two tones rather than three: the shadow crescent and the
           base, no lit band, which is what a thing on the dark side of a
           figure should have anyway. Its little pieces stay flat. */
        A.add(layer, function (cx) {
          A.smooth(cx, pts);
        }, mit, far ? { edge: true } : { band: true, edge: true });

        /* THE THUMB. A round lobe standing proud of the leading edge with a
           notch between it and the mass — the same trick fistPath uses, and
           the one shape that separates a boxing glove from a mitten. It was a
           capsule before, which is a stadium: at 1:1 it read as a second
           smaller rounded rectangle parked beside the first. Flat because it
           is about five pixels across in the finished picture and the clip a
           cel-shaded fill costs buys nothing at that size. */
        var th = P(o, hand, thumbV[0] * r, thumbV[1] * r);
        A.add(layer, function (cx) {
          A.ellipse(cx, th.x, th.y, r * thumbV[2], r * thumbV[3]);
        }, mit, { flat: true, edge: true });

        /* THE SPECULAR, on the near mitt only.

           This is what makes the leather leather. Everything else on him is
           lit by `celFill`, which lays a band of the lit tone down the whole
           edge that faces the lamp — and a broad soft-edged band is what a
           MATTE surface does with a light. Taut leather does the opposite: it
           throws the lamp back as one small, hard-edged, brightly lit patch,
           and everything around that patch stays base tone. So the glove gets
           the same three tones as the towel does and reads as the shiny thing
           beside it purely because its highlight is a SHAPE and the towel's
           is a rim.

           It is `A.lit(mit, 0.36)` and not a hair brighter: that is exactly
           the tone celFill's own band uses, so this is the third tone placed
           deliberately rather than a fourth one smuggled in. A fourth would
           be the pale blob the note in celFill warns about, on the one part
           of the cat the eye goes to first.

           Aimed at the LAMP and placed in WORLD space, not in the glove's.
           The glove's own frame spins with the arm, so a highlight pinned to
           the ring's numbers slides round to the underside the moment he
           throws a hook. The lamp does not move: `LX, LY` in rig.js is up and
           forward in the figure's own coordinates and every other fill on the
           cat is offset along it. Putting the specular there too is what
           makes the glove belong to the same picture as the shoulder above
           it. Only the CENTRE of the mitt comes out of the glove frame,
           because the mass sits forward of the wrist joint. */
        if (!far) {
          var mid = P(o, hand, 0.24 * r, 0);
          var sp = { x: mid.x + LUX * r * 0.46, y: mid.y + LUY * r * 0.46 };
          A.add(layer, function (cx) {
            /* An oval, not a circle, and laid ACROSS the light rather than
               along it. A round highlight reads as a ball bearing; a long one
               reads as a curved surface with a lamp on it. */
            A.ellipse(cx, sp.x, sp.y, r * 0.44, r * 0.25, LANG);
          }, A.lit(mit, 0.36), { flat: true });
        }

        /* THE CUFF. Half the width of the mitt, so the outline steps IN at
           the wrist. Matching the mitt's width — which is what it did — the
           glove has no wrist at all and the whole arm ends in one slab.
           The lace panel that used to sit along the knuckles is gone: it was
           sub-pixel at 384x224, invisible in every 1x screenshot, and cost
           two clips and two fills per hand on a cat that was the most
           expensive on the roster. The overlay ticks say `laces` for free. */
        A.add(layer, function (cx) {
          A.smooth(cx, [P(o, hand, -1.30 * r, 0.44 * r), P(o, hand, -0.72 * r, 0.62 * r),
                        P(o, hand, -0.66 * r, -0.62 * r), P(o, hand, -1.28 * r, -0.42 * r)]);
        }, cuf, far ? { flat: true, edge: true } : { band: true, edge: true });
      }

      /* BOTH gloves go on 'front', the far one first so the near one paints
         over it. The far one was on 'body' to begin with, which is the
         honest depth — after the torso, under the leading arm — and it was
         invisible: the near forearm crosses the chest in a peek-a-boo guard
         and ate the whole mitt, and what was left of it was painted over
         again by the tabby stripes, which are laid down after the body
         layer and clipped inside it. Put back on 'body' a second time, in
         August 2026, to check: the chest came out a flat cream-and-tan mush
         with no red in it at all. It stays on 'front'.

         So the far mitt cheats forward one layer. It is smaller and it is
         overlapped by the near one, which is all the depth cue this needs at
         ninety pixels tall, and the result is what the guard is for: TWO red
         masses stacked by his cheek rather than one and a rumour. */
      /* Sized off the skull on purpose: the mitt comes out wider than his
         head, which is the whole brief and is also true of a real 16oz
         glove next to a face. At 0.88 — the first go — the two lobes merged
         into the skull in the silhouette test and he came out a blob with
         boots on. */
      var gr = f.headR * 1.16;
      /* Both mitts are the SAME object at two sizes — the far one at 0.84
         because it is further from the camera — and `far` also fills it
         flat. They used to be a head-sized red mass on the near hand and, on
         the far one, a version with different pieces in it, which read as a
         different object rather than the other half of a pair.

         Going smaller than this was tried, at 0.72, on the reasoning that a
         far-side glove should be modest. rig.js draws the belly patch AFTER
         the costume's front layer, so at that size the far mitt was cut in
         half by it and read as a stray dark chip rather than the other
         glove. 0.84 clears the patch. */
      /* The far one gets its own ring and its thumb tucked further under, so
         the pair reads as two gloves rather than one glove and its shadow. */
      glove('front', j.handB, j.elbB, gr * 0.84, GLOVE_B, CUFF_B, true,
            ringB, [0.16, -0.92, 0.42, 0.38]);
      glove('front', j.handF, j.elbF, gr, GLOVE, CUFF, false,
            ring, [0.30, -0.94, 0.46, 0.42]);

      /* ================= THE BOOTS ==================================

         Up over the calf, with a folded collar at the top. The collar is
         what makes them boots rather than red socks: a hard band across the
         leg two thirds of the way up, wider than the leg it sits on, so the
         shin steps out of the silhouette instead of tapering into it. */
      function boot(layer, knee, foot, collar) {
        var o = frame(knee, foot);
        var top = { x: knee.x + (foot.x - knee.x) * 0.40,
                    y: knee.y + (foot.y - knee.y) * 0.40 };

        /* The FAR boot used to be `flat` — one fill, no shading at all — on
           the grounds that it is behind the near leg and cost is cost. Look
           at it: it is a third of the height of the cat and it was a solid
           red slug in every pose in the game. It gets two tones now (shadow
           crescent and base, no lit band, because it is on the dark side of
           the figure), which is one clip and one more fill. That was paid for
           by deleting the ragged torso copy above, which the flag test proved
           nobody could see. Trading an invisible shape for a visible one is
           always the right way round. */
        var opt = collar ? { band: true, edge: true } : { edge: true };
        A.add(layer, function (cx) {
          A.limb(cx, top, foot, f.R_MID * 1.22, f.R_END * 1.44, 0.35, 'shin');
        }, BOOT, opt);

        /* the foot. footPath in rig.js is the shape of a cat's foot and this
           is the same shape a size larger with the toes taken off — a boot
           has one sole, not three pads. */
        A.add(layer, function (cx) {
          var lean = (foot.x - knee.x) * 0.16;
          var lx = f.FOOT_X * 1.08, ly = f.FOOT_Y * 1.18;
          cx.save();
          cx.translate(foot.x, foot.y);
          cx.beginPath();
          cx.moveTo(-lx * 0.70 + lean, ly * 0.62);
          cx.quadraticCurveTo(-lx * 0.90 + lean, -ly * 0.55, -lx * 0.48, -ly * 1.00);
          cx.lineTo(lx * 0.70, -ly * 1.06);
          cx.quadraticCurveTo(lx * 1.30, -ly * 0.92, lx * 1.26, -ly * 0.18);
          cx.quadraticCurveTo(lx * 0.92, ly * 0.40, lx * 0.10, ly * 0.58);
          cx.quadraticCurveTo(-lx * 0.30, ly * 0.74, -lx * 0.70 + lean, ly * 0.62);
          cx.closePath();
          cx.restore();
        }, BOOT, opt);

        /* THE SOLE. Without it a boot is a red sock with a toe on it, which
           is exactly what these were: one shape, one colour, bottom to top.
           A sole is a different piece of leather from the upper and it is
           always the darkest thing on the shoe, so it gets the collar's dark
           red rather than a fourth tone of the boot's own — the trim on this
           kit is a material, not a shade.

           Near boot only. The far one is four pixels of dark red behind a leg
           and a sole on it is a fill nobody will ever see. */
        if (collar) A.add(layer, function (cx) {
          var lean = (foot.x - knee.x) * 0.16;
          var lx = f.FOOT_X * 1.08, ly = f.FOOT_Y * 1.18;
          A.ellipse(cx, foot.x + lean + lx * 0.26, foot.y - ly * 0.78,
                        lx * 0.99, ly * 0.26);
        }, BOOTTOP, { flat: true, edge: true });

        if (collar) A.add(layer, function (cx) {
          A.smooth(cx, [P(o, top, -0.42 * f.R_MID, 1.50 * f.R_MID),
                        P(o, top, 0.62 * f.R_MID, 1.36 * f.R_MID),
                        P(o, top, 0.66 * f.R_MID, -1.36 * f.R_MID),
                        P(o, top, -0.40 * f.R_MID, -1.50 * f.R_MID)]);
        }, BOOTTOP, { flat: true, edge: true });
      }
      /* The far boot goes without a collar. It is four pixels of dark red on
         a leg already behind the near one, and it cost a clip and two fills
         on the cat that was the most expensive on the roster. */
      boot('body', j.kneeB, j.footB, false);
      boot('front', j.kneeF, j.footF, true);

      /* ================= THE TRUNKS =================================

         High-waisted, the way a fighter's are, and the hem flares well past
         the hip so his outline below the belt is cloth. The bottom edge is
         cut with lineTo rather than smoothed — A.smooth rounds the leg
         openings into a skirt, and the notch between them is the difference
         between trunks and a tutu. */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.46, f.hipW * 1.36); cx.moveTo(a.x, a.y);
        seg(cx, 0.28, f.hipW * 1.50);
        seg(cx, 0.00, f.hipW * 1.78);
        seg(cx, -0.24, f.hipW * 1.62);
        seg(cx, -0.13, f.hipW * 0.26);        /* the notch between the legs */
        seg(cx, -0.27, -f.hipW * 1.48);
        seg(cx, -0.03, -f.hipW * 1.76);
        seg(cx, 0.28, -f.hipW * 1.48);
        seg(cx, 0.46, -f.hipW * 1.34);
        cx.closePath();
      }, TRUNK, { edge: true });
      /* NO `band` ON THE TRUNKS, and this is not an oversight.

         `celFill`'s highlight is an offset copy of the whole path, which is
         right for a convex form and wrong for this one: the trunks have a
         re-entrant corner in them — the notch between the legs — and the
         offset copy turned that corner into a pale CHEVRON across the front
         of him, an inch wide at game scale, that changed shape with every
         step he took. It read as a sports logo somebody had printed on, and
         it was the first thing the eye found on the whole cat.

         So the third tone is placed by hand instead, as a panel down the
         front of the trunks where the lamp actually falls. Satin is not
         matte — it is the one cloth on him that does throw some light back —
         but it does it in a broad soft sheet, which is what this is, and not
         as the hard little bead the glove leather gives. Same three tones,
         three different materials, three different behaviours. */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.30, f.hipW * 1.44); cx.moveTo(a.x, a.y);
        seg(cx, 0.02, f.hipW * 1.70);
        seg(cx, -0.20, f.hipW * 1.55);
        seg(cx, -0.14, f.hipW * 1.02);
        seg(cx, 0.06, f.hipW * 1.16);
        seg(cx, 0.30, f.hipW * 1.02);
        cx.closePath();
      }, A.lit(TRUNK, 0.36), { flat: true });

      /* THE SIDE STRIPE. Every pair of trunks in every gym has one down the
         outside seam, and side-on that seam faces the camera — so it lands
         across the middle of the visible cloth rather than on an edge.

         In the towel's oatmeal rather than the kit red. There are already
         three reds on him (mitts, waistband, boots) and a fourth, on the one
         big cool shape holding them apart, closed the trunks up into the same
         mass as the belt above them. Cream ties the towel to the kit instead,
         which is the one piece that was orphaned. */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.28, f.hipW * 0.94); cx.moveTo(a.x, a.y);
        seg(cx, 0.28, f.hipW * 0.46);
        seg(cx, -0.115, f.hipW * 0.36);
        seg(cx, -0.145, f.hipW * 0.82);
        cx.closePath();
      }, A.shade(TOWEL, 0.24), { flat: true, edge: true });

      /* the waistband. Deliberately enormous — a boxer's rides up over the
         bottom rib, and at this resolution a narrow one is a pencil line
         that the contour pass eats.

         It is drawn to the HIP width, not the waist width. Sized off
         `waistW` — which is 0.82 on this build, because he has a taper — it
         came out half the width of the trunks it was supposed to be
         finishing, sat in the middle of the hip like a patch, and was
         hidden behind the near forearm into the bargain. See the colour
         note at the top for why it is red. */
      A.add('front', function (cx) {
        cx.beginPath();
        var b = T(0.52, f.hipW * 1.34); cx.moveTo(b.x, b.y);
        seg(cx, 0.28, f.hipW * 1.50);
        seg(cx, 0.28, -f.hipW * 1.48);
        seg(cx, 0.52, -f.hipW * 1.32);
        cx.closePath();
      }, BAND, { band: true, edge: true });
      /* one darker strip along the bottom of it, so the band has a thickness
         rather than being a flat plaque */
      A.add('front', function (cx) {
        cx.beginPath();
        var b = T(0.34, f.hipW * 1.48); cx.moveTo(b.x, b.y);
        seg(cx, 0.28, f.hipW * 1.50);
        seg(cx, 0.28, -f.hipW * 1.48);
        seg(cx, 0.34, -f.hipW * 1.46);
        cx.closePath();
      }, TRIM, { flat: true });

      /* ================= THE TOWEL ==================================

         Over the back shoulder and down behind him, on 'back' so only the
         part standing proud of the body survives — which is the part that
         is doing the silhouette work. It swings off `f.sway`, so it lifts
         when he walks in and hangs when he stops. A towel that does not
         move is a white flag stapled to a cat.

         The first go used A.streamer. A streamer TAPERS, and a tapering
         white shape leaving a shoulder at forty degrees is a sword — that
         is exactly what it looked like, in every pose.

         The second go was a SLAB: two parallel edges and a hem cut square
         with a lineTo. That fixed the sword and bought a plank. Rendered at
         3x it was the loudest thing on the cat and it read as an ironing
         board — because three separate things on it were ruled rather than
         drawn:

           - the two long edges were exactly parallel over a run three chests
             long. Nothing made of cloth has two parallel edges that long;
           - the hem was one straight cut;
           - it carried `band: true`, so a bright lit stripe ran the whole
             length of it. That is what varnished wood looks like. A gym
             towel is the MATTE thing in this picture and the gloves beside
             it are the shiny one — the contrast between the two is most of
             what makes either material read at all.

         So it is now built off a bowed spine and offset by a DIFFERENT list
         of half-widths on each side. No two edges are parallel, the whole
         thing bends under its own weight, the hem is cut with three teeth of
         fringe, and it is filled flat-matte in two tones with one hard fold
         down the back of it. Same silhouette, four times the cloth.      */
      var cw = f.chestW;
      /* Anchored high: the towel has to break the SHOULDER LINE, not start
         under it. In the silhouette test he was a smooth dome from ear to
         hip — every other cat on the roster has something happening at the
         top of the outline (Gracie's ties, Mario's topknot, the tall ears on
         the twins) and he had nothing. Slung up level with the base of the
         skull, the roll is that something, and it is the most boxer-ish
         shape available. */
      var tw = { x: nk.x - cw * 1.02, y: nk.y + cw * 0.62 };   /* clear of the back */
      /* The hanging end, and its direction is the whole silhouette argument.
         It used to drop almost straight down the spine — honest gravity, and
         invisible: the back of a cat this thick is wider than the towel, so
         in black it was a flat wall from shoulder to hip with nothing
         happening on it. Flung well back it clears the body and finishes in a
         squared hem past the hip, which is the second thing on his outline
         that is not cat-shaped. Swung out further still (1.9 chests) it left
         the figure altogether and read as a diving board. */
      var te = { x: tw.x - cw * 1.02 + f.sway * 1.3, y: tw.y - cw * 2.74 };

      /* The spine, bowed. `BOW` is how far the middle is pushed off the
         straight line between the shoulder and the hem — cloth hanging off a
         shoulder leaves it almost along the back and only turns to vertical
         once it is clear, which is a curve, and a curve is the single most
         cloth-like thing available. */
      var BOW = 0.13;
      /* Six half-widths a side and no two the same, the front list and the
         back list deliberately out of step: the towel is narrow where it is
         gripped over the shoulder and opens out as it falls, and it does it
         unevenly. This is the whole difference between cloth and a board. */
      var TWF = [0.23, 0.34, 0.30, 0.36, 0.31, 0.35];
      var TWB = [0.20, 0.27, 0.34, 0.28, 0.34, 0.30];
      var TSEG = 5;
      function towelEdges() {
        var dx = te.x - tw.x, dy = te.y - tw.y;
        var qx = (tw.x + te.x) / 2 - dy * BOW, qy = (tw.y + te.y) / 2 + dx * BOW;
        var sp = [], i, t, u;
        for (i = 0; i <= TSEG; i++) {
          t = i / TSEG; u = 1 - t;
          sp.push({ x: u * u * tw.x + 2 * u * t * qx + t * t * te.x,
                    y: u * u * tw.y + 2 * u * t * qy + t * t * te.y });
        }
        var fwd = [], bwd = [];
        for (i = 0; i <= TSEG; i++) {
          var a = sp[Math.max(0, i - 1)], b = sp[Math.min(TSEG, i + 1)];
          var ex = b.x - a.x, ey = b.y - a.y, el = Math.hypot(ex, ey) || 1;
          var nx = -ey / el, ny = ex / el;
          fwd.push({ x: sp[i].x + nx * TWF[i] * cw, y: sp[i].y + ny * TWF[i] * cw });
          bwd.push({ x: sp[i].x - nx * TWB[i] * cw, y: sp[i].y - ny * TWB[i] * cw });
        }
        return { sp: sp, fwd: fwd, bwd: bwd };
      }
      var TE = towelEdges();

      /* THREE teeth of fringe and not five. The hem is about twelve pixels
         across at game scale; five teeth is a two-pixel sawtooth, which is
         not fringe, it is a rendering artefact that crawls when he walks. */
      var TEETH = [0.66, 0.24, 0.54];
      A.add('back', function (cx) {
        var i, N = TSEG;
        cx.beginPath();
        cx.moveTo(TE.fwd[0].x, TE.fwd[0].y);
        for (i = 1; i <= N; i++) cx.lineTo(TE.fwd[i].x, TE.fwd[i].y);
        var ex = TE.bwd[N].x - TE.fwd[N].x, ey = TE.bwd[N].y - TE.fwd[N].y;
        var ux = TE.sp[N].x - TE.sp[N - 1].x, uy = TE.sp[N].y - TE.sp[N - 1].y;
        var ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        for (i = 0; i < TEETH.length; i++) {
          var k = (i + 1) / (TEETH.length + 1);
          cx.lineTo(TE.fwd[N].x + ex * k + ux * cw * 0.17 * TEETH[i],
                    TE.fwd[N].y + ey * k + uy * cw * 0.17 * TEETH[i]);
        }
        cx.lineTo(TE.bwd[N].x, TE.bwd[N].y);
        for (i = N - 1; i >= 0; i--) cx.lineTo(TE.bwd[i].x, TE.bwd[i].y);
        cx.closePath();
      }, TOWEL, { edge: true });

      /* ONE hard fold down the back third of it. This is where the cloth
         reads: a towel folded over a shoulder falls in two thicknesses and
         the far one is in shadow, with a hard edge between them because the
         fold is a crease and not a curve. It is the same shape the towel is,
         cut off 0.42 of the way across, so it can never drift off it. */
      A.add('back', function (cx) {
        var i, N = TSEG;
        cx.beginPath();
        cx.moveTo(TE.bwd[0].x, TE.bwd[0].y);
        for (i = 1; i <= N; i++) cx.lineTo(TE.bwd[i].x, TE.bwd[i].y);
        for (i = N; i >= 0; i--) {
          cx.lineTo(TE.bwd[i].x + (TE.fwd[i].x - TE.bwd[i].x) * 0.42,
                    TE.bwd[i].y + (TE.fwd[i].y - TE.bwd[i].y) * 0.42);
        }
        cx.closePath();
      }, A.shade(TOWEL, 0.30), { flat: true });

      /* one red stripe above the hem. Every towel in every corner of every
         gym has one, it is a solid shape rather than a line so it survives
         the drop to 1:1, and it pulls the towel into the same kit as the
         gloves instead of leaving it a loose white rag. Laid across the
         towel's own edges at 0.74 of its length, so it travels with the
         cloth however the thing swings. */
      A.add('back', function (cx) {
        function across(t, k) {
          var i = t * TSEG, i0 = Math.floor(i), i1 = Math.min(TSEG, i0 + 1), u = i - i0;
          var fx = TE.fwd[i0].x + (TE.fwd[i1].x - TE.fwd[i0].x) * u;
          var fy = TE.fwd[i0].y + (TE.fwd[i1].y - TE.fwd[i0].y) * u;
          var bx = TE.bwd[i0].x + (TE.bwd[i1].x - TE.bwd[i0].x) * u;
          var by = TE.bwd[i0].y + (TE.bwd[i1].y - TE.bwd[i0].y) * u;
          return { x: fx + (bx - fx) * k, y: fy + (by - fy) * k };
        }
        var p0 = across(0.70, 0), p1 = across(0.70, 1),
            p2 = across(0.82, 1), p3 = across(0.82, 0);
        cx.beginPath();
        cx.moveTo(p0.x, p0.y); cx.lineTo(p1.x, p1.y);
        cx.lineTo(p2.x, p2.y); cx.lineTo(p3.x, p3.y);
        cx.closePath();
      }, '#b8362c', { flat: true, edge: true });
      /* The roll over the shoulder — what makes the slab read as draped on
         him rather than hung on a hook behind. Its BACK end is lifted well
         above the front one on purpose: laid flat along the shoulder it was
         inside the outline and, in black, he was one smooth dome from ear to
         hip with nothing happening at the top of him. Tipped up it puts a
         hump behind the skull with a notch between the two, which is the
         cheapest silhouette feature available and the most boxer-ish. */
      A.add('back', function (cx) {
        A.capsule(cx, { x: nk.x - cw * 0.02, y: nk.y + cw * 0.80 },
                      { x: nk.x - cw * 1.10, y: nk.y + cw * 1.06 },
                  cw * 0.26, cw * 0.34);
      }, TOWEL, { band: true, edge: true });

      /* A short end of the towel hanging over the FRONT of that shoulder
         was tried, to say draped rather than hung on a hook. It landed on
         the chest, took the near arm's cast shadow across it, and read as a
         satchel — a hard dark rectangle in the one place the eye goes. The
         roll over the shoulder does the same job without putting anything
         in front of him, so there is only the roll and the back end now. */
    },

    /* The laces. Three ticks across the near mitt, one pixel wide, drawn
       free-hand over the finished cat because a stroke added to the shape
       list gets the contour pass too and comes out as three fat black bars.
       They are the only thing on him that is detail rather than shape, and
       they earn it: laces are what the eye checks a boxing glove against —
       which is also why the pale lace PANEL under them could go without
       being missed, and these could not.

       The radius follows `gr`, not the old 0.88 of a skull: measured off the
       smaller number the ticks landed inside the mitt in a huddle rather
       than across its knuckles. */
    overlay: function (ctx, j, fig) {
      var s = fig.s;
      ctx.save();
      ctx.strokeStyle = 'rgba(60,40,30,.65)';
      ctx.lineWidth = Math.max(1, 0.9 * s);
      ctx.lineCap = 'butt';
      /* The near mitt only. The far hand's ticks landed on his chest as
         often as on the glove — it is behind the near one — and three more
         strokes a draw is three more on a cat that was already the most
         expensive to draw on the roster. */
      [[j.handF, j.elbF, 1.16]].forEach(function (h) {
        var hand = h[0], elb = h[1], k = h[2];
        var dx = hand.x - elb.x, dy = hand.y - elb.y, L = Math.hypot(dx, dy) || 1;
        var ux = dx / L, uy = dy / L, px = -dy / L, py = dx / L;
        var r = j.headR * 0.88 * k;
        for (var q = 0; q < 3; q++) {
          var u = (-0.14 + q * 0.30) * r;
          ctx.beginPath();
          ctx.moveTo(hand.x + ux * u + px * r * 0.86, hand.y + uy * u + py * r * 0.86);
          ctx.lineTo(hand.x + ux * (u + 0.16 * r) + px * r * 0.58,
                     hand.y + uy * (u + 0.16 * r) + py * r * 0.58);
          ctx.stroke();
        }
      });
      ctx.restore();
    }
  },

  displayName: 'FIGURO',
  subtitle: 'The Boxer',
  blurb: 'Stands up on his back legs and throws hands until you stop enjoying it, then he is somewhere else entirely.',
  difficulty: 2,
  palette: {
    /* `kit` is empty on purpose — see the note above `look`. The gloves,
       trunks, boots, wraps and towel are all geometry now, not decals, and
       rig's built-in versions would draw on top of them.

       The fur went a shade deeper and browner than it was. The old tan sat
       at nearly the same value as the sand waistband, and a cat wearing kit
       he is the same brightness as is a cat wearing nothing. */
    kit: {},
    fur: '#9c7c4e', fur2: '#7d6039', belly: '#e4d5b2', marks: '#4c3520',
    eye: '#8fc24a', nose: '#d99aa0', inner: '#e2a8a0',
    accent: '#7a5c32', accessory: 'none', pattern: 'tabby',
    tailTip: '#4c3520', line: 'rgba(40,28,16,.55)'
  },
  stats: { walkF: 1.64, walkB: 1.44, jumpVy: 9.6, jumpVx: 3.2, gravity: 0.48,
           health: 670, stunMax: 106, weight: 1.02, hasDash: true },
  mod: { reach: 0.98, damage: 1.06, speed: 0.90 },
  specials: [
    {
      id: 'rapidpaws', name: 'Rapid Paws',
      desc: 'Up on his back legs with both paws going, twenty-eight frames of it. Mash the button to bring it out.', kind: 'special',
      motion: 'mash', buttons: ['LP', 'MP', 'HP'], stance: ['stand'],
      startup: 5, active: 28, recovery: 18,
      damage: [15, 16, 17], stun: 3, chip: 3,
      hitstun: 11, blockstun: 9, multiHit: 6, hitGap: 5,
      pushback: 0.6, blockPushback: 1.4,
      hitbox: { x: 20, y: 42, w: 34, h: 24 },
      meterGain: 5, meterOnHit: 4,
      anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.boxStance },
             { at: 9, p: Ps.boxA }, { at: 14, p: Ps.boxB },
             { at: 19, p: Ps.boxA }, { at: 24, p: Ps.boxB },
             { at: 29, p: Ps.boxA }, { at: 34, p: Ps.boxStance },
             { at: 51, p: Ps.stand }]
    },
    {
      id: 'cutandrun', name: 'Cut and Run',
      desc: 'Not an attack at all — a fast, invincible retreat. Frames 1 to 12 pass straight through whatever they threw.', kind: 'special',
      motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 3, active: 10, recovery: 12, noAttack: true,
      /* invincible on the way out — the only true escape on the roster */
      invuln: [1, 12], meterGain: 7,
      anim: [{ at: 0, p: Ps.stand }, { at: 3, p: Ps.retreatWind },
             { at: 7, p: Ps.retreatAir }, { at: 16, p: Ps.retreatAir },
             { at: 21, p: Ps.land }, { at: 25, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 2) {
          f.vx = -f.facing * (6.0 + strength * 0.8);
          f.vy = 3.4;
          f.grounded = false;
        }
      }
    }
  ],
  supers: [{
    id: 'superPaws', name: 'TEN THOUSAND PAWS',
    desc: 'Forty-four frames of paws, and the first nine of them are invincible.', motion: 'qcfx2',
    buttons: ['LP', 'MP', 'HP'], cost: 100,
    startup: 5, active: 44, recovery: 24, freeze: 26,
    damage: 28, stun: 4, chip: 5, multiHit: 12, hitGap: 4,
    hitstun: 12, blockstun: 9, knockdown: 'soft',
    pushback: 0.5, blockPushback: 1.4,
    invuln: [0, 9],
    hitbox: { x: 18, y: 38, w: 40, h: 30 },
    anim: [{ at: 0, p: Ps.boxStance }, { at: 5, p: Ps.boxA },
           { at: 11, p: Ps.boxB }, { at: 17, p: Ps.boxA },
           { at: 23, p: Ps.boxB }, { at: 29, p: Ps.boxA },
           { at: 35, p: Ps.boxB }, { at: 41, p: Ps.boxA },
           { at: 49, p: Ps.boxStance }, { at: 73, p: Ps.stand }]
  }]
  };
})();
