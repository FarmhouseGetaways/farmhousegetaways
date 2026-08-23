/* ==========================================================================
   Insights — turning a list of finished workouts into things worth knowing.

   Pure arithmetic on the record, nothing else: no store, no DOM, no clock of
   its own (a timestamp always comes in as an argument, never Date.now()
   inside), so it can be tested the same way catalog.js is —

       node --test workout/js/*.test.js

   The point is not "more numbers". A streak and a total are already on the
   history screen; this file answers questions a number alone cannot: which
   day she actually shows up, whether this week beat last week, how long the
   longest run ever was versus the one going right now, and which few
   milestones out of everything logged are worth a moment's pride.
   ========================================================================== */

import { DAY_KEYS, DAY_NAMES, startOfDay } from "./catalog.js";

const DAY_MS = 86400000;

const localDate = (isoDate) => new Date(`${isoDate}T00:00:00`);

/** Monday of the week containing `date`, at local midnight. */
const mondayOf = (date) => startOfDay(date) - ((date.getDay() + 6) % 7) * DAY_MS;

const inRange = (ms, fromMs, toMsExclusive) => ms >= fromMs && ms < toMsExclusive;

/**
 * Every distinct day worked out, longest unbroken run of consecutive
 * calendar days across the whole record — not just counting back from
 * today, which is the current streak the history screen already shows.
 * This is the best that run has ever been.
 */
function longestStreakEver(dateKeys) {
  const days = [...new Set(dateKeys)].map((k) => localDate(k).getTime()).sort((a, b) => a - b);
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev !== null && d - prev === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return longest;
}

/** The exercise that shows up in the most finished workouts — not the most
 * sets of it, which would just reward a single marathon session. */
function favoriteExercise(sessions) {
  const seenPerWorkout = new Map();
  for (const s of sessions) {
    const names = new Set((s.exercises || []).map((e) => e.name).filter(Boolean));
    for (const name of names) seenPerWorkout.set(name, (seenPerWorkout.get(name) || 0) + 1);
  }
  let name = null, count = 0;
  for (const [n, c] of seenPerWorkout) if (c > count) { name = n; count = c; }
  return name ? { name, count } : null;
}

/** Which day of the week she actually shows up, most often. */
function bestDayOfWeek(sessions) {
  const counts = new Map();
  for (const s of sessions) {
    const key = DAY_KEYS[(localDate(s.date).getDay() + 6) % 7];
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let day = null, count = 0;
  for (const [k, c] of counts) if (c > count) { day = k; count = c; }
  return day ? { day, name: DAY_NAMES[day], count } : null;
}

const best = (sessions, by) =>
  sessions.reduce((top, s) => (by(s) > (top ? by(top) : -Infinity) ? s : top), null);

/**
 * The handful of milestones worth marking, out of everything a record could
 * say. Deliberately short — a wall of fifty badges is not a celebration, it
 * is clutter — and each one only appears once actually reached, in the order
 * a person would reach them.
 */
function milestones({ totalWorkouts, longestStreak, totalSets, totalCalories }) {
  const rows = [
    { at: 1, kind: "workouts", label: "First workout logged" },
    { at: 5, kind: "workouts", label: "5 workouts" },
    { at: 10, kind: "workouts", label: "10 workouts" },
    { at: 25, kind: "workouts", label: "25 workouts" },
    { at: 50, kind: "workouts", label: "50 workouts" },
    { at: 100, kind: "workouts", label: "100 workouts" },
    { at: 3, kind: "streak", label: "3 days in a row" },
    { at: 7, kind: "streak", label: "A full week, back to back" },
    { at: 14, kind: "streak", label: "Two weeks straight" },
    { at: 30, kind: "streak", label: "A month, every day" },
    { at: 500, kind: "sets", label: "500 sets done" },
    { at: 1000, kind: "sets", label: "1,000 sets done" },
    { at: 10000, kind: "calories", label: "10,000 calories logged" },
    { at: 50000, kind: "calories", label: "50,000 calories logged" },
  ];
  const value = { workouts: totalWorkouts, streak: longestStreak, sets: totalSets, calories: totalCalories };
  return rows.filter((r) => value[r.kind] >= r.at).map((r) => ({ key: `${r.kind}-${r.at}`, label: r.label }));
}

/**
 * Everything the insights panel shows, from one pass over the record.
 * `now` is a Date, passed in rather than read from the clock in here so this
 * whole file stays pure and testable.
 */
export function computeInsights(sessions, now = new Date()) {
  if (!sessions.length) {
    return {
      empty: true, totalWorkouts: 0, totalSets: 0, totalCalories: 0,
      favorite: null, bestDay: null, longestStreak: 0,
      thisWeekCount: 0, lastWeekCount: 0, trend: 0,
      consistency30: 0, longestWorkout: null, biggestBurn: null, mostSets: null,
      badges: [],
    };
  }

  const totalWorkouts = sessions.length;
  const totalSets = sessions.reduce((n, s) => n + (s.setsDone || 0), 0);
  const totalCalories = sessions.reduce((n, s) => n + (s.calories || 0), 0);

  const mondayThis = mondayOf(now);
  const mondayLast = mondayThis - 7 * DAY_MS;
  const thisWeekCount = sessions.filter((s) => inRange(localDate(s.date).getTime(), mondayThis, mondayThis + 7 * DAY_MS)).length;
  const lastWeekCount = sessions.filter((s) => inRange(localDate(s.date).getTime(), mondayLast, mondayThis)).length;

  // Out of the last 30 days, but a brand new record should not be marked down
  // for the weeks before she ever opened the app — the denominator starts at
  // whichever is later, 30 days ago or the very first thing ever logged.
  const thirtyAgo = startOfDay(now) - 29 * DAY_MS;
  const earliest = sessions.reduce((min, s) => (!min || s.date < min ? s.date : min), null);
  const windowStart = Math.max(thirtyAgo, localDate(earliest).getTime());
  const recentDays = new Set(
    sessions.filter((s) => localDate(s.date).getTime() >= thirtyAgo).map((s) => s.date),
  );
  const daysSoFar = Math.round((startOfDay(now) - windowStart) / DAY_MS) + 1;
  const consistency30 = Math.round((recentDays.size / daysSoFar) * 100);

  const longestStreak = longestStreakEver(sessions.map((s) => s.date));

  const summary = {
    totalWorkouts, totalSets, totalCalories,
    favorite: favoriteExercise(sessions),
    bestDay: bestDayOfWeek(sessions),
    longestStreak,
    thisWeekCount, lastWeekCount, trend: thisWeekCount - lastWeekCount,
    consistency30,
    longestWorkout: best(sessions, (s) => s.elapsedSec || 0),
    biggestBurn: best(sessions, (s) => s.calories || 0),
    mostSets: best(sessions, (s) => s.setsDone || 0),
  };

  return { ...summary, empty: false, badges: milestones(summary) };
}
