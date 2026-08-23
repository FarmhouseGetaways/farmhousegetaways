/* ==========================================================================
   Talking to /api/account.

   Separate from signing in as admin (see store.js's signIn/signOut, still the
   app's own shared password, still gating the editor and nothing else). This
   is a real account — email and password, or Google — and it is what a
   personal training record is attached to.

   Every function here returns { ok, ... } rather than throwing, the same
   convention store.js uses, so a caller never needs a try/catch just to show
   an error message.
   ========================================================================== */

const API = "/api/account";

async function call(body) {
  let res, out;
  try {
    res = await fetch(API, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    out = await res.json().catch(() => ({}));
  } catch {
    return { ok: false, error: "Could not reach the app's server. Check the connection and try again." };
  }
  if (!res.ok || !out.ok) return { ok: false, error: out.error || `The server said ${res.status}.` };
  return out;
}

/** Who is signed in, and what this site is set up to offer — the Google
 * button and the "create an account" door both stay hidden until this says
 * they are available, same as reminders staying hidden without VAPID keys. */
export async function status() {
  try {
    const res = await fetch(API, { credentials: "include", cache: "no-store" });
    return await res.json();
  } catch {
    return { ok: false, signedIn: false, account: null, full: false, mailConfigured: false, google: null };
  }
}

export const signUp = ({ email, password, name }) => call({ intent: "signup", email, password, name });
export const logIn = ({ email, password }) => call({ intent: "login", email, password });
export const withGoogle = (credential) => call({ intent: "google", credential });
export const requestReset = (email) => call({ intent: "reset-request", email });
export const resetPassword = ({ token, password }) => call({ intent: "reset", token, password });

export async function logOut() {
  try { await fetch(API, { method: "DELETE", credentials: "include", cache: "no-store" }); }
  catch { /* the cookie expires on its own either way */ }
  return { ok: true };
}

/* ---------- the Google button ----------
 *
 * Google's own script (accounts.google.com/gsi/client) renders it and hands
 * back a signed credential without this app ever touching a Google password.
 * Loaded on demand, only once GET /api/account has said a client id exists —
 * no point asking a browser to fetch a script for a button nobody can use.
 */

let scriptLoading = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Google's sign-in script."));
    document.head.appendChild(s);
  });
  return scriptLoading;
}

/** Render the button into `el` (an empty container), calling `onCredential`
 * with the raw token once someone completes the Google flow — the caller
 * (app.js) is the one that posts it on to withGoogle(). */
export async function renderGoogleButton(el, clientId, onCredential) {
  await loadGoogleScript();
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp) => onCredential(resp.credential),
  });
  window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", width: 280 });
}
