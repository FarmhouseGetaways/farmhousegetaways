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

   EDITING IS NOT A SEPARATE SCREEN

   Signed in, the pencil in the top bar turns the page you are already looking
   at into the editor: the title, the description, an exercise name, the reps,
   the notes are all clicked and typed straight over. A picture or a video is
   added by pressing the thumbnail beside the exercise. Nothing is a form, and
   nothing is somewhere else — the same rule /edit.html follows on the website.

   Everything edits into one draft of the whole week, so moving between days
   keeps the changes. Nothing leaves the browser until Save is pressed, and the
   bar at the bottom says how many changes are waiting.
   ========================================================================== */

import * as store from "./store.js";
import { upload, previewUrl } from "./media.js";
import * as push from "./push.js";
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

/**
 * Read what was typed into a contenteditable.
 *
 * Browsers scatter non-breaking spaces through an editable element without
 * being asked, and a non-breaking space stops a line wrapping — which is never
 * what somebody typing a workout title meant. The website learned this the
 * hard way when its editor published a paragraph that ran off the side of the
 * page. They are flattened to ordinary spaces on the way in, here, so nothing
 * downstream ever has to know.
 */
const readText = (el, multiline = false) => {
  const raw = (el?.innerText ?? "").replace(/\u00a0/g, " ").replace(/\r/g, "");
  return multiline ? raw.replace(/\n{3,}/g, "\n\n").trim() : raw.replace(/\s+/g, " ").trim();
};

const isRest = (day) => !day.exercises.length;
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

   Signing in is Carissa's — it is what syncs her record between the phone and
   the iPad. Editing the week is not hers, and it should not be one mis-tap
   away while she is halfway through a set.

   So the editor is behind a second, deliberate gesture, the same one the
   farmhouse app uses for its own admin screen: PRESS AND HOLD THE TITLE at
   the top of any screen for three quarters of a second. There is no button,
   because a button is something you press by accident. /#/admin does the same
   thing for a laptop.

   The unlock LAPSES rather than lasting for ever. It was sessionStorage at
   first, which relocks when the app closes — correct on a phone, where there
   is one window, and miserable on a desktop, where sessionStorage is per TAB:
   opening a second tab locked the editor again, every time. So it is stored
   with a timestamp and expires after twelve hours. Long enough to write a
   week's training in one evening across as many tabs as you like; short
   enough that a phone left on a kitchen table tomorrow is locked again.

   It still requires being signed in as well, so a lapsed timestamp is the
   second lock, not the only one. "Lock the editor" in Settings drops it on
   the spot.
   ========================================================================== */

const ADMIN_KEY = "fg-workout-admin";
const ADMIN_HOURS = 12;

const adminOn = () => {
  if (!store.get().signedIn) return false;
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return false;
    const at = Number(JSON.parse(raw)?.at) || 0;
    return Date.now() - at < ADMIN_HOURS * 3600000;
  } catch { return false; }
};

const setAdmin = (on) => {
  try {
    if (on) localStorage.setItem(ADMIN_KEY, JSON.stringify({ at: Date.now() }));
    else localStorage.removeItem(ADMIN_KEY);
    // Anything left over from when this was per-tab.
    sessionStorage.removeItem(ADMIN_KEY);
  } catch { /* a browser that refuses storage simply stays locked */ }
};

/**
 * The long press. Works with a finger and with a mouse, so a laptop can too.
 *
 * The movement tolerance is the whole trick, and leaving it out made the
 * gesture impossible with a mouse: holding a button still emits pointermove
 * from a pixel of hand tremor, so cancelling on any movement at all cancelled
 * every single press. A finger drifts further than a mouse does, so the same
 * tolerance is what makes it reliable on a phone too. Only a real drag — more
 * than about a thumb's width — means "I did not mean to hold this".
 */
function armAdminGesture() {
  const title = $("#title");
  const SLOP = 14;                      // pixels of drift that are still a press
  let timer = null;
  let from = null;

  const cancel = () => { clearTimeout(timer); timer = null; from = null; };

  const start = (e) => {
    cancel();
    from = { x: e.clientX, y: e.clientY };
    timer = setTimeout(() => {
      timer = null;
      if (navigator.vibrate) navigator.vibrate(30);
      unlockAdmin();
    }, 750);
  };

  const drifted = (e) => {
    if (!timer || !from) return;
    if (Math.hypot(e.clientX - from.x, e.clientY - from.y) > SLOP) cancel();
  };

  title.addEventListener("pointerdown", start);
  title.addEventListener("pointermove", drifted);
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) {
    title.addEventListener(ev, cancel);
  }
  // A long press on a phone otherwise offers to select the text or share it.
  title.addEventListener("contextmenu", (e) => e.preventDefault());
  title.style.userSelect = "none";
  title.style.webkitUserSelect = "none";
}

/* Set at startup to the promise of the first load. */
let ready = null;

function unlockAdmin() {
  if (adminOn()) { toast("The editor is already unlocked."); return; }

  /* Opened cold on /#/admin — a typed URL, a bookmark, a hard refresh. The
     store has not answered yet, so "are you signed in?" is still false by
     default rather than by fact, and asking for a password here would demand
     one from somebody who is already signed in. Wait for the real answer. */
  if (!store.get().loaded && ready) {
    toast("One moment…");
    ready.then(() => unlockAdmin());
    return;
  }

  if (!store.get().signedIn) { askSignIn(null, true); return; }
  setAdmin(true);
  toast("Editor unlocked. The pencil is at the top.", "good");
  render();
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
  pendingConfirm = null;
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
         ${adminOn() ? `<div class="btn-row" style="margin-top:1.1rem"><button class="btn" data-action="edit-here">Add a workout for today</button></div>` : ""}
       </div>`
    : `<div class="today ${doneToday ? "is-done" : ""}">
         <p class="eyebrow">Today &middot; ${DAY_NAMES[today]}</p>
         <h2 class="h-display">${esc(day.title || "Workout")}</h2>
         ${day.image ? `<img class="today__shot" src="${esc(day.image)}" alt="">` : ""}
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
        const d = editing ? draftDay(key) : store.dayPlan(key);
        const rest = isRest(d);
        // Editing, the card is not a link — the title itself is the field, and
        // a tap anywhere else opens the day so the exercises can be got at.
        const title = editing
          ? `<span class="day__title edit-text ${d.title ? "" : "is-empty"}" contenteditable="plaintext-only"
               data-edit="title" data-day="${key}" data-placeholder="Name it">${esc(d.title)}</span>`
          : `<span class="day__title">${rest ? (d.title ? esc(d.title) : "Rest") : esc(d.title || "Workout")}</span>`;
        return `<${editing ? "div" : "button"} class="day ${key === today ? "is-today" : ""} ${rest ? "is-rest" : ""}"
            ${editing ? "" : `data-go="#/day/${key}"`}>
          <span class="day__name">${DAY_SHORT[key]}${week[key]?.done ? `<span class="day__tick">&#10003;</span>` : ""}</span>
          ${d.image ? `<img class="day__shot" src="${esc(d.image)}" alt="" loading="lazy">` : ""}
          ${title}
          <span class="day__meta">${rest && !editing ? "&mdash;" : `${plural(d.exercises.length, "exercise")}${editing ? "" : ` &middot; ${estimateMinutes(d)} min`}`}
            ${editing ? `<button class="day__open" data-go="#/day/${key}">open &rarr;</button>` : ""}</span>
        </${editing ? "div" : "button"}>`;
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

  setTitle("Carissa", editing ? "editing the week" : "The week");
  if (editing) paintSaveBar(); else bar.hidden = true;
}

/* ==========================================================================
   One day
   ========================================================================== */

function renderDay(key) {
  const s = store.get();
  const day = editing ? draftDay(key) : store.dayPlan(key);
  const rest = isRest(day);

  screen.innerHTML = editing ? editableDay(key, day) : `
    ${day.image ? `<img class="day-hero" src="${esc(day.image)}" alt="" width="1600" height="900">` : ""}
    <p class="eyebrow">${DAY_NAMES[key]}</p>
    <h2 class="h-display">${esc(day.title || (rest ? "Rest day" : "Workout"))}</h2>
    ${day.description ? `<p class="muted" style="white-space:pre-wrap">${esc(day.description)}</p>` : ""}

    ${rest ? `<p class="note" style="margin-top:1.25rem">Nothing is scheduled for ${DAY_NAMES[key]}.
        ${adminOn() ? "Press the pencil at the top to add some exercises." : ""}</p>`
      : `<p class="today__meta">
           <span>${plural(day.exercises.length, "exercise")}</span>
           <span>${plural(plannedSets(day), "set")}</span>
           <span>about ${estimateMinutes(day)} min</span>
         </p>
         <ol class="ex-list">
           ${day.exercises.map((ex, i) => `<li class="ex">
               ${thumb(ex)}
               <span class="ex__body">
                 <span class="ex__name">${esc(ex.name)}</span>
                 <span class="ex__meta">${ex.sets} &times; ${esc(ex.reps || "reps")}${ex.rest ? ` &middot; ${ex.rest}s rest` : ""} &middot; ${esc(effortLabel(ex.effort))}</span>
               </span>
               <span class="ex__n">${i + 1}</span>
             </li>`).join("")}
         </ol>`}

    <div class="btn-row" style="margin-top:1.5rem">
      ${rest ? "" : `<button class="btn btn--go btn--big" data-go="#/go/${key}">Start the workout</button>`}
      ${adminOn() ? `<button class="btn" data-action="edit-here">Edit this day</button>` : ""}
    </div>
    ${footer()}`;

  setTitle(DAY_NAMES[key], editing ? "editing" : (day.title || (rest ? "Rest day" : "Workout")));
  if (editing) paintSaveBar(); else bar.hidden = true;
}

/* The little square beside an exercise: its own picture if it has one, a frame
   from nothing if it does not. It is the same control in both modes — read
   only it is a thumbnail, editing it is the button that changes the media. */
function thumb(ex, editable = false, day = "", i = 0) {
  const v = videoSource(ex.video);
  const has = ex.image || v.kind === "file" || v.kind === "embed";
  const inner = ex.image
    ? `<img src="${esc(ex.image)}" alt="" loading="lazy">`
    : v.kind !== "none"
      ? `<span class="thumb__play" aria-hidden="true">&#9654;</span>`
      : `<span class="thumb__none" aria-hidden="true">${editable ? "+" : "&middot;"}</span>`;

  const label = has ? (v.kind !== "none" ? "video" : "picture") : "add a picture or video";
  return editable
    ? `<button type="button" class="thumb thumb--edit ${has ? "" : "is-empty"}"
         data-action="pick-media" data-day="${day}" data-i="${i}"
         aria-label="${esc(label)} for ${esc(ex.name || "this exercise")}">${inner}</button>`
    : `<span class="thumb ${has ? "" : "is-empty"}" aria-hidden="true">${inner}</span>`;
}

/* ==========================================================================
   Editing

   One draft of the whole week, made when the pencil is pressed and thrown
   away when it is pressed again. Moving between days keeps the changes; only
   Save sends them anywhere.
   ========================================================================== */

let editing = false;
let draft = null;

const clone = (o) => JSON.parse(JSON.stringify(o));

function startEditing() {
  draft = clone(store.plan());
  editing = true;
  render();
}

function stopEditing() {
  editing = false;
  draft = null;
  render();
}

const draftDay = (key) => draft?.days.find((d) => d.day === key) || store.dayPlan(key);

/** Has anything actually changed? Cheap enough at this size, and never wrong. */
const dirty = () => !!draft && JSON.stringify(draft.days) !== JSON.stringify(store.plan().days);

function countChanges() {
  if (!draft) return 0;
  const now = store.plan().days;
  return draft.days.reduce((n, d, i) => n + (JSON.stringify(d) === JSON.stringify(now[i]) ? 0 : 1), 0);
}

/** The save bar is patched, never re-rendered — a repaint would eat the caret. */
function paintSaveBar() {
  if (!editing) { bar.hidden = true; return; }
  const n = countChanges();
  barIn.innerHTML = n
    ? `<button class="btn btn--big btn--go" data-action="save-week"><span>Save &mdash; ${plural(n, "day")} changed</span></button>
       <button class="icon-btn" data-action="discard-week" aria-label="Discard changes">&#8630;</button>`
    : `<button class="btn btn--big" data-action="done-editing"><span>Done editing</span></button>`;
  bar.hidden = false;
}

function editableDay(key, day) {
  return `
    <p class="eyebrow">Editing &middot; ${DAY_NAMES[key]}</p>

    <div class="day-hero-edit">
      ${thumb({ image: day.image, video: "", name: day.title }, true, key, "")}
      <h2 class="h-display edit-text" contenteditable="plaintext-only" spellcheck="true"
          data-edit="title" data-day="${key}"
          data-placeholder="Name this workout">${esc(day.title)}</h2>
    </div>

    <p class="lede-edit edit-text" contenteditable="plaintext-only" spellcheck="true"
       data-edit="description" data-day="${key}" data-multiline="1"
       data-placeholder="What it is for, and anything she should know before starting.">${esc(day.description)}</p>

    <p class="edit-inline">
      About <input type="number" class="edit-num" data-field="minutes" data-day="${key}"
        value="${day.minutes || ""}" min="0" max="600" step="5"
        placeholder="${estimateMinutes(day) || 30}"> minutes
      <span class="dimmer small">&mdash; leave it empty and the app works it out</span>
    </p>

    <h2 class="h-section">Exercises</h2>

    <div class="edit-list">
      ${day.exercises.map((ex, i) => editableExercise(ex, i, key, day.exercises.length)).join("")}
    </div>

    <div class="btn-row" style="margin-top:.75rem">
      <button class="btn" data-action="add-exercise" data-day="${key}">+ Add an exercise</button>
      ${day.exercises.length ? `<button class="btn btn--danger" data-action="clear-day" data-day="${key}">Make it a rest day</button>` : ""}
    </div>

    <h2 class="h-section">The rest of the week</h2>
    <div class="week">
      ${DAY_KEYS.map((k) => {
        const d = draftDay(k);
        return `<button class="day ${k === key ? "is-today" : ""}" data-go="#/day/${k}">
          <span class="day__name">${DAY_SHORT[k]}</span>
          <span class="day__title">${esc(d.title || "Rest")}</span>
          <span class="day__meta">${d.exercises.length ? plural(d.exercises.length, "exercise") : "&mdash;"}</span>
        </button>`;
      }).join("")}
    </div>
    ${footer()}`;
}

function editableExercise(ex, i, key, total) {
  const v = videoSource(ex.video);
  return `<div class="edit-ex" data-i="${i}">
    <div class="edit-ex__top">
      ${thumb(ex, true, key, i)}
      <div class="edit-ex__head">
        <span class="edit-text edit-text--name" contenteditable="plaintext-only" spellcheck="true"
          data-edit="ex-name" data-day="${key}" data-i="${i}"
          data-placeholder="Name this exercise">${esc(ex.name)}</span>
        <span class="edit-ex__media small dimmer">${mediaLabel(ex, v)}</span>
      </div>
      <div class="edit-ex__moves">
        <button type="button" class="mini" data-action="move-up" data-day="${key}" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Move up">&uarr;</button>
        <button type="button" class="mini" data-action="move-down" data-day="${key}" data-i="${i}" ${i === total - 1 ? "disabled" : ""} aria-label="Move down">&darr;</button>
        <button type="button" class="mini" data-action="remove-exercise" data-day="${key}" data-i="${i}" aria-label="Remove">&times;</button>
      </div>
    </div>

    <p class="edit-inline">
      <select class="edit-sel" data-field="sets" data-day="${key}" data-i="${i}" aria-label="Sets">
        ${Array.from({ length: 10 }, (_, n) => `<option value="${n + 1}" ${ex.sets === n + 1 ? "selected" : ""}>${n + 1}</option>`).join("")}
      </select>
      sets of
      <span class="edit-text edit-text--reps" contenteditable="plaintext-only"
        data-edit="ex-reps" data-day="${key}" data-i="${i}"
        data-placeholder="12">${esc(ex.reps)}</span>
      &middot;
      <input type="number" class="edit-num" data-field="rest" data-day="${key}" data-i="${i}"
        value="${ex.rest}" min="0" max="900" step="15" aria-label="Rest in seconds">s rest
    </p>

    <p class="edit-inline">
      <select class="edit-sel edit-sel--wide" data-field="effort" data-day="${key}" data-i="${i}" aria-label="Effort">
        ${EFFORTS.map((e) => `<option value="${e.key}" ${ex.effort === e.key ? "selected" : ""}>${esc(e.label)}</option>`).join("")}
      </select>
    </p>

    <p class="edit-text edit-text--notes" contenteditable="plaintext-only" spellcheck="true"
       data-edit="ex-notes" data-day="${key}" data-i="${i}" data-multiline="1"
       data-placeholder="Notes for her, shown while she does it">${esc(ex.notes)}</p>
  </div>`;
}

function mediaLabel(ex, v) {
  const bits = [];
  if (v.kind === "embed") bits.push(v.provider);
  else if (v.kind === "file") bits.push("video");
  else if (v.kind === "link") bits.push("a link, not playable here");
  if (ex.image) bits.push("picture");
  return bits.length ? bits.join(" &middot; ") : "Add a picture or video";
}

/* ---------- typing straight into the draft ---------- */

/* Written on every keystroke rather than read back at save time, so a mis-tap
   on Back cannot lose half of what was typed. The element is never re-rendered
   while it has focus — that would put the caret back at the start. */
screen.addEventListener("input", (e) => {
  const el = e.target.closest("[data-edit]");
  if (!el || !editing) return;
  const { edit, day, i } = el.dataset;
  const d = draftDay(day);
  if (!d) return;
  const value = readText(el, el.dataset.multiline === "1");

  if (edit === "title") d.title = value;
  else if (edit === "description") d.description = value;
  else {
    const ex = d.exercises[Number(i)];
    if (!ex) return;
    if (edit === "ex-name") ex.name = value;
    else if (edit === "ex-reps") ex.reps = value;
    else if (edit === "ex-notes") ex.notes = value;
  }
  el.classList.toggle("is-empty", !value);
  paintSaveBar();
});

screen.addEventListener("change", (e) => {
  const el = e.target.closest("[data-field]");
  if (!el || !editing) return;
  const { field, day, i } = el.dataset;
  const d = draftDay(day);
  if (!d) return;

  if (field === "minutes") d.minutes = Number(el.value) || 0;
  else {
    const ex = d.exercises[Number(i)];
    if (!ex) return;
    if (field === "sets") ex.sets = Number(el.value) || 1;
    else if (field === "rest") ex.rest = Number(el.value) || 0;
    else if (field === "effort") ex.effort = el.value;
  }
  paintSaveBar();
});

/* Enter ends a single-line field rather than starting a second line in it. */
screen.addEventListener("keydown", (e) => {
  const el = e.target.closest?.("[data-edit]");
  if (!el) return;
  if (e.key === "Enter" && el.dataset.multiline !== "1") { e.preventDefault(); el.blur(); }
  if (e.key === "Escape") el.blur();
});

async function saveWeek() {
  const next = clone(draft);
  // A row somebody added and never named is a blank line, not an exercise.
  for (const d of next.days) d.exercises = d.exercises.filter((ex) => String(ex.name || "").trim());
  try {
    const res = await store.savePlan(next);
    editing = false;
    draft = null;
    render();
    toast(res.note || (res.storage === "server" ? "Saved. It is live on every device." : "Saved on this device."),
      res.storage === "server" ? "good" : "");
  } catch (err) {
    toast(err.message || "Could not save.", "bad");
  }
}

/* ---------- adding a picture or a video ---------- */

/**
 * The picture and the video are two different things and the sheet says so.
 *
 * The picture is what it looks like — the thumbnail on the day list, the
 * poster on the stage. It is there the moment the screen paints.
 *
 * The video is what plays when she starts the exercise.
 *
 * They are independent. An exercise can have a picture and no video, which is
 * often all a familiar movement needs; it can have a video and no picture, and
 * the stage is simply black until it loads; or it can have both, which is the
 * best of it — the picture stands in until the video is ready.
 *
 * `i` of null means the sheet is for the DAY rather than an exercise, and a
 * day has a picture but no video: it is a workout, not a movement.
 */
function mediaSheet(key, i) {
  const day = draftDay(key);
  const forDay = i === null || i === undefined || i === "";
  const target = forDay ? day : day.exercises[Number(i)];
  if (!target) return;
  const idx = forDay ? "" : String(i);
  const v = videoSource(target.video || "");

  openSheet(forDay ? (day.title || DAY_NAMES[key]) : (target.name || "This exercise"), `
    <p class="eyebrow">Picture</p>
    <p class="small muted" style="margin-bottom:.75rem">${forDay
      ? "Shown on the week board and at the top of the day."
      : "The thumbnail in the list, and what the stage shows before the video plays."}</p>
    <div class="media-now media-now--small">
      ${target.image ? `<img src="${esc(target.image)}" alt="">` : `<div class="media-now__note dimmer">No picture</div>`}
    </div>
    <input type="file" id="m-image" accept="image/*" hidden>
    <div class="btn-row">
      <button class="btn" data-action="media-choose" data-target="m-image">${target.image ? "Change the picture" : "Add a picture"}</button>
      ${target.image ? `<button class="btn btn--ghost" data-action="media-drop" data-what="image" data-day="${key}" data-i="${idx}">Remove</button>` : ""}
    </div>

    ${forDay ? "" : `
      <hr style="border:0;border-top:1px solid var(--line);margin:1.5rem 0">

      <p class="eyebrow">Video</p>
      <p class="small muted" style="margin-bottom:.75rem">Plays when she starts this exercise.</p>
      <div class="media-now media-now--small">
        ${v.kind === "file" ? `<video src="${esc(v.src)}" muted playsinline controls preload="metadata"></video>`
          : v.kind === "embed" ? `<div class="media-now__note">${esc(v.provider)} video</div>`
          : v.kind === "link" ? `<div class="media-now__note">A link &mdash; it will not play in the app</div>`
          : `<div class="media-now__note dimmer">No video</div>`}
      </div>

      <label class="field field--hint"><span>Paste a link</span>
        <input type="url" id="m-url" value="${esc(target.video)}" placeholder="https://youtu.be/…" maxlength="2000">
        <small id="m-hint">${videoHint(target.video)}</small></label>
      <div class="btn-row" style="margin-bottom:1rem">
        <button class="btn btn--go" data-action="media-link" data-day="${key}" data-i="${idx}">Use this link</button>
      </div>

      <input type="file" id="m-video" accept="video/*" hidden>
      <div class="btn-row">
        <button class="btn" data-action="media-choose" data-target="m-video">Or take a clip on this phone</button>
        ${target.video ? `<button class="btn btn--ghost" data-action="media-drop" data-what="video" data-day="${key}" data-i="${idx}">Remove</button>` : ""}
      </div>
      <p class="small dimmer" style="margin-top:.6rem">A clip has to be under 4&nbsp;MB &mdash; that is as much as one
        upload can carry. Anything longer belongs on YouTube as an unlisted video, pasted in above.</p>
    `}
  `, (root) => {
    const url = root.querySelector("#m-url");
    url?.addEventListener("input", () => { root.querySelector("#m-hint").innerHTML = videoHint(url.value); });

    for (const [id, field] of [["m-image", "image"], ["m-video", "video"]]) {
      const input = root.querySelector("#" + id);
      if (!input) continue;
      input.addEventListener("change", async () => {
        const chosen = input.files?.[0];
        if (!chosen) return;
        toast("Sending…");
        try {
          const out = await upload(chosen);
          // Trust what the server says it stored, not what the input was
          // labelled: a phone hands back a .mov from the photo picker either
          // way, and putting a video in the picture slot would be silent and
          // baffling.
          const slot = out.kind === "video" ? "video" : "image";
          if (slot !== field) toast(`That is a ${slot}, so it went in the ${slot} slot.`);
          const t = forDay ? draftDay(key) : draftDay(key).exercises[Number(i)];
          t[slot] = out.url;
          closeSheet();
          render();
          toast(slot === "video" ? "Video added." : "Picture added.", "good");
        } catch (err) {
          toast(err.message, "bad");
        }
      });
    }
  });
}

function videoHint(url) {
  const v = videoSource(url);
  if (v.kind === "none") return "YouTube, Vimeo or Google Drive &mdash; or leave it and use a picture instead.";
  if (v.kind === "embed") return `${v.provider} &mdash; plays in the app.`;
  if (v.kind === "file") return "A video file &mdash; plays in the app, and works with no signal once seen.";
  return "Not a video this can play. It would show as a link instead.";
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
  if (!store.get().signedIn) {
    st.why = "Sign in first — a reminder is attached to this device on the server, and that needs the password.";
  }
  const on = st.subscribed && st.reminder?.enabled;
  const hour = st.reminder?.hour ?? 8;
  const snoozed = st.reminder?.snoozeUntil > Date.now();

  screen.innerHTML = `
    <p class="eyebrow">Reminders</p>
    <h2 class="h-display">${on ? "On for this device" : "Off for this device"}</h2>

    ${!st.supported || !st.ready || st.permission === "denied"
      ? `<p class="note note--warn">${esc(
          st.permission === "denied"
            ? "Notifications are blocked for this app in the browser's settings. Allow them there, then come back."
            : st.why || "Reminders are not available here.")}</p>
         ${!store.get().signedIn ? `<div class="btn-row"><button class="btn btn--go" data-action="sign-in">Sign in</button></div>` : ""}`
      : ""}

    <p class="muted">A nudge on the morning of a day that has a workout in it &mdash; never on a rest day, and never
      once it is already done.</p>

    <h2 class="h-section">Every day at</h2>
    ${hourPicker("daily-hour", hour)}
    <div class="btn-row" style="margin-top:1rem">
      ${on
        ? `<button class="btn btn--go" data-action="remind-save">Save this time</button>
           <button class="btn btn--ghost" data-action="remind-off">Turn off</button>`
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

  wireHourPicker(screen, "daily-hour");
  wireHourPicker(screen, "snooze-hour");
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

    ${adminOn() ? `<p class="eyebrow" style="margin-top:1.5rem">Edit the week</p>
      <div class="week">
        ${DAY_KEYS.map((k) => `<button class="day" data-action="edit-day" data-day="${k}">
          <span class="day__name">${DAY_SHORT[k]}</span>
          <span class="day__title">${esc(store.dayPlan(k).title || "Rest")}</span></button>`).join("")}
      </div>` : ""}

    <p class="eyebrow" style="margin-top:1.5rem">Reminders</p>
    <p class="small muted">A nudge on the morning of a day that has a workout in it.</p>
    <div class="btn-row"><button class="btn" data-action="go-remind">Set a reminder</button></div>

    ${adminOn() ? `<p class="eyebrow" style="margin-top:1.5rem">Editor</p>
      <p class="small muted">Unlocked on this device. It locks itself again twelve hours after you unlocked it,
        or right now if you press the button.</p>
      <div class="btn-row"><button class="btn btn--ghost" data-action="lock-admin">Lock the editor</button></div>` : ""}

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

function askSignIn(returnTo, thenUnlockAdmin = false) {
  /* The same sheet does two jobs and has to say which one it is doing. Reached
     from the long press or /#/admin it is the way into the editor, and calling
     it "Sign in" told somebody standing in front of it nothing at all. */
  openSheet(thenUnlockAdmin ? "Unlock the editor" : "Sign in", `
    <p class="small muted" style="margin-bottom:1rem">${thenUnlockAdmin
      ? "Type the password and the pencil appears in the bar at the top. Press it and the page you are looking at becomes editable &mdash; titles, exercises, pictures and videos."
      : "The app's own password. It syncs the record between devices, and it is what keeps the record private: nobody can read it without this."}</p>
    <label class="field"><span>Password</span>
      <input type="password" id="s-key" autocomplete="current-password" enterkeyhint="go"></label>
    <div class="btn-row"><button class="btn btn--go btn--wide" data-action="do-sign-in">Sign in</button></div>
    <p class="small dimmer" style="margin-top:1rem">${thenUnlockAdmin
      ? "The editor stays unlocked on this device for twelve hours, across every tab. Settings &rarr; Lock the editor ends it sooner."
      : "The week can be followed without signing in, and workouts done that way are kept on this phone and go up when you next sign in. Signing in is what shares them between devices."}</p>
  `, (root) => {
    const input = root.querySelector("#s-key");
    const submit = async () => {
      const res = await store.signIn(input.value);
      if (!res.ok) { toast(res.error, "bad"); return; }
      closeSheet();
      if (thenUnlockAdmin) { setAdmin(true); toast("Editor unlocked. The pencil is at the top.", "good"); }
      else toast("Signed in.", "good");
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

  /* The pencil shows only where it means something: signed in, and not in the
     middle of a workout. */
  const pencil = $("#edit-btn");
  const canEdit = adminOn() && !["#/go/", "#/history", "#/done/", "#/remind"].some((h) => location.hash.startsWith(h));
  pencil.hidden = !canEdit;
  pencil.classList.toggle("is-on", editing);
  pencil.setAttribute("aria-pressed", editing ? "true" : "false");
  pencil.setAttribute("aria-label", editing ? "Stop editing" : "Edit");
  document.body.classList.toggle("is-editing", editing);
}

function render() {
  const hash = location.hash || "#/";
  const [, route, arg] = hash.split("/");

  if (route !== "go") {
    stopTicking();
    playerPainted = false;
    mountedKey = null;
    mountedMedia = null;
  }

  /* Editing is a mode, not a screen, so the draft survives moving between
     days. It is dropped only when a workout starts — she is not editing the
     week with a dumbbell in her hand — and when Save or Discard is pressed. */
  if (route === "go" && editing) { editing = false; draft = null; }

  // #/edit/mon was the old form editor. It is now the day itself, with the
  // pencil already pressed — the URL stays valid because it may be bookmarked.
  if (route === "edit" && DAY_KEYS.includes(arg)) {
    if (store.get().signedIn) { if (!draft) { draft = clone(store.plan()); } editing = true; }
    location.replace(`#/day/${arg}`);
    return renderDay(arg);
  }

  if (route === "day" && DAY_KEYS.includes(arg)) return renderDay(arg);
  if (route === "go" && DAY_KEYS.includes(arg)) return renderPlayer(arg);
  if (route === "done" && arg) return renderSummary(arg);
  if (route === "history") return renderHistory();
  if (route === "remind") return renderRemind();
  if (route === "admin") { unlockAdmin(); location.replace("#/"); return renderWeek(); }
  return renderWeek();
}

window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });

$("#back").addEventListener("click", () => {
  if (history.length > 1) history.back(); else go("#/");
});
$("#edit-btn").addEventListener("click", () => {
  if (!adminOn()) { unlockAdmin(); return; }
  if (!editing) { startEditing(); return; }
  if (!dirty() || confirm("Throw away the changes you have made?")) stopEditing();
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

    /* ---- editing ---- */
    case "edit-here": startEditing(); break;
    case "save-week": saveWeek(); break;
    case "done-editing": stopEditing(); break;
    case "discard-week":
      if (!dirty() || confirm("Throw away the changes you have made?")) stopEditing();
      break;

    case "add-exercise": {
      draftDay(day).exercises.push({
        id: store.uid("ex"), name: "", video: "", image: "", sets: 3, reps: "12",
        rest: 60, effort: "strength", notes: "",
      });
      render();
      const added = document.querySelector('.edit-ex:last-of-type [data-edit="ex-name"]');
      added?.focus();
      break;
    }
    case "remove-exercise":
      draftDay(day).exercises.splice(Number(i), 1);
      render();
      break;
    case "move-up":
      swap(draftDay(day).exercises, Number(i), Number(i) - 1);
      render();
      break;
    case "move-down":
      swap(draftDay(day).exercises, Number(i), Number(i) + 1);
      render();
      break;
    case "clear-day":
      if (confirm("Clear every exercise and make this a rest day?")) {
        draftDay(day).exercises = [];
        render();
      }
      break;

    /* ---- a picture or a video ---- */
    case "pick-media": mediaSheet(day, i === "" ? null : i); break;
    case "media-choose": document.getElementById(el.dataset.target)?.click(); break;
    case "media-link": {
      const value = document.getElementById("m-url")?.value || "";
      draftDay(day).exercises[Number(i)].video = value.trim();
      closeSheet();
      render();
      toast(value.trim() ? "Link added." : "Link removed.");
      break;
    }
    case "media-drop": {
      const d = draftDay(day);
      const t = i === "" ? d : d.exercises[Number(i)];
      if (t) t[el.dataset.what] = "";
      closeSheet();
      render();
      toast("Removed.");
      break;
    }

    case "edit-day":
      closeSheet();
      if (!editing) startEditing();
      go(`#/day/${day}`);
      render();
      break;
    /* ---- reminders ---- */
    case "remind-on":
      push.enable({ hour: pickedHour("daily-hour") })
        .then(() => { toast("Reminders on.", "good"); renderRemind(); })
        .catch((err) => toast(err.message, "bad"));
      break;
    case "remind-save":
      push.update({ reminder: { enabled: true, hour: pickedHour("daily-hour") } })
        .then(() => { toast("Saved.", "good"); renderRemind(); })
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
    case "go-remind": closeSheet(); go("#/remind"); break;
    case "sign-in": closeSheet(); askSignIn(null); break;
    case "sign-out":
      closeSheet();
      setAdmin(false);
      editing = false; draft = null;
      store.signOut().then(() => { toast("Signed out."); render(); });
      break;
    case "lock-admin":
      closeSheet();
      setAdmin(false);
      editing = false; draft = null;
      toast("Editor locked.");
      render();
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

armAdminGesture();

store.subscribe(() => {
  // A repaint mid-workout would restart the video, so a player already on
  // screen looks after itself. One that has not been painted yet — a cold
  // start straight onto a workout URL — still needs this to draw it.
  if (location.hash.startsWith("#/go/") && playerPainted) return;
  // And never repaint the field somebody is typing in.
  if (editing && document.activeElement?.hasAttribute?.("data-edit")) return;
  render();
});

/* Held so anything that needs to know "is this person signed in?" can wait for
   a real answer instead of acting on the not-yet-loaded default of no. */
ready = store.load();

ready.then(() => {
  render();
  const live = store.loadLive();
  if (live && !location.hash.startsWith("#/go/")) {
    toast(`${live.title} is still in progress — tap to carry on.`);
  }
});

render();
