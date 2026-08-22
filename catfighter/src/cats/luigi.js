/* =====================================================================
   3 — LUIGI. The other twin, and none of the weight.

   LIGHT: quick, mobile, and folds if he gets caught. Comes at you from
   above with the flying body attack and from below with the sweep.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.luigi = {
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
  };
})();
