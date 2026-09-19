import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexCategories, pick, seriesRecord, normaliseEvent, readRecord, isTeam, canonicalKey, TEAMS } from './espn.mjs';

test('indexCategories flattens ESPN categories into name lookups', () => {
  const out = indexCategories([
    { name: 'passing', stats: [{ name: 'passingYards', value: 387, displayValue: '387', rank: 4 }] },
  ]);
  assert.equal(out.passing.passingYards.value, 387);
  assert.equal(out.passing.passingYards.display, '387');
  assert.equal(out.passing.passingYards.rank, 4);
});

test('a rank of 0 is not a rank', () => {
  // ESPN sends 0 for stats it does not rank. Rendering that as "0th" is worse
  // than showing nothing at all.
  const out = indexCategories([{ name: 'passing', stats: [{ name: 'x', value: 1, rank: 0 }] }]);
  assert.equal(out.passing.x.rank, null);
});

test('a missing stat reads as empty rather than throwing', () => {
  const out = indexCategories([]);
  assert.deepEqual(pick(out, 'passing', 'passingYards'), { value: null, display: null, rank: null });
  assert.deepEqual(pick(undefined, 'passing', 'passingYards'), { value: null, display: null, rank: null });
});

test('indexCategories survives junk', () => {
  assert.deepEqual(indexCategories(null), {});
  assert.deepEqual(indexCategories([{ name: 'passing' }]), { passing: {} });
});

test('seriesRecord counts only completed games', () => {
  const games = [
    { completed: true, winner: 'GB' },
    { completed: true, winner: 'BUF' },
    { completed: true, winner: 'GB' },
    { completed: false, winner: null },   // scheduled, not yet played
  ];
  const rec = seriesRecord(games, 'GB', 'BUF');
  assert.equal(rec.GB, 2);
  assert.equal(rec.BUF, 1);
  assert.equal(rec.played, 3, 'a fixture must not count as a meeting');
});

test('seriesRecord counts a tie as a tie, not a loss for both', () => {
  const rec = seriesRecord([{ completed: true, winner: null }], 'GB', 'LV');
  assert.equal(rec.ties, 1);
  assert.equal(rec.GB, 0);
  assert.equal(rec.LV, 0);
});

test('normaliseEvent reads home and away off homeAway, not order', () => {
  // The competitors array is NOT reliably [home, away] — reading it
  // positionally silently swaps the fixture round.
  const ev = {
    date: '2025-09-07T17:00Z',
    shortName: 'DET @ GB',
    competitions: [{
      status: { type: { completed: true } },
      competitors: [
        { team: { abbreviation: 'GB' }, score: '27', winner: true, homeAway: 'home' },
        { team: { abbreviation: 'DET' }, score: '13', winner: false, homeAway: 'away' },
      ],
    }],
  };
  const g = normaliseEvent(ev, 2025);
  assert.equal(g.home, 'GB');
  assert.equal(g.away, 'DET');
  assert.equal(g.homeScore, 27);
  assert.equal(g.awayScore, 13);
  assert.equal(g.winner, 'GB');
  assert.equal(g.season, 2025);
});

test('normaliseEvent handles a score sent as an object', () => {
  const ev = {
    competitions: [{
      status: { type: { completed: true } },
      competitors: [
        { team: { abbreviation: 'LV' }, score: { displayValue: '27' }, winner: true, homeAway: 'home' },
        { team: { abbreviation: 'BUF' }, score: { displayValue: '13' }, winner: false, homeAway: 'away' },
      ],
    }],
  };
  assert.equal(normaliseEvent(ev, 2026).homeScore, 27);
});

test('an unplayed game has no winner and is not completed', () => {
  const ev = {
    competitions: [{
      status: { type: { completed: false } },
      competitors: [
        { team: { abbreviation: 'GB' }, homeAway: 'home' },
        { team: { abbreviation: 'LV' }, homeAway: 'away' },
      ],
    }],
  };
  const g = normaliseEvent(ev, 2026);
  assert.equal(g.completed, false);
  assert.equal(g.winner, null);
  assert.equal(g.homeScore, null);
});

test('normaliseEvent returns null for anything that is not a two-team game', () => {
  assert.equal(normaliseEvent({}, 2026), null);
  assert.equal(normaliseEvent({ competitions: [{ competitors: [] }] }, 2026), null);
});

test('readRecord prefers the total line', () => {
  const rec = readRecord({ items: [
    { type: 'home', summary: '1-0', stats: [{ name: 'wins', value: 1 }] },
    { type: 'total', summary: '2-1', stats: [
      { name: 'wins', value: 2 }, { name: 'losses', value: 1 }, { name: 'differential', value: 15 },
    ] },
  ] });
  assert.equal(rec.summary, '2-1');
  assert.equal(rec.wins, 2);
  assert.equal(rec.differential, 15);
});

test('readRecord returns null rather than a fake record', () => {
  assert.equal(readRecord(null), null);
  assert.equal(readRecord({ items: [] }), null);
});

test('a franchise is recognised under every name it has played under', () => {
  // The Raiders were OAK until 2020. ESPN files those games under OAK, so
  // matching on LV alone reports twenty seasons of head-to-head as one game.
  const lv = TEAMS.find((t) => t.key === 'lv');
  assert.ok(isTeam(lv, 'LV'));
  assert.ok(isTeam(lv, 'OAK'), 'Oakland is the same franchise');
  assert.equal(isTeam(lv, 'GB'), false);
  assert.equal(isTeam(lv, null), false);
});

test('canonicalKey maps an abbreviation back to our own stable key', () => {
  assert.equal(canonicalKey('OAK'), 'lv');
  assert.equal(canonicalKey('LV'), 'lv');
  assert.equal(canonicalKey('GB'), 'gb');
  assert.equal(canonicalKey('KC'), null, 'a team we do not track is not ours');
  assert.equal(canonicalKey(null), null);
});

test('every team declares its own abbreviation among its aliases', () => {
  for (const t of TEAMS) {
    assert.ok(t.abbrs.includes(t.abbr), `${t.key} does not list its own abbreviation`);
    assert.ok(t.slug === t.slug.toLowerCase(), `${t.key} slug must be lowercase for the site API`);
  }
});
