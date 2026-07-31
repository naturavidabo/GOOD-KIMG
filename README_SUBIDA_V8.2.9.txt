NATURA VIDA V8.2.9

1. Reemplaza el contenido del repositorio por este paquete.
2. Espera el despliegue de GitHub Pages.
3. Confirma que la app muestre V8.2.9.
4. No requiere una migración nueva para instalar la interfaz.
5. Ejecuta supabase/preflight/01_verify_after_migration.sql para comprobar el RPC de ventas.
6. Realiza una venta de prueba de Bs 1 o producto de prueba y confirma que aparezca el recibo.
7. Si falla, copia el mensaje persistente y el ID de control; ya no desaparecen a los 2,6 segundos.
