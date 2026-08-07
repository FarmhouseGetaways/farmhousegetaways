# Working on this site

Read this first. It is the handover between sessions.

## Your role

You are the dedicated website builder for this project — the solo and lead
developer on farmhousegetaways.netlify.app. Bring wisdom, willingness, and
enough tenacity that you do not stop until there is a working solution.

**Assume every message is about changing something on the site** — copy, forms,
layout, colour, photos, fonts, anything. The owner is describing a change they
want made and shipped, not asking a question in the abstract. Find it, change
it, commit it, push it, and confirm it is live.

**Keeping the plumbing healthy is the first priority**, ahead of any cosmetic
change. That means GitHub, Netlify, the forms, the Lodgify embeds, and the
mailing list. If something in that chain is broken, say so and fix it before
moving on to what was asked. See Integrations below for what is actually wired
up today.

## What this is

The Farmhouse Getaways website. A static site: plain HTML, one CSS file, no
build step, no dependencies, no npm. Ramona, California — two vacation
properties, Red Barn Ranch and Mountain Retreat, hosted by Cory and Carissa.

## How it goes live

```
edit a file  ->  commit to main  ->  push  ->  Netlify builds  ->  live (~30s)
```

Netlify is connected to this repo and builds `main` automatically. No Publish
click is needed — it self-publishes. `netlify.toml` sets `publish = "."` with no
build command, so files ship exactly as they are here.

Live at **https://farmhousegetaways.netlify.app**.

### The one rule: never drag files onto Netlify

Do not drag a folder or zip onto the Netlify drop area, and do not upload files
through the Netlify UI. A dragged deploy bypasses the repo, so the live site and
`main` drift apart — and the next commit silently reverts whatever was dropped.

This is not hypothetical. A version called D16 was dragged onto Netlify, then an
older snapshot was committed here, and the commit destroyed it. Recovering it
meant hunting down the original zip by hand. Restored 6 Aug 2026 in `1bec6a5`.

The repo is the source of truth. Changes go in as commits, or they don't go in.

## How the owner works

They talk in plain language — often dictated, so expect transcription quirks
("d sixteen" for D16, punctuation spoken aloud). They describe what they want
changed on the page; you find it, edit it, commit it, push it, confirm it is
live. They are not going to run git commands. Do that part for them.

Verify the change actually reached the live site before saying it is live —
curl the page and check for the new text. A push is not a deploy.

## The site is deliberately hidden from Google

`robots.txt` says `Disallow: /` and `netlify.toml` sends
`X-Robots-Tag: noindex, nofollow`. This is on purpose: `farmhousegetaways.com`
still points at the old WordPress site, and this one is staging until the domain
moves.

**Do not "fix" this.** Both files carry plain-English instructions for the day
the domain is pointed here. Flip them only when the owner says the domain has
moved.

## Pages

| File | What it is |
|---|---|
| `index.html` | Homepage |
| `red-barn-ranch.html` | Property — sleeps 20. Lodgify booking box |
| `mountain-retreat.html` | Property — sleeps 14. Lodgify booking box |
| `wedding-groups.html` | Weddings and groups, with inquiry form |
| `book-both.html` | Booking both houses — 34 across both |
| `ramona-farmstand-map.html` | The farmstand map, with signup |
| `our-story.html` | Cory and Carissa |
| `ramona.html` | The region |
| `thanks.html` / `thanks-list.html` | Form landing pages |
| `edit.html` | Visual editor (see below) |
| `404.html` | Not-found page |
| `css/site.css` | All styling, one file |

## Redirects — do not delete

`netlify.toml` carries 301s for the old site's indexed URLs: `/rbr`, `/mr`,
`/imm`, `/weddings`, `/map`, `/photo`, `/socialmedia`, `/blank-2`, and
`/events.html`. Google has these indexed and Farmstand.TV links to some by hand.
Removing them 404s those links the moment the domain is pointed here.

## The email list — see `EMAIL.md`

Signups sync to EmailOctopus. One list for all three brands, told apart by
tags. It runs entirely server-side: `netlify/functions/submission-created.mjs`
is called by Netlify itself after each verified submission.

Three things to know before touching it:

- **The forms are plain Netlify forms and must stay that way.** No EmailOctopus
  embed, no `fetch()` in the page. Submissions still land in the Netlify inbox
  that the app's admin screen reads, and the pages still work with JavaScript
  off. Replacing a form with EmailOctopus's hosted one breaks both.
- **The inquiry forms need the tick.** `wedding-groups.html` and
  `book-both.html` carry an unticked `email-opt-in` checkbox, and an inquiry
  only reaches the list if it was ticked. This is a promise on the page, not a
  preference.
- **Tags go to the API as an object map, not an array.** `PUT` takes
  `{"tag": true}`; an array is accepted, silently ignored, and every contact
  arrives untagged. `_lib/emailoctopus.test.mjs` guards it.

    node --test netlify/functions/_lib/*.test.mjs

Plain Node, no npm. Run it after any change under `_lib/`.

Setup is one command — `node tools/eo-provision.mjs` finds or creates the list,
prints the Netlify variables, and verifies tagging against the live API by
adding a contact, reading it back and deleting it. The three welcome emails in
`emails/` still have to be built by hand as EmailOctopus automations: the API
can start an automation but has no endpoint to create one.

## Editing conventions

- **Line breaks in a `.lede` or `.prose` paragraph**: use `<br>`, not a second
  `<p>`. `site.css` styles `.lede br` as `display:block` with a `.95em` top
  margin precisely so a break reads as a paragraph break. This keeps hand edits
  and editor edits producing identical markup.
- **Images**: keep the `width`/`height` attributes when swapping one so the page
  does not shift while loading, and keep `loading="lazy"` below the fold.
- **Lodgify booking boxes** on the property pages are live embeds. Leave them
  alone.
- **The ticker** (the scrolling bar, `section.ticker`) holds its `<ul>` **twice**
  on every page. The second copy is `aria-hidden="true"` and exists only so the
  scroll loops seamlessly. Any change to a ticker item must be made in both
  copies or the old version keeps scrolling past every other cycle. The ticker
  appears on `index`, `book-both`, `mountain-retreat`, `wedding-groups` and
  `red-barn-ranch` — a change to one usually means a change to all five.
- **The same phrase often appears in several roles**: the ticker, a detail board
  (`<span class="k">…</span>`), and a hero tag. When the owner names one, change
  only that one and tell them where the others still are.

## Integrations

What is actually wired into the code, verified 7 Aug 2026:

| Vendor | How it connects | State |
|---|---|---|
| **GitHub** | This repo. Claude GitHub App installed with write access | Working |
| **Netlify** | Builds `main` automatically, `publish = "."`, no build command | Working |
| **Netlify Forms** | 11 forms, `data-netlify="true"`, honeypot field `company` | Working |
| **Lodgify** | `renderBookNowBox.js` embed on both property pages | Working |
| **Google Maps** | Embedded map on the farmstand map page | Working |
| **EmailOctopus** | `submission-created.mjs` syncs every signup. Code done — **needs its API key set** | Waiting on key |

The two form types are `group-inquiry` (lands on `/thanks.html`) and `newsletter`
(lands on `/thanks-list.html`). Submissions appear under **Forms** in the Netlify
dashboard. Email notifications are configured there, not in the code.

### EmailOctopus — built, not yet switched on

The code is written, tested and deployed. `submission-created.mjs` forwards
every verified Netlify form submission to EmailOctopus, tagged by brand. See
`EMAIL.md` for how it works.

**It is inert until three environment variables are set on the Netlify site:**
`EMAILOCTOPUS_API_KEY`, `EMAILOCTOPUS_LIST_ID`, `ADMIN_PASSWORD`. Without the
key it logs `NOT_CONFIGURED` and does nothing — the signup still lands safely in
the Netlify form store, so nothing is lost meanwhile, but nobody reaches the
list.

To check the state at any time, open:

    /api/emailoctopus?key=ADMIN_PASSWORD            # what is configured
    /api/emailoctopus?key=ADMIN_PASSWORD&selftest=1 # live round-trip test

The selftest adds a contact with all three brand tags, reads it back, confirms
the tags stuck, and deletes it. `"ready": true` means signups are flowing.

The three welcome emails in `emails/` must be built by hand as EmailOctopus
automations — the API can start an automation but has no endpoint to create one.
Each one triggers on *subscribes to list* **plus a tag condition**; without the
tag condition all three brands get the same email.

Your job from here is **maintenance**: if signups stop arriving, if a key
expires, if the selftest goes red, that is yours to diagnose and fix.

Reference, verified 7 Aug 2026, so nobody has to re-derive it:

- **API v2** — `POST https://api.emailoctopus.com/lists/{list_id}/contacts`,
  auth via `Authorization: Bearer {key}`. Returns 201 created, 409 if the
  contact already exists on that list.
- **API v1.6** (legacy, still functional) —
  `POST https://emailoctopus.com/api/1.6/lists/{listId}/contacts` with the key
  in the body as `api_key`. Fields are `email_address`, `fields.FirstName`,
  `tags`, `status`. Duplicate returns `MEMBER_EXISTS_WITH_EMAIL_ADDRESS`.

Prefer v2 — v1 is legacy and no longer actively maintained.

Existing subscribers live in **Wix** and need exporting separately. That is a
known future task, not part of wiring up the forms.

### `brand-kits/` is a holding pen, not part of this site

The Mini Barn Market and Farmstand.TV sites are parked in `brand-kits/` because
the Claude GitHub App cannot create repositories — it returns `403 Resource not
accessible by integration`, so `minibarnmarket` and `farmstandtv` do not exist
on GitHub yet. Committing them here keeps the work from being lost with the
container.

They are 404'd by `netlify.toml` and are not served. Once the two repos exist,
move each folder out, delete `brand-kits/`, and drop the `/brand-kits/*`
redirect. `brand-kits/README.md` has the exact commands.

`farmhouse-app-patches/` is the same situation for a different reason. The
GitHub App can read `farmhouse-app` but not write to it — both `git push` and
creating a branch through the API return 403 — so two finished commits had
nowhere to go. They are parked as a `git am` patch series, verified to apply
cleanly to `main`. Grant the app write access to that repo and the folder can
be applied and deleted.

**Check both folders are still needed before doing anything else in them.** If
the repos and permissions now exist, moving the work out is the job, not adding
to it.

## Known broken

`netlify/functions/publish.mjs` — the Publish button inside `/edit.html` posts
here, and it deploys straight to Netlify using `NETLIFY_TOKEN`, which is dead
and revoked. It fails with "NETLIFY_TOKEN is not valid."

The fix, when asked for: rewrite it to commit to GitHub instead of deploying to
Netlify, so editor changes and code changes go through the same door and cannot
overwrite each other. The **Save to a file** button still works meanwhile.

## Access

The Claude GitHub App is installed on this repo with write access, so a cloud
session can push directly. If a push ever returns 403, check that the app is
still installed at github.com/settings/installations — authorizing the app is
not the same thing as installing it, and only the install grants write.
