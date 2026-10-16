<?php
/**
 * Controlador de Productos (menu).
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Producto.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$productoModel = new Producto();
$datos         = entrada();
$esAdmin       = Auth::check() && Auth::rol() === 'admin';

if ($action === 'index') {
    responderJson($productoModel->listar(!$esAdmin, $esAdmin));
}
elseif ($action === 'show') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    $producto = $productoModel->buscar($id, $esAdmin);
    if (!$producto) {
        responderError('Producto no encontrado.', 404);
    }
    responderJson($producto);
}
elseif ($action === 'store') {
    $errores = [];
    if (empty($datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
    if (!isset($datos['price']) || !is_numeric($datos['price'])) $errores['price'] = ['El campo price debe ser numérico.'];
    if (empty($datos['category'])) $errores['category'] = ['El campo category es obligatorio.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    try {
        $id = $productoModel->crear($datos);
    } catch (Exception $e) {
        responderError($e->getMessage(), 422);
    }
    responderJson($productoModel->buscar($id, true), 201);
}
elseif ($action === 'update') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!$productoModel->buscar($id)) {
        responderError('Producto no encontrado.', 404);
    }
    if (array_key_exists('price', $datos) && !is_numeric($datos['price'])) {
        responderError('Datos inválidos.', 422, ['price' => ['El campo price debe ser numérico.']]);
    }

    try {
        $productoModel->actualizar($id, $datos);
    } catch (Exception $e) {
        responderError($e->getMessage(), 422);
    }
    responderJson($productoModel->buscar($id, true));
}
elseif ($action === 'destroy') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!$productoModel->buscar($id)) {
        responderError('Producto no encontrado.', 404);
    }
    $productoModel->eliminar($id);
    responderJson(['ok' => true]);
}
else {
    responderError('Ruta no encontrada.', 404);
}
