# Informe de verificación — Good King V0.5

## Comprobaciones realizadas en el paquete

- Sintaxis JavaScript validada con `node --check`.
- Manifest JSON válido.
- Referencias del App Shell y archivos locales verificadas.
- Migración IndexedDB V3 → V4 diseñada sin eliminación de almacenes anteriores.
- Presencia de `config.js`, credenciales públicas y correos autorizados verificada.
- Flujo de autenticación, cache de contexto, cierre de sesión y acceso offline revisado estáticamente.
- Mapeo local/remoto revisado para caja, ventas, detalle, clientes, movimientos de crédito, productos, auditoría y eventos de sync.
- Protección de escritura administrativa aplicada en interfaz para el rol ayudante.
- Doble confirmación de venta continúa bloqueada mediante `isSaving` y bloqueo local.
- Respaldo, restauración y diagnóstico conservados.

## Pruebas que deben realizarse después de publicar

El entorno de construcción no puede iniciar sesión en el proyecto privado ni conocer las contraseñas. Por ello deben comprobarse en GitHub Pages:

1. Ingreso del administrador.
2. Ingreso de la propietaria.
3. Reconocimiento correcto del rol.
4. Apertura de caja en computadora.
5. Venta en efectivo y QR.
6. Aparición de registros en Supabase.
7. Venta sin internet y sincronización posterior.
8. Consulta del mismo pedido desde el segundo dispositivo.
9. Anulación y actualización remota.
10. Cierre de caja.
11. Conservación de datos de V0.4.
12. Instalación PWA y actualización desde la versión anterior.

## Criterio de aceptación

No borrar datos del navegador. Ante un error, descargar primero el diagnóstico y el respaldo antes de reparar la instalación.
