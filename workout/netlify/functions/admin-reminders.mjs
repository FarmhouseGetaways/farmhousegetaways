/**
 * GET  /api/admin/reminders                             → the site-wide
 *   default schedule, the 24 per-hour messages, and every account's own
 *   override (if it has one) alongside its effective schedule
 * POST /api/admin/reminders { intent: "save-default", enabled, hour }
 * POST /api/admin/reminders { intent: "save-message", hour, message }
 * POST /api/admin/reminders { intent: "reset-messages" }
 * POST /api/admin/reminders { intent: "save-user", userId, enabled, hour }
 * POST /api/admin/reminders { intent: "reset-user", userId }
 * POST /api/admin/reminders { intent: "apply-all", enabled, hour }
 *
 * Admin-only — the same shared password that gates the editor, not any one
 * account. This is the one place the schedule is actually decided; the
 * self-service Reminders screen (see reminders.mjs) still needs a person to
 * tap "Remind me" on their own device — nothing can subscribe a phone that
 * has never granted permission — but once it is subscribed, the HOUR it
 * fires at is this endpoint's decision, not that device's.
 */
import { configured, json } from "./_lib/auth.mjs";
import { listAccounts, findById, setReminderOverride, isAdminRequest } from "./_lib/users.mjs";
import { allSubs } from "./_lib/push.mjs";
import {
  getConfig, saveDefault, saveMessage, resetMessages, applyToAccount,
} from "./_lib/reminder-config.mjs";
import { effectiveFor, clampHour, DEFAULT_MESSAGE } from "./_lib/reminder-shape.mjs";

export const config = { path: "/api/admin/reminders" };

export default async (req) => {
  if (!configured()) return json({ ok: false, error: "This app is not set up yet." }, 503);
  if (!(await isAdminRequest(req))) return json({ ok: false, error: "Admin only." }, 401);

  if (req.method === "GET") {
    const [cfg, people, subs] = await Promise.all([getConfig(), listAccounts(), allSubs()]);
    const subscribed = new Set(subs.filter((s) => s.accountId).map((s) => s.accountId));
    return json({
      ok: true,
      default: cfg.default,
      messages: cfg.messages,
      defaultMessage: DEFAULT_MESSAGE,
      people: people.map((p) => ({
        id: p.id, email: p.email, name: p.name,
        override: p.reminderOverride,
        effective: effectiveFor(cfg, p.reminderOverride),
        subscribed: subscribed.has(p.id),
      })),
    });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }
  const intent = String(body.intent || "");

  /* ---- the site-wide default, applied to everyone still following it ---- */
  if (intent === "save-default") {
    const cfg = await saveDefault({ enabled: body.enabled, hour: body.hour });
    const people = await listAccounts();
    await Promise.all(people.filter((p) => !p.reminderOverride).map((p) => applyToAccount(p.id, cfg.default)));
    return json({ ok: true, default: cfg.default });
  }

  /* ---- one hour's wording ---- */
  if (intent === "save-message") {
    const cfg = await saveMessage(body.hour, body.message);
    return json({ ok: true, messages: cfg.messages });
  }

  if (intent === "reset-messages") {
    const cfg = await resetMessages();
    return json({ ok: true, messages: cfg.messages });
  }

  /* ---- one account's own schedule ---- */
  if (intent === "save-user") {
    const user = await findById(body.userId);
    if (!user) return json({ ok: false, error: "No such account." }, 404);
    const cfg = await getConfig();
    const override = { enabled: body.enabled !== false, hour: clampHour(body.hour, cfg.default.hour) };
    await setReminderOverride(user.id, override);
    await applyToAccount(user.id, override);
    return json({ ok: true, override });
  }

  if (intent === "reset-user") {
    const user = await findById(body.userId);
    if (!user) return json({ ok: false, error: "No such account." }, 404);
    await setReminderOverride(user.id, null);
    const cfg = await getConfig();
    await applyToAccount(user.id, cfg.default);
    return json({ ok: true });
  }

  /* ---- one schedule for every account, individual overrides cleared ---- */
  if (intent === "apply-all") {
    const cfg = await saveDefault({ enabled: body.enabled, hour: body.hour });
    const people = await listAccounts();
    await Promise.all(people.map(async (p) => {
      await setReminderOverride(p.id, null);
      await applyToAccount(p.id, cfg.default);
    }));
    return json({ ok: true, default: cfg.default });
  }

  return json({ ok: false, error: "Not something this can do." }, 400);
};
