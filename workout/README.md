# Carissa's workout tracker

An installable web app: seven days of the week, a workout on each, a video for
every exercise, a big button for finishing a set, and a record of everything
ever done.

**It is its own site, not part of the Farmhouse Getaways website.** The folder
lives in this repository, but the root `netlify.toml` deliberately 404s
`/workout/*` on farmhousegetaways.com — this is deployed as a separate Netlify
site pointed at the same repository with the base directory set to `workout`.
See *Deploying*, below.

Plain HTML, CSS and three JavaScript modules, with three small Netlify
functions behind them. No framework and no build step; the one dependency,
`@netlify/blobs`, is used by the functions and never reaches the browser.

    cd workout && python3 -m http.server 8099
    # then http://127.0.0.1:8099/

Opened that way there is no server, so the app runs from the committed plan and
this browser — which is the same thing that happens to a phone in a gym with no
signal, and worth seeing.

## What it does

**The week.** Seven day cards. Today's is the big one at the top, with the
title, how long it should take, and a button that starts it. A day with no
exercises reads as a rest day rather than as an empty card.

**The workout.** One exercise at a time. The video plays at the top; the name,
the reps and any notes sit under it; the sets are laid out as pills — done ones
in green with the time each took, the current one in pink, the rest queued. The
only large button on the screen says **Set complete**, and it is at the bottom
where a thumb is. Press it and the rest timer takes over the screen and counts
down; when it reaches nought it beeps, buzzes, and the next set is live. When
the last set of an exercise is done the app moves to the next one by itself and
says which. When the last exercise is done the workout finishes and is logged.

She can skip an exercise, pause, or finish early. Finishing early logs what was
actually done and marks it *part done*. Finishing with nothing done logs
nothing at all — a nought in a record meant to be encouraging is worse than no
row.

**Nothing is lost.** The workout in progress is written to the browser on every
single set, so a locked phone, a dropped call, a closed tab or a flat battery
costs nothing: reopening the app offers to carry on where she left off.

**The record.** Every finished workout with its date, time, sets, per-exercise
breakdown and a calorie estimate. A day streak, a week strip, totals, and a CSV
download.

**Calories** are estimated with the standard MET equation —
`MET × 3.5 × body weight in kg ÷ 200` per minute — using the values from the
2011 Compendium of Physical Activities. What makes it better than a flat guess
is that it is fed by measured time: the app knows how long each set actually
took and how long the rests actually were, so twenty minutes and forty minutes
over the same sets do not come out the same. Working time is charged at the
exercise's own effort level, rest at a standing-about rate, and anything
unaccounted for at nothing. Set the body weight in Settings. It is stored with
each workout, so changing it does not rewrite the past. It is an estimate and
the app says so on screen.

## Videos

Paste a link into the **Video** field in the editor. Five kinds are understood:

| What you paste | What happens |
|---|---|
| A YouTube link — `youtu.be/…`, `watch?v=…`, `/shorts/…` | Plays in the app, muted and looping |
| A Vimeo link | Plays in the app |
| A Google Drive share link | Turned into a `/preview` embed and played in the app |
| A file — `.mp4`, `.webm`, `.mov` | Plays in the app, and works with no signal once seen |
| Anything else | Offered as a link rather than a broken player |

The simplest way to host your own is to drop the file into `workout/videos/`
and put `videos/name.mp4` in the field. Keep them small — a phone in a gym is
on a poor connection, and every megabyte is hers to download. Anything much
over 10 MB belongs on YouTube as an unlisted video instead of in the repository.

## Editing the week

Sign in — **Settings → Sign in** — with `WORKOUT_PASSWORD`. Then every day gets
an **Edit this day** button, and Settings grows a grid of all seven.

Per day: a title, a description, and an estimated time (leave it empty and the
app works it out from the sets and the rests). Per exercise: the name, the
video, **sets from 1 to 10**, reps or time as free text — "12", "45 seconds",
"to failure" are all fine — the rest between sets in seconds, an effort level
that drives the calorie estimate, and notes shown to her while she does it.
Exercises can be reordered and removed. **Make it a rest day** clears one.

Saving writes to the store and is live on every device on their next load. No
committing, no deploy.

## Where things are stored, and who can read what

Two Netlify Blobs belonging to this site alone. Not files in this repository —
`FarmhouseGetaways/farmhousegetaways` is **public**, and a training log is not.

| | Read | Write |
|---|---|---|
| **The week** (`/api/plan`) | anyone — it is a list of exercises, and the app has to show the week before anybody signs in | the password |
| **The record** (`/api/history`) | the password | the password |

`data/plan.json` stays committed as the floor underneath: if the store has
never been written, or is wiped, the app falls back to it rather than to a
blank week. It is imported by the function rather than fetched, so there is no
network call to fail silently in production.

**How signing in works.** The password lives in a Netlify environment variable
and is compared on the server. Signing in sets an `HttpOnly` session cookie —
the page's own JavaScript cannot read it, and nor can anything else that ends
up running on the page — which is a signed, expiring token, not the password
itself. Every write and every read of the record checks that cookie
server-side, so a visitor editing the page in dev tools changes what *they* see
and nothing else. Ten wrong guesses from one address inside fifteen minutes and
that address waits.

With `WORKOUT_PASSWORD` unset, signing in is impossible, every write is refused
and the record cannot be read. **A misconfigured site is a read-only site,
never an open one.**

The app works completely with no server at all — the committed week, the
browser, and a whole workout logged offline, which goes up on its own when
there is a connection again. That fallback is not a nicety; it is the normal
state of a phone in a garage.

## Deploying

Its own Netlify site, separate from the Farmhouse Getaways one in the
repository root:

1. Netlify → **Add new site** → *Import an existing project* → this repository.
2. **Base directory:** `workout`
3. **Build command:** leave empty
4. **Publish directory:** `workout`
5. **Environment variables** → add:

       WORKOUT_PASSWORD = whatever you want to type to edit the week and see the record

   Optionally `WORKOUT_SESSION_SECRET` (any long random string). Without it the
   signing key is derived from the password, which means changing the password
   signs every device out — usually what you want anyway.

6. Deploy. Then *Domain management* if it should have a name of its own.

Netlify installs `package.json` so the functions can import `@netlify/blobs`;
there is no build step for the site itself. Blobs storage needs nothing turned
on.

**A deploy must happen after setting the password.** Environment variables are
read when the functions are built, so a site deployed before the variable
existed stays read-only until it is redeployed.

## On a phone

It is installable. iPhone: Share, then **Add to Home Screen**. Android: the
menu, then **Install app**. It then opens without browser chrome, keeps the
screen awake during a workout, and works in a gym with no signal — the shell is
precached and the plan is already in the browser. A workout done offline is
logged locally and goes to the server on its own when there is a connection
again.

## What is in here

    index.html                the shell — everything else is rendered into it
    css/workout.css           all of the styling
    js/catalog.js             effort levels, the calorie maths, video links, formatting
    js/store.js               the week and the record: load, save, sync, the numbers
    js/app.js                 the six screens and the one click handler
    data/plan.json            the committed week — the floor under the live one
    icons/                    app icons, generated from icons/favicon.svg
    manifest.webmanifest      makes it installable
    sw.js                     the offline cache — bump VERSION when the file list changes
    netlify.toml              this folder's own site config
    package.json              one dependency: @netlify/blobs, for the functions

    netlify/functions/auth.mjs       signing in, out, and the lockout
    netlify/functions/plan.mjs       the week: public to read, password to write
    netlify/functions/history.mjs    the record: password to read and to write
    netlify/functions/_lib/auth.mjs  the password, the cookie, the stores
    netlify/functions/_lib/data.mjs  the shape of the data and every clamp

Run the tests after touching anything under `_lib/`:

    node --test workout/netlify/functions/_lib/*.test.mjs

Plain Node, nothing to install.
