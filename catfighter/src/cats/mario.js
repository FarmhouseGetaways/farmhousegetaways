/* =====================================================================
   2 — MARIO. Huge and fat, and it is the whole plan.

   HEAVY: hardest to hurt, hardest to shift, slowest to arrive. His two
   moves are both about closing that distance and then being enormous.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.mario = {
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
  };
})();
