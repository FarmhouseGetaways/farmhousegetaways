/* ==========================================================================
   Carissa's workout tracker — the screens.

   Six of them, and one of them matters more than the other five: the player.
   Everything about it is arranged around a person standing up, slightly out of
   breath, holding a phone in one hand. One button, at the bottom, the size of
   a thumb. The set she is on is the brightest thing on the screen. The set
   after it is visibly waiting. Nothing asks her a question mid-workout.

   Routing is the URL hash, so the back button, a bookmark and the installed
   app all behave the way a person expects:

     #/               the week
     #/day/mon        one day, and what is in it
     #/go/mon         the player
     #/done/<id>      the summary of the workout just finished
     #/history        everything ever done
     #/edit/mon       the editor  (signed in only)
   ========================================================================== */

import * as store from "./store.js";
import {
  EFFORTS, effortLabel, metOf, sessionCalories, videoSource,
  clock, duration, plural, niceDate, todayKey, dayKeyOf,
  DAY_KEYS, DAY_NAMES, DAY_SHORT,
} from "./catalog.js";

/* ---------- little helpers ---------- */

const $ = (sel) => document.querySelector(sel);
const screen = $("#screen");
const bar = $("#bar");
const barIn = $("#bar-in");

/** Everything a person typed goes through this before it reaches the page. */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const isRest = (day) => !day.exercises.length;
const plannedSets = (day) => day.exercises.reduce((n, ex) => n + (ex.sets || 0), 0);

/** The estimate on a day card: what the owner typed, or the sum of the parts. */
function estimateMinutes(day) {
  if (day.minutes) return day.minutes;
  const seconds = day.exercises.reduce(
    (n, ex) => n + ex.sets * (45 + (ex.rest || 0)), 0);
  return Math.round(seconds / 60);
}

let toastTimer = null;
function toast(message, kind = "") {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast" + (kind ? ` toast--${kind}` : "");
  el.textContent = message;
  el.setAttribute("role", "status");
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 4200);
}

const go = (hash) => { location.hash = hash; };

/* ---------- the sheet ---------- */

function openSheet(title, html, wire) {
  $("#sheet-title").textContent = title;
  $("#sheet-body").innerHTML = html;
  $("#sheet").hidden = false;
  document.body.style.overflow = "hidden";
  if (wire) wire($("#sheet-body"));
}
function closeSheet() {
  $("#sheet").hidden = true;
  $("#sheet-body").innerHTML = "";
  document.body.style.overflow = "";
}
$("#sheet-close").addEventListener("click", closeSheet);
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });

/* ==========================================================================
   The week
   ========================================================================== */

function renderWeek() {
  const s = store.get();
  const today = dayKeyOf();
  const day = store.dayPlan(today);
  const week = store.weekOf();
  const stats = store.stats();
  const live = store.loadLive();

  const doneToday = week[today]?.done;

  const hero = isRest(day)
    ? `<div class="today ${doneToday ? "is-done" : ""}">
         <p class="eyebrow">Today &middot; ${DAY_NAMES[today]}</p>
         <h2 class="h-display">${day.title ? esc(day.title) : "Rest day"}</h2>
         <p class="muted">${day.description ? esc(day.description) : "Nothing scheduled. Rest is part of the plan."}</p>
         ${s.signedIn ? `<div class="btn-row" style="margin-top:1.1rem"><button class="btn" data-go="#/edit/${today}">Add a workout for today</button></div>` : ""}
       </div>`
    : `<div class="today ${doneToday ? "is-done" : ""}">
         <p class="eyebrow">Today &middot; ${DAY_NAMES[today]}</p>
         <h2 class="h-display">${esc(day.title || "Workout")}</h2>
         ${day.description ? `<p class="muted">${esc(day.description)}</p>` : ""}
         <p class="today__meta">
           <span>${plural(day.exercises.length, "exercise")}</span>
           <span>${plural(plannedSets(day), "set")}</span>
           <span>about ${estimateMinutes(day)} min</span>
         </p>
         <div class="btn-row">
           <button class="btn btn--go btn--big" data-go="#/go/${today}">
             ${live && live.day === today ? "Carry on where you left off" : doneToday ? "Do it again" : "Start the workout"}
           </button>
           <button class="btn" data-go="#/day/${today}">See the exercises</button>
         </div>
         ${doneToday ? `<p class="small" style="margin:.9rem 0 0;color:var(--sage)">&#10003; Done today &mdash; ${plural(week[today].sessions.length, "workout")} logged.</p>` : ""}
       </div>`;

  screen.innerHTML = `
    ${storageNotice()}
    ${hero}

    <h2 class="h-section">The week</h2>
    <div class="week">
      ${DAY_KEYS.map((key) => {
        const d = store.dayPlan(key);
        const rest = isRest(d);
        return `<button class="day ${key === today ? "is-today" : ""} ${rest ? "is-rest" : ""}" data-go="#/day/${key}">
          <span class="day__name">${DAY_SHORT[key]}${week[key]?.done ? `<span class="day__tick">&#10003;</span>` : ""}</span>
          <span class="day__title">${rest ? (d.title ? esc(d.title) : "Rest") : esc(d.title || "Workout")}</span>
          <span class="day__meta">${rest ? "&mdash;" : `${plural(d.exercises.length, "exercise")} &middot; ${estimateMinutes(d)} min`}</span>
        </button>`;
      }).join("")}
    </div>

    <h2 class="h-section">How it is going</h2>
    <div class="stats">
      <div class="stat stat--streak"><b class="stat__n">${stats.streak}</b><span class="stat__l">Day streak</span></div>
      <div class="stat"><b class="stat__n">${Object.values(week).filter((w) => w.done).length}</b><span class="stat__l">This week</span></div>
      <div class="stat"><b class="stat__n">${stats.workouts}</b><span class="stat__l">Workouts</span></div>
      <div class="stat stat--cal"><b class="stat__n">${stats.calories.toLocaleString()}</b><span class="stat__l">Calories</span></div>
    </div>
    <div class="btn-row" style="margin-top:.75rem">
      <button class="btn btn--ghost" data-go="#/history">See the whole record</button>
    </div>

    ${footer()}`;

  setTitle("Carissa", "The week");
  bar.hidden = true;
}

/* ==========================================================================
   One day
   ========================================================================== */

function renderDay(key) {
  const s = store.get();
  const day = store.dayPlan(key);
  const rest = isRest(day);

  screen.innerHTML = `
    <p class="eyebrow">${DAY_NAMES[key]}</p>
    <h2 class="h-display">${esc(day.title || (rest ? "Rest day" : "Workout"))}</h2>
    ${day.description ? `<p class="muted" style="white-space:pre-wrap">${esc(day.description)}</p>` : ""}

    ${rest ? `<p class="note" style="margin-top:1.25rem">Nothing is scheduled for ${DAY_NAMES[key]}.
        ${s.signedIn ? "Press <strong>Edit this day</strong> to add some exercises." : ""}</p>`
      : `<p class="today__meta">
           <span>${plural(day.exercises.length, "exercise")}</span>
           <span>${plural(plannedSets(day), "set")}</span>
           <span>about ${estimateMinutes(day)} min</span>
         </p>
         <ol class="ex-list">
           ${day.exercises.map((ex, i) => {
             const v = videoSource(ex.video);
             return `<li class="ex">
               <span class="ex__n">${i + 1}</span>
               <span class="ex__body">
                 <span class="ex__name">${esc(ex.name)}</span>
                 <span class="ex__meta">${ex.sets} &times; ${esc(ex.reps || "reps")}${ex.rest ? ` &middot; ${ex.rest}s rest` : ""} &middot; ${esc(effortLabel(ex.effort))}</span>
               </span>
               <span class="ex__badge">${v.kind === "none" ? "no video" : `<span class="has-video">&#9654; video</span>`}</span>
             </li>`;
           }).join("")}
         </ol>`}

    <div class="btn-row" style="margin-top:1.5rem">
      ${rest ? "" : `<button class="btn btn--go btn--big" data-go="#/go/${key}">Start the workout</button>`}
      ${s.signedIn ? `<button class="btn" data-go="#/edit/${key}">Edit this day</button>` : ""}
    </div>
    ${footer()}`;

  setTitle(DAY_NAMES[key], day.title || (rest ? "Rest day" : "Workout"));
  bar.hidden = true;
}

/* ==========================================================================
   The player

   `live` is the whole of the workout in progress and is written to the browser
   on every single change. A locked phone, a dropped call, a closed tab or a
   flat battery costs her nothing: reopening the app offers to carry on.
   ========================================================================== */

let tickTimer = null;
let wakeLock = null;

function newLive(key) {
  const day = store.dayPlan(key);
  const now = Date.now();
  return {
    id: store.uid("s"),
    day: key,
    title: day.title || DAY_NAMES[key],
    startedAt: new Date(now).toISOString(),
    startedMs: now,
    pausedTotal: 0,
    pausedAt: null,
    i: 0,
    setStart: now,
    restEnds: null,
    exercises: day.exercises.map((ex) => ({
      id: ex.id, name: ex.name, video: ex.video, effort: ex.effort,
      reps: ex.reps, rest: ex.rest, notes: ex.notes,
      setsPlanned: ex.sets, done: [], activeSec: 0,
    })),
  };
}

const liveElapsed = (live) => {
  const end = live.pausedAt || Date.now();
  return Math.max(0, Math.round((end - live.startedMs - live.pausedTotal) / 1000));
};

const liveSetsDone = (live) => live.exercises.reduce((n, ex) => n + ex.done.length, 0);
const livePlanned = (live) => live.exercises.reduce((n, ex) => n + ex.setsPlanned, 0);

/* A set that lasted twenty minutes means she put the phone down, not that she
   held a plank for twenty minutes. Charged at four minutes so a forgotten
   phone cannot invent five hundred calories. */
const SET_CAP_SEC = 240;

/* True while a player is actually on screen. The store must not repaint over
   a running workout — that would restart the video — but it MUST be allowed to
   paint the first one, which is the difference between this flag and asking
   whether the hash starts with #/go/. */
let playerPainted = false;

function renderPlayer(key) {
  /* Opened cold on a workout URL — a bookmark, a reload mid-session, the app
     restored by the phone. The plan is not in memory yet, and without this the
     day looks like a rest day and the app bounces to the day screen. Wait for
     the store; it re-renders the moment it has answered. */
  if (!store.get().loaded) {
    screen.innerHTML = `<p class="muted">Loading the workout…</p>`;
    bar.hidden = true;
    return;
  }

  let live = store.loadLive();

  // A workout in progress for a different day is offered rather than silently
  // thrown away — she may have started Tuesday's by mistake.
  if (live && live.day !== key) {
    const other = live;
    return askCarryOn(other, key);
  }
  if (!live) {
    const day = store.dayPlan(key);
    if (isRest(day)) { go(`#/day/${key}`); return; }
    live = newLive(key);
    store.saveLive(live);
  }

  paintPlayer(live);
  startTicking();
  keepAwake();
}

function askCarryOn(live, wantedKey) {
  screen.innerHTML = `
    <p class="eyebrow">Unfinished</p>
    <h2 class="h-display">${esc(live.title)}</h2>
    <p class="muted">There is a ${DAY_NAMES[live.day]} workout still going &mdash;
      ${plural(liveSetsDone(live), "set")} done, ${duration(liveElapsed(live))} in.</p>
    <div class="btn-row" style="margin-top:1.5rem">
      <button class="btn btn--go btn--big" data-go="#/go/${live.day}">Carry on with ${DAY_NAMES[live.day]}</button>
      <button class="btn" data-action="discard-live" data-day="${wantedKey}">Throw it away and start ${DAY_NAMES[wantedKey]}</button>
    </div>
    ${footer()}`;
  setTitle("Unfinished", "Pick one");
  bar.hidden = true;
}

function paintPlayer(live) {
  playerPainted = true;
  const ex = live.exercises[live.i];
  if (!ex) { finishWorkout(live); return; }

  const setNo = ex.done.length + 1;
  const resting = live.restEnds && live.restEnds > Date.now();
  const v = videoSource(ex.video);
  const totalDone = liveSetsDone(live);
  const totalPlanned = livePlanned(live);

  screen.innerHTML = `
    <div class="player">

      <div class="progress" aria-hidden="true">
        <div class="progress__bar" style="width:${totalPlanned ? (totalDone / totalPlanned) * 100 : 0}%"></div>
      </div>
      <p class="small dimmer" style="margin:-.5rem 0 0">
        Exercise ${live.i + 1} of ${live.exercises.length} &middot;
        ${totalDone} of ${totalPlanned} sets &middot;
        <span id="elapsed">${clock(liveElapsed(live))}</span>${live.pausedAt ? " &middot; paused" : ""}
      </p>

      <div class="stage ${v.kind === "file" || v.kind === "embed" ? "" : "is-empty"}" id="stage">
        ${stageHtml(v, live.pausedAt || resting)}
        <div class="rest" id="rest" ${resting ? "" : "hidden"}>
          <div class="rest__n" id="rest-n">${restLeft(live)}</div>
          <div class="rest__l">Rest &mdash; next up, set ${setNo}</div>
        </div>
      </div>

      <div>
        <h2 class="now__name">${esc(ex.name)}</h2>
        <p class="now__meta">
          Set ${Math.min(setNo, ex.setsPlanned)} of ${ex.setsPlanned}${ex.reps ? ` &middot; ${esc(ex.reps)}` : ""} &middot; ${esc(effortLabel(ex.effort))}
        </p>
        ${ex.notes ? `<p class="now__notes">${esc(ex.notes)}</p>` : ""}
        ${v.kind === "link" ? `<p class="small" style="margin:.6rem 0 0"><a href="${esc(v.src)}" target="_blank" rel="noopener">Open the video &rarr;</a></p>` : ""}
      </div>

      <ul class="sets" id="sets">
        ${Array.from({ length: ex.setsPlanned }, (_, n) => {
          const state = n < ex.done.length ? "is-done" : n === ex.done.length ? "is-now" : "";
          const label = n < ex.done.length ? clock(ex.done[n].sec)
            : n === ex.done.length ? (resting ? "resting" : "now") : "queued";
          return `<li class="set ${state}"><b>${n + 1}</b>${label}</li>`;
        }).join("")}
      </ul>

      <div>
        <p class="eyebrow" style="margin-top:.5rem">Still to come</p>
        <ul class="queue">
          ${live.exercises.map((e, n) => {
            const done = n < live.i || (n === live.i && e.done.length >= e.setsPlanned);
            const now = n === live.i;
            return `<li class="${done ? "is-done" : now ? "is-now" : ""}">
              <span class="queue__mark">${done ? "&#10003;" : now ? "&#9654;" : "&middot;"}</span>
              <span>${esc(e.name)} &mdash; ${e.done.length}/${e.setsPlanned}</span>
            </li>`;
          }).join("")}
        </ul>
      </div>

      <div class="btn-row" style="margin-top:.5rem">
        <button class="btn btn--ghost" data-action="skip-exercise">Skip this exercise</button>
        <button class="btn btn--ghost" data-action="pause">${live.pausedAt ? "Carry on" : "Pause"}</button>
        <button class="btn btn--ghost" data-action="finish">Finish now</button>
      </div>
    </div>`;

  barIn.innerHTML = resting
    /* The label is one element rather than three. `.btn` is a flex box with a
       gap, and a bare text node beside a <span> becomes its own flex item —
       which is how "Skip the rest — 60 s" grew two stray spaces. */
    ? `<button class="btn btn--big btn--go" data-action="skip-rest"><span>Skip the rest &mdash; <b id="rest-mini">${restLeft(live)}</b>s</span></button>`
    : live.pausedAt
      ? `<button class="btn btn--big" data-action="pause">Carry on</button>`
      : `<button class="btn btn--big btn--done" data-action="set-done">Set ${Math.min(setNo, ex.setsPlanned)} complete</button>`;
  bar.hidden = false;

  setTitle(live.title, `${DAY_NAMES[live.day]} &middot; in progress`);
}

function stageHtml(v, muteAutoplay) {
  if (v.kind === "file") {
    return `<video src="${esc(v.src)}" playsinline muted loop autoplay controls preload="metadata"></video>`;
  }
  if (v.kind === "embed") {
    return `<iframe src="${esc(muteAutoplay ? v.still : v.src)}" title="Exercise video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }
  return `<div class="stage__empty">
      <strong>No video for this one</strong>
      <span class="small">Add one from the editor and it plays here.</span>
    </div>`;
}

const restLeft = (live) =>
  live.restEnds ? Math.max(0, Math.ceil((live.restEnds - Date.now()) / 1000)) : 0;

/* The clock and the rest countdown are the only things that change on their
   own, so they are patched in place rather than repainting the screen — a
   repaint would restart the video every second. */
function startTicking() {
  stopTicking();
  tickTimer = setInterval(() => {
    const live = store.loadLive();
    if (!live || !location.hash.startsWith("#/go/")) { stopTicking(); return; }

    const elapsed = document.getElementById("elapsed");
    if (elapsed && !live.pausedAt) elapsed.textContent = clock(liveElapsed(live));

    if (live.restEnds) {
      const left = restLeft(live);
      const n = document.getElementById("rest-n");
      const mini = document.getElementById("rest-mini");
      if (n) n.textContent = left;
      if (mini) mini.textContent = left;
      if (left <= 0) {
        live.restEnds = null;
        live.setStart = Date.now();
        store.saveLive(live);
        beep();
        paintPlayer(live);
      }
    }
  }, 250);
}
function stopTicking() { clearInterval(tickTimer); tickTimer = null; releaseWake(); }

/** One short note when the rest is up. Silent if the browser will not have it. */
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.36);
    setTimeout(() => ctx.close(), 600);
    if (navigator.vibrate) navigator.vibrate(120);
  } catch { /* a silent app is fine; a broken one is not */ }
}

async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request("screen"); } catch { wakeLock = null; }
}
function releaseWake() { try { wakeLock?.release(); } catch { /* ignore */ } wakeLock = null; }
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && location.hash.startsWith("#/go/")) keepAwake();
});

/* ---------- the things the buttons do ---------- */

function setDone() {
  const live = store.loadLive();
  if (!live || live.pausedAt) return;
  const ex = live.exercises[live.i];
  if (!ex) return;

  const sec = Math.min(SET_CAP_SEC, Math.max(1, Math.round((Date.now() - live.setStart) / 1000)));
  ex.done.push({ at: new Date().toISOString(), sec });
  ex.activeSec += sec;

  const moreSets = ex.done.length < ex.setsPlanned;
  const moreExercises = live.i < live.exercises.length - 1;

  if (moreSets) {
    if (ex.rest > 0) live.restEnds = Date.now() + ex.rest * 1000;
    else live.setStart = Date.now();
  } else if (moreExercises) {
    live.i += 1;
    const next = live.exercises[live.i];
    if (ex.rest > 0) live.restEnds = Date.now() + ex.rest * 1000;
    else live.setStart = Date.now();
    toast(`${ex.name} done. Next: ${next.name}.`, "good");
  } else {
    store.saveLive(live);
    finishWorkout(live);
    return;
  }

  store.saveLive(live);
  paintPlayer(live);
}

function skipRest() {
  const live = store.loadLive();
  if (!live) return;
  live.restEnds = null;
  live.setStart = Date.now();
  store.saveLive(live);
  paintPlayer(live);
}

function skipExercise() {
  const live = store.loadLive();
  if (!live) return;
  if (live.i >= live.exercises.length - 1) { finishWorkout(live); return; }
  live.i += 1;
  live.restEnds = null;
  live.setStart = Date.now();
  store.saveLive(live);
  paintPlayer(live);
}

function togglePause() {
  const live = store.loadLive();
  if (!live) return;
  if (live.pausedAt) {
    const away = Date.now() - live.pausedAt;
    live.pausedTotal += away;
    live.setStart += away;                    // the paused minutes are not a set
    if (live.restEnds) live.restEnds += away;
    live.pausedAt = null;
  } else {
    live.pausedAt = Date.now();
  }
  store.saveLive(live);
  paintPlayer(live);
}

/* ---------- finishing ---------- */

async function finishWorkout(live) {
  stopTicking();
  const setsDone = liveSetsDone(live);

  // Nothing done is not a workout. Throw it away rather than putting a nought
  // in a record that is meant to be encouraging.
  if (!setsDone) {
    store.clearLive();
    toast("Nothing logged — no sets were done.");
    go("#/");
    return;
  }

  const settings = store.settings();
  const elapsedSec = liveElapsed(live);
  const session = {
    id: live.id,
    day: live.day,
    title: live.title,
    date: todayKey(),
    startedAt: live.startedAt,
    finishedAt: new Date().toISOString(),
    elapsedSec,
    activeSec: live.exercises.reduce((n, e) => n + e.activeSec, 0),
    setsPlanned: livePlanned(live),
    setsDone,
    weightLb: settings.weightLb,
    complete: setsDone >= livePlanned(live),
    exercises: live.exercises
      .filter((e) => e.done.length || e.setsPlanned)
      .map((e) => ({
        id: e.id, name: e.name, effort: e.effort, reps: e.reps,
        setsPlanned: e.setsPlanned, setsDone: e.done.length, activeSec: e.activeSec,
      })),
  };
  session.calories = sessionCalories(session, settings);

  store.clearLive();

  /* Logged before navigating, not after. logSession puts the workout into the
     store synchronously and only then goes to the network, so the summary
     screen is guaranteed to find it however fast the router runs. */
  const saving = store.logSession(session);
  go(`#/done/${session.id}`);

  const result = await saving;
  if (result.note) toast(result.note, result.ok ? "" : "bad");
  else if (result.storage === "server") toast("Logged, and saved to the server.", "good");
}

function renderSummary(id) {
  if (!store.get().loaded) { screen.innerHTML = `<p class="muted">Loading…</p>`; bar.hidden = true; return; }
  const session = store.history().sessions.find((s) => s.id === id);
  if (!session) { go("#/"); return; }
  const stats = store.stats();

  screen.innerHTML = `
    <p class="eyebrow">Workout complete</p>
    <h2 class="h-display">${esc(session.title)}</h2>
    <p class="summary__big">${session.calories} <span style="font-size:1.2rem;color:var(--dim)">calories</span></p>
    <p class="muted small">An estimate, from ${session.weightLb} lb, the effort of each exercise and how long it actually took.</p>

    <ul class="tally">
      <li><span>Time</span><b>${duration(session.elapsedSec)}</b></li>
      <li><span>Sets</span><b>${session.setsDone} of ${session.setsPlanned}</b></li>
      <li><span>Working time</span><b>${duration(session.activeSec)}</b></li>
      ${session.exercises.map((e) => `<li><span>${esc(e.name)}</span><b>${e.setsDone}/${e.setsPlanned} &middot; ${clock(e.activeSec)}</b></li>`).join("")}
    </ul>

    <div class="card" style="margin-top:1.5rem">
      <p class="eyebrow">And that makes</p>
      <div class="stats">
        <div class="stat stat--streak"><b class="stat__n">${stats.streak}</b><span class="stat__l">Day streak</span></div>
        <div class="stat"><b class="stat__n">${stats.workouts}</b><span class="stat__l">Workouts</span></div>
        <div class="stat stat--cal"><b class="stat__n">${stats.calories.toLocaleString()}</b><span class="stat__l">Calories</span></div>
      </div>
    </div>

    <div class="btn-row" style="margin-top:1.5rem">
      <button class="btn btn--go" data-go="#/">Back to the week</button>
      <button class="btn" data-go="#/history">See the record</button>
    </div>
    ${footer()}`;

  setTitle("Well done", niceDate(session.date));
  bar.hidden = true;
}

/* ==========================================================================
   History
   ========================================================================== */

let openRow = null;

function renderHistory() {
  const h = store.history();
  const stats = store.stats();
  const week = store.weekOf();
  const today = dayKeyOf();
  const pending = store.pendingCount();

  screen.innerHTML = `
    <p class="eyebrow">The record</p>
    <h2 class="h-display">Everything done</h2>

    ${pending ? `<p class="note note--warn">${plural(pending, "workout")} not yet on the server. It will go up on its own next time there is a connection.</p>` : ""}

    <div class="stats" style="margin-top:1.25rem">
      <div class="stat stat--streak"><b class="stat__n">${stats.streak}</b><span class="stat__l">Day streak</span></div>
      <div class="stat"><b class="stat__n">${stats.workouts}</b><span class="stat__l">Workouts</span></div>
      <div class="stat"><b class="stat__n">${stats.minutes.toLocaleString()}</b><span class="stat__l">Minutes</span></div>
      <div class="stat stat--cal"><b class="stat__n">${stats.calories.toLocaleString()}</b><span class="stat__l">Calories</span></div>
    </div>

    <h2 class="h-section">This week</h2>
    <div class="weekstrip">
      ${DAY_KEYS.map((k) => `<div class="${week[k].done ? "is-done" : ""} ${k === today ? "is-today" : ""}">
        ${DAY_SHORT[k]}<b>${week[k].done ? "&#10003;" : "&middot;"}</b></div>`).join("")}
    </div>

    <h2 class="h-section">${h.sessions.length ? plural(h.sessions.length, "workout") + " logged" : "Nothing logged yet"}</h2>
    ${h.sessions.length ? `<ul class="log">
      ${h.sessions.map((s) => `
        <li>
          <button class="log__row" data-action="toggle-log" data-id="${esc(s.id)}">
            <span>
              <span class="log__title">${esc(s.title)}${s.complete === false ? ` <span class="dimmer small">&middot; part done</span>` : ""}</span>
              <span class="log__when">${niceDate(s.date)} &middot; ${duration(s.elapsedSec)} &middot; ${plural(s.setsDone, "set")}</span>
            </span>
            <span class="log__num"><b>${s.calories}</b>cal</span>
          </button>
          ${openRow === s.id ? `<div class="log__detail">
            <ul class="tally">
              ${s.exercises.map((e) => `<li><span>${esc(e.name)}</span><b>${e.setsDone}/${e.setsPlanned} &middot; ${clock(e.activeSec)}</b></li>`).join("")}
              <li><span>Working time</span><b>${duration(s.activeSec)}</b></li>
              <li><span>Body weight used</span><b>${s.weightLb} lb</b></li>
            </ul>
            <div class="btn-row" style="margin-top:.9rem">
              <button class="btn btn--danger" data-action="delete-log" data-id="${esc(s.id)}">Remove this workout</button>
            </div>
          </div>` : ""}
        </li>`).join("")}
    </ul>` : `<p class="muted">Finish a workout and it lands here, with the time, the sets and the calories.</p>`}

    ${h.sessions.length ? `<div class="btn-row" style="margin-top:1.5rem">
      <button class="btn btn--ghost" data-action="export">Download the record</button>
    </div>` : ""}
    ${footer()}`;

  setTitle("Record", `${stats.workouts} workouts`);
  bar.hidden = true;
}

function exportHistory() {
  const h = store.history();
  const rows = [["date", "day", "title", "minutes", "sets done", "sets planned", "calories", "body weight lb"]];
  for (const s of h.sessions) {
    rows.push([s.date, s.day, s.title, Math.round(s.elapsedSec / 60), s.setsDone, s.setsPlanned, s.calories, s.weightLb]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `workouts-${todayKey()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ==========================================================================
   The editor — signed in only
   ========================================================================== */

let draft = null;

function renderEdit(key) {
  if (!store.get().signedIn) { askSignIn(`#/edit/${key}`); return; }
  if (!draft || draft.day !== key) draft = JSON.parse(JSON.stringify(store.dayPlan(key)));

  screen.innerHTML = `
    <p class="eyebrow">Editing &middot; ${DAY_NAMES[key]}</p>
    <h2 class="h-display">${esc(draft.title || "Untitled")}</h2>

    <div class="card" style="margin-top:1.25rem">
      <label class="field"><span>What the workout is called</span>
        <input type="text" id="f-title" value="${esc(draft.title)}" placeholder="Upper body and core" maxlength="120"></label>
      <label class="field"><span>Description</span>
        <textarea id="f-desc" placeholder="What it is for, anything she should know before starting." maxlength="1200">${esc(draft.description)}</textarea></label>
      <label class="field field--hint"><span>Estimated time, in minutes</span>
        <input type="number" id="f-mins" value="${draft.minutes || ""}" min="0" max="600" step="5" placeholder="${estimateMinutes(draft) || 30}">
        <small>Leave it empty and the app works it out from the sets and the rests.</small></label>
    </div>

    <h2 class="h-section">Exercises</h2>
    <div id="ex-editor">
      ${draft.exercises.map((ex, i) => exerciseEditor(ex, i, draft.exercises.length)).join("")
        || `<p class="muted">No exercises yet. Add the first one below.</p>`}
    </div>

    <div class="btn-row" style="margin-top:.5rem">
      <button class="btn" data-action="add-exercise">+ Add an exercise</button>
    </div>

    <div class="btn-row" style="margin-top:1.75rem">
      <button class="btn btn--go btn--big" data-action="save-day">Save ${DAY_NAMES[key]}</button>
      <button class="btn btn--ghost" data-action="cancel-day">Cancel</button>
    </div>
    ${draft.exercises.length ? `<div class="btn-row" style="margin-top:.6rem">
      <button class="btn btn--danger" data-action="clear-day">Make it a rest day</button></div>` : ""}
    ${footer()}`;

  setTitle("Editing", DAY_NAMES[key]);
  bar.hidden = true;
  wireEditor();
}

function exerciseEditor(ex, i, total) {
  return `<div class="edit-ex" data-i="${i}">
    <div class="edit-ex__head">
      <strong>${i + 1}. ${esc(ex.name || "New exercise")}</strong>
      <button type="button" class="mini" data-action="move-up" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Move up">&uarr;</button>
      <button type="button" class="mini" data-action="move-down" data-i="${i}" ${i === total - 1 ? "disabled" : ""} aria-label="Move down">&darr;</button>
      <button type="button" class="mini" data-action="remove-exercise" data-i="${i}" aria-label="Remove">&times;</button>
    </div>

    <label class="field"><span>Exercise</span>
      <input type="text" data-f="name" data-i="${i}" value="${esc(ex.name)}" placeholder="Goblet squat" maxlength="120"></label>

    <label class="field field--hint"><span>Video</span>
      <input type="url" data-f="video" data-i="${i}" value="${esc(ex.video)}" placeholder="https://youtu.be/… or videos/squat.mp4" maxlength="2000">
      <small>${videoHint(ex.video)}</small></label>

    <div class="field-row">
      <label class="field"><span>Sets</span>
        <select data-f="sets" data-i="${i}">
          ${Array.from({ length: 10 }, (_, n) => `<option value="${n + 1}" ${ex.sets === n + 1 ? "selected" : ""}>${n + 1}</option>`).join("")}
        </select></label>
      <label class="field"><span>Reps or time</span>
        <input type="text" data-f="reps" data-i="${i}" value="${esc(ex.reps)}" placeholder="12" maxlength="60"></label>
      <label class="field"><span>Rest, seconds</span>
        <input type="number" data-f="rest" data-i="${i}" value="${ex.rest}" min="0" max="900" step="15"></label>
    </div>

    <label class="field"><span>Effort &mdash; what the calorie estimate uses</span>
      <select data-f="effort" data-i="${i}">
        ${EFFORTS.map((e) => `<option value="${e.key}" ${ex.effort === e.key ? "selected" : ""}>${esc(e.label)}</option>`).join("")}
      </select></label>

    <label class="field"><span>Notes for her, shown while she does it</span>
      <textarea data-f="notes" data-i="${i}" placeholder="Keep the elbows in. Stop a rep short of failure." maxlength="600">${esc(ex.notes)}</textarea></label>
  </div>`;
}

function videoHint(url) {
  const v = videoSource(url);
  if (v.kind === "none") return "YouTube, Vimeo, Google Drive, or a file in workout/videos/.";
  if (v.kind === "embed") return `${v.provider} &mdash; plays in the app.`;
  if (v.kind === "file") return "A video file &mdash; plays in the app, and works with no signal once seen.";
  return "Not a video this can play. It will show as a link instead.";
}

/* Typing is written straight into the draft rather than being read back at
   save time, so a mis-tap on Back cannot lose half a form. */
function wireEditor() {
  screen.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "f-title") draft.title = t.value;
    else if (t.id === "f-desc") draft.description = t.value;
    else if (t.id === "f-mins") draft.minutes = Number(t.value) || 0;
    else if (t.dataset.f) {
      const ex = draft.exercises[Number(t.dataset.i)];
      if (!ex) return;
      const field = t.dataset.f;
      ex[field] = field === "sets" || field === "rest" ? Number(t.value) || 0 : t.value;
      if (field === "name") {
        const head = t.closest(".edit-ex")?.querySelector("strong");
        if (head) head.textContent = `${Number(t.dataset.i) + 1}. ${ex.name || "New exercise"}`;
      }
      if (field === "video") {
        const hint = t.parentElement.querySelector("small");
        if (hint) hint.innerHTML = videoHint(ex.video);
      }
    }
  });
}

async function saveDay() {
  const key = draft.day;
  draft.exercises = draft.exercises.filter((ex) => String(ex.name || "").trim());
  const next = {
    ...store.plan(),
    days: store.plan().days.map((d) => (d.day === key ? { ...draft } : d)),
  };
  try {
    const res = await store.savePlan(next);
    draft = null;
    toast(res.note || (res.storage === "server" ? "Saved. It is live for every device." : "Saved on this device."),
      res.storage === "server" ? "good" : "");
    go(`#/day/${key}`);
  } catch (err) {
    toast(err.message || "Could not save.", "bad");
  }
}

/* ==========================================================================
   Settings, signing in, and the notices
   ========================================================================== */

function settingsSheet() {
  const s = store.get();
  const set = store.settings();

  openSheet("Settings", `
    <label class="field field--hint"><span>Body weight, in pounds</span>
      <input type="number" id="s-weight" value="${set.weightLb}" min="40" max="700" step="1">
      <small>Only used for the calorie estimate. It is stored with each workout, so changing it does not rewrite the past.</small></label>

    <label class="field field--hint" style="display:flex;gap:.7rem;align-items:flex-start">
      <input type="checkbox" id="s-rest" ${set.countRest ? "checked" : ""} style="width:22px;height:22px;min-height:0;margin-top:.15rem;flex:0 0 auto">
      <span style="text-transform:none;letter-spacing:0;font-size:.92rem;font-weight:400;color:var(--dim)">
        Count the rest between sets. She is on her feet for it, so it counts by default.</span></label>

    <div class="btn-row" style="margin-bottom:1.25rem">
      <button class="btn btn--go" data-action="save-settings">Save</button>
    </div>

    <hr style="border:0;border-top:1px solid var(--line);margin:1.25rem 0">

    <p class="eyebrow">Where this is saved</p>
    ${s.mode === "server"
      ? (s.signedIn
        ? `<p class="note note--good">Signed in. The week and the record both save here and show up on every device.
             The record is private &mdash; reading it needs this password.</p>
           <div class="btn-row"><button class="btn btn--ghost" data-action="sign-out">Sign out</button></div>`
        : (s.hasPassword
          ? `<p class="note">The week is coming from the server. Sign in to see the record, log workouts to it, and edit the week.</p>
             <div class="btn-row"><button class="btn btn--go" data-action="sign-in">Sign in</button></div>`
          : `<p class="note note--warn">No password is set on this site yet, so nothing can be saved to it and
               the record stays on this phone. Add <strong>WORKOUT_PASSWORD</strong> in Netlify and redeploy.</p>`))
      : `<p class="note note--warn">Saving to this browser only.${s.note ? " " + esc(s.note) : ""}</p>
         ${s.signedIn
           ? `<p class="small muted">Editing is unlocked on this device. Changes stay here until the server is reachable.</p>
              <div class="btn-row"><button class="btn btn--ghost" data-action="sign-out">Lock editing</button></div>`
           : `<p class="small muted">The week can still be edited on this device with the password.</p>
              <div class="btn-row"><button class="btn" data-action="sign-in">Sign in to edit</button></div>`}`}

    ${s.signedIn ? `<p class="eyebrow" style="margin-top:1.5rem">Edit the week</p>
      <div class="week">
        ${DAY_KEYS.map((k) => `<button class="day" data-action="edit-day" data-day="${k}">
          <span class="day__name">${DAY_SHORT[k]}</span>
          <span class="day__title">${esc(store.dayPlan(k).title || "Rest")}</span></button>`).join("")}
      </div>` : ""}

    <p class="eyebrow" style="margin-top:1.5rem">Put it on the home screen</p>
    <p class="small muted">On an iPhone: Share, then <strong>Add to Home Screen</strong>. On Android: the menu, then
      <strong>Install app</strong>. It then opens without browser chrome and works in a gym with no signal.</p>
  `, (root) => {
    root.querySelector('[data-action="save-settings"]')?.addEventListener("click", async () => {
      await store.saveSettings({
        weightLb: Number(root.querySelector("#s-weight").value) || 150,
        countRest: root.querySelector("#s-rest").checked,
      });
      closeSheet();
      toast("Saved.", "good");
      render();
    });
  });
}

function askSignIn(returnTo) {
  openSheet("Sign in", `
    <p class="small muted" style="margin-bottom:1rem">The app's own password &mdash; <code>WORKOUT_PASSWORD</code> in
      Netlify. It unlocks editing the week, and it is what keeps the record private: nobody can read it without this.</p>
    <label class="field"><span>Password</span>
      <input type="password" id="s-key" autocomplete="current-password" enterkeyhint="go"></label>
    <div class="btn-row"><button class="btn btn--go btn--wide" data-action="do-sign-in">Sign in</button></div>
    <p class="small dimmer" style="margin-top:1rem">The week can be followed without signing in, and workouts done that
      way are kept on this phone and go up when you next sign in. Signing in is what shares them between devices.</p>
  `, (root) => {
    const input = root.querySelector("#s-key");
    const submit = async () => {
      const res = await store.signIn(input.value);
      if (!res.ok) { toast(res.error, "bad"); return; }
      closeSheet();
      toast("Signed in.", "good");
      if (returnTo) go(returnTo); else render();
    };
    root.querySelector('[data-action="do-sign-in"]').addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    setTimeout(() => input.focus(), 50);
  });
}

/** Said once, at the top of the week, and only when it is actually true. */
function storageNotice() {
  const s = store.get();
  if (s.mode === "server") return "";
  return `<p class="note note--warn">Working offline &mdash; this browser only.
    ${s.note ? esc(s.note) + " " : ""}The week and the workouts are safe here, and anything logged now goes up
    on its own when the app can reach its server again.</p>`;
}

function footer() {
  const s = store.get();
  return `<div class="foot">
    <p>${s.mode === "server"
        ? (s.signedIn ? "Signed in &middot; everything syncs" : "Reading the week from the server")
        : "This browser only"}
      &middot; <a href="#" data-action="open-settings">Settings</a></p>
    <p class="dimmer">Calories are an estimate from body weight, the effort of each exercise and how long it took. Treat them as a guide.</p>
  </div>`;
}

/* ==========================================================================
   Routing and the one click handler
   ========================================================================== */

function setTitle(main, sub) {
  $("#title").innerHTML = `${esc(main)}<span class="topbar__sub">${sub}</span>`;
  $("#back").hidden = location.hash === "" || location.hash === "#/";
}

function render() {
  const hash = location.hash || "#/";
  const [, route, arg] = hash.split("/");

  if (route !== "go") { stopTicking(); playerPainted = false; }
  if (route !== "edit") draft = null;

  if (route === "day" && DAY_KEYS.includes(arg)) return renderDay(arg);
  if (route === "go" && DAY_KEYS.includes(arg)) return renderPlayer(arg);
  if (route === "edit" && DAY_KEYS.includes(arg)) return renderEdit(arg);
  if (route === "done" && arg) return renderSummary(arg);
  if (route === "history") return renderHistory();
  return renderWeek();
}

window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });

$("#back").addEventListener("click", () => {
  if (history.length > 1) history.back(); else go("#/");
});
$("#history-btn").addEventListener("click", () => go("#/history"));
$("#settings-btn").addEventListener("click", settingsSheet);

/* One listener for the whole app. Everything that can be pressed says what it
   does in a data attribute, so a repaint never leaves a dead button behind. */
document.addEventListener("click", (e) => {
  const goTo = e.target.closest("[data-go]");
  if (goTo) { e.preventDefault(); go(goTo.dataset.go); return; }

  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action, id, i, day } = el.dataset;

  switch (action) {
    case "set-done": setDone(); break;
    case "skip-rest": skipRest(); break;
    case "skip-exercise": skipExercise(); break;
    case "pause": togglePause(); break;
    case "finish": {
      const live = store.loadLive();
      if (live) finishWorkout(live);
      break;
    }
    case "discard-live":
      store.clearLive();
      go(`#/go/${day}`);
      render();
      break;

    case "toggle-log":
      openRow = openRow === id ? null : id;
      renderHistory();
      break;
    case "delete-log":
      if (confirm("Remove this workout from the record? It cannot be undone.")) {
        store.deleteSession(id).then(() => { openRow = null; renderHistory(); toast("Removed."); });
      }
      break;
    case "export": exportHistory(); break;

    case "add-exercise":
      draft.exercises.push({
        id: store.uid("ex"), name: "", video: "", sets: 3, reps: "12",
        rest: 60, effort: "strength", notes: "",
      });
      renderEdit(draft.day);
      document.querySelector(".edit-ex:last-of-type input")?.focus();
      break;
    case "remove-exercise":
      draft.exercises.splice(Number(i), 1);
      renderEdit(draft.day);
      break;
    case "move-up":
      swap(draft.exercises, Number(i), Number(i) - 1);
      renderEdit(draft.day);
      break;
    case "move-down":
      swap(draft.exercises, Number(i), Number(i) + 1);
      renderEdit(draft.day);
      break;
    case "save-day": saveDay(); break;
    case "cancel-day": { const d = draft.day; draft = null; go(`#/day/${d}`); break; }
    case "clear-day":
      if (confirm("Clear every exercise and make this a rest day?")) {
        draft.exercises = [];
        saveDay();
      }
      break;

    case "edit-day": closeSheet(); go(`#/edit/${day}`); break;
    case "open-settings": e.preventDefault(); settingsSheet(); break;
    case "sign-in": closeSheet(); askSignIn(null); break;
    case "sign-out":
      closeSheet();
      store.signOut().then(() => { toast("Signed out."); render(); });
      break;
    default: break;
  }
});

function swap(arr, a, b) {
  if (b < 0 || b >= arr.length) return;
  [arr[a], arr[b]] = [arr[b], arr[a]];
}

/* A workout in progress must survive the app being closed, so the live state
   is written on the way out as well as on every set. */
window.addEventListener("pagehide", () => { releaseWake(); });

/* ---------- start ---------- */

store.subscribe(() => {
  // A repaint mid-workout would restart the video, so a player already on
  // screen looks after itself. One that has not been painted yet — a cold
  // start straight onto a workout URL — still needs this to draw it.
  if (location.hash.startsWith("#/go/") && playerPainted) return;
  render();
});

store.load().then(() => {
  render();
  const live = store.loadLive();
  if (live && !location.hash.startsWith("#/go/")) {
    toast(`${live.title} is still in progress — tap to carry on.`);
  }
});

render();
