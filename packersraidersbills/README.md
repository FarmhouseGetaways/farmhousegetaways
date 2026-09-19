# PackersRaidersBills

A live statistical comparison of three NFL clubs — the **Green Bay Packers**,
the **Las Vegas Raiders** and the **Buffalo Bills**. Dark page, each club drawn
in its own colours, a scrolling ticker across the top, and the rest of the page
broken into sections: offence, defence, quarterbacks, head-to-head and twenty
seasons of history.

**The page is branded PackersRaidersBills** — that is the title, the masthead
(each club's word in its own drawn colour) and the favicon. The repository name
is separate and may differ; nothing in the code reads it.

Hand-written HTML, one CSS file, one JavaScript file, two Netlify functions. No
build step, no dependencies, no npm.

## What is on it

| Section | What it holds |
|---|---|
| Three club panels | Record, standing, points for and against, differential, next fixture |
| Head to head | All three pairings, series record and every meeting since 2007 |
| The numbers | **Seven collapsible categories, 89 statistics** — scoring & drives, passing, rushing, receiving, defence, turnovers & discipline, kicking/punting/returns |
| Quarterbacks | Each club's leading passer, and a 14-row comparison |
| The last twenty seasons | Win bars per season, one shared scale across all three clubs |

Each category is a real `<details>`, so it opens with a click or the keyboard.
Scoring and Passing start open; the rest start shut, because 103 rows opened at
once is a wall rather than a page.

## Every number on this page is live

Nothing is typed in by hand and nothing is a fixture. The page reads its own
two endpoints, which read ESPN's public API:

| Endpoint | Serves | Cached |
|---|---|---|
| `/api/stats` | Season records, standings, team statistics with league ranks, each club's leading passer, live scores | 2 minutes |
| `/api/history` | Head-to-head series and season-by-season form, twenty seasons | 6 hours |

The page refreshes the live half every 60 seconds and whenever the tab is
brought back to the front.

**Why the functions exist at all.** ESPN's endpoints are not a documented,
CORS-friendly API, and drawing this page directly from the browser would be
sixteen cross-origin requests per load. The functions fan out server-side,
normalise the shapes, and hand the page one JSON document.

**If ESPN is down the page says so.** It never falls back to invented numbers.
A function that cannot reach ESPN serves the last good copy it has and marks it
stale; with nothing cached it returns 502 and the page prints a plain message.

## Four traps in ESPN's API, each already paid for once

Every one of these was found by running the real thing against the live API,
not by reading about it. They are the reason this repo has tests.

1. **`site.api.espn.com` answers 403 to a request with no User-Agent.** Not a
   401, not a rate limit — a flat 403 on every path. Node's `fetch` sends no UA
   by default, so without one, half the calls fail while the `sports.core.api`
   ones keep working. The page still renders, with fallback colours and no
   records, and nothing logs an error. `getJson` always sends a UA.

2. **The Raiders were `OAK` until 2020.** ESPN files pre-move games under the
   old abbreviation, so matching on `LV` alone reported a twenty-season
   head-to-head series as a single game. Each club carries an `abbrs` list of
   every name it has played under, and the series is counted by our own stable
   key, never by the abbreviation on the day.

3. **`passing.sacks` and `defensive.sacks` are opposite things.** The first is
   sacks the offence *took*, the second is sacks the defence *made*. Same word,
   opposite meaning, opposite direction of "better".

4. **`defensive.yardsAllowed` and `defensive.pointsAllowed` are served as `0`**
   all season. A real zero is indistinguishable from missing data on a page, so
   points conceded is read off the season record instead, and yards allowed is
   not shown at all rather than shown as nothing.

Two smaller ones: the team endpoint needs a **lowercase** slug (`/teams/gb`,
not `/teams/GB`), and `passingYards` is gross while `netPassingYards` is after
sack yardage — mixing them flatters a team's passing game.

## Two judgement calls worth keeping

**Season totals are labelled as such.** In week 2 one club has played once and
another twice, so "174 tackles against 68" is mostly a fact about how many
games each has played. Rows that are counts rather than rates carry a *season
total* chip, and every column heading shows that club's games played. The
denominator is never hidden.

**A club is drawn in its own colour, lightened — not swapped.** Green Bay's
green and Buffalo's navy are too dark to read on a near-black page, so they are
lightened until they do while keeping their hue. The first version dropped any
dark primary to the club's secondary, which turned the Packers gold and the
Bills red: legible, and wrong. The Raiders' primary is literally `#000000` —
there is no hue to lighten, only grey — so that one alone falls back to the
club's own silver.

## The look

Broadcast graphics, not a spreadsheet: condensed display type (Barlow
Condensed, with Arial Narrow and the system stack behind it), a club's colour
used as a hard diagonal flood rather than a hint, and numbers set large enough
to read at a glance. The skewed tick — in the masthead mark, the section
headings, the ticker tags and the winner chips — is the one repeated motif.

**Club logos are used wherever there is room**: bled off each panel corner as a
watermark and again small beside the name, in every comparison table's column
headings, on the ticker tags, on the quarterback cards, on both sides of a
head-to-head panel, on each past meeting's winner chip, and on each row of the
twenty-season history. They come from ESPN's `500-dark` variants, which are
drawn for a dark background.

Five rules that are easy to undo by accident:

- **A skewed box needs an unskewed child.** `.ticker-tag` and `.meetings .res`
  transform the box by -12deg and the inner `<span>` back by +12deg. Drop the
  span and the lettering leans over with the box.
- **The leading cell is flooded, not outlined.** On a table this dense a 3px
  edge is genuinely hard to find. The flood percentage is set per club by
  `themed()` in `js/app.js`, because a pale accent floods far more strongly
  than a dark one at the same value — the Raiders' silver washed out their
  whole column at the percentage that barely showed the Packers' green.
- **The rank stacks under the value below 56rem.** Three cells across a phone
  leaves no room beside it, and "419.0" and "6th in NFL" ran together into
  "419.06th in NFL".
- **Which categories are open is held outside the DOM**, in a Map of key to
  boolean. The page redraws every 60 seconds and a rebuilt `<details>` defaults
  to closed, so without this a category the reader opened would snap shut under
  them once a minute. It is a map rather than a list of open keys on purpose: a
  list cannot tell "the reader closed this" from "this category did not exist
  yet", so a category added later would never get its own default.
- **A row containing a negative value is scaled across its own range.** Point
  differential and a quarterback's rushing yards both go below zero, and
  scaling by absolute value drew the WORST team the longest bar — Green Bay's
  −17 differential rendered as a full-width leader.

## Running it locally

```
node tools/dev-server.mjs          # http://127.0.0.1:8099
```

It serves the repo as static files and routes `/api/*` to the same function
modules Netlify runs, so what you check locally is the real thing.

Two things to know if you drive it with a headless browser. The team logos and
player headshots come from `a.espncdn.com`, which a sandboxed environment may
block on certificate grounds — launch Chromium with
`--ignore-certificate-errors` to see the page as a visitor does. And the
headshots are `loading="lazy"`, so a capture has to scroll the page AND wait
for them to decode before shooting; scrolling back to the top too early
cancels the fetches and they come out as empty circles.

```
node --test netlify/functions/_lib/*.test.mjs
```

Plain Node, no npm. Run it after any change under `_lib/`. The tests cover the
shapes and the directions — which way is "better" for each metric, that a
missing stat never wins a row, that a relocated franchise is still one
franchise, and that an unplayed fixture is not counted as a meeting.

## How it goes live

    edit a file  ->  commit to main  ->  push  ->  Netlify builds  ->  live (~30s)

`netlify.toml` sets `publish = "."` with no build command, so files ship
exactly as they are here.

**Never drag a folder or a zip onto Netlify.** A dragged deploy bypasses the
repo, the live site and `main` drift apart, and the next commit silently
reverts whatever was dropped. That has already cost this estate a day's work
once, on another site. The repo is the source of truth.

## Conventions

- **`css/site.css` is cached immutable for a year.** Every page links it as
  `site.css?v=XXXXXXXX`. Change the file and you **must** bump that string, or
  nobody sees the change:

      NEW=$(md5sum css/site.css | cut -c1-8); sed -i "s/site\.css?v=[a-z0-9]*/site.css?v=$NEW/g" *.html

  `js/app.js` is versioned the same way.

- **The ticker holds its list twice.** The second copy is `aria-hidden` and
  exists only so the scroll loops with no gap; the animation translates by
  exactly -50%, so anything other than two identical copies visibly jumps.
  `app.js` builds both from the same markup — do not template them separately.

- **`publish = "."` serves every file in this repository.** Anything that is
  not a page needs a forced 404 in `netlify.toml`, and `force = true` is
  required — Netlify serves a real file in preference to a redirect that
  matches it, so without it the rule does nothing at all.

- **Check the page at 390x844 after any layout change.** Compare
  `documentElement.scrollWidth` with `clientWidth`; anything wider is a
  horizontal-overflow bug.

## Still outstanding

- **The Netlify site.** Not connected yet — point a new site at this repo, root
  base directory, `main` as production. No environment variables are needed:
  ESPN's public API takes no key.
- **A sitemap**, once the live URL is known. `robots.txt` already allows
  everything.
- **More statistics.** Adding one is a line in the right category in
  `netlify/functions/_lib/metrics.mjs` — a label, the ESPN category and stat
  name, and which direction is better. Nothing else needs touching; the API and
  the page both build themselves from that list.
- **More than three clubs.** Adding one is an entry in `TEAMS` in
  `netlify/functions/_lib/espn.mjs` — id, abbreviation, lowercase slug, every
  abbreviation the franchise has used, and fallback colours. Nothing else is
  hardcoded to three, though the comparison tables get tight past four columns.
