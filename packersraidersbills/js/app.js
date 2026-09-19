/* SportsTicker — reads /api/stats and /api/history and draws the page.
   No framework, no build step, no dependencies. */

const REFRESH_MS = 60_000;

const $ = (id) => document.getElementById(id);

const state = { stats: null, history: null };

/**
 * Which statistic categories are open.
 *
 * This has to be remembered outside the DOM. The page redraws itself every 60
 * seconds, and a rebuilt <details> defaults to closed — so without this, any
 * category the reader opened would snap shut under them roughly once a minute.
 * Kept in localStorage too, so it survives a reload; wrapped because a private
 * window can throw on access rather than simply returning nothing.
 */
// Stored as a map of key -> open, NOT a list of open keys. The difference
// matters: a list cannot tell "the reader closed this" apart from "this
// category did not exist yet", so a category added later would never get its
// own default. Absent from the map means never seen, and only then does the
// category's own `open` apply.
const OPEN_KEY = 'prb-open-categories';
let openCats = null;

function loadOpen() {
  if (openCats) return openCats;
  openCats = new Map();
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    if (raw) for (const [k, v] of Object.entries(JSON.parse(raw))) openCats.set(k, !!v);
  } catch { /* private window, blocked storage — the defaults still apply */ }
  return openCats;
}

/** Whether this category should be drawn open, applying its default once. */
function startsOpen(cat) {
  const map = loadOpen();
  if (!map.has(cat.key)) map.set(cat.key, !!cat.open);
  return map.get(cat.key);
}

function rememberOpen() {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(Object.fromEntries(openCats)));
  } catch { /* nothing to do, and nothing worth telling the reader */ }
}

boot();

async function boot() {
  await loadStats();
  // The history endpoint reads twenty seasons of schedules, so it is fetched
  // second and drawn when it lands. The live numbers never wait for it.
  loadHistory();
  setInterval(loadStats, REFRESH_MS);
  // Refresh on return to the tab: a scoreboard left open for an hour is the
  // normal case, and stale scores are the whole failure mode of this page.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') loadStats();
  });
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats', { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`stats ${res.status}`);
    state.stats = await res.json();
    drawStats();
  } catch (err) {
    if (!state.stats) fail(err);
  }
}

async function loadHistory() {
  try {
    const res = await fetch('/api/history', { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`history ${res.status}`);
    state.history = await res.json();
    drawHistory();
  } catch {
    // The page is still fully useful without the historical sections, so a
    // failure here hides them rather than shouting about it.
  }
}

function fail(err) {
  const el = $('status');
  el.className = 'status error';
  el.textContent = `Could not load the statistics (${err.message}). They come from ESPN's public API — if that is down, this page has nothing to show. It will try again in a minute.`;
}

/* ------------------------------------------------------------------ colour */

/**
 * The colour a club is drawn in on a near-black page.
 *
 * Two problems, and they need different answers. Green Bay's green and
 * Buffalo's navy are dark but they ARE the club's colour, so they are
 * lightened until they read against the background and keep their hue. The
 * Raiders' primary is literally #000000 — there is no hue to lighten, only
 * grey — so that one falls back to the club's own silver.
 *
 * Dropping every dark primary to its secondary (the first version of this)
 * turned the Packers gold and the Bills red, which is legible and wrong.
 */
const MIN_LUM = 0.13;

function accent(team) {
  const primary = team.color || '#4a5a70';
  const { h, s, l } = hsl(primary);
  if (s < 0.12) return team.alt || '#a5acaf';   // black, white or grey: no hue to keep
  if (luminance(primary) >= MIN_LUM) return primary;

  let lift = l;
  while (lift < 0.62 && luminance(hslHex(h, s, lift)) < MIN_LUM) lift += 0.02;
  return hslHex(h, s, lift);
}

function hsl(hex) {
  const { r, g, b } = rgb(hex);
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return { h, s, l };
}

function hslHex(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function luminance(hex) {
  const { r, g, b } = rgb(hex);
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function rgb(hex) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

/** Black or white text on a given background, whichever is readable. */
function inkOn(hex) {
  return luminance(hex) > 0.35 ? '#0a0c10' : '#ffffff';
}

function themed(el, team) {
  const a = accent(team);
  el.style.setProperty('--team', a);
  el.style.setProperty('--team-ink', inkOn(a));
  // A pale accent floods much more strongly than a dark one at the same
  // percentage: the Raiders' silver washed out their whole column while the
  // Packers' green barely showed. Scale the tint to the colour's brightness.
  el.style.setProperty('--team-flood', luminance(a) > 0.3 ? '7%' : '14%');
  return el;
}

/* ------------------------------------------------------------------ format */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function ordinal(n) {
  if (!Number.isFinite(n)) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------- draw: stats */

function drawStats() {
  const d = state.stats;
  $('status').hidden = true;

  const week = d.season.week ? `Week ${d.season.week}` : d.season.type;
  $('season-text').textContent = `${d.season.year} ${d.season.type} · ${week} · updated ${new Date(d.generated).toLocaleTimeString()}`;
  $('season-line').querySelector('.dot').classList.toggle('stale', !!d.stale);

  drawTeams(d.teams);
  drawCategories(d.comparison.categories, d.teams);
  drawQbs(d.teams);
  drawCategory($('qb-cat'), {
    key: 'qb', title: 'Quarterback comparison', note: null, open: true,
    rows: d.comparison.qb,
  }, d.teams);
  drawTicker();

  for (const id of ['teams-section', 'cats-section', 'qb-section']) $(id).hidden = false;

  $('foot-meta').textContent = `Season ${d.season.year}. Read ${new Date(d.generated).toLocaleString()}${d.stale ? ' — serving the last good copy; the live read failed.' : ''}`;
}

function drawCategories(categories, teams) {
  const wrap = $('categories');
  wrap.textContent = '';
  for (const cat of categories) wrap.appendChild(buildCategory(cat, teams));
}

function drawCategory(wrap, cat, teams) {
  wrap.textContent = '';
  wrap.appendChild(buildCategory(cat, teams));
}

/**
 * One collapsible category. A real <details>, so it opens with a click or the
 * keyboard and still works with JavaScript disabled after the first paint —
 * no hand-rolled toggle to get wrong.
 */
function buildCategory(cat, teams) {
  const det = document.createElement('details');
  det.className = 'cat';
  det.open = startsOpen(cat);
  det.addEventListener('toggle', () => {
    openCats.set(cat.key, det.open);
    rememberOpen();
  });

  const sum = document.createElement('summary');
  sum.innerHTML = `
    <svg class="cat-arrow" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="cat-title">${esc(cat.title)}</span>
    <span class="cat-count">${cat.rows.length} stat${cat.rows.length === 1 ? '' : 's'}</span>`;
  det.appendChild(sum);

  const body = document.createElement('div');
  body.className = 'cat-body';
  if (cat.note) {
    const note = document.createElement('p');
    note.className = 'cat-note';
    note.textContent = cat.note;
    body.appendChild(note);
  }
  const rows = document.createElement('div');
  rows.className = 'rows';
  drawRows(rows, cat.rows, teams);
  body.appendChild(rows);
  det.appendChild(body);
  return det;
}

function drawTeams(teams) {
  const wrap = $('teams');
  wrap.textContent = '';
  for (const t of teams) {
    const r = t.record || {};
    const card = document.createElement('article');
    card.className = 'team-card';
    card.innerHTML = `
      ${t.logo ? `<img class="team-watermark" src="${esc(t.logo)}" alt="" width="150" height="150" loading="lazy">` : ''}
      <div class="team-top">
        ${t.logo ? `<img class="team-logo" src="${esc(t.logo)}" alt="" width="42" height="42" loading="lazy">` : ''}
        <div>
          <div class="team-abbr">${esc(t.abbr)}</div>
          <div class="team-name">${esc(t.displayName || t.name)}</div>
          <div class="team-standing">${esc(t.standing || '')}</div>
        </div>
      </div>
      <div class="record">
        <span class="record-big">${esc(r.summary || '—')}</span>
        <span class="record-label">record</span>
      </div>
      <div class="team-grid">
        ${kv('Points for / game', num(r.pointsForPerGame, 1))}
        ${kv('Points against / game', num(r.pointsAgainstPerGame, 1))}
        ${kv('Point differential', r.differential == null ? '—' : (r.differential > 0 ? '+' : '') + r.differential)}
        ${kv('Games played', statOf(t, 'general', 'gamesPlayed'))}
      </div>
      ${t.nextEvent ? `<p class="team-next">Next: <b>${esc(t.nextEvent.name || '')}</b> ${esc(shortDate(t.nextEvent.date))}</p>` : ''}
    `;
    wrap.appendChild(themed(card, t));
  }
}

const kv = (k, v) => `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`;

function num(v, dp = 0) {
  return Number.isFinite(v) ? v.toFixed(dp) : '—';
}

function statOf(team, cat, name) {
  return team.indexed?.[cat]?.[name]?.display ?? '—';
}

/**
 * One comparison table.
 *
 * The bar is scaled against the largest of the three values, so on a
 * lower-is-better row the leader is the SHORTEST bar — which is what the eye
 * expects for "fewest interceptions". The leader is also marked explicitly,
 * using the winner the API worked out, never a comparison made here.
 */
function drawRows(wrap, rows, teams) {
  wrap.textContent = '';

  const head = document.createElement('div');
  head.className = 'rows-head';
  head.innerHTML = `<div class="th-label"></div>` + teams.map((t) => (
    `<div class="th-team" style="--team:${esc(accent(t))}">` +
    (t.logo ? `<img class="th-logo" src="${esc(t.logo)}" alt="" width="20" height="20">` : '') +
    `<span>${esc(t.abbr)}</span>` +
    (Number.isFinite(t.gamesPlayed) ? `<span class="th-gp">${t.gamesPlayed} game${t.gamesPlayed === 1 ? '' : 's'}</span>` : '') +
    `</div>`
  )).join('');
  wrap.appendChild(head);

  for (const row of rows) {
    const nums = teams.map((t) => row.values[t.key]).filter((v) => Number.isFinite(v));
    const max = nums.length ? Math.max(...nums) : 0;
    const min = nums.length ? Math.min(...nums) : 0;
    const el = document.createElement('div');
    el.className = 'row';

    const label = document.createElement('div');
    label.className = 'row-label';
    // A season total is marked, because the three clubs have not played the
    // same number of games and comparing raw counts hides that.
    label.innerHTML = `<span>${esc(row.label)}</span>`
      + (row.better === 'low' ? '<span class="row-hint">fewer is better</span>' : '')
      + (row.count ? '<span class="row-hint" title="A season total — the clubs have played a different number of games">season total</span>' : '');
    el.appendChild(label);

    for (const t of teams) {
      const v = row.values[t.key];
      const display = row.displays[t.key];
      const rank = row.ranks?.[t.key];
      const lead = row.leaders.includes(t.key);
      const cell = document.createElement('div');
      cell.className = `cell${lead ? ' lead' : ''}${display == null ? ' empty' : ''}`;
      // Point differential and a quarterback's rushing yards both go
      // negative. Scaling by absolute value drew the WORST team the longest
      // bar, so when anything in the row is below zero the row is scaled
      // across its own range instead: lowest empty, highest full.
      const width = !Number.isFinite(v) ? 0
        : min < 0 ? (max === min ? 100 : Math.max(2, ((v - min) / (max - min)) * 100))
        : max > 0 ? Math.max(2, (v / max) * 100)
        : 0;
      cell.innerHTML = `
        <div class="cell-top">
          <span class="bar-val">${display == null ? '—' : esc(display) + esc(row.suffix || '')}</span>
          ${rank ? `<span class="rank">${esc(ordinal(rank))} in NFL</span>` : ''}
        </div>
        <div class="bar"><i style="width:${width}%"></i></div>
      `;
      el.appendChild(themed(cell, t));
    }
    wrap.appendChild(el);
  }
}

function drawQbs(teams) {
  const wrap = $('qbs');
  wrap.textContent = '';
  for (const t of teams) {
    if (!t.qb) continue;
    const card = document.createElement('article');
    card.className = 'qb-card';
    card.innerHTML = `
      ${t.qb.headshot ? `<img class="qb-shot" src="${esc(t.qb.headshot)}" alt="" width="62" height="62" loading="lazy">` : '<div class="qb-shot"></div>'}
      <div>
        <div class="qb-name">${esc(t.qb.name || '')}</div>
        <div class="qb-meta">${t.logo ? `<img class="qb-team-logo" src="${esc(t.logo)}" alt="" width="16" height="16" loading="lazy">` : ''}${esc(t.abbr)} · ${esc(t.qb.position || 'QB')}${t.qb.jersey ? ` · #${esc(t.qb.jersey)}` : ''}</div>
        ${t.qb.line ? `<div class="qb-line">${esc(t.qb.line)}</div>` : ''}
      </div>
    `;
    wrap.appendChild(themed(card, t));
  }
}

/* ----------------------------------------------------------- draw: history */

function drawHistory() {
  const h = state.history;
  const teams = state.stats?.teams;
  if (!h || !teams) return;

  const byKey = Object.fromEntries(teams.map((t) => [t.key, t]));

  $('h2h-note').textContent = `Every meeting since ${h.window.from}. Oakland-era games count as the Raiders.`;
  const wrap = $('h2h');
  wrap.textContent = '';

  for (const pair of h.h2h) {
    const [ak, bk] = pair.pair;
    const a = byKey[ak], b = byKey[bk];
    if (!a || !b) continue;
    const aw = pair.record[ak] || 0;
    const bw = pair.record[bk] || 0;
    const total = aw + bw + (pair.record.ties || 0);

    const card = document.createElement('article');
    card.className = 'h2h-card';
    card.style.setProperty('--a', accent(a));
    card.style.setProperty('--b', accent(b));
    card.innerHTML = `
      <div class="h2h-top">
        <span class="h2h-side">${a.logo ? `<img src="${esc(a.logo)}" alt="" width="26" height="26" loading="lazy">` : ''}${esc(a.abbr)}</span>
        <span class="h2h-v">VS</span>
        <span class="h2h-side">${esc(b.abbr)}${b.logo ? `<img src="${esc(b.logo)}" alt="" width="26" height="26" loading="lazy">` : ''}</span>
      </div>
      <div class="h2h-score">
        <b style="color:${esc(accent(a))}">${aw}</b><span class="sep">–</span><b style="color:${esc(accent(b))}">${bw}</b>
      </div>
      <div class="h2h-bar">
        <i style="width:${total ? (aw / total) * 100 : 50}%;background:${esc(accent(a))}"></i>
        <i style="width:${total ? (bw / total) * 100 : 50}%;background:${esc(accent(b))}"></i>
      </div>
      <p class="h2h-meta">${pair.record.played} meeting${pair.record.played === 1 ? '' : 's'} since ${h.window.from}${pair.record.ties ? `, ${pair.record.ties} tied` : ''}</p>
      <ul class="meetings">
        ${pair.games.slice(0, 6).map((g) => meetingRow(g, byKey)).join('')}
      </ul>
    `;
    wrap.appendChild(card);
  }
  $('h2h-section').hidden = false;

  drawSeasons(h, teams);
  drawTicker();
}

function meetingRow(g, byKey) {
  if (!g.completed) {
    return `<li><span class="yr">${esc(g.season)}</span><span>${esc(g.away)} @ ${esc(g.home)}</span><span class="sched">${esc(shortDate(g.date)) || 'scheduled'}</span></li>`;
  }
  const winner = Object.values(byKey).find((t) => (t.abbrs || [t.abbr]).includes(g.winner));
  const col = winner ? accent(winner) : '#3a4553';
  return `<li>
    <span class="yr">${esc(g.season)}</span>
    <span>${esc(g.away)} ${esc(g.awayScore)} @ ${esc(g.home)} ${esc(g.homeScore)}</span>
    <span class="res" style="background:${esc(col)};color:${esc(inkOn(col))}"><span>${winner?.logo ? `<img src="${esc(winner.logo)}" alt="" width="13" height="13" loading="lazy">` : ''}${esc(g.winner || 'TIE')}</span></span>
  </li>`;
}

function drawSeasons(h, teams) {
  const wrap = $('history');
  wrap.textContent = '';
  // One shared scale across all three clubs, or a 7-win season on one chart
  // would look the same height as a 13-win season on another.
  const allWins = Object.values(h.seasons).flat().filter((s) => s.played).map((s) => s.wins);
  const maxWins = Math.max(...allWins, 1);

  for (const t of teams) {
    const seasons = h.seasons[t.key] || [];
    const played = seasons.filter((s) => s.played);
    const wins = played.reduce((a, s) => a + s.wins, 0);
    const losses = played.reduce((a, s) => a + s.losses, 0);
    const ties = played.reduce((a, s) => a + (s.ties || 0), 0);

    const row = document.createElement('article');
    row.className = 'hist-row';
    row.innerHTML = `
      <div class="hist-head">
        ${t.logo ? `<img src="${esc(t.logo)}" alt="" width="24" height="24" loading="lazy">` : ''}
        <span class="hist-name">${esc(t.displayName || t.name)}</span>
        <span class="hist-summary">${wins}–${losses}${ties ? `–${ties}` : ''} across ${played.length} seasons</span>
      </div>
      <div class="seasons">
        ${seasons.map((s) => {
          if (!s.played) return `<div class="season-col none" title="${esc(s.year)}: no data"><span class="sb" style="height:4%"></span><span class="sy">${String(s.year).slice(2)}</span></div>`;
          const winning = s.wins > s.losses;
          return `<div class="season-col${winning ? ' winning' : ''}" title="${esc(s.year)}: ${s.wins}–${s.losses}${s.ties ? `–${s.ties}` : ''}">
            <span class="sr">${s.wins}–${s.losses}</span>
            <span class="sb" style="height:${(s.wins / maxWins) * 100}%"></span>
            <span class="sy">${String(s.year).slice(2)}</span>
          </div>`;
        }).join('')}
      </div>
    `;
    wrap.appendChild(themed(row, t));
  }
  $('history-note').textContent = `Bar height is wins in that season, on one scale across all three clubs. ${h.window.from}–${h.window.to}.`;
  $('history-section').hidden = false;
}

/* ------------------------------------------------------------ draw: ticker */

function drawTicker() {
  const d = state.stats;
  if (!d) return;
  const items = [];

  for (const g of d.live || []) {
    if (g.state === 'in') {
      const score = g.teams.map((t) => `${t.abbr} ${t.score ?? 0}`).join('  ');
      items.push({ team: null, html: `<span class="ticker-live">LIVE</span> <b>${esc(score)}</b> <span>${esc(g.detail || '')}</span>` });
    }
  }

  for (const t of d.teams) {
    const r = t.record || {};
    items.push({ team: t, html: `<b>${esc(r.summary || '—')}</b> <span>${esc(t.standing || '')}</span>` });
    items.push({ team: t, html: `<span>PF/g</span> <b>${esc(num(r.pointsForPerGame, 1))}</b> <span>· PA/g</span> <b>${esc(num(r.pointsAgainstPerGame, 1))}</b>` });
    if (t.qb) items.push({ team: t, html: `<span>${esc(t.qb.name)}</span> <b>${esc(t.qb.line || '')}</b>` });
    if (t.nextEvent) items.push({ team: t, html: `<span>Next</span> <b>${esc(t.nextEvent.name || '')}</b> <span>${esc(shortDate(t.nextEvent.date))}</span>` });
  }

  for (const pair of state.history?.h2h || []) {
    const [ak, bk] = pair.pair;
    items.push({ team: null, html: `<span>Series since ${esc(state.history.window.from)}</span> <b>${esc(pair.abbr[0])} ${pair.record[ak]}–${pair.record[bk]} ${esc(pair.abbr[1])}</b>` });
  }

  const html = items.map((it) => {
    const style = it.team ? ` style="--team:${esc(accent(it.team))};--team-ink:${esc(inkOn(accent(it.team)))}"` : '';
    const tag = it.team
      ? `<span class="ticker-tag"${style}><span>${it.team.logo ? `<img src="${esc(it.team.logo)}" alt="" width="15" height="15">` : ''}${esc(it.team.abbr)}</span></span>`
      : '';
    return `<li>${tag}${it.html}</li>`;
  }).join('');

  // Both copies always get the same markup. The second is aria-hidden and is
  // only there so the loop has no gap — see the comment in index.html.
  $('ticker-list').innerHTML = html;
  $('ticker-list-copy').innerHTML = html;
}
