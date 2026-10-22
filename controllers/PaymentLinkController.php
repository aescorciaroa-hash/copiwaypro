<?php
/**
 * Controlador del Link de Pago: el cliente de un pedido manual paga desde su
 * celular sin iniciar sesion. Todo se busca por el codigo secreto del link.
 */
require_once __DIR__ . '/../models/PedidoService.php';

class PaymentLinkController
{
    private $pedidoService;
    private $datos;

    public function __construct()
    {
        $this->pedidoService = new PedidoService();
        $this->datos = entrada();
    }

    public function show()
    {
        // Resumen del pedido para la pagina de pago.
        $pedido = $this->pedidoService->pedidoPorLink($_GET['codigo']);
        if (!$pedido) {
            responderError('Este link de pago no existe.', 404);
        }
        responderJson($pedido);
    }

    public function pay()
    {
        // Crea la transaccion de prueba (nace PENDING).
        $metodo   = (string) ($this->datos['method'] ?? '');
        $telefono = (string) ($this->datos['phone'] ?? '');

        try {
            responderJson($this->pedidoService->iniciarPagoLink($_GET['codigo'], $metodo, $telefono), 201);
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 422);
        }
    }

    public function status()
    {
        // Consulta la transaccion; si quedo aprobada el pedido pasa a cocina.
        try {
            responderJson($this->pedidoService->consultarPagoLink($_GET['codigo'], $_GET['id']));
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 404);
        }
    }
}

$controller = new PaymentLinkController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'show') {
    $controller->show();
} elseif ($accion === 'pay') {
    $controller->pay();
} elseif ($accion === 'status') {
    $controller->status();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>
