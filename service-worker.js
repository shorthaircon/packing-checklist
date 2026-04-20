const VERSION = 'v1';
const CORE_CACHE = `packing-core-${VERSION}`;
const FONT_CACHE = `packing-fonts-${VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/lucide.min.js',
  './assets/Sortable.min.js',
  './assets/fonts/fonts.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CORE_CACHE && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('.woff2')) {
    event.respondWith(cacheFirst(req, FONT_CACHE));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, CORE_CACHE));
    return;
  }

  event.respondWith(cacheFirst(req, CORE_CACHE));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    return cache.match('./index.html');
  }
}
