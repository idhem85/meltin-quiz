/* ════════════════════════════════════════════════════════════════
   Service Worker — MELTIN QUIZ
   Stratégie :
   - App shell & assets locaux : cache-first (offline immédiat)
   - CDN (React, Firebase, fonts) : network-first avec repli cache
   - Firestore / BroadcastChannel : jamais interceptés (temps réel)
════════════════════════════════════════════════════════════════ */
'use strict';

const CACHE = 'meltin-v2';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/data/defaultQuiz.js',
  './js/core/utils.js',
  './js/core/results.js',
  './js/core/theme.js',
  './js/core/sync.js',
  './js/core/audio.js',
  './js/ui/components.js',
  './js/views/home.js',
  './js/views/participant.js',
  './js/views/host.js',
  './js/views/dashboard.js',
  './js/app.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(LOCAL_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('firestore')) return; // temps réel

  const isLocal = url.origin === self.location.origin;
  const isCDN = ['unpkg.com', 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com', 'cdnjs.cloudflare.com'].includes(url.hostname);

  if (isLocal) {
    // Réseau-d'abord avec repli cache : les déploiements sont visibles
    // dès la prochaine visite en ligne (le cache sert uniquement hors
    // ligne). Chaque réponse réussie rafraîchit le cache.
    event.respondWith(
      fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(event.request).then((hit) => hit || caches.match('./index.html')))
    );
  } else if (isCDN) {
    // Network-first avec repli cache (les CDN évoluent)
    event.respondWith(
      fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(event.request))
    );
  }
});
