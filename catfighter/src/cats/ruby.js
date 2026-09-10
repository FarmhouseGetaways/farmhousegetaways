/* =====================================================================
   6 — RUBY. Rubidoux. Short for nothing, she just is.

   HEAVY: hard to hurt and hard to move, with a bite that goes through
   whatever you were doing and a flip kick for anyone who jumps at her.

   THE LOOK. She is the one on the select screen you do not want to
   pick a fight with. That is a costume job, not a colour job — a ginger
   tabby with no kit on is a ginger tabby, which is exactly what she was
   until 22 Aug 2026. Studded leather cut, one riveted steel plate over
   the back shoulder, trousers torn off below the knee, bare feet. (The
   chain round her neck is gone — see THE COLLAR below for why: on this
   build she has no visible neck to hang one on.)
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.ruby = {
  id: 'ruby',
  weightClass: 'heavy',
    /* Hunched forward over her shoulders with her head low and her hands
       carried LOW and open — she is not guarding, she is waiting for you
       to come inside her arms. The hunch is the read: every other cat on
       the roster stands up straight. */
  stance: { torso: 15, py: -2, head: [1, -2, 11], armF: [-15, -32],
            armB: [-11, -22], legF: [9, -9], legB: [-7, 10] },
    /* Shoulder well past girth so the taper is a V and not a barrel — a
       heavyweight with a matching waist reads as fat rather than as the
       most dangerous thing in the line-up, which was the first pass. */
  build: { s: 1.06, girth: 1.34, limb: 0.94, head: 0.98, muscle: 1.20,
           headShape: 'blocky', ear: 'torn', shoulder: 1.34, waist: 0.96, limbW: 1.22 },

  /* ---- HER LOOK ---------------------------------------------------------

     Four things stand OUT of the body outline, because a costume drawn
     inside it is worth nothing in black:

       1. the pauldron — one, on the BACK shoulder, wide and low: a bump
          on her back, not a second head above it
       2. the hackle — a ridge of raised fur down the back of her neck
       3. the long back hem of the cut, hanging past her tail root
       4. the torn trouser legs, cut off in teeth below the knee

     Everything else — the studs, the rivets, the buckle — is value work
     that makes her read as leather rather than as fur, and none of it is
     load-bearing at 384x224.

     The one rule this cat exists to keep: THE PAULDRON MUST NEVER
     OUT-VALUE OR OUT-SIZE THE FACE. It did both for a day and the eye
     landed on her shoulder and read it as her head, which makes the whole
     figure unreadable at game size however good it looks at 6x.         */
  look: {
    pieces: function (A, j, f) {
      /* Leather nearly black. It was a mid brown first and it disappeared
         into the ginger: at game size a costume on a warm cat has to be a
         VALUE break, not a hue one. The studs and the chain are the only
         light things on her, which is why the eye goes to the shoulder. */
      /* A note on {flat: true}, which is on nine of the shapes below.
         It skips the CLIP inside celFill, and the clip is the expensive
         call — not the fills. Her costume measured 3.4ms of a 7.9ms cat
         before this pass, which put her over figuro as the most expensive
         thing on the roster. Everything under about six pixels — studs,
         rivets, spikes, the lit facets, the ankle bands — is flat now, and
         at 384x224 not one of them shows a tone it lost. */
      var HIDE = '#2e1d18', HIDE2 = '#4a2e24', HIDE3 = '#6d4432',
          STUD = '#cfcabc',
          TROU = '#413c33', TROU2 = '#282520', TROU3 = '#706753',
          HACKLE = '#7a3f26';
      /* The pauldron is STEEL, not more leather. Drawn in the same near-
         black hide as the cut it merged straight into it and the two
         became one shapeless mass down her whole front — a lot of work
         that read as a hole in the cat. Iron is a value nothing else on
         her occupies: darker than the ginger, much lighter than the
         leather, so the plate separates from both without a single extra
         line. It also earns the studs, which were invisible on black. */
      /* Three tones and the contour, and the RANGE is the point. The first
         version was PLATE '#5d5c60' with a lit facet at '#8a8992' and no
         dark side at all: the lightest thing on the whole cat was a big
         flat polygon on her shoulder, so at 1:1 the eye landed on the
         pauldron and read it as her HEAD — the actual skull, being smaller
         and darker, became a shoulder. Steel wants the biggest value spread
         on the figure, not the smallest, and the light end of that spread
         has to stay UNDER the muzzle. So the lit facet now sits just below
         the ginger's mid tone and a hard dark facet does the work the pale
         one used to. */
      /* 23 Aug 2026 — the third correction, and the one that finally made it
         read as metal. The plate was PLATE '#55545a' with the LIT facet
         '#74737d' covering half of it, so the whole thing averaged out as one
         mid-light slab: a piece of grey card the size of her skull with a
         slightly lighter half. Steel does not do that. Steel is dark
         everywhere except where a plane happens to point at the lamp, and
         there it is nearly white.
         So: the base is darker than the old base, the dark facet is a real
         black-blue and takes the whole underside, and the lit facet is much
         BRIGHTER and much SMALLER — a ridge along the top edge about three
         pixels deep. Average value goes DOWN, which is what stops it
         out-shouting the face, while the range goes from 116:90 to 167:35,
         which is the biggest spread on the figure by a long way. That range
         is the only thing on this cat that says "hard". */
      var PLATE = '#4a4954', PLATE2 = '#aeadbb', PLATE3 = '#201f27';

      function frame(a, b) {
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        return { ux: dx / L, uy: dy / L, px: -dy / L, py: dx / L, L: L };
      }
      function P(o, at, u, v) {
        return { x: at.x + o.ux * u + o.px * v, y: at.y + o.uy * u + o.py * v };
      }
      /* the spine: t is 0 at the pelvis and 1 at the neck, w sideways,
         +w forward. Everything worn on the trunk hangs off this so it
         leans when she does. */
      var pv = j.pelvis, nk = j.neck;
      var sdx = nk.x - pv.x, sdy = nk.y - pv.y;
      var sL = Math.hypot(sdx, sdy) || 1;
      var sfx = sdy / sL, sfy = -sdx / sL;          /* forward, across it */
      var UPX = sdx / sL, UPY = sdy / sL;           /* up it */
      function T(t, w) { return { x: pv.x + sdx * t + sfx * w, y: pv.y + sdy * t + sfy * w }; }
      function seg(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, q.y); }
      function L2(cx, p) { cx.lineTo(p.x, p.y); }
      /* the neck's own little frame: w forward of the neck joint, h above
         it. The collar and the scruff both hang off this rather than off
         the spine — T() at t>1 walks up towards the SKULL, which is where
         the first collar ended up, laid diagonally across both shoulders
         like a bandolier. */
      var cw = f.chestW;
      function N(w, h) {
        return { x: nk.x + sfx * cw * w + UPX * cw * h,
                 y: nk.y + sfy * cw * w + UPY * cw * h };
      }

      /* ================= FUR ON THE OUTLINE =========================

         23 Aug 2026. Everything above this line was costume, and a costume
         only ever gets you a costume: every edge of her that was FUR was a
         smooth curve, which is the single loudest thing that says "vector
         art" rather than "somebody drew this". A real animal has a notched,
         tufted, uneven edge, and on a heavyweight it matters double — the
         bigger the shape, the more obviously synthetic a clean curve on it
         looks.

         These are ordinary A.tuft crests in the FUR tones with no `edge`,
         so no material line is drawn: the roots are buried inside the limb
         they grow out of and vanish (same colour, painted over), and the
         only thing that survives is the part standing proud of the outline,
         picked up by the shared contour pass. That is a notch in the black
         shape for one flat fill each.

         `off` is how far the roots are pushed back INTO the body. Too little
         and a gap of background opens between the spikes and the cat, which
         is exactly what went wrong with the hackle before it was pulled in
         to the nape. 0.4 of the spike length is the number that holds up in
         every pose.

         `jag` is on for all of them, and the pairs are deliberately not
         matched — three spikes on the near elbow and two on the far one,
         a big crest on the back of the skull and a small one on the jowl.
         A mirrored pair reads as a machine part.

         `at` is a point ON THE SURFACE the fur grows out of, not the joint
         underneath it — the first pass handed it j.elbF and got three ginger
         fangs standing in the middle of her forearm, because a joint on this
         rig is buried half a limb deep. `rad` is how far out from the joint
         the surface is, so the caller says "the outside of the elbow" and
         not "wherever the elbow bone happens to be".                      */
      function ang(dx, dy) { return Math.atan2(dy, dx) * 180 / Math.PI; }
      function furTuft(layer, at, dx, dy, n, len, spread, col, off, rad) {
        var L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        var out = (rad || 0) - len * (off === undefined ? 0.40 : off);
        var root = { x: at.x + ux * out, y: at.y + uy * out };
        var a = ang(ux, uy);
        A.add(layer, function (cx) {
          A.tuft(cx, root, n, len, spread, a, true);
        }, col, { flat: true });
      }
      /* the outside of a bend — where an elbow's fur actually sticks out.
         Adding the two directions leaving the joint gives the INSIDE of the
         bend (that is how rig.js finds where to draw a crease), so this is
         the negative of it. A straight limb has no outside, and the fallback
         keeps the tuft pointing sideways rather than collapsing to nothing. */
      function outside(a, b, c) {
        var ax = a.x - b.x, ay = a.y - b.y, al = Math.hypot(ax, ay) || 1;
        var cx2 = c.x - b.x, cy2 = c.y - b.y, cl = Math.hypot(cx2, cy2) || 1;
        var mx = ax / al + cx2 / cl, my = ay / al + cy2 / cl;
        if (Math.hypot(mx, my) < 0.30) { mx = -ay / al; my = ax / al; }
        return { x: -mx, y: -my };
      }

      /* ================= THE SCRUFF =================================

         Hackles up on the nape, between the collar and the skull. On
         'back', so the only part that survives is the part standing proud
         of the neck — which is the part doing the silhouette work.

         It was first put at t 0.86 on the SPINE, half a chest back, which
         is the middle of her shoulder blades: entirely inside the torso,
         and under the leather at that. It shows nothing there. It also
         wants to point back and up rather than straight up — straight up
         on a hunched figure reads as a mohawk sitting on nothing.

         The roots were then at N(-0.72, 0.34), which is far enough back
         off the nape that a gap of background opened between the spikes
         and the neck in some poses and the crest floated. Pulled in to
         N(-0.54, 0.20) the roots are buried in the neck fur and only the
         tips stand proud — which is the only part that was ever doing
         silhouette work anyway.                                        */
      A.add('back', function (cx) {
        A.tuft(cx, N(-0.54, 0.20), 5, cw * 0.74, 64, 146, true);
      }, HACKLE, { edge: true, flat: true });

      /* ================= THE CUT ====================================

         A biker's cut: over the shoulders, down the back, open at the
         front, no sleeves.

         It was one big waistcoat over the whole trunk first, and in every
         pose all you could see of it was a sliver along her back. The
         reason is her own STANCE: hands low and open means the leading arm
         hangs across the chest, and the near arm is drawn after the 'body'
         layer and then drawn AGAIN over its own cast shadow. Anything
         painted on the middle of her torso is under two coats of forearm.

         So the cut is built where it can actually be seen: a yoke over the
         shoulders with the collar standing up behind her neck, and a back
         panel running long past the tail root. That is what a cut looks
         like from the side anyway — the front of an open one is two thin
         edges and a lot of cat.                                        */
      A.add('body', function (cx) {
        cx.beginPath();
        /* WIDER THAN THE CAT, and that is not a style choice.

           Five goes at this were painted flat on her ribs and every one
           came out as a narrow wedge down the middle of her trunk. The
           reason is in rig.js and it is worth writing down: after the
           costume is poured, the trunk gets four muscle blocks — pec,
           the shadow under it, lat, belly line — painted in FUR tones and
           clipped to the body outline. They know nothing about a garment,
           so anything laid inside that outline is buried under them. The
           only strip they leave is the gap between pec and lat, which is
           exactly the wedge that kept turning up.

           So the cut is cut BIG: every edge sits outside the body, and the
           part that survives is a rim of leather all the way round her —
           which is what a heavy hide worn over a cat looks like anyway.
           The front edge stands proud at 1.3 chests and the ginger shows
           in front of it, so the cut still reads open. */
        var a = T(0.14, f.hipW * 1.42); cx.moveTo(a.x, a.y);
        seg(cx, 0.50, f.waistW * 1.44);
        seg(cx, 0.86, f.chestW * 1.30);
        seg(cx, 1.16, f.chestW * 0.98);
        seg(cx, 1.38, f.chestW * 0.16);                         /* collar, standing */
        seg(cx, 1.36, -f.chestW * 0.72);
        seg(cx, 1.12, -f.chestW * 1.46);
        seg(cx, 0.74, -f.chestW * 1.60);
        /* one bite out of the back edge, at the shoulder blade. A cut is
           the one garment on earth that is SUPPOSED to look chewed, and a
           single asymmetric notch on a long edge is worth more than a
           regular scallop down the whole of it. */
        seg(cx, 0.56, -f.hipW * 1.46);
        seg(cx, 0.44, -f.hipW * 1.72);
        seg(cx, 0.30, -f.hipW * 1.64);
        seg(cx, -0.26, -f.hipW * 1.50);                         /* the long back hem */
        seg(cx, -0.34, -f.hipW * 0.66);
        seg(cx, 0.02, -f.hipW * 0.24);
        cx.closePath();
      }, HIDE, { band: true, edge: true });

      /* The lit plane of the yoke, cut hard across the top of the shoulder.
         One material, two planes — with a single flat fill the cut is a
         black hole with a cat behind it. */
      A.add('body', function (cx) {
        A.smooth(cx, [T(1.36, -f.chestW * 0.62), T(1.16, f.chestW * 0.90),
                      T(0.88, f.chestW * 1.22), T(0.86, f.chestW * 0.72),
                      T(1.08, f.chestW * 0.40), T(1.22, -f.chestW * 0.80)]);
      }, HIDE2, { edge: true, flat: true });

      /* No studs down the front edge of the yoke. Three were drawn there
         and every one of them is behind the near shoulder ball in every
         pose — three contour strokes and three fills a frame for nothing.
         She is the heaviest cat on the roster to draw, so anything that
         does not appear comes out. */

      /* The back hem swings. A slab of leather hanging off her that never
         moves is a plank; f.sway already folds her speed and a slow idle
         drift into one number, so the tail of the cut lifts when she walks
         in and hangs when she stops. */
      /* And the hem is CHEWED. 23 Aug 2026: the whole back of her — the far
         arm, the cut, this hem — was one dark mass with a perfectly smooth
         outline running from her shoulder to her heel, which is the longest
         clean curve on the roster and the loudest single thing saying
         "drawn by a computer". Three teeth cut into the bottom edge cost
         nothing at all: they are points on a path that already existed.
         They swing on `f.sway` with the rest of the hem, so the tear is
         part of the leather rather than a pattern printed on it. */
      A.add('back', function (cx) {
        cx.beginPath();
        var d = f.sway * 0.55;
        var a = T(0.16, -f.hipW * 1.30); cx.moveTo(a.x, a.y);
        seg(cx, -0.30, -f.hipW * 1.54 - d);
        seg(cx, -0.46, -f.hipW * 1.28 - d * 1.4);
        seg(cx, -0.33, -f.hipW * 1.12 - d * 1.2);
        seg(cx, -0.50, -f.hipW * 0.94 - d * 1.4);
        seg(cx, -0.34, -f.hipW * 0.76 - d * 1.2);
        seg(cx, -0.42, -f.hipW * 0.56 - d * 1.3);
        seg(cx, 0.04, -f.hipW * 0.40);
        cx.closePath();
      }, HIDE, { band: true, edge: true });

      /* No collar, and that is a finding rather than an omission.

         A chain, then a studded band, were both drawn round her throat and
         neither survived a single pose. Between the skull, which is about
         twenty-five pixels across, and the near shoulder ball, this build
         has no visible neck at all — she is hunched, and a hunched cat
         tucks its head down between its shoulders, which is exactly what
         makes the stance work everywhere else. Two blocks of code cost
         eight fills a frame and drew nothing. They are gone.

         The rule this leaves behind, for whoever styles the next heavy:
         on this rig only the FAR SHOULDER, the FOREARMS, the HIPS, the
         LEGS and the outline itself are paintable. The chest is under the
         muscle blocks and the throat is under the skull.                */

      /* ================= THE BELT ===================================
         Wide and low, with a plate buckle. A narrow belt is eaten by the
         contour pass — this one is deliberately as deep as her hand. */
      A.add('front', function (cx) {
        A.smooth(cx, [T(0.14, f.hipW * 1.30), T(0.36, f.hipW * 1.22),
                      T(0.38, -f.hipW * 1.34), T(0.16, -f.hipW * 1.42)]);
      }, HIDE, { band: true, edge: true });
      A.add('front', function (cx) {
        var b = T(0.25, f.hipW * 1.06);
        A.ellipse(cx, b.x, b.y, f.s * 3.4, f.s * 2.8, 0.25);
      }, STUD, { edge: true, flat: true });
      /* the tongue of the belt hanging loose off the buckle, swinging on
         f.sway. A strap that does not move is a strip of tape. */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.22, f.hipW * 1.16); cx.moveTo(a.x, a.y);
        var d = f.sway * 0.5;
        seg(cx, 0.06, f.hipW * 1.30 + d);
        seg(cx, -0.22, f.hipW * 1.34 + d * 1.8);
        seg(cx, -0.26, f.hipW * 0.98 + d * 1.8);
        seg(cx, -0.02, f.hipW * 0.96 + d);
        cx.closePath();
      }, HIDE2, { edge: true, flat: true });

      /* ================= THE TROUSERS ===============================

         Torn off in teeth below the knee, bare feet under them. Cut with
         lineTo and never smoothed — A.smooth rounds a two-pixel tooth
         away to nothing and the tear IS the shape. The far leg goes on
         'body' and the near one on 'front', same as every other kit on
         the roster, or the leading thigh paints straight over it.

         The widths are given per JOINT and not as one number scaled up and
         down the leg. The first pass took a single `w` and multiplied it by
         1.3 everywhere, which put the hem at one and a half thigh-radii
         out at the ankle: she came out in bell-bottoms, and the two flares
         met in the middle and read as a skirt. A trouser is barely wider
         than the leg inside it. The TEETH are cut along the leg, varying
         the length of the hem, not across it — swinging them sideways is
         what made the sawtooth read as pinking shears.                  */
      /* 23 Aug 2026 — CLOTH IS PAINTED, NOT SHADED.
         The leg used to be one `band: true` fill, which is celFill's soft
         four-step recipe, and at game size it came out as a mid-grey wedge
         with a wide pale strip down it: the biggest, palest, blandest mass
         on the cat after the pauldron, and the two of them were the same
         value family, so she read grey-and-ginger. It is three explicit
         planes now — a flat base, a dark plane down the BACK, a narrow lit
         plane down the FRONT where this picture's lamp is — with hard edges
         between them and nothing soft anywhere. Exactly three tones, and it
         drops the clip on the biggest shape in the costume, so it is
         cheaper than what it replaces as well as harder.

         `tear` is per leg. The two hems used to be cut with the identical
         set of teeth, which on a pair of legs a few pixels apart reads as a
         stencil; the near one is chewed deeper than the far one now.      */
      function trouser(layer, hip, knee, foot, wh, wk, ws, tear, fold) {
        var a = frame(hip, knee), b = frame(knee, foot);
        A.add(layer, function (cx) {
          cx.beginPath();
          var s0 = P(a, hip, -a.L * 0.30, wh); cx.moveTo(s0.x, s0.y);
          L2(cx, P(a, hip, a.L * 0.96, wk));
          L2(cx, P(b, knee, b.L * tear[0], ws));
          /* the tear */
          L2(cx, P(b, knee, b.L * tear[1], ws * 0.46));
          L2(cx, P(b, knee, b.L * tear[2], ws * 0.12));
          L2(cx, P(b, knee, b.L * tear[3], -ws * 0.34));
          L2(cx, P(b, knee, b.L * tear[4], -ws * 0.74));
          L2(cx, P(b, knee, b.L * tear[5], -ws));
          L2(cx, P(a, hip, a.L * 0.96, -wk));
          L2(cx, P(a, hip, -a.L * 0.30, -wh));
          cx.closePath();
        }, TROU, { flat: true, edge: true });
        /* the dark plane, down the back of the leg */
        A.add(layer, function (cx) {
          cx.beginPath();
          var s1 = P(a, hip, -a.L * 0.26, -wh * 0.96); cx.moveTo(s1.x, s1.y);
          L2(cx, P(a, hip, a.L * 0.96, -wk * 0.98));
          L2(cx, P(b, knee, b.L * (tear[5] - 0.06), -ws * 0.94));
          L2(cx, P(b, knee, b.L * (tear[4] - 0.06), -ws * 0.30));
          L2(cx, P(a, hip, a.L * 0.96, -wk * 0.28));
          L2(cx, P(a, hip, -a.L * 0.26, -wh * 0.30));
          cx.closePath();
        }, TROU2, { flat: true });
        /* and the lit plane, down the front, about a fifth of the width */
        A.add(layer, function (cx) {
          cx.beginPath();
          var s2 = P(a, hip, -a.L * 0.24, wh * 0.94); cx.moveTo(s2.x, s2.y);
          L2(cx, P(a, hip, a.L * 0.96, wk * 0.96));
          L2(cx, P(b, knee, b.L * (tear[0] - 0.04), ws * 0.92));
          L2(cx, P(b, knee, b.L * (tear[1] - 0.10), ws * 0.50));
          L2(cx, P(a, hip, a.L * 0.94, wk * 0.52));
          L2(cx, P(a, hip, -a.L * 0.24, wh * 0.50));
          cx.closePath();
        }, TROU3, { flat: true });
        /* a fold pulled across the front of the knee, on the near leg only.
           One hard wedge is what says cloth rather than sheet metal; two
           was a pattern and read as a knee pad. */
        if (!fold) return;
        A.add(layer, function (cx) {
          cx.beginPath();
          var s3 = P(a, hip, a.L * 0.98, wk * 0.98); cx.moveTo(s3.x, s3.y);
          L2(cx, P(a, hip, a.L * 0.72, wk * 0.30));
          L2(cx, P(a, hip, a.L * 0.80, -wk * 0.20));
          L2(cx, P(a, hip, a.L * 0.98, wk * 0.30));
          cx.closePath();
        }, TROU2, { flat: true });
      }
      trouser('body', j.hipB, j.kneeB, j.footB,
              f.R_TOP * 1.06, f.R_MID * 1.36, f.R_MID * 1.24,
              [0.34, 0.42, 0.26, 0.40, 0.30, 0.38], false);
      trouser('front', j.hipF, j.kneeF, j.footF,
              f.R_TOP * 1.12, f.R_MID * 1.44, f.R_MID * 1.30,
              [0.36, 0.48, 0.22, 0.46, 0.24, 0.42], true);

      /* ================= THE BRACERS ================================

         Studded leather cuffs on both forearms. This is the best piece of
         real estate she has and it took three rounds to notice: she holds
         her hands LOW and OPEN, so the forearms are out in the clear in
         every pose, while the chest — where the first four goes at a
         costume all went — is behind her own arm most of the time. A cuff
         here is worth three shapes on her ribs.

         Wider at the wrist than at the elbow, so the arm ends in a flare
         rather than tapering away, and the studs sit on the outside edge
         where the light is.                                            */
      function bracer(layer, elb, hand, w0, w1, near) {
        var o = frame(elb, hand);
        function A2(u, v) { return P(o, elb, o.L * u, v); }
        /* Stops at 0.84 along the forearm, not at the hand. Run all the way
           down it came out as a boxing mitt and swallowed the open paw,
           which is half of what "hands low and open" is for. */
        var top = A2(0.28, 0), end = A2(0.84, 0);
        A.add(layer, function (cx) {
          A.limb(cx, top, end, w0, w1, 0.18, 'foreArm');
        }, HIDE, { band: true, edge: true });
        /* The lit edge and the studs go on the NEAR cuff only. The far arm
           is drawn in the shade tone and half behind the trunk, and four
           more shapes on it were four more shapes nobody sees — this cat
           is the most expensive one to draw and the far side is where the
           savings are free. */
        if (!near) return;
        /* Leather is matte with ONE soft sheen along the edge that faces the
           lamp, and the sheen is narrow. This was a wide panel down the
           middle of the cuff and it read as a grey slug lying on her arm —
           the wrong shape and in the wrong place, because the middle of a
           round thing is exactly where a highlight is not. It is a strip
           along the top edge now, and a second, brighter strip half its
           width inside it: three tones on the hide, hard edges between
           them, and the pair of them together is still narrower than the
           old single panel. */
        A.add(layer, function (cx) {
          A.smooth(cx, [A2(0.30, w0 * 0.42), A2(0.82, w1 * 0.46),
                        A2(0.84, w1 * 0.98), A2(0.30, w0 * 0.94)]);
        }, HIDE2, { flat: true });
        A.add(layer, function (cx) {
          A.smooth(cx, [A2(0.36, w0 * 0.70), A2(0.78, w1 * 0.74),
                        A2(0.78, w1 * 0.94), A2(0.36, w0 * 0.90)]);
        }, HIDE3, { flat: true });
        /* two studs, along the cuff. Three sat in a row across it and read
           as a domino tile rather than as rivets. */
        [0.42, 0.68].forEach(function (u) {
          A.add(layer, function (cx) {
            var q2 = A2(u, (w0 + (w1 - w0) * u) * 0.58);
            A.ellipse(cx, q2.x, q2.y, f.s * 1.4, f.s * 1.4, 0);
          }, STUD, { flat: true });
        });
      }
      bracer('body', j.elbB, j.handB, f.R_MID * 0.98, f.R_END * 1.16, false);
      bracer('front', j.elbF, j.handF, f.R_MID * 1.06, f.R_END * 1.26, true);

      /* ================= THE ANKLE WRAPS ============================

         Bare feet, but strapped ankles — she has been doing this a long
         time and the ankles are the thing that goes first. They earn their
         place on the picture as well as on the character: the lower legs
         are the only part of her that is never crossed by an arm, so a
         hard dark band there reads at 1:1 where most of this costume does
         not. Wider than the shin, so the leg steps out of its own outline
         at the ankle instead of tapering into the paw.                  */
      function anklet(layer, knee, foot, near) {
        var o = frame(knee, foot);
        /* Stops at four fifths of the shin. Run down to the foot joint it
           swallowed the paw and she came out in boots, which is the one
           thing the brief for her says she is not wearing. */
        var top = { x: knee.x + o.ux * o.L * 0.56, y: knee.y + o.uy * o.L * 0.56 };
        var low = { x: knee.x + o.ux * o.L * 0.80, y: knee.y + o.uy * o.L * 0.80 };
        A.add(layer, function (cx) {
          A.limb(cx, top, low, f.R_END * 1.34, f.R_END * 1.30, 0.08, 'shin');
        }, HIDE, { edge: true, flat: true });
        if (!near) return;                 /* the far one keeps no stud */
        A.add(layer, function (cx) {
          var q3 = P(o, low, -o.L * 0.06, f.R_END * 0.80);
          A.ellipse(cx, q3.x, q3.y, f.s * 1.5, f.s * 1.5, 0);
        }, STUD, { flat: true });
      }
      anklet('body', j.kneeB, j.footB, false);
      anklet('front', j.kneeF, j.footF, true);

      /* ================= THE PAULDRON ===============================

         One. On the leading shoulder, taller than her skull, with three
         spikes standing off the top. A matched pair reads as armour and
         armour is not what she is — one scavenged plate strapped over a
         leather cut is.

         Three goes at this. A.pad(j.shF, j.elbF, ...) builds its fan along
         the ARM, and in a side view the near shoulder sits over the middle
         of the chest with the arm pointing forward — so the plate came out
         as a disc painted across her ribs, entirely inside the outline.
         Rebuilding it in the spine frame fixed the shape but not the
         place: on the NEAR shoulder it spends every pose hiding behind her
         own leading arm, which is the one thing that moves most.

         It goes on the FAR shoulder, on 'body'. In a side view that is the
         high back corner of the figure — nothing ever covers it, it rises
         above her spine, and the near arm is left as clean ginger, which a
         cat this dark badly needs somewhere. It is the bump on her back in
         the silhouette test and it is worth more there than anywhere. */
      /* Sized against the SKULL, not against the shoulder — and a quarter
         smaller than the first pass, which drew it at about 1.3 skulls and
         made it the largest single shape on her.

         The offsets are the other half of that correction. It used to sit
         1.22 pauldron-radii BEHIND the far shoulder and 0.70 above it,
         which is a plate hanging in mid-air: at 4x you could see the stage
         through the gap under its lower-left corner, so it read as a shield
         propped against her back rather than as a plate strapped on. Pulled
         in to 0.72 back and 0.42 up, the bottom rim overlaps the shoulder
         ball and the strap has something to sit on. Its top edge now lands
         at about the base of her ears instead of over them — width is good
         silhouette, competing HEIGHT is what gave her four spikes on top
         and no way to tell which pair was the cat. */
      var pr = f.chestW * 0.62;
      var sh = { x: j.shB.x + UPX * pr * 0.58 - sfx * pr * 0.72,
                 y: j.shB.y + UPY * pr * 0.58 - sfy * pr * 0.72 };
      function Q(u, v) {   /* u up the spine, v forward, in chestW units */
        return { x: sh.x + UPX * pr * u + sfx * pr * v,
                 y: sh.y + UPY * pr * u + sfy * pr * v };
      }
      /* The CAST SHADOW, laid down before the plate so the plate sits on
         top of it. Steel resting on a shoulder throws a shadow onto it;
         without one the plate floated even after it had been moved into
         place. It only shows where it crosses the far upper arm — under
         the rest of the rim is the near-black hide of the cut, and a dark
         shape on that is invisible, which is the correct answer rather
         than a wasted fill. */
      /* It was a two-pixel sliver hugging the front rim and it did nothing:
         at game size you cannot see a shadow that is thinner than the
         outline it sits next to. It is now a band the depth of the shoulder
         ball, following the whole bottom rim and thrown DOWN AND BACK,
         which is where this picture's lamp puts it (LX 0.52, LY 0.85 in
         rig.js — up and forward). Where it crosses the far arm and the top
         of the chest it reads; where it crosses the near-black cut it does
         not, and that is the right answer rather than a wasted fill. */
      A.add('body', function (cx) {
        cx.beginPath();
        var d0 = Q(0.16, 0.54); cx.moveTo(d0.x, d0.y);
        L2(cx, Q(-0.66, 0.32));
        L2(cx, Q(-1.16, -0.36));
        L2(cx, Q(-1.30, -0.96));
        L2(cx, Q(-1.86, -0.78));
        L2(cx, Q(-1.62, -0.06));
        L2(cx, Q(-1.02, 0.52));
        L2(cx, Q(-0.28, 0.72));
        cx.closePath();
      }, A.shade(f.fur2, 0.58), { flat: true });

      A.add('body', function (cx) {
        /* Cut with lineTo, not A.smooth. Smoothed, this came out as a grey
           EGG the size of her head — a boulder strapped to her back. A
           plate is beaten flat: straight facets, a hard corner at the
           front and a straight bottom rim where it stops. */
        /* Wide and LOW. Losing a quarter of the radius cost the plate its
           whole contribution to the black shape — it went from a rival head
           to a grey pebble — so the width came back out along the spine
           instead of up it. A plate that reaches a long way behind her is a
           bump on her back; a plate that reaches up is a second skull. Only
           one of those is worth having. */
        cx.beginPath();
        var a0 = Q(0.86, 0.34); cx.moveTo(a0.x, a0.y);
        L2(cx, Q(0.92, -0.44));
        L2(cx, Q(0.58, -1.30));
        L2(cx, Q(-0.24, -1.70));
        L2(cx, Q(-0.96, -1.38));
        L2(cx, Q(-1.14, -0.36));
        L2(cx, Q(-0.68, 0.34));
        L2(cx, Q(0.10, 0.56));
        cx.closePath();
      }, PLATE, { band: true, edge: true });

      /* NO SPIKES ON THE PLATE, and this one is arithmetic rather than
         taste, so nobody should put them back on the strength of a 6x
         render.

         There were three, in STUD — the brightest value anywhere on a
         near-black cat, standing at the top-left of the figure a long way
         from her face. In a fight shot they read as a second animal's ears
         looking over her shoulder, and their roots sat on the very edge of
         the plate so background opened up between spike and plate and they
         came apart into loose grey shards.

         Two, seated deep, in the plate's own lit tone was better and still
         wrong. Once the plate had been cut down to the size it should
         always have been, pr is about five game pixels. A.tuft makes each
         spike len*0.22 wide, so a spike short enough not to out-top her
         ears is barely half a pixel across — the contour pass swallows it
         whole and what survives is a lumpy black bulge on the rim, which
         is worse than nothing. A spike wide enough to survive has to be
         about nine pixels long, which is taller than the plate and puts
         her back to four spikes on top of the silhouette with no way to
         tell which pair is the cat.

         So the rim is clean and the rivets do the work of saying steel.
         They are two pixels of near-white on a dark plane, which is how a
         specular hit on metal has always been drawn at this resolution.  */

      /* the lit top plane, cut hard across the plate. Three tones on one
         material: PLATE in shadow, PLATE2 catching the light, and PLATE3
         under it. A single flat fill here and the pad reads as a hole cut
         in the cat. */
      /* A RIDGE, not a half. The old one ran from the top edge down to the
         middle of the plate, so half the steel was the light tone and the
         plate averaged out pale. A beaten plate is dark except along the
         one edge that happens to point at the lamp; make that edge three
         pixels deep and nearly white and you get metal, make it half the
         area and a bit lighter and you get card. Deeper at the front, where
         the lamp is, and tapering towards the back. */
      A.add('body', function (cx) {
        cx.beginPath();
        var b0 = Q(0.86, 0.34); cx.moveTo(b0.x, b0.y);
        L2(cx, Q(0.92, -0.44));
        L2(cx, Q(0.58, -1.30));
        L2(cx, Q(-0.24, -1.70));
        L2(cx, Q(-0.16, -1.40));
        L2(cx, Q(0.42, -1.08));
        L2(cx, Q(0.64, -0.44));
        L2(cx, Q(0.56, 0.24));
        cx.closePath();
      }, PLATE2, { flat: true });

      /* the DARK facet, along the underside and the away side. Without it
         the plate was a flat mid-grey polygon with a couple of barely
         lighter slivers on it — grey paper pinned behind her head. A hard
         edge between a light plane and a dark one is the whole difference
         between beaten steel and a cut-out, and it costs one flat fill. */
      A.add('body', function (cx) {
        cx.beginPath();
        /* Deep enough to be a plane and no deeper. At half the plate it ate
           the mid tone and the thing went back to two values — a bright rim
           and a black lump — which is a different way of being flat. */
        var c0 = Q(-0.36, -1.66); cx.moveTo(c0.x, c0.y);
        L2(cx, Q(-0.96, -1.38));
        L2(cx, Q(-1.14, -0.36));
        L2(cx, Q(-0.68, 0.34));
        L2(cx, Q(0.10, 0.56));
        L2(cx, Q(0.14, 0.30));
        L2(cx, Q(-0.52, 0.10));
        L2(cx, Q(-0.86, -0.40));
        L2(cx, Q(-0.78, -1.14));
        L2(cx, Q(-0.40, -1.34));
        cx.closePath();
      }, PLATE3, { flat: true });

      /* Rivets round the rim, flat — they are two pixels across in the
         game and a clip each buys nothing anybody can see. Three now the
         spikes are gone: with a clean rim the plate wanted one incident
         along the top as well as the pair on the face of it, and a rivet
         is the one detail on this thing that survives being shrunk. */
      [[0.20, -1.04], [-0.50, -0.98], [0.38, -0.24]].forEach(function (r) {
        A.add('body', function (cx) {
          var p = Q(r[0], r[1]);
          A.ellipse(cx, p.x, p.y, f.s * 1.5, f.s * 1.5, 0);
        }, STUD, { flat: true });
      });

      /* The strap that buckled the plate across her chest is gone too:
         it crossed the one part of her that is never visible. */

      /* ---- the fur, where the outline is still fur ---------------------
         Five crests, chosen because they are the five places on her that
         are (a) bare ginger rather than leather and (b) on the edge of the
         black shape in most poses. The chest one is the best of them: an
         open cut with the chest bursting out of it is a shape, and it
         happens at the widest, smoothest part of a heavyweight.           */
      var hrot = -(j.headRot || 0) * Math.PI / 180;
      var hcos = Math.cos(hrot), hsin = Math.sin(hrot);
      var hr = f.headR;
      function H(lx, ly) {         /* head-local to figure space */
        return { x: j.head.x + lx * hcos - ly * hsin,
                 y: j.head.y + lx * hsin + ly * hcos };
      }
      function HD(lx, ly) {        /* a direction, ditto */
        return { x: lx * hcos - ly * hsin, y: lx * hsin + ly * hcos };
      }

      /* the chest, through the front of the open cut. The roots sit inside
         the leather and the tips reach four pixels past its front edge, so
         what you see is ginger coming THROUGH the cut and not a fringe
         sewn onto it.

         TWO NUMBERS DECIDE WHETHER A CREST READS AS FUR OR AS A HIT SPARK,
         and the first pass got both wrong. A.tuft lays its roots along a
         line (n-1) * len * 1.05 long, so a crest whose spikes are as long as
         the limb is wide has its outer roots hanging in the air — and with a
         wide `spread` on top of that, what you get is a star. On `fierce` it
         came out as an orange starburst by her fist and read as an impact
         effect, which is the worst possible thing to have standing on a
         fighter's arm. So: the root span stays well inside the part, the
         spread stays under about 35 degrees so every spike leans the same
         way, and the tips stand two or three pixels proud and no more. A
         notch, not a sunburst.

         THERE IS NO FUR ON HER TRUNK, and two goes at putting a crest on
         her chest are what proved it. The cut is cut BIG on purpose — every
         edge of it sits outside the body — so leather, not fur, is the
         outline from her collar to her hip on every side. Above t 0.65 the
         crest had to get out through four pixels of hide and landed beside
         her fist looking like a claw; below it, where the leather has
         fallen away, her own upper arm covers the same ground, because she
         holds her hands low.

         THE FAR ARM IS NO GOOD EITHER, which took a fifth go to establish
         and is worth writing down so nobody spends a sixth. The cut is on
         the `body` layer and the far arm on the layers under it, so the
         leather is painted straight over the arm's whole back edge: what
         you can see of the far arm is the strip of it in FRONT of the
         garment, and none of that is silhouette.

         HOW TO SETTLE THIS IN ONE RENDER, rather than by reasoning about
         the draw order as five of those goes did: give every crest the
         colour '#00ff00' and take a picture. Anything that does not appear
         in green is not there in ginger either, and is a contour stroke
         and a fill a frame for nothing. That test is what deleted the two
         crests on the far arm and doubled the two on the head.

         So the fur lives in the four places the black shape is still made
         of cat: the back of the skull, the jaw, the near elbow, the tail.  */

      /* the near elbow. `rad` puts the roots on the OUTSIDE of the joint —
         the elbow bone is most of a limb-radius in from the skin here, and
         handed the joint itself the first version stood three ginger fangs
         up in the middle of her forearm. */
      var eF = outside(j.shF, j.elbF, j.handF);
      furTuft('front', j.elbF, eF.x, eF.y, 3, f.R_MID * 0.52, 30,
              f.furFront, 0.50, f.R_MID * 0.90);

      /* The back of the skull: the longest clean curve on her, and the one
         crest the eye is guaranteed to be looking at, because it is six
         pixels from her face. In the head's own frame so it swings with the
         head rather than sliding about on it.

         It was half this length to begin with and stood one and a half
         pixels proud of the skull — which the contour pass, being 1.8
         wide, ate whole. A notch has to CLEAR the outline it is notching:
         three pixels of ginger past the black is the floor, and below that
         you have paid for a shape and bought a slightly lumpier line. */
      var d1 = HD(-0.94, 0.34);
      furTuft('front', H(-hr * 1.05, hr * 0.34), d1.x, d1.y,
              3, hr * 0.66, 34, f.fur, 0.42);
      /* and the jaw, under the cheek — two spikes, and shorter, so the
         pair of them do not read as a matched set */
      var d2 = HD(0.14, -0.99);
      furTuft('front', H(hr * 0.62, -hr * 0.80), d2.x, d2.y,
              2, hr * 0.70, 26, f.fur, 0.45);

      /* THE TAIL, which is only silhouette in about half the poses — but
         in those half it is the biggest curve in the picture, sweeping out
         further than anything else she has. Outward is decided against the
         pelvis rather than by a fixed sign, because the tail crosses its
         own root when she turns. */
      var t1 = j.tail[1], t2 = j.tail[2];
      var tdx = t2.x - t1.x, tdy = t2.y - t1.y;
      var tl = Math.hypot(tdx, tdy) || 1;
      var tpx = -tdy / tl, tpy = tdx / tl;
      if (tpx * (t1.x - pv.x) + tpy * (t1.y - pv.y) < 0) { tpx = -tpx; tpy = -tpy; }
      var tailW = 4.0 * f.s * f.GW;
      furTuft('back', { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 },
              tpx, tpy, 3, tailW * 0.86, 30, f.furBack, 0.46, tailW * 0.74);

    },

    /* Old damage, in three pale lines. It goes on the bare upper arm and
       across the muzzle — everywhere else on her is under leather now, and
       a scar drawn on a studded hide reads as a scratch in the paint.
       One pixel, because two is a stripe. The rig has a `kit.scars` that
       rakes the chest; hers is off, since the chest is covered. */
    overlay: function (ctx, j, fig) {
      var s = fig.s;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,238,224,.5)';
      ctx.lineWidth = Math.max(1, 0.95 * s);
      ctx.lineCap = 'butt';
      /* two rakes across the near forearm */
      var dx = j.handF.x - j.elbF.x, dy = j.handF.y - j.elbF.y;
      var L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      var px = -uy, py = ux;
      for (var q = 0; q < 2; q++) {
        var u = L * (0.34 + q * 0.22);
        ctx.beginPath();
        ctx.moveTo(j.elbF.x + ux * u + px * 3.4 * s, j.elbF.y + uy * u + py * 3.4 * s);
        ctx.lineTo(j.elbF.x + ux * (u + 1.6 * s) - px * 2.6 * s,
                   j.elbF.y + uy * (u + 1.6 * s) - py * 2.6 * s);
        ctx.stroke();
      }
      ctx.restore();

      /* and one over the bridge of the nose, clear of the eye — over the
         eye it splits the pupil and reads as a fault in the drawing */
      var r = j.headR;
      ctx.save();
      ctx.translate(j.head.x, j.head.y);
      ctx.rotate(-(j.headRot || 0) * Math.PI / 180);
      ctx.strokeStyle = 'rgba(255,238,224,.55)';
      ctx.lineWidth = Math.max(1, 0.95 * fig.s);
      ctx.beginPath();
      ctx.moveTo(r * 0.52, r * 0.30);
      ctx.lineTo(r * 0.20, -r * 0.30);
      ctx.stroke();
      ctx.restore();
    }
  },

  displayName: 'RUBY',
  subtitle: 'The Jaw',
  blurb: 'Rubidoux when she is in trouble. Hold down and wait, and anything that jumps at her gets flipped out of the sky.',
  difficulty: 3,
  palette: {
    /* `kit` is empty on purpose: the collar, the studs and the scars are
       all geometry in `look` now, and rig's built-in versions draw on top
       of them. The old `accessory: 'collar'` in particular put a little
       gold BELL under her chin, which is the exact opposite of the read. */
    kit: {},
    /* Warmed up a step on 22 Aug. Against near-black leather and a steel
       plate the old #a55c34 sat in the same muddy band as the kit and the
       whole cat read brown-on-brown; the ginger has to be the light in the
       picture or there is no picture. */
    /* The belly and the muzzle used to be the same cream, and on a
       heavyweight that is a mistake: the bib is the biggest single shape on
       her chest, so the brightest value in the picture was a soft pale blob
       four times the area of her face and the eye went there first. The bib
       is a step down and a step warmer now — enough to read as a different
       material from the ginger, not enough to be a lamp — and `muzzleColor`
       keeps the old cream where it belongs, on the twenty pixels of snout
       that the face is built round. */
    fur: '#b8683a', fur2: '#8d4b2c', belly: '#dcb98d', muzzleColor: '#f2d9b6',
    marks: '#5d2f1c',
    eye: '#e0b23a', nose: '#c4736a', inner: '#d99a90',
    accent: '#6b2f22', pattern: 'tabby',
    tailTip: '#5d2f1c', line: 'rgba(38,20,14,.6)'
  },
  stats: { walkF: 1.22, walkB: 1.04, jumpVy: 9.0, jumpVx: 2.6, gravity: 0.50,
           health: 750, stunMax: 128, weight: 1.30, hasDash: false },
  mod: { reach: 1.00, damage: 1.16, speed: 1.14 },
  specials: [
    {
      id: 'crushingbite', name: 'Crushing Bite',
      desc: 'She takes a hit on the way in, frames 7 to 18, and answers it with a hard knockdown.', kind: 'special',
      motion: 'qcf', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
      startup: 11, active: 6, recovery: 26,
      damage: [82, 96, 110], stun: [22, 25, 28], chip: 10,
      hitstun: 22, blockstun: 14, knockdown: 'hard',
      pushback: 3.4, blockPushback: 4.0,
      /* she comes through one hit to land it */
      armor: [7, 18],
      hitbox: { x: 16, y: 30, w: 44, h: 30 },
      mouth: 'open', mouthFrom: 7,
      meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.stand }, { at: 7, p: Ps.biteWind },
             { at: 11, p: Ps.biteOut }, { at: 17, p: Ps.biteOut },
             { at: 26, p: Ps.stand }, { at: 43, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr >= 9 && fr < 18) f.vx = f.facing * (3.0 + strength * 0.5);
      }
    },
    {
      id: 'flipkick', name: 'Flip Kick',
      desc: 'A charge move: hold down for about forty frames, then up and kick. Three frames of startup, invincible going up.', kind: 'special',
      charge: 'du', chargeFrames: 40, buttons: ['LK', 'MK', 'HK'],
      stance: ['stand', 'crouch'],
      startup: 3, active: 16, recovery: 26,
      damage: [80, 94, 108], stun: [18, 21, 24], chip: 8,
      hitstun: 22, blockstun: 13, knockdown: 'hard',
      pushback: 1.6, blockPushback: 3.4,
      invuln: [0, 5], airborne: [2, 34],
      hitbox: { x: -4, y: 40, w: 42, h: 58 },
      meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.flipKickWind }, { at: 3, p: Ps.flipKickWind },
             { at: 8, p: Ps.flipKickUp }, { at: 19, p: Ps.flipKickUp },
             { at: 28, p: Ps.flipKickDown }, { at: 45, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 1) { f.vy = 8.2 + strength * 0.6; f.vx = f.facing * 1.2; f.grounded = false; }
      }
    }
  ],
  supers: [{
    id: 'superBite', name: 'THE VICE',
    desc: 'Eight frames of startup, invincible for eleven, and a hard knockdown on the end of it.', motion: 'qcfx2',
    buttons: ['LP', 'MP', 'HP'], cost: 100,
    startup: 8, active: 20, recovery: 34, freeze: 28,
    damage: 62, stun: 12, chip: 12, multiHit: 4, hitGap: 5,
    hitstun: 22, blockstun: 14, knockdown: 'hard',
    pushback: 3.0, blockPushback: 4.0,
    invuln: [0, 11],
    hitbox: { x: 12, y: 26, w: 50, h: 38 },
    mouth: 'open', mouthFrom: 4,
    anim: [{ at: 0, p: Ps.biteWind }, { at: 8, p: Ps.biteOut },
           { at: 14, p: Ps.biteWind }, { at: 20, p: Ps.biteOut },
           { at: 28, p: Ps.biteOut }, { at: 62, p: Ps.stand }],
    moveSelf: function (f, fr) {
      if (fr >= 6 && fr < 26) f.vx = f.facing * 3.4;
    }
  }]
  };
})();
