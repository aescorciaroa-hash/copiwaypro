<?php
/**
 * Convierte una fila de PEDIDO al JSON del frontend ($items ya viene armado por Pedido::itemsDe).
 */

const PEDIDO_ESTADO_BD_A_APP = [
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

    // El PIN de entrega solo lo ve el cliente: el domiciliario se lo pide en la puerta.
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
        'deliveryPin' => $rolQueVe === 'client' ? $fila['pin_entrega'] : null,
        'requiresDeliveryPin' => !empty($fila['pin_entrega']),
        'total' => (float) $fila['total'],
        'subtotal' => (float) $fila['subtotal'],
        'shipping' => (float) $fila['costo_domicilio'],
        'discount' => (float) $fila['descuento_cumpleanos'],
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
    ];
}
