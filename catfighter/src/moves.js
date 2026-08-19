/* ==========================================================================
   Cat Fighter II — move data

   Frame data is in 60ths of a second and is the single source of truth:
   startup / active / recovery. Hitboxes are authored facing RIGHT with the
   origin between the feet, Y up. Everything is mirrored at collision time.

   Damage sits on a 1000-point life bar, so a light jab (14) is about 70 jabs
   to a round and a heavy (34) about 30 — close to Street Fighter II's feel.
   ========================================================================== */
(function () {
  var Ps = CF.Pose;

  function anim(list) { return list; }

  /* ---- The twelve standard normals + three air normals -------------------
     `m` is the character's move modifier block: reach, damage and speed
     multipliers, so a heavy cat's roundhouse genuinely out-ranges a quick
     one's without either needing its own move table.                       */
  function baseNormals(m) {
    m = m || {};
    var R = m.reach || 1;        // hitbox reach multiplier
    var D = m.damage || 1;       // damage multiplier
    var S = m.speed || 1;        // startup multiplier (lower = faster)
    function f(v) { return Math.max(1, Math.round(v * S)); }
    function d(v) { return Math.round(v * D); }
    function bx(o) {
      return { x: o.x * R, y: o.y, w: o.w * R, h: o.h };
    }

    return {
      /* ---------------- standing punches ---------------- */
      stLP: {
        name: 'Paw Jab', kind: 'normal', stance: 'stand', btn: 'LP',
        startup: f(3), active: 2, recovery: 6,
        damage: d(14), stun: 4, hitstun: 12, blockstun: 9, chip: 0,
        hitLevel: 'mid', pushback: 1.6, blockPushback: 2.0,
        meterGain: 5, cancel: ['special', 'super'], chain: ['stLP', 'stMP', 'crLP'],
        hitbox: bx({ x: 28, y: 60, w: 24, h: 14 }), sfx: 'light',
        anim: anim([{ at: 0, p: Ps.stand }, { at: f(3) - 1, p: Ps.jabWind },
                    { at: f(3), p: Ps.jab }, { at: f(3) + 2, p: Ps.jab },
                    { at: f(3) + 8, p: Ps.stand }])
      },
      stMP: {
        name: 'Straight Paw', kind: 'normal', stance: 'stand', btn: 'MP',
        startup: f(5), active: 3, recovery: 11,
        damage: d(24), stun: 7, hitstun: 15, blockstun: 11, chip: 0,
        hitLevel: 'mid', pushback: 2.4, blockPushback: 2.8,
        meterGain: 8, cancel: ['special', 'super'],
        hitbox: bx({ x: 28, y: 58, w: 31, h: 16 }), sfx: 'med',
        anim: anim([{ at: 0, p: Ps.stand }, { at: f(5) - 2, p: Ps.strongWind },
                    { at: f(5), p: Ps.strong }, { at: f(5) + 3, p: Ps.strong },
                    { at: f(5) + 14, p: Ps.stand }])
      },
      stHP: {
        name: 'Heavy Swipe', kind: 'normal', stance: 'stand', btn: 'HP',
        startup: f(8), active: 4, recovery: 17,
        damage: d(34), stun: 12, hitstun: 19, blockstun: 13, chip: 0,
        hitLevel: 'mid', pushback: 3.4, blockPushback: 3.6,
        meterGain: 11, cancel: ['super'],
        hitbox: bx({ x: 28, y: 56, w: 37, h: 19 }), sfx: 'heavy',
        anim: anim([{ at: 0, p: Ps.stand }, { at: f(8) - 3, p: Ps.fierceWind },
                    { at: f(8), p: Ps.fierce }, { at: f(8) + 4, p: Ps.fierce },
                    { at: f(8) + 21, p: Ps.stand }])
      },

      /* ---------------- standing kicks ---------------- */
      stLK: {
        name: 'Quick Kick', kind: 'normal', stance: 'stand', btn: 'LK',
        startup: f(4), active: 3, recovery: 7,
        damage: d(15), stun: 4, hitstun: 12, blockstun: 9, chip: 0,
        hitLevel: 'mid', pushback: 1.8, blockPushback: 2.2,
        meterGain: 5, cancel: ['special', 'super'],
        hitbox: bx({ x: 26, y: 34, w: 27, h: 15 }), sfx: 'light',
        anim: anim([{ at: 0, p: Ps.stand }, { at: f(4) - 1, p: Ps.lkWind },
                    { at: f(4), p: Ps.lk }, { at: f(4) + 3, p: Ps.lk },
                    { at: f(4) + 10, p: Ps.stand }])
      },
      stMK: {
        name: 'Side Kick', kind: 'normal', stance: 'stand', btn: 'MK',
        startup: f(7), active: 3, recovery: 12,
        damage: d(26), stun: 8, hitstun: 16, blockstun: 11, chip: 0,
        hitLevel: 'mid', pushback: 2.8, blockPushback: 3.0,
        meterGain: 8, cancel: ['special', 'super'],
        hitbox: bx({ x: 28, y: 40, w: 34, h: 17 }), sfx: 'med',
        anim: anim([{ at: 0, p: Ps.stand }, { at: f(7) - 2, p: Ps.mkWind },
                    { at: f(7), p: Ps.mk }, { at: f(7) + 3, p: Ps.mk },
                    { at: f(7) + 15, p: Ps.stand }])
      },
      stHK: {
        name: 'Roundhouse', kind: 'normal', stance: 'stand', btn: 'HK',
        startup: f(10), active: 4, recovery: 19,
        damage: d(36), stun: 14, hitstun: 20, blockstun: 14, chip: 0,
        hitLevel: 'mid', pushback: 4.0, blockPushback: 3.8, knockdown: 'soft',
        meterGain: 12, cancel: ['super'],
        hitbox: bx({ x: 28, y: 48, w: 40, h: 20 }), sfx: 'heavy',
        anim: anim([{ at: 0, p: Ps.stand }, { at: f(10) - 4, p: Ps.hkWind },
                    { at: f(10), p: Ps.hk }, { at: f(10) + 4, p: Ps.hk },
                    { at: f(10) + 23, p: Ps.stand }])
      },

      /* ---------------- crouching ---------------- */
      crLP: {
        name: 'Low Jab', kind: 'normal', stance: 'crouch', btn: 'LP',
        startup: f(3), active: 2, recovery: 6,
        damage: d(12), stun: 3, hitstun: 12, blockstun: 9, chip: 0,
        hitLevel: 'mid', pushback: 1.4, blockPushback: 1.8,
        meterGain: 4, cancel: ['special', 'super'], chain: ['crLP', 'crLK', 'stLP'],
        hitbox: bx({ x: 24, y: 32, w: 25, h: 13 }), sfx: 'light',
        anim: anim([{ at: 0, p: Ps.crouch }, { at: f(3), p: Ps.lowJab },
                    { at: f(3) + 2, p: Ps.lowJab }, { at: f(3) + 8, p: Ps.crouch }])
      },
      crMP: {
        name: 'Low Straight', kind: 'normal', stance: 'crouch', btn: 'MP',
        startup: f(5), active: 3, recovery: 11,
        damage: d(22), stun: 7, hitstun: 15, blockstun: 11, chip: 0,
        hitLevel: 'mid', pushback: 2.2, blockPushback: 2.6,
        meterGain: 7, cancel: ['special', 'super'],
        hitbox: bx({ x: 24, y: 34, w: 30, h: 17 }), sfx: 'med',
        anim: anim([{ at: 0, p: Ps.crouch }, { at: f(5) - 2, p: Ps.crouchDeep },
                    { at: f(5), p: Ps.lowStrong }, { at: f(5) + 3, p: Ps.lowStrong },
                    { at: f(5) + 14, p: Ps.crouch }])
      },
      crHP: {
        name: 'Rising Claw', kind: 'normal', stance: 'crouch', btn: 'HP',
        startup: f(7), active: 4, recovery: 17,
        damage: d(32), stun: 12, hitstun: 18, blockstun: 13, chip: 0,
        hitLevel: 'mid', pushback: 2.6, blockPushback: 3.0, knockdown: 'soft',
        antiAir: true, meterGain: 11, cancel: ['super'],
        hitbox: bx({ x: 18, y: 48, w: 28, h: 40 }), sfx: 'heavy',
        anim: anim([{ at: 0, p: Ps.crouch }, { at: f(7) - 3, p: Ps.crouchDeep },
                    { at: f(7), p: Ps.lowFierce }, { at: f(7) + 4, p: Ps.lowFierce },
                    { at: f(7) + 21, p: Ps.crouch }])
      },
      crLK: {
        name: 'Toe Poke', kind: 'normal', stance: 'crouch', btn: 'LK',
        startup: f(4), active: 2, recovery: 6,
        damage: d(12), stun: 3, hitstun: 12, blockstun: 9, chip: 0,
        hitLevel: 'low', pushback: 1.4, blockPushback: 1.8,
        meterGain: 4, cancel: ['special', 'super'], chain: ['crLP', 'crLK'],
        hitbox: bx({ x: 22, y: 6, w: 26, h: 13 }), sfx: 'light',
        anim: anim([{ at: 0, p: Ps.crouch }, { at: f(4), p: Ps.lowKick },
                    { at: f(4) + 2, p: Ps.lowKick }, { at: f(4) + 8, p: Ps.crouch }])
      },
      crMK: {
        name: 'Low Kick', kind: 'normal', stance: 'crouch', btn: 'MK',
        startup: f(6), active: 3, recovery: 11,
        damage: d(22), stun: 7, hitstun: 15, blockstun: 11, chip: 0,
        hitLevel: 'low', pushback: 2.2, blockPushback: 2.6,
        meterGain: 7, cancel: ['special', 'super'],
        hitbox: bx({ x: 24, y: 8, w: 34, h: 15 }), sfx: 'med',
        anim: anim([{ at: 0, p: Ps.crouch }, { at: f(6) - 2, p: Ps.crouchDeep },
                    { at: f(6), p: Ps.lowKick }, { at: f(6) + 3, p: Ps.lowKick },
                    { at: f(6) + 14, p: Ps.crouch }])
      },
      crHK: {
        name: 'Tail Sweep', kind: 'normal', stance: 'crouch', btn: 'HK',
        startup: f(8), active: 4, recovery: 20,
        damage: d(30), stun: 10, hitstun: 18, blockstun: 13, chip: 0,
        hitLevel: 'low', pushback: 3.0, blockPushback: 3.2, knockdown: 'hard',
        meterGain: 11, cancel: [],
        hitbox: bx({ x: 20, y: 2, w: 42, h: 13 }), sfx: 'heavy',
        anim: anim([{ at: 0, p: Ps.crouch }, { at: f(8) - 3, p: Ps.sweepWind },
                    { at: f(8), p: Ps.sweep }, { at: f(8) + 4, p: Ps.sweep },
                    { at: f(8) + 24, p: Ps.crouch }])
      },

      /* ---------------- air ---------------- */
      airLP: {
        name: 'Air Jab', kind: 'normal', stance: 'air', btn: 'LP',
        startup: f(4), active: 8, recovery: 4,
        damage: d(16), stun: 5, hitstun: 14, blockstun: 10, chip: 0,
        hitLevel: 'overhead', pushback: 1.4, blockPushback: 1.6,
        meterGain: 6, cancel: [],
        hitbox: bx({ x: 20, y: 40, w: 28, h: 20 }), sfx: 'light',
        anim: anim([{ at: 0, p: Ps.jumpFall }, { at: f(4), p: Ps.jumpPunch },
                    { at: f(4) + 12, p: Ps.jumpPunch }])
      },
      airMP: {
        name: 'Air Swipe', kind: 'normal', stance: 'air', btn: 'MP',
        startup: f(5), active: 10, recovery: 4,
        damage: d(26), stun: 8, hitstun: 16, blockstun: 11, chip: 0,
        hitLevel: 'overhead', pushback: 2.2, blockPushback: 2.4,
        meterGain: 8, cancel: [],
        hitbox: bx({ x: 20, y: 38, w: 32, h: 24 }), sfx: 'med',
        anim: anim([{ at: 0, p: Ps.jumpFall }, { at: f(5), p: Ps.jumpPunch },
                    { at: f(5) + 14, p: Ps.jumpPunch }])
      },
      airHP: {
        name: 'Dive Paw', kind: 'normal', stance: 'air', btn: 'HP',
        startup: f(6), active: 12, recovery: 4,
        damage: d(34), stun: 12, hitstun: 19, blockstun: 13, chip: 0,
        hitLevel: 'overhead', pushback: 2.8, blockPushback: 3.0,
        meterGain: 11, cancel: [],
        hitbox: bx({ x: 18, y: 34, w: 34, h: 28 }), sfx: 'heavy',
        anim: anim([{ at: 0, p: Ps.jumpFall }, { at: f(6), p: Ps.jumpHeavy },
                    { at: f(6) + 16, p: Ps.jumpHeavy }])
      },
      airLK: {
        name: 'Air Kick', kind: 'normal', stance: 'air', btn: 'LK',
        startup: f(4), active: 9, recovery: 4,
        damage: d(16), stun: 5, hitstun: 14, blockstun: 10, chip: 0,
        hitLevel: 'overhead', pushback: 1.6, blockPushback: 1.8,
        meterGain: 6, cancel: [],
        hitbox: bx({ x: 20, y: 22, w: 30, h: 22 }), sfx: 'light',
        anim: anim([{ at: 0, p: Ps.jumpFall }, { at: f(4), p: Ps.jumpKick },
                    { at: f(4) + 13, p: Ps.jumpKick }])
      },
      airMK: {
        name: 'Air Side Kick', kind: 'normal', stance: 'air', btn: 'MK',
        startup: f(5), active: 11, recovery: 4,
        damage: d(26), stun: 8, hitstun: 16, blockstun: 11, chip: 0,
        hitLevel: 'overhead', pushback: 2.4, blockPushback: 2.6,
        meterGain: 8, cancel: [],
        hitbox: bx({ x: 20, y: 20, w: 34, h: 24 }), sfx: 'med',
        anim: anim([{ at: 0, p: Ps.jumpFall }, { at: f(5), p: Ps.jumpKick },
                    { at: f(5) + 15, p: Ps.jumpKick }])
      },
      airHK: {
        name: 'Jump Roundhouse', kind: 'normal', stance: 'air', btn: 'HK',
        startup: f(6), active: 13, recovery: 4,
        damage: d(34), stun: 12, hitstun: 19, blockstun: 13, chip: 0,
        hitLevel: 'overhead', pushback: 3.0, blockPushback: 3.2,
        meterGain: 11, cancel: [],
        hitbox: bx({ x: 18, y: 18, w: 38, h: 28 }), sfx: 'heavy',
        anim: anim([{ at: 0, p: Ps.jumpFall }, { at: f(6), p: Ps.jumpHeavy },
                    { at: f(6) + 17, p: Ps.jumpHeavy }])
      }
    };
  }

  /* ---- Throws ------------------------------------------------------------ */
  function throwMoves(m) {
    var D = (m && m.damage) || 1;
    return {
      thrForward: {
        name: 'Scruff Toss', kind: 'throw', stance: 'stand', btn: 'HP',
        startup: 3, active: 3, recovery: 22,
        damage: Math.round(90 * D), stun: 16, range: 44,
        knockdown: 'hard', throwDir: 1, meterGain: 14, whiffRecovery: 18,
        anim: [{ at: 0, p: CF.Pose.stand }, { at: 3, p: CF.Pose.throwReach },
               { at: 8, p: CF.Pose.throwHold }, { at: 28, p: CF.Pose.stand }]
      },
      thrBack: {
        name: 'Reverse Toss', kind: 'throw', stance: 'stand', btn: 'HK',
        startup: 3, active: 3, recovery: 22,
        damage: Math.round(85 * D), stun: 16, range: 44,
        knockdown: 'hard', throwDir: -1, meterGain: 14, whiffRecovery: 18,
        anim: [{ at: 0, p: CF.Pose.stand }, { at: 3, p: CF.Pose.throwReach },
               { at: 8, p: CF.Pose.throwHold }, { at: 28, p: CF.Pose.stand }]
      }
    };
  }

  /* ---- Universal system moves ------------------------------------------- */
  function systemMoves() {
    return {
      dashF: {
        name: 'Dash', kind: 'system', stance: 'stand',
        startup: 2, active: 12, recovery: 6, noAttack: true,
        anim: [{ at: 0, p: CF.Pose.stand }, { at: 3, p: CF.Pose.walkF1 },
               { at: 10, p: CF.Pose.walkF3 }, { at: 20, p: CF.Pose.stand }],
        moveSelf: function (f, fr) {
          if (fr < 12) f.vx = f.facing * 6.2 * (1 - fr / 20);
          else f.vx *= 0.8;
        }
      },
      dashB: {
        name: 'Back Hop', kind: 'system', stance: 'stand',
        startup: 2, active: 12, recovery: 8, noAttack: true,
        invuln: [0, 7],
        anim: [{ at: 0, p: CF.Pose.stand }, { at: 3, p: CF.Pose.jumpRise },
               { at: 12, p: CF.Pose.jumpFall }, { at: 22, p: CF.Pose.stand }],
        moveSelf: function (f, fr) {
          if (fr === 0) { f.vx = -f.facing * 5.4; f.vy = 3.2; }
          if (fr < 14) { f.airborneDash = true; }
          else f.airborneDash = false;
        }
      },
      /* ---- the two trigger moves ----------------------------------------
         Dodge gets you out of something, lunge gets you into something. Both
         are pure movement — neither hits, which is what keeps them honest. */
      dodge: {
        name: 'Dodge', kind: 'system', stance: 'stand',
        startup: 2, active: 12, recovery: 10, noAttack: true,
        invuln: [1, 13],
        anim: [{ at: 0, p: CF.Pose.stand }, { at: 3, p: CF.Pose.retreatWind },
               { at: 8, p: CF.Pose.retreatAir }, { at: 16, p: CF.Pose.land },
               { at: 24, p: CF.Pose.stand }],
        moveSelf: function (f, fr) {
          if (fr === 1) { f.vx = -f.facing * 6.4; f.vy = 2.6; f.grounded = false; }
          if (fr > 1 && fr < 14) f.airborneDash = true; else f.airborneDash = false;
        }
      },
      lunge: {
        name: 'Lunge', kind: 'system', stance: 'stand',
        startup: 2, active: 14, recovery: 8, noAttack: true,
        anim: [{ at: 0, p: CF.Pose.stand }, { at: 3, p: CF.Pose.walkF1 },
               { at: 9, p: CF.Pose.walkF3 }, { at: 15, p: CF.Pose.walkF1 },
               { at: 24, p: CF.Pose.stand }],
        moveSelf: function (f, fr) {
          if (fr < 15) f.vx = f.facing * 7.0 * (1 - fr / 26);
          else f.vx *= 0.78;
        }
      },

      taunt: {
        name: 'Taunt', kind: 'system', stance: 'stand',
        startup: 8, active: 20, recovery: 20, noAttack: true,
        anim: [{ at: 0, p: CF.Pose.stand }, { at: 10, p: CF.Pose.tauntPose },
               { at: 34, p: CF.Pose.tauntPose }, { at: 48, p: CF.Pose.stand }]
      }
    };
  }

  CF.Moves = {
    baseNormals: baseNormals,
    throwMoves: throwMoves,
    systemMoves: systemMoves
  };
})();
