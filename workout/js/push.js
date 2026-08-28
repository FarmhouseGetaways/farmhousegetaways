/* ==========================================================================
   Asking to be reminded.

   Three things have to line up before a notification can arrive, and each of
   them can be missing on its own:

     the browser supports push      — an iPhone must have the app on the home
                                      screen first; Safari in a tab cannot
     permission has been granted    — and it can only be asked for once, from
                                      a real tap, so the app asks at the moment
                                      she presses the switch and never on load
     the site has VAPID keys        — otherwise there is nothing to subscribe to

   Everything here reports which of those is missing in words, because
   "notifications aren't working" is the least useful sentence in software.
   ========================================================================== */

const API = "/api/reminders";

export const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** An iPhone only allows push once the app is on the home screen. Worth saying. */
export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;

const isIos = () => /iP(hone|ad|od)/.test(navigator.userAgent);

export const permission = () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

export const timezone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; }
};

/** The VAPID key arrives as base64url and the browser wants raw bytes. */
function toBytes(base64url) {
  const padded = (base64url + "=".repeat((4 - base64url.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function call(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

/** What this device is currently set to, and whether the site can send at all. */
export async function status() {
  if (!supported()) {
    return {
      ok: false, supported: false, ready: false, subscribed: false,
      why: isIos() && !isStandalone()
        ? "On an iPhone, reminders only work once the app is on the home screen. Share, then Add to Home Screen, and open it from there."
        : "This browser cannot do push notifications.",
    };
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const query = existing ? `?endpoint=${encodeURIComponent(existing.endpoint)}` : "";
  const { res, body } = await call(API + query);

  if (!res.ok) {
    return { ok: false, supported: true, ready: false, subscribed: false, why: body.error || `The server said ${res.status}.` };
  }
  return {
    ok: true, supported: true,
    ready: !!body.ready,
    publicKey: body.publicKey || "",
    subscribed: !!body.subscribed && !!existing,
    reminder: body.reminder || null,
    // What this account's reminder will be set to the moment "Remind me" is
    // pressed — the admin's schedule for this person, or the site default.
    // The hour is no longer a choice made here; see enable() below.
    effective: body.effective || null,
    permission: permission(),
    why: body.ready ? "" : "Reminders are not switched on for this site yet.",
  };
}

/**
 * Turn reminders on for this device.
 *
 * Must be called straight from a tap: asking for permission from anywhere else
 * is refused outright by some browsers, and by others it is silently denied
 * for ever, which is worse.
 *
 * No hour is chosen here any more — the admin decides that, per account or
 * for everyone at once (see Settings → Edit the week → Reminders on the
 * admin side). This just asks the browser's permission and subscribes;
 * the server seeds the actual schedule from that account's own setting.
 */
export async function enable() {
  const state = await status();
  if (!state.supported) throw new Error(state.why);
  if (!state.ready) throw new Error(state.why || "Reminders are not switched on for this site yet.");

  if (permission() === "denied") {
    throw new Error("Notifications are blocked for this app in the browser's settings. Allow them there, then try again.");
  }
  if (permission() !== "granted") {
    const asked = await Notification.requestPermission();
    if (asked !== "granted") throw new Error("Not allowed — nothing will be sent.");
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toBytes(state.publicKey),
    });
  }

  const { res, body } = await call(API, {
    method: "POST",
    body: JSON.stringify({ subscription: sub.toJSON(), tz: timezone(), reminder: { enabled: true } }),
  });
  if (!res.ok || !body.ok) throw new Error(body.error || `The server said ${res.status}.`);
  return body;
}

/** Change the hour, or turn it off without unsubscribing. */
export async function update(patch) {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) throw new Error("This device is not set up for reminders yet.");

  const { res, body } = await call(API, {
    method: "POST",
    body: JSON.stringify({ subscription: sub.toJSON(), tz: timezone(), ...patch }),
  });
  if (!res.ok || !body.ok) throw new Error(body.error || `The server said ${res.status}.`);
  return body;
}

/** "Not now — remind me at five." */
export const snoozeTo = (hour) => update({ snoozeHour: hour });

export async function disable() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true };
  await call(API, { method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint }) });
  await sub.unsubscribe().catch(() => {});
  return { ok: true };
}

/** Run the hourly sweep now and report what it did — the setup self-test. */
export async function selftest(force = true) {
  const { body } = await call(`${API}?test=${force ? "force" : "1"}`);
  return body.test || { why: ["No answer from the server."] };
}
