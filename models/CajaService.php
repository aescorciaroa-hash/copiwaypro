<?php
/**
 * Servicio de Cierre de Caja: calcula el cierre del dia (efectivo vs digital,
 * consumo de insumos), archiva los pedidos del turno y liquida a cada domiciliario.
 */
require_once __DIR__ . '/Caja.php';

class CajaService
{
    private $conn;
    private $cajaModel;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
        $this->cajaModel = new Caja();
    }

    /** Vista previa del cierre: el mismo calculo que generar() pero sin guardar nada. */
    public function previsualizar($idAdmin)
    {
        $hoy = date('Y-m-d');

        if ($this->cajaModel->yaGeneradoHoy($idAdmin, $hoy)) {
            throw new Exception('Ya se generó un cierre de caja hoy para este administrador.');
        }

        $pedidos = $this->cajaModel->pedidosDelTurno();
        $totales = $this->calcularTotales($pedidos);

        $liquidaciones = [];
        foreach ($this->cajaModel->domiciliariosActivos() as $domiciliario) {
            $recolectado = $totales['efectivoPorDomiciliario'][$domiciliario['id_domiciliario']] ?? 0;
            if ($recolectado <= 0) {
                continue;
            }
            $cantidad = 0;
            foreach ($pedidos as $pedido) {
                if ($pedido['id_domiciliario'] === $domiciliario['id_domiciliario'] && $pedido['metodo_pago'] === 'efectivo') {
                    $cantidad++;
                }
            }
            $liquidaciones[] = [
                'driverName'    => $domiciliario['nombre'],
                'ordersCount'   => $cantidad,
                'baseCash'      => (float) $domiciliario['base_efectivo_asignada'],
                'cashCollected' => $recolectado,
                'totalDue'      => (float) $domiciliario['base_efectivo_asignada'] + $recolectado,
            ];
        }

        $insumos = [];
        $costoInsumos = 0.0;
        foreach ($this->cajaModel->consumoTeorico(array_column($pedidos, 'id_pedido')) as $idIngrediente => $datos) {
            $costo = $datos['consumido'] * $datos['costoUnitario'];
            $costoInsumos += $costo;
            $insumos[] = [
                'name'      => $datos['nombre'],
                'used'      => $datos['consumido'],
                'unit'      => $datos['unidad'],
                'unitCost'  => $datos['costoUnitario'],
                'cost'      => round($costo, 2),
                'stockReal' => $this->cajaModel->stockActual($idIngrediente),
            ];
        }

        // Lo cobrado por domicilio cubre el reparto, no es ganancia: se resta de las ventas.
        $costoDomicilios = $totales['totalDomicilios'];
        $ventasProducto = $totales['totalVentas'] - $costoDomicilios;
        $ganancia = $ventasProducto - $costoInsumos;

        $ordenes = [];
        foreach ($pedidos as $o) {
            $ordenes[] = [
                'id'            => '#ORD-' . $o['id_pedido'],
                'client'        => $o['cliente_nombre'] ?? null,
                'total'         => (float) $o['total'],
                'paymentMethod' => $o['metodo_pago'] === 'efectivo' ? 'cash' : 'online',
            ];
        }

        return [
            'date'               => $hoy,
            'totalVentas'        => $totales['totalVentas'],
            'totalOrdenes'       => count($pedidos),
            'desglose'           => ['efectivo' => $totales['totalEfectivo'], 'digital' => $totales['totalDigital']],
            'driverLiquidations' => $liquidaciones,
            'insumosConsumidos'  => $insumos,
            'costoInsumos'       => round($costoInsumos, 2),
            'costoDomicilios'    => round($costoDomicilios, 2),
            'ventasProducto'     => round($ventasProducto, 2),
            'gananciaBruta'      => round($ganancia, 2),
            'margen'             => $ventasProducto > 0 ? round($ganancia / $ventasProducto * 100, 1) : 0,
            'orders'             => $ordenes,
            'activeOrdersCount'  => $this->cajaModel->pedidosActivosCount(),
        ];
    }

    private function calcularTotales($pedidos)
    {
        $totalVentas = 0.0;
        $totalDomicilios = 0.0;
        $totalEfectivo = 0.0;
        $totalDigital = 0.0;
        $efectivoPorDomiciliario = [];

        foreach ($pedidos as $pedido) {
            $total = (float) $pedido['total'];
            $totalVentas += $total;
            $totalDomicilios += (float) $pedido['costo_domicilio'];

            if ($pedido['metodo_pago'] === 'efectivo') {
                $totalEfectivo += $total;
                $idDom = $pedido['id_domiciliario'];
                if ($idDom) {
                    $efectivoPorDomiciliario[$idDom] = ($efectivoPorDomiciliario[$idDom] ?? 0) + $total;
                }
            } else {
                $totalDigital += $total;
            }
        }

        return [
            'totalVentas'             => $totalVentas,
            'totalDomicilios'         => $totalDomicilios,
            'totalEfectivo'           => $totalEfectivo,
            'totalDigital'            => $totalDigital,
            'efectivoPorDomiciliario' => $efectivoPorDomiciliario,
        ];
    }

    /**
     * Genera y guarda el cierre del dia. Solo toma pedidos entregados que aun
     * no pertenecen a ningun reporte, asi un cierre nunca se repite.
     */
    public function generar($idAdmin)
    {
        $hoy = date('Y-m-d');

        $this->conn->begin_transaction();
        try {
            if ($this->cajaModel->yaGeneradoHoy($idAdmin, $hoy)) {
                throw new Exception('Ya se generó un cierre de caja hoy para este administrador.');
            }

            $pedidos = $this->cajaModel->pedidosDelTurno();
            $totales = $this->calcularTotales($pedidos);

            $stmt = $this->conn->prepare(
                "INSERT INTO REPORTE_CAJA (id_admin, fecha, total_ventas, total_efectivo, total_digital)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->bind_param("ssddd", $idAdmin, $hoy, $totales['totalVentas'], $totales['totalEfectivo'], $totales['totalDigital']);
            $stmt->execute();
            $stmt->close();
            $idReporte = $this->conn->insert_id;

            // Archiva los pedidos del turno (no se borran).
            foreach ($pedidos as $pedido) {
                $stmtU = $this->conn->prepare("UPDATE PEDIDO SET id_reporte = ? WHERE id_pedido = ?");
                $stmtU->bind_param("ii", $idReporte, $pedido['id_pedido']);
                $stmtU->execute();
                $stmtU->close();
            }

            // Liquidacion por domiciliario: base asignada + efectivo recolectado.
            foreach ($this->cajaModel->domiciliariosActivos() as $domiciliario) {
                $recolectado = $totales['efectivoPorDomiciliario'][$domiciliario['id_domiciliario']] ?? 0;
                if ($recolectado <= 0) {
                    continue;
                }
                $base = $domiciliario['base_efectivo_asignada'];
                $liquidado = (float) $base + $recolectado;
                $stmtL = $this->conn->prepare(
                    "INSERT INTO LIQUIDACION_DOMICILIARIO
                        (id_reporte, id_domiciliario, base_asignada, efectivo_recolectado, efectivo_liquidado)
                     VALUES (?, ?, ?, ?, ?)"
                );
                $stmtL->bind_param("iisdd", $idReporte, $domiciliario['id_domiciliario'], $base, $recolectado, $liquidado);
                $stmtL->execute();
                $stmtL->close();
            }

            // Auditoria: consumo teorico de insumos vs stock real.
            foreach ($this->cajaModel->consumoTeorico(array_column($pedidos, 'id_pedido')) as $idIngrediente => $datos) {
                $stockReal = $this->cajaModel->stockActual($idIngrediente);
                $stmtA = $this->conn->prepare(
                    "INSERT INTO DETALLE_AUDITORIA (id_reporte, id_ingrediente, nombre, stock_teorico, stock_real)
                     VALUES (?, ?, ?, ?, ?)"
                );
                $stmtA->bind_param("iisdd", $idReporte, $idIngrediente, $datos['nombre'], $datos['consumido'], $stockReal);
                $stmtA->execute();
                $stmtA->close();
            }

            $pedidosActivos = $this->cajaModel->pedidosActivosCount();

            $this->conn->commit();

            return array_merge($this->cajaModel->reporte($idReporte), ['activeOrdersCount' => $pedidosActivos]);
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }
}
?>