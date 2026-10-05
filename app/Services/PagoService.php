<?php
// Pasarela de pagos de PRUEBA ("sandbox"). Imita la mecanica de Wompi sin
// cobrar nada real, para poder cambiar despues a una pasarela de verdad sin
// tocar el resto del flujo:
//
//   1. POST /api/payments/prepare      -> el servidor recalcula el total y emite
//      referencia + monto en centavos + firma de integridad (como Wompi).
//   2. POST /api/payments/transactions -> el "checkout" crea la transaccion.
//      Nace PENDING (el cliente debe aprobar en su celular) y resuelve a
//      APPROVED / DECLINED / ERROR segun el numero de pruebas.
//   3. GET  /api/payments/transactions/{id} -> el checkout consulta hasta que
//      deja de estar PENDING.
//   4. POST /api/orders con paymentTransactionId -> el servidor VUELVE a leer la
//      transaccion y solo crea el pedido si esta APPROVED, con el monto y la
//      referencia esperados y sin haberse usado antes.
//
// Numeros de prueba (Nequi / Daviplata), igual que el sandbox de Wompi:
//   3991111111 -> aprobado     3992222222 -> rechazado     3993333333 -> error
//   cualquier otro numero      -> aprobado

class PagoService {

    const MONEDA = 'COP';
    /** Segundos que la transaccion queda PENDING (el cliente aprobando en su app). */
    const SEGUNDOS_PENDIENTE = 4;

    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    private function consulta($sql, $parametros = []) {
        $stmt = $this->conn->prepare($sql);
        if (!empty($parametros)) {
            $tipos = '';
            foreach ($parametros as $p) {
                $tipos .= is_int($p) ? 'i' : (is_float($p) ? 'd' : 's');
            }
            $stmt->bind_param($tipos, ...$parametros);
        }
        $stmt->execute();
        return $stmt;
    }

    private function firmar($referencia, $centavos, $idCliente) {
        return hash_hmac('sha256', $referencia . '|' . $centavos . '|' . self::MONEDA . '|' . $idCliente, (string) env('APP_KEY', 'copiway'));
    }

    /** Datos del checkout: monto y referencia los fija el servidor, nunca el navegador. */
    public function prepararCheckout($total, $idCliente) {
        $centavos = (int) round($total * 100);
        $referencia = 'CW-' . $idCliente . '-' . time() . '-' . strtoupper(bin2hex(random_bytes(3)));

        return [
            'currency' => self::MONEDA,
            'amountInCents' => $centavos,
            'reference' => $referencia,
            'signature' => $this->firmar($referencia, $centavos, $idCliente),
            'sandbox' => true,
        ];
    }

    /** Crea la transaccion de prueba (estado PENDING) tras validar la firma emitida en prepararCheckout(). */
    public function crearTransaccion($idCliente, $referencia, $centavos, $firma, $metodo, $telefono) {
        $centavos = (int) $centavos;
        if (!hash_equals($this->firmar($referencia, $centavos, $idCliente), (string) $firma)) {
            throw new InvalidArgumentException('La firma del pago no es válida. Vuelve a iniciar el pago.');
        }
        if (strpos($referencia, 'CW-' . $idCliente . '-') !== 0) {
            throw new InvalidArgumentException('La referencia no corresponde a este usuario.');
        }
        if (!in_array($metodo, ['nequi', 'daviplata', 'bancolombia'], true)) {
            throw new InvalidArgumentException('Método de pago no soportado.');
        }

        $stmt = $this->consulta('SELECT id FROM PAGO_TRANSACCION WHERE referencia = ?', [$referencia]);
        $existente = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($existente) {
            throw new InvalidArgumentException('Esta referencia de pago ya fue usada. Vuelve a iniciar el pago.');
        }

        $telefonoLimpio = preg_replace('/\D/', '', (string) $telefono);
        if ($metodo !== 'bancolombia' && !preg_match('/^3\d{9}$/', $telefonoLimpio)) {
            throw new InvalidArgumentException('Ingresa un celular válido de 10 dígitos.');
        }

        $final = 'APPROVED';
        if ($telefonoLimpio === '3992222222') $final = 'DECLINED';
        if ($telefonoLimpio === '3993333333') $final = 'ERROR';

        $id = 'sbx-' . strtolower(bin2hex(random_bytes(8)));
        $stmtIns = $this->consulta(
            "INSERT INTO PAGO_TRANSACCION (id, referencia, id_cliente, monto_centavos, moneda, metodo, telefono, estado, estado_final)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)",
            [$id, $referencia, $idCliente, $centavos, self::MONEDA, $metodo, $telefonoLimpio ?: null, $final]
        );
        $stmtIns->close();

        return $this->obtenerTransaccion($id, $idCliente);
    }

    /**
     * Lee la transaccion. Si ya paso el tiempo de espera, resuelve PENDING a su
     * estado final (en una pasarela real eso lo decide el banco).
     * Si se pasa $idCliente, solo devuelve transacciones de ese cliente.
     */
    public function obtenerTransaccion($id, $idCliente = null) {
        $stmt = $this->consulta('SELECT *, TIMESTAMPDIFF(SECOND, creado_en, NOW()) AS segundos FROM PAGO_TRANSACCION WHERE id = ?', [(string) $id]);
        $fila = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$fila || ($idCliente !== null && (int) $fila['id_cliente'] !== (int) $idCliente)) {
            return null;
        }

        if ($fila['estado'] === 'PENDING' && (int) $fila['segundos'] >= self::SEGUNDOS_PENDIENTE) {
            $stmtUpd = $this->consulta("UPDATE PAGO_TRANSACCION SET estado = ?, resuelto_en = NOW() WHERE id = ? AND estado = 'PENDING'", [$fila['estado_final'], $fila['id']]);
            $stmtUpd->close();
            $fila['estado'] = $fila['estado_final'];
        }

        return [
            'id' => $fila['id'],
            'status' => $fila['estado'],
            'reference' => $fila['referencia'],
            'amount_in_cents' => (int) $fila['monto_centavos'],
            'currency' => $fila['moneda'],
            'payment_method' => $fila['metodo'],
            'status_message' => $this->mensaje($fila['estado']),
        ];
    }

    private function mensaje($estado) {
        return [
            'PENDING' => 'Esperando la aprobación en tu celular.',
            'APPROVED' => 'Transacción aprobada.',
            'DECLINED' => 'La transacción fue rechazada.',
            'ERROR' => 'Ocurrió un error al procesar la transacción.',
        ][$estado] ?? '';
    }

    /**
     * Comprueba que una transaccion sirva para pagar ESTE pedido (lo llama
     * PedidoService::crear antes de insertar nada).
     * @return array{id: string, referencia: string}
     * @throws Exception con un mensaje claro si no se puede aceptar el pago.
     */
    public function verificarTransaccion($idTransaccion, $totalEsperado, $idCliente) {
        if (!preg_match('/^sbx-[a-f0-9]{16}$/', $idTransaccion)) {
            throw new Exception('Falta la confirmación del pago. Intenta pagar de nuevo.');
        }

        $tx = $this->obtenerTransaccion($idTransaccion, $idCliente);
        if ($tx === null) {
            throw new Exception('No encontramos ese pago. Intenta pagar de nuevo.');
        }
        if ($tx['status'] === 'PENDING') {
            throw new Exception('Tu pago aún está en proceso. Espera unos segundos e inténtalo de nuevo.');
        }
        if ($tx['status'] !== 'APPROVED') {
            throw new Exception('El pago fue rechazado por la pasarela. Intenta con otro método.');
        }
        if ($tx['amount_in_cents'] !== (int) round($totalEsperado * 100) || $tx['currency'] !== self::MONEDA) {
            throw new Exception('El monto pagado no coincide con el del pedido.');
        }

        return ['id' => $tx['id'], 'referencia' => $tx['reference']];
    }
}
