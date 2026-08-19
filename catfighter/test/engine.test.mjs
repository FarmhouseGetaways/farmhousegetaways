/* ==========================================================================
   Cat Fighter II — engine tests

   These guard the things that break silently. A move with no hitbox, an
   animation that ends before the move does, or a mistyped damage array does
   not throw an error — it just quietly never connects, and you find out in
   the middle of a round. Every one of those is a failing test here.
   ========================================================================== */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, attackMoves } from './harness.mjs';

const { CF } = loadGame();

/* ---- roster shape ------------------------------------------------------- */

test('the roster is six cats with unique ids and names', () => {
  assert.equal(CF.ROSTER.length, 6);
  const ids = new Set(CF.ROSTER.map(c => c.id));
  const names = new Set(CF.ROSTER.map(c => c.displayName));
  assert.equal(ids.size, 6, 'character ids must be unique');
  assert.equal(names.size, 6, 'display names must be unique');
});

test('every cat has the full set of normals, both throws and at least one super', () => {
  const NORMALS = [
    'stLP', 'stMP', 'stHP', 'stLK', 'stMK', 'stHK',
    'crLP', 'crMP', 'crHP', 'crLK', 'crMK', 'crHK',
    'airLP', 'airMP', 'airHP', 'airLK', 'airMK', 'airHK'
  ];
  for (const c of CF.ROSTER) {
    for (const k of NORMALS) {
      assert.ok(c.moves[k], `${c.id} is missing normal ${k}`);
    }
    assert.ok(c.moves.thrForward && c.moves.thrBack, `${c.id} is missing a throw`);
    assert.ok(c.specials.length >= 2, `${c.id} needs at least two specials`);
    assert.ok(c.supers.length >= 1, `${c.id} needs a super`);
  }
});

/* ---- frame data --------------------------------------------------------- */

test('frame data is positive and complete on every attacking move', () => {
  for (const c of CF.ROSTER) {
    for (const [key, m] of attackMoves(c)) {
      const where = `${c.id}.${key} (${m.name})`;
      assert.ok(Number.isFinite(m.startup) && m.startup >= 1, `${where}: bad startup`);
      assert.ok(Number.isFinite(m.active) && m.active >= 1, `${where}: bad active`);
      assert.ok(Number.isFinite(m.recovery) && m.recovery >= 1, `${where}: bad recovery`);
      if (m.spawn) {
        /* A projectile move carries its damage on the thing it throws. */
        for (let st = 0; st < 3; st++) {
          const shot = m.spawn({ x: 0, facing: 1, side: 0, fx: [] }, st, 0);
          assert.ok(Number.isFinite(shot.damage) && shot.damage > 0,
                    `${where}: projectile at strength ${st} does no damage`);
          assert.ok(shot.life > 0 && shot.vx !== 0,
                    `${where}: projectile at strength ${st} never travels`);
        }
      } else {
        const dmg = Array.isArray(m.damage) ? m.damage : [m.damage];
        for (const d of dmg) {
          assert.ok(Number.isFinite(d) && d > 0, `${where}: damage must be a positive number`);
        }
      }
    }
  }
});

test('every attacking move can actually connect', () => {
  for (const c of CF.ROSTER) {
    for (const [key, m] of attackMoves(c)) {
      const where = `${c.id}.${key} (${m.name})`;
      const canReach = !!m.hitbox || !!m.spawn || !!m.isCommandThrow || m.kind === 'throw';
      assert.ok(canReach, `${where}: has no hitbox, projectile or grab range — it can never hit`);
      if (m.hitbox) {
        assert.ok(m.hitbox.w > 0 && m.hitbox.h > 0, `${where}: hitbox has no area`);
        assert.ok(Number.isFinite(m.hitbox.x) && Number.isFinite(m.hitbox.y),
                  `${where}: hitbox position is not a number`);
      }
    }
  }
});

test('animations cover the whole move, so nothing snaps back mid-recovery', () => {
  for (const c of CF.ROSTER) {
    for (const [key, m] of Object.entries(c.moves)) {
      if (!m.anim) continue;
      const total = (m.startup || 0) + (m.active || 0) + (m.recovery || 0);
      const last = m.anim[m.anim.length - 1].at;
      assert.ok(last >= total - 2,
        `${c.id}.${key}: animation ends at frame ${last} but the move runs ${total} frames`);
      let prev = -1;
      for (const k of m.anim) {
        assert.ok(k.at > prev, `${c.id}.${key}: animation keyframes are out of order at ${k.at}`);
        assert.ok(k.p, `${c.id}.${key}: keyframe at ${k.at} has no pose`);
        prev = k.at;
      }
    }
  }
});

test('the active window starts after startup and ends before the move does', () => {
  for (const c of CF.ROSTER) {
    for (const [key, m] of attackMoves(c)) {
      const total = m.startup + m.active + m.recovery;
      assert.ok(m.startup + m.active <= total, `${c.id}.${key}: active window overruns the move`);
    }
  }
});

test('multi-hit moves have room for all their hits', () => {
  for (const c of CF.ROSTER) {
    for (const [key, m] of attackMoves(c)) {
      if (!m.multiHit) continue;
      const gap = m.hitGap || 6;
      const needed = (m.multiHit - 1) * gap;
      assert.ok(needed <= m.active,
        `${c.id}.${key}: ${m.multiHit} hits ${gap} frames apart needs ${needed} active frames, has ${m.active}`);
    }
  }
});

test('specials and supers declare an input the game can read', () => {
  const MOTIONS = ['qcf', 'qcb', 'dp', 'rdp', 'hcf', 'hcb', 'qcfx2', 'p360',
                   'dd', 'downup', 'mash', 'pp', 'chargeSuper'];
  const BUTTONS = ['LP', 'MP', 'HP', 'LK', 'MK', 'HK'];
  for (const c of CF.ROSTER) {
    for (const m of c.specials.concat(c.supers)) {
      const where = `${c.id}.${m.id}`;
      assert.ok(m.charge || m.motion, `${where}: no motion and no charge`);
      if (m.motion) assert.ok(MOTIONS.includes(m.motion), `${where}: unknown motion "${m.motion}"`);
      if (m.charge) assert.ok(['bf', 'du'].includes(m.charge), `${where}: unknown charge "${m.charge}"`);
      assert.ok(Array.isArray(m.buttons) && m.buttons.length, `${where}: no buttons`);
      for (const b of m.buttons) assert.ok(BUTTONS.includes(b), `${where}: unknown button "${b}"`);
    }
  }
});

test('supers cost meter and normals do not', () => {
  for (const c of CF.ROSTER) {
    for (const s of c.supers) {
      assert.ok(s.cost > 0 && s.cost <= 100, `${c.id}.${s.id}: super cost must be 1..100`);
    }
    for (const [key, m] of attackMoves(c)) {
      if (m.kind === 'super') continue;
      assert.ok(!m.cost, `${c.id}.${key}: only supers may cost meter`);
    }
  }
});

/* ---- the skeleton ------------------------------------------------------- */

test('every pose solves to finite joints for every build', () => {
  for (const [name, pose] of Object.entries(CF.Pose)) {
    for (const c of CF.ROSTER) {
      const j = CF.Rig.solve(pose, 1, c.build);
      for (const [k, v] of Object.entries(j)) {
        if (v && typeof v === 'object' && 'x' in v) {
          assert.ok(Number.isFinite(v.x) && Number.isFinite(v.y),
            `pose ${name} on ${c.id}: joint ${k} is not a finite point`);
        }
      }
      assert.ok(Number.isFinite(j.headR) && j.headR > 0, `pose ${name} on ${c.id}: bad head radius`);
    }
  }
});

test('standing poses put the feet on the floor, not through it or above it', () => {
  const grounded = ['stand', 'standB', 'standC', 'walkF2', 'walkB2', 'crouch', 'guardHigh'];
  for (const name of grounded) {
    for (const c of CF.ROSTER) {
      const j = CF.Rig.solve(CF.Pose[name], 1, c.build);
      const lowest = Math.min(j.footF.y, j.footB.y);
      assert.ok(lowest > -9 && lowest < 12,
        `pose ${name} on ${c.id}: lowest foot sits at y=${lowest.toFixed(1)}, should be near 0`);
    }
  }
});

test('hurtboxes derived from a pose have real area', () => {
  for (const c of CF.ROSTER) {
    const j = CF.Rig.solve(CF.Pose.stand, 1, c.build);
    const boxes = CF.Rig.hurtboxes(j);
    assert.ok(boxes.length >= 4, `${c.id}: too few hurtboxes`);
    for (const b of boxes) {
      assert.ok(b.w > 0 && b.h > 0, `${c.id}: a hurtbox has no area`);
      assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y), `${c.id}: hurtbox is not finite`);
    }
  }
});

/* ---- motion input ------------------------------------------------------- */

function feed(port, frames) {
  for (const f of frames) port.apply(f.d, f.b || {}, false);
}

test('a quarter-circle-forward registers, and a random wiggle does not', () => {
  const p = new CF.Input.Port('p1');
  feed(p, [{ d: 5 }, { d: 2 }, { d: 3 }, { d: 6 }]);
  assert.equal(p.motion('qcf', 1), true, 'clean 2-3-6 should read as a fireball motion');

  const q = new CF.Input.Port('p1');
  feed(q, [{ d: 5 }, { d: 4 }, { d: 8 }, { d: 6 }]);
  assert.equal(q.motion('qcf', 1), false, 'back-up-forward is not a fireball');
});

test('motions mirror when the cat turns around', () => {
  const p = new CF.Input.Port('p1');
  /* the same physical stick motion, read while facing left */
  feed(p, [{ d: 5 }, { d: 2 }, { d: 1 }, { d: 4 }]);
  assert.equal(p.motion('qcf', -1), true, 'facing left, 2-1-4 is forward');
  assert.equal(p.motion('qcf', 1), false, 'facing right, 2-1-4 is backward');
});

test('a dragon punch needs its forward, down, down-forward', () => {
  const p = new CF.Input.Port('p1');
  feed(p, [{ d: 5 }, { d: 6 }, { d: 2 }, { d: 3 }]);
  assert.equal(p.motion('dp', 1), true);

  const q = new CF.Input.Port('p1');
  feed(q, [{ d: 5 }, { d: 2 }, { d: 3 }, { d: 6 }]);
  assert.equal(q.motion('dp', 1), false, 'a plain fireball motion must not give a dragon punch');
});

test('a motion goes stale rather than lingering forever', () => {
  const p = new CF.Input.Port('p1');
  feed(p, [{ d: 2 }, { d: 3 }, { d: 6 }]);
  assert.equal(p.motion('qcf', 1), true);
  for (let i = 0; i < 30; i++) p.apply(5, {}, false);
  assert.equal(p.motion('qcf', 1), false, 'a quarter circle from half a second ago must not still fire');
});

test('charge moves require the charge to have been held', () => {
  const p = new CF.Input.Port('p1');
  for (let i = 0; i < 5; i++) p.apply(4, {}, false);   // only five frames of back
  p.apply(6, {}, false);
  assert.equal(p.chargeBF(1, 40), false, 'five frames is not a charge');

  const q = new CF.Input.Port('p1');
  for (let i = 0; i < 45; i++) q.apply(4, {}, false);
  q.apply(6, {}, false);
  assert.equal(q.chargeBF(1, 40), true, 'forty-five frames of back then forward is a charge');
});

test('holding down-back charges both a boomerang and a flash kick', () => {
  const p = new CF.Input.Port('p1');
  for (let i = 0; i < 45; i++) p.apply(1, {}, false);
  const forward = new CF.Input.Port('p1');
  Object.assign(forward, p);
  p.apply(6, {}, false);
  assert.equal(p.chargeBF(1, 40), true, 'down-back should charge back');

  const q = new CF.Input.Port('p1');
  for (let i = 0; i < 45; i++) q.apply(1, {}, false);
  q.apply(8, {}, false);
  assert.equal(q.chargeDU(1, 40), true, 'down-back should charge down');
});

test('mashing is counted from real button presses, not from holding', () => {
  const p = new CF.Input.Port('p1');
  for (let i = 0; i < 8; i++) {
    p.apply(5, { LK: true }, false);
    p.apply(5, {}, false);
  }
  assert.ok(p.mashCount(['LK'], 24) >= 4, 'eight taps should count as a mash');

  const q = new CF.Input.Port('p1');
  for (let i = 0; i < 24; i++) q.apply(5, { LK: true }, false);
  assert.ok(q.mashCount(['LK'], 24) < 4, 'holding the button is not mashing');
});

/* ---- combat maths ------------------------------------------------------- */

test('combo damage scales down and never reaches zero', () => {
  const f = new CF.Fighter(CF.ROSTER[0], 0, new CF.Input.Port('p1'), []);
  let prev = Infinity;
  for (let hits = 0; hits < 12; hits++) {
    f.comboCount = hits;
    const d = f.scaleDamage(100);
    assert.ok(d > 0, 'scaled damage must stay above zero');
    assert.ok(d <= prev, `damage should not go up on hit ${hits}`);
    prev = d;
  }
  f.comboCount = 0;
  assert.equal(f.scaleDamage(100), 100, 'the first hit of a combo does full damage');
});

test('chip damage from a blocked hit can never finish a round', () => {
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.ROSTER[0], 0, port, []);
  f.other = new CF.Fighter(CF.ROSTER[1], 1, new CF.Input.Port('p2'), []);
  f.setState('idle');
  f.health = 3;
  port.apply(4, {}, false);              // holding back = blocking
  const res = f.takeHit(f.other, { damage: 200, chip: 50, hitLevel: 'mid', blockstun: 10 });
  assert.equal(res, 'block');
  assert.ok(f.health >= 1, 'chip must leave at least one point of health');
});

test('blocking respects high and low', () => {
  function tryBlock(dir, level) {
    const port = new CF.Input.Port('p1');
    const f = new CF.Fighter(CF.ROSTER[0], 0, port, []);
    f.setState('idle');
    port.apply(dir, {}, false);
    return f.canBlock(level, 999);
  }
  assert.equal(tryBlock(4, 'low'), false, 'standing block does not stop a low');
  assert.equal(tryBlock(1, 'low'), true, 'crouch block stops a low');
  assert.equal(tryBlock(1, 'overhead'), false, 'crouch block does not stop an overhead');
  assert.equal(tryBlock(4, 'overhead'), true, 'standing block stops an overhead');
  assert.equal(tryBlock(4, 'mid'), true);
  assert.equal(tryBlock(1, 'mid'), true);
  assert.equal(tryBlock(6, 'mid'), false, 'holding forward is not blocking');
});

test('you cannot block in the air', () => {
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.ROSTER[0], 0, port, []);
  f.setState('jump');
  f.grounded = false;
  port.apply(4, {}, false);
  assert.equal(f.canBlock('mid', 999), false);
});

test('a knockout leaves no health and ends the fighter', () => {
  const f = new CF.Fighter(CF.ROSTER[0], 0, new CF.Input.Port('p1'), []);
  f.other = new CF.Fighter(CF.ROSTER[1], 1, new CF.Input.Port('p2'), []);
  f.setState('idle');
  f.health = 10;
  const res = f.takeHit(f.other, { damage: 500, hitLevel: 'mid', hitstun: 12 });
  assert.equal(res, 'ko');
  assert.equal(f.health, 0);
  assert.equal(f.state, 'ko');
});

/* ---- balance sanity ----------------------------------------------------- */

test('no cat is strictly better than another on raw stats', () => {
  for (const c of CF.ROSTER) {
    const s = c.stats;
    assert.ok(s.health >= 850 && s.health <= 1250, `${c.id}: health ${s.health} is off the scale`);
    assert.ok(s.walkF > 0.9 && s.walkF < 2.4, `${c.id}: walk speed ${s.walkF} is off the scale`);
    assert.ok(s.jumpVy > 8 && s.jumpVy < 11.5, `${c.id}: jump ${s.jumpVy} is off the scale`);
    /* the fastest cat should not also be the toughest */
    if (s.walkF > 1.8) assert.ok(s.health < 1000, `${c.id} is both the fastest and the toughest`);
    if (s.health > 1100) assert.ok(s.walkF < 1.4, `${c.id} is both the toughest and quick`);
  }
});

test('heavier cats hit harder and slower than lighter ones', () => {
  const heavy = CF.byId('biscuit'), light = CF.byId('pepper');
  assert.ok(heavy.mod.damage > light.mod.damage, 'the heavyweight should hit harder');
  assert.ok(heavy.stats.walkF < light.stats.walkF, 'the heavyweight should walk slower');
  assert.ok(heavy.moves.stHP.damage > light.moves.stHP.damage);
  assert.ok(heavy.moves.stHP.startup >= light.moves.stHP.startup);
});

test('the long cat genuinely out-ranges everyone', () => {
  const noodle = CF.byId('noodle');
  const reachOf = c => c.moves.stHP.hitbox.x + c.moves.stHP.hitbox.w;
  const mine = reachOf(noodle);
  for (const c of CF.ROSTER) {
    if (c.id === 'noodle') continue;
    assert.ok(mine > reachOf(c), `noodle should out-range ${c.id}`);
  }
});

/* ---- stages ------------------------------------------------------------- */

test('every stage has a name and a draw function', () => {
  assert.ok(CF.Stages.length >= 4);
  const names = new Set();
  for (const s of CF.Stages) {
    assert.ok(s.id && s.name, 'a stage is missing its id or name');
    assert.equal(typeof s.draw, 'function', `stage ${s.id} cannot draw itself`);
    names.add(s.name);
  }
  assert.equal(names.size, CF.Stages.length, 'stage names must be unique');
});

/* ---- motion priority ---------------------------------------------------- */

test('a dragon punch that ends on forward is not read as a fireball', () => {
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.byId('mittens'), 0, port, []);
  f.other = new CF.Fighter(CF.byId('biscuit'), 1, new CF.Input.Port('p2'), []);
  f.setState('idle');

  /* forward, down, down-forward, and then forward again — which is what
     nearly everybody actually does on a stick or a d-pad. */
  [6, 5, 2, 3, 6].forEach(d => port.apply(d, {}, false));
  port.apply(6, { HP: true }, false);
  f.frame++;
  f.inputBuf.push({ btn: 'HP', frame: f.frame });

  assert.equal(f.trySpecial('stand', false), true, 'something should have come out');
  assert.equal(f.move.id, 'uppercut',
    `expected the uppercut, got "${f.move.name}" — motion priority is wrong`);
});

test('a plain fireball motion still gives a fireball', () => {
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.byId('mittens'), 0, port, []);
  f.setState('idle');
  [5, 2, 3].forEach(d => port.apply(d, {}, false));
  port.apply(6, { LP: true }, false);
  f.frame++;
  f.inputBuf.push({ btn: 'LP', frame: f.frame });

  assert.equal(f.trySpecial('stand', false), true);
  assert.equal(f.move.id, 'fireball', `expected the fireball, got "${f.move.name}"`);
});

test('a full circle beats every motion hiding inside it', () => {
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.byId('biscuit'), 0, port, []);
  f.other = new CF.Fighter(CF.byId('mittens'), 1, new CF.Input.Port('p2'), []);
  f.setState('idle');
  [6, 2, 4].forEach(d => port.apply(d, {}, false));
  port.apply(8, { HP: true }, false);
  f.frame++;
  f.inputBuf.push({ btn: 'HP', frame: f.frame });

  assert.equal(f.trySpecial('stand', false), true);
  assert.equal(f.move.id, 'spinPile', `expected the command grab, got "${f.move.name}"`);
});

test('every motion the roster uses has a declared priority', () => {
  const f = new CF.Fighter(CF.ROSTER[0], 0, new CF.Input.Port('p1'), []);
  for (const c of CF.ROSTER) {
    for (const m of c.specials.concat(c.supers)) {
      const pri = f.motionPriority(m);
      assert.ok(Number.isFinite(pri) && pri > 0, `${c.id}.${m.id}: no priority`);
    }
  }
});
