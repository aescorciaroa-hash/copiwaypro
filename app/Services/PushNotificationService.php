<?php
/**
 * Envia notificaciones Web Push (VAPID) a los dispositivos del cliente,
 * para que salgan como notificacion del sistema aunque el navegador este cerrado.
 * Usa la libreria minishlink/web-push (Composer).
 */
require_once __DIR__ . '/../Models/PushSuscripcion.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    private $conn;
    private $suscripcionModel;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
        $this->suscripcionModel = new PushSuscripcion();
    }

    private function webPush()
    {
        $publicKey = env('VAPID_PUBLIC_KEY', '');
        $privateKey = env('VAPID_PRIVATE_KEY', '');
        if ($publicKey === '' || $privateKey === '') {
            return null;
        }

        return new WebPush([
            'VAPID' => [
                'subject'    => env('VAPID_SUBJECT', 'mailto:soporte@copiway.com'),
                'publicKey'  => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);
    }

    /** Avisa al cliente que su pedido llego, con enlace para calificarlo. */
    public function notificarPedidoEntregado($idPedido, $idCliente)
    {
        $this->enviarATodosLosDispositivos($idCliente, $idPedido, [
            'title' => '¡Tu pedido ha llegado!',
            'body'  => 'Cuéntanos, ¿cómo estuvo tu comida?',
            'tag'   => 'pedido-entregado-' . $idPedido,
            'url'   => rutaBase() . '/?calificarPedido=' . $idPedido,
        ]);
    }

    private function enviarATodosLosDispositivos($idCliente, $idPedido, $payload)
    {
        $webPush = $this->webPush();
        if ($webPush === null) {
            return; // VAPID sin configurar.
        }

        $suscripciones = $this->suscripcionModel->listarPorCliente($idCliente);
        if (empty($suscripciones)) {
            return;
        }

        foreach ($suscripciones as $s) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint'  => $s['endpoint'],
                    'publicKey' => $s['clave_p256dh'],
                    'authToken' => $s['clave_auth'],
                ]),
                json_encode($payload)
            );
        }

        $huboEnvio = false;
        foreach ($webPush->flush() as $reporte) {
            if ($reporte->isSuccess()) {
                $huboEnvio = true;
            } elseif ($reporte->isSubscriptionExpired()) {
                // El navegador invalido la suscripcion: se borra.
                $this->suscripcionModel->eliminarPorEndpoint($reporte->getEndpoint());
            }
        }

        $this->registrarEnvio($idPedido, $huboEnvio);
    }

    /** Deja registro del envio en NOTIFICACION. */
    private function registrarEnvio($idPedido, $exito)
    {
        $estado = $exito ? 'enviado' : 'fallido';
        $stmt = $this->conn->prepare(
            "INSERT INTO NOTIFICACION (id_pedido, tipo, mensaje, estado_envio) VALUES (?, 'push', 'Tu pedido ha llegado', ?)"
        );
        $stmt->bind_param("is", $idPedido, $estado);
        $stmt->execute();
        $stmt->close();
    }
}
