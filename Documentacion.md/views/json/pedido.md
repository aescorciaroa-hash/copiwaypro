# views/json/pedido.php
¿No entiendes una palabra? Mira el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Organiza los datos de los pedidos antes de enviarlos a React.
Cambia los nombres de la base de datos a los que usa React (ej. `nombre` → `name`, `precio` → `price`).

## ¿Qué hace?
- organiza un pedido con sus productos

## Sus funciones
| Función | Qué hace | La usan |
|---|---|---|
| `pedido_a_json()` | organiza un pedido con sus productos | `Pedido::formar()` |

## ¿Con qué se conecta?
- **Lo carga:** `config/helpers.php` (en todas las peticiones).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte una fila de PEDIDO al JSON del frontend ($items ya viene armado por Pedido::itemsDe)."* |
| 6 | `const PEDIDO_ESTADO_BD_A_APP = [` | Crea la constante `PEDIDO_ESTADO_BD_A_APP`: una lista para traducir el estado de la base de datos al texto que muestra React. |
| 7 | `'esperando_pago' => 'Esperando Pago',` | `'esperando_pago'` se muestra como `'Esperando Pago'`: pedido manual con link de pago que el cliente aún no paga. |
| 8 | `'pendiente' => 'Pendiente',` | `'pendiente'` se muestra como `'Pendiente'`. |
| 9 | `'en_preparacion' => 'En Preparación',` | `'en_preparacion'` → `'En Preparación'`. |
| 10 | `'listo' => 'Listos',` | `'listo'` → `'Listos'`. |
| 11 | `'en_camino' => 'En Camino',` | `'en_camino'` → `'En Camino'`. |
| 12 | `'entregado' => 'Entregado',` | `'entregado'` → `'Entregado'`. |
| 13 | `'cancelado' => 'Cancelado',` | `'cancelado'` → `'Cancelado'`. |
| 14 | `];` | Cierra la lista. |
| 16 | `function pedido_a_json($fila, $items, $rolQueVe, $idQueVe)` | Función `pedido_a_json(...)`: organiza un pedido para React. La usa `Pedido::formar()` (en `models/Pedido.php`). Recibe la fila, los productos (`$items`) y quién lo está viendo (`$rolQueVe`, `$idQueVe`). |
| 17 | `{` | Abre la función `pedido_a_json()`. |
| 18 | `$estado = PEDIDO_ESTADO_BD_A_APP[$fila['estado']] ?? $fila['estado'];` | Traduce el estado con la lista de arriba y lo guarda en `$estado`. `??` = si no está en la lista, deja el original. |
| 20 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El domiciliario solo ve el telefono del cliente si es suyo y va "En Camino"."* |
| 21 | `$mostrarTelefono = true;` | `$mostrarTelefono` empieza en `true` (sí se muestra el teléfono del cliente). |
| 22 | `if ($rolQueVe === 'delivery') {` | Si quien mira es el domiciliario (`'delivery'`)... |
| 23 | `$mostrarTelefono = $fila['estado'] === 'en_camino' && $fila['id_domiciliario'] === $idQueVe;` | ...solo lo ve si el pedido va "En camino" **y** (`&&`) es su pedido. |
| 24 | `}` | Cierra el `if`. |
| 26-27 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El PIN de entrega lo ve el cliente (cuando ya pago) y el admin en pedidos manuales, para dictarselo al cliente invitado. El domiciliario nunca: se lo pide en la puerta."* |
| 28 | `$verPin = ($rolQueVe === 'client' && $fila['estado'] !== 'esperando_pago')` | Guarda en `$verPin` si se puede mostrar el PIN: `true` si quien mira es el cliente **y** (`&&`) el pedido no está esperando el pago... |
| 29 | `\|\| ($rolQueVe === 'admin' && $fila['canal_origen'] !== 'web');` | ...**o** (`\|\|`) si quien mira es el admin **y** el pedido no llegó por la web (es manual: llamada o WhatsApp). |
| 31 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Link de pago: solo el admin, y solo mientras el pedido espera el pago."* |
| 32 | `$codigoLink = ($rolQueVe === 'admin' && $fila['estado'] === 'esperando_pago') ? $fila['codigo_pago'] : null;` | Guarda en `$codigoLink` el código del link de pago, pero solo si quien mira es el admin y el pedido está esperando el pago. Si no, `null`. |
| 34 | `return [` | Devuelve una lista nueva con los nombres que usa React: |
| 35 | `'id' => '#ORD-' . $fila['id_pedido'],` | `'id'`: el código del pedido, por ejemplo `#ORD-12` (`.` une `'#ORD-'` con el número). |
| 36 | `'status' => $estado,` | `'status'`: el estado traducido. |
| 37 | `'client' => $fila['cliente_nombre'],` | `'client'`: el nombre del cliente. |
| 38 | `'clientPhone' => $mostrarTelefono ? $fila['cliente_telefono'] : null,` | `'clientPhone'`: el teléfono, solo si `$mostrarTelefono` es `true`; si no, `null`. |
| 39 | `'preparedBy' => $fila['ayudante_nombre'] ?? null,` | `'preparedBy'`: quién de cocina lo preparó. `?? null` = si no hay, `null`. |
| 40 | `'driverName' => $fila['domiciliario_nombre'],` | `'driverName'`: el nombre del domiciliario. |
| 41 | `'driverPhone' => $fila['domiciliario_nombre'] ? $fila['domiciliario_telefono'] : null,` | `'driverPhone'`: el teléfono del domiciliario, solo si hay domiciliario. |
| 42 | `'driverPlate' => $fila['domiciliario_placa'],` | `'driverPlate'`: la placa del vehículo. |
| 43 | `'driverVehicle' => $fila['domiciliario_vehiculo'],` | `'driverVehicle'`: el tipo de vehículo. |
| 44 | `'deliveryPin' => $verPin ? $fila['pin_entrega'] : null,` | `'deliveryPin'`: el PIN de entrega, solo si `$verPin` es `true` (cliente que ya pagó, o admin en un pedido manual). A los demás les llega `null`. |
| 45 | `'requiresDeliveryPin' => !empty($fila['pin_entrega']),` | `'requiresDeliveryPin'`: dice si el pedido tiene PIN (`!empty` = no está vacío). |
| 46 | `'total' => (float) $fila['total'],` | `'total'`: el total a pagar. |
| 47 | `'subtotal' => (float) $fila['subtotal'],` | `'subtotal'`: lo de los productos. |
| 48 | `'shipping' => (float) $fila['costo_domicilio'],` | `'shipping'`: el costo del domicilio. |
| 49 | `'discount' => (float) $fila['descuento_cumpleanos'],` | `'discount'`: el descuento de cumpleaños. |
| 50 | `'pointsRedeemed' => (int) $fila['puntos_canjeados'],` | `'pointsRedeemed'`: cuántos puntos usó. |
| 51 | `'pointsDiscount' => (float) $fila['descuento_puntos'],` | `'pointsDiscount'`: cuánto le descontaron por los puntos. |
| 52 | `'pointsEarned' => (int) $fila['puntos_ganados'],` | `'pointsEarned'`: cuántos puntos ganó. |
| 53 | `'items' => $items,` | `'items'`: los productos del pedido (los arma `Pedido::itemsDe()`). |
| 54 | `'address' => $fila['direccion_entrega'],` | `'address'`: la dirección de entrega. |
| 55 | `'lat' => $fila['destino_lat'] !== null ? (float) $fila['destino_lat'] : null,` | `'lat'`: la latitud del destino en el mapa (o `null`). |
| 56 | `'lng' => $fila['destino_lng'] !== null ? (float) $fila['destino_lng'] : null,` | `'lng'`: la longitud del destino en el mapa (o `null`). |
| 57 | `'date' => $fila['fecha_hora'],` | `'date'`: la fecha y hora. |
| 58 | `'time' => date('H:i', strtotime($fila['fecha_hora'])),` | `'time'`: solo la hora, en formato `14:30` (`date('H:i', ...)`). |
| 59 | `'readyAt' => !empty($fila['fecha_listo']) ? $fila['fecha_listo'] : null,` | `'readyAt'`: cuándo quedó listo (o `null`). |
| 60 | `'paymentMethod' => $fila['metodo_pago'] === 'efectivo' ? 'cash' : 'online',` | `'paymentMethod'`: `'cash'` si fue en efectivo; si no, `'online'`. |
| 61 | `'digitalBank' => $fila['banco_digital'] ?? null,` | `'digitalBank'`: el banco digital (Nequi, Daviplata...). Si no hay, `null`. |
| 62 | `'paymentStatus' => $fila['estado_pago'] === 'aprobado' ? 'Pagado' : ucfirst($fila['estado_pago']),` | `'paymentStatus'`: `'Pagado'` si está aprobado; si no, el estado con la primera letra en mayúscula (`ucfirst`). |
| 63 | *(comentario)* | Comentario: no se ejecuta. Dice: *"web, llamada o whatsapp; isGuest = pedido manual de alguien sin cuenta."* |
| 64 | `'channel' => $fila['canal_origen'],` | `'channel'`: por dónde llegó el pedido: web, llamada o WhatsApp. |
| 65 | `'isGuest' => $fila['id_cliente'] === null,` | `'isGuest'`: `true` si el cliente no tiene cuenta (pedido manual de un invitado). |
| 66 | `'paymentLinkCode' => $codigoLink,` | `'paymentLinkCode'`: el código del link de pago (o `null`). Con él la pantalla arma la dirección `/pagar?c=...`. |
| 67 | `'paymentLinkExpiresAt' => $codigoLink ? $fila['vence_pago'] : null,` | `'paymentLinkExpiresAt'`: hasta cuándo sirve el link (o `null`). |
| 68 | `];` | Cierra la lista. |
| 69 | `}` | Cierra la función `pedido_a_json()`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** (helpers.php no lo encuentra) | `Failed to open stream` |
| la función `pedido_a_json()` | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, cargar los datos de todas las pantallas | `Call to undefined function pedido_a_json()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
