<?php
/**
 * Controlador de Clientes (perfil, contrasena y notificaciones).
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Cliente.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$clienteModel = new Cliente();
$datos        = entrada();

/** Solo el propio cliente o un admin pueden ver/editar este cliente. */
function autorizarPropioOAdmin($id)
{
    if (!Auth::check()) {
        responderError('No autenticado.', 401);
    }
    $esPropio = Auth::rol() === 'client' && (string) Auth::id() === (string) $id;
    $esAdmin  = Auth::rol() === 'admin';
    if (!$esPropio && !$esAdmin) {
        responderError('No autorizado para este recurso.', 403);
    }
}

if ($action === 'index') {
    responderJson($clienteModel->listar());
}
elseif ($action === 'show') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    autorizarPropioOAdmin($id);
    $cliente = $clienteModel->buscar($id);
    if (!$cliente) {
        responderError('Cliente no encontrado.', 404);
    }
    responderJson($cliente);
}
elseif ($action === 'update') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    autorizarPropioOAdmin($id);
    if (!$clienteModel->buscar($id)) {
        responderError('Cliente no encontrado.', 404);
    }

    // El cliente solo puede cambiar estos campos; puntos y total gastado son solo del admin.
    if (Auth::rol() !== 'admin') {
        $permitidos = ['name', 'email', 'phone', 'address', 'birthday', 'cart', 'preferences'];
        $datos = array_intersect_key($datos, array_flip($permitidos));
    }

    if (!empty($datos['email']) && correoUsadoEnCualquierTabla($datos['email'], $id)) {
        responderError('Ya existe una cuenta con ese correo.', 409);
    }

    $clienteModel->actualizar($id, $datos);
    responderJson($clienteModel->buscar($id));
}
elseif ($action === 'changePassword') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';

    // Solo el propio cliente (el admin no conoce la contrasena actual).
    if (!Auth::check() || Auth::rol() !== 'client' || (string) Auth::id() !== (string) $id) {
        responderError('No autorizado para este recurso.', 403);
    }

    $errores = [];
    if (empty($datos['currentPassword'])) $errores['currentPassword'] = ['La contraseña actual es obligatoria.'];
    if (empty($datos['newPassword']) || strlen((string) $datos['newPassword']) < 8) $errores['newPassword'] = ['La nueva contraseña debe tener al menos 8 caracteres.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    $fila = $clienteModel->buscarCrudo($id);
    if (!$fila) {
        responderError('Cliente no encontrado.', 404);
    }
    if (!password_verify((string) $datos['currentPassword'], $fila['contrasena'])) {
        responderError('La contraseña actual no es correcta.', 422, ['currentPassword' => ['La contraseña actual no es correcta.']]);
    }

    $clienteModel->actualizarContrasena($id, password_hash((string) $datos['newPassword'], PASSWORD_DEFAULT));
    responderJson(['ok' => true]);
}
elseif ($action === 'notifications') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    autorizarPropioOAdmin($id);
    if (!$clienteModel->buscar($id)) {
        responderError('Cliente no encontrado.', 404);
    }
    responderJson($clienteModel->notificacionesDe($id));
}
elseif ($action === 'markNotificationRead') {
    $id      = $_GET['id'] ?? $_POST['id'] ?? '';
    $notifId = $_GET['notifId'] ?? $_POST['notifId'] ?? '';
    autorizarPropioOAdmin($id);
    if (!$clienteModel->marcarNotificacionLeida($id, $notifId)) {
        responderError('Notificación no encontrada.', 404);
    }
    responderJson(['ok' => true]);
}
else {
    responderError('Ruta no encontrada.', 404);
}
