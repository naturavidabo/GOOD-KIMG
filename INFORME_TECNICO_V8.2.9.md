# Natura Vida V8.2.9

## Corrección principal

La pantalla “Reintentar la misma operación” demuestra que el fallo ocurre antes de abrir el recibo: la venta no fue confirmada o la respuesta de Supabase se perdió. Esta versión desacopla el guardado del recibo, verifica por ID si la operación ya existe y evita duplicarla.

## Comportamiento

1. Verifica stock.
2. Registra o vincula cliente.
3. Genera numeración.
4. Guarda la venta mediante el RPC atómico.
5. Si hay error, consulta el mismo ID en `sales`.
6. Si existe, recupera la operación y abre el recibo.
7. Si no existe, muestra el error persistente, la etapa y el ID para diagnóstico.
8. Si la venta fue guardada pero falla la vista del recibo, permite abrir el recibo sin repetir la venta.

No se añadió un bypass inseguro que descuente stock fuera de la transacción atómica.
