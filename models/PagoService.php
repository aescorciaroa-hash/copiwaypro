<?php
/**
 * Pasarela de pagos de PRUEBA (sandbox). Imita a Wompi sin cobrar nada real:
 *
 *   1. POST /api/payments/prepare           -> el servidor calcula el total y da referencia + firma.
 *   2. POST /api/payments/transactions      -> se crea la transaccion (nace PENDING).
 *   3. GET  /api/payments/transactions/{id} -> se consulta hasta que deje de estar PENDING.
 *   4. POST /api/orders                     -> el pedido solo se crea si la transaccion esta APPROVED.
 *
 * Celulares de prueba (Nequi / Daviplata):
 *   3991111111 -> aprobado   3992222222 -> rechazado   3993333333 -> error   otro -> aprobado
 */
class PagoService
{
    const MONEDA = 'COP';
    // Clave secreta para firmar los pagos. Cambiala por un texto largo al azar.
    const CLAVE_FIRMA = 'changeme_generate_a_random_32_byte_string';
    /** Segundos que la transaccion queda PENDING. */
    const SEGUNDOS_PENDIENTE = 4;

    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    private function firmar($referencia, $centavos, $idCliente)
    {
        return hash_hmac('sha256', $referencia . '|' . $centavos . '|' . self::MONEDA . '|' . $idCliente, self::CLAVE_FIRMA);
    }

    /** Datos del checkout: el monto y la referencia los pone el servidor. */
    public function prepararCheckout($total, $idCliente)
    {
        $centavos = (int) round($total * 100);
        $referencia = 'CW-' . $idCliente . '-' . time() . '-' . strtoupper(bin2hex(random_bytes(3)));

        return [
            'currency'      => self::MONEDA,
            'amountInCents' => $centavos,
            'reference'     => $referencia,
            'signature'     => $this->firmar($referencia, $centavos, $idCliente),
            'sandbox'       => true,
        ];
    }

    /** Crea la transaccion de prueba (PENDING) despues de validar la firma. */
    public function crearTransaccion($idCliente, $referencia, $centavos, $firma, $metodo, $telefono)
    {
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

        $stmt = $this->conn->prepare("SELECT id FROM PAGO_TRANSACCION WHERE referencia = ?");
        $stmt->bind_param("s", $referencia);
        $stmt->execute();
        $existe = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($existe) {
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
        $moneda = self::MONEDA;
        $telefonoGuardado = $telefonoLimpio ?: null;

        $stmtI = $this->conn->prepare(
            "INSERT INTO PAGO_TRANSACCION (id, referencia, id_cliente, monto_centavos, moneda, metodo, telefono, estado, estado_final)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)"
        );
        $stmtI->bind_param("ssiissss", $id, $referencia, $idCliente, $centavos, $moneda, $metodo, $telefonoGuardado, $final);
        $stmtI->execute();
        $stmtI->close();

        return $this->obtenerTransaccion($id, $idCliente);
    }

    /**
     * Lee la transaccion. Si ya paso el tiempo de espera, pasa de PENDING a su estado final.
     * Con $idCliente solo devuelve transacciones de ese cliente.
     */
    public function obtenerTransaccion($id, $idCliente = null)
    {
        $id = (string) $id;
        $stmt = $this->conn->prepare("SELECT *, TIMESTAMPDIFF(SECOND, creado_en, NOW()) AS segundos FROM PAGO_TRANSACCION WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row || ($idCliente !== null && (int) $row['id_cliente'] !== (int) $idCliente)) {
            return null;
        }

        if ($row['estado'] === 'PENDING' && (int) $row['segundos'] >= self::SEGUNDOS_PENDIENTE) {
            $stmtU = $this->conn->prepare("UPDATE PAGO_TRANSACCION SET estado = ?, resuelto_en = NOW() WHERE id = ? AND estado = 'PENDING'");
            $stmtU->bind_param("ss", $row['estado_final'], $row['id']);
            $stmtU->execute();
            $stmtU->close();
            $row['estado'] = $row['estado_final'];
        }

        return [
            'id'              => $row['id'],
            'status'          => $row['estado'],
            'reference'       => $row['referencia'],
            'amount_in_cents' => (int) $row['monto_centavos'],
            'currency'        => $row['moneda'],
            'payment_method'  => $row['metodo'],
            'status_message'  => $this->mensaje($row['estado']),
        ];
    }

    private function mensaje($estado)
    {
        $mensajes = [
            'PENDING'  => 'Esperando la aprobación en tu celular.',
            'APPROVED' => 'Transacción aprobada.',
            'DECLINED' => 'La transacción fue rechazada.',
            'ERROR'    => 'Ocurrió un error al procesar la transacción.',
        ];
        return $mensajes[$estado] ?? '';
    }

    /** Revisa que la transaccion sirva para pagar este pedido (la llama PedidoService::crear). */
    public function verificarTransaccion($idTransaccion, $totalEsperado, $idCliente)
    {
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
?>