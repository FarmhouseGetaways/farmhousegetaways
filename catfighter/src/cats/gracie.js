/* =====================================================================
   1 — GRACIE. The first of the real cats.

   Old and wise, so she does not scramble: she takes up space with a
   growl that carries and a tail that reaches further than anything else
   on the ground, and lets the young ones come to her.

   Colours read from her photograph: a warm solid grey with a silver
   undercoat coming through on the chest, a pale muzzle, dark mauve paw
   pads and no tabby striping anywhere.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.gracie = {
  id: 'gracie',
  weightClass: 'medium',
    /* Upright, weight back, lead paw open and low, and a wide base — the
       legs are spread four degrees each way and she sits a shade lower than
       the shared idle. She does not chase anybody: she waits, and you come
       to her, and the stance has to say that before she moves. These are
       deltas laid over EVERY pose, so they stay small — a big one here
       bends her crouch and her jump out of shape too. */
  stance: { torso: -3, py: 0.4, armF: [-10, -20], armB: [-8, 2], head: [0, 0, -2],
            legF: [4, -4], legB: [-4, 4] },
  build: { s: 1.02, girth: 1.06, limb: 0.99, head: 1.00, muscle: 0.9,
           headShape: 'round', ear: 'small', shoulder: 1.02, waist: 0.98, limbW: 1.02 },

  /* ---- HER LOOK ---------------------------------------------------------

     The costume, not the colour, is what makes a fighting-game character
     recognisable — you know Ryu from the gi and Zangief from the outline
     with the screen upside down. Gracie is the old master, so she wears the
     oldest thing on the roster: a gi gone the colour of bone, a black belt
     worn grey at the fold, and forearm wraps.

     Three passes were needed to make that anything more than a paint job,
     and the lesson is the same each time: A COSTUME DRAWN INSIDE THE BODY
     OUTLINE IS NOT A COSTUME. First a vest stopping at the waist, which at
     game size was a pale patch on a grey cat. Then a short hem, which a
     judged silhouette pass measured at 0.73 overlap with Figuro and 0.71
     with Ruby — she was still the bare rig with a bib on.

     What she has now is THREE shapes that leave the body line, and the
     order of them is the order of how much work they do:

       the SKIRT   two frayed panels flaring past twice her hip width and
                   hanging to mid-shin, the leading leg through the split
       the SLEEVE  a short heavy cuff standing off the near upper arm
       the COLLAR  a doubled band on the 'back' layer, up past the shoulder

     plus the headband tails, which were the only one she had before and
     which now whip off `f.sway` rather than being stamped on the skull.

     `pieces` adds real geometry into the figure at four points in the draw
     order — 'back', 'body', 'front', 'head' — and everything it adds gets
     the same contour pass and the same cel shading as the fur underneath
     it. `f` carries the measurements: chestW, waistW, hipW, headR, the limb
     radii, and the tones. See the COSTUME block in rig.js.               */
  look: {
    pieces: function (A, j, f) {
      /* Bone, not white: a gi this old has been washed a thousand times.
         FOLD and LAPEL are the same cloth turned away from the light, which
         is how a real one reads — one material, three planes — rather than
         stripes of a second colour sewn on. They are two steps and not one
         because the cel shading is already laying a crescent of its own down
         the side of the torso, and a single step got lost inside it. The
         belt is nearly black so it survives the drop to 384x224, where a
         mid-tone belt on a mid-tone cat vanishes. */
      var GI = '#f1e9d5', FOLD = '#cdbc99', LAPEL = '#b6a17c',
          BELT = '#2e2a29', KNOT = '#413b39';

      /* Everything is laid out along the spine: T(t, w) is t of the way from
         pelvis (0) to neck (1), pushed w sideways — +w forward, the way she
         is facing. t goes negative below the pelvis, which is where the hem
         lives. One helper, because a garment that does not follow the spine
         slides off the body the moment she leans. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;          /* forward, across the spine */
      function T(t, w) { return { x: p.x + dx * t + fx * w, y: p.y + dy * t + fy * w }; }
      function line(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, q.y); }

      /* ===================================================================
         TWO THINGS THE REST OF THIS FILE LEANS ON, AND THEY ARE BOTH ABOUT
         WHERE A SHAPE GOES IN THE DRAW ORDER RATHER THAN WHAT IT LOOKS LIKE.

         1. EVERY COSTUME SHAPE GETS A CONTOUR. rig.js strokes the whole
            shape list at OUTLINE * 2 before it fills any of it, and there is
            no flag to opt out. So a piece of interior detail — a fold in
            cloth, a shadow inside a forearm — cannot simply be added: it
            would come out ringed in black like a sticker.

            It works anyway if the shape is drawn STRICTLY INSIDE something
            filled BEFORE it. The contour pass lays the ring down on bare
            canvas; the earlier fill paints straight over it; the detail then
            goes down clean. Every fold, crease and shadow below is placed
            with that in mind, which is why the order of the A.add calls in
            this function is not free to change.

         2. THE SAME RULE BACKWARDS GIVES FUR ON THE SILHOUETTE. A ragged
            shape added to a layer UNDER the limb it belongs to keeps only
            the teeth standing proud of it — the roots are painted over, so
            there is no seam, and what is left is an irregular edge in the
            contour colour with a core of fur inside the bigger teeth. That
            is the single biggest thing separating a drawn sprite from a
            vector figure at this size, and it is why the fur runs go in
            'back' (under the far limbs and the tail) and 'body' (under the
            near limbs and the head) rather than in 'front'.
         =================================================================== */

      /* One run of ragged fur. `ax,ay`→`bx,by` is the root line, `nx,ny` the
         way the teeth point. Teeth are cut with lineTo and never smoothed —
         A.smooth rounds a two-pixel tooth away to nothing, and the point of
         the whole exercise is the tooth. `phase` shifts the length pattern so
         no two runs on the cat are the same run, which is most of what stops
         a pair of limbs reading as mirrored. */
      function saw(cx, ax, ay, bx, by, nx, ny, root, out, count, phase) {
        cx.moveTo(ax - nx * root, ay - ny * root);
        for (var i = 0; i < count; i++) {
          /* THE VALLEYS ARE NOT EVENLY SPACED and the apexes are not centred.
             Cut on a regular pitch — which is what `i / count` on its own
             gives you — a run of teeth reads as a COMB: a manufactured edge,
             and the eye picks the repeat out instantly at any size. Both are
             jittered off the same cheap wave as the length, so a run is
             reproducible frame to frame (it must be, or it crawls) and still
             looks cut by hand. */
          var jit = Math.sin((i + phase) * 5.31) * 0.16;
          var u0 = (i + jit * 0.5) / count;
          var um = (i + 0.30 + jit) / count;
          cx.lineTo(ax + (bx - ax) * u0, ay + (by - ay) * u0);
          var g = out * (0.42 + 0.58 * Math.abs(Math.sin((i + phase) * 2.17)));
          cx.lineTo(ax + (bx - ax) * um + nx * g, ay + (by - ay) * um + ny * g);
        }
        cx.lineTo(bx, by);
        cx.lineTo(bx - nx * root, by - ny * root);
        cx.closePath();
      }

      /* Fur along the TRAILING edge of a limb segment — the back of a calf,
         the back of a forearm, where a cat's feathering actually grows. The
         side is fixed in the limb's own frame rather than picked from which
         way is backwards on screen: chosen on screen it flips over as soon as
         she throws a punch and the whole run jumps to the other side of the
         arm between two frames. */
      function furLimb(cx, a, b, t0, t1, r, out, count, phase) {
        var ux = b.x - a.x, uy = b.y - a.y, l = Math.hypot(ux, uy) || 1;
        ux /= l; uy /= l;
        var nx = uy, ny = -ux;                 /* the back of the limb */
        saw(cx, a.x + (b.x - a.x) * t0 + nx * r, a.y + (b.y - a.y) * t0 + ny * r,
            a.x + (b.x - a.x) * t1 + nx * r, a.y + (b.y - a.y) * t1 + ny * r,
            nx, ny, r * 1.05, out, count, phase);
      }

      /* --- the gi top: over the trunk, cut away at the shoulders so the
             deltoids stay in the silhouette. On 'body', which is over the
             far arm and under the near one — a sleeveless top in side view
             has the near arm in FRONT of the cloth, and putting this on
             'front' buried her whole leading shoulder. --- */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(0.20, f.hipW * 1.12), T(0.44, f.waistW * 1.30),
          T(0.68, f.chestW * 1.06), T(0.90, f.chestW * 1.14),
          T(1.10, f.chestW * 0.46), T(1.14, -f.chestW * 0.44),
          T(1.02, -f.chestW * 1.16), T(0.60, -f.chestW * 1.24),
          T(0.34, -f.waistW * 1.40), T(0.16, -f.hipW * 1.20)
        ]);
      }, GI, { band: true, edge: true });

      /* --- THE SLEEVES. The gi was cut away at the shoulder and the bare
             deltoid carried on out of it, which is the definition of a decal
             — a bib of cloth painted inside the chest outline. A gi has
             sleeves, and a short heavy sleeve standing proud of the arm is
             the second thing after the skirt that puts cloth on her OUTLINE
             rather than on her fur. Cut at half the upper arm they were too
             much of a good thing — her shoulders became one cream blob with
             the deltoid buried and the arm apparently starting at the elbow.

             They are cut a THIRD of the way down the upper arm and they
             FLARE: the cuff is wider than the shoulder, so the edge stands off the
             bicep instead of shrink-wrapping it. Drawn the other way round,
             tapering to the arm, they read as a bandage.

             ONE sleeve, on the near arm only. A matching one on the far arm
             was drawn and taken out again: the far arm is already inside the
             torso mass, so all it did was add cream to a cream shape and
             bury the far deltoid, and it cost a contour and a clip a frame
             for a change nobody could see. It is FOLD rather than GI for the
             same reason a real sleeve reads — the side of a tube is turned
             away from the light, and the darker plane is what separates the
             sleeve from the chest without an outline round it. --- */
      function sleeve(cx, sh, elb, along, r0, r1) {
        var dx2 = elb.x - sh.x, dy2 = elb.y - sh.y;
        var L2 = Math.hypot(dx2, dy2) || 1;
        var ux = dx2 / L2, uy = dy2 / L2;         /* down the arm */
        var px = -uy, py = ux;                    /* across it */
        /* back up the arm a little so the cloth starts ON the shoulder and
           there is no seam of fur showing between gi and sleeve */
        var ax = sh.x - ux * L2 * 0.16, ay = sh.y - uy * L2 * 0.16;
        var bx2 = sh.x + ux * L2 * along, by2 = sh.y + uy * L2 * along;
        A.smooth(cx, [
          { x: ax + px * r0, y: ay + py * r0 },
          { x: bx2 + px * r1, y: by2 + py * r1 },
          { x: bx2 + px * r1 * 0.10, y: by2 + py * r1 * 0.10 },
          { x: bx2 - px * r1, y: by2 - py * r1 },
          { x: ax - px * r0 * 0.92, y: ay - py * r0 * 0.92 }
        ]);
      }
      A.add('front', function (cx) {
        sleeve(cx, j.shF, j.elbF, 0.42, f.R_TOP * 1.22, f.R_TOP * 1.56);
      }, FOLD, { band: true, edge: true });

      /* THE SHADOW THE CUFF THROWS ON THE ARM. A garment that does not cast
         anything onto what it is worn over is a decal however well it is
         drawn — the cuff and the bicep were two shapes meeting at a line and
         nothing said which was in front. One hard band of the fur's own
         shadow tone, immediately below where the sleeve stops, and the arm
         goes behind the cloth.

         It carries no contour because it lies inside the upper arm, which
         rig fills before the 'front' layer is poured; and it is `flat`
         because an occlusion shadow is one value. Cel-shading a shadow gives
         you a shadow with a highlight on it, which is not a thing. */
      A.add('front', function (cx) {
        cx.beginPath();
        bandPath(cx, j.shF, j.elbF, 0.42, 0.60, f.R_MID * 1.02, f.R_MID * 0.90, 0.04);
      }, A.shade(f.furFront, 0.40), { flat: true });

      /* THE LAPEL — the shape that says gi and not vest. It runs from the
         collar down the front to the belt, and it is a wide band rather than
         a line because a line is gone at game size.

         It is a third tone and not FOLD. Drawn in the same cloth-in-shadow
         colour as the sleeve and the collar it disappeared: at 384x224 the
         torso is about twenty pixels across, the cel shading is already
         laying a crescent of shadow down one side of it, and a lapel four
         steps from the gi is inside that. LAPEL is a real step darker — far
         enough to survive, not so far that it reads as a second garment.

         The OUTER edge stands slightly proud of the gi top's own edge, which
         is the whole trick: a lapel is a thickness of doubled cloth folded
         back, so it breaks the chest line rather than sitting inside it, and
         that reads even when the colour does not. */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(1.12, f.chestW * 0.42), T(0.90, f.chestW * 1.24),
          T(0.56, f.chestW * 1.20), T(0.26, f.chestW * 1.10),
          T(0.28, f.chestW * 0.46), T(0.62, f.chestW * 0.54),
          T(1.00, f.chestW * 0.60)
        ]);
      }, LAPEL, { edge: true });

      /* --- WHAT THE GI TOP IS DOING, which until now was nothing ---------

             A gi over a fighter's back is not a flat panel. It is pulled off
             the shoulder blade, it bags at the small of the back, and it is
             stuffed into the belt — three creases, and they all run the same
             way, which is the way the cloth is being pulled. Straight-sided
             and flat-filled like the skirt's, for the same reason: cloth
             creases in planes and fur does not.

             Placed after the lapel so the gi top's own fill has already
             painted out their contours. */
      function crease(cx, t0, w0, wid0, t1, w1, wid1) {
        var a = T(t0, w0 - wid0); cx.moveTo(a.x, a.y);
        line(cx, t0, w0 + wid0);
        line(cx, t1, w1 + wid1);
        line(cx, t1, w1 - wid1);
        cx.closePath();
      }
      /* THEY ARE THE DARK TONE, NOT THE MIDDLE ONE, and that is the whole
         lesson of the first attempt. Drawn in FOLD they were invisible: the
         cel shading has already laid a crescent of shadow down the BACK of
         the gi — mixed 46% towards the cool dark — and the back is exactly
         where a crease off the shoulder blade goes. A mid-tone crease inside
         a shadow that deep is nothing at all. LAPEL clears it. */
      A.add('body', function (cx) {
        cx.beginPath();
        var C = f.chestW;
        /* off the far shoulder blade, running down to the waist */
        crease(cx, 0.92, -C * 0.80, C * 0.13, 0.46, -C * 0.44, C * 0.06);
        /* the bag at the small of the back, above where the belt takes it */
        crease(cx, 0.60, -C * 0.14, C * 0.10, 0.38, -C * 0.34, C * 0.05);
        /* and the gather where the front of it is tucked in */
        crease(cx, 0.58, C * 0.34, C * 0.09, 0.38, C * 0.24, C * 0.05);
      }, LAPEL, { flat: true });

      /* THE COLLAR, and it is on 'back'.

         It was on 'body' before, which meant it was drawn INSIDE the torso
         outline and you never saw it: a shape the width of two pixels doing
         nothing but change the colour of cloth that was already there. A
         collar on a worn gi is a doubled band that stands UP behind the neck
         — it is the one piece of her kit that belongs above the shoulder
         line, and 'back' is the layer that lets it get there, because
         everything else is painted over the top of it and what survives is
         exactly the part standing proud.

         It is the third shape breaking her outline, after the skirt and the
         sleeve, and it is the only one up at the shoulders. */
      A.add('back', function (cx) {
        A.smooth(cx, [
          T(1.16, -f.chestW * 0.18), T(1.40, -f.chestW * 0.46),
          T(1.38, -f.chestW * 1.20), T(1.06, -f.chestW * 1.52),
          T(0.86, -f.chestW * 1.30), T(0.98, -f.chestW * 0.60)
        ]);
      }, FOLD, { band: true, edge: true });

      /* --- THE SKIRT. This is her silhouette, and it took three goes to
             work out that it had to be this big.

             It began as a vest stopping at the waist, which at game size was
             a pale patch on a grey cat. Then a hem a third of the way down
             her thighs, which is what a judged silhouette pass caught: it
             flared about four pixels at 384x224, and turned black she was
             still the bare rig — 0.73 overlap with Figuro, 0.71 with Ruby.

             It now flares to more than twice her hip width and hangs to
             mid-shin, so the whole middle of her outline is CLOTH and not
             leg: a wide ragged trapezoid where every other cat on the roster
             has two legs and a gap between them. That is a shape you can
             name with the picture upside down, which is the test.

             Nothing behind her would have done instead. Two attempts to
             trail a belt end backwards both failed because HER TAIL ALREADY
             OWNS THE BACK — shallow it crossed the tail in an X, steepened
             it lay along it and disappeared.

             It is TWO PANELS with the leading leg coming through the split,
             not one skirt. Drawn as a single closed shape at this width and
             length it was a bell — a crinoline, not a gi, and it swallowed
             her back leg whole. The split is what makes it martial: the gap
             is over the near thigh, and the near leg is drawn UNDER the
             'front' layer, so the leg reads straight through it for free.

             On 'front' so the panels hang OVER her near thigh, the way a gi
             skirt does; on 'body' the leg was painted straight over them and
             the whole point was lost. The bottom edge is cut with lineTo and
             not smoothed, because A.smooth rounds a two-pixel tooth away to
             nothing and the fray is the silhouette. --- */
      /* THE HEM IS CLAMPED TO THE SOLE PLANE. The panels hang from the belt
         and the belt follows the pelvis, so on a crouch or a sweep they hung
         a third of her height THROUGH the floor — which is exactly the trap
         mario.js records hitting with his apron. y = 0 is the sole plane;
         the hem stops just above it and the cloth bunches instead, which is
         what cloth does when you drop into a stance wearing it. */
      var FLOOR = 3.0 * f.s;
      function hem(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, Math.max(FLOOR, q.y)); }
      function panel(cx, wOut, wIn, drop, teeth) {
        cx.beginPath();
        var a = T(0.32, wIn * 0.62); cx.moveTo(a.x, a.y);
        line(cx, 0.30, wOut * 0.58);
        hem(cx, -0.06, wOut * 0.94);
        hem(cx, drop + 0.06, wOut);
        for (var i = 0; i <= teeth; i++) {
          var u = i / teeth;
          hem(cx, drop + (0.10) * u - (i % 2 ? 0.11 : 0),
              wOut * 0.97 + (wIn - wOut * 0.97) * u);
        }
        hem(cx, 0.02, wIn * 0.80);
        cx.closePath();
      }
      /* the back panel hangs longest — the far side of the skirt is the side
         she is not standing on, so nothing holds it up */
      A.add('front', function (cx) {
        panel(cx, -f.hipW * 2.46, -f.hipW * 0.10, -0.70, 6);
      }, GI, { band: true, edge: true });
      A.add('front', function (cx) {
        panel(cx, f.hipW * 2.34, f.hipW * 0.42, -0.58, 6);
      }, GI, { band: true, edge: true });

      /* --- THE FOLDS IN IT, which is what makes it cloth ------------------

             The skirt is the largest single area on her and until now it had
             nothing in it at all: two flat cream slabs with a shadow crescent
             down one side, which at game size is a sheet of paper. Cloth
             hanging off a belt does not shade like a limb — it breaks into
             straight-sided PLANES that run from where it is gathered to where
             it hangs free, and the boundary between two planes is hard.

             So they are wedges, cut with lineTo and filled FLAT: one tone,
             no cel shading. That is the material difference doing the work.
             Her fur gets three tones and a soft crescent; her cloth gets flat
             planes with hard edges; her belt is darker still and gets one lit
             face. Three materials, three recipes, and none of them is the
             others turned up or down.

             They carry no contour, and that is not luck. Every costume shape
             is stroked at OUTLINE * 2 before anything is filled — so a fold
             added on its own would be ringed in black. These are added AFTER
             the panels and lie strictly inside them, so the panel's own fill
             paints the ring out before the fold goes down. Move either A.add
             above the panels and you get four black wedges.

             Six of them, at four different widths and three lengths, because
             a fan of evenly spaced folds is a pleated skirt. Cloth gathers
             unevenly: two close together where the belt has bunched it, one
             on its own out at the flare.                                 */
      /* A fold is a TAPER, not a ray. Drawn from a single point at the belt
         the six of them came out as a sunburst — the eye reads converging
         lines as radiating from a source, and the source was her navel.
         Started as a short segment they read as what they are: cloth
         gathered at the waist and opening as it falls. */
      function fold(cx, tTop, wTop, tBot, wA, wB) {
        var w0 = (wB - wA) * 0.16;
        var a = T(tTop, wTop - w0); cx.moveTo(a.x, a.y);
        line(cx, tTop - 0.02, wTop + w0);
        hem(cx, tBot + 0.05, wB);
        hem(cx, tBot, (wA + wB) / 2);
        hem(cx, tBot + 0.04, wA);
        cx.closePath();
      }
      A.add('front', function (cx) {
        cx.beginPath();
        /* the front panel: one deep gather beside the split, two out at the
           flare, the outer one shorter because the cloth lifts as it swings */
        fold(cx, 0.26, f.hipW * 0.66, -0.50, f.hipW * 0.52, f.hipW * 1.00);
        fold(cx, 0.24, f.hipW * 1.32, -0.54, f.hipW * 1.30, f.hipW * 1.66);
        fold(cx, 0.22, f.hipW * 1.74, -0.44, f.hipW * 1.96, f.hipW * 2.24);
        /* the back panel, hanging longer and gathered harder at the top */
        fold(cx, 0.26, -f.hipW * 0.62, -0.62, -f.hipW * 0.46, -f.hipW * 1.02);
        fold(cx, 0.24, -f.hipW * 1.26, -0.66, -f.hipW * 1.22, -f.hipW * 1.60);
        fold(cx, 0.23, -f.hipW * 1.84, -0.58, -f.hipW * 2.00, -f.hipW * 2.32);
      }, FOLD, { flat: true });
      /* One crease darker than the rest, in the gather beside the split where
         two thicknesses of cloth lie over each other. A second value in the
         same material is what stops the folds reading as printed stripes. */
      A.add('front', function (cx) {
        cx.beginPath();
        fold(cx, 0.25, f.hipW * 0.74, -0.48, f.hipW * 0.66, f.hipW * 0.90);
        fold(cx, 0.25, -f.hipW * 1.30, -0.64, -f.hipW * 1.30, -f.hipW * 1.46);
      }, LAPEL, { flat: true });

      /* --- the belt. Wider than the gi at that height so it reads as a band
             laid over it, and dark enough to be the one hard value break on
             a cat who is otherwise grey on cream. --- */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.13, f.hipW * 1.26), T(0.35, f.hipW * 1.14),
          T(0.36, -f.hipW * 1.22), T(0.12, -f.hipW * 1.34)
        ]);
      }, BELT, { band: true, edge: true });

      /* THE TOP OF THE BELT CATCHES THE LIGHT, and it is the only place on
         her a third material declares itself. The belt is heavy cloth: it
         does not crease like the gi and it does not break up like fur, it
         turns one hard corner where the top face meets the front. So it gets
         a single narrow lit plane along that corner and nothing else — no
         folds, no texture. One flat band, laid inside the belt so the belt's
         own fill has taken its contour out first.

         It is A.lit rather than a colour typed in, so it moves with the same
         lamp as everything else if that lamp is ever changed. */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.325, f.hipW * 1.16); cx.moveTo(a.x, a.y);
        line(cx, 0.345, -f.hipW * 1.20);
        line(cx, 0.30, -f.hipW * 1.18);
        line(cx, 0.28, f.hipW * 1.12);
        cx.closePath();
      }, A.lit(BELT, 0.30), { flat: true });

      /* the knot, sat on the front of the belt where the eye lands */
      A.add('front', function (cx) {
        var k = T(0.24, f.hipW * 0.90);
        A.ellipse(cx, k.x, k.y, 3.6 * f.s, 3.0 * f.s, 0.3);
      }, KNOT, { band: true, edge: true });

      /* the short end hanging off the knot. There were two of these; the
         long swinging one below took the second one's job and did it better,
         and three belt ends on a belt is a knitting pattern. */
      function strap(cx, w0, t1, w1, wid) {
        cx.beginPath();
        var a = T(0.22, w0 - wid); cx.moveTo(a.x, a.y);
        line(cx, 0.22, w0 + wid);
        line(cx, t1 + 0.04, w1 + wid * 0.82);
        line(cx, t1, w1 + wid * 0.10);      /* a cut corner, not a round end */
        line(cx, t1 + 0.05, w1 - wid * 0.86);
        cx.closePath();
      }
      A.add('front', function (cx) {
        strap(cx, f.hipW * 0.94, -0.26, f.hipW * 1.12, f.hipW * 0.17);
      }, BELT, { edge: true });


      /* --- THE BELT END, and where it is NOT.

             It hangs down the FRONT, off the knot the eye already lands on,
             long enough to swing past the hem. Trailing it backwards is the
             obvious thing and it was tried twice: HER TAIL ALREADY OWNS THE
             BACK, so at a shallow angle the two crossed in an X of dark bars
             and steepened to clear the tail it lay along it and vanished.
             `ang` past 180 is what turns a streamer round to leave forwards.

             `f.sway` folds her speed, a slow idle drift and being airborne
             into one number, so it lifts and lags when she moves. The
             constant taken off it is GRAVITY: at rest `sway` is near zero
             and the streamer came out dead straight, which read as a
             scabbard rather than cloth. --- */
      A.add('front', function (cx) {
        A.streamer(cx, T(0.19, f.hipW * 0.74), 18 * f.s, 2.9 * f.s,
                   252, f.sway - 1.0);
      }, BELT, { band: true, edge: true });

      /* --- THE WRAPS, which used to be paint ------------------------------

             `palette.kit.wraps` gets you four flat bands stroked across each
             forearm AFTER the figure is finished: no contour, no shading, the
             same four on both arms. On a cat whose whole point is that she
             has been doing this longer than anybody else, the one piece of
             kit that says so was a decal — the exact thing every other note
             in this file is about not doing.

             It is geometry now. A cuff with a contour and three tones like
             everything else she wears, cut across at the ends because that is
             where the cloth stops, and it goes THINNER towards the wrist
             where a real wrap is a single layer over the tendons and thicker
             at the heel of the hand where it doubles back.

             Different on each arm, deliberately. The near one runs to the
             wrist and carries the loose end; the far one stops short. Two
             identical wraps is the mirrored pair the brief warns about, and
             at this size the eye catches a matched pair faster than it reads
             any of the detail inside them.

             The far one has no `band`. A lit rim costs two more fills and a
             wider clip, and it is being spent on a piece of cloth that is
             already sitting in the far-side tone behind the whole cat: two
             tones there and three on the near arm is the same call rig makes
             for the limbs underneath them, and it buys back most of what the
             near cuff costs.                                             */
      var WRAP = '#e8e0cf', WRAPC = '#a99f8a';
      function bandPath(cx, a, b, t0, t1, r0, r1, skew) {
        var ux = b.x - a.x, uy = b.y - a.y, l = Math.hypot(ux, uy) || 1;
        ux /= l; uy /= l;
        var px = -uy, py = ux;                    /* across the limb */
        function P(t, v) {
          return { x: a.x + ux * l * t + px * v, y: a.y + uy * l * t + py * v };
        }
        var q = P(t0 + skew, r0); cx.moveTo(q.x, q.y);
        q = P(t1, r1); cx.lineTo(q.x, q.y);
        q = P(t1 - skew, -r1); cx.lineTo(q.x, q.y);
        q = P(t0, -r0); cx.lineTo(q.x, q.y);
        cx.closePath();
      }
      /* the turns of cloth, laid across the cuff. Thin, flat and with no
         contour of their own — they lie inside the cuff, which is filled
         first and paints the contour pass out from under them. */
      function turns(cx, a, b, r, ts, wid) {
        var ux = b.x - a.x, uy = b.y - a.y, l = Math.hypot(ux, uy) || 1;
        ux /= l; uy /= l;
        var px = -uy, py = ux;
        for (var i = 0; i < ts.length; i++) {
          var t = ts[i];
          var x0 = a.x + ux * l * t, y0 = a.y + uy * l * t;
          var sk = ux * wid * 0.9, sky = uy * wid * 0.9;   /* the spiral */
          cx.moveTo(x0 + px * r + sk, y0 + py * r + sky);
          cx.lineTo(x0 - px * r, y0 - py * r);
          cx.lineTo(x0 - px * r - ux * wid, y0 - py * r - uy * wid);
          cx.lineTo(x0 + px * r + sk - ux * wid, y0 + py * r + sky - uy * wid);
          cx.closePath();
        }
      }
      A.add('far', function (cx) {
        cx.beginPath();
        bandPath(cx, j.elbB, j.handB, 0.36, 0.86, f.R_MID * 0.86, f.R_END * 0.90, 0.07);
      }, A.shade(WRAP, 0.22), { edge: true });   /* no band: see below */
      A.add('far', function (cx) {
        cx.beginPath();
        turns(cx, j.elbB, j.handB, f.R_MID * 0.86, [0.54, 0.72], 1.5 * f.s);
      }, A.shade(WRAPC, 0.18), { flat: true });
      A.add('front', function (cx) {
        cx.beginPath();
        bandPath(cx, j.elbF, j.handF, 0.26, 1.04, f.R_MID * 0.96, f.R_END * 0.96, 0.09);
        /* THE LOOSE END, and it is the only part of the wrap that reaches the
           silhouette. Everything else here is a shape drawn inside the arm —
           good detail, and by the rule at the top of this file it changes
           nothing about her outline. A flap of cloth left hanging off the
           back of the wrist does, on the near arm only, and it is what says
           somebody tied this on themselves rather than being issued it. */
        var ux = j.handF.x - j.elbF.x, uy = j.handF.y - j.elbF.y;
        var l = Math.hypot(ux, uy) || 1;
        ux /= l; uy /= l;
        var px = -uy, py = ux;
        var bx = j.elbF.x + ux * l * 0.80, by = j.elbF.y + uy * l * 0.80;
        var R = f.R_END;
        cx.moveTo(bx - px * R * 0.94, by - py * R * 0.94);
        cx.lineTo(bx - px * R * 2.30 - ux * R * 0.30, by - py * R * 2.30 - uy * R * 0.30);
        cx.lineTo(bx - px * R * 2.05 - ux * R * 1.15, by - py * R * 2.05 - uy * R * 1.15);
        cx.lineTo(bx - px * R * 0.80 - ux * R * 0.62, by - py * R * 0.80 - uy * R * 0.62);
        cx.closePath();
      }, WRAP, { band: true, edge: true });
      A.add('front', function (cx) {
        cx.beginPath();
        turns(cx, j.elbF, j.handF, f.R_MID * 0.96, [0.44, 0.62, 0.80], 1.6 * f.s);
      }, WRAPC, { flat: true });

      /* --- THE NEAR FOOT, which was the flattest thing left on her --------

             `footPath` puts two toe bumps on the leading edge, so the toes
             are already in the outline — but nothing separates them, so at
             any size it is one pale mitten with a bobble on the front. Two
             short dark wedges between the toes, and the sliver of pad you
             actually see from the side where the foot meets the floor.

             The pad is the one thing on her that is not fur and not cloth:
             it takes no shading at all, because a paw pad at this size is
             four pixels of a single dark colour and anything else on it is
             noise. Three materials on one cat, three recipes.

             Drawn in the figure's own axes because `footPath` is: it
             translates to the ankle and never rotates, taking only a little
             of the shin's angle as `lean`. Get that wrong and the toes slide
             off the front of the foot the moment she kicks.               */
      var FX = f.FOOT_X * 0.92, FY = f.FOOT_Y;
      A.add('front', function (cx) {
        var o = j.footF, lean = (j.footF.x - j.kneeF.x) * 0.16;
        cx.beginPath();
        /* between the two toes, and between the near toe and the foot */
        [[1.06, 0.30], [0.72, 0.44]].forEach(function (t) {
          cx.moveTo(o.x + lean * 0.2 + FX * t[0] - 0.7 * f.s, o.y - FY * 0.96);
          cx.lineTo(o.x + lean * 0.2 + FX * t[0] + 0.7 * f.s, o.y - FY * 0.96);
          cx.lineTo(o.x + lean * 0.2 + FX * (t[0] - 0.06) + 0.6 * f.s, o.y - FY * (0.96 - t[1]));
          cx.lineTo(o.x + lean * 0.2 + FX * (t[0] - 0.06) - 0.6 * f.s, o.y - FY * (0.96 - t[1]));
          cx.closePath();
        });
        /* the pad, along the ground line */
        cx.moveTo(o.x - FX * 0.30, o.y - FY * 0.98);
        cx.lineTo(o.x + FX * 1.16, o.y - FY * 0.92);
        cx.lineTo(o.x + FX * 1.14, o.y - FY * 0.62);
        cx.lineTo(o.x - FX * 0.32, o.y - FY * 0.72);
        cx.closePath();
      }, '#6a5f60', { flat: true });

      /* --- the headband's tails.

             Two goes at this were wrong. The first came off the crown and
             crossed her ear, which read as a red mohawk. The second was
             longer and thicker and read as a wing: at this resolution the
             ear is about six pixels and anything laid across it wins.

             They now leave from the knot at the BACK of the skull, BELOW
             the ear line, and stream back and down behind her neck — where
             a headband tied at the back of the head would actually put
             them, and where they cannot eat the one bit of head silhouette
             she has. Long enough to read as movement, thin enough that the
             skull still reads first. Swallowtail ends, because a squared
             one looks cut with scissors and a rounded one is a sausage. */
      var r = f.headR;

      /* The band itself. rig.js has an `accessory: 'headband'` that draws
         one, but it draws its own pair of hair-thin ties as a last pass
         over the face, and at 384x224 a one-pixel red squiggle above the
         ear is a rendering fault, not a ribbon. Drawing it here instead
         puts it in the head costume layer, which is cel-shaded with the
         skull and sits UNDER the eyes — which is where a band belongs, and
         means her brow shadow falls across it. */
      A.add('head', function (cx) {
        cx.beginPath();
        cx.ellipse(0, r * 0.24, r * 1.05, r * 0.86, 0, Math.PI * 0.02, Math.PI * 0.98);
        cx.ellipse(0, r * 0.24, r * 0.99, r * 0.52, 0, Math.PI * 0.98, Math.PI * 0.02, true);
        cx.closePath();
      }, '#b8332f', { band: true, edge: true });
      A.add('head', function (cx) {
        A.ellipse(cx, -r * 0.84, r * 0.22, r * 0.28, r * 0.24, 0.2);
      }, '#a52c29', { edge: true });

      /* THE TAILS WHIP. They used to be two fixed paths built from constant
         multiples of `r` — welded to the skull, turning only with it. Ryu's
         headband tails are half of what sells him moving; two red flicks
         stamped on the side of a head are a sticker.

         `f.sway` already folds her speed, a slow idle drift and being
         airborne into one number, positive meaning blown backwards. The
         flutter on top of it is `f.t` so they are never quite still even in
         the idle — a ribbon at rest still breathes.

         The head layer is drawn ROTATED with the skull, so a swing worked
         out in the figure's space has to be turned into head space or the
         tails fly upwards when she is knocked flat and her head is at -84
         degrees. Hence the rotate: head-local is the figure's axes turned by
         headRot, and the same displacement expressed the other way round.

         `w` is how far along the tail a point is, 0 at the knot and 1 at the
         tip. The knot cannot move — it is tied on — so the whole swing is
         weighted by it and the tail LAGS instead of sliding sideways. */
      var rot = (j.headRot || 0) * Math.PI / 180;
      var ca = Math.cos(rot), sa = Math.sin(rot);
      /* BOTH TERMS ARE `abs`, and that is deliberate. The rig builds sway as
         `vx * facing * -0.9`, so walking FORWARD makes it negative — mario.js
         has the note. Fed straight in signed, the first version tucked her
         tails forward over her ear every time she walked in, which on a
         headband is not a quirk, it is the shot backwards. Luigi's scarf
         dodges the same trap by only ever taking sway as lift and keeping
         its reach pointed back; these do the same. A ribbon streams behind
         the head whichever way the head is going, so speed lengthens and
         lifts them and never turns them round. The flutter is the only thing
         left at a standstill, because a ribbon at rest still breathes. */
      var whip = Math.abs(f.sway);
      var bx = -whip * 0.09 * r;                             /* further back */
      var by = whip * 0.07 * r + Math.sin(f.t * 0.09) * 0.11 * r;      /* lift */
      var sx = bx * ca - by * sa, sy = bx * sa + by * ca;
      function W(cx2, x, y, w) { cx2.lineTo(x + sx * w, y + sy * w); }
      function Wq(cx2, x1, y1, w1, x2, y2, w2) {
        cx2.quadraticCurveTo(x1 + sx * w1, y1 + sy * w1, x2 + sx * w2, y2 + sy * w2);
      }

      A.add('head', function (cx) {
        cx.beginPath();
        cx.moveTo(-r * 0.74, r * 0.08);
        Wq(cx, -r * 1.70, r * 0.12, 0.38, -r * 2.66, -r * 0.26, 1.00);
        W(cx, -r * 2.26, -r * 0.36, 0.84);    /* the notch in the tail */
        W(cx, -r * 2.50, -r * 0.66, 0.96);
        Wq(cx, -r * 1.66, -r * 0.28, 0.36, -r * 0.72, -r * 0.20, 0);
        cx.closePath();
      }, '#b8332f', { band: true, edge: true });
      A.add('head', function (cx) {
        cx.beginPath();
        cx.moveTo(-r * 0.72, -r * 0.22);
        Wq(cx, -r * 1.44, -r * 0.52, 0.34, -r * 2.10, -r * 0.94, 0.86);
        W(cx, -r * 1.78, -r * 0.98, 0.70);
        W(cx, -r * 1.90, -r * 1.24, 0.78);
        Wq(cx, -r * 1.30, -r * 0.64, 0.30, -r * 0.70, -r * 0.46, 0);
        cx.closePath();
      }, '#8f2422', { edge: true });

      /* ===================================================================
         THE FUR, ON THE OUTLINE.

         Everything above this line is cloth, and cloth was doing all the
         work: turned black she was a gi with a cat's head on it, and every
         edge that was not cloth was a smooth curve — an arm, a calf, a
         cheek, a tail, all of them drawn with the same rounded capsule the
         rig hands out. That is what makes a figure read as vector art. A
         drawn cat is notched: the elbow carries a clump, the back of the
         calf a shelf of longer hair, the tail is not a hosepipe.

         Nine runs, in three shapes — one for the far side, one for the near,
         one for the head — because a shape is a contour stroke and a fill
         apiece and canvas is perfectly happy to hold nine subpaths in one
         path. Costs a third of a millisecond for the whole lot.

         She is the ELDER, which decides how they are cut: long and slightly
         unkempt, heaviest at the hocks and the tail, not the tight neat
         feathering of a young cat.                                      */
      /* The teeth go on the OUTSIDE of the tail's arc — the side further
         from the hip. Picked from the geometry rather than fixed, because
         her tail carries high in some poses and low in others and the inside
         of the curve is buried in the rump either way. */
      function furTail(cx, t0, t1, out, count, phase) {
        var g = tailSide(t0, t1, false);
        var r0 = TW * (1 - 0.48 * t0), r1 = TW * (1 - 0.48 * t1);
        saw(cx, g.a.x + g.nx * r0, g.a.y + g.ny * r0,
                g.b.x + g.nx * r1, g.b.y + g.ny * r1,
            g.nx, g.ny, TW * 1.2, out, count, phase);
      }

      /* --- THE TOP OF THE TAIL, WHICH HAD NO LIGHT ON IT AT ALL -----------

             rig fills the tail with ONE flat tone: no band, no crescent,
             nothing. Every other big form on the cat gets three tones and the
             tail — which is the longest single shape in her silhouette and
             the move she is named for — got one, so it read as a length of
             dark rope laid behind her.

             A lit plane down the upper-forward side fixes it, and it has to
             be chosen from the geometry rather than fixed: her tail carries
             high in the idle, whips through the horizontal in Tail Whip and
             trails under her in a jump, so "the top" is a different side of
             the curve in each. The lamp is at (0.52, 0.85) in the figure's
             own axes; the lit side is whichever normal points at it.

             It goes in 'far', which pours after the tail is filled and before
             the torso — the one layer that can reach it. In 'back' the tail
             would be painted over the top of it.                          */
      var TW = 4.0 * f.s * f.GW;              /* the tail, as rig sizes it */
      function tailAt(t) {
        var q = j.tail, u = 1 - t;
        return { x: u * u * u * q[0].x + 3 * u * u * t * q[1].x + 3 * u * t * t * q[2].x + t * t * t * q[3].x,
                 y: u * u * u * q[0].y + 3 * u * u * t * q[1].y + 3 * u * t * t * q[2].y + t * t * t * q[3].y };
      }
      function tailSide(t0, t1, toLight) {
        var a = tailAt(t0), b = tailAt(t1), m = tailAt((t0 + t1) / 2);
        var ux = b.x - a.x, uy = b.y - a.y, l = Math.hypot(ux, uy) || 1;
        ux /= l; uy /= l;
        var nx = uy, ny = -ux;
        var d = toLight ? (nx * 0.52 + ny * 0.85)
                        : ((m.x - j.pelvis.x) * nx + (m.y - j.pelvis.y) * ny);
        if (d < 0) { nx = -nx; ny = -ny; }
        return { a: a, b: b, nx: nx, ny: ny };
      }
      A.add('far', function (cx) {
        var g = tailSide(0.14, 0.86, true);
        var r0 = TW * 0.84, r1 = TW * 0.30;
        cx.beginPath();
        cx.moveTo(g.a.x + g.nx * r0, g.a.y + g.ny * r0);
        cx.lineTo(g.b.x + g.nx * r1, g.b.y + g.ny * r1);
        cx.lineTo(g.b.x + g.nx * r1 * 0.20, g.b.y + g.ny * r1 * 0.20);
        cx.lineTo(g.a.x + g.nx * r0 * 0.46, g.a.y + g.ny * r0 * 0.46);
        cx.closePath();
        /* IT IS A BAND ALONG THE TOP, NOT THE WHOLE TOP HALF. Taken out to
           0.92 of the radius and started at 0.30 of it, the lit plane owned
           two thirds of the tail and turned the darkest shape in her
           silhouette into a pale one — which cost her the anchor at the back
           of the picture that the tail is there to be. */
      }, A.lit(f.furBack, 0.16), { flat: true });

      /* HOW BIG A TOOTH HAS TO BE, which is the whole of what took three
         goes here. The contour is 1.8 * s wide and it is laid down on BOTH
         sides of the shape, so a tooth narrower than about 5 * s at the base
         has no fur left in the middle of it and comes out a solid black
         spike — a comb, not fur. Four narrow teeth along a shin therefore
         read worse than two broad ones, and the first version had four
         everywhere. Two per run, three only where the run is long. */

      /* the far side: the rump, the far thigh, the far hock, the far elbow,
         and the tail */
      A.add('back', function (cx) {
        cx.beginPath();
        /* the rump, where the back leg leaves the body */
        saw(cx, T(0.30, -f.hipW * 1.02).x, T(0.30, -f.hipW * 1.02).y,
                T(-0.10, -f.hipW * 0.88).x, T(-0.10, -f.hipW * 0.88).y,
                -fx, -fy, f.hipW * 0.5, 3.6 * f.s, 3, 0.7);
        /* THE BACK OF THE THIGH — the one run the brief names that she did
           not have. Under the skirt hem in the idle, so it costs nothing to
           look at until she kicks, which is exactly when a bare stretch of
           smooth leg between hip and knee was showing up as the most rounded,
           least-drawn edge on her. Short — a real cat's feathering here is a
           shelf at the top of the leg, not a run the length of it — and
           sat high, close to the rump it grows out of. */
        furLimb(cx, j.hipB, j.kneeB, 0.10, 0.46, f.R_TOP * 0.58, 3.0 * f.s, 2, 4.1);
        furLimb(cx, j.kneeB, j.footB, 0.14, 0.78, f.R_MID * 0.78, 3.2 * f.s, 2, 2.1);
        furLimb(cx, j.elbB, j.handB, 0.18, 0.76, f.R_MID * 0.76, 2.8 * f.s, 2, 1.3);
        furTail(cx, 0.26, 0.60, 3.2 * f.s, 2, 0.4);
        furTail(cx, 0.64, 0.94, 2.6 * f.s, 2, 1.9);
      }, f.furBack, { flat: true });

      /* the near side. In 'body', which is UNDER the near arm and the near
         leg — so the limb paints its own roots out and only the teeth are
         left. In 'front' every one of these would have carried a hard line
         across the middle of the arm it was growing from. */
      A.add('body', function (cx) {
        cx.beginPath();
        /* the back of the NEAR thigh, hip to knee — the same gap as the far
           side and the same reason. Slightly bigger teeth than the far one
           (she is closer to the light, and no two runs on her are the same
           run) and set a little lower on the leg, since the near hip sits a
           touch further from the rump than the far one does in this stance. */
        furLimb(cx, j.hipF, j.kneeF, 0.14, 0.52, f.R_TOP * 0.62, 3.6 * f.s, 2, 3.5);
        furLimb(cx, j.kneeF, j.footF, 0.12, 0.82, f.R_MID * 0.84, 4.0 * f.s, 2, 0.2);
        furLimb(cx, j.elbF, j.handF, 0.16, 0.80, f.R_MID * 0.82, 3.2 * f.s, 2, 1.6);
        /* the elbow clump itself, longer than the run below it — an old cat
           carries a tuft there and it is the one that reads at game size */
        furLimb(cx, j.shF, j.elbF, 0.70, 1.02, f.R_MID * 0.92, 4.4 * f.s, 1, 2.6);
      }, f.furFront, { flat: true });

      /* THE HEAD, and it is also in 'body' — under the skull, under the near
         hand, under everything. A cheek tuft laid OVER the skull would have
         to carry a line where it met the cheek, and at this size a line
         across a cheek is a crack in the drawing, not fur.

         Head-local coordinates, turned into the figure's by hand: the head
         layer would have done that for free but it is drawn on top of the
         skull, which is the one thing this must not be. */
      var hr = -(j.headRot || 0) * Math.PI / 180;
      var hc = Math.cos(hr), hsn = Math.sin(hr);
      function H(x, y) {
        return { x: j.head.x + x * hc - y * hsn, y: j.head.y + x * hsn + y * hc };
      }
      function furHead(cx, x0, y0, x1, y1, nxl, nyl, out, count, phase) {
        var a = H(x0, y0), b = H(x1, y1);
        var nx = nxl * hc - nyl * hsn, ny = nxl * hsn + nyl * hc;
        saw(cx, a.x, a.y, b.x, b.y, nx, ny, r * 0.55, out, count, phase);
      }
      A.add('body', function (cx) {
        cx.beginPath();
        /* The cheek ruff. The skull is an ellipse 1.08r by 1.02r and the
           cheek pushes it out to about 1.28r at eye height, so this hangs off
           the FRONT of that bulge and points forward and down — where a cat
           actually carries it, and clear of the muzzle, which reaches 1.05r
           and would have swallowed anything drawn across it. */
        furHead(cx, r * 1.16, r * 0.10, r * 1.02, -r * 0.50, 0.94, -0.34, 3.4 * f.s, 2, 0.9);
        /* the jaw line and the throat, running back under the skull — the
           longest smooth curve on the head before this and the one that made
           it read as a ball with a face on it */
        furHead(cx, r * 0.62, -r * 0.80, -r * 0.52, -r * 0.88, 0.06, -1.00, 3.4 * f.s, 3, 2.3);
      }, f.furFront, { flat: true });
    },

    /* A scar over the leading brow, in one pale line. She has been doing
       this a long time and it is the only thing on her that is damage
       rather than kit. It went over the leading eye first, which at this
       size split the pupil in two and read as a fault in the drawing rather
       than an old wound; it sits on the forehead between the eyes instead.
       One pixel wide, because two reads as a stripe of paint. */
    overlay: function (ctx, j, fig) {
      var r = j.headR;
      ctx.save();
      ctx.translate(j.head.x, j.head.y);
      ctx.rotate(-(j.headRot || 0) * Math.PI / 180);
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#ded6c6';
      ctx.lineWidth = Math.max(1, 0.9 * fig.s);
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(r * 0.34, r * 0.62);
      ctx.lineTo(r * 0.15, r * 0.04);
      ctx.stroke();

      /* Whiskers. The fastest single thing that reads as "cat" and not one
         cat on the roster has them yet — nothing else here costs so little
         for what it says. Three strokes, not a fill, so this is the
         cheapest kind of detail there is: no path, no clip, no contour pass
         (`overlay` runs after the whole figure, including its outline, is
         already down).

         They start from the whisker pad beside the nose — rig's own muzzle
         triangle sits at roughly (0.66r, -0.18r) to (0.90r, -0.06r), so the
         pad is just behind and below it — and fan forward past the edge of
         the muzzle, past the width of the head itself, which is what a real
         whisker does and a short one reads as a crease instead.

         NOT a fan cut with a protractor: three different origins on the
         pad, three different lengths, three different angles, because a
         whisker pad is a cluster and evenly spaced lines off one point is
         the same "comb" the fur runs warn about. Dark and half-transparent
         rather than pale — the pale scar tone would vanish into her own
         pale muzzle patch, and a whisker reads by catching a SHADOW, not a
         highlight. */
      ctx.globalAlpha = 0.60;
      ctx.strokeStyle = 'rgba(26,22,18,.85)';
      ctx.lineWidth = Math.max(1, 0.52 * fig.s);
      ctx.lineCap = 'round';
      function whisker(x0, y0, ang, len) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
        ctx.stroke();
      }
      /* Angled UP more than a real whisker pad, and shorter than the first
         pass had them. Her stand pose carries the near fist in a low guard
         right in front of the chin — draw them level and long, as a real
         whisker pad fans, and they run straight through the glove in her
         idle, which reads as a rendering fault rather than an animal. Up
         and short enough to clear it is a compromise a real cat's face
         would not make, and the one this game's own guard stance forces. */
      whisker(r * 0.48, r * -0.02, 0.40, r * 0.80);
      whisker(r * 0.52, r * -0.13, 0.16, r * 0.92);
      whisker(r * 0.46, r * -0.24, -0.10, r * 0.68);
      ctx.restore();
    }
  },

  displayName: 'GRACIE',
  subtitle: 'The Elder',
  blurb: 'Old, and she knows it. A growl that carries the length of the barn, and a tail that takes your legs out from under you.\nLet them come to you.',
  difficulty: 2,
  palette: {
    /* The old master: the wrapped forearms of somebody who has been doing
       this a long time. Both the headband and the wraps are drawn by
       `look.pieces` now rather than by rig's `kit`, so these two are the
       colours of record and nothing else reads them.

       `kit.wraps` was set here and it is gone on purpose. rig strokes it as
       four flat bands over the finished arm — no contour, no shading, the
       same on both sides — and next to a cuff that is cel-shaded with the
       rest of her it read as paint on top of the drawing. Putting it back
       gets you both at once, one over the other. */
    kit: { band: '#b8332f', wrapCol: '#e8e0cf' },
    fur: '#8d887f', fur2: '#6f6b64', belly: '#b9b3a6', marks: '#5e5a54',
    silver: '#d6d1c4', eye: '#7fc24a', nose: '#7d6f6c', inner: '#b89a95',
    accent: '#8a7f70', pattern: 'solid',
    tailTip: '#8d887f', elder: true, line: 'rgba(38,34,30,.55)'
  },
  stats: { walkF: 1.30, walkB: 1.22, jumpVy: 9.2, jumpVx: 2.8, gravity: 0.48,
           health: 700, stunMax: 116, weight: 1.10, hasDash: false },
  mod: { reach: 1.09, damage: 1.10, speed: 1.08 },
  specials: [
    {
      id: 'growl', name: 'Growl of Energy',
      desc: 'A wall of sound sent down the length of the barn. It crosses the whole screen, and the harder the button the faster it travels.', kind: 'special',
      motion: 'qcf', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
      startup: 12, active: 3, recovery: 27,
      mouth: 'open', mouthFrom: 8,
      meterGain: 16, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 7, p: Ps.growlWind },
             { at: 12, p: Ps.growlOut }, { at: 20, p: Ps.growlHold },
             { at: 42, p: Ps.stand }],
      spawn: function (f, strength) {
        return {
          kind: 'fireball',
          x: f.x + f.facing * 32, y: 56,
          vx: f.facing * [2.4, 3.2, 4.2][strength],
          w: 34, h: 26,
          damage: [26, 30, 34][strength], chip: 6,
          hitstun: 19, blockstun: 13, stun: 6,
          pushback: 2.8, blockPushback: 3.2,
          life: 240, owner: f.side, facing: f.facing,
          color: '#f0c36a', color2: '#fff4d2', style: 'wave'
        };
      }
    },
    {
      id: 'tailwhip', name: 'Tail Whip',
      desc: 'The tail comes along the floor and takes their legs out. Has to be blocked low, and it puts them down.', kind: 'special',
      motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 10, active: 6, recovery: 24,
      damage: [30, 34, 38], stun: [10, 12, 14], chip: 6,
      hitstun: 18, blockstun: 12,
      /* It comes along the floor, so it must be blocked low — and it puts
         them down, which is how she buys herself room to breathe. */
      hitLevel: 'low', knockdown: 'soft',
      pushback: 3.2, blockPushback: 3.6,
      hitbox: { x: 14, y: 1, w: 58, h: 22 },
      meterGain: 16, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.whipWind },
             { at: 9, p: Ps.whipMid }, { at: 11, p: Ps.whipOut },
             { at: 15, p: Ps.whipOut }, { at: 20, p: Ps.whipEnd },
             { at: 40, p: Ps.stand }]
    }
  ],
  supers: [{
    id: 'superGrowl', name: 'THE LAST WORD',
    desc: 'Three growls, back to back, and she is invincible for the first fourteen frames of it — so it beats whatever was already on its way in.', motion: 'qcfx2',
    buttons: ['LP', 'MP', 'HP'], cost: 100,
    startup: 12, active: 6, recovery: 44, freeze: 28,
    mouth: 'open', mouthFrom: 6,
    meterGain: 0, invuln: [0, 14],
    anim: [{ at: 0, p: Ps.growlWind }, { at: 8, p: Ps.growlWind },
           { at: 12, p: Ps.growlOut }, { at: 34, p: Ps.growlOut },
           { at: 62, p: Ps.stand }],
    spawnMany: [{ at: 12, dy: 0 }, { at: 18, dy: 0 }, { at: 24, dy: 0 }],
    spawn: function (f) {
      return {
        kind: 'fireball', super: true,
        x: f.x + f.facing * 34, y: 56,
        vx: f.facing * 3.6, w: 52, h: 40,
        damage: 55, chip: 11, hitstun: 24, blockstun: 15, stun: 8,
        pushback: 3.2, blockPushback: 3.8, life: 240,
        knockdown: false,
        owner: f.side, facing: f.facing,
        color: '#ffd166', color2: '#fffaf0', style: 'wave'
      };
    }
  }]
  };
})();
