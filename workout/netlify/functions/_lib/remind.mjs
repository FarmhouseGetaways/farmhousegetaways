/**
 * Reminders: who gets nudged, when, and whether it is worth nudging them.
 *
 * The whole thing rests on one decision — **the hour is a local hour and the
 * zone is stored beside it.** Storing an offset instead would be a bug twice a
 * year: an eight o'clock reminder would become seven, or nine, the morning the
 * clocks moved. A scheduled function runs every hour, works out what time it
 * is where each phone actually is, and decides from that.
 *
 * The rules about whether to send at all matter as much as the timing. A
 * reminder that arrives on a rest day, or an hour after the workout was
 * finished, teaches somebody to ignore reminders — and once they are ignored
 * they are worse than nothing, because they are still interrupting.
 *
 *   nothing scheduled today   →  say nothing. A rest day is part of the plan.
 *   already done today        →  say nothing. She knows.
 *   already said today        →  say nothing more, unless a snooze is due.
 *
 * Everything here is a pure function of the time, that account's own
 * assignments for the day and their own record, so it can be tested without
 * a clock, a phone, a push service or a Blobs store — see _lib/tick.mjs for
 * the impure half that fetches the pools and resolves them.
 */

import { DAYS } from "./data.mjs";
import { messageFor } from "./reminder-shape.mjs";

const DAY_KEYS = DAYS.map((d) => d.key);

/**
 * What the local calendar says, where this phone is.
 *
 * Intl is doing the hard part. Asking it for the parts of the date in a named
 * zone is the only correct way to answer "what day is it there" — anything
 * built out of UTC arithmetic and an offset is wrong somewhere in the world,
 * and wrong at home twice a year.
 */
export function localNow(tz, at = Date.now()) {
  const zone = tz || "UTC";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(new Date(at));

  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  // "24" is how some runtimes spell midnight in an hour12:false format.
  const hour = Number(get("hour")) % 24;
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const weekday = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" }[get("weekday")] || "";

  return { date, hour, day: weekday || DAY_KEYS[(new Date(at).getUTCDay() + 6) % 7] };
}

/**
 * Should this device hear from us right now, and what should it say?
 *
 * `todays` is that account's own resolved assignments for whatever weekday
 * `now.day` turns out to be in this device's own zone — see
 * `resolveAssignments` in data.mjs and _lib/tick.mjs, which does the
 * fetching and hands this function only what it needs.
 *
 * Returns null for "no", or the notification to send. Called once an hour per
 * device, so "no" is by far the commonest answer and it has to be cheap and
 * certain.
 */
export function dueNow(sub, todays, historySessions, at = Date.now(), messages = null) {
  const r = sub?.reminder;
  if (!r || !r.enabled) return null;

  const now = localNow(r.tz, at);

  // A rest day is part of the plan, not a thing to be nagged about.
  if (!todays || !todays.length) return null;

  // Already done. Nothing is more likely to get an app deleted than being told
  // to do the thing you have just finished.
  const doneToday = (historySessions || []).some((s) => s.date === now.date);
  if (doneToday) return null;

  const single = todays.length === 1 ? todays[0].workout : null;
  const title = single ? (single.title || "Today's workout") : `${todays.length} workouts today`;
  const teaser = single
    ? `${plural(single.exercises.length, "exercise")}, about ${minutesFor(single)} minutes.`
    : todays.map((a) => a.workout?.title).filter(Boolean).join(", ") || "See the day for what is scheduled.";

  // A snooze is the one thing allowed to speak twice in a day, because she
  // asked it to. It only counts on the day it was set — a snooze slept through
  // is not a reason to be woken tomorrow. Its message comes from the hour it
  // was snoozed TO, same as any other reminder at that hour would say.
  if (r.snoozeUntil && at >= r.snoozeUntil) {
    const set = localNow(r.tz, r.snoozeUntil);
    if (set.date === now.date) {
      return {
        kind: "snooze",
        title: messageFor(messages, set.hour),
        body: `${title} — ${teaser}`,
        tag: "workout-snooze",
        url: `/#/day/${now.day}`,
      };
    }
    return { kind: "expired-snooze" };      // clear it, send nothing
  }

  if (now.hour !== r.hour) return null;
  if (r.lastSentDate === now.date) return null;

  return {
    kind: "daily",
    title: messageFor(messages, r.hour),
    body: `${title} — ${teaser}`,
    tag: "workout-daily",
    url: `/#/day/${now.day}`,
    sentDate: now.date,
  };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** What the day says, so the notification and the app agree. `workout` is a
 * resolved one — `{ minutes, exercises: [{ sets, rest }] }` — the same shape
 * whether it came from an assignment or, in a test, was made up by hand. */
function minutesFor(workout) {
  if (workout.minutes) return workout.minutes;
  const seconds = (workout.exercises || []).reduce((n, ex) => n + (ex.sets || 0) * (45 + (ex.rest || 0)), 0);
  return Math.max(1, Math.round(seconds / 60));
}

/** The moment a given local hour next comes round, for a snooze. */
export function nextLocalHour(tz, hour, at = Date.now()) {
  const target = Math.min(23, Math.max(0, Math.round(Number(hour) || 0)));
  // Walk forward an hour at a time. Twenty-four steps at most, and it is
  // correct across a daylight-saving change, which arithmetic on offsets is
  // not. Landing on the hour's start rather than "now plus n hours" is what
  // makes "remind me at five" mean five o'clock.
  for (let i = 1; i <= 24 * 2; i++) {
    const when = at + i * 3600000;
    const local = localNow(tz, when);
    if (local.hour === target) {
      // Back up to the top of that hour so it fires as the hour turns.
      const minutes = new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC", minute: "2-digit", hour12: false })
        .formatToParts(new Date(when)).find((p) => p.type === "minute")?.value || "0";
      return when - Number(minutes) * 60000;
    }
  }
  return at + 3600000;
}
