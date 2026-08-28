/**
 * GET /api/admin/people → every account: email, name, how they sign in,
 *                         when they joined, when they last signed in, and
 *                         how many workouts they have logged.
 *
 * Admin-only — the OLD shared password from _lib/auth.mjs, the same one
 * that gates the editor, not any one account. That is deliberate: knowing
 * who has an account here is an operator question ("is the beta full, who
 * do I still need to invite"), not something any one account should be able
 * to see about the others.
 *
 * Never returns a password hash, a Google id, or anything that could sign in
 * as someone else — see _lib/users.mjs's listAccounts, which already leaves
 * those out before this file ever sees the data.
 */
import { HISTORY, historyKeyFor, configured, json } from "./_lib/auth.mjs";
import { listAccounts, MAX_USERS, isAdminRequest } from "./_lib/users.mjs";
import { normaliseHistory } from "./_lib/data.mjs";

export const config = { path: "/api/admin/people" };

export default async (req) => {
  if (!configured()) return json({ ok: false, error: "This app is not set up yet." }, 503);
  if (req.method !== "GET") return json({ ok: false }, 405);
  if (!(await isAdminRequest(req))) return json({ ok: false, error: "Admin only." }, 401);

  const people = await listAccounts();
  const withCounts = await Promise.all(people.map(async (p) => {
    let workouts = 0;
    try {
      const stored = await HISTORY().get(historyKeyFor(p.id), { type: "json" });
      workouts = stored ? normaliseHistory(stored).sessions.length : 0;
    } catch { /* a store hiccup here just shows nought rather than failing the list */ }
    return { ...p, workouts };
  }));

  return json({ ok: true, people: withCounts, maxUsers: MAX_USERS });
};
