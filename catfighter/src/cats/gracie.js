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
     with the screen upside down. Gracie wears a sleeveless training top
     gone soft with washing, a belt tied off at the hip, and wraps.

     `pieces` adds real geometry into the figure at four points in the draw
     order — 'back', 'body', 'front', 'head' — and everything it adds gets
     the same contour pass and the same cel shading as the fur underneath
     it. `f` carries the measurements: chestW, waistW, hipW, headR, the limb
     radii, and the tones. See the COSTUME block in rig.js.               */
  look: {
    pieces: function (A, j, f) {
      var GI = '#e6ddc9', TRIM = '#c4b79c', BELT = '#8f2f2c';

      /* --- the top: a vest over the chest, cut away at the shoulders so
             the deltoids stay in the silhouette, and hanging loose at the
             hem where a worn one would --- */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;          /* forward, across the spine */
      function T(t, w) { return { x: p.x + dx * t + fx * w, y: p.y + dy * t + fy * w }; }

      A.add('body', function (cx) {
        A.smooth(cx, [
          T(0.02, f.hipW * 1.10), T(0.30, f.waistW * 1.24),
          T(0.58, f.chestW * 1.10), T(0.80, f.chestW * 1.20),
          T(0.96, f.chestW * 0.86), T(1.00, f.chestW * 0.08),
          T(0.94, -f.chestW * 0.78), T(0.74, -f.chestW * 1.14),
          T(0.46, -f.chestW * 1.06), T(0.22, -f.waistW * 1.26),
          T(-0.02, -f.hipW * 1.14), T(-0.06, 0)
        ]);
      }, GI, { band: true, edge: true });

      /* the lapel crossing the chest, which is the shape that says gi */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(0.96, f.chestW * 0.12), T(0.90, f.chestW * 0.78),
          T(0.52, f.chestW * 0.44), T(0.46, f.chestW * 0.02),
          T(0.62, -f.chestW * 0.22), T(0.88, -f.chestW * 0.30)
        ]);
      }, TRIM, { band: true, edge: true });

      /* --- the belt, tied off with two short ends --- */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(0.13, f.waistW * 1.30), T(0.24, f.waistW * 1.26),
          T(0.25, -f.waistW * 1.26), T(0.14, -f.waistW * 1.30)
        ]);
      }, BELT, { band: true, edge: true });
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(0.20, f.waistW * 1.02), T(0.21, f.waistW * 1.34),
          T(-0.10, f.waistW * 1.20), T(-0.08, f.waistW * 0.80)
        ]);
      }, A.shade(BELT, 0.20), { edge: true });

      /* --- the headband's tails, streaming behind her. The band itself is
             already drawn on the skull; these are what you see move. --- */
      var r = f.headR, sway = 0;
      A.add('head', function (cx) {
        cx.beginPath();
        cx.moveTo(-r * 0.86, r * 0.44);
        cx.quadraticCurveTo(-r * 1.54, r * 0.74 + sway, -r * 2.16, r * 0.30 + sway);
        cx.quadraticCurveTo(-r * 1.56, r * 0.22 + sway, -r * 0.90, -r * 0.06);
        cx.closePath();
      }, BELT, { edge: true });
      A.add('head', function (cx) {
        cx.beginPath();
        cx.moveTo(-r * 0.84, r * 0.06);
        cx.quadraticCurveTo(-r * 1.44, -r * 0.30 - sway, -r * 2.02, -r * 0.60 - sway);
        cx.quadraticCurveTo(-r * 1.36, -r * 0.10 - sway, -r * 0.80, -r * 0.34);
        cx.closePath();
      }, A.shade(BELT, 0.22), { edge: true });
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
    accent: '#8a7f70', accessory: 'headband', pattern: 'solid',
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
