/**
 * Text and photo replacement for the visual editor at /edit.html.
 *
 * Pulled out of publish.mjs on 10 Aug 2026 so it can be tested. It was not
 * tested before, and the first real publish through the button proved why:
 * the entity table below mapped an ORDINARY space to &nbsp;, so every space in
 * the edited paragraph came out non-breaking and the line refused to wrap. It
 * shipped to the live site looking like a fence post. See edits.test.mjs.
 *
 *     node --test netlify/functions/_lib/*.test.mjs
 */

/**
 * Characters the site writes as HTML entities.
 *
 * Every key here must be a character a person can actually type into the
 * editor and mean deliberately. A plain space is not one of them — that is the
 * bug described above. U+00A0, the real non-breaking space, is not one either:
 * browsers sprinkle them into contenteditable at random, so encode() strips
 * them back to ordinary spaces rather than preserving them.
 */
export const ENT = {
  "—": "&mdash;", "–": "&ndash;", "&": "&amp;", "·": "&middot;",
  "→": "&rarr;", "←": "&larr;", "’": "&rsquo;", "‘": "&lsquo;",
  "“": "&ldquo;", "”": "&rdquo;", "…": "&hellip;", "★": "&#9733;",
  "<": "&lt;", ">": "&gt;", "°": "&deg;",
};

export const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whitespace in the source may be a real space, a newline, or a leftover
 * &nbsp; entity — an earlier publish could have written those. Match all three
 * so a page damaged once can still be edited afterwards.
 */
const WS = "(?:\\s|&nbsp;|&#0*160;)+";
const BR = `(?:[ \\t]*<br\\s*/?>[ \\t]*\\n?|${WS})`;

/** Match text whether the source wrote a literal character or its entity. */
export function tolerant(s) {
  const parts = [];
  for (const ch of s) {
    if (ch === "\n") { parts.push(BR); continue; }
    if (/\s/.test(ch)) {
      if (parts[parts.length - 1] !== WS) parts.push(WS);   // collapse runs
      continue;
    }
    parts.push(ENT[ch] ? `(?:${esc(ch)}|${esc(ENT[ch])})` : esc(ch));
  }
  return parts.join("");
}

/** Write replacements back in the house entity style. */
export function encode(s) {
  // Browsers litter contenteditable with non-breaking spaces. Nobody typing
  // into the editor ever means one, and left in they stop the line wrapping.
  s = s.replace(/ /g, " ");

  s = s.replace(/&/g, "&amp;");
  for (const [ch, ent] of Object.entries(ENT)) {
    if (ch === "&" || ch === "<" || ch === ">") continue;
    s = s.split(ch).join(ent);
  }
  s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return s.replace(/\n/g, "<br>\n");   // deliberate line breaks become <br>
}

export function applyToPage(html, changes) {
  const applied = [], missed = [];
  for (const c of changes) {
    const re = new RegExp(tolerant(c.before));
    const m = html.match(re);
    if (!m) { missed.push(c.before.slice(0, 60)); continue; }
    html = html.slice(0, m.index) + encode(c.after) + html.slice(m.index + m[0].length);
    applied.push(c.before.slice(0, 60));
  }
  return { html, applied, missed };
}

/**
 * Point one <img> at its freshly committed file.
 * The file keeps its path so nothing else has to change, but /images/* is
 * cached immutable for a year — so the src gets a ?v= stamp to force browsers
 * to fetch it again. Width and height are rewritten to the new dimensions so
 * the page does not jump while it loads.
 */
export function swapImage(html, p) {
  const re = new RegExp(`<img\\b[^>]*?src="${esc(p.src)}(?:\\?[^"]*)?"[^>]*>`, "g");
  let m, seen = 0, hit = null;
  while ((m = re.exec(html))) { if (++seen === (p.occurrence || 1)) { hit = m; break; } }
  if (!hit) return { html, ok: false };

  const tag = hit[0]
    .replace(/src="[^"]*"/, `src="${p.src}?v=${p.version}"`)
    .replace(/width="\d+"/, `width="${p.width}"`)
    .replace(/height="\d+"/, `height="${p.height}"`);

  return { html: html.slice(0, hit.index) + tag + html.slice(hit.index + hit[0].length), ok: true };
}
