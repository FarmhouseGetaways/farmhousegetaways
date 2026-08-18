# Working on Mech Arena

Read this first. It is the handover between sessions.

## What this is

A Roblox battle arena game, designed by **Legend**. Two Luau scripts, no build
step, no dependencies. `SPEC.md` is the design; `README.md` is how to get it
into Studio.

Separate from the Farmhouse Getaways website — different repo, different job.
Nothing here touches that site.

## How it reaches the game

There is no deploy. Somebody pastes the script into Roblox Studio by hand:

```
edit src/MechArena.server.lua  ->  commit  ->  paste the whole file into
the Script in ServerScriptService (Ctrl+A, Ctrl+V)  ->  press Play
```

**This is why the whole game is one file.** Legend works by selecting all and
pasting over the entire editor contents. Partial edits and "change the line that
says X" instructions were tried and proved too error-prone. So:

- **Never split the server script into ModuleScripts.** It would be correct
  engineering and it would break the only workflow that works.
- **Never hand back a fragment** and ask for it to be pasted somewhere in the
  middle. Hand back the whole file, every time.
- The one exception already made is `src/MechAim.client.lua`, which has to be a
  LocalScript because it reads the mouse. It is deliberately tiny, and the game
  runs without it.

## The bug that keeps coming back

**Mechs floating above the ground.** It has bitten this project repeatedly, and
every time the cause was the same shape of mistake: a hip height typed in by
hand, next to geometry that had moved.

It is now measured, not typed. `boundsOf()` walks all eight corners of every
part through its own rotation to find where the mech actually ends, and
`hipHeightFor()` derives `Humanoid.HipHeight` from that. See `SPEC.md` section 7.

**So the rule is: never reintroduce a hand-written height constant.** If a mech
sits wrong, the answer is in the blueprint offsets or in whether HipHeight is
reaching the humanoid — not in a fudge factor.

Two things that will silently undo the fix:

- `Humanoid.AutomaticScalingEnabled` left on. It recomputes HipHeight and throws
  the derived value away. `equipMech()` turns it off.
- Setting HipHeight before the mech parts are welded on.

Run `tests/run.sh` after touching any geometry. It compiles both scripts and
checks the feet still land at y = -7 with HipHeight 6, outside Roblox, in a few
seconds.

## Things in the code that look wrong but are not

- **The equipped mech is a `Folder`, not a `Model`.** Deliberate. Damage
  resolves with `FindFirstAncestorOfClass("Model")` from whatever a shot hit; if
  the mech were a Model that call would stop at the mech instead of reaching the
  character, and nobody would ever take damage.
- **The weapon is a handle-less `Tool`.** `Tool.Activated` fires on the server
  when the player clicks, which is how firing works without a remote of its own,
  and why a click still fires when the aim LocalScript is missing.
- **Statue hitboxes have `CanQuery = false`.** They are big invisible boxes for
  touch detection. Left queryable, they would swallow shots aimed past a mech.
- **`breakSuit()` calls `explosionEffect()`, not `detonate()`.** `detonate()`
  applies damage, and a zero-damage blast would overwrite the damage log and rob
  the attacker of the KO they just earned.
- **No mech spawns at world origin.** That is the player spawn pad. A mech there
  handed everybody a suit the moment they joined.

## Balance numbers, and where they have to agree

Health, walk speed and jump appear in three places: the `MECHS` table in
`src/MechArena.server.lua`, the table in `README.md`, and section 3 of
`SPEC.md`. Change one and change all three, or the docs start lying.

Current: Scout 320/30/80, Laser 500/22/65, Heavy 850/15/45.

## Two settings no script can set

- **Lighting > Technology = Future.** Not scriptable. Without it there are no
  real shadows and the neon trim does not glow, which is most of the look.
- **Avatar > Rig Type = R15.** The rig the script assumes.

If somebody says the mechs look flat or dull, ask about Technology before
touching any code.

## Open questions

- **Rounds.** The spec calls last-player-standing a possible later addition and
  does not settle it. Ask before building a round system.
- **Teams.** Listed as later work, no design yet.
- **Whether destroying a suit should be worth a KO.** It currently is, because
  players on foot rarely die and otherwise the counter would barely move. Worth
  confirming with Legend — it is a design call, not a technical one.

## Who this is for

Legend is the designer. Write for someone who knows what they want the game to
feel like and is working in Studio, not in a terminal. Explain a change in terms
of what it does in the game, and hand over the whole file to paste.
