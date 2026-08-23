# Actualización de Arquitectura · Good King V0.9.1

## Objetivo

V0.9.1 es una versión de saneamiento. No amplía el modelo de negocio ni cambia IndexedDB; endurece la capa de acceso, actualización y recuperación para preparar V1.0.0.

## Decisiones

1. **Local-first se conserva.** IndexedDB continúa siendo la base operativa inmediata y Supabase la base central/remota.
2. **Cliente Supabase empaquetado.** Good King deja de necesitar una CDN externa para iniciar Auth y ejecutar PostgREST/RPC/Storage.
3. **Configuración administrada.** El proyecto oficial se restaura desde `config.js` si la copia local se queda vacía o desincronizada.
4. **PWA atómica.** Ninguna versión nueva se activa si el App Shell obligatorio está incompleto.
5. **Activación controlada.** Durante una actualización, el Service Worker queda en espera hasta que el usuario confirme el cambio.
6. **Diagnóstico trazable.** El acceso distingue fallos de configuración, red, Auth, API de datos y membresía.
7. **Sin migración de datos.** `DB_VERSION` permanece en 8 y no se eliminan almacenes.

## Camino a V1.0.0

Después de publicar V0.9.1 deben probarse con el proyecto real: administrador, propietaria, venta online, venta offline + reconexión, cierre de caja, inventario, compra, gasto, respaldo/restauración y acceso remoto desde un segundo dispositivo. Solo después de esas pruebas conviene etiquetar V1.0.0.
