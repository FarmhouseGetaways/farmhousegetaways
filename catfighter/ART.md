# The art brief

Read this before changing anything anybody looks at.

## The bar

Street Fighter II, 1991. Not "inspired by" — as good as, at the same
resolution, with the same discipline. The owner has rejected four rounds of
incremental polish on these characters. Incremental polish is not the job.

The game draws at **384×224** and the cats are about **90 pixels tall** in it.
Judge everything at that size. A detail that only reads at 8× is not a detail,
it is noise, and noise at this resolution is what makes a figure look muddy.

## Look at your work

    node tools/shot.mjs cats   out.png                 all six, game scale
    node tools/shot.mjs cat    out.png <id> <poses> <scale>
    node tools/shot.mjs head   out.png [ids]           faces, close up
    node tools/shot.mjs strip  out.png <id> <move>     a move, cel by cel
    node tools/shot.mjs stage  out.png <id> [camX]
    node tools/shot.mjs stages out.png                 all six
    node tools/shot.mjs fight  out.png [stage] [frames]  the live game

Then **Read the PNG**. Do not commit art you have not looked at. Iterate:
render, look, change one thing, render again. Three or four rounds minimum.

## What actually separates a Street Fighter II sprite from vector art

1. **The COSTUME carries the character, not the face.** You know Ryu from the
   gi, Chun-Li from the qipao and the buns, Zangief from the outline alone.
   Six cats in six colours are one cat. A costume is geometry — it changes
   the silhouette — not a decal painted on the fur.
2. **The SILHOUETTE has to be unique.** Turn the drawing black. If two cats
   are the same black shape, the work is not done. Bulk, stance, headgear,
   things that hang and stream: those are what differ.
3. **Hard-edged shading, three tones per material.** Shadow is the base colour
   pushed towards one cool dark, never just darker. A gradient reads as a
   plastic tube; a hard shadow edge reads as a form with a light on it.
4. **One light for the whole picture**, cats and stage alike.
5. **Stepped animation.** Nothing tweens. A move is four held drawings and the
   pop between them is the impact.
6. **Scale contrast in a stage.** Something huge and close framing something
   small and far. A repeating strip is wallpaper, not a place.

## Where the pieces live

- `src/rig.js` — the shared figure: skeleton, limbs, cel shading, the face.
  **Shared. Do not edit it if you are working on one cat or one stage.**
- `src/cats/<id>.js` — one cat. Stance, build, palette, `look`, moves.
- `src/stages/<id>.js` — one stage. `drawBack`, `drawFore`, `air`.
- `src/stagekit.js` — the shared stage toolkit (`K.mass`, `K.paint`, `K.at`,
  `K.repeatX`, `K.vary`, `K.crowdRow`, `K.deepen`…). **Shared.**
- `src/anim.js` — the shared pose library. **Shared.**

## The `look` block, in a cat file

```js
look: {
  pieces: function (A, j, f) {
    // A.add(layer, pathFn, colour, opts)   layer: back | body | front | head
    // A.stroke(layer, pathFn, colour, width)
    // A.shade(col, amt) / A.lit(col, amt)  — the same lamp as the fur
    // A.smooth(ctx, pts) A.capsule A.ellipse A.limb
    // j  — solved joints: pelvis neck head shF elbF handF hipF kneeF footF,
    //      the same again with B for the far side, tail[0..3], headR, s
    // f  — measurements: chestW waistW hipW headR R_TOP R_MID R_END HAND
    //      FOOT_X FOOT_Y s G GW fur fur2 belly furFront furBack line
    // opts: {band: true} for a lit rim, {edge: true} for a material
    //       boundary, {flat: true} for anything under ~6px
    //
    // MOTION. `f.sway` is the one number a streaming piece wants: it folds
    // the cat's own speed, a slow idle drift and being airborne into a
    // single value, positive meaning "blown backwards". `f.t` is the clock
    // and `f.vx` the raw speed if you want something else. A scarf that does
    // not stream and a belt end that does not swing are two more stiff
    // shapes glued to a cat — the reference sells its characters as much on
    // what trails behind them as on what they are wearing.
  },
  overlay: function (ctx, j, fig) { /* drawn over the finished cat */ }
}
```

Layers, in draw order: `back` (behind everything — a cape, a braid),
`body` (on the torso, over the far limbs — a gi, a vest, a belt),
`front` (over the near arm and leg — a glove, a wrap, a pauldron),
`head` (on the skull, under the face — a band, a topknot, horns).

Coordinates are the figure's own space: **+y is up**, +x is forward. Anything
you add is contoured and cel-shaded with the body automatically.

## Rules that were learned the hard way — do not undo them

- Never raise the backing store above 384×224 logical, never turn on
  `imageSmoothingEnabled`, never let the CSS scale be fractional.
- Three tones per material and no more. A fourth brighter pass at the end of
  `celFill` becomes a pale blob across the middle of the part, not a rim.
- Anything thinner than one pixel disappears — `Math.max(1, …)` on every
  width.
- `K.at(camX, 0, x)` pins to the SCREEN. The frame is 384 wide; anything
  anchored past that is never visible.
- Do not teach the CPU about a cat by name.
- Every cat needs a `weightClass`. Tests assert the ordering.
