# Move list

## The four-button scheme (default)

| Input | Does |
|---|---|
| **PUNCH** | jab |
| **forward + PUNCH** | heavy punch |
| **down + PUNCH** | low punch |
| **up + PUNCH** | rising claw — anti-air |
| **KICK** | quick kick |
| **forward + KICK** | roundhouse |
| **down + KICK** | sweep, knocks down |
| **up + KICK** | side kick |
| **JUMP** | jump — hold a direction to angle it |
| **BLOCK** | guard — add down for lows. You can block while walking in. |
| **DODGE** (LT) | invincible hop away |
| **LUNGE** (RT) | fast advance |
| **PUNCH + KICK** | special 1 |
| **PUNCH + BLOCK** | special 2 |
| **KICK + BLOCK** | throw |
| **LT + RT** | super, on a full meter |

Every cat's specials and super are asked for the same way on this scheme, and
the **ROSTER** screen on the title menu shows each cat's three moves with the
buttons for whichever scheme is switched on.

Hold **forward** with a special to get the heavy version. There are no motion
inputs in this scheme — the frame data below still applies, only the way you
ask for a move changes. The **CLASSIC** six-button layout with quarter-circles
and charges is still there under Options.

---


Generated from `src/characters.js` by `node tools/gen-moves.mjs` — do not edit
this file by hand, edit the character data and run the generator again.

Frame data is in 60ths of a second. **Startup** is how long before the move can
hit, **active** is how long it can hit for, **recovery** is how long you are
stuck afterwards. **On hit** and **on block** are the frame advantage if the
move connects on its first active frame: a plus number means you act first
afterwards, a minus number means your opponent does.

All motions are written **facing right**. They mirror automatically when your
cat turns around.

---

## Universal

| Move | Input | Notes |
|---|---|---|
| Throw | `LP` + `LK`, or forward + `HP`/`HK` up close | Unblockable, hard knockdown |
| Back throw | back + `LP`+`LK` up close | Throws them behind you |
| Dash | tap forward twice | Only some cats have it |
| Back hop | tap back twice | Invincible on the way up |
| Block | hold back | No air blocking |
| Block low | hold down-back | Stops lows; loses to overheads |

---

## GRACIE — The Elder

Old, and she knows it. A growl that carries the length of the barn, and a tail that takes your legs out from under you.  
Let them come to you.

**Health** 1050 · **Stun** 116 · **Walk** 1.3 forward, 1.22 back · **Jump** 9.2 · **Weight** 1.1

### Specials

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **Growl of Energy** | PUNCH + KICK | down, down-forward, forward + LP / MP / HP | 26 / 30 / 34 | 12 | 3 | 27 | projectile |
| **Tail Whip** | PUNCH + BLOCK | down, down-back, back + LK / MK / HK | 30 / 34 / 38 | 10 | 6 | 24 | must be blocked low; knockdown |

**Growl of Energy** — A wall of sound sent down the length of the barn. It crosses the whole screen, and the harder the button the faster it travels.

**Tail Whip** — The tail comes along the floor and takes their legs out. Has to be blocked low, and it puts them down.

### Super

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **THE LAST WORD** | DODGE + LUNGE | fireball motion twice + LP / MP / HP | 55 | 12 | 6 | 44 | invincible frames 0–14; projectile; costs 100 meter |

**THE LAST WORD** — Three growls, back to back, and she is invincible for the first fourteen frames of it — so it beats whatever was already on its way in.


### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 15 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 26 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 37 | 9 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 17 | 4 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 29 | 8 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 40 | 11 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 13 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 24 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 35 | 8 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 13 | 4 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 24 | 6 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 33 | 9 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 18 | 4 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 29 | 5 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 37 | 6 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 18 | 4 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 29 | 5 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 37 | 6 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## MARIO — The Immovable

Enormous, and entirely aware of it. Getting to you takes a while. Being under him does not take long at all.

**Health** 1200 · **Stun** 138 · **Walk** 1.02 forward, 0.86 back · **Jump** 8.8 · **Weight** 1.48

### Specials

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **Belly Bump** | PUNCH + KICK | down, down-forward, forward + LP / MP / HP | 72 / 84 / 96 | 13 | 10 | 26 | knockdown; absorbs one hit |
| **The Smother** | PUNCH + BLOCK | back, down, forward (half circle) + LK / MK / HK | 150 / 175 / 200 | 4 | 3 | 36 | hard knockdown; unblockable command grab |

**Belly Bump** — All of him, at once. He shrugs off a hit on the way in, frames 8 to 24, so trading with him is a losing idea.

**The Smother** — A grab, so blocking will not save them. Four frames of startup and a hard knockdown — but thirty-six frames of standing there if it misses.

### Super

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **THE FULL WEIGHT** | DODGE + LUNGE | fireball motion twice + LK / MK / HK | 330 | 3 | 3 | 44 | hard knockdown; invincible frames 0–6; unblockable command grab; costs 100 meter |

**THE FULL WEIGHT** — Three frames, ungrabbable to block, 330 damage, invincible while it starts. If his meter is full and you are stood next to him, you are already in it.


### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 17 | 4 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 29 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 41 | 10 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 18 | 5 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 32 | 9 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 44 | 12 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 15 | 4 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 27 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 39 | 9 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 15 | 5 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 27 | 7 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 37 | 10 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 20 | 5 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 32 | 6 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 41 | 7 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 20 | 5 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 32 | 6 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 41 | 7 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## LUIGI — The Twin

Same coat, half the cat. Comes in over the top or takes your legs — and you have to guess which.

**Health** 900 · **Stun** 92 · **Walk** 1.86 forward, 1.62 back · **Jump** 10.2 · **Weight** 0.88 · has a dash

### Specials

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **Flying Body Attack** | PUNCH + KICK | down, down-forward, forward + LK / MK / HK | 56 / 64 / 72 | 9 | 16 | 20 | must be blocked standing; knockdown |
| **Leg Sweep** | PUNCH + BLOCK | down, down-back, back + LK / MK / HK | 30 / 34 / 38 | 8 | 6 | 22 | must be blocked low; hard knockdown; goes under high attacks |

**Flying Body Attack** — He leaves the floor and arrives shoulder first. An overhead, so crouch-blocking does not stop it.

**Leg Sweep** — Low, fast, and a hard knockdown. Eight frames of startup — the quickest thing he has for interrupting.

### Super

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **OVER THE TOP** | DODGE + LUNGE | fireball motion twice + LK / MK / HK | 34 | 8 | 30 | 26 | must be blocked standing; hard knockdown; invincible frames 0–10; hits 5×; costs 100 meter |

**OVER THE TOP** — Thirty active frames of him in the air, overhead the whole way, invincible for the first ten.


### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 13 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 22 | 4 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 31 | 7 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 14 | 3 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 23 | 6 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 32 | 9 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 11 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 20 | 4 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 29 | 6 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 11 | 3 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 20 | 5 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 27 | 7 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 14 | 3 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 23 | 4 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 31 | 5 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 14 | 3 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 23 | 4 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 31 | 5 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## LILLY — The Acrobat

Seal point, blue eyes, and never on the floor for long. Hits like a rumour, but she is already behind you.

**Health** 850 · **Stun** 86 · **Walk** 2.02 forward, 1.78 back · **Jump** 10.6 · **Weight** 0.78 · has a dash · has an air dash

### Specials

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **Flip Attack** | PUNCH + KICK | forward, down, down-forward + LK / MK / HK | 70 / 82 / 94 | 4 | 15 | 22 | hard knockdown; invincible frames 0–6 |
| **Crane Kick** | PUNCH + BLOCK | down, down-forward, forward + LK / MK / HK | 52 / 60 / 68 | 12 | 8 | 20 | must be blocked standing; knockdown |

**Flip Attack** — Straight up in four frames, invincible on the way. Her answer to anything coming down at her.

**Crane Kick** — A forward-leaping overhead. It has to be blocked standing, and it closes the distance while it does it.

### Super

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **CRANE ASCENDING** | DODGE + LUNGE | fireball motion twice + LK / MK / HK | 30 | 4 | 34 | 30 | hard knockdown; invincible frames 0–12; hits 6×; costs 100 meter |

**CRANE ASCENDING** — Thirty-four frames of rising kick, invincible for the first twelve. Nothing gets underneath it.


### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 11 | 2 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 20 | 4 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 28 | 6 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 12 | 3 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 21 | 6 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 30 | 8 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 10 | 2 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 18 | 4 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 26 | 6 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 10 | 3 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 18 | 5 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 25 | 6 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 13 | 3 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 21 | 4 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 28 | 5 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 13 | 3 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 21 | 4 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 28 | 5 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## FIGURO — The Boxer

Stands up on his back legs and throws hands until you stop enjoying it, then he is somewhere else entirely.

**Health** 1000 · **Stun** 106 · **Walk** 1.64 forward, 1.44 back · **Jump** 9.6 · **Weight** 1.02 · has a dash

### Specials

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **Rapid Paws** | PUNCH + KICK | tap rapidly LP / MP / HP | 15 / 16 / 17 | 5 | 28 | 18 | hits 6× |
| **Cut and Run** | PUNCH + BLOCK | down, down-back, back + LK / MK / HK | — | 3 | 10 | 12 | invincible frames 1–12 |

**Rapid Paws** — Up on his back legs with both paws going, twenty-eight frames of it. Mash the button to bring it out.

**Cut and Run** — Not an attack at all — a fast, invincible retreat. Frames 1 to 12 pass straight through whatever they threw.

### Super

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **TEN THOUSAND PAWS** | DODGE + LUNGE | fireball motion twice + LP / MP / HP | 28 | 5 | 44 | 24 | knockdown; invincible frames 0–9; hits 12×; costs 100 meter |

**TEN THOUSAND PAWS** — Forty-four frames of paws, and the first nine of them are invincible.


### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 15 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 25 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 36 | 7 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 16 | 4 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 28 | 6 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 38 | 9 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 13 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 23 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 34 | 6 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 13 | 4 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 23 | 5 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 32 | 7 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 17 | 4 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 28 | 5 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 36 | 5 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 17 | 4 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 28 | 5 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 36 | 5 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## RUBY — The Jaw

Rubidoux when she is in trouble. Hold down and wait, and anything that jumps at her gets flipped out of the sky.

**Health** 1120 · **Stun** 128 · **Walk** 1.22 forward, 1.04 back · **Jump** 9 · **Weight** 1.3

### Specials

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **Crushing Bite** | PUNCH + KICK | down, down-forward, forward + LP / MP / HP | 82 / 96 / 110 | 11 | 6 | 26 | hard knockdown; absorbs one hit |
| **Flip Kick** | PUNCH + BLOCK | hold DOWN 40f, then up + LK / MK / HK | 80 / 94 / 108 | 3 | 16 | 26 | hard knockdown; invincible frames 0–5 |

**Crushing Bite** — She takes a hit on the way in, frames 7 to 18, and answers it with a hard knockdown.

**Flip Kick** — A charge move: hold down for about forty frames, then up and kick. Three frames of startup, invincible going up.

### Super

| Move | Four buttons | Classic | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|---|
| **THE VICE** | DODGE + LUNGE | fireball motion twice + LP / MP / HP | 62 | 8 | 20 | 34 | hard knockdown; invincible frames 0–11; hits 4×; costs 100 meter |

**THE VICE** — Eight frames of startup, invincible for eleven, and a hard knockdown on the end of it.


### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 16 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 28 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 39 | 9 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 17 | 5 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 30 | 8 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 42 | 11 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 14 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 26 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 37 | 8 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 14 | 5 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 26 | 7 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 35 | 9 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 19 | 5 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 30 | 6 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 39 | 7 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 19 | 5 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 30 | 6 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 39 | 7 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## Stages

- **THE GAME BARN**
- **THE POOL DECK**
- **THE ORCHARD**
- **MOUNTAIN RETREAT**
- **THE FARMHOUSE KITCHEN**
- **THE FRONT PORCH**
