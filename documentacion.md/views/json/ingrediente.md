# views/json/ingrediente.php

## ¿Para qué sirve?
Convierte una fila de **INGREDIENTE** a dos formatos distintos de React:
- **Inventario** (`interface InventoryItem`): para el admin y la cocina.
- **Catálogo** (`interface Ingredient`): para que el cliente elija extras.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← la usa | `models/Ingrediente.php` (`listarInventario`, `listarIngredientes`, `comoInventario`, `comoIngrediente`) |
| → inventario lo usan | `admin/InventorySection.tsx`, `KitchenDashboard.tsx` |
| → catálogo lo usan | `client/BuilderSection.tsx` (creador de hamburguesas) y el personalizador del catálogo del cliente |

## `ingrediente_a_inventario($fila)`
| Campo de React | Sale de |
|---|---|
| `id` | `(string) id_ingrediente` |
| `name`, `unit` | `nombre`, `unidad_medida` |
| `stock` | `(float) cantidad_stock` |
| `totalCost` | `costo_total` (o `null`) |
| `unitCost` | `(float) costo_unitario` |
| `category` | `categoria_nombre` (viene del JOIN con CATEGORIA) |
| `supplier`, `notes`, `image` | `proveedor`, `notas`, `imagen` |
| `createdAt` | `creado_en` |

## `ingrediente_a_catalogo($fila)`
```php
$precio = (float) $fila['precio_extra'];
if ($precio <= 0) {
    $precio = (float) $fila['costo_unitario'];
}
```
Si el insumo no tiene un precio de extra fijo, se muestra su costo unitario.
(El precio final con el margen de ganancia lo calcula el servidor al crear el pedido, en
`PedidoService::resolverIngredientes()`.)

| Campo de React | Sale de |
|---|---|
| `id`, `name` | `id_ingrediente`, `nombre` |
| `price` | `$precio` (calculado arriba) |
| `category`, `stock`, `image` | `categoria_nombre`, `cantidad_stock`, `imagen` |
