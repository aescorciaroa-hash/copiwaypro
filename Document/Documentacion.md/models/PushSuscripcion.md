# models/PushSuscripcion.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Guarda los celulares que reciben notificaciones.

## ¿Qué hace?
- guarda un celular que recibe notificaciones
- borra un celular que ya no sirve
- trae los celulares de un cliente

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `guardar()` | guarda un celular que recibe notificaciones | `PushController::subscribe()` |
| `eliminarPorEndpoint()` | borra un celular que ya no sirve | `PushNotificationService::enviarATodosLosDispositivos()` |
| `listarPorCliente()` | trae los celulares de un cliente | `PushNotificationService::enviarATodosLosDispositivos()` |

## ¿Con qué se conecta?
- **Lo cargan:** `models/PushNotificationService.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo PushSuscripcion (suscripciones Web Push de cada cliente)."* |
| 5 | `class PushSuscripcion` | Crea la clase `PushSuscripcion`: guarda los navegadores (celulares) que reciben notificaciones (tabla `PUSH_SUSCRIPCION`). |
| 6 | `{` | Abre la clase `PushSuscripcion`. |
| 7 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 9 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 10 | `{` | Abre la función `__construct()`. |
| 11 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 12 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 13 | `}` | Cierra la función `__construct()`. |
| 15 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea o actualiza (mismo endpoint = mismo navegador)."* |
| 16 | `public function guardar($idCliente, $endpoint, $claveP256dh, $claveAuth)` | Método `guardar(...)`: guarda la suscripción de un cliente. Si ese navegador ya estaba, la actualiza. Lo usa `PushController::subscribe()`. |
| 17 | `{` | Abre la función `guardar()`. |
| 18 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda el cliente, la dirección del navegador (`endpoint`) y sus dos claves; si ese navegador ya existe (`ON DUPLICATE KEY UPDATE`), solo actualiza el cliente y las claves". |
| 19 | `"INSERT INTO PUSH_SUSCRIPCION (id_cliente, endpoint, clave_p256dh, clave_auth)` | ↑ (sigue la misma instrucción) |
| 20 | `VALUES (?, ?, ?, ?)` | ↑ (sigue la misma instrucción) |
| 21 | `ON DUPLICATE KEY UPDATE id_cliente = VALUES(id_cliente), clave_p256dh = VALUES(clave_p256dh), clave_auth = VALUES(clave_auth)"` | ↑ (sigue la misma instrucción) |
| 22 | `);` | ↑ (sigue la misma instrucción) |
| 23 | `$stmt->bind_param("isss", $idCliente, $endpoint, $claveP256dh, $claveAuth);` | Llena los `?` de la consulta, en orden: `$idCliente` (número entero), `$endpoint` (texto), `$claveP256dh` (texto), `$claveAuth` (texto). |
| 24 | `$stmt->execute();` | Ejecuta la consulta. |
| 25 | `$stmt->close();` | Cierra la consulta. |
| 26 | `}` | Cierra la función `guardar()`. |
| 28 | `public function eliminarPorEndpoint($endpoint)` | Método `eliminarPorEndpoint($endpoint)`: borra un navegador que ya no sirve. Lo usa `PushNotificationService` cuando una notificación falla. |
| 29 | `{` | Abre la función `eliminarPorEndpoint()`. |
| 30 | `$stmt = $this->conn->prepare("DELETE FROM PUSH_SUSCRIPCION WHERE endpoint = ?");` | Prepara la consulta: "borra (`DELETE`) la suscripción con esa dirección". |
| 31 | `$stmt->bind_param("s", $endpoint);` | Llena los `?` de la consulta, en orden: `$endpoint` (texto). |
| 32 | `$stmt->execute();` | Ejecuta la consulta. |
| 33 | `$stmt->close();` | Cierra la consulta. |
| 34 | `}` | Cierra la función `eliminarPorEndpoint()`. |
| 36 | `public function listarPorCliente($idCliente)` | Método `listarPorCliente($idCliente)`: trae todos los navegadores de un cliente. Lo usa `PushNotificationService` para enviarle la notificación. |
| 37 | `{` | Abre la función `listarPorCliente()`. |
| 38 | `$stmt = $this->conn->prepare("SELECT endpoint, clave_p256dh, clave_auth FROM PUSH_SUSCRIPCION WHERE id_cliente = ?");` | Prepara la consulta: "trae la dirección y las claves de las suscripciones de ese cliente". |
| 39 | `$stmt->bind_param("i", $idCliente);` | Llena los `?` de la consulta, en orden: `$idCliente` (número entero). |
| 40 | `$stmt->execute();` | Ejecuta la consulta. |
| 41 | `$data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$data` (una lista). |
| 42 | `$stmt->close();` | Cierra la consulta. |
| 43 | `return $data;` | Devuelve la lista. |
| 44 | `}` | Cierra la función `listarPorCliente()`. |
| 45 | `}` | Cierra la clase `PushSuscripcion`. |
| 46 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, activar las notificaciones | `Failed to open stream` |
| el método `guardar()` | activar las notificaciones | `Call to undefined method PushSuscripcion::guardar()` |
| el método `eliminarPorEndpoint()` | entregar pedidos con el PIN | `Call to undefined method PushSuscripcion::eliminarPorEndpoint()` |
| el método `listarPorCliente()` | entregar pedidos con el PIN | `Call to undefined method PushSuscripcion::listarPorCliente()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
