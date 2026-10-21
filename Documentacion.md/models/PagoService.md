# models/PagoService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja los pagos en línea de prueba.

## ¿Qué hace?
- prepara el pago (monto y referencia)
- crea el pago
- consulta el pago
- revisa que el pago sirva para el pedido

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `firmar()` (privado) | crea la firma de seguridad del pago | `PagoService::crearTransaccion()`, `PagoService::prepararCheckout()` |
| `prepararCheckout()` | prepara el pago (monto y referencia) | `PaymentController::prepare()` |
| `crearTransaccion()` | crea el pago | `PaymentController::createTransaction()` |
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
| 72 | `$telefonoLimpio = preg_replace('/\D/', '', (string) $telefono);` | Deja solo los números del celular. |
| 73 | `if ($metodo !== 'bancolombia' && !preg_match('/^3\d{9}$/', $telefonoLimpio)) {` | Si no es Bancolombia y el celular no es `3` + 9 números... |
| 74 | `throw new InvalidArgumentException('Ingresa un celular válido de 10 dígitos.');` | ...lanza el error "Ingresa un celular válido de 10 dígitos.". |
| 75 | `}` | Cierra el `if`. |
| 77 | `$final = 'APPROVED';` | El resultado final empieza como aprobado (`'APPROVED'`). |
| 78 | `if ($telefonoLimpio === '3992222222') $final = 'DECLINED';` | Si el celular es el de prueba `3992222222`, será rechazado. |
| 79 | `if ($telefonoLimpio === '3993333333') $final = 'ERROR';` | Si es `3993333333`, dará error. |
| 81 | `$id = 'sbx-' . strtolower(bin2hex(random_bytes(8)));` | Crea el número del pago: `sbx-` + 16 letras al azar. |
| 82 | `$moneda = self::MONEDA;` | Guarda la moneda. |
| 83 | `$telefonoGuardado = $telefonoLimpio ?: null;` | Guarda el celular (si quedó vacío, `null`). |
| 85 | `$stmtI = $this->conn->prepare(` | Prepara la consulta: "guarda el pago en `PAGO_TRANSACCION` como pendiente (`'PENDING'`), con su resultado final". |
| 86 | `"INSERT INTO PAGO_TRANSACCION (id, referencia, id_cliente, monto_centavos, moneda, metodo, telefono, estado, estado_final)` | ↑ (sigue la misma instrucción) |
| 87 | `VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)"` | ↑ (sigue la misma instrucción) |
| 88 | `);` | ↑ (sigue la misma instrucción) |
| 89 | `$stmtI->bind_param("ssiissss", $id, $referencia, $idCliente, $centavos, $moneda, $metodo, $telefonoGuardado, $final);` | Llena los `?` de la consulta, en orden: `$id` (texto), `$referencia` (texto), `$idCliente` (número entero), `$centavos` (número entero), `$moneda` (texto), `$metodo` (texto), `$telefonoGuardado` (texto), `$final` (texto). |
| 90 | `$stmtI->execute();` | Ejecuta la consulta. |
| 91 | `$stmtI->close();` | Cierra la consulta. |
| 93 | `return $this->obtenerTransaccion($id, $idCliente);` | Devuelve el pago (`obtenerTransaccion()` de abajo). |
| 94 | `}` | Cierra la función `crearTransaccion()`. |
| 96-99 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Lee la transaccion. Si ya paso el tiempo de espera, pasa de PENDING a su estado final. Con $idCliente solo devuelve transacciones de ese cliente."* |
| 100 | `public function obtenerTransaccion($id, $idCliente = null)` | Método `obtenerTransaccion($id, $idCliente)`: consulta un pago. Si ya pasaron los 4 segundos, lo pasa a su resultado final. Lo usan `PaymentController::showTransaction()` y `verificarTransaccion()`. |
| 101 | `{` | Abre la función `obtenerTransaccion()`. |
| 102 | `$id = (string) $id;` | Convierte el número del pago a texto. |
| 103 | `$stmt = $this->conn->prepare("SELECT *, TIMESTAMPDIFF(SECOND, creado_en, NOW()) AS segundos FROM PAGO_TRANSACCION WHERE id = ?");` | Prepara la consulta: "trae el pago y cuántos segundos han pasado desde que se creó (`TIMESTAMPDIFF`)". |
| 104 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 105 | `$stmt->execute();` | Ejecuta la consulta. |
| 106 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 107 | `$stmt->close();` | Cierra la consulta. |
| 109 | `if (!$row \|\| ($idCliente !== null && (int) $row['id_cliente'] !== (int) $idCliente)) {` | Si no existe, o no es de este cliente... |
| 110 | `return null;` | ...devuelve `null`. |
| 111 | `}` | Cierra el `if`. |
| 113 | `if ($row['estado'] === 'PENDING' && (int) $row['segundos'] >= self::SEGUNDOS_PENDIENTE) {` | Si sigue pendiente y ya pasaron 4 segundos o más... |
| 114 | `$stmtU = $this->conn->prepare("UPDATE PAGO_TRANSACCION SET estado = ?, resuelto_en = NOW() WHERE id = ? AND estado = 'PENDING'");` | ...prepara la consulta: "cambia el estado al resultado final y anota cuándo". |
| 115 | `$stmtU->bind_param("ss", $row['estado_final'], $row['id']);` | Llena los `?` de la consulta, en orden: `$row['estado_final']` (texto), `$row['id']` (texto). |
| 116 | `$stmtU->execute();` | Ejecuta la consulta. |
| 117 | `$stmtU->close();` | Cierra la consulta. |
| 118 | `$row['estado'] = $row['estado_final'];` | Cambia también el estado en `$row`. |
| 119 | `}` | Cierra el `if`. |
| 121 | `return [` | Devuelve el pago con los nombres que usa React: |
| 122 | `'id'              => $row['id'],` | el número, |
| 123 | `'status'          => $row['estado'],` | el estado, |
| 124 | `'reference'       => $row['referencia'],` | la referencia, |
| 125 | `'amount_in_cents' => (int) $row['monto_centavos'],` | el monto en centavos, |
| 126 | `'currency'        => $row['moneda'],` | la moneda, |
| 127 | `'payment_method'  => $row['metodo'],` | el banco, |
| 128 | `'status_message'  => $this->mensaje($row['estado']),` | y el mensaje del estado (`mensaje()` de abajo). |
| 129 | `];` | Cierra la lista. |
| 130 | `}` | Cierra la función `obtenerTransaccion()`. |
| 132 | `private function mensaje($estado)` | Método `mensaje($estado)` (privado): el mensaje de cada estado. |
| 133 | `{` | Abre la función `mensaje()`. |
| 134 | `$mensajes = [` | Lista de mensajes: |
| 135 | `'PENDING'  => 'Esperando la aprobación en tu celular.',` | pendiente: "Esperando la aprobación en tu celular.", |
| 136 | `'APPROVED' => 'Transacción aprobada.',` | aprobado: "Transacción aprobada.", |
| 137 | `'DECLINED' => 'La transacción fue rechazada.',` | rechazado: "La transacción fue rechazada.", |
| 138 | `'ERROR'    => 'Ocurrió un error al procesar la transacción.',` | error: "Ocurrió un error al procesar la transacción.". |
| 139 | `];` | Cierra la lista. |
| 140 | `return $mensajes[$estado] ?? '';` | Devuelve el mensaje de ese estado (si no hay, vacío). |
| 141 | `}` | Cierra la función `mensaje()`. |
| 143 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Revisa que la transaccion sirva para pagar este pedido (la llama PedidoService::crear)."* |
| 144 | `public function verificarTransaccion($idTransaccion, $totalEsperado, $idCliente)` | Método `verificarTransaccion(...)`: revisa que el pago sirva para el pedido antes de crearlo. Lo usa `PedidoService::crear()`. |
| 145 | `{` | Abre la función `verificarTransaccion()`. |
| 146 | `if (!preg_match('/^sbx-[a-f0-9]{16}$/', $idTransaccion)) {` | Si el número del pago no tiene la forma `sbx-` + 16 letras... |
| 147 | `throw new Exception('Falta la confirmación del pago. Intenta pagar de nuevo.');` | ...lanza el error "Falta la confirmación del pago.". |
| 148 | `}` | Cierra el `if`. |
| 150 | `$tx = $this->obtenerTransaccion($idTransaccion, $idCliente);` | Busca el pago. |
| 151 | `if ($tx === null) {` | Si no existe... |
| 152 | `throw new Exception('No encontramos ese pago. Intenta pagar de nuevo.');` | ...lanza el error "No encontramos ese pago.". |
| 153 | `}` | Cierra el `if`. |
| 154 | `if ($tx['status'] === 'PENDING') {` | Si sigue pendiente... |
| 155 | `throw new Exception('Tu pago aún está en proceso. Espera unos segundos e inténtalo de nuevo.');` | ...lanza el error "Tu pago aún está en proceso.". |
| 156 | `}` | Cierra el `if`. |
| 157 | `if ($tx['status'] !== 'APPROVED') {` | Si no fue aprobado... |
| 158 | `throw new Exception('El pago fue rechazado por la pasarela. Intenta con otro método.');` | ...lanza el error "El pago fue rechazado por la pasarela.". |
| 159 | `}` | Cierra el `if`. |
| 160 | `if ($tx['amount_in_cents'] !== (int) round($totalEsperado * 100) \|\| $tx['currency'] !== self::MONEDA) {` | Si el monto pagado no es igual al total del pedido, o la moneda no es la misma... |
| 161 | `throw new Exception('El monto pagado no coincide con el del pedido.');` | ...lanza el error "El monto pagado no coincide con el del pedido.". |
| 162 | `}` | Cierra el `if`. |
| 164 | `return ['id' => $tx['id'], 'referencia' => $tx['reference']];` | Si todo está bien, devuelve el número y la referencia del pago. |
| 165 | `}` | Cierra la función `verificarTransaccion()`. |
| 166 | `}` | Cierra la clase `PagoService`. |
| 167 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado | `Failed to open stream` |
| el método `firmar()` | empezar un pago en línea, crear el pago | `Call to undefined method PagoService::firmar()` |
| el método `prepararCheckout()` | empezar un pago en línea | `Call to undefined method PagoService::prepararCheckout()` |
| el método `crearTransaccion()` | crear el pago | `Call to undefined method PagoService::crearTransaccion()` |
| el método `obtenerTransaccion()` | hacer pedidos (cliente), crear el pago, saber si el pago fue aprobado | `Call to undefined method PagoService::obtenerTransaccion()` |
| el método `mensaje()` | hacer pedidos (cliente), crear el pago, saber si el pago fue aprobado | `Call to undefined method PagoService::mensaje()` |
| el método `verificarTransaccion()` | hacer pedidos (cliente) | `Call to undefined method PagoService::verificarTransaccion()` |
| la constante `MONEDA` | lo que la usa dentro de la clase | `Undefined constant PagoService::MONEDA` |
| la constante `CLAVE_FIRMA` | lo que la usa dentro de la clase | `Undefined constant PagoService::CLAVE_FIRMA` |
| la constante `SEGUNDOS_PENDIENTE` | lo que la usa dentro de la clase | `Undefined constant PagoService::SEGUNDOS_PENDIENTE` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
