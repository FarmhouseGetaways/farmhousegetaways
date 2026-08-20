/**
 * Push an alert to a phone when a form comes in.
 *
 * Shared by every site so three brands reach one pocket in the same shape.
 * submission-created.mjs calls sendAlert() after its own work is done.
 *
 * Sends to whichever is configured, both or neither:
 *
 *   NTFY_TOPIC     a topic on ntfy.sh. No account and no key, so the topic
 *                  name IS the secret — make it long and unguessable, because
 *                  anyone who knows it can read your alerts and send you them.
 *   ALERT_WEBHOOK  posts the same alert as JSON, for the Farmhouse app's own
 *                  push once it grows an admin channel. Sent with
 *                  ALERT_WEBHOOK_KEY in an x-admin-key header when set.
 *
 * SITE_LABEL names the site in the alert.
 *
 * Nothing in here is allowed to throw. The submission is already saved and the
 * visitor is already on the thanks page, so a failed alert must cost a log line
 * and nothing more.
 */

const SITE = process.env.SITE_LABEL || "Farmhouse Getaways";

/** The fields worth putting in a notification, in the order a person reads. */
const INTERESTING = [
  "stand-name", "first-name", "last-name", "name",
  "email", "phone", "city", "message",
];

function summarise(formName, data) {
  const pretty = { contact: "enquiry", farmstand: "farmstand submission" }[formName] || formName;

  const who = [data["first-name"], data["last-name"]].filter(Boolean).join(" ").trim()
    || data["stand-name"] || data.name || data.email || "someone";

  const lines = [];
  for (const key of INTERESTING) {
    const value = (data[key] || "").toString().trim();
    if (value) lines.push(`${key}: ${value}`);
  }
  // Anything the form collects that is not in the list above still matters —
  // a form gains a field far more often than this file gets updated.
  for (const [key, value] of Object.entries(data)) {
    if (INTERESTING.includes(key)) continue;
    if (key === "bot-field" || key === "company" || key === "form-name") continue;
    const v = (value || "").toString().trim();
    if (v) lines.push(`${key}: ${v}`);
  }

  return {
    title: `${SITE}: ${pretty} from ${who}`,
    body: lines.join("\n").slice(0, 1200) || "No details were filled in.",
  };
}

async function toNtfy(alert) {
  const topic = (process.env.NTFY_TOPIC || "").trim();
  if (!topic) return "skipped";
  const url = topic.startsWith("http") ? topic : `https://ntfy.sh/${topic}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      // Header values must be latin-1, and these strings are people's names.
      // Anything outside that range is dropped rather than throwing.
      title: alert.title.replace(/[^\x20-\x7E]/g, ""),
      tags: "seedling",
      priority: "default",
    },
    body: alert.body,
  });
  return res.ok ? "sent" : `failed ${res.status}`;
}

async function toWebhook(alert, formName, data) {
  const url = (process.env.ALERT_WEBHOOK || "").trim();
  if (!url) return "skipped";
  const key = (process.env.ALERT_WEBHOOK_KEY || "").trim();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key ? { "x-admin-key": key } : {}),
    },
    body: JSON.stringify({ ...alert, site: SITE, form: formName, data }),
  });
  return res.ok ? "sent" : `failed ${res.status}`;
}

/** Fire every configured channel. Never throws. */
export async function sendAlert(formName, data) {
  if (!formName) return { ntfy: "skipped", webhook: "skipped" };
  const alert = summarise(formName, data || {});
  const [ntfy, webhook] = await Promise.all([
    toNtfy(alert).catch((e) => `error ${e.message}`),
    toWebhook(alert, formName, data || {}).catch((e) => `error ${e.message}`),
  ]);
  return { ntfy, webhook };
}
