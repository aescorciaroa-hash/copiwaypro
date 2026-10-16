<?php
/**
 * Convierte filas de AYUDANTE_COCINA y DOMICILIARIO al JSON del personal.
 */

function personal_cocina_a_json($fila)
{
    return [
        'id' => (string) $fila['id_ayudante'],
        'name' => $fila['nombre'],
        'email' => $fila['correo'],
        'phone' => $fila['telefono'],
        'role' => 'Ayudante de cocina',
        'active' => (bool) $fila['activo'],
        'hasPin' => !empty($fila['pin']),
        'createdBy' => $fila['creado_por_nombre'] ?? null,
    ];
}

/**
 * $currentOrderId y $destino ya vienen resueltos por el modelo (pedido 'en_camino'
 * del domiciliario y las coordenadas que el ubico en su mapa).
 */
function personal_domicilio_a_json($fila, $currentOrderId, $destino = null)
{
    $ubicacion = null;
    if ($fila['ubicacion_lat'] !== null && $fila['ubicacion_lng'] !== null) {
        $ubicacion = [(float) $fila['ubicacion_lat'], (float) $fila['ubicacion_lng']];
    }

    return [
        'id' => (string) $fila['id_domiciliario'],
        'name' => $fila['nombre'],
        'email' => $fila['correo'],
        'phone' => $fila['telefono'],
        'role' => 'Domiciliario',
        'active' => (bool) $fila['activo'],
        'hasPin' => !empty($fila['pin']),
        'createdBy' => $fila['creado_por_nombre'] ?? null,
        'location' => $ubicacion,
        'currentOrderId' => $currentOrderId !== null ? (string) $currentOrderId : null,
        'destCoords' => $destino,
        'plate' => $fila['placa'],
        'vehicle' => $fila['tipo_vehiculo'],
        'vehicleModel' => $fila['modelo_vehiculo'],
        'baseCash' => (float) $fila['base_efectivo_asignada'],
    ];
}
