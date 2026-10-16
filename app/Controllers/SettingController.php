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
