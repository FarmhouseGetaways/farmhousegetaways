/* =====================================================================
   4 — LILLY. Siamese, and built entirely out of angles.

   LIGHT: the fastest cat on the roster and the easiest to hurt. Both her
   moves leave the ground, which is where she wants to be.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.lilly = {
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
  };
})();
