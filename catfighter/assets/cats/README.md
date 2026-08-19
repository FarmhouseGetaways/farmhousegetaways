# Photographs of the cats

Put a picture of each cat in this folder, then name the file on that cat in
`src/characters.js`:

```js
id: 'gracie',
photo: 'gracie.jpg',
```

The photo shows up on the character-select card and on the winner screen.
Leave `photo: null` and the game simply carries on without one.

**What works best**

- A square-ish crop around the face. It is drawn as a circle, so anything
  important near the corners gets trimmed.
- 200 x 200 pixels is plenty. Bigger is fine; it only makes the download
  larger.
- `.jpg`, `.png` and `.webp` all work.

**The other thing photographs are for**

The fighters themselves are drawn, not photographed — that is what lets them
animate. But their colours, markings, eye colour and ear shape all come from a
palette block in `src/characters.js`, one per cat. Send the photographs and
those get set to match the real animals: a tabby's stripes, a tuxedo's bib, the
one with odd eyes, and so on.
