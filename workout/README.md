# Carissa's workout tracker

An installable web app at **/workout/** on the Farmhouse Getaways site. Seven
days of the week, a workout on each, a video for every exercise, a big button
for finishing a set, and a record of everything ever done.

Plain HTML, CSS and three JavaScript modules. No framework, no build step, no
npm. Open the folder through any web server and it runs.

    python3 -m http.server 8099
    # then http://127.0.0.1:8099/workout/

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

Sign in — **Settings → Sign in** — with the same password as the website's
editor at `/edit.html`, which is `ADMIN_PASSWORD` in Netlify. Then every day
gets an **Edit this day** button, and Settings grows a grid of all seven.

Per day: a title, a description, and an estimated time (leave it empty and the
app works it out from the sets and the rests). Per exercise: the name, the
video, **sets from 1 to 10**, reps or time as free text — "12", "45 seconds",
"to failure" are all fine — the rest between sets in seconds, an effort level
that drives the calorie estimate, and notes shown to her while she does it.
Exercises can be reordered and removed. **Make it a rest day** clears one.

Saving commits `workout/data/plan.json` to the repository and Netlify rebuilds,
so the change is on every device in about thirty seconds.

## Where things are stored

**The plan** — `workout/data/plan.json`, committed to this repository by
`netlify/functions/workout.mjs` when you press Save. It is a list of exercises,
it is not private, and it has to be shared: written on one device and followed
on another.

**The record** — this browser, and only this browser, unless somebody
deliberately turns sync on.

That default is not laziness. **FarmhouseGetaways/farmhousegetaways is a public
repository.** Committing a training log to it would publish dates, sets,
minutes and a body weight under a person's name, for as long as she keeps
training, and the site being hidden from Google would not change that. So the
record stays on her phone, the app says so plainly in Settings, and the CSV
download means nothing is trapped there.

To turn sync on — **only once the repository is private**, or once the store
has been moved somewhere private — set one variable in Netlify:

    WORKOUT_HISTORY_SYNC = on

Then redeploy. The record then commits to `workout/data/history.json` and
appears on every signed-in device. `netlify.toml` already refuses to serve that
path over the web, so even with sync on the file is not readable from the site
itself — but on a public repository it would still be readable on GitHub, which
is the whole point of the switch.

Reading the plan needs no password. Reading the record needs one, and needs
sync to be on.

## Set-up

Nothing, if the site already has the website editor working: it uses the same
two variables.

| Variable | What for |
|---|---|
| `ADMIN_PASSWORD` | Signing in. Without it nobody can write, the owner included — it fails closed |
| `GITHUB_TOKEN` | Contents: read and write on this repository, so the plan can be saved |
| `WORKOUT_HISTORY_SYNC` | Optional, and off unless it says `on`. See above |

Environment variables only reach the code on the next build, so a **Deploys →
Trigger deploy** is needed after adding one.

With neither variable set the app still works completely — it keeps everything
in the browser and says so at the top of the week.

## On a phone

It is installable. iPhone: Share, then **Add to Home Screen**. Android: the
menu, then **Install app**. It then opens without browser chrome, keeps the
screen awake during a workout, and works in a gym with no signal — the shell is
precached and the plan is already in the browser. A workout done offline is
logged locally and goes to the server on its own when there is a connection
again, if sync is on.

## What is in here

    index.html                the shell — everything else is rendered into it
    css/workout.css           all of the styling
    js/catalog.js             effort levels, the calorie maths, video links, formatting
    js/store.js               the plan and the record: load, save, sync, the numbers
    js/app.js                 the six screens and the one click handler
    data/plan.json            the published week
    icons/                    app icons, generated from icons/favicon.svg
    manifest.webmanifest      makes it installable
    sw.js                     the offline cache — bump VERSION when the file list changes

    ../netlify/functions/workout.mjs        the only server there is
    ../netlify/functions/_lib/workout.mjs   the shape of the data and the rules about it

Run the tests after touching anything under `_lib/`:

    node --test netlify/functions/_lib/*.test.mjs

Plain Node, nothing to install.
