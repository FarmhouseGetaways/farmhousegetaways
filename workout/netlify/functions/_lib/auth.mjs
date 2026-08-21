/**
 * Shared plumbing for the workout tracker's three functions.
 *
 * THE IDEA
 * The app is a folder of static files. Exactly two things need a server: the
 * plan, so it can be written on one device and followed on another, and the
 * record, so it is not trapped on one phone. Both live in Netlify Blobs — a
 * private store belonging to this site alone, not a file in a public
 * repository — and one password guards them.
 *
 * FAIL CLOSED
 * With no WORKOUT_PASSWORD set, signing in is impossible, every write is
 * refused and the record cannot be read. A misconfigured site is a read-only
 * site, never an open one.
 *
 * WHY A COOKIE AND NOT THE PASSWORD
 * The password is sent once, to /api/auth, and never stored in the browser.
 * What the browser keeps is an HttpOnly, Secure, SameSite=Strict cookie
 * holding a signed, expiring token: the page's own JavaScript cannot read it,
 * nor can anything that ends up running on the page, and another site cannot
 * use it to cause a write here. A password in localStorage has none of those
 * properties.
 */
import { getStore } from "@netlify/blobs";
import { createHmac, createHash, timingSafeEqual, randomUUID } from "node:crypto";

export const PLAN = () => getStore("workout-plan");
export const HISTORY = () => getStore("workout-history");
export const LOCKOUT = () => getStore("workout-lockout");

export const PLAN_KEY = "plan";
export const HISTORY_KEY = "history";

export const json = (obj, status = 200, headers = {}) =>
  Response.json(obj, { status, headers: { "Cache-Control": "no-store", ...headers } });

const COOKIE = "workout_session";
const DAYS = 60;          // she is not signing in every fortnight to do a workout

const password = () => (process.env.WORKOUT_PASSWORD || "").trim();

export const configured = () => password().length > 0;

/**
 * Constant-time compare. Two passwords of different lengths take different
 * amounts of time to compare with ===, and that difference is enough to learn
 * the length; hashing both sides first makes every comparison the same size.
 */
export function passwordOk(given) {
  const want = password();
  if (!want) return false;
  const a = createHash("sha256").update(String(given ?? "")).digest();
  const b = createHash("sha256").update(want).digest();
  return timingSafeEqual(a, b);
}

/**
 * The signing key for session tokens. A separate WORKOUT_SESSION_SECRET is
 * better — changing the password then need not sign everybody out — but
 * deriving one from the password keeps setup to a single environment variable,
 * which is the difference between this being set up and not being set up.
 */
function signingKey() {
  const explicit = (process.env.WORKOUT_SESSION_SECRET || "").trim();
  return explicit || createHash("sha256").update("workout:" + password()).digest("hex");
}

export function makeToken() {
  const exp = Date.now() + DAYS * 24 * 60 * 60 * 1000;
  const body = `${exp}.${randomUUID()}`;
  return `${body}.${createHmac("sha256", signingKey()).update(body).digest("hex")}`;
}

export function tokenOk(token) {
  if (!token || !configured()) return false;
  const parts = String(token).split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const want = createHmac("sha256", signingKey()).update(`${exp}.${nonce}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(want, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

function readCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function sessionCookie(token) {
  return [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${token ? DAYS * 24 * 60 * 60 : 0}`,
  ].join("; ");
}

export const signedIn = (req) => tokenOk(readCookie(req, COOKIE));

/* ------------------------------------------------------------------ *
   Slowing a guessing script down

   A password and an unlimited guess rate is not a password. The counter lives
   in a Blob keyed by address: ten wrong guesses inside fifteen minutes and
   that address waits. If the store is unreachable the login still proceeds —
   locking everybody out because a storage call failed would be a worse failure
   than the one being prevented.
 * ------------------------------------------------------------------ */

const MAX_TRIES = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function lockoutState(ip) {
  try {
    const rec = await LOCKOUT().get(ip, { type: "json" });
    if (!rec || Date.now() - rec.first > WINDOW_MS) return { blocked: false, tries: 0 };
    return { blocked: rec.tries >= MAX_TRIES, tries: rec.tries, first: rec.first };
  } catch {
    return { blocked: false, tries: 0 };
  }
}

export async function noteFailure(ip) {
  try {
    const now = Date.now();
    const rec = (await LOCKOUT().get(ip, { type: "json" })) || { first: now, tries: 0 };
    if (now - rec.first > WINDOW_MS) { rec.first = now; rec.tries = 0; }
    rec.tries += 1;
    await LOCKOUT().setJSON(ip, rec);
  } catch { /* see above: bookkeeping never blocks a login */ }
}

export async function clearFailures(ip) {
  try { await LOCKOUT().delete(ip); } catch { /* nothing to do */ }
}

export function clientIp(req, context) {
  return (context && context.ip)
    || (req.headers.get("x-nf-client-connection-ip") || "").trim()
    || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim()
    || "unknown";
}
