/**
 * GET /api/emailoctopus?key=ADMIN_PASSWORD
 *
 * The "is it switched on?" check, and the way to find the list ID during
 * setup without hunting through the EmailOctopus UI. Open it in a browser.
 *
 * It answers three questions in order, because that is the order they fail in:
 *   1. Are the environment variables set?
 *   2. Does the API key actually work?
 *   3. Is EMAILOCTOPUS_LIST_ID one of the lists on this account?
 *
 * It lists every list with its ID, which is what makes it useful before the
 * list ID is set — paste the one you want into Netlify and reload.
 *
 * WHY IT IS GATED, GIVEN LIST IDs ARE NOT SECRET
 * A list ID appears in the public embed code of any EmailOctopus form, so it
 * is not a credential. Subscriber counts and the names of lists you have not
 * launched yet are still nobody else's business, and an ungated endpoint that
 * proves an EmailOctopus account exists here is free reconnaissance. It costs
 * one line to gate, so it is gated.
 *
 * It FAILS CLOSED: with no ADMIN_PASSWORD set in Netlify, nobody gets in,
 * including you. That is deliberate — the alternative is a window where a
 * half-finished deploy is wide open.
 *
 * The key travels as a query string, which means it lands in browser history.
 * That is a considered trade: the person who needs this does not use a
 * terminal, and the password guards a read-only status page, not the account.
 * Do not reuse ADMIN_PASSWORD anywhere that matters.
 */
import { configured, getLists, listId, describe } from "./_lib/emailoctopus.mjs";

const json = (obj, status = 200) =>
  Response.json(obj, { status, headers: { "Cache-Control": "no-store" } });

/** Constant time, so the endpoint cannot be used to guess the password. */
function secretOk(given) {
  const want = process.env.ADMIN_PASSWORD || "";
  if (!want) return false;
  const a = new TextEncoder().encode(String(given || ""));
  const b = new TextEncoder().encode(want);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export default async (req) => {
  const url = new URL(req.url);
  const given = url.searchParams.get("key") || req.headers.get("x-admin-password");

  if (!process.env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD is not set in Netlify, so this page stays shut." }, 503);
  }
  if (!secretOk(given)) return json({ error: "Wrong key." }, 401);

  const cfg = configured();
  const out = {
    ready: false,
    apiKeySet: !!process.env.EMAILOCTOPUS_API_KEY,
    listIdSet: !!listId(),
    missing: cfg.missing,
    next: null,
  };

  if (!out.apiKeySet) {
    out.next = "Add EMAILOCTOPUS_API_KEY in Netlify → Site configuration → Environment variables, then redeploy.";
    return json(out);
  }

  let res;
  try {
    res = await getLists();
  } catch (err) {
    out.next = "Could not reach EmailOctopus: " + String(err?.message || err);
    return json(out, 502);
  }

  if (!res.ok) {
    out.next =
      res.status === 401 || res.status === 403
        ? "EmailOctopus rejected the API key. Generate a fresh one and replace EMAILOCTOPUS_API_KEY."
        : "EmailOctopus said: " + describe(res);
    return json(out, 502);
  }

  const lists = (res.payload?.data || []).map((l) => ({
    id: l.id,
    name: l.name,
    subscribed: l.counts?.subscribed ?? null,
    thisIsTheOneInUse: l.id === listId(),
  }));
  out.lists = lists;

  if (!out.listIdSet) {
    out.next =
      lists.length
        ? `Copy the id of the list you want and set EMAILOCTOPUS_LIST_ID to it in Netlify, then redeploy.`
        : "This account has no lists yet. Create one in EmailOctopus first.";
    return json(out);
  }

  if (!lists.some((l) => l.thisIsTheOneInUse)) {
    out.next = `EMAILOCTOPUS_LIST_ID is set to "${listId()}", which is not a list on this account. Check it against the ids above.`;
    return json(out);
  }

  out.ready = true;
  out.next = "Wired up. Submit a signup form on the site and the address should appear on the list within a few seconds.";
  return json(out);
};
