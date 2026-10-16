<?php
/**
 * Convierte una fila de PRODUCTO al JSON del frontend.
 * $esAdmin = true: JSON completo (costo, receta y empaques).
 * $esAdmin = false: catalogo publico (solo id y nombre de los ingredientes).
 */

// Valor del ENUM en la base de datos => texto de la etiqueta en el frontend.
const PRODUCTO_ENUM_A_BADGE = [
    'mas_vendido' => 'Más Vendido',
    'recomendado' => 'Recomendado',
    'nuevo' => 'Nuevo',
    'especialidad' => 'Especialidad',
];

function producto_a_json($fila, $ingredients, $packaging, $esAdmin = false)
{
    $etiqueta = PRODUCTO_ENUM_A_BADGE[$fila['etiqueta_destacada']] ?? null;

    $resultado = [
        'id' => (string) $fila['id_producto'],
        'name' => $fila['nombre'],
        'description' => $fila['descripcion'],
        'price' => (float) $fila['precio'],
        'active' => $fila['estado'] === 'activo',
        'image' => $fila['imagen'],
        'category' => $fila['categoria_nombre'],
        'prepTime' => $fila['tiempo_preparacion'] !== null ? (int) $fila['tiempo_preparacion'] : null,
        'badge' => $etiqueta,
    ];

    if ($esAdmin) {
        $resultado['ingredients'] = $ingredients;
        $resultado['packaging'] = $packaging;
        $resultado['costPrice'] = $fila['costo_calculado'] !== null ? (float) $fila['costo_calculado'] : null;
    } else {
        // El cliente solo ve el id y el nombre de cada ingrediente.
        $resultado['ingredients'] = [];
        foreach ($ingredients as $ing) {
            $resultado['ingredients'][] = ['id' => $ing['id'], 'name' => $ing['name']];
        }
    }

    return $resultado;
}
