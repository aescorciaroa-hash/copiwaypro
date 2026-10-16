# views/json/producto.php

## ¿Para qué sirve?
Convierte un **producto** al formato de React (`interface Product`). Hay dos versiones:
- **Admin**: todo (costo, receta completa con cantidades y empaques).
- **Público** (cliente o visitante): sin costos ni cantidades internas.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← la usa | `Producto::comoJson()` (`models/Producto.php`) |
| → el resultado lo usan | `admin/MenuSection.tsx` (admin), `client/CatalogSection.tsx` y `Landing.tsx` (público) |

## La constante `PRODUCTO_ENUM_A_BADGE`
Lo contrario de `Producto::BADGE_A_ENUM`: convierte el valor de MySQL (`mas_vendido`) al texto que
muestra React (`Más Vendido`).

## `producto_a_json($fila, $ingredients, $packaging, $esAdmin)`
| Parámetro | Qué es |
|---|---|
| `$fila` | La fila de PRODUCTO (con `categoria_nombre` del JOIN). |
| `$ingredients`, `$packaging` | La receta, ya separada por `Producto::recetaDe()`. |
| `$esAdmin` | `true` si quien pregunta es el admin. |

| Campo de React | Sale de |
|---|---|
| `id` | `(string) id_producto` |
| `name`, `description`, `image` | `nombre`, `descripcion`, `imagen` |
| `price` | `(float) precio` |
| `active` | `estado === 'activo'` → `true`/`false` |
| `category` | `categoria_nombre` |
| `prepTime` | `tiempo_preparacion` en minutos (o `null`) |
| `badge` | La etiqueta traducida (o `null`) |

### Lo que cambia según `$esAdmin`
```php
if ($esAdmin) {
    $resultado['ingredients'] = $ingredients;          // con quantityDeduct
    $resultado['packaging']   = $packaging;
    $resultado['costPrice']   = ...costo_calculado...;
} else {
    $resultado['ingredients'] = [];
    foreach ($ingredients as $ing) {
        $resultado['ingredients'][] = ['id' => $ing['id'], 'name' => $ing['name']];
    }
}
```
- El cliente solo recibe `id` y `name` de cada ingrediente: lo justo para "quitar cebolla" o "extra queso".
- El `foreach` recorre los ingredientes y agrega (`[] =`) cada uno a la lista nueva.
