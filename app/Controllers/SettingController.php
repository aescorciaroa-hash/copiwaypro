<?php
/**
 * Controlador de Ajustes de la tienda (horario, tarifas y categorias del menu).
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Models/Configuracion.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$configModel = new Configuracion();
$datos       = entrada();

if ($action === 'show') {
    responderJson($configModel->obtener());
}
elseif ($action === 'update') {
    $errores = [];
    if (array_key_exists('pointValue', $datos) && (!is_numeric($datos['pointValue']) || $datos['pointValue'] < 0)) {
        $errores['pointValue'] = ['El valor del punto debe ser un número mayor o igual a 0.'];
    }
    if (array_key_exists('minPointsToRedeem', $datos) && (filter_var($datos['minPointsToRedeem'], FILTER_VALIDATE_INT) === false || $datos['minPointsToRedeem'] < 0)) {
        $errores['minPointsToRedeem'] = ['El mínimo de puntos debe ser un número entero mayor o igual a 0.'];
    }
    if (isset($datos['business']['name']) && trim((string) $datos['business']['name']) === '') {
        $errores['business.name'] = ['El nombre del negocio es obligatorio.'];
    }
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    $configModel->actualizar($datos);
    responderJson($configModel->obtener());
}
elseif ($action === 'addCategory') {
    $categoria = trim((string) ($datos['category'] ?? ''));
    if ($categoria === '') {
        responderError('Datos inválidos.', 422, ['category' => ['El campo category es obligatorio.']]);
    }
    $configModel->agregarCategoria($categoria);
    responderJson($configModel->obtener());
}
elseif ($action === 'removeCategory') {
    $categoria = $_GET['category'] ?? $_POST['category'] ?? '';
    try {
        $configModel->eliminarCategoria(urldecode($categoria));
    } catch (Exception $e) {
        responderError($e->getMessage(), 409);
    }
    responderJson($configModel->obtener());
}
else {
    responderError('Ruta no encontrada.', 404);
}
