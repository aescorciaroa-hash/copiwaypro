<?php
/**
 * Controlador de Pagos (pasarela de prueba, ver PagoService).
 * El total siempre lo calcula el servidor con PedidoService::cotizar().
 */
require_once __DIR__ . '/../models/PedidoService.php';

class PaymentController
{
    private $pedidoService;
    private $pagoService;
    private $datos;

    public function __construct()
    {
        $this->pedidoService = new PedidoService();
        $this->pagoService = new PagoService();
        $this->datos = entrada();
    }

    public function prepare()
    {
        // Paso 1: recalcula el total del carrito y entrega referencia + firma.
        if (empty($this->datos['items'])) {
            responderError('Datos inválidos.', 422, ['items' => ['El campo items es obligatorio.']]);
        }

        try {
            $total = $this->pedidoService->cotizar(Auth::id(), $this->datos);
            responderJson($this->pagoService->prepararCheckout($total, Auth::id()) + ['total' => $total]);
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 422);
        } catch (Exception $e) {
            $mensaje = $e->getMessage();
            $codigo  = (stripos($mensaje, 'cerrada') !== false || stripos($mensaje, 'pausada') !== false) ? 403 : 409;
            responderError($mensaje, $codigo);
        }
    }

    public function createTransaction()
    {
        // Paso 2: crea la transaccion (nace PENDING).
        $referencia = (string) ($this->datos['reference'] ?? '');
        $centavos   = (int) ($this->datos['amountInCents'] ?? 0);
        $firma      = (string) ($this->datos['signature'] ?? '');
        $metodo     = (string) ($this->datos['method'] ?? '');
        $telefono   = (string) ($this->datos['phone'] ?? '');

        try {
            $tx = $this->pagoService->crearTransaccion(Auth::id(), $referencia, $centavos, $firma, $metodo, $telefono);
            responderJson($tx, 201);
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 422);
        }
    }

    public function showTransaction()
    {
        // Paso 3: consulta el estado hasta que deje de estar PENDING.
        $id = $_GET['id'];
        $tx = $this->pagoService->obtenerTransaccion($id, Auth::id());
        if (!$tx) {
            responderError('Transacción no encontrada.', 404);
        }
        responderJson($tx);
    }
}

$controller = new PaymentController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'prepare') {
    $controller->prepare();
} elseif ($accion === 'createTransaction') {
    $controller->createTransaction();
} elseif ($accion === 'showTransaction') {
    $controller->showTransaction();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>