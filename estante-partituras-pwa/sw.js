/* Estante de Partituras PWA — cache isolado da plataforma */
'use strict';
const VERSION=new URL(self.location.href).searchParams.get('v')||'0';
const PREFIX='estante-pwa-';
const CACHE=PREFIX+VERSION;
const APP_URL=new URL('index.html',self.location.href).href;

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const response=await fetch(new Request(APP_URL,{cache:'reload',credentials:'omit'}));
    if(!response.ok) throw new Error('Falha ao baixar o aplicativo: HTTP '+response.status);
    const source=await response.clone().text();
    if(source.length<1000000||!/<\\/html>\\s*$/i.test(source)) throw new Error('Arquivo do aplicativo incompleto');
    if(!source.includes("APP_VERSION='"+VERSION+"'")) throw new Error('Versão publicada não corresponde ao Service Worker');
    const cache=await caches.open(CACHE);
    await cache.put(APP_URL,response);
    await self.skipWaiting();
  })().catch(async error=>{await caches.delete(CACHE);throw error}));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.mode!=='navigate'||request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname!==new URL(APP_URL).pathname) return;
  event.respondWith((async()=>{
    const cached=await caches.open(CACHE).then(cache=>cache.match(APP_URL));
    if(cached) return cached;
    return fetch(request);
  })());
});
