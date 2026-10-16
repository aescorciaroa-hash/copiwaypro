<?php
/**
 * Modelo Personal: ayudantes de cocina (AYUDANTE_COCINA) y domiciliarios (DOMICILIARIO).
 */
class Personal
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function listar()
    {
        $stmtC = $this->conn->prepare(
            "SELECT ac.*, a.nombre AS creado_por_nombre FROM AYUDANTE_COCINA ac
             LEFT JOIN ADMINISTRADOR a ON a.id_admin = ac.creado_por
             ORDER BY ac.creado_en DESC"
        );
        $stmtC->execute();
        $cocina = $stmtC->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtC->close();

        $stmtD = $this->conn->prepare(
            "SELECT d.*, a.nombre AS creado_por_nombre FROM DOMICILIARIO d
             LEFT JOIN ADMINISTRADOR a ON a.id_admin = d.creado_por
             ORDER BY d.creado_en DESC"
        );
        $stmtD->execute();
        $domicilio = $stmtD->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtD->close();

        $resultado = [];
        foreach ($cocina as $row) {
            $resultado[] = $this->comoJsonCocina($row);
        }
        foreach ($domicilio as $row) {
            $resultado[] = $this->comoJsonDomicilio($row);
        }
        return $resultado;
    }

    public function comoJsonCocina($row)
    {
        return personal_cocina_a_json($row);
    }

    public function comoJsonDomicilio($row)
    {
        $stmt = $this->conn->prepare("SELECT id_pedido FROM PEDIDO WHERE id_domiciliario = ? AND estado = 'en_camino' LIMIT 1");
        $stmt->bind_param("i", $row['id_domiciliario']);
        $stmt->execute();
        $pedido = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $pedidoActual = $pedido ? '#ORD-' . $pedido['id_pedido'] : null;
        return personal_domicilio_a_json($row, $pedidoActual);
    }

    /** Crea un ayudante de cocina o un domiciliario segun $d['role']. */
    public function crear($d, $idAdmin)
    {
        $hash = password_hash($d['password'], PASSWORD_DEFAULT);
        $hashPin = !empty($d['pin']) ? password_hash($d['pin'], PASSWORD_DEFAULT) : null;
        $telefono = $d['phone'] ?? '';

        if ($d['role'] === 'Ayudante de cocina') {
            $stmt = $this->conn->prepare(
                "INSERT INTO AYUDANTE_COCINA (nombre, correo, telefono, contrasena, pin, creado_por)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param("ssssss", $d['name'], $d['email'], $telefono, $hash, $hashPin, $idAdmin);
            $stmt->execute();
            $stmt->close();
            return $this->conn->insert_id;
        }

        if ($d['role'] === 'Domiciliario') {
            $values = [
                $d['name'], $d['email'], $telefono, $hash, $hashPin,
                $d['vehicle'] ?? 'moto', $d['vehicleModel'] ?? null, $d['plate'] ?? null,
                $d['baseCash'] ?? 0, $idAdmin,
            ];
            $stmt = $this->conn->prepare(
                "INSERT INTO DOMICILIARIO
                    (nombre, correo, telefono, contrasena, pin, tipo_vehiculo, modelo_vehiculo, placa,
                     base_efectivo_asignada, creado_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param(tiposDe($values), ...$values);
            $stmt->execute();
            $stmt->close();
            return $this->conn->insert_id;
        }

        throw new Exception("Rol de staff inválido: {$d['role']}");
    }

    /**
     * Actualiza a un miembro del personal. Los ids se repiten entre las dos tablas,
     * por eso si llega 'role' se va directo a la tabla correcta; si no, busca primero
     * en cocina y luego en domicilio. Devuelve 'kitchen', 'delivery' o null.
     */
    public function actualizar($id, $d)
    {
        $rol = $d['role'] ?? null;

        if ($rol === 'Ayudante de cocina') {
            return $this->existe('AYUDANTE_COCINA', 'id_ayudante', $id) ? $this->actualizarCocina($id, $d) : null;
        }
        if ($rol === 'Domiciliario') {
            return $this->existe('DOMICILIARIO', 'id_domiciliario', $id) ? $this->actualizarDomicilio($id, $d) : null;
        }

        if ($this->existe('AYUDANTE_COCINA', 'id_ayudante', $id)) {
            return $this->actualizarCocina($id, $d);
        }
        if ($this->existe('DOMICILIARIO', 'id_domiciliario', $id)) {
            return $this->actualizarDomicilio($id, $d);
        }
        return null;
    }

    private function existe($tabla, $idCol, $id)
    {
        $stmt = $this->conn->prepare("SELECT {$idCol} FROM {$tabla} WHERE {$idCol} = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (bool) $row;
    }

    private function actualizarCocina($id, $d)
    {
        $mapa = ['name' => 'nombre', 'email' => 'correo', 'phone' => 'telefono'];
        $this->guardarCambios('AYUDANTE_COCINA', 'id_ayudante', $id, $mapa, $d);
        return 'kitchen';
    }

    private function actualizarDomicilio($id, $d)
    {
        $mapa = [
            'name' => 'nombre', 'email' => 'correo', 'phone' => 'telefono',
            'plate' => 'placa', 'vehicle' => 'tipo_vehiculo', 'vehicleModel' => 'modelo_vehiculo',
            'baseCash' => 'base_efectivo_asignada',
        ];
        $this->guardarCambios('DOMICILIARIO', 'id_domiciliario', $id, $mapa, $d);
        return 'delivery';
    }

    /** Arma y ejecuta el UPDATE con los campos que vengan en $d. */
    private function guardarCambios($tabla, $idCol, $id, $mapa, $d)
    {
        $sets = [];
        $values = [];
        foreach ($mapa as $clave => $columna) {
            if (array_key_exists($clave, $d)) {
                $sets[] = "{$columna} = ?";
                $values[] = $d[$clave];
            }
        }
        if (array_key_exists('active', $d)) {
            $sets[] = "activo = ?";
            $values[] = $d['active'] ? 1 : 0;
        }
        if (!empty($d['password'])) {
            $sets[] = "contrasena = ?";
            $values[] = password_hash($d['password'], PASSWORD_DEFAULT);
        }
        if (!empty($d['pin'])) {
            $sets[] = "pin = ?";
            $values[] = password_hash($d['pin'], PASSWORD_DEFAULT);
        }
        if (empty($sets)) {
            return;
        }
        $values[] = $id;

        $sql = "UPDATE {$tabla} SET " . implode(", ", $sets) . " WHERE {$idCol} = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(tiposDe($values), ...$values);
        $stmt->execute();
        $stmt->close();
    }

    /**
     * Baja logica (activo = 0). Con $rol va directo a la tabla correcta;
     * sin el, prueba primero cocina y luego domicilio. Devuelve 'kitchen', 'delivery' o null.
     */
    public function eliminarSuave($id, $rol = null)
    {
        if ($rol === 'Ayudante de cocina') {
            return $this->darDeBaja('AYUDANTE_COCINA', 'id_ayudante', $id) ? 'kitchen' : null;
        }
        if ($rol === 'Domiciliario') {
            return $this->darDeBaja('DOMICILIARIO', 'id_domiciliario', $id) ? 'delivery' : null;
        }

        if ($this->darDeBaja('AYUDANTE_COCINA', 'id_ayudante', $id)) {
            return 'kitchen';
        }
        if ($this->darDeBaja('DOMICILIARIO', 'id_domiciliario', $id)) {
            return 'delivery';
        }
        return null;
    }

    /** Pone activo = 0. Devuelve true si cambio alguna fila. */
    private function darDeBaja($tabla, $idCol, $id)
    {
        $stmt = $this->conn->prepare("UPDATE {$tabla} SET activo = 0 WHERE {$idCol} = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $afectadas = $stmt->affected_rows;
        $stmt->close();
        return $afectadas > 0;
    }

    public function actualizarUbicacion($id, $lat, $lng)
    {
        $stmt = $this->conn->prepare(
            "UPDATE DOMICILIARIO SET ubicacion_lat = ?, ubicacion_lng = ?, ubicacion_actualizada = NOW() WHERE id_domiciliario = ?"
        );
        $stmt->bind_param("dds", $lat, $lng, $id);
        $stmt->execute();
        $afectadas = $stmt->affected_rows;
        $stmt->close();
        return $afectadas > 0;
    }
}
