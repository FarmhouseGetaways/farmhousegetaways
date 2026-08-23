/**
 * Accounts — up to five of them, for the beta.
 *
 * Separate from the admin password entirely. The admin password (see
 * _lib/auth.mjs) still gates editing the week, exactly as it always has; this
 * file is about a person signing in with their own email and password (or
 * Google) so their own training record follows them between devices and
 * nobody else's does.
 *
 * WHY FIVE
 * The owner asked to keep this small while the app is still in beta rather
 * than build out real multi-tenant infrastructure — invoices, roles, admin
 * screens for managing other people's accounts — before it is known whether
 * any of that is needed. Five is a number, not a wall: raising MAX_USERS is
 * a one-line change whenever that conversation happens.
 *
 * A LOW-TRAFFIC ADMISSION
 * The account count is enforced by reading a small index, checking it, then
 * writing it back — not a single atomic operation. Two signups arriving in
 * the same instant could both pass the check and both write, landing on six
 * accounts instead of five. For a handful of people being invited to try an
 * app, that is a fine trade against the complexity a real lock would add.
 *
 * PASSWORDS
 * Hashed with scrypt (Node's own, no dependency) in _lib/credentials.mjs —
 * split out there, with email validation, so both can be tested without a
 * live Blobs store. The account session token and the password reset token
 * are both signed from the same seed the admin session uses (_lib/auth.mjs's
 * sessionSeed), but hashed with their own prefix first, so a token from one
 * system is meaningless handed to the other.
 */
import { getStore } from "@netlify/blobs";
import { createHmac, createHash, timingSafeEqual, randomUUID, randomBytes } from "node:crypto";
import { sessionSeed, readCookie } from "./auth.mjs";
import { hashPassword, verifyPassword, passwordStrongEnough, normaliseEmail, validEmail } from "./credentials.mjs";

export { hashPassword, verifyPassword, passwordStrongEnough, normaliseEmail, validEmail };

const USERS = () => getStore("workout-users");
const INDEX_KEY = "index";          // lowercased email -> user id
export const MAX_USERS = 5;

export const ACCOUNT_COOKIE = "workout_account";
const ACCOUNT_DAYS = 60;
const RESET_MINUTES = 60;

/** What the browser is allowed to know about a user. Never the password hash
 * or the Google id — only whether each exists, which is what the account
 * screen needs to decide whether "change password" makes sense to offer. */
export const publicUser = (u) => u && ({
  id: u.id, email: u.email, name: u.name,
  hasPassword: !!u.passwordHash, hasGoogle: !!u.googleSub,
});

/* ---------- the index and the store ---------- */

async function readIndex() {
  try { return (await USERS().get(INDEX_KEY, { type: "json" })) || {}; }
  catch { return {}; }
}
async function writeIndex(idx) { await USERS().setJSON(INDEX_KEY, idx); }

export async function countUsers() {
  return Object.keys(await readIndex()).length;
}

export async function findByEmail(email) {
  const idx = await readIndex();
  const id = idx[normaliseEmail(email)];
  if (!id) return null;
  try { return await USERS().get(id, { type: "json" }); } catch { return null; }
}

export async function findById(id) {
  if (!id) return null;
  try { return await USERS().get(id, { type: "json" }); } catch { return null; }
}

/**
 * Create an account. `password` is a plain string to hash here, or omit it
 * for a Google-only account (`googleSub` instead) — either way something has
 * to be able to sign in, so at least one of the two is required.
 *
 * `isFirst` on a successful result tells the caller this was the very first
 * account ever created, which is the signal to copy the old shared record —
 * from before accounts existed — into this new account. See account.mjs.
 */
export async function createUser({ email, password, name, googleSub }) {
  const clean = normaliseEmail(email);
  if (!validEmail(clean)) return { ok: false, error: "That doesn't look like an email address." };
  if (!password && !googleSub) return { ok: false, error: "Something went wrong signing you up." };
  if (password && !passwordStrongEnough(password)) {
    return { ok: false, error: "Use a password of at least 8 characters." };
  }

  const idx = await readIndex();
  if (idx[clean]) return { ok: false, error: "That email already has an account here." };
  if (Object.keys(idx).length >= MAX_USERS) {
    return {
      ok: false,
      error: `This app is in a small beta and already has its ${MAX_USERS} accounts. Ask to be added.`,
    };
  }

  const record = {
    id: "u_" + randomUUID(),
    email: clean,
    name: String(name ?? "").trim().slice(0, 80) || clean.split("@")[0],
    passwordHash: password ? await hashPassword(password) : "",
    googleSub: String(googleSub ?? ""),
    tokenVersion: 1,
    resetTokenHash: "",
    resetExpires: 0,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  await USERS().setJSON(record.id, record);
  idx[clean] = record.id;
  await writeIndex(idx);

  return { ok: true, user: record, isFirst: Object.keys(idx).length === 1 };
}

/** Bumping tokenVersion signs every other device on this account out — used
 * on both a normal password change and a reset, since a reset usually means
 * the old password (and whatever session used it) should not be trusted. */
export async function setPassword(userId, password) {
  const user = await findById(userId);
  if (!user) return false;
  user.passwordHash = await hashPassword(password);
  user.tokenVersion = (user.tokenVersion || 1) + 1;
  user.resetTokenHash = "";
  user.resetExpires = 0;
  await USERS().setJSON(userId, user);
  return true;
}

export async function linkGoogle(userId, googleSub) {
  const user = await findById(userId);
  if (!user) return false;
  user.googleSub = String(googleSub ?? "");
  await USERS().setJSON(userId, user);
  return true;
}

/** A "changed the password while already signed in" version of setPassword —
 * the difference is only who calls it and why: this one is reached having
 * already proved the CURRENT password, setPassword's other caller (a reset)
 * having proved an emailed token instead. Either way the effect is the same,
 * on purpose: a changed password signs every other device out. */
export const changePassword = setPassword;

/** When this account last signed in — not "last used the app", which would
 * mean writing on every set logged; just "last time they typed a password or
 * pressed the Google button". Cheap, and enough for the admin list to be
 * more than a list of names nobody has ever used. */
export async function touchLastSeen(userId) {
  const user = await findById(userId);
  if (!user) return;
  user.lastSeenAt = new Date().toISOString();
  await USERS().setJSON(userId, user);
}

/** Everything the admin screen is allowed to know about who has an account
 * here — never a password hash, a Google id, or a session token. Sorted
 * oldest first, the order people actually joined in. */
export async function listAccounts() {
  const idx = await readIndex();
  const users = await Promise.all(Object.values(idx).map((id) => findById(id)));
  return users
    .filter(Boolean)
    .map((u) => ({
      id: u.id, email: u.email, name: u.name,
      google: !!u.googleSub, password: !!u.passwordHash,
      createdAt: u.createdAt, lastSeenAt: u.lastSeenAt || u.createdAt,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/* ---------- password reset ----------
 *
 * The token itself is never stored — only its hash, same reasoning as a
 * session token. It lives on the user record rather than in a store of its
 * own, which has a pleasant side effect: requesting a second reset overwrites
 * the first, so there is only ever one live link per person and an old,
 * forgotten email cannot reset the password out from under a newer one.
 */

export async function issueResetToken(userId) {
  const user = await findById(userId);
  if (!user) return null;
  const raw = randomBytes(32).toString("hex");
  user.resetTokenHash = createHash("sha256").update(raw).digest("hex");
  user.resetExpires = Date.now() + RESET_MINUTES * 60 * 1000;
  await USERS().setJSON(userId, user);
  return raw;
}

/** Find whoever this token belongs to, without the request having to say —
 * with at most five accounts, checking each one is simpler than a second
 * index and no slower in any way that matters. */
export async function findByResetToken(token) {
  const raw = String(token ?? "");
  if (!raw) return null;
  const want = createHash("sha256").update(raw).digest();
  const idx = await readIndex();
  for (const id of Object.values(idx)) {
    const user = await findById(id);
    if (!user?.resetTokenHash) continue;
    let got;
    try { got = Buffer.from(user.resetTokenHash, "hex"); } catch { continue; }
    if (got.length !== want.length || !timingSafeEqual(got, want)) continue;
    if (!user.resetExpires || user.resetExpires < Date.now()) continue;
    return user;
  }
  return null;
}

/** Spend the token: set the new password (which itself clears the token —
 * see setPassword) and return the user it belonged to, or null if the token
 * was never valid or has already been used. */
export async function consumeResetToken(token, password) {
  const user = await findByResetToken(token);
  if (!user) return null;
  await setPassword(user.id, password);
  return await findById(user.id);
}

/* ---------- account sessions ----------
 *
 * Same shape of idea as the admin session in _lib/auth.mjs — an HttpOnly,
 * Secure, signed, expiring cookie the page's own JavaScript cannot read —
 * with one addition: the token carries the user id and the tokenVersion it
 * was issued under, and a stale version (because the password changed since)
 * is rejected even though the signature still checks out. That is what makes
 * a password change or reset actually sign other devices out, rather than
 * just feeling like it should.
 */

function accountSigningKey() {
  return createHash("sha256").update("account:" + sessionSeed()).digest("hex");
}

export function makeAccountToken(user) {
  // Exactly three fields signed — exp, tokenVersion, userId — so the token is
  // exp.version.userId.signature: four parts, which is what currentAccount
  // below expects to split back apart. (No nonce: unlike the admin token in
  // _lib/auth.mjs, which is a bare capability with nothing else to bind it to
  // a person, this one is already unique per user and useless to anyone else
  // even if two logins in the same millisecond produced an identical token.)
  const exp = Date.now() + ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
  const body = `${exp}.${user.tokenVersion || 1}.${user.id}`;
  return `${body}.${createHmac("sha256", accountSigningKey()).update(body).digest("hex")}`;
}

export function accountCookie(token) {
  return [
    `${ACCOUNT_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${token ? ACCOUNT_DAYS * 24 * 60 * 60 : 0}`,
  ].join("; ");
}

/** The user this request is signed in as, or null — checking not just the
 * signature but that the token's version still matches the account's current
 * one, so a password change actually invalidates every other session. */
export async function currentAccount(req) {
  const token = readCookie(req, ACCOUNT_COOKIE);
  if (!token) return null;
  const parts = String(token).split(".");
  if (parts.length !== 4) return null;
  const [exp, version, userId, sig] = parts;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return null;

  // Four dot-separated parts, but only the first three (exp, version, userId)
  // were signed — the fourth is the signature itself.
  const signed = `${exp}.${version}.${userId}`;
  const wantSig = createHmac("sha256", accountSigningKey()).update(signed).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(wantSig, "hex");
  if (a.length !== b.length || a.length === 0 || !timingSafeEqual(a, b)) return null;

  const user = await findById(userId);
  if (!user) return null;
  if (String(user.tokenVersion || 1) !== version) return null;
  return user;
}
