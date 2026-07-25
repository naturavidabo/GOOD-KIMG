const CACHE_NAME = 'good-king-v051-shell';
const CACHE_PREFIX = 'good-king-';
const LOCAL_SHELL = [
  './', './index.html', './styles.css?v=0.5.1', './config.js?v=0.5.1', './app.js?v=0.5.1',
  './manifest.webmanifest?v=0.5.1', './version.json',
  './assets/logo.jpg', './assets/icon-192.png', './assets/icon-512.png',
  './assets/icon-maskable-512.png', './assets/apple-touch-icon.png', './assets/favicon-64.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of LOCAL_SHELL) {
      try { await cache.add(new Request(url,{cache:'reload'})); }
      catch (error) { console.warn('[Good King] No se pudo precargar:',url,error); }
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request,fallback='./index.html') {
  const cache=await caches.open(CACHE_NAME);
  try {
    const response=await fetch(request,{cache:'no-store'});
    if(response?.ok) await cache.put(request,response.clone());
    return response;
  } catch(error) {
    return (await cache.match(request)) || (fallback ? await cache.match(fallback) : null) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  if(cached) return cached;
  try {
    const response=await fetch(request);
    if(response?.ok) await cache.put(request,response.clone());
    return response;
  } catch(error) { return Response.error(); }
}

self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return; // Supabase y CDN nunca pasan por el SW.
  if(event.request.mode==='navigate') return event.respondWith(networkFirst(event.request));
  if(url.pathname.endsWith('/version.json') || url.pathname.endsWith('/config.js') || url.pathname.endsWith('/app.js') || url.pathname.endsWith('/styles.css') || url.pathname.endsWith('/manifest.webmanifest')) {
    return event.respondWith(networkFirst(event.request,null));
  }
  event.respondWith(cacheFirst(event.request));
});
