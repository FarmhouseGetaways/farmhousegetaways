# Getting Cat Fighter II onto Steam

Written 21 Aug 2026. Valve moves the details around — treat the money and the
waiting periods as "check this on the partner site", not as gospel.

## Before Steam: put it in front of people

Steam charges per title and makes you wait a month. **itch.io is free and
takes about ten minutes**, and it will host the same `dist/win-unpacked` zip
or even the single-file `dist/catfighter-bundle.html` to play in a browser.
If the point right now is to find out whether the game is any good, do that
first. Steam is for selling it, not for testing it.

## What Steam needs from us

1. **A Steamworks partner account** at partner.steamgames.com. Individual is
   fine — it does not have to be a company. Expect to hand over identity
   verification, a tax form (W-9 in the US), bank details for payment, and a
   digital signature on the distribution agreement. Payment details have to
   clear before anything else moves.

2. **The Steam Direct fee — $100 per title.** It comes back to you once the
   game has made $1,000 in adjusted gross revenue. One fee per app, so this is
   $100 for Cat Fighter II specifically.

3. **A thirty-day wait.** Valve will not let an app release until thirty days
   after the fee is paid. It exists to stop people spraying junk onto the
   store, and there is no way around it, so pay early if there is any date in
   mind.

4. **A store page, live as "Coming Soon", for at least two weeks** before
   release. Valve reviews the page separately from the build and will send it
   back over small things, so leave more room than you think.

5. **Store artwork, at sizes Valve is strict about.** Roughly:

   | Asset | Size |
   |---|---|
   | Header capsule | 460 × 215 |
   | Small capsule | 462 × 174 |
   | Main capsule | 616 × 353 |
   | Vertical capsule | 374 × 448 |
   | Library capsule | 600 × 900 |
   | Library hero | 1920 × 620 |
   | Library logo | 1280 × 720, transparent |
   | Page background | 1438 × 810 |
   | Screenshots | 1920 × 1080, at least five |

   A trailer is optional and worth far more than it costs. **All of this can
   be rendered by the game itself** — the character cards, the stages and the
   cats are all drawn in code at whatever size you ask for, so the capsules
   can be generated rather than drawn by hand, and they will always match what
   the game actually looks like.

6. **The content survey and age rating questionnaire.** Quick, but it gates
   the page going live.

7. **A build, uploaded through SteamPipe.** See below.

## Uploading a build

Steam ships a **folder**, not an installer. The NSIS `.exe` the GitHub Action
produces is for handing to somebody directly; Steam wants the unpacked
directory.

```
cd catfighter
npm install
npm run dist:steam        # leaves dist\win-unpacked
cd steam
steamcmd +login <partner-account> +run_app_build ..\steam\app_build.vdf +quit
```

`steam/app_build.vdf` and `steam/depot_windows.vdf` are already written and
commented. Both carry placeholder IDs — Valve gives you a real App ID and
Depot ID when the app is created, and those two numbers are the only things
that need filling in. `setlive` is deliberately left empty so a build uploads
without going live; publish it from the Steamworks page instead.

Valve then reviews the build. It is a functional check rather than a taste
test — does it launch, does it do what the page says — and it usually takes a
few working days.

## Things about this build in particular

**It is 193 MB, and the game is 332 KB.** All of the rest is Electron, which
is a whole copy of Chromium. That is fine on Steam and plenty of shipped games
do it, but if the size ever matters, the game is a single self-contained HTML
file and would run just as well inside a WebView2 shim on Windows — a few
megabytes rather than nearly two hundred. Worth doing before launch, not
after: changing the shipping vehicle after release means every player
re-downloads.

**The Steam overlay will probably not work.** It hooks the graphics API, and
Chromium's compositor does not cooperate. In practice that means no Shift+Tab
overlay in-game, no Steam screenshots with F12, and no overlay-based purchases
or invites. Nothing else breaks. Worth saying on the store page rather than
letting people find out.

**Controllers should just work, but configure Steam Input anyway.** The game
reads the browser Gamepad API, and Steam Input presents pads as XInput
devices by default, so an Xbox controller will be recognised. Publishing an
official Steam Input configuration is what gets you the "Full Controller
Support" tag and lets people rebind without touching the game.

**The build is unsigned.** Steam delivers its own files so this does not
matter on Steam, but it very much matters if you hand the `.exe` to a friend —
Windows SmartScreen will tell them it is dangerous. A code-signing certificate
is a few hundred dollars a year and is only worth it if you plan to distribute
outside Steam.

**The version is still 0.1.0**, in `package.json`. Bump it before any build
you intend to keep, because Steam build lists get confusing fast otherwise.

## What is optional

The Steamworks SDK is **not** required to ship. You need it only for
achievements, cloud saves, leaderboards, rich presence, or the Steam Input
rebinding UI. The game currently uses none of those, and adding the SDK to an
Electron app means a native module, which is real work. Ship without it, add
it later if the game earns it.
