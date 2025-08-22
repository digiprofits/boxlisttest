// Minimal SW: offline SPA shell + cache Vite assets
const SHELL = 'boxlister-shell-v1';
const ASSETS = 'boxlister-assets-v1';

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(['/index.html']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) =>
        (k.startsWith('boxlister-') && ![SHELL, ASSETS].includes(k)) ? caches.delete(k) : null
      ))
    ).then(() => self.clients.claim())
  );
});

// SPA navigations: network-first, fallback to cached index.html
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    evt.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL);
        cache.put('/index.html', fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(SHELL);
        return (await cache.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  // Cache Vite-built assets
  if (url.pathname.startsWith('/assets/')) {
    evt.respondWith((async () => {
      const cache = await caches.open(ASSETS);
      const cached = await cache.match(req);
      const fetching = fetch(req).then((res) => { cache.put(req, res.clone()); return res; });
      return cached || fetching;
    })());
  }
});
