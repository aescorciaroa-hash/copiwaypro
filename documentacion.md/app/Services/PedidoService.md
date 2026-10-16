# app/Services/PedidoService.php

## ¿Para qué sirve?
Contiene las **reglas del negocio de los pedidos**: crear un pedido (checkout), calcular precios,
verificar el pago, descontar inventario, cambiar de estado, confirmar la entrega con PIN y guardar
la reseña.

**Modelo vs Service:** el modelo `Pedido` solo **lee**. Este service **decide y ejecuta** los pasos
que tienen reglas (por ejemplo: "solo se puede pasar a Listo si estaba Pendiente o En Preparación").

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `OrderController.php` | Crear y cambiar estados. |
| ← lo usa | `PaymentController.php` | `cotizar()`: total antes de pagar. |
| → usa | `Configuracion` | Horario, tarifa de domicilio, margen, bolsa global. |
| → usa | `PagoService` | Verificar que el pago digital es válido. |
| → usa | `Ingrediente` | Descontar el inventario (`descontarPorReceta`). |
| → usa | `Pedido` | Devolver el pedido creado en formato JSON. |
| → usa | `PushNotificationService` | Avisar al cliente que su pedido llegó. |
| → tablas | `PEDIDO`, `DETALLE_PEDIDO`, `PERSONALIZACION`, `RECETA`, `PRODUCTO`, `INGREDIENTE`, `CLIENTE`, `RESENA` | |

## Variables de la clase
| Variable | Para qué |
|---|---|
| `$this->conn` | La conexión (`global $conn`). |
| `$this->pedidoModel` | Un `new Pedido()` creado en el constructor, para usarlo en varios métodos. |

---

## `crear($idCliente, $payload)` — paso a paso
`$payload` es lo que envió React: `items`, `address`, `paymentMethod`, `bank`, `lat`, `lng`, `paymentTransactionId`.

1. **¿Tienda abierta?** `$configModel->tiendaAbiertaAhora()`. Si no → excepción ("cerrada o pausada").
2. **¿Hay ítems y existe el cliente?** Si no → `InvalidArgumentException`.
3. **Calcular precios** con `calcular()` (nunca se usan los precios que envía el navegador).
4. **Puntos:** `floor($total / 1000)` → 1 punto por cada $1.000.
5. **Pago:**
   - Efectivo → `estado_pago = 'pendiente'` (se cobra en la puerta).
   - Digital → `PagoService::verificarTransaccion()` revisa que la transacción esté aprobada y que el monto coincida. También revisa que ese pago no se haya usado antes en otro pedido.
6. **Transacción** (`begin_transaction`): todo lo siguiente se guarda junto o no se guarda nada:
   - `INSERT INTO PEDIDO` → `$idPedido`.
   - Por cada ítem: `INSERT INTO DETALLE_PEDIDO` → `$idDetalle`.
   - Por cada extra o ingrediente quitado: `INSERT INTO PERSONALIZACION`.
   - Arma `$lineasDescuento`: la receta del producto (menos lo quitado) × cantidad, más los extras, más la bolsa global.
   - `$ingredienteModel->descontarPorReceta(...)`: si falta stock, lanza un error y el `rollback()` deshace todo el pedido.
7. `commit()` y devuelve el pedido con `$this->pedidoModel->buscar(...)`.

### Variables importantes de `crear()`
| Variable | Qué tiene |
|---|---|
| `$calculo` | Lo que devuelve `calcular()`: `items`, `subtotal`, `envio`, `descuento`, `total`. |
| `$esEfectivo` | `true` si `paymentMethod === 'cash'`. |
| `$bancoDigital` | `nequi`, `daviplata` o `bancolombia` (solo en pago digital). |
| `$comprobante` | Id de la transacción de pago (`sbx-...`). |
| `$lineasDescuento` | Lista de `['id_ingrediente', 'cantidad', 'motivo']` que se descuenta del inventario. |

## `calcular($cliente, $payload, $configModel)`
Recorre cada ítem del carrito:
- **Hamburguesa armada en el "Creador interactivo"** (`stack`, sin `productId`): su precio es la suma de los ingredientes elegidos. Se guarda colgada del producto oculto "Hamburguesa Personalizada".
- **Producto normal:** precio del producto + precio de los extras.

Después: `envio` (tarifa del domicilio), `descuento` (cumpleaños) y `total = subtotal - descuento + envío`.

## Otros métodos privados
| Método | Qué hace |
|---|---|
| `buscarCliente($idCliente)` | La fila del cliente. |
| `sumarPrecios($ingredientes)` | Suma el `precio_extra` de una lista. |
| `productoPersonalizadoOculto()` | Busca el producto "Hamburguesa Personalizada"; si no existe, lo crea (y su categoría "Personalizado"). |
| `resolverIngredientes($referencias, $margen)` | Busca cada ingrediente por id o por nombre y calcula su precio: `round(costo × (1 + margen/100) / 100) × 100` → redondeado a la centena. |
| `descuentoCumpleanos($cliente, $subtotal)` | Si hoy (`date('m-d')`) es su cumpleaños → 15 % del subtotal. |

## `cotizar($idCliente, $payload)`
Lo mismo que `calcular()` pero solo devuelve el **total**, sin guardar nada. Lo usa el pago digital
antes de abrir la pasarela.

---

## Cambios de estado
| Método | De → A | Detalle |
|---|---|---|
| `marcarPreparando($id, $idAyudante)` | pendiente → en_preparacion | Guarda quién de cocina lo tomó. |
| `marcarListo($id, $idAyudante)` | pendiente / en_preparacion → listo | Guarda `fecha_listo = NOW()`. |
| `tomarPedido($id, $idDomiciliario)` | (sigue en listo) | Lo asigna al domiciliario. |
| `liberarPedido($id, $rol, $idActor)` | → listo, sin domiciliario | El domiciliario solo suelta los suyos en "listo"; el admin también uno "en_camino". |
| `aceptarEntrega($id, $idDomiciliario)` | listo → en_camino | |
| `confirmarEntrega($id, $idDomiciliario, $pin)` | en_camino → entregado | Ver abajo. |

`transicion($idPedido, $desdeValidos, $hacia)` (privado) revisa que el estado actual esté en la
lista permitida; si no, lanza "Transición de estado no permitida."

`bloquearPedido($idPedido)` (privado) lee el pedido con `FOR UPDATE`. Así, si dos domiciliarios
intentan tomar el mismo pedido al mismo tiempo, solo uno lo consigue.

### `confirmarEntrega()` explicado
1. Revisa que el pedido esté "en_camino" y sea de este domiciliario.
2. `hash_equals($row['pin_entrega'], $pin)` compara el PIN de forma segura. Si no coincide → "PIN incorrecto."
3. En una transacción: marca el pedido como **entregado** y el pago como **aprobado**, y le suma al
   cliente sus **puntos** y su **total gastado**.
4. Intenta enviar la notificación push. Está en su propio `try/catch (Throwable $e)`: si falla, solo
   se anota en el log y la entrega queda confirmada igual.

## `calificar($idPedido, $puntaje, $comentario)`
Guarda la reseña. `ON DUPLICATE KEY UPDATE`: si el pedido ya tenía reseña, la reemplaza.
