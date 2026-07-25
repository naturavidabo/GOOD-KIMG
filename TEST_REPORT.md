# Good King V0.5.1 — Informe de saneamiento

## Verificaciones automáticas
- Sintaxis JavaScript validada con `node --check`.
- Manifest y `version.json` validados como JSON.
- IDs HTML revisados sin duplicados.
- Referencias críticas de archivos verificadas.
- Service Worker actualizado a caché `good-king-v051-shell`.
- IndexedDB mantiene `DB_VERSION = 4`; no se eliminan ni recrean almacenes.

## Correcciones aplicadas
- Eliminado el encabezado personalizado `x-application-name` del cliente Supabase.
- Prueba de conexión cambiada a `/auth/v1/health` usando únicamente `apikey`.
- Diagnóstico con timeout y mensajes diferenciados.
- Inicio de sesión alternativo por REST si el SDK devuelve error de red.
- Verificación de versión mediante `version.json` sin caché.
- Botones de actualización en pantalla de acceso y Configuración.
- Reparación de actualización sin borrar IndexedDB.

## Pruebas que requieren publicación real
- Inicio de sesión contra el proyecto Supabase del usuario.
- Actualización desde PWA V0.4/V0.5 instalada en Android.
- Sincronización real bajo RLS.
