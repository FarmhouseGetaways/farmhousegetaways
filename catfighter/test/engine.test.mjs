/* ==========================================================================
   Super Cat Fighter 6 — engine tests

   These guard the things that break silently. A move with no hitbox, an
   animation that ends before the move does, or a mistyped damage array does
   not throw an error — it just quietly never connects, and you find out in
   the middle of a round. Every one of those is a failing test here.
   ========================================================================== */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, attackMoves, headlessGame } from './harness.mjs';

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
  for (const scheme of ['simple', 'classic']) {
    CF.Input.setScheme(scheme);
    const port = new CF.Input.Port('p1');
    const f = new CF.Fighter(CF.ROSTER[0], 0, port, []);
    f.other = new CF.Fighter(CF.ROSTER[1], 1, new CF.Input.Port('p2'), []);
    f.setState('idle');
    f.health = 3;
    port.apply(4, scheme === 'simple' ? { BLOCK: true } : {}, false);
    const res = f.takeHit(f.other, { damage: 200, chip: 50, hitLevel: 'mid', blockstun: 10 });
    assert.equal(res, 'block', `${scheme}: the hit should have been blocked`);
    assert.ok(f.health >= 1, `${scheme}: chip must leave at least one point of health`);
  }
  CF.Input.setScheme('simple');
});

test('blocking respects high and low, in both schemes', () => {
  function tryBlock(scheme, dir, level, holdBlock) {
    CF.Input.setScheme(scheme);
    const port = new CF.Input.Port('p1');
    const f = new CF.Fighter(CF.ROSTER[0], 0, port, []);
    f.setState('idle');
    port.apply(dir, holdBlock ? { BLOCK: true } : {}, false);
    return f.canBlock(level, 999);
  }

  /* CLASSIC: hold back. Standing guard loses to a low, crouching to an overhead. */
  assert.equal(tryBlock('classic', 4, 'low'), false, 'standing block does not stop a low');
  assert.equal(tryBlock('classic', 1, 'low'), true, 'crouch block stops a low');
  assert.equal(tryBlock('classic', 1, 'overhead'), false, 'crouch block does not stop an overhead');
  assert.equal(tryBlock('classic', 4, 'overhead'), true, 'standing block stops an overhead');
  assert.equal(tryBlock('classic', 6, 'mid'), false, 'holding forward is not blocking');

  /* SIMPLE: a real button. The high/low rule is identical, but you can guard
     while walking forward — which is the whole point of having the button. */
  assert.equal(tryBlock('simple', 5, 'mid', true), true, 'the block button blocks');
  assert.equal(tryBlock('simple', 6, 'mid', true), true, 'and it works walking forward');
  assert.equal(tryBlock('simple', 4, 'mid', false), false, 'holding back alone does not block');
  assert.equal(tryBlock('simple', 5, 'low', true), false, 'standing guard still loses to a low');
  assert.equal(tryBlock('simple', 2, 'low', true), true, 'crouching guard stops it');
  assert.equal(tryBlock('simple', 2, 'overhead', true), false, 'and loses to an overhead');
  CF.Input.setScheme('simple');
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
  const heavy = CF.byId('mario'), light = CF.byId('lilly');
  assert.ok(heavy.mod.damage > light.mod.damage, 'the heavyweight should hit harder');
  assert.ok(heavy.stats.walkF < light.stats.walkF, 'the heavyweight should walk slower');
  assert.ok(heavy.moves.stHP.damage > light.moves.stHP.damage);
  assert.ok(heavy.moves.stHP.startup >= light.moves.stHP.startup);
});

test('no two cats play the same way', () => {
  /* Six cats, six sets of specials. If two share every motion they are the
     same character with a different coat. */
  const seen = new Set();
  for (const c of CF.ROSTER) {
    const shape = c.specials
      .map(m => (m.charge ? 'chg-' + m.charge : m.motion) + ':' + m.buttons.join(''))
      .sort().join(' ');
    assert.ok(!seen.has(shape), `${c.id} has the same move set as another cat`);
    seen.add(shape);
  }
});

/* ---- stages ------------------------------------------------------------- */

test('every stage has a name and both draw passes', () => {
  assert.ok(CF.Stages.length >= 4);
  const names = new Set(), ids = new Set();
  for (const s of CF.Stages) {
    assert.ok(s.id && s.name, 'a stage is missing its id or name');
    assert.equal(typeof s.drawBack, 'function', `stage ${s.id} has no background pass`);
    assert.equal(typeof s.drawFore, 'function',
      `stage ${s.id} has no foreground pass — the layer in front of the fighters is what sells it`);
    names.add(s.name); ids.add(s.id);
  }
  assert.equal(names.size, CF.Stages.length, 'stage names must be unique');
  assert.equal(ids.size, CF.Stages.length, 'stage ids must be unique');
});

test('every stage carries its own ambience', () => {
  /* A stage with no particle system is a still photograph. */
  for (const s of CF.Stages) {
    const systems = Object.keys(s).filter(k => s[k] && s[k].p && Array.isArray(s[k].p));
    assert.ok(systems.length >= 1,
      `stage ${s.id} has no particles — nothing is drifting through it`);
    for (const k of systems) {
      assert.ok(s[k].p.length > 0, `stage ${s.id}: particle system "${k}" is empty`);
    }
  }
});

test('parallax layers tile far enough to cover the widest camera offset', () => {
  /* The camera can sit 380 units from the origin. Anything tiled must still
     produce elements across the whole screen there, or a gap opens up. */
  const K = CF.StageKit;
  for (const camX of [-380, -190, -4, 0]) {
    for (const depth of [0.06, 0.3, 0.62, 1, 1.5]) {
      for (const spacing of [22, 74, 300, 420]) {
        const xs = [];
        K.repeatX(camX, depth, spacing, x => xs.push(x));
        const min = Math.min(...xs), max = Math.max(...xs);
        assert.ok(min <= 0, `camX ${camX} depth ${depth} spacing ${spacing}: left gap (first at ${min})`);
        assert.ok(max >= K.W - spacing, `camX ${camX} depth ${depth} spacing ${spacing}: right gap (last at ${max})`);
      }
    }
  }
});

/* ---- motion priority ---------------------------------------------------- */

test('a dragon punch that ends on forward is not read as a fireball', () => {
  CF.Input.setScheme('classic');
  const port = new CF.Input.Port('p1');
  /* Lilly owns both a quarter circle and a dragon punch, on the same three
     buttons — the exact case where the wrong one comes out. */
  const f = new CF.Fighter(CF.byId('lilly'), 0, port, []);
  f.other = new CF.Fighter(CF.byId('mario'), 1, new CF.Input.Port('p2'), []);
  f.setState('idle');

  /* forward, down, down-forward, and then forward again — which is what
     nearly everybody actually does on a stick or a d-pad. */
  [6, 5, 2, 3, 6].forEach(d => port.apply(d, {}, false));
  port.apply(6, { HK: true }, false);
  f.frame++;
  f.inputBuf.push({ btn: 'HK', frame: f.frame });

  assert.equal(f.trySpecial('stand', false), true, 'something should have come out');
  assert.equal(f.move.id, 'flipattack',
    `expected the Flip Attack, got "${f.move.name}" — motion priority is wrong`);
  CF.Input.setScheme('simple');
});

test('a plain fireball motion still gives a fireball', () => {
  CF.Input.setScheme('classic');
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.byId('gracie'), 0, port, []);
  f.setState('idle');
  [5, 2, 3].forEach(d => port.apply(d, {}, false));
  port.apply(6, { LP: true }, false);
  f.frame++;
  f.inputBuf.push({ btn: 'LP', frame: f.frame });

  assert.equal(f.trySpecial('stand', false), true);
  assert.equal(f.move.id, 'growl', `expected the growl, got "${f.move.name}"`);
  CF.Input.setScheme('simple');
});

test('a half circle beats the quarter circle hiding inside it', () => {
  CF.Input.setScheme('classic');
  /* Mario's Smother is a half circle forward, which contains a quarter
     circle forward. On the same buttons, the harder motion must win. */
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.byId('mario'), 0, port, []);
  f.other = new CF.Fighter(CF.byId('gracie'), 1, new CF.Input.Port('p2'), []);
  f.setState('idle');
  assert.ok(f.motionPriority({ motion: 'hcf' }) > f.motionPriority({ motion: 'qcf' }),
    'a half circle must outrank a quarter circle');

  [4, 1, 2, 3].forEach(d => port.apply(d, {}, false));
  port.apply(6, { HK: true }, false);
  f.frame++;
  f.inputBuf.push({ btn: 'HK', frame: f.frame });
  assert.equal(f.trySpecial('stand', false), true);
  assert.equal(f.move.id, 'smother', `expected the Smother, got "${f.move.name}"`);
  CF.Input.setScheme('simple');
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

/* ---- gamepads -----------------------------------------------------------
   An Xbox pad on Windows reaches the browser as a "standard gamepad", which
   fixes every index below. These tests build one by hand and push it through
   the real readHardware path.                                              */

function fakePad(over) {
  const p = {
    id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)',
    index: 0, connected: true, mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    vibrationActuator: { calls: [], playEffect(type, o) { this.calls.push({ type, o }); return Promise.resolve('complete'); } }
  };
  if (over) over(p);
  return p;
}

function press(p, i, value) {
  p.buttons[i].value = value === undefined ? 1 : value;
  p.buttons[i].pressed = p.buttons[i].value > 0.5;
}

function withPad(sandbox, pad) {
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  CF.Input.refreshPadOrder();
}

test('an Xbox pad is recognised and named', () => {
  const { CF: G, sandbox } = loadGame();
  const pad = fakePad();
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();
  assert.equal(G.Input.padCount(), 1);
  assert.equal(G.Input.padName(0), 'XBOX CONTROLLER');
  assert.equal(G.Input.padName(1), null, 'a second player has no pad yet');
});

test('the six face buttons map to the arcade layout', () => {
  const { CF: G, sandbox } = loadGame();
  G.Input.setScheme('classic');
  const pad = fakePad();
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();
  const port = new G.Input.Port('p1');

  const expect = { 2: 'LP', 3: 'MP', 5: 'HP', 0: 'LK', 1: 'MK', 7: 'HK' };
  for (const [index, name] of Object.entries(expect)) {
    pad.buttons.forEach(b => { b.pressed = false; b.value = 0; });
    press(pad, Number(index));
    const h = port.readHardware();
    assert.equal(h.btn[name], true, `pad button ${index} should be ${name}`);
    for (const other of ['LP', 'MP', 'HP', 'LK', 'MK', 'HK']) {
      if (other === name) continue;
      assert.equal(h.btn[other], false, `pad button ${index} should not also press ${other}`);
    }
  }
});

test('the analogue triggers register before they bottom out', () => {
  const { CF: G, sandbox } = loadGame();
  G.Input.setScheme('classic');
  const pad = fakePad();
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();
  const port = new G.Input.Port('p1');

  /* RT is heavy kick. A fighting game must take it the moment the player
     commits, not halfway down the travel. */
  press(pad, 7, 0.4);
  assert.equal(pad.buttons[7].pressed, false, 'the browser would not call this pressed');
  assert.equal(port.readHardware().btn.HK, true, 'but the game should still take it');

  press(pad, 7, 0.1);
  assert.equal(port.readHardware().btn.HK, false, 'a resting trigger is not a press');
});

test('the left trigger is a throw macro', () => {
  const { CF: G, sandbox } = loadGame();
  G.Input.setScheme('classic');
  const pad = fakePad();
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();
  const port = new G.Input.Port('p1');
  press(pad, 6, 0.9);
  const h = port.readHardware();
  assert.equal(h.btn.LP, true, 'LT should press light punch');
  assert.equal(h.btn.LK, true, 'LT should press light kick');
});

test('the d-pad and the left stick both give clean directions', () => {
  const { CF: G, sandbox } = loadGame();
  const pad = fakePad();
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();
  const port = new G.Input.Port('p1');

  const dpad = { 12: 8, 13: 2, 14: 4, 15: 6 };
  for (const [index, dir] of Object.entries(dpad)) {
    pad.buttons.forEach(b => { b.pressed = false; b.value = 0; });
    press(pad, Number(index));
    assert.equal(port.readHardware().dir, dir, `d-pad ${index} should give direction ${dir}`);
  }
  pad.buttons.forEach(b => { b.pressed = false; b.value = 0; });

  /* down-forward on the d-pad, which is what a quarter circle needs */
  press(pad, 13); press(pad, 15);
  assert.equal(port.readHardware().dir, 3, 'down + right is down-forward');
  pad.buttons.forEach(b => { b.pressed = false; b.value = 0; });

  pad.axes = [0.9, 0.9, 0, 0];
  assert.equal(port.readHardware().dir, 3, 'stick pushed down-right is down-forward');
  pad.axes = [-0.9, -0.9, 0, 0];
  assert.equal(port.readHardware().dir, 7, 'stick pushed up-left is up-back');
  pad.axes = [0.2, 0.2, 0, 0];
  assert.equal(port.readHardware().dir, 5, 'inside the deadzone is neutral');
});

test('a quarter circle on the d-pad reads as a fireball', () => {
  const { CF: G, sandbox } = loadGame();
  G.Input.setScheme('classic');
  const pad = fakePad();
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();
  const port = new G.Input.Port('p1');

  function frame() { const h = port.readHardware(); port.apply(h.dir, h.btn, h.start); }
  const clear = () => pad.buttons.forEach(b => { b.pressed = false; b.value = 0; });

  clear(); frame();
  clear(); press(pad, 13); frame();                 // down
  clear(); press(pad, 13); press(pad, 15); frame(); // down-forward
  clear(); press(pad, 15); frame();                 // forward
  assert.equal(port.motion('qcf', 1), true, 'd-pad quarter circle should read as a fireball motion');
});

test('players get pads in the order they were plugged in', () => {
  const { CF: G, sandbox } = loadGame();
  const a = fakePad(p => { p.index = 0; });
  const b = fakePad(p => { p.index = 3; p.id = 'Xbox Controller B'; });
  sandbox.navigator.getGamepads = () => [a, null, null, b];
  G.Input.refreshPadOrder();
  assert.equal(G.Input.padCount(), 2);
  assert.equal(G.Input.padForPlayer(0).index, 0);
  assert.equal(G.Input.padForPlayer(1).index, 3,
    'a pad sitting at slot 3 should still be player two, not nobody');

  /* unplug the first — the survivor becomes player one */
  sandbox.navigator.getGamepads = () => [null, null, null, b];
  G.Input.refreshPadOrder();
  assert.equal(G.Input.padCount(), 1);
  assert.equal(G.Input.padForPlayer(0).index, 3);
});

test('rumble reaches the pad, and never reaches a CPU port', () => {
  const { CF: G, sandbox } = loadGame();
  const pad = fakePad();
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();

  const human = new G.Input.Port('p1');
  human.rumble(0.8, 120);
  assert.equal(pad.vibrationActuator.calls.length, 1, 'a human port should buzz its pad');
  assert.equal(pad.vibrationActuator.calls[0].o.strongMagnitude, 0.8);

  /* The CPU port borrows player one's key map. It must not borrow the pad:
     the computer taking a hit should never buzz the human's controller. */
  const cpu = new G.VirtualPort();
  cpu.rumble(1, 400);
  assert.equal(pad.vibrationActuator.calls.length, 1,
    'the CPU getting hit must not rumble the human player');
  assert.equal(cpu.pad(), null);
  assert.equal(cpu.padConnected(), false);
});

test('rumble on a pad that cannot buzz is harmless', () => {
  const { CF: G, sandbox } = loadGame();
  const pad = fakePad(p => { delete p.vibrationActuator; });
  sandbox.navigator.getGamepads = () => [pad, null, null, null];
  G.Input.refreshPadOrder();
  const port = new G.Input.Port('p1');
  assert.doesNotThrow(() => port.rumble(1, 200));
});

/* ---- the real cats ------------------------------------------------------ */

test('Gracie is on the roster with the moves she was given', () => {
  const g = CF.byId('gracie');
  assert.equal(g.displayName, 'GRACIE');
  const names = g.specials.map(m => m.name);
  assert.ok(names.includes('Growl of Energy'), 'the growl is missing');
  assert.ok(names.includes('Tail Whip'), 'the tail whip is missing');
  assert.equal(g.supers.length, 1);
});

test('the growl travels and the tail whip must be blocked low', () => {
  const g = CF.byId('gracie');
  const growl = g.specials.find(m => m.id === 'growl');
  for (let s = 0; s < 3; s++) {
    const shot = growl.spawn({ x: 0, facing: 1, side: 0, fx: [] }, s, 0);
    assert.ok(shot.vx > 0, `growl at strength ${s} does not travel`);
    assert.equal(shot.style, 'wave', 'a growl should be drawn as sound, not as a ball');
  }
  /* faster buttons should make a faster growl */
  const speeds = [0, 1, 2].map(s => growl.spawn({ x: 0, facing: 1, side: 0, fx: [] }, s, 0).vx);
  assert.ok(speeds[0] < speeds[1] && speeds[1] < speeds[2], 'button strength should pick the speed');

  const whip = g.specials.find(m => m.id === 'tailwhip');
  assert.equal(whip.hitLevel, 'low', 'a tail along the floor must be blocked low');
  assert.ok(whip.hitbox.y < 12, 'the tail whip should come in at ankle height');
  assert.ok(whip.knockdown, 'the tail whip should put them down');
});

test('a pose can bring the tail in front of the body', () => {
  /* The tail whip is invisible without this — the business end of the attack
     would be hidden behind the torso. */
  assert.equal(CF.Anim.BASE.tailFront, 0, 'poses default to the tail behind');
  assert.ok(CF.Pose.whipOut.tailFront > 0.5, 'the whip should throw the tail forward');
  const mid = CF.Anim.blend(CF.Pose.whipWind, CF.Pose.whipOut, 0.9);
  assert.ok(typeof mid.tailFront === 'number', 'tailFront must survive a blend');
});

test('the CPU understands every cat without being told about her by name', () => {
  /* The AI classifies specials by what they do. If a cat ends up with no role
     at all, the computer will never use a single one of her special moves. */
  for (const c of CF.ROSTER) {
    const f = new CF.Fighter(c, 0, new CF.Input.Port('p1'), []);
    const ai = new CF.AI(f, 3);
    const roles = ai.roles();
    const total = Object.values(roles).reduce((n, list) => n + list.length, 0);
    assert.ok(total > 0, `${c.id}: the CPU can see no role for any of her specials`);
    assert.ok(ai.pick('projectile', 'antiAir', 'rush', 'grab', 'low', 'poke'),
      `${c.id}: the CPU cannot pick any special to use`);
  }
});

test('a projectile can carry its own knockdown', () => {
  /* Supers need it; ordinary fireballs must not accidentally gain it. */
  const g = CF.byId('gracie');
  const sup = g.supers[0].spawn({ x: 0, facing: 1, side: 0, fx: [] }, 2, 0);
  assert.equal(sup.super, true);
  assert.equal(sup.knockdown, false, 'the growl super should keep them standing for the next wave');
  const plain = g.specials.find(m => m.id === 'growl').spawn({ x: 0, facing: 1, side: 0, fx: [] }, 0, 0);
  assert.equal(plain.knockdown, undefined);
});

test('a move can open the cat\'s mouth, and most moves do not', () => {
  const g = CF.byId('gracie');
  const f = new CF.Fighter(g, 0, new CF.Input.Port('p1'), []);

  f.startMove(g.specials.find(m => m.id === 'growl'), 2);
  f.moveFrame = 10;
  assert.equal(f.mouthState(), 'open', 'the growl should open her mouth');
  f.moveFrame = 0;
  assert.equal(f.mouthState(), null, 'not before she has drawn breath');

  f.startMove(g.moves.stHP, 2);
  f.moveFrame = 10;
  assert.equal(f.mouthState(), null, 'an ordinary punch should not');
});

test('the tail whip is drawn reaching as far as it hits', () => {
  /* A move whose picture falls short of its hitbox feels like a cheat. The
     tail stretches through the swing so the two agree. */
  const g = CF.byId('gracie');
  const whip = g.specials.find(m => m.id === 'tailwhip');
  const j = CF.Rig.solve(CF.Pose.whipOut, 1, g.build);
  const tip = j.tail[3].x;
  const reach = whip.hitbox.x + whip.hitbox.w;
  assert.ok(tip > reach * 0.75,
    `the tail reaches ${tip.toFixed(1)} but the hitbox reaches ${reach} — the picture is short`);
  assert.ok(tip < reach * 1.25,
    `the tail reaches ${tip.toFixed(1)} past a hitbox that ends at ${reach} — it looks like it should hit and does not`);

  /* it must arrive at the height it claims to hit, not sail over the top */
  const box = whip.hitbox;
  assert.ok(j.tail[3].y >= box.y - 4 && j.tail[3].y <= box.y + box.h + 4,
    `the tail tip is at y ${j.tail[3].y.toFixed(1)} but the hitbox spans ${box.y}–${box.y + box.h}`);

  /* and it must be back to normal length when she is just standing */
  assert.equal(CF.Pose.stand.tailLen, 1, 'a resting tail should not be stretched');
  assert.equal(CF.Anim.BASE.tailLen, 1);
});

test('the tail whip is swinging on the frames it can hit', () => {
  const g = CF.byId('gracie');
  const whip = g.specials.find(m => m.id === 'tailwhip');
  for (let f = whip.startup; f < whip.startup + whip.active; f++) {
    const pose = CF.Anim.sample(whip.anim, f);
    assert.ok(pose.tailFront > 0.5, `frame ${f} is active but the tail is still behind her`);
    assert.ok(pose.tailLen > 1.5, `frame ${f} is active but the tail is not extended`);
  }
});

/* ---- weight classes -----------------------------------------------------
   The trade the roster is built on: heavy is harder to hurt but slower,
   light is fast but folds. These tests hold that true in both directions,
   so a later balance tweak cannot quietly undo it.                        */

test('every cat declares a weight class the engine knows', () => {
  for (const c of CF.ROSTER) {
    assert.ok(CF.CLASSES[c.weightClass],
      `${c.id}: weightClass "${c.weightClass}" is not one of light/medium/heavy`);
  }
  const used = new Set(CF.ROSTER.map(c => c.weightClass));
  for (const k of ['light', 'medium', 'heavy']) {
    assert.ok(used.has(k), `nobody on the roster is ${k} — the trade is invisible`);
  }
});

test('the class multipliers run the right way round', () => {
  const { light, medium, heavy } = CF.CLASSES;
  assert.ok(heavy.damageTaken < medium.damageTaken, 'heavy should take less damage');
  assert.ok(medium.damageTaken < light.damageTaken, 'light should take more damage');
  assert.ok(heavy.stunTaken < light.stunTaken, 'heavy should be harder to stun');
  assert.ok(heavy.pushed < light.pushed, 'heavy should be harder to shift');
});

test('the identical punch hurts a light cat more than a heavy one', () => {
  function takeIt(id) {
    const f = new CF.Fighter(CF.byId(id), 0, new CF.Input.Port('p1'), []);
    f.other = new CF.Fighter(CF.byId('gracie'), 1, new CF.Input.Port('p2'), []);
    f.setState('idle');
    const before = f.health;
    f.takeHit(f.other, { damage: 100, stun: 20, hitLevel: 'mid', hitstun: 12, pushback: 3 });
    return { lost: before - f.health, stun: f.stun, vx: Math.abs(f.vx) };
  }
  const heavy = takeIt('mario'), medium = takeIt('gracie'), light = takeIt('lilly');

  assert.ok(heavy.lost < medium.lost, `heavy lost ${heavy.lost}, medium lost ${medium.lost}`);
  assert.ok(medium.lost < light.lost, `medium lost ${medium.lost}, light lost ${light.lost}`);
  assert.ok(heavy.stun < light.stun, 'the same hit should rattle a light cat more');
  assert.ok(heavy.vx < light.vx, 'the same hit should shift a light cat further');
});

test('and the light cats are genuinely faster in exchange', () => {
  const byClass = k => CF.ROSTER.filter(c => c.weightClass === k);
  const avg = (list, pick) => list.reduce((n, c) => n + pick(c), 0) / list.length;

  const lightSpeed = avg(byClass('light'), c => c.stats.walkF);
  const heavySpeed = avg(byClass('heavy'), c => c.stats.walkF);
  assert.ok(lightSpeed > heavySpeed * 1.25,
    `light cats walk ${lightSpeed.toFixed(2)}, heavy ${heavySpeed.toFixed(2)} — not enough of a gap to feel`);

  const lightHp = avg(byClass('light'), c => c.stats.health);
  const heavyHp = avg(byClass('heavy'), c => c.stats.health);
  assert.ok(heavyHp > lightHp, 'heavy cats should also carry more health');

  /* nobody gets to be both */
  for (const c of CF.ROSTER) {
    if (c.weightClass === 'light') {
      assert.ok(c.stats.health <= 950, `${c.id} is light but has ${c.stats.health} health`);
      assert.ok(c.stats.walkF >= 1.7, `${c.id} is light but walks at ${c.stats.walkF}`);
    }
    if (c.weightClass === 'heavy') {
      assert.ok(c.stats.health >= 1050, `${c.id} is heavy but has only ${c.stats.health} health`);
      assert.ok(c.stats.walkF <= 1.35, `${c.id} is heavy but walks at ${c.stats.walkF}`);
    }
  }
});

/* ---- the real roster ---------------------------------------------------- */

test('all six cats are the real ones, with the moves they were given', () => {
  const expected = {
    gracie: ['Growl of Energy', 'Tail Whip'],
    mario:  ['Belly Bump', 'The Smother'],
    luigi:  ['Flying Body Attack', 'Leg Sweep'],
    lilly:  ['Flip Attack', 'Crane Kick'],
    figuro: ['Rapid Paws', 'Cut and Run'],
    ruby:   ['Crushing Bite', 'Flip Kick']
  };
  assert.equal(CF.ROSTER.length, 6);
  for (const [id, moves] of Object.entries(expected)) {
    const c = CF.byId(id);
    assert.equal(c.id, id, `${id} is not on the roster`);
    const names = c.specials.map(m => m.name);
    for (const m of moves) assert.ok(names.includes(m), `${id} is missing ${m}`);
    assert.equal(names.length, moves.length, `${id} has a special nobody asked for`);
  }
});

test('the twins look alike but are told apart at a glance', () => {
  const m = CF.byId('mario'), l = CF.byId('luigi');
  assert.equal(m.palette.pattern, 'tuxedo');
  assert.equal(l.palette.pattern, 'tuxedo');
  assert.ok(m.palette.longhair && l.palette.longhair, 'both twins are long-haired');
  assert.ok(l.palette.sock, 'Luigi is the one with the white sleeve');
  assert.ok(!m.palette.sock, 'Mario has no sleeve');
  assert.ok(m.build.girth > l.build.girth * 1.3, 'Mario should be visibly the bigger cat');
  assert.notEqual(m.weightClass, l.weightClass, 'and they should not play the same');
});

test('Lilly is drawn as a seal point', () => {
  const l = CF.byId('lilly');
  assert.equal(l.palette.pattern, 'siamese');
  assert.ok(l.palette.points, 'her ears, legs and tail should be dark');
  assert.ok(l.palette.eye.match(/^#/), 'and she has blue eyes');
});

test('Figuro can genuinely escape, and it costs him his offence', () => {
  const f = CF.byId('figuro').specials.find(m => m.id === 'cutandrun');
  assert.ok(f.noAttack, 'the retreat should not hit anything');
  assert.ok(f.invuln, 'it should be invincible, or it is just a back dash');
  assert.ok(f.moveSelf, 'and it should actually take him somewhere');
});

test('Ruby has to hold a charge for her anti-air', () => {
  const k = CF.byId('ruby').specials.find(m => m.id === 'flipkick');
  assert.equal(k.charge, 'du');
  assert.ok(k.chargeFrames >= 30, 'a charge that short is not a commitment');
  assert.ok(k.invuln, 'an anti-air needs invincible frames to be worth pressing');
});

/* ---- moves that work on paper but not in practice ------------------------
   A move can have perfect frame data and still do nothing, because the
   fighter travels out of her own hitbox, or the opponent falls out of it
   between hits. The only way to catch that is to run the match.           */
import { tryMove } from './harness.mjs';

test('every special actually connects when it is thrown at the right range', () => {
  for (const c of CF.ROSTER) {
    for (const m of c.specials) {
      if (m.noAttack) continue;
      const dist = m.isCommandThrow ? 30 : (m.spawn ? 150 : 50);
      const r = tryMove(CF, c.id, m, { dist });
      assert.ok(r.damage > 0,
        `${c.id}: "${m.name}" landed no damage at ${dist} units — it looks fine on paper and does nothing`);
    }
  }
});

test('every super is worth the meter it costs', () => {
  /* A full bar should be worth roughly a heavy special or better. This is
     the test that caught Lilly rising up and away from her own super. */
  for (const c of CF.ROSTER) {
    for (const m of c.supers) {
      const dist = m.isCommandThrow ? 30 : 50;
      const r = tryMove(CF, c.id, m, { dist });
      assert.ok(r.damage >= 110,
        `${c.id}: "${m.name}" only landed ${r.damage} for a full meter`);
      assert.ok(r.damage <= 420,
        `${c.id}: "${m.name}" landed ${r.damage} — that is most of a life bar`);
    }
  }
});

test('a heavy cat really does survive longer than a light one', () => {
  /* End to end, through the real match loop rather than the damage formula. */
  const punish = id => {
    const r = tryMove(CF, 'mario', CF.byId('mario').specials.find(m => m.id === 'bellybump'),
                      { against: id, dist: 40 });
    return r.damage;
  };
  const onLight = punish('lilly');
  const onHeavy = punish('ruby');
  assert.ok(onLight > onHeavy,
    `the same Belly Bump took ${onLight} from Lilly and ${onHeavy} from Ruby — the weight classes are not biting`);
});

test('the CPU only calls a move an anti-air if it can actually answer a jump', () => {
  /* A forward-leaping overhead is airborne too. Using it to answer a jump-in
     loses every time, so it must not be classified as an anti-air. */
  const lilly = CF.byId('lilly');
  const f = new CF.Fighter(lilly, 0, new CF.Input.Port('p1'), []);
  const roles = new CF.AI(f, 3).roles();
  const aa = roles.antiAir.map(m => m.id);
  assert.ok(aa.includes('flipattack'), 'the invincible rising flip is her anti-air');
  assert.ok(!aa.includes('cranekick'), 'the forward-leaping crane kick is not');

  for (const c of CF.ROSTER) {
    const ff = new CF.Fighter(c, 0, new CF.Input.Port('p1'), []);
    for (const m of new CF.AI(ff, 3).roles().antiAir) {
      assert.ok(m.invuln, `${c.id}: "${m.name}" is used as an anti-air but has no invincible frames`);
    }
  }
});

test('the CPU knows what an escape is', () => {
  const f = new CF.Fighter(CF.byId('figuro'), 0, new CF.Input.Port('p1'), []);
  const roles = new CF.AI(f, 3).roles();
  assert.equal(roles.escape.length, 1, 'Figuro should have exactly one escape');
  assert.equal(roles.escape[0].id, 'cutandrun');

  /* and nobody else on the roster has one, so it stays his */
  for (const c of CF.ROSTER) {
    if (c.id === 'figuro') continue;
    const ff = new CF.Fighter(c, 0, new CF.Input.Port('p1'), []);
    assert.equal(new CF.AI(ff, 3).roles().escape.length, 0, `${c.id} should not have an escape`);
  }
});

/* ---- the four-button scheme ---------------------------------------------
   Punch, Kick, Jump, Block, plus two triggers. Specials come from pairs, and
   direction picks which normal. These drive the fighter through the real
   input path rather than calling startMove directly.                      */

function simpleRig(id) {
  CF.Input.setScheme('simple');
  const port = new CF.Input.Port('p1');
  const f = new CF.Fighter(CF.byId(id || 'gracie'), 0, port, []);
  f.other = new CF.Fighter(CF.byId('mario'), 1, new CF.Input.Port('p2'), []);
  f.setState('idle');
  f.grounded = true;
  return { f, port };
}

/* one frame of input, then one frame of fighter logic */
function frame(f, port, dir, btns) {
  port.apply(dir === undefined ? 5 : dir, btns || {}, false);
  f.frame++;
  for (const b of CF.Input.BUTTONS) if (port.pressed[b]) f.inputBuf.push({ btn: b, frame: f.frame });
  while (f.inputBuf.length && f.frame - f.inputBuf[0].frame > 5) f.inputBuf.shift();
}

test('two attack buttons and a direction give eight ground normals', () => {
  const expect = [
    [5, 'P', 'stLP'], [6, 'P', 'stHP'], [2, 'P', 'crMP'], [8, 'P', 'crHP'],
    [5, 'K', 'stLK'], [6, 'K', 'stHK'], [2, 'K', 'crHK'], [8, 'K', 'stMK']
  ];
  const seen = new Set();
  for (const [dir, btn, moveId] of expect) {
    const { f, port } = simpleRig();
    const b = {}; b[btn] = true;
    frame(f, port, dir, b);
    const stance = (dir === 2 || dir === 1 || dir === 3) ? 'crouch' : 'stand';
    assert.equal(f.tryNormal(stance), true, `direction ${dir} + ${btn} produced nothing`);
    assert.equal(f.move.id, moveId,
      `direction ${dir} + ${btn} gave "${f.move.name}" (${f.move.id}), expected ${moveId}`);
    seen.add(moveId);
  }
  assert.equal(seen.size, 8, 'the eight normals should all be different moves');
});

test('punch and kick together fire the first special, with no motion', () => {
  const { f, port } = simpleRig('gracie');
  frame(f, port, 5, { P: true, K: true });
  assert.equal(f.trySpecial('stand', true), true, 'the pair produced nothing');
  assert.equal(f.move.id, 'growl', `expected the growl, got "${f.move.name}"`);
});

test('punch and block together fire the second special', () => {
  const { f, port } = simpleRig('gracie');
  frame(f, port, 5, { P: true, BLOCK: true });
  assert.equal(f.trySpecial('stand', true), true);
  assert.equal(f.move.id, 'tailwhip', `expected the tail whip, got "${f.move.name}"`);
});

test('kick and block together throw', () => {
  const { f, port } = simpleRig('gracie');
  frame(f, port, 5, { K: true, BLOCK: true });
  assert.equal(f.trySpecial('stand', true), true);
  assert.equal(f.move.kind, 'throw', `expected a throw, got ${f.move.kind}`);
});

test('both triggers together fire the super, and only on a full meter', () => {
  const empty = simpleRig('gracie');
  empty.f.meter = 0;
  frame(empty.f, empty.port, 5, { DODGE: true, LUNGE: true });
  assert.equal(empty.f.trySpecial('stand', true), false, 'no meter, no super');

  const full = simpleRig('gracie');
  full.f.meter = 100;
  frame(full.f, full.port, 5, { DODGE: true, LUNGE: true });
  assert.equal(full.f.trySpecial('stand', true), true);
  assert.equal(full.f.move.kind, 'super', `expected a super, got ${full.f.move.kind}`);
});

test('holding forward asks for the heavy version of a special', () => {
  const light = simpleRig('gracie');
  frame(light.f, light.port, 5, { P: true, K: true });
  light.f.trySpecial('stand', true);

  const heavy = simpleRig('gracie');
  frame(heavy.f, heavy.port, 6, { P: true, K: true });
  heavy.f.trySpecial('stand', true);

  assert.ok(heavy.f.strength > light.f.strength,
    'forward should give a stronger version');
});

test('a second button arriving late still gets the special', () => {
  /* The normal fires with no delay at all; if the partner lands within the
     first few frames the normal is swapped out before anything came out. */
  const { f, port } = simpleRig('gracie');
  frame(f, port, 5, { P: true });
  assert.equal(f.tryNormal('stand'), true);
  assert.equal(f.move.id, 'stLP', 'the punch should come out immediately');
  f.state = 'move';

  frame(f, port, 5, { P: true, K: true });
  f.updateMove({ projectiles: [], hitstop() {}, shake() {}, excite() {} });
  assert.equal(f.move.id, 'growl',
    `a kick two frames later should have upgraded it, got "${f.move.name}"`);
});

test('one press cannot pay for two specials', () => {
  const { f, port } = simpleRig('gracie');
  frame(f, port, 5, { P: true, K: true });
  assert.equal(f.trySpecial('stand', true), true);
  const first = f.move.id;
  f.setState('idle');
  assert.equal(f.trySpecial('stand', true), false,
    `the same press fired "${first}" twice`);
});

test('jump is a button, so up is free to modify attacks', () => {
  const { f, port } = simpleRig();
  frame(f, port, 8, {});
  f.updateFree({});
  assert.equal(f.grounded, true, 'holding up must not jump in the simple scheme');

  const j = simpleRig();
  frame(j.f, j.port, 5, { JUMP: true });
  j.f.updateFree({});
  assert.equal(j.f.grounded, false, 'the jump button should jump');
});

test('jumping while holding a direction still angles the jump', () => {
  const fwd = simpleRig();
  frame(fwd.f, fwd.port, 6, { JUMP: true });
  fwd.f.updateFree({});
  assert.ok(fwd.f.vx > 0, 'forward + jump should carry you forward');

  const back = simpleRig();
  frame(back.f, back.port, 4, { JUMP: true });
  back.f.updateFree({});
  assert.ok(back.f.vx < 0, 'back + jump should carry you back');
});

test('the triggers dodge and lunge, and go opposite ways', () => {
  const d = simpleRig();
  frame(d.f, d.port, 5, { DODGE: true });
  d.f.updateFree({});
  assert.equal(d.f.move && d.f.move.id, 'dodge');
  for (let i = 0; i < 3; i++) d.f.updateMove({ projectiles: [] });
  assert.ok(d.f.vx < 0, 'a dodge should take you away');
  assert.ok(d.f.hasInvuln(), 'and it should be invincible while it does');

  const l = simpleRig();
  frame(l.f, l.port, 5, { LUNGE: true });
  l.f.updateFree({});
  assert.equal(l.f.move && l.f.move.id, 'lunge');
  for (let i = 0; i < 3; i++) l.f.updateMove({ projectiles: [] });
  assert.ok(l.f.vx > 0, 'a lunge should take you in');
});

test('every cat can reach both specials, a throw and a super from the pad', () => {
  for (const c of CF.ROSTER) {
    for (const pair of [['P', 'K'], ['P', 'BLOCK'], ['K', 'BLOCK'], ['DODGE', 'LUNGE']]) {
      const { f, port } = simpleRig(c.id);
      f.meter = 100;
      const b = {}; b[pair[0]] = true; b[pair[1]] = true;
      frame(f, port, 5, b);
      assert.equal(f.trySpecial('stand', true), true,
        `${c.id}: ${pair.join('+')} produced nothing`);
    }
  }
});

/* ---- pointer menus -------------------------------------------------------

   The game is played embedded — in an artifact viewer, in an iframe. Keyboard
   events only reach a document that already has focus, so a keyboard-only
   title screen is dead until the player guesses to click on it. Clickable
   menus fix that, and these guard the part that silently rots: the rect a
   menu is drawn at and the rect it is hit-tested against must be the same
   rect. A menu item you can see but not click is worse than no mouse at all.
                                                                           */

function menuGame() {
  const g = headlessGame(CF);
  g.pointer.seen = true;
  return g;
}

/* Put the pointer in the middle of a rect and press. */
/* By name, not by position — a new menu item should not break every test
   that happened to sit below it. */
function menuRect(g, label) {
  const i = g.menuItems.indexOf(label);
  assert.notEqual(i, -1, `no ${label} on the title menu`);
  return g.titleRects()[i];
}

function clickRect(g, r) {
  g.pointer.x = r.x + r.w / 2;
  g.pointer.y = r.y + r.h / 2;
  g.pointer.clicked = true;
  g.pointer.moved = true;
  g.step();
}
function hoverRect(g, r) {
  g.pointer.x = r.x + r.w / 2;
  g.pointer.y = r.y + r.h / 2;
  g.pointer.moved = true;
  g.step();
}

test('every menu rect is on screen and none of them overlap', () => {
  const g = menuGame();
  const sets = {
    title: g.titleRects(),
    select: g.selectRects(),
    options: g.optionRects(g.optionRows().length)
  };
  const st = g.stageRects();
  sets.stage = [st.prev, st.next, st.go, st.back];

  for (const [name, rects] of Object.entries(sets)) {
    for (const r of rects) {
      assert.ok(r.w > 0 && r.h > 0, `${name}: a rect with no area`);
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= CF.STAGE.W && r.y + r.h <= CF.STAGE.H,
        `${name}: a rect off the edge of the screen — ${JSON.stringify(r)}`);
    }
    /* the stage screen deliberately layers a big GO panel between two arrows */
    if (name === 'stage') continue;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        const over = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        assert.ok(!over, `${name}: rects ${i} and ${j} overlap, so one is unclickable`);
      }
    }
  }
});

test('the title menu has one rect per item, in order', () => {
  const g = menuGame();
  const r = g.titleRects();
  assert.equal(r.length, g.menuItems.length);
  r.forEach((x, i) => assert.equal(x.i, i));
});

test('a click picks the title item under it, not the highlighted one', () => {
  const g = menuGame();
  g.menuIndex = 0;                                  // ARCADE is lit
  const versus = g.menuItems.indexOf('VERSUS');
  clickRect(g, menuRect(g, 'VERSUS'));                // but VERSUS is pressed
  assert.equal(g.menuIndex, versus);
  assert.equal(g.scene, 'select');
  assert.equal(g.settings.mode, 'versus');
});

test('a click reaches CONTROLS and OPTIONS, and comes back out again', () => {
  const g = menuGame();
  clickRect(g, menuRect(g, 'CONTROLS'));
  assert.equal(g.scene, 'controls');
  g.pointer.clicked = true; g.step();               // any click leaves
  assert.equal(g.scene, 'title');

  clickRect(g, menuRect(g, 'OPTIONS'));
  assert.equal(g.scene, 'options');
  const rows = g.optionRows();
  clickRect(g, g.optionRects(rows.length)[rows.length - 1]);   // BACK, the last row
  assert.equal(g.scene, 'title');
});

test('clicking an options row changes that row', () => {
  const g = menuGame();
  g.scene = 'options';
  const rows = g.optionRows();
  const i = rows.findIndex(r => r.label === 'ROUNDS TO WIN');
  g.settings.rounds = 1;
  clickRect(g, g.optionRects(rows.length)[i]);
  assert.equal(g.optIndex, i);
  assert.equal(g.settings.rounds, 2, 'the clicked row should have gone up');
});

test('a click picks a cat and a stage, and starts the match', () => {
  const g = menuGame();
  g.arcade = { step: 0, order: [] };
  clickRect(g, menuRect(g, 'ARCADE'));
  assert.equal(g.scene, 'select');

  clickRect(g, g.selectRects()[4]);                     // fifth cat
  assert.equal(g.select.cursor[0], 4);
  assert.equal(g.scene, 'reveal', 'locking a cat in should show its card');
  assert.equal(g.reveal.chr.id, CF.ROSTER[4].id);
  for (let f = 0; f < 30; f++) g.step();               // let the card arrive
  g.pointer.clicked = true; g.step();                  // then click past it
  assert.equal(g.scene, 'select');
  assert.equal(g.select.phase, 'stage', 'and then move on to the stage');

  const st = g.stageRects();
  const before = g.select.stage;
  clickRect(g, st.next);
  assert.notEqual(g.select.stage, before);

  clickRect(g, st.back);
  assert.equal(g.select.phase, 'chars');
  assert.equal(g.select.locked[0], false, 'backing out should unlock the cat');

  clickRect(g, g.selectRects()[0]);
  for (let f = 0; f < 30; f++) g.step();
  g.pointer.clicked = true; g.step();
  clickRect(g, g.stageRects().go);
  assert.equal(g.scene, 'fight');
  assert.equal(g.p1.chr.id, CF.ROSTER[0].id);
});

test('in versus the mouse moves on to whoever has not locked in', () => {
  const g = menuGame();
  clickRect(g, menuRect(g, 'VERSUS'));
  clickRect(g, g.selectRects()[2]);
  assert.equal(g.select.locked[0], true);
  assert.equal(g.select.locked[1], false);
  assert.equal(g.select.cursor[0], 2);

  clickRect(g, g.selectRects()[5]);                     // now driving player two
  assert.equal(g.select.locked[0], true);
  assert.equal(g.select.locked[1], true);
  assert.equal(g.select.cursor[1], 5);
  assert.equal(g.select.cursor[0], 2, 'player one must not be dragged along');
  assert.equal(g.select.phase, 'stage');
});

test('a pointer left resting on a menu does not fight the keyboard', () => {
  const g = menuGame();
  const ci = g.menuItems.indexOf('CONTROLS');
  hoverRect(g, menuRect(g, 'CONTROLS'));
  assert.equal(g.menuIndex, ci);

  g.pointer.moved = false;                          // the mouse now sits still
  g.menuIndex = 0;                                  // and the pad moves the cursor
  g.step();
  assert.equal(g.menuIndex, 0, 'a still mouse must not drag the cursor back');
});

test('the hand cursor appears over exactly the clickable rects', () => {
  const g = menuGame();
  const on = g.titleRects()[2];
  g.pointer.x = on.x + on.w / 2; g.pointer.y = on.y + on.h / 2;
  assert.ok(g.clickTargets().some(r => g.over(r)));
  g.pointer.y = 4;                                  // up by the logo
  assert.ok(!g.clickTargets().some(r => g.over(r)));

  g.scene = 'fight';
  assert.equal(g.clickTargets().length, 0, 'nothing is clickable mid-fight');
});

/* ---- how a cat is drawn --------------------------------------------------

   Two rules keep the figure looking like one creature rather than a pile of
   parts, and neither leaves a trace in the finished picture that a test could
   look at. Both are easy to break by accident — give a limb its own outline
   and it becomes a sticker on the chest; give a part its own flat colour and
   the light stops crossing the body. So the drawing is replayed against a
   context that records every call, and the rules are checked there.        */

import { recordingCtx } from './harness.mjs';

function drawn(chr, poseName) {
  const ctx = recordingCtx();
  const pose = CF.Pose[poseName || 'stand'];
  const j = CF.Rig.solve(pose, 1, chr.build);
  CF.Rig.drawCat(ctx, j, chr.palette, {});
  return ctx;
}

test('the contour goes down before any fill, so the silhouette is unbroken', () => {
  for (const chr of CF.ROSTER) {
    for (const pose of ['stand', 'fierce', 'hk', 'crouch']) {
      const ctx = drawn(chr, pose);
      const outline = chr.palette.outline || '#191410';
      const marks = ctx.ops.filter(o => o.op === 'fill' || o.op === 'stroke');
      const firstFill = marks.findIndex(o => o.op === 'fill');
      const before = marks.slice(0, firstFill);
      assert.ok(before.length >= 12,
        `${chr.id}/${pose}: only ${before.length} ops before the first fill — the contour ` +
        `pass is not covering the whole figure`);
      const stray = before.findIndex(o => o.op !== 'stroke' || o.style !== outline);
      assert.equal(stray, -1,
        `${chr.id}/${pose}: op ${stray} breaks into the contour pass — every part must be ` +
        `stroked in the contour colour before any of them is filled, or a limb ends up ` +
        `outlining itself and cutting the silhouette`);
    }
  }
});

/* The rig's own shading recipe, restated. If it changes there, this has to
   change with it — which is the point: the recipe is the contract. */
function mixHex(hex, other, amt) {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i++) {
    const v = Math.round(ch(hex, i) + (ch(other, i) - ch(hex, i)) * amt);
    out += (v < 16 ? '0' : '') + v.toString(16);
  }
  return out;
}
const SHADE_TO = '#2a2140';

/* Every cel-shaded part shows up as a shadow fill immediately followed by the
   base fill it was derived from. */
function shadedPairs(ctx) {
  const fills = ctx.ops.filter(o => o.op === 'fill' && typeof o.style === 'string');
  const pairs = [];
  for (let i = 0; i < fills.length - 1; i++) {
    const shadow = fills[i].style, base = fills[i + 1].style;
    if (base[0] === '#' && shadow === mixHex(base, SHADE_TO, 0.34)) pairs.push(base);
  }
  return pairs;
}

test('every part of the body is shaded by the same light', () => {
  /* Cel shading fills a part in shadow, then lays the base tone back over it
     shifted towards the light. The shadow tone is the base pushed towards one
     cool dark, the same one for every part and every cat — so a part shaded
     from a different lamp, or not shaded at all, fails here. It leaves no
     trace in the finished picture, which is why the drawing is replayed
     against a recording context instead. */
  for (const chr of CF.ROSTER) {
    const ctx = drawn(chr, 'stand');
    const pairs = shadedPairs(ctx);
    assert.ok(pairs.length >= 14,
      `${chr.id}: only ${pairs.length} parts are cel-shaded — a flat fill is a flat shape`);
    const tones = new Set(ctx.ops.filter(o => o.op === 'fill' && typeof o.style === 'string')
                                 .map(o => o.style));
    assert.ok(tones.size >= 10,
      `${chr.id}: only ${tones.size} tones on the whole figure — three per material is the point`);
  }
});

test('a flashing cat is drawn flat, with no shading at all', () => {
  const ctx = recordingCtx();
  const j = CF.Rig.solve(CF.Pose.stand, 1, CF.ROSTER[0].build);
  CF.Rig.drawCat(ctx, j, CF.ROSTER[0].palette, { flash: 'white' });
  assert.equal(shadedPairs(ctx).length, 0,
    'a white flash is a solid shape on purpose — no shading should survive it');
});

test('the tail tapers from the rump to the tip', () => {
  /* Sampled straight off the path builder: the widths it is asked for are the
     widths the silhouette gets, and a tail of constant width was the loudest
     wrong shape on the figure. */
  const j = CF.Rig.solve(CF.Pose.stand, 1, CF.ROSTER[0].build);
  const seen = [];
  const probe = {
    beginPath() {}, closePath() {}, moveTo() {}, arc() {},
    lineTo(x, y) { seen.push({ x, y }); }
  };
  CF.Rig.tailPath(probe, j, 6, 2);
  assert.ok(seen.length > 8, 'the tail outline should be built from samples');
});

/* ---- the character card --------------------------------------------------

   The card is where a player finds out what a special does and which buttons
   bring it out. A move that reaches the roster with no description, or with
   an input line that is empty on the scheme they happen to be playing, is a
   silent gap in the only documentation most people will ever read.        */

test('every cat card lists two specials and a super, all documented', () => {
  for (const chr of CF.ROSTER) {
    const rows = CF.Card.moveRows(chr);
    assert.equal(rows.length, 3, `${chr.id}: expected two specials and a super`);
    assert.equal(rows[2].big, true, `${chr.id}: the last row should be the super`);
    for (const r of rows) {
      assert.ok(r.name && r.name.length > 2, `${chr.id}: a move with no name`);
      assert.ok(r.desc && r.desc.length > 20,
        `${chr.id}/${r.name}: no description — nothing tells the player what it does`);
      assert.ok(/[.!]$/.test(r.desc), `${chr.id}/${r.name}: description is not a sentence`);
    }
  }
});

test('the card names the buttons for the scheme actually being played', () => {
  const was = CF.Input.getScheme();
  try {
    CF.Input.setScheme('simple');
    for (const chr of CF.ROSTER) {
      const rows = CF.Card.moveRows(chr);
      assert.equal(rows.map(r => r.input).join(' | '),
        'PUNCH + KICK | PUNCH + BLOCK | DODGE + LUNGE',
        `${chr.id}: the four-button scheme asks for every cat's moves the same way`);
    }
    CF.Input.setScheme('classic');
    for (const chr of CF.ROSTER) {
      for (const r of CF.Card.moveRows(chr)) {
        assert.ok(r.input && r.input.length > 2,
          `${chr.id}/${r.name}: no classic input`);
        assert.ok(!/undefined/.test(r.input),
          `${chr.id}/${r.name}: unnamed motion in "${r.input}"`);
      }
    }
  } finally {
    CF.Input.setScheme(was);
  }
});

test('the roster screen can be reached, browsed and left with the mouse', () => {
  const g = menuGame();
  clickRect(g, menuRect(g, 'ROSTER'));
  assert.equal(g.scene, 'roster');

  const start = g.roster.cat;
  clickRect(g, g.rosterRects().next);
  assert.notEqual(g.roster.cat, start, 'the next arrow should change cat');
  clickRect(g, g.rosterRects().prev);
  assert.equal(g.roster.cat, start, 'and the previous arrow should change it back');

  clickRect(g, g.rosterRects().rows[2]);
  assert.equal(g.roster.pick, 2, 'clicking a move row should select it');

  clickRect(g, g.rosterRects().back);
  assert.equal(g.scene, 'title');
});

test('every roster rect is on screen and the move rows do not overlap', () => {
  const g = menuGame();
  g.scene = 'roster';
  for (const chr of CF.ROSTER.keys()) {
    g.roster.cat = chr;
    const r = g.rosterRects();
    for (const rect of [r.prev, r.next, r.back].concat(r.rows)) {
      assert.ok(rect.x >= 0 && rect.y >= 0 &&
                rect.x + rect.w <= CF.STAGE.W && rect.y + rect.h <= CF.STAGE.H,
        `cat ${chr}: a roster rect off the edge — ${JSON.stringify(rect)}`);
    }
    for (let i = 0; i < r.rows.length - 1; i++) {
      assert.ok(r.rows[i].y + r.rows[i].h <= r.rows[i + 1].y,
        `cat ${chr}: move rows ${i} and ${i + 1} overlap`);
    }
  }
});

test('the options rows fit above the description strip', () => {
  const g = menuGame();
  const rows = g.optionRows();
  const rr = g.optionRects(rows.length);
  const stripTop = CF.STAGE.H - 50;
  for (const r of rr) {
    assert.ok(r.y >= 0 && r.x >= 0 && r.x + r.w <= CF.STAGE.W,
      `an option row is off the edge — ${JSON.stringify(r)}`);
    assert.ok(r.y + r.h <= stripTop,
      `option row ${r.i} runs into the description strip at y=${stripTop}`);
  }
  for (const row of rows) {
    assert.ok(row.desc && row.desc.length > 20,
      `${row.label}: no description — a settings screen that only names a thing ` +
      `makes the player guess, and half of these change how the game plays`);
    assert.ok(/[.!]$/.test(row.desc), `${row.label}: description is not a sentence`);
  }
});
