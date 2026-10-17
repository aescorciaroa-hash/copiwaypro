# models/CajaService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Calcula y guarda el cierre de caja.

## ¿Qué hace?
- calcula el cierre sin guardarlo
- guarda el cierre del día

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `previsualizar()` | calcula el cierre sin guardarlo | `CashClosingController::preview()` |
| `calcularTotales()` (privado) | suma efectivo y digital | `CajaService::generar()`, `CajaService::previsualizar()` |
| `generar()` | guarda el cierre del día | `CashClosingController::store()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/CashClosingController.php`.
- **Usa:** `Caja`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Servicio de Cierre de Caja: calcula el cierre del dia (efectivo vs digital, consumo de insumos), archiva los pedidos del turno y liquida a cada domiciliario."* |
| 6 | `require_once __DIR__ . '/Caja.php';` | Trae `models/Caja.php` (las consultas del cierre). |
| 8 | `class CajaService` | Crea la clase `CajaService`: calcula y guarda el cierre de caja del día. La usa `CashClosingController`. |
| 9 | `{` | Abre la clase `CajaService`. |
| 10 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 11 | `private $cajaModel;` | Cajita `$cajaModel` de la clase: aquí se guarda el modelo `Caja`. |
| 13 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 14 | `{` | Abre la función `__construct()`. |
| 15 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 16 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 17 | `$this->cajaModel = new Caja();` | Crea el modelo `Caja` y lo guarda en `$this->cajaModel`, para usarlo en las funciones de abajo. |
| 18 | `}` | Cierra la función `__construct()`. |
| 20 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Vista previa del cierre: el mismo calculo que generar() pero sin guardar nada."* |
| 21 | `public function previsualizar($idAdmin)` | Método `previsualizar($idAdmin)`: calcula el cierre **sin guardar nada** (la vista previa). Lo usa `CashClosingController::preview()`. |
| 22 | `{` | Abre la función `previsualizar()`. |
| 23 | `$hoy = date('Y-m-d');` | Guarda en `$hoy` la fecha de hoy (`date('Y-m-d')`, ej. `2026-10-17`). |
| 25 | `if ($this->cajaModel->yaGeneradoHoy($idAdmin, $hoy)) {` | Si este administrador ya hizo el cierre hoy (`yaGeneradoHoy()` de `models/Caja.php`)... |
| 26 | `throw new Exception('Ya se generó un cierre de caja hoy para este administrador.');` | ...lanza el error "Ya se generó un cierre de caja hoy para este administrador.". |
| 27 | `}` | Cierra el `if`. |
| 29 | `$pedidos = $this->cajaModel->pedidosDelTurno();` | Trae los pedidos del turno (`pedidosDelTurno()`). |
| 30 | `$totales = $this->calcularTotales($pedidos);` | Calcula los totales (`calcularTotales()` de abajo). |
| 32 | `$liquidaciones = [];` | `$liquidaciones` empieza vacía: lo que se le paga a cada domiciliario. |
| 33 | `foreach ($this->cajaModel->domiciliariosActivos() as $domiciliario) {` | Recorre los domiciliarios activos (`domiciliariosActivos()`). |
| 34 | `$recolectado = $totales['efectivoPorDomiciliario'][$domiciliario['id_domiciliario']] ?? 0;` | Guarda en `$recolectado` el efectivo que cobró este domiciliario (si no cobró nada, 0). |
| 35 | `if ($recolectado <= 0) {` | Si no cobró nada... |
| 36 | `continue;` | ...lo salta. |
| 37 | `}` | Cierra el `if`. |
| 38 | `$cantidad = 0;` | `$cantidad` empieza en 0: cuántos pedidos en efectivo llevó. |
| 39 | `foreach ($pedidos as $pedido) {` | Recorre los pedidos. |
| 40 | `if ($pedido['id_domiciliario'] === $domiciliario['id_domiciliario'] && $pedido['metodo_pago'] === 'efectivo') {` | Si el pedido es de este domiciliario y se pagó en efectivo... |
| 41 | `$cantidad++;` | ...suma 1 (`++`). |
| 42 | `}` | Cierra el `if`. |
| 43 | `}` | Cierra el `foreach`. |
| 44 | `$liquidaciones[] = [` | Agrega la liquidación con: |
| 45 | `'driverName'    => $domiciliario['nombre'],` | el nombre del domiciliario, |
| 46 | `'ordersCount'   => $cantidad,` | cuántos pedidos en efectivo llevó, |
| 47 | `'baseCash'      => (float) $domiciliario['base_efectivo_asignada'],` | el dinero base que se le dio, |
| 48 | `'cashCollected' => $recolectado,` | el efectivo que cobró, |
| 49 | `'totalDue'      => (float) $domiciliario['base_efectivo_asignada'] + $recolectado,` | y lo que debe entregar (base + cobrado). |
| 50 | `];` | Cierra los datos. |
| 51 | `}` | Cierra el `foreach`. |
| 53 | `$insumos = [];` | `$insumos` empieza vacía. |
| 54 | `$costoInsumos = 0.0;` | `$costoInsumos` empieza en 0: cuánto costaron los insumos usados. |
| 55 | `foreach ($this->cajaModel->consumoTeorico(array_column($pedidos, 'id_pedido')) as $idIngrediente => $datos) {` | Recorre los insumos que se gastaron en los pedidos (`consumoTeorico()` de `models/Caja.php`). `array_column(..., 'id_pedido')` saca solo los números de los pedidos. |
| 56 | `$costo = $datos['consumido'] * $datos['costoUnitario'];` | Calcula el costo de ese insumo (cantidad × costo de una unidad). |
| 57 | `$costoInsumos += $costo;` | Lo suma al costo total. |
| 58 | `$insumos[] = [` | Agrega el insumo con: |
| 59 | `'name'      => $datos['nombre'],` | su nombre, |
| 60 | `'used'      => $datos['consumido'],` | cuánto se usó, |
| 61 | `'unit'      => $datos['unidad'],` | su unidad, |
| 62 | `'unitCost'  => $datos['costoUnitario'],` | el costo de una unidad, |
| 63 | `'cost'      => round($costo, 2),` | el costo (redondeado a 2 decimales), |
| 64 | `'stockReal' => $this->cajaModel->stockActual($idIngrediente),` | y cuánto hay ahora (`stockActual()`). |
| 65 | `];` | Cierra los datos. |
| 66 | `}` | Cierra el `foreach`. |
| 68 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Lo cobrado por domicilio cubre el reparto, no es ganancia: se resta de las ventas."* |
| 69 | `$costoDomicilios = $totales['totalDomicilios'];` | Guarda en `$costoDomicilios` lo que se cobró por domicilios. |
| 70 | `$ventasProducto = $totales['totalVentas'] - $costoDomicilios;` | Las ventas de productos = total vendido − domicilios (los domicilios no son ganancia: pagan el reparto). |
| 71 | `$ganancia = $ventasProducto - $costoInsumos;` | La ganancia = ventas de productos − costo de los insumos. |
| 73 | `$ordenes = [];` | `$ordenes` empieza vacía. |
| 74 | `foreach ($pedidos as $o) {` | Recorre los pedidos. |
| 75 | `$ordenes[] = [` | Agrega cada uno con: |
| 76 | `'id'            => '#ORD-' . $o['id_pedido'],` | su código, |
| 77 | `'client'        => $o['cliente_nombre'] ?? null,` | el cliente, |
| 78 | `'total'         => (float) $o['total'],` | el total, |
| 79 | `'paymentMethod' => $o['metodo_pago'] === 'efectivo' ? 'cash' : 'online',` | y la forma de pago. |
| 80 | `];` | Cierra los datos. |
| 81 | `}` | Cierra el `foreach`. |
| 83 | `return [` | Devuelve el cierre completo: |
| 84 | `'date'               => $hoy,` | la fecha, |
| 85 | `'totalVentas'        => $totales['totalVentas'],` | el total vendido, |
| 86 | `'totalOrdenes'       => count($pedidos),` | cuántos pedidos, |
| 87 | `'desglose'           => ['efectivo' => $totales['totalEfectivo'], 'digital' => $totales['totalDigital']],` | lo vendido en efectivo y en digital, |
| 88 | `'driverLiquidations' => $liquidaciones,` | lo de cada domiciliario, |
| 89 | `'insumosConsumidos'  => $insumos,` | los insumos usados, |
| 90 | `'costoInsumos'       => round($costoInsumos, 2),` | el costo de los insumos, |
| 91 | `'costoDomicilios'    => round($costoDomicilios, 2),` | lo cobrado por domicilios, |
| 92 | `'ventasProducto'     => round($ventasProducto, 2),` | las ventas de productos, |
| 93 | `'gananciaBruta'      => round($ganancia, 2),` | la ganancia, |
| 94 | `'margen'             => $ventasProducto > 0 ? round($ganancia / $ventasProducto * 100, 1) : 0,` | el margen en porcentaje (si hubo ventas: ganancia ÷ ventas × 100; si no, 0), |
| 95 | `'orders'             => $ordenes,` | los pedidos, |
| 96 | `'activeOrdersCount'  => $this->cajaModel->pedidosActivosCount(),` | y cuántos pedidos siguen sin entregar. |
| 97 | `];` | Cierra la lista. |
| 98 | `}` | Cierra la función `previsualizar()`. |
| 100 | `private function calcularTotales($pedidos)` | Método `calcularTotales($pedidos)` (privado): suma el total vendido, los domicilios, el efectivo, lo digital y el efectivo de cada domiciliario. |
| 101 | `{` | Abre la función `calcularTotales()`. |
| 102 | `$totalVentas = 0.0;` | Total vendido, empieza en 0. |
| 103 | `$totalDomicilios = 0.0;` | Total de domicilios, empieza en 0. |
| 104 | `$totalEfectivo = 0.0;` | Total en efectivo, empieza en 0. |
| 105 | `$totalDigital = 0.0;` | Total digital, empieza en 0. |
| 106 | `$efectivoPorDomiciliario = [];` | Efectivo de cada domiciliario, lista vacía. |
| 108 | `foreach ($pedidos as $pedido) {` | Recorre los pedidos. |
| 109 | `$total = (float) $pedido['total'];` | Guarda el total del pedido. |
| 110 | `$totalVentas += $total;` | Lo suma al total vendido. |
| 111 | `$totalDomicilios += (float) $pedido['costo_domicilio'];` | Suma el costo del domicilio. |
| 113 | `if ($pedido['metodo_pago'] === 'efectivo') {` | Si se pagó en efectivo... |
| 114 | `$totalEfectivo += $total;` | ...lo suma al efectivo. |
| 115 | `$idDom = $pedido['id_domiciliario'];` | Guarda el número del domiciliario. |
| 116 | `if ($idDom) {` | Si tiene domiciliario... |
| 117 | `$efectivoPorDomiciliario[$idDom] = ($efectivoPorDomiciliario[$idDom] ?? 0) + $total;` | ...le suma ese total a su efectivo (si no tenía nada, empieza en 0). |
| 118 | `}` | Cierra el `if`. |
| 119 | `} else {` | Si se pagó en digital... |
| 120 | `$totalDigital += $total;` | ...lo suma a lo digital. |
| 121 | `}` | Cierra el `else`. |
| 122 | `}` | Cierra el `foreach`. |
| 124 | `return [` | Devuelve todos los totales. |
| 125 | `'totalVentas'             => $totalVentas,` | el total vendido, |
| 126 | `'totalDomicilios'         => $totalDomicilios,` | los domicilios, |
| 127 | `'totalEfectivo'           => $totalEfectivo,` | el efectivo, |
| 128 | `'totalDigital'            => $totalDigital,` | lo digital, |
| 129 | `'efectivoPorDomiciliario' => $efectivoPorDomiciliario,` | y el efectivo de cada domiciliario. |
| 130 | `];` | Cierra la lista. |
| 131 | `}` | Cierra la función `calcularTotales()`. |
| 133-136 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Genera y guarda el cierre del dia. Solo toma pedidos entregados que aun no pertenecen a ningun reporte, asi un cierre nunca se repite."* |
| 137 | `public function generar($idAdmin)` | Método `generar($idAdmin)`: **guarda** el cierre de caja. Lo usa `CashClosingController::store()`. |
| 138 | `{` | Abre la función `generar()`. |
| 139 | `$hoy = date('Y-m-d');` | Guarda la fecha de hoy. |
| 141 | `$this->conn->begin_transaction();` | Empieza una transacción: todo se guarda junto, o nada. |
| 142 | `try {` | Intenta... |
| 143 | `if ($this->cajaModel->yaGeneradoHoy($idAdmin, $hoy)) {` | ...si ya se hizo el cierre hoy... |
| 144 | `throw new Exception('Ya se generó un cierre de caja hoy para este administrador.');` | ...lanza el error. |
| 145 | `}` | Cierra el `if`. |
| 147 | `$pedidos = $this->cajaModel->pedidosDelTurno();` | Trae los pedidos del turno. |
| 148 | `$totales = $this->calcularTotales($pedidos);` | Calcula los totales. |
| 150 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda el reporte en `REPORTE_CAJA` con el administrador, la fecha y los totales". |
| 151 | `"INSERT INTO REPORTE_CAJA (id_admin, fecha, total_ventas, total_efectivo, total_digital)` | ↑ (sigue la misma instrucción) |
| 152 | `VALUES (?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 153 | `);` | ↑ (sigue la misma instrucción) |
| 154 | `$stmt->bind_param("ssddd", $idAdmin, $hoy, $totales['totalVentas'], $totales['totalEfectivo'], $totales['totalDigital']);` | Llena los `?` de la consulta, en orden: `$idAdmin` (texto), `$hoy` (texto), `$totales['totalVentas']` (número con decimales), `$totales['totalEfectivo']` (número con decimales), `$totales['totalDigital']` (número con decimales). |
| 155 | `$stmt->execute();` | Ejecuta la consulta. |
| 156 | `$stmt->close();` | Cierra la consulta. |
| 157 | `$idReporte = $this->conn->insert_id;` | Guarda en `$idReporte` el número del reporte nuevo. |
| 159 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Archiva los pedidos del turno (no se borran)."* |
| 160 | `foreach ($pedidos as $pedido) {` | Recorre los pedidos del turno. |
| 161 | `$stmtU = $this->conn->prepare("UPDATE PEDIDO SET id_reporte = ? WHERE id_pedido = ?");` | Prepara la consulta: "ponle a este pedido el número del reporte" (así queda archivado en este cierre; no se borra). |
| 162 | `$stmtU->bind_param("ii", $idReporte, $pedido['id_pedido']);` | Llena los `?` de la consulta, en orden: `$idReporte` (número entero), `$pedido['id_pedido']` (número entero). |
| 163 | `$stmtU->execute();` | Ejecuta la consulta. |
| 164 | `$stmtU->close();` | Cierra la consulta. |
| 165 | `}` | Cierra el `foreach`. |
| 167 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Liquidacion por domiciliario: base asignada + efectivo recolectado."* |
| 168 | `foreach ($this->cajaModel->domiciliariosActivos() as $domiciliario) {` | Recorre los domiciliarios activos. |
| 169 | `$recolectado = $totales['efectivoPorDomiciliario'][$domiciliario['id_domiciliario']] ?? 0;` | Guarda el efectivo que cobró. |
| 170 | `if ($recolectado <= 0) {` | Si no cobró nada... |
| 171 | `continue;` | ...lo salta. |
| 172 | `}` | Cierra el `if`. |
| 173 | `$base = $domiciliario['base_efectivo_asignada'];` | Guarda su dinero base. |
| 174 | `$liquidado = (float) $base + $recolectado;` | Lo que debe entregar = base + cobrado. |
| 175 | `$stmtL = $this->conn->prepare(` | Prepara la consulta: "guarda en `LIQUIDACION_DOMICILIARIO` lo de este domiciliario". |
| 176 | `"INSERT INTO LIQUIDACION_DOMICILIARIO` | ↑ (sigue la misma instrucción) |
| 177 | `(id_reporte, id_domiciliario, base_asignada, efectivo_recolectado, efectivo_liquidado)` | ↑ (sigue la misma instrucción) |
| 178 | `VALUES (?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 179 | `);` | ↑ (sigue la misma instrucción) |
| 180 | `$stmtL->bind_param("iisdd", $idReporte, $domiciliario['id_domiciliario'], $base, $recolectado, $liquidado);` | Llena los `?` de la consulta, en orden: `$idReporte` (número entero), `$domiciliario['id_domiciliario']` (número entero), `$base` (texto), `$recolectado` (número con decimales), `$liquidado` (número con decimales). |
| 181 | `$stmtL->execute();` | Ejecuta la consulta. |
| 182 | `$stmtL->close();` | Cierra la consulta. |
| 183 | `}` | Cierra el `foreach`. |
| 185 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Auditoria: consumo teorico de insumos vs stock real."* |
| 186 | `foreach ($this->cajaModel->consumoTeorico(array_column($pedidos, 'id_pedido')) as $idIngrediente => $datos) {` | Recorre los insumos gastados. |
| 187 | `$stockReal = $this->cajaModel->stockActual($idIngrediente);` | Guarda cuánto hay ahora de ese insumo. |
| 188 | `$stmtA = $this->conn->prepare(` | Prepara la consulta: "guarda en `DETALLE_AUDITORIA` el insumo, cuánto se gastó y cuánto hay de verdad". |
| 189 | `"INSERT INTO DETALLE_AUDITORIA (id_reporte, id_ingrediente, nombre, stock_teorico, stock_real)` | ↑ (sigue la misma instrucción) |
| 190 | `VALUES (?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 191 | `);` | ↑ (sigue la misma instrucción) |
| 192 | `$stmtA->bind_param("iisdd", $idReporte, $idIngrediente, $datos['nombre'], $datos['consumido'], $stockReal);` | Llena los `?` de la consulta, en orden: `$idReporte` (número entero), `$idIngrediente` (número entero), `$datos['nombre']` (texto), `$datos['consumido']` (número con decimales), `$stockReal` (número con decimales). |
| 193 | `$stmtA->execute();` | Ejecuta la consulta. |
| 194 | `$stmtA->close();` | Cierra la consulta. |
| 195 | `}` | Cierra el `foreach`. |
| 197 | `$pedidosActivos = $this->cajaModel->pedidosActivosCount();` | Cuenta los pedidos que siguen sin entregar. |
| 199 | `$this->conn->commit();` | Confirma la transacción. |
| 201 | `return array_merge($this->cajaModel->reporte($idReporte), ['activeOrdersCount' => $pedidosActivos]);` | Arma el reporte completo (`reporte()` de `models/Caja.php`), le agrega los pedidos sin entregar (`array_merge` une dos listas) y lo devuelve. |
| 202 | `} catch (Exception $e) {` | Si algo falló... |
| 203 | `$this->conn->rollback();` | ...deshace todo. |
| 204 | `throw $e;` | ...y lanza el error. |
| 205 | `}` | Cierra el `catch`. |
| 206 | `}` | Cierra la función `generar()`. |
| 207 | `}` | Cierra la clase `CajaService`. |
| 208 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Failed to open stream` |
| el método `previsualizar()` | ver el cierre de caja antes de confirmarlo | `Call to undefined method CajaService::previsualizar()` |
| el método `calcularTotales()` | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Call to undefined method CajaService::calcularTotales()` |
| el método `generar()` | confirmar el cierre de caja | `Call to undefined method CajaService::generar()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
