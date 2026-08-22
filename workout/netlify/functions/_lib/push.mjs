/**
 * Sending a notification to a phone.
 *
 * A subscription is a URL and two keys, one per device — there will be two or
 * three of them, not two million, so they live in a Blob and that is the end
 * of the storage question.
 *
 * FAIL QUIET, NOT LOUD
 * Nothing in here throws. A reminder that could not be sent is a reminder that
 * did not arrive; it is not a reason for the hourly job to fall over and stop
 * sending to everybody else.
 */
import webpush from "web-push";
import { SUBS } from "./auth.mjs";

export const configured = () => Boolean(process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE);

export const publicKey = () => (process.env.VAPID_PUBLIC || "").trim();

function arm() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:farmhousegetaways@gmail.com",
    process.env.VAPID_PUBLIC,
    process.env.VAPID_PRIVATE,
  );
}

/** An endpoint URL is long and full of slashes; its hash is the key. */
export async function keyFor(endpoint) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(endpoint)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function allSubs() {
  const store = SUBS();
  const out = [];
  try {
    const { blobs } = await store.list();
    for (const b of blobs) {
      try {
        const sub = await store.get(b.key, { type: "json" });
        if (sub?.endpoint) out.push({ key: b.key, ...sub });
      } catch { /* one unreadable record is not the end of the run */ }
    }
  } catch (err) {
    console.warn("push: could not list subscriptions,", err?.message);
  }
  return out;
}

export const putSub = (key, sub) => SUBS().setJSON(key, sub);
export const dropSub = (key) => SUBS().delete(key).catch(() => {});

/**
 * Send one notification to one device.
 *
 * A 404 or 410 from the push service means that device uninstalled the app or
 * cleared its data, and the subscription is dead for ever. Deleting them here
 * is the only thing that stops the list rotting into a pile of addresses that
 * can never be delivered to.
 */
export async function sendTo(sub, payload) {
  if (!configured()) return "not-configured";
  arm();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload),
    );
    return "sent";
  } catch (err) {
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await dropSub(sub.key);
      return "gone";
    }
    console.warn("push: send failed,", err?.statusCode, err?.message);
    return "failed";
  }
}
