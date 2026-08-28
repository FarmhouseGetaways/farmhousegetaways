/* ==========================================================================
   Carissa's workout tracker — the screens.

   Six of them, and one of them matters more than the other five: the player.
   Everything about it is arranged around a person standing up, slightly out of
   breath, holding a phone in one hand. One button, at the bottom, the size of
   a thumb. The set she is on is the brightest thing on the screen. The set
   after it is visibly waiting. Nothing asks her a question mid-workout.

   Routing is the URL hash, so the back button, a bookmark and the installed
   app all behave the way a person expects:

     #/                    the week — this account's own, once signed in
     #/day/mon             one day, and what is assigned to it
     #/go/<assignment id>  the player
     #/done/<id>           the summary of the workout just finished
     #/history             everything ever done

   EDITING LIVES IN ITS OWN SCREENS, NOT ON TOP OF THESE ONES

   Rebuilt 28 Aug 2026. A day used to be its own editable form, in place,
   behind a pencil. It no longer is: an exercise's fields are set exactly
   once, in the exercise pool; a workout is built from pool exercises in the
   workout library; and a person's week is which workouts are assigned to
   them, on which day, at which time. All three are admin screens reached
   from Settings -> Edit the week, and every change on them saves
   immediately — there is no draft, and nothing to publish separately. The
   week and day screens above are read-only: what they show is the signed-in
   account's own resolved schedule.
   ========================================================================== */

import * as store from "./store.js";
import * as account from "./account.js";
import { upload, previewUrl } from "./media.js";
import * as library from "./library.js";
import * as exerciseLibrary from "./exercise-library.js";
import * as workoutLibrary from "./workout-library.js";
import * as assignments from "./assignments.js";
import * as push from "./push.js";
import { computeInsights, newlyEarned } from "./insights.js";
import {
  EFFORTS, effortLabel, sessionCalories, videoSource,
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

const plannedSets = (day) => day.exercises.reduce((n, ex) => n + (ex.sets || 0), 0);

/** The estimate on a day card: what the owner typed, or the sum of the parts. */
function estimateMinutes(day) {
  if (day.minutes) return day.minutes;
  const seconds = day.exercises.reduce(
    (n, ex) => n + ex.sets * (45 + (ex.rest || 0)), 0);
  return Math.round(seconds / 60);
}

/* ==========================================================================
   Admin

   Rebuilt 28 Aug 2026 (again) so admin-ness is a property of the ACCOUNT, not
   a password anyone who knew it could unlock in any browser. A short list of
   admin email addresses lives server-side (_lib/admin-emails.mjs — one
   address today, Cory's); sign in as one of those and the app already knows,
   from the same /api/account response that says who you are. Nobody else —
   not another signed-in account, not a signed-out visitor — ever sees an
   admin control at all.

   An admin's DEFAULT view is still just their own week, same as anyone else's
   — they are a person doing workouts too. What changes is a toggle at the top
   of the page (see the topbar admin button), switching between that and the
   admin view: the repositories, the roster, assigning workouts. The toggle is
   only ever a view preference, remembered in localStorage so it survives a
   reload — it is not a second lock, because the account sign-in already is
   one.
   ========================================================================== */

const ADMIN_VIEW_KEY = "fg-workout-admin-view";

/** Is the signed-in account one of the designated admin addresses? */
const canAdmin = () => !!store.get().account?.isAdmin;

/** Is the admin VIEW currently the one on screen? Always false for anyone
 * canAdmin() does not already allow — flipping this on for someone who is
 * not an admin account should be impossible, not just hidden. */
const adminOn = () => {
  if (!canAdmin()) return false;
  try { return localStorage.getItem(ADMIN_VIEW_KEY) === "1"; } catch { return false; }
};

const setAdminView = (on) => {
  try {
    if (on) localStorage.setItem(ADMIN_VIEW_KEY, "1");
    else localStorage.removeItem(ADMIN_VIEW_KEY);
  } catch { /* a browser that refuses storage simply stays on the normal view */ }
};

/* Set at startup to the promise of the first load. */
let ready = null;

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
/* A sheet may refuse to close. Settings sets one of these so that pressing the
   X, tapping the backdrop or hitting Escape with unsaved changes asks rather
   than throwing away what was typed. Returning false blocks the close; the
   guard is responsible for showing something useful when it does. */
let sheetGuard = null;

function closeSheet(force = false) {
  if (!force && sheetGuard && sheetGuard() === false) return;
  sheetGuard = null;
  pendingConfirm = null;
  $("#sheet").hidden = true;
  $("#sheet-body").innerHTML = "";
  document.body.style.overflow = "";
}
$("#sheet-close").addEventListener("click", () => closeSheet());
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });

/* ==========================================================================
   The week
   ========================================================================== */

function renderWeek() {
  const s = store.get();

  if (!s.account) {
    screen.innerHTML = `
      ${storageNotice()}
      <div class="today today--rest">
        <h2 class="today__title">Sign in to see your week</h2>
        <p class="today__desc">See what's on your schedule and get moving.</p>
        <div class="btn-row" style="margin-top:1.1rem">
          <button class="btn btn--go btn--big btn--wide" data-go="#/login">Sign In</button>
        </div>
        <p class="small dimmer" style="margin-top:.85rem">New here?
          <button type="button" class="btn--link" data-go="#/signup">Create an account</button></p>
      </div>
      ${footer()}`;
    setTitle("Carissa", "");
    bar.hidden = true;
    return;
  }

  const today = dayKeyOf();
  const week = store.weekSchedule();
  const todays = week[today] || [];
  const doneWeek = store.weekOf();
  const stats = store.stats();
  const live = store.loadLive();
  const doneToday = doneWeek[today]?.done;

  /* The card is pressed by a real <button> stretched across it, not by a click
     listener on the div. A div only receives taps because of a CSS cursor and a
     delegated listener, which is fragile on a phone; a button is a button
     everywhere, gets the keyboard for free, and tells a screen reader what it
     does. */
  const hero = !todays.length
    ? `<div class="today today--rest today--go">
         <button class="today__hit" data-go="#/day/${today}" aria-label="Open ${DAY_NAMES[today]}"></button>
         <p class="today__badge">Today &middot; ${DAY_NAMES[today]}</p>
         <h2 class="today__title">Off</h2>
         <p class="today__desc">Nothing scheduled. Rest is part of the plan.</p>
       </div>`
    : todays.map((item) => {
        const w = item.workout;
        if (!w) return `<div class="today today--rest"><p class="today__badge">${plainClock(item.time)}</p>
          <h2 class="today__title">Missing</h2>
          <p class="today__desc">A workout was assigned here and has since been removed.</p></div>`;
        const isLive = live && live.assignmentId === item.id;
        return `<div class="today today--go ${doneToday ? "is-done" : ""}">
         <button class="today__hit" data-go="#/go/${item.id}"
           aria-label="${isLive ? "Carry on" : "Start"} ${esc(w.title || "this workout")}"></button>
         <p class="today__badge">${todays.length > 1 ? `${plainClock(item.time)} &middot; ` : ""}Today &middot; ${DAY_NAMES[today]}</p>
         <h2 class="today__title">${esc(w.title || "Workout")}</h2>
         ${w.image ? `<img class="today__shot" src="${esc(w.image)}" alt="">` : ""}
         ${w.description ? `<p class="today__desc">${esc(w.description)}</p>` : ""}
         <p class="today__meta">
           <span class="chip">${plural(w.exercises.length, "exercise")}</span>
           <span class="chip">${plural(plannedSets(w), "set")}</span>
           <span class="chip">${estimateMinutes(w)} min</span>
         </p>
         <div class="btn-row">
           <button class="btn btn--go btn--big" data-go="#/go/${item.id}">
             ${isLive ? "Carry on where you left off" : "Start the workout"}
           </button>
           <button class="btn" data-go="#/day/${today}">See the exercises</button>
         </div>
       </div>`;
      }).join("");

  screen.innerHTML = `
    ${storageNotice()}
    ${hero}
    ${doneToday ? `<p class="today__done" style="margin-top:.5rem">&#10003; Done today &mdash;
        ${plural(doneWeek[today].sessions.length, "workout")} logged.</p>` : ""}

    <h2 class="h-section">The week</h2>
    <div class="week">
      ${DAY_KEYS.map((key) => {
        const items = week[key] || [];
        const rest = !items.length;
        const first = items[0]?.workout;
        const label = items.length > 1 ? `${items.length} workouts` : (first?.title || "Workout");
        return `<button class="day ${key === today ? "is-today" : ""} ${rest ? "is-rest" : ""}" data-go="#/day/${key}">
          <span class="day__name">${DAY_SHORT[key]}${doneWeek[key]?.done ? `<span class="day__tick">&#10003;</span>` : ""}</span>
          ${first?.image ? `<img class="day__shot" src="${esc(first.image)}" alt="" loading="lazy">` : ""}
          <span class="day__title">${rest ? "Off" : esc(label)}</span>
          <span class="day__meta">${rest ? "Rest day" : plural(items.length, "workout")}</span>
        </button>`;
      }).join("")}
    </div>

    <h2 class="h-section">How it is going</h2>
    <div class="stats">
      <div class="stat stat--streak"><b class="stat__n">${stats.streak}</b><span class="stat__l">Day streak</span></div>
      <div class="stat"><b class="stat__n">${Object.values(doneWeek).filter((w) => w.done).length}</b><span class="stat__l">This week</span></div>
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
  if (!store.get().account) { go("#/"); return; }

  const items = store.weekSchedule()[key] || [];
  const rest = !items.length;

  screen.innerHTML = `
    <p class="eyebrow">${DAY_NAMES[key]}</p>
    <h2 class="h-display">${rest ? "Off" : plural(items.length, "workout")}</h2>

    ${rest ? `<p class="note" style="margin-top:1.25rem">Nothing is scheduled for ${DAY_NAMES[key]}.</p>`
      : items.map((item) => {
          const w = item.workout;
          if (!w) return `<div class="card" style="margin-top:1rem"><p class="muted">A workout assigned here
              has since been removed.</p></div>`;
          return `<div class="card" style="margin-top:1rem">
            ${w.image ? `<img class="day-hero" src="${esc(w.image)}" alt="" width="1600" height="900">` : ""}
            <p class="eyebrow" style="margin-top:${w.image ? ".9rem" : "0"}">${plainClock(item.time)}</p>
            <h3 class="h-section" style="margin:.2rem 0 .5rem">${esc(w.title || "Workout")}</h3>
            ${w.description ? `<p class="muted" style="white-space:pre-wrap">${esc(w.description)}</p>` : ""}
            <p class="today__meta">
              <span>${plural(w.exercises.length, "exercise")}</span>
              <span>${plural(plannedSets(w), "set")}</span>
              <span>about ${estimateMinutes(w)} min</span>
            </p>
            <ol class="ex-list">
              ${w.exercises.map((ex, i) => `<li class="ex">
                  ${thumb(ex)}
                  <span class="ex__body">
                    <span class="ex__name">${esc(ex.name)}</span>
                    <span class="ex__meta">${ex.sets} &times; ${esc(ex.reps || "reps")}${ex.rest ? ` &middot; ${ex.rest}s rest` : ""} &middot; ${esc(effortLabel(ex.effort))}</span>
                  </span>
                  <span class="ex__n">${i + 1}</span>
                </li>`).join("")}
            </ol>
            <div class="btn-row" style="margin-top:1rem">
              <button class="btn btn--go btn--big" data-go="#/go/${item.id}">Start the workout</button>
            </div>
          </div>`;
        }).join("")}
    ${footer()}`;

  setTitle(DAY_NAMES[key], rest ? "Off" : plural(items.length, "workout"));
  bar.hidden = true;
}

/* The little square beside an exercise: its own picture if it has one, a
   frame from nothing if it does not. Read-only — an exercise's media is only
   ever changed on the Exercise pool screen now. */
function thumb(ex) {
  const v = videoSource(ex.video);
  const has = ex.image || v.kind === "file" || v.kind === "embed";
  const inner = ex.image
    ? `<img src="${esc(ex.image)}" alt="" loading="lazy">`
    : v.kind !== "none"
      ? `<span class="thumb__play" aria-hidden="true">&#9654;</span>`
      : `<span class="thumb__none" aria-hidden="true">&middot;</span>`;
  return `<span class="thumb ${has ? "" : "is-empty"}" aria-hidden="true">${inner}</span>`;
}

/* ==========================================================================
   Editing

   Retired 28 Aug 2026. A day used to be its own editable form, with a
   pencil-pressed draft, a save bar, and exercises typed in place. All of
   that is gone: an exercise's fields are edited exactly once, in the
   exercise pool; a workout is built from pool exercises in the workout
   library; and a person's week is which workouts are assigned to them, on
   which day, at which time — see renderAdminAssign(),
   renderAdminWorkoutEdit() and renderAdminExercises() above. Nothing on
   the week or day screen is editable in place any more; admin work happens
   entirely in Settings -> Edit the week.
   ========================================================================== */
function videoHint(url) {
  const v = videoSource(url);
  if (v.kind === "none") return "YouTube, Vimeo or Google Drive &mdash; or leave it and use a picture instead.";
  if (v.kind === "embed") return `${v.provider} &mdash; plays in the app.`;
  if (v.kind === "file") return "A video file &mdash; plays in the app, and works with no signal once seen.";
  return "Not a video this can play. It would show as a link instead.";
}

/* Whichever pool list was loaded last, kept so a tap on one of its buttons can
   look the exercise up by id without asking the server again. Read by both
   this sheet and the admin roster screen. */
let poolCache = [];

/* Whichever workout list was loaded last — the roster screen and the detail
   screen both read it, same reasoning as poolCache above. */
let workoutCache = [];

/** "From the pool" on a workout being built — pick a saved exercise and its
 * id is appended to the workout's own list. Saved immediately; there is no
 * draft to publish separately. */
function workoutPoolSheet(workoutId) {
  const w = workoutCache.find((x) => x.id === workoutId);
  if (!w) return;

  openSheet("From the pool", `
    <p class="small muted" style="margin-bottom:.75rem">Pick a saved exercise to add it to
      ${esc(w.title || "this workout")}.</p>
    <div id="wk-pool-list"><p class="small muted">Loading&hellip;</p></div>
  `, (root) => {
    exerciseLibrary.list().then((res) => {
      if (!document.body.contains(root)) return;      // the sheet closed while this was in flight
      const box = root.querySelector("#wk-pool-list");
      if (!box) return;
      if (!res.ok) { box.innerHTML = `<p class="note note--warn">${esc(res.error)}</p>`; return; }
      poolCache = res.exercises;
      if (!poolCache.length) {
        box.innerHTML = `<p class="small muted">Nothing in the pool yet &mdash; add an exercise on the
          Exercise pool screen first.</p>`;
        return;
      }
      box.innerHTML = `<div class="video-lib">
        ${poolCache.map((ex) => `<button type="button" class="video-lib__item"
            data-action="wk-pool-pick" data-id="${esc(workoutId)}" data-exid="${esc(ex.id)}">
            <strong>${esc(ex.name)}</strong>
            <span class="dimmer small" style="display:block;margin-top:.15rem">${ex.sets} &times;
              ${esc(ex.reps || "reps")}${ex.rest ? ` &middot; ${ex.rest}s rest` : ""}</span>
          </button>`).join("")}
      </div>`;
    });
  });
}

/** The workout's own title, picture, description and minutes estimate —
 * separate from its exercise list, which is edited on the detail screen
 * itself with its own immediate add/remove/reorder actions. */
function workoutMetaSheet(id) {
  const w = workoutCache.find((x) => x.id === id);
  if (!w) return;

  openSheet(w.title || "Workout details", `
    <label class="field"><span>Title</span>
      <input type="text" id="wk-title" value="${esc(w.title)}" maxlength="120" placeholder="Push day"></label>

    <label class="field" style="margin-top:1rem"><span>Description</span>
      <textarea id="wk-description" rows="3" maxlength="1200"
        placeholder="What it is for, and anything she should know before starting.">${esc(w.description)}</textarea></label>

    <p class="eyebrow" style="margin-top:1.25rem">Picture</p>
    <div class="media-now media-now--small" id="wk-image-preview">
      ${w.image ? `<img src="${esc(w.image)}" alt="">` : `<div class="media-now__note dimmer">No picture</div>`}
    </div>
    <input type="hidden" id="wk-image-url" value="${esc(w.image)}">
    <input type="file" id="wk-image" accept="image/*" hidden>
    <div class="btn-row">
      <button type="button" class="btn" data-action="wk-choose-image">${w.image ? "Change the picture" : "Add a picture"}</button>
      ${w.image ? `<button type="button" class="btn btn--ghost" data-action="wk-drop-image">Remove</button>` : ""}
    </div>

    <p class="edit-inline" style="margin-top:1.25rem">
      About <input type="number" id="wk-minutes" value="${w.minutes || ""}" min="0" max="600" step="5"
        placeholder="worked out from the exercises"> minutes
      <span class="dimmer small">&mdash; leave it empty and the app works it out</span>
    </p>

    <div class="btn-row" style="margin-top:1.25rem">
      <button class="btn btn--go" data-action="workout-save-meta" data-id="${esc(id)}">Save</button>
    </div>
  `, (root) => {
    const input = root.querySelector("#wk-image");
    input?.addEventListener("change", async () => {
      const chosen = input.files?.[0];
      if (!chosen) return;
      toast("Sending…");
      try {
        const out = await upload(chosen);
        root.querySelector("#wk-image-url").value = out.url;
        root.querySelector("#wk-image-preview").innerHTML = `<img src="${esc(out.url)}" alt="">`;
        toast("Picture added.", "good");
      } catch (err) {
        toast(err.message, "bad");
      }
    });
  });
}

/**
 * "Are you sure?", sized for somebody out of breath holding a phone.
 *
 * A browser confirm() is a small dialog with small buttons at the top of the
 * screen — the worst possible shape mid-workout, and on some phones it is
 * suppressed entirely. This is the app's own sheet with two full-width
 * buttons, and the safe one is the easy one to hit.
 */
let pendingConfirm = null;

function askFirst({ title, body, yes, danger = true, onYes }) {
  pendingConfirm = onYes;
  openSheet(title, `
    <p class="muted" style="margin-bottom:1.5rem">${body}</p>
    <div class="btn-row">
      <button class="btn btn--big ${danger ? "btn--danger" : "btn--go"}" data-action="confirm-yes">${yes}</button>
    </div>
    <div class="btn-row" style="margin-top:.6rem">
      <button class="btn btn--big btn--go" data-action="confirm-no">No, keep going</button>
    </div>
  `);
}

/* ==========================================================================
   The player

   `live` is the whole of the workout in progress and is written to the browser
   on every single change. A locked phone, a dropped call, a closed tab or a
   flat battery costs her nothing: reopening the app offers to carry on.
   ========================================================================== */

let tickTimer = null;
let wakeLock = null;

/** `assignmentId` is one of this account's own — see store.findAssignment.
 * The exercises are copied in at this moment, not read again later, so a
 * pool edit mid-workout cannot change what she is partway through. */
function newLive(assignmentId) {
  const a = store.findAssignment(assignmentId);
  const w = a?.workout;
  const now = Date.now();
  return {
    id: store.uid("s"),
    assignmentId,
    workoutId: w?.id || "",
    day: a?.day || "",
    title: w?.title || "Workout",
    startedAt: new Date(now).toISOString(),
    startedMs: now,
    pausedTotal: 0,
    pausedAt: null,
    i: 0,
    setStart: now,
    restEnds: null,
    staleOk: false,
    exercises: (w?.exercises || []).map((ex) => ({
      id: ex.id, name: ex.name, video: ex.video, image: ex.image || "", effort: ex.effort,
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

/** `key` is an assignment id — see store.findAssignment. */
function renderPlayer(key) {
  /* Opened cold on a workout URL — a bookmark, a reload mid-session, the app
     restored by the phone. The schedule is not in memory yet, and without
     this it looks like a bad link and the app bounces to the week. Wait for
     the store; it re-renders the moment it has answered. */
  if (!store.get().loaded) {
    screen.innerHTML = `<p class="muted">Loading the workout…</p>`;
    bar.hidden = true;
    return;
  }

  let live = store.loadLive();

  /* A workout in progress is offered rather than resumed silently when it is
     not obviously the one she meant: a different assignment (she tapped
     Tuesday's by mistake), or one that has been running for hours (the phone
     went in a pocket and the workout never ended).

     The two combined — a different assignment AND hours old — is not
     "confirm before I lose something": there is nothing left on a session
     that stale to protect, so asking about it every single time another one
     is opened is the interruption that never goes away on its own. That
     combination clears it on the spot instead of asking. Stale on the SAME
     one still asks — that one really is "still running, or start over?" —
     and a different one that is NOT stale still asks too, because that one
     might be real progress worth not losing. */
  if (live && live.assignmentId !== key) {
    if (isStale(live)) { store.clearLive(); live = null; }
    else return askCarryOn(live, key);
  } else if (live && isStale(live)) {
    return askCarryOn(live, key);
  }
  if (!live) {
    const a = store.findAssignment(key);
    if (!a || !a.workout || !a.workout.exercises.length) { go("#/"); return; }
    live = newLive(key);
    store.saveLive(live);
  }

  paintPlayer(live);
  startTicking();
  keepAwake();
}

/* Six hours. Nobody trains for six hours, so past that the timer was forgotten
   rather than running.

   `staleOk` is set when somebody looks at that question and says carry on. It
   has to exist: without it, choosing to carry on re-rendered the very screen
   that was asking, over and over, because the workout is still just as old as
   it was a second ago. */
const STALE_MS = 6 * 60 * 60 * 1000;
const isStale = (live) => !live.staleOk && Date.now() - (live.startedMs || 0) > STALE_MS;

/** `wantedKey` is the assignment id she just tapped — possibly the same one
 * `live` already belongs to, possibly a different day's. */
function askCarryOn(live, wantedKey) {
  const stale = isStale(live);
  const liveDayName = DAY_NAMES[live.day] || "workout";

  screen.innerHTML = `
    <p class="eyebrow">${stale ? "Still running" : "Unfinished"}</p>
    <h2 class="h-display">${esc(live.title)}</h2>
    <p class="muted">${stale
      ? `This ${liveDayName} workout has been going for ${duration(liveElapsed(live))}, which
         usually means the timer was left running rather than the workout. ${plural(liveSetsDone(live), "set")}
         were done. Carrying on keeps counting from then; starting again begins from nought.`
      : `There is a ${liveDayName} workout still going &mdash;
         ${plural(liveSetsDone(live), "set")} done, ${duration(liveElapsed(live))} in.`}</p>
    <div class="btn-row" style="margin-top:1.5rem">
      ${stale
        /* Not a data-go. Getting here means the hash is ALREADY #/go/<id>, and
           assigning a hash its current value fires no hashchange at all — which
           is precisely why this button did nothing. */
        ? `<button class="btn btn--go btn--big" data-action="discard-live" data-id="${wantedKey}">Start this one fresh</button>
           <button class="btn" data-action="resume-live">Carry on the old one anyway</button>`
        : `<button class="btn btn--go btn--big" data-go="#/go/${live.assignmentId}">Carry on with ${liveDayName}</button>
           <button class="btn" data-action="discard-live" data-id="${wantedKey}">Throw it away and start this one</button>`}
    </div>
    ${footer()}`;
  setTitle(stale ? "Still running" : "Unfinished", "Pick one");
  bar.hidden = true;
}

/* Which exercise's media is currently in the DOM, and the node itself.
   Repainting the player rebuilds the whole screen, and rebuilding a <video> or
   an <iframe> restarts it from the beginning. That happened on every single
   set — the demonstration jumped back to the start each time she finished one —
   and it is also why Pause appeared to reload the video rather than pause it.
   The media node is now lifted out and put back whenever the exercise has not
   changed. */
let mountedKey = null;
let mountedMedia = null;

const MEDIA_SEL = "video, iframe, .stage__still, .stage__empty";

function paintPlayer(live) {
  playerPainted = true;
  const ex = live.exercises[live.i];
  if (!ex) { finishWorkout(live); return; }

  const key = `${live.id}:${live.i}`;
  const keep = key === mountedKey && mountedMedia ? mountedMedia : null;

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

      <div class="stage ${v.kind === "file" || v.kind === "embed" || ex.image ? "" : "is-empty"}" id="stage">
        ${stageHtml(ex, live.pausedAt || resting)}
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

      <!-- Every box the same size, whatever it says inside it. Seven or more
           on one row stops trying to fit a time in and shows a tick instead,
           because a squashed "0:45" is worse than a mark that means done. -->
      <ul class="sets ${ex.setsPlanned >= 7 ? "sets--tight" : ""}" id="sets">
        ${Array.from({ length: ex.setsPlanned }, (_, n) => {
          const done = n < ex.done.length;
          const state = done ? "is-done" : n === ex.done.length ? "is-now" : "";
          const label = done ? clock(ex.done[n].sec)
            : n === ex.done.length ? (resting ? "Rest" : "Now") : "";
          return `<li class="set ${state}"><b>${n + 1}</b><i>${label}</i><u aria-hidden="true">&#10003;</u></li>`;
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

  const stage = document.getElementById("stage");
  const fresh = stage?.querySelector(MEDIA_SEL);
  if (keep && fresh) {
    // Same exercise: put the element that is already playing back in place of
    // the freshly built one, so it never restarts.
    fresh.replaceWith(keep);
  } else {
    mountedMedia = fresh || null;
  }
  mountedKey = key;
  /* Moving a media element through a repaint pauses it — the browser stops
     anything detached from the document. So the true state is applied after
     the move, never before it, or Carry on would play the video and the
     repaint would immediately stop it again. */
  setMediaPaused(!!live.pausedAt);

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

function stageHtml(ex, muteAutoplay) {
  const v = videoSource(ex.video);
  if (v.kind === "file") {
    // The picture, when there is one, is the poster — so the stage shows the
    // movement rather than a black rectangle while the video loads.
    return `<video src="${esc(v.src)}" ${ex.image ? `poster="${esc(ex.image)}"` : ""}
      playsinline muted loop autoplay controls preload="metadata"></video>`;
  }
  if (v.kind === "embed") {
    return `<iframe src="${esc(muteAutoplay ? v.still : v.src)}" title="Exercise video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }
  // No video, but a picture is a perfectly good demonstration of a position.
  if (ex.image) return `<img class="stage__still" src="${esc(ex.image)}" alt="${esc(ex.name)}">`;
  return `<div class="stage__empty">
      <strong>No video for this one</strong>
      <span class="small">Add a picture or a clip from the pencil and it shows here.</span>
    </div>`;
}

/**
 * Stop the demonstration, or start it again.
 *
 * A file plays through the browser and simply pauses. YouTube and Vimeo sit in
 * an iframe on somebody else's origin, so the only way to reach them is the
 * message channel their players listen on — which is why the embed URL now
 * carries enablejsapi. Both message shapes are sent every time; the player
 * that is not listening for one ignores it, which is cheaper than working out
 * which provider is on screen.
 */
function setMediaPaused(paused) {
  const stage = document.getElementById("stage");
  if (!stage) return;

  const video = stage.querySelector("video");
  if (video) {
    if (paused) video.pause();
    else video.play().catch(() => { /* a browser that refuses is not an error */ });
    return;
  }

  const frame = stage.querySelector("iframe");
  if (!frame?.contentWindow) return;
  try {
    frame.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: paused ? "pauseVideo" : "playVideo", args: [] }), "*");
    frame.contentWindow.postMessage(
      JSON.stringify({ method: paused ? "pause" : "play" }), "*");
  } catch { /* a cross-origin refusal is not worth a stack trace */ }
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
  paintPlayer(live);          // which applies the pause, after the repaint
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
    workoutId: live.workoutId,
    assignmentId: live.assignmentId,
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
  const earned = newlyEarned(store.history().sessions, id);   // see insights.js — chronological, tested

  screen.innerHTML = `
    <p class="eyebrow">Workout complete</p>
    <h2 class="h-display">${esc(session.title)}</h2>
    <p class="summary__big">${session.calories} <span style="font-size:1.2rem;color:var(--dim)">calories</span></p>
    <p class="muted small">An estimate, from ${session.weightLb} lb, the effort of each exercise and how long it actually took.</p>

    ${earned.length ? `<div class="milestone-banner">
      <p class="milestone-banner__eyebrow">${plural(earned.length, "new milestone")}</p>
      <div class="badges">
        ${earned.map((b) => `<span class="badge"><span class="badge__dot"></span>${esc(b.label)}</span>`).join("")}
      </div>
    </div>` : ""}

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

/** "3 more than last week", "the same as last week", never a bare number
 * with no feel for whether that is good — a trend means nothing without
 * something to compare it to. */
function trendLine(insights) {
  const { thisWeekCount, lastWeekCount, trend } = insights;
  if (lastWeekCount === 0 && thisWeekCount === 0) return "";
  if (trend > 0) return `<p class="trend trend--up">&#9650; <b>${plural(trend, "workout")} more</b> than last week</p>`;
  if (trend < 0) return `<p class="trend trend--down">&#9660; ${plural(-trend, "workout")} fewer than last week</p>`;
  return `<p class="trend">&#8212; the same as last week</p>`;
}

/** The handful of things a plain total cannot say — worth showing only once
 * there is enough of a record for them to mean anything. */
function insightCards(insights) {
  const cards = [];

  cards.push(`<div class="insight-card">
    <div class="ring" style="--pct:${insights.consistency30}"></div>
    <div class="insight-card__body">
      <span class="insight-card__label">Last 30 days</span>
      <span class="insight-card__value">${insights.consistency30}%</span>
      <span class="insight-card__note">of days had a workout</span>
    </div>
  </div>`);

  if (insights.favorite) {
    cards.push(`<div class="insight-card">
      <div class="insight-card__body">
        <span class="insight-card__label">Favorite exercise</span>
        <span class="insight-card__value">${esc(insights.favorite.name)}</span>
        <span class="insight-card__note">in ${plural(insights.favorite.count, "workout")}</span>
      </div>
    </div>`);
  }

  if (insights.bestDay) {
    cards.push(`<div class="insight-card">
      <div class="insight-card__body">
        <span class="insight-card__label">Shows up most on</span>
        <span class="insight-card__value">${insights.bestDay.name}</span>
        <span class="insight-card__note">${plural(insights.bestDay.count, "workout")} logged</span>
      </div>
    </div>`);
  }

  cards.push(`<div class="insight-card">
    <div class="insight-card__body">
      <span class="insight-card__label">Best run ever</span>
      <span class="insight-card__value">${plural(insights.longestStreak, "day")}</span>
      <span class="insight-card__note">back to back</span>
    </div>
  </div>`);

  return `<div class="insight-grid">${cards.join("")}</div>`;
}

/** Three personal records, only the ones a real session set — a longest
 * workout of nought seconds is not a record, it is an empty record. */
function recordCards(insights) {
  const rows = [
    insights.biggestBurn && { label: "Biggest burn", value: `${insights.biggestBurn.calories} cal`, when: insights.biggestBurn.date },
    insights.longestWorkout && { label: "Longest workout", value: duration(insights.longestWorkout.elapsedSec), when: insights.longestWorkout.date },
    insights.mostSets && { label: "Most sets in one workout", value: plural(insights.mostSets.setsDone, "set"), when: insights.mostSets.date },
  ].filter(Boolean);
  if (!rows.length) return "";
  return `<h2 class="h-section">Personal bests</h2>
    <ul class="tally">
      ${rows.map((r) => `<li><span>${esc(r.label)} &middot; <span class="dimmer">${niceDate(r.when)}</span></span><b>${esc(r.value)}</b></li>`).join("")}
    </ul>`;
}

function badgeRow(insights) {
  if (!insights.badges.length) return "";
  return `<h2 class="h-section">Milestones</h2>
    <div class="badges">
      ${insights.badges.map((b) => `<span class="badge"><span class="badge__dot"></span>${esc(b.label)}</span>`).join("")}
    </div>`;
}

function renderHistory() {
  const h = store.history();
  const stats = store.stats();
  const insights = store.insights();
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
    ${trendLine(insights)}
    <div class="weekstrip">
      ${DAY_KEYS.map((k) => `<div class="${week[k].done ? "is-done" : ""} ${k === today ? "is-today" : ""}">
        ${DAY_SHORT[k]}<b>${week[k].done ? "&#10003;" : "&middot;"}</b></div>`).join("")}
    </div>

    ${!insights.empty ? `<h2 class="h-section">Worth knowing</h2>${insightCards(insights)}` : ""}
    ${recordCards(insights)}
    ${badgeRow(insights)}

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
   Reminders

   One screen, because there are only two questions: what time every day, and
   — when today's has already been and gone — what time instead.

   The hour is chosen by scrolling a column rather than typing into a field.
   Nobody types "17" when they mean five in the afternoon, and a phone keyboard
   for a number between 0 and 23 is a bad joke.
   ========================================================================== */

let reminderState = null;

function hourLabel(h) {
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}<span class="hour__ampm">${suffix}</span>`;
}

/** The scrolling column. Tapping picks; scrolling picks; both agree. */
function hourPicker(id, selected) {
  return `<div class="hours" id="${id}" role="listbox" aria-label="Hour" tabindex="0" data-hour="${selected}">
    ${Array.from({ length: 24 }, (_, h) => `<button type="button" class="hour ${h === selected ? "is-on" : ""}"
      role="option" aria-selected="${h === selected}" data-pick-hour="${h}" data-for="${id}">${hourLabel(h)}</button>`).join("")}
  </div>`;
}

/* Scrolling the column selects whatever ends up in the middle of it. The
   listener is throttled by a timer rather than firing on every pixel: on a
   phone a flick produces a hundred scroll events and only the last matters. */
function wireHourPicker(root, id, onPick) {
  const el = root.querySelector("#" + id);
  if (!el) return;
  const centreOn = (h, smooth) => {
    const btn = el.querySelector(`[data-pick-hour="${h}"]`);
    if (btn) el.scrollTo({ top: btn.offsetTop - (el.clientHeight - btn.offsetHeight) / 2, behavior: smooth ? "smooth" : "auto" });
  };
  centreOn(Number(el.dataset.hour), false);

  let settle = null;
  el.addEventListener("scroll", () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const middle = el.scrollTop + el.clientHeight / 2;
      let best = 0, bestGap = Infinity;
      for (const btn of el.querySelectorAll("[data-pick-hour]")) {
        const gap = Math.abs(btn.offsetTop + btn.offsetHeight / 2 - middle);
        if (gap < bestGap) { bestGap = gap; best = Number(btn.dataset.pickHour); }
      }
      if (best !== Number(el.dataset.hour)) {
        el.dataset.hour = best;
        for (const btn of el.querySelectorAll("[data-pick-hour]")) {
          const on = Number(btn.dataset.pickHour) === best;
          btn.classList.toggle("is-on", on);
          btn.setAttribute("aria-selected", on);
        }
        onPick?.(best);
      }
    }, 120);
  });

  el.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick-hour]");
    if (!btn) return;
    centreOn(Number(btn.dataset.pickHour), true);
  });
}

const pickedHour = (id) => Number(document.getElementById(id)?.dataset.hour ?? 8);

async function renderRemind() {
  screen.innerHTML = `<p class="muted">Checking…</p>`;
  setTitle("Reminders", "when to nudge");
  bar.hidden = true;

  reminderState = await push.status().catch((err) => ({ ok: false, supported: true, why: err.message }));
  const st = reminderState;
  if (!store.get().account) {
    st.why = "Sign in first — a reminder is attached to this device on the server, and that needs an account.";
  }
  const on = st.subscribed && st.reminder?.enabled;
  // Before subscribing, this is what WILL apply the moment "Remind me" is
  // pressed; after, it is what actually is set. Either way it is the admin's
  // decision now, not a picker on this screen — see admin-people.js's reminders
  // panel, reached from Settings when signed in as admin.
  const hour = on ? (st.reminder?.hour ?? 8) : (st.effective?.hour ?? 8);
  const snoozed = st.reminder?.snoozeUntil > Date.now();

  screen.innerHTML = `
    <p class="eyebrow">Reminders</p>
    <h2 class="h-display">${on ? "On for this device" : "Off for this device"}</h2>

    ${!st.supported || !st.ready || st.permission === "denied"
      ? `<p class="note note--warn">${esc(
          st.permission === "denied"
            ? "Notifications are blocked for this app in the browser's settings. Allow them there, then come back."
            : st.why || "Reminders are not available here.")}</p>
         ${!store.get().account ? `<div class="btn-row"><button class="btn btn--go" data-action="go-login">Sign in</button></div>` : ""}`
      : ""}

    <p class="muted">A nudge on the morning of a day that has a workout in it &mdash; never on a rest day, and never
      once it is already done.</p>

    <div class="card">
      <p class="eyebrow">${on ? "Set for" : "Will be set for"}</p>
      <p class="h-display" style="margin:0">${hourLabel(hour)}</p>
      <p class="muted small" style="margin-top:.4rem">Set by the admin, for this account &mdash; not a choice made
        here. Ask them if it should move.</p>
    </div>
    <div class="btn-row" style="margin-top:1rem">
      ${on
        ? `<button class="btn btn--ghost" data-action="remind-off">Turn off</button>`
        : `<button class="btn btn--go btn--big" data-action="remind-on" ${st.supported && st.ready ? "" : "disabled"}>Remind me</button>`}
    </div>

    ${on ? `
      <h2 class="h-section">Not now &mdash; remind me at</h2>
      <p class="muted small">For a day it has already asked about. It will come back once, at the hour you pick,
        and say it is time.</p>
      ${hourPicker("snooze-hour", Math.min(23, Math.max(hour + 4, 12)))}
      <div class="btn-row" style="margin-top:1rem">
        <button class="btn" data-action="remind-snooze">Remind me then</button>
        ${snoozed ? `<button class="btn btn--ghost" data-action="remind-unsnooze">Cancel the one waiting</button>` : ""}
      </div>
      ${snoozed ? `<p class="note note--good" style="margin-top:1rem">One is waiting for
        ${esc(new Date(st.reminder.snoozeUntil).toLocaleString(undefined, { weekday: "long", hour: "numeric" }))}.</p>` : ""}
    ` : ""}

    ${adminOn() ? `<h2 class="h-section">Check it works</h2>
      <p class="muted small">Sends a test to every device set up for reminders, right now, whatever the time is.</p>
      <div class="btn-row" style="margin-top:.75rem">
        <button class="btn btn--ghost" data-action="remind-test">Send a test nudge</button>
      </div>
      <pre class="report" id="remind-report" hidden></pre>` : ""}

    ${footer()}`;

  wireHourPicker(screen, "snooze-hour");
}

/* ==========================================================================
   Accounts — signing in, signing up, and getting a forgotten password back.

   Separate from admin status (see the Admin block, above) in every way that
   matters: this is a real person's own email, and what their training record
   is attached to. Four modes share one screen because they share
   almost everything about it — the same shell, the same handful of fields,
   the same "something went wrong" box above the button.
   ========================================================================== */

function renderAccountScreen(mode, token = "") {
  const s = store.get();

  // Already signed in, and not here to use a reset link someone forwarded —
  // there is nothing for this screen to do.
  if (mode !== "reset" && s.account) { go("#/"); return renderWeek(); }

  bar.hidden = true;
  const cfg = s.accountConfig;

  const COPY = {
    login: { bar: "Sign in", eyebrow: "Sign in", title: "Welcome back", sub: "Your workouts and your record follow you here.",
      submit: "Sign in" },
    signup: { bar: "Sign up", eyebrow: "New here", title: "Create an account", sub: "So your workouts follow you between devices, and stay yours.",
      submit: "Create account" },
    forgot: { bar: "Reset", eyebrow: "Account", title: "Forgot your password?", sub: "We'll email a link to set a new one.",
      submit: "Send the link" },
    reset: { bar: "Reset", eyebrow: "Account", title: "Set a new password", sub: "This link works once, for one hour.",
      submit: "Set the new password" },
  }[mode];
  setTitle(COPY.bar, "account");

  const full = mode === "signup" && cfg.full;

  screen.innerHTML = `
    <p class="eyebrow">${esc(COPY.eyebrow)}</p>
    <h2 class="h-display">${esc(COPY.title)}</h2>
    <p class="muted" style="margin-bottom:1.25rem">${esc(COPY.sub)}</p>

    <div id="acct-error"></div>

    ${full ? `<p class="note note--warn">This app is in a small beta and already has its ${cfg.maxUsers} accounts.
        Ask to be added, or <a href="#/login">sign in</a> if you already have one.</p>` : `
    <form id="acct-form" novalidate>
      ${mode !== "reset" ? `<label class="field"><span>Email</span>
        <input type="email" id="a-email" autocomplete="email" enterkeyhint="next"
          autocapitalize="off" autocorrect="off" spellcheck="false" required></label>` : ""}
      ${mode === "signup" ? `<label class="field field--hint"><span>Your name</span>
        <input type="text" id="a-name" autocomplete="name">
        <small>Just for the app to greet you by &mdash; optional.</small></label>` : ""}
      ${mode === "login" || mode === "signup" || mode === "reset" ? `<label class="field field--hint">
        <span>${mode === "reset" ? "New password" : "Password"}</span>
        <input type="password" id="a-password"
          autocomplete="${mode === "signup" || mode === "reset" ? "new-password" : "current-password"}"
          enterkeyhint="${mode === "signup" || mode === "reset" ? "next" : "go"}" required>
        ${mode === "signup" || mode === "reset" ? `<small>At least 8 characters.</small>` : ""}</label>` : ""}
      ${mode === "signup" || mode === "reset" ? `<label class="field">
        <span>Type it again</span>
        <input type="password" id="a-password-2" autocomplete="new-password" enterkeyhint="go" required></label>` : ""}
      <div class="btn-row" style="margin-top:1rem">
        <button class="btn btn--go btn--wide btn--big" type="submit">${esc(COPY.submit)}</button>
      </div>
    </form>

    ${mode === "login" && cfg.google
      ? `<p class="muted small" style="text-align:center;margin:1rem 0">or</p>
         <div id="google-btn" style="display:flex;justify-content:center;min-height:44px"></div>`
      : ""}

    ${mode === "forgot" && !cfg.mailConfigured
      ? `<p class="note note--warn" style="margin-top:1rem">Email is not set up on this site yet, so a reset
           link cannot be sent. Ask whoever runs the site to add it.</p>` : ""}

    <p class="small dimmer" style="margin-top:1.5rem;text-align:center">
      ${mode === "login" ? `<a href="#/forgot">Forgot your password?</a><br>
          New here? <a href="#/signup">Create an account</a>` : ""}
      ${mode === "signup" ? `Already have an account? <a href="#/login">Sign in</a>` : ""}
      ${mode === "forgot" || mode === "reset" ? `<a href="#/login">Back to sign in</a>` : ""}
    </p>`}

    ${footer()}`;

  const errorBox = () => document.getElementById("acct-error");
  const showError = (message) => {
    const box = errorBox();
    if (box) box.innerHTML = `<p class="note note--warn">${esc(message)}</p>`;
  };

  document.getElementById("acct-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("a-email")?.value.trim() || "";
    const name = document.getElementById("a-name")?.value.trim() || "";
    const password = document.getElementById("a-password")?.value || "";
    const password2 = document.getElementById("a-password-2")?.value ?? password;
    errorBox().innerHTML = "";

    // Caught here rather than waiting on the server: a mistyped confirmation
    // is the single most common reason a brand new account can never sign
    // back in, and there is no reason to make a round trip to say so.
    if ((mode === "signup" || mode === "reset") && password !== password2) {
      showError("Those two don't match.");
      document.getElementById("a-password-2")?.focus();
      return;
    }

    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    let res;
    if (mode === "login") res = await store.accountLogIn({ email, password });
    else if (mode === "signup") res = await store.accountSignUp({ email, password, name });
    else if (mode === "forgot") res = await store.accountRequestReset(email);
    else res = await store.accountResetPassword({ token, password });

    submitBtn.disabled = false;
    if (!res.ok) { showError(res.error); return; }

    if (mode === "forgot") {
      toast(res.note || "If that email has an account, a link is on its way.", "good");
      go("#/login");
      return;
    }
    toast(mode === "reset" ? "Password set — you're signed in." : "Signed in.", "good");
    go("#/");
  });

  if (mode === "login" && cfg.google) {
    const el = document.getElementById("google-btn");
    account.renderGoogleButton(el, cfg.google.clientId, async (credential) => {
      const res = await store.accountWithGoogle(credential);
      if (!res.ok) { showError(res.error); return; }
      toast("Signed in.", "good");
      go("#/");
    }).catch(() => { if (el) el.remove(); });        // the button just does not appear
  }
}

/* ==========================================================================
   Settings, signing in, and the notices
   ========================================================================== */

/* What Settings is holding that has not been saved. Kept out here so the
   "you have unsaved changes" panel can put the person back where they were
   with everything they typed still in place. */
let settingsDraft = null;

const settingsDirty = () => {
  if (!settingsDraft) return false;
  const now = store.settings();
  return settingsDraft.weightLb !== now.weightLb || settingsDraft.countRest !== now.countRest;
};

function settingsSheet() {
  const s = store.get();
  if (!settingsDraft) settingsDraft = { ...store.settings() };
  const d = settingsDraft;

  const where = s.mode !== "server"
    ? `<p class="note note--warn">Working offline &mdash; this browser only.${s.note ? " " + esc(s.note) : ""}
         Anything logged now goes up on its own when the app can reach its server again.</p>`
    : s.account
      ? `<p class="note note--good"><strong>Signed in as ${esc(s.account.email)}.</strong> Your workouts save
           to the server and follow you to any device you sign into. Nobody else &mdash; including
           the admin password &mdash; can read your record.</p>`
      : s.hasPassword
        ? `<p class="note">Not signed in. The week is readable, and workouts done now are kept on this phone
             until you sign in. Signing in is what keeps your record safe if you lose the phone, and shares
             it with another device.</p>`
        : `<p class="note note--warn">No password is set on this site yet, so nothing can be saved to it.
             Add <strong>WORKOUT_PASSWORD</strong> in Netlify and redeploy.</p>`;

  openSheet("Settings", `
    <p class="sheet__lede">Everything about how this app behaves on this device.</p>

    <section class="set-group">
      <h3 class="set-group__h">The calorie estimate</h3>
      <p class="set-group__note">Two things feed it. Neither changes anything already logged &mdash; each workout
        keeps the numbers it was recorded with.</p>

      <label class="field field--hint"><span>Body weight, in pounds</span>
        <input type="number" id="s-weight" value="${d.weightLb}" min="40" max="700" step="1" inputmode="numeric">
        <small>The estimate scales with this. A pound or two either way barely moves it.</small></label>

      <label class="switch">
        <input type="checkbox" id="s-rest" ${d.countRest ? "checked" : ""}>
        <span class="switch__body">
          <strong>Count the rest between sets</strong>
          <small>She is on her feet between sets, so it counts by default. Turn it off to count only the
            working time. Rest is credited at most three minutes a set either way, so a forgotten timer
            cannot invent a day's calories.</small>
        </span>
      </label>
    </section>

    <section class="set-group">
      <h3 class="set-group__h">Reminders</h3>
      <p class="set-group__note">A push notification on the morning of a day that has a workout in it &mdash;
        never on a rest day, and never once it is already done.</p>
      <div class="btn-row"><button class="btn" data-action="go-remind">Set a reminder</button></div>
    </section>

    <section class="set-group">
      <h3 class="set-group__h">Where this is saved</h3>
      ${where}
      <div class="btn-row">
        ${s.account
          ? `<button class="btn btn--ghost" data-action="account-sign-out">Sign out</button>`
          : `<button class="btn btn--go" data-action="go-login">Sign in or create an account</button>`}
        ${s.account?.hasPassword ? `<button class="btn btn--ghost" data-action="go-change-password">Change password</button>` : ""}
      </div>
      ${s.account && !s.account.hasPassword && s.account.hasGoogle
        ? `<p class="set-group__note" style="margin-top:.7rem">Signed in with Google — no separate password to change here.</p>` : ""}
    </section>

    ${adminOn() ? `
    <section class="set-group">
      <h3 class="set-group__h">Edit the week</h3>
      <p class="set-group__note">Exercises, workouts and who they are assigned to each live on their own screen —
        every change there saves immediately.</p>
      <div class="btn-row">
        <button class="btn btn--ghost" data-action="admin-toggle">Back to my view</button>
        <button class="btn btn--ghost" data-action="go-admin-people">Who has an account</button>
        <button class="btn btn--ghost" data-action="go-admin-reminders">Reminder schedule</button>
        <button class="btn btn--ghost" data-action="go-admin-videos">Video library</button>
        <button class="btn btn--ghost" data-action="go-admin-exercises">Exercise pool</button>
        <button class="btn btn--ghost" data-action="go-admin-workouts">Workouts</button>
        <button class="btn btn--ghost" data-action="go-admin-assign">Assign workouts</button>
      </div>
    </section>` : ""}

    <section class="set-group set-group--last">
      <h3 class="set-group__h">Put it on the home screen</h3>
      <p class="set-group__note">On an iPhone: Share, then <strong>Add to Home Screen</strong>. On Android: the menu,
        then <strong>Install app</strong>. It then opens without browser chrome, keeps the screen awake during a
        workout, and works in a gym with no signal. On an iPhone, reminders only work from the home-screen copy.</p>
    </section>

    <div class="sheet__actions">
      <button class="btn btn--go btn--big" data-action="save-settings" id="s-save">Save changes</button>
      <button class="btn btn--big" data-action="cancel-settings">Cancel</button>
    </div>
  `, (root) => {
    const mark = () => {
      root.querySelector("#s-save")?.classList.toggle("is-waiting", settingsDirty());
    };
    root.querySelector("#s-weight")?.addEventListener("input", (e) => {
      settingsDraft.weightLb = Number(e.target.value) || store.settings().weightLb;
      mark();
    });
    root.querySelector("#s-rest")?.addEventListener("change", (e) => {
      settingsDraft.countRest = e.target.checked;
      mark();
    });
    mark();
  });

  /* Closing with something unsaved asks instead of silently dropping it. */
  sheetGuard = () => {
    if (!settingsDirty()) { settingsDraft = null; return true; }
    unsavedSettingsPanel();
    return false;
  };
}

/** Shown in place of the settings body when a close would lose changes. */
function unsavedSettingsPanel() {
  const now = store.settings();
  const changes = [];
  if (settingsDraft.weightLb !== now.weightLb) changes.push(`body weight ${now.weightLb} &rarr; ${settingsDraft.weightLb} lb`);
  if (settingsDraft.countRest !== now.countRest) changes.push(`rest between sets ${settingsDraft.countRest ? "counted" : "not counted"}`);

  $("#sheet-title").textContent = "Unsaved changes";
  $("#sheet-body").innerHTML = `
    <p class="muted" style="margin-bottom:1rem">You changed ${changes.length === 1 ? "one thing" : "a couple of things"}
      and have not saved:</p>
    <ul class="tally" style="margin-top:0">
      ${changes.map((c) => `<li><span>${c}</span></li>`).join("")}
    </ul>
    <div class="sheet__actions" style="margin-top:1.5rem">
      <button class="btn btn--go btn--big" data-action="save-settings">Save and close</button>
      <button class="btn btn--big" data-action="back-to-settings">Back to settings</button>
      <button class="btn btn--danger btn--big" data-action="discard-settings">Discard them</button>
    </div>`;
}

/** The account's own password — separate from the admin one above. Proving
 * the current password before setting a new one, the same way any account
 * settings screen would, even though the session cookie already proves who
 * this is: it is the difference between "you are signed in" and "you meant
 * to do this", which matters more for a password than almost anything else
 * this app does. */
function changePasswordSheet() {
  openSheet("Change your password", `
    <p class="small muted" style="margin-bottom:1rem">Changing it signs every other device out — anywhere
      else this account is signed in will need the new one.</p>
    <div id="cp-error"></div>
    <label class="field"><span>Current password</span>
      <input type="password" id="cp-current" autocomplete="current-password"></label>
    <label class="field field--hint"><span>New password</span>
      <input type="password" id="cp-new" autocomplete="new-password">
      <small>At least 8 characters.</small></label>
    <label class="field"><span>Type it again</span>
      <input type="password" id="cp-new-2" autocomplete="new-password"></label>
    <div class="btn-row"><button class="btn btn--go btn--wide" data-action="do-change-password">Change it</button></div>
  `, (root) => {
    const errBox = root.querySelector("#cp-error");
    const submit = async () => {
      errBox.innerHTML = "";
      const currentPassword = root.querySelector("#cp-current").value;
      const password = root.querySelector("#cp-new").value;
      const password2 = root.querySelector("#cp-new-2").value;
      if (password !== password2) {
        errBox.innerHTML = `<p class="note note--warn">Those two don't match.</p>`;
        root.querySelector("#cp-new-2")?.focus();
        return;
      }
      const res = await store.accountChangePassword({ currentPassword, password });
      if (!res.ok) { errBox.innerHTML = `<p class="note note--warn">${esc(res.error)}</p>`; return; }
      closeSheet();
      toast("Password changed.", "good");
      render();
    };
    root.querySelector('[data-action="do-change-password"]').addEventListener("click", submit);
    root.querySelectorAll("input").forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); }));
    setTimeout(() => root.querySelector("#cp-current")?.focus(), 50);
  });
}

/** Admin only — a read-only roster, not a management screen. Nothing here
 * can change or remove an account; that is deliberately not built yet for a
 * beta this size, where "ask them to email you" is a perfectly good way to
 * handle the rare case it comes up. */
function renderAdminPeople() {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Accounts", "who has one");

  const shell = (body) => `<p class="eyebrow">Admin</p><h2 class="h-display">Who has an account</h2>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  store.listPeople().then((res) => {
    if (location.hash !== "#/admin/people") return;    // moved on before this answered
    if (!res.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(res.error)}</p>`); return; }

    const { people, maxUsers } = res;
    screen.innerHTML = shell(`
      <p class="muted" style="margin-bottom:1.25rem">${people.length} of ${maxUsers} beta ${plural(maxUsers, "spot")} used.</p>
      ${people.length ? `<ul class="tally">
        ${people.map((p) => `<li>
          <span>
            <span style="display:block;font-weight:600">${esc(p.name)}</span>
            <span class="dimmer small" style="display:block;margin-top:.15rem">${esc(p.email)}
              &middot; ${p.google ? "Google" : "Password"}
              &middot; joined ${niceDate(p.createdAt.slice(0, 10))}
              &middot; last signed in ${niceDate(p.lastSeenAt.slice(0, 10))}</span>
          </span>
          <b>${plural(p.workouts, "workout")}</b>
        </li>`).join("")}
      </ul>` : `<p class="muted">Nobody has signed up yet.</p>`}
    `);
  });
}

/* Whichever video list was loaded last, so an edit prompt can pre-fill with
   the current label and url rather than asking the admin to retype them. */
let videoCache = [];

/** Admin only — every saved YouTube (or other) link, on its own screen. Until
 * now the library was only reachable from inside an exercise's media sheet;
 * this is somewhere to see and tidy the whole thing at once. */
function renderAdminVideos() {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Video library", "admin");

  const shell = (body) => `<p class="eyebrow">Admin</p><h2 class="h-display">The video library</h2>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  library.list().then((res) => {
    if (location.hash !== "#/admin/videos") return;    // moved on before this answered
    if (!res.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(res.error)}</p>`); return; }

    videoCache = res.videos;
    screen.innerHTML = shell(`
      <p class="muted" style="margin-bottom:1.25rem">${res.videos.length
        ? `${plural(res.videos.length, "video")} saved. Pick one from "From the library" on any exercise's video.`
        : `Nothing saved yet. "Save this video to the library" on any exercise adds one.`}</p>
      ${res.videos.length ? res.videos.map((vid) => `
        <div class="admin-person">
          <div class="admin-person__who">
            <strong>${esc(vid.label)}</strong>
            <span class="dimmer small" style="overflow-wrap:anywhere">${esc(vid.url)}</span>
          </div>
          <div class="admin-person__row">
            <button class="btn btn--ghost" data-action="video-edit" data-id="${esc(vid.id)}">Edit</button>
            <button class="btn btn--ghost" data-action="video-remove" data-id="${esc(vid.id)}">Remove</button>
          </div>
        </div>`).join("") : ""}
    `);
  });
}

/** Admin only — the saved exercises a day can be built from instead of
 * retyping the same sets, reps, rest and video every time it recurs. Viewing
 * and picking are both admin-only, same as the video library. */
function renderAdminExercises() {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Exercise pool", "admin");

  const shell = (body) => `<p class="eyebrow">Admin</p><h2 class="h-display">The exercise pool</h2>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  exerciseLibrary.list().then((res) => {
    if (location.hash !== "#/admin/exercises") return;    // moved on before this answered
    if (!res.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(res.error)}</p>`); return; }

    poolCache = res.exercises;
    screen.innerHTML = shell(`
      <p class="muted" style="margin-bottom:1rem">${res.exercises.length
        ? `${plural(res.exercises.length, "exercise")} saved. Everything a workout is built from lives here —
           edit one and it changes everywhere it is used.`
        : `Nothing saved yet. Add the first one below.`}</p>
      <div class="btn-row" style="margin-bottom:1.25rem">
        <button class="btn btn--go" data-action="pool-new">+ New exercise</button>
      </div>
      ${res.exercises.length ? res.exercises.map((ex) => `
        <div class="admin-person">
          <div class="admin-person__who">
            <strong>${esc(ex.name)}</strong>
            <span class="dimmer small">${ex.sets} &times; ${esc(ex.reps || "reps")}${ex.rest ? ` &middot; ${ex.rest}s rest` : ""}
              &middot; ${esc(effortLabel(ex.effort))}${ex.video ? " &middot; has a video" : ""}${ex.image ? " &middot; has a picture" : ""}</span>
          </div>
          <div class="admin-person__row">
            <button class="btn btn--ghost" data-action="pool-edit" data-id="${esc(ex.id)}">Edit</button>
            <button class="btn btn--ghost" data-action="pool-remove" data-id="${esc(ex.id)}">Remove</button>
          </div>
        </div>`).join("") : ""}
    `);
  });
}

/** New or existing — the one place an exercise's fields are ever set. Saves
 * immediately on "Save", not to a draft; there is nothing to publish later. */
function exerciseEditSheet(id) {
  const current = id ? poolCache.find((e) => e.id === id) : null;
  if (id && !current) return;
  const ex = current || { id: "", name: "", video: "", image: "", sets: 3, reps: "12", rest: 60, effort: "strength", notes: "" };
  const v = videoSource(ex.video);

  openSheet(id ? (ex.name || "Edit exercise") : "New exercise", `
    <label class="field"><span>Name</span>
      <input type="text" id="pe-name" value="${esc(ex.name)}" maxlength="120" placeholder="Squats"></label>

    <p class="eyebrow" style="margin-top:1.25rem">Picture</p>
    <div class="media-now media-now--small" id="pe-image-preview">
      ${ex.image ? `<img src="${esc(ex.image)}" alt="">` : `<div class="media-now__note dimmer">No picture</div>`}
    </div>
    <input type="hidden" id="pe-image-url" value="${esc(ex.image)}">
    <input type="file" id="pe-image" accept="image/*" hidden>
    <div class="btn-row">
      <button type="button" class="btn" data-action="pe-choose-image">${ex.image ? "Change the picture" : "Add a picture"}</button>
      ${ex.image ? `<button type="button" class="btn btn--ghost" data-action="pe-drop-image">Remove</button>` : ""}
    </div>

    <p class="eyebrow" style="margin-top:1.25rem">Video</p>
    <div class="media-now media-now--small">
      ${v.kind === "embed" ? `<div class="media-now__note">${esc(v.provider)} video</div>`
        : v.kind === "link" ? `<div class="media-now__note">A link &mdash; it will not play in the app</div>`
        : `<div class="media-now__note dimmer">No video</div>`}
    </div>
    <p class="eyebrow" style="margin-top:1rem">From the library</p>
    <div id="pe-lib"><p class="small muted">Loading&hellip;</p></div>
    <label class="field field--hint" style="margin-top:1rem"><span>Or paste a link</span>
      <input type="url" id="pe-url" value="${esc(ex.video)}" placeholder="https://youtu.be/&hellip;" maxlength="2000">
      <small id="pe-hint">${videoHint(ex.video)}</small></label>

    <p class="eyebrow" style="margin-top:1.25rem">Sets and rest</p>
    <p class="edit-inline">
      <select id="pe-sets" class="edit-sel" aria-label="Sets">
        ${Array.from({ length: 10 }, (_, n) => `<option value="${n + 1}" ${ex.sets === n + 1 ? "selected" : ""}>${n + 1}</option>`).join("")}
      </select>
      sets of
      <input type="text" id="pe-reps" value="${esc(ex.reps)}" placeholder="12" style="width:5rem">
      &middot;
      <input type="number" id="pe-rest" value="${ex.rest}" min="0" max="900" step="15" aria-label="Rest in seconds" style="width:5rem">s rest
    </p>

    <label class="field"><span>Effort</span>
      <select id="pe-effort">${EFFORTS.map((e) => `<option value="${e.key}" ${ex.effort === e.key ? "selected" : ""}>${esc(e.label)}</option>`).join("")}</select></label>

    <label class="field"><span>Notes</span>
      <textarea id="pe-notes" rows="3" maxlength="600" placeholder="Shown while she does it">${esc(ex.notes)}</textarea></label>

    <div class="btn-row" style="margin-top:1.25rem">
      <button class="btn btn--go" data-action="pool-save" data-id="${esc(ex.id)}">Save</button>
    </div>
  `, (root) => {
    const url = root.querySelector("#pe-url");
    url?.addEventListener("input", () => { root.querySelector("#pe-hint").innerHTML = videoHint(url.value); });

    const input = root.querySelector("#pe-image");
    input?.addEventListener("change", async () => {
      const chosen = input.files?.[0];
      if (!chosen) return;
      toast("Sending…");
      try {
        const out = await upload(chosen);
        root.querySelector("#pe-image-url").value = out.url;
        root.querySelector("#pe-image-preview").innerHTML = `<img src="${esc(out.url)}" alt="">`;
        toast("Picture added.", "good");
      } catch (err) {
        toast(err.message, "bad");
      }
    });

    library.list().then((res) => {
      if (!document.body.contains(root)) return;      // the sheet closed while this was in flight
      const box = root.querySelector("#pe-lib");
      if (!box) return;
      if (!res.ok) { box.innerHTML = `<p class="note note--warn">${esc(res.error)}</p>`; return; }
      if (!res.videos.length) {
        box.innerHTML = `<p class="small muted">Nothing saved yet &mdash; paste a link below, then use the
          Video library screen to save it for next time.</p>`;
        return;
      }
      box.innerHTML = `<div class="video-lib">
        ${res.videos.map((vid) => `<button type="button" class="video-lib__item" data-action="pe-pick-lib" data-url="${esc(vid.url)}">
            ${esc(vid.label)}</button>`).join("")}
      </div>`;
    });
  });
}

/** Admin only — every saved workout: a title, a picture, and the exercises
 * it is built from. Not tied to a day; "Assign workouts" is the separate
 * step that puts one on an actual account's actual weekday. */
function renderAdminWorkouts() {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Workouts", "admin");

  const shell = (body) => `<p class="eyebrow">Admin</p><h2 class="h-display">The workout library</h2>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  workoutLibrary.list().then((res) => {
    if (location.hash !== "#/admin/workouts") return;    // moved on before this answered
    if (!res.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(res.error)}</p>`); return; }

    workoutCache = res.workouts;
    screen.innerHTML = shell(`
      <p class="muted" style="margin-bottom:1rem">${res.workouts.length
        ? `${plural(res.workouts.length, "workout")} saved. "Assign workouts" puts one on someone's week.`
        : `Nothing saved yet. Add the first one below.`}</p>
      <div class="btn-row" style="margin-bottom:1.25rem">
        <button class="btn btn--go" data-action="workout-new">+ New workout</button>
      </div>
      ${res.workouts.length ? res.workouts.map((w) => `
        <div class="admin-person">
          <div class="admin-person__who">
            <strong>${esc(w.title)}</strong>
            <span class="dimmer small">${plural(w.exerciseIds.length, "exercise")}</span>
          </div>
          <div class="admin-person__row">
            <button class="btn btn--ghost" data-go="#/admin/workout/${esc(w.id)}">Open</button>
            <button class="btn btn--ghost" data-action="workout-remove" data-id="${esc(w.id)}">Remove</button>
          </div>
        </div>`).join("") : ""}
    `);
  });
}

/** Admin only — one workout's own screen: its details, and the ordered list
 * of exercises it is built from. Every add, remove and reorder here saves
 * immediately — there is no draft, and nothing to publish separately. */
function renderAdminWorkoutEdit(id) {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Workout", "admin");

  const shell = (body) => `<p class="eyebrow">Admin</p>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  Promise.all([workoutLibrary.list(), exerciseLibrary.list()]).then(([wRes, eRes]) => {
    if (location.hash !== `#/admin/workout/${id}`) return;    // moved on before this answered
    if (!wRes.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(wRes.error)}</p>`); return; }
    if (!eRes.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(eRes.error)}</p>`); return; }

    workoutCache = wRes.workouts;
    poolCache = eRes.exercises;
    const w = workoutCache.find((x) => x.id === id);
    if (!w) { screen.innerHTML = shell(`<p class="note note--warn">That workout no longer exists.</p>`); return; }

    const byId = Object.fromEntries(poolCache.map((ex) => [ex.id, ex]));
    const exercises = w.exerciseIds.map((exId) => byId[exId] || null);

    screen.innerHTML = shell(`
      <h2 class="h-display">${esc(w.title)}</h2>
      ${w.description ? `<p class="muted" style="white-space:pre-wrap">${esc(w.description)}</p>` : ""}
      <div class="btn-row" style="margin:1rem 0 1.5rem">
        <button class="btn" data-action="workout-edit-meta" data-id="${esc(w.id)}">Edit details</button>
      </div>

      <h2 class="h-section">Exercises</h2>
      ${exercises.length ? `<ol class="ex-list">
        ${exercises.map((ex, i) => ex ? `<li class="ex">
            ${thumb(ex)}
            <span class="ex__body">
              <span class="ex__name">${esc(ex.name)}</span>
              <span class="ex__meta">${ex.sets} &times; ${esc(ex.reps || "reps")}${ex.rest ? ` &middot; ${ex.rest}s rest` : ""}</span>
            </span>
            <span class="admin-person__row">
              <button type="button" class="mini" data-action="workout-move-up" data-id="${esc(w.id)}" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Move up">&uarr;</button>
              <button type="button" class="mini" data-action="workout-move-down" data-id="${esc(w.id)}" data-i="${i}" ${i === exercises.length - 1 ? "disabled" : ""} aria-label="Move down">&darr;</button>
              <button type="button" class="mini" data-action="workout-remove-exercise" data-id="${esc(w.id)}" data-i="${i}" aria-label="Remove">&times;</button>
            </span>
          </li>` : `<li class="ex"><span class="ex__body"><span class="ex__name muted">Removed from the pool</span></span>
            <button type="button" class="mini" data-action="workout-remove-exercise" data-id="${esc(w.id)}" data-i="${i}" aria-label="Remove">&times;</button></li>`).join("")}
      </ol>` : `<p class="muted">No exercises yet.</p>`}

      <div class="btn-row" style="margin-top:1rem">
        <button class="btn" data-action="open-workout-pool" data-id="${esc(w.id)}">+ From the pool</button>
      </div>`);
  });
}

/** "6:00am", from a stored "06:00". Kept separate from plainHour below,
 * which only ever deals in whole hours. */
function plainClock(hhmm) {
  const [h, m] = String(hhmm || "08:00").split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")}${suffix}`;
}

/* This person's resolved assignments, as last loaded — read by the sheet
   that adds one and the screen that lists them. */
let assignCache = [];

/** Admin only — pick who to set a week for. */
function renderAdminAssign() {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Assign workouts", "admin");

  const shell = (body) => `<p class="eyebrow">Admin</p><h2 class="h-display">Assign workouts</h2>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  store.listPeople().then((res) => {
    if (location.hash !== "#/admin/assign") return;    // moved on before this answered
    if (!res.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(res.error)}</p>`); return; }

    screen.innerHTML = shell(`
      <p class="muted" style="margin-bottom:1rem">Pick who to set a week for.</p>
      ${res.people.length ? `<ul class="tally">
        ${res.people.map((p) => `<li>
          <button type="button" data-go="#/admin/assign/${esc(p.id)}"
            style="all:unset;display:flex;justify-content:space-between;width:100%;cursor:pointer;gap:1rem">
            <span style="font-weight:600">${esc(p.name)}</span>
            <span class="dimmer small">${esc(p.email)}</span>
          </button>
        </li>`).join("")}
      </ul>` : `<p class="muted">Nobody has signed up yet.</p>`}
    `);
  });
}

/** Admin only — one person's whole week: what is assigned on each day, each
 * at its own time, with an add and a remove for every day. Every change
 * saves immediately. */
function renderAdminAssignUser(userId) {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Assign workouts", "admin");

  const shell = (body) => `<p class="eyebrow">Admin</p>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  Promise.all([assignments.forUser(userId), store.listPeople(), workoutLibrary.list()]).then(([aRes, pRes, wRes]) => {
    if (location.hash !== `#/admin/assign/${userId}`) return;    // moved on before this answered
    if (!aRes.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(aRes.error)}</p>`); return; }

    const person = pRes.ok ? pRes.people.find((p) => p.id === userId) : null;
    assignCache = aRes.assignments;
    if (wRes.ok) workoutCache = wRes.workouts;

    screen.innerHTML = shell(`
      <h2 class="h-display">${esc(person ? person.name : "Their week")}</h2>
      ${person ? `<p class="muted" style="margin-bottom:1.25rem">${esc(person.email)}</p>` : ""}
      ${!workoutCache.length ? `<p class="note note--warn" style="margin-bottom:1.25rem">No workouts saved yet
        &mdash; add one on the Workouts screen first.</p>` : ""}
      ${DAY_KEYS.map((k) => {
        const items = assignCache.filter((a) => a.day === k);
        return `<section class="set-group">
          <h3 class="set-group__h">${DAY_NAMES[k]}</h3>
          ${items.length ? items.map((a) => `
            <div class="admin-person__row" style="justify-content:space-between">
              <span>${plainClock(a.time)} &middot; ${a.workout ? esc(a.workout.title) : "A removed workout"}</span>
              <button class="btn btn--ghost" data-action="assign-remove" data-user="${esc(userId)}" data-id="${esc(a.id)}">Remove</button>
            </div>`).join("") : `<p class="dimmer small">Nothing scheduled.</p>`}
          <div class="btn-row" style="margin-top:.6rem">
            <button class="btn btn--ghost" data-action="assign-add" data-user="${esc(userId)}" data-day="${k}"
              ${workoutCache.length ? "" : "disabled"}>+ Add a workout</button>
          </div>
        </section>`;
      }).join("")}
    `);
  });
}

/** Pick a workout and a time, for one day of one person's week. */
function assignPickSheet(userId, day) {
  if (!workoutCache.length) return;
  openSheet(`Add to ${DAY_NAMES[day]}`, `
    <label class="field"><span>Workout</span>
      <select id="as-workout">
        ${workoutCache.map((w) => `<option value="${esc(w.id)}">${esc(w.title)}</option>`).join("")}
      </select></label>
    <label class="field" style="margin-top:1rem"><span>Time</span>
      <input type="time" id="as-time" value="08:00"></label>
    <div class="btn-row" style="margin-top:1.25rem">
      <button class="btn btn--go" data-action="assign-save" data-user="${esc(userId)}" data-day="${day}">Add</button>
    </div>
  `);
}

const plainHour = (h) => `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? "am" : "pm"}`;
const hourOptions = (selected) =>
  Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === selected ? "selected" : ""}>${plainHour(h)}</option>`).join("");

/**
 * Admin only — the schedule every "Remind me" press and every reminder's
 * wording actually come from. Nothing here can subscribe a device that has
 * never opened the app and granted permission; what it controls is what
 * happens once one has, or already is.
 */
function renderAdminReminders() {
  if (!adminOn()) { go("#/"); return; }
  bar.hidden = true;
  setTitle("Reminders", "admin");

  const shell = (body) => `<p class="eyebrow">Admin</p><h2 class="h-display">Reminder schedule</h2>${body}${footer()}`;
  screen.innerHTML = shell(`<p class="muted">Loading&hellip;</p>`);

  account.reminderConfig().then((s) => {
    if (location.hash !== "#/admin/reminders") return;
    if (!s.ok) { screen.innerHTML = shell(`<p class="note note--warn">${esc(s.error)}</p>`); return; }

    screen.innerHTML = shell(`
      <section class="set-group">
        <h3 class="set-group__h">Default, for anyone without their own</h3>
        <p class="set-group__note">What a new "Remind me" press sets up, and what anyone not given their own
          schedule already follows.</p>
        <label class="switch">
          <input type="checkbox" id="rd-enabled" ${s.default.enabled ? "checked" : ""}>
          <span class="switch__body"><strong>Reminders on by default</strong></span>
        </label>
        <label class="field" style="margin-top:.9rem"><span>At</span>
          <select id="rd-hour">${hourOptions(s.default.hour)}</select></label>
        <div class="btn-row" style="margin-top:1rem">
          <button class="btn btn--go" data-action="rd-save">Save the default</button>
          <button class="btn btn--ghost" data-action="rd-apply-all">Set this for everyone now</button>
        </div>
      </section>

      <section class="set-group">
        <h3 class="set-group__h">What it says, by the hour</h3>
        <p class="set-group__note">"${esc(s.defaultMessage)}" unless a different message is written in for that
          hour. Whichever hour someone's reminder is set to, this is what it says.</p>
        <div class="hour-messages">
          ${Array.from({ length: 24 }, (_, h) => `
            <label class="field field--hour"><span>${plainHour(h)}</span>
              <input type="text" data-hour-message="${h}" value="${esc(s.messages[h] || "")}"
                placeholder="${esc(s.defaultMessage)}" maxlength="200"></label>`).join("")}
        </div>
        <div class="btn-row" style="margin-top:.9rem">
          <button class="btn btn--ghost" data-action="rd-reset-messages">Reset every message to default</button>
        </div>
      </section>

      <section class="set-group set-group--last">
        <h3 class="set-group__h">Each person</h3>
        ${s.people.length ? s.people.map((p) => `
          <div class="admin-person">
            <div class="admin-person__who">
              <strong>${esc(p.name)}</strong>
              <span class="dimmer small">${esc(p.email)} &middot; ${p.subscribed ? "has a device set up" : "no device yet"}</span>
            </div>
            <div class="admin-person__row">
              <input type="checkbox" data-person-enabled="${esc(p.id)}" ${p.effective.enabled ? "checked" : ""}>
              <select data-person-hour="${esc(p.id)}">${hourOptions(p.effective.hour)}</select>
              <button class="btn btn--ghost" data-action="rd-save-user" data-user="${esc(p.id)}">Save</button>
              ${p.override
                ? `<button class="btn btn--ghost" data-action="rd-reset-user" data-user="${esc(p.id)}">Return to default schedule</button>`
                : `<span class="dimmer small">Following the default</span>`}
            </div>
          </div>`).join("") : `<p class="muted">Nobody has an account yet.</p>`}
      </section>
    `);

    // Saved on blur, not with a per-row button — twenty-four buttons on one
    // screen is clutter, and there is nothing destructive about a wording.
    document.querySelectorAll("[data-hour-message]").forEach((el) => {
      el.addEventListener("change", () => {
        account.saveHourMessage(Number(el.dataset.hourMessage), el.value)
          .then((r) => toast(r.ok ? "Saved." : r.error, r.ok ? "good" : "bad"));
      });
    });
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
        ? (s.account ? "Signed in &middot; your record syncs" : "Not signed in &middot; the record stays on this phone")
        : "This browser only"}</p>
    <p class="dimmer">Calories are an estimate from body weight, the effort of each exercise and how long it took. Treat them as a guide.</p>
  </div>`;
}

/* ==========================================================================
   Routing and the one click handler
   ========================================================================== */

function setTitle(main, sub) {
  $("#title").innerHTML = `${esc(main)}<span class="topbar__sub">${sub}</span>`;
  $("#back").hidden = location.hash === "" || location.hash === "#/";
  document.body.classList.toggle("is-admin", adminOn());

  // Only ever shown to a designated admin account — everyone else, signed in
  // or not, never sees it at all.
  const toggle = $("#admin-toggle");
  toggle.hidden = !canAdmin();
  if (!toggle.hidden) {
    toggle.textContent = adminOn() ? "My view" : "Admin view";
    toggle.classList.toggle("is-on", adminOn());
  }

  // Settings is per-account (the calorie estimate, reminders, the admin
  // tools above) — a signed-out visitor has no account for it to belong to.
  $("#settings-btn").hidden = !store.get().account;
}

function render() {
  const hash = location.hash || "#/";
  // Split the query off first — #/reset?token=… would otherwise glue
  // "reset?token=…" together as one unrecognisable route name.
  const [path, query] = hash.split("?");
  const [, route, arg, sub] = path.split("/");

  if (route !== "go") {
    stopTicking();
    playerPainted = false;
    mountedKey = null;
    mountedMedia = null;
  }

  // #/edit/mon was the old in-place day editor's URL. There is no such
  // thing any more — editing lives entirely in the admin screens — so this
  // just lands on the day itself, kept only because the URL may be
  // bookmarked somewhere.
  if (route === "edit" && DAY_KEYS.includes(arg)) {
    location.replace(`#/day/${arg}`);
    return renderDay(arg);
  }

  if (route === "day" && DAY_KEYS.includes(arg)) return renderDay(arg);
  if (route === "go" && arg) return renderPlayer(arg);
  if (route === "done" && arg) return renderSummary(arg);
  if (route === "history") return renderHistory();
  if (route === "remind") return renderRemind();
  if (route === "admin" && arg === "people") return renderAdminPeople();
  if (route === "admin" && arg === "reminders") return renderAdminReminders();
  if (route === "admin" && arg === "videos") return renderAdminVideos();
  if (route === "admin" && arg === "exercises") return renderAdminExercises();
  if (route === "admin" && arg === "workouts") return renderAdminWorkouts();
  if (route === "admin" && arg === "workout" && sub) return renderAdminWorkoutEdit(sub);
  if (route === "admin" && arg === "assign" && !sub) return renderAdminAssign();
  if (route === "admin" && arg === "assign" && sub) return renderAdminAssignUser(sub);
  if (route === "admin") {
    // A bookmarked or typed /#/admin — turn the admin view on if this
    // account is allowed one at all; otherwise it is simply not a route.
    if (canAdmin()) setAdminView(true);
    location.replace("#/");
    return renderWeek();
  }
  if (route === "login") return renderAccountScreen("login");
  if (route === "signup") return renderAccountScreen("signup");
  if (route === "forgot") return renderAccountScreen("forgot");
  if (route === "reset") return renderAccountScreen("reset", new URLSearchParams(query || "").get("token") || "");
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
  /* Actions are looked for first. Today's card is itself a destination, and it
     contains buttons that do something else — without this order the card's
     destination would swallow "Add a workout for today" pressed inside it. */
  const el = e.target.closest("[data-action]");
  if (!el) {
    const goTo = e.target.closest("[data-go]");
    if (goTo) { e.preventDefault(); go(goTo.dataset.go); }
    return;
  }
  const { action, id, i, day } = el.dataset;

  switch (action) {
    case "set-done": setDone(); break;
    case "skip-rest": skipRest(); break;
    case "skip-exercise": {
      const live = store.loadLive();
      if (!live) break;
      const ex = live.exercises[live.i];
      const last = live.i >= live.exercises.length - 1;
      askFirst({
        title: `Skip ${ex?.name || "this exercise"}?`,
        body: `${ex ? `${ex.done.length} of ${ex.setsPlanned} sets done. ` : ""}${last
          ? "It is the last one, so skipping it finishes the workout."
          : `Next is ${esc(live.exercises[live.i + 1]?.name || "the next exercise")}.`} The sets already done are kept.`,
        yes: last ? "Skip it and finish" : "Skip it",
        onYes: () => skipExercise(),
      });
      break;
    }
    case "pause": togglePause(); break;
    case "finish": {
      const live = store.loadLive();
      if (!live) break;
      const done = liveSetsDone(live);
      const left = livePlanned(live) - done;
      // Finishing when everything is done is the normal end of a workout, so
      // it just finishes. Finishing with sets outstanding is the fat-finger
      // case, and that is the one worth stopping for.
      if (left <= 0) { finishWorkout(live); break; }
      askFirst({
        title: "Finish here?",
        body: done
          ? `${plural(done, "set")} done, ${plural(left, "set")} still to go. It will be logged as it stands &mdash; part done &mdash; and the workout ends.`
          : "No sets have been done yet, so nothing will be logged and the workout ends.",
        yes: done ? `Finish with ${plural(done, "set")}` : "End it, log nothing",
        onYes: () => { const l = store.loadLive(); if (l) finishWorkout(l); },
      });
      break;
    }
    case "resume-live": {
      const l = store.loadLive();
      if (!l) { render(); break; }
      l.staleOk = true;                 // asked and answered; do not ask again
      store.saveLive(l);
      if (location.hash === `#/go/${l.assignmentId}`) render();
      else go(`#/go/${l.assignmentId}`);
      break;
    }
    case "discard-live":
      store.clearLive();
      // Same assignment means the hash is already right and would not fire a
      // change, so the render is done here rather than left to the router.
      if (location.hash === `#/go/${id}`) render();
      else go(`#/go/${id}`);
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

    /* ---- reminders ---- */
    case "remind-on":
      push.enable()
        .then(() => { toast("Reminders on.", "good"); renderRemind(); })
        .catch((err) => toast(err.message, "bad"));
      break;
    case "remind-off":
      push.disable().then(() => { toast("Reminders off."); renderRemind(); })
        .catch((err) => toast(err.message, "bad"));
      break;
    case "remind-snooze":
      push.snoozeTo(pickedHour("snooze-hour"))
        .then(() => { toast("It will come back then.", "good"); renderRemind(); })
        .catch((err) => toast(err.message, "bad"));
      break;
    case "remind-unsnooze":
      push.update({ clearSnooze: true }).then(() => { toast("Cancelled."); renderRemind(); })
        .catch((err) => toast(err.message, "bad"));
      break;
    case "remind-test": {
      const out = document.getElementById("remind-report");
      if (out) { out.hidden = false; out.textContent = "Sending…"; }
      push.selftest(true)
        .then((r) => { if (out) out.textContent = JSON.stringify(r, null, 2); toast(r.sent ? `Sent to ${plural(r.sent, "device")}.` : "Nothing was sent — see below.", r.sent ? "good" : "bad"); })
        .catch((err) => { if (out) out.textContent = err.message; toast(err.message, "bad"); });
      break;
    }

    case "confirm-yes": {
      const go = pendingConfirm;
      pendingConfirm = null;
      closeSheet();
      go?.();
      break;
    }
    case "confirm-no": pendingConfirm = null; closeSheet(); break;

    case "open-settings": e.preventDefault(); settingsSheet(); break;
    case "admin-toggle": {
      const next = !adminOn();
      setAdminView(next);
      settingsDraft = null;
      closeSheet(true);
      location.hash = "#/";
      render();
      // Switching into admin view: land straight on the repositories and
      // roster it unlocks, same as pressing Settings would once there.
      if (next) settingsSheet();
      break;
    }
    case "save-settings":
      store.saveSettings({ ...settingsDraft }).then((r) => {
        settingsDraft = null;
        closeSheet(true);
        toast(r.ok === false ? (r.error || "Could not save.") : "Saved.", r.ok === false ? "bad" : "good");
        render();
      });
      break;
    case "cancel-settings": closeSheet(); break;
    case "back-to-settings": settingsSheet(); break;
    case "discard-settings": settingsDraft = null; closeSheet(true); toast("Changes discarded."); break;

    case "go-remind": settingsDraft = null; closeSheet(true); go("#/remind"); break;
    case "go-login": settingsDraft = null; closeSheet(true); go("#/login"); break;
    case "go-change-password": settingsDraft = null; closeSheet(true); changePasswordSheet(); break;
    case "go-admin-people": settingsDraft = null; closeSheet(true); go("#/admin/people"); break;
    case "go-admin-reminders": settingsDraft = null; closeSheet(true); go("#/admin/reminders"); break;
    case "go-admin-videos": settingsDraft = null; closeSheet(true); go("#/admin/videos"); break;
    case "go-admin-exercises": settingsDraft = null; closeSheet(true); go("#/admin/exercises"); break;
    case "video-edit": {
      const current = videoCache.find((v) => v.id === id);
      if (!current) break;
      const label = prompt("Name:", current.label);
      if (label === null) break;
      const url = prompt("Video link:", current.url);
      if (url === null) break;
      library.update(id, label, url).then((res) => {
        toast(res.ok ? "Saved." : res.error, res.ok ? "good" : "bad");
        if (res.ok) renderAdminVideos();
      });
      break;
    }
    case "video-remove":
      if (confirm("Remove this from the library? Any exercise already using this link keeps it.")) {
        library.remove(id).then((res) => {
          toast(res.ok ? "Removed." : res.error, res.ok ? "good" : "bad");
          if (res.ok) renderAdminVideos();
        });
      }
      break;
    case "pool-remove":
      if (confirm("Remove this from the pool? It stays on any workout that already uses it.")) {
        exerciseLibrary.remove(id).then((res) => {
          toast(res.ok ? "Removed." : res.error, res.ok ? "good" : "bad");
          if (res.ok) renderAdminExercises();
        });
      }
      break;
    case "pool-new": exerciseEditSheet(null); break;
    case "pool-edit": exerciseEditSheet(id); break;
    case "pool-save": {
      const ex = {
        name: document.getElementById("pe-name")?.value || "",
        image: document.getElementById("pe-image-url")?.value || "",
        video: document.getElementById("pe-url")?.value || "",
        sets: Number(document.getElementById("pe-sets")?.value) || 3,
        reps: document.getElementById("pe-reps")?.value || "",
        rest: Number(document.getElementById("pe-rest")?.value) || 0,
        effort: document.getElementById("pe-effort")?.value || "strength",
        notes: document.getElementById("pe-notes")?.value || "",
      };
      const save = id ? exerciseLibrary.update(id, ex) : exerciseLibrary.add(ex);
      save.then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        closeSheet();
        toast("Saved.", "good");
        if (location.hash === "#/admin/exercises") renderAdminExercises();
      });
      break;
    }
    case "pe-choose-image": document.getElementById("pe-image")?.click(); break;
    case "pe-drop-image": {
      document.getElementById("pe-image-url").value = "";
      const preview = document.getElementById("pe-image-preview");
      if (preview) preview.innerHTML = `<div class="media-now__note dimmer">No picture</div>`;
      toast("Removed.");
      break;
    }
    case "pe-pick-lib": {
      const urlInput = document.getElementById("pe-url");
      if (urlInput) {
        urlInput.value = el.dataset.url;
        const hint = document.getElementById("pe-hint");
        if (hint) hint.innerHTML = videoHint(el.dataset.url);
      }
      toast("Video set from the library.", "good");
      break;
    }

    /* ---- the workout library ---- */
    case "go-admin-workouts": settingsDraft = null; closeSheet(true); go("#/admin/workouts"); break;
    case "workout-new": {
      const title = prompt("Title:");
      if (!title || !title.trim()) break;
      workoutLibrary.add({ title: title.trim(), description: "", image: "", minutes: 0, exerciseIds: [] }).then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        // The server always prepends a freshly added entry, so it is the first.
        go(`#/admin/workout/${res.workouts[0].id}`);
      });
      break;
    }
    case "workout-remove":
      if (confirm("Remove this workout? Anyone it is assigned to loses it from their week.")) {
        workoutLibrary.remove(id).then((res) => {
          toast(res.ok ? "Removed." : res.error, res.ok ? "good" : "bad");
          if (res.ok) renderAdminWorkouts();
        });
      }
      break;
    case "workout-edit-meta": workoutMetaSheet(id); break;
    case "workout-save-meta": {
      const w = workoutCache.find((x) => x.id === id);
      if (!w) break;
      const patch = {
        ...w,
        title: document.getElementById("wk-title")?.value || "",
        description: document.getElementById("wk-description")?.value || "",
        image: document.getElementById("wk-image-url")?.value || "",
        minutes: Number(document.getElementById("wk-minutes")?.value) || 0,
      };
      workoutLibrary.update(id, patch).then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        closeSheet();
        toast("Saved.", "good");
        if (location.hash === `#/admin/workout/${id}`) renderAdminWorkoutEdit(id);
      });
      break;
    }
    case "wk-choose-image": document.getElementById("wk-image")?.click(); break;
    case "wk-drop-image": {
      document.getElementById("wk-image-url").value = "";
      const preview = document.getElementById("wk-image-preview");
      if (preview) preview.innerHTML = `<div class="media-now__note dimmer">No picture</div>`;
      toast("Removed.");
      break;
    }
    case "open-workout-pool": workoutPoolSheet(id); break;
    case "wk-pool-pick": {
      const w = workoutCache.find((x) => x.id === id);
      if (!w) break;
      const exId = el.dataset.exid;
      workoutLibrary.update(id, { ...w, exerciseIds: [...w.exerciseIds, exId] }).then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        closeSheet();
        toast("Added from the pool.", "good");
        if (location.hash === `#/admin/workout/${id}`) renderAdminWorkoutEdit(id);
      });
      break;
    }
    case "workout-move-up":
    case "workout-move-down": {
      const w = workoutCache.find((x) => x.id === id);
      if (!w) break;
      const from = Number(i);
      const to = action === "workout-move-up" ? from - 1 : from + 1;
      if (to < 0 || to >= w.exerciseIds.length) break;
      const ids = [...w.exerciseIds];
      [ids[from], ids[to]] = [ids[to], ids[from]];
      workoutLibrary.update(id, { ...w, exerciseIds: ids }).then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        if (location.hash === `#/admin/workout/${id}`) renderAdminWorkoutEdit(id);
      });
      break;
    }
    case "workout-remove-exercise": {
      const w = workoutCache.find((x) => x.id === id);
      if (!w) break;
      const ids = w.exerciseIds.filter((_, idx) => idx !== Number(i));
      workoutLibrary.update(id, { ...w, exerciseIds: ids }).then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        if (location.hash === `#/admin/workout/${id}`) renderAdminWorkoutEdit(id);
      });
      break;
    }

    /* ---- assigning workouts to a person's week ---- */
    case "go-admin-assign": settingsDraft = null; closeSheet(true); go("#/admin/assign"); break;
    case "assign-add": assignPickSheet(el.dataset.user, day); break;
    case "assign-save": {
      const userId = el.dataset.user;
      const workoutId = document.getElementById("as-workout")?.value;
      const time = document.getElementById("as-time")?.value;
      if (!workoutId) break;
      assignments.add(userId, { day, time, workoutId }).then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        closeSheet();
        toast("Added.", "good");
        if (location.hash === `#/admin/assign/${userId}`) renderAdminAssignUser(userId);
      });
      break;
    }
    case "assign-remove": {
      const userId = el.dataset.user;
      if (!confirm("Remove this from their week?")) break;
      assignments.remove(userId, id).then((res) => {
        if (!res.ok) { toast(res.error, "bad"); return; }
        toast("Removed.");
        if (location.hash === `#/admin/assign/${userId}`) renderAdminAssignUser(userId);
      });
      break;
    }

    case "rd-save": {
      const enabled = document.getElementById("rd-enabled")?.checked;
      const hour = Number(document.getElementById("rd-hour")?.value);
      account.saveDefaultSchedule({ enabled, hour }).then((r) => {
        if (!r.ok) { toast(r.error, "bad"); return; }
        toast("Default schedule saved.", "good");
        renderAdminReminders();
      });
      break;
    }
    case "rd-apply-all": {
      const enabled = document.getElementById("rd-enabled")?.checked;
      const hour = Number(document.getElementById("rd-hour")?.value);
      askFirst({
        title: "Set this for everyone?",
        body: `Every account's reminder becomes ${plainHour(hour)}, ${enabled ? "on" : "off"} — including anyone
          who currently has their own, different schedule. That is cleared.`,
        yes: "Set it for everyone",
        onYes: () => account.applyScheduleToAll({ enabled, hour }).then((r) => {
          toast(r.ok ? "Applied to everyone." : r.error, r.ok ? "good" : "bad");
          if (r.ok) renderAdminReminders();
        }),
      });
      break;
    }
    case "rd-reset-messages":
      askFirst({
        title: "Reset every message?",
        body: "All twenty-four go back to the one default wording. This cannot be undone.",
        yes: "Reset them all",
        danger: false,
        onYes: () => account.resetHourMessages().then((r) => {
          toast(r.ok ? "Reset." : r.error, r.ok ? "good" : "bad");
          if (r.ok) renderAdminReminders();
        }),
      });
      break;
    case "rd-save-user": {
      const uid = el.dataset.user;
      const enabled = document.querySelector(`[data-person-enabled="${uid}"]`)?.checked;
      const hour = Number(document.querySelector(`[data-person-hour="${uid}"]`)?.value);
      account.saveUserSchedule(uid, { enabled, hour }).then((r) => {
        toast(r.ok ? "Saved." : r.error, r.ok ? "good" : "bad");
        if (r.ok) renderAdminReminders();
      });
      break;
    }
    case "rd-reset-user":
      account.resetUserSchedule(el.dataset.user).then((r) => {
        toast(r.ok ? "Back to the default." : r.error, r.ok ? "good" : "bad");
        if (r.ok) renderAdminReminders();
      });
      break;
    case "account-sign-out":
      settingsDraft = null;
      closeSheet(true);
      store.accountLogOut().then(() => { toast("Signed out."); render(); });
      break;
    default: break;
  }
});

/* A workout in progress must survive the app being closed, so the live state
   is written on the way out as well as on every set. */
window.addEventListener("pagehide", () => { releaseWake(); });

/* ---------- start ---------- */

/* Pressing a notification focuses the window that is already open rather than
   opening a second copy, and the service worker then says where to go. */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type !== "navigate") return;
    const to = String(e.data.to || "/");
    const hash = to.includes("#") ? to.slice(to.indexOf("#")) : "#/";
    if (location.hash === hash) render(); else go(hash);
  });
}

/* Fades out the boot splash once the first real screen has painted. Guarded
   so a slow font load or a second call (there is only one today, but it's
   cheap insurance) never throws on an element already gone. */
function hideBootSplash() {
  const el = document.getElementById("boot-splash");
  if (!el) return;
  el.classList.add("is-hidden");
  el.addEventListener("transitionend", () => el.remove(), { once: true });
}

store.subscribe(() => {
  // A repaint mid-workout would restart the video, so a player already on
  // screen looks after itself. One that has not been painted yet — a cold
  // start straight onto a workout URL — still needs this to draw it.
  if (location.hash.startsWith("#/go/") && playerPainted) return;
  render();
});

/* Held so anything that needs to know "is this person signed in?" can wait for
   a real answer instead of acting on the not-yet-loaded default of no. */
ready = store.load();

ready.then(() => {
  render();
  hideBootSplash();
  const live = store.loadLive();
  // A genuinely recent session is worth surfacing on cold start. A stale one
  // (hours old — see isStale) is not: without this check it said so on
  // EVERY single app open, for ever, until she happened to open that exact
  // day and was asked what to do with it. That is the "perpetual run".
  if (live && !isStale(live) && !location.hash.startsWith("#/go/")) {
    toast(`${live.title} is still in progress — tap to carry on.`);
  }
});

render();
