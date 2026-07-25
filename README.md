# Good King V0.5 — acceso autenticado y sincronización real

Esta versión conecta la aplicación con el proyecto Supabase de Good King manteniendo la operación **local-first**: IndexedDB guarda primero y Supabase recibe después.

## Publicación en GitHub Pages

1. Descarga y descomprime el ZIP de V0.5.
2. Sustituye los archivos de la raíz del repositorio.
3. Mantén GitHub Pages en `main` y `/(root)`.
4. No borres los datos del sitio ni desinstales la V0.4 antes de actualizar.
5. Abre la página y presiona **Actualizar** si aparece el aviso.

## Primer ingreso

- Administrador: `goodking.bo@gmail.com`
- Propietaria: `gloria.msg27@gmail.com`

La contraseña es la que se creó en Supabase Authentication. La aplicación no almacena contraseñas propias.

## Configuración pública

El archivo `config.js` contiene:

- Project URL.
- Publishable key.
- Correos de acceso rápido.

La publishable key puede estar en el cliente porque las operaciones están protegidas por autenticación y políticas RLS. Nunca se debe colocar `service_role`, secret key o la contraseña de la base.

## Operación offline

- Las ventas, caja, clientes y cambios se guardan en IndexedDB.
- Si no existe conexión, quedan pendientes.
- Al volver internet, la aplicación reintenta automáticamente.
- Un dispositivo que ya verificó un usuario puede usar **Continuar sin conexión**.
- Cerrar sesión manualmente desactiva ese acceso offline hasta el siguiente ingreso válido.

## Sincronización V0.5

Se sincronizan:

- Dispositivos.
- Aperturas y cierres de caja.
- Ventas y detalle de productos.
- Anulaciones.
- Clientes autorizados.
- Fiados y abonos.
- Catálogo de productos.
- Auditoría.

## Seguridad de actualización

La base local sube de versión 3 a 4 sin borrar información. La primera apertura genera nuevamente la cola V0.5 para que registros antiguos no queden marcados como sincronizados únicamente en el esquema de prueba de V0.4.

## Diagnóstico

En **Más → Configuración** se puede:

- Sincronizar ahora.
- Descargar respaldo.
- Restaurar respaldo.
- Verificar integridad.
- Descargar diagnóstico.
- Reparar la instalación PWA.
