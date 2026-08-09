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

## Who the site is for — read before writing any copy

**The majority of guests are large families and large groups.** What they are
shopping for, in this order:

1. A place that sleeps everyone under one roof
2. Plenty for people to do — the game barn, the pool, the animals, the trails
3. Safety, especially with children around — the fenced pool matters to them

Lead with those. That is the sale.

**The natural-living angle is not the sale.** Some guests already live this way
and love finding it, and those bookings are a delight — but they are the
minority. Most guests are not thinking about chemicals at all, and copy that
pitches at them reads as though the house is only for people already converted.

What the owners actually want is the opposite of a pitch: guests who have never
lived this way arrive, use the shampoo, conditioner, soap and laundry soap that
are already in the house, have a good week, and go home thinking it might be
possible for them too. **The conversion happens during the stay, not on the
website.** The site's job is to get the family through the door.

So state the natural-living details plainly and let them be found — a detail
board row, a line on Our Story — and never lead with them. If a mention starts
to argue rather than inform, it is too much. Nine mentions across five pages was
too much; it was cut to five on 8 Aug 2026 for exactly this reason.

## Who books, and what "cutting edge" means here

**The person booking is usually a mother or a grandmother** organising a trip
for the whole family. Not a group of twenty-somethings looking for somewhere
cool to party. She is trying to find a place where everyone fits, where there is
plenty for people to do, where the children are safe, and where she can be
confident the group will be well looked after. Write for her.

**"Cutting edge" describes the build, not the tone.** The owners want the site
itself to look and behave like a high-end product — polished design, fast,
beautifully laid out, obviously well made. That request was once read as
permission for a cool, edgy voice, which is how the tone drifted. It is not.
**High-end design, warm voice.** The two are not in tension.

The properties themselves are a deliberate blend of high technology and nature,
and Cory put real work into the technical side. It is a point of pride and worth
showing — but through the quality of the design and through plainly naming the
features, never through swagger in the copy.

## The voice — Carissa's, not Cory's

Some of the earlier copy was written in Cory's register: wry, punchy, a little
competitive, pleased with itself. **That is not the brand's voice.** Carissa is,
and hers is warmer.

Write like this:

- **Warm and welcoming above everything.** The business is hospitality. Copy
  should sound like someone glad you are coming, not someone proving a point.
- **Never at anyone else's expense.** Do not sell this stay by running down
  other rentals, other hosts, or the way other people live. The old Our Story
  opening said a coded entry was "a terrible way to spend a weekend on a farm";
  that is the exact move to avoid.
- **Not sassy, not trying to be cool.** The properties are genuinely lovely and
  do not need attitude to carry them. If a line is reaching for a laugh or a
  mic drop, cut it.
- **Offer, do not boast.** "We are the people who will do X, Y and Z" is a list
  of feats. "Whatever your family wants from the week, we are glad to be here
  for it" is hospitality. Prefer the second.
- **Let the guest choose.** Some groups want everything shown to them, some want
  the place to themselves for a week. Both are welcome and copy should say so
  rather than assume the sociable one.

**Safety features go on the site. Safety obligations go in the contract.**
Decided 8 Aug 2026. A gated pool, a house with no stairs, pack-n-plays ready on
arrival — those are reasons to book, and they answer the worry before the guest
has to raise it. Supervision requirements, what is off limits, who is
responsible for what: those go in the house rules and the contract the guest
signs, not on a property page. Rules on a web page bind nobody and cost
bookings, so they are the worst of both.

The exception is a **material fact that affects whether the trip works at all**
— Mountain Retreat's spa sitting under a locked cover rather than behind a gate,
for instance. That is not a rule, it is something a family travelling with
toddlers must know before booking, and it stays on the page.

**Do not promise what the stay does not include.** Farm visits, the gold-mining
sluice and similar are paid add-ons arranged in advance, not things that happen
because a host is standing nearby. Free and spontaneous — gathering eggs,
walking the garden, picking what is ripe — can be offered warmly. Anything
billable belongs in the "Also available" section on `red-barn-ranch.html`, which
already exists and already says plainly that some of it costs extra.

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

## Numbers, and where they have to agree

The same figure appears on a property page, on the homepage comparison board,
in a meta description and sometimes in the JSON-LD. When one changes, grep for
it and change all of them, or the pages start contradicting each other.

Current as of 9 Aug 2026:

- **Red Barn Ranch: 6 bedrooms, 3.5 bathrooms, sleeps 18, 4 acres.**
- **Mountain Retreat: 4 bedrooms, 3 bathrooms, sleeps 14, 8 acres.**
- **32 across both properties.**

**The bathroom count moves with the tiny home.** The house itself has 3.5. The
Industrial Mini Mansion's full bathroom is the fourth, so the figure is 4.5 only
while the tiny home counts as part of the property. It is 3.5 today because the
site now sells six bedrooms — see below. Earlier drafts said 5.5, which was the
same mistake in the other direction: someone read "the tiny home has its own
full bathroom" and added it on top of a total that already contained it.

### Why it is six bedrooms and not seven

The Industrial Mini Mansion — the tiny home, seventh bedroom — has a compliance
problem and will probably move off the property before the end of 2026. The
owners will always have room for the extra guests, via the loft or a trailer,
but they cannot promise that particular room.

So on 9 Aug 2026 the site was changed to **promise the capacity, not the room**.
Six bedrooms and eighteen beds is true today and stays true whatever happens, so
no booking taken now can be broken by the outcome. Anyone needing more is
invited to ask, on the `red-barn-ranch.html` sleeping board and in the prose
beneath it.

**Do not put the seventh bedroom back** on the strength of a photograph or an
old draft. It goes back only when the owner says the compliance question is
settled — and then sleeps 18 becomes 20, 32 becomes 34, and six bedrooms becomes
seven, everywhere.

That change touched 38 references across seven pages: copy, both meta
descriptions, the JSON-LD `numberOfRooms` and `occupancy`, the doubled ticker
lists, the detail and comparison boards, two form `max` attributes, the enquiry
dropdowns, and `emails/welcome-farmhousegetaways.html`. It is a single commit,
`f3f1d0c`, so it can be reverted in one command if the answer comes back happy.

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
| **EmailOctopus** | `netlify/functions/submission-created.mjs` — see `EMAIL.md` | Code shipped, **setup unfinished** |

The two form types are `group-inquiry` (lands on `/thanks.html`) and `newsletter`
(lands on `/thanks-list.html`). Submissions appear under **Forms** in the Netlify
dashboard. Email notifications are configured there, not in the code.

### EmailOctopus — code shipped, setup not finished

Corrected 8 Aug 2026. An earlier version of this file said EmailOctopus was not
connected. The code now exists — see `EMAIL.md` and the section above — but the
integration is **not live yet**, and the owner is picking up the remaining setup
by hand later.

Still outstanding, as of 8 Aug 2026:

- The Netlify environment variables are not all set: `EMAILOCTOPUS_API_KEY`,
  `EMAILOCTOPUS_LIST_ID`, `EMAILOCTOPUS_BRAND`, `EMAILOCTOPUS_AUTOMATION_ID`.
  Without them the function has nothing to talk to.
- The three welcome emails in `emails/` still have to be built by hand as
  EmailOctopus automations. The API can start an automation but cannot create
  one.

**Do not assume signups are reaching the list**, and do not tell the owner they
are, until those are done and a real submission has been seen arriving. Until
then a newsletter signup lands in Netlify Forms and stops there.

**Do not rebuild any of this.** It belongs to a separate effort. Your job is
**maintenance once it is live**: if it breaks, if signups stop arriving, if a key
expires, that is yours to diagnose and fix.

Existing subscribers live in **Wix** and need exporting separately. That is a
known future task, not part of wiring up the forms.

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
