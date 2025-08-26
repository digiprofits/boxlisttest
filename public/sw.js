// public/sw.js
// A minimal, safe, network-first Service Worker for BoxLister.
// It never throws and always falls back to the app shell.

const VERSION = "v2025-08-25-1";
const RUNTIME = `runtime-${VERSION}`;

self.addEventListener("install", (event) => {
  // Take control immediately
  self.skipWaiting();
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(RUNTIME);
      // Warm the shell. Use "reload" to bypass HTTP caches.
      await cache.addAll([
        new Request("/", { cache: "reload" }),
        new Request("/index.html", { cache: "reload" }),
        new Request("/manifest.webmanifest", { cache: "reload" }),
      ]);
    } catch (_) {
      // no-op: SW must not fail install
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Clean older runtime caches
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith("runtime-") && n !== RUNTIME)
        .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

// Network-first for navigations and assets, with safe fallbacks
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GET
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Navigations -> network first, fallback to cached shell
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // Refresh the shell copy
        const cache = await caches.open(RUNTIME);
        cache.put("/", res.clone());
        return res;
      } catch {
        const cache = await caches.open(RUNTIME);
        return (await cache.match("/")) || (await cache.match("/index.html")) || Response.error();
      }
    })());
    return;
  }

  // Other assets -> network, fallback to cache (ignoreSearch for hashed assets)
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    try {
      const res = await fetch(req);
      cache.put(req, res.clone());
      return res;
    } catch {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      // Last resort for HTML requests coming through here
      if (req.headers.get("Accept")?.includes("text/html")) {
        return (await cache.match("/")) || (await cache.match("/index.html"));
      }
      // If we truly can't serve, return a generic error response instead of throwing
      return new Response("", { status: 503, statusText: "Service Unavailable" });
    }
  })());
});

// Optional emergency kill: postMessage('SW_RESET') from the page if ever needed
self.addEventListener("message", async (event) => {
  if (event.data === "SW_RESET") {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
  }
});
