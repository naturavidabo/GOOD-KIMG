# Cambios Good King V0.5

- Conexión preconfigurada al proyecto Supabase de Good King.
- Inicio de sesión real mediante correo y contraseña.
- Reconocimiento de perfil, negocio y rol desde `business_members`.
- Roles activos: administrador, propietaria y ayudante.
- Sesión persistente y continuidad offline con último usuario verificado.
- Registro remoto de cada dispositivo.
- IndexedDB V4 con migración no destructiva.
- Reencolado controlado de datos de V0.4 para sincronización a tablas reales.
- Sincronización autenticada de caja, ventas, detalle, clientes, cuentas y catálogo.
- Descarga de cambios remotos al dispositivo.
- Auditoría remota y registro de eventos de sincronización.
- Restricción de módulos administrativos para el ayudante.
- Archivo `config.js` independiente para configuración pública.
- Service Worker V0.5 con actualización de caché y soporte del cliente Supabase.
