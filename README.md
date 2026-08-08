# Good King V0.9.0

Versión de consolidación operativa previa a V1.0.0. Integra control remoto, sincronización resistente a fallos, protección de cambios locales pendientes, permisos reforzados y diagnóstico ampliado.

## Actualización desde V0.8.0

1. Desde Good King descarga un respaldo manual.
2. Ejecuta `supabase/08_good_king_v090_migration.sql` en Supabase.
3. Ejecuta `supabase/09_good_king_v090_verification.sql`.
4. Sustituye los archivos del repositorio por este paquete.
5. No borres datos del sitio ni desinstales la PWA.
6. Abre Good King y acepta la actualización.
7. En `Más → Configuración`, ejecuta Verificación integral y Sincronizar ahora.

La base local mantiene el nombre `goodKingDB` y migra de esquema 7 a 8 agregando solamente el almacén `syncConflicts`.

## Funciones V0.9.0

- Panel **Control remoto** para administrador/propietaria.
- Resumen remoto de ventas, efectivo, QR, gastos, compras, deuda, caja y stock bajo.
- Estado de dispositivos conectados y errores remotos recientes.
- Cola de sincronización con bloqueo entre pestañas, reintento progresivo y registros bloqueados tras fallos repetidos.
- Protección de conflictos: un dato remoto nunca pisa un cambio local que todavía está pendiente de sincronizar.
- Centro de sincronización dentro de Configuración.
- Refuerzo de permisos: el ayudante no puede anular ventas ni realizar ajustes administrativos de inventario.
- Sincronización automática periódica cuando la app está visible y con internet.
- Respaldos incluyen el historial de conflictos de sincronización.
- PWA actualizada a caché V0.9.0.

## Archivos nuevos

- `v09.js`: control remoto, sincronización V0.9 y protección de conflictos.
- `supabase/08_good_king_v090_migration.sql`: RPC de control remoto y políticas reforzadas.
- `supabase/09_good_king_v090_verification.sql`: verificación posterior a la migración.
- `docs/ACTUALIZACION_ARQUITECTURA_V0.9.md`: actualización de la arquitectura.

## Seguridad

`config.js` contiene únicamente la clave pública publishable/anon necesaria en el navegador. Nunca colocar `service_role`, secret keys o la contraseña de PostgreSQL en el repositorio.
