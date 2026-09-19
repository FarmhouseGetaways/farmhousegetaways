import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaders, clock, CATEGORIES, QB, ALL_TEAM_METRICS } from './metrics.mjs';

test('higher wins when higher is better', () => {
  assert.deepEqual(leaders({ gb: 21, lv: 27, buf: 38 }, 'high'), ['buf']);
});

test('lower wins when lower is better', () => {
  // Interceptions thrown, sacks allowed, points conceded. Getting this
  // backwards crowns the worst team, and it looks authoritative doing it.
  assert.deepEqual(leaders({ gb: 1, lv: 3, buf: 2 }, 'low'), ['gb']);
});

test('a tie highlights everyone tied', () => {
  assert.deepEqual(leaders({ gb: 7, lv: 7, buf: 3 }, 'high').sort(), ['gb', 'lv']);
});

test('a missing stat never wins and never blocks a winner', () => {
  assert.deepEqual(leaders({ gb: null, lv: 24, buf: 17 }, 'high'), ['lv']);
  assert.deepEqual(leaders({ gb: null, lv: null, buf: null }, 'high'), []);
});

test('zero is a real value, not a missing one', () => {
  // A team really can have thrown 0 interceptions, and that should win a
  // lower-is-better row rather than being treated as absent.
  assert.deepEqual(leaders({ gb: 0, lv: 2, buf: 1 }, 'low'), ['gb']);
});

test('NaN and non-numbers are ignored', () => {
  // '30' arrives as a string from a stat ESPN did not parse; it must not win.
  assert.deepEqual(leaders({ gb: NaN, lv: '30', buf: 12 }, 'high'), []);
  assert.deepEqual(leaders({ gb: NaN, lv: 12, buf: 30 }, 'high'), ['buf']);
});

test('every metric declares a direction and a unique key', () => {
  const all = [...ALL_TEAM_METRICS, ...QB];
  const keys = new Set();
  for (const m of all) {
    assert.ok(m.better === 'high' || m.better === 'low', `${m.key} has no direction`);
    assert.ok(m.label, `${m.key} has no label`);
    assert.ok(!keys.has(m.key), `duplicate metric key ${m.key}`);
    keys.add(m.key);
    // Every metric reads either a stat category or the team record.
    assert.ok((m.cat && m.stat) || m.from === 'record', `${m.key} has no source`);
  }
});

test('the directions that are easy to get backwards are right', () => {
  const byKey = Object.fromEntries([...ALL_TEAM_METRICS, ...QB].map((m) => [m.key, m]));
  assert.equal(byKey.ints.better, 'low', 'throwing interceptions is bad');
  assert.equal(byKey.sacksTaken.better, 'low', 'being sacked is bad');
  assert.equal(byKey.papg.better, 'low', 'conceding points is bad');
  assert.equal(byKey.giveaways.better, 'low', 'giving the ball away is bad');
  assert.equal(byKey.takeaways.better, 'high', 'taking it away is good');
  assert.equal(byKey.stuffed.better, 'low', 'being stopped for a loss is bad');
  assert.equal(byKey.penaltyYds.better, 'low', 'penalties are bad');
  assert.equal(byKey.fumblesLost.better, 'low', 'losing fumbles is bad');
  assert.equal(byKey.sacksMade.better, 'high', 'making sacks is good');
  assert.equal(byKey.picks.better, 'high', 'taking the ball away is good');
  assert.equal(byKey.qbInt.better, 'low');
  assert.equal(byKey.qbSacks.better, 'low');
});

test('nobody leads a row where everybody is level', () => {
  // Defensive touchdowns in week 2 are 0-0-0. Highlighting all three as
  // joint leaders states nothing and looks like a rendering bug.
  assert.deepEqual(leaders({ gb: 0, lv: 0, buf: 0 }, 'high'), []);
  assert.deepEqual(leaders({ gb: 7, lv: 7, buf: 7 }, 'low'), []);
});

test('a two-of-three tie still highlights both', () => {
  assert.deepEqual(leaders({ gb: 1, lv: 1, buf: 0 }, 'high').sort(), ['gb', 'lv']);
});

test('one value against two blanks is not a comparison', () => {
  assert.deepEqual(leaders({ gb: 5, lv: null, buf: null }, 'high'), []);
});

test('season totals are flagged, rates are not', () => {
  const byKey = Object.fromEntries([...ALL_TEAM_METRICS, ...QB].map((m) => [m.key, m]));
  // Totals — meaningless to compare without knowing games played.
  for (const k of ['passTd', 'ints', 'sacksMade', 'tackles', 'qbYards', 'penaltyYds']) {
    assert.equal(byKey[k].count, true, `${k} is a season total and must be flagged`);
  }
  // Rates — already per game or a percentage, so directly comparable.
  for (const k of ['ppg', 'compPct', 'ypa', 'papg', 'qbRating']) {
    assert.ok(!byKey[k].count, `${k} is a rate and must not be flagged as a total`);
  }
});


test('every category has a title and at least one row', () => {
  const keys = new Set();
  for (const c of CATEGORIES) {
    assert.ok(c.title, `${c.key} has no title`);
    assert.ok(c.metrics.length > 0, `${c.key} is empty`);
    assert.ok(!keys.has(c.key), `duplicate category key ${c.key}`);
    keys.add(c.key);
  }
});

test('clock turns a second count into a time anybody reads', () => {
  // ESPN serves time of possession as raw seconds: "3448" is not a time.
  assert.equal(clock(3448), '57:28');
  assert.equal(clock(0), '0:00');
  assert.equal(clock(605), '10:05', 'seconds are zero-padded');
  assert.equal(clock(null), null);
  assert.equal(clock(-5), null);
  assert.equal(clock(NaN), null);
});
