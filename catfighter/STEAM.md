# Putting it on Steam

Electron games ship on Steam routinely, so there is nothing unusual about this
one. What follows is the whole path, in order, with the costs stated plainly.

---

## What it costs and how long it takes

| Step | Cost | Time |
|---|---|---|
| Steamworks account | free | a day or two to be approved |
| App fee, per game | **$100 USD**, one-off, refundable against $1,000 of sales | — |
| Store page review | free | 1–5 working days |
| Build review | free | 1–5 working days |
| Mandatory wait after the store page goes live | — | **2 weeks minimum** before you may release |

So from a standing start: about a month, and $100.

---

## 1. Set up the account

1. Sign up at <https://partner.steamgames.com>.
2. Complete the tax and banking forms. This is the slow part — Valve will not
   let anything go live until they are done, and they need a real bank account
   and tax identification.
3. Pay the $100 app fee. You get an **AppID** — a number like `3210987`. Write
   it down; everything else refers to it.

## 2. Build the game

```
cd catfighter
npm install
npm run dist:win
```

Steam wants the **unpacked folder**, not the installer — Steam does its own
installing. Use:

```
npm run pack
```

which leaves a ready-to-upload folder at `catfighter/dist/win-unpacked/`.

## 3. Upload it

Steam uploads through a tool called **SteamPipe**, which comes in the
Steamworks SDK.

1. Download the SDK from the Steamworks site.
2. In `tools/ContentBuilder/scripts/`, make an app build script:

```
"appbuild"
{
  "appid"    "YOUR_APPID"
  "desc"     "Cat Fighter II 0.1.0"
  "buildoutput" "..\\output\\"
  "contentroot" "..\\content\\"
  "setlive"  ""
  "depots"
  {
    "YOUR_DEPOTID"
    {
      "FileMapping" { "LocalPath" "*" "DepotPath" "." "recursive" "1" }
    }
  }
}
```

3. Copy the contents of `dist/win-unpacked/` into `tools/ContentBuilder/content/`.
4. Run:

```
steamcmd.exe +login YOUR_ACCOUNT +run_app_build ..\scripts\app_build.vdf +quit
```

5. In the Steamworks dashboard, set the launch executable to
   `Cat Fighter II.exe` and push the build to a branch.

## 4. Store page

You will need, at minimum:

- **Capsule art** in several sizes — 616×353, 460×215, 231×87, 374×448 and a
  1438×810 header. This is the fiddliest part of the whole process.
- **Five screenshots** at 1920×1080.
- A short description and a long description.
- A trailer is optional but the store algorithm strongly favours having one.

The screenshots are easy: run the game fullscreen and press Print Screen. The
capsule art is the real work, and is worth doing properly — it is the only
thing most people ever see.

## 5. Release

Once the store page is approved it must sit live for **two weeks** before you
are allowed to press release. Use that fortnight to fix whatever the build
review flags.

---

## Controllers on Steam

Nothing needs doing. The game reads controllers through the standard gamepad
interface, and Steam Input presents an Xbox, PlayStation or Switch pad to the
game in exactly that shape. An Xbox pad works with no configuration at all,
and a DualSense or a Switch Pro controller is handed over already translated.

Two things worth setting on the Steamworks store page when you get there:

- Tick **Full Controller Support** in the app's controller settings. It puts
  the game in front of Steam Deck and living-room users, who filter on it.
- Upload a **controller configuration** if you want the button prompts in the
  Steam overlay to match. The default gamepad template is already correct for
  this layout, so this is polish rather than a requirement.

The game also rumbles, which Steam Input passes through untouched.

## Optional: the Steam overlay and achievements

The game does not need the Steamworks API to run on Steam — it will launch and
play perfectly well without it. Two things need it:

- **Shift+Tab overlay** — works out of the box for most Electron apps, but is
  more reliable when the API is initialised.
- **Achievements, cloud saves, the friends list.**

If you want those, add [`steamworks.js`](https://github.com/ceifa/steamworks.js):

```
npm install steamworks.js
```

Then in `electron/main.js`, after `app.whenReady()`:

```js
const steamworks = require('steamworks.js');
const client = steamworks.init(YOUR_APPID);
steamworks.electronEnableSteamOverlay();
```

and expose whatever you need through `electron/preload.js`. That file is
already set up as the bridge and currently exposes nothing, which is
deliberate — see the comment in it.

Achievements worth having, once the real cats are in: win a round without
taking a hit, land a super, clear arcade with every cat, get a double KO.

---

## An honest word about whether to

Steam is the right home if the game is going to be sold or given to strangers.
It handles installation, updates, refunds and the thousand different Windows
configurations out there.

If the real audience is family, friends and guests at the farmhouse, the
portable zip from [BUILD-WINDOWS.md](BUILD-WINDOWS.md) does the same job for
free and today — unzip, double-click, play. It even runs off a memory stick,
which is a rather good thing to leave in the game barn.
