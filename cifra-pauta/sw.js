/* Cifra & Pauta — cache offline independente, escopo /cifra-pauta/ */
'use strict';
const CACHE = 'cifra-pauta-offline-v1';
const CORE = ['./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    for (const path of CORE) {
      const response = await fetch(path, {cache:'reload'});
      if (!response.ok) throw new Error('Falha ao preparar recurso offline: '+path);
      await cache.put(path, response);
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    for (const key of await caches.keys()) if (key.startsWith('cifra-pauta-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const base = new URL('./', self.location.href);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(base.pathname)) return;
  event.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, {ignoreSearch:true});
    if (hit) return hit;
    try {
      const response = await fetch(request);
      if (response.ok && ['document','image','style','script'].includes(request.destination)) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
