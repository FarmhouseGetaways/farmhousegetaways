/**
 * GET    /api/account                             → who is signed in, and
 *                                                    what this site is set up
 *                                                    to offer (Google button,
 *                                                    reset emails, room for
 *                                                    another account)
 * POST   /api/account { intent: "signup", ... }    → create an account
 * POST   /api/account { intent: "login", ... }     → sign in
 * POST   /api/account { intent: "google", ... }    → sign in with Google
 * POST   /api/account { intent: "reset-request" }  → email a reset link
 * POST   /api/account { intent: "reset" }          → use one
 * DELETE /api/account                              → sign out
 *
 * SEPARATE FROM THE ADMIN PASSWORD
 * This is a different door with a different lock. The admin password (see
 * _lib/auth.mjs, unchanged by any of this) still gates editing the week and
 * nothing here touches it. An account gates one thing only: a person's own
 * training record following them between devices.
 *
 * A single function with an `intent` field, rather than five tiny ones, on
 * purpose — every action here shares the same cookie, the same lockout
 * bookkeeping and the same "no password set up yet" guard, and splitting
 * that five ways would mean five copies of it to keep in step.
 */
import {
  json, configured as sitePasswordConfigured, clientIp,
  lockoutState, noteFailure, clearFailures,
  HISTORY, HISTORY_KEY, historyKeyFor,
} from "./_lib/auth.mjs";
import {
  MAX_USERS, ACCOUNT_COOKIE, countUsers, findByEmail, findById, createUser,
  verifyPassword, setPassword, changePassword, linkGoogle, publicUser,
  issueResetToken, consumeResetToken, touchLastSeen,
  makeAccountToken, accountCookie, currentAccount,
  validEmail, normaliseEmail,
} from "./_lib/users.mjs";
import { sendMail, configured as mailConfigured } from "./_lib/mail.mjs";
import { verifyIdToken, configured as googleConfigured, clientId as googleClientId } from "./_lib/google.mjs";

export const config = { path: "/api/account" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Copy whatever the old, single shared record held into the very first
 * account anybody creates. Every account after that starts with a clean
 * slate of its own — there is nothing to hand it, and guessing which of five
 * people's history a blank shared record belonged to would be worse than
 * leaving it blank. */
async function migrateLegacyHistory(userId) {
  try {
    const legacy = await HISTORY().get(HISTORY_KEY, { type: "json" });
    if (legacy) await HISTORY().setJSON(historyKeyFor(userId), legacy);
  } catch (err) {
    console.warn("account: legacy history migration failed,", err && err.message);
  }
}

const siteOrigin = (req) => { try { return new URL(req.url).origin; } catch { return ""; } };

/** The one place every successful sign-in ends up — signup, login, Google,
 * reset, and a password change — so touching lastSeenAt here covers all of
 * them without a separate call at each site to forget. */
async function signedInAs(user) {
  await touchLastSeen(user.id);
  return json({ ok: true, account: publicUser(user) }, 200, {
    "Set-Cookie": accountCookie(makeAccountToken(user)),
  });
}

export default async (req, context) => {
  if (!sitePasswordConfigured()) {
    return json({ ok: false, error: "This app is not set up yet." }, 503);
  }

  if (req.method === "GET") {
    const user = await currentAccount(req);
    return json({
      ok: true,
      signedIn: !!user,
      account: publicUser(user),
      full: (await countUsers()) >= MAX_USERS,
      maxUsers: MAX_USERS,
      mailConfigured: mailConfigured(),
      google: googleConfigured() ? { clientId: googleClientId() } : null,
    });
  }

  if (req.method === "DELETE") {
    return json({ ok: true, signedIn: false }, 200, { "Set-Cookie": accountCookie("") });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);

  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const intent = String(body.intent || "");
  const ip = clientIp(req, context);
  const scope = (name) => `acct:${name}:${ip}`;

  /* ---- create an account ---- */
  if (intent === "signup") {
    if ((await lockoutState(scope("signup"))).blocked) {
      return json({ ok: false, error: "Too many tries. Wait fifteen minutes." }, 429);
    }
    const result = await createUser({ email: body.email, password: body.password, name: body.name });
    if (!result.ok) { await noteFailure(scope("signup")); return json(result, 400); }
    await clearFailures(scope("signup"));
    if (result.isFirst) await migrateLegacyHistory(result.user.id);
    return signedInAs(result.user);
  }

  /* ---- change the password, already signed in ---- */
  if (intent === "change-password") {
    const user = await currentAccount(req);
    if (!user) return json({ ok: false, error: "Not signed in." }, 401);
    if (!user.passwordHash) {
      return json({ ok: false, error: "This account signs in with Google, so there is no password to change here." }, 400);
    }
    const ok = await verifyPassword(String(body.currentPassword ?? ""), user.passwordHash);
    if (!ok) return json({ ok: false, error: "That current password isn't right." }, 401);
    const next = String(body.password ?? "");
    if (next.length < 8) return json({ ok: false, error: "Use a new password of at least 8 characters." }, 400);
    await changePassword(user.id, next);
    const fresh = await findById(user.id);
    return signedInAs(fresh);
  }

  /* ---- sign in with a password ---- */
  if (intent === "login") {
    if ((await lockoutState(scope("login"))).blocked) {
      return json({ ok: false, error: "Too many tries. Wait fifteen minutes." }, 429);
    }
    const user = await findByEmail(body.email);
    const ok = user && await verifyPassword(String(body.password ?? ""), user.passwordHash);
    if (!ok) {
      await noteFailure(scope("login"));
      await sleep(700);                  // see auth.mjs's /api/auth for why
      return json({ ok: false, error: "That email or password isn't right." }, 401);
    }
    await clearFailures(scope("login"));
    return signedInAs(user);
  }

  /* ---- sign in with Google ---- */
  if (intent === "google") {
    if (!googleConfigured()) return json({ ok: false, error: "Google sign-in is not set up on this site yet." }, 503);
    let claims;
    try { claims = await verifyIdToken(body.credential); }
    catch (err) { return json({ ok: false, error: err.message }, 401); }

    let user = await findByEmail(claims.email);
    if (user) {
      if (!user.googleSub) await linkGoogle(user.id, claims.sub);
    } else {
      const result = await createUser({ email: claims.email, name: claims.name, googleSub: claims.sub });
      if (!result.ok) return json(result, 400);
      user = result.user;
      if (result.isFirst) await migrateLegacyHistory(user.id);
    }
    return signedInAs(user);
  }

  /* ---- "I forgot it" ---- */
  if (intent === "reset-request") {
    if ((await lockoutState(scope("reset"))).blocked) {
      return json({ ok: false, error: "Too many tries. Wait fifteen minutes." }, 429);
    }
    await noteFailure(scope("reset"));  // counts requests, not failures — there is no wrong answer to rate-limit otherwise

    const email = normaliseEmail(body.email);
    // The same response either way — telling the visitor an address has no
    // account here would let anyone use this box to find out who has one.
    const reply = json({ ok: true, note: "If that email has an account here, a reset link is on its way." });

    if (!validEmail(email)) return reply;
    const user = await findByEmail(email);
    if (!user) return reply;

    const raw = await issueResetToken(user.id);
    if (!raw || !mailConfigured()) return reply;

    const link = `${siteOrigin(req)}/#/reset?token=${encodeURIComponent(raw)}`;
    try {
      await sendMail({
        to: user.email,
        subject: "Reset your workout tracker password",
        text: `Someone asked to reset the password on Carissa's workout tracker.\n\n`
          + `Set a new one: ${link}\n\n`
          + `This link works for one hour. If this wasn't you, ignore this email — nothing changes until it is used.`,
        html: `<p>Someone asked to reset the password on Carissa's workout tracker.</p>`
          + `<p><a href="${link}">Set a new password</a></p>`
          + `<p>This link works for one hour. If this wasn't you, ignore this email — nothing changes until it is used.</p>`,
      });
    } catch (err) {
      console.warn("account: reset email failed,", err && err.message);
    }
    return reply;
  }

  /* ---- using the link from that email ---- */
  if (intent === "reset") {
    const password = String(body.password ?? "");
    if (password.length < 8) return json({ ok: false, error: "Use a password of at least 8 characters." }, 400);
    const user = await consumeResetToken(String(body.token ?? ""), password);
    if (!user) return json({ ok: false, error: "That reset link is no good any more — ask for a new one." }, 400);
    return signedInAs(user);
  }

  return json({ ok: false, error: "Not something this can do." }, 400);
};
