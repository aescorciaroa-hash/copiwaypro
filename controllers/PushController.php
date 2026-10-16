<?php
/**
 * Controlador de Notificaciones Push (suscribir / desuscribir al cliente).
 * El envio lo hace PushNotificationService cuando el pedido se entrega.
 */
require_once __DIR__ . '/../models/PushNotificationService.php';

class PushController
{
    private $suscripcionModel;
    private $datos;

    public function __construct()
    {
        $this->suscripcionModel = new PushSuscripcion();
        $this->datos = entrada();
    }

    public function publicKey()
    {
        // Clave publica VAPID: el navegador la necesita para suscribirse.
        responderJson(['publicKey' => PushNotificationService::VAPID_PUBLIC_KEY]);
    }

    public function subscribe()
    {
        $endpoint = (string) ($this->datos['endpoint'] ?? '');
        $p256dh   = (string) ($this->datos['keys']['p256dh'] ?? '');
        $authKey  = (string) ($this->datos['keys']['auth'] ?? '');

        if ($endpoint === '' || $p256dh === '' || $authKey === '') {
            responderError('Suscripción inválida.', 422);
        }

        $this->suscripcionModel->guardar(Auth::id(), $endpoint, $p256dh, $authKey);
        responderJson(['ok' => true]);
    }
}

$controller = new PushController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'publicKey') {
    $controller->publicKey();
} elseif ($accion === 'subscribe') {
    $controller->subscribe();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>