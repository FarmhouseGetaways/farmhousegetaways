# Getting a Windows build

Three ways, easiest first.

---

## 1. Let GitHub build it (nothing to install)

This is the one to use.

1. Go to the repository on GitHub → **Actions** tab.
2. Pick **Super Cat Fighter 6 (Windows)** in the left-hand list.
3. **Run workflow** → choose this branch → **Run workflow**.
4. Wait about five minutes. When the run goes green, scroll to the bottom of
   the run page and download the **SuperCatFighter6-windows** artifact.

Inside the zip:

- `SuperCatFighter6-0.1.0-x64.exe` — an installer. Double-click, next, next, done.
  It puts a shortcut on the desktop and in the Start menu.
- `SuperCatFighter6-0.1.0-x64.zip` — the portable version. Unzip it anywhere and
  run `Super Cat Fighter 6.exe`. Nothing is installed, nothing touches the
  registry, and it will run off a memory stick.

The workflow also runs the engine tests first and refuses to build if any of
them fail.

> **Windows will show a blue "Windows protected your PC" box the first time.**
> That is SmartScreen, and it appears for every unsigned program. Click **More
> info** → **Run anyway**. Making it go away means buying a code-signing
> certificate — see the note at the bottom.

---

## 2. Build it on a Windows machine yourself

Needs [Node.js](https://nodejs.org) 20 or newer.

```
cd catfighter
npm install
npm run dist:win
```

The results land in `catfighter/dist/`.

To just run it without packaging anything:

```
npm start
```

---

## 3. No build at all

`index.html` opened in any browser is the complete game. Chrome, Edge and
Firefox all work, from a double-click, with no server. If you only want to play
it, this is genuinely all you need — the Windows build exists so it feels like
a program rather than a web page, and so it can go on Steam.

---

## Notes

**Size.** About 90 MB installed. That is Electron — the game itself is under
300 KB, and it bundles a browser engine so that it behaves identically on every
machine. A smaller build is possible by moving to a native engine, but it would
mean rewriting the game.

**Which architecture.** The workflow builds 64-bit, which is every Windows
machine sold in the last fifteen years. `npm run dist:win32` builds 32-bit if
you ever need it.

**Mac and Linux.** `npm run dist:mac` and `npm run dist:linux` work from the
matching machine. Apple builds also need signing and notarising before they run
on someone else's Mac.

**Code signing.** An unsigned program triggers SmartScreen. A certificate is
roughly £200–£400 a year from a certificate authority, and reputation builds
over a few weeks of downloads even once you have one. For sending the game to
friends and family it is not worth it. For a paid Steam release it is worth
doing — although Steam's own installer path softens the problem considerably.
