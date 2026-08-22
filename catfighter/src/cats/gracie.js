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
    /* Upright, weight back, lead paw open and low. She does not chase
       anybody — she waits, and you come to her. */
  stance: { torso: -3, py: 1.5, armF: [-10, -20], armB: [-8, 2], head: [0, 0, -2] },
  build: { s: 1.02, girth: 1.06, limb: 0.99, head: 1.00, muscle: 0.9,
           headShape: 'round', ear: 'small', shoulder: 1.02, waist: 0.98, limbW: 1.02 },

  /* ---- HER LOOK ---------------------------------------------------------

     The costume, not the colour, is what makes a fighting-game character
     recognisable — you know Ryu from the gi and Zangief from the outline
     with the screen upside down. Gracie is the old master, so she wears the
     oldest thing on the roster: a sleeveless gi gone the colour of bone,
     a black belt worn grey at the fold, and forearm wraps.

     The first pass at this was a vest that stopped at the waist. At game
     size it read as nothing at all — a pale patch on a grey cat, exactly
     the same black shape as every other cat in the line-up. What fixed it
     was the HEM: the gi now hangs a third of the way down her thighs and
     the bottom edge is frayed, so her outline below the belt is cloth and
     not leg. That is the silhouette, and it is visible at 1:1.

     `pieces` adds real geometry into the figure at four points in the draw
     order — 'back', 'body', 'front', 'head' — and everything it adds gets
     the same contour pass and the same cel shading as the fur underneath
     it. `f` carries the measurements: chestW, waistW, hipW, headR, the limb
     radii, and the tones. See the COSTUME block in rig.js.               */
  look: {
    pieces: function (A, j, f) {
      /* Bone, not white: a gi this old has been washed a thousand times.
         The lapel is the same cloth in shadow, which is how a real one
         reads — one material, two planes — rather than a stripe of a
         second colour sewn on. The belt is nearly black so it survives the
         drop to 384x224, where a mid-tone belt on a mid-tone cat vanishes. */
      var GI = '#f1e9d5', FOLD = '#d8c9a8', BELT = '#2e2a29', KNOT = '#413b39';

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
          T(0.68, f.chestW * 1.04), T(0.88, f.chestW * 1.12),
          T(1.01, f.chestW * 0.30), T(1.03, -f.chestW * 0.34),
          T(0.90, -f.chestW * 1.10), T(0.58, -f.chestW * 1.16),
          T(0.34, -f.waistW * 1.36), T(0.16, -f.hipW * 1.18)
        ]);
      }, GI, { band: true, edge: true });

      /* the lapel crossing the chest — the shape that says gi and not vest.
         It runs from the collar down the front to the belt, and it is a
         wide band rather than a line because a line is gone at game size. */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(1.02, f.chestW * 0.18), T(0.86, f.chestW * 1.14),
          T(0.56, f.chestW * 1.10), T(0.26, f.chestW * 1.02),
          T(0.28, f.chestW * 0.52), T(0.60, f.chestW * 0.56),
          T(0.90, f.chestW * 0.52)
        ]);
      }, FOLD, { edge: true });

      /* the collar standing up behind the neck, so the gi has a back to it
         and the shoulder is not a bare cut-off line */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(1.04, -f.chestW * 0.30), T(1.14, -f.chestW * 0.46),
          T(1.10, -f.chestW * 0.92), T(0.90, -f.chestW * 1.12),
          T(0.94, -f.chestW * 0.66)
        ]);
      }, FOLD, { edge: true });

      /* --- the hem. On 'front' so it hangs OVER her near thigh, the way a
             gi skirt does; on 'body' the leg was painted straight over it
             and the whole point was lost. The bottom edge is cut with
             lineTo and not smoothed, because A.smooth rounds a two-pixel
             tooth away to nothing and the fray is the silhouette. --- */
      function fray(cx, t0, w0, t1, w1, n2, bite) {
        for (var i = 0; i <= n2; i++) {
          var u = i / n2;
          line(cx, t0 + (t1 - t0) * u - (i % 2 ? bite : 0), w0 + (w1 - w0) * u);
        }
      }
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.34, f.hipW * 1.02); cx.moveTo(a.x, a.y);
        line(cx, 0.10, f.hipW * 1.40);
        line(cx, -0.14, f.hipW * 1.52);
        fray(cx, -0.33, f.hipW * 1.40, -0.29, -f.hipW * 1.50, 6, 0.085);
        line(cx, -0.06, -f.hipW * 1.62);
        line(cx, 0.16, -f.hipW * 1.42);
        line(cx, 0.34, -f.hipW * 1.06);
        cx.closePath();
      }, GI, { band: true, edge: true });

      /* --- the belt. Wider than the gi at that height so it reads as a band
             laid over it, and dark enough to be the one hard value break on
             a cat who is otherwise grey on cream. --- */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.16, f.hipW * 1.22), T(0.33, f.hipW * 1.12),
          T(0.34, -f.hipW * 1.20), T(0.15, -f.hipW * 1.30)
        ]);
      }, BELT, { band: true, edge: true });

      /* the knot, sat on the front of the belt where the eye lands */
      A.add('front', function (cx) {
        var k = T(0.245, f.hipW * 0.86);
        A.ellipse(cx, k.x, k.y, 3.2 * f.s, 2.6 * f.s, 0.3);
      }, KNOT, { band: true, edge: true });

      /* the two ends hanging off it, over the hem. Different lengths — a
         matched pair reads as a printed decal, an odd pair as cloth. */
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
        strap(cx, f.hipW * 0.88, -0.24, f.hipW * 1.06, f.hipW * 0.15);
      }, BELT, { edge: true });
      A.add('front', function (cx) {
        strap(cx, f.hipW * 0.26, -0.08, f.hipW * 0.22, f.hipW * 0.13);
      }, A.shade(BELT, -0.18), { edge: true });

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

      A.add('head', function (cx) {
        cx.beginPath();
        cx.moveTo(-r * 0.74, r * 0.08);
        cx.quadraticCurveTo(-r * 1.70, r * 0.12, -r * 2.66, -r * 0.26);
        cx.lineTo(-r * 2.26, -r * 0.36);      /* the notch in the tail */
        cx.lineTo(-r * 2.50, -r * 0.66);
        cx.quadraticCurveTo(-r * 1.66, -r * 0.28, -r * 0.72, -r * 0.20);
        cx.closePath();
      }, '#b8332f', { band: true, edge: true });
      A.add('head', function (cx) {
        cx.beginPath();
        cx.moveTo(-r * 0.72, -r * 0.22);
        cx.quadraticCurveTo(-r * 1.44, -r * 0.52, -r * 2.10, -r * 0.94);
        cx.lineTo(-r * 1.78, -r * 0.98);
        cx.lineTo(-r * 1.90, -r * 1.24);
        cx.quadraticCurveTo(-r * 1.30, -r * 0.64, -r * 0.70, -r * 0.46);
        cx.closePath();
      }, '#8f2422', { edge: true });
    },

    /* A scar over the leading brow, in one pale line. She has been doing
       this a long time and it is the only thing on her that is damage
       rather than kit. Drawn over the finished face so it crosses the eye;
       one pixel wide, because two reads as a stripe of paint. */
    overlay: function (ctx, j, fig) {
      var r = j.headR;
      ctx.save();
      ctx.translate(j.head.x, j.head.y);
      ctx.rotate(-(j.headRot || 0) * Math.PI / 180);
      ctx.globalAlpha = 0.62;
      ctx.strokeStyle = '#e9e3d6';
      ctx.lineWidth = Math.max(1, 0.9 * fig.s);
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(r * 0.70, r * 0.60);
      ctx.lineTo(r * 0.44, r * 0.02);
      ctx.stroke();
      ctx.restore();
    }
  },

  displayName: 'GRACIE',
  subtitle: 'The Elder',
  blurb: 'Old, and she knows it. A growl that carries the length of the barn, and a tail that takes your legs out from under you.\nLet them come to you.',
  difficulty: 2,
  palette: {
    /* The old master. A headband gone soft with age and the wrapped
       forepaws of somebody who has been doing this a long time. */
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
