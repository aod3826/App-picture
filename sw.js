// ============================================================
//  sw.js — Service Worker (PWA Offline Support)
//  คลังรูปภาพกิจกรรม
// ============================================================

const CACHE_NAME    = 'gallery-pwa-v1';
const OFFLINE_PAGE  = './index.html';

// ไฟล์ที่ cache ไว้สำหรับใช้ offline
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
];

// ─── Install: pre-cache ไฟล์หลัก ───
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ─── Activate: ลบ cache เก่า ───
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key)   { return caches.delete(key);  })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ─── Fetch: Network First, fallback Cache ───
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // ข้าม request ไป Google Apps Script (ต้องออนไลน์เสมอ)
  if (url.hostname === 'script.google.com' || url.hostname === 'drive.google.com') {
    return;
  }

  // ข้าม non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // cache response ใหม่
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // offline fallback
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match(OFFLINE_PAGE);
        });
      })
  );
});
