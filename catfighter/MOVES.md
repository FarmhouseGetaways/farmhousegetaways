# Move list

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

## MITTENS — The All-Rounder

Fireballs, an invincible uppercut, and no bad matchups.  
Start here.

**Health** 1000 · **Stun** 100 · **Walk** 1.55 forward, 1.25 back · **Jump** 9.6 · **Weight** 1 · has a dash

### Specials

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **Hairball** | down, down-forward, forward + LP / MP / HP | 26 / 30 / 34 | 11 | 3 | 26 | projectile |
| **Cat Scratch Fever** | forward, down, down-forward + LP / MP / HP | 90 / 110 / 130 | 4 | 14 | 22 | hard knockdown; invincible frames 0–6; hits 1× |
| **Tumbleweed Kick** | down, down-back, back + LK / MK / HK | 22 / 24 / 26 | 6 | 22 | 16 | hits 3× |

### Super

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **HAIRBALL BARRAGE** | fireball motion twice + LP / MP / HP | 60 | 10 | 6 | 40 | invincible frames 0–10; projectile; costs 100 meter |

### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 14 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 24 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 34 | 8 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 15 | 4 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 26 | 7 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 36 | 10 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 12 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 22 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 32 | 7 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 12 | 4 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 22 | 6 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 30 | 8 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 16 | 4 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 26 | 5 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 34 | 6 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 16 | 4 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 26 | 5 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 34 | 6 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## BISCUIT — The Heavyweight

Walks slowly. Hits like a falling bookcase.  
Get in close and the round is over.

**Health** 1200 · **Stun** 130 · **Walk** 1.15 forward, 0.95 back · **Jump** 9 · **Weight** 1.35

### Specials

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **Cat-astrophic Piledriver** | forward, down, back, up (full circle) + LP / MP / HP | 180 / 210 / 240 | 2 | 3 | 34 | hard knockdown; unblockable command grab |
| **Windmill Tail** | hold two punches + LP | 30 / 34 / 38 | 5 | 26 | 20 | ducks high attacks; hits 3× |
| **Boulder Charge** | back, down, forward (half circle) + LK / MK / HK | 70 / 80 / 90 | 12 | 20 | 24 | knockdown; absorbs one hit |

### Super

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **FINAL CATASTROPHE** | forward, down, back, up (full circle) + LK / MK / HK | 380 | 2 | 3 | 40 | hard knockdown; invincible frames 0–4; unblockable command grab; costs 100 meter |

### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 17 | 4 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 29 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 41 | 9 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 18 | 5 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 32 | 8 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 44 | 12 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 15 | 4 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 27 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 39 | 8 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 15 | 5 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 27 | 7 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 37 | 9 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 20 | 5 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 32 | 6 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 41 | 7 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 20 | 5 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 32 | 6 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 41 | 7 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## SHADOW — The Gatekeeper

Hold back to charge a boomerang, hold down for a flash kick.  
Patient cats win rounds.

**Health** 1000 · **Stun** 105 · **Walk** 1.45 forward, 1.4 back · **Jump** 9.4 · **Weight** 1.05 · has a dash

### Specials

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **Whisker Boomerang** | hold BACK 40f, then forward + LP / MP / HP | 24 / 28 / 32 | 9 | 3 | 20 | projectile |
| **Moonlight Flip** | hold DOWN 40f, then up + LK / MK / HK | 80 / 100 / 120 | 3 | 16 | 26 | hard knockdown; invincible frames 0–5 |
| **Shadow Slide** | down, down-forward, forward + LK / MK / HK | 28 / 32 / 36 | 7 | 12 | 18 | must be blocked low; knockdown; goes under high attacks |

### Super

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **ECLIPSE** | hold DOWN 55f, then up + LK / MK / HK | 70 | 3 | 28 | 34 | hard knockdown; invincible frames 0–12; hits 5×; costs 100 meter |

### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 14 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 24 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 35 | 8 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 15 | 4 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 27 | 7 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 37 | 10 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 12 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 22 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 33 | 7 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 12 | 4 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 22 | 6 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 31 | 8 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 16 | 4 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 27 | 5 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 35 | 6 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 16 | 4 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 27 | 5 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 35 | 6 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## PEPPER — The Blur

Fastest paws on the ranch. Mash a kick for the leg flurry.  
Low damage, endless pressure.

**Health** 900 · **Stun** 92 · **Walk** 1.95 forward, 1.65 back · **Jump** 9.2 · **Weight** 0.82 · has a dash · has an air dash

### Specials

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **Thousand Paw Kick** | tap rapidly LK / MK / HK | 12 / 13 / 14 | 4 | 30 | 16 | hits 7× |
| **Pounce** | forward, down, down-forward + LK / MK / HK | 50 / 58 / 66 | 5 | 18 | 20 | knockdown; invincible frames 0–4 |
| **Whirlwind Tail** | hold DOWN 36f, then up + LK / MK / HK | 18 / 20 / 22 | 5 | 26 | 18 | hits 4× |

### Super

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **INFINITE PAWS** | fireball motion twice + LK / MK / HK | 26 | 5 | 46 | 24 | knockdown; invincible frames 0–8; hits 12×; costs 100 meter |

### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 12 | 2 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 20 | 4 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 29 | 7 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 13 | 3 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 22 | 6 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 31 | 8 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 10 | 2 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 19 | 4 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 27 | 6 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 10 | 3 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 19 | 5 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 26 | 7 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 14 | 3 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 22 | 4 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 29 | 5 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 14 | 3 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 22 | 4 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 29 | 5 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## NOODLE — The Long Cat

Limbs that reach halfway across the barn, plus a teleport.  
Keep them out. Panic if they get in.

**Health** 950 · **Stun** 96 · **Walk** 1.25 forward, 1.15 back · **Jump** 9.8 · **Weight** 0.9

### Specials

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **Drifting Fur Ball** | down, down-forward, forward + LP / MP / HP | 26 | 13 | 3 | 28 | projectile |
| **Nine Lives Step** | forward, down, down-forward + LP / MP / HP | — | 4 | 6 | 12 | invincible frames 2–12 |
| **Nine Lives Retreat** | back, down, down-back + LP / MP / HP | — | 4 | 6 | 12 | invincible frames 2–12 |
| **Corkscrew Cat** | down, down-back, back + LK / MK / HK | 20 / 22 / 24 | 8 | 24 | 22 | hits 4× |

### Super

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **ENDLESS CAT** | fireball motion twice + LP / MP / HP | 34 | 8 | 40 | 30 | knockdown; invincible frames 0–10; hits 8×; costs 100 meter |

### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 13 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 23 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 32 | 9 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 14 | 5 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 24 | 8 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 34 | 11 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 11 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 21 | 6 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 30 | 8 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 11 | 5 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 21 | 7 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 28 | 9 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 15 | 5 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 24 | 6 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 32 | 7 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 15 | 5 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 24 | 6 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 32 | 7 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## TIGER — The Wild One

Mash punch for static, charge back for the rolling ball.  
All offence, no manners.

**Health** 1080 · **Stun** 115 · **Walk** 1.5 forward, 1.2 back · **Jump** 10.4 · **Weight** 1.18

### Specials

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **Static Crackle** | tap rapidly LP / MP / HP | 16 / 18 / 20 | 6 | 28 | 22 | hits 5× |
| **Rolling Ball** | hold BACK 40f, then forward + LP / MP / HP | 60 / 70 / 80 | 10 | 26 | 26 | knockdown; goes under high attacks |
| **Vertical Pounce** | hold DOWN 40f, then up + LK / MK / HK | 56 / 64 / 72 | 6 | 22 | 24 | knockdown; invincible frames 0–5 |

### Super

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
| **THUNDER BEAST** | hold BACK 55f, then forward + LP / MP / HP | 40 | 8 | 44 | 30 | hard knockdown; invincible frames 0–12; hits 7×; costs 100 meter |

### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Standing | LP | Paw Jab | 15 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Standing | MP | Straight Paw | 26 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Standing | HP | Heavy Swipe | 37 | 8 | 4 | 17 | -1 | -7 | cancels into super |
| Standing | LK | Quick Kick | 16 | 4 | 3 | 7 | +3 | +0 | cancels into special / super |
| Standing | MK | Side Kick | 28 | 7 | 3 | 12 | +2 | -3 | cancels into special / super |
| Standing | HK | Roundhouse | 39 | 11 | 4 | 19 | -2 | -8 | knockdown; cancels into super |
| Crouching | down + LP | Low Jab | 13 | 3 | 2 | 6 | +5 | +2 | cancels into special / super |
| Crouching | down + MP | Low Straight | 24 | 5 | 3 | 11 | +2 | -2 | cancels into special / super |
| Crouching | down + HP | Rising Claw | 35 | 7 | 4 | 17 | -2 | -7 | knockdown; anti-air; cancels into super |
| Crouching | down + LK | Toe Poke | 13 | 4 | 2 | 6 | +5 | +2 | must be blocked low; cancels into special / super |
| Crouching | down + MK | Low Kick | 24 | 6 | 3 | 11 | +2 | -2 | must be blocked low; cancels into special / super |
| Crouching | down + HK | Tail Sweep | 32 | 8 | 4 | 20 | -5 | -10 | must be blocked low; hard knockdown |
| In the air | LP | Air Jab | 17 | 4 | 8 | 4 | +3 | -1 | must be blocked standing |
| In the air | MP | Air Swipe | 28 | 5 | 10 | 4 | +3 | -2 | must be blocked standing |
| In the air | HP | Dive Paw | 37 | 6 | 12 | 4 | +4 | -2 | must be blocked standing |
| In the air | LK | Air Kick | 17 | 4 | 9 | 4 | +2 | -2 | must be blocked standing |
| In the air | MK | Air Side Kick | 28 | 5 | 11 | 4 | +2 | -3 | must be blocked standing |
| In the air | HK | Jump Roundhouse | 37 | 6 | 13 | 4 | +3 | -3 | must be blocked standing |

---

## Stages

- **THE GAME BARN**
- **THE POOL DECK**
- **THE ORCHARD**
- **MOUNTAIN RETREAT**
- **THE FARMHOUSE KITCHEN**
- **THE FRONT PORCH**
