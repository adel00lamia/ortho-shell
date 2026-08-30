// QimataQ - Service Worker
// Caches app shell + module content for offline access

const CACHE_NAME = 'trainpro-v1';
const RUNTIME_CACHE = 'trainpro-runtime-v1';
const MODULE_CACHE = 'trainpro-modules-v1';

// App shell files to pre-cache
const APP_SHELL = [
  '/',
  '/manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE && key !== MODULE_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API calls (auth, realtime)
  if (url.hostname.includes('supabase')) return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // For navigation requests (HTML pages): network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // For JS/CSS/images: cache-first, then network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ttf|eot|ico)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});

// Listen for messages from the app to cache module content
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MODULE') {
    const { urls } = event.data;
    caches.open(MODULE_CACHE).then((cache) => {
      urls.forEach((url) => {
        fetch(url)
          .then((response) => {
            if (response.ok) cache.put(url, response);
          })
          .catch(() => {});
      });
    });
  }

  if (event.data && event.data.type === 'CLEAR_MODULE_CACHE') {
    caches.delete(MODULE_CACHE);
  }
});
