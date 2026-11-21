/* BaixoScore Pro — cache isolado da plataforma Dicas de Música. */
const CACHE='baixoscore-v1.0.4';
const APP_URL=new URL('./app-baixoscore-pro.html',self.location.href).href;
const FILES=['./','./app-baixoscore-pro.html','./baixoscore-manifest.webmanifest','./logo-plataforma-dicas-de-musica.svg'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(FILES);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('baixoscore-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin||url.pathname.endsWith('/baixoscore-version.json'))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(response&&response.ok){
        const cache=await caches.open(CACHE);
        await cache.put(request,response.clone());
      }
      return response;
    }catch(error){
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==='navigate'&&url.href===APP_URL){
        const app=await caches.match(APP_URL);
        if(app)return app;
      }
      return Response.error();
    }
  })());
});
