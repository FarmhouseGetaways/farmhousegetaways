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

      /* --- the belt. Wider than the gi at that height so it reads as a band
             laid over it, and dark enough to be the one hard value break on
             a cat who is otherwise grey on cream. --- */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.13, f.hipW * 1.26), T(0.35, f.hipW * 1.14),
          T(0.36, -f.hipW * 1.22), T(0.12, -f.hipW * 1.34)
        ]);
      }, BELT, { band: true, edge: true });

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
      ctx.restore();
    }
  },

  displayName: 'GRACIE',
  subtitle: 'The Elder',
  blurb: 'Old, and she knows it. A growl that carries the length of the barn, and a tail that takes your legs out from under you.\nLet them come to you.',
  difficulty: 2,
  palette: {
    /* The old master: the wrapped forearms of somebody who has been doing
       this a long time. The headband is drawn by `look.pieces` rather than
       by rig's `accessory`, so `band` here is only the colour of record. */
    kit: { wraps: '#e8e0cf', band: '#b8332f' },
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
