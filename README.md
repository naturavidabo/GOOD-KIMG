# Good King V0.4

Versión enfocada en instalación PWA estable, migración segura desde V0.3, clientes autorizados, catálogo editable y preparación real de Supabase.

## Publicación
Sube todo el contenido de este paquete a la raíz del repositorio GitHub Pages (`main` / `root`). No borres los datos del sitio al actualizar.

## Instalación móvil
1. Abre la URL publicada con Chrome.
2. Espera a que la barra de estado muestre que el Service Worker está activo.
3. Pulsa **Instalar app**.
4. Si Android no muestra el instalador, entra a **Más → Configuración → Reparar instalación**. Esta acción borra caché y registro PWA, pero conserva IndexedDB.

## Supabase
1. Crea un proyecto.
2. Ejecuta `supabase/schema-v0.4.sql` en SQL Editor.
3. En Good King abre **Más → Configuración → Configurar Supabase**.
4. Pega la URL del proyecto y la clave pública anon/publishable. Nunca uses `service_role`.
5. Prueba la conexión y luego activa la sincronización.

La operación diaria sigue siendo local-first: una falla de internet o Supabase no bloquea las ventas.
