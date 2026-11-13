// Service worker mínimo: não armazena páginas autenticadas, credenciais ou dados do Firestore.
const VERSION = "celso-martins-pwa-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Não interceptamos requisições: Firebase Auth e Firestore continuam usando a rede
// normalmente, sem risco de servir dados privados ou sessões antigas pelo cache.


// Handler de rede sem cache: atende ao ciclo PWA sem guardar páginas privadas.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
