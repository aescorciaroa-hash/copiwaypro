# models/PagoService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja los pagos en línea de prueba.

## ¿Qué hace?
- prepara el pago (monto y referencia)
- crea el pago
- crea el pago de un pedido manual por link (sin cuenta)
- consulta el pago
- revisa que el pago sirva para el pedido

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `firmar()` (privado) | crea la firma de seguridad del pago | `PagoService::crearTransaccion()`, `PagoService::prepararCheckout()` |
| `prepararCheckout()` | prepara el pago (monto y referencia) | `PaymentController::prepare()` |
| `crearTransaccion()` | crea el pago | `PaymentController::createTransaction()` |
| `crearTransaccionDePedido()` | crea el pago de un pedido manual por link | `PedidoService::iniciarPagoLink()` |
| `obtenerTransaccionDePedido()` | consulta el pago, solo si es de ese pedido | `PedidoService::consultarPagoLink()` |
| `insertarTransaccion()` (privado) | guarda el pago de prueba en la base de datos | `PagoService::crearTransaccion()`, `PagoService::crearTransaccionDePedido()` |
| `obtenerTransaccion()` | consulta el pago | `PagoService::crearTransaccion()`, `PagoService::verificarTransaccion()`, `PaymentController::showTransaction()` |
| `mensaje()` (privado) | el mensaje de cada estado del pago | `PagoService::obtenerTransaccion()` |
| `verificarTransaccion()` | revisa que el pago sirva para el pedido | `PedidoService::crear()` |

## ¿Con qué se conecta?
- **Lo cargan:** `models/PedidoService.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-12 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pasarela de pagos de PRUEBA (sandbox). Imita a Wompi sin cobrar nada real:  1. POST /api/payments/prepare           -> el servidor calcula el total y da referencia + firma. 2. POST /api/payments/transactions      -> se crea la transaccion (nace PENDING). 3. GET  /api/payments/transactions/{id} -> se consulta hasta que deje de estar PENDING. 4. POST /api/orders                     -> el pedido solo se crea si la transaccion esta APPROVED.  Celulares de prueba (Nequi / Daviplata): 3991111111 -> aprobado   3992222222 -> rechazado   3993333333 -> error   otro -> aprobado"* |
| 13 | `class PagoService` | Crea la clase `PagoService`: una pasarela de pagos **de prueba** (no cobra dinero real). La usan `PaymentController` y `PedidoService`. |
| 14 | `{` | Abre la clase `PagoService`. |
| 15 | `const MONEDA = 'COP';` | Constante `MONEDA`: pesos colombianos (`COP`). |
| 16 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Clave secreta para firmar los pagos. Cambiala por un texto largo al azar."* |
| 17 | `const CLAVE_FIRMA = 'changeme_generate_a_random_32_byte_string';` | Constante `CLAVE_FIRMA`: la clave secreta para firmar los pagos. Con ella se revisa que nadie cambie el monto. |
| 18 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Segundos que la transaccion queda PENDING."* |
| 19 | `const SEGUNDOS_PENDIENTE = 4;` | Constante `SEGUNDOS_PENDIENTE`: cuántos segundos el pago queda "pendiente" antes de aprobarse (4). |
| 21 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 23 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 24 | `{` | Abre la función `__construct()`. |
| 25 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 26 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 27 | `}` | Cierra la función `__construct()`. |
| 29 | `private function firmar($referencia, $centavos, $idCliente)` | Método `firmar(...)` (privado): crea la firma de seguridad de un pago. |
| 30 | `{` | Abre la función `firmar()`. |
| 31 | `return hash_hmac('sha256', $referencia . '\|' . $centavos . '\|' . self::MONEDA . '\|' . $idCliente, self::CLAVE_FIRMA);` | Junta la referencia, el monto, la moneda y el cliente separados por `\|`, y los "firma" con la clave secreta (`hash_hmac`). Si alguien cambia el monto, la firma ya no coincide. |
| 32 | `}` | Cierra la función `firmar()`. |
| 34 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Datos del checkout: el monto y la referencia los pone el servidor."* |
| 35 | `public function prepararCheckout($total, $idCliente)` | Método `prepararCheckout($total, $idCliente)`: paso 1 del pago. Prepara el monto, la referencia y la firma. Lo usa `PaymentController::prepare()`. |
| 36 | `{` | Abre la función `prepararCheckout()`. |
| 37 | `$centavos = (int) round($total * 100);` | Convierte el total a centavos (× 100, redondeado con `round`) y lo guarda en `$centavos`. |
| 38 | `$referencia = 'CW-' . $idCliente . '-' . time() . '-' . strtoupper(bin2hex(random_bytes(3)));` | Crea una referencia única: `CW-` + el cliente + la hora (`time()`) + 6 letras al azar en mayúscula (`strtoupper`). |
| 40 | `return [` | Devuelve: |
| 41 | `'currency'      => self::MONEDA,` | la moneda, |
| 42 | `'amountInCents' => $centavos,` | el monto en centavos, |
| 43 | `'reference'     => $referencia,` | la referencia, |
| 44 | `'signature'     => $this->firmar($referencia, $centavos, $idCliente),` | la firma (`firmar()` de arriba), |
| 45 | `'sandbox'       => true,` | y que es de prueba (`'sandbox' => true`). |
| 46 | `];` | Cierra la lista. |
| 47 | `}` | Cierra la función `prepararCheckout()`. |
| 49 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea la transaccion de prueba (PENDING) despues de validar la firma."* |
| 50 | `public function crearTransaccion($idCliente, $referencia, $centavos, $firma, $metodo, $telefono)` | Método `crearTransaccion(...)`: paso 2 del pago. Crea el pago después de revisar la firma. Lo usa `PaymentController::createTransaction()`. |
| 51 | `{` | Abre la función `crearTransaccion()`. |
| 52 | `$centavos = (int) $centavos;` | Convierte los centavos a número entero. |
| 53 | `if (!hash_equals($this->firmar($referencia, $centavos, $idCliente), (string) $firma)) {` | Si la firma no coincide con la que se calcula de nuevo (`hash_equals` las compara)... |
| 54 | `throw new InvalidArgumentException('La firma del pago no es válida. Vuelve a iniciar el pago.');` | ...lanza el error "La firma del pago no es válida.". |
| 55 | `}` | Cierra el `if`. |
| 56 | `if (strpos($referencia, 'CW-' . $idCliente . '-') !== 0) {` | Si la referencia no empieza con `CW-` + este cliente... |
| 57 | `throw new InvalidArgumentException('La referencia no corresponde a este usuario.');` | ...lanza el error "La referencia no corresponde a este usuario.". |
| 58 | `}` | Cierra el `if`. |
| 59 | `if (!in_array($metodo, ['nequi', 'daviplata', 'bancolombia'], true)) {` | Si el banco no es Nequi, Daviplata ni Bancolombia... |
| 60 | `throw new InvalidArgumentException('Método de pago no soportado.');` | ...lanza el error "Método de pago no soportado.". |
| 61 | `}` | Cierra el `if`. |
| 63 | `$stmt = $this->conn->prepare("SELECT id FROM PAGO_TRANSACCION WHERE referencia = ?");` | Prepara la consulta: "busca si ya existe un pago con esa referencia". |
| 64 | `$stmt->bind_param("s", $referencia);` | Llena los `?` de la consulta, en orden: `$referencia` (texto). |
| 65 | `$stmt->execute();` | Ejecuta la consulta. |
| 66 | `$existe = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$existe`. |
| 67 | `$stmt->close();` | Cierra la consulta. |
| 68 | `if ($existe) {` | Si ya existe... |
| 69 | `throw new InvalidArgumentException('Esta referencia de pago ya fue usada. Vuelve a iniciar el pago.');` | ...lanza el error "Esta referencia de pago ya fue usada." (un pago no se puede usar dos veces). |
| 70 | `}` | Cierra el `if`. |
| 72 | `$id = $this->insertarTransaccion($idCliente, null, $referencia, $centavos, $metodo, $telefono);` | Guarda el pago con `insertarTransaccion()` (de abajo). `null` = no es de un link de pedido. Guarda el número del pago en `$id`. |
| 73 | `return $this->obtenerTransaccion($id, $idCliente);` | Devuelve el pago (`obtenerTransaccion()` de abajo). |
| 74 | `}` | Cierra la función `crearTransaccion()`. |
| 76-79 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Transaccion para pagar un pedido manual por link (el cliente puede no tener cuenta). El monto sale del pedido guardado, nunca del navegador."* |
| 80 | `public function crearTransaccionDePedido($idPedido, $total, $metodo, $telefono)` | Método `crearTransaccionDePedido(...)`: crea el pago de un pedido manual que se paga por link. Lo usa `PedidoService::iniciarPagoLink()`. |
| 81 | `{` | Abre la función `crearTransaccionDePedido()`. |
| 82 | `if (!in_array($metodo, ['nequi', 'daviplata', 'bancolombia'], true)) {` | Si el método no es Nequi, Daviplata ni Bancolombia... |
| 83 | `throw new InvalidArgumentException('Método de pago no soportado.');` | ...lanza el error "Método de pago no soportado.". |
| 84 | `}` | Cierra el `if`. |
| 85 | `$centavos = (int) round($total * 100);` | Pasa el total del pedido a centavos (por 100, redondeado). |
| 86 | `$referencia = 'CW-LINK-' . $idPedido . '-' . time() . '-' . strtoupper(bin2hex(random_bytes(3)));` | Crea la referencia del pago: `CW-LINK-` + número del pedido + la hora + 6 letras al azar. |
| 88 | `$id = $this->insertarTransaccion(null, $idPedido, $referencia, $centavos, $metodo, $telefono);` | Guarda el pago con `insertarTransaccion()`: sin cliente (`null`) y con el número del pedido. |
| 89 | `return $this->obtenerTransaccion($id);` | Devuelve el pago. |
| 90 | `}` | Cierra la función `crearTransaccionDePedido()`. |
| 92 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Lee una transaccion solo si es del pedido indicado."* |
| 93 | `public function obtenerTransaccionDePedido($id, $idPedido)` | Método `obtenerTransaccionDePedido($id, $idPedido)`: consulta un pago, pero solo si es de ese pedido. Lo usa `PedidoService::consultarPagoLink()`. |
| 94 | `{` | Abre la función `obtenerTransaccionDePedido()`. |
| 95 | `$id = (string) $id;` | Convierte `$id` en texto. |
| 96 | `$stmt = $this->conn->prepare("SELECT id FROM PAGO_TRANSACCION WHERE id = ? AND id_pedido = ?");` | Prepara la consulta: "busca el pago con ese número **y** de ese pedido". |
| 97 | `$stmt->bind_param("si", $id, $idPedido);` | Llena los `?`: `$id` (texto) y `$idPedido` (número entero). |
| 98 | `$stmt->execute();` | Ejecuta la consulta. |
| 99 | `$existe = $stmt->get_result()->fetch_assoc();` | Lo guarda en `$existe`. |
| 100 | `$stmt->close();` | Cierra la consulta. |
| 101 | `if (!$existe) {` | Si no existe (o es de otro pedido)... |
| 102 | `return null;` | ...devuelve `null` (nada). |
| 103 | `}` | Cierra el `if`. |
| 104 | `return $this->obtenerTransaccion($id);` | Devuelve el pago (`obtenerTransaccion()` de abajo). |
| 105 | `}` | Cierra la función `obtenerTransaccionDePedido()`. |
| 107 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Guarda la transaccion de prueba (nace PENDING) y devuelve su id."* |
| 108 | `private function insertarTransaccion($idCliente, $idPedido, $referencia, $centavos, $metodo, $telefono)` | Método privado `insertarTransaccion(...)`: guarda el pago de prueba. Lo usan `crearTransaccion()` (pago del cliente) y `crearTransaccionDePedido()` (pago por link), para no repetir el código. |
| 109 | `{` | Abre la función `insertarTransaccion()`. |
| 110 | `$telefonoLimpio = preg_replace('/\D/', '', (string) $telefono);` | Deja solo los números del celular. |
| 111 | `if ($metodo !== 'bancolombia' && !preg_match('/^3\d{9}$/', $telefonoLimpio)) {` | Si no es Bancolombia y el celular no es `3` + 9 números... |
| 112 | `throw new InvalidArgumentException('Ingresa un celular válido de 10 dígitos.');` | ...lanza el error "Ingresa un celular válido de 10 dígitos.". |
| 113 | `}` | Cierra el `if`. |
| 115 | `$final = 'APPROVED';` | El resultado final empieza como aprobado (`'APPROVED'`). |
| 116 | `if ($telefonoLimpio === '3992222222') $final = 'DECLINED';` | Si el celular es el de prueba `3992222222`, será rechazado. |
| 117 | `if ($telefonoLimpio === '3993333333') $final = 'ERROR';` | Si es `3993333333`, dará error. |
| 119 | `$id = 'sbx-' . strtolower(bin2hex(random_bytes(8)));` | Crea el número del pago: `sbx-` + 16 letras al azar. |
| 120 | `$moneda = self::MONEDA;` | Guarda la moneda. |
| 121 | `$telefonoGuardado = $telefonoLimpio ?: null;` | Guarda el celular (si quedó vacío, `null`). |
| 123 | `$stmtI = $this->conn->prepare(` | Prepara la consulta: "guarda el pago en `PAGO_TRANSACCION` como pendiente (`'PENDING'`), con su resultado final". |
| 124 | `"INSERT INTO PAGO_TRANSACCION (id, referencia, id_cliente, id_pedido, monto_centavos, moneda, metodo, telefono, estado, estado_final)` | ↑ (sigue la misma instrucción) |
| 125 | `VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)"` | ↑ (sigue la misma instrucción) |
| 126 | `);` | ↑ (sigue la misma instrucción) |
| 127 | `$stmtI->bind_param("ssiiissss", $id, $referencia, $idCliente, $idPedido, $centavos, $moneda, $metodo, $telefonoGuardado, $final);` | Llena los `?` de la consulta, en orden: `$id`, `$referencia` (texto), `$idCliente`, `$idPedido`, `$centavos` (números enteros; el cliente o el pedido pueden ser `null`), `$moneda`, `$metodo`, `$telefonoGuardado`, `$final` (texto). |
| 128 | `$stmtI->execute();` | Ejecuta la consulta. |
| 129 | `$stmtI->close();` | Cierra la consulta. |
| 131 | `return $id;` | Devuelve el número del pago guardado. |
| 132 | `}` | Cierra la función `insertarTransaccion()`. |
| 134-137 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Lee la transaccion. Si ya paso el tiempo de espera, pasa de PENDING a su estado final. Con $idCliente solo devuelve transacciones de ese cliente."* |
| 138 | `public function obtenerTransaccion($id, $idCliente = null)` | Método `obtenerTransaccion($id, $idCliente)`: consulta un pago. Si ya pasaron los 4 segundos, lo pasa a su resultado final. Lo usan `PaymentController::showTransaction()` y `verificarTransaccion()`. |
| 139 | `{` | Abre la función `obtenerTransaccion()`. |
| 140 | `$id = (string) $id;` | Convierte el número del pago a texto. |
| 141 | `$stmt = $this->conn->prepare("SELECT *, TIMESTAMPDIFF(SECOND, creado_en, NOW()) AS segundos FROM PAGO_TRANSACCION WHERE id = ?");` | Prepara la consulta: "trae el pago y cuántos segundos han pasado desde que se creó (`TIMESTAMPDIFF`)". |
| 142 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 143 | `$stmt->execute();` | Ejecuta la consulta. |
| 144 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 145 | `$stmt->close();` | Cierra la consulta. |
| 147 | `if (!$row \|\| ($idCliente !== null && (int) $row['id_cliente'] !== (int) $idCliente)) {` | Si no existe, o no es de este cliente... |
| 148 | `return null;` | ...devuelve `null`. |
| 149 | `}` | Cierra el `if`. |
| 151 | `if ($row['estado'] === 'PENDING' && (int) $row['segundos'] >= self::SEGUNDOS_PENDIENTE) {` | Si sigue pendiente y ya pasaron 4 segundos o más... |
| 152 | `$stmtU = $this->conn->prepare("UPDATE PAGO_TRANSACCION SET estado = ?, resuelto_en = NOW() WHERE id = ? AND estado = 'PENDING'");` | ...prepara la consulta: "cambia el estado al resultado final y anota cuándo". |
| 153 | `$stmtU->bind_param("ss", $row['estado_final'], $row['id']);` | Llena los `?` de la consulta, en orden: `$row['estado_final']` (texto), `$row['id']` (texto). |
| 154 | `$stmtU->execute();` | Ejecuta la consulta. |
| 155 | `$stmtU->close();` | Cierra la consulta. |
| 156 | `$row['estado'] = $row['estado_final'];` | Cambia también el estado en `$row`. |
| 157 | `}` | Cierra el `if`. |
| 159 | `return [` | Devuelve el pago con los nombres que usa React: |
| 160 | `'id'              => $row['id'],` | el número, |
| 161 | `'status'          => $row['estado'],` | el estado, |
| 162 | `'reference'       => $row['referencia'],` | la referencia, |
| 163 | `'amount_in_cents' => (int) $row['monto_centavos'],` | el monto en centavos, |
| 164 | `'currency'        => $row['moneda'],` | la moneda, |
| 165 | `'payment_method'  => $row['metodo'],` | el banco, |
| 166 | `'status_message'  => $this->mensaje($row['estado']),` | y el mensaje del estado (`mensaje()` de abajo). |
| 167 | `];` | Cierra la lista. |
| 168 | `}` | Cierra la función `obtenerTransaccion()`. |
| 170 | `private function mensaje($estado)` | Método `mensaje($estado)` (privado): el mensaje de cada estado. |
| 171 | `{` | Abre la función `mensaje()`. |
| 172 | `$mensajes = [` | Lista de mensajes: |
| 173 | `'PENDING'  => 'Esperando la aprobación en tu celular.',` | pendiente: "Esperando la aprobación en tu celular.", |
| 174 | `'APPROVED' => 'Transacción aprobada.',` | aprobado: "Transacción aprobada.", |
| 175 | `'DECLINED' => 'La transacción fue rechazada.',` | rechazado: "La transacción fue rechazada.", |
| 176 | `'ERROR'    => 'Ocurrió un error al procesar la transacción.',` | error: "Ocurrió un error al procesar la transacción.". |
| 177 | `];` | Cierra la lista. |
| 178 | `return $mensajes[$estado] ?? '';` | Devuelve el mensaje de ese estado (si no hay, vacío). |
| 179 | `}` | Cierra la función `mensaje()`. |
| 181 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Revisa que la transaccion sirva para pagar este pedido (la llama PedidoService::crear)."* |
| 182 | `public function verificarTransaccion($idTransaccion, $totalEsperado, $idCliente)` | Método `verificarTransaccion(...)`: revisa que el pago sirva para el pedido antes de crearlo. Lo usa `PedidoService::crear()`. |
| 183 | `{` | Abre la función `verificarTransaccion()`. |
| 184 | `if (!preg_match('/^sbx-[a-f0-9]{16}$/', $idTransaccion)) {` | Si el número del pago no tiene la forma `sbx-` + 16 letras... |
| 185 | `throw new Exception('Falta la confirmación del pago. Intenta pagar de nuevo.');` | ...lanza el error "Falta la confirmación del pago.". |
| 186 | `}` | Cierra el `if`. |
| 188 | `$tx = $this->obtenerTransaccion($idTransaccion, $idCliente);` | Busca el pago. |
| 189 | `if ($tx === null) {` | Si no existe... |
| 190 | `throw new Exception('No encontramos ese pago. Intenta pagar de nuevo.');` | ...lanza el error "No encontramos ese pago.". |
| 191 | `}` | Cierra el `if`. |
| 192 | `if ($tx['status'] === 'PENDING') {` | Si sigue pendiente... |
| 193 | `throw new Exception('Tu pago aún está en proceso. Espera unos segundos e inténtalo de nuevo.');` | ...lanza el error "Tu pago aún está en proceso.". |
| 194 | `}` | Cierra el `if`. |
| 195 | `if ($tx['status'] !== 'APPROVED') {` | Si no fue aprobado... |
| 196 | `throw new Exception('El pago fue rechazado por la pasarela. Intenta con otro método.');` | ...lanza el error "El pago fue rechazado por la pasarela.". |
| 197 | `}` | Cierra el `if`. |
| 198 | `if ($tx['amount_in_cents'] !== (int) round($totalEsperado * 100) \|\| $tx['currency'] !== self::MONEDA) {` | Si el monto pagado no es igual al total del pedido, o la moneda no es la misma... |
| 199 | `throw new Exception('El monto pagado no coincide con el del pedido.');` | ...lanza el error "El monto pagado no coincide con el del pedido.". |
| 200 | `}` | Cierra el `if`. |
| 202 | `return ['id' => $tx['id'], 'referencia' => $tx['reference']];` | Si todo está bien, devuelve el número y la referencia del pago. |
| 203 | `}` | Cierra la función `verificarTransaccion()`. |
| 204 | `}` | Cierra la clase `PagoService`. |
| 205 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado | `Failed to open stream` |
| el método `firmar()` | empezar un pago en línea, crear el pago | `Call to undefined method PagoService::firmar()` |
| el método `prepararCheckout()` | empezar un pago en línea | `Call to undefined method PagoService::prepararCheckout()` |
| el método `crearTransaccion()` | crear el pago | `Call to undefined method PagoService::crearTransaccion()` |
| el método `obtenerTransaccion()` | hacer pedidos (cliente), crear el pago, saber si el pago fue aprobado | `Call to undefined method PagoService::obtenerTransaccion()` |
| el método `crearTransaccionDePedido()` | pagar un pedido manual por link | `Call to undefined method PagoService::crearTransaccionDePedido()` |
| el método `obtenerTransaccionDePedido()` | saber si el pago por link fue aprobado | `Call to undefined method PagoService::obtenerTransaccionDePedido()` |
| el método `insertarTransaccion()` | crear el pago, pagar un pedido por link | `Call to undefined method PagoService::insertarTransaccion()` |
| el método `mensaje()` | hacer pedidos (cliente), crear el pago, saber si el pago fue aprobado | `Call to undefined method PagoService::mensaje()` |
| el método `verificarTransaccion()` | hacer pedidos (cliente) | `Call to undefined method PagoService::verificarTransaccion()` |
| la constante `MONEDA` | lo que la usa dentro de la clase | `Undefined constant PagoService::MONEDA` |
| la constante `CLAVE_FIRMA` | lo que la usa dentro de la clase | `Undefined constant PagoService::CLAVE_FIRMA` |
| la constante `SEGUNDOS_PENDIENTE` | lo que la usa dentro de la clase | `Undefined constant PagoService::SEGUNDOS_PENDIENTE` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
