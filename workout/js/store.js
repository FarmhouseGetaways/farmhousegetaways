/* ==========================================================================
   The store — the plan, the record, and which copy is in charge.

   There are three copies of everything, and the whole sync story is about
   which one wins:

   1. THE SERVER — /api/plan and /api/history, two Netlify Blobs belonging to
      this site alone. When the site is deployed with WORKOUT_PASSWORD set,
      this is the truth. A workout logged on a phone is on the iPad a minute
      later.
   2. THE COMMITTED FILE — data/plan.json. The floor under everything. If the
      store has never been written or cannot be reached, the app still knows
      the week.
   3. THIS BROWSER — localStorage. With a server it is a cache, so an installed
      copy works in a gym with no signal. Without a server it IS the working
      copy, and the app says so on screen rather than pretending a save went
      somewhere.

   Nothing above this layer has to know which mode is in force. Every write
   returns having succeeded locally, whatever the network did; anything that
   could not be sent is queued and goes out on the next successful call.

   THE PASSWORD IS NEVER STORED HERE. Signing in posts it once to /api/auth,
   which sets an HttpOnly cookie the page cannot read. Every later request
   carries that cookie on its own.
   ========================================================================== */

import { sessionCalories, todayKey, DAY_KEYS, startOfDay } from "./catalog.js";

const API = {
  auth: "/api/auth",
  plan: "/api/plan",
  history: "/api/history",
};
const SOURCE = "data/plan.json";

const KEYS = {
  plan: "fg-workout-plan",
  history: "fg-workout-history",
  pending: "fg-workout-pending", // workouts that have not reached the server yet
  live: "fg-workout-live",       // a workout in progress, so closing the app loses nothing
};

/* ---------- localStorage that cannot take the page down ---------- */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function write(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Private browsing, a full quota, a locked-down browser. The app carries
    // on in memory for this visit rather than falling over.
    return false;
  }
}

/* ---------- shape ---------- */

export const emptyDay = (day) => ({ day, title: "", description: "", minutes: 0, exercises: [] });
export const emptyPlan = () => ({ version: 1, updated: "", days: DAY_KEYS.map(emptyDay) });
export const emptyHistory = () => ({ version: 1, updated: "", settings: { weightLb: 150, countRest: true }, sessions: [] });

/** Seven days in order, whatever arrived. The app never has to check. */
function shapePlan(raw) {
  const byKey = {};
  const days = Array.isArray(raw?.days) ? raw.days : [];
  for (const d of days) if (d && DAY_KEYS.includes(d.day)) byKey[d.day] = d;
  if (!Array.isArray(raw?.days) && raw?.days && typeof raw.days === "object") {
    for (const k of DAY_KEYS) if (raw.days[k]) byKey[k] = { ...raw.days[k], day: k };
  }
  return {
    version: 1,
    updated: raw?.updated || "",
    days: DAY_KEYS.map((k) => ({ ...emptyDay(k), ...(byKey[k] || {}), day: k,
      exercises: Array.isArray(byKey[k]?.exercises) ? byKey[k].exercises : [] })),
  };
}

function shapeHistory(raw) {
  const base = emptyHistory();
  return {
    version: 1,
    updated: raw?.updated || "",
    settings: { ...base.settings, ...(raw?.settings || {}) },
    sessions: (Array.isArray(raw?.sessions) ? raw.sessions : []).filter((s) => s && s.id),
  };
}

export const uid = (prefix) =>
  prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- state ---------- */

const state = {
  plan: emptyPlan(),
  history: emptyHistory(),
  mode: "local",        // "server" once /api/plan has answered
  signedIn: false,
  hasPassword: true,    // assumed until the server says otherwise
  note: "",             // why the mode is what it is, in plain English
  loaded: false,
};

const listeners = new Set();
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => { for (const fn of [...listeners]) { try { fn(state); } catch (e) { console.error(e); } } };

export const get = () => state;
export const plan = () => state.plan;
export const history = () => state.history;
export const settings = () => state.history.settings;
export const dayPlan = (key) => state.plan.days.find((d) => d.day === key) || emptyDay(key);

/* ---------- talking to the server ---------- */

/**
 * The session cookie is SameSite=Strict and HttpOnly. `credentials: "include"`
 * is what makes fetch send it; the default would too for a same-origin call,
 * but saying so means an installed copy on a different scope cannot silently
 * stop authenticating.
 */
async function call(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

/* ---------- loading ---------- */

/**
 * Work out which mode we are in and fill the state.
 *
 * Order matters. The cached copy goes on screen first so the app is usable in
 * the time the network takes, then the server's answer replaces it. On a phone
 * in a gym with two bars that is the difference between a working app and a
 * spinner.
 */
export async function load() {
  state.plan = shapePlan(read(KEYS.plan, null) || emptyPlan());
  state.history = shapeHistory(read(KEYS.history, null) || emptyHistory());
  if (state.plan.days.some((d) => d.exercises.length)) { state.loaded = true; emit(); }

  let served = null;
  try {
    const { res, body } = await call(API.plan);
    if (res.ok && body.plan) served = body;
  } catch {
    served = null;                                    // no signal: the cache stands
  }

  if (served) {
    state.mode = "server";
    state.signedIn = !!served.signedIn;
    state.hasPassword = served.editable !== false;
    state.note = state.hasPassword ? "" : "No password is set on this site, so nothing can be saved to it.";
    state.plan = shapePlan(served.plan);
    write(KEYS.plan, state.plan);
    if (state.signedIn) await pullHistory();
  } else {
    state.mode = "local";
    state.signedIn = false;
    state.note = "";
    // No server, and nothing cached: fall back to the committed plan so the
    // week is never blank on a fresh phone.
    if (!state.plan.days.some((d) => d.exercises.length)) {
      try {
        const res = await fetch(SOURCE, { cache: "no-store" });
        if (res.ok) { state.plan = shapePlan(await res.json()); write(KEYS.plan, state.plan); }
      } catch { /* the empty week stands */ }
    }
  }

  state.loaded = true;
  emit();
  flush();          // anything logged while offline goes out now
  return state;
}

/** Read the record back and fold in anything this device logged while away. */
async function pullHistory() {
  try {
    const { res, body } = await call(API.history);
    if (!res.ok || !body.history) return false;
    state.history = mergeLocalInto(shapeHistory(body.history));
    write(KEYS.history, state.history);
    return true;
  } catch { return false; }
}

/** Anything logged on this device that the server has not got yet survives. */
function mergeLocalInto(serverHistory) {
  const seen = new Set(serverHistory.sessions.map((s) => s.id));
  const extra = (state.history.sessions || []).filter((s) => !seen.has(s.id));
  return {
    ...serverHistory,
    sessions: [...serverHistory.sessions, ...extra].sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1)),
  };
}

/* ---------- signing in ---------- */

/**
 * The password goes to the server once and is not kept anywhere in the
 * browser. What comes back is an HttpOnly cookie the page cannot read.
 */
export async function signIn(password) {
  const trimmed = String(password || "").trim();
  if (!trimmed) return { ok: false, error: "Type the password first." };

  let res, body;
  try {
    ({ res, body } = await call(API.auth, { method: "POST", body: JSON.stringify({ password: trimmed }) }));
  } catch {
    return { ok: false, error: "Could not reach the app's server. Check the connection and try again." };
  }

  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error || "That password isn't right." };
  }

  state.signedIn = true;
  state.mode = "server";
  await pullHistory();
  emit();
  flush();
  return { ok: true };
}

export async function signOut() {
  try { await call(API.auth, { method: "DELETE" }); } catch { /* the cookie expires anyway */ }
  state.signedIn = false;
  emit();
}

/* ---------- writing ---------- */

/**
 * Save the week.
 *
 * The whole plan is sent and the whole plan is replaced: there is one editor
 * and one week, so there is nothing to merge and no way for two devices to
 * half-overwrite each other.
 */
export async function savePlan(next) {
  state.plan = shapePlan(next);
  write(KEYS.plan, state.plan);
  emit();

  if (state.mode !== "server" || !state.signedIn) {
    return { ok: true, storage: "local",
      note: "Saved on this device. Sign in to share it with the other ones." };
  }

  const { res, body } = await call(API.plan, { method: "PUT", body: JSON.stringify({ plan: state.plan }) });
  if (!res.ok) {
    if (res.status === 401) { state.signedIn = false; emit(); }
    throw new Error(body.error || `The server said ${res.status}.`);
  }
  if (body.plan) { state.plan = shapePlan(body.plan); write(KEYS.plan, state.plan); emit(); }
  return { ok: true, storage: "server" };
}

/**
 * Log a finished — or abandoned — workout.
 *
 * It lands locally first and always. The server call can fail for any of the
 * ordinary reasons and it must not cost her the record of an hour's work, so a
 * failure queues it and the next successful call takes it along.
 */
export async function logSession(session) {
  const clean = { ...session, calories: session.calories ?? sessionCalories(session, settings()) };

  state.history = {
    ...state.history,
    sessions: [clean, ...state.history.sessions.filter((s) => s.id !== clean.id)]
      .sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1)),
  };
  write(KEYS.history, state.history);
  emit();

  return send([clean]);
}

export async function saveSettings(patch) {
  state.history = { ...state.history, settings: { ...state.history.settings, ...patch } };
  write(KEYS.history, state.history);
  emit();

  if (state.mode !== "server" || !state.signedIn) return { ok: true, storage: "local" };
  try {
    const { res, body } = await call(API.history, {
      method: "POST",
      body: JSON.stringify({ settings: state.history.settings, sessions: [] }),
    });
    if (!res.ok) return { ok: false, error: body.error || `The server said ${res.status}.` };
    return { ok: true, storage: "server" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function deleteSession(id) {
  state.history = { ...state.history, sessions: state.history.sessions.filter((s) => s.id !== id) };
  write(KEYS.history, state.history);
  // A queued workout deleted before it was ever sent must not come back to
  // life on the next flush.
  write(KEYS.pending, (read(KEYS.pending, []) || []).filter((s) => s.id !== id));
  emit();

  if (state.mode !== "server" || !state.signedIn) return { ok: true, storage: "local" };
  try {
    const { res, body } = await call(API.history, { method: "DELETE", body: JSON.stringify({ ids: [id] }) });
    if (!res.ok) return { ok: false, error: body.error || `The server said ${res.status}.` };
    if (body.history) { state.history = shapeHistory(body.history); write(KEYS.history, state.history); emit(); }
    return { ok: true, storage: "server" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* ---------- the queue ---------- */

async function send(sessions) {
  if (state.mode !== "server" || !state.signedIn) {
    queue(sessions);
    return { ok: true, storage: "local",
      note: state.mode === "server"
        ? "Saved on this phone. Sign in to keep it on the server too."
        : "Saved on this phone." };
  }
  try {
    const pending = read(KEYS.pending, []) || [];
    const { res, body } = await call(API.history, {
      method: "POST",
      body: JSON.stringify({ sessions: [...pending, ...sessions], settings: state.history.settings }),
    });
    if (!res.ok) throw new Error(body.error || `The server said ${res.status}.`);
    write(KEYS.pending, []);
    if (body.history) { state.history = shapeHistory(body.history); write(KEYS.history, state.history); emit(); }
    return { ok: true, storage: "server" };
  } catch (err) {
    queue(sessions);
    return { ok: false, storage: "local", error: err.message,
      note: "Saved on this phone. It will go to the server next time there is a connection." };
  }
}

function queue(sessions) {
  const pending = read(KEYS.pending, []) || [];
  const byId = new Map(pending.map((s) => [s.id, s]));
  for (const s of sessions) byId.set(s.id, s);
  write(KEYS.pending, [...byId.values()]);
}

export const pendingCount = () => (read(KEYS.pending, []) || []).length;

/** Push anything queued. Called on load, after signing in, and when the network returns. */
export async function flush() {
  const pending = read(KEYS.pending, []) || [];
  if (!pending.length || state.mode !== "server" || !state.signedIn) return { ok: false, sent: 0 };
  try {
    const { res, body } = await call(API.history, {
      method: "POST",
      body: JSON.stringify({ sessions: pending, settings: state.history.settings }),
    });
    if (!res.ok) return { ok: false, sent: 0 };
    write(KEYS.pending, []);
    if (body.history) { state.history = shapeHistory(body.history); write(KEYS.history, state.history); }
    emit();
    return { ok: true, sent: pending.length };
  } catch {
    return { ok: false, sent: 0 };
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { flush(); });
}

/* ---------- a workout in progress ---------- */

/* Saved on every set so that a locked phone, a dropped call or a closed tab
   costs nothing. Kept apart from the record: it is not a workout until it is
   finished, and a half-done one must never turn up in the totals. */
export const loadLive = () => read(KEYS.live, null);
export const saveLive = (live) => write(KEYS.live, live);
export const clearLive = () => write(KEYS.live, null);

/* ---------- the numbers the history screen shows ---------- */

export function stats(sessions = state.history.sessions) {
  /* Every logged workout counts, including one she cut short. A session is
     only written at all if at least one set was done, so "part done" is real
     work and hiding it from the totals would be discouraging and untrue.
     `complete` is a label on the row, not a filter on the maths. */
  const done = sessions;
  const total = {
    workouts: done.length,
    minutes: Math.round(done.reduce((n, s) => n + (s.elapsedSec || 0), 0) / 60),
    calories: done.reduce((n, s) => n + (s.calories || 0), 0),
    sets: done.reduce((n, s) => n + (s.setsDone || 0), 0),
  };

  const dates = new Set(done.map((s) => s.date));
  return { ...total, streak: streakFrom(dates), thisWeek: weekOf(done), days: dates.size };
}

/**
 * Consecutive days, counting back from today.
 *
 * Today not being done yet does not break a streak — it is only nine in the
 * morning. It breaks when yesterday was missed as well.
 */
function streakFrom(dates) {
  const day = 86400000;
  let cursor = startOfDay(new Date());
  if (!dates.has(todayKey(new Date(cursor)))) cursor -= day;

  let n = 0;
  while (dates.has(todayKey(new Date(cursor)))) { n++; cursor -= day; }
  return n;
}

/** Monday to Sunday of the week we are in, as a map of day key to session. */
export function weekOf(sessions = state.history.sessions) {
  const now = new Date();
  const monday = startOfDay(now) - ((now.getDay() + 6) % 7) * 86400000;
  const out = {};
  for (let i = 0; i < 7; i++) {
    const key = todayKey(new Date(monday + i * 86400000));
    const found = sessions.filter((s) => s.date === key);
    out[DAY_KEYS[i]] = { date: key, sessions: found, done: found.length > 0 };
  }
  return out;
}
