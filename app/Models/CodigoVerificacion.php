<?php
/**
 * Modelo CodigoVerificacion (codigos para recuperar la contrasena).
 */
class CodigoVerificacion
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function crearParaCliente($idCliente, $codigo)
    {
        $hash = password_hash($codigo, PASSWORD_DEFAULT);
        $stmt = $this->conn->prepare(
            "INSERT INTO CODIGO_VERIFICACION (id_cliente, codigo_hash, canal_envio, fecha_expiracion)
             VALUES (?, ?, 'email', DATE_ADD(NOW(), INTERVAL 15 MINUTE))"
        );
        $stmt->bind_param("is", $idCliente, $hash);
        $stmt->execute();
        $stmt->close();
    }

    public function buscarValidoPorCorreo($correo)
    {
        $stmt = $this->conn->prepare(
            "SELECT cv.* FROM CODIGO_VERIFICACION cv
             JOIN CLIENTE c ON c.id_cliente = cv.id_cliente
             WHERE c.correo = ? AND cv.usado = 0 AND cv.fecha_expiracion > NOW() AND cv.intentos < 5
             ORDER BY cv.fecha_generacion DESC"
        );
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    public function marcarUsado($idCodigo)
    {
        $stmt = $this->conn->prepare("UPDATE CODIGO_VERIFICACION SET usado = 1 WHERE id_codigo = ?");
        $stmt->bind_param("i", $idCodigo);
        $stmt->execute();
        $stmt->close();
    }

    /** Suma un intento fallido; al quinto el codigo deja de servir. */
    public function incrementarIntentos($idCodigo)
    {
        $stmt = $this->conn->prepare("UPDATE CODIGO_VERIFICACION SET intentos = intentos + 1 WHERE id_codigo = ?");
        $stmt->bind_param("i", $idCodigo);
        $stmt->execute();
        $stmt->close();
    }
}
