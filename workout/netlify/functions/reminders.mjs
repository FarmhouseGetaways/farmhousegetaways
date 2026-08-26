/**
 * GET    /api/reminders          → what this device is set to, and the key it
 *                                  needs to subscribe with
 * POST   /api/reminders          → subscribe, change the hour, or snooze
 * DELETE /api/reminders          → stop reminding this device
 *
 * Needs an account signed in, all of it — see _lib/users.mjs. A reminder is
 * personal ("you have a workout today"), so it is gated the same way the
 * record is, not by the admin password: any of the (up to five) people using
 * this app can set one up on their own device.
 *
 * A subscription belongs to a DEVICE, not to a person. Two phones can want two
 * different hours and neither is wrong, so the hour, the zone and any snooze
 * are stored alongside the endpoint rather than in the shared settings.
 */
import { SUBS, configured as hasPassword, json } from "./_lib/auth.mjs";
import { currentAccount } from "./_lib/users.mjs";
import { normaliseReminder, timezone } from "./_lib/data.mjs";
import { publicKey, configured as hasKeys, keyFor, putSub, dropSub } from "./_lib/push.mjs";
import { nextLocalHour } from "./_lib/remind.mjs";
import { runReminders } from "./_lib/tick.mjs";
import { getConfig } from "./_lib/reminder-config.mjs";
import { effectiveFor } from "./_lib/reminder-shape.mjs";

export const config = { path: "/api/reminders" };

const shape = (sub) => sub ? { subscribed: true, reminder: normaliseReminder(sub.reminder) } : { subscribed: false };

export default async (req) => {
  if (!hasPassword()) {
    return json({ ok: false, error: "This app has no password set, so reminders cannot be set up." }, 503);
  }
  const account = await currentAccount(req);
  if (!account) return json({ ok: false, error: "Not signed in." }, 401);

  const url = new URL(req.url);

  /* ---- what is this device set to? ---- */
  if (req.method === "GET") {
    const endpoint = url.searchParams.get("endpoint");
    let sub = null;
    if (endpoint) {
      try { sub = await SUBS().get(await keyFor(endpoint), { type: "json" }); } catch { sub = null; }
    }

    // ?test=1 runs the hourly sweep here and now and reports what it did. It
    // is how somebody proves the chain works during setup instead of waiting
    // an hour to discover it does not. ?test=force sends regardless of timing.
    const test = url.searchParams.get("test");
    // Shown even before subscribing, so the Reminders screen can say what
    // will happen the moment "Remind me" is pressed — this account's own
    // admin-set schedule, or the site default if nobody has customised it.
    const effective = effectiveFor(await getConfig(), account.reminderOverride);
    const out = { ok: true, ready: hasKeys(), publicKey: publicKey(), effective, ...shape(sub) };
    if (test) out.test = await runReminders({ force: test === "force" });
    return json(out);
  }

  if (req.method === "DELETE") {
    let body = {};
    try { body = await req.json(); } catch { /* endpoint may come in the query */ }
    const endpoint = body.endpoint || url.searchParams.get("endpoint");
    if (!endpoint) return json({ ok: false, error: "Which device?" }, 400);
    await dropSub(await keyFor(endpoint));
    return json({ ok: true, subscribed: false });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  if (!hasKeys()) {
    return json({
      ok: false,
      error: "Reminders are not switched on for this site yet. Add VAPID_PUBLIC and VAPID_PRIVATE in Netlify and redeploy.",
    }, 503);
  }

  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const subscription = body.subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return json({ ok: false, error: "That is not a usable push subscription." }, 400);
  }

  const key = await keyFor(subscription.endpoint);
  let existing = null;
  try { existing = await SUBS().get(key, { type: "json" }); } catch { existing = null; }

  // A brand new device seeds its hour and enabled state from the admin's
  // schedule for this account, not a hardcoded 8am — the whole point of the
  // admin reminder screen is that the hour is its decision, not the device's.
  // An existing subscription keeps whatever it already had.
  const seed = existing ? {} : effectiveFor(await getConfig(), account.reminderOverride);

  const tz = timezone(body.tz) || existing?.reminder?.tz || "";
  let reminder = normaliseReminder({ ...seed, ...(existing?.reminder || {}), ...(body.reminder || {}), tz });

  /* "Not now — remind me at five." The hour she scrolled to is turned into the
     next moment that hour comes round where she is, which is why it means five
     o'clock rather than five hours from now. */
  if (body.snoozeHour !== undefined && body.snoozeHour !== null) {
    reminder = { ...reminder, snoozeUntil: nextLocalHour(tz, body.snoozeHour), enabled: true };
  }
  if (body.clearSnooze) reminder = { ...reminder, snoozeUntil: 0 };

  const record = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    // Which account this device belongs to — what lets the admin reminder
    // screen find and update it. Devices subscribed before this existed have
    // no accountId; they still work, they are just outside admin control
    // until resubscribed.
    accountId: account.id,
    reminder,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  try {
    await putSub(key, record);
  } catch (err) {
    return json({ ok: false, error: "Could not save that: " + (err?.message || err) }, 502);
  }

  return json({ ok: true, ...shape(record) });
};
