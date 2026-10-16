# app/Models/Ingrediente.php

## ¿Para qué sirve?
Consultas de los **insumos/ingredientes** (tabla `INGREDIENTE`), sus **categorías** (`CATEGORIA`) y el
**historial de movimientos de inventario** (`MOVIMIENTO_INVENTARIO`).

La misma tabla se muestra de dos formas:
- **Inventario** (para el admin y la cocina): stock, costo, proveedor...
- **Catálogo de extras** (para el cliente): nombre y precio del extra.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `InventoryController.php` | Inventario y ajustes de stock. |
| ← lo usa | `IngredientController.php` | Catálogo de extras. |
| ← lo usa | `SyncController.php` | Enviar inventario, ingredientes e historial. |
| ← lo usa | `Producto.php` | `resolverOCrear()` al guardar una receta. |
| ← lo usa | `PedidoService.php` | `descontarPorReceta()` al crear un pedido. |
| → usa | `ingrediente_a_inventario()` / `ingrediente_a_catalogo()` (`app/Views/json/ingrediente.php`) | Formato de React. |

## Columnas importantes de INGREDIENTE
| Columna | Qué guarda | React |
|---|---|---|
| `nombre`, `unidad_medida` | "Pan brioche", "unidad" / "g" / "kg" | `name`, `unit` |
| `cantidad_stock` | Cuánto hay | `stock` |
| `umbral_minimo` | Por debajo de esto es "stock bajo" | — |
| `costo_unitario` | Lo que cuesta una unidad | `unitCost` |
| `precio_extra` | Precio fijo del extra (si es 0 se usa el costo) | `price` |
| `activo` | 1 = visible, 0 = dado de baja | — |

## Métodos
| Método | Qué hace |
|---|---|
| `listarInventario()` | Insumos activos, ordenados por nombre, en formato inventario. |
| `listarIngredientes()` | Insumos activos que **no** son empaques, en formato catálogo. |
| `buscar($id)` | Una fila (con el nombre de su categoría). |
| `comoInventario($row)` / `comoIngrediente($row)` | Pasan la fila por la función de formato correspondiente. |
| `crearConStockInicial($d, $idAdmin)` | Crea el insumo y, si trae stock, registra un movimiento de "entrada". En transacción. |
| `actualizar($id, $d)` | Cambia solo los campos enviados (igual que `Cliente::actualizar`). |
| `eliminar($id)` | **Baja lógica**: `activo = 0`. No se borra porque tiene movimientos y recetas que lo referencian. |
| `ajustarStock($id, $cantidad, $idAdmin)` | Suma o resta stock (nunca baja de 0) y guarda el movimiento. |
| `descontarPorReceta($lineas, $idPedido)` | Descuenta lo que gasta un pedido (ver abajo). |
| `resolverOCrear($nombre, $ambito)` | Busca un insumo por nombre; si no existe, lo crea con stock 0 en la categoría "General". |
| `resolverCategoria($nombre)` (privado) | Busca o crea una categoría de inventario. "Empaques & Desechables" se crea como empaque. |
| `registrosDeMovimientos()` | Historial de entradas y salidas. Las salidas se muestran en negativo. |

## `ajustarStock()` explicado
```php
$stmt = $this->conn->prepare("SELECT cantidad_stock FROM INGREDIENTE WHERE id_ingrediente = ? FOR UPDATE");
```
`FOR UPDATE` bloquea la fila mientras dura la transacción (nadie más la cambia al mismo tiempo).
```php
$nuevoStock = max(0, (float) $row['cantidad_stock'] + $cantidad);
```
`max(0, ...)` evita que el stock quede negativo.
```php
$tipo = $cantidad > 0 ? 'entrada' : 'salida';
```
Si la cantidad es positiva es una entrada; si es negativa, una salida. Se guarda con `abs()` (valor sin signo).

## `descontarPorReceta()` explicado (lo usa cada pedido)
Recibe líneas como: `['id_ingrediente' => 5, 'cantidad' => 2, 'motivo' => 'Venta pedido']`.

1. **Juntar:** si el mismo insumo aparece varias veces (por la receta y por un extra), suma las cantidades en `$consolidado`.
2. **Ordenar:** `sort($ids)` los ordena por id. Bloquear siempre en el mismo orden evita que dos pedidos al mismo tiempo se queden esperándose uno al otro ("interbloqueo").
3. **Bloquear y revisar:** lee cada insumo con `FOR UPDATE`. Si **cualquiera** no alcanza, lanza `Exception("Sin stock suficiente de ...")` y no se descuenta nada.
4. **Descontar:** `UPDATE ... SET cantidad_stock = cantidad_stock - ?` y guarda una "salida" en el historial, con el id del pedido.

No hace `begin_transaction()` porque ya está dentro de la transacción que abrió `PedidoService::crear()`.
