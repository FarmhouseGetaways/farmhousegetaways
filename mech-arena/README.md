# Mech Arena

A Roblox battle arena. Designed by Legend.

You spawn as an ordinary avatar — quick, weak, easy to kill. Mech suits stand
around the field, empty. Reach one, climb in, and you are a walking war machine
until somebody breaks the suit off you. Then you are on foot again, looking for
the next one.

## Getting it running

You need Roblox Studio. There is no build step and nothing to install.

**1 — Start a clean place.** File > New. If you are reusing the old place,
File > New anyway; the script builds the whole map itself and will fight
whatever is already there.

**2 — Paste the server script.**
In the Explorer, right-click **ServerScriptService** > Insert Object > Script.
Delete the line it comes with, then paste in the whole of
[`src/MechArena.server.lua`](src/MechArena.server.lua).
Click in the editor, Ctrl+A, Ctrl+V.

**3 — Paste the aim script.**
Right-click **StarterPlayer > StarterPlayerScripts** > Insert Object >
LocalScript. Paste in the whole of
[`src/MechAim.client.lua`](src/MechAim.client.lua).

This one is optional. Without it everything still works, the mechs just fire
straight ahead instead of where you are pointing.

**4 — Two settings the script cannot set for you.**

| Where | Set it to | Why |
|---|---|---|
| Lighting > Technology | **Future** | Real shadows, and the neon trim actually glows |
| Game Settings > Avatar > Rig Type | **R15** | The rig the script is built around |

**5 — Press Play.** You will land on the concrete pad in the middle with ten
mechs standing around you. Run into one.

## How it plays

- **Walk into a mech** to pilot it.
- **Click** to fire. Hold to keep firing.
- **Walk into a different mech** to swap suits. Your health resets to the new
  suit's maximum.
- **Walk into the same type** you are already wearing to repair back to full.
- **Drop below a quarter health** and the suit blows apart. You are back on foot
  at 100 health, and whoever broke it gets the KO.
- Claimed mechs come back where they stood after **20 seconds**, so the field
  never runs dry.

## The three suits

| | Scout | Laser | Heavy |
|---|---|---|---|
| Health | 320 | 500 | 850 |
| Walk speed | 30 | 22 | 15 |
| Jump | 80 | 65 | 45 |
| Weapon | Twin arm miniguns | Shoulder laser cannon | Quad rocket pods |
| Damage | 8 a shot, very fast | 60 a shot, slow | 85 plus splash |
| Feels like | Get there first, stay moving | The all-rounder | Slow, brutal, hard to kill |

## Checking a change

```
tests/run.sh
```

Compiles both scripts and runs the ground-contact checks. No Roblox needed. It
downloads the Luau compiler on first run and takes a few seconds.

Worth running after touching any of the geometry — see
[`CLAUDE.md`](CLAUDE.md) for why that particular thing is guarded.

## What is not built yet

Rounds and a winner, teams, cover on the field, and sound. See
[`SPEC.md`](SPEC.md) for the full design and where it is heading.
