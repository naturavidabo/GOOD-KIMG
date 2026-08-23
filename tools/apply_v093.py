from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
VERSION = '0.9.3'

V093_JS = r'''\
'use strict';

/* Good King V0.9.3 · catálogo visual y pedido móvil optimizado */
const V093_VERSION = '0.9.3';
const BUILTIN_PRODUCT_PHOTOS_V093 = {
  'coca-mini': 'https://www.coca-cola.com/content/dam/onexp/bo/es/brands/coca-cola/new/coca_cola_300ml.jpg',
  'coca-pop': 'https://www.coca-cola.com/content/dam/onexp/bo/es/brands/coca-cola/new/coca_cola_600ml.png',
  'coca-2l': 'https://www.coca-cola.com/content/dam/onexp/bo/es/brands/coca-cola/new/coca_cola_2l.jpg',
  'coca-3l': 'https://www.coca-cola.com/content/dam/onexp/bo/es/brands/coca-cola/new/coca_cola_3l.jpg',
  'jugo': 'https://www.jugosbolivianos.com.bo/wp-content/uploads/2023/10/Popular-durazno-700x700.jpg',
  'extra-arroz': 'https://images.pexels.com/photos/8923092/pexels-photo-8923092.jpeg?auto=compress&dpr=1&h=750&w=1260',
  'extra-papa': 'https://images.pexels.com/photos/3727186/pexels-photo-3727186.jpeg?auto=compress&dpr=1&h=750&w=1260',
  'extra-salchi': 'https://images.pexels.com/photos/14018214/pexels-photo-14018214.png?auto=compress&dpr=1&h=750&w=1260',
  'extra-ensalada': 'https://images.pexels.com/photos/4887993/pexels-photo-4887993.jpeg?auto=compress&dpr=1&h=750&w=1260',
  'extra-huevo': 'https://images.pexels.com/photos/32972557/pexels-photo-32972557.jpeg?auto=compress&dpr=1&h=750&w=1260'
};
function normalizeProductNameV093(value) { return String(value || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,''); }
function builtinPhotoForProductV093(product) {
  if (!product) return '';
  if (BUILTIN_PRODUCT_PHOTOS_V093[product.id]) return BUILTIN_PRODUCT_PHOTOS_V093[product.id];
  const name = normalizeProductNameV093(product.name);
  if (name.includes('coca') && (name.includes('mini') || name.includes('300'))) return BUILTIN_PRODUCT_PHOTOS_V093['coca-mini'];
  if (name.includes('coca') && (name.includes('popular') || name.includes('500') || name.includes('600'))) return BUILTIN_PRODUCT_PHOTOS_V093['coca-pop'];
  if (name.includes('coca') && name.includes('2') && name.includes('lit')) return BUILTIN_PRODUCT_PHOTOS_V093['coca-2l'];
  if (name.includes('coca') && name.includes('3') && name.includes('lit')) return BUILTIN_PRODUCT_PHOTOS_V093['coca-3l'];
  if (name.includes('tropi') || name.includes('jugo embotellado')) return BUILTIN_PRODUCT_PHOTOS_V093['jugo'];
  if (name.includes('porcion') && name.includes('arroz')) return BUILTIN_PRODUCT_PHOTOS_V093['extra-arroz'];
  if (name.includes('porcion') && (name.includes('papa') || name.includes('frita'))) return BUILTIN_PRODUCT_PHOTOS_V093['extra-papa'];
  if (name.includes('porcion') && name.includes('salchi')) return BUILTIN_PRODUCT_PHOTOS_V093['extra-salchi'];
  if (name.includes('porcion') && name.includes('ensalada')) return BUILTIN_PRODUCT_PHOTOS_V093['extra-ensalada'];
  if (name.includes('huevo')) return BUILTIN_PRODUCT_PHOTOS_V093['extra-huevo'];
  return '';
}
productVisualHTML = function(product, admin=false) {
  const source = product?.imageUrl || builtinPhotoForProductV093(product);
  const emoji = escapeHTML(product?.emoji || '🍽️');
  if (!source) return `<span class="food-emoji">${emoji}</span>`;
  const cls = admin ? 'admin-product-photo' : 'product-photo';
  const fallbackCls = admin ? 'admin-fallback image-fallback-v093' : 'food-emoji image-fallback-v093';
  return `<img class="${cls}" src="${escapeHTML(source)}" alt="${escapeHTML(product?.name || 'Producto')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false" /><span class="${fallbackCls}" hidden>${emoji}</span>`;
};
function refreshSegmentA11yV093(id) {
  const group = $(id); if (!group) return;
  group.querySelectorAll('button').forEach(button => { const active = button.classList.contains('active'); button.setAttribute('aria-pressed', active ? 'true' : 'false'); button.setAttribute('aria-checked', active ? 'true' : 'false'); });
}
const originalSetupSegmentV093 = setupSegment;
setupSegment = function(id, setter) { originalSetupSegmentV093(id, value => { setter(value); refreshSegmentA11yV093(id); }); refreshSegmentA11yV093(id); };
window.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  document.title = `Good King V${V093_VERSION}`;
  const side = document.querySelector('.side-footer span'); if (side) side.textContent = `V${V093_VERSION} · Catálogo visual y pedido optimizado`;
  refreshSegmentA11yV093('orderTypeGroup'); refreshSegmentA11yV093('paymentGroup'); renderProducts();
}, 110));
'''

CSS = r'''
/* V0.9.3 · pedido móvil compacto y selección inequívoca */
.segmented button{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;min-height:48px;transition:background .16s ease,color .16s ease,box-shadow .16s ease,transform .12s ease;color:#211f26}
.segmented button.active{background:linear-gradient(135deg,#a80710 0%,#d9131d 64%,#ef3824 100%)!important;color:#fff!important;box-shadow:0 7px 18px rgba(197,17,28,.30)!important}
.segmented button.active::before{content:'✓';display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#fff;color:#c9101a;font-size:14px;font-weight:1000;line-height:1}
.segmented button:active{transform:scale(.985)}
.segmented button[aria-pressed="false"]{background:transparent;color:#211f26}.image-fallback-v093[hidden]{display:none!important}.product-photo{transition:opacity .18s ease}
@media(max-width:760px){.cart-panel{height:min(92dvh,780px);padding:8px 16px max(12px,env(safe-area-inset-bottom))}.cart-grabber{margin:1px auto 5px}.cart-head{padding-bottom:7px}.cart-head span{font-size:12px}.cart-head strong{font-size:25px;line-height:1.05}.round-close{width:40px;height:40px;font-size:24px}.cart-items{min-height:0;max-height:min(17dvh,132px);padding:4px 0;flex:0 1 auto;overscroll-behavior:contain}.cart-line{padding:8px 0;min-height:56px}.cart-line strong{font-size:15px;line-height:1.18}.cart-line small{font-size:12px}.qty{gap:7px}.qty button{width:36px;height:36px;border-radius:12px;font-size:21px}.order-form{flex:1 1 auto;min-height:0;overflow:auto;padding-right:2px;overscroll-behavior:contain}.field-group{padding:7px 0}.field-title{margin-bottom:6px;font-size:15px}.segmented{gap:5px;padding:4px;border-radius:15px}.segmented button{min-height:44px;padding:9px 6px;font-size:15px;border-radius:12px}.segmented button.active::before{width:20px;height:20px;font-size:13px}.quick-notes{gap:5px}.quick-notes button{padding:6px 9px;font-size:11.5px}.text-note{margin-top:7px;gap:4px}.text-note input{padding:10px 12px;min-height:42px}.cart-footer{flex:0 0 auto;margin-top:4px;padding-top:8px;background:#fff}.total-row{margin-bottom:8px;font-size:17px}.total-row strong{font-size:27px}.cart-footer .primary-action{padding:12px 18px;font-size:16px}}
@media(max-width:390px){.cart-panel{height:min(94dvh,790px);padding-left:13px;padding-right:13px}.cart-items{max-height:min(15dvh,112px)}.cart-line{padding:6px 0;min-height:52px}.quick-notes button{padding:5px 8px;font-size:11px}.segmented button{font-size:14px;min-height:42px}}
'''

SW = r'''/* Good King V0.9.3 — Service Worker con instalación atómica */
const CACHE_NAME='good-king-v093-shell', CACHE_PREFIX='good-king-', IMAGE_CACHE_NAME='good-king-v093-product-images';
const PRODUCT_IMAGE_HOSTS=new Set(['www.coca-cola.com','images.pexels.com','www.jugosbolivianos.com.bo']);
const LOCAL_SHELL=['./','./index.html','./styles.css?v=0.9.3','./config.js?v=0.9.3','./vendor/supabase-lite.js?v=0.9.3','./app.js?v=0.9.3','./v06.js?v=0.9.3','./v07.js?v=0.9.3','./v08.js?v=0.9.3','./v09.js?v=0.9.3','./v092.js?v=0.9.3','./v093.js?v=0.9.3','./manifest.webmanifest?v=0.9.3','./version.json','./assets/logo.jpg','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png','./assets/apple-touch-icon.png','./assets/favicon-64.png'];
async function installAtomically(){await caches.delete(CACHE_NAME);const cache=await caches.open(CACHE_NAME);try{for(const url of LOCAL_SHELL){const request=new Request(url,{cache:'reload'}),response=await fetch(request);if(!response||!response.ok)throw new Error(`Recurso obligatorio no disponible: ${url} (${response?.status||'sin respuesta'})`);await cache.put(request,response.clone())}await cache.put(new Request('./__shell_complete__'),new Response('0.9.3',{headers:{'Content-Type':'text/plain'}}))}catch(error){await caches.delete(CACHE_NAME);throw error}}
self.addEventListener('install',event=>event.waitUntil(installAtomically()));self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME),complete=await cache.match('./__shell_complete__');if(!complete)throw new Error('Good King V0.9.3 no activó porque el App Shell está incompleto.');const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&![CACHE_NAME,IMAGE_CACHE_NAME].includes(key)).map(key=>caches.delete(key)));await self.clients.claim()})()));
async function networkFirst(request,fallback='./index.html'){const cache=await caches.open(CACHE_NAME);try{const response=await fetch(request,{cache:'no-store'});if(response?.ok)await cache.put(request,response.clone());return response}catch(error){return(await cache.match(request,{ignoreSearch:true}))||(fallback?await cache.match(fallback,{ignoreSearch:true}):null)||Response.error()}}
async function cacheFirst(request){const cache=await caches.open(CACHE_NAME),cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;try{const response=await fetch(request);if(response?.ok)await cache.put(request,response.clone());return response}catch(error){return Response.error()}}
async function productImageCacheV093(request){const cache=await caches.open(IMAGE_CACHE_NAME),cached=await cache.match(request);const network=fetch(request).then(async response=>{if(response&&(response.ok||response.type==='opaque'))await cache.put(request,response.clone());return response}).catch(()=>null);return cached||await network||Response.error()}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin){if(event.request.destination==='image'&&PRODUCT_IMAGE_HOSTS.has(url.hostname))return event.respondWith(productImageCacheV093(event.request));return}if(event.request.mode==='navigate')return event.respondWith(networkFirst(event.request));if(/\/(version\.json|config\.js)$/.test(url.pathname))return event.respondWith(networkFirst(event.request,null));event.respondWith(cacheFirst(event.request))});
'''

def write(path, text): (ROOT/path).write_text(text, encoding='utf-8')
def read(path): return (ROOT/path).read_text(encoding='utf-8')

def replace_versions(text):
    text = re.sub(r'Good King V0\.9\.[12]', 'Good King V0.9.3', text)
    text = re.sub(r'V0\.9\.[12] · [^<\n]*', 'V0.9.3 · Catálogo visual y pedido optimizado', text)
    text = re.sub(r'\?v=0\.9\.[12]', '?v=0.9.3', text)
    return text

# app.js: metadata only; keep DB version untouched.
app=read('app.js')
app=re.sub(r"const APP_VERSION = '0\.9\.[12]';", "const APP_VERSION = '0.9.3';", app)
app=re.sub(r"sw\.js\?v=0\.9\.[12]", "sw.js?v=0.9.3", app)
app=app.replace('migración e inicio de V0.9.1','migración e inicio de V0.9.3').replace('migración e inicio de V0.9.2','migración e inicio de V0.9.3')
app=replace_versions(app)
assert "const DB_VERSION = 8;" in app and 'deleteDatabase' not in app
write('app.js',app)

# index: bump cache busters and add V093 layer exactly once.
html=replace_versions(read('index.html'))
html=re.sub(r'<title>Good King V[^<]+</title>', '<title>Good King V0.9.3</title>', html)
if 'v093.js' not in html:
    anchor=re.search(r'<script[^>]+src="v092\.js[^>]*></script>',html)
    if anchor: html=html[:anchor.end()]+'\n  <script src="v093.js?v=0.9.3"></script>'+html[anchor.end():]
    else: html=html.replace('</body>','  <script src="v093.js?v=0.9.3"></script>\n</body>')
write('index.html',html)

styles=read('styles.css')
styles=re.sub(r'\n?/\* V0\.9\.3 · pedido móvil compacto y selección inequívoca \*/.*\Z','',styles,flags=re.S)
write('styles.css',styles.rstrip()+'\n\n'+CSS.strip()+'\n')
write('v093.js',V093_JS)
write('sw.js',SW)

cfg=read('config.js').replace('0.9.1','0.9.3').replace('0.9.2','0.9.3')
write('config.js',cfg)

ver={'version':'0.9.3','build':'2026-08-23-v093','notes':'Catálogo visual para bebidas/extras, pedido móvil compacto y selección de alto contraste.'}
write('version.json',json.dumps(ver,ensure_ascii=False,indent=2)+'\n')
manifest=json.loads(read('manifest.webmanifest'))
manifest['name']='Good King V0.9.3'; manifest['start_url']='./index.html?v=0.9.3'
write('manifest.webmanifest',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

changelog=read('CHANGELOG.md') if (ROOT/'CHANGELOG.md').exists() else '# CHANGELOG\n'
if '## V0.9.3' not in changelog:
    changelog += '\n## V0.9.3\n- Fotografías comerciales automáticas para presentaciones Coca-Cola y Tropi Frut; la foto personalizada del producto siempre tiene prioridad.\n- Fotografías genéricas para arroz, papa, salchicha, ensalada y huevo. Los platos propios permanecen sin foto automática.\n- Selectores Mesa/Llevar y Efectivo/QR con estado activo rojo sólido, texto blanco y check visible.\n- Panel de pedido móvil más compacto sin reducir de forma agresiva la legibilidad.\n- IndexedDB permanece en versión 8; sin borrado ni recreación de goodKingDB.\n'
write('CHANGELOG.md',changelog)

# Static verification before commit.
ids=re.findall(r'\bid="([^"]+)"',html); assert len(ids)==len(set(ids))
assert 'v093.js?v=0.9.3' in html
assert 'good-king-v093-shell' in SW and 'v093.js?v=0.9.3' in SW
print('V0.9.3 aplicada sin migración destructiva.')
