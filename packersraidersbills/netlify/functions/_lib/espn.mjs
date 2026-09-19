// Shared helpers for talking to ESPN's public API.
//
// Everything in this file that can be pure IS pure, and is tested in
// espn.test.mjs. The network calls are the thin part on top. That split is
// deliberate: the shapes ESPN returns are awkward enough to get wrong
// quietly, and a wrong shape here shows up on the page as a blank stat
// rather than an error anybody notices.

export const TEAMS = [
  // ESPN's own numeric ids. These are stable; the abbreviations are what the
  // schedule endpoint uses to name competitors, so both are needed.
  // `slug` is the lowercase form the site API's /teams/{slug} path needs — it
  // answers 403 to the uppercase abbreviation. `abbr` is what the schedule
  // endpoint names competitors with, so both forms are required.
  //
  // `abbrs` is EVERY abbreviation the franchise has played under in the
  // window this site looks at. The Raiders were OAK until the 2020 move to
  // Las Vegas, and ESPN files those older games under OAK — so matching on
  // 'LV' alone silently drops every meeting before 2020 and reports a
  // twenty-season head-to-head series as a single game.
  { key: 'gb',  id: '9',  abbr: 'GB',  slug: 'gb',  abbrs: ['GB'],
    name: 'Green Bay Packers', color: '#204e32', alt: '#ffb612' },
  { key: 'lv',  id: '13', abbr: 'LV',  slug: 'lv',  abbrs: ['LV', 'OAK'],
    name: 'Las Vegas Raiders', color: '#0b0b0b', alt: '#a5acaf' },
  { key: 'buf', id: '2',  abbr: 'BUF', slug: 'buf', abbrs: ['BUF'],
    name: 'Buffalo Bills',     color: '#00338d', alt: '#d50a0a' },
];

export const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
export const SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

/**
 * Turn the core API's `splits.categories` into
 * { passing: { passingYards: {value, display, rank} }, ... }.
 *
 * ESPN nests stats inside named categories as arrays of objects, which means
 * every read is a .find() unless this is done once up front.
 */
export function indexCategories(categories) {
  const out = {};
  for (const cat of categories || []) {
    const bucket = (out[cat.name] ||= {});
    for (const s of cat.stats || []) {
      bucket[s.name] = {
        value: typeof s.value === 'number' ? s.value : null,
        display: s.displayValue ?? null,
        // rank is absent on stats ESPN does not rank, and 0 is never a real
        // rank, so both collapse to null rather than rendering as "0th".
        rank: s.rank ? Number(s.rank) : null,
      };
    }
  }
  return out;
}

/** Does this abbreviation belong to this team, under any name it has used? */
export function isTeam(team, abbr) {
  return !!abbr && (team.abbrs || [team.abbr]).includes(abbr);
}

/** Which of our teams, if any, does this abbreviation belong to? */
export function canonicalKey(abbr, teams = TEAMS) {
  return teams.find((t) => isTeam(t, abbr))?.key ?? null;
}

/** Read one stat out of an indexed set without throwing on a missing category. */
export function pick(indexed, category, name) {
  return indexed?.[category]?.[name] ?? { value: null, display: null, rank: null };
}

/**
 * Count a head-to-head series from schedule events.
 *
 * Only completed games count. A game still to be played has no winner and
 * would otherwise land in neither column while still inflating the meeting
 * count, which reads as a missing result rather than a fixture.
 */
export function seriesRecord(games, aAbbr, bAbbr) {
  const rec = { [aAbbr]: 0, [bAbbr]: 0, ties: 0, played: 0 };
  for (const g of games || []) {
    if (!g.completed) continue;
    rec.played++;
    if (g.winner === aAbbr) rec[aAbbr]++;
    else if (g.winner === bAbbr) rec[bAbbr]++;
    else rec.ties++;
  }
  return rec;
}

/**
 * Normalise one schedule event down to the few fields the page uses.
 * Returns null for anything that is not a two-team competition.
 */
export function normaliseEvent(event, season) {
  const comp = event?.competitions?.[0];
  if (!comp || !Array.isArray(comp.competitors) || comp.competitors.length !== 2) return null;

  const side = (c) => ({
    abbr: c.team?.abbreviation ?? null,
    score: scoreOf(c),
    winner: c.winner === true,
    home: c.homeAway === 'home',
  });
  const [x, y] = comp.competitors.map(side);
  const home = x.home ? x : y;
  const away = x.home ? y : x;
  const completed = comp.status?.type?.completed === true;
  const won = [x, y].find((s) => s.winner);

  return {
    date: event.date ?? null,
    season,
    name: event.shortName ?? null,
    home: home.abbr, away: away.abbr,
    homeScore: home.score, awayScore: away.score,
    completed,
    winner: completed ? (won?.abbr ?? null) : null,
  };
}

// A competitor's score arrives as a number, a string, or {displayValue}
// depending on which endpoint served it. All three have to survive.
function scoreOf(c) {
  const raw = c?.score;
  const v = raw && typeof raw === 'object' ? raw.displayValue ?? raw.value : raw;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Pull the numbers off a team's `record.items[type=total]`. */
export function readRecord(record) {
  const total = (record?.items || []).find((i) => i.type === 'total') || (record?.items || [])[0];
  if (!total) return null;
  const stat = (n) => {
    const s = (total.stats || []).find((x) => x.name === n);
    return s && Number.isFinite(s.value) ? s.value : null;
  };
  return {
    summary: total.summary ?? null,
    wins: stat('wins'), losses: stat('losses'), ties: stat('ties'),
    pointsFor: stat('pointsFor') ?? stat('avgPointsFor'),
    pointsAgainst: stat('pointsAgainst') ?? stat('avgPointsAgainst'),
    pointsForPerGame: stat('avgPointsFor'),
    pointsAgainstPerGame: stat('avgPointsAgainst'),
    differential: stat('differential'),
  };
}

// site.api.espn.com answers 403 to a request with NO User-Agent — not 401,
// not a rate limit, a flat 403 on every path. Node's fetch sends no UA by
// default, so without this every site.api call fails while the core.api ones
// (which do not care) keep working. That combination is nasty: the page still
// renders, with fallback colours and no records, and nothing logs an error.
// Verified 18 Sep 2026: identical request, UA the only difference, 403 -> 200.
const UA = 'Mozilla/5.0 (compatible; SportsTicker/1.0; +https://github.com/FarmhouseGetaways/SportsTicker)';

/** fetch + JSON with a timeout, so one slow upstream cannot hang the function. */
export async function getJson(url, { timeout = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: 'application/json', 'user-agent': UA },
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Settle every promise and drop the failures.
 *
 * One ESPN endpoint being down must never blank the whole page — a team card
 * with no quarterback on it is a far better outcome than an error screen
 * where the other two teams' numbers used to be.
 */
export async function allSettledValues(promises) {
  const settled = await Promise.allSettled(promises);
  return settled.map((s) => (s.status === 'fulfilled' ? s.value : null));
}
