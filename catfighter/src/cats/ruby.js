/* =====================================================================
   6 — RUBY. Rubidoux. Short for nothing, she just is.

   HEAVY: hard to hurt and hard to move, with a bite that goes through
   whatever you were doing and a flip kick for anyone who jumps at her.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.ruby = {
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
  };
})();
