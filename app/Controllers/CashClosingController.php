<?php
/**
 * Controlador de Cierre de Caja.
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Caja.php';
require_once __DIR__ . '/../Services/CajaService.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$cajaModel   = new Caja();
$cajaService = new CajaService();

if ($action === 'preview') {
    // Vista previa: mismo calculo que 'store' pero sin guardar nada.
    try {
        responderJson($cajaService->previsualizar(Auth::id()));
    } catch (Exception $e) {
        responderError($e->getMessage(), 409);
    }
}
elseif ($action === 'store') {
    try {
        responderJson($cajaService->generar(Auth::id()), 201);
    } catch (Exception $e) {
        responderError($e->getMessage(), 409);
    }
}
elseif ($action === 'index') {
    responderJson($cajaModel->historialDeAdmin(Auth::id()));
}
elseif ($action === 'show') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    try {
        responderJson($cajaModel->reporte($id));
    } catch (Exception $e) {
        responderError('Cierre no encontrado.', 404);
    }
}
else {
    responderError('Ruta no encontrada.', 404);
}
