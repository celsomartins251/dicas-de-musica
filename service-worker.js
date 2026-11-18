// Service worker compartilhado do site Dicas de Música.
// Para o Cifra & Pauta, mantém uma cópia offline do HTML e atualiza-a pela rede.
// Não limpa localStorage, IndexedDB, autenticação ou dados dos aplicativos.
"use strict";

const APP_CACHE = "dicas-musica-cifra-pauta-v1";
const APP_URL = new URL("./app-cifra-%26-pauta.html", self.location.href).href;
const APP_PATH = new URL(APP_URL).pathname;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    try {
      const response = await fetch(new Request(APP_URL, {cache:"reload", credentials:"same-origin"}));
      if (response.ok) {
        const cache = await caches.open(APP_CACHE);
        await cache.put(APP_URL, response);
      }
    } catch (error) {
      // A instalação do SW não deve falhar se a rede estiver indisponível.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      key.startsWith("dicas-musica-cifra-pauta-") && key !== APP_CACHE
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname !== APP_PATH) return;

  // Online: entrega sempre a versão publicada mais recente e atualiza o cache.
  // Offline: utiliza a última versão completa que foi armazenada.
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(APP_CACHE);
        await cache.put(APP_URL, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(APP_URL);
      if (cached) return cached;
      throw error;
    }
  })());
});
