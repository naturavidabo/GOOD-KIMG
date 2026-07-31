# Natura Vida V8.2.8 — Informe técnico

## Objetivo

Corregir el bloqueo operativo del Asistente IA al preparar ventas con varios productos, mejorar el contraste de las fichas de **Más** e incorporar una revisión preventiva del cableado de las funciones críticas, sin superar 100 archivos ni alterar automáticamente información comercial.

## Cambios principales

### Asistente IA operativo

- Las solicitudes de venta, cotización o recibo con venta se convierten en un borrador revisable.
- `payment_method` y `sale_type` dejaron de bloquear la preparación: se infieren o se eligen al confirmar.
- Reconocimiento de varias presentaciones y cantidades en una misma orden.
- Resolución del cliente por nombre similar o por el contexto financiero abierto.
- Presentación prioritaria del trabajo listo, antes de explicaciones extensas.
- Apertura automática de la hoja de revisión cuando el borrador está completo.
- Edición de producto, cantidad, tipo de venta y forma de pago antes de continuar.
- La aprobación abre la venta normal con carrito y cliente precargados; la confirmación final sigue siendo humana.

Caso de regresión verificado:

> Tres aceites de 200 ml, uno de 100 ml y dos de 500 ml para Alexia Bio Mujer.

Resultado esperado y comprobado localmente: cliente resuelto, tres productos distintos, cantidades 3/1/2 y ningún bloqueo por forma de pago o tipo de venta.

### Contraste del menú Más

- Ilustraciones vectoriales redibujadas con contornos oscuros y rellenos visibles.
- Títulos, descripciones y llamadas a la acción con contraste reforzado.
- Fondos diferenciados para Operaciones, Personal, Finanzas y Administración.
- Se conserva la tarjeta territorial destacada.

### Saneamiento funcional

En el Centro de control administrativo se añadió una comprobación preventiva de:

- navegación;
- ventas preparadas por IA;
- selector de pago;
- cotizaciones;
- cuentas por cobrar;
- rendición de caja;
- territorio;
- autocompletado de clientes;
- pantalla Más;
- Asistente IA;
- conexión Supabase;
- datos comerciales cargados;
- soporte PWA.

La revisión no modifica datos. Muestra qué componentes están disponibles en la sesión y cuáles requieren revisión.

### Despliegue

- Corregida la referencia del workflow de GitHub Pages, que apuntaba a una prueba inexistente.
- Caché y recursos actualizados a V8.2.8.
- Edge Function actualizada con reglas operativas más estrictas y contexto de catálogo.
- No se requiere una migración SQL nueva.

## Seguridad

La IA no guarda ventas, pagos, precios, inventario ni documentos por sí sola. Prepara el trabajo y exige revisión, edición o aprobación. La venta definitiva y el recibo se generan únicamente mediante el flujo normal de la aplicación.

## Límite del repositorio

Total: **99 archivos**.

## Validación

Se ejecutaron las auditorías estáticas, pruebas de regresión y validación de sintaxis incluidas en el repositorio. La prueba real de Gemini, Supabase, Realtime y los permisos RLS debe completarse después del despliegue en el proyecto productivo.
