# models/Cliente.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Maneja los clientes (tabla CLIENTE).

## ¿Qué hace?
- trae todos los clientes
- busca un cliente
- busca un cliente (datos sin organizar)
- busca un cliente por su correo
- revisa si el correo o el teléfono ya existen
- organiza los datos del cliente para React
- trae las notificaciones del cliente
- edita un cliente
- crea un cliente
- cambia la contraseña

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `listar()` | trae todos los clientes | `SyncController::index()` |
| `buscar()` | busca un cliente | `ClientController::update()`, `SyncController::index()` |
| `buscarCrudo()` | busca un cliente (datos sin organizar) | `AuthController::register()`, `ClientController::changePassword()`, `Cliente::buscar()` |
| `buscarIdPorCorreo()` | busca un cliente por su correo | `AuthController::forgotPasswordRequest()` |
| `correoOTelefonoExiste()` | revisa si el correo o el teléfono ya existen | `AuthController::register()` |
| `comoJson()` | organiza los datos del cliente para React | `Cliente::buscar()`, `Cliente::listar()` |
| `notificacionesDe()` | trae las notificaciones del cliente | `Cliente::comoJson()` |
| `actualizar()` | edita un cliente | `ClientController::update()` |
| `crear()` | crea un cliente | `AuthController::register()` |
| `actualizarContrasena()` | cambia la contraseña | `AuthController::forgotPasswordReset()`, `ClientController::changePassword()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/AuthController.php`, `controllers/ClientController.php`, `controllers/SyncController.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Cliente (CLIENTE y CLIENTE_NOTIFICACION)."* |
| 5 | `class Cliente` | Crea la clase `Cliente`: maneja los clientes (tablas `CLIENTE` y `CLIENTE_NOTIFICACION`). |
| 6 | `{` | Abre la clase `Cliente`. |
| 7 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 9 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 10 | `{` | Abre la función `__construct()`. |
| 11 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 12 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 13 | `}` | Cierra la función `__construct()`. |
| 15 | `public function listar()` | Método `listar()`: trae todos los clientes. Lo usa `SyncController` (para el administrador). |
| 16 | `{` | Abre la función `listar()`. |
| 17 | `$stmt = $this->conn->prepare("SELECT * FROM CLIENTE ORDER BY creado_en DESC");` | Prepara la consulta: "trae todos los clientes, los más nuevos primero (`ORDER BY creado_en DESC`)". |
| 18 | `$stmt->execute();` | Ejecuta la consulta. |
| 19 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 20 | `$stmt->close();` | Cierra la consulta. |
| 22 | `$clientes = [];` | Empieza `$clientes` como lista vacía. |
| 23 | `foreach ($rows as $row) {` | Recorre cada fila (`$row`). |
| 24 | `$clientes[] = $this->comoJson($row);` | La organiza para React (`comoJson()` de abajo) y la agrega a `$clientes`. |
| 25 | `}` | Cierra el `foreach`. |
| 26 | `return $clientes;` | Devuelve la lista de clientes. |
| 27 | `}` | Cierra la función `listar()`. |
| 29 | `public function buscar($id)` | Método `buscar($id)`: busca un cliente y lo devuelve organizado para React. Lo usan `ClientController` y `SyncController`. |
| 30 | `{` | Abre la función `buscar()`. |
| 31 | `$row = $this->buscarCrudo($id);` | Busca la fila tal cual (`buscarCrudo()` de abajo) y la guarda en `$row`. |
| 32 | `return $row ? $this->comoJson($row) : null;` | Si la encontró, la organiza (`comoJson()`); si no, devuelve `null`. |
| 33 | `}` | Cierra la función `buscar()`. |
| 35 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Fila tal cual viene de la base de datos (sin formar el JSON)."* |
| 36 | `public function buscarCrudo($id)` | Método `buscarCrudo($id)`: busca un cliente y devuelve la fila tal cual está en la base de datos. Lo usan `AuthController` y `ClientController`. |
| 37 | `{` | Abre la función `buscarCrudo()`. |
| 38 | `$stmt = $this->conn->prepare("SELECT * FROM CLIENTE WHERE id_cliente = ? LIMIT 1");` | Prepara la consulta: "trae todo del cliente con ese id, solo uno". |
| 39 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 40 | `$stmt->execute();` | Ejecuta la consulta. |
| 41 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 42 | `$stmt->close();` | Cierra la consulta. |
| 43 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 44 | `}` | Cierra la función `buscarCrudo()`. |
| 46 | `public function buscarIdPorCorreo($correo)` | Método `buscarIdPorCorreo($correo)`: busca el número de un cliente por su correo. Lo usa `AuthController::forgotPasswordRequest()`. |
| 47 | `{` | Abre la función `buscarIdPorCorreo()`. |
| 48 | `$stmt = $this->conn->prepare("SELECT id_cliente FROM CLIENTE WHERE correo = ? LIMIT 1");` | Prepara la consulta: "trae el `id_cliente` del cliente con ese correo". |
| 49 | `$stmt->bind_param("s", $correo);` | Llena los `?` de la consulta, en orden: `$correo` (texto). |
| 50 | `$stmt->execute();` | Ejecuta la consulta. |
| 51 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 52 | `$stmt->close();` | Cierra la consulta. |
| 53 | `return $row ? $row['id_cliente'] : null;` | Si lo encontró, devuelve su número; si no, `null`. |
| 54 | `}` | Cierra la función `buscarIdPorCorreo()`. |
| 56 | `public function correoOTelefonoExiste($correo, $telefono)` | Método `correoOTelefonoExiste($correo, $telefono)`: dice si ya hay un cliente con ese correo o teléfono. Lo usa `AuthController::register()`. |
| 57 | `{` | Abre la función `correoOTelefonoExiste()`. |
| 58 | `$stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM CLIENTE WHERE correo = ? OR telefono = ?");` | Prepara la consulta: "cuenta los clientes con ese correo **o** ese teléfono". |
| 59 | `$stmt->bind_param("ss", $correo, $telefono);` | Llena los `?` de la consulta, en orden: `$correo` (texto), `$telefono` (texto). |
| 60 | `$stmt->execute();` | Ejecuta la consulta. |
| 61 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 62 | `$stmt->close();` | Cierra la consulta. |
| 63 | `return (int) $row['total'] > 0;` | Devuelve `true` si hay alguno. |
| 64 | `}` | Cierra la función `correoOTelefonoExiste()`. |
| 66 | `public function comoJson($row)` | Método `comoJson($row)`: organiza un cliente para React, con datos extra (cuántos pedidos y el último). Lo usan `listar()` y `buscar()`. |
| 67 | `{` | Abre la función `comoJson()`. |
| 68 | `$id = $row['id_cliente'];` | Guarda en `$id` el número del cliente. |
| 70 | `$stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM PEDIDO WHERE id_cliente = ?");` | Prepara la consulta: "cuenta los pedidos de este cliente". |
| 71 | `$stmt->bind_param("i", $id);` | Llena los `?` de la consulta, en orden: `$id` (número entero). |
| 72 | `$stmt->execute();` | Ejecuta la consulta. |
| 73 | `$conteo = $stmt->get_result()->fetch_assoc();` | Guarda el resultado en `$conteo`. |
| 74 | `$stmt->close();` | Cierra la consulta. |
| 76 | `$stmtU = $this->conn->prepare("SELECT MAX(fecha_hora) AS ultimo FROM PEDIDO WHERE id_cliente = ?");` | Prepara otra consulta (`$stmtU`): "trae la fecha del último pedido (`MAX(fecha_hora)` = la más reciente)". |
| 77 | `$stmtU->bind_param("i", $id);` | Llena los `?` de la consulta, en orden: `$id` (número entero). |
| 78 | `$stmtU->execute();` | Ejecuta la consulta. |
| 79 | `$ultimo = $stmtU->get_result()->fetch_assoc();` | Guarda el resultado en `$ultimo`. |
| 80 | `$stmtU->close();` | Cierra la consulta. |
| 82 | `return cliente_a_json([` | Organiza todo con `cliente_a_json()` (de `views/json/cliente.php`) y lo devuelve. Le pasa: |
| 83 | `'fila'          => $row,` | la fila del cliente, |
| 84 | `'ordersCount'   => (int) $conteo['total'],` | cuántos pedidos tiene (número entero), |
| 85 | `'lastOrderDate' => $ultimo['ultimo'] ?: null,` | la fecha de su último pedido (o `null`), |
| 86 | `'notifications' => $this->notificacionesDe($id),` | y sus notificaciones (`notificacionesDe()` de abajo). |
| 87 | `]);` | Cierra la lista y la llamada. |
| 88 | `}` | Cierra la función `comoJson()`. |
| 90 | `public function notificacionesDe($idCliente)` | Método `notificacionesDe($idCliente)`: trae las notificaciones de un cliente. |
| 91 | `{` | Abre la función `notificacionesDe()`. |
| 92 | `$stmt = $this->conn->prepare("SELECT * FROM CLIENTE_NOTIFICACION WHERE id_cliente = ? ORDER BY fecha DESC");` | Prepara la consulta: "trae las notificaciones de ese cliente, las más nuevas primero". |
| 93 | `$stmt->bind_param("s", $idCliente);` | Llena los `?` de la consulta, en orden: `$idCliente` (texto). |
| 94 | `$stmt->execute();` | Ejecuta la consulta. |
| 95 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 96 | `$stmt->close();` | Cierra la consulta. |
| 97 | `$notificaciones = [];` | Empieza `$notificaciones` vacía. |
| 98 | `foreach ($rows as $row) {` | Recorre cada fila. |
| 99 | `$notificaciones[] = notificacion_a_json($row);` | La organiza con `notificacion_a_json()` (de `views/json/cliente.php`) y la agrega. |
| 100 | `}` | Cierra el `foreach`. |
| 101 | `return $notificaciones;` | Devuelve la lista. |
| 102 | `}` | Cierra la función `notificacionesDe()`. |
| 104 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Actualiza solo los campos que vengan en $campos (claves en camelCase)."* |
| 105 | `public function actualizar($id, $campos)` | Método `actualizar($id, $campos)`: guarda los cambios de un cliente. Solo cambia los datos que llegaron. Lo usa `ClientController::update()`. |
| 106 | `{` | Abre la función `actualizar()`. |
| 107 | `$mapa = [` | Crea `$mapa`: para cada nombre que usa React, el nombre de la columna en la base de datos: |
| 108 | `'name' => 'nombre', 'phone' => 'telefono', 'address' => 'direccion',` | `name` → `nombre`, `phone` → `telefono`, `address` → `direccion`, |
| 109 | `'email' => 'correo', 'birthday' => 'fecha_nacimiento',` | `email` → `correo`, `birthday` → `fecha_nacimiento`, |
| 110 | `'points' => 'puntos_fidelidad', 'totalSpent' => 'total_gastado',` | `points` → `puntos_fidelidad`, `totalSpent` → `total_gastado`. |
| 111 | `];` | Cierra el mapa. |
| 113 | `$sets = [];` | `$sets` empieza vacía: aquí se anotan las columnas a cambiar. |
| 114 | `$values = [];` | `$values` empieza vacía: aquí se anotan los valores nuevos. |
| 115 | `foreach ($mapa as $clave => $columna) {` | Recorre el mapa: `$clave` es el nombre de React y `$columna` el de la base de datos. |
| 116 | `if (array_key_exists($clave, $campos)) {` | Si ese dato llegó... |
| 117 | `$sets[] = "{$columna} = ?";` | ...anota `columna = ?` en `$sets`. |
| 118 | `$values[] = $campos[$clave];` | ...y anota su valor en `$values`. |
| 119 | `}` | Cierra el `if`. |
| 120 | `}` | Cierra el `foreach`. |
| 122 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El carrito se guarda como JSON y el tema viene dentro de preferences.theme."* |
| 123 | `if (array_key_exists('cart', $campos)) {` | Si llegó el carrito... |
| 124 | `$sets[] = "carrito_guardado = ?";` | ...anota la columna `carrito_guardado`. |
| 125 | `$values[] = json_encode($campos['cart']);` | ...y guarda el carrito convertido a JSON (`json_encode`). |
| 126 | `}` | Cierra el `if`. |
| 127 | `if (isset($campos['preferences']) && is_array($campos['preferences']) && isset($campos['preferences']['theme'])) {` | Si llegó el tema (claro u oscuro) dentro de `preferences`... |
| 128 | `$sets[] = "tema_preferido = ?";` | ...anota la columna `tema_preferido`. |
| 129 | `$values[] = $campos['preferences']['theme'];` | ...y guarda el tema. |
| 130 | `}` | Cierra el `if`. |
| 132 | `if (empty($sets)) {` | Si no hay nada que cambiar... |
| 133 | `return;` | ...sale de la función. |
| 134 | `}` | Cierra el `if`. |
| 135 | `$values[] = $id;` | Agrega al final el número del cliente (para el `WHERE id_cliente = ?`). |
| 137 | `$sql = "UPDATE CLIENTE SET " . implode(", ", $sets) . " WHERE id_cliente = ?";` | Arma la consulta: "cambia en `CLIENTE` estas columnas donde el id sea `?`". `implode(", ", $sets)` une todo lo anotado con comas. |
| 138 | `$stmt = $this->conn->prepare($sql);` | Prepara la consulta. |
| 139 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 140 | `$stmt->execute();` | Ejecuta la consulta. |
| 141 | `$stmt->close();` | Cierra la consulta. |
| 142 | `}` | Cierra la función `actualizar()`. |
| 144 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea el cliente guardando la fecha y la IP de aceptacion de Habeas Data."* |
| 145 | `public function crear($d)` | Método `crear($d)`: crea un cliente nuevo. Lo usa `AuthController::register()`. |
| 146 | `{` | Abre la función `crear()`. |
| 147 | `$hash = password_hash($d['password'], PASSWORD_DEFAULT);` | Cifra la contraseña y la guarda en `$hash`. |
| 148 | `$direccion = $d['address'] ?? null;` | Guarda en `$direccion` la dirección; si no hay, `null`. |
| 149 | `$fechaAceptacion = date('Y-m-d H:i:s');` | Guarda en `$fechaAceptacion` la fecha y hora de ahora (cuando aceptó los términos de Habeas Data). |
| 150 | `$ip = $d['ip'] ?? '0.0.0.0';` | Guarda en `$ip` la IP desde donde aceptó. |
| 152 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda en `CLIENTE` el nombre, teléfono, correo, contraseña cifrada, dirección, fecha de nacimiento, fecha y IP de aceptación". |
| 153 | `"INSERT INTO CLIENTE` | ↑ (sigue la misma instrucción) |
| 154 | `(nombre, telefono, correo, contrasena, direccion, fecha_nacimiento,` | ↑ (sigue la misma instrucción) |
| 155 | `fecha_aceptacion_habeas_data, ip_aceptacion_habeas_data)` | ↑ (sigue la misma instrucción) |
| 156 | `VALUES (?, ?, ?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 157 | `);` | ↑ (sigue la misma instrucción) |
| 158 | `$stmt->bind_param("ssssssss", $d['name'], $d['phone'], $d['email'], $hash, $direccion, $d['birthday'], $fechaAceptacion, $ip);` | Llena los `?` de la consulta, en orden: `$d['name']` (texto), `$d['phone']` (texto), `$d['email']` (texto), `$hash` (texto), `$direccion` (texto), `$d['birthday']` (texto), `$fechaAceptacion` (texto), `$ip` (texto). |
| 159 | `$stmt->execute();` | Ejecuta la consulta. |
| 160 | `$stmt->close();` | Cierra la consulta. |
| 162 | `return $this->conn->insert_id;` | Devuelve el número del cliente recién creado (`insert_id`). |
| 163 | `}` | Cierra la función `crear()`. |
| 165 | `public function actualizarContrasena($id, $hash)` | Método `actualizarContrasena($id, $hash)`: cambia la contraseña (ya cifrada). Lo usan `AuthController` y `ClientController`. |
| 166 | `{` | Abre la función `actualizarContrasena()`. |
| 167 | `$stmt = $this->conn->prepare("UPDATE CLIENTE SET contrasena = ? WHERE id_cliente = ?");` | Prepara la consulta: "cambia la contraseña del cliente con ese id". |
| 168 | `$stmt->bind_param("ss", $hash, $id);` | Llena los `?` de la consulta, en orden: `$hash` (texto), `$id` (texto). |
| 169 | `$stmt->execute();` | Ejecuta la consulta. |
| 170 | `$stmt->close();` | Cierra la consulta. |
| 171 | `}` | Cierra la función `actualizarContrasena()`. |
| 172 | `}` | Cierra la clase `Cliente`. |
| 173 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código, editar el perfil del cliente, cambiar la contraseña del cliente, cargar los datos de todas las pantallas | `Failed to open stream` |
| el método `listar()` | cargar los datos de todas las pantallas | `Call to undefined method Cliente::listar()` |
| el método `buscar()` | editar el perfil del cliente, cargar los datos de todas las pantallas | `Call to undefined method Cliente::buscar()` |
| el método `buscarCrudo()` | registrarse, editar el perfil del cliente, cambiar la contraseña del cliente, cargar los datos de todas las pantallas | `Call to undefined method Cliente::buscarCrudo()` |
| el método `buscarIdPorCorreo()` | pedir el código para recuperar la contraseña | `Call to undefined method Cliente::buscarIdPorCorreo()` |
| el método `correoOTelefonoExiste()` | registrarse | `Call to undefined method Cliente::correoOTelefonoExiste()` |
| el método `comoJson()` | editar el perfil del cliente, cargar los datos de todas las pantallas | `Call to undefined method Cliente::comoJson()` |
| el método `notificacionesDe()` | editar el perfil del cliente, cargar los datos de todas las pantallas | `Call to undefined method Cliente::notificacionesDe()` |
| el método `actualizar()` | editar el perfil del cliente | `Call to undefined method Cliente::actualizar()` |
| el método `crear()` | registrarse | `Call to undefined method Cliente::crear()` |
| el método `actualizarContrasena()` | cambiar la contraseña con el código, cambiar la contraseña del cliente | `Call to undefined method Cliente::actualizarContrasena()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
