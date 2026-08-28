# Working on these sites

Read this first. It is the handover between sessions.

## Your role

You are the dedicated website builder for **all four properties below** — the
solo and lead developer on every one of them. Bring wisdom, willingness, and
enough tenacity that you do not stop until there is a working solution.

**Assume every message is about changing something on one of the sites** —
copy, forms, layout, colour, photos, fonts, anything. The owner is describing a
change they want made and shipped, not asking a question in the abstract. Find
it, change it, commit it, push it, and **confirm it is live** by fetching the
live URL, not by trusting the deploy.

**Keeping the plumbing healthy is the first priority**, ahead of any cosmetic
change. GitHub, Netlify, the forms, the alerts, the Lodgify embeds, the mailing
list. If something in that chain is broken, say so and fix it before moving on
to what was asked.

**When the owner does not name a site, work out which one they mean** from what
they are describing, and say which one you changed. "The farmstand list" is
Farmstand.TV. "The barn" is Red Barn Ranch on Farmhouse Getaways. "The app" is
the installable one. **"MBM" always means Mini Barn Market** — said 22 Aug 2026,
and it is never anything else.

### `ADMIN_PASSWORD` is load-bearing across the estate. Never overwrite it.

One value, reused deliberately across the estate, and Netlify masks it, so it
cannot be read back once replaced.

**It was replaced on the Farmhouse Getaways site on 22 Aug 2026** by a browser
agent following instructions from this session that were wrong. The old value is
gone. Ask Cory for the current one; it is not written down in this repository
and must not be — `publish = "."` serves every file here, this one included.

The blast radius turned out to be narrower than this section used to claim, and
it is worth knowing exactly what it is. On **this website** `ADMIN_PASSWORD` is
read by two functions and nothing else: `publish.mjs`, behind `/edit.html`'s
Publish button, and `emailoctopus-status.mjs`, behind `/api/emailoctopus`. Both
still work — they simply want the new value.

What it does **not** touch, contrary to what this section said before:

- **The alert chain.** That authenticates with `ALERT_WEBHOOK_KEY`, a separate
  variable, added by farmhouse-app's "Give the websites their own alert key
  instead of the admin password". Changing one does not affect the other.
- **The app's admin screen and `sendToAdmins`.** Those read the app's own copy
  on the app's own Netlify site, which is a different variable instance.

So the honest rule is narrower and still worth keeping: **do not overwrite it
casually**, because it cannot be recovered and the Publish button stops
accepting the key the owner has memorised. But an overwrite is not the
estate-wide breakage this section used to warn about.

If some tool offers to overwrite `ADMIN_PASSWORD` to make a new thing work,
the new thing is asking for the wrong variable. **Carissa's workout tracker
does not use it** — it has its own `WORKOUT_PASSWORD` on its own site, and
reads no other password. Checked 22 Aug 2026, after an assistant driving the
Netlify UI offered to overwrite it.

## The four properties

| What | Repo | Live at | Built how |
|---|---|---|---|
| **Farmhouse Getaways** | `FarmhouseGetaways/farmhousegetaways` | farmhousegetaways.netlify.app — farmhousegetaways.com moving over soon | Hand-written HTML, one CSS file, no build step |
| **Mini Barn Market** | `FarmhouseGetaways/minibarnmarket` | minibarnmarket.com | Hand-written HTML, no build step |
| **Farmstand.TV** | `FarmhouseGetaways/farmstandtv` | farmstand.tv and farmstandtv.com (same site) | Hand-written HTML, no build step |
| **The app** | `FarmhouseGetaways/farmhouse-app` | farmhousegetawaysapp.netlify.app | **Generated — see below** |

All four are on the same Netlify team and the same GitHub account, all deploy
`main` automatically on push, all use `publish = "."`.

**Everything below in this file is about Farmhouse Getaways unless it says
otherwise.** The other three have their own README.md in their own repo, which
is where their specifics live — read it before working on one.

### The app is generated. Do not edit its output.

`tools/build.py` runs on every deploy and writes **all seven `.html` files,
`js/app.js`, `sw.js` and `manifest.webmanifest`**. Editing any of those
directly is thrown away by the next build, and the failure is confusing rather
than obvious: functions in the same commit deploy fine, so half the change
appears to work.

The sources are `tools/build.py`, `tools/admin.py` and `tools/install_page.py`.
This was got wrong twice on 20 Aug 2026 — once on the admin screen's enrol
button, once on a JavaScript handler. **Before editing any file in that repo,
check whether `build.py` writes it.**

The same rule caught Farmstand.TV's `data/stands.json`, which
`tools/kml-to-data.py` regenerates from Cory's Google My Map. If a script
produces a file, change the script.

## What Farmhouse Getaways is

A static site: plain HTML, one CSS file, no build step, no dependencies, no
npm. Ramona, California — two vacation properties, Red Barn Ranch and Mountain
Retreat, hosted by Cory and Carissa.

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
- **Say what you do, not what you are not.** A draft once read "we are not event
  coordinators and we will not pretend to be" — punchy, and it defined the
  business by a negative. What the owners actually offer is a house that is
  ready, people they trust after nine years here, and their own presence on the
  day to show vendors where to park and where things plug in. Say that instead.
  The correction usually is not a softer negative, it is the positive underneath.

**Safety features go on the site. Safety obligations go in the contract.**
Decided 8 Aug 2026. A gated pool, a house with no stairs, pack-n-plays ready on
arrival — those are reasons to book, and they answer the worry before the guest
has to raise it. Supervision requirements, what is off limits, who is
responsible for what: those go in the house rules and the contract the guest
signs, not on a property page. Rules on a web page bind nobody and cost
bookings, so they are the worst of both.

**Never write copy that makes unsupervised children sound fine.** The Mountain
Retreat page once said "eight acres is enough that children can be out of sight
and still be on the property", which was meant as a note about scale and read as
an invitation. There are granite boulders and uneven ground out there. Removed
9 Aug 2026. Sell the space, never the absence of an adult.

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

### Two sites watch this one repo, so a build is skipped when it is not owed

Added 23 Aug 2026, because every push was costing two builds. `carissa-workouts`
and `farmhousegetaways` are both pointed at `main` on this repository — the
workout tracker with its base directory set to `workout`, this site with the
root — so a commit to either one used to build **both**, and the bill was double
what the work was.

Both `netlify.toml` files now carry an `ignore` line in `[build]`:

| Site | `ignore` | Builds when |
|---|---|---|
| Farmhouse Getaways | `git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- . ':(exclude)workout'` | anything outside `workout/` changed |
| Carissa's workouts | `git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- .` | anything in `workout/` changed |

Three things to know before touching either line:

- **Exit 0 means skip.** `ignore` is a shell command, and the sense is
  inverted from what most people expect — a *successful* exit cancels the
  build. `git diff --quiet` exits 0 when nothing differs, which is exactly
  right, but it does read backwards.
- **Netlify runs it from the base directory.** For the workout site that is
  `workout/`, which is why its pathspec is a bare `.` and not `workout`.
  Copying this site's line into that file would compare the wrong thing.
- **It fails towards building.** An empty `$CACHED_COMMIT_REF` — a first
  build, a cleared cache, a manual deploy — makes `git diff` error, which is a
  non-zero exit, which builds. An extra build is the safe way to be wrong; a
  skipped one would leave a change stuck in the repo looking live. Do not wrap
  this in anything cleverer that could swallow that error.

Both lines were checked against real commit ranges from this repo's history
before shipping — workout-only, website-only, both, and an empty cached ref —
and all eight answers were right.

**A skipped build reads as a failure in the Netlify UI and is not one.** The
deploy list shows it greyed out, and the log says the build was cancelled
because the ignore command returned 0. That is the feature working.

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
| `workout/` | Carissa's workout tracker — a **separate site**, not a page here (see below) |
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
- **Every form stores its contact; the tick decides whether they can be
  mailed.** Changed 22 Aug 2026 — see below. `wedding-groups.html` and
  `book-both.html` carry an unticked `email-opt-in` checkbox, and that is a
  promise printed on the page, not a preference.
- **Tags go to the API as an object map, not an array.** `PUT` takes
  `{"tag": true}`; an array is accepted, silently ignored, and every contact
  arrives untagged. `_lib/emailoctopus.test.mjs` guards it.

### Stored is not the same as mailable

Until 22 Aug 2026 an unticked inquiry produced no contact at all, so the
address lived only in the Netlify inbox. The owner asked for one place holding
everyone who has ever written in, filterable by which form they came through.
So consent now decides the **status**, not whether the contact is kept:

| | status | effect |
|---|---|---|
| newsletter, or the box ticked | `subscribed` | on the list, will be mailed |
| anything else | `unsubscribed` | on the list, **never** mailed |

EmailOctopus excludes an unsubscribed contact from every campaign, and
`submission-created.mjs` skips the welcome automation for them outright, so
"we kept your details" cannot quietly become "we emailed you". Two tests hold
that line; do not relax them.

Tags on each contact: the brand, **`form-<name>`** — the thing to filter on —
the hidden `source` field, the property where one was chosen, and `lead` for a
booking inquiry only. A farm stand listing itself is not a booking lead.

**⚠ `PUT` is an upsert, so it can unsubscribe somebody.** Writing
`unsubscribed` over an address already on the list would silently and
permanently unsubscribe them — someone who asked for the map in March and used
the contact form in August is exactly that person. So `upsertContact` looks the
contact up first and an `unsubscribed` write never overrides an existing
status. Consent can raise a status; nothing lowers one. The bare retry after a
rejected tag carries the guarded status too, which is the same bug one layer
down. Six tests cover it.

`upsertContact` returns `statusWritten` — what actually went to the API, which
is not always what was asked for. Log that, not the request.

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
  alone. The section around each one carries `id="book"` on all three pages that
  have one, which is what every "Check dates" button points at. Both property
  pages pointed at `#main` — the top of the page — until 21 Aug 2026, so the
  button appeared to do nothing.
- **The masthead is sticky**, so any in-page jump would land with its heading
  tucked underneath it. `[id] { scroll-margin-top: 5.5rem }` in `site.css`
  handles this for every anchor at once. Do not solve it per-link.
- **The ticker** (the scrolling bar, `section.ticker`) holds its `<ul>` **twice**
  on every page. The second copy is `aria-hidden="true"` and exists only so the
  scroll loops seamlessly. Any change to a ticker item must be made in both
  copies or the old version keeps scrolling past every other cycle. The ticker
  appears on `index`, `book-both`, `mountain-retreat`, `wedding-groups` and
  `red-barn-ranch` — a change to one usually means a change to all five.
- **The same phrase often appears in several roles**: the ticker, a detail board
  (`<span class="k">…</span>`), and a hero tag. When the owner names one, change
  only that one and tell them where the others still are.
- **`css/site.css` is cached immutable for a year.** Every page links it as
  `site.css?v=XXXXXXXX`. Change the file and you **must** bump that string on all
  eleven pages or nobody sees the change:

      NEW=$(md5sum css/site.css | cut -c1-8); sed -i "s/site\.css?v=[a-z0-9]*/site.css?v=$NEW/g" *.html

### Checking the site on a phone

Chromium is already installed at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. It **cannot reach the live
site** — the agent proxy only relays CONNECT and Chromium gets
`ERR_CONNECTION_RESET`. Serve the repo instead, which is better anyway because
it tests the working copy before anything ships:

    python3 -m http.server 8099 --bind 127.0.0.1 &
    cd <scratchpad> && npm install playwright-core     # PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

Then drive it at 390×844 and compare `documentElement.scrollWidth` with
`clientWidth`. Anything wider than the viewport is a horizontal-overflow bug.

**This has bitten once, on 11 Aug 2026.** `.board-list .v` carried
`white-space: nowrap`, which was harmless while every value was "18" or "Yes".
The Sleeping board on `red-barn-ranch.html` put whole sentences in that slot,
and **a nowrap child inside a grid item forces its whole track to grow** — so
the board took the prose and the headline off the right-hand edge with it. Red
Barn Ranch measured 696px inside a 390px screen, Mountain Retreat 539px, and
`index.html` was quietly over by 45px too. Fixed by letting values wrap,
stacking label above value below 40rem, and adding `min-width: 0` to the grid
children as a general guard. Re-run the check after any layout change.

## Integrations

What is actually wired into the code, verified 7 Aug 2026:

| Vendor | How it connects | State |
|---|---|---|
| **GitHub** | This repo. Claude GitHub App installed with write access | Working |
| **Netlify** | Builds `main` automatically, `publish = "."`, no build command | Working |
| **Netlify Forms** | 11 forms, `data-netlify="true"`, honeypot field `bot-field` | Working |
| **Lodgify** | `renderBookNowBox.js` embed on both property pages | Working |
| **Google Maps** | Embedded map on the farmstand map page | Working |
| **EmailOctopus** | `netlify/functions/submission-created.mjs` — see `EMAIL.md` | **Storing here.** Not yet on the other two sites |

The two form types are `group-inquiry` (lands on `/thanks.html`) and `newsletter`
(lands on `/thanks-list.html`). Submissions appear under **Forms** in the Netlify
dashboard. Email notifications are configured there, not in the code.

### EmailOctopus — storing here, not yet on the other two

Checked live 22 Aug 2026 against each site's `/.netlify/functions/alerts-status`,
which now reports this so it never has to be guessed again:

| Site | `EMAILOCTOPUS_API_KEY` | `EMAILOCTOPUS_LIST_ID` | Storing |
|---|---|---|---|
| Farmhouse Getaways | set | set | **yes** |
| Mini Barn Market | not set | not set | no |
| Farmstand.TV | not set | not set | no |

The code is identical on all three, so the two outstanding sites need nothing
but those two variables — the same values as here, since it is one shared list
— and a redeploy, because Netlify only hands environment variables to the code
on the next build.

`EMAILOCTOPUS_BRAND` is optional: unset, the brand tag falls back to
`SITE_LABEL`, which is already set on all three for the form alerts.
`EMAILOCTOPUS_AUTOMATION_ID` is optional too — unset, EmailOctopus's own
"joined the list" trigger owns the welcome email.

Still outstanding: the three welcome emails in `emails/` have to be built by
hand as EmailOctopus automations. The API can start an automation but cannot
create one.

**Check `alerts-status` before telling the owner anything is or is not
reaching the list.** Two sessions have now got this wrong in opposite
directions by reasoning from the repository instead of asking the site.

**Do not rebuild any of this.** It belongs to a separate effort. Your job is
**maintenance once it is live**: if it breaks, if signups stop arriving, if a key
expires, that is yours to diagnose and fix.

Existing subscribers live in **Wix** and need exporting separately. That is a
known future task, not part of wiring up the forms.

## Open, as of 10 Aug 2026

**Photographs — none of the new ones are on the site.** The owner has sent them
by pasting into the chat, which lets a session *see* an image but writes no file
to disk, so there is nothing to resize or commit. **Ask for a zip, or a Google
Drive folder** — the D16 zip arrived intact, and the Google Drive connector is
live on this account (verified 10 Aug 2026), so a shared folder can be pulled
straight down without the owner exporting anything. Pillow is not installed by
default; `pip install Pillow` works and takes a few seconds, so full-size camera
files are fine.

Nineteen photographs are described and waiting, all Red Barn Ranch:

| Room | Shots |
|---|---|
| 1 · The Primary | bedroom, tub bath, vanity/shower bath, breakfast tray, bedside |
| 2 · The Library | wide, from doorway |
| 3 · The White Room | wide, from doorway |
| 4 · The Pink Peacock | wide with desk, bed and console |
| 5 · The Floral Peacock | wide, bed close-up, sitting area |
| 6 · The Adventure Room | wide, sitting area, the Jack-and-Jill |
| 7 · Industrial Mini Mansion | breakfast tray, wide interior |

### The photographs, and which frame is which

Fixed 10 Aug 2026. The owner shared the **full professional shoot of Red Barn
Ranch** as a Google Drive folder — 71 frames, Canon 6D Mark II, Lightroom, named
`17054 Handlebar Rd_0NN.jpg`. Every photograph already on the site came from
this same shoot, so the frame numbers are the shared vocabulary:

| Site file | Frame |
|---|---|
| `rbr-gamehall-pool` 014 · `rbr-derby` 016 · `rbr-shuffleboard` 018 | barn |
| `rbr-arcade-hoops` 019 · `rbr-arcade-digdug` 020 · `rbr-minigolf` 021 | barn |
| `rbr-excavator-kids` 040 · `rbr-feeding-birds` 042 · `rbr-girl-chicken` 045 | farm |
| `rbr-eggs-kids` 048 | farm |
| `rbr-living-room` 068 · `rbr-kitchen` 072 · `rbr-kitchen-bar` 073 | house |
| `rbr-bedroom-desk` 075 · `rbr-bedroom-floral` 086 · `rbr-bedroom-twins` 090 | bedrooms |
| `rbr-pool-vineyard` 107 · `rbr-pool-spa` 109 · `rbr-pool-wide` 111 | pool |

Roughly fifty frames have never been used. Subject groups: barn 008–022, farm
039–057, kitchen/dining/living 063–074, **bedrooms 027 and 075–096**, bathrooms
081/088/097/098, laundry 099, pool 107–111. Frame **089** (a hallway through an
arch) the owner has said to drop.

**Rooms identified so far:**

- **1 · The Primary** — 092, 093, 094, 095, 096, and its bathroom 097 (soaking
  tub) and 098 (two sinks, walk-in shower). Confirmed by the owner via 096.
- **5 · The Floral Peacock** — 084, 085, 086, 087. Frame 085 was on the site as
  `rbr-primary-suite.jpg`, captioned "Primary suite" with alt text calling the
  shared bathroom an ensuite. **Renamed to `rbr-floral-peacock.jpg` and
  recaptioned on 10 Aug 2026.**
- **6 · The Adventure Room** — 090, 091, and 088 is the Jack-and-Jill it shares
  with room 5. Inferred from the layout, not yet confirmed by the owner.

**Still to name: 2 · The Library, 3 · The White Room, 4 · The Pink Peacock.**
The unassigned bedroom frames are 027, 075, 076, 077, 079, 080, 082, 083, and
bathroom 081. Do not guess — ask.

The originals can be pulled again from Drive at any time; `download_file_content`
returns base64 and would flood the context, so fetch by URL instead:

    curl -sL "https://drive.google.com/uc?export=download&id=FILE_ID" -o out.jpg

Web copies are 1600px wide, JPEG quality 82, progressive — 20 MB for all 71.

**A portrait of Cory, Carissa and Legend** is coming, for Our Story. There is no
photograph of the owners anywhere on the site, which is the largest gap on it —
`images/hosts-temp.jpg` sits unused, evidently intended for this.

**Waiting on the owner:**

- The compliance ruling on what may be said about weddings. Until then
  `wedding-groups.html` describes guests who are in town for a celebration and
  never offers to host one. Do not add event or micro-wedding wording.
- How to word additional people on the property, once the insurance position is
  settled. The old "$50 per person" day-visitor line was removed from three
  pages and nothing replaced it.
- Quiet hours. They are 10pm to 6am under the county noise ordinance, not a
  house rule, and Dos Picos is a short walk away rather than adjacent. Agreed in
  principle for `mountain-retreat.html`'s "Good to know", wording not settled.
- Whether to name the wildlife — coyotes, bobcats, raccoons, snakes — on both
  property pages. The owner's own Airbnb listing does this well.
- Seasonal pool heating rates. The site now says to ask, which holds until she
  has winter pricing.

**The barn paragraph on `red-barn-ranch.html` was rewritten by the owner** on
10 Aug 2026, through the editor. It no longer names the pinewood derby track,
but the gallery directly beneath it still carries a photograph captioned "Derby
track" and the board still says "Derby track and putting green — Yes". Not a
contradiction, but the owner was asked whether the derby track should go back
into the prose and has not answered.

**SEO comes last.** Titles, meta descriptions and structured data should be done
in one pass across all nine pages, immediately before `robots.txt` and the
`noindex` header are flipped. Doing it earlier means redoing it after every copy
change, and nothing ranks while the site is hidden anyway. Target capacity terms
— large group vacation rental San Diego, sleeps 18, family reunion — which the
titles do not currently carry at all. `mountain-retreat.html`'s JSON-LD is also
missing `occupancy`, which the ranch has.

## The visual editor at `/edit.html`

The Publish button posts to `netlify/functions/publish.mjs`, which **commits to
GitHub**. Netlify sees the commit and builds, exactly as when a change is pushed
by hand. Rewritten 10 Aug 2026; it used to deploy straight to Netlify with
`NETLIFY_TOKEN`, which is dead, revoked, and was the drift mechanism that lost
D16. That path is gone — do not put it back. Everything goes through the repo.

How it works: read the branch head, read the pages from the repo at that exact
sha, apply the text replacements and photo swaps, write **one** commit with
every changed file, then move the branch with `force: false`. If somebody pushed
in the meantime the ref update fails rather than discarding their work, and the
editor says to press Publish again.

Two environment variables are needed in Netlify → Site configuration →
Environment variables:

- `GITHUB_TOKEN` — a token that can write file contents on
  `FarmhouseGetaways/farmhousegetaways`.
- `ADMIN_PASSWORD` — the same one that guards `/api/emailoctopus`.

Optional, only if the repo or branch ever moves: `GITHUB_REPO`,
`GITHUB_BRANCH`.

Environment variables only reach the code on the next build, so a **Deploys →
Trigger deploy** is needed after adding or changing either one.

### The token — read this in November

The token in use is a **classic** token with the `repo` scope, made 10 Aug 2026,
**expiring around 8 November 2026**. When it expires the Publish button starts
reporting that the token is not valid. That is a renewal, not a breakage: make a
new one at github.com/settings/tokens/new and swap the value in Netlify.

It is a classic token rather than a fine-grained one because **the fine-grained
form would not generate.** Both `/settings/personal-access-tokens/new` and, at
first, the classic page returned to an empty token list with no error message —
in an ordinary window and in incognito alike, on a correctly filled form
(resource owner set, single repository selected, Contents: Read and write). The
classic page worked on a second attempt with a 90-day expiry. If the
fine-grained form ever starts behaving, swapping to one scoped to Contents on
this repository alone is a worthwhile tightening: a classic `repo` token can
reach every repository on the account.

**Why there is a password on it.** `/edit.html` and the function behind it are
both on the open web. While the Netlify token was dead that cost nothing; a
working GitHub token changes it, because anyone who found the URL could commit.
It **fails closed** — with no `ADMIN_PASSWORD` set nobody publishes, the owner
included. The editor prompts for the key once and keeps it in `localStorage`
under `fg-publish-key`; a 401 clears it so the next press asks again.

**Save to a file** still works and needs no key — it downloads a change list to
hand over instead.

### The text replacement is in `_lib/edits.mjs`, and it is tested

The entity encoding and the photo swap used to sit inline in `publish.mjs`,
untested. The very first real publish through the button proved why that was a
mistake: the entity table mapped an **ordinary space** to `&nbsp;`, so every
space in the edited paragraph came out non-breaking, the line refused to wrap,
and it went live running off the right-hand edge of `red-barn-ranch.html`.
Fixed and moved to `netlify/functions/_lib/edits.mjs` on 10 Aug 2026, with
`edits.test.mjs` guarding it.

    node --test netlify/functions/_lib/*.test.mjs

Run it after any change to the encoding. Two rules the tests hold in place:

- **Nothing ever writes `&nbsp;`.** A non-breaking space stops a line wrapping,
  which is never what someone typing into the editor meant.
- **Non-breaking spaces coming *in* are flattened to ordinary ones.** Browsers
  scatter U+00A0 through `contenteditable` without being asked, so the encoder
  strips them rather than preserving them.

`tolerant()` also matches `&nbsp;` in the *source*, so a page damaged by the old
bug can still be edited back out through the editor.

### The honeypot must never be called `company`

Every form carries a hidden trap field. If it arrives filled, Netlify treats
the submission as spam, discards it, and **still shows the visitor the thanks
page**. Silent by design.

It was named `company` on Farmhouse Getaways and Farmstand.TV until 20 Aug
2026, and that is a field browsers autofill: Chrome and Safari both store an
Organization for an address, and the Farmstand.TV form asks for owner name,
address, city, state and zip — exactly the shape that triggers it. A real
person filling that form in with autofill on had their submission thrown away
without a trace.

Renamed to `bot-field` everywhere, which no browser has ever offered to fill.
**Never name a honeypot after anything a person or a browser might recognise**
— company, organisation, address, phone, website.

## Carissa's workout tracker — `workout/`, and its OWN Netlify site

Added 21 Aug 2026. Seven days of the week, a workout on each, a video per
exercise, a big **Set complete** button, and a record of everything done with a
calorie estimate. Plain HTML, one stylesheet and three JavaScript modules, with
three small Netlify functions behind them. **`workout/README.md` is the long
form**; read it before touching any of it.

**Live at https://carissa-workouts.netlify.app** — its own Netlify site,
project id `67b7b2da-7f9e-4d64-b780-f447f709d7fb`, set up 22 Aug 2026 with
`WORKOUT_PASSWORD` and a VAPID key pair. Production is public; the app's own
password is the lock. Verified end to end that night: a wrong password
refused, the right one returning an HttpOnly Secure cookie, the record opening
only with it and shutting again on sign-out, and the reminder sweep running.

**It is not part of this website.** The folder is in this repository because
that is where the branch was, but it deploys as a *separate Netlify site*
pointed at the same repository with the base directory set to `workout`, which
makes Netlify read `workout/netlify.toml` instead of the root one — exactly how
`legend/` works inside the app's repository. The root `netlify.toml` carries a
forced 404 on `/workout/*` so `publish = "."` cannot serve the app on the
farmhouse domain by accident. **Do not "fix" that 404.**

**The editor is admin-only, behind a long press, and unrelated to accounts.**
Added 23 Aug 2026: real accounts (below) now handle who a training record
belongs to, and editing the week is a completely separate lock — the app's
one shared admin password, `WORKOUT_PASSWORD`, same as it always was.
Signing into an account never opens any admin screen on its own:
**press and hold the title for 750ms**, the same gesture the farmhouse app
uses for its own admin screen, or open `/#/admin` on a laptop, and either way
it asks for `WORKOUT_PASSWORD`. **The unlock lapses after twelve hours** and
is stored in `localStorage` — it was `sessionStorage` for one evening, which
relocked on every new browser tab and drove the owner mad within the hour.
Twelve hours is long enough to write a week in one sitting and short enough
that a phone left about tomorrow is locked. Do not "fix" this by making any
admin screen reachable to an account that is merely signed in. (There is no
pencil to show any more since the 28 Aug 2026 rebuild — see below — but the
principle still applies to every admin screen that replaced it.)

**Accounts — up to five, for the beta.** Added 23 Aug 2026, at the owner's
request: "we need accounts/users and also one admin login for editing." So
there are now two unrelated locks rather than one doing both jobs. An
account is a real person's own email and password, or Google, created or
signed into from the **Sign in** pill or `/#/login`; it is what a training
record is attached to and what makes it sync. It has nothing to do with
`WORKOUT_PASSWORD` and cannot open the editor. Capped at five while this
stays a small beta rather than real multi-tenant infrastructure — raising
`MAX_USERS` in `netlify/functions/_lib/users.mjs` is a one-line change
whenever that conversation happens. The old, single shared record from
before accounts existed was copied once into whoever created the very first
account, so nothing already logged was lost. **Google sign-in** and
**password-reset emails (via Resend)** are both optional and both fail
quiet: unset `GOOGLE_CLIENT_ID` and the Google button simply does not
appear; unset `RESEND_API_KEY`/`RESEND_FROM` and "forgot your password"
says it cannot send an email rather than pretending to. Passwords are
hashed with scrypt, never stored or logged in the clear. `workout/README.md`
has the full shape of it, including exactly who can read what.

**The record grew real intelligence, and a self-serve/admin layer, on 23 Aug
2026.** Beyond `_lib/users.mjs`, three more pieces:

- **`js/insights.js`** turns the plain list of finished workouts into things
  a raw total can't say — this week versus last week, which day she actually
  shows up, the longest run ever (not just the current streak, which forgets
  a broken one), personal bests, and a short, deliberately small set of
  milestones. The history screen leads with these now. **A milestone is
  announced once, on the summary screen right when it's earned** — get this
  wrong and it either never fires or re-fires on every old workout revisited;
  the first version compared "with this session" to "without it" and
  announced the same milestone on all five sessions once there were exactly
  five, including the first one a year later. The fix compares insights from
  just before a workout's own finish time to just after — pure, and tested
  (`insights.test.js`, including that exact regression).
- **Settings → Change password**, signed in, no email round trip — proves
  the current password first and bumps the account's session generation,
  which is what actually signs every other device out.
- **Settings → Edit the week (admin) → Who has an account** — a read-only
  roster (`netlify/functions/admin-people.mjs`), gated by the admin
  password, never a password hash or Google id. No delete or edit button on
  purpose: five people is small enough that "ask them to email you" beats a
  button that could be mis-tapped.

**Reminders are push, and the restraint is the design.** `reminder-tick.mjs`
runs hourly on Netlify's schedule and decides per device, in that device's own
zone: nothing scheduled today, already done today, or already said today all
mean silence. A snooze is the one thing allowed to speak twice, and only on the
day it was set. The hour is a LOCAL hour with an IANA zone beside it — a fixed
offset is refused even though `Intl` accepts it, because it would be wrong
twice a year. All of that is pure and tested in `_lib/remind.test.mjs`; it
needs `VAPID_PUBLIC` and `VAPID_PRIVATE`, and without them the app is exactly
as it was and says reminders are off.

**The hour is admin-controlled, added 26 Aug 2026.** The owner asked for
central control over who gets reminded and when: "as an admin, I need to be
able to set push notifications for individual or all clients/users." Settings
→ Edit the week (admin) → Reminder schedule sets a site-wide default (on,
8am, "Don't forget to do your workout today!") and can give any one account
its own instead, or set every account at once — `_lib/reminder-shape.mjs`
(pure, tested) decides which wins, `_lib/reminder-config.mjs` stores it and
pushes it onto whatever that account has subscribed. The Reminders screen
itself no longer has an hour picker; a person still has to press **Remind
me** and grant the browser's permission on their own device — nothing can
subscribe a phone that never opened the app — but the hour it fires at is
the admin's decision from then on. What a reminder SAYS is also
admin-configurable, one message per hour of the day, looked up by whichever
hour a person's reminder is set to — so changing hour 8's wording updates
everyone at 8am with nothing to touch per person.

**The video library, added 26 Aug 2026.** The owner asked to stop re-pasting
the same YouTube link into every workout that reuses an exercise: "let's
remove any option to upload from phone" for video — "photos only" — "I also
need a repository of videos... so I don't have to rename and choose a
YouTube link every time." `/api/media` no longer accepts a video upload (it
still serves one from before this changed, so nothing already built goes
dark); a video is a link only, chosen from `/api/video-library` or pasted
in fresh. Any exercise's media sheet has "Save this video to the library",
which works on an OLD exercise's video just as well as a new one — that is
the answer to "I already built workouts before there was a library."

**The exercise pool, added 27 Aug 2026, then rebuilt 28 Aug 2026 into the
whole architecture below.** It started as a copy-in convenience alongside
day-by-day editing — "From the pool" copied a saved exercise onto a day,
"Save to the pool" copied one back. That copy-based version is gone. See the
next entry for what replaced it.

**The whole week was rebuilt around three linked repositories, 28 Aug
2026 — this is the one to read before touching anything under `workout/`.**
The owner, in one sitting, asked for five things that turned out to be one
redesign: (1) an unmissable visual difference for admin mode ("maybe make
the background red"); (2) a standalone screen to view the video repository,
plus every exercise field editable ONLY in a repository, so a workout can
only ever pick an existing exercise, never invent one inline; (3) workouts
created once and then assigned to a specific user and day, several per
day allowed; (4) a workout repository to match the video/exercise ones —
build an exercise, build a workout from exercises, then assign workouts to
a user by picking a user, a day, and a time; (5) no more "Edit this day"
gate — admin mode should make everything immediately available to edit.
Four follow-up questions settled the ambiguous parts, answered by the
owner: an exercise's sets/reps/rest are now fixed in the pool (no
per-workout override — the same exercise looks identical everywhere it is
used); a "day" stays a repeating weekday, not a dated calendar; every
existing account starts with a **blank** schedule (the old shared week was
not migrated); and a signed-out visitor now sees "sign in to see your
week" rather than any shared plan.

The result: the exercise pool (`/api/exercise-library`) is the only place
an exercise's fields are ever set — Settings → Edit the week (admin) →
Exercise pool, with +New and Edit as well as Remove now. The workout
library (`/api/workout-library`, new) is a title, a picture, and an
ORDERED LIST OF EXERCISE IDS from the pool — never a copy of the exercises
— built and reordered on its own screen, Settings → Edit the week (admin)
→ Workouts. Assignments (`/api/assignments`, new; stored as an
`assignments` array right on the account record in `_lib/users.mjs`,
mirroring how a reminder override already worked) are which workout(s) an
account does on which weekday, at which time, multiple allowed per day —
Settings → Edit the week (admin) → Assign workouts, pick a person, see and
edit their whole week. Referencing rather than copying is what makes
editing an exercise in the pool reach every workout that uses it,
everywhere, immediately.

**The old day-by-day editor is gone completely** — no more pencil, no more
draft of the whole week, no more save bar, no more `/api/plan`,
`data/plan.json`, or `netlify/functions/plan.mjs` (all deleted). The week
and day screens are now read-only, showing the signed-in account's own
resolved schedule; all editing happens on the admin screens above,
immediately, with nothing to publish separately. Reminders now resolve
"today" from that account's own assignments (`_lib/tick.mjs`, per-account,
cached within a sweep so two devices on one account do not fetch it
twice) instead of the old shared plan. Read `workout/README.md`'s
*Exercises, workouts and schedules* section for the full shape of it before
changing any of this.

**A picture and a video are different things.** An exercise has both fields and
they are independent: the picture is the thumbnail and the video's poster, the
video is what plays when she starts. A day has a picture and no video. Do not
collapse them back into one field.

**Editing used to be in place; since the 28 Aug 2026 rebuild it is a form,
on its own admin screen.** The pencil, the contenteditable fields and the
draft-of-the-whole-week are all gone — see the entry above. An exercise or
a workout is edited through a sheet (`exerciseEditSheet`/`workoutMetaSheet`
in `js/app.js`) with plain inputs, saved on one explicit Save press, no
draft to publish separately. `#/edit/mon`, the old bookmarked URL for
opening a day with the pencil already pressed, now just opens the day —
there is nothing left to pre-press. **Non-breaking spaces are still
flattened on the way in** for anything typed into a field here — browsers
scatter them through form inputs same as they used to through a
`contenteditable`, and one stops a line wrapping, which is the bug that
took the website's own editor down once.

Uploads go to `/api/media` and are content-addressed by a hash of their bytes.
A picture is shrunk to 1600px in the browser first. There is no video
upload any more — see "The video library" below — only a link.

Three more things a future session needs to know:

**It has its own password and its own store.** `WORKOUT_PASSWORD` on its own
site — not this site's `ADMIN_PASSWORD`, and nothing to do with `GITHUB_TOKEN`
or the November token renewal. The week, the record and the accounts all live
in Netlify Blobs belonging to that site, never in this repository, because
this repository is public and a training log is not. `data/plan.json` stays
committed as the floor under the live week and nothing else does.

**Two cookies, not one.** The admin password goes to `/api/auth` once; an
account's email and password (or Google credential) goes to `/api/account`.
Either way what the browser keeps is an HttpOnly, signed, expiring token, not
the secret itself, and each cookie only ever opens its own door — the admin
one cannot read a training record, an account cannot edit the week. With
`WORKOUT_PASSWORD` unset neither system works at all: nobody can sign in as
admin, nobody can create or use an account, and no record can be read. It
fails closed.

**Everything works with no server at all.** If the functions cannot be reached
the app falls back to the committed `workout/data/plan.json` and the browser,
says so at the top of the week, and keeps working — including a whole workout
done in a gym with no signal, which goes up on its own afterwards. That
fallback is the normal state of a phone in a garage, so keep it working.

The shape of the data and every clamp is in
`workout/netlify/functions/_lib/data.mjs`, guarded by `data.test.mjs`:

    node --test workout/netlify/functions/_lib/*.test.mjs

`workout/sw.js` precaches the shell. **Bump `VERSION` in it whenever the file
list changes**, or a phone that installed the app keeps serving the old copy
for ever.

## Form alerts — three sites, one phone

Every form submission on all three sites pushes a notification to the owners'
phones through the Mini Barn Market app. The chain, end to end:

    form submitted
      -> Netlify verifies it and stores it (Forms tab, nothing to build)
      -> Netlify calls that site's netlify/functions/submission-created.mjs
      -> _lib/alerts.mjs builds a summary and fires every configured channel
      -> app's /.netlify/functions/push-alert  ->  sendToAdmins  ->  phones

The summary carries who submitted, which form, and every field they filled in
— including fields added to a form later, which is why it does not work from a
fixed list.

**The alert must never sit behind the EmailOctopus work in
`submission-created.mjs`.** Written that way round first, it never fired once:
several perfectly ordinary paths return early in the list code — an unticked
inquiry, a form that feeds nothing, EmailOctopus not being configured — and
those are exactly the submissions worth hearing about.

On this site the alert runs first and the list work follows. On Mini Barn
Market and Farmstand.TV all three channels run together in one `Promise.all`,
which satisfies the same rule better: neither can return early past the other,
and a signup does not wait on a push notification. Either shape is fine. A
list call the alert has to queue behind is not.

Environment variables, on each of the three sites:

| Key | Value |
|---|---|
| `SITE_LABEL` | `Farmhouse Getaways` / `Mini Barn Market` / `Farmstand.TV` |
| `ALERT_WEBHOOK` | the app's `/.netlify/functions/push-alert` |
| `ALERT_WEBHOOK_KEY` | the app's `ADMIN_PASSWORD` |
| `NTFY_TOPIC` | optional second channel, a topic on ntfy.sh |

`NTFY_TOPIC` needs no account, so the topic name **is** the password — anyone
who knows it can read the alerts and send fake ones.

### Why form alerts have their own audience

The app's `sendToAll` reaches every phone that installed it. A form alert must
never go there: it is not news for a guest waiting to hear the peaches are in,
and it would put an enquirer's name and message on a stranger's lock screen.
So the app has `sendToAdmins`, which reaches only devices enrolled by pressing
**Send alerts to this phone** on its admin screen. That enrolment is marked
from the verified admin password on the request and never from anything the
page asks for, so nobody can enrol themselves.

Each alert also carries its own notification tag. The service worker replaces
a notification sharing a tag — right for the Story watcher, wrong here, since
two people submitting an hour apart are two different people.

**Email notification is separate and lives only in the Netlify UI**: Project
configuration → Notifications → **Emails and webhooks**, in the *Form submission
notifications* panel at the bottom. (An earlier note here said Forms → Settings
and usage, which is not where it is.) It is in no repository, so it survives no
rebuild and has to be set per site, per form.

### What an alert says

Written to be read on a lock screen in a couple of seconds, so the field names
are English: `Owner: Dale Marsh`, not `owner-first: Dale`. A person is one line
— the name fields are joined rather than split across `Name:` and `Surname:` —
and a farm stand leads with the stand, its owner underneath. The title is
`<Site> <Form>`: "Mini Barn Market Inquiry", "Farmstand.TV Farm Stand
Submission". A field the `LABELS` map has never heard of still appears, tidied,
because a form gains a field far more often than that map is updated.

The identical `summarise()` lives in all three sites — `_lib/alerts.mjs` here,
inline in `submission-created.mjs` on the other two. Change one, change all
three.

**Build the name line from the name fields only.** There is a `who` fallback
that drops through to the stand name when no person is given; reusing it for the
`Owner:` line printed "Owner: Handlebar Produce". Caught before it shipped by
running the real module with `fetch` stubbed — which is the way to check this,
since the function itself answers 403 to anything but Netlify.

## Access

The Claude GitHub App is installed on this repo with write access, so a cloud
session can push directly. If a push ever returns 403, check that the app is
still installed at github.com/settings/installations — authorizing the app is
not the same thing as installing it, and only the install grants write.

Google Drive, Gmail and Google Calendar connectors are live on the account.
Drive is the useful one here: it can pull a shared folder of photographs
directly, which is the answer to the photographs problem above.

### What a Claude Code session cannot do — read before promising anything

**A Claude Code session cannot drive the owner's browser.** It runs in a
container in the cloud with no link to their machine. It can read and write
every file here, push to GitHub, and fetch the live site — and that is the lot.

The owner has the **Claude for Chrome** extension, which genuinely does drive
their browser, but it works with **claude.ai** conversations, not with a Claude
Code session. They are different surfaces. On 10 Aug 2026 this caused a long
and frustrating detour: a session said it could not drive the browser, the owner
said it had been doing so for a week, and both were right about different tools.

So the division of labour is:

- **Here** — anything touching the site: copy, layout, photographs, forms,
  commits, deploys.
- **claude.ai with the Chrome extension** — anything that means clicking through
  somebody else's settings pages: GitHub tokens, Netlify configuration, the
  Airbnb and Lodgify listings.

When browser work has to happen in this session anyway, the fallback that worked
was: **one instruction at a time, and wait.** Batches of five steps failed
repeatedly. Ask for a screenshot after each step and read it before giving the
next one.

### Dead weight in Netlify

`NETLIFY_TOKEN` and `NETLIFY_SITE_ID` are still set as environment variables and
**nothing reads them any more** — they belonged to the old publish path that
deployed around the repo. The token is revoked. Deleting both is safe and is
worth doing; it was left until a real publish had been seen working, which it
now has.
