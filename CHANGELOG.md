# Changelog Good King

## V0.9.0
- Panel de control remoto administrativo.
- RPC Supabase `good_king_dashboard_v090`.
- Protección de conflictos remoto/local.
- Cola de sincronización con backoff y estado bloqueado.
- Web Locks para impedir dos sincronizaciones simultáneas en el mismo navegador.
- Reintento manual de registros bloqueados.
- Sincronización automática cada dos minutos cuando corresponde.
- Refuerzo de RLS para inventario y anulación de ventas por ayudante.
- Nuevo almacén IndexedDB `syncConflicts`.
- Diagnóstico y verificación ampliados.
- Service Worker y manifest actualizados a V0.9.0.

## V0.8.0
- Inventario, compras, gastos y reportes consolidados.
- Consumo/reversión de inventario por venta.
- Sincronización ampliada con Supabase.

## V0.9.4 — Caja, tickets y operación de insumos
- Monto recibido y cambio automático para pagos en efectivo.
- Dos tickets: comanda de cocina y comprobante de cliente.
- Prioridad visual para número, Mesa/Llevar e ítems de cocina.
- Carrito ampliado y desplazamiento visible en PC; mejor uso vertical en celular.
- Acceso Receta/Costos desde Productos preparados.
- Lista de mercado automática basada en stock mínimo, con actualización tras ventas.
- No modifica DB_VERSION; goodKingDB permanece en versión 8.
