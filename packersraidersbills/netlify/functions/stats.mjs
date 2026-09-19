// /api/stats — everything the page shows for the current season.
//
// This exists instead of the page calling ESPN directly for two reasons:
// ESPN's endpoints are not a documented CORS-friendly API, and one page load
// would otherwise be sixteen cross-origin requests. Here it is one request to
// our own origin, fanned out server-side and cached.

import {
  TEAMS, CORE, SITE, getJson, indexCategories, pick, readRecord, allSettledValues,
} from './_lib/espn.mjs';
import { CATEGORIES, QB, leaders, clock } from './_lib/metrics.mjs';

const TTL_MS = 120_000; // two minutes — live enough for a scoreboard, kind to ESPN
let cache = { at: 0, payload: null };

export default async () => {
  const fresh = cache.payload && Date.now() - cache.at < TTL_MS;
  if (fresh) return respond(cache.payload, 'hit');

  try {
    const payload = await build();
    cache = { at: Date.now(), payload };
    return respond(payload, 'miss');
  } catch (err) {
    // Serving yesterday's numbers beats serving an error page. Only when
    // there is nothing cached at all does this become a 502.
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
      'cache-control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600',
      'x-stats-cache': cacheState,
    },
  });
}

async function build() {
  const scoreboard = await getJson(`${SITE}/scoreboard`).catch(() => null);
  const season = readSeason(scoreboard);

  const teams = await Promise.all(TEAMS.map((t) => buildTeam(t, season.year)));

  return {
    generated: new Date().toISOString(),
    season,
    teams,
    live: liveGames(scoreboard),
    // The winner of each row is decided here, once, so the page cannot
    // disagree with itself about who is ahead.
    comparison: {
      categories: CATEGORIES.map((c) => ({
        key: c.key, title: c.title, note: c.note ?? null, open: !!c.open,
        rows: compare(c.metrics, teams),
      })),
      qb: compare(QB, teams, (t) => t.qb?.indexed),
    },
  };
}

function readSeason(scoreboard) {
  const league = scoreboard?.leagues?.[0];
  const year = league?.season?.year;
  return {
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    week: scoreboard?.week?.number ?? null,
    type: league?.season?.type?.name ?? 'Regular Season',
  };
}

async function buildTeam(team, year) {
  const base = `${CORE}/seasons/${year}/types/2/teams/${team.id}`;
  const [info, stats, lead] = await allSettledValues([
    getJson(`${SITE}/teams/${team.slug}`),
    getJson(`${base}/statistics`),
    getJson(`${base}/leaders`),
  ]);

  const t = info?.team ?? {};
  const indexed = indexCategories(stats?.splits?.categories);
  const record = readRecord(t.record);

  return {
    ...team,
    // ESPN serves each club's own colours. Preferring them over the hardcoded
    // pair means the page follows a rebrand without a commit; the constants in
    // espn.mjs are only the fallback for when this call fails.
    color: t.color ? `#${t.color}` : team.color,
    alt: t.alternateColor ? `#${t.alternateColor}` : team.alt,
    displayName: t.displayName ?? team.name,
    location: t.location ?? null,
    nickname: t.nickname ?? null,
    logo: pickLogo(t.logos),
    record,
    // Surfaced on its own because the comparison tables need it: a season
    // total means nothing without the number of games behind it.
    gamesPlayed: indexed?.general?.gamesPlayed?.value ?? null,
    standing: t.standingSummary ?? null,
    nextEvent: readNextEvent(t.nextEvent),
    indexed,
    qb: await buildQb(lead, year),
  };
}

function pickLogo(logos) {
  if (!Array.isArray(logos) || !logos.length) return null;
  // The page is dark, so prefer the logo ESPN marks for dark backgrounds.
  const dark = logos.find((l) => (l.rel || []).includes('dark'));
  return (dark || logos[0]).href ?? null;
}

function readNextEvent(nextEvent) {
  const ev = Array.isArray(nextEvent) ? nextEvent[0] : null;
  if (!ev) return null;
  return {
    name: ev.shortName ?? ev.name ?? null,
    date: ev.date ?? null,
    week: ev.week?.number ?? null,
    venue: ev.competitions?.[0]?.venue?.fullName ?? null,
  };
}

/** The passing leader is the starting quarterback in all but pathological cases. */
async function buildQb(lead, year) {
  const cats = lead?.categories || [];
  const passing = cats.find((c) => c.name === 'passingLeader') || cats.find((c) => c.name === 'passingYards');
  const ref = passing?.leaders?.[0]?.athlete?.$ref;
  if (!ref) return null;

  const id = String(ref).match(/athletes\/(\d+)/)?.[1];
  if (!id) return null;

  const [profile, stats] = await allSettledValues([
    getJson(cleanRef(ref)),
    getJson(`${CORE}/seasons/${year}/types/2/athletes/${id}/statistics`),
  ]);
  if (!profile) return null;

  return {
    id,
    name: profile.fullName ?? profile.displayName ?? null,
    jersey: profile.jersey ?? null,
    position: profile.position?.abbreviation ?? null,
    headshot: profile.headshot?.href ?? null,
    line: passing?.leaders?.[0]?.displayValue ?? null,
    indexed: indexCategories(stats?.splits?.categories),
  };
}

// The $ref values come back as http:// with query params; https is required
// from a Netlify function and the params are noise.
function cleanRef(ref) {
  return String(ref).replace(/^http:/, 'https:').split('?')[0];
}

/** Any of the three teams playing right now, for the ticker. */
function liveGames(scoreboard) {
  const ours = new Set(TEAMS.map((t) => t.abbr));
  const out = [];
  for (const ev of scoreboard?.events || []) {
    const comp = ev.competitions?.[0];
    const cs = comp?.competitors || [];
    if (!cs.some((c) => ours.has(c.team?.abbreviation))) continue;
    out.push({
      name: ev.shortName ?? null,
      state: comp?.status?.type?.state ?? null,       // pre | in | post
      detail: comp?.status?.type?.shortDetail ?? null,
      teams: cs.map((c) => ({
        abbr: c.team?.abbreviation ?? null,
        score: c.score != null ? Number(c.score) : null,
        home: c.homeAway === 'home',
      })),
    });
  }
  return out;
}

/**
 * Build one comparison row per metric: each team's value, and who leads.
 * `source` lets the QB rows read the quarterback's own stats with the same code.
 */
function compare(metrics, teams, source = (t) => t.indexed) {
  return metrics.map((m) => {
    const values = {};
    const displays = {};
    const ranks = {};
    for (const t of teams) {
      if (m.from === 'record') {
        const v = t.record?.[m.field];
        values[t.key] = Number.isFinite(v) ? v : null;
        displays[t.key] = Number.isFinite(v) ? v.toFixed(m.dp ?? 0) : null;
        ranks[t.key] = null;
        continue;
      }
      const s = pick(source(t), m.cat, m.stat);
      values[t.key] = s.value;
      // Time of possession arrives as a raw second count; "3448" is not a
      // time of possession anybody reads.
      displays[t.key] = m.format === 'clock' ? clock(s.value) : s.display;
      ranks[t.key] = s.rank;
    }
    return {
      key: m.key, label: m.label, better: m.better, suffix: m.suffix ?? '',
      count: !!m.count,
      values, displays, ranks,
      leaders: leaders(values, m.better),
    };
  });
}
