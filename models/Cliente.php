<?php
/**
 * Modelo Cliente (CLIENTE y CLIENTE_NOTIFICACION).
 */
require_once __DIR__ . '/../config/database.php';

class Cliente
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function listar()
    {
        $stmt = $this->conn->prepare("SELECT * FROM CLIENTE ORDER BY creado_en DESC");
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $clientes = [];
        foreach ($rows as $row) {
            $clientes[] = $this->comoJson($row);
        }
        return $clientes;
    }

    public function buscar($id)
    {
        $row = $this->buscarCrudo($id);
        return $row ? $this->comoJson($row) : null;
    }

    /** Fila tal cual viene de la base de datos (sin formar el JSON). */
    public function buscarCrudo($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM CLIENTE WHERE id_cliente = ? LIMIT 1");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    public function buscarIdPorCorreo($correo)
    {
        $stmt = $this->conn->prepare("SELECT id_cliente FROM CLIENTE WHERE correo = ? LIMIT 1");
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ? $row['id_cliente'] : null;
    }

    public function correoOTelefonoExiste($correo, $telefono)
    {
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM CLIENTE WHERE correo = ? OR telefono = ?");
        $stmt->bind_param("ss", $correo, $telefono);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (int) $row['total'] > 0;
    }

    public function comoJson($row)
    {
        $id = $row['id_cliente'];

        $stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM PEDIDO WHERE id_cliente = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $conteo = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $stmtU = $this->conn->prepare("SELECT MAX(fecha_hora) AS ultimo FROM PEDIDO WHERE id_cliente = ?");
        $stmtU->bind_param("i", $id);
        $stmtU->execute();
        $ultimo = $stmtU->get_result()->fetch_assoc();
        $stmtU->close();

        return cliente_a_json([
            'fila'          => $row,
            'ordersCount'   => (int) $conteo['total'],
            'lastOrderDate' => $ultimo['ultimo'] ?: null,
            'notifications' => $this->notificacionesDe($id),
        ]);
    }

    public function notificacionesDe($idCliente)
    {
        $stmt = $this->conn->prepare("SELECT * FROM CLIENTE_NOTIFICACION WHERE id_cliente = ? ORDER BY fecha DESC");
        $stmt->bind_param("s", $idCliente);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        $notificaciones = [];
        foreach ($rows as $row) {
            $notificaciones[] = notificacion_a_json($row);
        }
        return $notificaciones;
    }

    public function marcarNotificacionLeida($idCliente, $idNotificacion)
    {
        $stmt = $this->conn->prepare(
            "UPDATE CLIENTE_NOTIFICACION SET leida = 1 WHERE id_notificacion_cliente = ? AND id_cliente = ?"
        );
        $stmt->bind_param("ss", $idNotificacion, $idCliente);
        $stmt->execute();
        $afectadas = $stmt->affected_rows;
        $stmt->close();
        return $afectadas > 0;
    }

    /** Actualiza solo los campos que vengan en $campos (claves en camelCase). */
    public function actualizar($id, $campos)
    {
        $mapa = [
            'name' => 'nombre', 'phone' => 'telefono', 'address' => 'direccion',
            'email' => 'correo', 'birthday' => 'fecha_nacimiento',
            'points' => 'puntos_fidelidad', 'totalSpent' => 'total_gastado',
        ];

        $sets = [];
        $values = [];
        foreach ($mapa as $clave => $columna) {
            if (array_key_exists($clave, $campos)) {
                $sets[] = "{$columna} = ?";
                $values[] = $campos[$clave];
            }
        }

        // El carrito se guarda como JSON y el tema viene dentro de preferences.theme.
        if (array_key_exists('cart', $campos)) {
            $sets[] = "carrito_guardado = ?";
            $values[] = json_encode($campos['cart']);
        }
        if (isset($campos['preferences']) && is_array($campos['preferences']) && isset($campos['preferences']['theme'])) {
            $sets[] = "tema_preferido = ?";
            $values[] = $campos['preferences']['theme'];
        }

        if (empty($sets)) {
            return;
        }
        $values[] = $id;

        $sql = "UPDATE CLIENTE SET " . implode(", ", $sets) . " WHERE id_cliente = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(tiposDe($values), ...$values);
        $stmt->execute();
        $stmt->close();
    }

    /** Crea el cliente guardando la fecha y la IP de aceptacion de Habeas Data. */
    public function crear($d)
    {
        $hash = password_hash($d['password'], PASSWORD_DEFAULT);
        $direccion = $d['address'] ?? null;
        $fechaAceptacion = date('Y-m-d H:i:s');
        $ip = $d['ip'] ?? '0.0.0.0';

        $stmt = $this->conn->prepare(
            "INSERT INTO CLIENTE
                (nombre, telefono, correo, contrasena, direccion, fecha_nacimiento,
                 fecha_aceptacion_habeas_data, ip_aceptacion_habeas_data)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssssssss", $d['name'], $d['phone'], $d['email'], $hash, $direccion, $d['birthday'], $fechaAceptacion, $ip);
        $stmt->execute();
        $stmt->close();

        return $this->conn->insert_id;
    }

    public function actualizarContrasena($id, $hash)
    {
        $stmt = $this->conn->prepare("UPDATE CLIENTE SET contrasena = ? WHERE id_cliente = ?");
        $stmt->bind_param("ss", $hash, $id);
        $stmt->execute();
        $stmt->close();
    }
}
?>