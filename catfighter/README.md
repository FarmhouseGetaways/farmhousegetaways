# Cat Fighter II — The Farmhouse Warriors

A six-button arcade fighting game in the mould of Street Fighter II, with six
cats instead of six martial artists.

**The roster is the six real cats.**

| Cat | Class | Specials |
|---|---|---|
| **GRACIE — The Elder** | Medium | Growl of Energy, Tail Whip |
| **MARIO — The Immovable** | Heavy | Belly Bump, The Smother |
| **LUIGI — The Twin** | Light | Flying Body Attack, Leg Sweep |
| **LILLY — The Acrobat** | Light | Flip Attack, Crane Kick |
| **FIGURO — The Boxer** | Medium | Rapid Paws, Cut and Run |
| **RUBY — The Jaw** | Heavy | Crushing Bite, Flip Kick |

Every super is marked with an asterisk in [MOVES.md](MOVES.md) — those were
invented rather than given, and are the first thing to change.

## Weight classes

The trade the whole roster is built on:

| Class | Takes | Stun | Knockback | In exchange |
|---|---|---|---|---|
| **Light** | 15% more damage | rattles easily | flies further | fastest walk, biggest jump |
| **Medium** | baseline | baseline | baseline | no bad matchups |
| **Heavy** | **14% less damage** | hard to stun | barely moves | slowest, most health |

A heavy cat is hard to hurt and hard to shift but takes a while to arrive. A
light one is all over you until she gets caught, at which point she folds.
It shows on the select screen, and tests hold it true in both directions so a
later balance tweak cannot quietly undo it.

Across 180 CPU-vs-CPU matches — every pairing, six random seeds — the roster
sits between **48% and 53%** win rate. Nobody is a trap pick.

Replacing one is three blocks of plain data in `src/characters.js` — see
[Making it your cats](#making-it-your-cats) below.

---

## Playing it right now

**In a browser.** Open `index.html`. That is the whole installation. It works
from a double-click, no server and no build step.

**As one file you can send someone.** `node tools/bundle.mjs` inlines every
script and the stylesheet into a single ~295 KB HTML file with no external
requests at all — no fonts, no images, no audio files, because there aren't
any. Mail it, drop it on a memory stick, or open it straight from Downloads.

**As a Windows program.** See [BUILD-WINDOWS.md](BUILD-WINDOWS.md). The short
version: GitHub → Actions → *Cat Fighter II (Windows)* → **Run workflow**, and
download the `.exe` when it finishes. You do not need anything installed on
your machine to get a build.

**On Steam.** See [STEAM.md](STEAM.md).

---

## Controls

Two schemes. **SIMPLE** is the default; **CLASSIC** is the original arcade
layout, and you switch between them under Options.

### SIMPLE — four buttons

| Xbox | Does |
|---|---|
| **X** | Punch |
| **B** | Kick |
| **A** | Jump |
| **Y** (or LB) | Block |
| **LT** | Dodge — an invincible hop away |
| **RT** | Lunge — a fast advance |

Specials are two buttons pressed together:

| Together | Does |
|---|---|
| **PUNCH + KICK** | special 1 |
| **PUNCH + BLOCK** | special 2 |
| **KICK + BLOCK** | throw |
| **LT + RT** | super, on a full meter |

Hold **forward** with a special for the heavy version.

Because Jump is a button, **up on the stick is free** — which is what gives
eight ground normals out of two attack buttons:

| Input | Move |
|---|---|
| PUNCH / forward / down / up | jab · heavy punch · low punch · rising claw (anti-air) |
| KICK / forward / down / up | quick kick · roundhouse · sweep · side kick |

**Block is a real button**, so you can guard while walking forward. Add down
for a low block. There is still no air blocking.

A normal comes out with **no input delay at all** — if the second button of a
pair lands a frame or two late, the normal is swapped for the special while it
is still in startup, so nothing has come out yet and being slightly late costs
nothing.

Keyboard 1P: `A D` move, `S` crouch, `W` up, `J` punch, `K` kick, `SPACE`
jump, `L` block, `U` dodge, `I` lunge.
Keyboard 2P: arrows, numpad `4` punch, `5` kick, `0` jump, `6` block,
`7` dodge, `8` lunge.

### CLASSIC — six buttons

The arcade layout: `LP MP HP` over `LK MK HK`, hold back to block, up to jump,
quarter-circles, dragon punches and charge moves. Nothing was thrown away when
the simple scheme arrived — see [MOVES.md](MOVES.md) for the motion list.

`F1` toggles the hitbox display. `F11` is fullscreen. Two controllers give you
two players, assigned in the order they were plugged in. The pad rumbles.

---

## The moves

Every cat has the full eighteen normals (six standing, six crouching, six in
the air), both throws, and their own specials and super. The complete list with
frame data is in **[MOVES.md](MOVES.md)**.

Motions, written facing right:

| Motion | Input |
|---|---|
| Fireball | down, down-forward, forward + punch |
| Uppercut | forward, down, down-forward + punch |
| Spin kick | down, down-back, back + kick |
| Charge shot | hold **back** ~40 frames, then forward + button |
| Flash kick | hold **down** ~40 frames, then up + kick |
| Command grab | forward, down, back, up + punch |
| Super | two fireball motions + button, on a full meter |

---

## The stages

Six places on the property, each built as a stack of parallax layers with
something moving in every one of them:

| Stage | What is going on |
|---|---|
| **The Game Barn** | Arcade cabinets with live screens, string lights swinging in the foreground, cats on the hay bales, dust in the light |
| **The Pool Deck** | Moving water, an inflatable flamingo with a cat asleep on it, sunbathers, birds crossing, tiles passing in front |
| **The Orchard** | Three ranks of trees swaying at different rates, chickens who stop to peck, falling blossom, sun rays, a branch hanging into frame |
| **Mountain Retreat** | Stars, a shooting star now and then, bats across the moon, a campfire throwing light on the granite, fireflies, mist round the ankles |
| **The Farmhouse Kitchen** | A pot steaming on the range, the oven glowing, a clock whose hands move, pans swinging overhead, a cat on the counter batting something towards the edge |
| **The Front Porch** | A windmill turning on the ridge, a rocking chair rocking, moths at the lantern, wind chimes, hanging ferns |

**You pick the stage.** After both cats are locked in, the stage select shows
a live, moving preview of each one with your two fighters standing in it —
they are worth seeing move rather than as a thumbnail. There is a RANDOM slot
at the end, and a kick takes you back to change your cat.

**The crowd watches the fight.** Spectators bob along idly, and when a combo
lands or someone is nearly out they get on their feet and cheer. A knockout
brings the house down.

Adding a stage means one object in `src/stages.js` with a `drawBack` and a
`drawFore`. The pieces to build it from — scrolling layers, hills, trees,
water, weather, crowds, smoke — are all in `src/stagekit.js`.

## Modes

- **Arcade** — one player against all five other cats in a row.
- **Versus** — two players on one keyboard, or two gamepads.
- **Training** — infinite health on the dummy, infinite meter for you. Turn on
  the hitbox display with `F1` and the frame data appears alongside it.

Options for difficulty (five levels), rounds to win, round time, music, sound
and hitboxes are on the title screen.

---

## Making it your cats

One file, and you never have to touch the engine. Gracie is the worked example
— read her block in `src/characters.js` and the rest follow the same shape.

Nothing else in the game needs telling about a new cat. The CPU works out what
her specials are for from what they do (a move that spawns something is a
projectile, a move that rises with invincibility is an anti-air, and so on), so
she is understood by the computer the moment she exists.

### 1. Names and personalities

`src/characters.js`, at the top of each entry:

```js
id: 'gracie',
displayName: 'MITTENS',
subtitle: 'The All-Rounder',
blurb: 'Fireballs, an invincible uppercut, and no bad matchups.\nStart here.',
```

Change those and the select screen, health bars, victory screen and announcer
text all follow.

### 2. Looks

The same entry, a little further down:

```js
palette: {
  fur: '#b9b3a8', fur2: '#9a948a', belly: '#f2efe8', marks: '#6b6359',
  eye: '#7ad14f', nose: '#d98a94', inner: '#e8a6ad',
  accent: '#c0392b', accessory: 'headband', pattern: 'tabby',
  tailTip: '#f2efe8'
},
build: { s: 1.00, girth: 1.00, limb: 1.00, head: 1.00 },
```

- `pattern` — one of `tabby`, `tuxedo`, `calico`, `tortie`, `siamese`, `solid`.
- `accessory` — `headband`, `goggles`, `collar`, `crown` or `none`.
- `build` — `s` overall size, `girth` how stocky, `limb` how long-legged,
  `head` how big the skull is. This is what makes the heavyweight read as a
  heavyweight from across the room.

Send photographs and these get set to match the real animals.

### 3. Photographs

Drop them in `assets/cats/` and name them on the cat — see
[assets/cats/README.md](assets/cats/README.md).

### 4. Special moves

Also `src/characters.js`. Each special is a block of plain numbers:

```js
{
  id: 'uppercut', name: 'Cat Scratch Fever', kind: 'special',
  motion: 'dp', buttons: ['LP', 'MP', 'HP'],
  startup: 4, active: 14, recovery: 22,
  damage: [90, 110, 130],        // one per button strength
  knockdown: 'hard',
  invuln: [0, 6],                // invincible frames 0 to 6
  hitbox: { x: 6, y: 44, w: 34, h: 52 },
  anim: [ ... ],
}
```

Tell me the six cats' real special moves in plain words — "she does a flying
headbutt", "he rolls into a ball" — and this is the file they go into.

---

## How it is built

No framework, no bundler, no npm for the game itself. Plain HTML and classic
`<script>` tags, which is what lets the identical folder run as a web page, a
double-clicked file, and a Windows application.

```
index.html          the page
css/game.css        the page shell — the game is all canvas
src/util.js         maths helpers and a deterministic random
src/input.js        keyboard, Xbox pad, rumble, and the motion detector
src/rig.js          the cat skeleton and how a cat is drawn
src/anim.js         the pose library and keyframe blending
src/moves.js        the eighteen normals, built once and shared
src/characters.js   THE ROSTER — names, looks, stats, specials
src/photos.js       optional real photographs
src/fighter.js      the state machine: one per cat
src/ai.js           the CPU, which drives a virtual pad
src/audio.js        every sound, synthesised at runtime
src/stage.js        the six stages, drawn not photographed
src/hud.js          health bars, meters, particles, projectiles
src/game.js         scenes, collision, camera, match flow
src/main.js         boot and the fixed 60Hz loop
electron/           the desktop wrapper
test/               frame-data and engine tests
```

### Design notes worth knowing

**The simulation is a fixed 60Hz** with an accumulator, so the fight runs at
the same speed on a 60Hz laptop and a 144Hz monitor.

**Hurtboxes come from the drawn skeleton**, not from a hand-authored table. If
a pose ducks, the hurtbox ducks with it, for free and without ever
disagreeing with the picture.

**The CPU does not cheat.** It drives a virtual pad and its inputs run through
the same motion detector a human's do. If it throws a fireball it really did
press down, down-forward, forward, punch. Harder difficulty means fewer idle
frames and quicker reactions — never extra privileges.

**All sound is synthesised** at runtime. There are no audio files to ship,
license or load.

### Tests

```
node --test test/*.test.mjs
```

Twenty-eight tests over the real shipping files. They exist because the
failures that matter here are silent ones: a move with no hitbox, an animation
that ends before its recovery does, a damage array with a typo in it. None of
those throw an error — they just quietly never work, and you find out in the
middle of a round. The tests catch all three, plus the motion detector, the
blocking rules, chip damage, combo scaling and the roster balance guards.

They also run automatically before every Windows build.
