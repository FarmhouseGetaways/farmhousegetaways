/* ==========================================================================
   Cat Fighter II — the roster

   ---------------------------------------------------------------------------
   NAMES AND LOOKS ARE PLACEHOLDERS. Change `displayName`, `subtitle` and the
   `palette` block below and the whole game updates — select screen, health
   bars, victory text, everything. When real photographs arrive, each cat also
   gains a `photo` block and the head is drawn from the picture instead.
   ---------------------------------------------------------------------------

   Stats are in screen units per frame at 60fps. Health is out of 1000.
   ========================================================================== */
(function () {
  var Ps = CF.Pose, M = CF.Moves;

  /* ---- shared helpers ---------------------------------------------------- */

  /* Projectile-throwing special. Button strength picks the speed, as it
     should — light is a slow wall to walk behind, heavy is a fast punish. */
  function fireballSpecial(o) {
    return CF.util.deepMerge({
      id: 'fireball', name: 'Hairball', kind: 'special',
      motion: 'qcf', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
      startup: 11, active: 3, recovery: 26,
      meterGain: 16, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 7, p: Ps.fireWind },
             { at: 11, p: Ps.fireRelease }, { at: 18, p: Ps.fireRelease },
             { at: 40, p: Ps.stand }],
      spawn: function (f, strength) {
        return {
          kind: 'fireball',
          x: f.x + f.facing * 34, y: 54,
          vx: f.facing * [2.6, 3.4, 4.4][strength],
          w: 26, h: 22,
          damage: [26, 30, 34][strength], chip: 6,
          hitstun: 18, blockstun: 12, stun: 6,
          pushback: 2.6, blockPushback: 3.0,
          life: 240, owner: f.side, facing: f.facing,
          color: o && o.color || '#f0a848', color2: o && o.color2 || '#ffe9b0',
          style: (o && o.style) || 'ball'
        };
      }
    }, o || {});
  }

  /* Invincible rising anti-air. The classic dragon punch. */
  function uppercutSpecial(o) {
    return CF.util.deepMerge({
      id: 'uppercut', name: 'Cat Scratch Fever', kind: 'special',
      motion: 'dp', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
      startup: 4, active: 14, recovery: 22,
      damage: [90, 110, 130], stun: [20, 24, 28], chip: 8,
      hitstun: 22, blockstun: 12, knockdown: 'hard',
      pushback: 1.6, blockPushback: 3.4,
      invuln: [0, 6], airborne: [3, 30],
      hitbox: { x: 6, y: 44, w: 34, h: 52 },
      meterGain: 18, meterOnHit: 10, multiHit: 1,
      anim: [{ at: 0, p: Ps.stand }, { at: 3, p: Ps.dpWind },
             { at: 8, p: Ps.dpRise }, { at: 18, p: Ps.dpRise },
             { at: 26, p: Ps.dpFall }, { at: 40, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 2) { f.vy = 7.4 + strength * 0.7; f.vx = f.facing * 2.0; f.grounded = false; }
      }
    }, o || {});
  }

  /* Spinning kick that travels forward and can cross up. */
  function spinKickSpecial(o) {
    return CF.util.deepMerge({
      id: 'spinkick', name: 'Tumbleweed Kick', kind: 'special',
      motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 6, active: 22, recovery: 16,
      damage: [22, 24, 26], stun: 6, chip: 4,
      hitstun: 14, blockstun: 10, multiHit: 3, hitGap: 8,
      pushback: 1.2, blockPushback: 2.2,
      hitbox: { x: 12, y: 20, w: 40, h: 44 },
      meterGain: 14, meterOnHit: 6,
      anim: [{ at: 0, p: Ps.stand }, { at: 4, p: Ps.spinWind },
             { at: 9, p: Ps.spinA }, { at: 15, p: Ps.spinB },
             { at: 21, p: Ps.spinA }, { at: 27, p: Ps.spinB },
             { at: 33, p: Ps.spinA }, { at: 44, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr < 26) f.vx = f.facing * (3.0 + strength * 0.5) * (1 - fr / 40);
      }
    }, o || {});
  }

  /* ---- the roster -------------------------------------------------------- */

  var ROSTER = [

    /* =====================================================================
       1 — GRACIE. The first of the real cats.

       Old and wise, so she does not scramble: she takes up space with a
       growl that carries and a tail that reaches further than anything else
       on the ground, and lets the young ones come to her.

       Colours read from her photograph: a warm solid grey with a silver
       undercoat coming through on the chest, a pale muzzle, dark mauve paw
       pads and no tabby striping anywhere.
       ===================================================================== */
    {
      id: 'gracie',
      build: { s: 1.02, girth: 1.07, limb: 0.99, head: 1.02 },
      displayName: 'GRACIE',
      subtitle: 'The Elder',
      /* Drop a photo in assets/cats/ and name it here, e.g. 'gracie.jpg'. */
      photo: null,
      blurb: 'Old, and she knows it. A growl that carries the length of the barn, and a tail that takes your legs out from under you.\nLet them come to you.',
      difficulty: 2,
      palette: {
        fur: '#8d887f', fur2: '#6f6b64', belly: '#b9b3a6', marks: '#5e5a54',
        silver: '#d6d1c4', eye: '#7fc24a', nose: '#7d6f6c', inner: '#b89a95',
        accent: '#8a7f70', accessory: 'none', pattern: 'solid',
        tailTip: '#8d887f', elder: true, line: 'rgba(38,34,30,.55)'
      },
      stats: { walkF: 1.30, walkB: 1.22, jumpVy: 9.2, jumpVx: 2.8, gravity: 0.48,
               health: 1050, stunMax: 116, weight: 1.10, hasDash: false },
      mod: { reach: 1.09, damage: 1.10, speed: 1.08 },
      specials: [
        {
          id: 'growl', name: 'Growl of Energy', kind: 'special',
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
          id: 'tailwhip', name: 'Tail Whip', kind: 'special',
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
        id: 'superGrowl', name: 'THE LAST WORD', motion: 'qcfx2',
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
    },

    /* =====================================================================
       2 — the grappler. Slow, enormous health, command throw that hurts.
       ===================================================================== */
    {
      id: 'biscuit',
      build: { s: 1.07, girth: 1.34, limb: 0.94, head: 1.06 },
      displayName: 'BISCUIT',
      subtitle: 'The Heavyweight',
      /* Drop a photo in assets/cats/ and name it here, e.g. 'gracie.jpg'. */
      photo: null,
      blurb: 'Walks slowly. Hits like a falling bookcase.\nGet in close and the round is over.',
      difficulty: 3,
      palette: {
        fur: '#e09a55', fur2: '#c47f45', belly: '#f7e6cf', marks: '#a05f2c',
        eye: '#f0b429', nose: '#c9737d', inner: '#e8a6ad',
        accent: '#7d5a3c', accessory: 'collar', pattern: 'tabby',
        tailTip: '#a05f2c', line: 'rgba(52,32,18,.55)'
      },
      stats: { walkF: 1.15, walkB: 0.95, jumpVy: 9.0, jumpVx: 2.4, gravity: 0.50,
               health: 1200, stunMax: 130, weight: 1.35, hasDash: false },
      mod: { reach: 1.05, damage: 1.22, speed: 1.18 },
      specials: [
        {
          id: 'spinPile', name: 'Cat-astrophic Piledriver', kind: 'special',
          motion: 'p360', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
          isCommandThrow: true, range: 52,
          startup: 2, active: 3, recovery: 34, whiffRecovery: 30,
          damage: [180, 210, 240], stun: [34, 38, 42],
          knockdown: 'hard', meterGain: 24,
          anim: [{ at: 0, p: Ps.grabWind }, { at: 4, p: Ps.grabSpin },
                 { at: 22, p: Ps.grabSpin }, { at: 39, p: Ps.stand }]
        },
        {
          id: 'lariat', name: 'Windmill Tail', kind: 'special',
          motion: 'pp', buttons: ['LP'], stance: ['stand'],
          startup: 5, active: 26, recovery: 20,
          damage: [30, 34, 38], stun: 10, chip: 6,
          hitstun: 16, blockstun: 11, multiHit: 3, hitGap: 9,
          pushback: 2.0, blockPushback: 2.6,
          hitbox: { x: -30, y: 26, w: 76, h: 56 },
          invulnHigh: [4, 26], meterGain: 16,
          anim: [{ at: 0, p: Ps.stand }, { at: 4, p: Ps.spinA },
                 { at: 12, p: Ps.spinB }, { at: 20, p: Ps.spinA },
                 { at: 28, p: Ps.spinB }, { at: 34, p: Ps.spinA }, { at: 51, p: Ps.stand }]
        },
        {
          id: 'headbutt', name: 'Boulder Charge', kind: 'special',
          motion: 'hcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
          startup: 12, active: 20, recovery: 24,
          damage: [70, 80, 90], stun: 20, chip: 8,
          hitstun: 20, blockstun: 13, knockdown: 'soft',
          pushback: 3.6, blockPushback: 4.2,
          hitbox: { x: 14, y: 22, w: 40, h: 48 },
          armor: [10, 30], meterGain: 18,
          anim: [{ at: 0, p: Ps.stand }, { at: 8, p: Ps.chargeWind },
                 { at: 14, p: Ps.chargeGo }, { at: 30, p: Ps.chargeGo },
                 { at: 54, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr >= 10 && fr < 32) f.vx = f.facing * (4.2 + strength * 0.6);
          }
        }
      ],
      supers: [{
        id: 'superGrab', name: 'FINAL CATASTROPHE', motion: 'p360',
        buttons: ['LK', 'MK', 'HK'], cost: 100,
        isCommandThrow: true, range: 58,
        startup: 2, active: 3, recovery: 40, freeze: 30, whiffRecovery: 36,
        damage: 380, stun: 50, knockdown: 'hard', invuln: [0, 4],
        anim: [{ at: 0, p: Ps.grabWind }, { at: 4, p: Ps.grabSpin },
               { at: 30, p: Ps.grabSpin }, { at: 45, p: Ps.stand }]
      }]
    },

    /* =====================================================================
       3 — the charge zoner. Hold back, hold down, punish everything.
       ===================================================================== */
    {
      id: 'shadow',
      build: { s: 1.03, girth: 0.94, limb: 1.05, head: 0.96 },
      displayName: 'SHADOW',
      subtitle: 'The Gatekeeper',
      /* Drop a photo in assets/cats/ and name it here, e.g. 'gracie.jpg'. */
      photo: null,
      blurb: 'Hold back to charge a boomerang, hold down for a flash kick.\nPatient cats win rounds.',
      difficulty: 2,
      palette: {
        fur: '#3c3c46', fur2: '#2c2c34', belly: '#f0efe9', marks: '#1e1e26',
        eye: '#f5d76e', nose: '#b06a74', inner: '#c98d95',
        accent: '#2e86ab', accessory: 'goggles', pattern: 'tuxedo',
        tailTip: '#f0efe9', line: 'rgba(10,10,16,.6)'
      },
      stats: { walkF: 1.45, walkB: 1.40, jumpVy: 9.4, jumpVx: 3.0, gravity: 0.47,
               health: 1000, stunMax: 105, weight: 1.05, hasDash: true },
      mod: { reach: 1.06, damage: 1.02, speed: 1.0 },
      specials: [
        {
          id: 'boomerang', name: 'Whisker Boomerang', kind: 'special',
          charge: 'bf', chargeFrames: 40, buttons: ['LP', 'MP', 'HP'],
          stance: ['stand', 'crouch'],
          startup: 9, active: 3, recovery: 20, meterGain: 14,
          anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.fireWind },
                 { at: 9, p: Ps.fireRelease }, { at: 15, p: Ps.fireRelease },
                 { at: 32, p: Ps.stand }],
          spawn: function (f, strength) {
            return {
              kind: 'fireball', x: f.x + f.facing * 32, y: 50,
              vx: f.facing * [4.0, 4.8, 5.6][strength],
              w: 30, h: 16,
              damage: [24, 28, 32][strength], chip: 5,
              hitstun: 16, blockstun: 11, stun: 5,
              pushback: 2.4, blockPushback: 2.8, life: 200,
              owner: f.side, facing: f.facing,
              color: '#9fe6ff', color2: '#ffffff', style: 'blade'
            };
          }
        },
        {
          id: 'flashkick', name: 'Moonlight Flip', kind: 'special',
          charge: 'du', chargeFrames: 40, buttons: ['LK', 'MK', 'HK'],
          stance: ['stand', 'crouch'],
          startup: 3, active: 16, recovery: 26,
          damage: [80, 100, 120], stun: [18, 22, 26], chip: 8,
          hitstun: 22, blockstun: 12, knockdown: 'hard',
          pushback: 1.4, blockPushback: 3.2,
          invuln: [0, 5], airborne: [2, 32],
          hitbox: { x: -4, y: 40, w: 38, h: 56 },
          meterGain: 18,
          anim: [{ at: 0, p: Ps.crouch }, { at: 2, p: Ps.dpWind },
                 { at: 7, p: Ps.spinA }, { at: 16, p: Ps.dpRise },
                 { at: 28, p: Ps.dpFall }, { at: 44, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr === 1) { f.vy = 8.0 + strength * 0.6; f.vx = f.facing * 1.2; f.grounded = false; }
          }
        },
        {
          id: 'slide', name: 'Shadow Slide', kind: 'special',
          motion: 'qcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
          startup: 7, active: 12, recovery: 18,
          damage: [28, 32, 36], stun: 8, chip: 4,
          hitstun: 16, blockstun: 11, hitLevel: 'low', knockdown: 'soft',
          pushback: 2.4, blockPushback: 2.8,
          hitbox: { x: 10, y: 0, w: 46, h: 20 },
          lowProfile: [6, 20], meterGain: 14,
          anim: [{ at: 0, p: Ps.crouch }, { at: 6, p: Ps.sweep },
                 { at: 18, p: Ps.sweep }, { at: 36, p: Ps.crouch }],
          moveSelf: function (f, fr, strength) {
            if (fr >= 5 && fr < 20) f.vx = f.facing * (5.0 + strength * 0.4) * (1 - (fr - 5) / 22);
          }
        }
      ],
      supers: [{
        id: 'superFlash', name: 'ECLIPSE', motion: 'chargeSuper',
        charge: 'du', chargeFrames: 55, buttons: ['LK', 'MK', 'HK'], cost: 100,
        startup: 3, active: 28, recovery: 34, freeze: 26,
        damage: 70, stun: 12, chip: 10, multiHit: 5, hitGap: 6,
        hitstun: 18, blockstun: 12, knockdown: 'hard',
        invuln: [0, 12], airborne: [2, 40],
        hitbox: { x: -8, y: 34, w: 46, h: 68 },
        anim: [{ at: 0, p: Ps.crouch }, { at: 3, p: Ps.dpWind },
               { at: 10, p: Ps.spinA }, { at: 20, p: Ps.dpRise },
               { at: 34, p: Ps.spinB }, { at: 46, p: Ps.dpFall },
               { at: 64, p: Ps.stand }],
        moveSelf: function (f, fr) {
          if (fr === 2) { f.vy = 9.2; f.grounded = false; }
          if (fr > 2 && fr < 30) f.vy += 0.16;   // hangs in the air
        }
      }]
    },

    /* =====================================================================
       4 — rushdown. Fast, light, dies quickly, never stops moving.
       ===================================================================== */
    {
      id: 'pepper',
      build: { s: 0.92, girth: 0.94, limb: 0.95, head: 1.08 },
      displayName: 'PEPPER',
      subtitle: 'The Blur',
      /* Drop a photo in assets/cats/ and name it here, e.g. 'gracie.jpg'. */
      photo: null,
      blurb: 'Fastest paws on the ranch. Mash a kick for the leg flurry.\nLow damage, endless pressure.',
      difficulty: 2,
      palette: {
        fur: '#8a6a4f', fur2: '#6e5340', belly: '#f4e7d6', marks: '#3b2b22',
        marks2: '#d9a441', eye: '#59c2c9', nose: '#c9737d', inner: '#e2949c',
        accent: '#d9a441', accessory: 'collar', pattern: 'tortie',
        tailTip: '#d9a441', line: 'rgba(34,24,18,.55)'
      },
      stats: { walkF: 1.95, walkB: 1.65, jumpVy: 9.2, jumpVx: 3.8, gravity: 0.50,
               health: 900, stunMax: 92, weight: 0.82, hasDash: true, airDash: true },
      mod: { reach: 0.92, damage: 0.85, speed: 0.82 },
      specials: [
        {
          id: 'flurry', name: 'Thousand Paw Kick', kind: 'special',
          motion: 'mash', buttons: ['LK', 'MK', 'HK'], stance: ['stand'],
          startup: 4, active: 30, recovery: 16,
          damage: [12, 13, 14], stun: 2, chip: 2,
          hitstun: 10, blockstun: 8, multiHit: 7, hitGap: 4,
          pushback: 0.5, blockPushback: 1.2,
          hitbox: { x: 22, y: 30, w: 34, h: 22 },
          meterGain: 4, meterOnHit: 3,
          anim: [{ at: 0, p: Ps.stand }, { at: 4, p: Ps.lk },
                 { at: 8, p: Ps.mk }, { at: 12, p: Ps.lk },
                 { at: 16, p: Ps.mk }, { at: 20, p: Ps.lk },
                 { at: 24, p: Ps.mk }, { at: 28, p: Ps.lk },
                 { at: 34, p: Ps.mk }, { at: 50, p: Ps.stand }]
        },
        {
          id: 'pounce', name: 'Pounce', kind: 'special',
          motion: 'dp', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
          startup: 5, active: 18, recovery: 20,
          damage: [50, 58, 66], stun: 14, chip: 6,
          hitstun: 20, blockstun: 12, knockdown: 'soft',
          pushback: 2.0, blockPushback: 3.0,
          airborne: [4, 34], invuln: [0, 4],
          hitbox: { x: 8, y: 34, w: 40, h: 40 },
          meterGain: 16,
          anim: [{ at: 0, p: Ps.stand }, { at: 4, p: Ps.dpWind },
                 { at: 9, p: Ps.jumpKick }, { at: 22, p: Ps.jumpKick },
                 { at: 30, p: Ps.land }, { at: 43, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr === 3) { f.vy = 7.0 + strength * 0.4; f.vx = f.facing * (4.4 + strength * 0.5); f.grounded = false; }
          }
        },
        {
          id: 'spinBird', name: 'Whirlwind Tail', kind: 'special',
          charge: 'du', chargeFrames: 36, buttons: ['LK', 'MK', 'HK'],
          stance: ['stand', 'crouch'],
          startup: 5, active: 26, recovery: 18,
          damage: [18, 20, 22], stun: 5, chip: 3,
          hitstun: 14, blockstun: 10, multiHit: 4, hitGap: 7,
          pushback: 1.0, blockPushback: 2.0,
          airborne: [4, 34],
          hitbox: { x: -18, y: 24, w: 60, h: 46 },
          meterGain: 14,
          anim: [{ at: 0, p: Ps.crouch }, { at: 4, p: Ps.spinWind },
                 { at: 10, p: Ps.spinA }, { at: 18, p: Ps.spinB },
                 { at: 26, p: Ps.spinA }, { at: 34, p: Ps.land },
                 { at: 47, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr === 3) { f.vy = 6.0; f.vx = f.facing * 3.0; f.grounded = false; }
          }
        }
      ],
      supers: [{
        id: 'superFlurry', name: 'INFINITE PAWS', motion: 'qcfx2',
        buttons: ['LK', 'MK', 'HK'], cost: 100,
        startup: 5, active: 46, recovery: 24, freeze: 24,
        damage: 26, stun: 4, chip: 5, multiHit: 12, hitGap: 4,
        hitstun: 12, blockstun: 9, knockdown: 'soft',
        invuln: [0, 8],
        hitbox: { x: 20, y: 26, w: 40, h: 30 },
        anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.lk },
               { at: 11, p: Ps.mk }, { at: 17, p: Ps.lk },
               { at: 23, p: Ps.mk }, { at: 29, p: Ps.lk },
               { at: 35, p: Ps.mk }, { at: 41, p: Ps.hk },
               { at: 51, p: Ps.hk }, { at: 75, p: Ps.stand }]
      }]
    },

    /* =====================================================================
       5 — the stretchy zoner. Enormous reach, teleport, terrible up close.
       ===================================================================== */
    {
      id: 'noodle',
      build: { s: 1.02, girth: 0.78, limb: 1.22, head: 0.92 },
      displayName: 'NOODLE',
      subtitle: 'The Long Cat',
      /* Drop a photo in assets/cats/ and name it here, e.g. 'gracie.jpg'. */
      photo: null,
      blurb: 'Limbs that reach halfway across the barn, plus a teleport.\nKeep them out. Panic if they get in.',
      difficulty: 3,
      palette: {
        fur: '#e8dcc8', fur2: '#cfc0a8', belly: '#f8f2e6', marks: '#5a4436',
        eye: '#4aa3d9', nose: '#c9737d', inner: '#d9a0a8',
        accent: '#7b5ea7', accessory: 'none', pattern: 'siamese',
        tailTip: '#5a4436', line: 'rgba(50,38,28,.5)'
      },
      stats: { walkF: 1.25, walkB: 1.15, jumpVy: 9.8, jumpVx: 2.6, gravity: 0.42,
               health: 950, stunMax: 96, weight: 0.9, hasDash: false },
      mod: { reach: 1.42, damage: 0.94, speed: 1.14 },
      specials: [
        {
          id: 'slowball', name: 'Drifting Fur Ball', kind: 'special',
          motion: 'qcf', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
          startup: 13, active: 3, recovery: 28, meterGain: 14,
          anim: [{ at: 0, p: Ps.stand }, { at: 8, p: Ps.fireWind },
                 { at: 13, p: Ps.fireRelease }, { at: 20, p: Ps.fireRelease },
                 { at: 44, p: Ps.stand }],
          spawn: function (f, strength) {
            return {
              kind: 'fireball', x: f.x + f.facing * 40, y: [30, 50, 70][strength],
              vx: f.facing * 1.9, w: 24, h: 24,
              damage: 26, chip: 6, hitstun: 20, blockstun: 13, stun: 6,
              pushback: 2.2, blockPushback: 2.6, life: 300,
              owner: f.side, facing: f.facing,
              color: '#c9a6e8', color2: '#f3e6ff', style: 'fluff'
            };
          }
        },
        {
          id: 'teleport', name: 'Nine Lives Step', kind: 'special',
          motion: 'dp', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
          startup: 4, active: 6, recovery: 12, noAttack: true,
          invuln: [2, 12], meterGain: 6,
          anim: [{ at: 0, p: Ps.stand }, { at: 3, p: Ps.teleport },
                 { at: 9, p: Ps.teleport }, { at: 22, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr === 5) {
              var dist = [70, 110, 150][strength];
              f.teleportTo = f.x + f.facing * dist;
              f.fx.push({ kind: 'poof', x: f.x, y: 40, t: 0 });
            }
          }
        },
        {
          id: 'teleportBack', name: 'Nine Lives Retreat', kind: 'special',
          motion: 'rdp', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
          startup: 4, active: 6, recovery: 12, noAttack: true,
          invuln: [2, 12], meterGain: 6,
          anim: [{ at: 0, p: Ps.stand }, { at: 3, p: Ps.teleport },
                 { at: 9, p: Ps.teleport }, { at: 22, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr === 5) {
              var dist = [70, 110, 150][strength];
              f.teleportTo = f.x - f.facing * dist;
              f.fx.push({ kind: 'poof', x: f.x, y: 40, t: 0 });
            }
          }
        },
        {
          id: 'drill', name: 'Corkscrew Cat', kind: 'special',
          motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
          startup: 8, active: 24, recovery: 22,
          damage: [20, 22, 24], stun: 6, chip: 4,
          hitstun: 14, blockstun: 10, multiHit: 4, hitGap: 7,
          pushback: 1.2, blockPushback: 2.4,
          hitbox: { x: 16, y: 24, w: 62, h: 34 },
          meterGain: 14,
          anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.spinWind },
                 { at: 12, p: Ps.stretchKick }, { at: 22, p: Ps.spinA },
                 { at: 32, p: Ps.stretchKick }, { at: 54, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr >= 8 && fr < 30) f.vx = f.facing * (2.6 + strength * 0.4);
          }
        }
      ],
      supers: [{
        id: 'superStretch', name: 'ENDLESS CAT', motion: 'qcfx2',
        buttons: ['LP', 'MP', 'HP'], cost: 100,
        startup: 8, active: 40, recovery: 30, freeze: 26,
        damage: 34, stun: 6, chip: 7, multiHit: 8, hitGap: 5,
        hitstun: 14, blockstun: 10, knockdown: 'soft',
        invuln: [0, 10],
        hitbox: { x: 18, y: 26, w: 108, h: 34 },
        anim: [{ at: 0, p: Ps.stand }, { at: 8, p: Ps.stretchPunch },
               { at: 18, p: Ps.stretchKick }, { at: 28, p: Ps.stretchPunch },
               { at: 38, p: Ps.stretchKick }, { at: 48, p: Ps.stretchPunch },
               { at: 78, p: Ps.stand }]
      }]
    },

    /* =====================================================================
       6 — the beast. Charge roll, static crackle, big jumps.
       ===================================================================== */
    {
      id: 'tiger',
      build: { s: 1.02, girth: 1.16, limb: 1.00, head: 1.02 },
      displayName: 'TIGER',
      subtitle: 'The Wild One',
      /* Drop a photo in assets/cats/ and name it here, e.g. 'gracie.jpg'. */
      photo: null,
      blurb: 'Mash punch for static, charge back for the rolling ball.\nAll offence, no manners.',
      difficulty: 2,
      palette: {
        fur: '#c98f4a', fur2: '#a9743a', belly: '#f6e6cd', marks: '#4a3520',
        eye: '#7ad13f', nose: '#c9737d', inner: '#e2949c',
        accent: '#2f7d4f', accessory: 'crown', pattern: 'tabby',
        tailTip: '#4a3520', line: 'rgba(40,28,14,.55)'
      },
      stats: { walkF: 1.50, walkB: 1.20, jumpVy: 10.4, jumpVx: 3.4, gravity: 0.48,
               health: 1080, stunMax: 115, weight: 1.18, hasDash: false },
      mod: { reach: 1.02, damage: 1.08, speed: 1.06 },
      specials: [
        {
          id: 'static', name: 'Static Crackle', kind: 'special',
          motion: 'mash', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
          startup: 6, active: 28, recovery: 22,
          damage: [16, 18, 20], stun: 6, chip: 4,
          hitstun: 12, blockstun: 9, multiHit: 5, hitGap: 6,
          pushback: 0.6, blockPushback: 1.6,
          hitbox: { x: -24, y: 10, w: 70, h: 78 },
          meterGain: 6, meterOnHit: 4, fx: 'spark',
          anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.dizzy1 },
                 { at: 12, p: Ps.dizzy2 }, { at: 20, p: Ps.dizzy1 },
                 { at: 28, p: Ps.dizzy2 }, { at: 34, p: Ps.dizzy1 },
                 { at: 56, p: Ps.stand }]
        },
        {
          id: 'roll', name: 'Rolling Ball', kind: 'special',
          charge: 'bf', chargeFrames: 40, buttons: ['LP', 'MP', 'HP'],
          stance: ['stand', 'crouch'],
          startup: 10, active: 26, recovery: 26,
          damage: [60, 70, 80], stun: 16, chip: 8,
          hitstun: 20, blockstun: 14, knockdown: 'soft',
          pushback: 3.4, blockPushback: 4.4,
          hitbox: { x: -14, y: 6, w: 50, h: 46 },
          lowProfile: [8, 34], meterGain: 18,
          anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.chargeWind },
                 { at: 11, p: Ps.spinA }, { at: 18, p: Ps.spinB },
                 { at: 25, p: Ps.spinA }, { at: 32, p: Ps.spinB },
                 { at: 40, p: Ps.land }, { at: 60, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr >= 8 && fr < 34) f.vx = f.facing * (5.4 + strength * 0.7);
          }
        },
        {
          id: 'upball', name: 'Vertical Pounce', kind: 'special',
          charge: 'du', chargeFrames: 40, buttons: ['LK', 'MK', 'HK'],
          stance: ['stand', 'crouch'],
          startup: 6, active: 22, recovery: 24,
          damage: [56, 64, 72], stun: 16, chip: 7,
          hitstun: 20, blockstun: 13, knockdown: 'soft',
          pushback: 2.0, blockPushback: 3.2,
          airborne: [5, 40], invuln: [0, 5],
          hitbox: { x: -14, y: 30, w: 50, h: 56 },
          meterGain: 16,
          anim: [{ at: 0, p: Ps.crouch }, { at: 4, p: Ps.dpWind },
                 { at: 10, p: Ps.spinA }, { at: 20, p: Ps.spinB },
                 { at: 30, p: Ps.spinA }, { at: 40, p: Ps.land },
                 { at: 52, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr === 4) { f.vy = 8.4 + strength * 0.5; f.vx = f.facing * 1.6; f.grounded = false; }
          }
        }
      ],
      supers: [{
        id: 'superRoll', name: 'THUNDER BEAST', motion: 'chargeSuper',
        charge: 'bf', chargeFrames: 55, buttons: ['LP', 'MP', 'HP'], cost: 100,
        startup: 8, active: 44, recovery: 30, freeze: 26,
        damage: 40, stun: 8, chip: 8, multiHit: 7, hitGap: 6,
        hitstun: 16, blockstun: 11, knockdown: 'hard',
        invuln: [0, 12],
        hitbox: { x: -20, y: 4, w: 60, h: 60 },
        anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.chargeWind },
               { at: 12, p: Ps.spinA }, { at: 22, p: Ps.spinB },
               { at: 32, p: Ps.spinA }, { at: 42, p: Ps.spinB },
               { at: 52, p: Ps.land }, { at: 82, p: Ps.stand }],
        moveSelf: function (f, fr) {
          if (fr >= 8 && fr < 50) f.vx = f.facing * 6.6;
        }
      }]
    }
  ];

  /* Build the full move table for each character once, at load. */
  ROSTER.forEach(function (c) {
    var normals = M.baseNormals(c.mod);
    var throws = M.throwMoves(c.mod);
    var sys = M.systemMoves();
    c.moves = {};
    var k;
    for (k in normals) { normals[k].id = k; c.moves[k] = normals[k]; }
    for (k in throws) { throws[k].id = k; c.moves[k] = throws[k]; }
    for (k in sys) { sys[k].id = k; c.moves[k] = sys[k]; }
    c.specials.forEach(function (s) { s.kind = 'special'; c.moves[s.id] = s; });
    c.supers.forEach(function (s) { s.kind = 'super'; c.moves[s.id] = s; });
  });

  CF.ROSTER = ROSTER;
  CF.byId = function (id) {
    for (var i = 0; i < ROSTER.length; i++) if (ROSTER[i].id === id) return ROSTER[i];
    return ROSTER[0];
  };
})();
