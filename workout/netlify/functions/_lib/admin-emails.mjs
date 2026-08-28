/**
 * Which accounts are recognised as admin, automatically, by email.
 *
 * Replaces the old model where anyone who knew WORKOUT_PASSWORD and pressed
 * the right gesture became "admin" for that browser, with no link back to a
 * person. Now admin-ness is a property of the ACCOUNT: sign in as one of
 * these addresses and the app already knows, no separate password or
 * long-press needed. Everyone else — including a signed-out visitor — never
 * sees an admin control at all.
 *
 * A short, explicit list rather than a flag on the account record, for the
 * same reason `users.mjs`'s MAX_USERS is a constant and not a settings
 * screen: this is a five-person beta with one admin. Add an address below to
 * make it one too — normaliseEmail (case-insensitive, trimmed) is applied on
 * both sides so capitalisation never matters.
 */
import { normaliseEmail } from "./credentials.mjs";

const ADMIN_EMAILS = new Set([
  "corydzbinski@gmail.com",
].map(normaliseEmail));

export const isAdminEmail = (email) => ADMIN_EMAILS.has(normaliseEmail(email));
