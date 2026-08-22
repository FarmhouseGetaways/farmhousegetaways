/* =====================================================================
   6 — RUBY. Rubidoux. Short for nothing, she just is.

   HEAVY: hard to hurt and hard to move, with a bite that goes through
   whatever you were doing and a flip kick for anyone who jumps at her.

   THE LOOK. She is the one on the select screen you do not want to
   pick a fight with. That is a costume job, not a colour job — a ginger
   tabby with no kit on is a ginger tabby, which is exactly what she was
   until 22 Aug 2026. Studded leather cut, one enormous shoulder pad,
   a chain round her neck, trousers torn off below the knee, bare feet.
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

       1. the pauldron — one, on the leading shoulder, wider than her head
       2. the hackle — a ridge of raised fur down the back of her neck
       3. the long back hem of the cut, hanging past her tail root
       4. the torn trouser legs, cut off in teeth below the knee

     Everything else — the chain, the studs, the buckle — is value work
     that makes her read as leather rather than as fur, and none of it is
     load-bearing at 384x224.                                            */
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
      var HIDE = '#2e1d18', HIDE2 = '#4a2e24', STUD = '#cfcabc',
          CHAIN = '#9c968a', TROU = '#443f36', TROU2 = '#2c2924',
          HACKLE = '#7a3f26';
      /* The pauldron is STEEL, not more leather. Drawn in the same near-
         black hide as the cut it merged straight into it and the two
         became one shapeless mass down her whole front — a lot of work
         that read as a hole in the cat. Iron is a value nothing else on
         her occupies: darker than the ginger, much lighter than the
         leather, so the plate separates from both without a single extra
         line. It also earns the studs, which were invisible on black. */
      var PLATE = '#5d5c60', PLATE2 = '#8a8992';

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

      /* ================= THE SCRUFF =================================

         Hackles up on the nape, between the collar and the skull. On
         'back', so the only part that survives is the part standing proud
         of the neck — which is the part doing the silhouette work.

         It was first put at t 0.86 on the SPINE, half a chest back, which
         is the middle of her shoulder blades: entirely inside the torso,
         and under the leather at that. It shows nothing there. It also
         wants to point back and up rather than straight up — straight up
         on a hunched figure reads as a mohawk sitting on nothing.     */
      A.add('back', function (cx) {
        A.tuft(cx, N(-0.72, 0.34), 5, cw * 0.74, 64, 146, true);
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
      A.add('back', function (cx) {
        cx.beginPath();
        var d = f.sway * 0.55;
        var a = T(0.16, -f.hipW * 1.30); cx.moveTo(a.x, a.y);
        seg(cx, -0.30, -f.hipW * 1.52 - d);
        seg(cx, -0.46, -f.hipW * 1.06 - d * 1.4);
        seg(cx, -0.38, -f.hipW * 0.52 - d);
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
      function trouser(layer, hip, knee, foot, wh, wk, ws) {
        var a = frame(hip, knee), b = frame(knee, foot);
        A.add(layer, function (cx) {
          cx.beginPath();
          var s0 = P(a, hip, -a.L * 0.30, wh); cx.moveTo(s0.x, s0.y);
          L2(cx, P(a, hip, a.L * 0.96, wk));
          L2(cx, P(b, knee, b.L * 0.36, ws));
          /* the tear */
          L2(cx, P(b, knee, b.L * 0.46, ws * 0.46));
          L2(cx, P(b, knee, b.L * 0.24, ws * 0.12));
          L2(cx, P(b, knee, b.L * 0.44, -ws * 0.34));
          L2(cx, P(b, knee, b.L * 0.26, -ws * 0.74));
          L2(cx, P(b, knee, b.L * 0.40, -ws));
          L2(cx, P(a, hip, a.L * 0.96, -wk));
          L2(cx, P(a, hip, -a.L * 0.30, -wh));
          cx.closePath();
        }, TROU, { band: true, edge: true });
        /* one dark panel down the back of the leg so it is a trouser with
           a light on it and not a grey tube */
        A.add(layer, function (cx) {
          cx.beginPath();
          var s1 = P(a, hip, -a.L * 0.26, -wh * 0.96); cx.moveTo(s1.x, s1.y);
          L2(cx, P(a, hip, a.L * 0.96, -wk * 0.98));
          L2(cx, P(b, knee, b.L * 0.30, -ws * 0.94));
          L2(cx, P(b, knee, b.L * 0.24, -ws * 0.24));
          L2(cx, P(a, hip, -a.L * 0.26, -wh * 0.34));
          cx.closePath();
        }, TROU2, { flat: true });
      }
      trouser('body', j.hipB, j.kneeB, j.footB,
              f.R_TOP * 1.06, f.R_MID * 1.36, f.R_MID * 1.24);
      trouser('front', j.hipF, j.kneeF, j.footF,
              f.R_TOP * 1.12, f.R_MID * 1.44, f.R_MID * 1.30);

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
        A.add(layer, function (cx) {
          A.smooth(cx, [A2(0.30, w0 * 0.28), A2(0.82, w1 * 0.32),
                        A2(0.82, w1 * 0.92), A2(0.30, w0 * 0.90)]);
        }, HIDE2, { flat: true });
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
      var pr = f.chestW * 0.70;
      var sh = { x: j.shB.x + UPX * pr * 0.74 - sfx * pr * 1.05,
                 y: j.shB.y + UPY * pr * 0.74 - sfy * pr * 1.05 };
      function Q(u, v) {   /* u up the spine, v forward, in chestW units */
        return { x: sh.x + UPX * pr * u + sfx * pr * v,
                 y: sh.y + UPY * pr * u + sfy * pr * v };
      }
      A.add('body', function (cx) {
        /* Cut with lineTo, not A.smooth. Smoothed, this came out as a grey
           EGG the size of her head — a boulder strapped to her back. A
           plate is beaten flat: straight facets, a hard corner at the
           front and a straight bottom rim where it stops. */
        cx.beginPath();
        var a0 = Q(0.86, 0.34); cx.moveTo(a0.x, a0.y);
        L2(cx, Q(0.94, -0.42));
        L2(cx, Q(0.52, -1.06));
        L2(cx, Q(-0.22, -1.34));
        L2(cx, Q(-0.86, -1.10));
        L2(cx, Q(-1.02, -0.34));
        L2(cx, Q(-0.66, 0.34));
        L2(cx, Q(0.10, 0.56));
        cx.closePath();
      }, PLATE, { band: true, edge: true });

      /* the spikes, off the TOP of the plate and pointing up and back —
         forward and they cross her own muzzle, which at this size reads
         as a broken drawing rather than as studs */
      A.add('body', function (cx) {
        /* Fat and short. A.tuft makes each spike len*0.22 wide, so a long
           thin one is a hair at 384x224 and the contour pass eats it. */
        A.tuft(cx, Q(0.78, -0.34), 3, pr * 0.92, 56, 66, false);
      }, STUD, { edge: true, flat: true });

      /* the lit top plane, cut hard across the plate. Three tones on one
         material: HIDE in shadow, HIDE2 catching the light, and the
         contour pass supplying the third. A single flat fill here and the
         pad reads as a hole cut in the cat. */
      A.add('body', function (cx) {
        cx.beginPath();
        var b0 = Q(0.84, 0.26); cx.moveTo(b0.x, b0.y);
        L2(cx, Q(0.90, -0.40));
        L2(cx, Q(0.50, -1.00));
        L2(cx, Q(-0.12, -0.68));
        L2(cx, Q(0.10, 0.10));
        cx.closePath();
      }, PLATE2, { flat: true });

      /* three rivets round the rim, flat — they are two pixels across in
         the game and a clip each buys nothing anybody can see */
      [[0.22, -1.02], [-0.56, -1.00]].forEach(function (r) {
        A.add('body', function (cx) {
          var p = Q(r[0], r[1]);
          A.ellipse(cx, p.x, p.y, f.s * 1.5, f.s * 1.5, 0);
        }, STUD, { flat: true });
      });

      /* The strap that buckled the plate across her chest is gone too:
         it crossed the one part of her that is never visible. */
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
    fur: '#b8683a', fur2: '#8d4b2c', belly: '#f0d6b2', marks: '#5d2f1c',
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
