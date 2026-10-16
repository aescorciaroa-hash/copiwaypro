<?php
/**
 * Controlador de Personal (ayudantes de cocina y domiciliarios).
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Personal.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$personalModel = new Personal();
$datos         = entrada();
$vehiculos     = ['moto', 'bicicleta', 'carro', 'a_pie'];

/** Busca en la lista del personal al miembro con ese id. */
function buscarEnPersonal($personalModel, $id)
{
    foreach ($personalModel->listar() as $miembro) {
        if ($miembro['id'] === (string) $id) {
            return $miembro;
        }
    }
    return ['id' => (string) $id];
}

if ($action === 'index') {
    responderJson($personalModel->listar());
}
elseif ($action === 'store') {
    $errores = [];
    if (empty($datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
    if (empty($datos['email']) || !filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) $errores['email'] = ['El campo email debe ser un correo válido.'];
    if (empty($datos['password']) || strlen((string) $datos['password']) < 8) $errores['password'] = ['El campo password debe tener al menos 8 caracteres.'];
    if (empty($datos['role']) || !in_array($datos['role'], ['Ayudante de cocina', 'Domiciliario'])) $errores['role'] = ['El campo role no es válido.'];
    if (($datos['role'] ?? null) === 'Domiciliario' && !empty($datos['vehicle']) && !in_array($datos['vehicle'], $vehiculos)) $errores['vehicle'] = ['El campo vehicle no es válido.'];
    if (empty($datos['pin']) || !preg_match('/^\d{4}$/', (string) $datos['pin'])) $errores['pin'] = ['El PIN debe tener exactamente 4 dígitos.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    if (correoUsadoEnCualquierTabla($datos['email'])) {
        responderError('Ya existe una cuenta con ese correo.', 409);
    }

    try {
        $id = $personalModel->crear($datos, Auth::id());
    } catch (Exception $e) {
        responderError($e->getMessage(), 422);
    }
    responderJson(buscarEnPersonal($personalModel, $id), 201);
}
elseif ($action === 'update') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';

    if (!empty($datos['password']) && strlen((string) $datos['password']) < 8) {
        responderError('Datos inválidos.', 422, ['password' => ['El campo password debe tener al menos 8 caracteres.']]);
    }
    if (!empty($datos['email']) && correoUsadoEnCualquierTabla($datos['email'], $id)) {
        responderError('Ya existe una cuenta con ese correo.', 409);
    }
    if (!empty($datos['vehicle']) && !in_array($datos['vehicle'], $vehiculos)) {
        responderError('Datos inválidos.', 422, ['vehicle' => ['El campo vehicle no es válido.']]);
    }
    if (!empty($datos['pin']) && !preg_match('/^\d{4}$/', (string) $datos['pin'])) {
        responderError('Datos inválidos.', 422, ['pin' => ['El PIN debe tener exactamente 4 dígitos.']]);
    }

    if ($personalModel->actualizar($id, $datos) === null) {
        responderError('Miembro de staff no encontrado.', 404);
    }
    responderJson(buscarEnPersonal($personalModel, $id));
}
elseif ($action === 'destroy') {
    // 'role' (opcional) indica la tabla, porque el mismo id puede existir en cocina y en domicilio.
    $id  = $_GET['id'] ?? $_POST['id'] ?? '';
    $rol = $_GET['role'] ?? null;
    if ($personalModel->eliminarSuave($id, $rol) === null) {
        responderError('Miembro de staff no encontrado.', 404);
    }
    responderJson(['ok' => true]);
}
elseif ($action === 'updateLocation') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';

    // El domiciliario solo puede actualizar su propia ubicacion.
    if (!Auth::check() || Auth::rol() !== 'delivery' || (string) Auth::id() !== (string) $id) {
        responderError('No autorizado para este recurso.', 403);
    }

    $errores = [];
    if (!isset($datos['lat']) || !is_numeric($datos['lat'])) $errores['lat'] = ['El campo lat debe ser numérico.'];
    if (!isset($datos['lng']) || !is_numeric($datos['lng'])) $errores['lng'] = ['El campo lng debe ser numérico.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    if (!$personalModel->actualizarUbicacion($id, (float) $datos['lat'], (float) $datos['lng'])) {
        responderError('Domiciliario no encontrado.', 404);
    }
    responderJson(['ok' => true]);
}
else {
    responderError('Ruta no encontrada.', 404);
}
