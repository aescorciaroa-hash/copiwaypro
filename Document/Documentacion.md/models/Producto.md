# models/Producto.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja los productos del menú y su receta (tablas PRODUCTO y RECETA).

## ¿Qué hace?
- trae los productos
- busca un producto
- organiza el producto para React
- crea un producto con su receta
- edita un producto
- elimina un producto

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `listar()` | trae los productos | `SyncController::index()` |
| `buscar()` | busca un producto | `ProductController::destroy()`, `ProductController::store()`, `ProductController::update()` |
| `comoJson()` | organiza el producto para React | `Producto::buscar()`, `Producto::listar()` |
| `recetaDe()` (privado) | trae la receta (ingredientes y empaques) | `Producto::comoJson()` |
| `badgeAEnum()` (privado) | traduce la etiqueta del producto (ej. "Nuevo") | `Producto::actualizar()`, `Producto::crear()` |
| `crear()` | crea un producto con su receta | `ProductController::store()` |
| `actualizar()` | edita un producto | `ProductController::update()` |
| `eliminar()` | elimina un producto | `ProductController::destroy()` |
| `sincronizarReceta()` (privado) | vuelve a guardar la receta | `Producto::actualizar()`, `Producto::crear()` |
| `resolverCategoria()` (privado) | busca la categoría (o la crea) | `Producto::actualizar()`, `Producto::crear()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/ProductController.php`, `controllers/SyncController.php`.
- **Usa:** `Ingrediente`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta
1. **Base de datos:** en el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.
2. **Tablas que toca:** PRODUCTO, RECETA, CATEGORIA, INGREDIENTE.
3. **Quién lo usa:** `ProductController` (crear, editar, borrar) y `SyncController` (mostrar el menú).
4. **Otros que usa:** `Ingrediente` (con `require_once __DIR__ . '/Ingrediente.php'`), para la receta. Usa `views/json/producto.php` (`producto_a_json()`).
5. **Sus métodos que otros pueden llamar:** `listar()`, `buscar()`, `comoJson()`, `crear()`, `actualizar()`, `eliminar()`.

```
React → /api/... → public/index.php → config/rutas.php → Controlador → Producto → MySQL
```

### Preguntas que te pueden hacer sobre este archivo

**¿Cómo se conecta `Producto` a la base de datos?**  
En el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.

**¿Con qué se conecta `Producto`?**  
Con la base de datos (tablas PRODUCTO, RECETA, CATEGORIA, INGREDIENTE); con quien lo usa: `ProductController` (crear, editar, borrar) y `SyncController` (mostrar el menú). Y con: `Ingrediente` (con `require_once __DIR__ . '/Ingrediente.php'`), para la receta. Usa `views/json/producto.php` (`producto_a_json()`).

**¿Dónde se crea la conexión que usa?**  
En `config/database.php` (`$conn = new mysqli(...)`). La carga `public/index.php` una sola vez.

**¿Por qué `Producto` usa `Ingrediente`?**  
Porque cada producto tiene una receta (tabla `RECETA`) hecha de ingredientes.

**¿Qué pasa con la categoría si no existe?**  
`resolverCategoria()` la busca y, si no está, la crea.

**¿Por qué usa una transacción en `crear()`?**  
Guarda el producto y su receta. Si la receta falla, se deshace el producto también.

**¿Qué pasa si se borra este archivo?**  
Los archivos que lo usan fallan con *"Failed opening required '...Producto.php'"* o *"Class 'Producto' not found"* (error 500).

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Producto (PRODUCTO y RECETA). El producto oculto "Hamburguesa Personalizada" nunca aparece en el catalogo."* |
| 6 | `require_once __DIR__ . '/Ingrediente.php';` | Trae `models/Ingrediente.php` (la receta usa la clase `Ingrediente`). `/Ingrediente.php` = está en la misma carpeta. |
| 8 | `class Producto` | Crea la clase `Producto`: maneja los productos del menú y su receta (tablas `PRODUCTO` y `RECETA`). La usan `ProductController` y `SyncController`. |
| 9 | `{` | Abre la clase `Producto`. |
| 10 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 12 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Texto de la etiqueta en el frontend => valor del ENUM etiqueta_destacada."* |
| 13 | `const BADGE_A_ENUM = [` | Constante `BADGE_A_ENUM`: traduce la etiqueta que manda React al valor que guarda la base de datos. |
| 14 | `'Más Vendido'  => 'mas_vendido',` | `'Más Vendido'` se guarda como `'mas_vendido'`. |
| 15 | `'Recomendado'  => 'recomendado',` | `'Recomendado'` → `'recomendado'`. |
| 16 | `'Nuevo'        => 'nuevo',` | `'Nuevo'` → `'nuevo'`. |
| 17 | `'Especialidad' => 'especialidad',` | `'Especialidad'` → `'especialidad'`. |
| 18 | `];` | Cierra la lista. |
| 20 | `const BASE = "SELECT p.*, c.nombre AS categoria_nombre` | Constante `BASE`: la consulta que se repite: "trae los productos (`p`) con el nombre de su categoría (`c`)". `JOIN` une las dos tablas. |
| 21 | `FROM PRODUCTO p` | ↑ (sigue la misma instrucción) |
| 22 | `JOIN CATEGORIA c ON c.id_categoria = p.id_categoria";` | ↑ (sigue la misma instrucción) |
| 24 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 25 | `{` | Abre la función `__construct()`. |
| 26 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 27 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 28 | `}` | Cierra la función `__construct()`. |
| 30-33 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"$soloActivos = true para el catalogo publico. $esAdmin = true devuelve el JSON completo (costos, receta y empaques)."* |
| 34 | `public function listar($soloActivos = false, $esAdmin = false)` | Método `listar($soloActivos, $esAdmin)`: trae los productos. `$soloActivos` = solo los activos; `$esAdmin` = con costos y receta. Lo usa `SyncController`. |
| 35 | `{` | Abre la función `listar()`. |
| 36 | `$sql = self::BASE . " WHERE p.nombre != 'Hamburguesa Personalizada'";` | Arma la consulta en `$sql`: `BASE` + "menos la Hamburguesa Personalizada" (es un producto oculto que se usa para las hamburguesas armadas por el cliente). |
| 37 | `if ($soloActivos) {` | Si solo se quieren los activos... |
| 38 | `$sql .= " AND p.estado = 'activo'";` | ...le agrega "y que estén activos" (`.=` agrega al final del texto). |
| 39 | `}` | Cierra el `if`. |
| 40 | `$sql .= " ORDER BY p.creado_en DESC";` | Le agrega "los más nuevos primero". |
| 42 | `$stmt = $this->conn->prepare($sql);` | Prepara la consulta. |
| 43 | `$stmt->execute();` | Ejecuta la consulta. |
| 44 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 45 | `$stmt->close();` | Cierra la consulta. |
| 47 | `$productos = [];` | Empieza `$productos` vacía. |
| 48 | `foreach ($rows as $row) {` | Recorre cada fila. |
| 49 | `$productos[] = $this->comoJson($row, $esAdmin);` | La organiza (`comoJson()` de abajo) y la agrega. |
| 50 | `}` | Cierra el `foreach`. |
| 51 | `return $productos;` | Devuelve la lista. |
| 52 | `}` | Cierra la función `listar()`. |
| 54 | `public function buscar($id, $esAdmin = false)` | Método `buscar($id, $esAdmin)`: busca un producto y lo devuelve organizado. Lo usa `ProductController`. |
| 55 | `{` | Abre la función `buscar()`. |
| 56 | `$stmt = $this->conn->prepare(self::BASE . " WHERE p.id_producto = ? LIMIT 1");` | Prepara: `BASE` + "el producto con ese id, solo uno". |
| 57 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 58 | `$stmt->execute();` | Ejecuta la consulta. |
| 59 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 60 | `$stmt->close();` | Cierra la consulta. |
| 61 | `return $row ? $this->comoJson($row, $esAdmin) : null;` | Si lo encontró, lo organiza; si no, `null`. |
| 62 | `}` | Cierra la función `buscar()`. |
| 64 | `public function comoJson($row, $esAdmin = false)` | Método `comoJson($row, $esAdmin)`: organiza un producto para React, con su receta. |
| 65 | `{` | Abre la función `comoJson()`. |
| 66 | `$receta = $this->recetaDe($row['id_producto']);` | Trae la receta del producto (`recetaDe()` de abajo). |
| 67 | `return producto_a_json($row, $receta['ingredientes'], $receta['empaques'], $esAdmin);` | Organiza todo con `producto_a_json()` (de `views/json/producto.php`) y lo devuelve. |
| 68 | `}` | Cierra la función `comoJson()`. |
| 70 | `private function recetaDe($idProducto)` | Método `recetaDe($idProducto)` (privado): trae los ingredientes y empaques de un producto. |
| 71 | `{` | Abre la función `recetaDe()`. |
| 72 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "de la receta (`r`) de este producto, trae cuánto se usa, el insumo (`i`) y si es comida o empaque (`c.ambito`)". |
| 73 | `"SELECT r.cantidad_necesaria, i.id_ingrediente, i.nombre, c.ambito` | ↑ (sigue la misma instrucción) |
| 74 | `FROM RECETA r` | ↑ (sigue la misma instrucción) |
| 75 | `JOIN INGREDIENTE i ON i.id_ingrediente = r.id_ingrediente` | ↑ (sigue la misma instrucción) |
| 76 | `JOIN CATEGORIA c ON c.id_categoria = i.id_categoria` | ↑ (sigue la misma instrucción) |
| 77 | `WHERE r.id_producto = ?"` | ↑ (sigue la misma instrucción) |
| 78 | `);` | ↑ (sigue la misma instrucción) |
| 79 | `$stmt->bind_param("i", $idProducto);` | Llena los `?` de la consulta, en orden: `$idProducto` (número entero). |
| 80 | `$stmt->execute();` | Ejecuta la consulta. |
| 81 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 82 | `$stmt->close();` | Cierra la consulta. |
| 84 | `$ingredientes = [];` | `$ingredientes` empieza vacía. |
| 85 | `$empaques = [];` | `$empaques` empieza vacía. |
| 86 | `foreach ($rows as $r) {` | Recorre cada línea de la receta (`$r`). |
| 87 | `$entrada = ['id' => (string) $r['id_ingrediente'], 'name' => $r['nombre'], 'quantityDeduct' => (float) $r['cantidad_necesaria']];` | Arma `$entrada` con el número, el nombre y cuánto se descuenta. |
| 88 | `if ($r['ambito'] === 'empaque_desechable') {` | Si es un empaque o desechable... |
| 89 | `$empaques[] = $entrada;` | ...lo pone en `$empaques`. |
| 90 | `} else {` | Si no... |
| 91 | `$ingredientes[] = $entrada;` | ...lo pone en `$ingredientes`. |
| 92 | `}` | Cierra el `else`. |
| 93 | `}` | Cierra el `foreach`. |
| 94 | `return ['ingredientes' => $ingredientes, 'empaques' => $empaques];` | Devuelve las dos listas. |
| 95 | `}` | Cierra la función `recetaDe()`. |
| 97 | `private function badgeAEnum($badge)` | Método `badgeAEnum($badge)` (privado): traduce la etiqueta para guardarla. |
| 98 | `{` | Abre la función `badgeAEnum()`. |
| 99 | `if (empty($badge)) {` | Si no hay etiqueta... |
| 100 | `return 'ninguna';` | ...devuelve `'ninguna'`. |
| 101 | `}` | Cierra el `if`. |
| 102 | `return self::BADGE_A_ENUM[$badge] ?? (in_array($badge, self::BADGE_A_ENUM, true) ? $badge : 'ninguna');` | Busca la traducción en `BADGE_A_ENUM`. Si no está (`??`), revisa si ya venía traducida (`in_array`); si sí, la deja; si no, `'ninguna'`. |
| 103 | `}` | Cierra la función `badgeAEnum()`. |
| 105 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea el producto con su receta (ingredientes + empaques) en una transaccion."* |
| 106 | `public function crear($d)` | Método `crear($d)`: crea un producto con su receta. Lo usa `ProductController::store()`. |
| 107 | `{` | Abre la función `crear()`. |
| 108 | `$this->conn->begin_transaction();` | Empieza una transacción (`begin_transaction`): todo lo de abajo se guarda junto, o nada. |
| 109 | `try {` | Intenta... |
| 110 | `$values = [` | ...arma `$values` con los datos del producto, en orden: |
| 111 | `$this->resolverCategoria($d['category'] ?? null),` | el número de la categoría (`resolverCategoria()` de abajo; si no existe, la crea), |
| 112 | `$d['name'], $d['description'] ?? null, $d['price'],` | el nombre, la descripción y el precio, |
| 113 | `$d['costPrice'] ?? null, $d['image'] ?? null, $d['prepTime'] ?? null,` | el costo, la foto y el tiempo de preparación, |
| 114 | `($d['active'] ?? true) ? 'activo' : 'oculto',` | el estado: si está activo (`true` por defecto), `'activo'`; si no, `'oculto'`, |
| 115 | `$this->badgeAEnum($d['badge'] ?? null),` | y la etiqueta traducida. |
| 116 | `];` | Cierra la lista. |
| 118 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda el producto en `PRODUCTO` con esos datos". |
| 119 | `"INSERT INTO PRODUCTO` | ↑ (sigue la misma instrucción) |
| 120 | `(id_categoria, nombre, descripcion, precio, costo_calculado,` | ↑ (sigue la misma instrucción) |
| 121 | `imagen, tiempo_preparacion, estado, etiqueta_destacada)` | ↑ (sigue la misma instrucción) |
| 122 | `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 123 | `);` | ↑ (sigue la misma instrucción) |
| 124 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 125 | `$stmt->execute();` | Ejecuta la consulta. |
| 126 | `$stmt->close();` | Cierra la consulta. |
| 127 | `$id = $this->conn->insert_id;` | Guarda en `$id` el número del producto nuevo. |
| 129 | `$this->sincronizarReceta($id, $d['ingredients'] ?? [], $d['packaging'] ?? []);` | Guarda su receta (`sincronizarReceta()` de abajo). |
| 131 | `$this->conn->commit();` | Confirma la transacción (`commit`): ahora sí queda todo guardado. |
| 132 | `return $id;` | Devuelve el número del producto. |
| 133 | `} catch (Exception $e) {` | Si algo falló... |
| 134 | `$this->conn->rollback();` | ...deshace todo (`rollback`): no queda nada a medias. |
| 135 | `throw $e;` | ...y vuelve a lanzar el error (`throw $e`) para que lo atrape el controlador. |
| 136 | `}` | Cierra el `catch`. |
| 137 | `}` | Cierra la función `crear()`. |
| 139 | `public function actualizar($id, $d)` | Método `actualizar($id, $d)`: edita un producto. Lo usa `ProductController::update()`. |
| 140 | `{` | Abre la función `actualizar()`. |
| 141 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 142 | `try {` | Intenta... |
| 143 | `$mapa = [` | ...`$mapa`: nombre que usa React → columna: |
| 144 | `'name' => 'nombre', 'description' => 'descripcion', 'price' => 'precio',` | nombre, descripción, precio, |
| 145 | `'costPrice' => 'costo_calculado', 'image' => 'imagen', 'prepTime' => 'tiempo_preparacion',` | costo, foto, tiempo de preparación. |
| 146 | `];` | Cierra el mapa. |
| 148 | `$sets = [];` | `$sets` vacía. |
| 149 | `$values = [];` | `$values` vacía. |
| 150 | `foreach ($mapa as $clave => $columna) {` | Recorre el mapa. |
| 151 | `if (array_key_exists($clave, $d)) {` | Si llegó ese dato... |
| 152 | `$sets[] = "{$columna} = ?";` | ...anota `columna = ?`. |
| 153 | `$values[] = $d[$clave];` | ...y su valor. |
| 154 | `}` | Cierra el `if`. |
| 155 | `}` | Cierra el `foreach`. |
| 156 | `if (array_key_exists('active', $d)) {` | Si llegó "activo"... |
| 157 | `$sets[] = "estado = ?";` | ...anota la columna `estado`... |
| 158 | `$values[] = $d['active'] ? 'activo' : 'oculto';` | ...con `'activo'` u `'oculto'`. |
| 159 | `}` | Cierra el `if`. |
| 160 | `if (array_key_exists('badge', $d)) {` | Si llegó la etiqueta... |
| 161 | `$sets[] = "etiqueta_destacada = ?";` | ...anota la columna... |
| 162 | `$values[] = $this->badgeAEnum($d['badge']);` | ...con la etiqueta traducida. |
| 163 | `}` | Cierra el `if`. |
| 164 | `if (array_key_exists('category', $d)) {` | Si llegó la categoría... |
| 165 | `$sets[] = "id_categoria = ?";` | ...anota la columna... |
| 166 | `$values[] = $this->resolverCategoria($d['category']);` | ...con el número de la categoría. |
| 167 | `}` | Cierra el `if`. |
| 169 | `if (!empty($sets)) {` | Si hay algo que cambiar... |
| 170 | `$values[] = $id;` | ...agrega el número del producto al final. |
| 171 | `$sql = "UPDATE PRODUCTO SET " . implode(", ", $sets) . " WHERE id_producto = ?";` | ...arma la consulta: "cambia en `PRODUCTO` estas columnas donde el id sea `?`". |
| 172 | `$stmt = $this->conn->prepare($sql);` | ...la prepara. |
| 173 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 174 | `$stmt->execute();` | Ejecuta la consulta. |
| 175 | `$stmt->close();` | Cierra la consulta. |
| 176 | `}` | Cierra el `if`. |
| 178 | `if (array_key_exists('ingredients', $d) \|\| array_key_exists('packaging', $d)) {` | Si llegaron ingredientes o empaques... |
| 179 | `$this->sincronizarReceta($id, $d['ingredients'] ?? [], $d['packaging'] ?? []);` | ...vuelve a guardar la receta. |
| 180 | `}` | Cierra el `if`. |
| 182 | `$this->conn->commit();` | Confirma la transacción. |
| 183 | `} catch (Exception $e) {` | Si algo falló... |
| 184 | `$this->conn->rollback();` | ...deshace todo. |
| 185 | `throw $e;` | ...y lanza el error. |
| 186 | `}` | Cierra el `catch`. |
| 187 | `}` | Cierra la función `actualizar()`. |
| 189 | `public function eliminar($id)` | Método `eliminar($id)`: borra un producto. Lo usa `ProductController::destroy()`. |
| 190 | `{` | Abre la función `eliminar()`. |
| 191 | `$stmt = $this->conn->prepare("DELETE FROM PRODUCTO WHERE id_producto = ?");` | Prepara la consulta: "borra el producto con ese id". |
| 192 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 193 | `$stmt->execute();` | Ejecuta la consulta. |
| 194 | `$stmt->close();` | Cierra la consulta. |
| 195 | `}` | Cierra la función `eliminar()`. |
| 197-200 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Rehace la receta del producto. Cada insumo se busca por nombre en INGREDIENTE y si no existe se crea (Ingrediente::resolverOCrear)."* |
| 201 | `private function sincronizarReceta($idProducto, $ingredientes, $empaques)` | Método `sincronizarReceta(...)` (privado): borra la receta del producto y la vuelve a guardar con los ingredientes y empaques nuevos. |
| 202 | `{` | Abre la función `sincronizarReceta()`. |
| 203 | `$stmtD = $this->conn->prepare("DELETE FROM RECETA WHERE id_producto = ?");` | Prepara la consulta: "borra toda la receta de este producto". |
| 204 | `$stmtD->bind_param("s", $idProducto);` | Llena los `?` de la consulta, en orden: `$idProducto` (texto). |
| 205 | `$stmtD->execute();` | Ejecuta la consulta. |
| 206 | `$stmtD->close();` | Cierra la consulta. |
| 208 | `$lista = [];` | `$lista` empieza vacía. |
| 209 | `foreach ($ingredientes as $item) {` | Recorre los ingredientes. |
| 210 | `$item['ambito'] = 'insumo_alimenticio';` | A cada uno le pone el tipo `'insumo_alimenticio'` (comida). |
| 211 | `$lista[] = $item;` | Lo agrega a `$lista`. |
| 212 | `}` | Cierra el `foreach`. |
| 213 | `foreach ($empaques as $item) {` | Recorre los empaques. |
| 214 | `$item['ambito'] = 'empaque_desechable';` | A cada uno le pone el tipo `'empaque_desechable'`. |
| 215 | `$lista[] = $item;` | Lo agrega a `$lista`. |
| 216 | `}` | Cierra el `foreach`. |
| 218 | `$ingredienteModel = new Ingrediente();` | Crea el modelo `Ingrediente`. |
| 219 | `foreach ($lista as $item) {` | Recorre la lista. |
| 220 | `if (empty($item['name'])) {` | Si no tiene nombre... |
| 221 | `continue;` | ...lo salta. |
| 222 | `}` | Cierra el `if`. |
| 223 | `$idIngrediente = $ingredienteModel->resolverOCrear($item['name'], $item['ambito']);` | Busca el insumo por nombre; si no existe, lo crea (`resolverOCrear()` de `models/Ingrediente.php`). Guarda su número. |
| 224 | `if ($idIngrediente === null) {` | Si no se pudo... |
| 225 | `continue;` | ...lo salta. |
| 226 | `}` | Cierra el `if`. |
| 227 | `$values = [$idProducto, $idIngrediente, $item['quantity'] ?? 1];` | Arma `$values`: el producto, el insumo y la cantidad (si no mandó, 1). |
| 228 | `$stmtI = $this->conn->prepare("INSERT INTO RECETA (id_producto, id_ingrediente, cantidad_necesaria) VALUES (?, ?, ?)");` | Prepara la consulta: "guarda esa línea de la receta en `RECETA`". |
| 229 | `$stmtI->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 230 | `$stmtI->execute();` | Ejecuta la consulta. |
| 231 | `$stmtI->close();` | Cierra la consulta. |
| 232 | `}` | Cierra el `foreach`. |
| 233 | `}` | Cierra la función `sincronizarReceta()`. |
| 235 | `private function resolverCategoria($nombreCategoria)` | Método `resolverCategoria($nombreCategoria)` (privado): busca la categoría por nombre; si no existe, la crea. Devuelve su número. |
| 236 | `{` | Abre la función `resolverCategoria()`. |
| 237 | `$nombreCategoria = trim((string) $nombreCategoria);` | Le quita los espacios al nombre. |
| 238 | `if ($nombreCategoria === '') {` | Si está vacío... |
| 239 | `throw new Exception('La categoría del producto es obligatoria.');` | ...lanza el error "La categoría del producto es obligatoria.". |
| 240 | `}` | Cierra el `if`. |
| 242 | `$stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE nombre = ? AND ambito = 'menu' LIMIT 1");` | Prepara la consulta: "busca la categoría del menú con ese nombre". |
| 243 | `$stmt->bind_param("s", $nombreCategoria);` | Llena los `?` de la consulta, en orden: `$nombreCategoria` (texto). |
| 244 | `$stmt->execute();` | Ejecuta la consulta. |
| 245 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 246 | `$stmt->close();` | Cierra la consulta. |
| 247 | `if ($row) {` | Si la encontró... |
| 248 | `return $row['id_categoria'];` | ...devuelve su número. |
| 249 | `}` | Cierra el `if`. |
| 251 | `$stmtI = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES (?, 'menu')");` | Si no, prepara la consulta: "guarda la categoría nueva". |
| 252 | `$stmtI->bind_param("s", $nombreCategoria);` | Llena los `?` de la consulta, en orden: `$nombreCategoria` (texto). |
| 253 | `$stmtI->execute();` | Ejecuta la consulta. |
| 254 | `$stmtI->close();` | Cierra la consulta. |
| 255 | `return $this->conn->insert_id;` | Devuelve el número de la categoría nueva. |
| 256 | `}` | Cierra la función `resolverCategoria()`. |
| 257 | `}` | Cierra la clase `Producto`. |
| 258 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | crear productos, editar productos, eliminar productos, cargar los datos de todas las pantallas | `Failed to open stream` |
| el método `listar()` | cargar los datos de todas las pantallas | `Call to undefined method Producto::listar()` |
| el método `buscar()` | crear productos, editar productos, eliminar productos | `Call to undefined method Producto::buscar()` |
| el método `comoJson()` | crear productos, editar productos, eliminar productos, cargar los datos de todas las pantallas | `Call to undefined method Producto::comoJson()` |
| el método `recetaDe()` | crear productos, editar productos, eliminar productos, cargar los datos de todas las pantallas | `Call to undefined method Producto::recetaDe()` |
| el método `badgeAEnum()` | crear productos, editar productos | `Call to undefined method Producto::badgeAEnum()` |
| el método `crear()` | crear productos | `Call to undefined method Producto::crear()` |
| el método `actualizar()` | editar productos | `Call to undefined method Producto::actualizar()` |
| el método `eliminar()` | eliminar productos | `Call to undefined method Producto::eliminar()` |
| el método `sincronizarReceta()` | crear productos, editar productos | `Call to undefined method Producto::sincronizarReceta()` |
| el método `resolverCategoria()` | crear productos, editar productos | `Call to undefined method Producto::resolverCategoria()` |
| la constante `BADGE_A_ENUM` | lo que la usa dentro de la clase | `Undefined constant Producto::BADGE_A_ENUM` |
| la constante `BASE` | lo que la usa dentro de la clase | `Undefined constant Producto::BASE` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
