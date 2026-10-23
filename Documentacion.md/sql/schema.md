# sql/schema.sql

## ¿Para qué sirve?
Crea la base de datos con todas sus tablas.

## ¿Qué hace?
- crea la base hamburguer_copiway (si ya existía, la **borra** primero)
- crea las 23 tablas: clientes, personal, productos, inventario, pedidos, pagos, cierre de caja...
  (qué guarda cada una y cómo se relacionan: [guía 07 — base de datos](../GuiasDelProyecto/General/07-base-de-datos.md))
- crea la configuración inicial de la tienda
- genera solo el PIN de entrega de cada pedido
- en `PEDIDO`: el estado `esperando_pago` y las columnas `codigo_pago` y `vence_pago` (link de pago del pedido manual)
- en `PAGO_TRANSACCION`: la columna `id_pedido` (pago por link; ahí `id_cliente` puede ir vacío)

## ¿Con qué se conecta?
- **Se usa:** una sola vez, al instalar (desde HeidiSQL, phpMyAdmin o la consola).
- **Lo usan:** todos los modelos consultan estas tablas.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | no afecta el sistema si la base ya existe; solo no se puede instalar en otro computador |
| una tabla o columna **en MySQL** | falla lo que la usa: `Unknown column` o `Table ... doesn't exist` |
