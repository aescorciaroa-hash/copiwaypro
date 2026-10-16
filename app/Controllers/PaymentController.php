<?php
/**
 * Controlador de Pagos (pasarela de prueba, ver PagoService).
 * El total siempre lo calcula el servidor con PedidoService::cotizar().
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Services/PedidoService.php';
require_once __DIR__ . '/../Services/PagoService.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$pedidoService = new PedidoService();
$pagoService   = new PagoService();
$datos         = entrada();

if ($action === 'prepare') {
    // Paso 1: recalcula el total del carrito y entrega referencia + firma.
    if (empty($datos['items'])) {
        responderError('Datos inválidos.', 422, ['items' => ['El campo items es obligatorio.']]);
    }

    try {
        $total = $pedidoService->cotizar(Auth::id(), $datos);
        responderJson($pagoService->prepararCheckout($total, Auth::id()) + ['total' => $total]);
    } catch (InvalidArgumentException $e) {
        responderError($e->getMessage(), 422);
    } catch (Exception $e) {
        $mensaje = $e->getMessage();
        $codigo  = (stripos($mensaje, 'cerrada') !== false || stripos($mensaje, 'pausada') !== false) ? 403 : 409;
        responderError($mensaje, $codigo);
    }
}
elseif ($action === 'createTransaction') {
    // Paso 2: crea la transaccion (nace PENDING).
    $referencia = (string) ($datos['reference'] ?? '');
    $centavos   = (int) ($datos['amountInCents'] ?? 0);
    $firma      = (string) ($datos['signature'] ?? '');
    $metodo     = (string) ($datos['method'] ?? '');
    $telefono   = (string) ($datos['phone'] ?? '');

    try {
        $tx = $pagoService->crearTransaccion(Auth::id(), $referencia, $centavos, $firma, $metodo, $telefono);
        responderJson($tx, 201);
    } catch (InvalidArgumentException $e) {
        responderError($e->getMessage(), 422);
    }
}
elseif ($action === 'showTransaction') {
    // Paso 3: consulta el estado hasta que deje de estar PENDING.
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    $tx = $pagoService->obtenerTransaccion($id, Auth::id());
    if (!$tx) {
        responderError('Transacción no encontrada.', 404);
    }
    responderJson($tx);
}
else {
    responderError('Ruta no encontrada.', 404);
}
