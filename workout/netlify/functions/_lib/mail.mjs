/**
 * Sending a password-reset email, via Resend's plain HTTPS API — no SDK, so
 * this app still has no npm dependency it does not strictly need.
 *
 * Needs two environment variables, neither of which this file invents a
 * default for:
 *
 *   RESEND_API_KEY   the key from resend.com
 *   RESEND_FROM      the address it sends as, e.g. "Carissa's Workouts
 *                     <no-reply@yourdomain.com>" — Resend requires this to be
 *                     on a domain you have verified with them, or their own
 *                     sandbox address, which only delivers to the account's
 *                     own sign-up email until a domain is verified.
 *
 * Without both set, `configured()` is false and callers are expected to skip
 * sending rather than let the request fail — see account.mjs's reset-request
 * handler, which never lets whether the email actually went out change what
 * it tells the browser, so a misconfigured mailer cannot be used to learn
 * which addresses have accounts.
 */

const RESEND_URL = "https://api.resend.com/emails";

export const configured = () =>
  !!(process.env.RESEND_API_KEY || "").trim() && !!(process.env.RESEND_FROM || "").trim();

export async function sendMail({ to, subject, html, text }) {
  if (!configured()) throw new Error("Email is not set up on this site.");

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from: process.env.RESEND_FROM.trim(), to: [to], subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend said ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}
