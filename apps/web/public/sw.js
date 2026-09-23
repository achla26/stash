/* Stash service worker — offline shell + offline reading */

// Bump this on every release to bust old caches
const VERSION = "v2";
const SHELL_CACHE = `stash-shell-${VERSION}`;
const PAGE_CACHE = `stash-pages-${VERSION}`;
const API_CACHE = `stash-api-${VERSION}`;

const SHELL = [
  "/",
  "/login",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-icon.png",
];

// Listen for SKIP_WAITING message from the page — activate immediately
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => ![SHELL_CACHE, PAGE_CACHE, API_CACHE].includes(k)
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxEntries);
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never let the SW serve a stale Next.js build — always hit network for
  // build output and HTML navigations.
  const isNextAsset =
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/static/");

  // App navigations: network-first, fallback to cached page (offline reading)
  if (req.mode === "navigate" || isNextAsset) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok && req.mode === "navigate") {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(req, res.clone());
            trimCache(PAGE_CACHE, 40);
          }
          return res;
        } catch {
          // Offline fallback only for navigations
          if (req.mode === "navigate") {
            const cached =
              (await caches.match(req)) ||
              (await caches.match("/dashboard")) ||
              (await caches.match("/login"));
            if (cached) return cached;
          }
          return new Response("Offline", { status: 503 });
        }
      })()
    );
    return;
  }

  // API reads: network-first, cache as offline fallback
  if (url.pathname.startsWith("/api/")) {
    if (
      url.pathname.startsWith("/api/auth") ||
      url.pathname.startsWith("/api/export")
    ) {
      return; // never cache auth/export
    }
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        try {
          const res = await fetch(req);
          if (res.ok) {
            cache.put(req, res.clone());
            trimCache(API_CACHE, 60);
          }
          return res;
        } catch {
          const cached = await cache.match(req);
          return (
            cached ||
            new Response(JSON.stringify({ data: null }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      })()
    );
    return;
  }

  // Static assets (icons, images, fonts): cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(req, res.clone());
      }
      return res;
    })()
  );
});