<?php
/**
 * Modelo PushSuscripcion (suscripciones Web Push de cada cliente).
 */
require_once __DIR__ . '/../config/database.php';

class PushSuscripcion
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    /** Crea o actualiza (mismo endpoint = mismo navegador). */
    public function guardar($idCliente, $endpoint, $claveP256dh, $claveAuth)
    {
        $stmt = $this->conn->prepare(
            "INSERT INTO PUSH_SUSCRIPCION (id_cliente, endpoint, clave_p256dh, clave_auth)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id_cliente = VALUES(id_cliente), clave_p256dh = VALUES(clave_p256dh), clave_auth = VALUES(clave_auth)"
        );
        $stmt->bind_param("isss", $idCliente, $endpoint, $claveP256dh, $claveAuth);
        $stmt->execute();
        $stmt->close();
    }

    public function eliminarPorEndpoint($endpoint)
    {
        $stmt = $this->conn->prepare("DELETE FROM PUSH_SUSCRIPCION WHERE endpoint = ?");
        $stmt->bind_param("s", $endpoint);
        $stmt->execute();
        $stmt->close();
    }

    public function listarPorCliente($idCliente)
    {
        $stmt = $this->conn->prepare("SELECT endpoint, clave_p256dh, clave_auth FROM PUSH_SUSCRIPCION WHERE id_cliente = ?");
        $stmt->bind_param("i", $idCliente);
        $stmt->execute();
        $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $data;
    }
}
?>