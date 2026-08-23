from pathlib import Path
import json,re
root=Path('.')
# index
p=root/'index.html'; s=p.read_text()
s=s.replace('Good King V0.9.3','Good King V0.9.4').replace('?v=0.9.3','?v=0.9.4')
if 'v094.css?v=0.9.4' not in s:
    s=s.replace('<link rel="stylesheet" href="styles.css?v=0.9.4" />','<link rel="stylesheet" href="styles.css?v=0.9.4" />\n  <link rel="stylesheet" href="v094.css?v=0.9.4" />')
if 'v094.js?v=0.9.4' not in s:
    s=s.replace('  <script src="v093.js?v=0.9.4"></script>','  <script src="v093.js?v=0.9.4"></script>\n  <script src="v094.js?v=0.9.4"></script>')
p.write_text(s)
# version
(root/'version.json').write_text(json.dumps({'version':'0.9.4','build':'2026-08-23-v094','notes':'Caja con monto recibido y cambio, tickets separados cocina/cliente, carrito responsive y flujo automático recetas-inventario-mercado.'},ensure_ascii=False,indent=2)+'\n')
# manifest
m=json.loads((root/'manifest.webmanifest').read_text());m['name']='Good King V0.9.4';m['description']='Ventas, caja, tickets, recetas, inventario, mercado y sincronización estable de Good King';m['start_url']='./index.html?v=0.9.4';(root/'manifest.webmanifest').write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n')
# service worker
p=root/'sw.js'; sw=p.read_text().replace('V0.9.3','V0.9.4').replace('v093-shell','v094-shell').replace("IMAGE_CACHE_NAME='good-king-v093-product-images'","IMAGE_CACHE_NAME='good-king-v094-product-images'").replace('?v=0.9.3','?v=0.9.4').replace("new Response('0.9.3')","new Response('0.9.4')")
if "'./v094.css?v=0.9.4'" not in sw: sw=sw.replace("'./styles.css?v=0.9.4'","'./styles.css?v=0.9.4','./v094.css?v=0.9.4'")
if "'./v094.js?v=0.9.4'" not in sw: sw=sw.replace("'./v093.js?v=0.9.4'","'./v093.js?v=0.9.4','./v094.js?v=0.9.4'")
p.write_text(sw)
# changelog
c=root/'CHANGELOG.md'; text=c.read_text() if c.exists() else ''
entry='''\n## V0.9.4 — Caja, tickets y operación de insumos\n- Monto recibido y cambio automático para pagos en efectivo.\n- Dos tickets: comanda de cocina y comprobante de cliente.\n- Prioridad visual para número, Mesa/Llevar e ítems de cocina.\n- Carrito ampliado y desplazamiento visible en PC; mejor uso vertical en celular.\n- Acceso Receta/Costos desde Productos preparados.\n- Lista de mercado automática basada en stock mínimo, con actualización tras ventas.\n- No modifica DB_VERSION; goodKingDB permanece en versión 8.\n'''
if '## V0.9.4' not in text:c.write_text(text+entry)
