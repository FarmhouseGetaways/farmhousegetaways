/**
 * The hourly sweep: look at every device, decide whether it is owed a
 * reminder, send it, and write down that it was sent.
 *
 * Kept apart from the scheduled function itself so the same code can be run
 * on demand from a browser during setup — proving the whole chain works
 * without waiting an hour to find out it does not.
 */
import { PLAN, PLAN_KEY, HISTORY, HISTORY_KEY } from "./auth.mjs";
import { normalisePlan, normaliseHistory, normaliseReminder } from "./data.mjs";
import { dueNow } from "./remind.mjs";
import { allSubs, putSub, sendTo, configured } from "./push.mjs";

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

  const [planRaw, historyRaw, subs] = await Promise.all([
    readJson(PLAN, PLAN_KEY, null),
    readJson(HISTORY, HISTORY_KEY, null),
    allSubs(),
  ]);

  const plan = normalisePlan(planRaw);
  const history = normaliseHistory(historyRaw);
  report.devices = subs.length;
  if (!subs.length) report.why.push("No device has asked to be reminded yet.");

  for (const sub of subs) {
    const reminder = normaliseReminder(sub.reminder);
    const due = dueNow({ ...sub, reminder }, plan, history, at);

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
