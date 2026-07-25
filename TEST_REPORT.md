# Informe de verificación — Good King V0.4

Fecha de construcción: 23/07/2026

## Comprobaciones superadas

- Sintaxis JavaScript de `app.js` y `sw.js` mediante `node --check`.
- Manifest JSON válido.
- Iconos PNG verificados en 192×192, 512×512, 512×512 maskable y 180×180 para Apple.
- `start_url`, `scope`, modo `standalone`, color de tema y enlaces de iconos presentes.
- Todos los archivos precargados por el Service Worker existen.
- El Service Worker ya no utiliza `cache.addAll`; un recurso defectuoso no bloquea toda la instalación.
- Actualización controlada mediante trabajador en espera y mensaje `SKIP_WAITING`.
- Migración conservadora: mismo nombre de base `goodKingDB`, incremento de esquema V2 → V3 y creación exclusiva de almacenes nuevos.
- El respaldo incluye ventas, cajas, movimientos, clientes, cuentas, catálogo, auditoría y errores.
- HTML sin identificadores duplicados y diálogos requeridos presentes.
- Esquema SQL de Supabase incluido y cola local de sincronización implementada.

## Validación que debe realizarse en el celular real

La aparición del aviso nativo de instalación depende de Chrome/Android, HTTPS, caché previa y políticas del dispositivo. Después de publicar en GitHub Pages debe probarse:

1. Actualización desde V0.3 sin borrar datos del sitio.
2. Botón **Instalar app**.
3. Apertura en modo aplicación independiente.
4. Opción **Reparar instalación** si el instalador anterior quedó bloqueado.
5. Persistencia de ventas después de cerrar y reabrir la aplicación.

La reparación de PWA elimina Service Workers y cachés de Good King, pero no elimina IndexedDB.
