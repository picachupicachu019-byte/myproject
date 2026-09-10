const cacheName = 'event-nest-shell-v1';
const appShell = ['/', '/index.html', '/style.css', '/live-search.css', '/app.js', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(appShell)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(cacheName).then(cache => cache.put(event.request, copy));
    return response;
  })));
});