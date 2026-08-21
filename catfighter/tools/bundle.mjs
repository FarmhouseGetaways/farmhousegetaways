/* Inline the whole game into a single self-contained HTML page.
 *
 * The game is deliberately built as plain files with classic <script> tags, so
 * bundling is just substitution: no imports to resolve, no order to work out —
 * index.html already states it.
 *
 *     node tools/bundle.mjs [out.html]
 *
 * The result has no external requests at all: styles and scripts inlined, the
 * favicon a data URI, every sound synthesised, every stage and cat drawn.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(ROOT, 'dist', 'catfighter-bundle.html');

const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

/* Pull out just the page content — an artifact supplies its own skeleton. */
const bodyStart = html.indexOf('<body>') + '<body>'.length;
const bodyEnd = html.indexOf('</body>');
let body = html.slice(bodyStart, bodyEnd);

/* Every <script src> in index.html, in the order it declares. */
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
if (!scripts.length) throw new Error('no scripts found in index.html');

/* Styles first, then the markup, then the code — the same order the browser
   would have loaded them in. */
const css = readFileSync(join(ROOT, 'css', 'game.css'), 'utf8');
const code = scripts.map(src => {
  const js = readFileSync(join(ROOT, src), 'utf8');
  return '/* ===== ' + src + ' ===== */\n' + js;
}).join('\n');

/* Strip the tags the artifact wrapper supplies for us. */
body = body
  .replace(/<script src="[^"]+"><\/script>\n?/g, '')
  .replace(/<!--[\s\S]*?-->\n?/g, '')
  .trim();

const page = `<title>Super Cat Fighter 6</title>
<style>
${css}
</style>

${body}

<script>
${code}
<\/script>
`;

writeFileSync(out, page);
const kb = (Buffer.byteLength(page) / 1024).toFixed(0);
console.log('bundled ' + scripts.length + ' scripts + 1 stylesheet -> ' + out + '  (' + kb + ' KB)');
