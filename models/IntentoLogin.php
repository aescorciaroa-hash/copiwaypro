<?php
/**
 * Modelo IntentoLogin (limite de intentos fallidos de inicio de sesion).
 */
class IntentoLogin
{
    const MAXIMO_INTENTOS = 5;   // intentos fallidos permitidos...
    const VENTANA_MINUTOS = 1;   // ...dentro de este minuto (pasado ese tiempo se desbloquea solo)

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

        // Si entro bien, se borran sus fallos: el conteo vuelve a empezar en 0.
        if ($exitoso) {
            $stmt = $this->conn->prepare("DELETE FROM INTENTO_LOGIN WHERE identificador = ? AND exitoso = 0");
            $stmt->bind_param("s", $identificador);
            $stmt->execute();
            $stmt->close();
        }
    }

    /** Fallos recientes de ese correo (no de todo el computador) dentro de la ventana de minutos. */
    public function contarFallosRecientes($identificador)
    {
        $minutos = self::VENTANA_MINUTOS;
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*) AS total FROM INTENTO_LOGIN
             WHERE identificador = ?
               AND exitoso = 0
               AND fecha_hora > (NOW() - INTERVAL ? MINUTE)"
        );
        $stmt->bind_param("si", $identificador, $minutos);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (int) $row['total'];
    }

    /** true si ese correo ya paso el maximo de intentos fallidos. */
    public function excedeLimite($identificador)
    {
        $maximo = self::MAXIMO_INTENTOS;
        return $this->contarFallosRecientes($identificador) >= $maximo;
    }
}
?>
