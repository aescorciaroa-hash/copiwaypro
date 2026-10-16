<?php
/**
 * Controlador de Notificaciones Push (suscribir / desuscribir al cliente).
 * El envio lo hace PushNotificationService cuando el pedido se entrega.
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/PushSuscripcion.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$suscripcionModel = new PushSuscripcion();
$datos            = entrada();

if ($action === 'publicKey') {
    // Clave publica VAPID: el navegador la necesita para suscribirse.
    responderJson(['publicKey' => env('VAPID_PUBLIC_KEY', '')]);
}
elseif ($action === 'subscribe') {
    $endpoint = (string) ($datos['endpoint'] ?? '');
    $p256dh   = (string) ($datos['keys']['p256dh'] ?? '');
    $authKey  = (string) ($datos['keys']['auth'] ?? '');

    if ($endpoint === '' || $p256dh === '' || $authKey === '') {
        responderError('Suscripción inválida.', 422);
    }

    $suscripcionModel->guardar(Auth::id(), $endpoint, $p256dh, $authKey);
    responderJson(['ok' => true]);
}
elseif ($action === 'unsubscribe') {
    $endpoint = (string) ($datos['endpoint'] ?? '');
    if ($endpoint !== '') {
        $suscripcionModel->eliminarPorEndpoint($endpoint);
    }
    responderJson(['ok' => true]);
}
else {
    responderError('Ruta no encontrada.', 404);
}
