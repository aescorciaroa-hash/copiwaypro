# models/PedidoService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Tiene las reglas de los pedidos: crearlos, cambiar su estado y entregarlos.

## ¿Qué hace?
- crea el pedido del cliente
- crea el pedido por llamada o WhatsApp
- calcula el total antes de pagar
- pasa el pedido a "En preparación"
- pasa el pedido a "Listo"
- el domiciliario toma el pedido
- suelta el pedido para que lo tome otro
- pasa el pedido a "En camino"
- entrega el pedido con el PIN
- cambia la dirección del pedido
- guarda el destino en el mapa
- guarda la calificación del pedido

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `crear()` | crea el pedido del cliente | `OrderController::store()` |
| `crearManual()` | crea el pedido por llamada o WhatsApp | `OrderController::storeManual()` |
| `guardar()` (privado) | guarda el pedido y descuenta el inventario | `PedidoService::crear()`, `PedidoService::crearManual()` |
| `buscarCliente()` (privado) | busca al cliente del pedido | `PedidoService::cotizar()`, `PedidoService::crear()` |
| `buscarClientePorTelefono()` (privado) | busca un cliente por su celular | `PedidoService::crearManual()` |
| `calcular()` (privado) | calcula precios, descuentos y total | `PedidoService::cotizar()`, `PedidoService::crear()`, `PedidoService::crearManual()` |
| `sumarPrecios()` (privado) | suma el precio de los ingredientes extra | `PedidoService::calcular()` |
| `cotizar()` | calcula el total antes de pagar | `PaymentController::prepare()` |
| `productoPersonalizadoOculto()` (privado) | producto base para las hamburguesas armadas | `PedidoService::calcular()` |
| `resolverIngredientes()` (privado) | busca los ingredientes y su precio | `PedidoService::calcular()` |
| `descuentoCumpleanos()` (privado) | da 15% de descuento en el cumpleaños | `PedidoService::calcular()` |
| `marcarPreparando()` | pasa el pedido a "En preparación" | `OrderController::markPreparing()` |
| `marcarListo()` | pasa el pedido a "Listo" | `OrderController::markReady()` |
| `registrarAyudante()` (privado) | guarda quién preparó el pedido | `PedidoService::marcarListo()`, `PedidoService::marcarPreparando()` |
| `bloquearPedido()` (privado) | bloquea el pedido mientras se cambia | `PedidoService::aceptarEntrega()`, `PedidoService::liberarPedido()`, `PedidoService::tomarPedido()` |
| `tomarPedido()` | el domiciliario toma el pedido | `OrderController::take()` |
| `liberarPedido()` | suelta el pedido para que lo tome otro | `OrderController::release()` |
| `aceptarEntrega()` | pasa el pedido a "En camino" | `OrderController::accept()` |
| `confirmarEntrega()` | entrega el pedido con el PIN | `OrderController::deliver()` |
| `cambiarDireccion()` | cambia la dirección del pedido | `OrderController::updateAddress()` |
| `guardarDestino()` | guarda el destino en el mapa | `OrderController::updateDestination()` |
| `transicion()` (privado) | cambia el estado del pedido | `PedidoService::marcarListo()`, `PedidoService::marcarPreparando()` |
| `calificar()` | guarda la calificación del pedido | `OrderController::review()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/OrderController.php`, `controllers/PaymentController.php`.
- **Usa:** `Pedido`, `Configuracion`, `Ingrediente`, `PagoService`, `PushNotificationService`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Servicio de Pedidos: reglas del ciclo de vida del pedido (checkout, cambios de estado, entrega con PIN y resena)."* |
| 6 | `require_once __DIR__ . '/Pedido.php';` | Trae `models/Pedido.php` (leer pedidos). |
| 7 | `require_once __DIR__ . '/Configuracion.php';` | Trae `models/Configuracion.php` (horario, tarifa, puntos). |
| 8 | `require_once __DIR__ . '/Ingrediente.php';` | Trae `models/Ingrediente.php` (descontar inventario). |
| 9 | `require_once __DIR__ . '/PagoService.php';` | Trae `models/PagoService.php` (revisar el pago). |
| 10 | `require_once __DIR__ . '/PushNotificationService.php';` | Trae `models/PushNotificationService.php` (avisar que el pedido llegó). |
| 12 | `class PedidoService` | Crea la clase `PedidoService`: tiene **las reglas de los pedidos**: crearlos, cambiarles el estado, entregarlos con PIN y calificarlos. La usan `OrderController` y `PaymentController`. |
| 13 | `{` | Abre la clase `PedidoService`. |
| 14 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 15 | `private $pedidoModel;` | Cajita `$pedidoModel` de la clase: aquí se guarda el modelo `Pedido`. |
| 17 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 18 | `{` | Abre la función `__construct()`. |
| 19 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 20 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 21 | `$this->pedidoModel = new Pedido();` | Crea el modelo `Pedido` y lo guarda en `$this->pedidoModel`, para usarlo en las funciones de abajo. |
| 22 | `}` | Cierra la función `__construct()`. |
| 24 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 25 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Creacion (checkout)"* |
| 26 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 28-31 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea un pedido web del cliente. Recalcula precios en el servidor, valida horario y pago, y en una transaccion guarda el pedido y descuenta el inventario."* |
| 32 | `public function crear($idCliente, $payload)` | Método `crear($idCliente, $payload)`: crea el pedido que hace el cliente desde la página. `$payload` = lo que mandó la pantalla. Lo usa `OrderController::store()`. |
| 33 | `{` | Abre la función `crear()`. |
| 34 | `$configModel = new Configuracion();` | Crea el modelo `Configuracion`. |
| 35 | `if (!$configModel->tiendaAbiertaAhora()) {` | Si la tienda no está abierta ahora (`tiendaAbiertaAhora()`)... |
| 36 | `throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden procesar pagos.');` | ...lanza el error "La tienda está cerrada o pausada en este momento...". |
| 37 | `}` | Cierra el `if`. |
| 39 | `if (empty($payload['items'])) {` | Si el pedido no tiene productos... |
| 40 | `throw new InvalidArgumentException('El pedido no tiene ítems.');` | ...lanza el error "El pedido no tiene ítems." (`InvalidArgumentException` = error por datos mal enviados). |
| 41 | `}` | Cierra el `if`. |
| 43 | `$cliente = $this->buscarCliente($idCliente);` | Busca al cliente (`buscarCliente()` de abajo). |
| 44 | `if (!$cliente) {` | Si no existe... |
| 45 | `throw new InvalidArgumentException('Cliente no encontrado.');` | ...lanza el error "Cliente no encontrado.". |
| 46 | `}` | Cierra el `if`. |
| 48 | `$calculo = $this->calcular($cliente, $payload, $configModel, !empty($payload['usePoints']));` | Calcula precios, descuentos y total en el servidor (`calcular()` de abajo). El último dato dice si quiere usar sus puntos. |
| 49 | `$total = $calculo['total'];` | Guarda el total en `$total`. |
| 51 | `$esEfectivo = ($payload['paymentMethod'] ?? 'online') === 'cash';` | `$esEfectivo` = `true` si va a pagar en efectivo (`'cash'`). |
| 52 | `$bancosValidos = ['nequi', 'daviplata', 'bancolombia'];` | Lista de bancos permitidos. |
| 53 | `$pago = [` | Arma `$pago` con los datos del pago: |
| 54 | `'metodo'      => $esEfectivo ? 'efectivo' : 'digital',` | el método: `'efectivo'` o `'digital'`, |
| 55 | `'banco'       => (!$esEfectivo && in_array($payload['bank'] ?? '', $bancosValidos, true)) ? $payload['bank'] : null,` | el banco (solo si es digital y es un banco permitido; si no, `null`), |
| 56 | `'estado'      => 'pendiente',` | el estado: `'pendiente'`, |
| 57 | `'fecha'       => null,` | la fecha del pago (todavía ninguna), |
| 58 | `'comprobante' => null,` | y el comprobante (todavía ninguno). |
| 59 | `];` | Cierra la lista. |
| 61 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pago digital: se verifica la transaccion antes de crear nada."* |
| 62 | *(comentario)* | Comentario: no se ejecuta. Dice: *"En efectivo el pago queda 'pendiente' hasta la entrega."* |
| 63 | `if (!$esEfectivo) {` | Si **no** es en efectivo (pagó en línea)... |
| 64 | `$pagoService = new PagoService();` | ...crea el modelo `PagoService`. |
| 65 | `$transaccion = $pagoService->verificarTransaccion((string) ($payload['paymentTransactionId'] ?? ''), $total, $idCliente);` | ...revisa que el pago esté aprobado y sea por el total exacto (`verificarTransaccion()` de `models/PagoService.php`). |
| 67 | `$stmt = $this->conn->prepare("SELECT id_pedido FROM PEDIDO WHERE comprobante_pago = ? LIMIT 1");` | ...prepara la consulta: "busca si otro pedido ya usó este pago". |
| 68 | `$stmt->bind_param("s", $transaccion['id']);` | Llena los `?` de la consulta, en orden: `$transaccion['id']` (texto). |
| 69 | `$stmt->execute();` | Ejecuta la consulta. |
| 70 | `$yaUsada = $stmt->get_result()->fetch_assoc();` | ...lo guarda en `$yaUsada`. |
| 71 | `$stmt->close();` | Cierra la consulta. |
| 72 | `if ($yaUsada) {` | ...si ya lo usó otro pedido... |
| 73 | `throw new Exception('Este pago ya fue usado en otro pedido.');` | ...lanza el error "Este pago ya fue usado en otro pedido.". |
| 74 | `}` | Cierra el `if`. |
| 75 | `$pago['comprobante'] = $transaccion['id'];` | ...guarda el número del pago como comprobante. |
| 76 | `$pago['estado'] = 'aprobado';` | ...el pago queda `'aprobado'`. |
| 77 | `$pago['fecha'] = date('Y-m-d H:i:s');` | ...con la fecha y hora de ahora. |
| 78 | `}` | Cierra el `if`. |
| 80 | `$idPedido = $this->guardar([` | Guarda el pedido (`guardar()` de abajo) con estos datos de destino: |
| 81 | `'id_cliente' => $idCliente,` | el cliente, |
| 82 | `'id_admin'   => null,` | sin administrador (lo hizo el cliente), |
| 83 | `'nombre'     => null,` | sin nombre de contacto, |
| 84 | `'telefono'   => null,` | sin teléfono de contacto, |
| 85 | `'direccion'  => $payload['address'] ?? $cliente['direccion'],` | la dirección (si no mandó, la de su perfil), |
| 86 | `'lat'        => $payload['lat'] ?? null,` | la latitud, |
| 87 | `'lng'        => $payload['lng'] ?? null,` | la longitud, |
| 88 | `'canal'      => 'web',` | y el canal: `'web'`. |
| 89 | `], $pago, $calculo, $configModel);` | ...más el pago, el cálculo y la configuración. Guarda el número del pedido en `$idPedido`. |
| 91 | `return $this->pedidoModel->buscar($idPedido, 'client', $idCliente);` | Devuelve el pedido como lo ve el cliente (`buscar()` de `models/Pedido.php`). |
| 92 | `}` | Cierra la función `crear()`. |
| 94-98 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pedido manual que el administrador registra por llamada o WhatsApp (pago en efectivo al entregar). Si el celular pertenece a un cliente registrado, el pedido queda en su cuenta; si no, queda como cliente invitado."* |
| 99 | `public function crearManual($idAdmin, $payload)` | Método `crearManual($idAdmin, $payload)`: crea un pedido que llegó por llamada o WhatsApp (se paga en efectivo al entregar). Lo usa `OrderController::storeManual()`. |
| 100 | `{` | Abre la función `crearManual()`. |
| 101 | `$configModel = new Configuracion();` | Crea el modelo `Configuracion`. |
| 102 | `if (!$configModel->tiendaAbiertaAhora()) {` | Si la tienda no está abierta... |
| 103 | `throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden registrar pedidos.');` | ...lanza el error. |
| 104 | `}` | Cierra el `if`. |
| 106 | `$nombre    = trim((string) ($payload['clientName'] ?? ''));` | Guarda en `$nombre` el nombre del cliente. |
| 107 | `$telefono  = preg_replace('/\D/', '', (string) ($payload['clientPhone'] ?? ''));` | Guarda en `$telefono` solo los números del celular. |
| 108 | `$direccion = trim((string) ($payload['address'] ?? ''));` | Guarda en `$direccion` la dirección. |
| 109 | `$canal     = in_array($payload['channel'] ?? '', ['llamada', 'whatsapp'], true) ? $payload['channel'] : 'llamada';` | Guarda en `$canal` si fue por `'llamada'` o `'whatsapp'` (si no, `'llamada'`). |
| 111 | `$cliente = $this->buscarClientePorTelefono($telefono);` | Busca si ese celular es de un cliente registrado (`buscarClientePorTelefono()` de abajo). |
| 112 | `$calculo = $this->calcular($cliente, $payload, $configModel, false);` | Calcula precios y total (sin usar puntos). |
| 114 | `$idPedido = $this->guardar([` | Guarda el pedido con estos datos de destino: |
| 115 | `'id_cliente' => $cliente ? $cliente['id_cliente'] : null,` | el cliente si está registrado; si no, `null` (cliente invitado), |
| 116 | `'id_admin'   => $idAdmin,` | el administrador que lo registró, |
| 117 | `'nombre'     => $nombre,` | el nombre, |
| 118 | `'telefono'   => $telefono,` | el teléfono, |
| 119 | `'direccion'  => $direccion,` | la dirección, |
| 120 | `'lat'        => null,` | sin latitud, |
| 121 | `'lng'        => null,` | sin longitud, |
| 122 | `'canal'      => $canal,` | y el canal. |
| 123 | `], [` | ...y el pago: |
| 124 | `'metodo' => 'efectivo', 'banco' => null, 'estado' => 'pendiente', 'fecha' => null, 'comprobante' => null,` | en efectivo, sin banco, pendiente, sin fecha y sin comprobante. |
| 125 | `], $calculo, $configModel);` | ...más el cálculo y la configuración. |
| 127 | `return $this->pedidoModel->buscar($idPedido, 'admin', $idAdmin);` | Devuelve el pedido como lo ve el administrador. |
| 128 | `}` | Cierra la función `crearManual()`. |
| 130-133 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"En una sola transaccion: canjea los puntos (si aplica), guarda el pedido con sus productos y personalizaciones, y descuenta el inventario. Devuelve el id."* |
| 134 | `private function guardar($destino, $pago, $calculo, $configModel)` | Método `guardar(...)` (privado): guarda el pedido completo en una transacción: descuenta los puntos, guarda el pedido, sus productos y sus cambios, y descuenta el inventario. Lo usan `crear()` y `crearManual()`. |
| 135 | `{` | Abre la función `guardar()`. |
| 136 | `$puntos = (int) floor($calculo['total'] / 1000);` | Calcula los puntos que gana: 1 por cada $1.000 (`floor` redondea hacia abajo). |
| 138 | `$this->conn->begin_transaction();` | Empieza una transacción: todo se guarda junto, o nada. |
| 139 | `try {` | Intenta... |
| 140 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Canje de puntos: se vuelve a leer el saldo bloqueando la fila del cliente,"* |
| 141 | *(comentario)* | Comentario: no se ejecuta. Dice: *"asi dos pedidos simultaneos no pueden gastar los mismos puntos."* |
| 142 | `if ($calculo['puntosCanjeados'] > 0) {` | ...si va a usar puntos... |
| 143 | `$stmtS = $this->conn->prepare("SELECT puntos_fidelidad FROM CLIENTE WHERE id_cliente = ? FOR UPDATE");` | ...prepara la consulta: "trae los puntos del cliente y bloquéalo (`FOR UPDATE`)" para que dos pedidos al mismo tiempo no gasten los mismos puntos. |
| 144 | `$stmtS->bind_param("i", $destino['id_cliente']);` | Llena los `?` de la consulta, en orden: `$destino['id_cliente']` (número entero). |
| 145 | `$stmtS->execute();` | Ejecuta la consulta. |
| 146 | `$saldo = $stmtS->get_result()->fetch_assoc();` | ...guarda el resultado en `$saldo`. |
| 147 | `$stmtS->close();` | Cierra la consulta. |
| 148 | `if (!$saldo \|\| (int) $saldo['puntos_fidelidad'] < $calculo['puntosCanjeados']) {` | ...si no existe o no le alcanzan los puntos... |
| 149 | `throw new Exception('Tu saldo de puntos cambió. Revisa el pedido e intenta de nuevo.');` | ...lanza el error "Tu saldo de puntos cambió...". |
| 150 | `}` | Cierra el `if`. |
| 152 | `$stmtR = $this->conn->prepare("UPDATE CLIENTE SET puntos_fidelidad = puntos_fidelidad - ? WHERE id_cliente = ?");` | ...prepara la consulta: "réstale esos puntos al cliente". |
| 153 | `$stmtR->bind_param("ii", $calculo['puntosCanjeados'], $destino['id_cliente']);` | Llena los `?` de la consulta, en orden: `$calculo['puntosCanjeados']` (número entero), `$destino['id_cliente']` (número entero). |
| 154 | `$stmtR->execute();` | Ejecuta la consulta. |
| 155 | `$stmtR->close();` | Cierra la consulta. |
| 156 | `}` | Cierra el `if`. |
| 158 | `$values = [` | Arma `$values` con todos los datos del pedido, en orden: |
| 159 | `$destino['id_cliente'], $destino['id_admin'], $destino['nombre'], $destino['telefono'],` | cliente, administrador, nombre y teléfono de contacto, |
| 160 | `$destino['direccion'], $destino['lat'], $destino['lng'], $destino['canal'],` | dirección, latitud, longitud y canal, |
| 161 | `$pago['metodo'], $pago['banco'], $pago['estado'], $pago['fecha'], $pago['comprobante'],` | método de pago, banco, estado del pago, fecha y comprobante, |
| 162 | `$calculo['subtotal'], $calculo['envio'], $calculo['descuento'],` | subtotal, domicilio, descuento de cumpleaños, |
| 163 | `$calculo['puntosCanjeados'], $calculo['descuentoPuntos'], $puntos, $calculo['total'],` | puntos usados, descuento por puntos, puntos ganados y total. |
| 164 | `];` | Cierra la lista. |
| 165 | `$stmtP = $this->conn->prepare(` | Prepara la consulta: "guarda el pedido en `PEDIDO` con todos esos datos y el estado `'pendiente'`". |
| 166 | `"INSERT INTO PEDIDO` | ↑ (sigue la misma instrucción) |
| 167 | `(id_cliente, id_admin_registro, nombre_contacto, telefono_contacto,` | ↑ (sigue la misma instrucción) |
| 168 | `direccion_entrega, destino_lat, destino_lng, estado, canal_origen,` | ↑ (sigue la misma instrucción) |
| 169 | `metodo_pago, banco_digital, estado_pago, fecha_pago, comprobante_pago,` | ↑ (sigue la misma instrucción) |
| 170 | `subtotal, costo_domicilio, descuento_cumpleanos,` | ↑ (sigue la misma instrucción) |
| 171 | `puntos_canjeados, descuento_puntos, puntos_ganados, total)` | ↑ (sigue la misma instrucción) |
| 172 | `VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 173 | `);` | ↑ (sigue la misma instrucción) |
| 174 | `$stmtP->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 175 | `$stmtP->execute();` | Ejecuta la consulta. |
| 176 | `$stmtP->close();` | Cierra la consulta. |
| 177 | `$idPedido = $this->conn->insert_id;` | Guarda en `$idPedido` el número del pedido nuevo. |
| 179 | `$lineasDescuento = [];` | `$lineasDescuento` empieza vacía: aquí se anota todo lo que hay que descontar del inventario. |
| 181 | `foreach ($calculo['items'] as $item) {` | Recorre cada producto del pedido (`$item`). |
| 182 | `$producto = $item['producto'];` | Guarda el producto. |
| 183 | `$esPersonalizado = (!empty($item['extras']) \|\| !empty($item['removidos'])) ? 1 : 0;` | `$esPersonalizado` = 1 si tiene extras o le quitaron algo; si no, 0. |
| 185 | `$values = [$idPedido, $producto['id_producto'], $producto['nombre'], $item['cantidad'], $item['precioUnitario'], $esPersonalizado];` | Arma `$values`: el pedido, el producto, su nombre, la cantidad, el precio y si es personalizado. |
| 186 | `$stmtD = $this->conn->prepare(` | Prepara la consulta: "guarda este producto en `DETALLE_PEDIDO`". |
| 187 | `"INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, nombre_producto, cantidad, precio_unitario, es_personalizado)` | ↑ (sigue la misma instrucción) |
| 188 | `VALUES (?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 189 | `);` | ↑ (sigue la misma instrucción) |
| 190 | `$stmtD->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 191 | `$stmtD->execute();` | Ejecuta la consulta. |
| 192 | `$stmtD->close();` | Cierra la consulta. |
| 193 | `$idDetalle = $this->conn->insert_id;` | Guarda en `$idDetalle` el número de este detalle. |
| 195 | `foreach ($item['extras'] as $extra) {` | Recorre los ingredientes extra que pidió (`$extra`). |
| 196 | `$values = [$idDetalle, $extra['id_ingrediente'], $extra['nombre'], $extra['precio_extra']];` | Arma `$values`: el detalle, el ingrediente, su nombre y su precio. |
| 197 | `$stmtE = $this->conn->prepare(` | Prepara la consulta: "guarda en `PERSONALIZACION` que se **agregó** este ingrediente". |
| 198 | `"INSERT INTO PERSONALIZACION (id_detalle, id_ingrediente, nombre_ingrediente, accion_modificacion, cantidad, costo_aplicado)` | ↑ (sigue la misma instrucción) |
| 199 | `VALUES (?, ?, ?, 'agregar', 1, ?)"` | ↑ (sigue la misma instrucción) |
| 200 | `);` | ↑ (sigue la misma instrucción) |
| 201 | `$stmtE->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 202 | `$stmtE->execute();` | Ejecuta la consulta. |
| 203 | `$stmtE->close();` | Cierra la consulta. |
| 205 | `$lineasDescuento[] = [` | Anota en `$lineasDescuento` que hay que descontar ese ingrediente: |
| 206 | `'id_ingrediente' => $extra['id_ingrediente'],` | cuál, |
| 207 | `'cantidad'       => $item['cantidad'],` | cuánto (la cantidad del producto), |
| 208 | `'motivo'         => 'Extra pedido #ORD-' . $idPedido,` | y el motivo ("Extra pedido #ORD-.."). |
| 209 | `];` | Cierra los datos. |
| 210 | `}` | Cierra el `foreach`. |
| 212 | `foreach ($item['removidos'] as $removido) {` | Recorre los ingredientes que pidió quitar (`$removido`). |
| 213 | `$values = [$idDetalle, $removido['id_ingrediente'], $removido['nombre']];` | Arma `$values`: el detalle, el ingrediente y su nombre. |
| 214 | `$stmtQ = $this->conn->prepare(` | Prepara la consulta: "guarda en `PERSONALIZACION` que se **quitó** este ingrediente". |
| 215 | `"INSERT INTO PERSONALIZACION (id_detalle, id_ingrediente, nombre_ingrediente, accion_modificacion, cantidad, costo_aplicado)` | ↑ (sigue la misma instrucción) |
| 216 | `VALUES (?, ?, ?, 'quitar', 1, 0)"` | ↑ (sigue la misma instrucción) |
| 217 | `);` | ↑ (sigue la misma instrucción) |
| 218 | `$stmtQ->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 219 | `$stmtQ->execute();` | Ejecuta la consulta. |
| 220 | `$stmtQ->close();` | Cierra la consulta. |
| 221 | `}` | Cierra el `foreach`. |
| 223 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Receta base del producto (menos lo que se quito) por la cantidad pedida."* |
| 224 | `$idsRemovidos = array_column($item['removidos'], 'id_ingrediente');` | Guarda en `$idsRemovidos` los números de los ingredientes que quitó. |
| 225 | `$stmtR = $this->conn->prepare("SELECT id_ingrediente, cantidad_necesaria FROM RECETA WHERE id_producto = ?");` | Prepara la consulta: "trae la receta de este producto". |
| 226 | `$stmtR->bind_param("i", $producto['id_producto']);` | Llena los `?` de la consulta, en orden: `$producto['id_producto']` (número entero). |
| 227 | `$stmtR->execute();` | Ejecuta la consulta. |
| 228 | `$receta = $stmtR->get_result()->fetch_all(MYSQLI_ASSOC);` | La guarda en `$receta`. |
| 229 | `$stmtR->close();` | Cierra la consulta. |
| 231 | `foreach ($receta as $linea) {` | Recorre cada ingrediente de la receta (`$linea`). |
| 232 | `if (in_array($linea['id_ingrediente'], $idsRemovidos, true)) {` | Si es uno de los que quitó... |
| 233 | `continue;` | ...lo salta (no se descuenta). |
| 234 | `}` | Cierra el `if`. |
| 235 | `$lineasDescuento[] = [` | Anota que hay que descontar ese ingrediente: |
| 236 | `'id_ingrediente' => $linea['id_ingrediente'],` | cuál, |
| 237 | `'cantidad'       => (float) $linea['cantidad_necesaria'] * $item['cantidad'],` | cuánto: lo que lleva la receta × la cantidad de productos, |
| 238 | `'motivo'         => 'Venta pedido',` | y el motivo "Venta pedido". |
| 239 | `];` | Cierra los datos. |
| 240 | `}` | Cierra el `foreach`. |
| 241 | `}` | Cierra el `foreach`. |
| 243 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Bolsa de empaque global (1 por pedido)."* |
| 244 | `$idBolsa = $configModel->idIngredienteBolsaGlobal();` | Busca cuál es la bolsa de empaque (`idIngredienteBolsaGlobal()` de `models/Configuracion.php`). |
| 245 | `if ($idBolsa) {` | Si hay bolsa configurada... |
| 246 | `$lineasDescuento[] = ['id_ingrediente' => $idBolsa, 'cantidad' => 1, 'motivo' => 'Empaque global pedido'];` | ...anota que hay que descontar 1 bolsa por pedido. |
| 247 | `}` | Cierra el `if`. |
| 249 | `if (!empty($lineasDescuento)) {` | Si hay algo que descontar... |
| 250 | `$ingredienteModel = new Ingrediente();` | ...crea el modelo `Ingrediente`. |
| 251 | `$ingredienteModel->descontarPorReceta($lineasDescuento, $idPedido);` | ...descuenta todo del inventario (`descontarPorReceta()` de `models/Ingrediente.php`). Si no alcanza algo, lanza un error y no se guarda nada. |
| 252 | `}` | Cierra el `if`. |
| 254 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Los puntos ganados y el total gastado se suman al ENTREGAR (confirmarEntrega)."* |
| 255 | `$this->conn->commit();` | Confirma la transacción: ahora sí queda todo guardado. |
| 256 | `} catch (Exception $e) {` | Si algo falló... |
| 257 | `$this->conn->rollback();` | ...deshace todo (no queda nada a medias). |
| 258 | `throw $e;` | ...y lanza el error. |
| 259 | `}` | Cierra el `catch`. |
| 261 | `return $idPedido;` | Devuelve el número del pedido. |
| 262 | `}` | Cierra la función `guardar()`. |
| 264 | `private function buscarCliente($idCliente)` | Método `buscarCliente($idCliente)` (privado): busca un cliente. |
| 265 | `{` | Abre la función `buscarCliente()`. |
| 266 | `$stmt = $this->conn->prepare("SELECT * FROM CLIENTE WHERE id_cliente = ? LIMIT 1");` | Prepara la consulta: "trae todo del cliente con ese id". |
| 267 | `$stmt->bind_param("s", $idCliente);` | Llena los `?` de la consulta, en orden: `$idCliente` (texto). |
| 268 | `$stmt->execute();` | Ejecuta la consulta. |
| 269 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 270 | `$stmt->close();` | Cierra la consulta. |
| 271 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 272 | `}` | Cierra la función `buscarCliente()`. |
| 274 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Cliente activo con ese celular (comparando solo digitos, con o sin el 57), o null."* |
| 275 | `private function buscarClientePorTelefono($telefono)` | Método `buscarClientePorTelefono($telefono)` (privado): busca un cliente activo por su celular (con o sin el 57 de Colombia). |
| 276 | `{` | Abre la función `buscarClientePorTelefono()`. |
| 277 | `if ($telefono === '') {` | Si no hay teléfono... |
| 278 | `return null;` | ...devuelve `null`. |
| 279 | `}` | Cierra el `if`. |
| 280 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "busca un cliente activo cuyo teléfono, dejando solo los números (`REGEXP_REPLACE`), sea igual al celular o al celular con 57 adelante (`CONCAT('57', ?)`)". |
| 281 | `"SELECT * FROM CLIENTE` | ↑ (sigue la misma instrucción) |
| 282 | `WHERE activo = 1 AND REGEXP_REPLACE(telefono, '[^0-9]', '') IN (?, CONCAT('57', ?))` | ↑ (sigue la misma instrucción) |
| 283 | `LIMIT 1"` | ↑ (sigue la misma instrucción) |
| 284 | `);` | ↑ (sigue la misma instrucción) |
| 285 | `$stmt->bind_param("ss", $telefono, $telefono);` | Llena los `?` de la consulta, en orden: `$telefono` (texto), `$telefono` (texto). |
| 286 | `$stmt->execute();` | Ejecuta la consulta. |
| 287 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 288 | `$stmt->close();` | Cierra la consulta. |
| 289 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 290 | `}` | Cierra la función `buscarClientePorTelefono()`. |
| 292-295 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Recalcula en el servidor items, precios, descuento y total. El precio de cada insumo extra = costo unitario + margen de ganancia de Ajustes."* |
| 296 | `private function calcular($cliente, $payload, $configModel, $usarPuntos = false)` | Método `calcular(...)` (privado): calcula en el servidor el precio de cada producto, el subtotal, el domicilio, los descuentos y el total. Así nadie puede cambiar los precios desde el navegador. |
| 297 | `{` | Abre la función `calcular()`. |
| 298 | `$items = $payload['items'] ?? [];` | Guarda en `$items` los productos que mandó la pantalla (si no hay, lista vacía). |
| 299 | `if (empty($items)) {` | Si no hay productos... |
| 300 | `throw new InvalidArgumentException('El pedido no tiene ítems.');` | ...lanza el error "El pedido no tiene ítems.". |
| 301 | `}` | Cierra el `if`. |
| 303 | `$margen = $configModel->margenGanancia();` | Guarda en `$margen` el porcentaje de ganancia (`margenGanancia()` de `models/Configuracion.php`). |
| 304 | `$resueltos = [];` | `$resueltos` empieza vacía: los productos ya revisados. |
| 305 | `$subtotal = 0.0;` | `$subtotal` empieza en 0. |
| 307 | `foreach ($items as $item) {` | Recorre cada producto que mandó la pantalla (`$item`). |
| 308 | `$cantidad = max(1, (int) ($item['quantity'] ?? 1));` | Guarda la cantidad (mínimo 1: `max(1, ...)`). |
| 310 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Creador interactivo: hamburguesa armada capa por capa, sin producto base."* |
| 311 | `if (empty($item['productId']) && !empty($item['stack'])) {` | Si no trae producto pero trae capas (`stack`): es una hamburguesa armada por el cliente en el creador... |
| 312 | `$pila = $this->resolverIngredientes($item['stack'], $margen);` | ...busca cada ingrediente y su precio (`resolverIngredientes()` de abajo). |
| 313 | `if (empty($pila)) {` | ...si no quedó ningún ingrediente válido... |
| 314 | `throw new InvalidArgumentException('La hamburguesa personalizada no tiene ingredientes válidos.');` | ...lanza el error "La hamburguesa personalizada no tiene ingredientes válidos.". |
| 315 | `}` | Cierra el `if`. |
| 316 | `$precioUnitario = $this->sumarPrecios($pila);` | ...el precio es la suma de sus ingredientes (`sumarPrecios()` de abajo). |
| 317 | `$subtotal += $precioUnitario * $cantidad;` | ...suma al subtotal: precio × cantidad. |
| 319 | `$resueltos[] = [` | ...la agrega a `$resueltos` con: |
| 320 | `'producto'       => $this->productoPersonalizadoOculto(),` | el producto base oculto "Hamburguesa Personalizada" (`productoPersonalizadoOculto()` de abajo), |
| 321 | `'cantidad'       => $cantidad,` | la cantidad, |
| 322 | `'precioUnitario' => $precioUnitario,` | el precio, |
| 323 | `'extras'         => $pila,` | sus ingredientes (como extras), |
| 324 | `'removidos'      => [],` | y nada quitado. |
| 325 | `];` | Cierra los datos. |
| 326 | `continue;` | `continue` = pasa al siguiente producto. |
| 327 | `}` | Cierra el `if`. |
| 329 | `$idProducto = $item['productId'] ?? '';` | Si es un producto normal, guarda su número en `$idProducto`. |
| 330 | `$stmt = $this->conn->prepare("SELECT * FROM PRODUCTO WHERE id_producto = ? AND estado = 'activo' LIMIT 1");` | Prepara la consulta: "busca ese producto, solo si está activo". |
| 331 | `$stmt->bind_param("s", $idProducto);` | Llena los `?` de la consulta, en orden: `$idProducto` (texto). |
| 332 | `$stmt->execute();` | Ejecuta la consulta. |
| 333 | `$producto = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$producto`. |
| 334 | `$stmt->close();` | Cierra la consulta. |
| 335 | `if (!$producto) {` | Si no existe o ya no está activo... |
| 336 | `throw new InvalidArgumentException('Uno de los productos del carrito ya no está disponible.');` | ...lanza el error "Uno de los productos del carrito ya no está disponible.". |
| 337 | `}` | Cierra el `if`. |
| 339 | `$extras = $this->resolverIngredientes($item['extras'] ?? [], $margen);` | Busca los ingredientes extra y su precio. |
| 340 | `$removidos = $this->resolverIngredientes($item['removed'] ?? [], $margen);` | Busca los ingredientes que quitó. |
| 342 | `$precioUnitario = (float) $producto['precio'] + $this->sumarPrecios($extras);` | El precio = precio del producto + precio de los extras. |
| 343 | `$subtotal += $precioUnitario * $cantidad;` | Suma al subtotal: precio × cantidad. |
| 345 | `$resueltos[] = [` | Lo agrega a `$resueltos` con: |
| 346 | `'producto'       => $producto,` | el producto, |
| 347 | `'cantidad'       => $cantidad,` | la cantidad, |
| 348 | `'precioUnitario' => $precioUnitario,` | el precio, |
| 349 | `'extras'         => $extras,` | los extras, |
| 350 | `'removidos'      => $removidos,` | y lo que quitó. |
| 351 | `];` | Cierra los datos. |
| 352 | `}` | Cierra el `foreach`. |
| 354 | `$envio = (float) $configModel->tarifaDomicilio();` | Guarda en `$envio` lo que cuesta el domicilio (`tarifaDomicilio()`). |
| 355 | `$descuento = $cliente ? $this->descuentoCumpleanos($cliente, $subtotal) : 0.0;` | Si hay cliente, calcula su descuento de cumpleaños (`descuentoCumpleanos()` de abajo); si no, 0. |
| 357 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Canje de puntos: solo sobre los productos (no sobre el domicilio) y solo"* |
| 358 | *(comentario)* | Comentario: no se ejecuta. Dice: *"si el cliente alcanza el minimo configurado en Ajustes."* |
| 359 | `$puntosCanjeados = 0;` | `$puntosCanjeados` empieza en 0. |
| 360 | `$descuentoPuntos = 0.0;` | `$descuentoPuntos` empieza en 0. |
| 361 | `if ($usarPuntos && $cliente) {` | Si quiere usar puntos y hay cliente... |
| 362 | `$reglas = $configModel->reglasPuntos();` | ...trae las reglas de los puntos (`reglasPuntos()`): cuánto vale uno y el mínimo. |
| 363 | `$saldo = (int) $cliente['puntos_fidelidad'];` | ...guarda cuántos puntos tiene. |
| 364 | `if ($reglas['valor'] > 0 && $saldo > 0 && $saldo >= $reglas['minimo']) {` | ...si un punto vale algo, tiene puntos y llega al mínimo... |
| 365 | `$maximoPorMonto = (int) floor(($subtotal - $descuento) / $reglas['valor']);` | ...calcula cuántos puntos se pueden usar como máximo para no pasarse del valor de los productos (`floor` redondea hacia abajo). |
| 366 | `$elegidos = isset($payload['pointsToUse']) ? (int) $payload['pointsToUse'] : $saldo;` | `$elegidos` = cuántos puntos **eligió** el cliente (`pointsToUse`, lo que escribió en la cajita del pago). `isset()` pregunta si lo mandó; si no lo mandó, se toman todos sus puntos (`$saldo`). `(int)` lo vuelve número entero. |
| 367 | `$puntosCanjeados = max(0, min($saldo, $maximoPorMonto, $elegidos));` | Los puntos que se canjean = el **menor** de tres números (`min`): los que tiene, los que alcanzan a cubrir los productos, y los que eligió. `max(0, ...)` evita que quede negativo (por si alguien manda un número negativo). |
| 368 | `$descuentoPuntos = round($puntosCanjeados * $reglas['valor'], 2);` | ...el descuento = puntos × valor de un punto. |
| 369 | `}` | Cierra el `if`. |
| 370 | `}` | Cierra el `if`. |
| 372 | `return [` | Devuelve el cálculo: |
| 373 | `'items'           => $resueltos,` | los productos revisados, |
| 374 | `'subtotal'        => $subtotal,` | el subtotal, |
| 375 | `'envio'           => $envio,` | el domicilio, |
| 376 | `'descuento'       => $descuento,` | el descuento de cumpleaños, |
| 377 | `'puntosCanjeados' => $puntosCanjeados,` | los puntos usados, |
| 378 | `'descuentoPuntos' => $descuentoPuntos,` | el descuento por puntos, |
| 379 | `'total'           => round($subtotal - $descuento - $descuentoPuntos + $envio, 2),` | y el total = subtotal − descuentos + domicilio (redondeado a 2 decimales). |
| 380 | `];` | Cierra la lista. |
| 381 | `}` | Cierra la función `calcular()`. |
| 383 | `private function sumarPrecios($ingredientes)` | Método `sumarPrecios($ingredientes)` (privado): suma el precio de varios ingredientes. |
| 384 | `{` | Abre la función `sumarPrecios()`. |
| 385 | `$suma = 0;` | `$suma` empieza en 0. |
| 386 | `foreach ($ingredientes as $ing) {` | Recorre cada ingrediente. |
| 387 | `$suma += (float) $ing['precio_extra'];` | Le suma su precio (`+=`). |
| 388 | `}` | Cierra el `foreach`. |
| 389 | `return $suma;` | Devuelve la suma. |
| 390 | `}` | Cierra la función `sumarPrecios()`. |
| 392 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Total que se cobraria por este carrito (para abrir la pasarela de pago)."* |
| 393 | `public function cotizar($idCliente, $payload)` | Método `cotizar($idCliente, $payload)`: calcula el total antes de pagar (para la pasarela). Lo usa `PaymentController::prepare()`. |
| 394 | `{` | Abre la función `cotizar()`. |
| 395 | `$configModel = new Configuracion();` | Crea el modelo `Configuracion`. |
| 396 | `if (!$configModel->tiendaAbiertaAhora()) {` | Si la tienda no está abierta... |
| 397 | `throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden procesar pagos.');` | ...lanza el error. |
| 398 | `}` | Cierra el `if`. |
| 399 | `$cliente = $this->buscarCliente($idCliente);` | Busca al cliente. |
| 400 | `if (!$cliente) {` | Si no existe... |
| 401 | `throw new InvalidArgumentException('Cliente no encontrado.');` | ...lanza el error "Cliente no encontrado.". |
| 402 | `}` | Cierra el `if`. |
| 403 | `return $this->calcular($cliente, $payload, $configModel, !empty($payload['usePoints']))['total'];` | Calcula todo (`calcular()`) y devuelve solo el total (`['total']`). |
| 404 | `}` | Cierra la función `cotizar()`. |
| 406 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Producto oculto que sirve de base para las hamburguesas del creador interactivo. Se crea una sola vez."* |
| 407 | `private function productoPersonalizadoOculto()` | Método `productoPersonalizadoOculto()` (privado): trae el producto oculto "Hamburguesa Personalizada" (la base de las hamburguesas armadas por el cliente). Si no existe, lo crea una sola vez. |
| 408 | `{` | Abre la función `productoPersonalizadoOculto()`. |
| 409 | `$sql = "SELECT * FROM PRODUCTO WHERE nombre = 'Hamburguesa Personalizada' AND estado = 'oculto' LIMIT 1";` | Guarda en `$sql` la consulta: "busca el producto 'Hamburguesa Personalizada' oculto". |
| 411 | `$stmt = $this->conn->prepare($sql);` | La prepara. |
| 412 | `$stmt->execute();` | Ejecuta la consulta. |
| 413 | `$producto = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$producto`. |
| 414 | `$stmt->close();` | Cierra la consulta. |
| 415 | `if ($producto) {` | Si existe... |
| 416 | `return $producto;` | ...lo devuelve. |
| 417 | `}` | Cierra el `if`. |
| 419 | `$stmtC = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE nombre = 'Personalizado' AND ambito = 'menu' LIMIT 1");` | Si no, prepara la consulta: "busca la categoría 'Personalizado' del menú". |
| 420 | `$stmtC->execute();` | Ejecuta la consulta. |
| 421 | `$categoria = $stmtC->get_result()->fetch_assoc();` | La guarda en `$categoria`. |
| 422 | `$stmtC->close();` | Cierra la consulta. |
| 424 | `if ($categoria) {` | Si existe... |
| 425 | `$idCategoria = $categoria['id_categoria'];` | ...guarda su número. |
| 426 | `} else {` | Si no... |
| 427 | `$stmtN = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES ('Personalizado', 'menu')");` | ...prepara la consulta: "crea la categoría 'Personalizado'". |
| 428 | `$stmtN->execute();` | Ejecuta la consulta. |
| 429 | `$stmtN->close();` | Cierra la consulta. |
| 430 | `$idCategoria = $this->conn->insert_id;` | ...y guarda su número. |
| 431 | `}` | Cierra el `else`. |
| 433 | `$stmtI = $this->conn->prepare(` | Prepara la consulta: "crea el producto 'Hamburguesa Personalizada', con precio 0 y oculto". |
| 434 | `"INSERT INTO PRODUCTO (id_categoria, nombre, precio, estado)` | ↑ (sigue la misma instrucción) |
| 435 | `VALUES (?, 'Hamburguesa Personalizada', 0, 'oculto')"` | ↑ (sigue la misma instrucción) |
| 436 | `);` | ↑ (sigue la misma instrucción) |
| 437 | `$stmtI->bind_param("i", $idCategoria);` | Llena los `?` de la consulta, en orden: `$idCategoria` (número entero). |
| 438 | `$stmtI->execute();` | Ejecuta la consulta. |
| 439 | `$stmtI->close();` | Cierra la consulta. |
| 441 | `$stmtF = $this->conn->prepare($sql);` | Vuelve a preparar la consulta de búsqueda (`$sql`). |
| 442 | `$stmtF->execute();` | Ejecuta la consulta. |
| 443 | `$producto = $stmtF->get_result()->fetch_assoc();` | Guarda el producto recién creado. |
| 444 | `$stmtF->close();` | Cierra la consulta. |
| 445 | `return $producto;` | Lo devuelve. |
| 446 | `}` | Cierra la función `productoPersonalizadoOculto()`. |
| 448-452 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca cada ingrediente por id (o por nombre) y calcula su precio de venta: costo unitario + margen, redondeado a la centena (igual que en el frontend). Los ingredientes que no existen se ignoran."* |
| 453 | `private function resolverIngredientes($referencias, $margen = 0.0)` | Método `resolverIngredientes($referencias, $margen)` (privado): busca cada ingrediente (por número o por nombre) y calcula su precio de venta. Los que no existen se saltan. |
| 454 | `{` | Abre la función `resolverIngredientes()`. |
| 455 | `$resueltos = [];` | `$resueltos` empieza vacía. |
| 456 | `foreach ($referencias as $ref) {` | Recorre cada ingrediente que mandó la pantalla (`$ref`). |
| 457 | `$row = null;` | `$row` empieza en `null` (todavía no lo encontró). |
| 458 | `if (!empty($ref['id'])) {` | Si trae número... |
| 459 | `$stmt = $this->conn->prepare("SELECT * FROM INGREDIENTE WHERE id_ingrediente = ? LIMIT 1");` | ...prepara la consulta: "busca el ingrediente con ese número". |
| 460 | `$stmt->bind_param("s", $ref['id']);` | Llena los `?` de la consulta, en orden: `$ref['id']` (texto). |
| 461 | `$stmt->execute();` | Ejecuta la consulta. |
| 462 | `$row = $stmt->get_result()->fetch_assoc();` | ...lo guarda en `$row`. |
| 463 | `$stmt->close();` | Cierra la consulta. |
| 464 | `}` | Cierra el `if`. |
| 465 | `if (!$row && !empty($ref['name'])) {` | Si no lo encontró y trae nombre... |
| 466 | `$stmt = $this->conn->prepare("SELECT * FROM INGREDIENTE WHERE LOWER(nombre) = LOWER(?) LIMIT 1");` | ...prepara la consulta: "busca el ingrediente con ese nombre, sin importar mayúsculas". |
| 467 | `$stmt->bind_param("s", $ref['name']);` | Llena los `?` de la consulta, en orden: `$ref['name']` (texto). |
| 468 | `$stmt->execute();` | Ejecuta la consulta. |
| 469 | `$row = $stmt->get_result()->fetch_assoc();` | ...lo guarda en `$row`. |
| 470 | `$stmt->close();` | Cierra la consulta. |
| 471 | `}` | Cierra el `if`. |
| 472 | `if (!$row) {` | Si no lo encontró de ninguna forma... |
| 473 | `continue;` | ...lo salta. |
| 474 | `}` | Cierra el `if`. |
| 475 | `$costo = (float) $row['costo_unitario'];` | Guarda en `$costo` lo que cuesta una unidad. |
| 476 | `$resueltos[] = [` | Lo agrega a `$resueltos` con: |
| 477 | `'id_ingrediente' => $row['id_ingrediente'],` | su número, |
| 478 | `'nombre'         => $row['nombre'],` | su nombre, |
| 479 | `'precio_extra'   => round(($costo * (1 + $margen / 100)) / 100) * 100,` | y su precio de venta: costo + margen de ganancia, redondeado a la centena (ej. 2.025 → 2.000). Así lo calcula también la pantalla. |
| 480 | `];` | Cierra los datos. |
| 481 | `}` | Cierra el `foreach`. |
| 482 | `return $resueltos;` | Devuelve la lista. |
| 483 | `}` | Cierra la función `resolverIngredientes()`. |
| 485 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"15% de descuento si hoy es el cumpleanos del cliente."* |
| 486 | `private function descuentoCumpleanos($cliente, $subtotal)` | Método `descuentoCumpleanos($cliente, $subtotal)` (privado): da 15% de descuento si hoy es el cumpleaños del cliente. |
| 487 | `{` | Abre la función `descuentoCumpleanos()`. |
| 488 | `if (empty($cliente['fecha_nacimiento'])) {` | Si no tiene fecha de nacimiento... |
| 489 | `return 0.0;` | ...no hay descuento (0). |
| 490 | `}` | Cierra el `if`. |
| 491 | `$cumple = date('m-d', strtotime($cliente['fecha_nacimiento']));` | Saca el mes y el día del cumpleaños (`date('m-d', ...)`, ej. `10-17`). |
| 492 | `return $cumple === date('m-d') ? round($subtotal * 0.15, 2) : 0.0;` | Si es igual al mes y día de hoy, el descuento es el 15% del subtotal (`× 0.15`); si no, 0. |
| 493 | `}` | Cierra la función `descuentoCumpleanos()`. |
| 495 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 496 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cambios de estado"* |
| 497 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 499 | `public function marcarPreparando($idPedido, $idAyudante = null)` | Método `marcarPreparando($idPedido, $idAyudante)`: pasa el pedido a "En preparación". Lo usa `OrderController::markPreparing()`. |
| 500 | `{` | Abre la función `marcarPreparando()`. |
| 501 | `$this->transicion($idPedido, ['pendiente'], 'en_preparacion');` | Cambia el estado de `'pendiente'` a `'en_preparacion'` (`transicion()` de abajo). Si no estaba pendiente, da error. |
| 502 | `$this->registrarAyudante($idPedido, $idAyudante);` | Anota quién de cocina lo prepara (`registrarAyudante()` de abajo). |
| 503 | `}` | Cierra la función `marcarPreparando()`. |
| 505 | `public function marcarListo($idPedido, $idAyudante = null)` | Método `marcarListo($idPedido, $idAyudante)`: pasa el pedido a "Listo". Lo usa `OrderController::markReady()`. |
| 506 | `{` | Abre la función `marcarListo()`. |
| 507 | `$this->transicion($idPedido, ['pendiente', 'en_preparacion'], 'listo');` | Cambia el estado a `'listo'` (solo si estaba pendiente o en preparación). |
| 509 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET fecha_listo = NOW() WHERE id_pedido = ?");` | Prepara la consulta: "anota la hora en que quedó listo (`NOW()`)". |
| 510 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 511 | `$stmt->execute();` | Ejecuta la consulta. |
| 512 | `$stmt->close();` | Cierra la consulta. |
| 514 | `$this->registrarAyudante($idPedido, $idAyudante);` | Anota quién de cocina lo preparó. |
| 515 | `}` | Cierra la función `marcarListo()`. |
| 517 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Guarda quien de cocina preparo el pedido (solo el primero)."* |
| 518 | `private function registrarAyudante($idPedido, $idAyudante)` | Método `registrarAyudante($idPedido, $idAyudante)` (privado): guarda quién de cocina preparó el pedido (solo el primero). |
| 519 | `{` | Abre la función `registrarAyudante()`. |
| 520 | `if (!$idAyudante) {` | Si no hay ayudante (lo hizo el administrador)... |
| 521 | `return;` | ...sale. |
| 522 | `}` | Cierra el `if`. |
| 523 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET id_ayudante = ? WHERE id_pedido = ? AND id_ayudante IS NULL");` | Prepara la consulta: "anota el ayudante en el pedido, solo si todavía no tiene uno (`IS NULL`)". |
| 524 | `$stmt->bind_param("si", $idAyudante, $idPedido);` | Llena los `?` de la consulta, en orden: `$idAyudante` (texto), `$idPedido` (número entero). |
| 525 | `$stmt->execute();` | Ejecuta la consulta. |
| 526 | `$stmt->close();` | Cierra la consulta. |
| 527 | `}` | Cierra la función `registrarAyudante()`. |
| 529 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Lee estado y domiciliario del pedido bloqueando la fila (FOR UPDATE)."* |
| 530 | `private function bloquearPedido($idPedido)` | Método `bloquearPedido($idPedido)` (privado): lee el estado y el domiciliario del pedido y lo bloquea (`FOR UPDATE`), para que dos domiciliarios no lo tomen al mismo tiempo. |
| 531 | `{` | Abre la función `bloquearPedido()`. |
| 532 | `$stmt = $this->conn->prepare("SELECT estado, id_domiciliario FROM PEDIDO WHERE id_pedido = ? FOR UPDATE");` | Prepara la consulta: "trae el estado y el domiciliario del pedido, y bloquéalo". |
| 533 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 534 | `$stmt->execute();` | Ejecuta la consulta. |
| 535 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 536 | `$stmt->close();` | Cierra la consulta. |
| 537 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 538 | `}` | Cierra la función `bloquearPedido()`. |
| 540 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"El domiciliario toma un pedido 'listo' (queda asignado, sin salir todavia)."* |
| 541 | `public function tomarPedido($idPedido, $idDomiciliario)` | Método `tomarPedido($idPedido, $idDomiciliario)`: el domiciliario toma un pedido listo (queda asignado, pero todavía no sale). Lo usa `OrderController::take()`. |
| 542 | `{` | Abre la función `tomarPedido()`. |
| 543 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 544 | `try {` | Intenta... |
| 545 | `$row = $this->bloquearPedido($idPedido);` | ...lee y bloquea el pedido. |
| 546 | `if (!$row \|\| $row['estado'] !== 'listo'` | ...si no existe, o no está listo, o ya lo tiene **otro** domiciliario... |
| 547 | `\|\| ($row['id_domiciliario'] !== null && $row['id_domiciliario'] !== $idDomiciliario)) {` | ↑ (sigue la misma instrucción) |
| 548 | `throw new Exception('Este pedido ya no está disponible para reparto.');` | ...lanza el error "Este pedido ya no está disponible para reparto.". |
| 549 | `}` | Cierra el bloque. |
| 551 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET id_domiciliario = ? WHERE id_pedido = ?");` | ...prepara la consulta: "asígnale este domiciliario al pedido". |
| 552 | `$stmt->bind_param("si", $idDomiciliario, $idPedido);` | Llena los `?` de la consulta, en orden: `$idDomiciliario` (texto), `$idPedido` (número entero). |
| 553 | `$stmt->execute();` | Ejecuta la consulta. |
| 554 | `$stmt->close();` | Cierra la consulta. |
| 556 | `$this->conn->commit();` | ...confirma la transacción. |
| 557 | `} catch (Exception $e) {` | Si algo falló... |
| 558 | `$this->conn->rollback();` | ...deshace todo. |
| 559 | `throw $e;` | ...y lanza el error. |
| 560 | `}` | Cierra el `catch`. |
| 561 | `}` | Cierra la función `tomarPedido()`. |
| 563-566 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"El domiciliario suelta su pedido para que otro lo tome. Solo puede soltar los suyos que siguen en 'listo' (que todavia no salio a entregar)."* |
| 567 | `public function liberarPedido($idPedido, $idActor)` | Método `liberarPedido($idPedido, $idActor)`: el domiciliario suelta su pedido para que otro lo tome. Lo usa `OrderController::release()`. `$idActor` = el número del domiciliario que lo suelta. |
| 568 | `{` | Abre la función `liberarPedido()`. |
| 569 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 570 | `try {` | Intenta... |
| 571 | `$row = $this->bloquearPedido($idPedido);` | ...lee y bloquea el pedido. |
| 572 | `if (!$row \|\| $row['id_domiciliario'] === null) {` | ...si no existe o no tiene domiciliario... |
| 573 | `throw new Exception('Este pedido no tiene domiciliario asignado.');` | ...lanza el error "Este pedido no tiene domiciliario asignado.". |
| 574 | `}` | Cierra el `if`. |
| 575 | `if ($row['id_domiciliario'] !== $idActor \|\| $row['estado'] !== 'listo') {` | ...si el pedido no es de este domiciliario (`!==` = "no es igual"), o ya no está en "listo" (ya salió a entregarlo)... |
| 576 | `throw new Exception('Solo puedes soltar un pedido tuyo que aún no has iniciado.');` | ...lanza el error "Solo puedes soltar un pedido tuyo que aún no has iniciado.". |
| 577 | `}` | Cierra el `if`. |
| 579 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET estado = 'listo', id_domiciliario = NULL WHERE id_pedido = ?");` | ...prepara la consulta: "deja el pedido en 'listo' y sin domiciliario (`NULL`)". |
| 580 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 581 | `$stmt->execute();` | Ejecuta la consulta. |
| 582 | `$stmt->close();` | Cierra la consulta. |
| 584 | `$this->conn->commit();` | ...confirma la transacción. |
| 585 | `} catch (Exception $e) {` | Si algo falló... |
| 586 | `$this->conn->rollback();` | ...deshace todo. |
| 587 | `throw $e;` | ...y lanza el error. |
| 588 | `}` | Cierra el `catch`. |
| 589 | `}` | Cierra la función `liberarPedido()`. |
| 591 | `public function aceptarEntrega($idPedido, $idDomiciliario)` | Método `aceptarEntrega($idPedido, $idDomiciliario)`: el domiciliario sale a entregar: el pedido pasa a "En camino". Lo usa `OrderController::accept()`. |
| 592 | `{` | Abre la función `aceptarEntrega()`. |
| 593 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 594 | `try {` | Intenta... |
| 595 | `$row = $this->bloquearPedido($idPedido);` | ...lee y bloquea el pedido. |
| 596 | `if (!$row \|\| $row['estado'] !== 'listo'` | ...si no existe, o no está listo, o lo tiene otro domiciliario... |
| 597 | `\|\| ($row['id_domiciliario'] !== null && $row['id_domiciliario'] !== $idDomiciliario)) {` | ↑ (sigue la misma instrucción) |
| 598 | `throw new Exception('Este pedido ya no está disponible para reparto.');` | ...lanza el error "Este pedido ya no está disponible para reparto.". |
| 599 | `}` | Cierra el bloque. |
| 601 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET estado = 'en_camino', id_domiciliario = ? WHERE id_pedido = ?");` | ...prepara la consulta: "pasa el pedido a 'en_camino' con este domiciliario". |
| 602 | `$stmt->bind_param("si", $idDomiciliario, $idPedido);` | Llena los `?` de la consulta, en orden: `$idDomiciliario` (texto), `$idPedido` (número entero). |
| 603 | `$stmt->execute();` | Ejecuta la consulta. |
| 604 | `$stmt->close();` | Cierra la consulta. |
| 606 | `$this->conn->commit();` | ...confirma la transacción. |
| 607 | `} catch (Exception $e) {` | Si algo falló... |
| 608 | `$this->conn->rollback();` | ...deshace todo. |
| 609 | `throw $e;` | ...y lanza el error. |
| 610 | `}` | Cierra el `catch`. |
| 611 | `}` | Cierra la función `aceptarEntrega()`. |
| 613 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Entrega: solo con el PIN de 4 digitos correcto."* |
| 614 | `public function confirmarEntrega($idPedido, $idDomiciliario, $pin)` | Método `confirmarEntrega($idPedido, $idDomiciliario, $pin)`: entrega el pedido, solo con el PIN correcto. Lo usa `OrderController::deliver()`. |
| 615 | `{` | Abre la función `confirmarEntrega()`. |
| 616 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "trae el PIN, el estado, el domiciliario, el cliente, los puntos y el total del pedido". |
| 617 | `"SELECT pin_entrega, estado, id_domiciliario, id_cliente, puntos_ganados, total FROM PEDIDO WHERE id_pedido = ?"` | ↑ (sigue la misma instrucción) |
| 618 | `);` | ↑ (sigue la misma instrucción) |
| 619 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 620 | `$stmt->execute();` | Ejecuta la consulta. |
| 621 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 622 | `$stmt->close();` | Cierra la consulta. |
| 624 | `if (!$row \|\| $row['estado'] !== 'en_camino' \|\| $row['id_domiciliario'] !== $idDomiciliario) {` | Si no existe, o no va en camino, o no es de este domiciliario... |
| 625 | `throw new Exception('No puedes confirmar la entrega de este pedido.');` | ...lanza el error "No puedes confirmar la entrega de este pedido.". |
| 626 | `}` | Cierra el `if`. |
| 627 | `if (!hash_equals($row['pin_entrega'], $pin)) {` | Si el PIN no es igual al del pedido (`hash_equals` los compara de forma segura)... |
| 628 | `throw new Exception('PIN incorrecto.');` | ...lanza el error "PIN incorrecto.". |
| 629 | `}` | Cierra el `if`. |
| 631 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 632 | `try {` | Intenta... |
| 633 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Al entregar, el pago queda aprobado (en efectivo se cobro en la puerta)."* |
| 634 | `$stmtU = $this->conn->prepare(` | ...prepara la consulta: "pasa el pedido a 'entregado', el pago a 'aprobado' y, si no tenía fecha de pago, pone la de ahora (`COALESCE`)". |
| 635 | `"UPDATE PEDIDO SET estado = 'entregado',` | ↑ (sigue la misma instrucción) |
| 636 | `estado_pago = 'aprobado',` | ↑ (sigue la misma instrucción) |
| 637 | `fecha_pago = COALESCE(fecha_pago, NOW())` | ↑ (sigue la misma instrucción) |
| 638 | `WHERE id_pedido = ?"` | ↑ (sigue la misma instrucción) |
| 639 | `);` | ↑ (sigue la misma instrucción) |
| 640 | `$stmtU->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 641 | `$stmtU->execute();` | Ejecuta la consulta. |
| 642 | `$stmtU->close();` | Cierra la consulta. |
| 644 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Puntos de fidelidad y total gastado del cliente (un invitado no tiene cuenta)."* |
| 645 | `if ($row['id_cliente'] !== null) {` | ...si el pedido tiene cliente registrado (no es invitado)... |
| 646 | `$puntos = (int) $row['puntos_ganados'];` | ...guarda los puntos que ganó. |
| 647 | `$total = (float) $row['total'];` | ...guarda el total. |
| 648 | `$stmtC = $this->conn->prepare(` | ...prepara la consulta: "súmale al cliente los puntos y el total gastado". |
| 649 | `"UPDATE CLIENTE SET puntos_fidelidad = puntos_fidelidad + ?, total_gastado = total_gastado + ? WHERE id_cliente = ?"` | ↑ (sigue la misma instrucción) |
| 650 | `);` | ↑ (sigue la misma instrucción) |
| 651 | `$stmtC->bind_param("idi", $puntos, $total, $row['id_cliente']);` | Llena los `?` de la consulta, en orden: `$puntos` (número entero), `$total` (número con decimales), `$row['id_cliente']` (número entero). |
| 652 | `$stmtC->execute();` | Ejecuta la consulta. |
| 653 | `$stmtC->close();` | Cierra la consulta. |
| 654 | `}` | Cierra el `if`. |
| 656 | `$this->conn->commit();` | ...confirma la transacción. |
| 657 | `} catch (Exception $e) {` | Si algo falló... |
| 658 | `$this->conn->rollback();` | ...deshace todo. |
| 659 | `throw $e;` | ...y lanza el error. |
| 660 | `}` | Cierra el `catch`. |
| 662 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Notificacion push al cliente; si falla, la entrega ya quedo confirmada."* |
| 663 | `if ($row['id_cliente'] === null) {` | Si el cliente es invitado (sin cuenta)... |
| 664 | `return;` | ...termina (no hay a quién enviar la notificación). |
| 665 | `}` | Cierra el `if`. |
| 666 | `try {` | Intenta... |
| 667 | `$pushService = new PushNotificationService();` | ...crea el servicio de notificaciones. |
| 668 | `$pushService->notificarPedidoEntregado($idPedido, (int) $row['id_cliente']);` | ...le avisa al cliente que su pedido llegó (`notificarPedidoEntregado()` de `models/PushNotificationService.php`). |
| 669 | `} catch (Exception $e) {` | Si el envío falla (por ejemplo, el servidor de notificaciones no responde)... |
| 670 | `error_log('No se pudo enviar la notificacion push de entrega: ' . $e->getMessage());` | ...lo anota en el archivo de errores. La entrega ya quedó guardada. |
| 671 | `}` | Cierra el `catch`. |
| 672 | `}` | Cierra la función `confirmarEntrega()`. |
| 674-677 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"El admin corrige la direccion de un pedido que aun no se entrega. Las coordenadas se borran para que el mapa del domiciliario vuelva a ubicarla."* |
| 678 | `public function cambiarDireccion($idPedido, $direccion)` | Método `cambiarDireccion($idPedido, $direccion)`: el administrador cambia la dirección de un pedido que todavía no se entrega. Lo usa `OrderController::updateAddress()`. |
| 679 | `{` | Abre la función `cambiarDireccion()`. |
| 680 | `$direccion = trim((string) $direccion);` | Le quita los espacios a la dirección. |
| 681 | `if ($direccion === '') {` | Si quedó vacía... |
| 682 | `throw new InvalidArgumentException('La dirección es obligatoria.');` | ...lanza el error "La dirección es obligatoria.". |
| 683 | `}` | Cierra el `if`. |
| 685 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "cambia la dirección y borra las coordenadas (para que el domiciliario la vuelva a ubicar en el mapa), solo si el pedido no se ha entregado". |
| 686 | `"UPDATE PEDIDO SET direccion_entrega = ?, destino_lat = NULL, destino_lng = NULL` | ↑ (sigue la misma instrucción) |
| 687 | `WHERE id_pedido = ? AND estado IN ('pendiente', 'en_preparacion', 'listo', 'en_camino')"` | ↑ (sigue la misma instrucción) |
| 688 | `);` | ↑ (sigue la misma instrucción) |
| 689 | `$stmt->bind_param("si", $direccion, $idPedido);` | Llena los `?` de la consulta, en orden: `$direccion` (texto), `$idPedido` (número entero). |
| 690 | `$stmt->execute();` | Ejecuta la consulta. |
| 691 | `$cambiadas = $stmt->affected_rows;` | Guarda cuántas filas cambiaron (`affected_rows`). |
| 692 | `$stmt->close();` | Cierra la consulta. |
| 694 | `if ($cambiadas === 0 && $this->pedidoModel->buscarCrudo($idPedido)['direccion_entrega'] !== $direccion) {` | Si no cambió nada y la dirección guardada es distinta (o sea, el pedido ya se entregó)... |
| 695 | `throw new Exception('Este pedido ya fue entregado y no se puede cambiar su dirección.');` | ...lanza el error "Este pedido ya fue entregado y no se puede cambiar su dirección.". |
| 696 | `}` | Cierra el `if`. |
| 697 | `}` | Cierra la función `cambiarDireccion()`. |
| 699 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Coordenadas del destino que el domiciliario ubico en el mapa (solo de su pedido en curso)."* |
| 700 | `public function guardarDestino($idPedido, $idDomiciliario, $lat, $lng)` | Método `guardarDestino(...)`: guarda las coordenadas del destino que el domiciliario marcó en el mapa. Lo usa `OrderController::updateDestination()`. |
| 701 | `{` | Abre la función `guardarDestino()`. |
| 702 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda la latitud y longitud del destino, solo si el pedido es de este domiciliario y está listo o en camino". |
| 703 | `"UPDATE PEDIDO SET destino_lat = ?, destino_lng = ?` | ↑ (sigue la misma instrucción) |
| 704 | `WHERE id_pedido = ? AND id_domiciliario = ? AND estado IN ('listo', 'en_camino')"` | ↑ (sigue la misma instrucción) |
| 705 | `);` | ↑ (sigue la misma instrucción) |
| 706 | `$stmt->bind_param("ddis", $lat, $lng, $idPedido, $idDomiciliario);` | Llena los `?` de la consulta, en orden: `$lat` (número con decimales), `$lng` (número con decimales), `$idPedido` (número entero), `$idDomiciliario` (texto). |
| 707 | `$stmt->execute();` | Ejecuta la consulta. |
| 708 | `$stmt->close();` | Cierra la consulta. |
| 709 | `}` | Cierra la función `guardarDestino()`. |
| 711 | `private function transicion($idPedido, $desdeValidos, $hacia)` | Método `transicion($idPedido, $desdeValidos, $hacia)` (privado): cambia el estado del pedido, solo si el estado actual es uno de los permitidos. Lo usan `marcarPreparando()` y `marcarListo()`. |
| 712 | `{` | Abre la función `transicion()`. |
| 713 | `$stmt = $this->conn->prepare("SELECT estado FROM PEDIDO WHERE id_pedido = ?");` | Prepara la consulta: "trae el estado del pedido". |
| 714 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 715 | `$stmt->execute();` | Ejecuta la consulta. |
| 716 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 717 | `$stmt->close();` | Cierra la consulta. |
| 719 | `if (!$row \|\| !in_array($row['estado'], $desdeValidos, true)) {` | Si no existe o su estado no está en la lista permitida... |
| 720 | `throw new Exception('Transición de estado no permitida.');` | ...lanza el error "Transición de estado no permitida.". |
| 721 | `}` | Cierra el `if`. |
| 723 | `$stmtU = $this->conn->prepare("UPDATE PEDIDO SET estado = ? WHERE id_pedido = ?");` | Prepara la consulta: "cambia el estado del pedido al nuevo". |
| 724 | `$stmtU->bind_param("si", $hacia, $idPedido);` | Llena los `?` de la consulta, en orden: `$hacia` (texto), `$idPedido` (número entero). |
| 725 | `$stmtU->execute();` | Ejecuta la consulta. |
| 726 | `$stmtU->close();` | Cierra la consulta. |
| 727 | `}` | Cierra la función `transicion()`. |
| 729 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 730 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Resena"* |
| 731 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 733 | `public function calificar($idPedido, $puntaje, $comentario)` | Método `calificar($idPedido, $puntaje, $comentario)`: guarda la calificación del pedido. Si ya tenía una, la cambia. Lo usa `OrderController::review()`. |
| 734 | `{` | Abre la función `calificar()`. |
| 735 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda en `RESENA` las estrellas y el comentario; si ya había una reseña de ese pedido (`ON DUPLICATE KEY UPDATE`), la actualiza". |
| 736 | `"INSERT INTO RESENA (id_pedido, puntaje, comentario)` | ↑ (sigue la misma instrucción) |
| 737 | `VALUES (?, ?, ?)` | ↑ (sigue la misma instrucción) |
| 738 | `ON DUPLICATE KEY UPDATE puntaje = VALUES(puntaje), comentario = VALUES(comentario)"` | ↑ (sigue la misma instrucción) |
| 739 | `);` | ↑ (sigue la misma instrucción) |
| 740 | `$stmt->bind_param("iis", $idPedido, $puntaje, $comentario);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero), `$puntaje` (número entero), `$comentario` (texto). |
| 741 | `$stmt->execute();` | Ejecuta la consulta. |
| 742 | `$stmt->close();` | Cierra la consulta. |
| 743 | `}` | Cierra la función `calificar()`. |
| 744 | `}` | Cierra la clase `PedidoService`. |
| 745 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado | `Failed to open stream` |
| el método `crear()` | hacer pedidos (cliente) | `Call to undefined method PedidoService::crear()` |
| el método `crearManual()` | registrar pedidos por llamada o WhatsApp | `Call to undefined method PedidoService::crearManual()` |
| el método `guardar()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp | `Call to undefined method PedidoService::guardar()` |
| el método `buscarCliente()` | hacer pedidos (cliente), empezar un pago en línea | `Call to undefined method PedidoService::buscarCliente()` |
| el método `buscarClientePorTelefono()` | registrar pedidos por llamada o WhatsApp | `Call to undefined method PedidoService::buscarClientePorTelefono()` |
| el método `calcular()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method PedidoService::calcular()` |
| el método `sumarPrecios()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method PedidoService::sumarPrecios()` |
| el método `cotizar()` | empezar un pago en línea | `Call to undefined method PedidoService::cotizar()` |
| el método `productoPersonalizadoOculto()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method PedidoService::productoPersonalizadoOculto()` |
| el método `resolverIngredientes()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method PedidoService::resolverIngredientes()` |
| el método `descuentoCumpleanos()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method PedidoService::descuentoCumpleanos()` |
| el método `marcarPreparando()` | pasar pedidos a "En preparación" | `Call to undefined method PedidoService::marcarPreparando()` |
| el método `marcarListo()` | pasar pedidos a "Listo" | `Call to undefined method PedidoService::marcarListo()` |
| el método `registrarAyudante()` | pasar pedidos a "En preparación", pasar pedidos a "Listo" | `Call to undefined method PedidoService::registrarAyudante()` |
| el método `bloquearPedido()` | tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino") | `Call to undefined method PedidoService::bloquearPedido()` |
| el método `tomarPedido()` | tomar pedidos (domiciliario) | `Call to undefined method PedidoService::tomarPedido()` |
| el método `liberarPedido()` | soltar pedidos (domiciliario) | `Call to undefined method PedidoService::liberarPedido()` |
| el método `aceptarEntrega()` | salir a entregar ("En camino") | `Call to undefined method PedidoService::aceptarEntrega()` |
| el método `confirmarEntrega()` | entregar pedidos con el PIN | `Call to undefined method PedidoService::confirmarEntrega()` |
| el método `cambiarDireccion()` | cambiar la dirección de un pedido | `Call to undefined method PedidoService::cambiarDireccion()` |
| el método `guardarDestino()` | guardar el destino en el mapa del domiciliario | `Call to undefined method PedidoService::guardarDestino()` |
| el método `transicion()` | pasar pedidos a "En preparación", pasar pedidos a "Listo" | `Call to undefined method PedidoService::transicion()` |
| el método `calificar()` | calificar pedidos | `Call to undefined method PedidoService::calificar()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
