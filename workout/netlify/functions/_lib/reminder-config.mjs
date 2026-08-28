/**
 * The store behind the admin-controlled reminder schedule — see
 * reminder-shape.mjs for the pure rules this just persists and applies.
 */
import { getStore } from "@netlify/blobs";
import { normaliseConfig, clampHour } from "./reminder-shape.mjs";
import { allSubs, putSub } from "./push.mjs";

const CONFIG = () => getStore("workout-reminder-config");
const CONFIG_KEY = "config";

export async function getConfig() {
  try { return normaliseConfig(await CONFIG().get(CONFIG_KEY, { type: "json" })); }
  catch { return normaliseConfig(null); }
}

export async function saveDefault({ enabled, hour }) {
  const cfg = await getConfig();
  cfg.default = { enabled: enabled !== false, hour: clampHour(hour, cfg.default.hour) };
  await CONFIG().setJSON(CONFIG_KEY, cfg);
  return cfg;
}

export async function saveMessage(hour, message) {
  const cfg = await getConfig();
  const h = clampHour(hour, null);
  if (h === null) return cfg;
  cfg.messages[h] = String(message ?? "").trim().slice(0, 200);
  await CONFIG().setJSON(CONFIG_KEY, cfg);
  return cfg;
}

/** Blank out every custom message, back to the one default wording. */
export async function resetMessages() {
  const cfg = await getConfig();
  for (let h = 0; h < 24; h++) cfg.messages[h] = "";
  await CONFIG().setJSON(CONFIG_KEY, cfg);
  return cfg;
}

/**
 * Push a schedule onto every device this account has subscribed — called
 * whenever the admin changes that account's override, the site default (for
 * everyone still following it), or applies one schedule to everybody at
 * once. A brand new subscription seeds from this too (see reminders.mjs),
 * rather than a hardcoded 8am that ignored whatever the admin had already
 * set for that person.
 */
export async function applyToAccount(accountId, schedule) {
  const subs = await allSubs();
  const mine = subs.filter((s) => s.accountId === accountId);
  await Promise.all(mine.map(({ key, ...record }) =>
    putSub(key, { ...record, reminder: { ...record.reminder, enabled: schedule.enabled, hour: schedule.hour } })));
  return mine.length;
}
