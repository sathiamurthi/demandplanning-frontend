// DemandGenius Service Worker
const CACHE_NAME = 'demandgenius-v3';
const SHELL_URLS = [
  '/explore',
  '/manifest.json',
  '/nexus-icon-192.svg',
  '/nexus-icon-512.svg',
  '/nexus-icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept page navigations (the top-level HTML document request
  // for any route, e.g. /tea/inventory). Registered with the default
  // (root) scope, this worker is reachable from every page on the site,
  // not just the installable PWA entry points (/, /explore, /saferide360)
  // it was written for — and a single dropped network request here used
  // to fall through to a bare, unstyled 503 response with nothing precached
  // for most routes, which browsers can render as a hard navigation failure
  // ("This page couldn't load"). Letting the browser handle navigations
  // itself means a normal network hiccup just retries normally, exactly
  // like it would with no service worker installed at all. Sub-resource
  // caching (JS/CSS/icons) below is unaffected, so the installed-PWA
  // experience on /explore keeps working offline.
  if (event.request.mode === 'navigate') return;

  // Skip non-GET, cross-origin, and API requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/v1/')) return;

  // Network-first: always try the live deploy first, so a new release is
  // visible on the very next load instead of needing two reloads (or never,
  // since the previous stale-while-revalidate strategy returned the cached
  // copy immediately regardless of how fresh the network response was).
  // The cache is only ever used as a fallback when the network genuinely
  // fails (offline) — matching what this worker's own offline message says
  // it does.
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then((cached) => cached || new Response('', { status: 504 }))
    )
  );
});

// Background sync placeholder
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
