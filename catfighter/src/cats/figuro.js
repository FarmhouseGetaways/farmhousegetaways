/* =====================================================================
   5 — FIGURO. Lilly's brother, and the strong one.

   MEDIUM: rears up on his back legs and throws hands, then leaves. The
   retreat is the point — he is the only cat who can simply not be there.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.figuro = {
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
  };
})();
