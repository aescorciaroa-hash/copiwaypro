<?php
/**
 * Modelo Panel (resumen del dia para el dashboard del administrador).
 */
class Panel
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function resumenDeHoy()
    {
        $hoy = date('Y-m-d');
        $stmtV = $this->conn->prepare(
            "SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad
             FROM PEDIDO WHERE DATE(fecha_hora) = ? AND estado != 'cancelado'"
        );
        $stmtV->bind_param("s", $hoy);
        $stmtV->execute();
        $ventas = $stmtV->get_result()->fetch_assoc();
        $stmtV->close();

        $stmtE = $this->conn->prepare("SELECT estado, COUNT(*) AS cantidad FROM PEDIDO GROUP BY estado");
        $stmtE->execute();
        $porEstado = $stmtE->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtE->close();

        $stmtS = $this->conn->prepare(
            "SELECT id_ingrediente AS id, nombre AS name, cantidad_stock AS stock, umbral_minimo AS threshold
             FROM INGREDIENTE WHERE cantidad_stock <= umbral_minimo ORDER BY cantidad_stock ASC"
        );
        $stmtS->execute();
        $stockBajo = $stmtS->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtS->close();

        $stmtT = $this->conn->prepare(
            "SELECT dp.nombre_producto AS name, SUM(dp.cantidad) AS quantity, SUM(dp.cantidad * dp.precio_unitario) AS revenue
             FROM DETALLE_PEDIDO dp
             JOIN PEDIDO p ON p.id_pedido = dp.id_pedido
             WHERE p.estado != 'cancelado'
             GROUP BY dp.nombre_producto
             ORDER BY quantity DESC
             LIMIT 5"
        );
        $stmtT->execute();
        $topProductos = $stmtT->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtT->close();

        return [
            'salesToday'     => (float) $ventas['total'],
            'ordersToday'    => (int) $ventas['cantidad'],
            'ordersByStatus' => array_column($porEstado, 'cantidad', 'estado'),
            'lowStockItems'  => $stockBajo,
            'topProducts'    => $topProductos,
        ];
    }
}
