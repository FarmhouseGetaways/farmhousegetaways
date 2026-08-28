/**
 * Password hashing and email validation — the part of the account system
 * that touches neither Netlify Blobs nor a network call, split out on its own
 * so it can be tested with nothing installed, the same reason data.mjs and
 * remind.mjs exist as their own files:
 *
 *     node --test workout/netlify/functions/_lib/*.test.mjs
 *
 * Passwords are hashed with scrypt (Node's own, so no dependency), a random
 * salt per password, compared in constant time so a partial match cannot be
 * timed out of the comparison.
 */
import { timingSafeEqual, randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(String(password), salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  let salt, want;
  try { salt = Buffer.from(saltHex, "hex"); want = Buffer.from(hashHex, "hex"); }
  catch { return false; }
  if (want.length === 0) return false;
  const got = await scryptAsync(String(password), salt, want.length);
  return got.length === want.length && timingSafeEqual(got, want);
}

export const passwordStrongEnough = (password) => String(password ?? "").length >= 8;

export const normaliseEmail = (v) => String(v ?? "").trim().toLowerCase();
export const validEmail = (v) => v.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
