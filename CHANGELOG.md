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
