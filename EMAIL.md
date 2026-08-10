# The email list

One EmailOctopus list for all three brands. Every signup gets tagged with which
brand and which form it came from, so a send can go to one brand or to
everybody.

## Why one list and not three

EmailOctopus charges per contact **per list**. Someone who wants the farmstand
map is very often the same person who would book the barn, and on three lists
they would be paid for three times. On one list they are one contact with two
tags, and "send to just Mini Barn Market" is a filter in the dropdown.

## The quick way — from a browser, no terminal

1. EmailOctopus → account menu → **Integrations & API** → **API keys** → create
   one. Copy it; it is shown once.
2. Netlify → this site → Site configuration → Environment variables. Add
   `EMAILOCTOPUS_API_KEY`, and `ADMIN_PASSWORD` (anything long).
3. **Deploys → Trigger deploy.** Variables only reach the site on a new deploy.
4. Open this, with your admin password in place of `YOUR_PASSWORD`:

       https://farmhousegetaways.netlify.app/api/emailoctopus?key=YOUR_PASSWORD

   It lists every list on the account with its id. Copy the one you want into
   `EMAILOCTOPUS_LIST_ID` in Netlify and trigger another deploy.
5. Now prove it actually works:

       https://farmhousegetaways.netlify.app/api/emailoctopus?key=YOUR_PASSWORD&selftest=1

   That adds a test contact with all three brand tags, reads it back to check
   the tags really stuck, and deletes it again. When it says `"ready": true`
   the plumbing is verified end to end.

The read-back in step 5 is the only check that means anything. Everything else
is covered by unit tests against a stubbed API, which prove the code sends the
right request but not that EmailOctopus does the right thing with it — and the
wrong tag format is accepted with a `200` and silently applies nothing.

Then build [the automations](#the-welcome-email--see-emails). Nothing can do
that part for you; see below for why.

## The same thing from a terminal

If you would rather, one command does steps 1–5 at once:

    node tools/eo-provision.mjs

Paste the key when it asks (that keeps it out of your shell history). It finds
or creates the list, prints the exact environment variables to paste into
Netlify, and then proves the whole thing works by adding a test contact with
all three brand tags, reading it back to check the tags actually stuck, and
deleting it again.

That last part is the only check that means anything. Everything else here is
covered by unit tests against a stubbed API, which prove the code sends the
right request but not that EmailOctopus does the right thing with it — and the
wrong tag format is accepted with a `200` and silently applies nothing. Reading
the contact back is the only way to catch it.

It cannot create the automations. Nothing can; see below.

Then paste the variables into Netlify, trigger a deploy, and do
[the automations](#the-welcome-email--see-emails).

The rest of this file is the same thing done by hand, and the detail behind it.

## What you have to do, once, in a browser

Nothing in this list goes in a file or a commit. Same rule as the app.

### 1. Make the list

EmailOctopus → **Lists** → new list. Call it something like
`Farmhouse — all brands`. One list. That is it.

### 2. Get an API key

EmailOctopus → your account menu → **Integrations & API** → **API keys** →
create one. Copy it. It is shown once.

### 3. Paste both into Netlify

Netlify → the **farmhousegetaways** site → Site configuration → Environment
variables:

    EMAILOCTOPUS_API_KEY   = the key from step 2
    EMAILOCTOPUS_LIST_ID   = the list's id  (see below)
    ADMIN_PASSWORD         = something long. Guards the status page, and also
                             the Publish button in /edit.html

Then **Deploys → Trigger deploy**. Environment variables only reach the site on
the next deploy, so nothing works until you do this.

### 4. Find the list ID without hunting for it

Open:

    https://farmhousegetaways.netlify.app/api/emailoctopus?key=YOUR_ADMIN_PASSWORD

It prints every list on the account with its id, and tells you what is still
missing. Copy the id you want into `EMAILOCTOPUS_LIST_ID`, redeploy, reload the
page. When it says `"ready": true` it is done.

(The list id is also the last part of the URL when you open the list in
EmailOctopus, if you would rather read it there.)

### 5. Check it for real

Submit the footer signup on the live site. The address should be on the list
within a few seconds, tagged `farmhousegetaways` and `source-footer-home`.

## How it actually works

    someone submits a form
      -> Netlify saves it (unchanged — the app's admin inbox still sees it)
      -> Netlify checks it for spam
      -> Netlify calls netlify/functions/submission-created.mjs
      -> that adds them to EmailOctopus with tags

**The forms on the site were not touched.** No EmailOctopus embed, no
JavaScript in the page, no API key in front of visitors, and the pages still
work with JavaScript off. If EmailOctopus is down or misconfigured, the
submission is still saved in Netlify — you would just have to add that one
address by hand. Failures are in Netlify → Functions → `submission-created`,
every line prefixed `[emailoctopus]`.

## The tags you get

| Tag | Meaning |
|---|---|
| `farmhousegetaways` | Which brand. Set per site by `EMAILOCTOPUS_BRAND`. The three are `farmhousegetaways`, `minibarnmarket`, `farmstandtv`. |
| `source-footer-home`, `source-farmstand-map-page`, … | Which form on which page. Ten of them. This is how you find out which band actually earns signups. |
| `red-barn-ranch` / `mountain-retreat` | Which property they picked. "Both / not sure" adds nothing, on purpose. |
| `group-inquiry`, `lead` | A wedding or group inquiry who ticked the opt-in box. |

## Consent — do not shortcut this

The signup forms **are** a subscription: the button says send me the map and the
fine print promises one or two emails a month.

The wedding and group **inquiry** forms are not. They now carry an opt-in
checkbox that ships unticked, and an inquiry only reaches the list if it was
actually ticked. Someone asking whether September is free has not asked to be
marketed to, and adding them anyway earns spam complaints against the sending
domain — which is shared by all three brands on the one account.

`netlify/functions/_lib/signup.test.mjs` locks that rule down. Run it before
changing anything in there:

    node --test netlify/functions/_lib/*.test.mjs

No npm, no install — that is plain Node, same as the rest of this repo.

## The welcome email — see `emails/`

Three of them, one per brand, each delivering the map. They live in `emails/`
as plain HTML with a full setup guide in `emails/README.md`.

**They have to be built once, by hand, in EmailOctopus.** Not laziness — the
API can add contacts, tag them and *start* an automation, but it cannot create
one, and campaigns are read-only over the API. Roughly five minutes each, then
they run themselves forever.

The one thing to get right: put a **tag condition on the trigger**. One list
serves three brands, so an automation triggered on plain "joined the list"
sends the Farmhouse welcome to Mini Barn Market signups.

If tag conditions are awkward on your plan, set `EMAILOCTOPUS_AUTOMATION_ID` in
that site's Netlify variables instead and the code will start the right
automation itself. Use one route or the other, never both, or the welcome sends
twice.

## Single opt-in

New contacts are added as `subscribed`, not `pending`. They typed the address
and pressed a button asking for the map, so the welcome email can carry the map
instead of a confirmation link a third of them would never click.

To switch to double opt-in, change `status` in `_lib/signup.mjs` to `"pending"`.
EmailOctopus then sends the confirmation itself.

## Reusing this on the other two brands

`netlify/functions/` is deliberately brand-agnostic. Copy the folder to the
Mini Barn Market or Farmstand.TV site, set that site's own env vars, and set:

    EMAILOCTOPUS_BRAND = minibarnmarket        (or farmstandtv)

Same API key, same list id, different brand tag. No code change.
