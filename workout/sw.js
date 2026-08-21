/**
 * The offline shell.
 *
 * The point of this file is a garage with no signal. Everything the app is
 * made of — the page, the stylesheet, the three scripts, the icons — is
 * precached, so an installed copy opens instantly and works whether or not
 * there is a network. The plan and the history are already in localStorage by
 * then, so a whole workout can be done and logged with the phone in aeroplane
 * mode; it goes up to the server on its own the next time there is a signal.
 *
 * Three rules, and the second and third are the ones that matter:
 *
 *   the shell        cache first, refreshed quietly in the background
 *   data/*.json      network first — a stale plan would hide a change made
 *                    this morning, and the cached copy is only the fallback
 *   /api/*           never cached, in either direction. One of those requests
 *                    carries a password and the others are the live record.
 *
 * BUMP `VERSION` WHENEVER THE FILE LIST BELOW CHANGES. Without it a phone
 * that already installed the app keeps serving yesterday's copy for ever.
 */

const VERSION = "workouts-v2";

const SHELL = [
  "./",
  "index.html",
  "css/workout.css",
  "js/app.js",
  "js/store.js",
  "js/catalog.js",
  "manifest.webmanifest",
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll fails the whole install if any one file 404s, which would leave
      // the app with no offline copy at all. Added one at a time instead, so a
      // missing icon costs an icon rather than the entire cache.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // videos and fonts go to the network
  if (url.pathname.startsWith("/api/")) return;        // never cached, never served from cache

  // The plan: fresh if we can get it, cached if we cannot.
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // Everything else: the cached copy now, a fresh one for next time.
  event.respondWith(
    caches.match(req).then((hit) => {
      const live = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || live;
    }),
  );
});
