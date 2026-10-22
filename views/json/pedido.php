<?php
/**
 * Convierte una fila de PEDIDO al JSON del frontend ($items ya viene armado por Pedido::itemsDe).
 */

const PEDIDO_ESTADO_BD_A_APP = [
    'esperando_pago' => 'Esperando Pago',
    'pendiente' => 'Pendiente',
    'en_preparacion' => 'En Preparación',
    'listo' => 'Listos',
    'en_camino' => 'En Camino',
    'entregado' => 'Entregado',
    'cancelado' => 'Cancelado',
];

function pedido_a_json($fila, $items, $rolQueVe, $idQueVe)
{
    $estado = PEDIDO_ESTADO_BD_A_APP[$fila['estado']] ?? $fila['estado'];

    // El domiciliario solo ve el telefono del cliente si es suyo y va "En Camino".
    $mostrarTelefono = true;
    if ($rolQueVe === 'delivery') {
        $mostrarTelefono = $fila['estado'] === 'en_camino' && $fila['id_domiciliario'] === $idQueVe;
    }

    // El PIN de entrega lo ve el cliente (cuando ya pago) y el admin en pedidos manuales,
    // para dictarselo al cliente invitado. El domiciliario nunca: se lo pide en la puerta.
    $verPin = ($rolQueVe === 'client' && $fila['estado'] !== 'esperando_pago')
        || ($rolQueVe === 'admin' && $fila['canal_origen'] !== 'web');

    // Link de pago: solo el admin, y solo mientras el pedido espera el pago.
    $codigoLink = ($rolQueVe === 'admin' && $fila['estado'] === 'esperando_pago') ? $fila['codigo_pago'] : null;

    return [
        'id' => '#ORD-' . $fila['id_pedido'],
        'status' => $estado,
        'client' => $fila['cliente_nombre'],
        'clientPhone' => $mostrarTelefono ? $fila['cliente_telefono'] : null,
        'preparedBy' => $fila['ayudante_nombre'] ?? null,
        'driverName' => $fila['domiciliario_nombre'],
        'driverPhone' => $fila['domiciliario_nombre'] ? $fila['domiciliario_telefono'] : null,
        'driverPlate' => $fila['domiciliario_placa'],
        'driverVehicle' => $fila['domiciliario_vehiculo'],
        'deliveryPin' => $verPin ? $fila['pin_entrega'] : null,
        'requiresDeliveryPin' => !empty($fila['pin_entrega']),
        'total' => (float) $fila['total'],
        'subtotal' => (float) $fila['subtotal'],
        'shipping' => (float) $fila['costo_domicilio'],
        'discount' => (float) $fila['descuento_cumpleanos'],
        'pointsRedeemed' => (int) $fila['puntos_canjeados'],
        'pointsDiscount' => (float) $fila['descuento_puntos'],
        'pointsEarned' => (int) $fila['puntos_ganados'],
        'items' => $items,
        'address' => $fila['direccion_entrega'],
        'lat' => $fila['destino_lat'] !== null ? (float) $fila['destino_lat'] : null,
        'lng' => $fila['destino_lng'] !== null ? (float) $fila['destino_lng'] : null,
        'date' => $fila['fecha_hora'],
        'time' => date('H:i', strtotime($fila['fecha_hora'])),
        'readyAt' => !empty($fila['fecha_listo']) ? $fila['fecha_listo'] : null,
        'paymentMethod' => $fila['metodo_pago'] === 'efectivo' ? 'cash' : 'online',
        'digitalBank' => $fila['banco_digital'] ?? null,
        'paymentStatus' => $fila['estado_pago'] === 'aprobado' ? 'Pagado' : ucfirst($fila['estado_pago']),
        // web, llamada o whatsapp; isGuest = pedido manual de alguien sin cuenta.
        'channel' => $fila['canal_origen'],
        'isGuest' => $fila['id_cliente'] === null,
        'paymentLinkCode' => $codigoLink,
        'paymentLinkExpiresAt' => $codigoLink ? $fila['vence_pago'] : null,
    ];
}
