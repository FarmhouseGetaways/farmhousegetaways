/* ==========================================================================
   The store — the schedule, the record, and which copy is in charge.

   Rebuilt 28 Aug 2026 around personal schedules instead of one shared week.
   There is no more public plan: what used to be "the week" is now each
   account's own assignments — which workout, on which day, at which time —
   set by the admin and read here as SCHEDULE, resolved (each assignment
   with its workout, each workout with its exercises) so the rest of the app
   never has to join anything itself.

   There are three copies of the schedule, and the whole sync story is about
   which one wins:

   1. THE SERVER — /api/assignments (this account's own, resolved) and
      /api/history, both Netlify Blobs belonging to this site alone. A
      workout logged on a phone is on the iPad a minute later.
   2. THIS BROWSER, last time it heard from the server — localStorage,
      cached per account. Not a floor under a brand new phone the way the
      committed plan.json used to be: a schedule is personal now, so there
      is nothing to show before an account has signed in and been fetched
      at least once. It IS the working copy in a gym with no signal, and the
      app says so on screen rather than pretending a save went somewhere.
   3. NOTHING, signed out. There is no shared week to fall back to any more
      — see the "sign in to see your week" state on the week screen.

   THE PASSWORD IS NEVER STORED HERE. Signing in posts it once to /api/auth,
   which sets an HttpOnly cookie the page cannot read. Every later request
   carries that cookie on its own.

   SIGNING IN AND HAVING AN ACCOUNT ARE TWO DIFFERENT THINGS
   "Signing in" above, and `signedIn` below, is the app's one shared admin
   password — it gates the editor and nothing else. An account (see
   js/account.js and `state.account` below) is a real person's own email and
   password, or Google, and it is what a training record — and now a
   schedule — is attached to and what makes it sync. The two are unrelated
   locks; having one says nothing about the other.
   ========================================================================== */

import { sessionCalories, todayKey, dayKeyOf, DAY_KEYS, startOfDay } from "./catalog.js";
import { computeInsights } from "./insights.js";
import * as account from "./account.js";
import * as assignmentsApi from "./assignments.js";

const API = {
  auth: "/api/auth",
  history: "/api/history",
};

const KEYS = {
  schedule: "fg-workout-schedule",  // this account's own resolved assignments
  history: "fg-workout-history",   // used only when nobody is signed into an account
  pending: "fg-workout-pending",
  live: "fg-workout-live",       // a workout in progress, so closing the app loses nothing
};

/* A signed-in account's schedule, history and queue are cached under their
   own key, so two different people signing into the same account system on
   the same phone never see a flash of the wrong person's data before the
   server's answer arrives. There is no unscoped fallback for the schedule —
   signed out, there is no schedule at all. */
const scheduleKey = () => `${KEYS.schedule}:${state.account?.id}`;
const historyKey = () => (state.account ? `${KEYS.history}:${state.account.id}` : KEYS.history);
const pendingKey = () => (state.account ? `${KEYS.pending}:${state.account.id}` : KEYS.pending);

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

export const emptyHistory = () => ({ version: 1, updated: "", settings: { weightLb: 150, countRest: true }, sessions: [] });

/** Whatever the server sent back, defensively — an array of resolved
 * assignments, each `{ id, day, time, workoutId, workout }`, `workout` null
 * if it has since been removed from the library. Never throws on junk; an
 * empty schedule is always a safe answer. */
function shapeSchedule(raw) {
  return (Array.isArray(raw) ? raw : [])
    .filter((a) => a && DAY_KEYS.includes(a.day))
    .map((a) => ({
      id: String(a.id || ""), day: a.day, time: String(a.time || "08:00"),
      workoutId: String(a.workoutId || ""),
      workout: a.workout && typeof a.workout === "object"
        ? { ...a.workout, exercises: Array.isArray(a.workout.exercises) ? a.workout.exercises : [] }
        : null,
    }));
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
  schedule: [],          // this account's own resolved assignments, or [] signed out
  history: emptyHistory(),
  mode: "local",        // "server" once the server has answered at least once
  signedIn: false,       // the admin password — gates the editor only
  hasPassword: true,    // assumed until the server says otherwise
  note: "",             // why the mode is what it is, in plain English
  loaded: false,

  account: null,               // { id, email, name } | null — a real person's account
  accountConfig: {              // what this site is set up to offer
    full: false, maxUsers: 5, mailConfigured: false, google: null,
  },
};

const listeners = new Set();
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => { for (const fn of [...listeners]) { try { fn(state); } catch (e) { console.error(e); } } };

export const get = () => state;
export const history = () => state.history;
export const settings = () => state.history.settings;

/** This account's schedule, grouped by weekday and sorted by time within
 * each — the shape every screen actually wants. Empty arrays for a day with
 * nothing assigned, never undefined, so `weekSchedule()[key]` always works. */
export function weekSchedule() {
  const out = Object.fromEntries(DAY_KEYS.map((k) => [k, []]));
  for (const a of state.schedule) out[a.day].push(a);
  for (const k of DAY_KEYS) out[k].sort((x, y) => (x.time < y.time ? -1 : x.time > y.time ? 1 : 0));
  return out;
}

export const todaySchedule = () => weekSchedule()[dayKeyOf()] || [];

/** One assignment by id, wherever it falls in the week — what the player
 * resolves a workout from when a session starts. */
export const findAssignment = (id) => state.schedule.find((a) => a.id === id) || null;

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
  // state.account is not known yet, so this reads the plain, unscoped
  // history key — correct for "nobody signed in" and replaced below the
  // moment an account status comes back, so a second person's phone never
  // shows a flash of it. There is no unscoped schedule to read: signed out,
  // there is nothing to show.
  state.history = shapeHistory(read(historyKey(), null) || emptyHistory());

  let acctStatus = null;
  let authStatus = null;
  try {
    [acctStatus, authStatus] = await Promise.all([
      account.status().catch(() => null),
      call(API.auth).catch(() => null),
    ]);
  } catch { /* no signal: everything below falls back to "local" */ }

  if (authStatus?.res.ok) {
    state.mode = "server";
    state.signedIn = !!authStatus.body.signedIn;
    state.hasPassword = !!authStatus.body.configured;
    state.note = state.hasPassword ? "" : "No password is set on this site, so nothing can be saved to it.";
  } else {
    state.mode = "local";
    state.signedIn = false;
    state.note = "Could not reach the app's server.";
  }

  if (acctStatus?.ok) {
    state.accountConfig = {
      full: !!acctStatus.full, maxUsers: acctStatus.maxUsers || 5,
      mailConfigured: !!acctStatus.mailConfigured, google: acctStatus.google || null,
    };
    if (acctStatus.signedIn && acctStatus.account) {
      state.account = acctStatus.account;
      // Re-read from this account's own cache — the reads above used the
      // generic/absent key because nobody was known to be signed in yet.
      state.history = shapeHistory(read(historyKey(), null) || emptyHistory());
      state.schedule = shapeSchedule(read(scheduleKey(), null) || []);
      // Paint the cached schedule now, before the network round trip below —
      // the same reasoning as the cached plan used to get on screen first.
      if (state.schedule.length) { state.loaded = true; emit(); }
      await Promise.all([pullHistory(), pullSchedule()]);
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
    write(historyKey(), state.history);
    return true;
  } catch { return false; }
}

/** This account's own schedule, resolved server-side against the workout and
 * exercise pools — nothing here has to join anything itself. */
async function pullSchedule() {
  try {
    const res = await assignmentsApi.mine();
    if (!res.ok) return false;
    state.schedule = shapeSchedule(res.assignments);
    write(scheduleKey(), state.schedule);
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

  // The admin password. It has nothing to do with anyone's training record
  // or schedule — that is an account's business (see accountLogIn et al
  // below) — so there is nothing to pull here, only the admin screens
  // becoming reachable.
  state.signedIn = true;
  state.mode = "server";
  emit();
  return { ok: true };
}

export async function signOut() {
  try { await call(API.auth, { method: "DELETE" }); } catch { /* the cookie expires anyway */ }
  state.signedIn = false;
  emit();
}

/* ---------- accounts ---------- */

/** After any successful sign-in — new account, existing one, or Google.
 * Three things: remember who it is, bring along whatever this device already
 * has for them (their own cache, plus any local-only workouts logged on this
 * phone before an account ever existed here — nobody signed in yet is what
 * "signed out" always meant, not "nothing counts"), then reconcile with the
 * server. */
async function afterAccountSignIn(result) {
  if (!result.ok) return result;
  state.account = result.account;

  const ownCache = shapeHistory(read(historyKey(), null) || emptyHistory());
  const orphaned = shapeHistory(read(KEYS.history, null) || emptyHistory());
  const known = new Set(ownCache.sessions.map((s) => s.id));
  const carried = orphaned.sessions.filter((s) => !known.has(s.id));
  state.history = carried.length
    ? { ...ownCache, sessions: [...ownCache.sessions, ...carried].sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1)) }
    : ownCache;
  write(historyKey(), state.history);
  state.schedule = shapeSchedule(read(scheduleKey(), null) || []);

  emit();
  await Promise.all([pullHistory(), pullSchedule()]);
  emit();
  flush();
  return { ok: true };
}

export const accountSignUp = (fields) => account.signUp(fields).then(afterAccountSignIn);
export const accountLogIn = (fields) => account.logIn(fields).then(afterAccountSignIn);
export const accountWithGoogle = (credential) => account.withGoogle(credential).then(afterAccountSignIn);
export const accountRequestReset = (email) => account.requestReset(email);
export const accountResetPassword = (fields) => account.resetPassword(fields).then(afterAccountSignIn);
export const accountChangePassword = (fields) => account.changePassword(fields).then(afterAccountSignIn);

export async function accountLogOut() {
  await account.logOut();
  state.account = null;
  state.history = emptyHistory();
  state.schedule = [];
  emit();
}

/** Admin only. See js/account.js's listPeople and the endpoint behind it. */
export const listPeople = () => account.listPeople();

/* ---------- writing ---------- */

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
  write(historyKey(), state.history);
  emit();

  return send([clean]);
}

export async function saveSettings(patch) {
  state.history = { ...state.history, settings: { ...state.history.settings, ...patch } };
  write(historyKey(), state.history);
  emit();

  if (state.mode !== "server" || !state.account) return { ok: true, storage: "local" };
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
  write(historyKey(), state.history);
  // A queued workout deleted before it was ever sent must not come back to
  // life on the next flush.
  write(pendingKey(), (read(pendingKey(), []) || []).filter((s) => s.id !== id));
  emit();

  if (state.mode !== "server" || !state.account) return { ok: true, storage: "local" };
  try {
    const { res, body } = await call(API.history, { method: "DELETE", body: JSON.stringify({ ids: [id] }) });
    if (!res.ok) return { ok: false, error: body.error || `The server said ${res.status}.` };
    if (body.history) { state.history = shapeHistory(body.history); write(historyKey(), state.history); emit(); }
    return { ok: true, storage: "server" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* ---------- the queue ---------- */

async function send(sessions) {
  if (state.mode !== "server" || !state.account) {
    queue(sessions);
    return { ok: true, storage: "local",
      note: state.mode === "server"
        ? "Saved on this phone. Sign in to keep it on the server too."
        : "Saved on this phone." };
  }
  try {
    const pending = read(pendingKey(), []) || [];
    const { res, body } = await call(API.history, {
      method: "POST",
      body: JSON.stringify({ sessions: [...pending, ...sessions], settings: state.history.settings }),
    });
    if (!res.ok) throw new Error(body.error || `The server said ${res.status}.`);
    write(pendingKey(), []);
    if (body.history) { state.history = shapeHistory(body.history); write(historyKey(), state.history); emit(); }
    return { ok: true, storage: "server" };
  } catch (err) {
    queue(sessions);
    return { ok: false, storage: "local", error: err.message,
      note: "Saved on this phone. It will go to the server next time there is a connection." };
  }
}

function queue(sessions) {
  const pending = read(pendingKey(), []) || [];
  const byId = new Map(pending.map((s) => [s.id, s]));
  for (const s of sessions) byId.set(s.id, s);
  write(pendingKey(), [...byId.values()]);
}

export const pendingCount = () => (read(pendingKey(), []) || []).length;

/** Push anything queued. Called on load, after signing in, and when the network returns. */
export async function flush() {
  const pending = read(pendingKey(), []) || [];
  if (!pending.length || state.mode !== "server" || !state.account) return { ok: false, sent: 0 };
  try {
    const { res, body } = await call(API.history, {
      method: "POST",
      body: JSON.stringify({ sessions: pending, settings: state.history.settings }),
    });
    if (!res.ok) return { ok: false, sent: 0 };
    write(pendingKey(), []);
    if (body.history) { state.history = shapeHistory(body.history); write(historyKey(), state.history); }
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

/** The richer picture — trends, personal bests, milestones. See insights.js. */
export const insights = (sessions = state.history.sessions) => computeInsights(sessions, new Date());

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
