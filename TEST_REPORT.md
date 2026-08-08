# Good King V0.9.0 · Informe de saneamiento

Fecha de preparación: 2026-08-08

## Resultado

La entrega superó las verificaciones estáticas y de empaquetado disponibles en el entorno de desarrollo. Las pruebas que necesitan el proyecto real de Supabase, las cuentas reales, la impresora y la PWA instalada deben completarse después de publicar la versión.

## Verificaciones superadas

- Sintaxis JavaScript válida en `app.js`, `v06.js`, `v07.js`, `v08.js`, `v09.js` y `sw.js` mediante `node --check`.
- `APP_VERSION = 0.9.0` y esquema IndexedDB `DB_VERSION = 8`.
- Migración conservadora: se conserva `goodKingDB` y se agrega el almacén `syncConflicts` sin borrar los almacenes previos.
- Índices locales para conflictos por estado y entidad.
- Sin identificadores HTML duplicados.
- Todos los recursos locales referenciados por HTML existen.
- Manifest JSON válido, nombre V0.9.0, `start_url`, iconos 192/512 y `maskable` presentes.
- Service Worker con caché `good-king-v090-shell` e inclusión de `v09.js`.
- Cola V0.9 con estados `pending`, `error`, `blocked`, backoff progresivo y reintento manual.
- Protección de datos locales pendientes durante descarga remota.
- Conflictos incluidos en `EXPORT_STORES`, por tanto forman parte de respaldo/restauración.
- Panel de Control remoto restringido en la interfaz a administrador/propietaria.
- Anulación de ventas bloqueada en frontend para ayudante.
- SQL V0.9 incluye RPC `good_king_dashboard_v090`, índices y refuerzo de políticas.
- Archivo de verificación SQL incluido.
- ZIP de GitHub Pages generado con archivos directamente en la raíz.
- Comprobación SHA-256 generada para archivos de publicación.

## Comportamiento de sincronización V0.9

1. Una operación se guarda primero localmente.
2. Se coloca en `syncQueue`.
3. Si falla el envío, se aplica espera progresiva para no saturar la conexión.
4. Tras ocho fallos consecutivos, el registro queda `blocked` y no se pierde.
5. El Centro de sincronización permite habilitar nuevamente esos registros.
6. Durante una descarga, un cambio remoto no puede sobrescribir un cambio local aún pendiente.
7. Cuando el cambio local se sincroniza, el conflicto asociado se marca como resuelto.
8. Web Locks evita que dos pestañas del mismo navegador ejecuten la cola al mismo tiempo cuando la API está disponible.

## Pruebas pendientes en entorno real

- Ejecutar `08_good_king_v090_migration.sql` en el proyecto real de Supabase.
- Verificar `09_good_king_v090_verification.sql`.
- Iniciar sesión como administrador, propietaria y ayudante.
- Registrar una venta en la computadora y verla desde el Control remoto del celular.
- Registrar una venta sin internet, reconectar y confirmar que aparezca una sola vez en Supabase.
- Confirmar que el ayudante no pueda anular una venta ni acceder a módulos administrativos.
- Confirmar consumo/reversión de inventario multi-dispositivo.
- Probar compra, gasto, fiado y abono con sincronización real.
- Probar cierre de caja después de operaciones reales.
- Descargar un respaldo V0.9 y restaurarlo en un dispositivo de prueba.
- Probar comanda y ticket con la impresora térmica elegida.
- Instalar/actualizar la PWA desde GitHub Pages en Android.

## Limitación del entorno de pruebas

El navegador Chromium disponible para automatización en este entorno bloquea por política administrativa la navegación a `localhost` y `file://`. Por ello no se afirma una prueba visual automatizada completa de la PWA. La estructura, recursos y sintaxis sí fueron comprobados; la prueba de ejecución móvil se debe realizar después de publicar en HTTPS.
