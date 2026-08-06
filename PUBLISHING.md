# How to change the words and put it live

Two steps. Neither one needs you to write any code.

---

## Step 1 — change the words

Go to **https://farmhousegetaways.netlify.app/edit.html**

- Pick a page from the dropdown at the top left.
- Click any text on the page and type over it.
- **Click any photo to swap it.** Pick a file and it gets resized and squeezed
  down automatically before it goes anywhere — you can hand it a 12 MB camera
  file and it will sort it out.
- Layout and the booking boxes are locked. You cannot break those.
- **Review changes** shows you a before-and-after list.
- **Undo all** throws everything away and starts over.

Your changes carry across pages while the tab is open. They are **not** saved if
you close the tab — hit Save first.

When you're happy, hit **Save my changes**. A small file downloads, named
something like `farmhouse-edits-2026-08-01-14-22.json`. That file is the record
of what you changed. It is not the website.

---

## Step 2 — put it live

Open **Claude Code** in the website folder and say:

> Apply the edits in ~/Downloads/farmhouse-edits-....json and publish.

That's the whole instruction. It will:

1. Run `tools/apply-edits.py` to write your changes into the real page files
2. Show you what changed
3. Commit and push to GitHub
4. Netlify rebuilds on its own — live in about a minute

If you'd rather do it in two steps, say "apply the edits and show me the diff"
first, look it over, then say "push it."

---

## Asking Claude for changes

The editor is for wording. For anything bigger — a new section, a design change,
new photos, a whole new page — you still ask Claude. Just ask.

You don't have to do anything. Every time you publish, the editor waits until
the change is actually live, then quietly saves a copy of the site into your
Downloads. Claude reads it from there, so it is always working from what is
really on your site.

**This needs one setting turned off in Chrome, once.** Go to
`chrome://settings/downloads` and switch off **"Ask where to save each file."**
Otherwise Chrome interrupts you with a save dialog every time you publish.

You'll see small `farmhouse-snapshot-....json` files collecting in Downloads.
Ignore them, or bin the old ones whenever you like.

If one ever fails to save, the link `/edit.html?copy=1` does the same job
manually.

---

## What you cannot change yourself

- **Colours.** The site runs a deliberate system — Red Barn Ranch is always barn
  red, Mountain Retreat always pine green — and there is a readability floor to
  hold. Ask Claude instead.
- **Layout**, the booking boxes, and adding or deleting photos. Ask Claude.

## Why it works this way

The editor never saves the whole page. Browsers make a mess of HTML when you
edit them directly, and publishing that mess would degrade the site a little
more every time you did it.

Instead the editor writes down *what you changed*, and `tools/apply-edits.py`
finds that exact spot in the real file and swaps the words. Your hand-written
files stay clean no matter how many rounds you do.

---

## If something doesn't apply

The script prints a line per change: `✓` for applied, `!` for failed. A failure
almost always means the page was edited somewhere else in between. Nothing is
half-written — just tell Claude Code and it will sort out the ones that failed.
