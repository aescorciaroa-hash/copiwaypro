# models/Pedido.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Lee los pedidos (tablas PEDIDO, DETALLE_PEDIDO y PERSONALIZACION).

## ¿Qué hace?
- trae los pedidos (cada rol ve los suyos)
- busca un pedido
- busca un pedido (datos sin organizar)
- trae los productos de un pedido

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `porRol()` | trae los pedidos (cada rol ve los suyos) | `OrderController::index()`, `SyncController::index()` |
| `buscar()` | busca un pedido | `OrderController::responderPedido()`, `OrderController::review()`, `PedidoService::crear()`, `PedidoService::crearManual()` |
| `buscarCrudo()` | busca un pedido (datos sin organizar) | `OrderController::buscarPedido()`, `OrderController::review()`, `PedidoService::cambiarDireccion()` |
| `numeroDesdeId()` (privado) | saca el número de "#ORD-12" | `Pedido::buscar()`, `Pedido::buscarCrudo()` |
| `itemsDe()` | trae los productos de un pedido | `Pedido::formar()` |
| `formar()` (privado) | organiza el pedido para React | `Pedido::buscar()`, `Pedido::porRol()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/SyncController.php`, `models/PedidoService.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Pedido (PEDIDO, DETALLE_PEDIDO y PERSONALIZACION). Solo consultas; las reglas del pedido estan en PedidoService."* |
| 6 | `class Pedido` | Crea la clase `Pedido`: lee los pedidos (tablas `PEDIDO`, `DETALLE_PEDIDO` y `PERSONALIZACION`). Solo lee; los cambios los hace `PedidoService`. |
| 7 | `{` | Abre la clase `Pedido`. |
| 8 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 10 | *(comentario)* | Comentario: no se ejecuta. Dice: *"LEFT JOIN: un pedido manual de un cliente invitado no tiene fila en CLIENTE;"* |
| 11 | *(comentario)* | Comentario: no se ejecuta. Dice: *"en ese caso se muestran el nombre y el celular que dicto por telefono."* |
| 12 | `const BASE = "SELECT p.*, COALESCE(c.nombre, p.nombre_contacto) AS cliente_nombre,` | Constante `BASE`: la consulta que se repite en varios métodos. "Trae los pedidos (`p`) con el nombre y teléfono del cliente (si no tiene cuenta, los que dio por teléfono: `COALESCE`), los datos del domiciliario (`d`: nombre, teléfono, placa, vehículo) y el nombre de quien lo preparó en cocina (`a`)". Cada `LEFT JOIN` une otra tabla aunque no tenga datos. `AS` le pone otro nombre a una columna. |
| 13 | `COALESCE(c.telefono, p.telefono_contacto) AS cliente_telefono,` | ↑ (sigue la misma instrucción) |
| 14 | `d.nombre AS domiciliario_nombre, d.telefono AS domiciliario_telefono,` | ↑ (sigue la misma instrucción) |
| 15 | `d.placa AS domiciliario_placa, d.tipo_vehiculo AS domiciliario_vehiculo,` | ↑ (sigue la misma instrucción) |
| 16 | `a.nombre AS ayudante_nombre` | ↑ (sigue la misma instrucción) |
| 17 | `FROM PEDIDO p` | ↑ (sigue la misma instrucción) |
| 18 | `LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente` | ↑ (sigue la misma instrucción) |
| 19 | `LEFT JOIN DOMICILIARIO d ON d.id_domiciliario = p.id_domiciliario` | ↑ (sigue la misma instrucción) |
| 20 | `LEFT JOIN AYUDANTE_COCINA a ON a.id_ayudante = p.id_ayudante";` | ↑ (sigue la misma instrucción) |
| 22 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 23 | `{` | Abre la función `__construct()`. |
| 24 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 25 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 26 | `}` | Cierra la función `__construct()`. |
| 28-33 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pedidos segun el rol: - admin/cocina: todos - domiciliario: los suyos + los 'listo' sin domiciliario - cliente: solo los propios"* |
| 34 | `public function porRol($rol, $usuarioId)` | Método `porRol($rol, $usuarioId)`: trae los pedidos que puede ver cada rol. Lo usan `OrderController` y `SyncController`. |
| 35 | `{` | Abre la función `porRol()`. |
| 36 | `if ($rol === 'client') {` | Si es cliente... |
| 37 | `$stmt = $this->conn->prepare(self::BASE . " WHERE p.id_cliente = ? ORDER BY p.fecha_hora DESC");` | ...prepara: la consulta `BASE` + "solo los de este cliente, los más nuevos primero". |
| 38 | `$stmt->bind_param("s", $usuarioId);` | Llena los `?` de la consulta, en orden: `$usuarioId` (texto). |
| 39 | `} elseif ($rol === 'delivery') {` | Si es domiciliario... |
| 40 | `$stmt = $this->conn->prepare(self::BASE . " WHERE p.id_domiciliario = ? OR (p.estado = 'listo' AND p.id_domiciliario IS NULL) ORDER BY p.fecha_hora DESC");` | ...prepara: `BASE` + "los suyos **o** los que están listos y sin domiciliario (disponibles para tomar)". |
| 41 | `$stmt->bind_param("s", $usuarioId);` | Llena los `?` de la consulta, en orden: `$usuarioId` (texto). |
| 42 | `} else {` | Si es administrador o cocina... |
| 43 | `$stmt = $this->conn->prepare(self::BASE . " ORDER BY p.fecha_hora DESC");` | ...prepara: `BASE` + "todos, los más nuevos primero". |
| 44 | `}` | Cierra el `else`. |
| 45 | `$stmt->execute();` | Ejecuta la consulta. |
| 46 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 47 | `$stmt->close();` | Cierra la consulta. |
| 49 | `$pedidos = [];` | Empieza `$pedidos` vacía. |
| 50 | `foreach ($rows as $row) {` | Recorre cada fila. |
| 51 | `$pedidos[] = $this->formar($row, $rol, $usuarioId);` | La organiza para React (`formar()` de abajo) y la agrega. |
| 52 | `}` | Cierra el `foreach`. |
| 53 | `return $pedidos;` | Devuelve la lista. |
| 54 | `}` | Cierra la función `porRol()`. |
| 56-60 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca por id o por numero visible (#ORD-123). Si se pasa el rol de quien pregunta, aplica la misma visibilidad que porRol() y devuelve null si no le corresponde verlo."* |
| 61 | `public function buscar($id, $rolQueVe = null, $idQueVe = null)` | Método `buscar($id, $rolQueVe, $idQueVe)`: busca un pedido y lo devuelve organizado. Si quien pregunta no puede verlo, devuelve `null`. Lo usan `OrderController` y `PedidoService`. |
| 62 | `{` | Abre la función `buscar()`. |
| 63 | `$numero = $this->numeroDesdeId($id);` | Saca el número del pedido (`numeroDesdeId()` de abajo): de `#ORD-12` saca `12`. |
| 64 | `$stmt = $this->conn->prepare(self::BASE . " WHERE p.id_pedido = ?");` | Prepara: `BASE` + "el pedido con ese número". |
| 65 | `$stmt->bind_param("i", $numero);` | Llena los `?` de la consulta, en orden: `$numero` (número entero). |
| 66 | `$stmt->execute();` | Ejecuta la consulta. |
| 67 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 68 | `$stmt->close();` | Cierra la consulta. |
| 69 | `if (!$row) {` | Si no existe... |
| 70 | `return null;` | ...devuelve `null`. |
| 71 | `}` | Cierra el `if`. |
| 73 | `if ($rolQueVe === 'client' && $row['id_cliente'] !== $idQueVe) {` | Si quien mira es un cliente y el pedido no es suyo... |
| 74 | `return null;` | ...devuelve `null`. |
| 75 | `}` | Cierra el `if`. |
| 76 | `if ($rolQueVe === 'delivery') {` | Si quien mira es un domiciliario... |
| 77 | `$esSuyo = $row['id_domiciliario'] === $idQueVe;` | ...`$esSuyo` = el pedido es de él. |
| 78 | `$esDisponible = $row['estado'] === 'listo' && $row['id_domiciliario'] === null;` | ...`$esDisponible` = está listo y sin domiciliario. |
| 79 | `if (!$esSuyo && !$esDisponible) {` | Si no es suyo y tampoco está disponible... |
| 80 | `return null;` | ...devuelve `null`. |
| 81 | `}` | Cierra el `if`. |
| 82 | `}` | Cierra el `if`. |
| 84 | `return $this->formar($row, $rolQueVe, $idQueVe);` | Si puede verlo, lo organiza (`formar()`) y lo devuelve. |
| 85 | `}` | Cierra la función `buscar()`. |
| 87 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Fila tal cual viene de la base de datos, por id o numero visible."* |
| 88 | `public function buscarCrudo($id)` | Método `buscarCrudo($id)`: busca un pedido y devuelve la fila tal cual. Lo usan `OrderController` y `PedidoService`. |
| 89 | `{` | Abre la función `buscarCrudo()`. |
| 90 | `$numero = $this->numeroDesdeId($id);` | Saca el número del pedido. |
| 91 | `$stmt = $this->conn->prepare("SELECT * FROM PEDIDO WHERE id_pedido = ? LIMIT 1");` | Prepara la consulta: "trae el pedido con ese número". |
| 92 | `$stmt->bind_param("i", $numero);` | Llena los `?` de la consulta, en orden: `$numero` (número entero). |
| 93 | `$stmt->execute();` | Ejecuta la consulta. |
| 94 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 95 | `$stmt->close();` | Cierra la consulta. |
| 96 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 97 | `}` | Cierra la función `buscarCrudo()`. |
| 99 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Acepta '#ORD-123' o '123' y devuelve el numero."* |
| 100 | `private function numeroDesdeId($idVisible)` | Método `numeroDesdeId($idVisible)` (privado): de `'#ORD-12'` o `'12'` saca el número `12`. |
| 101 | `{` | Abre la función `numeroDesdeId()`. |
| 102 | `if (preg_match('/^#ORD-(\d+)$/', (string) $idVisible, $m)) {` | Si el texto es `#ORD-` + números (`preg_match` lo revisa y guarda los números en `$m`)... |
| 103 | `return (int) $m[1];` | ...devuelve esos números (`$m[1]`) como número entero. |
| 104 | `}` | Cierra el `if`. |
| 105 | `if (is_numeric($idVisible)) {` | Si ya es un número... |
| 106 | `return (int) $idVisible;` | ...lo devuelve como entero. |
| 107 | `}` | Cierra el `if`. |
| 108 | `return 0;` | Si no es nada de eso, devuelve 0 (no existe ningún pedido 0). |
| 109 | `}` | Cierra la función `numeroDesdeId()`. |
| 111 | `public function itemsDe($idPedido)` | Método `itemsDe($idPedido)`: trae los productos de un pedido, con sus ingredientes extra y los que se quitaron. Lo usa `formar()`. |
| 112 | `{` | Abre la función `itemsDe()`. |
| 113 | `$stmt = $this->conn->prepare("SELECT * FROM DETALLE_PEDIDO WHERE id_pedido = ?");` | Prepara la consulta: "trae los productos (detalles) de ese pedido". |
| 114 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 115 | `$stmt->execute();` | Ejecuta la consulta. |
| 116 | `$detalles = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Los guarda en `$detalles`. |
| 117 | `$stmt->close();` | Cierra la consulta. |
| 119 | `$items = [];` | Empieza `$items` vacía. |
| 120 | `foreach ($detalles as $detalle) {` | Recorre cada producto (`$detalle`). |
| 121 | `$stmtP = $this->conn->prepare("SELECT * FROM PERSONALIZACION WHERE id_detalle = ?");` | Prepara la consulta: "trae las personalizaciones de ese producto" (ingredientes agregados o quitados). |
| 122 | `$stmtP->bind_param("i", $detalle['id_detalle']);` | Llena los `?` de la consulta, en orden: `$detalle['id_detalle']` (número entero). |
| 123 | `$stmtP->execute();` | Ejecuta la consulta. |
| 124 | `$personalizaciones = $stmtP->get_result()->fetch_all(MYSQLI_ASSOC);` | Las guarda en `$personalizaciones`. |
| 125 | `$stmtP->close();` | Cierra la consulta. |
| 127 | `$extras = [];` | `$extras` empieza vacía (ingredientes agregados). |
| 128 | `$removidos = [];` | `$removidos` empieza vacía (ingredientes quitados). |
| 129 | `foreach ($personalizaciones as $p) {` | Recorre cada personalización (`$p`). |
| 130 | `$entrada = ['id' => (string) $p['id_ingrediente'], 'name' => $p['nombre_ingrediente'], 'quantity' => (float) $p['cantidad']];` | Arma `$entrada` con el número, el nombre y la cantidad del ingrediente. |
| 131 | `if ($p['accion_modificacion'] === 'agregar') {` | Si fue para agregar... |
| 132 | `$extras[] = $entrada;` | ...la pone en `$extras`. |
| 133 | `} else {` | Si no (fue para quitar)... |
| 134 | `$removidos[] = $entrada;` | ...la pone en `$removidos`. |
| 135 | `}` | Cierra el `else`. |
| 136 | `}` | Cierra el `foreach`. |
| 138 | `$items[] = [` | Agrega el producto a `$items`, con los nombres que usa React: |
| 139 | `'id'         => (string) $detalle['id_detalle'],` | el número del detalle, |
| 140 | `'productId'  => (string) $detalle['id_producto'],` | el número del producto, |
| 141 | `'name'       => $detalle['nombre_producto'],` | el nombre, |
| 142 | `'quantity'   => (int) $detalle['cantidad'],` | la cantidad, |
| 143 | `'price'      => (float) $detalle['precio_unitario'],` | el precio, |
| 144 | `'finalPrice' => (float) $detalle['precio_unitario'],` | el precio final (el mismo), |
| 145 | `'isCustom'   => (bool) $detalle['es_personalizado'],` | si es una hamburguesa armada por el cliente, |
| 146 | `'extras'     => $extras,` | los extras, |
| 147 | `'removed'    => $removidos,` | y los quitados. |
| 148 | `];` | Cierra los datos del producto. |
| 149 | `}` | Cierra el `foreach`. |
| 150 | `return $items;` | Devuelve la lista de productos. |
| 151 | `}` | Cierra la función `itemsDe()`. |
| 153 | `private function formar($row, $rolQueVe, $idQueVe)` | Método `formar($row, $rolQueVe, $idQueVe)` (privado): organiza un pedido para React. |
| 154 | `{` | Abre la función `formar()`. |
| 155 | `return pedido_a_json($row, $this->itemsDe($row['id_pedido']), $rolQueVe, $idQueVe);` | Llama a `pedido_a_json()` (de `views/json/pedido.php`) con la fila, sus productos (`itemsDe()`) y quién lo mira, y lo devuelve. |
| 156 | `}` | Cierra la función `formar()`. |
| 157 | `}` | Cierra la clase `Pedido`. |
| 158 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, cargar los datos de todas las pantallas | `Failed to open stream` |
| el método `porRol()` | recargar los pedidos después del cierre de caja, cargar los datos de todas las pantallas | `Call to undefined method Pedido::porRol()` |
| el método `buscar()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos | `Call to undefined method Pedido::buscar()` |
| el método `buscarCrudo()` | cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos | `Call to undefined method Pedido::buscarCrudo()` |
| el método `numeroDesdeId()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos | `Call to undefined method Pedido::numeroDesdeId()` |
| el método `itemsDe()` | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, cargar los datos de todas las pantallas | `Call to undefined method Pedido::itemsDe()` |
| el método `formar()` | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, cargar los datos de todas las pantallas | `Call to undefined method Pedido::formar()` |
| la constante `BASE` | lo que la usa dentro de la clase | `Undefined constant Pedido::BASE` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
