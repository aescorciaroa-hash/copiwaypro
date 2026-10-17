# views/json/cliente.php
¿No entiendes una palabra? Mira el [glosario](../../GLOSARIO.md).

## ¿Para qué sirve?
Organiza los datos de los clientes antes de enviarlos a React.
Cambia los nombres de la base de datos a los que usa React (ej. `nombre` → `name`, `precio` → `price`).

## ¿Qué hace?
- organiza los datos de un cliente
- organiza una notificación del cliente

## Sus funciones
| Función | Qué hace | La usan |
|---|---|---|
| `cliente_a_json()` | organiza los datos de un cliente | `Cliente::comoJson()` |
| `notificacion_a_json()` | organiza una notificación del cliente | `Cliente::notificacionesDe()` |

## ¿Con qué se conecta?
- **Lo carga:** `config/helpers.php` (en todas las peticiones).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte filas de CLIENTE y CLIENTE_NOTIFICACION al JSON del frontend."* |
| 6 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"$datosCrudos = ['fila', 'ordersCount', 'lastOrderDate', 'notifications']"* |
| 7 | `function cliente_a_json($datosCrudos)` | Función `cliente_a_json($datosCrudos)`: organiza los datos de un cliente para React. La usa `Cliente::comoJson()` (en `models/Cliente.php`). `$datosCrudos` trae la fila y algunos datos ya calculados. |
| 8 | `{` | Abre la función `cliente_a_json()`. |
| 9 | `$fila = $datosCrudos['fila'];` | Saca la fila de la tabla `CLIENTE` y la guarda en `$fila`. |
| 10 | `return [` | Devuelve una lista nueva con los nombres que usa React: |
| 11 | `'id' => (string) $fila['id_cliente'],` | `'id'`: el número del cliente (`id_cliente`), convertido a texto (`(string)`). |
| 12 | `'name' => $fila['nombre'],` | `'name'`: el nombre. |
| 13 | `'phone' => $fila['telefono'],` | `'phone'`: el teléfono. |
| 14 | `'email' => $fila['correo'],` | `'email'`: el correo. |
| 15 | `'address' => $fila['direccion'],` | `'address'`: la dirección. |
| 16 | `'ordersCount' => $datosCrudos['ordersCount'],` | `'ordersCount'`: cuántos pedidos ha hecho (lo calcula el modelo). |
| 17 | `'totalSpent' => (float) $fila['total_gastado'],` | `'totalSpent'`: cuánto ha gastado en total, como número con decimales (`(float)`). |
| 18 | `'points' => (int) $fila['puntos_fidelidad'],` | `'points'`: sus puntos, como número entero (`(int)`). |
| 19 | `'lastOrderDate' => $datosCrudos['lastOrderDate'],` | `'lastOrderDate'`: la fecha de su último pedido. |
| 20 | `'notifications' => $datosCrudos['notifications'],` | `'notifications'`: sus notificaciones (ya organizadas con `notificacion_a_json()`). |
| 21 | `'birthday' => $fila['fecha_nacimiento'],` | `'birthday'`: su fecha de nacimiento (para el descuento de cumpleaños). |
| 22 | `'preferences' => $fila['tema_preferido'] !== null ? ['theme' => $fila['tema_preferido']] : null,` | `'preferences'`: su tema (claro u oscuro). `? :` = si tiene tema guardado, lo pone; si no, `null`. |
| 23 | `'cart' => $fila['carrito_guardado'] !== null ? json_decode($fila['carrito_guardado'], true) : [],` | `'cart'`: su carrito guardado. Si hay, lo convierte de JSON a lista (`json_decode`); si no, lista vacía. |
| 24 | `];` | Cierra la lista. |
| 25 | `}` | Cierra la función `cliente_a_json()`. |
| 27 | `function notificacion_a_json($fila)` | Función `notificacion_a_json($fila)`: organiza una notificación del cliente. La usa `Cliente::notificacionesDe()`. |
| 28 | `{` | Abre la función `notificacion_a_json()`. |
| 29 | `return [` | Devuelve una lista nueva: |
| 30 | `'id' => (string) $fila['id_notificacion_cliente'],` | `'id'`: el número de la notificación, como texto. |
| 31 | `'title' => $fila['titulo'],` | `'title'`: el título. |
| 32 | `'message' => $fila['mensaje'],` | `'message'`: el mensaje. |
| 33 | `'date' => $fila['fecha'],` | `'date'`: la fecha. |
| 34 | `'read' => (bool) $fila['leida'],` | `'read'`: si ya la leyó (sí/no, `(bool)`). |
| 35 | `'type' => $fila['tipo'],` | `'type'`: el tipo de notificación. |
| 36 | `];` | Cierra la lista. |
| 37 | `}` | Cierra la función `notificacion_a_json()`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** (helpers.php no lo encuentra) | `Failed to open stream` |
| la función `cliente_a_json()` | editar el perfil del cliente, cargar los datos de todas las pantallas | `Call to undefined function cliente_a_json()` |
| la función `notificacion_a_json()` | editar el perfil del cliente, cargar los datos de todas las pantallas | `Call to undefined function notificacion_a_json()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
