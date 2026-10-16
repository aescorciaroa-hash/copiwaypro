<?php
/**
 * Servicio de Pedidos: reglas del ciclo de vida del pedido
 * (checkout, cambios de estado, entrega con PIN y resena).
 */
require_once __DIR__ . '/../Models/Pedido.php';
require_once __DIR__ . '/../Models/Configuracion.php';
require_once __DIR__ . '/../Models/Ingrediente.php';
require_once __DIR__ . '/PagoService.php';
require_once __DIR__ . '/PushNotificationService.php';

class PedidoService
{
    private $conn;
    private $pedidoModel;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
        $this->pedidoModel = new Pedido();
    }

    // ---------------------------------------------------------------
    // Creacion (checkout)
    // ---------------------------------------------------------------

    /**
     * Crea un pedido. Recalcula precios en el servidor, valida horario y pago,
     * y en una transaccion guarda el pedido y descuenta el inventario.
     */
    public function crear($idCliente, $payload)
    {
        $configModel = new Configuracion();
        if (!$configModel->tiendaAbiertaAhora()) {
            throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden procesar pagos.');
        }

        if (empty($payload['items'])) {
            throw new InvalidArgumentException('El pedido no tiene ítems.');
        }

        $cliente = $this->buscarCliente($idCliente);
        if (!$cliente) {
            throw new InvalidArgumentException('Cliente no encontrado.');
        }

        $calculo = $this->calcular($cliente, $payload, $configModel);
        $total = $calculo['total'];
        $puntos = (int) floor($total / 1000);

        $esEfectivo = ($payload['paymentMethod'] ?? 'online') === 'cash';
        $metodoPago = $esEfectivo ? 'efectivo' : 'digital';
        $bancosValidos = ['nequi', 'daviplata', 'bancolombia'];
        $bancoDigital = (!$esEfectivo && in_array($payload['bank'] ?? '', $bancosValidos, true)) ? $payload['bank'] : null;
        $estadoPago = 'pendiente';
        $fechaPago = null;
        $comprobante = null;

        // Pago digital: se verifica la transaccion antes de crear nada.
        // En efectivo el pago queda 'pendiente' hasta la entrega.
        if (!$esEfectivo) {
            $pagoService = new PagoService();
            $pago = $pagoService->verificarTransaccion((string) ($payload['paymentTransactionId'] ?? ''), $total, $idCliente);

            $stmt = $this->conn->prepare("SELECT id_pedido FROM PEDIDO WHERE comprobante_pago = ? LIMIT 1");
            $stmt->bind_param("s", $pago['id']);
            $stmt->execute();
            $yaUsada = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if ($yaUsada) {
                throw new Exception('Este pago ya fue usado en otro pedido.');
            }
            $comprobante = $pago['id'];
            $estadoPago = 'aprobado';
            $fechaPago = date('Y-m-d H:i:s');
        }

        $this->conn->begin_transaction();
        try {
            $values = [
                $idCliente, $payload['address'] ?? $cliente['direccion'],
                $payload['lat'] ?? null, $payload['lng'] ?? null,
                $metodoPago, $bancoDigital, $estadoPago, $fechaPago, $comprobante,
                $calculo['subtotal'], $calculo['envio'], $calculo['descuento'], $puntos, $total,
            ];
            $stmtP = $this->conn->prepare(
                "INSERT INTO PEDIDO
                    (id_cliente, direccion_entrega, destino_lat, destino_lng, estado,
                     canal_origen, metodo_pago, banco_digital, estado_pago, fecha_pago, comprobante_pago,
                     subtotal, costo_domicilio, descuento_cumpleanos, puntos_ganados, total)
                 VALUES (?, ?, ?, ?, 'pendiente', 'web', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmtP->bind_param(tiposDe($values), ...$values);
            $stmtP->execute();
            $stmtP->close();
            $idPedido = $this->conn->insert_id;

            $lineasDescuento = [];

            foreach ($calculo['items'] as $item) {
                $producto = $item['producto'];
                $esPersonalizado = (!empty($item['extras']) || !empty($item['removidos'])) ? 1 : 0;

                $values = [$idPedido, $producto['id_producto'], $producto['nombre'], $item['cantidad'], $item['precioUnitario'], $esPersonalizado];
                $stmtD = $this->conn->prepare(
                    "INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, nombre_producto, cantidad, precio_unitario, es_personalizado)
                     VALUES (?, ?, ?, ?, ?, ?)"
                );
                $stmtD->bind_param(tiposDe($values), ...$values);
                $stmtD->execute();
                $stmtD->close();
                $idDetalle = $this->conn->insert_id;

                foreach ($item['extras'] as $extra) {
                    $values = [$idDetalle, $extra['id_ingrediente'], $extra['nombre'], $extra['precio_extra']];
                    $stmtE = $this->conn->prepare(
                        "INSERT INTO PERSONALIZACION (id_detalle, id_ingrediente, nombre_ingrediente, accion_modificacion, cantidad, costo_aplicado)
                         VALUES (?, ?, ?, 'agregar', 1, ?)"
                    );
                    $stmtE->bind_param(tiposDe($values), ...$values);
                    $stmtE->execute();
                    $stmtE->close();

                    $lineasDescuento[] = [
                        'id_ingrediente' => $extra['id_ingrediente'],
                        'cantidad'       => $item['cantidad'],
                        'motivo'         => 'Extra pedido #ORD-' . $idPedido,
                    ];
                }

                foreach ($item['removidos'] as $removido) {
                    $values = [$idDetalle, $removido['id_ingrediente'], $removido['nombre']];
                    $stmtQ = $this->conn->prepare(
                        "INSERT INTO PERSONALIZACION (id_detalle, id_ingrediente, nombre_ingrediente, accion_modificacion, cantidad, costo_aplicado)
                         VALUES (?, ?, ?, 'quitar', 1, 0)"
                    );
                    $stmtQ->bind_param(tiposDe($values), ...$values);
                    $stmtQ->execute();
                    $stmtQ->close();
                }

                // Receta base del producto (menos lo que se quito) por la cantidad pedida.
                $idsRemovidos = array_column($item['removidos'], 'id_ingrediente');
                $stmtR = $this->conn->prepare("SELECT id_ingrediente, cantidad_necesaria FROM RECETA WHERE id_producto = ?");
                $stmtR->bind_param("i", $producto['id_producto']);
                $stmtR->execute();
                $receta = $stmtR->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmtR->close();

                foreach ($receta as $linea) {
                    if (in_array($linea['id_ingrediente'], $idsRemovidos, true)) {
                        continue;
                    }
                    $lineasDescuento[] = [
                        'id_ingrediente' => $linea['id_ingrediente'],
                        'cantidad'       => (float) $linea['cantidad_necesaria'] * $item['cantidad'],
                        'motivo'         => 'Venta pedido',
                    ];
                }
            }

            // Bolsa de empaque global (1 por pedido).
            $idBolsa = $configModel->idIngredienteBolsaGlobal();
            if ($idBolsa) {
                $lineasDescuento[] = ['id_ingrediente' => $idBolsa, 'cantidad' => 1, 'motivo' => 'Empaque global pedido'];
            }

            if (!empty($lineasDescuento)) {
                $ingredienteModel = new Ingrediente();
                $ingredienteModel->descontarPorReceta($lineasDescuento, $idPedido);
            }

            // Los puntos y el total gastado se suman al ENTREGAR (confirmarEntrega).
            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }

        return $this->pedidoModel->buscar($idPedido, 'client', $idCliente);
    }

    private function buscarCliente($idCliente)
    {
        $stmt = $this->conn->prepare("SELECT * FROM CLIENTE WHERE id_cliente = ? LIMIT 1");
        $stmt->bind_param("s", $idCliente);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * Recalcula en el servidor items, precios, descuento y total.
     * El precio de cada insumo extra = costo unitario + margen de ganancia de Ajustes.
     */
    private function calcular($cliente, $payload, $configModel)
    {
        $items = $payload['items'] ?? [];
        if (empty($items)) {
            throw new InvalidArgumentException('El pedido no tiene ítems.');
        }

        $margen = $configModel->margenGanancia();
        $resueltos = [];
        $subtotal = 0.0;

        foreach ($items as $item) {
            $cantidad = max(1, (int) ($item['quantity'] ?? 1));

            // Creador interactivo: hamburguesa armada capa por capa, sin producto base.
            if (empty($item['productId']) && !empty($item['stack'])) {
                $pila = $this->resolverIngredientes($item['stack'], $margen);
                if (empty($pila)) {
                    throw new InvalidArgumentException('La hamburguesa personalizada no tiene ingredientes válidos.');
                }
                $precioUnitario = $this->sumarPrecios($pila);
                $subtotal += $precioUnitario * $cantidad;

                $resueltos[] = [
                    'producto'       => $this->productoPersonalizadoOculto(),
                    'cantidad'       => $cantidad,
                    'precioUnitario' => $precioUnitario,
                    'extras'         => $pila,
                    'removidos'      => [],
                ];
                continue;
            }

            $idProducto = $item['productId'] ?? '';
            $stmt = $this->conn->prepare("SELECT * FROM PRODUCTO WHERE id_producto = ? AND estado = 'activo' LIMIT 1");
            $stmt->bind_param("s", $idProducto);
            $stmt->execute();
            $producto = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if (!$producto) {
                throw new InvalidArgumentException('Uno de los productos del carrito ya no está disponible.');
            }

            $extras = $this->resolverIngredientes($item['extras'] ?? [], $margen);
            $removidos = $this->resolverIngredientes($item['removed'] ?? [], $margen);

            $precioUnitario = (float) $producto['precio'] + $this->sumarPrecios($extras);
            $subtotal += $precioUnitario * $cantidad;

            $resueltos[] = [
                'producto'       => $producto,
                'cantidad'       => $cantidad,
                'precioUnitario' => $precioUnitario,
                'extras'         => $extras,
                'removidos'      => $removidos,
            ];
        }

        $envio = (float) $configModel->tarifaDomicilio();
        $descuento = $this->descuentoCumpleanos($cliente, $subtotal);

        return [
            'items'     => $resueltos,
            'subtotal'  => $subtotal,
            'envio'     => $envio,
            'descuento' => $descuento,
            'total'     => round($subtotal - $descuento + $envio, 2),
        ];
    }

    private function sumarPrecios($ingredientes)
    {
        $suma = 0;
        foreach ($ingredientes as $ing) {
            $suma += (float) $ing['precio_extra'];
        }
        return $suma;
    }

    /** Total que se cobraria por este carrito (para abrir la pasarela de pago). */
    public function cotizar($idCliente, $payload)
    {
        $configModel = new Configuracion();
        if (!$configModel->tiendaAbiertaAhora()) {
            throw new Exception('La tienda está cerrada o pausada en este momento. No se pueden procesar pagos.');
        }
        $cliente = $this->buscarCliente($idCliente);
        if (!$cliente) {
            throw new InvalidArgumentException('Cliente no encontrado.');
        }
        return $this->calcular($cliente, $payload, $configModel)['total'];
    }

    /** Producto oculto que sirve de base para las hamburguesas del creador interactivo. Se crea una sola vez. */
    private function productoPersonalizadoOculto()
    {
        $sql = "SELECT * FROM PRODUCTO WHERE nombre = 'Hamburguesa Personalizada' AND estado = 'oculto' LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $producto = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($producto) {
            return $producto;
        }

        $stmtC = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE nombre = 'Personalizado' AND ambito = 'menu' LIMIT 1");
        $stmtC->execute();
        $categoria = $stmtC->get_result()->fetch_assoc();
        $stmtC->close();

        if ($categoria) {
            $idCategoria = $categoria['id_categoria'];
        } else {
            $stmtN = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES ('Personalizado', 'menu')");
            $stmtN->execute();
            $stmtN->close();
            $idCategoria = $this->conn->insert_id;
        }

        $stmtI = $this->conn->prepare(
            "INSERT INTO PRODUCTO (id_categoria, nombre, precio, estado)
             VALUES (?, 'Hamburguesa Personalizada', 0, 'oculto')"
        );
        $stmtI->bind_param("i", $idCategoria);
        $stmtI->execute();
        $stmtI->close();

        $stmtF = $this->conn->prepare($sql);
        $stmtF->execute();
        $producto = $stmtF->get_result()->fetch_assoc();
        $stmtF->close();
        return $producto;
    }

    /**
     * Busca cada ingrediente por id (o por nombre) y calcula su precio de venta:
     * costo unitario + margen, redondeado a la centena (igual que en el frontend).
     * Los ingredientes que no existen se ignoran.
     */
    private function resolverIngredientes($referencias, $margen = 0.0)
    {
        $resueltos = [];
        foreach ($referencias as $ref) {
            $row = null;
            if (!empty($ref['id'])) {
                $stmt = $this->conn->prepare("SELECT * FROM INGREDIENTE WHERE id_ingrediente = ? LIMIT 1");
                $stmt->bind_param("s", $ref['id']);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                $stmt->close();
            }
            if (!$row && !empty($ref['name'])) {
                $stmt = $this->conn->prepare("SELECT * FROM INGREDIENTE WHERE LOWER(nombre) = LOWER(?) LIMIT 1");
                $stmt->bind_param("s", $ref['name']);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                $stmt->close();
            }
            if (!$row) {
                continue;
            }
            $costo = (float) $row['costo_unitario'];
            $resueltos[] = [
                'id_ingrediente' => $row['id_ingrediente'],
                'nombre'         => $row['nombre'],
                'precio_extra'   => round(($costo * (1 + $margen / 100)) / 100) * 100,
            ];
        }
        return $resueltos;
    }

    /** 15% de descuento si hoy es el cumpleanos del cliente. */
    private function descuentoCumpleanos($cliente, $subtotal)
    {
        if (empty($cliente['fecha_nacimiento'])) {
            return 0.0;
        }
        $cumple = date('m-d', strtotime($cliente['fecha_nacimiento']));
        return $cumple === date('m-d') ? round($subtotal * 0.15, 2) : 0.0;
    }

    // ---------------------------------------------------------------
    // Cambios de estado
    // ---------------------------------------------------------------

    public function marcarPreparando($idPedido, $idAyudante = null)
    {
        $this->transicion($idPedido, ['pendiente'], 'en_preparacion');
        $this->registrarAyudante($idPedido, $idAyudante);
    }

    public function marcarListo($idPedido, $idAyudante = null)
    {
        $this->transicion($idPedido, ['pendiente', 'en_preparacion'], 'listo');

        $stmt = $this->conn->prepare("UPDATE PEDIDO SET fecha_listo = NOW() WHERE id_pedido = ?");
        $stmt->bind_param("i", $idPedido);
        $stmt->execute();
        $stmt->close();

        $this->registrarAyudante($idPedido, $idAyudante);
    }

    /** Guarda quien de cocina preparo el pedido (solo el primero). */
    private function registrarAyudante($idPedido, $idAyudante)
    {
        if (!$idAyudante) {
            return;
        }
        $stmt = $this->conn->prepare("UPDATE PEDIDO SET id_ayudante = ? WHERE id_pedido = ? AND id_ayudante IS NULL");
        $stmt->bind_param("si", $idAyudante, $idPedido);
        $stmt->execute();
        $stmt->close();
    }

    /** Lee estado y domiciliario del pedido bloqueando la fila (FOR UPDATE). */
    private function bloquearPedido($idPedido)
    {
        $stmt = $this->conn->prepare("SELECT estado, id_domiciliario FROM PEDIDO WHERE id_pedido = ? FOR UPDATE");
        $stmt->bind_param("i", $idPedido);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /** El domiciliario toma un pedido 'listo' (queda asignado, sin salir todavia). */
    public function tomarPedido($idPedido, $idDomiciliario)
    {
        $this->conn->begin_transaction();
        try {
            $row = $this->bloquearPedido($idPedido);
            if (!$row || $row['estado'] !== 'listo'
                || ($row['id_domiciliario'] !== null && $row['id_domiciliario'] !== $idDomiciliario)) {
                throw new Exception('Este pedido ya no está disponible para reparto.');
            }

            $stmt = $this->conn->prepare("UPDATE PEDIDO SET id_domiciliario = ? WHERE id_pedido = ?");
            $stmt->bind_param("si", $idDomiciliario, $idPedido);
            $stmt->execute();
            $stmt->close();

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    /**
     * Suelta un pedido para que otro domiciliario lo tome. El domiciliario solo
     * suelta los suyos en 'listo'; el admin puede soltar uno 'listo' o 'en_camino'.
     */
    public function liberarPedido($idPedido, $rol, $idActor)
    {
        $this->conn->begin_transaction();
        try {
            $row = $this->bloquearPedido($idPedido);
            if (!$row || $row['id_domiciliario'] === null) {
                throw new Exception('Este pedido no tiene domiciliario asignado.');
            }
            if ($rol === 'delivery') {
                if ($row['id_domiciliario'] !== $idActor || $row['estado'] !== 'listo') {
                    throw new Exception('Solo puedes soltar un pedido tuyo que aún no has iniciado.');
                }
            } elseif (!in_array($row['estado'], ['listo', 'en_camino'], true)) {
                throw new Exception('Este pedido ya no se puede reasignar.');
            }

            $stmt = $this->conn->prepare("UPDATE PEDIDO SET estado = 'listo', id_domiciliario = NULL WHERE id_pedido = ?");
            $stmt->bind_param("i", $idPedido);
            $stmt->execute();
            $stmt->close();

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function aceptarEntrega($idPedido, $idDomiciliario)
    {
        $this->conn->begin_transaction();
        try {
            $row = $this->bloquearPedido($idPedido);
            if (!$row || $row['estado'] !== 'listo'
                || ($row['id_domiciliario'] !== null && $row['id_domiciliario'] !== $idDomiciliario)) {
                throw new Exception('Este pedido ya no está disponible para reparto.');
            }

            $stmt = $this->conn->prepare("UPDATE PEDIDO SET estado = 'en_camino', id_domiciliario = ? WHERE id_pedido = ?");
            $stmt->bind_param("si", $idDomiciliario, $idPedido);
            $stmt->execute();
            $stmt->close();

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    /** Entrega: solo con el PIN de 4 digitos correcto. */
    public function confirmarEntrega($idPedido, $idDomiciliario, $pin)
    {
        $stmt = $this->conn->prepare(
            "SELECT pin_entrega, estado, id_domiciliario, id_cliente, puntos_ganados, total FROM PEDIDO WHERE id_pedido = ?"
        );
        $stmt->bind_param("i", $idPedido);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row || $row['estado'] !== 'en_camino' || $row['id_domiciliario'] !== $idDomiciliario) {
            throw new Exception('No puedes confirmar la entrega de este pedido.');
        }
        if (!hash_equals($row['pin_entrega'], $pin)) {
            throw new Exception('PIN incorrecto.');
        }

        $this->conn->begin_transaction();
        try {
            // Al entregar, el pago queda aprobado (en efectivo se cobro en la puerta).
            $stmtU = $this->conn->prepare(
                "UPDATE PEDIDO SET estado = 'entregado',
                        estado_pago = 'aprobado',
                        fecha_pago = COALESCE(fecha_pago, NOW())
                 WHERE id_pedido = ?"
            );
            $stmtU->bind_param("i", $idPedido);
            $stmtU->execute();
            $stmtU->close();

            // Puntos de fidelidad y total gastado del cliente.
            $puntos = (int) $row['puntos_ganados'];
            $total = (float) $row['total'];
            $stmtC = $this->conn->prepare(
                "UPDATE CLIENTE SET puntos_fidelidad = puntos_fidelidad + ?, total_gastado = total_gastado + ? WHERE id_cliente = ?"
            );
            $stmtC->bind_param("idi", $puntos, $total, $row['id_cliente']);
            $stmtC->execute();
            $stmtC->close();

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }

        // Notificacion push al cliente; si falla, la entrega ya quedo confirmada.
        try {
            $pushService = new PushNotificationService();
            $pushService->notificarPedidoEntregado($idPedido, (int) $row['id_cliente']);
        } catch (Throwable $e) {
            error_log('No se pudo enviar la notificacion push de entrega: ' . $e->getMessage());
        }
    }

    private function transicion($idPedido, $desdeValidos, $hacia)
    {
        $stmt = $this->conn->prepare("SELECT estado FROM PEDIDO WHERE id_pedido = ?");
        $stmt->bind_param("i", $idPedido);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row || !in_array($row['estado'], $desdeValidos, true)) {
            throw new Exception('Transición de estado no permitida.');
        }

        $stmtU = $this->conn->prepare("UPDATE PEDIDO SET estado = ? WHERE id_pedido = ?");
        $stmtU->bind_param("si", $hacia, $idPedido);
        $stmtU->execute();
        $stmtU->close();
    }

    // ---------------------------------------------------------------
    // Resena
    // ---------------------------------------------------------------

    public function calificar($idPedido, $puntaje, $comentario)
    {
        $stmt = $this->conn->prepare(
            "INSERT INTO RESENA (id_pedido, puntaje, comentario)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE puntaje = VALUES(puntaje), comentario = VALUES(comentario)"
        );
        $stmt->bind_param("iis", $idPedido, $puntaje, $comentario);
        $stmt->execute();
        $stmt->close();
    }
}
