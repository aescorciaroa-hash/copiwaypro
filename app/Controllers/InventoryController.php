<?php
/**
 * Controlador de Inventario (insumos, ajustes de stock y movimientos).
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Ingrediente.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$ingredienteModel = new Ingrediente();
$datos            = entrada();

if ($action === 'index') {
    responderJson($ingredienteModel->listarInventario());
}
elseif ($action === 'store') {
    $errores = [];
    if (empty($datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
    if (empty($datos['category'])) $errores['category'] = ['El campo category es obligatorio.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    $id = $ingredienteModel->crearConStockInicial($datos, Auth::id());
    responderJson($ingredienteModel->comoInventario($ingredienteModel->buscar($id)), 201);
}
elseif ($action === 'update') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!$ingredienteModel->buscar($id)) {
        responderError('Insumo no encontrado.', 404);
    }
    $ingredienteModel->actualizar($id, $datos);
    responderJson($ingredienteModel->comoInventario($ingredienteModel->buscar($id)));
}
elseif ($action === 'destroy') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!$ingredienteModel->buscar($id)) {
        responderError('Insumo no encontrado.', 404);
    }
    $ingredienteModel->eliminar($id);
    responderJson(['ok' => true]);
}
elseif ($action === 'adjustStock') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!$ingredienteModel->buscar($id)) {
        responderError('Insumo no encontrado.', 404);
    }
    if (!isset($datos['amount']) || !is_numeric($datos['amount'])) {
        responderError('Datos inválidos.', 422, ['amount' => ['El campo amount debe ser numérico.']]);
    }

    try {
        $ingredienteModel->ajustarStock($id, (float) $datos['amount'], Auth::id());
    } catch (Exception $e) {
        responderError($e->getMessage(), 422);
    }
    responderJson($ingredienteModel->comoInventario($ingredienteModel->buscar($id)));
}
elseif ($action === 'logs') {
    responderJson($ingredienteModel->registrosDeMovimientos());
}
else {
    responderError('Ruta no encontrada.', 404);
}
