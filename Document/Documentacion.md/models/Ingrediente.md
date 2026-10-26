# models/Ingrediente.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja el inventario (tablas INGREDIENTE y MOVIMIENTO_INVENTARIO).

## ¿Qué hace?
- trae el inventario
- trae los ingredientes para armar hamburguesas
- busca un insumo
- organiza un insumo para React
- crea un insumo (con su stock inicial)
- edita un insumo
- elimina un insumo (lo desactiva)
- suma o resta stock
- descuenta el inventario cuando se hace un pedido
- devuelve al inventario lo que gastó un pedido cancelado
- busca un insumo por nombre (o lo crea)
- trae los movimientos del inventario

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `listarInventario()` | trae el inventario | `SyncController::index()` |
| `listarIngredientes()` | trae los ingredientes para armar hamburguesas | `SyncController::index()` |
| `buscar()` | busca un insumo | `InventoryController::adjustStock()`, `InventoryController::destroy()`, `InventoryController::store()`, `InventoryController::update()` |
| `comoInventario()` | organiza un insumo para React | `InventoryController::adjustStock()`, `InventoryController::store()`, `InventoryController::update()` |
| `crearConStockInicial()` | crea un insumo (con su stock inicial) | `InventoryController::store()` |
| `actualizar()` | edita un insumo | `InventoryController::update()` |
| `eliminar()` | elimina un insumo (lo desactiva) | `InventoryController::destroy()` |
| `ajustarStock()` | suma o resta stock | `InventoryController::adjustStock()` |
| `descontarPorReceta()` | descuenta el inventario cuando se hace un pedido | `PedidoService::guardar()` |
| `devolverDePedido()` | devuelve al inventario lo que gastó un pedido cancelado | `PedidoService::cancelarLinksVencidos()` |
| `resolverOCrear()` | busca un insumo por nombre (o lo crea) | `Producto::sincronizarReceta()` |
| `resolverCategoria()` (privado) | busca la categoría del insumo (o la crea) | `Ingrediente::actualizar()`, `Ingrediente::crearConStockInicial()` |
| `registrosDeMovimientos()` | trae los movimientos del inventario | `SyncController::index()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/InventoryController.php`, `models/PedidoService.php`, `models/Producto.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta
1. **Base de datos:** en el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.
2. **Tablas que toca:** INGREDIENTE, MOVIMIENTO_INVENTARIO, CATEGORIA.
3. **Quién lo usa:** `InventoryController`, `SyncController`, `models/Producto.php` (la receta) y `models/PedidoService.php` (descontar al vender).
4. **Otros que usa:** ningún otro modelo. Usa `views/json/ingrediente.php` para organizar los datos.
5. **Sus métodos que otros pueden llamar:** `listarInventario()`, `listarIngredientes()`, `buscar()`, `comoInventario()`, `crearConStockInicial()`, `actualizar()`, `eliminar()`, `ajustarStock()`, `descontarPorReceta()`, `devolverDePedido()`, `resolverOCrear()`, `registrosDeMovimientos()`.

```
React → /api/... → public/index.php → config/rutas.php → Controlador → Ingrediente → MySQL
```

### Preguntas que te pueden hacer sobre este archivo

**¿Cómo se conecta `Ingrediente` a la base de datos?**  
En el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.

**¿Con qué se conecta `Ingrediente`?**  
Con la base de datos (tablas INGREDIENTE, MOVIMIENTO_INVENTARIO, CATEGORIA); con quien lo usa: `InventoryController`, `SyncController`, `models/Producto.php` (la receta) y `models/PedidoService.php` (descontar al vender). Y con: ningún otro modelo. Usa `views/json/ingrediente.php` para organizar los datos.

**¿Dónde se crea la conexión que usa?**  
En `config/database.php` (`$conn = new mysqli(...)`). La carga `public/index.php` una sola vez.

**¿Cómo se conecta con los pedidos?**  
`PedidoService` llama `descontarPorReceta()` al crear un pedido y `devolverDePedido()` si se cancela.

**¿Para qué es MOVIMIENTO_INVENTARIO?**  
Cada vez que el stock sube o baja se guarda una fila: así queda el historial de quién y por qué.

**¿Qué pasa si se borra este archivo?**  
Los archivos que lo usan fallan con *"Failed opening required '...Ingrediente.php'"* o *"Class 'Ingrediente' not found"* (error 500).

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Ingrediente (INGREDIENTE, CATEGORIA y MOVIMIENTO_INVENTARIO). Se usa en dos formas: inventario (/api/inventory) y catalogo de extras (/api/ingredients)."* |
| 6 | `class Ingrediente` | Crea la clase `Ingrediente`: maneja el inventario (tablas `INGREDIENTE`, `CATEGORIA` y `MOVIMIENTO_INVENTARIO`). La usan `InventoryController`, `SyncController`, `Producto` y `PedidoService`. |
| 7 | `{` | Abre la clase `Ingrediente`. |
| 8 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 10 | `const BASE = "SELECT i.*, c.nombre AS categoria_nombre` | Constante `BASE`: la consulta que se repite: "trae los insumos (`i`) con el nombre de su categoría (`c`)". |
| 11 | `FROM INGREDIENTE i` | ↑ (sigue la misma instrucción) |
| 12 | `JOIN CATEGORIA c ON c.id_categoria = i.id_categoria";` | ↑ (sigue la misma instrucción) |
| 14 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 15 | `{` | Abre la función `__construct()`. |
| 16 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 17 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 18 | `}` | Cierra la función `__construct()`. |
| 20 | `public function listarInventario()` | Método `listarInventario()`: trae el inventario. Lo usa `SyncController`. |
| 21 | `{` | Abre la función `listarInventario()`. |
| 22 | `$stmt = $this->conn->prepare(self::BASE . " WHERE i.activo = 1 ORDER BY i.nombre ASC");` | Prepara: `BASE` + "solo los activos, en orden alfabético". |
| 23 | `$stmt->execute();` | Ejecuta la consulta. |
| 24 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 25 | `$stmt->close();` | Cierra la consulta. |
| 26 | `$inventario = [];` | Empieza `$inventario` vacía. |
| 27 | `foreach ($rows as $row) {` | Recorre cada fila. |
| 28 | `$inventario[] = ingrediente_a_inventario($row);` | La organiza con `ingrediente_a_inventario()` (de `views/json/ingrediente.php`) y la agrega. |
| 29 | `}` | Cierra el `foreach`. |
| 30 | `return $inventario;` | Devuelve la lista. |
| 31 | `}` | Cierra la función `listarInventario()`. |
| 33 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Catalogo para personalizar hamburguesas (sin empaques ni desechables)."* |
| 34 | `public function listarIngredientes()` | Método `listarIngredientes()`: trae los ingredientes para que el cliente arme su hamburguesa (sin empaques). Lo usa `SyncController`. |
| 35 | `{` | Abre la función `listarIngredientes()`. |
| 36 | `$stmt = $this->conn->prepare(self::BASE . " WHERE i.activo = 1 AND c.ambito != 'empaque_desechable' ORDER BY i.nombre ASC");` | Prepara: `BASE` + "activos, que no sean empaques (`!=` = diferente), en orden alfabético". |
| 37 | `$stmt->execute();` | Ejecuta la consulta. |
| 38 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 39 | `$stmt->close();` | Cierra la consulta. |
| 40 | `$catalogo = [];` | Empieza `$catalogo` vacía. |
| 41 | `foreach ($rows as $row) {` | Recorre cada fila. |
| 42 | `$catalogo[] = ingrediente_a_catalogo($row);` | La organiza con `ingrediente_a_catalogo()` y la agrega. |
| 43 | `}` | Cierra el `foreach`. |
| 44 | `return $catalogo;` | Devuelve la lista. |
| 45 | `}` | Cierra la función `listarIngredientes()`. |
| 47 | `public function buscar($id)` | Método `buscar($id)`: busca un insumo. Lo usa `InventoryController`. |
| 48 | `{` | Abre la función `buscar()`. |
| 49 | `$stmt = $this->conn->prepare(self::BASE . " WHERE i.id_ingrediente = ? LIMIT 1");` | Prepara: `BASE` + "el insumo con ese id, solo uno". |
| 50 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 51 | `$stmt->execute();` | Ejecuta la consulta. |
| 52 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 53 | `$stmt->close();` | Cierra la consulta. |
| 54 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 55 | `}` | Cierra la función `buscar()`. |
| 57 | `public function comoInventario($row)` | Método `comoInventario($row)`: organiza un insumo para React. |
| 58 | `{` | Abre la función `comoInventario()`. |
| 59 | `return ingrediente_a_inventario($row);` | Usa `ingrediente_a_inventario()` y lo devuelve. |
| 60 | `}` | Cierra la función `comoInventario()`. |
| 62 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea el insumo y, si trae stock inicial, registra el movimiento de entrada."* |
| 63 | `public function crearConStockInicial($d, $idAdmin)` | Método `crearConStockInicial($d, $idAdmin)`: crea un insumo y, si trae stock, anota la entrada. Lo usa `InventoryController::store()`. |
| 64 | `{` | Abre la función `crearConStockInicial()`. |
| 65 | `$this->conn->begin_transaction();` | Empieza una transacción: todo se guarda junto, o nada. |
| 66 | `try {` | Intenta... |
| 67 | `$idCategoria = $this->resolverCategoria($d['category'] ?? null);` | ...busca la categoría por nombre o la crea (`resolverCategoria()` de abajo) y guarda su número. |
| 68 | `$values = [` | ...arma `$values` con los datos del insumo, en orden: |
| 69 | `$idCategoria, $d['name'], $d['unit'] ?? 'unidad', $d['stock'] ?? 0,` | la categoría, el nombre, la unidad (si no mandó, `'unidad'`), el stock (si no, 0), |
| 70 | `$d['unitCost'] ?? 0, $d['totalCost'] ?? null, $d['price'] ?? 0,` | el costo de una unidad, el costo total y el precio extra, |
| 71 | `$d['supplier'] ?? null, $d['notes'] ?? null, $d['image'] ?? null,` | el proveedor, las notas y la foto. |
| 72 | `];` | Cierra la lista. |
| 74 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda el insumo en `INGREDIENTE` con esos datos". |
| 75 | `"INSERT INTO INGREDIENTE` | ↑ (sigue la misma instrucción) |
| 76 | `(id_categoria, nombre, unidad_medida, cantidad_stock,` | ↑ (sigue la misma instrucción) |
| 77 | `costo_unitario, costo_total, precio_extra, proveedor, notas, imagen)` | ↑ (sigue la misma instrucción) |
| 78 | `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 79 | `);` | ↑ (sigue la misma instrucción) |
| 80 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 81 | `$stmt->execute();` | Ejecuta la consulta. |
| 82 | `$stmt->close();` | Cierra la consulta. |
| 83 | `$id = $this->conn->insert_id;` | Guarda en `$id` el número del insumo nuevo. |
| 85 | `$stock = (float) ($d['stock'] ?? 0);` | Guarda en `$stock` el stock inicial, como número. |
| 86 | `if ($stock > 0) {` | Si es mayor que 0... |
| 87 | `$stmtM = $this->conn->prepare(` | ...prepara la consulta: "anota en `MOVIMIENTO_INVENTARIO` una entrada de ese insumo, con el motivo 'Stock inicial'". |
| 88 | `"INSERT INTO MOVIMIENTO_INVENTARIO (id_ingrediente, id_admin, tipo_movimiento, cantidad, motivo)` | ↑ (sigue la misma instrucción) |
| 89 | `VALUES (?, ?, 'entrada', ?, 'Stock inicial')"` | ↑ (sigue la misma instrucción) |
| 90 | `);` | ↑ (sigue la misma instrucción) |
| 91 | `$stmtM->bind_param("isd", $id, $idAdmin, $stock);` | Llena los `?` de la consulta, en orden: `$id` (número entero), `$idAdmin` (texto), `$stock` (número con decimales). |
| 92 | `$stmtM->execute();` | Ejecuta la consulta. |
| 93 | `$stmtM->close();` | Cierra la consulta. |
| 94 | `}` | Cierra el `if`. |
| 96 | `$this->conn->commit();` | Confirma la transacción. |
| 97 | `return $id;` | Devuelve el número del insumo. |
| 98 | `} catch (Exception $e) {` | Si algo falló... |
| 99 | `$this->conn->rollback();` | ...deshace todo. |
| 100 | `throw $e;` | ...y lanza el error. |
| 101 | `}` | Cierra el `catch`. |
| 102 | `}` | Cierra la función `crearConStockInicial()`. |
| 104 | `public function actualizar($id, $d)` | Método `actualizar($id, $d)`: edita un insumo. Lo usa `InventoryController::update()`. |
| 105 | `{` | Abre la función `actualizar()`. |
| 106 | `$mapa = [` | `$mapa`: nombre que usa React → columna: |
| 107 | `'name' => 'nombre', 'unit' => 'unidad_medida', 'stock' => 'cantidad_stock',` | nombre, unidad, stock, |
| 108 | `'unitCost' => 'costo_unitario', 'totalCost' => 'costo_total', 'price' => 'precio_extra',` | costo de una unidad, costo total, precio extra, |
| 109 | `'supplier' => 'proveedor', 'notes' => 'notas', 'image' => 'imagen',` | proveedor, notas, foto. |
| 110 | `];` | Cierra el mapa. |
| 112 | `$sets = [];` | `$sets` vacía. |
| 113 | `$values = [];` | `$values` vacía. |
| 114 | `foreach ($mapa as $clave => $columna) {` | Recorre el mapa. |
| 115 | `if (array_key_exists($clave, $d)) {` | Si llegó ese dato... |
| 116 | `$sets[] = "{$columna} = ?";` | ...anota `columna = ?`. |
| 117 | `$values[] = $d[$clave];` | ...y su valor. |
| 118 | `}` | Cierra el `if`. |
| 119 | `}` | Cierra el `foreach`. |
| 120 | `if (array_key_exists('category', $d)) {` | Si llegó la categoría... |
| 121 | `$sets[] = "id_categoria = ?";` | ...anota la columna... |
| 122 | `$values[] = $this->resolverCategoria($d['category']);` | ...con el número de la categoría. |
| 123 | `}` | Cierra el `if`. |
| 124 | `if (empty($sets)) {` | Si no hay nada que cambiar... |
| 125 | `return;` | ...sale. |
| 126 | `}` | Cierra el `if`. |
| 127 | `$values[] = $id;` | Agrega el número del insumo al final. |
| 129 | `$sql = "UPDATE INGREDIENTE SET " . implode(", ", $sets) . " WHERE id_ingrediente = ?";` | Arma la consulta: "cambia en `INGREDIENTE` estas columnas donde el id sea `?`". |
| 130 | `$stmt = $this->conn->prepare($sql);` | Prepara la consulta. |
| 131 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 132 | `$stmt->execute();` | Ejecuta la consulta. |
| 133 | `$stmt->close();` | Cierra la consulta. |
| 134 | `}` | Cierra la función `actualizar()`. |
| 136 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Baja logica (activo = 0): el insumo tiene movimientos y recetas que lo referencian."* |
| 137 | `public function eliminar($id)` | Método `eliminar($id)`: "elimina" un insumo. En realidad lo desactiva (`activo = 0`), porque puede estar en recetas y en pedidos viejos. Lo usa `InventoryController::destroy()`. |
| 138 | `{` | Abre la función `eliminar()`. |
| 139 | `$stmt = $this->conn->prepare("UPDATE INGREDIENTE SET activo = 0 WHERE id_ingrediente = ?");` | Prepara la consulta: "pon `activo = 0` en ese insumo". |
| 140 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 141 | `$stmt->execute();` | Ejecuta la consulta. |
| 142 | `$stmt->close();` | Cierra la consulta. |
| 143 | `}` | Cierra la función `eliminar()`. |
| 145 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Ajuste manual de stock (entrada o salida). Devuelve el nuevo stock."* |
| 146 | `public function ajustarStock($id, $cantidad, $idAdmin)` | Método `ajustarStock($id, $cantidad, $idAdmin)`: suma o resta stock a mano. Lo usa `InventoryController::adjustStock()`. |
| 147 | `{` | Abre la función `ajustarStock()`. |
| 148 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 149 | `try {` | Intenta... |
| 150 | `$stmt = $this->conn->prepare("SELECT cantidad_stock FROM INGREDIENTE WHERE id_ingrediente = ? FOR UPDATE");` | ...prepara la consulta: "trae el stock de ese insumo y bloquéalo (`FOR UPDATE`)" para que nadie más lo cambie al mismo tiempo. |
| 151 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 152 | `$stmt->execute();` | Ejecuta la consulta. |
| 153 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 154 | `$stmt->close();` | Cierra la consulta. |
| 156 | `if (!$row) {` | Si no existe... |
| 157 | `throw new Exception('Insumo no encontrado.');` | ...lanza el error "Insumo no encontrado.". |
| 158 | `}` | Cierra el `if`. |
| 160 | `$nuevoStock = max(0, (float) $row['cantidad_stock'] + $cantidad);` | Calcula el stock nuevo (stock + cantidad). `max(0, ...)` = si queda negativo, lo deja en 0. |
| 161 | `$stmtU = $this->conn->prepare("UPDATE INGREDIENTE SET cantidad_stock = ? WHERE id_ingrediente = ?");` | Prepara la consulta: "cambia el stock del insumo". |
| 162 | `$stmtU->bind_param("ds", $nuevoStock, $id);` | Llena los `?` de la consulta, en orden: `$nuevoStock` (número con decimales), `$id` (texto). |
| 163 | `$stmtU->execute();` | Ejecuta la consulta. |
| 164 | `$stmtU->close();` | Cierra la consulta. |
| 166 | `$tipo = $cantidad > 0 ? 'entrada' : 'salida';` | Si la cantidad es positiva, el tipo es `'entrada'`; si no, `'salida'`. |
| 167 | `$absoluta = abs($cantidad);` | `abs` = la cantidad sin signo (ej. -5 → 5). |
| 168 | `$motivo = 'Ajuste manual';` | El motivo: "Ajuste manual". |
| 169 | `$stmtM = $this->conn->prepare(` | Prepara la consulta: "anota el movimiento en `MOVIMIENTO_INVENTARIO`". |
| 170 | `"INSERT INTO MOVIMIENTO_INVENTARIO (id_ingrediente, id_admin, tipo_movimiento, cantidad, motivo)` | ↑ (sigue la misma instrucción) |
| 171 | `VALUES (?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 172 | `);` | ↑ (sigue la misma instrucción) |
| 173 | `$stmtM->bind_param("sssds", $id, $idAdmin, $tipo, $absoluta, $motivo);` | Llena los `?` de la consulta, en orden: `$id` (texto), `$idAdmin` (texto), `$tipo` (texto), `$absoluta` (número con decimales), `$motivo` (texto). |
| 174 | `$stmtM->execute();` | Ejecuta la consulta. |
| 175 | `$stmtM->close();` | Cierra la consulta. |
| 177 | `$this->conn->commit();` | Confirma la transacción. |
| 178 | `return $nuevoStock;` | Devuelve el stock nuevo. |
| 179 | `} catch (Exception $e) {` | Si algo falló... |
| 180 | `$this->conn->rollback();` | ...deshace todo. |
| 181 | `throw $e;` | ...y lanza el error. |
| 182 | `}` | Cierra el `catch`. |
| 183 | `}` | Cierra la función `ajustarStock()`. |
| 185-188 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Descuenta stock por receta (dentro de la transaccion del pedido). Bloquea los insumos en orden por id, revisa que alcance TODO y despues descuenta."* |
| 189 | `public function descontarPorReceta($lineas, $idPedido, $idAdmin = null)` | Método `descontarPorReceta($lineas, $idPedido, $idAdmin)`: descuenta del inventario todo lo que usa un pedido. Lo usa `PedidoService` al crear el pedido. Primero revisa que alcance todo, y después descuenta. |
| 190 | `{` | Abre la función `descontarPorReceta()`. |
| 191 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Junta las cantidades por insumo."* |
| 192 | `$consolidado = [];` | `$consolidado` empieza vacía: aquí se junta cuánto se necesita de cada insumo. |
| 193 | `foreach ($lineas as $linea) {` | Recorre cada línea (un insumo de un producto). |
| 194 | `$id = $linea['id_ingrediente'];` | Guarda en `$id` el número del insumo. |
| 195 | `if (!isset($consolidado[$id])) {` | Si ese insumo todavía no está en `$consolidado`... |
| 196 | `$consolidado[$id] = ['cantidad' => 0, 'motivos' => []];` | ...lo agrega con cantidad 0 y sin motivos. |
| 197 | `}` | Cierra el `if`. |
| 198 | `$consolidado[$id]['cantidad'] += $linea['cantidad'];` | Le suma la cantidad (`+=`). |
| 199 | `$consolidado[$id]['motivos'][] = $linea['motivo'];` | Le agrega el motivo (ej. el nombre del producto). |
| 200 | `}` | Cierra el `foreach`. |
| 202 | `$ids = array_keys($consolidado);` | Guarda en `$ids` los números de los insumos (`array_keys` = las claves de la lista). |
| 203 | `sort($ids);` | Los ordena de menor a mayor (`sort`), para bloquearlos siempre en el mismo orden. |
| 205 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Bloquea cada insumo y guarda su stock."* |
| 206 | `$stock = [];` | `$stock` vacía: el stock de cada insumo. |
| 207 | `$nombre = [];` | `$nombre` vacía: el nombre de cada insumo. |
| 208 | `foreach ($ids as $id) {` | Recorre cada insumo. |
| 209 | `$stmt = $this->conn->prepare("SELECT id_ingrediente, nombre, cantidad_stock FROM INGREDIENTE WHERE id_ingrediente = ? FOR UPDATE");` | Prepara la consulta: "trae el número, nombre y stock del insumo, y bloquéalo". |
| 210 | `$stmt->bind_param("i", $id);` | Llena los `?` de la consulta, en orden: `$id` (número entero). |
| 211 | `$stmt->execute();` | Ejecuta la consulta. |
| 212 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 213 | `$stmt->close();` | Cierra la consulta. |
| 214 | `if (!$row) {` | Si no existe... |
| 215 | `throw new Exception("Insumo no encontrado (id $id).");` | ...lanza el error "Insumo no encontrado". |
| 216 | `}` | Cierra el `if`. |
| 217 | `$stock[$id] = (float) $row['cantidad_stock'];` | Guarda su stock. |
| 218 | `$nombre[$id] = $row['nombre'];` | Guarda su nombre. |
| 219 | `}` | Cierra el `foreach`. |
| 221 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Revisa que haya stock suficiente de todo."* |
| 222 | `foreach ($ids as $id) {` | Recorre otra vez cada insumo. |
| 223 | `$necesario = (float) $consolidado[$id]['cantidad'];` | Guarda en `$necesario` cuánto se necesita. |
| 224 | `if ($stock[$id] < $necesario) {` | Si no alcanza (`<` = menor que)... |
| 225 | `throw new Exception("Sin stock suficiente de \"{$nombre[$id]}\" (disponible: {$stock[$id]}, requerido: $necesario).");` | ...lanza el error "Sin stock suficiente de ..." con lo que hay y lo que se necesita. Así no se descuenta nada. |
| 226 | `}` | Cierra el `if`. |
| 227 | `}` | Cierra el `foreach`. |
| 229 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Descuenta y registra la salida."* |
| 230 | `foreach ($ids as $id) {` | Si alcanzó todo, recorre cada insumo para descontar. |
| 231 | `$necesario = (float) $consolidado[$id]['cantidad'];` | Cuánto se necesita. |
| 232 | `$stmtU = $this->conn->prepare("UPDATE INGREDIENTE SET cantidad_stock = cantidad_stock - ? WHERE id_ingrediente = ?");` | Prepara la consulta: "réstale esa cantidad al stock del insumo". |
| 233 | `$stmtU->bind_param("di", $necesario, $id);` | Llena los `?` de la consulta, en orden: `$necesario` (número con decimales), `$id` (número entero). |
| 234 | `$stmtU->execute();` | Ejecuta la consulta. |
| 235 | `$stmtU->close();` | Cierra la consulta. |
| 237 | `$motivo = implode(' + ', array_unique($consolidado[$id]['motivos']));` | Une los motivos con ` + ` (`implode`), sin repetidos (`array_unique`). |
| 238 | `$stmtM = $this->conn->prepare(` | Prepara la consulta: "anota la salida en `MOVIMIENTO_INVENTARIO`, con el pedido y el motivo". |
| 239 | `"INSERT INTO MOVIMIENTO_INVENTARIO (id_ingrediente, id_admin, id_pedido, tipo_movimiento, cantidad, motivo)` | ↑ (sigue la misma instrucción) |
| 240 | `VALUES (?, ?, ?, 'salida', ?, ?)"` | ↑ (sigue la misma instrucción) |
| 241 | `);` | ↑ (sigue la misma instrucción) |
| 242 | `$stmtM->bind_param("isids", $id, $idAdmin, $idPedido, $necesario, $motivo);` | Llena los `?` de la consulta, en orden: `$id` (número entero), `$idAdmin` (texto), `$idPedido` (número entero), `$necesario` (número con decimales), `$motivo` (texto). |
| 243 | `$stmtM->execute();` | Ejecuta la consulta. |
| 244 | `$stmtM->close();` | Cierra la consulta. |
| 245 | `}` | Cierra el `foreach`. |
| 246 | `}` | Cierra la función `descontarPorReceta()`. |
| 248-251 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Devuelve al inventario todo lo que se descontó por un pedido (cuando se cancela). Usa las salidas guardadas en MOVIMIENTO_INVENTARIO y registra una entrada por cada insumo."* |
| 252 | `public function devolverDePedido($idPedido)` | Método `devolverDePedido($idPedido)`: devuelve al inventario lo que gastó un pedido. Lo usa `PedidoService::cancelarLinksVencidos()` cuando un link de pago vence sin pagarse. |
| 253 | `{` | Abre la función `devolverDePedido()`. |
| 254 | `$stmt = $this->conn->prepare(` | Prepara la consulta: |
| 255 | `"SELECT id_ingrediente, SUM(cantidad) AS cantidad FROM MOVIMIENTO_INVENTARIO` | Trae cada insumo y la suma (`SUM`) de lo que se sacó... |
| 256 | `WHERE id_pedido = ? AND tipo_movimiento = 'salida'` | ...solo de las salidas de este pedido... |
| 257 | `GROUP BY id_ingrediente"` | ...juntando (`GROUP BY`) las salidas del mismo insumo en una sola fila. |
| 258 | `);` | ↑ (sigue la misma instrucción) |
| 259 | `$stmt->bind_param("i", $idPedido);` | Llena el `?` con `$idPedido` (número entero). |
| 260 | `$stmt->execute();` | Ejecuta la consulta. |
| 261 | `$salidas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Guarda todas las filas en `$salidas`. |
| 262 | `$stmt->close();` | Cierra la consulta. |
| 264 | `$motivo = 'Devolución pedido #ORD-' . $idPedido . ' cancelado';` | Guarda en `$motivo` el texto que se verá en el historial, por ejemplo "Devolución pedido #ORD-15 cancelado". |
| 265 | `foreach ($salidas as $salida) {` | Recorre cada insumo que se sacó (`$salida`): |
| 266 | `$id = (int) $salida['id_ingrediente'];` | Guarda en `$id` el número del insumo. |
| 267 | `$cantidad = (float) $salida['cantidad'];` | Guarda en `$cantidad` cuánto se sacó. |
| 269 | `$stmtU = $this->conn->prepare("UPDATE INGREDIENTE SET cantidad_stock = cantidad_stock + ? WHERE id_ingrediente = ?");` | Prepara la consulta que le **suma** esa cantidad al stock del insumo. |
| 270 | `$stmtU->bind_param("di", $cantidad, $id);` | Llena los `?`: `$cantidad` (número con decimales) y `$id` (número entero). |
| 271 | `$stmtU->execute();` | Ejecuta la consulta. |
| 272 | `$stmtU->close();` | Cierra la consulta. |
| 274 | `$stmtM = $this->conn->prepare(` | Prepara la consulta que guarda el movimiento en el historial: |
| 275 | `"INSERT INTO MOVIMIENTO_INVENTARIO (id_ingrediente, id_admin, id_pedido, tipo_movimiento, cantidad, motivo)` | Agrega una fila nueva a `MOVIMIENTO_INVENTARIO`... |
| 276 | `VALUES (?, NULL, ?, 'entrada', ?, ?)"` | ...de tipo `'entrada'` (volvió al inventario), sin administrador (`NULL`: lo hizo el sistema). |
| 277 | `);` | ↑ (sigue la misma instrucción) |
| 278 | `$stmtM->bind_param("iids", $id, $idPedido, $cantidad, $motivo);` | Llena los `?`: `$id` y `$idPedido` (números enteros), `$cantidad` (número con decimales) y `$motivo` (texto). |
| 279 | `$stmtM->execute();` | Ejecuta la consulta. |
| 280 | `$stmtM->close();` | Cierra la consulta. |
| 281 | `}` | Cierra el `foreach`. |
| 282 | `}` | Cierra la función `devolverDePedido()`. |
| 284-287 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca un insumo activo por nombre; si no existe lo crea con stock 0 en la categoria "General" del ambito dado. Lo usa la receta del producto."* |
| 288 | `public function resolverOCrear($nombre, $ambito)` | Método `resolverOCrear($nombre, $ambito)`: busca un insumo por nombre; si no existe, lo crea con stock 0. Lo usa `Producto` al guardar la receta. |
| 289 | `{` | Abre la función `resolverOCrear()`. |
| 290 | `$nombre = trim((string) $nombre);` | Le quita los espacios al nombre. |
| 291 | `if ($nombre === '') {` | Si está vacío... |
| 292 | `return null;` | ...devuelve `null`. |
| 293 | `}` | Cierra el `if`. |
| 295 | `$stmt = $this->conn->prepare("SELECT id_ingrediente FROM INGREDIENTE WHERE activo = 1 AND LOWER(nombre) = LOWER(?) LIMIT 1");` | Prepara la consulta: "busca un insumo activo con ese nombre, sin importar mayúsculas". |
| 296 | `$stmt->bind_param("s", $nombre);` | Llena los `?` de la consulta, en orden: `$nombre` (texto). |
| 297 | `$stmt->execute();` | Ejecuta la consulta. |
| 298 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 299 | `$stmt->close();` | Cierra la consulta. |
| 300 | `if ($row) {` | Si lo encontró... |
| 301 | `return (int) $row['id_ingrediente'];` | ...devuelve su número. |
| 302 | `}` | Cierra el `if`. |
| 304 | `$stmtC = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = ? AND nombre = 'General' LIMIT 1");` | Prepara la consulta: "busca la categoría 'General' de ese tipo". |
| 305 | `$stmtC->bind_param("s", $ambito);` | Llena los `?` de la consulta, en orden: `$ambito` (texto). |
| 306 | `$stmtC->execute();` | Ejecuta la consulta. |
| 307 | `$categoria = $stmtC->get_result()->fetch_assoc();` | La guarda en `$categoria`. |
| 308 | `$stmtC->close();` | Cierra la consulta. |
| 310 | `if ($categoria) {` | Si existe... |
| 311 | `$idCategoria = $categoria['id_categoria'];` | ...guarda su número. |
| 312 | `} else {` | Si no... |
| 313 | `$stmtN = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES ('General', ?)");` | ...prepara la consulta: "crea la categoría 'General' de ese tipo". |
| 314 | `$stmtN->bind_param("s", $ambito);` | Llena los `?` de la consulta, en orden: `$ambito` (texto). |
| 315 | `$stmtN->execute();` | Ejecuta la consulta. |
| 316 | `$stmtN->close();` | Cierra la consulta. |
| 317 | `$idCategoria = $this->conn->insert_id;` | ...y guarda su número. |
| 318 | `}` | Cierra el `else`. |
| 320 | `$stmtI = $this->conn->prepare(` | Prepara la consulta: "crea el insumo con ese nombre, en esa categoría, en unidades y con todo en 0". |
| 321 | `"INSERT INTO INGREDIENTE (id_categoria, nombre, unidad_medida, cantidad_stock, costo_unitario, precio_extra)` | ↑ (sigue la misma instrucción) |
| 322 | `VALUES (?, ?, 'unidad', 0, 0, 0)"` | ↑ (sigue la misma instrucción) |
| 323 | `);` | ↑ (sigue la misma instrucción) |
| 324 | `$stmtI->bind_param("is", $idCategoria, $nombre);` | Llena los `?` de la consulta, en orden: `$idCategoria` (número entero), `$nombre` (texto). |
| 325 | `$stmtI->execute();` | Ejecuta la consulta. |
| 326 | `$stmtI->close();` | Cierra la consulta. |
| 327 | `return $this->conn->insert_id;` | Devuelve el número del insumo nuevo. |
| 328 | `}` | Cierra la función `resolverOCrear()`. |
| 330-333 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Devuelve el id de una categoria de inventario por nombre; si no existe la crea. "Empaques & Desechables" se crea con ambito 'empaque_desechable', las demas como 'insumo_alimenticio'."* |
| 334 | `private function resolverCategoria($nombreCategoria)` | Método `resolverCategoria($nombreCategoria)` (privado): busca una categoría de inventario por nombre; si no existe, la crea. |
| 335 | `{` | Abre la función `resolverCategoria()`. |
| 336 | `$nombreCategoria = trim((string) $nombreCategoria);` | Le quita los espacios. |
| 337 | `if ($nombreCategoria === '') {` | Si está vacío... |
| 338 | `$nombreCategoria = 'Sin categoría';` | ...usa "Sin categoría". |
| 339 | `}` | Cierra el `if`. |
| 341 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "busca una categoría de inventario (comida o empaque) con ese nombre". |
| 342 | `"SELECT id_categoria FROM CATEGORIA` | ↑ (sigue la misma instrucción) |
| 343 | `WHERE nombre = ? AND ambito IN ('insumo_alimenticio', 'empaque_desechable') LIMIT 1"` | ↑ (sigue la misma instrucción) |
| 344 | `);` | ↑ (sigue la misma instrucción) |
| 345 | `$stmt->bind_param("s", $nombreCategoria);` | Llena los `?` de la consulta, en orden: `$nombreCategoria` (texto). |
| 346 | `$stmt->execute();` | Ejecuta la consulta. |
| 347 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 348 | `$stmt->close();` | Cierra la consulta. |
| 349 | `if ($row) {` | Si la encontró... |
| 350 | `return $row['id_categoria'];` | ...devuelve su número. |
| 351 | `}` | Cierra el `if`. |
| 353 | `$ambito = $nombreCategoria === 'Empaques & Desechables' ? 'empaque_desechable' : 'insumo_alimenticio';` | Si se llama "Empaques & Desechables", su tipo es empaque; si no, comida. |
| 354 | `$stmtI = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES (?, ?)");` | Prepara la consulta: "crea la categoría con ese nombre y tipo". |
| 355 | `$stmtI->bind_param("ss", $nombreCategoria, $ambito);` | Llena los `?` de la consulta, en orden: `$nombreCategoria` (texto), `$ambito` (texto). |
| 356 | `$stmtI->execute();` | Ejecuta la consulta. |
| 357 | `$stmtI->close();` | Cierra la consulta. |
| 358 | `return $this->conn->insert_id;` | Devuelve su número. |
| 359 | `}` | Cierra la función `resolverCategoria()`. |
| 361 | `public function registrosDeMovimientos()` | Método `registrosDeMovimientos()`: trae todos los movimientos del inventario (entradas y salidas). Lo usa `SyncController`. |
| 362 | `{` | Abre la función `registrosDeMovimientos()`. |
| 363 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "trae los movimientos (`m`) con el nombre del insumo (`i`), los más nuevos primero". |
| 364 | `"SELECT m.*, i.nombre AS item_nombre` | ↑ (sigue la misma instrucción) |
| 365 | `FROM MOVIMIENTO_INVENTARIO m` | ↑ (sigue la misma instrucción) |
| 366 | `JOIN INGREDIENTE i ON i.id_ingrediente = m.id_ingrediente` | ↑ (sigue la misma instrucción) |
| 367 | `ORDER BY m.fecha_hora DESC"` | ↑ (sigue la misma instrucción) |
| 368 | `);` | ↑ (sigue la misma instrucción) |
| 369 | `$stmt->execute();` | Ejecuta la consulta. |
| 370 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 371 | `$stmt->close();` | Cierra la consulta. |
| 373 | `$registros = [];` | `$registros` vacía. |
| 374 | `foreach ($rows as $row) {` | Recorre cada movimiento. |
| 375 | `$cantidad = abs((float) $row['cantidad']);` | Guarda la cantidad sin signo. |
| 376 | `if ($row['tipo_movimiento'] === 'salida') {` | Si es una salida... |
| 377 | `$cantidad = -$cantidad;` | ...la pone en negativo (`-`). |
| 378 | `}` | Cierra el `if`. |
| 379 | `$registros[] = [` | Agrega el movimiento con los nombres que usa React: |
| 380 | `'id'       => (string) $row['id_movimiento'],` | el número del movimiento, |
| 381 | `'date'     => $row['fecha_hora'],` | la fecha, |
| 382 | `'itemId'   => (string) $row['id_ingrediente'],` | el número del insumo, |
| 383 | `'itemName' => $row['item_nombre'],` | el nombre del insumo, |
| 384 | `'amount'   => $cantidad,` | la cantidad, |
| 385 | `'type'     => $row['tipo_movimiento'] === 'salida' ? 'Salida' : 'Entrada',` | el tipo: `'Salida'` o `'Entrada'`, |
| 386 | `'reason'   => $row['motivo'],` | y el motivo. |
| 387 | `];` | Cierra los datos del movimiento. |
| 388 | `}` | Cierra el `foreach`. |
| 389 | `return $registros;` | Devuelve la lista. |
| 390 | `}` | Cierra la función `registrosDeMovimientos()`. |
| 391 | `}` | Cierra la clase `Ingrediente`. |
| 392 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | crear productos, editar productos, eliminar productos, crear insumos, editar insumos, eliminar insumos, sumar o restar stock, recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, cargar los datos de todas las pantallas | `Failed to open stream` |
| el método `listarInventario()` | cargar los datos de todas las pantallas | `Call to undefined method Ingrediente::listarInventario()` |
| el método `listarIngredientes()` | cargar los datos de todas las pantallas | `Call to undefined method Ingrediente::listarIngredientes()` |
| el método `buscar()` | crear insumos, editar insumos, eliminar insumos, sumar o restar stock | `Call to undefined method Ingrediente::buscar()` |
| el método `comoInventario()` | crear insumos, editar insumos, sumar o restar stock | `Call to undefined method Ingrediente::comoInventario()` |
| el método `crearConStockInicial()` | crear insumos | `Call to undefined method Ingrediente::crearConStockInicial()` |
| el método `actualizar()` | editar insumos | `Call to undefined method Ingrediente::actualizar()` |
| el método `eliminar()` | eliminar insumos | `Call to undefined method Ingrediente::eliminar()` |
| el método `ajustarStock()` | sumar o restar stock | `Call to undefined method Ingrediente::ajustarStock()` |
| el método `descontarPorReceta()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp | `Call to undefined method Ingrediente::descontarPorReceta()` |
| el método `devolverDePedido()` | cancelar los pedidos con link de pago vencido (falla al sincronizar las pantallas) | `Call to undefined method Ingrediente::devolverDePedido()` |
| el método `resolverOCrear()` | crear productos, editar productos | `Call to undefined method Ingrediente::resolverOCrear()` |
| el método `resolverCategoria()` | crear insumos, editar insumos | `Call to undefined method Ingrediente::resolverCategoria()` |
| el método `registrosDeMovimientos()` | cargar los datos de todas las pantallas | `Call to undefined method Ingrediente::registrosDeMovimientos()` |
| la constante `BASE` | lo que la usa dentro de la clase | `Undefined constant Ingrediente::BASE` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
