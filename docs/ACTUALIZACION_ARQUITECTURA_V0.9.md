# Actualización de Arquitectura · Good King V0.9.0

## Objetivo
Convertir la arquitectura funcional V0.8 en una operación integrada y administrable a distancia, sin sacrificar la regla local-first.

## Regla de persistencia
1. Toda operación se confirma primero en IndexedDB.
2. La operación entra a `syncQueue`.
3. Supabase recibe la operación cuando existe sesión autenticada e internet.
4. Si la operación falla, se reintenta con espera progresiva.
5. Después de ocho fallos queda `blocked` y requiere revisión/reintento manual.
6. Un dato remoto nunca sustituye un registro local que sigue pendiente.

## Conflictos
V0.9 incorpora `syncConflicts`. Cuando durante una descarga remota se detecta una versión más nueva en Supabase mientras existe un cambio local pendiente, Good King conserva el cambio local y registra el conflicto para diagnóstico. Al sincronizarse el cambio local, el conflicto se marca como resuelto.

## Control remoto
El módulo `dashboard` consume `good_king_dashboard_v090` y muestra ventas, caja, gastos, compras, deuda, stock bajo, dispositivos y errores de sincronización. Solamente administrador y propietaria pueden abrirlo.

## Permisos
- Administrador: control total.
- Propietaria: operación y administración del negocio.
- Ayudante: venta diaria y caja; sin anulación de ventas, fiados, catálogo, inventario administrativo, compras, gastos, reportes ni control remoto.

## Camino a V1.0
La siguiente fase debe ser principalmente estabilización en uso real: pruebas multi-dispositivo, impresión, cierres reales de caja, restauración de respaldo y correcciones detectadas durante operación.
