<?php
/**
 * Modelo Usuario (administradores, tabla ADMINISTRADOR).
 * El rol 'programador' no entra por la web: solo se usa en bin/create-admin.php.
 */
class Usuario
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function buscarPorCorreo($correo)
    {
        $stmt = $this->conn->prepare("SELECT * FROM ADMINISTRADOR WHERE correo = ? LIMIT 1");
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    public function esUsado($correo, $telefono)
    {
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM ADMINISTRADOR WHERE correo = ? OR telefono = ?");
        $stmt->bind_param("ss", $correo, $telefono);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (int) $row['total'] > 0;
    }

    /** Crea un administrador ('programador' o 'maestro') y devuelve la fila creada. */
    public function crear($d)
    {
        $hash = password_hash($d['password'], PASSWORD_BCRYPT);
        $creadoPor = $d['creado_por'] ?? null;

        $stmt = $this->conn->prepare(
            "INSERT INTO ADMINISTRADOR (nombre, correo, telefono, contrasena, nivel_acceso, creado_por)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssssss", $d['nombre'], $d['correo'], $d['telefono'], $hash, $d['nivel_acceso'], $creadoPor);
        $stmt->execute();
        $stmt->close();

        return $this->buscarPorCorreo($d['correo']);
    }
}
