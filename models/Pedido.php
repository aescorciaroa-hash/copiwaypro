<?php
/**
 * Modelo Pedido (PEDIDO, DETALLE_PEDIDO y PERSONALIZACION).
 * Solo consultas; las reglas del pedido estan en PedidoService.
 */
require_once __DIR__ . '/../config/database.php';

class Pedido
{
    private $conn;

    // LEFT JOIN: un pedido manual de un cliente invitado no tiene fila en CLIENTE;
    // en ese caso se muestran el nombre y el celular que dicto por telefono.
    const BASE = "SELECT p.*, COALESCE(c.nombre, p.nombre_contacto) AS cliente_nombre,
                                 COALESCE(c.telefono, p.telefono_contacto) AS cliente_telefono,
                                 d.nombre AS domiciliario_nombre, d.telefono AS domiciliario_telefono,
                                 d.placa AS domiciliario_placa, d.tipo_vehiculo AS domiciliario_vehiculo,
                                 a.nombre AS ayudante_nombre
                          FROM PEDIDO p
                          LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente
                          LEFT JOIN DOMICILIARIO d ON d.id_domiciliario = p.id_domiciliario
                          LEFT JOIN AYUDANTE_COCINA a ON a.id_ayudante = p.id_ayudante";

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    /**
     * Pedidos segun el rol:
     *  - admin/cocina: todos
     *  - domiciliario: los suyos + los 'listo' sin domiciliario
     *  - cliente: solo los propios
     */
    public function porRol($rol, $usuarioId)
    {
        if ($rol === 'client') {
            $stmt = $this->conn->prepare(self::BASE . " WHERE p.id_cliente = ? ORDER BY p.fecha_hora DESC");
            $stmt->bind_param("s", $usuarioId);
        } elseif ($rol === 'delivery') {
            $stmt = $this->conn->prepare(self::BASE . " WHERE p.id_domiciliario = ? OR (p.estado = 'listo' AND p.id_domiciliario IS NULL) ORDER BY p.fecha_hora DESC");
            $stmt->bind_param("s", $usuarioId);
        } else {
            $stmt = $this->conn->prepare(self::BASE . " ORDER BY p.fecha_hora DESC");
        }
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $pedidos = [];
        foreach ($rows as $row) {
            $pedidos[] = $this->formar($row, $rol, $usuarioId);
        }
        return $pedidos;
    }

    /**
     * Busca por id o por numero visible (#ORD-123).
     * Si se pasa el rol de quien pregunta, aplica la misma visibilidad que porRol()
     * y devuelve null si no le corresponde verlo.
     */
    public function buscar($id, $rolQueVe = null, $idQueVe = null)
    {
        $numero = $this->numeroDesdeId($id);
        $stmt = $this->conn->prepare(self::BASE . " WHERE p.id_pedido = ?");
        $stmt->bind_param("i", $numero);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) {
            return null;
        }

        if ($rolQueVe === 'client' && $row['id_cliente'] !== $idQueVe) {
            return null;
        }
        if ($rolQueVe === 'delivery') {
            $esSuyo = $row['id_domiciliario'] === $idQueVe;
            $esDisponible = $row['estado'] === 'listo' && $row['id_domiciliario'] === null;
            if (!$esSuyo && !$esDisponible) {
                return null;
            }
        }

        return $this->formar($row, $rolQueVe, $idQueVe);
    }

    /** Fila tal cual viene de la base de datos, por id o numero visible. */
    public function buscarCrudo($id)
    {
        $numero = $this->numeroDesdeId($id);
        $stmt = $this->conn->prepare("SELECT * FROM PEDIDO WHERE id_pedido = ? LIMIT 1");
        $stmt->bind_param("i", $numero);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /** Acepta '#ORD-123' o '123' y devuelve el numero. */
    private function numeroDesdeId($idVisible)
    {
        if (preg_match('/^#ORD-(\d+)$/', (string) $idVisible, $m)) {
            return (int) $m[1];
        }
        if (is_numeric($idVisible)) {
            return (int) $idVisible;
        }
        return 0;
    }

    public function itemsDe($idPedido)
    {
        $stmt = $this->conn->prepare("SELECT * FROM DETALLE_PEDIDO WHERE id_pedido = ?");
        $stmt->bind_param("i", $idPedido);
        $stmt->execute();
        $detalles = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $items = [];
        foreach ($detalles as $detalle) {
            $stmtP = $this->conn->prepare("SELECT * FROM PERSONALIZACION WHERE id_detalle = ?");
            $stmtP->bind_param("i", $detalle['id_detalle']);
            $stmtP->execute();
            $personalizaciones = $stmtP->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmtP->close();

            $extras = [];
            $removidos = [];
            foreach ($personalizaciones as $p) {
                $entrada = ['id' => (string) $p['id_ingrediente'], 'name' => $p['nombre_ingrediente'], 'quantity' => (float) $p['cantidad']];
                if ($p['accion_modificacion'] === 'agregar') {
                    $extras[] = $entrada;
                } else {
                    $removidos[] = $entrada;
                }
            }

            $items[] = [
                'id'         => (string) $detalle['id_detalle'],
                'productId'  => (string) $detalle['id_producto'],
                'name'       => $detalle['nombre_producto'],
                'quantity'   => (int) $detalle['cantidad'],
                'price'      => (float) $detalle['precio_unitario'],
                'finalPrice' => (float) $detalle['precio_unitario'],
                'isCustom'   => (bool) $detalle['es_personalizado'],
                'extras'     => $extras,
                'removed'    => $removidos,
            ];
        }
        return $items;
    }

    private function formar($row, $rolQueVe, $idQueVe)
    {
        return pedido_a_json($row, $this->itemsDe($row['id_pedido']), $rolQueVe, $idQueVe);
    }
}
?>