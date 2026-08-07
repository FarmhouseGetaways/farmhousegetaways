/**
 * Netlify calls this by itself, once, for every form submission it has
 * verified as not-spam. Nothing on the site points at it and nothing needs to.
 *
 * WHY THIS AND NOT AN EMBED, OR FETCH() IN THE PAGE
 * EmailOctopus gives you a hosted form to paste in. Pasting it would have
 * meant its markup and its stylesheet inside a site with one hand-written CSS
 * file, ten forms to replace across seven pages, and the Netlify inbox — which
 * the app's admin screen reads — quietly going empty.
 *
 * Doing it as a JS fetch() from the page instead would have put the API key in
 * front of every visitor, or needed this function anyway.
 *
 * So: the forms are untouched. They still post to Netlify, submissions still
 * land in the inbox the admin screen reads, the pages still work with
 * JavaScript switched off, and this runs afterwards on Netlify's side.
 *
 * WHAT A FAILURE HERE COSTS
 * Nothing the visitor can see — they are already looking at the thanks page,
 * and the submission is already saved. A failed sync means one address missing
 * from EmailOctopus and a line in the function log, which is the right way
 * round. It must never throw hard enough to make Netlify retry and double-send.
 */
import { configured, upsertContact, queueAutomation, describe } from "./_lib/emailoctopus.mjs";
import { contactFrom } from "./_lib/signup.mjs";

export default async (req) => {
  let payload;
  try {
    const body = await req.json();
    // Netlify wraps the submission in `payload`. Accepting the bare object too
    // means a local `netlify functions:invoke` with a hand-written body — the
    // only practical way to test this without submitting a real form — behaves
    // the same as production instead of silently reading undefined.
    payload = body?.payload ?? body;
  } catch (err) {
    console.error("[emailoctopus] unreadable event body:", String(err?.message || err));
    return new Response("bad request", { status: 400 });
  }

  const formName = payload?.form_name || payload?.formName || "";
  const data = payload?.data || {};

  const contact = contactFrom(formName, data);
  if (!contact) {
    // The common, correct, boring case: an inquiry with the box left unticked,
    // or a form that was never meant to feed the list.
    console.log(`[emailoctopus] no sync for form "${formName}"`);
    return new Response("ignored", { status: 200 });
  }

  const cfg = configured();
  if (!cfg.ok) {
    // Loud, because this is the state the site sits in between deploying this
    // code and pasting the keys into Netlify — and a signup lost in that window
    // is lost for good. The address is printed so it can be added by hand.
    console.error(
      `[emailoctopus] NOT CONFIGURED (${cfg.missing.join(", ")}) — ` +
      `signup from ${contact.email} was saved to the Netlify inbox but NOT added to the list`
    );
    return new Response("not configured", { status: 200 });
  }

  try {
    const res = await upsertContact(contact);
    if (!res.ok) {
      console.error(`[emailoctopus] failed for ${contact.email}: ${describe(res)}`);
      return new Response("ok", { status: 200 });
    }

    const note = res.degraded ? ` (tags dropped: ${res.degraded})` : "";
    console.log(`[emailoctopus] subscribed ${contact.email} [${contact.tags.join(", ")}]${note}`);

    // The auto-responder that carries the map. Only if this site names an
    // automation; otherwise EmailOctopus's own "joined the list" trigger owns
    // it. Kept separate from the upsert so a broken automation id costs the
    // welcome email and not the subscription — the address is already safely
    // on the list by this point, and that is the part that cannot be redone.
    const auto = await queueAutomation(contact.email, process.env.EMAILOCTOPUS_AUTOMATION_ID);
    if (auto.skipped) {
      // Nothing to say — the list-join trigger is handling it.
    } else if (auto.alreadyQueued) {
      console.log(`[emailoctopus] ${contact.email} was already in the automation`);
    } else if (!auto.ok) {
      console.error(`[emailoctopus] automation did not start for ${contact.email}: ${describe(auto)}`);
    } else {
      console.log(`[emailoctopus] automation started for ${contact.email}`);
    }
  } catch (err) {
    console.error(`[emailoctopus] threw for ${contact.email}: ${String(err?.message || err)}`);
  }

  // Always 200. The submission is safely in the inbox either way, and a
  // non-2xx here buys a retry that would re-send an email we already sent.
  return new Response("ok", { status: 200 });
};
