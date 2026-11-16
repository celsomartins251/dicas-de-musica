/* Estante de Partituras — Service Worker (atualização atômica + modo offline)
   A versão vem da própria URL de registro: sw.js?v=AAAA.MM.DD.N
   - install: baixa o HTML da versão, valida (completo e com a versão esperada) e só então grava o cache.
     Se qualquer passo falhar, a instalação é abortada e a versão anterior continua ativa.
   - activate: remove caches de versões antigas somente depois que a nova está completa.
   - fetch: só intercepta a navegação para o próprio app (cache primeiro; sem cache, rede). O resto passa direto. */
'use strict';
const VERSION=new URL(self.location.href).searchParams.get('v')||'0';
const PREFIX='estante-app-';
const CACHE=PREFIX+VERSION;
const APP_URL=new URL('app-estante-de-partituras.html',self.location.href).href;

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const res=await fetch(new Request(APP_URL,{cache:'reload',credentials:'omit'}));
    if(!res.ok) throw new Error('HTTP '+res.status);
    const txt=await res.clone().text();
    if(txt.length<1000000||!/<\/html>\s*$/i.test(txt)) throw new Error('arquivo incompleto');
    if(txt.indexOf("APP_VERSION='"+VERSION+"'")<0) throw new Error('versão publicada diferente da esperada');
    const c=await caches.open(CACHE);
    await c.put(APP_URL,res);
    self.skipWaiting();
  })().catch(err=>{caches.delete(CACHE);throw err}));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.mode!=='navigate'||r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin+u.pathname!==APP_URL.split('?')[0]) return;
  e.respondWith((async()=>{
    const hit=await caches.match(APP_URL,{cacheName:CACHE})||await caches.match(APP_URL);
    if(hit) return hit;
    return fetch(r);
  })());
});
