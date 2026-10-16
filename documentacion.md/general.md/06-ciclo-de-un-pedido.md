# 6. El ciclo de un pedido

## Resumen
```
CLIENTE              COCINA                       DOMICILIARIO                         ADMIN
───────              ──────                       ────────────                         ─────
Arma el carrito
Paga  ──────────►  Pendiente
                     │ "Preparar"
                   En Preparación
                     │ "Listo"
                   Listos  ─────────────────►  Toma el pedido
                                                 │ "Iniciar ruta"
                                               En Camino ── WhatsApp al cliente
Le dice el PIN ◄──────────────────────────────  │ escribe el PIN
                                               Entregado
Califica                                                                  Cierre de caja
                                                                          (archiva los entregados)
```

## Estados del pedido
| En MySQL (`PEDIDO.estado`) | En pantalla | Quién lo cambia | Ruta |
|---|---|---|---|
| `pendiente` | Pendiente | Se crea así | `POST /api/orders` |
| `en_preparacion` | En Preparación | Cocina (o admin) | `PATCH /api/orders/{id}/preparing` |
| `listo` | Listos | Cocina (o admin) | `PATCH /api/orders/{id}/ready` |
| `listo` + domiciliario asignado | Listos | Domiciliario | `PATCH /api/orders/{id}/take` |
| `en_camino` | En Camino | Domiciliario | `PATCH /api/orders/{id}/accept` |
| `entregado` | Entregado | Domiciliario con el PIN | `PATCH /api/orders/{id}/deliver` |
| `cancelado` | Cancelado | (existe en la base de datos; hoy no hay pantalla para cancelar) | — |

PHP no deja saltarse pasos: por ejemplo, no se puede marcar como listo un pedido que ya va en camino
(responde 409 "Transición de estado no permitida").

## Paso 1: el cliente crea el pedido
Todo pasa en `PedidoService::crear()` (`models/PedidoService.php`):
1. **¿Tienda abierta?** Revisa el horario, el cierre manual y la pausa de emergencia. Si está cerrada → 403.
2. **Recalcula los precios en el servidor** (nunca usa los que envía el navegador):
   - Producto normal = precio del producto + precio de los extras.
   - Hamburguesa del creador = suma de sus ingredientes.
   - Precio de cada ingrediente = `costo unitario × (1 + margen %)`, redondeado a la centena.
3. **Domicilio** = la tarifa plana de los ajustes.
4. **Descuento de cumpleaños** = 15 % del subtotal si hoy es su cumpleaños.
5. **Canje de puntos** (si el cliente marcó "Usar mis puntos" y tiene el mínimo de Ajustes): cada
   punto descuenta su valor configurado, solo sobre los productos (nunca sobre el domicilio).
6. **Total** = subtotal − cumpleaños − puntos + domicilio. **Puntos ganados** = 1 por cada $1.000 del total.
7. **Pago:**
   - Efectivo → queda "pendiente" hasta la entrega.
   - Digital → se verifica que la transacción esté aprobada, que el monto coincida y que no se haya usado antes.
8. **En una transacción** (todo o nada): descuenta los puntos canjeados, guarda el pedido, sus productos y personalizaciones, y **descuenta el inventario** (receta del producto, menos lo que quitó, más los extras, más la bolsa). Si falta stock de algo → no se guarda nada (tampoco se gastan los puntos) y responde "Sin stock suficiente de ...".
9. MySQL genera el **PIN de entrega** con un trigger.

### Variante: pedido manual del administrador
Cuando un pedido llega por **llamada o WhatsApp**, el admin lo registra en **Comandas Activas →
Ingreso de Orden Manual** (`PedidoService::crearManual()`, ruta `POST /api/orders/manual`):
- Escribe nombre, celular, dirección y por dónde llegó, y elige los productos.
- Se aplican las mismas reglas: horario, precios recalculados en el servidor e inventario.
- Si el celular es de un **cliente registrado**, el pedido queda en su cuenta (y suma puntos al
  entregarse). Si no, queda como **cliente invitado**.
- Se paga en **efectivo** al entregar. Desde ahí sigue el mismo camino que un pedido web.

## Paso 2: la cocina
- Con cada pedido nuevo suena una campana en el panel de cocina y en el del admin.
- "Preparar" → En Preparación (guarda qué ayudante lo tomó).
- "Listo" → Listos (guarda la hora; con eso se calcula el tiempo promedio de preparación).
- En preparación hace más de 15 minutos → la tarjeta se marca en rojo.

## Paso 3: el domiciliario
1. **Tomar** un pedido "Listos" → queda asignado a él. Si otro lo tomó primero, recibe un error (el pedido se bloquea en la base de datos mientras se asigna, así nunca lo toman dos).
2. **Soltar** (si aún no salió) → vuelve a quedar disponible.
3. **Iniciar ruta** → "En Camino". Ahora puede ver el teléfono del cliente y escribirle por WhatsApp.
   Si el admin corrige la dirección mientras tanto (`PATCH /api/orders/{id}/address`), el mapa del
   domiciliario se actualiza y le aparece el aviso "Dirección Actualizada".
4. **Entregar** → escribe el PIN que le dice el cliente. Si es correcto:
   - el pedido pasa a **Entregado**,
   - el pago queda **aprobado** (en efectivo, ya lo cobró),
   - al cliente se le suman los **puntos** y el **total gastado** (si es un invitado, no aplica),
   - se envía la **notificación** "¡Tu pedido ha llegado!" al celular del cliente.

## Paso 4: el cliente califica
Desde **Historial** (o tocando la notificación) califica de 1 a 5 estrellas con un comentario. Solo se
pueden calificar pedidos propios y entregados. Las reseñas con comentario aparecen en la página de inicio.

## Paso 5: el cierre de caja (administrador)
En **Ajustes y Caja → Cierre de caja**:
1. **Vista previa** (no guarda nada): ventas totales, efectivo vs digital, cuánto debe entregar cada domiciliario (su base + lo que cobró en efectivo), insumos consumidos, costo, ganancia y margen.
2. **PDF** del reporte para ver o descargar.
3. **Confirmar**: guarda el reporte, **archiva** los pedidos entregados del turno (no los borra) y registra las liquidaciones.

Solo se puede hacer **un cierre por día** por administrador.

## Qué pasa con el inventario en cada paso
| Momento | Qué pasa |
|---|---|
| Crear pedido | Se descuenta la receta (menos lo quitado, más los extras y la bolsa) y se registra una "salida" con el número del pedido. |
| Admin suma stock | "Entrada" en el historial. |
| Cierre de caja | Se calcula cuánto se gastó de cada insumo en el turno, con base en esas salidas. |
