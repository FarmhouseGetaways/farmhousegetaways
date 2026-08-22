/**
 * GET    /api/auth               → { configured, signedIn }
 * POST   /api/auth  { password } → sets the session cookie
 * DELETE /api/auth               → clears it
 *
 * The password never reaches localStorage. What the browser keeps is an
 * HttpOnly, signed, expiring token — see _lib/auth.mjs for why that matters.
 */
import {
  configured, passwordOk, makeToken, sessionCookie, signedIn,
  lockoutState, noteFailure, clearFailures, clientIp, json,
} from "./_lib/auth.mjs";

export const config = { path: "/api/auth" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (req, context) => {
  if (req.method === "GET") return json({ configured: configured(), signedIn: signedIn(req) });

  if (req.method === "DELETE") {
    return json({ ok: true, signedIn: false }, 200, { "Set-Cookie": sessionCookie("") });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);

  if (!configured()) {
    return json({
      ok: false,
      error: "This app has no password set yet. Add WORKOUT_PASSWORD in the Netlify environment variables and redeploy.",
    }, 503);
  }

  const ip = clientIp(req, context);
  if ((await lockoutState(ip)).blocked) {
    return json({ ok: false, error: "Too many tries. Wait fifteen minutes." }, 429);
  }

  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  if (!passwordOk(body.password)) {
    await noteFailure(ip);
    /* A pause on failure — enough to make a guessing script slow, too short to
       be noticed by somebody who simply mistyped. */
    await sleep(700);
    return json({ ok: false, error: "That password isn't right." }, 401);
  }

  await clearFailures(ip);
  return json({ ok: true, signedIn: true }, 200, { "Set-Cookie": sessionCookie(makeToken()) });
};
