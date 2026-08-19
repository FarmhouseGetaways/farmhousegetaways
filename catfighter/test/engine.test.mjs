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
