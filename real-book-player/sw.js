const CACHE='real-book-player-v9';
const CORE=['./','./index.html','./css/app.css','./js/app.js','./js/musicxml-engine.js','./manifest.webmanifest','./samples/teste-omr.musicxml'];
const APP_SCOPE=new URL(self.registration.scope).pathname;
function allowedCdn(url){
 return url.hostname==='cdn.jsdelivr.net'&&(
  url.pathname.startsWith('/npm/opensheetmusicdisplay@2.1.2/')||
  url.pathname.startsWith('/npm/pdfjs-dist@4.10.38/')
 );
}
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(key=>key.startsWith('real-book-player-')&&key!==CACHE).map(key=>caches.delete(key))
 )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url),sameOrigin=url.origin===self.location.origin;
 const appAsset=sameOrigin&&url.pathname.startsWith(APP_SCOPE);
 const cdnAsset=allowedCdn(url);
 if(!appAsset&&!cdnAsset)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok||response.type==='opaque')await cache.put(request,response.clone());
  return response;
 })().catch(async error=>{
  const cached=await caches.match(request);
  if(cached)return cached;
  if(appAsset){const fallback=await caches.match('./index.html');if(fallback)return fallback;}
  throw error;
 }));
});
