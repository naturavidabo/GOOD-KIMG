# Good King V0.5.1

Versión correctiva de conexión y actualización.

## Correcciones principales
- Se eliminó el encabezado HTTP personalizado que podía provocar bloqueo CORS y `Failed to fetch` al iniciar sesión.
- La prueba de Supabase usa `/auth/v1/health` con el encabezado `apikey`, compatible con claves publishable.
- Inicio de sesión con diagnóstico de red y alternativa REST controlada.
- Botones visibles para buscar y reparar actualizaciones desde el acceso y desde Configuración.
- `version.json` y verificación de versión publicada sin caché.
- Service Worker V0.5.1 con actualización de archivos críticos mediante red primero.
- La reparación de actualización no elimina IndexedDB ni los datos del negocio.

## Publicación
Subir todos los archivos a la raíz del repositorio de GitHub Pages. No borrar datos del sitio.
