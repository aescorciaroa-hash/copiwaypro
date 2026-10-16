<?php
/**
 * Modelo IntentoLogin (limite de intentos fallidos de inicio de sesion).
 */
require_once __DIR__ . '/../config/database.php';

class IntentoLogin
{
    const MAXIMO_INTENTOS = 5;   // intentos fallidos permitidos...
    const VENTANA_MINUTOS = 15;  // ...dentro de estos minutos

    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function registrar($identificador, $ip, $exitoso)
    {
        $exito = $exitoso ? 1 : 0;
        $stmt = $this->conn->prepare("INSERT INTO INTENTO_LOGIN (identificador, ip, exitoso) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $identificador, $ip, $exito);
        $stmt->execute();
        $stmt->close();
    }

    /** Fallos recientes por correo o por IP dentro de la ventana de minutos configurada. */
    public function contarFallosRecientes($identificador, $ip)
    {
        $minutos = self::VENTANA_MINUTOS;
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*) AS total FROM INTENTO_LOGIN
             WHERE (identificador = ? OR ip = ?)
               AND exitoso = 0
               AND fecha_hora > (NOW() - INTERVAL ? MINUTE)"
        );
        $stmt->bind_param("ssi", $identificador, $ip, $minutos);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (int) $row['total'];
    }

    /** true si ya se paso el maximo de intentos fallidos. */
    public function excedeLimite($identificador, $ip)
    {
        $maximo = self::MAXIMO_INTENTOS;
        return $this->contarFallosRecientes($identificador, $ip) >= $maximo;
    }
}
?>