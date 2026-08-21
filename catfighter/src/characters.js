/* ==========================================================================
   Super Cat Fighter 6 — the roster

   ---------------------------------------------------------------------------
   NAMES AND LOOKS ARE PLACEHOLDERS. Change `displayName`, `subtitle` and the
   `palette` block below and the whole game updates — select screen, health
   bars, victory text, everything. Each cat also gets a character card of its
   own — see `card.js` — built from the same data.
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
      weightClass: 'medium',
        /* Upright, weight back, lead paw open and low. She does not chase
           anybody — she waits, and you come to her. */
      stance: { torso: -3, py: 1.5, armF: [-10, -20], armB: [-8, 2], head: [0, 0, -2] },
      build: { s: 1.02, girth: 1.06, limb: 0.99, head: 1.00, muscle: 0.9,
               headShape: 'round', ear: 'small', shoulder: 1.02, waist: 0.98, limbW: 1.02 },
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
    },

    /* =====================================================================
       2 — MARIO. Huge and fat, and it is the whole plan.

       HEAVY: hardest to hurt, hardest to shift, slowest to arrive. His two
       moves are both about closing that distance and then being enormous.
       ===================================================================== */
    {
      id: 'mario',
      weightClass: 'heavy',
        /* A wrestler's stance: as wide as he is, arms out to the sides,
           weight down. Nothing about him is quick and he knows it. */
      stance: { torso: -2, py: -2.5, armF: [30, -78], armB: [26, -84],
                legF: [12, -12], legB: [-12, 12] },
      build: { s: 1.12, girth: 1.62, limb: 0.88, head: 0.94, muscle: 0.45,
               headShape: 'broad', ear: 'wide', shoulder: 1.22, waist: 1.24, limbW: 1.22 },
      displayName: 'MARIO',
      subtitle: 'The Immovable',
      blurb: 'Enormous, and entirely aware of it. Getting to you takes a while. Being under him does not take long at all.',
      difficulty: 2,
      palette: {
        /* All of him, and a champion's belt that has to go round all of it. */
        kit: { belt: '#7a2230', beltPlate: '#f5d76e' },
        fur: '#4b4243', fur2: '#332c2e', belly: '#f6f2e8', marks: '#211b1d',
        eye: '#d9c04a', nose: '#e8a2ac', inner: '#c98d95',
        accent: '#7a4a3c', accessory: 'none', pattern: 'tuxedo',
        tailTip: '#4b4243', longhair: true, line: 'rgba(14,11,12,.6)'
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
    },

    /* =====================================================================
       3 — LUIGI. The other twin, and none of the weight.

       LIGHT: quick, mobile, and folds if he gets caught. Comes at you from
       above with the flying body attack and from below with the sweep.
       ===================================================================== */
    {
      id: 'luigi',
      weightClass: 'light',
        /* Up on his toes, leaning in, guard high and narrow. The twin who
           moves. */
      stance: { torso: 5, py: 1, armF: [12, 0], armB: [6, 6],
                legF: [-6, 6], legB: [6, -6], head: [0, 0, 2] },
      build: { s: 1.02, girth: 0.88, limb: 1.16, head: 0.94, muscle: 1.15,
               headShape: 'long', ear: 'tall', shoulder: 0.90, waist: 0.84, limbW: 0.84 },
      displayName: 'LUIGI',
      subtitle: 'The Twin',
      blurb: 'Same coat, half the cat. Comes in over the top or takes your legs — and you have to guess which.',
      difficulty: 2,
      palette: {
        /* The lean twin. A scarf that streams behind him, which is most of
           what tells the two of them apart in a hurry. */
        kit: { scarf: '#3f7f5f' },
        fur: '#433b3d', fur2: '#2c2628', belly: '#f8f5ee', marks: '#1b1719',
        eye: '#cdd94a', nose: '#e8a2ac', inner: '#c98d95',
        accent: '#4a7a4c', accessory: 'none', pattern: 'tuxedo',
        tailTip: '#433b3d', longhair: true,
        /* the white sleeve on his front leg — the one way to tell them apart */
        sock: true, sockColor: '#f8f5ee',
        line: 'rgba(12,10,11,.6)'
      },
      stats: { walkF: 1.86, walkB: 1.62, jumpVy: 10.2, jumpVx: 3.7, gravity: 0.46,
               health: 600, stunMax: 92, weight: 0.88, hasDash: true },
      mod: { reach: 1.00, damage: 0.90, speed: 0.86 },
      specials: [
        {
          id: 'flyingbody', name: 'Flying Body Attack',
          desc: 'He leaves the floor and arrives shoulder first. An overhead, so crouch-blocking does not stop it.', kind: 'special',
          motion: 'qcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
          startup: 9, active: 16, recovery: 20,
          damage: [56, 64, 72], stun: [14, 16, 18], chip: 7,
          hitstun: 20, blockstun: 13, knockdown: 'soft',
          /* he is in the air, so it has to be blocked standing */
          hitLevel: 'overhead',
          pushback: 3.0, blockPushback: 3.6,
          airborne: [7, 30],
          hitbox: { x: 8, y: 22, w: 50, h: 40 },
          meterGain: 16, meterOnHit: 8,
          anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.flyWind },
                 { at: 10, p: Ps.flyBody }, { at: 24, p: Ps.flyBody },
                 { at: 30, p: Ps.flyLand }, { at: 45, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr === 7) {
              f.vy = 5.6 + strength * 0.5;
              f.vx = f.facing * (5.2 + strength * 0.7);
              f.grounded = false;
            }
          }
        },
        {
          id: 'legsweep', name: 'Leg Sweep',
          desc: 'Low, fast, and a hard knockdown. Eight frames of startup — the quickest thing he has for interrupting.', kind: 'special',
          motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
          startup: 8, active: 6, recovery: 22,
          damage: [30, 34, 38], stun: [9, 10, 12], chip: 5,
          hitstun: 18, blockstun: 12, hitLevel: 'low', knockdown: 'hard',
          pushback: 2.6, blockPushback: 3.0,
          lowProfile: [6, 16],
          hitbox: { x: 12, y: 0, w: 52, h: 18 },
          meterGain: 15, meterOnHit: 8,
          anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.sweepWindL },
                 { at: 8, p: Ps.sweepLow }, { at: 14, p: Ps.sweepLow },
                 { at: 20, p: Ps.sweepWindL }, { at: 36, p: Ps.stand }],
          moveSelf: function (f, fr, strength) {
            if (fr >= 6 && fr < 14) f.vx = f.facing * (2.6 + strength * 0.4);
          }
        }
      ],
      supers: [{
        id: 'superFly', name: 'OVER THE TOP',
        desc: 'Thirty active frames of him in the air, overhead the whole way, invincible for the first ten.', motion: 'qcfx2',
        buttons: ['LK', 'MK', 'HK'], cost: 100,
        startup: 8, active: 30, recovery: 26, freeze: 26,
        damage: 34, stun: 7, chip: 7, multiHit: 5, hitGap: 6,
        hitstun: 18, blockstun: 12, hitLevel: 'overhead', knockdown: 'hard',
        pushback: 2.0, blockPushback: 3.0,
        invuln: [0, 10], airborne: [6, 40],
        hitbox: { x: 6, y: 20, w: 56, h: 46 },
        anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.flyWind },
               { at: 10, p: Ps.flyBody }, { at: 22, p: Ps.jumpKick },
               { at: 32, p: Ps.flyBody }, { at: 44, p: Ps.flyLand },
               { at: 64, p: Ps.stand }],
        moveSelf: function (f, fr) {
          if (fr === 6) { f.vy = 6.4; f.vx = f.facing * 5.4; f.grounded = false; }
          if (fr > 6 && fr < 34) f.vy += 0.20;
        }
      }]
    },

    /* =====================================================================
       4 — LILLY. Siamese, and built entirely out of angles.

       LIGHT: the fastest cat on the roster and the easiest to hurt. Both her
       moves leave the ground, which is where she wants to be.
       ===================================================================== */
    {
      id: 'lilly',
      weightClass: 'light',
        /* Poised on the back leg with the front one light, lead paw high
           and open. Everything about her is ready to leave the ground. */
      stance: { torso: 2, py: 2, armF: [22, -34], armB: [-4, 12],
                legF: [-12, -6], legB: [-8, 20] },
      build: { s: 0.96, girth: 0.82, limb: 1.20, head: 0.94, muscle: 1.25,
               headShape: 'narrow', ear: 'tall', shoulder: 0.88, waist: 0.76, limbW: 0.80 },
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
        accent: '#8fb6d9', accessory: 'collar', pattern: 'siamese',
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
    },

    /* =====================================================================
       5 — FIGURO. Lilly's brother, and the strong one.

       MEDIUM: rears up on his back legs and throws hands, then leaves. The
       retreat is the point — he is the only cat who can simply not be there.
       ===================================================================== */
    {
      id: 'figuro',
      weightClass: 'medium',
        /* Peek-a-boo: both gloves up by the cheeks, elbows tucked in, chin
           down behind them. He is a boxer before he is a cat. */
      stance: { torso: 4, py: -1, armF: [-30, 52], armB: [-8, 32],
                head: [1, -1.5, 5] },
      build: { s: 1.00, girth: 1.12, limb: 0.98, head: 1.00, muscle: 1.45,
               headShape: 'blocky', ear: 'small', shoulder: 1.26, waist: 0.82, limbW: 1.14 },
      displayName: 'FIGURO',
      subtitle: 'The Boxer',
      blurb: 'Stands up on his back legs and throws hands until you stop enjoying it, then he is somewhere else entirely.',
      difficulty: 2,
      palette: {
        /* The boxer. Gloves the size of his head, and a belt he wears in
           the ring and out of it. */
        kit: { gloves: '#b83a3a', belt: '#2b2f4a', beltPlate: '#d9d2c4' },
        fur: '#b28e5e', fur2: '#957246', belly: '#f0e2c8', marks: '#5a4128',
        eye: '#8fc24a', nose: '#d99aa0', inner: '#e2a8a0',
        accent: '#8a6a3c', accessory: 'none', pattern: 'tabby',
        tailTip: '#5a4128', line: 'rgba(48,34,20,.55)'
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
    },

    /* =====================================================================
       6 — RUBY. Rubidoux. Short for nothing, she just is.

       HEAVY: hard to hurt and hard to move, with a bite that goes through
       whatever you were doing and a flip kick for anyone who jumps at her.
       ===================================================================== */
    {
      id: 'ruby',
      weightClass: 'heavy',
        /* Hunched forward over her shoulders with her head low, which is
           where a jaw like that wants to be. */
      stance: { torso: 12, py: -2, head: [1, -2, 9], armF: [6, -14],
                armB: [4, -8], legF: [6, -8], legB: [-4, 8] },
      build: { s: 1.06, girth: 1.34, limb: 0.94, head: 0.98, muscle: 1.10,
               headShape: 'blocky', ear: 'torn', shoulder: 1.18, waist: 1.06, limbW: 1.16 },
      displayName: 'RUBY',
      subtitle: 'The Jaw',
      blurb: 'Rubidoux when she is in trouble. Hold down and wait, and anything that jumps at her gets flipped out of the sky.',
      difficulty: 3,
      palette: {
        /* The jaw. A studded collar, a torn ear and the marks of every
           argument she has ever won. */
        kit: { scars: 3 },
        fur: '#a55c34', fur2: '#82452a', belly: '#e8c9a4', marks: '#5d2f1c',
        eye: '#e0b23a', nose: '#c4736a', inner: '#d99a90',
        accent: '#6b2f22', accessory: 'collar', pattern: 'tabby',
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
