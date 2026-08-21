# Super Cat Fighter 6 — The Farmhouse Warriors

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
version: GitHub → Actions → *Super Cat Fighter 6 (Windows)* → **Run workflow**, and
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

### The menus take the mouse

Every menu — title, character select, stage select, options — can be driven
with the mouse alone: hover to move the cursor, click to choose. The cursor
turns into a hand over anything clickable.

This is not a convenience, it is what makes the game work when it is embedded.
A page inside an iframe receives no key presses until it has keyboard focus, so
a keyboard-only title screen sits there dead until the player happens to guess
that clicking on it first would help. One click now both takes focus and picks
the item under it, and the keyboard works from that point on.

The rects a menu is drawn at and the rects it is hit-tested against are the
same function — `titleRects()`, `selectRects()`, `stageRects()`,
`optionRects()` in `src/game.js`. A menu item you can see but not click is
worse than no mouse support at all, so the two can never be allowed to drift
apart. The tests check every rect is on screen, that none of them overlap, and
that a whole match can be started with nothing but clicks.

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
| **The Game Barn** | The hayloft standing open on a moonlit hillside, bales stacked in the mouth of it and a block and tackle swinging off the beam. Arcade cabinets with live screens, string lights in the foreground, cats on the hay bales, dust in the light |
| **The Pool Deck** | A water slide running off the top of the frame, down its scaffold and into the pool — with somebody coming down it every few seconds and a splash where they land. An enormous parasol at the near edge, moving water, a cat asleep on the flamingo |
| **The Orchard** | The red barn and its silo out across the field with the low sun on them, one enormous old tree with a rope swing, ranks of trees swaying at different rates, mown stripes and windfall apples in the grass, falling blossom |
| **Mountain Retreat** | A log cabin with four lit windows, smoke going up out of the stone chimney and somebody out on the porch watching. Stars, bats across the moon, campfires on the granite, fireflies, mist round the ankles |
| **The Farmhouse Kitchen** | The sash window over the sink with the evening coming through it and the light falling across the boards. A pot steaming on the range, the oven glowing, pans swinging overhead, a cat batting something towards the edge of the counter |
| **The Front Porch** | The windmill, most of the height of the picture, turning on its braced tower with two birds sat on the crosspiece. A rocking chair rocking, moths at the lantern, wind chimes, hanging ferns |

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
src/fighter.js      the state machine: one per cat
src/ai.js           the CPU, which drives a virtual pad
src/audio.js        every sound, synthesised at runtime
src/stage.js        the six stages, drawn not photographed
src/hud.js          health bars, meters, particles, projectiles
src/card.js         the character card — the roster screen and the reveal
src/game.js         scenes, collision, camera, match flow
src/main.js         boot and the fixed 60Hz loop
electron/           the desktop wrapper
test/               frame-data and engine tests
```

### Design notes worth knowing

**Every cat has a card.** `ROSTER` on the title menu is six of them, one per
cat: the cat lit from behind, its name, its weight class, and its two specials
and super with the buttons that bring them out — plus a plain sentence on what
each one actually does. Left and right for another cat, up and down to read a
different move. The same card, with the reading matter taken off it, is the
beat you get when you lock a cat in.

The buttons it prints are the buttons for the scheme you are playing on. A move
list that names quarter-circles at somebody on the four-button layout is worse
than no move list at all, so the card asks `CF.Input` which scheme is live and
prints that one. `MOVES.md` gives both, side by side, and it and the card get
their inputs from the same place — `CF.Card.moveRows` — so they cannot end up
disagreeing about how a move is done.

**A cat is one shape, not a pile of parts.** Three rules in `src/rig.js` do
that work, and all three are easy to undo by accident.

*One silhouette.* Every part of the body goes into a single list of paths.
They are all stroked with a thick contour first, and only then filled in draw
order — so the fills paint over every interior stroke and the one line left
standing is the outer edge of the union. Give a limb its own outline instead
and it stops being an arm in front of a chest and becomes a sticker on one.

*One light.* Each part is filled with a gradient rather than a flat colour,
and all of those gradients run between the same two points in space. The light
crosses the whole cat continuously, so a shoulder and the thigh under it are
lit by the same lamp. This is done in the fill rather than as a wash over the
finished figure on purpose: a wash needs an offscreen canvas and a
`source-atop`, it double-darkens wherever two parts overlap, and it was
measured at 22.8ms a frame against a 16.7ms budget. The gradients cost a
tenth of that.

*One body.* The torso is a drawn curve — narrow hips, a waist, a broad chest —
with a deltoid at each shoulder and a mass at each hip, so the limbs grow out
of it. A capsule is the same width at the shoulder as at the waist, which is
what made the earlier figure read as a bean with arms pushed into the sides.

The near limbs cast a soft shadow onto the torso instead of carrying an
outline of their own, which says *this is in front of that* without cutting
the body.

Two of these rules are checked by tests, because neither leaves a trace in the
finished picture that a test could look at: the drawing is replayed against a
context that records every call, and the calls are what get asserted.

**Attacks accelerate into the contact frame.** An even ease in and out is
right for a walk and wrong for a punch — it arrives at the moment of impact
slowing down. `Anim.sample` is given the move it is animating, so it knows
which frame is the contact frame: the strike accelerates the whole way in and
stops dead there, and everything else leaves fast and settles. No keyframe
list had to be annotated by hand for it.

**The tail is always a few frames behind.** Each joint along it lags a little
more than the one before, and the head does the same thing more subtly. It is
applied to the drawn pose only — never to the pose that fights, which would
put a spring in the middle of collision detection.

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

Ninety-four tests over the real shipping files. They exist because the
failures that matter here are silent ones: a move with no hitbox, an animation
that ends before its recovery does, a damage array with a typo in it. None of
those throw an error — they just quietly never work, and you find out in the
middle of a round. The tests catch all three, plus the motion detector, the
blocking rules, chip damage, combo scaling, the roster balance guards, the
clickable menus, the two drawing rules above, and the guarantee that every
cat's specials reach the roster screen documented and with an input on both
control schemes.

They also run automatically before every Windows build.
