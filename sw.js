/**
 * SERVICE WORKER — NeoBank PWA v2
 * Stratégie cache + network avec fallback offline
 */

const CACHE_VERSION  = 'neobank-v2';
const STATIC_CACHE   = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE  = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  '/pages/index.html',
  '/pages/login.html',
  '/pages/register.html',
  '/pages/dashboard.html',
  '/pages/loans.html',
  '/pages/settings.html',
  '/pages/admin.html',
  '/css/main.css',
  '/css/landing.css',
  '/css/auth.css',
  '/css/dashboard.css',
  '/css/loans.css',
  '/css/settings.css',
  '/css/admin.css',
  '/js/main.js',
  '/js/api.js',
  '/js/simulator.js',
  '/js/security.js',
  '/manifest.json',
  '/assets/icons/favicon.svg'
];

// ─── Installation ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => {
        console.log('[SW] Cache statique prêt');
        return self.skipWaiting();
      })
      .catch(err => console.warn('[SW] Erreur cache install:', err.message))
  );
});

// ─── Activation — nettoyage anciens caches ────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => { console.log('[SW] Suppression cache obsolète:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch — stratégies par type de ressource ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API calls → Network First (avec fallback JSON offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // 2. Google Fonts → Cache First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // 3. CDN (Chart.js) → Cache First
  if (url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // 4. Assets statiques → Cache First
  if (STATIC_ASSETS.some(path => url.pathname.endsWith(path))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 5. Pages HTML → Network First avec fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // 6. Autres → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Stratégies ───────────────────────────────────────────────
async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Vous êtes hors ligne. Vérifiez votre connexion internet.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    const cache    = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback page offline
    return new Response(
      `<!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>NeoBank — Hors ligne</title>
      <style>
        body{font-family:sans-serif;background:#080c14;color:#f0f4ff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;}
        h1{color:#00d4ff;font-size:2rem;}p{color:#8b9bbf;}a{color:#00d4ff;}
      </style></head>
      <body>
        <div>
          <div style="font-size:3rem;margin-bottom:1rem">◆</div>
          <h1>NeoBank</h1>
          <p>Vous êtes actuellement hors ligne.</p>
          <p>Reconnectez-vous à Internet et <a href="/">actualisez la page</a>.</p>
        </div>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache    = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Ressource indisponible hors ligne', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise || new Response('', { status: 503 });
}

// ─── Messages depuis le client ────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// ─── Notifications push (préparation future) ──────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'NeoBank', {
      body:    data.body || '',
      icon:    '/assets/icons/icon-192.svg',
      badge:   '/assets/icons/favicon.svg',
      tag:     data.tag || 'neobank-notif',
      data:    data.url || '/pages/dashboard.html',
      actions: [{ action: 'open', title: 'Voir' }]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/pages/dashboard.html'));
});
