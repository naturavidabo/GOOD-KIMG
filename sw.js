/* Good King V0.9.1 — Service Worker con instalación atómica */
const CACHE_NAME = 'good-king-v091-shell';
const CACHE_PREFIX = 'good-king-';
const LOCAL_SHELL = [
  './',
  './index.html',
  './styles.css?v=0.9.1',
  './config.js?v=0.9.1',
  './vendor/supabase-lite.js?v=0.9.1',
  './app.js?v=0.9.1',
  './v06.js?v=0.9.1',
  './v07.js?v=0.9.1',
  './v08.js?v=0.9.1',
  './v09.js?v=0.9.1',
  './manifest.webmanifest?v=0.9.1',
  './version.json',
  './assets/logo.jpg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-64.png'
];

async function installAtomically() {
  // Si un archivo obligatorio falla, se elimina el caché incompleto y la versión
  // anterior continúa activa. Nunca promovemos una actualización parcial.
  await caches.delete(CACHE_NAME);
  const cache = await caches.open(CACHE_NAME);
  try {
    for (const url of LOCAL_SHELL) {
      const request = new Request(url,{cache:'reload'});
      const response = await fetch(request);
      if (!response || !response.ok) throw new Error(`Recurso obligatorio no disponible: ${url} (${response?.status || 'sin respuesta'})`);
      await cache.put(request,response.clone());
    }
    await cache.put(new Request('./__shell_complete__'),new Response('0.9.1',{headers:{'Content-Type':'text/plain'}}));
  } catch (error) {
    await caches.delete(CACHE_NAME);
    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await installAtomically();
    // En una actualización dejamos el worker en espera. Good King lo activa solo cuando el usuario pulsa Actualizar.
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const complete = await cache.match('./__shell_complete__');
    if (!complete) throw new Error('Good King V0.9.1 no activó porque el App Shell está incompleto.');
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
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
    return (await cache.match(request,{ignoreSearch:true})) || (fallback ? await cache.match(fallback,{ignoreSearch:true}) : null) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request,{ignoreSearch:true});
  if(cached) return cached;
  try {
    const response=await fetch(request);
    if(response?.ok) await cache.put(request,response.clone());
    return response;
  } catch(error) {
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  if(event.request.mode==='navigate') return event.respondWith(networkFirst(event.request));
  if(/\/(version\.json|config\.js)$/.test(url.pathname)) return event.respondWith(networkFirst(event.request,null));
  event.respondWith(cacheFirst(event.request));
});
