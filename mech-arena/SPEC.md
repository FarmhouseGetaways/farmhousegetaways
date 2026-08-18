# Mech Arena — design spec

Designer: Legend
Platform: Roblox Studio (Luau)

Originally written as a Google Doc. Kept here so the design and the code move
together. Sections 1–6 are Legend's; sections 7 onward record what has actually
been built.

## 1. Concept

An open-field battle arena. Mech suits stand scattered across the map, unmanned.
Players spawn as ordinary avatars — weak, fast, vulnerable. They race to reach a
mech, climb in, and become a walking war machine.

The core tension: players on foot are hunting for a suit while players in suits
are hunting them. Everyone is either scrambling or dominating, and the state can
flip at any moment.

Scoring is knockouts. Last-player-standing rounds are a possible later addition.

## 2. Core loop

- Spawn on the central pad as a default avatar
- Run across open ground toward a visible mech
- Touch the mech to pilot it
- Fight other players
- Take enough damage and the suit breaks apart — you are back on foot
- Find another mech

Mechs respawn at their original position 20 seconds after being claimed, so the
map never runs dry.

## 3. Mech types

**SCOUT** — green, lime trim. Twin arm-mounted miniguns.
Health 320, walk speed 30, jump 80.
Fast, fragile, first to reach contested suits.

**LASER** — navy, orange trim. Shoulder-mounted laser cannon.
Health 500, walk speed 22, jump 65.
Balanced all-rounder.

**HEAVY** — dark red, grey trim. Quad rocket launchers, back-mounted.
Health 850, walk speed 15, jump 45.
Slow, brutal, hard to kill.

Each type carries a glowing accent colour — neon parts with point lights — so it
reads at a distance.

## 4. Map

- 450 x 450 stud grass field, flat
- Central concrete spawn pad, 24 x 24, elevated
- 10 mech spawn points, a ring of six at radius 160 and a cross of four at 80
- No mech at world origin — that overlaps the spawn pad and was causing players
  to start pre-equipped
- Daytime lighting, ClockTime 14, light fog for depth

## 5. Rules

**Suit switching.** Walking into a different mech strips the current suit and
equips the new one. Health resets to the new suit's maximum.

**Same-type pickup.** Walking into a mech of the type already worn refills
health rather than re-equipping.

**Suit destruction.** When health drops below 25 percent of the suit's maximum,
the mech is stripped automatically and the player returns to their normal avatar
at 100 health.

**Leaderboard.** A KOs counter per player, in the standard leaderstats folder.

## 6. Technical approach

Mech construction uses a shared blueprint function returning a list of part
specifications — size, offset from the root, colour, material, shape, rotation.
The same blueprint feeds two consumers:

- `buildStatue()` — anchored parts assembled into a Model standing in the field
- `equipMech()` — unanchored parts welded to the player's HumanoidRootPart

When a player equips a mech their avatar is not scaled up. Every body part,
decal and texture is set to full transparency and the mech is welded on in its
place. The player is piloting the mech, not wearing armour over a human body.

Collision proxy: HumanoidRootPart is resized to 6 x 2 x 3 so the mech has a
body-appropriate hitbox.

## 7. Ground contact — the floating bug, and how it was settled

Mechs used to hover above the ground. The hip height was a hand-written number,
so any change to the legs silently broke it, and it had been derived from a
per-type height that did not match the actual leg geometry.

It is no longer a number anybody types. `boundsOf()` walks all eight corners of
every part through that part's own rotation and finds where the geometry
actually ends. `hipHeightFor()` then returns:

```
-bounds.min.Y - (ROOT_SIZE.Y / 2)
```

which is exactly the gap an R15 `Humanoid.HipHeight` describes — ground to the
underside of the HumanoidRootPart. Move the legs and ground contact follows on
its own.

For the current blueprint the feet sit at local y = -7 and every type comes out
at HipHeight 6. **That matches the value the last version was using**, which
says the geometry was never the problem — the number was right and was not
reaching the humanoid, or was being recomputed against it. It is now set
explicitly on equip, with `AutomaticScalingEnabled` turned off so nothing
overwrites it.

`tests/run.sh` runs this maths outside Roblox and fails if the feet stop landing
where they should.

## 8. On the Toolbox pivot

The Google Doc recommended sourcing pre-built mechs from the Roblox Toolbox to
escape the offset maths, and noted the safety problem: free models can carry
malicious scripts.

**That pivot was not taken, and is no longer needed.** The offset maths was only
dangerous while it was unmeasured — the fix in section 7 removes the class of
bug rather than the code that had it. Code-built mechs keep everything in one
pasteable script, cost nothing to change, and bring no third-party scripts into
the place.

The advice stands if it is ever revisited: filter to models published by Roblox
itself, and expand anything downloaded in the Explorer and delete Script objects
you do not recognise.

## 9. Weapons

Built. Every type fires and deals damage, and KOs are credited.

| | Fire rate | Damage | Behaviour |
|---|---|---|---|
| SCOUT | every 0.09s | 8 | Hitscan, 2.5 degrees of spread, thin tracer |
| LASER | every 0.95s | 60 | Hitscan, no spread, thick beam |
| HEAVY | every 1.6s | 85 | Rocket travelling at 190 studs/s, 16-stud splash with falloff |

Aiming is done by a small LocalScript that reports the cursor position about
twenty times a second. Firing is a handle-less `Tool`, whose `Activated` and
`Deactivated` events reach the server without a remote of their own — so a click
still fires even if the aim script is missing, just straight ahead. All damage
is decided on the server; the client only ever suggests a direction.

**KO crediting.** Every point of damage records its attacker against the victim
with a timestamp. A KO is awarded when a suit is destroyed, and when a player on
foot is killed, to whoever damaged them within the last 10 seconds. Destroying a
suit counts because that is the main combat event — players on foot rarely die.

## 10. Still to build

- Round system with a timer and a winner
- Teams
- Cover objects and terrain variation on the field
- Sound: footsteps that get heavier by mech class, weapon fire, suit destruction
- Health bar UI showing current suit and remaining integrity

## 11. Working notes

- Full script pasted in one block, Ctrl+A then Ctrl+V over the whole editor.
  Partial edits and find-the-line instructions proved too error-prone.
- Lighting Technology must be set to **Future** by hand for real-time shadows
  and working neon glow. It is not scriptable.
- Avatar type must be **R15**.
