// ============================================================
//  sw.js — Service Worker v2
//  แก้ไข: cache strategy + install trigger ที่ถูกต้อง
// ============================================================

const CACHE_NAME   = 'gallery-pwa-v2';
const CACHE_URLS   = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// ─── Install: pre-cache ทันที ───
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(CACHE_URLS); })
      .then(function() { return self.skipWaiting(); }) // activate ทันที
  );
});

// ─── Activate: ลบ cache เก่าทั้งหมด ───
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k);  })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// ─── Fetch: Network first, Cache fallback ───
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // ข้าม Google APIs (ต้องออนไลน์เสมอ)
  if (url.hostname.includes('google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('tailwindcss.com') ||
      url.hostname.includes('fonts.googleapis.com')) {
    return;
  }

  // ข้าม non-GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        // cache response ใหม่
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      })
      .catch(function() {
        return caches.match(e.request)
          .then(function(cached) { return cached || caches.match('/index.html'); });
      })
  );
});
