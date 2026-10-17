# views/json/pedido.php
¿No entiendes una palabra? Mira el [glosario](../../GLOSARIO.md).

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

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte una fila de PEDIDO al JSON del frontend ($items ya viene armado por Pedido::itemsDe)."* |
| 6 | `const PEDIDO_ESTADO_BD_A_APP = [` | Crea la constante `PEDIDO_ESTADO_BD_A_APP`: una lista para traducir el estado de la base de datos al texto que muestra React. |
| 7 | `'pendiente' => 'Pendiente',` | `'pendiente'` se muestra como `'Pendiente'`. |
| 8 | `'en_preparacion' => 'En Preparación',` | `'en_preparacion'` → `'En Preparación'`. |
| 9 | `'listo' => 'Listos',` | `'listo'` → `'Listos'`. |
| 10 | `'en_camino' => 'En Camino',` | `'en_camino'` → `'En Camino'`. |
| 11 | `'entregado' => 'Entregado',` | `'entregado'` → `'Entregado'`. |
| 12 | `'cancelado' => 'Cancelado',` | `'cancelado'` → `'Cancelado'`. |
| 13 | `];` | Cierra la lista. |
| 15 | `function pedido_a_json($fila, $items, $rolQueVe, $idQueVe)` | Función `pedido_a_json(...)`: organiza un pedido para React. La usa `Pedido::formar()` (en `models/Pedido.php`). Recibe la fila, los productos (`$items`) y quién lo está viendo (`$rolQueVe`, `$idQueVe`). |
| 16 | `{` | Abre la función `pedido_a_json()`. |
| 17 | `$estado = PEDIDO_ESTADO_BD_A_APP[$fila['estado']] ?? $fila['estado'];` | Traduce el estado con la lista de arriba y lo guarda en `$estado`. `??` = si no está en la lista, deja el original. |
| 19 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El domiciliario solo ve el telefono del cliente si es suyo y va "En Camino"."* |
| 20 | `$mostrarTelefono = true;` | `$mostrarTelefono` empieza en `true` (sí se muestra el teléfono del cliente). |
| 21 | `if ($rolQueVe === 'delivery') {` | Si quien mira es el domiciliario (`'delivery'`)... |
| 22 | `$mostrarTelefono = $fila['estado'] === 'en_camino' && $fila['id_domiciliario'] === $idQueVe;` | ...solo lo ve si el pedido va "En camino" **y** (`&&`) es su pedido. |
| 23 | `}` | Cierra el `if`. |
| 25 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El PIN de entrega solo lo ve el cliente: el domiciliario se lo pide en la puerta."* |
| 26 | `return [` | Devuelve una lista nueva con los nombres que usa React: |
| 27 | `'id' => '#ORD-' . $fila['id_pedido'],` | `'id'`: el código del pedido, por ejemplo `#ORD-12` (`.` une `'#ORD-'` con el número). |
| 28 | `'status' => $estado,` | `'status'`: el estado traducido. |
| 29 | `'client' => $fila['cliente_nombre'],` | `'client'`: el nombre del cliente. |
| 30 | `'clientPhone' => $mostrarTelefono ? $fila['cliente_telefono'] : null,` | `'clientPhone'`: el teléfono, solo si `$mostrarTelefono` es `true`; si no, `null`. |
| 31 | `'preparedBy' => $fila['ayudante_nombre'] ?? null,` | `'preparedBy'`: quién de cocina lo preparó. `?? null` = si no hay, `null`. |
| 32 | `'driverName' => $fila['domiciliario_nombre'],` | `'driverName'`: el nombre del domiciliario. |
| 33 | `'driverPhone' => $fila['domiciliario_nombre'] ? $fila['domiciliario_telefono'] : null,` | `'driverPhone'`: el teléfono del domiciliario, solo si hay domiciliario. |
| 34 | `'driverPlate' => $fila['domiciliario_placa'],` | `'driverPlate'`: la placa del vehículo. |
| 35 | `'driverVehicle' => $fila['domiciliario_vehiculo'],` | `'driverVehicle'`: el tipo de vehículo. |
| 36 | `'deliveryPin' => $rolQueVe === 'client' ? $fila['pin_entrega'] : null,` | `'deliveryPin'`: el PIN de entrega. **Solo lo ve el cliente** (`'client'`); a los demás les llega `null`. |
| 37 | `'requiresDeliveryPin' => !empty($fila['pin_entrega']),` | `'requiresDeliveryPin'`: dice si el pedido tiene PIN (`!empty` = no está vacío). |
| 38 | `'total' => (float) $fila['total'],` | `'total'`: el total a pagar. |
| 39 | `'subtotal' => (float) $fila['subtotal'],` | `'subtotal'`: lo de los productos. |
| 40 | `'shipping' => (float) $fila['costo_domicilio'],` | `'shipping'`: el costo del domicilio. |
| 41 | `'discount' => (float) $fila['descuento_cumpleanos'],` | `'discount'`: el descuento de cumpleaños. |
| 42 | `'pointsRedeemed' => (int) $fila['puntos_canjeados'],` | `'pointsRedeemed'`: cuántos puntos usó. |
| 43 | `'pointsDiscount' => (float) $fila['descuento_puntos'],` | `'pointsDiscount'`: cuánto le descontaron por los puntos. |
| 44 | `'pointsEarned' => (int) $fila['puntos_ganados'],` | `'pointsEarned'`: cuántos puntos ganó. |
| 45 | `'items' => $items,` | `'items'`: los productos del pedido (los arma `Pedido::itemsDe()`). |
| 46 | `'address' => $fila['direccion_entrega'],` | `'address'`: la dirección de entrega. |
| 47 | `'lat' => $fila['destino_lat'] !== null ? (float) $fila['destino_lat'] : null,` | `'lat'`: la latitud del destino en el mapa (o `null`). |
| 48 | `'lng' => $fila['destino_lng'] !== null ? (float) $fila['destino_lng'] : null,` | `'lng'`: la longitud del destino en el mapa (o `null`). |
| 49 | `'date' => $fila['fecha_hora'],` | `'date'`: la fecha y hora. |
| 50 | `'time' => date('H:i', strtotime($fila['fecha_hora'])),` | `'time'`: solo la hora, en formato `14:30` (`date('H:i', ...)`). |
| 51 | `'readyAt' => !empty($fila['fecha_listo']) ? $fila['fecha_listo'] : null,` | `'readyAt'`: cuándo quedó listo (o `null`). |
| 52 | `'paymentMethod' => $fila['metodo_pago'] === 'efectivo' ? 'cash' : 'online',` | `'paymentMethod'`: `'cash'` si fue en efectivo; si no, `'online'`. |
| 53 | `'digitalBank' => $fila['banco_digital'] ?? null,` | `'digitalBank'`: el banco digital (Nequi, Daviplata...). Si no hay, `null`. |
| 54 | `'paymentStatus' => $fila['estado_pago'] === 'aprobado' ? 'Pagado' : ucfirst($fila['estado_pago']),` | `'paymentStatus'`: `'Pagado'` si está aprobado; si no, el estado con la primera letra en mayúscula (`ucfirst`). |
| 55 | *(comentario)* | Comentario: no se ejecuta. Dice: *"web, llamada o whatsapp; isGuest = pedido manual de alguien sin cuenta."* |
| 56 | `'channel' => $fila['canal_origen'],` | `'channel'`: por dónde llegó el pedido: web, llamada o WhatsApp. |
| 57 | `'isGuest' => $fila['id_cliente'] === null,` | `'isGuest'`: `true` si el cliente no tiene cuenta (pedido manual de un invitado). |
| 58 | `];` | Cierra la lista. |
| 59 | `}` | Cierra la función `pedido_a_json()`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** (helpers.php no lo encuentra) | `Failed to open stream` |
| la función `pedido_a_json()` | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, cargar los datos de todas las pantallas | `Call to undefined function pedido_a_json()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
