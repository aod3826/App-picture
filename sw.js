// ============================================================
//  sw.js — Service Worker v3
//  แก้ path ให้ตรงกับ GitHub Pages repo subdirectory
// ============================================================

const CACHE_NAME = 'gallery-pwa-v3';
const BASE       = '/App-picture';
const CACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192x192.png',
  BASE + '/icons/icon-512x512.png',
  BASE + '/icons/apple-touch-icon.png',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(CACHE_URLS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  if (url.hostname.includes('google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('tailwindcss.com')) { return; }
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      })
      .catch(function() {
        return caches.match(e.request)
          .then(function(cached) { return cached || caches.match(BASE + '/index.html'); });
      })
  );
});
