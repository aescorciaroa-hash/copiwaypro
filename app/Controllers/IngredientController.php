<?php
/**
 * Controlador de Ingredientes (catalogo de extras para personalizar).
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
    responderJson($ingredienteModel->listarIngredientes());
}
elseif ($action === 'store') {
    $errores = [];
    if (empty($datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
    if (empty($datos['category'])) $errores['category'] = ['El campo category es obligatorio.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    $id = $ingredienteModel->crearConStockInicial($datos, Auth::id());
    responderJson($ingredienteModel->comoIngrediente($ingredienteModel->buscar($id)), 201);
}
elseif ($action === 'update') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!$ingredienteModel->buscar($id)) {
        responderError('Ingrediente no encontrado.', 404);
    }
    $ingredienteModel->actualizar($id, $datos);
    responderJson($ingredienteModel->comoIngrediente($ingredienteModel->buscar($id)));
}
elseif ($action === 'destroy') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!$ingredienteModel->buscar($id)) {
        responderError('Ingrediente no encontrado.', 404);
    }
    $ingredienteModel->eliminar($id);
    responderJson(['ok' => true]);
}
else {
    responderError('Ruta no encontrada.', 404);
}
