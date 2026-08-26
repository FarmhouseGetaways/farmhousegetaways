/**
 * The admin-controlled reminder schedule — the pure arithmetic, with no
 * Blobs store and no clock of its own, so it can be tested the way
 * remind.mjs and data.mjs are:
 *
 *     node --test workout/netlify/functions/_lib/*.test.mjs
 *
 * Two layers. A site-wide default (enabled + hour) applies to every account
 * that has not been given its own schedule; an account with an override
 * follows that instead, until "return to default schedule" clears it. What a
 * reminder actually SAYS is looked up by the hour it fires at, not stored on
 * the device or the account — so editing hour 8's wording updates everyone
 * whose reminder is at 8 without touching a single subscription.
 */

export const DEFAULT_MESSAGE = "Don't forget to do your workout today!";
export const DEFAULT_HOUR = 8;

export const clampHour = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(23, Math.max(0, Math.round(n))) : fallback;
};

/** Shape whatever came out of storage (or nothing at all) into a config with
 * every hour present, each either custom text or blank (meaning "use the
 * default message"). */
export function normaliseConfig(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const messages = {};
  for (let h = 0; h < 24; h++) {
    const v = src.messages?.[h] ?? src.messages?.[String(h)];
    messages[h] = typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : "";
  }
  return {
    default: {
      enabled: src.default?.enabled !== false,
      hour: clampHour(src.default?.hour, DEFAULT_HOUR),
    },
    messages,
  };
}

/** The text a reminder at this hour should actually say. Takes the messages
 * map itself (cfg.messages), not the whole config — remind.mjs only ever has
 * the map, threaded through from the sweep in tick.mjs. */
export const messageFor = (messages, hour) => (messages?.[hour] || "").trim() || DEFAULT_MESSAGE;

/** What one account's schedule should be right now: its own override if it
 * has one, otherwise the site-wide default. */
export function effectiveFor(cfg, override) {
  if (override && typeof override === "object") {
    return { enabled: override.enabled !== false, hour: clampHour(override.hour, cfg.default.hour) };
  }
  return cfg.default;
}
