# Cat Fighter II — The Farmhouse Warriors

A six-button arcade fighting game in the mould of Street Fighter II, with six
cats instead of six martial artists.

Everything here is placeholder except the engine. **The names, the looks and
the special moves are meant to be replaced** with the real six cats — see
[Making it your cats](#making-it-your-cats) below.

---

## Playing it right now

**In a browser.** Open `index.html`. That is the whole installation. It works
from a double-click, no server and no build step.

**As a Windows program.** See [BUILD-WINDOWS.md](BUILD-WINDOWS.md). The short
version: GitHub → Actions → *Cat Fighter II (Windows)* → **Run workflow**, and
download the `.exe` when it finishes. You do not need anything installed on
your machine to get a build.

**On Steam.** See [STEAM.md](STEAM.md).

---

## Controls

The arcade layout: three punches on the top row, three kicks below.

```
        LP  MP  HP                 U  I  O
        LK  MK  HK                 J  K  L
```

|                       | Player 1      | Player 2       |
|-----------------------|---------------|----------------|
| Move                  | `W A S D`     | Arrow keys     |
| Light / Med / Heavy punch | `U` `I` `O` | Numpad `7 8 9` |
| Light / Med / Heavy kick  | `J` `K` `L` | Numpad `4 5 6` |
| Throw                 | `LP` + `LK`   | `LP` + `LK`    |
| Pause                 | `Enter`       | —              |

**Gamepads work.** Plug one in and it is found automatically — no setup screen.
Player 1 takes the first pad, player 2 the second. The mapping is the standard
six-button fightpad layout (`X Y RB` punches, `A B RT` kicks).

`F1` toggles the hitbox display. `F11` is fullscreen.

Hold **back** to block. Hold **down-back** to block low. There is no air
blocking, exactly as in the original.

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

## Modes

- **Arcade** — one player against all five other cats in a row.
- **Versus** — two players on one keyboard, or two gamepads.
- **Training** — infinite health on the dummy, infinite meter for you. Turn on
  the hitbox display with `F1` and the frame data appears alongside it.

Options for difficulty (five levels), rounds to win, round time, music, sound
and hitboxes are on the title screen.

---

## Making it your cats

Three files, and you never have to touch the engine.

### 1. Names and personalities

`src/characters.js`, at the top of each entry:

```js
id: 'mittens',
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
src/input.js        keyboard, gamepad, and the motion detector
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
