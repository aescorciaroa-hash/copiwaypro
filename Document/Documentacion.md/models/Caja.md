# models/Caja.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Lee los datos para el cierre de caja.

## ¿Qué hace?
- revisa si ya se hizo el cierre hoy
- trae los pedidos entregados del turno
- calcula los insumos que se gastaron
- trae los domiciliarios activos
- dice el stock de un insumo
- cuenta los pedidos que no se han entregado
- arma el reporte del cierre

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `yaGeneradoHoy()` | revisa si ya se hizo el cierre hoy | `CajaService::generar()`, `CajaService::previsualizar()` |
| `pedidosDelTurno()` | trae los pedidos entregados del turno | `CajaService::generar()`, `CajaService::previsualizar()` |
| `consumoTeorico()` | calcula los insumos que se gastaron | `CajaService::generar()`, `CajaService::previsualizar()` |
| `domiciliariosActivos()` | trae los domiciliarios activos | `CajaService::generar()`, `CajaService::previsualizar()` |
| `stockActual()` | dice el stock de un insumo | `CajaService::generar()`, `CajaService::previsualizar()` |
| `pedidosActivosCount()` | cuenta los pedidos que no se han entregado | `CajaService::generar()`, `CajaService::previsualizar()` |
| `reporte()` | arma el reporte del cierre | `CajaService::generar()` |

## ¿Con qué se conecta?
- **Lo cargan:** `models/CajaService.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta
1. **Base de datos:** en el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.
2. **Tablas que toca:** REPORTE_CAJA, DETALLE_AUDITORIA, LIQUIDACION_DOMICILIARIO, PEDIDO, CLIENTE, DOMICILIARIO, INGREDIENTE, MOVIMIENTO_INVENTARIO.
3. **Quién lo usa:** `models/CajaService.php` (con `new Caja()`).
4. **Otros que usa:** ningún otro modelo.
5. **Sus métodos que otros pueden llamar:** `yaGeneradoHoy()`, `pedidosDelTurno()`, `consumoTeorico()`, `domiciliariosActivos()`, `stockActual()`, `pedidosActivosCount()`, `reporte()`.

```
React → /api/... → public/index.php → config/rutas.php → Controlador → Caja → MySQL
```

### Preguntas que te pueden hacer sobre este archivo

**¿Cómo se conecta `Caja` a la base de datos?**  
En el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.

**¿Con qué se conecta `Caja`?**  
Con la base de datos (tablas REPORTE_CAJA, DETALLE_AUDITORIA, LIQUIDACION_DOMICILIARIO, PEDIDO, CLIENTE, DOMICILIARIO, INGREDIENTE, MOVIMIENTO_INVENTARIO); con quien lo usa: `models/CajaService.php` (con `new Caja()`). Y con: ningún otro modelo.

**¿Dónde se crea la conexión que usa?**  
En `config/database.php` (`$conn = new mysqli(...)`). La carga `public/index.php` una sola vez.

**¿Qué diferencia hay entre `Caja` y `CajaService`?**  
`Caja` solo **lee** los datos (pedidos del turno, stock, domiciliarios). `CajaService` hace las cuentas y **guarda** el cierre.

**¿Un controlador usa `Caja` directo?**  
No. `CashClosingController` usa `CajaService`, y `CajaService` usa `Caja`.

**¿Qué pasa si se borra este archivo?**  
Los archivos que lo usan fallan con *"Failed opening required '...Caja.php'"* o *"Class 'Caja' not found"* (error 500).

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Caja (REPORTE_CAJA, LIQUIDACION_DOMICILIARIO y DETALLE_AUDITORIA). Solo consultas; los calculos del cierre estan en CajaService."* |
| 6 | `class Caja` | Crea la clase `Caja`: lee los datos que necesita el cierre de caja (tablas `REPORTE_CAJA`, `LIQUIDACION_DOMICILIARIO` y `DETALLE_AUDITORIA`). La usa `CajaService`. |
| 7 | `{` | Abre la clase `Caja`. |
| 8 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 10 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 11 | `{` | Abre la función `__construct()`. |
| 12 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 13 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 14 | `}` | Cierra la función `__construct()`. |
| 16 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"true si este admin ya genero un cierre en esa fecha."* |
| 17 | `public function yaGeneradoHoy($idAdmin, $fecha)` | Método `yaGeneradoHoy($idAdmin, $fecha)`: dice si este administrador ya hizo el cierre en esa fecha. |
| 18 | `{` | Abre la función `yaGeneradoHoy()`. |
| 19 | `$stmt = $this->conn->prepare("SELECT id_reporte FROM REPORTE_CAJA WHERE id_admin = ? AND fecha = ?");` | Prepara la consulta: "busca un reporte de este administrador en esa fecha". |
| 20 | `$stmt->bind_param("ss", $idAdmin, $fecha);` | Llena los `?` de la consulta, en orden: `$idAdmin` (texto), `$fecha` (texto). |
| 21 | `$stmt->execute();` | Ejecuta la consulta. |
| 22 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 23 | `$stmt->close();` | Cierra la consulta. |
| 24 | `return (bool) $row;` | Devuelve `true` si encontró uno (`(bool)` = convierte a sí/no). |
| 25 | `}` | Cierra la función `yaGeneradoHoy()`. |
| 27 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pedidos entregados que aun no pertenecen a ningun reporte (turno actual)."* |
| 28 | `public function pedidosDelTurno()` | Método `pedidosDelTurno()`: trae los pedidos entregados que todavía no están en ningún cierre (los del turno actual). |
| 29 | `{` | Abre la función `pedidosDelTurno()`. |
| 30 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "trae los pedidos (`p`) con el nombre del cliente (si no tiene cuenta, el nombre que dio por teléfono: `COALESCE` usa el primero que no esté vacío), que estén entregados y sin reporte (`id_reporte IS NULL`)". `LEFT JOIN` une con el cliente aunque no tenga cuenta. |
| 31 | `"SELECT p.*, COALESCE(c.nombre, p.nombre_contacto) AS cliente_nombre FROM PEDIDO p` | ↑ (sigue la misma instrucción) |
| 32 | `LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente` | ↑ (sigue la misma instrucción) |
| 33 | `WHERE p.estado = 'entregado' AND p.id_reporte IS NULL"` | ↑ (sigue la misma instrucción) |
| 34 | `);` | ↑ (sigue la misma instrucción) |
| 35 | `$stmt->execute();` | Ejecuta la consulta. |
| 36 | `$data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$data` (una lista). |
| 37 | `$stmt->close();` | Cierra la consulta. |
| 38 | `return $data;` | Devuelve la lista de pedidos. |
| 39 | `}` | Cierra la función `pedidosDelTurno()`. |
| 41 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Consumo real de insumos: suma de las salidas de inventario que genero cada pedido."* |
| 42 | `public function consumoTeorico($idsPedidos)` | Método `consumoTeorico($idsPedidos)`: calcula cuánto se gastó de cada insumo en esos pedidos. |
| 43 | `{` | Abre la función `consumoTeorico()`. |
| 44 | `if (empty($idsPedidos)) {` | Si no hay pedidos... |
| 45 | `return [];` | ...devuelve una lista vacía. |
| 46 | `}` | Cierra el `if`. |
| 48 | `$marcas = implode(',', array_fill(0, count($idsPedidos), '?'));` | Arma un `?` por cada pedido, separados por comas (ej. `?,?,?`). `array_fill` repite el `?`; `implode` los une. Lo guarda en `$marcas`. |
| 49 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "de los movimientos del inventario (`m`) unidos con su insumo (`i`), toma las salidas de esos pedidos (`IN (?,?,?)`) y suma (`SUM`) cuánto salió de cada insumo (`GROUP BY` = agrupa por insumo)". |
| 50 | `"SELECT i.id_ingrediente, i.nombre, i.unidad_medida, i.costo_unitario,` | ↑ (sigue la misma instrucción) |
| 51 | `SUM(m.cantidad) AS consumido` | ↑ (sigue la misma instrucción) |
| 52 | `FROM MOVIMIENTO_INVENTARIO m` | ↑ (sigue la misma instrucción) |
| 53 | `JOIN INGREDIENTE i ON i.id_ingrediente = m.id_ingrediente` | ↑ (sigue la misma instrucción) |
| 54 | `WHERE m.tipo_movimiento = 'salida' AND m.id_pedido IN ({$marcas})` | ↑ (sigue la misma instrucción) |
| 55 | `GROUP BY i.id_ingrediente, i.nombre, i.unidad_medida, i.costo_unitario"` | ↑ (sigue la misma instrucción) |
| 56 | `);` | ↑ (sigue la misma instrucción) |
| 57 | `$stmt->bind_param(str_repeat("i", count($idsPedidos)), ...$idsPedidos);` | Llena los `?` con los números de los pedidos. `str_repeat("i", ...)` repite la letra `i` (número entero) una vez por pedido; `...` pasa cada número por separado. |
| 58 | `$stmt->execute();` | Ejecuta la consulta. |
| 59 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 60 | `$stmt->close();` | Cierra la consulta. |
| 62 | `$resultado = [];` | Empieza `$resultado` vacía. |
| 63 | `foreach ($rows as $row) {` | Recorre cada insumo. |
| 64 | `$resultado[$row['id_ingrediente']] = [` | Lo guarda en `$resultado` usando su número como clave, con: |
| 65 | `'nombre'        => $row['nombre'],` | su nombre, |
| 66 | `'consumido'     => (float) $row['consumido'],` | cuánto se gastó, |
| 67 | `'unidad'        => $row['unidad_medida'],` | su unidad, |
| 68 | `'costoUnitario' => (float) $row['costo_unitario'],` | y lo que cuesta una unidad. |
| 69 | `];` | Cierra los datos del insumo. |
| 70 | `}` | Cierra el `foreach`. |
| 71 | `return $resultado;` | Devuelve el resultado. |
| 72 | `}` | Cierra la función `consumoTeorico()`. |
| 74 | `public function domiciliariosActivos()` | Método `domiciliariosActivos()`: trae los domiciliarios activos (para pagarles en el cierre). |
| 75 | `{` | Abre la función `domiciliariosActivos()`. |
| 76 | `$stmt = $this->conn->prepare("SELECT id_domiciliario, nombre, base_efectivo_asignada FROM DOMICILIARIO WHERE activo = 1");` | Prepara la consulta: "trae el número, el nombre y el dinero base de los domiciliarios activos". |
| 77 | `$stmt->execute();` | Ejecuta la consulta. |
| 78 | `$data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$data` (una lista). |
| 79 | `$stmt->close();` | Cierra la consulta. |
| 80 | `return $data;` | Devuelve la lista. |
| 81 | `}` | Cierra la función `domiciliariosActivos()`. |
| 83 | `public function stockActual($idIngrediente)` | Método `stockActual($idIngrediente)`: dice cuánto hay de un insumo ahora. |
| 84 | `{` | Abre la función `stockActual()`. |
| 85 | `$stmt = $this->conn->prepare("SELECT cantidad_stock FROM INGREDIENTE WHERE id_ingrediente = ?");` | Prepara la consulta: "trae la cantidad en stock de ese insumo". |
| 86 | `$stmt->bind_param("i", $idIngrediente);` | Llena los `?` de la consulta, en orden: `$idIngrediente` (número entero). |
| 87 | `$stmt->execute();` | Ejecuta la consulta. |
| 88 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 89 | `$stmt->close();` | Cierra la consulta. |
| 90 | `return (float) $row['cantidad_stock'];` | Devuelve la cantidad como número con decimales. |
| 91 | `}` | Cierra la función `stockActual()`. |
| 93 | `public function pedidosActivosCount()` | Método `pedidosActivosCount()`: cuenta los pedidos que no se han entregado ni cancelado (no se puede cerrar la caja si hay pedidos en curso). |
| 94 | `{` | Abre la función `pedidosActivosCount()`. |
| 95 | `$stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM PEDIDO WHERE estado NOT IN ('entregado', 'cancelado')");` | Prepara la consulta: "cuenta los pedidos cuyo estado no sea entregado ni cancelado (`NOT IN`)". |
| 96 | `$stmt->execute();` | Ejecuta la consulta. |
| 97 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 98 | `$stmt->close();` | Cierra la consulta. |
| 99 | `return (int) $row['total'];` | Devuelve el total. |
| 100 | `}` | Cierra la función `pedidosActivosCount()`. |
| 102 | `public function reporte($idReporte)` | Método `reporte($idReporte)`: arma el reporte completo de un cierre (para el PDF). Lo usa `CajaService::generar()`. |
| 103 | `{` | Abre la función `reporte()`. |
| 104 | `$stmt = $this->conn->prepare("SELECT * FROM REPORTE_CAJA WHERE id_reporte = ?");` | Prepara la consulta: "trae el reporte con ese número". |
| 105 | `$stmt->bind_param("s", $idReporte);` | Llena los `?` de la consulta, en orden: `$idReporte` (texto). |
| 106 | `$stmt->execute();` | Ejecuta la consulta. |
| 107 | `$reporte = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$reporte`. |
| 108 | `$stmt->close();` | Cierra la consulta. |
| 110 | `$stmtL = $this->conn->prepare(` | Prepara la consulta: "trae lo que se le pagó a cada domiciliario en ese cierre, con su nombre". |
| 111 | `"SELECT l.*, d.nombre AS driver_nombre FROM LIQUIDACION_DOMICILIARIO l` | ↑ (sigue la misma instrucción) |
| 112 | `JOIN DOMICILIARIO d ON d.id_domiciliario = l.id_domiciliario` | ↑ (sigue la misma instrucción) |
| 113 | `WHERE l.id_reporte = ?"` | ↑ (sigue la misma instrucción) |
| 114 | `);` | ↑ (sigue la misma instrucción) |
| 115 | `$stmtL->bind_param("s", $idReporte);` | Llena los `?` de la consulta, en orden: `$idReporte` (texto). |
| 116 | `$stmtL->execute();` | Ejecuta la consulta. |
| 117 | `$liquidaciones = $stmtL->get_result()->fetch_all(MYSQLI_ASSOC);` | Lo guarda en `$liquidaciones`. |
| 118 | `$stmtL->close();` | Cierra la consulta. |
| 120 | `$stmtA = $this->conn->prepare("SELECT nombre, stock_teorico, stock_real FROM DETALLE_AUDITORIA WHERE id_reporte = ?");` | Prepara la consulta: "trae los insumos del cierre: cuánto debía haber y cuánto había de verdad". |
| 121 | `$stmtA->bind_param("s", $idReporte);` | Llena los `?` de la consulta, en orden: `$idReporte` (texto). |
| 122 | `$stmtA->execute();` | Ejecuta la consulta. |
| 123 | `$auditoria = $stmtA->get_result()->fetch_all(MYSQLI_ASSOC);` | Lo guarda en `$auditoria`. |
| 124 | `$stmtA->close();` | Cierra la consulta. |
| 126 | `$stmtP = $this->conn->prepare(` | Prepara la consulta: "trae los pedidos de ese cierre: número, total, forma de pago y nombre del cliente". |
| 127 | `"SELECT p.id_pedido, p.total, p.metodo_pago, COALESCE(c.nombre, p.nombre_contacto) AS cliente` | ↑ (sigue la misma instrucción) |
| 128 | `FROM PEDIDO p LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente` | ↑ (sigue la misma instrucción) |
| 129 | `WHERE p.id_reporte = ?"` | ↑ (sigue la misma instrucción) |
| 130 | `);` | ↑ (sigue la misma instrucción) |
| 131 | `$stmtP->bind_param("s", $idReporte);` | Llena los `?` de la consulta, en orden: `$idReporte` (texto). |
| 132 | `$stmtP->execute();` | Ejecuta la consulta. |
| 133 | `$pedidos = $stmtP->get_result()->fetch_all(MYSQLI_ASSOC);` | Lo guarda en `$pedidos`. |
| 134 | `$stmtP->close();` | Cierra la consulta. |
| 136 | `$liquidacionesJson = [];` | Empieza `$liquidacionesJson` vacía. |
| 137 | `foreach ($liquidaciones as $l) {` | Recorre lo de cada domiciliario (`$l`). |
| 138 | `$stmtC = $this->conn->prepare(` | Prepara la consulta: "cuenta los pedidos en efectivo de ese domiciliario en ese cierre". |
| 139 | `"SELECT COUNT(*) AS total FROM PEDIDO WHERE id_reporte = ? AND id_domiciliario = ? AND metodo_pago = 'efectivo'"` | ↑ (sigue la misma instrucción) |
| 140 | `);` | ↑ (sigue la misma instrucción) |
| 141 | `$stmtC->bind_param("si", $idReporte, $l['id_domiciliario']);` | Llena los `?` de la consulta, en orden: `$idReporte` (texto), `$l['id_domiciliario']` (número entero). |
| 142 | `$stmtC->execute();` | Ejecuta la consulta. |
| 143 | `$conteo = $stmtC->get_result()->fetch_assoc();` | Lo guarda en `$conteo`. |
| 144 | `$stmtC->close();` | Cierra la consulta. |
| 146 | `$liquidacionesJson[] = [` | Agrega a la lista, con los nombres que usa React: |
| 147 | `'driverName'    => $l['driver_nombre'],` | el nombre del domiciliario, |
| 148 | `'ordersCount'   => (int) $conteo['total'],` | cuántos pedidos en efectivo llevó, |
| 149 | `'baseCash'      => (float) $l['base_asignada'],` | el dinero base que se le dio, |
| 150 | `'cashCollected' => (float) $l['efectivo_recolectado'],` | el efectivo que cobró, |
| 151 | `'totalDue'      => (float) $l['efectivo_liquidado'],` | y el total que debe entregar. |
| 152 | `];` | Cierra los datos del domiciliario. |
| 153 | `}` | Cierra el `foreach`. |
| 155 | `$insumos = [];` | Empieza `$insumos` vacía. |
| 156 | `foreach ($auditoria as $a) {` | Recorre los insumos de la auditoría. |
| 157 | `$insumos[] = ['name' => $a['nombre'], 'used' => (float) $a['stock_teorico'], 'stockReal' => (float) $a['stock_real']];` | Agrega cada uno con su nombre, lo que se gastó y lo que había de verdad. |
| 158 | `}` | Cierra el `foreach`. |
| 160 | `$ordenes = [];` | Empieza `$ordenes` vacía. |
| 161 | `foreach ($pedidos as $o) {` | Recorre los pedidos. |
| 162 | `$ordenes[] = [` | Agrega cada uno con: |
| 163 | `'id'            => '#ORD-' . $o['id_pedido'],` | su código (`#ORD-` + número), |
| 164 | `'client'        => $o['cliente'],` | el cliente, |
| 165 | `'total'         => (float) $o['total'],` | el total, |
| 166 | `'paymentMethod' => $o['metodo_pago'] === 'efectivo' ? 'cash' : 'online',` | y la forma de pago (`'cash'` si fue efectivo; si no, `'online'`). |
| 167 | `];` | Cierra los datos del pedido. |
| 168 | `}` | Cierra el `foreach`. |
| 170 | `return [` | Devuelve el reporte completo: |
| 171 | `'date'               => $reporte['fecha'],` | la fecha, |
| 172 | `'totalVentas'        => (float) $reporte['total_ventas'],` | el total vendido, |
| 173 | `'totalOrdenes'       => count($pedidos),` | cuántos pedidos (`count` = cuántos hay en la lista), |
| 174 | `'desglose'           => [` | lo vendido separado en: |
| 175 | `'efectivo' => (float) $reporte['total_efectivo'],` | efectivo |
| 176 | `'digital'  => (float) $reporte['total_digital'],` | y digital. |
| 177 | `],` | Cierra el desglose. |
| 178 | `'driverLiquidations' => $liquidacionesJson,` | lo de cada domiciliario, |
| 179 | `'insumosConsumidos'  => $insumos,` | los insumos usados, |
| 180 | `'orders'             => $ordenes,` | y los pedidos. |
| 181 | `];` | Cierra la lista. |
| 182 | `}` | Cierra la función `reporte()`. |
| 183 | `}` | Cierra la clase `Caja`. |
| 184 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Failed to open stream` |
| el método `yaGeneradoHoy()` | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Call to undefined method Caja::yaGeneradoHoy()` |
| el método `pedidosDelTurno()` | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Call to undefined method Caja::pedidosDelTurno()` |
| el método `consumoTeorico()` | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Call to undefined method Caja::consumoTeorico()` |
| el método `domiciliariosActivos()` | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Call to undefined method Caja::domiciliariosActivos()` |
| el método `stockActual()` | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Call to undefined method Caja::stockActual()` |
| el método `pedidosActivosCount()` | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Call to undefined method Caja::pedidosActivosCount()` |
| el método `reporte()` | confirmar el cierre de caja | `Call to undefined method Caja::reporte()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
