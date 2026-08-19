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

## The game in `catfighter/` — not the website

Added 19 Aug 2026, on branch `claude/street-fighter-cats-game-tk1d55`. The owner
asked for a Street Fighter II style fighting game starring their six cats, to
run on Windows or Steam. It lives entirely in `catfighter/` and shares nothing
with the site — no CSS, no markup, no build step in common.

It is a complete working game: six characters with their own specials, a full
six-button control scheme with quarter-circle and charge motions, best-of-three
rounds, an arcade ladder, five CPU difficulties, six stages, and 32 tests over
the frame data. `catfighter/README.md` explains all of it.

Three things a later session needs to know:

- **All six cats are the real ones**, added 19 Aug 2026. GRACIE (medium,
  growl + tail whip), MARIO (heavy, belly bump + smother), LUIGI (light,
  flying body + leg sweep), LILLY (light, flip attack + crane kick), FIGURO
  (medium, rapid paws + an invincible retreat), RUBY (heavy, crushing bite +
  charge flip kick). Each block is in `catfighter/src/characters.js`.
  **Every super was invented, not given** — the owner has been asked about all
  six and has not answered yet. So were Gracie's eye colour and the spelling of
  FIGURO (it may be Figaro). Do not treat any of those as settled.
- **Weight classes are the balance backbone.** `weightClass` on each cat picks
  a row of `CLASSES` in `fighter.js`, which multiplies damage taken, stun taken
  and knockback. Heavy takes 14% less and barely moves; light takes 15% more
  and flies. Tests assert the ordering in both directions and that a light cat
  cannot also be tough. Do not add a cat without a class.
- **Photographs**: the owner pastes them into the chat, which a session can see
  but cannot save. Colours were read by eye. **Ask for a zip or a Drive folder**
  if the actual photographs are wanted on the select screen (`photo:` on the
  cat, files in `catfighter/assets/cats/`).
- **Do not teach the CPU about a cat by name.** `ai.js` classifies specials by
  what they do — spawns something, rises with invincibility, travels forward,
  is a command grab, hits low — so a cat added tomorrow is understood without
  touching it. A test fails if any cat ends up with no role the CPU can see.
- **`MOVES.md` is generated**, by `node tools/gen-moves.mjs`. Edit the character
  data and regenerate; never edit it by hand.
- **`.github/workflows/catfighter-windows.yml` builds the Windows version.**
  It only fires for changes under `catfighter/`, so it cannot slow down or
  interfere with a site deploy. Actions tab → Run workflow → download the
  artifact.

**If this branch is ever merged to `main`, the game ships with the site.**
`netlify.toml` sets `publish = "."`, so `catfighter/` would go live at
`farmhousegetaways.netlify.app/catfighter/` and add about 350 KB to the deploy.
That may well be wanted — it is the easiest way for the owner to play it — but
it is the owner's call, not a thing to do silently. Ask before merging.

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
