# app/Services/PedidoService.php

## ¿Para qué sirve?
Contiene las **reglas del negocio de los pedidos**: crear un pedido (checkout del cliente o pedido
manual del administrador), calcular precios, canjear puntos, verificar el pago, descontar
inventario, cambiar de estado, corregir la dirección, confirmar la entrega con PIN y guardar la
reseña.

**Modelo vs Service:** el modelo `Pedido` solo **lee**. Este service **decide y ejecuta** los pasos
que tienen reglas (por ejemplo: "solo se puede pasar a Listo si estaba Pendiente o En Preparación").

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `OrderController.php` | Crear (web y manual), cambiar estados, dirección y destino. |
| ← lo usa | `PaymentController.php` | `cotizar()`: total antes de pagar. |
| → usa | `Configuracion` | Horario, tarifa de domicilio, margen, bolsa global, reglas de puntos. |
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

## `crear($idCliente, $payload)` — pedido web del cliente
`$payload` es lo que envió React: `items`, `address`, `paymentMethod`, `bank`, `lat`, `lng`,
`paymentTransactionId` y `usePoints` (si quiere pagar parte con sus puntos).

1. **¿Tienda abierta?** `$configModel->tiendaAbiertaAhora()`. Si no → excepción ("cerrada o pausada").
2. **¿Hay ítems y existe el cliente?** Si no → `InvalidArgumentException`.
3. **Calcular precios** con `calcular()` (nunca se usan los precios que envía el navegador). Si
   `usePoints` viene en `true`, el cálculo incluye el canje de puntos.
4. **Pago:**
   - Efectivo → `estado_pago = 'pendiente'` (se cobra en la puerta).
   - Digital → `PagoService::verificarTransaccion()` revisa que la transacción esté aprobada y que el monto coincida. También revisa que ese pago no se haya usado antes en otro pedido.
5. Llama a `guardar()` con el destino (`canal = 'web'`), el pago y el cálculo.

## `crearManual($idAdmin, $payload)` — pedido por llamada o WhatsApp
`$payload`: `items`, `clientName`, `clientPhone`, `address`, `channel` (`llamada` o `whatsapp`).

1. **¿Tienda abierta?** Igual que en `crear()`: fuera de horario tampoco se registran pedidos manuales.
2. Deja solo los dígitos del celular y busca un **cliente activo** con ese número
   (`buscarClientePorTelefono()`, acepta el número con o sin el `57`).
   - Si lo encuentra, el pedido queda **en su cuenta**: recibe el descuento de cumpleaños y, al
     entregarse, suma puntos.
   - Si no, el pedido queda como **cliente invitado** (`id_cliente = NULL`).
3. El pago siempre es **efectivo** al entregar. No se canjean puntos.
4. Llama a `guardar()` guardando además quién lo registró (`id_admin_registro`) y el nombre y
   celular que dictó el cliente (`nombre_contacto`, `telefono_contacto`).

## `guardar($destino, $pago, $calculo, $configModel)` (privado) — lo que comparten los dos
En una **transacción** (`begin_transaction`), todo se guarda junto o no se guarda nada:
1. **Canje de puntos** (si hay): vuelve a leer el saldo del cliente con `FOR UPDATE` (bloquea la
   fila) y lo descuenta. Si mientras tanto el saldo bajó → "Tu saldo de puntos cambió...". Así dos
   pedidos al mismo tiempo no pueden gastar los mismos puntos.
2. `INSERT INTO PEDIDO` → `$idPedido`. Los **puntos ganados** son `floor($total / 1000)` (1 por cada
   $1.000 del total que se paga); se suman al cliente al **entregar**.
3. Por cada ítem: `INSERT INTO DETALLE_PEDIDO` → `$idDetalle`.
4. Por cada extra o ingrediente quitado: `INSERT INTO PERSONALIZACION`.
5. Arma `$lineasDescuento`: la receta del producto (menos lo quitado) × cantidad, más los extras, más la bolsa global.
6. `$ingredienteModel->descontarPorReceta(...)`: si falta stock, lanza un error y el `rollback()`
   deshace todo el pedido (incluido el canje de puntos).
7. `commit()` y devuelve el id del pedido.

### Variables importantes
| Variable | Qué tiene |
|---|---|
| `$calculo` | Lo que devuelve `calcular()`: `items`, `subtotal`, `envio`, `descuento`, `puntosCanjeados`, `descuentoPuntos`, `total`. |
| `$destino` | A quién y a dónde: `id_cliente` (o `null` si es invitado), `id_admin`, `nombre`, `telefono`, `direccion`, `lat`, `lng`, `canal`. |
| `$pago` | `metodo` (`efectivo`/`digital`), `banco`, `estado`, `fecha` y `comprobante` (id de la transacción `sbx-...`). |
| `$lineasDescuento` | Lista de `['id_ingrediente', 'cantidad', 'motivo']` que se descuenta del inventario. |

## `calcular($cliente, $payload, $configModel, $usarPuntos)`
Recorre cada ítem del carrito:
- **Hamburguesa armada en el "Creador interactivo"** (`stack`, sin `productId`): su precio es la suma de los ingredientes elegidos. Se guarda colgada del producto oculto "Hamburguesa Personalizada".
- **Producto normal:** precio del producto + precio de los extras.

Después:
- `envio`: tarifa del domicilio.
- `descuento`: cumpleaños (0 si es un invitado, porque no hay fecha de nacimiento).
- **Canje de puntos** (solo si `$usarPuntos` y el cliente tiene al menos el mínimo de Ajustes):
  `puntosCanjeados` = lo menor entre el saldo y los puntos que alcanzan para cubrir los productos
  (`(subtotal − descuento) ÷ valor del punto`, sin decimales). Nunca se descuenta el domicilio.
  `descuentoPuntos = puntosCanjeados × valor del punto`.
- `total = subtotal − descuento − descuentoPuntos + envío`.

## Otros métodos privados
| Método | Qué hace |
|---|---|
| `buscarCliente($idCliente)` | La fila del cliente. |
| `buscarClientePorTelefono($telefono)` | El cliente **activo** con ese celular (compara solo los dígitos, con o sin el `57`), o `null`. |
| `sumarPrecios($ingredientes)` | Suma el `precio_extra` de una lista. |
| `productoPersonalizadoOculto()` | Busca el producto "Hamburguesa Personalizada"; si no existe, lo crea (y su categoría "Personalizado"). |
| `resolverIngredientes($referencias, $margen)` | Busca cada ingrediente por id o por nombre y calcula su precio: `round(costo × (1 + margen/100) / 100) × 100` → redondeado a la centena. |
| `descuentoCumpleanos($cliente, $subtotal)` | Si hoy (`date('m-d')`) es su cumpleaños → 15 % del subtotal. |

## `cotizar($idCliente, $payload)`
Lo mismo que `calcular()` pero solo devuelve el **total**, sin guardar nada. Lo usa el pago digital
antes de abrir la pasarela. Respeta `usePoints`, así el monto que se firma para la pasarela es el
mismo que se cobra al crear el pedido.

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

## Dirección y destino
| Método | Qué hace |
|---|---|
| `cambiarDireccion($id, $direccion)` | El admin corrige la dirección de un pedido que aún no se entrega (pendiente, en preparación, listo o en camino). Borra `destino_lat`/`destino_lng` para que el mapa del domiciliario vuelva a ubicar la dirección. Si el pedido ya se entregó → excepción. |
| `guardarDestino($id, $idDomiciliario, $lat, $lng)` | Guarda las coordenadas que el domiciliario ubicó en su mapa. Solo cambia pedidos asignados a él y en "listo" o "en_camino". |

`transicion($idPedido, $desdeValidos, $hacia)` (privado) revisa que el estado actual esté en la
lista permitida; si no, lanza "Transición de estado no permitida."

`bloquearPedido($idPedido)` (privado) lee el pedido con `FOR UPDATE`. Así, si dos domiciliarios
intentan tomar el mismo pedido al mismo tiempo, solo uno lo consigue.

### `confirmarEntrega()` explicado
1. Revisa que el pedido esté "en_camino" y sea de este domiciliario.
2. `hash_equals($row['pin_entrega'], $pin)` compara el PIN de forma segura. Si no coincide → "PIN incorrecto."
3. En una transacción: marca el pedido como **entregado** y el pago como **aprobado**, y le suma al
   cliente sus **puntos** y su **total gastado** (si es un invitado, no hay cuenta a la que sumarle).
4. Si el pedido tiene cliente registrado, intenta enviar la notificación push. Está en su propio `try/catch (Throwable $e)`: si falla, solo
   se anota en el log y la entrega queda confirmada igual.

## `calificar($idPedido, $puntaje, $comentario)`
Guarda la reseña. `ON DUPLICATE KEY UPDATE`: si el pedido ya tenía reseña, la reemplaza.
