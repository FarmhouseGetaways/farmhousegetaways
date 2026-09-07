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

/**
 * Field names as a person would read them. A notification is read on a lock
 * screen in a couple of seconds, and "owner-first: Dale" is a database column
 * where "Owner: Dale" is a sentence.
 *
 * Anything not listed still appears — a form gains a field far more often than
 * this list gets updated — it just falls back to a tidied version of its own
 * name rather than being dropped.
 */
const LABELS = {
  "first-name": "Name", "last-name": "Surname", name: "Name",
  "owner-first": "Owner", "owner-last": "Owner surname",
  "stand-name": "Stand", email: "Email", phone: "Phone",
  address: "Address", "address-1": "Address", "address-2": "Address line 2",
  city: "City", state: "State", zip: "Zip", url: "Website",
  hours: "Hours", sells: "Sells", message: "Message",
  guests: "Guests", dates: "Dates", nights: "Nights",
};

const label = (key) =>
  LABELS[key] || key.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/** The fields worth putting in a notification, in the order a person reads. */
const INTERESTING = [
  "stand-name", "first-name", "last-name", "name",
  "email", "phone", "city", "message",
];

/**
 * The mailing-list signup gets its own shape, because the generic one below
 * spells a database out loud: "Source: rbr-book-top" tells you nothing you
 * wanted at a glance, and the property is the first thing worth knowing.
 *
 * Reads `property` and `page`, both hidden fields the form already carries.
 * Falls through to the generic summary if a signup arrives without them — the
 * farmstand map page uses this same form name and has neither.
 */
function summariseSignup(data) {
  const property = (data.property || "").toString().trim();
  const page = (data.page || "").toString().trim();
  if (!property && !page) return null;

  const SHORT = { "Red Barn Ranch": "RBR", "Mountain Retreat": "MR" };
  const tag = SHORT[property] || property;
  const name = (data["first-name"] || data.name || "").toString().trim();
  const email = (data.email || "").toString().trim();

  const lines = [];
  if (name) lines.push(`Name: ${name}`);
  if (email) lines.push(`Email: ${email}`);
  lines.push(`Source: ${tag || "Site"} email signup form below the booking form`);
  if (page) lines.push(`On: ${page}`);

  return {
    title: `${tag ? tag + " " : ""}Customer Email Signup - Booking Widget Form`,
    body: lines.join("\n"),
  };
}

function summarise(formName, data) {
  if (formName === "newsletter") {
    const signup = summariseSignup(data);
    if (signup) return signup;
  }

  const pretty = {
    contact: "Inquiry",
    farmstand: "Farm Stand Submission",
    "group-inquiry": "Group Inquiry",
    newsletter: "Newsletter Signup",
  }[formName] || formName;

  // A person is one line. Split into "Name: Marguerite" and "Surname: Ellis"
  // a lock screen reads like a spreadsheet, and it costs a row of the few a
  // notification gets. Built from the name fields only — `who` above falls
  // back to the stand name, which must never end up after "Owner:".
  const JOINED = ["first-name", "last-name", "owner-first", "owner-last", "stand-name"];
  const person = (first, last) =>
    [data[first], data[last]].map((v) => (v || "").toString().trim()).filter(Boolean).join(" ");
  const lines = [];
  const guest = person("first-name", "last-name");
  const owner = person("owner-first", "owner-last");
  // The stand is the headline of a farm stand submission; its owner is who to
  // write back to. Anywhere else there is no stand and this does nothing.
  const stand = (data["stand-name"] || "").toString().trim();
  if (stand) lines.push(`Stand: ${stand}`);
  if (guest) lines.push(`Name: ${guest}`);
  if (owner) lines.push(`Owner: ${owner}`);
  for (const key of INTERESTING) {
    if (JOINED.includes(key)) continue;
    const value = (data[key] || "").toString().trim();
    if (value) lines.push(`${label(key)}: ${value}`);
  }
  // Anything the form collects that is not in the list above still matters —
  // a form gains a field far more often than this file gets updated.
  for (const [key, value] of Object.entries(data)) {
    if (INTERESTING.includes(key) || JOINED.includes(key)) continue;
    if (key === "bot-field" || key === "company" || key === "form-name") continue;
    const v = (value || "").toString().trim();
    if (v) lines.push(`${label(key)}: ${v}`);
  }

  // "Mini Barn Market Inquiry" reads as a thing that happened. The old form,
  // "Mini Barn Market: enquiry from Marguerite Ellis", spent its first and
  // most legible half on punctuation and the sender's name — and the name is
  // the first line of the body anyway.
  return {
    title: `${SITE} ${pretty}`,
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
  // The app's owner-alert endpoint. Not a secret — it rejects anything
  // without the key — so it is defaulted here rather than being a third
  // variable to set on three sites. ALERT_WEBHOOK overrides it if the app
  // ever moves.
  const url = (process.env.ALERT_WEBHOOK || "https://farmhousegetawaysapp.netlify.app/.netlify/functions/push-alert").trim();
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

/**
 * The same alert as an email, through Resend.
 *
 * WHY THIS EXISTS AT ALL
 * Netlify sends its own form-submission email and its template cannot be
 * changed — the only setting is who receives it. It arrives as
 * "Form submission from newsletter form:" over a dump of raw field names
 * ("Source: rbr-book-top"), which is a database column read aloud. The owner,
 * 7 Sep 2026: "bad subject, bad data." The only way to control the wording is
 * to send it ourselves, and nothing else in this stack can send an email:
 * Netlify functions cannot, and EmailOctopus does lists, not one-off messages.
 *
 * ⚠ TURN NETLIFY'S OWN FORM EMAIL OFF once this is confirmed working, or every
 * submission arrives twice. It lives in the Netlify UI, not in this repo:
 * Project configuration → Notifications → Form submission notifications.
 *
 * Three variables, and it stays silent unless all three are set:
 *   RESEND_API_KEY   a sending-access key from resend.com
 *   RESEND_FROM      the from address. Currently Resend's shared
 *                    onboarding@resend.dev, which may only send to the account
 *                    owner's own address — fine, because this only ever goes to
 *                    the owner. Sending anywhere else needs farmhousegetaways.com
 *                    verified in Resend first, which is DNS at the registrar.
 *   ALERT_EMAIL_TO   where it lands.
 *
 * reply_to is the person who submitted, so hitting Reply in the inbox writes
 * back to them rather than to a no-reply address.
 */
async function toEmail(alert, data) {
  const key = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.RESEND_FROM || "").trim();
  const to = (process.env.ALERT_EMAIL_TO || "").trim();
  if (!key || !from || !to) return "skipped";

  const esc = (s) =>
    String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  // Each line of the summary is "Label: value". Bold the label, and turn a bare
  // URL into a link, so the page it came from is one click rather than a copy
  // and paste.
  const rows = alert.body.split("\n").map((line) => {
    const at = line.indexOf(": ");
    const label = at > 0 ? line.slice(0, at) : "";
    const value = at > 0 ? line.slice(at + 2) : line;
    const shown = /^https?:\/\/\S+$/.test(value)
      ? `<a href="${esc(value)}">${esc(value)}</a>`
      : esc(value);
    return label
      ? `<tr><td style="padding:3px 14px 3px 0;color:#6E5F66;white-space:nowrap;">${esc(label)}</td>` +
        `<td style="padding:3px 0;color:#22201d;"><strong>${shown}</strong></td></tr>`
      : `<tr><td colspan="2" style="padding:3px 0;color:#22201d;">${shown}</td></tr>`;
  });

  const html =
    `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;">` +
    `<table cellpadding="0" cellspacing="0" border="0">${rows.join("")}</table></div>`;

  const replyTo = String(data?.email || "").trim();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: alert.title,
      text: alert.body,
      html,
      ...(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo) ? { reply_to: [replyTo] } : {}),
    }),
  });
  if (res.ok) return "sent";
  // Resend puts the reason in the body and it is the difference between a bad
  // key and an unverified from address. A bare status number costs an hour.
  let why = "";
  try { why = ` ${(await res.text()).slice(0, 200)}`; } catch { /* nothing to add */ }
  return `failed ${res.status}${why}`;
}

/**
 * "sent" and "skipped" are the two routine outcomes and get an ordinary log
 * line. Anything else — "failed 401", "error <message>" — means a channel
 * that IS configured did not deliver, and that must never sit at the same
 * log level as success. Before this, a channel missing its key in a preview
 * or branch-deploy context reported through console.log, indistinguishable
 * from a routine line and invisible to anything that only surfaces errors.
 */
function logChannel(name, result) {
  if (result === "sent" || result === "skipped") {
    console.log(`[alert] ${name}: ${result}`);
  } else {
    console.error(`[alert] ${name} FAILED: ${result}`);
  }
}

/** Fire every configured channel. Never throws. */
export async function sendAlert(formName, data) {
  if (!formName) return { ntfy: "skipped", webhook: "skipped", email: "skipped" };
  const alert = summarise(formName, data || {});
  const [ntfy, webhook, email] = await Promise.all([
    toNtfy(alert).catch((e) => `error ${e.message}`),
    toWebhook(alert, formName, data || {}).catch((e) => `error ${e.message}`),
    toEmail(alert, data || {}).catch((e) => `error ${e.message}`),
  ]);
  logChannel("ntfy", ntfy);
  logChannel("webhook", webhook);
  logChannel("email", email);
  return { ntfy, webhook, email };
}
