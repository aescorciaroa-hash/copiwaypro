<?php
/**
 * Modelo Caja (REPORTE_CAJA, LIQUIDACION_DOMICILIARIO y DETALLE_AUDITORIA).
 * Solo consultas; los calculos del cierre estan en CajaService.
 */
require_once __DIR__ . '/../config/database.php';

class Caja
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    /** true si este admin ya genero un cierre en esa fecha. */
    public function yaGeneradoHoy($idAdmin, $fecha)
    {
        $stmt = $this->conn->prepare("SELECT id_reporte FROM REPORTE_CAJA WHERE id_admin = ? AND fecha = ?");
        $stmt->bind_param("ss", $idAdmin, $fecha);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (bool) $row;
    }

    /** Pedidos entregados que aun no pertenecen a ningun reporte (turno actual). */
    public function pedidosDelTurno()
    {
        $stmt = $this->conn->prepare(
            "SELECT p.*, COALESCE(c.nombre, p.nombre_contacto) AS cliente_nombre FROM PEDIDO p
             LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente
             WHERE p.estado = 'entregado' AND p.id_reporte IS NULL"
        );
        $stmt->execute();
        $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $data;
    }

    /** Consumo real de insumos: suma de las salidas de inventario que genero cada pedido. */
    public function consumoTeorico($idsPedidos)
    {
        if (empty($idsPedidos)) {
            return [];
        }

        $marcas = implode(',', array_fill(0, count($idsPedidos), '?'));
        $stmt = $this->conn->prepare(
            "SELECT i.id_ingrediente, i.nombre, i.unidad_medida, i.costo_unitario,
                    SUM(m.cantidad) AS consumido
             FROM MOVIMIENTO_INVENTARIO m
             JOIN INGREDIENTE i ON i.id_ingrediente = m.id_ingrediente
             WHERE m.tipo_movimiento = 'salida' AND m.id_pedido IN ({$marcas})
             GROUP BY i.id_ingrediente, i.nombre, i.unidad_medida, i.costo_unitario"
        );
        $stmt->bind_param(str_repeat("i", count($idsPedidos)), ...$idsPedidos);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $resultado = [];
        foreach ($rows as $row) {
            $resultado[$row['id_ingrediente']] = [
                'nombre'        => $row['nombre'],
                'consumido'     => (float) $row['consumido'],
                'unidad'        => $row['unidad_medida'],
                'costoUnitario' => (float) $row['costo_unitario'],
            ];
        }
        return $resultado;
    }

    public function domiciliariosActivos()
    {
        $stmt = $this->conn->prepare("SELECT id_domiciliario, nombre, base_efectivo_asignada FROM DOMICILIARIO WHERE activo = 1");
        $stmt->execute();
        $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $data;
    }

    public function stockActual($idIngrediente)
    {
        $stmt = $this->conn->prepare("SELECT cantidad_stock FROM INGREDIENTE WHERE id_ingrediente = ?");
        $stmt->bind_param("i", $idIngrediente);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (float) $row['cantidad_stock'];
    }

    public function pedidosActivosCount()
    {
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM PEDIDO WHERE estado NOT IN ('entregado', 'cancelado')");
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (int) $row['total'];
    }

    public function reporte($idReporte)
    {
        $stmt = $this->conn->prepare("SELECT * FROM REPORTE_CAJA WHERE id_reporte = ?");
        $stmt->bind_param("s", $idReporte);
        $stmt->execute();
        $reporte = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $stmtL = $this->conn->prepare(
            "SELECT l.*, d.nombre AS driver_nombre FROM LIQUIDACION_DOMICILIARIO l
             JOIN DOMICILIARIO d ON d.id_domiciliario = l.id_domiciliario
             WHERE l.id_reporte = ?"
        );
        $stmtL->bind_param("s", $idReporte);
        $stmtL->execute();
        $liquidaciones = $stmtL->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtL->close();

        $stmtA = $this->conn->prepare("SELECT nombre, stock_teorico, stock_real FROM DETALLE_AUDITORIA WHERE id_reporte = ?");
        $stmtA->bind_param("s", $idReporte);
        $stmtA->execute();
        $auditoria = $stmtA->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtA->close();

        $stmtP = $this->conn->prepare(
            "SELECT p.id_pedido, p.total, p.metodo_pago, COALESCE(c.nombre, p.nombre_contacto) AS cliente
             FROM PEDIDO p LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente
             WHERE p.id_reporte = ?"
        );
        $stmtP->bind_param("s", $idReporte);
        $stmtP->execute();
        $pedidos = $stmtP->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtP->close();

        $liquidacionesJson = [];
        foreach ($liquidaciones as $l) {
            $stmtC = $this->conn->prepare(
                "SELECT COUNT(*) AS total FROM PEDIDO WHERE id_reporte = ? AND id_domiciliario = ? AND metodo_pago = 'efectivo'"
            );
            $stmtC->bind_param("si", $idReporte, $l['id_domiciliario']);
            $stmtC->execute();
            $conteo = $stmtC->get_result()->fetch_assoc();
            $stmtC->close();

            $liquidacionesJson[] = [
                'driverName'    => $l['driver_nombre'],
                'ordersCount'   => (int) $conteo['total'],
                'baseCash'      => (float) $l['base_asignada'],
                'cashCollected' => (float) $l['efectivo_recolectado'],
                'totalDue'      => (float) $l['efectivo_liquidado'],
            ];
        }

        $insumos = [];
        foreach ($auditoria as $a) {
            $insumos[] = ['name' => $a['nombre'], 'used' => (float) $a['stock_teorico'], 'stockReal' => (float) $a['stock_real']];
        }

        $ordenes = [];
        foreach ($pedidos as $o) {
            $ordenes[] = [
                'id'            => '#ORD-' . $o['id_pedido'],
                'client'        => $o['cliente'],
                'total'         => (float) $o['total'],
                'paymentMethod' => $o['metodo_pago'] === 'efectivo' ? 'cash' : 'online',
            ];
        }

        return [
            'date'               => $reporte['fecha'],
            'totalVentas'        => (float) $reporte['total_ventas'],
            'totalOrdenes'       => count($pedidos),
            'desglose'           => [
                'efectivo' => (float) $reporte['total_efectivo'],
                'digital'  => (float) $reporte['total_digital'],
            ],
            'driverLiquidations' => $liquidacionesJson,
            'insumosConsumidos'  => $insumos,
            'orders'             => $ordenes,
        ];
    }

    public function historialDeAdmin($idAdmin)
    {
        $stmt = $this->conn->prepare(
            "SELECT id_reporte, fecha, total_ventas, total_efectivo, total_digital
             FROM REPORTE_CAJA WHERE id_admin = ? ORDER BY fecha DESC"
        );
        $stmt->bind_param("s", $idAdmin);
        $stmt->execute();
        $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $data;
    }
}
?>