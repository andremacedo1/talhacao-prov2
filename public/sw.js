/**
 * ============================================================================
 * MÓDULO: Service Worker (PWA)
 * DESCRIÇÃO: Cache básico para funcionamento offline do Talhação PRO v2.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * ============================================================================
 */

const CACHE_NAME = 'talhacao-pro-v2-cache-v1';
const urlsToCache = [
  '/',
  '/globals.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});