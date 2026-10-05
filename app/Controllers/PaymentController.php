<?php
// Pasarela de pagos de prueba (ver PagoService para el flujo completo). El
// total lo calcula PedidoService::cotizar() en el servidor, nunca el navegador.

class PaymentController {

    private function entrada() {
        $cuerpo = json_decode(file_get_contents('php://input') ?: '[]', true);
        return is_array($cuerpo) ? $cuerpo : [];
    }

    /** Paso 1: recalcula el total del carrito y emite referencia + firma. */
    public function prepare() {
        global $conn;
        $auth = new Autenticacion($conn);
        $datos = $this->entrada();

        if (empty($datos['items'])) {
            responderError('Datos inválidos.', 422, ['items' => ['El campo items es obligatorio.']]);
        }

        try {
            $total = (new PedidoService($conn))->cotizar($auth->idActual(), $datos);
            responderJson((new PagoService($conn))->prepararCheckout($total, $auth->idActual()) + ['total' => $total]);
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 422);
        } catch (Exception $e) {
            $mensaje = $e->getMessage();
            $codigo = (stripos($mensaje, 'cerrada') !== false || stripos($mensaje, 'pausada') !== false) ? 403 : 409;
            responderError($mensaje, $codigo);
        }
    }

    /** Paso 2: el checkout crea la transaccion (nace PENDING). */
    public function createTransaction() {
        global $conn;
        $auth = new Autenticacion($conn);
        $d = $this->entrada();

        try {
            $tx = (new PagoService($conn))->crearTransaccion(
                $auth->idActual(),
                (string) ($d['reference'] ?? ''),
                (int) ($d['amountInCents'] ?? 0),
                (string) ($d['signature'] ?? ''),
                (string) ($d['method'] ?? ''),
                (string) ($d['phone'] ?? '')
            );
            responderJson($tx, 201);
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 422);
        }
    }

    /** Paso 3: consulta el estado hasta que deje de estar PENDING. */
    public function showTransaction($id) {
        global $conn;
        $auth = new Autenticacion($conn);
        $tx = (new PagoService($conn))->obtenerTransaccion($id, $auth->idActual());
        if (!$tx) {
            responderError('Transacción no encontrada.', 404);
        }
        responderJson($tx);
    }
}
