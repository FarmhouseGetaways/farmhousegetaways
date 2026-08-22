/**
 * The shape of the data, and the rules about it.
 *
 * Two things are stored:
 *
 *   the plan       the seven days and what is in each of them. Public to read
 *                  — it is a list of exercises — and written by whoever holds
 *                  the password.
 *   the history    every workout finished, plus the couple of settings the
 *                  calorie estimate needs. Private: it is a record of one
 *                  person's body and what it did every day, and reading it
 *                  needs the password as much as writing it does.
 *
 * Both live in Netlify Blobs, which is why this file exists: anything arriving
 * from a browser is a suggestion, not truth. Everything is clamped, trimmed,
 * capped and given an id here before it is allowed near the store — a phone
 * with a stuck finger must not be able to write a hundred megabytes, and a
 * hand-edited plan.json must not be able to take the app down.
 *
 * Plain module, no dependencies, so it can be tested with nothing installed:
 *
 *     node --test workout/netlify/functions/_lib/*.test.mjs
 */

/* The week, in the order a week happens. Monday first, because a training
   week starts on Monday and "week one, day one" is Monday everywhere the
   owner will have seen it. */
export const DAYS = [
  { key: "mon", name: "Monday",    short: "Mon" },
  { key: "tue", name: "Tuesday",   short: "Tue" },
  { key: "wed", name: "Wednesday", short: "Wed" },
  { key: "thu", name: "Thursday",  short: "Thu" },
  { key: "fri", name: "Friday",    short: "Fri" },
  { key: "sat", name: "Saturday",  short: "Sat" },
  { key: "sun", name: "Sunday",    short: "Sun" },
];

const DAY_KEYS = DAYS.map((d) => d.key);

/* Limits. None of these are anywhere near what a real week of training needs;
   they are here so that a bug, a paste accident or somebody poking at the
   endpoint cannot commit something enormous. */
const MAX = {
  title: 120,
  description: 1200,
  name: 120,
  reps: 60,
  notes: 600,
  url: 2000,
  effort: 40,
  exercises: 40,          // per day
  minutes: 600,           // ten hours, for an estimate on a day card
  sets: 10,               // the owner asked for one to ten, and means it
  rest: 900,              // fifteen minutes between sets is already generous
  sessions: 2000,         // roughly five years of training, kept in full
  calories: 10000,
  seconds: 60 * 60 * 24,  // a single session cannot claim more than a day
};

const clampNum = (value, lo, hi, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(n)));
};

const text = (value, limit) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);

/* Multi-line fields keep their line breaks — a workout description is often a
   short list — but nothing else. */
const block = (value, limit) =>
  String(value ?? "").replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, limit);

let counter = 0;
const uid = (prefix) =>
  prefix + "_" + Date.now().toString(36) + (counter++).toString(36) + Math.random().toString(36).slice(2, 6);

/**
 * A video is either a file we can hand to <video>, or a page we have to embed
 * in an iframe. Deciding that here as well as in the browser means the stored
 * plan carries no surprises: an unrecognised link is kept as-is and the app
 * simply offers it as a link rather than pretending it can play it.
 *
 * Only http(s) survives. A `javascript:` or `data:` URL in a field that ends
 * up in an iframe src is the obvious way to attack a page like this one.
 */
export function safeUrl(value) {
  const raw = text(value, MAX.url);
  if (!raw) return "";
  // A bare path is fine and same-origin by definition: /media/<hash>.<ext> is
  // what an upload returns, and videos/name.mp4 is a file committed alongside.
  if (/^\/[^/\\]/.test(raw) || /^(videos|images)\//.test(raw)) return raw;
  let u;
  try { u = new URL(raw); } catch { return ""; }
  return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
}

function normaliseExercise(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = text(raw.name, MAX.name);
  if (!name) return null;                       // an exercise with no name is a blank row
  return {
    id: text(raw.id, 40) || uid("ex"),
    name,
    video: safeUrl(raw.video),
    // A still. Shown in the editor and in the day list, and used as the
    // poster behind a video so the stage is never a black rectangle while it
    // loads. On its own it is what an exercise with no video shows.
    image: safeUrl(raw.image),
    sets: clampNum(raw.sets, 1, MAX.sets, 3),
    reps: text(raw.reps, MAX.reps),             // free text: "12", "30 seconds", "to failure"
    rest: clampNum(raw.rest, 0, MAX.rest, 60),
    effort: text(raw.effort, MAX.effort) || "strength",
    notes: block(raw.notes, MAX.notes),
  };
}

function normaliseDay(raw, key) {
  const src = raw && typeof raw === "object" ? raw : {};
  const exercises = (Array.isArray(src.exercises) ? src.exercises : [])
    .map(normaliseExercise)
    .filter(Boolean)
    .slice(0, MAX.exercises);

  return {
    day: key,
    title: text(src.title, MAX.title),
    description: block(src.description, MAX.description),
    // A picture for the workout itself — what it looks like, or simply
    // something to recognise it by on the week board. Nothing to do with the
    // videos inside it.
    image: safeUrl(src.image),
    // Nought means "no estimate given", which the app shows as the sum of the
    // exercises instead of an empty space.
    minutes: clampNum(src.minutes, 0, MAX.minutes, 0),
    exercises,
  };
}

/** An empty week — seven rest days. What a brand new site starts from. */
export function emptyPlan() {
  return {
    version: 1,
    updated: new Date().toISOString(),
    days: DAY_KEYS.map((key) => normaliseDay(null, key)),
  };
}

/**
 * Take whatever arrived and return a plan with exactly seven days in the right
 * order, whether the input was an array, an object keyed by day, or nonsense.
 */
export function normalisePlan(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const byKey = {};

  if (Array.isArray(src.days)) {
    for (const d of src.days) {
      const key = text(d?.day, 8).toLowerCase();
      if (DAY_KEYS.includes(key)) byKey[key] = d;
    }
  } else if (src.days && typeof src.days === "object") {
    for (const key of DAY_KEYS) if (src.days[key]) byKey[key] = src.days[key];
  }

  return {
    version: 1,
    updated: new Date().toISOString(),
    days: DAY_KEYS.map((key) => normaliseDay(byKey[key], key)),
  };
}

/* ---------- history ---------- */

const isoDate = (value) => {
  const s = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date().toISOString().slice(0, 10);
};

const isoStamp = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

function normaliseSessionExercise(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = text(raw.name, MAX.name);
  if (!name) return null;
  return {
    id: text(raw.id, 40) || uid("ex"),
    name,
    effort: text(raw.effort, MAX.effort) || "strength",
    reps: text(raw.reps, MAX.reps),
    setsPlanned: clampNum(raw.setsPlanned, 0, MAX.sets, 0),
    setsDone: clampNum(raw.setsDone, 0, MAX.sets, 0),
    activeSec: clampNum(raw.activeSec, 0, MAX.seconds, 0),
  };
}

/**
 * One finished — or abandoned — workout.
 *
 * The inputs to the calorie estimate are stored beside the estimate itself:
 * effort, active seconds and the body weight used. If the table of MET values
 * is ever improved, every past workout can be recalculated from what is here
 * rather than being stuck with whatever this month's arithmetic said.
 */
export function normaliseSession(raw) {
  if (!raw || typeof raw !== "object") return null;
  const exercises = (Array.isArray(raw.exercises) ? raw.exercises : [])
    .map(normaliseSessionExercise)
    .filter(Boolean)
    .slice(0, MAX.exercises);

  const day = text(raw.day, 8).toLowerCase();

  return {
    id: text(raw.id, 60) || uid("s"),
    day: DAY_KEYS.includes(day) ? day : "",
    title: text(raw.title, MAX.title) || "Workout",
    date: isoDate(raw.date),
    startedAt: isoStamp(raw.startedAt),
    finishedAt: isoStamp(raw.finishedAt),
    elapsedSec: clampNum(raw.elapsedSec, 0, MAX.seconds, 0),
    activeSec: clampNum(raw.activeSec, 0, MAX.seconds, 0),
    setsPlanned: clampNum(raw.setsPlanned, 0, MAX.sets * MAX.exercises, 0),
    setsDone: clampNum(raw.setsDone, 0, MAX.sets * MAX.exercises, 0),
    calories: clampNum(raw.calories, 0, MAX.calories, 0),
    weightLb: clampNum(raw.weightLb, 40, 700, 150),
    complete: raw.complete !== false,
    notes: block(raw.notes, MAX.notes),
    exercises,
  };
}

export function normaliseSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    weightLb: clampNum(src.weightLb, 40, 700, 150),
    // Whether to count the rest between sets towards the estimate. On by
    // default: she is standing in a gym for that minute, not sitting down.
    countRest: src.countRest !== false,
  };
}

/* --------------------------------------------------------------------------
   Reminders

   Stored per device rather than per person, because that is what a push
   subscription is: this phone, this browser. Two phones can want different
   times and neither is wrong.

   The hour is a LOCAL hour and the zone is stored beside it. Storing an
   offset instead would be a bug twice a year — an eight o'clock reminder
   would become seven, or nine, the morning the clocks moved.
   -------------------------------------------------------------------------- */
export function normaliseReminder(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    enabled: src.enabled !== false,
    hour: clampNum(src.hour, 0, 23, 8),
    tz: timezone(src.tz),
    // A one-off "not now, later today". An epoch in milliseconds, or nought.
    // It is cleared the moment it fires, and ignored once the day has turned.
    snoozeUntil: clampNum(src.snoozeUntil, 0, 4102444800000, 0),
    // The last local date a daily reminder went out, so a phone is nudged once
    // a day and not once an hour.
    lastSentDate: /^\d{4}-\d{2}-\d{2}$/.test(String(src.lastSentDate || "")) ? src.lastSentDate : "",
  };
}

/**
 * An IANA zone name, or nothing.
 *
 * Asking Intl whether it accepts the string is NOT enough on its own: it also
 * accepts fixed offsets like "-08:00", and a fixed offset is precisely the
 * thing this is here to keep out. Store one and an eight o'clock reminder
 * becomes seven or nine the morning the clocks move. So the shape is checked
 * first — a region and a place, or plain UTC — and only then handed to Intl to
 * confirm it is a zone it actually knows.
 */
export function timezone(value) {
  const name = text(value, 64);
  if (!name) return "";
  if (name !== "UTC" && !/^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+$/.test(name)) return "";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: name });
    return name;
  } catch { return ""; }
}

export function normaliseHistory(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const sessions = (Array.isArray(src.sessions) ? src.sessions : [])
    .map(normaliseSession)
    .filter(Boolean);

  return {
    version: 1,
    updated: new Date().toISOString(),
    settings: normaliseSettings(src.settings),
    sessions: sortSessions(dedupe(sessions)).slice(0, MAX.sessions),
  };
}

const dedupe = (sessions) => {
  const seen = new Map();
  for (const s of sessions) seen.set(s.id, s);   // last one in wins
  return [...seen.values()];
};

/* Newest first. That is the order the history screen reads in, and it means
   the cap above drops the oldest workouts rather than this morning's. */
const sortSessions = (sessions) =>
  sessions.sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : a.finishedAt > b.finishedAt ? -1 : 0));

/**
 * Fold new sessions into the stored ones.
 *
 * This is a union by id, never a replacement, and that matters: she may finish
 * a workout on her phone while the iPad still holds last week's copy of the
 * history. If the iPad ever sent its whole list as the new truth, the phone's
 * workout would vanish. Sending only what is new, and merging here, means the
 * two can never delete each other's work.
 *
 * A session id repeated is treated as a correction and the newer one wins,
 * which is what makes "finish the workout again after fixing a set count" do
 * the sensible thing.
 */
export function mergeHistory(stored, incoming) {
  const base = normaliseHistory(stored);
  const add = (Array.isArray(incoming?.sessions) ? incoming.sessions : [])
    .map(normaliseSession)
    .filter(Boolean);

  return {
    version: 1,
    updated: new Date().toISOString(),
    // Settings are a straight replacement when they are sent, because they are
    // a preference rather than a record: the last device to say what she
    // weighs is the one that knows.
    settings: incoming?.settings ? normaliseSettings(incoming.settings) : base.settings,
    sessions: sortSessions(dedupe([...base.sessions, ...add])).slice(0, MAX.sessions),
  };
}

/** Removing a session is the one thing a merge cannot express, so it is separate. */
export function dropSessions(history, ids) {
  const kill = new Set((Array.isArray(ids) ? ids : []).map((id) => text(id, 60)).filter(Boolean));
  const h = normaliseHistory(history);
  return { ...h, updated: new Date().toISOString(), sessions: h.sessions.filter((s) => !kill.has(s.id)) };
}

export const LIMITS = MAX;
