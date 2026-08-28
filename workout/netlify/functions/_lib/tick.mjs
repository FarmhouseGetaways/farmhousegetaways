/**
 * The hourly sweep: look at every device, decide whether it is owed a
 * reminder, send it, and write down that it was sent.
 *
 * Kept apart from the scheduled function itself so the same code can be run
 * on demand from a browser during setup — proving the whole chain works
 * without waiting an hour to find out it does not.
 *
 * Each device belongs to an account now, and what it is owed depends on
 * THAT account's own assignments — the workout and exercise pools are
 * fetched once per sweep and shared, but each account's schedule and record
 * are resolved and read separately, cached per account so two devices
 * signed into the same one do not do the work twice in a single sweep.
 */
import { HISTORY, historyKeyFor, WORKOUT_LIBRARY, WORKOUT_LIBRARY_KEY, EXERCISE_LIBRARY, EXERCISE_LIBRARY_KEY } from "./auth.mjs";
import {
  normaliseHistory, normaliseReminder, normaliseAssignments,
  normaliseWorkoutLibrary, normaliseExerciseLibrary, resolveAssignments,
} from "./data.mjs";
import { dueNow, localNow } from "./remind.mjs";
import { allSubs, putSub, sendTo, configured } from "./push.mjs";
import { getConfig } from "./reminder-config.mjs";
import { findById } from "./users.mjs";

async function readJson(store, key, fallback) {
  try { return (await store().get(key, { type: "json" })) || fallback; }
  catch { return fallback; }
}

/**
 * @param at    the moment to pretend it is, for testing
 * @param force send even if it is not the hour — the setup self-test
 */
export async function runReminders({ at = Date.now(), force = false } = {}) {
  const report = { at: new Date(at).toISOString(), configured: configured(), devices: 0, sent: 0, skipped: 0, gone: 0, failed: 0, why: [] };
  if (!configured()) {
    report.why.push("VAPID_PUBLIC and VAPID_PRIVATE are not set, so nothing can be sent.");
    return report;
  }

  const [workoutsRaw, exercisesRaw, subs, reminderConfig] = await Promise.all([
    readJson(WORKOUT_LIBRARY, WORKOUT_LIBRARY_KEY, null),
    readJson(EXERCISE_LIBRARY, EXERCISE_LIBRARY_KEY, null),
    allSubs(),
    getConfig(),
  ]);
  const workouts = normaliseWorkoutLibrary(workoutsRaw);
  const exercises = normaliseExerciseLibrary(exercisesRaw);

  report.devices = subs.length;
  if (!subs.length) report.why.push("No device has asked to be reminded yet.");

  const accountCache = new Map();
  async function accountData(accountId) {
    if (accountCache.has(accountId)) return accountCache.get(accountId);
    const [user, historyRaw] = await Promise.all([
      findById(accountId),
      readJson(HISTORY, historyKeyFor(accountId), null),
    ]);
    const resolved = user ? resolveAssignments(normaliseAssignments(user.assignments), workouts, exercises) : [];
    const week = {};
    for (const a of resolved) (week[a.day] ||= []).push(a);
    const data = { week, sessions: normaliseHistory(historyRaw).sessions };
    accountCache.set(accountId, data);
    return data;
  }

  for (const sub of subs) {
    const reminder = normaliseReminder(sub.reminder);

    // A device subscribed before accounts existed has no accountId and
    // cannot be matched to a schedule — see reminders.mjs's own note about
    // this. Nothing to send; leave it alone rather than guessing.
    if (!sub.accountId) { report.skipped++; continue; }

    const data = await accountData(sub.accountId);
    const now = localNow(reminder.tz, at);
    const todays = data.week[now.day] || [];
    const due = dueNow({ ...sub, reminder }, todays, data.sessions, at, reminderConfig.messages);

    // A snooze whose day has passed is cleared rather than left to rot.
    if (due?.kind === "expired-snooze") {
      await putSub(sub.key, { ...sub, reminder: { ...reminder, snoozeUntil: 0 } });
      report.skipped++;
      continue;
    }

    const payload = due || (force ? {
      kind: "test",
      title: "Reminders are working",
      body: "This is the test nudge. The real ones only arrive when there is a workout waiting.",
      tag: "workout-test",
      url: "/",
    } : null);

    if (!payload) { report.skipped++; continue; }

    const result = await sendTo(sub, {
      title: payload.title, body: payload.body, tag: payload.tag, url: payload.url,
    });
    if (result === "sent") {
      report.sent++;
      // Written only after a successful send, so a push service having a bad
      // minute does not cost her that day's reminder entirely.
      const next = { ...reminder };
      if (payload.kind === "daily") next.lastSentDate = payload.sentDate;
      if (payload.kind === "snooze") next.snoozeUntil = 0;
      if (payload.kind !== "test") await putSub(sub.key, { ...sub, reminder: next });
    } else if (result === "gone") report.gone++;
    else report.failed++;
  }

  return report;
}
