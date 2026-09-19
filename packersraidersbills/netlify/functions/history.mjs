// /api/history — the head-to-head series and season-by-season form.
//
// Split out from /api/stats deliberately. This reads ten seasons of schedules
// for three clubs, which is thirty upstream calls; the current-season numbers
// should not wait behind it. The page renders the live stats first and fills
// this in when it arrives.

import { TEAMS, SITE, getJson, normaliseEvent, seriesRecord, isTeam, canonicalKey } from './_lib/espn.mjs';

const SEASONS = 20;
const TTL_MS = 6 * 60 * 60 * 1000; // six hours; a completed season never changes
let cache = { at: 0, payload: null };

export default async () => {
  if (cache.payload && Date.now() - cache.at < TTL_MS) return respond(cache.payload, 'hit');
  try {
    const payload = await build();
    cache = { at: Date.now(), payload };
    return respond(payload, 'miss');
  } catch (err) {
    if (cache.payload) return respond({ ...cache.payload, stale: true }, 'stale');
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 502, headers: { 'content-type': 'application/json' },
    });
  }
};

function respond(payload, cacheState) {
  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=1800, s-maxage=21600, stale-while-revalidate=86400',
      'x-stats-cache': cacheState,
    },
  });
}

async function build() {
  const thisYear = seasonYear();
  const years = Array.from({ length: SEASONS }, (_, i) => thisYear - i).reverse();

  const jobs = [];
  for (const t of TEAMS) for (const year of years) jobs.push({ team: t, year });

  const results = await mapWithLimit(jobs, 6, async ({ team, year }) => {
    const data = await getJson(`${SITE}/teams/${team.id}/schedule?season=${year}`).catch(() => null);
    const games = (data?.events || []).map((e) => normaliseEvent(e, year)).filter(Boolean);
    return { team, year, games };
  });

  // Every game seen, deduplicated. Each meeting between two of our three
  // clubs appears on BOTH their schedules, so without this the series record
  // double-counts every fixture.
  const seen = new Map();
  for (const r of results) {
    for (const g of r.games) seen.set(`${g.season}|${g.date}|${g.home}|${g.away}`, g);
  }
  const all = [...seen.values()];

  return {
    generated: new Date().toISOString(),
    window: { from: years[0], to: years[years.length - 1], seasons: SEASONS },
    seasons: seasonForm(results, years),
    h2h: pairs().map(([a, b]) => head2head(all, a, b)),
  };
}

/**
 * Before September the current NFL season is still the previous calendar
 * year's, so asking for schedules by calendar year would fetch one season
 * that does not exist yet and miss the one just played.
 */
function seasonYear(now = new Date()) {
  return now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

function seasonForm(results, years) {
  const out = {};
  for (const t of TEAMS) {
    out[t.key] = years.map((year) => {
      const row = results.find((r) => r.team.key === t.key && r.year === year);
      let wins = 0, losses = 0, ties = 0, pointsFor = 0, pointsAgainst = 0, played = 0;
      for (const g of row?.games || []) {
        if (!g.completed) continue;
        const isHome = isTeam(t, g.home);
        const isAway = isTeam(t, g.away);
        if (!isHome && !isAway) continue;
        const us = isHome ? g.homeScore : g.awayScore;
        const them = isHome ? g.awayScore : g.homeScore;
        if (us == null || them == null) continue;
        played++;
        pointsFor += us;
        pointsAgainst += them;
        if (us > them) wins++;
        else if (us < them) losses++;
        else ties++;
      }
      return played
        ? { year, wins, losses, ties, played, pointsFor, pointsAgainst, differential: pointsFor - pointsAgainst }
        : { year, played: 0 };
    });
  }
  return out;
}

function pairs() {
  const out = [];
  for (let i = 0; i < TEAMS.length; i++) {
    for (let j = i + 1; j < TEAMS.length; j++) out.push([TEAMS[i], TEAMS[j]]);
  }
  return out;
}

function head2head(all, a, b) {
  const games = all
    .filter((g) => (isTeam(a, g.home) && isTeam(b, g.away)) || (isTeam(b, g.home) && isTeam(a, g.away)))
    .sort((x, y) => String(y.date).localeCompare(String(x.date)));

  // Count by our own stable key, never by the abbreviation on the day — a
  // 2019 win is filed under OAK and a 2023 win under LV, and they are the
  // same franchise's wins.
  const byKey = games.map((g) => ({ ...g, winner: canonicalKey(g.winner) }));
  const rec = seriesRecord(byKey, a.key, b.key);

  return {
    pair: [a.key, b.key],
    abbr: [a.abbr, b.abbr],
    record: { [a.key]: rec[a.key], [b.key]: rec[b.key], ties: rec.ties, played: rec.played },
    games,
  };
}

/** Run jobs with a ceiling on concurrency — thirty parallel calls is rude. */
async function mapWithLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}
