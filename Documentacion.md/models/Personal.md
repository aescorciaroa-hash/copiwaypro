# models/Personal.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Maneja el personal (tablas AYUDANTE_COCINA y DOMICILIARIO).

## ¿Qué hace?
- trae todo el personal
- organiza los datos de un ayudante de cocina
- organiza los datos de un domiciliario
- crea personal (cocina o domiciliario)
- edita personal
- elimina personal (solo si no tiene pedidos)
- guarda la ubicación del domiciliario

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `listar()` | trae todo el personal | `SyncController::index()` |
| `comoJsonCocina()` | organiza los datos de un ayudante de cocina | `Personal::listar()` |
| `comoJsonDomicilio()` | organiza los datos de un domiciliario | `Personal::listar()` |
| `crear()` | crea personal (cocina o domiciliario) | `StaffController::store()` |
| `actualizar()` | edita personal | `StaffController::update()` |
| `existe()` (privado) | revisa si existe | `Personal::actualizar()`, `Personal::actualizarUbicacion()`, `Personal::eliminarPermanente()` |
| `actualizarCocina()` (privado) | edita un ayudante de cocina | `Personal::actualizar()` |
| `actualizarDomicilio()` (privado) | edita un domiciliario | `Personal::actualizar()` |
| `guardarCambios()` (privado) | guarda los cambios en la base de datos | `Personal::actualizarCocina()`, `Personal::actualizarDomicilio()` |
| `eliminarPermanente()` | elimina personal (solo si no tiene pedidos) | `StaffController::destroy()` |
| `actualizarUbicacion()` | guarda la ubicación del domiciliario | `StaffController::updateLocation()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/StaffController.php`, `controllers/SyncController.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Personal: ayudantes de cocina (AYUDANTE_COCINA) y domiciliarios (DOMICILIARIO)."* |
| 5 | `class Personal` | Crea la clase `Personal`: maneja a los ayudantes de cocina (tabla `AYUDANTE_COCINA`) y a los domiciliarios (tabla `DOMICILIARIO`). La usan `StaffController` y `SyncController`. |
| 6 | `{` | Abre la clase `Personal`. |
| 7 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 9 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 10 | `{` | Abre la función `__construct()`. |
| 11 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 12 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 13 | `}` | Cierra la función `__construct()`. |
| 15 | `public function listar()` | Método `listar()`: trae todo el personal (cocina y domiciliarios). |
| 16 | `{` | Abre la función `listar()`. |
| 17 | `$stmtC = $this->conn->prepare(` | Prepara la consulta (`$stmtC`): "trae los ayudantes de cocina (`ac`) con el nombre del administrador que los creó (`LEFT JOIN ADMINISTRADOR`), los más nuevos primero". |
| 18 | `"SELECT ac.*, a.nombre AS creado_por_nombre FROM AYUDANTE_COCINA ac` | ↑ (sigue la misma instrucción) |
| 19 | `LEFT JOIN ADMINISTRADOR a ON a.id_admin = ac.creado_por` | ↑ (sigue la misma instrucción) |
| 20 | `ORDER BY ac.creado_en DESC"` | ↑ (sigue la misma instrucción) |
| 21 | `);` | ↑ (sigue la misma instrucción) |
| 22 | `$stmtC->execute();` | Ejecuta la consulta. |
| 23 | `$cocina = $stmtC->get_result()->fetch_all(MYSQLI_ASSOC);` | Los guarda en `$cocina`. |
| 24 | `$stmtC->close();` | Cierra la consulta. |
| 26 | `$stmtD = $this->conn->prepare(` | Prepara la consulta (`$stmtD`): "trae los domiciliarios (`d`) con el nombre de quien los creó, los más nuevos primero". |
| 27 | `"SELECT d.*, a.nombre AS creado_por_nombre FROM DOMICILIARIO d` | ↑ (sigue la misma instrucción) |
| 28 | `LEFT JOIN ADMINISTRADOR a ON a.id_admin = d.creado_por` | ↑ (sigue la misma instrucción) |
| 29 | `ORDER BY d.creado_en DESC"` | ↑ (sigue la misma instrucción) |
| 30 | `);` | ↑ (sigue la misma instrucción) |
| 31 | `$stmtD->execute();` | Ejecuta la consulta. |
| 32 | `$domicilio = $stmtD->get_result()->fetch_all(MYSQLI_ASSOC);` | Los guarda en `$domicilio`. |
| 33 | `$stmtD->close();` | Cierra la consulta. |
| 35 | `$resultado = [];` | Empieza `$resultado` vacía. |
| 36 | `foreach ($cocina as $row) {` | Recorre los de cocina. |
| 37 | `$resultado[] = $this->comoJsonCocina($row);` | Organiza cada uno (`comoJsonCocina()` de abajo) y lo agrega. |
| 38 | `}` | Cierra el `foreach`. |
| 39 | `foreach ($domicilio as $row) {` | Recorre los domiciliarios. |
| 40 | `$resultado[] = $this->comoJsonDomicilio($row);` | Organiza cada uno (`comoJsonDomicilio()` de abajo) y lo agrega. |
| 41 | `}` | Cierra el `foreach`. |
| 42 | `return $resultado;` | Devuelve la lista completa. |
| 43 | `}` | Cierra la función `listar()`. |
| 45 | `public function comoJsonCocina($row)` | Método `comoJsonCocina($row)`: organiza un ayudante de cocina para React. |
| 46 | `{` | Abre la función `comoJsonCocina()`. |
| 47 | `return personal_cocina_a_json($row);` | Usa `personal_cocina_a_json()` (de `views/json/personal.php`) y lo devuelve. |
| 48 | `}` | Cierra la función `comoJsonCocina()`. |
| 50 | `public function comoJsonDomicilio($row)` | Método `comoJsonDomicilio($row)`: organiza un domiciliario para React, con el pedido que lleva ahora. |
| 51 | `{` | Abre la función `comoJsonDomicilio()`. |
| 52 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "busca el pedido que este domiciliario lleva 'en camino', con las coordenadas del destino". |
| 53 | `"SELECT id_pedido, destino_lat, destino_lng FROM PEDIDO WHERE id_domiciliario = ? AND estado = 'en_camino' LIMIT 1"` | ↑ (sigue la misma instrucción) |
| 54 | `);` | ↑ (sigue la misma instrucción) |
| 55 | `$stmt->bind_param("i", $row['id_domiciliario']);` | Llena los `?` de la consulta, en orden: `$row['id_domiciliario']` (número entero). |
| 56 | `$stmt->execute();` | Ejecuta la consulta. |
| 57 | `$pedido = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$pedido` (o nada). |
| 58 | `$stmt->close();` | Cierra la consulta. |
| 60 | `$pedidoActual = $pedido ? '#ORD-' . $pedido['id_pedido'] : null;` | Si lleva un pedido, guarda su código (`#ORD-` + número) en `$pedidoActual`; si no, `null`. |
| 61 | `$destino = ($pedido && $pedido['destino_lat'] !== null && $pedido['destino_lng'] !== null)` | Si lleva un pedido y tiene coordenadas, guarda `[latitud, longitud]` en `$destino`; si no, `null`. `? :` en varias líneas = si / si no. |
| 62 | `? [(float) $pedido['destino_lat'], (float) $pedido['destino_lng']]` | ↑ (sigue la misma instrucción) |
| 63 | `: null;` | ↑ (sigue la misma instrucción) |
| 64 | `return personal_domicilio_a_json($row, $pedidoActual, $destino);` | Organiza todo con `personal_domicilio_a_json()` (de `views/json/personal.php`) y lo devuelve. |
| 65 | `}` | Cierra la función `comoJsonDomicilio()`. |
| 67 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea un ayudante de cocina o un domiciliario segun $d['role']."* |
| 68 | `public function crear($d, $idAdmin)` | Método `crear($d, $idAdmin)`: crea un ayudante de cocina o un domiciliario. Lo usa `StaffController::store()`. |
| 69 | `{` | Abre la función `crear()`. |
| 70 | `$hash = password_hash($d['password'], PASSWORD_DEFAULT);` | Cifra la contraseña y la guarda en `$hash`. |
| 71 | `$hashPin = !empty($d['pin']) ? password_hash($d['pin'], PASSWORD_DEFAULT) : null;` | Si mandó PIN, lo cifra y lo guarda en `$hashPin`; si no, `null`. |
| 72 | `$telefono = $d['phone'] ?? '';` | Guarda en `$telefono` el teléfono (si no hay, vacío). |
| 74 | `if ($d['role'] === 'Ayudante de cocina') {` | Si es ayudante de cocina... |
| 75 | `$stmt = $this->conn->prepare(` | ...prepara la consulta: "guarda en `AYUDANTE_COCINA` el nombre, correo, teléfono, contraseña cifrada, PIN cifrado y quién lo creó". |
| 76 | `"INSERT INTO AYUDANTE_COCINA (nombre, correo, telefono, contrasena, pin, creado_por)` | ↑ (sigue la misma instrucción) |
| 77 | `VALUES (?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 78 | `);` | ↑ (sigue la misma instrucción) |
| 79 | `$stmt->bind_param("ssssss", $d['name'], $d['email'], $telefono, $hash, $hashPin, $idAdmin);` | Llena los `?` de la consulta, en orden: `$d['name']` (texto), `$d['email']` (texto), `$telefono` (texto), `$hash` (texto), `$hashPin` (texto), `$idAdmin` (texto). |
| 80 | `$stmt->execute();` | Ejecuta la consulta. |
| 81 | `$stmt->close();` | Cierra la consulta. |
| 82 | `return $this->conn->insert_id;` | ...devuelve el número del nuevo (`insert_id`). |
| 83 | `}` | Cierra el `if`. |
| 85 | `if ($d['role'] === 'Domiciliario') {` | Si es domiciliario... |
| 86 | `$values = [` | ...arma la lista `$values` con sus datos, en orden: |
| 87 | `$d['name'], $d['email'], $telefono, $hash, $hashPin,` | nombre, correo, teléfono, contraseña cifrada, PIN cifrado, |
| 88 | `$d['vehicle'] ?? 'moto', $d['vehicleModel'] ?? null, $d['plate'] ?? null,` | vehículo (si no mandó, `'moto'`), modelo del vehículo, placa, |
| 89 | `$d['baseCash'] ?? 0, $idAdmin,` | dinero base (si no mandó, 0) y quién lo creó. |
| 90 | `];` | Cierra la lista. |
| 91 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda en `DOMICILIARIO` todos esos datos". |
| 92 | `"INSERT INTO DOMICILIARIO` | ↑ (sigue la misma instrucción) |
| 93 | `(nombre, correo, telefono, contrasena, pin, tipo_vehiculo, modelo_vehiculo, placa,` | ↑ (sigue la misma instrucción) |
| 94 | `base_efectivo_asignada, creado_por)` | ↑ (sigue la misma instrucción) |
| 95 | `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 96 | `);` | ↑ (sigue la misma instrucción) |
| 97 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 98 | `$stmt->execute();` | Ejecuta la consulta. |
| 99 | `$stmt->close();` | Cierra la consulta. |
| 100 | `return $this->conn->insert_id;` | Devuelve el número del nuevo. |
| 101 | `}` | Cierra el `if`. |
| 103 | `throw new Exception("Rol de staff inválido: {$d['role']}");` | Si el rol no es ninguno de los dos, lanza el error "Rol de staff inválido". `{$d['role']}` pone el rol dentro del texto. |
| 104 | `}` | Cierra la función `crear()`. |
| 106-110 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Actualiza a un miembro del personal. Los ids se repiten entre las dos tablas, por eso si llega 'role' se va directo a la tabla correcta; si no, busca primero en cocina y luego en domicilio. Devuelve 'kitchen', 'delivery' o null."* |
| 111 | `public function actualizar($id, $d)` | Método `actualizar($id, $d)`: edita a una persona del personal. Lo usa `StaffController::update()`. Como el mismo número puede existir en cocina y en domicilio, primero mira el rol. |
| 112 | `{` | Abre la función `actualizar()`. |
| 113 | `$rol = $d['role'] ?? null;` | Guarda en `$rol` el rol que mandó (si no mandó, `null`). |
| 115 | `if ($rol === 'Ayudante de cocina') {` | Si es ayudante de cocina... |
| 116 | `return $this->existe('AYUDANTE_COCINA', 'id_ayudante', $id) ? $this->actualizarCocina($id, $d) : null;` | ...si existe en esa tabla (`existe()` de abajo), lo edita (`actualizarCocina()`); si no, devuelve `null`. |
| 117 | `}` | Cierra el `if`. |
| 118 | `if ($rol === 'Domiciliario') {` | Si es domiciliario... |
| 119 | `return $this->existe('DOMICILIARIO', 'id_domiciliario', $id) ? $this->actualizarDomicilio($id, $d) : null;` | ...si existe, lo edita (`actualizarDomicilio()`); si no, `null`. |
| 120 | `}` | Cierra el `if`. |
| 122 | `if ($this->existe('AYUDANTE_COCINA', 'id_ayudante', $id)) {` | Si no mandó rol: si existe en cocina... |
| 123 | `return $this->actualizarCocina($id, $d);` | ...lo edita ahí. |
| 124 | `}` | Cierra el `if`. |
| 125 | `if ($this->existe('DOMICILIARIO', 'id_domiciliario', $id)) {` | Si existe en domicilio... |
| 126 | `return $this->actualizarDomicilio($id, $d);` | ...lo edita ahí. |
| 127 | `}` | Cierra el `if`. |
| 128 | `return null;` | Si no existe en ninguna, devuelve `null`. |
| 129 | `}` | Cierra la función `actualizar()`. |
| 131 | `private function existe($tabla, $idCol, $id)` | Método `existe($tabla, $idCol, $id)` (privado): dice si existe un número en una tabla. |
| 132 | `{` | Abre la función `existe()`. |
| 133 | `$stmt = $this->conn->prepare("SELECT {$idCol} FROM {$tabla} WHERE {$idCol} = ?");` | Prepara la consulta: "busca ese id en esa tabla". |
| 134 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 135 | `$stmt->execute();` | Ejecuta la consulta. |
| 136 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 137 | `$stmt->close();` | Cierra la consulta. |
| 138 | `return (bool) $row;` | Devuelve `true` si lo encontró. |
| 139 | `}` | Cierra la función `existe()`. |
| 141 | `private function actualizarCocina($id, $d)` | Método `actualizarCocina($id, $d)` (privado): edita un ayudante de cocina. |
| 142 | `{` | Abre la función `actualizarCocina()`. |
| 143 | `$mapa = ['name' => 'nombre', 'email' => 'correo', 'phone' => 'telefono'];` | `$mapa`: nombre que usa React → columna de la base de datos (nombre, correo, teléfono). |
| 144 | `$this->guardarCambios('AYUDANTE_COCINA', 'id_ayudante', $id, $mapa, $d);` | Guarda los cambios (`guardarCambios()` de abajo). |
| 145 | `return 'kitchen';` | Devuelve `'kitchen'` (cocina). |
| 146 | `}` | Cierra la función `actualizarCocina()`. |
| 148 | `private function actualizarDomicilio($id, $d)` | Método `actualizarDomicilio($id, $d)` (privado): edita un domiciliario. |
| 149 | `{` | Abre la función `actualizarDomicilio()`. |
| 150 | `$mapa = [` | `$mapa` con las columnas que se pueden cambiar: |
| 151 | `'name' => 'nombre', 'email' => 'correo', 'phone' => 'telefono',` | nombre, correo, teléfono, |
| 152 | `'plate' => 'placa', 'vehicle' => 'tipo_vehiculo', 'vehicleModel' => 'modelo_vehiculo',` | placa, vehículo, modelo, |
| 153 | `'baseCash' => 'base_efectivo_asignada',` | dinero base. |
| 154 | `];` | Cierra el mapa. |
| 155 | `$this->guardarCambios('DOMICILIARIO', 'id_domiciliario', $id, $mapa, $d);` | Guarda los cambios. |
| 156 | `return 'delivery';` | Devuelve `'delivery'` (domiciliario). |
| 157 | `}` | Cierra la función `actualizarDomicilio()`. |
| 159 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Arma y ejecuta el UPDATE con los campos que vengan en $d."* |
| 160 | `private function guardarCambios($tabla, $idCol, $id, $mapa, $d)` | Método `guardarCambios(...)` (privado): arma y ejecuta la consulta que cambia los datos que llegaron. |
| 161 | `{` | Abre la función `guardarCambios()`. |
| 162 | `$sets = [];` | `$sets` vacía (columnas a cambiar). |
| 163 | `$values = [];` | `$values` vacía (valores nuevos). |
| 164 | `foreach ($mapa as $clave => $columna) {` | Recorre el mapa. |
| 165 | `if (array_key_exists($clave, $d)) {` | Si llegó ese dato... |
| 166 | `$sets[] = "{$columna} = ?";` | ...anota `columna = ?`. |
| 167 | `$values[] = $d[$clave];` | ...y su valor. |
| 168 | `}` | Cierra el `if`. |
| 169 | `}` | Cierra el `foreach`. |
| 170 | `if (array_key_exists('active', $d)) {` | Si llegó "activo" (dar de alta o de baja)... |
| 171 | `$sets[] = "activo = ?";` | ...anota la columna `activo`. |
| 172 | `$values[] = $d['active'] ? 1 : 0;` | ...con `1` (activo) o `0` (de baja). |
| 173 | `}` | Cierra el `if`. |
| 174 | `if (!empty($d['password'])) {` | Si llegó una contraseña nueva... |
| 175 | `$sets[] = "contrasena = ?";` | ...anota la columna `contrasena`. |
| 176 | `$values[] = password_hash($d['password'], PASSWORD_DEFAULT);` | ...con la contraseña cifrada. |
| 177 | `}` | Cierra el `if`. |
| 178 | `if (!empty($d['pin'])) {` | Si llegó un PIN nuevo... |
| 179 | `$sets[] = "pin = ?";` | ...anota la columna `pin`. |
| 180 | `$values[] = password_hash($d['pin'], PASSWORD_DEFAULT);` | ...con el PIN cifrado. |
| 181 | `}` | Cierra el `if`. |
| 182 | `if (empty($sets)) {` | Si no hay nada que cambiar... |
| 183 | `return;` | ...sale. |
| 184 | `}` | Cierra el `if`. |
| 185 | `$values[] = $id;` | Agrega al final el número (para el `WHERE`). |
| 187 | `$sql = "UPDATE {$tabla} SET " . implode(", ", $sets) . " WHERE {$idCol} = ?";` | Arma la consulta: "cambia en esa tabla estas columnas donde el id sea `?`". |
| 188 | `$stmt = $this->conn->prepare($sql);` | Prepara la consulta. |
| 189 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 190 | `$stmt->execute();` | Ejecuta la consulta. |
| 191 | `$stmt->close();` | Cierra la consulta. |
| 192 | `}` | Cierra la función `guardarCambios()`. |
| 194-199 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Borra de verdad a un miembro del personal, solo si nunca preparo, repartio ni fue liquidado en un pedido (para no romper el historial ni los reportes). Quien ya tiene historial se da de baja (activo = 0) con actualizar(). Devuelve true si lo borro, false si no existe; lanza Exception si tiene historial."* |
| 200 | `public function eliminarPermanente($id, $rol)` | Método `eliminarPermanente($id, $rol)`: borra a alguien del personal, solo si nunca tuvo pedidos. Lo usa `StaffController::destroy()`. |
| 201 | `{` | Abre la función `eliminarPermanente()`. |
| 202 | `if ($rol === 'Ayudante de cocina') {` | Si es ayudante de cocina... |
| 203 | `$tabla = 'AYUDANTE_COCINA';` | ...la tabla es `AYUDANTE_COCINA`... |
| 204 | `$idCol = 'id_ayudante';` | ...su columna id es `id_ayudante`... |
| 205 | `$historial = ["SELECT COUNT(*) AS total FROM PEDIDO WHERE id_ayudante = ?"];` | ...y para saber si tiene historial, cuenta los pedidos que preparó. |
| 206 | `} elseif ($rol === 'Domiciliario') {` | Si es domiciliario... |
| 207 | `$tabla = 'DOMICILIARIO';` | ...la tabla es `DOMICILIARIO`... |
| 208 | `$idCol = 'id_domiciliario';` | ...su columna id es `id_domiciliario`... |
| 209 | `$historial = [` | ...y revisa dos cosas: |
| 210 | `"SELECT COUNT(*) AS total FROM PEDIDO WHERE id_domiciliario = ?",` | los pedidos que repartió, |
| 211 | `"SELECT COUNT(*) AS total FROM LIQUIDACION_DOMICILIARIO WHERE id_domiciliario = ?",` | y los cierres de caja donde se le pagó. |
| 212 | `];` | Cierra la lista. |
| 213 | `} else {` | Si no mandó un rol válido... |
| 214 | `throw new InvalidArgumentException('Indica el rol del colaborador que quieres eliminar.');` | ...lanza el error "Indica el rol del colaborador que quieres eliminar.". |
| 215 | `}` | Cierra el `else`. |
| 217 | `if (!$this->existe($tabla, $idCol, $id)) {` | Si no existe... |
| 218 | `return false;` | ...devuelve `false`. |
| 219 | `}` | Cierra el `if`. |
| 221 | `foreach ($historial as $sql) {` | Recorre cada consulta del historial (`$sql`). |
| 222 | `$stmt = $this->conn->prepare($sql);` | La prepara. |
| 223 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 224 | `$stmt->execute();` | Ejecuta la consulta. |
| 225 | `$cuenta = $stmt->get_result()->fetch_assoc();` | Guarda el resultado en `$cuenta`. |
| 226 | `$stmt->close();` | Cierra la consulta. |
| 227 | `if ((int) $cuenta['total'] > 0) {` | Si tiene al menos uno... |
| 228 | `throw new Exception('Este colaborador ya tiene pedidos en su historial y no se puede eliminar. Usa "Dar de baja" para quitarle el acceso.');` | ...lanza el error "Este colaborador ya tiene pedidos en su historial y no se puede eliminar...". |
| 229 | `}` | Cierra el `if`. |
| 230 | `}` | Cierra el `foreach`. |
| 232 | `$stmt = $this->conn->prepare("DELETE FROM {$tabla} WHERE {$idCol} = ?");` | Prepara la consulta: "borra a esa persona de su tabla". |
| 233 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 234 | `$stmt->execute();` | Ejecuta la consulta. |
| 235 | `$stmt->close();` | Cierra la consulta. |
| 236 | `return true;` | Devuelve `true` (se borró). |
| 237 | `}` | Cierra la función `eliminarPermanente()`. |
| 239 | `public function actualizarUbicacion($id, $lat, $lng)` | Método `actualizarUbicacion($id, $lat, $lng)`: guarda dónde está el domiciliario. Lo usa `StaffController::updateLocation()`. |
| 240 | `{` | Abre la función `actualizarUbicacion()`. |
| 241 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "cambia la latitud, la longitud y la hora de la ubicación (`NOW()` = ahora) del domiciliario". |
| 242 | `"UPDATE DOMICILIARIO SET ubicacion_lat = ?, ubicacion_lng = ?, ubicacion_actualizada = NOW() WHERE id_domiciliario = ?"` | ↑ (sigue la misma instrucción) |
| 243 | `);` | ↑ (sigue la misma instrucción) |
| 244 | `$stmt->bind_param("dds", $lat, $lng, $id);` | Llena los `?` de la consulta, en orden: `$lat` (número con decimales), `$lng` (número con decimales), `$id` (texto). |
| 245 | `$stmt->execute();` | Ejecuta la consulta. |
| 246 | `$stmt->close();` | Cierra la consulta. |
| 247 | *(comentario)* | Comentario: no se ejecuta. Dice: *"affected_rows es 0 si llega la misma posicion en el mismo segundo: se revisa que exista."* |
| 248 | `return $this->existe('DOMICILIARIO', 'id_domiciliario', $id);` | Devuelve `true` si el domiciliario existe (`existe()`). |
| 249 | `}` | Cierra la función `actualizarUbicacion()`. |
| 250 | `}` | Cierra la clase `Personal`. |
| 251 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | crear personal, editar personal o darlo de baja, eliminar personal, guardar la ubicación del domiciliario, cargar los datos de todas las pantallas | `Failed to open stream` |
| el método `listar()` | cargar los datos de todas las pantallas | `Call to undefined method Personal::listar()` |
| el método `comoJsonCocina()` | cargar los datos de todas las pantallas | `Call to undefined method Personal::comoJsonCocina()` |
| el método `comoJsonDomicilio()` | cargar los datos de todas las pantallas | `Call to undefined method Personal::comoJsonDomicilio()` |
| el método `crear()` | crear personal | `Call to undefined method Personal::crear()` |
| el método `actualizar()` | editar personal o darlo de baja | `Call to undefined method Personal::actualizar()` |
| el método `existe()` | editar personal o darlo de baja, eliminar personal, guardar la ubicación del domiciliario | `Call to undefined method Personal::existe()` |
| el método `actualizarCocina()` | editar personal o darlo de baja | `Call to undefined method Personal::actualizarCocina()` |
| el método `actualizarDomicilio()` | editar personal o darlo de baja | `Call to undefined method Personal::actualizarDomicilio()` |
| el método `guardarCambios()` | editar personal o darlo de baja | `Call to undefined method Personal::guardarCambios()` |
| el método `eliminarPermanente()` | eliminar personal | `Call to undefined method Personal::eliminarPermanente()` |
| el método `actualizarUbicacion()` | guardar la ubicación del domiciliario | `Call to undefined method Personal::actualizarUbicacion()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
