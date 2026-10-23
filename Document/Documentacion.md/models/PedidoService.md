# models/PedidoService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Tiene las reglas de los pedidos: crearlos, cambiar su estado y entregarlos.

## ¿Qué hace?
- crea el pedido del cliente
- crea el pedido por llamada o WhatsApp (en efectivo o con link de pago)
- muestra el pedido del link de pago, cobra el link y lo manda a cocina cuando se paga
- cancela los links de pago vencidos y devuelve el inventario
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
| `pedidoPorLink()` | datos del pedido para la página del link de pago | `PaymentLinkController::show()` |
| `iniciarPagoLink()` | empieza el pago del link | `PaymentLinkController::pay()` |
| `consultarPagoLink()` | revisa el pago del link; si se aprobó, manda el pedido a cocina | `PaymentLinkController::status()` |
| `cancelarLinksVencidos()` | cancela los pedidos con link vencido y devuelve el inventario | `SyncController::index()`, `PedidoService::pedidoPorLink()`, `PedidoService::iniciarPagoLink()` |
| `filaPorCodigo()` (privado) | busca el pedido por el código del link | `PedidoService::pedidoPorLink()`, `PedidoService::iniciarPagoLink()`, `PedidoService::consultarPagoLink()` |
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
| 14 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Minutos que dura el link de pago de un pedido manual antes de cancelarse solo."* |
| 15 | `const MINUTOS_LINK_PAGO = 30;` | Constante `MINUTOS_LINK_PAGO`: el link de pago dura **30 minutos**. Si se quiere más o menos tiempo, se cambia solo este número. |
| 17 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 18 | `private $pedidoModel;` | Cajita `$pedidoModel` de la clase: aquí se guarda el modelo `Pedido`. |
| 20 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 21 | `{` | Abre la función `__construct()`. |
| 22 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 23 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 24 | `$this->pedidoModel = new Pedido();` | Crea el modelo `Pedido` y lo guarda en `$this->pedidoModel`, para usarlo en las funciones de abajo. |
| 25 | `}` | Cierra la función `__construct()`. |
| 27 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 28 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Creacion (checkout)"* |
| 29 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 31-34 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea un pedido web del cliente. Recalcula precios en el servidor, valida horario y pago, y en una transaccion guarda el pedido y descuenta el inventario."* |
| 35 | `public function crear($idCliente, $payload)` | Método `crear($idCliente, $payload)`: crea el pedido que hace el cliente desde la página. `$payload` = lo que mandó la pantalla. Lo usa `OrderController::store()`. |
| 36 | `{` | Abre la función `crear()`. |
| 37 | `$configModel = new Configuracion();` | Crea el modelo `Configuracion`. |
| 38 | `if (!$configModel->tiendaAbiertaAhora()) {` | Si la tienda no está abierta ahora (`tiendaAbiertaAhora()`)... |
| 39 | `throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden procesar pagos.');` | ...lanza el error "La tienda está cerrada o pausada en este momento...". |
| 40 | `}` | Cierra el `if`. |
| 42 | `if (empty($payload['items'])) {` | Si el pedido no tiene productos... |
| 43 | `throw new InvalidArgumentException('El pedido no tiene ítems.');` | ...lanza el error "El pedido no tiene ítems." (`InvalidArgumentException` = error por datos mal enviados). |
| 44 | `}` | Cierra el `if`. |
| 46 | `$cliente = $this->buscarCliente($idCliente);` | Busca al cliente (`buscarCliente()` de abajo). |
| 47 | `if (!$cliente) {` | Si no existe... |
| 48 | `throw new InvalidArgumentException('Cliente no encontrado.');` | ...lanza el error "Cliente no encontrado.". |
| 49 | `}` | Cierra el `if`. |
| 51 | `$calculo = $this->calcular($cliente, $payload, $configModel, !empty($payload['usePoints']));` | Calcula precios, descuentos y total en el servidor (`calcular()` de abajo). El último dato dice si quiere usar sus puntos. |
| 52 | `$total = $calculo['total'];` | Guarda el total en `$total`. |
| 54 | `$esEfectivo = ($payload['paymentMethod'] ?? 'online') === 'cash';` | `$esEfectivo` = `true` si va a pagar en efectivo (`'cash'`). |
| 55 | `$bancosValidos = ['nequi', 'daviplata', 'bancolombia'];` | Lista de bancos permitidos. |
| 56 | `$pago = [` | Arma `$pago` con los datos del pago: |
| 57 | `'metodo'      => $esEfectivo ? 'efectivo' : 'digital',` | el método: `'efectivo'` o `'digital'`, |
| 58 | `'banco'       => (!$esEfectivo && in_array($payload['bank'] ?? '', $bancosValidos, true)) ? $payload['bank'] : null,` | el banco (solo si es digital y es un banco permitido; si no, `null`), |
| 59 | `'estado'      => 'pendiente',` | el estado: `'pendiente'`, |
| 60 | `'fecha'       => null,` | la fecha del pago (todavía ninguna), |
| 61 | `'comprobante' => null,` | y el comprobante (todavía ninguno). |
| 62 | `];` | Cierra la lista. |
| 64 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pago digital: se verifica la transaccion antes de crear nada."* |
| 65 | *(comentario)* | Comentario: no se ejecuta. Dice: *"En efectivo el pago queda 'pendiente' hasta la entrega."* |
| 66 | `if (!$esEfectivo) {` | Si **no** es en efectivo (pagó en línea)... |
| 67 | `$pagoService = new PagoService();` | ...crea el modelo `PagoService`. |
| 68 | `$transaccion = $pagoService->verificarTransaccion((string) ($payload['paymentTransactionId'] ?? ''), $total, $idCliente);` | ...revisa que el pago esté aprobado y sea por el total exacto (`verificarTransaccion()` de `models/PagoService.php`). |
| 70 | `$stmt = $this->conn->prepare("SELECT id_pedido FROM PEDIDO WHERE comprobante_pago = ? LIMIT 1");` | ...prepara la consulta: "busca si otro pedido ya usó este pago". |
| 71 | `$stmt->bind_param("s", $transaccion['id']);` | Llena los `?` de la consulta, en orden: `$transaccion['id']` (texto). |
| 72 | `$stmt->execute();` | Ejecuta la consulta. |
| 73 | `$yaUsada = $stmt->get_result()->fetch_assoc();` | ...lo guarda en `$yaUsada`. |
| 74 | `$stmt->close();` | Cierra la consulta. |
| 75 | `if ($yaUsada) {` | ...si ya lo usó otro pedido... |
| 76 | `throw new Exception('Este pago ya fue usado en otro pedido.');` | ...lanza el error "Este pago ya fue usado en otro pedido.". |
| 77 | `}` | Cierra el `if`. |
| 78 | `$pago['comprobante'] = $transaccion['id'];` | ...guarda el número del pago como comprobante. |
| 79 | `$pago['estado'] = 'aprobado';` | ...el pago queda `'aprobado'`. |
| 80 | `$pago['fecha'] = date('Y-m-d H:i:s');` | ...con la fecha y hora de ahora. |
| 81 | `}` | Cierra el `if`. |
| 83 | `$idPedido = $this->guardar([` | Guarda el pedido (`guardar()` de abajo) con estos datos de destino: |
| 84 | `'id_cliente' => $idCliente,` | el cliente, |
| 85 | `'id_admin'   => null,` | sin administrador (lo hizo el cliente), |
| 86 | `'nombre'     => null,` | sin nombre de contacto, |
| 87 | `'telefono'   => null,` | sin teléfono de contacto, |
| 88 | `'direccion'  => $payload['address'] ?? $cliente['direccion'],` | la dirección (si no mandó, la de su perfil), |
| 89 | `'lat'        => $payload['lat'] ?? null,` | la latitud, |
| 90 | `'lng'        => $payload['lng'] ?? null,` | la longitud, |
| 91 | `'canal'      => 'web',` | el canal: `'web'`, |
| 92 | `'estado'     => 'pendiente',` | el estado inicial: `'pendiente'` (va directo a cocina), |
| 93 | `'codigo_pago' => null,` | sin link de pago, |
| 94 | `'vence_pago'  => null,` | y sin fecha de vencimiento del link. |
| 95 | `], $pago, $calculo, $configModel);` | ...más el pago, el cálculo y la configuración. Guarda el número del pedido en `$idPedido`. |
| 97 | `return $this->pedidoModel->buscar($idPedido, 'client', $idCliente);` | Devuelve el pedido como lo ve el cliente (`buscar()` de `models/Pedido.php`). |
| 98 | `}` | Cierra la función `crear()`. |
| 100-108 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pedido manual que el administrador registra por llamada o WhatsApp. Si el celular pertenece a un cliente registrado, el pedido queda en su cuenta; si no, queda como cliente invitado. Forma de pago (paymentMode): 'efectivo': se cobra al entregar y el pedido va directo a cocina. 'link': queda 'esperando_pago' con un link que vence en MINUTOS_LINK_PAGO; cuando el cliente paga pasa a 'pendiente' (cocina). Si no paga, se cancela."* |
| 109 | `public function crearManual($idAdmin, $payload)` | Método `crearManual($idAdmin, $payload)`: crea un pedido que llegó por llamada o WhatsApp. Se paga en efectivo al entregar **o** por un link de pago. Lo usa `OrderController::storeManual()`. |
| 110 | `{` | Abre la función `crearManual()`. |
| 111 | `$configModel = new Configuracion();` | Crea el modelo `Configuracion`. |
| 112 | `if (!$configModel->tiendaAbiertaAhora()) {` | Si la tienda no está abierta... |
| 113 | `throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden registrar pedidos.');` | ...lanza el error. |
| 114 | `}` | Cierra el `if`. |
| 116 | `$nombre    = trim((string) ($payload['clientName'] ?? ''));` | Guarda en `$nombre` el nombre del cliente. |
| 117 | `$telefono  = preg_replace('/\D/', '', (string) ($payload['clientPhone'] ?? ''));` | Guarda en `$telefono` solo los números del celular. |
| 118 | `$direccion = trim((string) ($payload['address'] ?? ''));` | Guarda en `$direccion` la dirección. |
| 119 | `$canal     = in_array($payload['channel'] ?? '', ['llamada', 'whatsapp'], true) ? $payload['channel'] : 'llamada';` | Guarda en `$canal` si fue por `'llamada'` o `'whatsapp'` (si no, `'llamada'`). |
| 121 | `$porLink   = ($payload['paymentMode'] ?? 'efectivo') === 'link';` | Guarda en `$porLink` si el administrador eligió **Link de pago** (`true`) o efectivo (`false`). Si la pantalla no manda nada, se toma efectivo. |
| 123 | `$cliente = $this->buscarClientePorTelefono($telefono);` | Busca si ese celular es de un cliente registrado (`buscarClientePorTelefono()` de abajo). |
| 124 | `$calculo = $this->calcular($cliente, $payload, $configModel, false);` | Calcula precios y total (sin usar puntos). |
| 126 | `$idPedido = $this->guardar([` | Guarda el pedido con estos datos de destino: |
| 127 | `'id_cliente' => $cliente ? $cliente['id_cliente'] : null,` | el cliente si está registrado; si no, `null` (cliente invitado), |
| 128 | `'id_admin'   => $idAdmin,` | el administrador que lo registró, |
| 129 | `'nombre'     => $nombre,` | el nombre, |
| 130 | `'telefono'   => $telefono,` | el teléfono, |
| 131 | `'direccion'  => $direccion,` | la dirección, |
| 132 | `'lat'        => null,` | sin latitud, |
| 133 | `'lng'        => null,` | sin longitud, |
| 134 | `'canal'      => $canal,` | el canal, |
| 135 | `'estado'     => $porLink ? 'esperando_pago' : 'pendiente',` | el estado: con link, `'esperando_pago'` (no va a cocina todavía); en efectivo, `'pendiente'`, |
| 136 | `'codigo_pago' => $porLink ? bin2hex(random_bytes(16)) : null,` | con link, un código secreto de 32 letras y números al azar (`random_bytes`): es la llave del link. En efectivo, `null`, |
| 137 | `'vence_pago'  => $porLink ? date('Y-m-d H:i:s', time() + self::MINUTOS_LINK_PAGO * 60) : null,` | y con link, hasta cuándo sirve: la hora de ahora (`time()`) más 30 minutos (`MINUTOS_LINK_PAGO * 60` segundos). En efectivo, `null`. |
| 138 | `], [` | ...y el pago: |
| 139 | `'metodo' => $porLink ? 'digital' : 'efectivo', 'banco' => null, 'estado' => 'pendiente', 'fecha' => null, 'comprobante' => null,` | con link, pago `'digital'`; si no, `'efectivo'`. Sin banco todavía (se sabe cuando el cliente paga), pendiente, sin fecha y sin comprobante, |
| 140 | `], $calculo, $configModel);` | ...más el cálculo y la configuración. |
| 142 | `return $this->pedidoModel->buscar($idPedido, 'admin', $idAdmin);` | Devuelve el pedido como lo ve el administrador. |
| 143 | `}` | Cierra la función `crearManual()`. |
| 145-147 | *(comentario)* | Comentario: no se ejecuta. Es un título: *"Pago por link (pedido manual)"*. |
| 149-152 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Datos que ve el cliente al abrir el link de pago. Null si el codigo no existe. El PIN de entrega solo se muestra cuando el pedido ya esta pagado."* |
| 153 | `public function pedidoPorLink($codigo)` | Método `pedidoPorLink($codigo)`: arma los datos que ve el cliente en la página del link (`/pagar?c=...`). Lo usa `PaymentLinkController::show()`. |
| 154 | `{` | Abre la función `pedidoPorLink()`. |
| 155 | `$this->cancelarLinksVencidos();` | Primero cancela los links vencidos (`cancelarLinksVencidos()` de abajo), para que este pedido muestre su estado real. |
| 157 | `$fila = $this->filaPorCodigo($codigo);` | Busca el pedido por el código del link (`filaPorCodigo()` de abajo) y lo guarda en `$fila`. |
| 158 | `if (!$fila) {` | Si no existe... |
| 159 | `return null;` | ...devuelve `null` (el controlador responde 404). |
| 160 | `}` | Cierra el `if`. |
| 162 | `$pagado = !in_array($fila['estado'], ['esperando_pago', 'cancelado'], true);` | Guarda en `$pagado` si ya se pagó: es `true` cuando el estado **no** (`!`) es "esperando pago" ni "cancelado". |
| 163 | `$items = [];` | Crea la lista vacía `$items` para los productos. |
| 164 | `foreach ($this->pedidoModel->itemsDe($fila['id_pedido']) as $item) {` | Recorre los productos del pedido (`itemsDe()` de `models/Pedido.php`): |
| 165 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Foto del producto para mostrarla en la pagina de pago."* |
| 166 | `$stmtF = $this->conn->prepare("SELECT imagen FROM PRODUCTO WHERE id_producto = ?");` | Prepara la consulta: "trae la foto (`imagen`) del producto". |
| 167 | `$stmtF->bind_param("i", $item['productId']);` | Llena el `?` con el número del producto (número entero). |
| 168 | `$stmtF->execute();` | Ejecuta la consulta. |
| 169 | `$producto = $stmtF->get_result()->fetch_assoc();` | Guarda el producto (con su foto) en `$producto`. |
| 170 | `$stmtF->close();` | Cierra la consulta. |
| 172 | `$items[] = [` | Agrega a la lista un producto con solo lo que necesita la página: |
| 173 | `'image'    => $producto ? $producto['imagen'] : null,` | la foto del producto (si el producto ya no existe, `null` y la página pone una foto por defecto), |
| 174 | `'name'     => $item['name'],` | el nombre, |
| 175 | `'quantity' => $item['quantity'],` | la cantidad, |
| 176 | `'price'    => $item['price'],` | el precio, |
| 177 | `'extras'   => $item['extras'],` | los ingredientes extra, |
| 178 | `'removed'  => $item['removed'],` | y lo que se le quitó. |
| 179 | `];` | Cierra el producto. |
| 180 | `}` | Cierra el `foreach`. |
| 182 | `return [` | Devuelve la lista con los datos para la página: |
| 183 | `'id'           => '#ORD-' . $fila['id_pedido'],` | `'id'`: el código del pedido, por ejemplo `#ORD-15`. |
| 184 | `'status'       => $pagado ? 'pagado' : ($fila['estado'] === 'cancelado' ? 'vencido' : 'esperando_pago'),` | `'status'`: `'pagado'`, `'vencido'` (si se canceló) o `'esperando_pago'`. |
| 185 | `'client'       => $fila['cliente_nombre'],` | `'client'`: el nombre del cliente. |
| 186 | `'address'      => $fila['direccion_entrega'],` | `'address'`: la dirección de entrega. |
| 187 | `'items'        => $items,` | `'items'`: los productos. |
| 188 | `'subtotal'     => (float) $fila['subtotal'],` | `'subtotal'`: lo que suman los productos. |
| 189 | `'shipping'     => (float) $fila['costo_domicilio'],` | `'shipping'`: el domicilio. |
| 190 | `'total'        => (float) $fila['total'],` | `'total'`: lo que hay que pagar. |
| 191 | `'expiresAt'    => $fila['vence_pago'],` | `'expiresAt'`: hasta cuándo sirve el link (la página muestra la cuenta regresiva). |
| 192 | `'deliveryPin'  => $pagado ? $fila['pin_entrega'] : null,` | `'deliveryPin'`: el código de entrega, **solo si ya pagó**. Si no, `null`. |
| 193 | `'isGuest'      => $fila['id_cliente'] === null,` | `'isGuest'`: `true` si no tiene cuenta (la página le muestra la invitación a registrarse). |
| 194 | `'pointsEarned' => (int) $fila['puntos_ganados'],` | `'pointsEarned'`: los puntos que da este pedido (para la invitación). |
| 195 | `'bank'         => $fila['banco_digital'],` | `'bank'`: con qué banco pagó (o `null`). |
| 196 | `];` | Cierra la lista. |
| 197 | `}` | Cierra la función `pedidoPorLink()`. |
| 199 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Crea la transaccion de prueba para pagar el pedido del link."* |
| 200 | `public function iniciarPagoLink($codigo, $metodo, $telefono)` | Método `iniciarPagoLink(...)`: empieza el pago del link con el banco y el celular que eligió el cliente. Lo usa `PaymentLinkController::pay()`. |
| 201 | `{` | Abre la función `iniciarPagoLink()`. |
| 202 | `$this->cancelarLinksVencidos();` | Primero cancela los links vencidos. |
| 204 | `$fila = $this->filaPorCodigo($codigo);` | Busca el pedido por el código del link. |
| 205 | `if (!$fila) {` | Si no existe... |
| 206 | `throw new InvalidArgumentException('Este link de pago no existe.');` | ...lanza el error "Este link de pago no existe.". |
| 207 | `}` | Cierra el `if`. |
| 208 | `if ($fila['estado'] !== 'esperando_pago') {` | Si el pedido ya no está esperando el pago... |
| 209 | `throw new InvalidArgumentException($fila['estado'] === 'cancelado'` | ...lanza un error: si está cancelado... |
| 210 | `? 'Este link de pago ya venció. Comunícate con el restaurante.'` | ...dice "Este link de pago ya venció..."; |
| 211 | `: 'Este pedido ya fue pagado.');` | si no, dice "Este pedido ya fue pagado." (así no se cobra dos veces). |
| 212 | `}` | Cierra el `if`. |
| 213 | `if (strtotime($fila['vence_pago']) <= time()) {` | Si la hora de vencimiento ya pasó (`strtotime` la vuelve número para compararla con `time()`, la hora de ahora)... |
| 214 | `throw new InvalidArgumentException('Este link de pago ya venció. Comunícate con el restaurante.');` | ...lanza el error "Este link de pago ya venció...". |
| 215 | `}` | Cierra el `if`. |
| 217 | `$pagoService = new PagoService();` | Crea el servicio de pagos. |
| 218 | `return $pagoService->crearTransaccionDePedido((int) $fila['id_pedido'], (float) $fila['total'], $metodo, $telefono);` | Crea el pago de prueba con el total **guardado en el pedido** (`crearTransaccionDePedido()` de `models/PagoService.php`) y lo devuelve. |
| 219 | `}` | Cierra la función `iniciarPagoLink()`. |
| 221-224 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Consulta la transaccion del link. Si ya quedo aprobada, marca el pedido como pagado y lo manda a cocina (pasa de 'esperando_pago' a 'pendiente')."* |
| 225 | `public function consultarPagoLink($codigo, $idTransaccion)` | Método `consultarPagoLink(...)`: revisa cómo va el pago. Si se aprobó, manda el pedido a cocina. Lo usa `PaymentLinkController::status()`. |
| 226 | `{` | Abre la función `consultarPagoLink()`. |
| 227 | `$fila = $this->filaPorCodigo($codigo);` | Busca el pedido por el código del link. |
| 228 | `if (!$fila) {` | Si no existe... |
| 229 | `throw new InvalidArgumentException('Este link de pago no existe.');` | ...lanza el error "Este link de pago no existe.". |
| 230 | `}` | Cierra el `if`. |
| 232 | `$pagoService = new PagoService();` | Crea el servicio de pagos. |
| 233 | `$tx = $pagoService->obtenerTransaccionDePedido($idTransaccion, (int) $fila['id_pedido']);` | Busca el pago, pero solo si es de este pedido (`obtenerTransaccionDePedido()` de `models/PagoService.php`). Lo guarda en `$tx`. |
| 234 | `if (!$tx) {` | Si no existe (o es de otro pedido)... |
| 235 | `throw new InvalidArgumentException('Transacción no encontrada.');` | ...lanza el error "Transacción no encontrada.". |
| 236 | `}` | Cierra el `if`. |
| 238 | `if ($tx['status'] === 'APPROVED' && $fila['estado'] === 'esperando_pago') {` | Si el pago quedó aprobado (`'APPROVED'`) **y** el pedido seguía esperando el pago... |
| 239 | *(comentario)* | Comentario: no se ejecuta. Dice: *"fecha_hora = ahora: para cocina el pedido "llega" cuando se paga."* |
| 240 | `$stmt = $this->conn->prepare(` | ...prepara la consulta que marca el pedido como pagado: |
| 241 | `"UPDATE PEDIDO SET estado = 'pendiente', banco_digital = ?, estado_pago = 'aprobado',` | estado `'pendiente'` (así le aparece a cocina), el banco con que pagó y el pago aprobado, |
| 242 | `fecha_pago = NOW(), comprobante_pago = ?, fecha_hora = NOW()` | la fecha del pago, el número del pago como comprobante, y la hora del pedido pasa a ser ahora, |
| 243 | `WHERE id_pedido = ? AND estado = 'esperando_pago'"` | solo para este pedido y solo si sigue esperando el pago (así no se marca dos veces). |
| 244 | `);` | ↑ (sigue la misma instrucción) |
| 245 | `$stmt->bind_param("ssi", $tx['payment_method'], $tx['id'], $fila['id_pedido']);` | Llena los `?`: el banco y el número del pago (texto) y el número del pedido (número entero). |
| 246 | `$stmt->execute();` | Ejecuta la consulta. |
| 247 | `$stmt->close();` | Cierra la consulta. |
| 248 | `}` | Cierra el `if`. |
| 250 | `return $tx;` | Devuelve el pago (la página ve si quedó aprobado, rechazado o pendiente). |
| 251 | `}` | Cierra la función `consultarPagoLink()`. |
| 253-257 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cancela los pedidos con link de pago vencido y devuelve su inventario. Se llama al sincronizar y al abrir un link (no hace falta una tarea programada). Se deja 1 minuto de gracia para que termine un pago que empezo justo antes de vencer."* |
| 258 | `public function cancelarLinksVencidos()` | Método `cancelarLinksVencidos()`: cancela los pedidos cuyo link de pago venció y devuelve su inventario. Lo usan `SyncController::index()` y las funciones del link de arriba. |
| 259 | `{` | Abre la función `cancelarLinksVencidos()`. |
| 260 | `$stmt = $this->conn->prepare(` | Prepara la consulta: |
| 261 | `"SELECT id_pedido FROM PEDIDO` | trae el número de los pedidos... |
| 262 | `WHERE estado = 'esperando_pago' AND vence_pago < NOW() - INTERVAL 1 MINUTE"` | ...que siguen esperando el pago **y** cuyo link venció hace más de 1 minuto (`INTERVAL 1 MINUTE`). |
| 263 | `);` | ↑ (sigue la misma instrucción) |
| 264 | `$stmt->execute();` | Ejecuta la consulta. |
| 265 | `$vencidos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Guarda todos esos pedidos en `$vencidos`. |
| 266 | `$stmt->close();` | Cierra la consulta. |
| 268 | `$ingredienteModel = new Ingrediente();` | Crea el modelo `Ingrediente` (para devolver el inventario). |
| 269 | `foreach ($vencidos as $v) {` | Recorre cada pedido vencido (`$v`): |
| 270 | `$idPedido = (int) $v['id_pedido'];` | Guarda su número en `$idPedido`. |
| 271 | `$this->conn->begin_transaction();` | Empieza una transacción: se cancela y se devuelve el inventario juntos, o nada. |
| 272 | `try {` | Intenta... |
| 273 | `$stmtU = $this->conn->prepare("UPDATE PEDIDO SET estado = 'cancelado', estado_pago = 'rechazado' WHERE id_pedido = ? AND estado = 'esperando_pago'");` | ...preparar la consulta que pasa el pedido a `'cancelado'` y el pago a `'rechazado'`, solo si sigue esperando el pago. |
| 274 | `$stmtU->bind_param("i", $idPedido);` | Llena el `?` con `$idPedido` (número entero). |
| 275 | `$stmtU->execute();` | Ejecuta la consulta. |
| 276 | `$cambio = $stmtU->affected_rows;` | Guarda en `$cambio` cuántas filas cambió (`affected_rows`): 1 si lo canceló, 0 si otro ya lo había hecho. |
| 277 | `$stmtU->close();` | Cierra la consulta. |
| 279 | `if ($cambio > 0) {` | Si sí lo canceló... |
| 280 | `$ingredienteModel->devolverDePedido($idPedido);` | ...devuelve al inventario lo que se había descontado (`devolverDePedido()` de `models/Ingrediente.php`). |
| 281 | `}` | Cierra el `if`. |
| 282 | `$this->conn->commit();` | Confirma la transacción: guarda todo. |
| 283 | `} catch (Exception $e) {` | Si algo falló... |
| 284 | `$this->conn->rollback();` | ...deshace todo lo de este pedido... |
| 285 | `error_log('No se pudo cancelar el pedido vencido #' . $idPedido . ': ' . $e->getMessage());` | ...y escribe el error en el registro del servidor (`error_log`). Sigue con los demás pedidos. |
| 286 | `}` | Cierra el `catch`. |
| 287 | `}` | Cierra el `foreach`. |
| 288 | `}` | Cierra la función `cancelarLinksVencidos()`. |
| 290 | `private function filaPorCodigo($codigo)` | Método privado `filaPorCodigo($codigo)`: busca el pedido que tiene ese código de link. Lo usan las funciones del link de arriba. |
| 291 | `{` | Abre la función `filaPorCodigo()`. |
| 292 | `if (!preg_match('/^[a-f0-9]{32}$/', (string) $codigo)) {` | Si el código no tiene la forma correcta (32 letras de la `a` a la `f` y números)... |
| 293 | `return null;` | ...devuelve `null` sin buscar nada. |
| 294 | `}` | Cierra el `if`. |
| 295 | `$stmt = $this->conn->prepare(` | Prepara la consulta: |
| 296 | `"SELECT p.*, COALESCE(c.nombre, p.nombre_contacto) AS cliente_nombre` | trae todo el pedido y el nombre del cliente (el de su cuenta o, si es invitado, el que dictó: `COALESCE` toma el primero que no esté vacío)... |
| 297 | `FROM PEDIDO p LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente` | ...uniendo `PEDIDO` con `CLIENTE` (`LEFT JOIN`: aunque no tenga cuenta)... |
| 298 | `WHERE p.codigo_pago = ? LIMIT 1"` | ...del pedido con ese código de link. |
| 299 | `);` | ↑ (sigue la misma instrucción) |
| 300 | `$stmt->bind_param("s", $codigo);` | Llena el `?` con `$codigo` (texto). |
| 301 | `$stmt->execute();` | Ejecuta la consulta. |
| 302 | `$fila = $stmt->get_result()->fetch_assoc();` | Guarda el pedido en `$fila`. |
| 303 | `$stmt->close();` | Cierra la consulta. |
| 304 | `return $fila ?: null;` | Devuelve el pedido; si no encontró, `null` (`?:`). |
| 305 | `}` | Cierra la función `filaPorCodigo()`. |
| 307-310 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"En una sola transaccion: canjea los puntos (si aplica), guarda el pedido con sus productos y personalizaciones, y descuenta el inventario. Devuelve el id."* |
| 311 | `private function guardar($destino, $pago, $calculo, $configModel)` | Método `guardar(...)` (privado): guarda el pedido completo en una transacción: descuenta los puntos, guarda el pedido, sus productos y sus cambios, y descuenta el inventario. Lo usan `crear()` y `crearManual()`. |
| 312 | `{` | Abre la función `guardar()`. |
| 313 | `$puntos = (int) floor($calculo['total'] / 1000);` | Calcula los puntos que gana: 1 por cada $1.000 (`floor` redondea hacia abajo). |
| 315 | `$this->conn->begin_transaction();` | Empieza una transacción: todo se guarda junto, o nada. |
| 316 | `try {` | Intenta... |
| 317 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Canje de puntos: se vuelve a leer el saldo bloqueando la fila del cliente,"* |
| 318 | *(comentario)* | Comentario: no se ejecuta. Dice: *"asi dos pedidos simultaneos no pueden gastar los mismos puntos."* |
| 319 | `if ($calculo['puntosCanjeados'] > 0) {` | ...si va a usar puntos... |
| 320 | `$stmtS = $this->conn->prepare("SELECT puntos_fidelidad FROM CLIENTE WHERE id_cliente = ? FOR UPDATE");` | ...prepara la consulta: "trae los puntos del cliente y bloquéalo (`FOR UPDATE`)" para que dos pedidos al mismo tiempo no gasten los mismos puntos. |
| 321 | `$stmtS->bind_param("i", $destino['id_cliente']);` | Llena los `?` de la consulta, en orden: `$destino['id_cliente']` (número entero). |
| 322 | `$stmtS->execute();` | Ejecuta la consulta. |
| 323 | `$saldo = $stmtS->get_result()->fetch_assoc();` | ...guarda el resultado en `$saldo`. |
| 324 | `$stmtS->close();` | Cierra la consulta. |
| 325 | `if (!$saldo \|\| (int) $saldo['puntos_fidelidad'] < $calculo['puntosCanjeados']) {` | ...si no existe o no le alcanzan los puntos... |
| 326 | `throw new Exception('Tu saldo de puntos cambió. Revisa el pedido e intenta de nuevo.');` | ...lanza el error "Tu saldo de puntos cambió...". |
| 327 | `}` | Cierra el `if`. |
| 329 | `$stmtR = $this->conn->prepare("UPDATE CLIENTE SET puntos_fidelidad = puntos_fidelidad - ? WHERE id_cliente = ?");` | ...prepara la consulta: "réstale esos puntos al cliente". |
| 330 | `$stmtR->bind_param("ii", $calculo['puntosCanjeados'], $destino['id_cliente']);` | Llena los `?` de la consulta, en orden: `$calculo['puntosCanjeados']` (número entero), `$destino['id_cliente']` (número entero). |
| 331 | `$stmtR->execute();` | Ejecuta la consulta. |
| 332 | `$stmtR->close();` | Cierra la consulta. |
| 333 | `}` | Cierra el `if`. |
| 335 | `$values = [` | Arma `$values` con todos los datos del pedido, en orden: |
| 336 | `$destino['id_cliente'], $destino['id_admin'], $destino['nombre'], $destino['telefono'],` | cliente, administrador, nombre y teléfono de contacto, |
| 337 | `$destino['direccion'], $destino['lat'], $destino['lng'], $destino['canal'],` | dirección, latitud, longitud y canal, |
| 338 | `$pago['metodo'], $pago['banco'], $pago['estado'], $pago['fecha'], $pago['comprobante'],` | método de pago, banco, estado del pago, fecha y comprobante, |
| 339 | `$destino['codigo_pago'], $destino['vence_pago'],` | código del link de pago y hasta cuándo sirve, |
| 340 | `$calculo['subtotal'], $calculo['envio'], $calculo['descuento'],` | subtotal, domicilio, descuento de cumpleaños, |
| 341 | `$calculo['puntosCanjeados'], $calculo['descuentoPuntos'], $puntos, $calculo['total'],` | puntos usados, descuento por puntos, puntos ganados y total. |
| 342 | `];` | Cierra la lista. |
| 343 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Estado inicial: solo puede ser uno de estos dos valores fijos."* |
| 344 | `$estadoInicial = $destino['estado'] === 'esperando_pago' ? 'esperando_pago' : 'pendiente';` | Guarda en `$estadoInicial` el estado con el que nace el pedido: `'esperando_pago'` o `'pendiente'`. Como solo puede ser uno de esos dos textos fijos, se puede escribir directo en la consulta. |
| 345 | `$stmtP = $this->conn->prepare(` | Prepara la consulta: "guarda el pedido en `PEDIDO` con todos esos datos y el estado inicial (`$estadoInicial`)". |
| 346 | `"INSERT INTO PEDIDO` | ↑ (sigue la misma instrucción) |
| 347 | `(id_cliente, id_admin_registro, nombre_contacto, telefono_contacto,` | ↑ (sigue la misma instrucción) |
| 348 | `direccion_entrega, destino_lat, destino_lng, estado, canal_origen,` | ↑ (sigue la misma instrucción) |
| 349 | `metodo_pago, banco_digital, estado_pago, fecha_pago, comprobante_pago,` | ↑ (sigue la misma instrucción) |
| 350 | `codigo_pago, vence_pago,` | ↑ (sigue la misma instrucción) |
| 351 | `subtotal, costo_domicilio, descuento_cumpleanos,` | ↑ (sigue la misma instrucción) |
| 352 | `puntos_canjeados, descuento_puntos, puntos_ganados, total)` | ↑ (sigue la misma instrucción) |
| 353 | `VALUES (?, ?, ?, ?, ?, ?, ?, '$estadoInicial', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 354 | `);` | ↑ (sigue la misma instrucción) |
| 355 | `$stmtP->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 356 | `$stmtP->execute();` | Ejecuta la consulta. |
| 357 | `$stmtP->close();` | Cierra la consulta. |
| 358 | `$idPedido = $this->conn->insert_id;` | Guarda en `$idPedido` el número del pedido nuevo. |
| 360 | `$lineasDescuento = [];` | `$lineasDescuento` empieza vacía: aquí se anota todo lo que hay que descontar del inventario. |
| 362 | `foreach ($calculo['items'] as $item) {` | Recorre cada producto del pedido (`$item`). |
| 363 | `$producto = $item['producto'];` | Guarda el producto. |
| 364 | `$esPersonalizado = (!empty($item['extras']) \|\| !empty($item['removidos'])) ? 1 : 0;` | `$esPersonalizado` = 1 si tiene extras o le quitaron algo; si no, 0. |
| 366 | `$values = [$idPedido, $producto['id_producto'], $producto['nombre'], $item['cantidad'], $item['precioUnitario'], $esPersonalizado];` | Arma `$values`: el pedido, el producto, su nombre, la cantidad, el precio y si es personalizado. |
| 367 | `$stmtD = $this->conn->prepare(` | Prepara la consulta: "guarda este producto en `DETALLE_PEDIDO`". |
| 368 | `"INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, nombre_producto, cantidad, precio_unitario, es_personalizado)` | ↑ (sigue la misma instrucción) |
| 369 | `VALUES (?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 370 | `);` | ↑ (sigue la misma instrucción) |
| 371 | `$stmtD->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 372 | `$stmtD->execute();` | Ejecuta la consulta. |
| 373 | `$stmtD->close();` | Cierra la consulta. |
| 374 | `$idDetalle = $this->conn->insert_id;` | Guarda en `$idDetalle` el número de este detalle. |
| 376 | `foreach ($item['extras'] as $extra) {` | Recorre los ingredientes extra que pidió (`$extra`). |
| 377 | `$values = [$idDetalle, $extra['id_ingrediente'], $extra['nombre'], $extra['precio_extra']];` | Arma `$values`: el detalle, el ingrediente, su nombre y su precio. |
| 378 | `$stmtE = $this->conn->prepare(` | Prepara la consulta: "guarda en `PERSONALIZACION` que se **agregó** este ingrediente". |
| 379 | `"INSERT INTO PERSONALIZACION (id_detalle, id_ingrediente, nombre_ingrediente, accion_modificacion, cantidad, costo_aplicado)` | ↑ (sigue la misma instrucción) |
| 380 | `VALUES (?, ?, ?, 'agregar', 1, ?)"` | ↑ (sigue la misma instrucción) |
| 381 | `);` | ↑ (sigue la misma instrucción) |
| 382 | `$stmtE->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 383 | `$stmtE->execute();` | Ejecuta la consulta. |
| 384 | `$stmtE->close();` | Cierra la consulta. |
| 386 | `$lineasDescuento[] = [` | Anota en `$lineasDescuento` que hay que descontar ese ingrediente: |
| 387 | `'id_ingrediente' => $extra['id_ingrediente'],` | cuál, |
| 388 | `'cantidad'       => $item['cantidad'],` | cuánto (la cantidad del producto), |
| 389 | `'motivo'         => 'Extra pedido #ORD-' . $idPedido,` | y el motivo ("Extra pedido #ORD-.."). |
| 390 | `];` | Cierra los datos. |
| 391 | `}` | Cierra el `foreach`. |
| 393 | `foreach ($item['removidos'] as $removido) {` | Recorre los ingredientes que pidió quitar (`$removido`). |
| 394 | `$values = [$idDetalle, $removido['id_ingrediente'], $removido['nombre']];` | Arma `$values`: el detalle, el ingrediente y su nombre. |
| 395 | `$stmtQ = $this->conn->prepare(` | Prepara la consulta: "guarda en `PERSONALIZACION` que se **quitó** este ingrediente". |
| 396 | `"INSERT INTO PERSONALIZACION (id_detalle, id_ingrediente, nombre_ingrediente, accion_modificacion, cantidad, costo_aplicado)` | ↑ (sigue la misma instrucción) |
| 397 | `VALUES (?, ?, ?, 'quitar', 1, 0)"` | ↑ (sigue la misma instrucción) |
| 398 | `);` | ↑ (sigue la misma instrucción) |
| 399 | `$stmtQ->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 400 | `$stmtQ->execute();` | Ejecuta la consulta. |
| 401 | `$stmtQ->close();` | Cierra la consulta. |
| 402 | `}` | Cierra el `foreach`. |
| 404 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Receta base del producto (menos lo que se quito) por la cantidad pedida."* |
| 405 | `$idsRemovidos = array_column($item['removidos'], 'id_ingrediente');` | Guarda en `$idsRemovidos` los números de los ingredientes que quitó. |
| 406 | `$stmtR = $this->conn->prepare("SELECT id_ingrediente, cantidad_necesaria FROM RECETA WHERE id_producto = ?");` | Prepara la consulta: "trae la receta de este producto". |
| 407 | `$stmtR->bind_param("i", $producto['id_producto']);` | Llena los `?` de la consulta, en orden: `$producto['id_producto']` (número entero). |
| 408 | `$stmtR->execute();` | Ejecuta la consulta. |
| 409 | `$receta = $stmtR->get_result()->fetch_all(MYSQLI_ASSOC);` | La guarda en `$receta`. |
| 410 | `$stmtR->close();` | Cierra la consulta. |
| 412 | `foreach ($receta as $linea) {` | Recorre cada ingrediente de la receta (`$linea`). |
| 413 | `if (in_array($linea['id_ingrediente'], $idsRemovidos, true)) {` | Si es uno de los que quitó... |
| 414 | `continue;` | ...lo salta (no se descuenta). |
| 415 | `}` | Cierra el `if`. |
| 416 | `$lineasDescuento[] = [` | Anota que hay que descontar ese ingrediente: |
| 417 | `'id_ingrediente' => $linea['id_ingrediente'],` | cuál, |
| 418 | `'cantidad'       => (float) $linea['cantidad_necesaria'] * $item['cantidad'],` | cuánto: lo que lleva la receta × la cantidad de productos, |
| 419 | `'motivo'         => 'Venta pedido',` | y el motivo "Venta pedido". |
| 420 | `];` | Cierra los datos. |
| 421 | `}` | Cierra el `foreach`. |
| 422 | `}` | Cierra el `foreach`. |
| 424 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Bolsa de empaque global (1 por pedido)."* |
| 425 | `$idBolsa = $configModel->idIngredienteBolsaGlobal();` | Busca cuál es la bolsa de empaque (`idIngredienteBolsaGlobal()` de `models/Configuracion.php`). |
| 426 | `if ($idBolsa) {` | Si hay bolsa configurada... |
| 427 | `$lineasDescuento[] = ['id_ingrediente' => $idBolsa, 'cantidad' => 1, 'motivo' => 'Empaque global pedido'];` | ...anota que hay que descontar 1 bolsa por pedido. |
| 428 | `}` | Cierra el `if`. |
| 430 | `if (!empty($lineasDescuento)) {` | Si hay algo que descontar... |
| 431 | `$ingredienteModel = new Ingrediente();` | ...crea el modelo `Ingrediente`. |
| 432 | `$ingredienteModel->descontarPorReceta($lineasDescuento, $idPedido);` | ...descuenta todo del inventario (`descontarPorReceta()` de `models/Ingrediente.php`). Si no alcanza algo, lanza un error y no se guarda nada. |
| 433 | `}` | Cierra el `if`. |
| 435 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Los puntos ganados y el total gastado se suman al ENTREGAR (confirmarEntrega)."* |
| 436 | `$this->conn->commit();` | Confirma la transacción: ahora sí queda todo guardado. |
| 437 | `} catch (Exception $e) {` | Si algo falló... |
| 438 | `$this->conn->rollback();` | ...deshace todo (no queda nada a medias). |
| 439 | `throw $e;` | ...y lanza el error. |
| 440 | `}` | Cierra el `catch`. |
| 442 | `return $idPedido;` | Devuelve el número del pedido. |
| 443 | `}` | Cierra la función `guardar()`. |
| 445 | `private function buscarCliente($idCliente)` | Método `buscarCliente($idCliente)` (privado): busca un cliente. |
| 446 | `{` | Abre la función `buscarCliente()`. |
| 447 | `$stmt = $this->conn->prepare("SELECT * FROM CLIENTE WHERE id_cliente = ? LIMIT 1");` | Prepara la consulta: "trae todo del cliente con ese id". |
| 448 | `$stmt->bind_param("s", $idCliente);` | Llena los `?` de la consulta, en orden: `$idCliente` (texto). |
| 449 | `$stmt->execute();` | Ejecuta la consulta. |
| 450 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 451 | `$stmt->close();` | Cierra la consulta. |
| 452 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 453 | `}` | Cierra la función `buscarCliente()`. |
| 455 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Cliente activo con ese celular (comparando solo digitos, con o sin el 57), o null."* |
| 456 | `private function buscarClientePorTelefono($telefono)` | Método `buscarClientePorTelefono($telefono)` (privado): busca un cliente activo por su celular (con o sin el 57 de Colombia). |
| 457 | `{` | Abre la función `buscarClientePorTelefono()`. |
| 458 | `if ($telefono === '') {` | Si no hay teléfono... |
| 459 | `return null;` | ...devuelve `null`. |
| 460 | `}` | Cierra el `if`. |
| 461 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "busca un cliente activo cuyo teléfono, dejando solo los números (`REGEXP_REPLACE`), sea igual al celular o al celular con 57 adelante (`CONCAT('57', ?)`)". |
| 462 | `"SELECT * FROM CLIENTE` | ↑ (sigue la misma instrucción) |
| 463 | `WHERE activo = 1 AND REGEXP_REPLACE(telefono, '[^0-9]', '') IN (?, CONCAT('57', ?))` | ↑ (sigue la misma instrucción) |
| 464 | `LIMIT 1"` | ↑ (sigue la misma instrucción) |
| 465 | `);` | ↑ (sigue la misma instrucción) |
| 466 | `$stmt->bind_param("ss", $telefono, $telefono);` | Llena los `?` de la consulta, en orden: `$telefono` (texto), `$telefono` (texto). |
| 467 | `$stmt->execute();` | Ejecuta la consulta. |
| 468 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 469 | `$stmt->close();` | Cierra la consulta. |
| 470 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 471 | `}` | Cierra la función `buscarClientePorTelefono()`. |
| 473-476 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Recalcula en el servidor items, precios, descuento y total. El precio de cada insumo extra = costo unitario + margen de ganancia de Ajustes."* |
| 477 | `private function calcular($cliente, $payload, $configModel, $usarPuntos = false)` | Método `calcular(...)` (privado): calcula en el servidor el precio de cada producto, el subtotal, el domicilio, los descuentos y el total. Así nadie puede cambiar los precios desde el navegador. |
| 478 | `{` | Abre la función `calcular()`. |
| 479 | `$items = $payload['items'] ?? [];` | Guarda en `$items` los productos que mandó la pantalla (si no hay, lista vacía). |
| 480 | `if (empty($items)) {` | Si no hay productos... |
| 481 | `throw new InvalidArgumentException('El pedido no tiene ítems.');` | ...lanza el error "El pedido no tiene ítems.". |
| 482 | `}` | Cierra el `if`. |
| 484 | `$margen = $configModel->margenGanancia();` | Guarda en `$margen` el porcentaje de ganancia (`margenGanancia()` de `models/Configuracion.php`). |
| 485 | `$resueltos = [];` | `$resueltos` empieza vacía: los productos ya revisados. |
| 486 | `$subtotal = 0.0;` | `$subtotal` empieza en 0. |
| 488 | `foreach ($items as $item) {` | Recorre cada producto que mandó la pantalla (`$item`). |
| 489 | `$cantidad = max(1, (int) ($item['quantity'] ?? 1));` | Guarda la cantidad (mínimo 1: `max(1, ...)`). |
| 491 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Creador interactivo: hamburguesa armada capa por capa, sin producto base."* |
| 492 | `if (empty($item['productId']) && !empty($item['stack'])) {` | Si no trae producto pero trae capas (`stack`): es una hamburguesa armada por el cliente en el creador... |
| 493 | `$pila = $this->resolverIngredientes($item['stack'], $margen);` | ...busca cada ingrediente y su precio (`resolverIngredientes()` de abajo). |
| 494 | `if (empty($pila)) {` | ...si no quedó ningún ingrediente válido... |
| 495 | `throw new InvalidArgumentException('La hamburguesa personalizada no tiene ingredientes válidos.');` | ...lanza el error "La hamburguesa personalizada no tiene ingredientes válidos.". |
| 496 | `}` | Cierra el `if`. |
| 497 | `$precioUnitario = $this->sumarPrecios($pila);` | ...el precio es la suma de sus ingredientes (`sumarPrecios()` de abajo). |
| 498 | `$subtotal += $precioUnitario * $cantidad;` | ...suma al subtotal: precio × cantidad. |
| 500 | `$resueltos[] = [` | ...la agrega a `$resueltos` con: |
| 501 | `'producto'       => $this->productoPersonalizadoOculto(),` | el producto base oculto "Hamburguesa Personalizada" (`productoPersonalizadoOculto()` de abajo), |
| 502 | `'cantidad'       => $cantidad,` | la cantidad, |
| 503 | `'precioUnitario' => $precioUnitario,` | el precio, |
| 504 | `'extras'         => $pila,` | sus ingredientes (como extras), |
| 505 | `'removidos'      => [],` | y nada quitado. |
| 506 | `];` | Cierra los datos. |
| 507 | `continue;` | `continue` = pasa al siguiente producto. |
| 508 | `}` | Cierra el `if`. |
| 510 | `$idProducto = $item['productId'] ?? '';` | Si es un producto normal, guarda su número en `$idProducto`. |
| 511 | `$stmt = $this->conn->prepare("SELECT * FROM PRODUCTO WHERE id_producto = ? AND estado = 'activo' LIMIT 1");` | Prepara la consulta: "busca ese producto, solo si está activo". |
| 512 | `$stmt->bind_param("s", $idProducto);` | Llena los `?` de la consulta, en orden: `$idProducto` (texto). |
| 513 | `$stmt->execute();` | Ejecuta la consulta. |
| 514 | `$producto = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$producto`. |
| 515 | `$stmt->close();` | Cierra la consulta. |
| 516 | `if (!$producto) {` | Si no existe o ya no está activo... |
| 517 | `throw new InvalidArgumentException('Uno de los productos del carrito ya no está disponible.');` | ...lanza el error "Uno de los productos del carrito ya no está disponible.". |
| 518 | `}` | Cierra el `if`. |
| 520 | `$extras = $this->resolverIngredientes($item['extras'] ?? [], $margen);` | Busca los ingredientes extra y su precio. |
| 521 | `$removidos = $this->resolverIngredientes($item['removed'] ?? [], $margen);` | Busca los ingredientes que quitó. |
| 523 | `$precioUnitario = (float) $producto['precio'] + $this->sumarPrecios($extras);` | El precio = precio del producto + precio de los extras. |
| 524 | `$subtotal += $precioUnitario * $cantidad;` | Suma al subtotal: precio × cantidad. |
| 526 | `$resueltos[] = [` | Lo agrega a `$resueltos` con: |
| 527 | `'producto'       => $producto,` | el producto, |
| 528 | `'cantidad'       => $cantidad,` | la cantidad, |
| 529 | `'precioUnitario' => $precioUnitario,` | el precio, |
| 530 | `'extras'         => $extras,` | los extras, |
| 531 | `'removidos'      => $removidos,` | y lo que quitó. |
| 532 | `];` | Cierra los datos. |
| 533 | `}` | Cierra el `foreach`. |
| 535 | `$envio = (float) $configModel->tarifaDomicilio();` | Guarda en `$envio` lo que cuesta el domicilio (`tarifaDomicilio()`). |
| 536 | `$descuento = $cliente ? $this->descuentoCumpleanos($cliente, $subtotal) : 0.0;` | Si hay cliente, calcula su descuento de cumpleaños (`descuentoCumpleanos()` de abajo); si no, 0. |
| 538 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Canje de puntos: solo sobre los productos (no sobre el domicilio) y solo"* |
| 539 | *(comentario)* | Comentario: no se ejecuta. Dice: *"si el cliente alcanza el minimo configurado en Ajustes."* |
| 540 | `$puntosCanjeados = 0;` | `$puntosCanjeados` empieza en 0. |
| 541 | `$descuentoPuntos = 0.0;` | `$descuentoPuntos` empieza en 0. |
| 542 | `if ($usarPuntos && $cliente) {` | Si quiere usar puntos y hay cliente... |
| 543 | `$reglas = $configModel->reglasPuntos();` | ...trae las reglas de los puntos (`reglasPuntos()`): cuánto vale uno y el mínimo. |
| 544 | `$saldo = (int) $cliente['puntos_fidelidad'];` | ...guarda cuántos puntos tiene. |
| 545 | `if ($reglas['valor'] > 0 && $saldo > 0 && $saldo >= $reglas['minimo']) {` | ...si un punto vale algo, tiene puntos y llega al mínimo... |
| 546 | `$maximoPorMonto = (int) floor(($subtotal - $descuento) / $reglas['valor']);` | ...calcula cuántos puntos se pueden usar como máximo para no pasarse del valor de los productos (`floor` redondea hacia abajo). |
| 547 | `$elegidos = isset($payload['pointsToUse']) ? (int) $payload['pointsToUse'] : $saldo;` | `$elegidos` = cuántos puntos **eligió** el cliente (`pointsToUse`, lo que escribió en la cajita del pago). `isset()` pregunta si lo mandó; si no lo mandó, se toman todos sus puntos (`$saldo`). `(int)` lo vuelve número entero. |
| 548 | `$puntosCanjeados = max(0, min($saldo, $maximoPorMonto, $elegidos));` | Los puntos que se canjean = el **menor** de tres números (`min`): los que tiene, los que alcanzan a cubrir los productos, y los que eligió. `max(0, ...)` evita que quede negativo (por si alguien manda un número negativo). |
| 549 | `$descuentoPuntos = round($puntosCanjeados * $reglas['valor'], 2);` | ...el descuento = puntos × valor de un punto. |
| 550 | `}` | Cierra el `if`. |
| 551 | `}` | Cierra el `if`. |
| 553 | `return [` | Devuelve el cálculo: |
| 554 | `'items'           => $resueltos,` | los productos revisados, |
| 555 | `'subtotal'        => $subtotal,` | el subtotal, |
| 556 | `'envio'           => $envio,` | el domicilio, |
| 557 | `'descuento'       => $descuento,` | el descuento de cumpleaños, |
| 558 | `'puntosCanjeados' => $puntosCanjeados,` | los puntos usados, |
| 559 | `'descuentoPuntos' => $descuentoPuntos,` | el descuento por puntos, |
| 560 | `'total'           => round($subtotal - $descuento - $descuentoPuntos + $envio, 2),` | y el total = subtotal − descuentos + domicilio (redondeado a 2 decimales). |
| 561 | `];` | Cierra la lista. |
| 562 | `}` | Cierra la función `calcular()`. |
| 564 | `private function sumarPrecios($ingredientes)` | Método `sumarPrecios($ingredientes)` (privado): suma el precio de varios ingredientes. |
| 565 | `{` | Abre la función `sumarPrecios()`. |
| 566 | `$suma = 0;` | `$suma` empieza en 0. |
| 567 | `foreach ($ingredientes as $ing) {` | Recorre cada ingrediente. |
| 568 | `$suma += (float) $ing['precio_extra'];` | Le suma su precio (`+=`). |
| 569 | `}` | Cierra el `foreach`. |
| 570 | `return $suma;` | Devuelve la suma. |
| 571 | `}` | Cierra la función `sumarPrecios()`. |
| 573 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Total que se cobraria por este carrito (para abrir la pasarela de pago)."* |
| 574 | `public function cotizar($idCliente, $payload)` | Método `cotizar($idCliente, $payload)`: calcula el total antes de pagar (para la pasarela). Lo usa `PaymentController::prepare()`. |
| 575 | `{` | Abre la función `cotizar()`. |
| 576 | `$configModel = new Configuracion();` | Crea el modelo `Configuracion`. |
| 577 | `if (!$configModel->tiendaAbiertaAhora()) {` | Si la tienda no está abierta... |
| 578 | `throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden procesar pagos.');` | ...lanza el error. |
| 579 | `}` | Cierra el `if`. |
| 580 | `$cliente = $this->buscarCliente($idCliente);` | Busca al cliente. |
| 581 | `if (!$cliente) {` | Si no existe... |
| 582 | `throw new InvalidArgumentException('Cliente no encontrado.');` | ...lanza el error "Cliente no encontrado.". |
| 583 | `}` | Cierra el `if`. |
| 584 | `return $this->calcular($cliente, $payload, $configModel, !empty($payload['usePoints']))['total'];` | Calcula todo (`calcular()`) y devuelve solo el total (`['total']`). |
| 585 | `}` | Cierra la función `cotizar()`. |
| 587 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Producto oculto que sirve de base para las hamburguesas del creador interactivo. Se crea una sola vez."* |
| 588 | `private function productoPersonalizadoOculto()` | Método `productoPersonalizadoOculto()` (privado): trae el producto oculto "Hamburguesa Personalizada" (la base de las hamburguesas armadas por el cliente). Si no existe, lo crea una sola vez. |
| 589 | `{` | Abre la función `productoPersonalizadoOculto()`. |
| 590 | `$sql = "SELECT * FROM PRODUCTO WHERE nombre = 'Hamburguesa Personalizada' AND estado = 'oculto' LIMIT 1";` | Guarda en `$sql` la consulta: "busca el producto 'Hamburguesa Personalizada' oculto". |
| 592 | `$stmt = $this->conn->prepare($sql);` | La prepara. |
| 593 | `$stmt->execute();` | Ejecuta la consulta. |
| 594 | `$producto = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$producto`. |
| 595 | `$stmt->close();` | Cierra la consulta. |
| 596 | `if ($producto) {` | Si existe... |
| 597 | `return $producto;` | ...lo devuelve. |
| 598 | `}` | Cierra el `if`. |
| 600 | `$stmtC = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE nombre = 'Personalizado' AND ambito = 'menu' LIMIT 1");` | Si no, prepara la consulta: "busca la categoría 'Personalizado' del menú". |
| 601 | `$stmtC->execute();` | Ejecuta la consulta. |
| 602 | `$categoria = $stmtC->get_result()->fetch_assoc();` | La guarda en `$categoria`. |
| 603 | `$stmtC->close();` | Cierra la consulta. |
| 605 | `if ($categoria) {` | Si existe... |
| 606 | `$idCategoria = $categoria['id_categoria'];` | ...guarda su número. |
| 607 | `} else {` | Si no... |
| 608 | `$stmtN = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES ('Personalizado', 'menu')");` | ...prepara la consulta: "crea la categoría 'Personalizado'". |
| 609 | `$stmtN->execute();` | Ejecuta la consulta. |
| 610 | `$stmtN->close();` | Cierra la consulta. |
| 611 | `$idCategoria = $this->conn->insert_id;` | ...y guarda su número. |
| 612 | `}` | Cierra el `else`. |
| 614 | `$stmtI = $this->conn->prepare(` | Prepara la consulta: "crea el producto 'Hamburguesa Personalizada', con precio 0 y oculto". |
| 615 | `"INSERT INTO PRODUCTO (id_categoria, nombre, precio, estado)` | ↑ (sigue la misma instrucción) |
| 616 | `VALUES (?, 'Hamburguesa Personalizada', 0, 'oculto')"` | ↑ (sigue la misma instrucción) |
| 617 | `);` | ↑ (sigue la misma instrucción) |
| 618 | `$stmtI->bind_param("i", $idCategoria);` | Llena los `?` de la consulta, en orden: `$idCategoria` (número entero). |
| 619 | `$stmtI->execute();` | Ejecuta la consulta. |
| 620 | `$stmtI->close();` | Cierra la consulta. |
| 622 | `$stmtF = $this->conn->prepare($sql);` | Vuelve a preparar la consulta de búsqueda (`$sql`). |
| 623 | `$stmtF->execute();` | Ejecuta la consulta. |
| 624 | `$producto = $stmtF->get_result()->fetch_assoc();` | Guarda el producto recién creado. |
| 625 | `$stmtF->close();` | Cierra la consulta. |
| 626 | `return $producto;` | Lo devuelve. |
| 627 | `}` | Cierra la función `productoPersonalizadoOculto()`. |
| 629-633 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca cada ingrediente por id (o por nombre) y calcula su precio de venta: costo unitario + margen, redondeado a la centena (igual que en el frontend). Los ingredientes que no existen se ignoran."* |
| 634 | `private function resolverIngredientes($referencias, $margen = 0.0)` | Método `resolverIngredientes($referencias, $margen)` (privado): busca cada ingrediente (por número o por nombre) y calcula su precio de venta. Los que no existen se saltan. |
| 635 | `{` | Abre la función `resolverIngredientes()`. |
| 636 | `$resueltos = [];` | `$resueltos` empieza vacía. |
| 637 | `foreach ($referencias as $ref) {` | Recorre cada ingrediente que mandó la pantalla (`$ref`). |
| 638 | `$row = null;` | `$row` empieza en `null` (todavía no lo encontró). |
| 639 | `if (!empty($ref['id'])) {` | Si trae número... |
| 640 | `$stmt = $this->conn->prepare("SELECT * FROM INGREDIENTE WHERE id_ingrediente = ? LIMIT 1");` | ...prepara la consulta: "busca el ingrediente con ese número". |
| 641 | `$stmt->bind_param("s", $ref['id']);` | Llena los `?` de la consulta, en orden: `$ref['id']` (texto). |
| 642 | `$stmt->execute();` | Ejecuta la consulta. |
| 643 | `$row = $stmt->get_result()->fetch_assoc();` | ...lo guarda en `$row`. |
| 644 | `$stmt->close();` | Cierra la consulta. |
| 645 | `}` | Cierra el `if`. |
| 646 | `if (!$row && !empty($ref['name'])) {` | Si no lo encontró y trae nombre... |
| 647 | `$stmt = $this->conn->prepare("SELECT * FROM INGREDIENTE WHERE LOWER(nombre) = LOWER(?) LIMIT 1");` | ...prepara la consulta: "busca el ingrediente con ese nombre, sin importar mayúsculas". |
| 648 | `$stmt->bind_param("s", $ref['name']);` | Llena los `?` de la consulta, en orden: `$ref['name']` (texto). |
| 649 | `$stmt->execute();` | Ejecuta la consulta. |
| 650 | `$row = $stmt->get_result()->fetch_assoc();` | ...lo guarda en `$row`. |
| 651 | `$stmt->close();` | Cierra la consulta. |
| 652 | `}` | Cierra el `if`. |
| 653 | `if (!$row) {` | Si no lo encontró de ninguna forma... |
| 654 | `continue;` | ...lo salta. |
| 655 | `}` | Cierra el `if`. |
| 656 | `$costo = (float) $row['costo_unitario'];` | Guarda en `$costo` lo que cuesta una unidad. |
| 657 | `$resueltos[] = [` | Lo agrega a `$resueltos` con: |
| 658 | `'id_ingrediente' => $row['id_ingrediente'],` | su número, |
| 659 | `'nombre'         => $row['nombre'],` | su nombre, |
| 660 | `'precio_extra'   => round(($costo * (1 + $margen / 100)) / 100) * 100,` | y su precio de venta: costo + margen de ganancia, redondeado a la centena (ej. 2.025 → 2.000). Así lo calcula también la pantalla. |
| 661 | `];` | Cierra los datos. |
| 662 | `}` | Cierra el `foreach`. |
| 663 | `return $resueltos;` | Devuelve la lista. |
| 664 | `}` | Cierra la función `resolverIngredientes()`. |
| 666 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"15% de descuento si hoy es el cumpleanos del cliente."* |
| 667 | `private function descuentoCumpleanos($cliente, $subtotal)` | Método `descuentoCumpleanos($cliente, $subtotal)` (privado): da 15% de descuento si hoy es el cumpleaños del cliente. |
| 668 | `{` | Abre la función `descuentoCumpleanos()`. |
| 669 | `if (empty($cliente['fecha_nacimiento'])) {` | Si no tiene fecha de nacimiento... |
| 670 | `return 0.0;` | ...no hay descuento (0). |
| 671 | `}` | Cierra el `if`. |
| 672 | `$cumple = date('m-d', strtotime($cliente['fecha_nacimiento']));` | Saca el mes y el día del cumpleaños (`date('m-d', ...)`, ej. `10-17`). |
| 673 | `return $cumple === date('m-d') ? round($subtotal * 0.15, 2) : 0.0;` | Si es igual al mes y día de hoy, el descuento es el 15% del subtotal (`× 0.15`); si no, 0. |
| 674 | `}` | Cierra la función `descuentoCumpleanos()`. |
| 676 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 677 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cambios de estado"* |
| 678 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 680 | `public function marcarPreparando($idPedido, $idAyudante = null)` | Método `marcarPreparando($idPedido, $idAyudante)`: pasa el pedido a "En preparación". Lo usa `OrderController::markPreparing()`. |
| 681 | `{` | Abre la función `marcarPreparando()`. |
| 682 | `$this->transicion($idPedido, ['pendiente'], 'en_preparacion');` | Cambia el estado de `'pendiente'` a `'en_preparacion'` (`transicion()` de abajo). Si no estaba pendiente, da error. |
| 683 | `$this->registrarAyudante($idPedido, $idAyudante);` | Anota quién de cocina lo prepara (`registrarAyudante()` de abajo). |
| 684 | `}` | Cierra la función `marcarPreparando()`. |
| 686 | `public function marcarListo($idPedido, $idAyudante = null)` | Método `marcarListo($idPedido, $idAyudante)`: pasa el pedido a "Listo". Lo usa `OrderController::markReady()`. |
| 687 | `{` | Abre la función `marcarListo()`. |
| 688 | `$this->transicion($idPedido, ['pendiente', 'en_preparacion'], 'listo');` | Cambia el estado a `'listo'` (solo si estaba pendiente o en preparación). |
| 690 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET fecha_listo = NOW() WHERE id_pedido = ?");` | Prepara la consulta: "anota la hora en que quedó listo (`NOW()`)". |
| 691 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 692 | `$stmt->execute();` | Ejecuta la consulta. |
| 693 | `$stmt->close();` | Cierra la consulta. |
| 695 | `$this->registrarAyudante($idPedido, $idAyudante);` | Anota quién de cocina lo preparó. |
| 696 | `}` | Cierra la función `marcarListo()`. |
| 698 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Guarda quien de cocina preparo el pedido (solo el primero)."* |
| 699 | `private function registrarAyudante($idPedido, $idAyudante)` | Método `registrarAyudante($idPedido, $idAyudante)` (privado): guarda quién de cocina preparó el pedido (solo el primero). |
| 700 | `{` | Abre la función `registrarAyudante()`. |
| 701 | `if (!$idAyudante) {` | Si no hay ayudante (lo hizo el administrador)... |
| 702 | `return;` | ...sale. |
| 703 | `}` | Cierra el `if`. |
| 704 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET id_ayudante = ? WHERE id_pedido = ? AND id_ayudante IS NULL");` | Prepara la consulta: "anota el ayudante en el pedido, solo si todavía no tiene uno (`IS NULL`)". |
| 705 | `$stmt->bind_param("si", $idAyudante, $idPedido);` | Llena los `?` de la consulta, en orden: `$idAyudante` (texto), `$idPedido` (número entero). |
| 706 | `$stmt->execute();` | Ejecuta la consulta. |
| 707 | `$stmt->close();` | Cierra la consulta. |
| 708 | `}` | Cierra la función `registrarAyudante()`. |
| 710 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Lee estado y domiciliario del pedido bloqueando la fila (FOR UPDATE)."* |
| 711 | `private function bloquearPedido($idPedido)` | Método `bloquearPedido($idPedido)` (privado): lee el estado y el domiciliario del pedido y lo bloquea (`FOR UPDATE`), para que dos domiciliarios no lo tomen al mismo tiempo. |
| 712 | `{` | Abre la función `bloquearPedido()`. |
| 713 | `$stmt = $this->conn->prepare("SELECT estado, id_domiciliario FROM PEDIDO WHERE id_pedido = ? FOR UPDATE");` | Prepara la consulta: "trae el estado y el domiciliario del pedido, y bloquéalo". |
| 714 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 715 | `$stmt->execute();` | Ejecuta la consulta. |
| 716 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 717 | `$stmt->close();` | Cierra la consulta. |
| 718 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 719 | `}` | Cierra la función `bloquearPedido()`. |
| 721 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"El domiciliario toma un pedido 'listo' (queda asignado, sin salir todavia)."* |
| 722 | `public function tomarPedido($idPedido, $idDomiciliario)` | Método `tomarPedido($idPedido, $idDomiciliario)`: el domiciliario toma un pedido listo (queda asignado, pero todavía no sale). Lo usa `OrderController::take()`. |
| 723 | `{` | Abre la función `tomarPedido()`. |
| 724 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 725 | `try {` | Intenta... |
| 726 | `$row = $this->bloquearPedido($idPedido);` | ...lee y bloquea el pedido. |
| 727 | `if (!$row \|\| $row['estado'] !== 'listo'` | ...si no existe, o no está listo, o ya lo tiene **otro** domiciliario... |
| 728 | `\|\| ($row['id_domiciliario'] !== null && $row['id_domiciliario'] !== $idDomiciliario)) {` | ↑ (sigue la misma instrucción) |
| 729 | `throw new Exception('Este pedido ya no está disponible para reparto.');` | ...lanza el error "Este pedido ya no está disponible para reparto.". |
| 730 | `}` | Cierra el bloque. |
| 732 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET id_domiciliario = ? WHERE id_pedido = ?");` | ...prepara la consulta: "asígnale este domiciliario al pedido". |
| 733 | `$stmt->bind_param("si", $idDomiciliario, $idPedido);` | Llena los `?` de la consulta, en orden: `$idDomiciliario` (texto), `$idPedido` (número entero). |
| 734 | `$stmt->execute();` | Ejecuta la consulta. |
| 735 | `$stmt->close();` | Cierra la consulta. |
| 737 | `$this->conn->commit();` | ...confirma la transacción. |
| 738 | `} catch (Exception $e) {` | Si algo falló... |
| 739 | `$this->conn->rollback();` | ...deshace todo. |
| 740 | `throw $e;` | ...y lanza el error. |
| 741 | `}` | Cierra el `catch`. |
| 742 | `}` | Cierra la función `tomarPedido()`. |
| 744-747 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"El domiciliario suelta su pedido para que otro lo tome. Solo puede soltar los suyos que siguen en 'listo' (que todavia no salio a entregar)."* |
| 748 | `public function liberarPedido($idPedido, $idActor)` | Método `liberarPedido($idPedido, $idActor)`: el domiciliario suelta su pedido para que otro lo tome. Lo usa `OrderController::release()`. `$idActor` = el número del domiciliario que lo suelta. |
| 749 | `{` | Abre la función `liberarPedido()`. |
| 750 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 751 | `try {` | Intenta... |
| 752 | `$row = $this->bloquearPedido($idPedido);` | ...lee y bloquea el pedido. |
| 753 | `if (!$row \|\| $row['id_domiciliario'] === null) {` | ...si no existe o no tiene domiciliario... |
| 754 | `throw new Exception('Este pedido no tiene domiciliario asignado.');` | ...lanza el error "Este pedido no tiene domiciliario asignado.". |
| 755 | `}` | Cierra el `if`. |
| 756 | `if ($row['id_domiciliario'] !== $idActor \|\| $row['estado'] !== 'listo') {` | ...si el pedido no es de este domiciliario (`!==` = "no es igual"), o ya no está en "listo" (ya salió a entregarlo)... |
| 757 | `throw new Exception('Solo puedes soltar un pedido tuyo que aún no has iniciado.');` | ...lanza el error "Solo puedes soltar un pedido tuyo que aún no has iniciado.". |
| 758 | `}` | Cierra el `if`. |
| 760 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET estado = 'listo', id_domiciliario = NULL WHERE id_pedido = ?");` | ...prepara la consulta: "deja el pedido en 'listo' y sin domiciliario (`NULL`)". |
| 761 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 762 | `$stmt->execute();` | Ejecuta la consulta. |
| 763 | `$stmt->close();` | Cierra la consulta. |
| 765 | `$this->conn->commit();` | ...confirma la transacción. |
| 766 | `} catch (Exception $e) {` | Si algo falló... |
| 767 | `$this->conn->rollback();` | ...deshace todo. |
| 768 | `throw $e;` | ...y lanza el error. |
| 769 | `}` | Cierra el `catch`. |
| 770 | `}` | Cierra la función `liberarPedido()`. |
| 772 | `public function aceptarEntrega($idPedido, $idDomiciliario)` | Método `aceptarEntrega($idPedido, $idDomiciliario)`: el domiciliario sale a entregar: el pedido pasa a "En camino". Lo usa `OrderController::accept()`. |
| 773 | `{` | Abre la función `aceptarEntrega()`. |
| 774 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 775 | `try {` | Intenta... |
| 776 | `$row = $this->bloquearPedido($idPedido);` | ...lee y bloquea el pedido. |
| 777 | `if (!$row \|\| $row['estado'] !== 'listo'` | ...si no existe, o no está listo, o lo tiene otro domiciliario... |
| 778 | `\|\| ($row['id_domiciliario'] !== null && $row['id_domiciliario'] !== $idDomiciliario)) {` | ↑ (sigue la misma instrucción) |
| 779 | `throw new Exception('Este pedido ya no está disponible para reparto.');` | ...lanza el error "Este pedido ya no está disponible para reparto.". |
| 780 | `}` | Cierra el bloque. |
| 782 | `$stmt = $this->conn->prepare("UPDATE PEDIDO SET estado = 'en_camino', id_domiciliario = ? WHERE id_pedido = ?");` | ...prepara la consulta: "pasa el pedido a 'en_camino' con este domiciliario". |
| 783 | `$stmt->bind_param("si", $idDomiciliario, $idPedido);` | Llena los `?` de la consulta, en orden: `$idDomiciliario` (texto), `$idPedido` (número entero). |
| 784 | `$stmt->execute();` | Ejecuta la consulta. |
| 785 | `$stmt->close();` | Cierra la consulta. |
| 787 | `$this->conn->commit();` | ...confirma la transacción. |
| 788 | `} catch (Exception $e) {` | Si algo falló... |
| 789 | `$this->conn->rollback();` | ...deshace todo. |
| 790 | `throw $e;` | ...y lanza el error. |
| 791 | `}` | Cierra el `catch`. |
| 792 | `}` | Cierra la función `aceptarEntrega()`. |
| 794 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Entrega: solo con el PIN de 4 digitos correcto."* |
| 795 | `public function confirmarEntrega($idPedido, $idDomiciliario, $pin)` | Método `confirmarEntrega($idPedido, $idDomiciliario, $pin)`: entrega el pedido, solo con el PIN correcto. Lo usa `OrderController::deliver()`. |
| 796 | `{` | Abre la función `confirmarEntrega()`. |
| 797 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "trae el PIN, el estado, el domiciliario, el cliente, los puntos y el total del pedido". |
| 798 | `"SELECT pin_entrega, estado, id_domiciliario, id_cliente, puntos_ganados, total FROM PEDIDO WHERE id_pedido = ?"` | ↑ (sigue la misma instrucción) |
| 799 | `);` | ↑ (sigue la misma instrucción) |
| 800 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 801 | `$stmt->execute();` | Ejecuta la consulta. |
| 802 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 803 | `$stmt->close();` | Cierra la consulta. |
| 805 | `if (!$row \|\| $row['estado'] !== 'en_camino' \|\| $row['id_domiciliario'] !== $idDomiciliario) {` | Si no existe, o no va en camino, o no es de este domiciliario... |
| 806 | `throw new Exception('No puedes confirmar la entrega de este pedido.');` | ...lanza el error "No puedes confirmar la entrega de este pedido.". |
| 807 | `}` | Cierra el `if`. |
| 808 | `if (!hash_equals($row['pin_entrega'], $pin)) {` | Si el PIN no es igual al del pedido (`hash_equals` los compara de forma segura)... |
| 809 | `throw new Exception('PIN incorrecto.');` | ...lanza el error "PIN incorrecto.". |
| 810 | `}` | Cierra el `if`. |
| 812 | `$this->conn->begin_transaction();` | Empieza una transacción. |
| 813 | `try {` | Intenta... |
| 814 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Al entregar, el pago queda aprobado (en efectivo se cobro en la puerta)."* |
| 815 | `$stmtU = $this->conn->prepare(` | ...prepara la consulta: "pasa el pedido a 'entregado', el pago a 'aprobado' y, si no tenía fecha de pago, pone la de ahora (`COALESCE`)". |
| 816 | `"UPDATE PEDIDO SET estado = 'entregado',` | ↑ (sigue la misma instrucción) |
| 817 | `estado_pago = 'aprobado',` | ↑ (sigue la misma instrucción) |
| 818 | `fecha_pago = COALESCE(fecha_pago, NOW())` | ↑ (sigue la misma instrucción) |
| 819 | `WHERE id_pedido = ?"` | ↑ (sigue la misma instrucción) |
| 820 | `);` | ↑ (sigue la misma instrucción) |
| 821 | `$stmtU->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 822 | `$stmtU->execute();` | Ejecuta la consulta. |
| 823 | `$stmtU->close();` | Cierra la consulta. |
| 825 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Puntos de fidelidad y total gastado del cliente (un invitado no tiene cuenta)."* |
| 826 | `if ($row['id_cliente'] !== null) {` | ...si el pedido tiene cliente registrado (no es invitado)... |
| 827 | `$puntos = (int) $row['puntos_ganados'];` | ...guarda los puntos que ganó. |
| 828 | `$total = (float) $row['total'];` | ...guarda el total. |
| 829 | `$stmtC = $this->conn->prepare(` | ...prepara la consulta: "súmale al cliente los puntos y el total gastado". |
| 830 | `"UPDATE CLIENTE SET puntos_fidelidad = puntos_fidelidad + ?, total_gastado = total_gastado + ? WHERE id_cliente = ?"` | ↑ (sigue la misma instrucción) |
| 831 | `);` | ↑ (sigue la misma instrucción) |
| 832 | `$stmtC->bind_param("idi", $puntos, $total, $row['id_cliente']);` | Llena los `?` de la consulta, en orden: `$puntos` (número entero), `$total` (número con decimales), `$row['id_cliente']` (número entero). |
| 833 | `$stmtC->execute();` | Ejecuta la consulta. |
| 834 | `$stmtC->close();` | Cierra la consulta. |
| 835 | `}` | Cierra el `if`. |
| 837 | `$this->conn->commit();` | ...confirma la transacción. |
| 838 | `} catch (Exception $e) {` | Si algo falló... |
| 839 | `$this->conn->rollback();` | ...deshace todo. |
| 840 | `throw $e;` | ...y lanza el error. |
| 841 | `}` | Cierra el `catch`. |
| 843 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Notificacion push al cliente; si falla, la entrega ya quedo confirmada."* |
| 844 | `if ($row['id_cliente'] === null) {` | Si el cliente es invitado (sin cuenta)... |
| 845 | `return;` | ...termina (no hay a quién enviar la notificación). |
| 846 | `}` | Cierra el `if`. |
| 847 | `try {` | Intenta... |
| 848 | `$pushService = new PushNotificationService();` | ...crea el servicio de notificaciones. |
| 849 | `$pushService->notificarPedidoEntregado($idPedido, (int) $row['id_cliente']);` | ...le avisa al cliente que su pedido llegó (`notificarPedidoEntregado()` de `models/PushNotificationService.php`). |
| 850 | `} catch (Exception $e) {` | Si el envío falla (por ejemplo, el servidor de notificaciones no responde)... |
| 851 | `error_log('No se pudo enviar la notificacion push de entrega: ' . $e->getMessage());` | ...lo anota en el archivo de errores. La entrega ya quedó guardada. |
| 852 | `}` | Cierra el `catch`. |
| 853 | `}` | Cierra la función `confirmarEntrega()`. |
| 855-858 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"El admin corrige la direccion de un pedido que aun no se entrega. Las coordenadas se borran para que el mapa del domiciliario vuelva a ubicarla."* |
| 859 | `public function cambiarDireccion($idPedido, $direccion)` | Método `cambiarDireccion($idPedido, $direccion)`: el administrador cambia la dirección de un pedido que todavía no se entrega. Lo usa `OrderController::updateAddress()`. |
| 860 | `{` | Abre la función `cambiarDireccion()`. |
| 861 | `$direccion = trim((string) $direccion);` | Le quita los espacios a la dirección. |
| 862 | `if ($direccion === '') {` | Si quedó vacía... |
| 863 | `throw new InvalidArgumentException('La dirección es obligatoria.');` | ...lanza el error "La dirección es obligatoria.". |
| 864 | `}` | Cierra el `if`. |
| 866 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "cambia la dirección y borra las coordenadas (para que el domiciliario la vuelva a ubicar en el mapa), solo si el pedido no se ha entregado". |
| 867 | `"UPDATE PEDIDO SET direccion_entrega = ?, destino_lat = NULL, destino_lng = NULL` | ↑ (sigue la misma instrucción) |
| 868 | `WHERE id_pedido = ? AND estado IN ('pendiente', 'en_preparacion', 'listo', 'en_camino')"` | ↑ (sigue la misma instrucción) |
| 869 | `);` | ↑ (sigue la misma instrucción) |
| 870 | `$stmt->bind_param("si", $direccion, $idPedido);` | Llena los `?` de la consulta, en orden: `$direccion` (texto), `$idPedido` (número entero). |
| 871 | `$stmt->execute();` | Ejecuta la consulta. |
| 872 | `$cambiadas = $stmt->affected_rows;` | Guarda cuántas filas cambiaron (`affected_rows`). |
| 873 | `$stmt->close();` | Cierra la consulta. |
| 875 | `if ($cambiadas === 0 && $this->pedidoModel->buscarCrudo($idPedido)['direccion_entrega'] !== $direccion) {` | Si no cambió nada y la dirección guardada es distinta (o sea, el pedido ya se entregó)... |
| 876 | `throw new Exception('Este pedido ya fue entregado y no se puede cambiar su dirección.');` | ...lanza el error "Este pedido ya fue entregado y no se puede cambiar su dirección.". |
| 877 | `}` | Cierra el `if`. |
| 878 | `}` | Cierra la función `cambiarDireccion()`. |
| 880 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Coordenadas del destino que el domiciliario ubico en el mapa (solo de su pedido en curso)."* |
| 881 | `public function guardarDestino($idPedido, $idDomiciliario, $lat, $lng)` | Método `guardarDestino(...)`: guarda las coordenadas del destino que el domiciliario marcó en el mapa. Lo usa `OrderController::updateDestination()`. |
| 882 | `{` | Abre la función `guardarDestino()`. |
| 883 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda la latitud y longitud del destino, solo si el pedido es de este domiciliario y está listo o en camino". |
| 884 | `"UPDATE PEDIDO SET destino_lat = ?, destino_lng = ?` | ↑ (sigue la misma instrucción) |
| 885 | `WHERE id_pedido = ? AND id_domiciliario = ? AND estado IN ('listo', 'en_camino')"` | ↑ (sigue la misma instrucción) |
| 886 | `);` | ↑ (sigue la misma instrucción) |
| 887 | `$stmt->bind_param("ddis", $lat, $lng, $idPedido, $idDomiciliario);` | Llena los `?` de la consulta, en orden: `$lat` (número con decimales), `$lng` (número con decimales), `$idPedido` (número entero), `$idDomiciliario` (texto). |
| 888 | `$stmt->execute();` | Ejecuta la consulta. |
| 889 | `$stmt->close();` | Cierra la consulta. |
| 890 | `}` | Cierra la función `guardarDestino()`. |
| 892 | `private function transicion($idPedido, $desdeValidos, $hacia)` | Método `transicion($idPedido, $desdeValidos, $hacia)` (privado): cambia el estado del pedido, solo si el estado actual es uno de los permitidos. Lo usan `marcarPreparando()` y `marcarListo()`. |
| 893 | `{` | Abre la función `transicion()`. |
| 894 | `$stmt = $this->conn->prepare("SELECT estado FROM PEDIDO WHERE id_pedido = ?");` | Prepara la consulta: "trae el estado del pedido". |
| 895 | `$stmt->bind_param("i", $idPedido);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero). |
| 896 | `$stmt->execute();` | Ejecuta la consulta. |
| 897 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 898 | `$stmt->close();` | Cierra la consulta. |
| 900 | `if (!$row \|\| !in_array($row['estado'], $desdeValidos, true)) {` | Si no existe o su estado no está en la lista permitida... |
| 901 | `throw new Exception('Transición de estado no permitida.');` | ...lanza el error "Transición de estado no permitida.". |
| 902 | `}` | Cierra el `if`. |
| 904 | `$stmtU = $this->conn->prepare("UPDATE PEDIDO SET estado = ? WHERE id_pedido = ?");` | Prepara la consulta: "cambia el estado del pedido al nuevo". |
| 905 | `$stmtU->bind_param("si", $hacia, $idPedido);` | Llena los `?` de la consulta, en orden: `$hacia` (texto), `$idPedido` (número entero). |
| 906 | `$stmtU->execute();` | Ejecuta la consulta. |
| 907 | `$stmtU->close();` | Cierra la consulta. |
| 908 | `}` | Cierra la función `transicion()`. |
| 910 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 911 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Resena"* |
| 912 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---------------------------------------------------------------"* |
| 914 | `public function calificar($idPedido, $puntaje, $comentario)` | Método `calificar($idPedido, $puntaje, $comentario)`: guarda la calificación del pedido. Si ya tenía una, la cambia. Lo usa `OrderController::review()`. |
| 915 | `{` | Abre la función `calificar()`. |
| 916 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda en `RESENA` las estrellas y el comentario; si ya había una reseña de ese pedido (`ON DUPLICATE KEY UPDATE`), la actualiza". |
| 917 | `"INSERT INTO RESENA (id_pedido, puntaje, comentario)` | ↑ (sigue la misma instrucción) |
| 918 | `VALUES (?, ?, ?)` | ↑ (sigue la misma instrucción) |
| 919 | `ON DUPLICATE KEY UPDATE puntaje = VALUES(puntaje), comentario = VALUES(comentario)"` | ↑ (sigue la misma instrucción) |
| 920 | `);` | ↑ (sigue la misma instrucción) |
| 921 | `$stmt->bind_param("iis", $idPedido, $puntaje, $comentario);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero), `$puntaje` (número entero), `$comentario` (texto). |
| 922 | `$stmt->execute();` | Ejecuta la consulta. |
| 923 | `$stmt->close();` | Cierra la consulta. |
| 924 | `}` | Cierra la función `calificar()`. |
| 925 | `}` | Cierra la clase `PedidoService`. |
| 926 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado | `Failed to open stream` |
| el método `crear()` | hacer pedidos (cliente) | `Call to undefined method PedidoService::crear()` |
| el método `crearManual()` | registrar pedidos por llamada o WhatsApp | `Call to undefined method PedidoService::crearManual()` |
| el método `pedidoPorLink()` | abrir la página del link de pago | `Call to undefined method PedidoService::pedidoPorLink()` |
| el método `iniciarPagoLink()` | pagar un pedido por link | `Call to undefined method PedidoService::iniciarPagoLink()` |
| el método `consultarPagoLink()` | saber si el pago por link fue aprobado (el pedido no pasa a cocina) | `Call to undefined method PedidoService::consultarPagoLink()` |
| el método `cancelarLinksVencidos()` | cargar los datos de todas las pantallas, abrir el link de pago | `Call to undefined method PedidoService::cancelarLinksVencidos()` |
| el método `filaPorCodigo()` | todo lo del link de pago | `Call to undefined method PedidoService::filaPorCodigo()` |
| la constante `MINUTOS_LINK_PAGO` | registrar pedidos con link de pago | `Undefined constant PedidoService::MINUTOS_LINK_PAGO` |
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
