// Local development server. Not part of the deploy — netlify.toml 404s
// /tools/*, and Netlify runs the real functions in production.
//
// Serves the repo as static files and routes /api/* to the same function
// modules Netlify will run, so what is checked locally is the real thing
// rather than a fixture.
//
//   node tools/dev-server.mjs            # http://127.0.0.1:8099
//   node tools/dev-server.mjs 3000

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = Number(process.argv[2]) || 8099;
const ROOT = new URL('..', import.meta.url).pathname;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

// Paths are relative to the REPO ROOT, not to this file — resolving them
// against import.meta.url would look for tools/netlify/functions/.
const ROUTES = {
  '/api/stats': 'netlify/functions/stats.mjs',
  '/api/history': 'netlify/functions/history.mjs',
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  const route = ROUTES[url.pathname];
  if (route) {
    try {
      const mod = await import(pathToFileURL(join(ROOT, route)).href);
      const out = await mod.default(new Request(`http://localhost${req.url}`));
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
    } catch (err) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(err?.stack || err) }));
    }
    return;
  }

  // normalize + the leading-slash strip keeps ../../ out of the path.
  const rel = normalize(url.pathname === '/' ? 'index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'content-type': TYPES[extname(rel)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(ROOT, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`SportsTicker dev server on http://127.0.0.1:${PORT}`));
