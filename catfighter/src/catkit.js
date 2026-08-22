/* ==========================================================================
   Super Cat Fighter 6 — shared character kit

   The helpers every cat is built from. Each cat lives in its own file under
   `src/cats/`, registers itself on `CF.CatDefs`, and `characters.js` then
   assembles the roster in a fixed order. Splitting them up is what lets six
   artists work on six cats at once without touching the same file.
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

  CF.CatDefs = {};
  CF.CatKit = {
    fireballSpecial: fireballSpecial,
    uppercutSpecial: uppercutSpecial,
    spinKickSpecial: spinKickSpecial
  };
})();
