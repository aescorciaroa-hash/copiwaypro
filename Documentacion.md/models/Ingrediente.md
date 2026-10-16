# models/Ingrediente.php

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
| ← lo usa | `SyncController.php` | Enviar inventario, ingredientes e historial. |
| ← lo usa | `Producto.php` | `resolverOCrear()` al guardar una receta. |
| ← lo usa | `PedidoService.php` | `descontarPorReceta()` al crear un pedido. |
| → usa | `ingrediente_a_inventario()` / `ingrediente_a_catalogo()` (`views/json/ingrediente.php`) | Formato de React. |

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
| `comoInventario($row)` | Pasa la fila por `ingrediente_a_inventario()`. |
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

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/Ingrediente.php`).
Lo cargan con `require_once`: `controllers/InventoryController.php`, `models/PedidoService.php`, `models/Producto.php`. Dejan de funcionar:
  - `POST /api/products` → Admin → Gestión de Menú: no se pueden crear productos.
  - `PUT /api/products/{id}` → Admin → Gestión de Menú: no se pueden editar productos.
  - `DELETE /api/products/{id}` → Admin → Gestión de Menú: no se pueden eliminar productos.
  - `POST /api/inventory` → Admin → Inventario: no se pueden crear insumos.
  - `PUT /api/inventory/{id}` → Admin → Inventario: no se pueden editar insumos.
  - `DELETE /api/inventory/{id}` → Admin → Inventario: no se pueden eliminar insumos.
  - `PATCH /api/inventory/{id}/stock` → Admin → Inventario: no se puede sumar o restar stock.
  - `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.
  - … y 15 más: `POST /api/orders`, `POST /api/orders/manual`, `PATCH /api/orders/{id}/address`, `PATCH /api/orders/{id}/destination`, `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}`, `GET /api/sync`.

**Si se borra un método:** sale `Call to undefined method Ingrediente::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `listarInventario()` | `SyncController::index()` | `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `listarIngredientes()` | `SyncController::index()` | `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `buscar()` | `InventoryController::adjustStock()`, `InventoryController::destroy()`, `InventoryController::store()`, `InventoryController::update()` | `POST /api/inventory` → Admin → Inventario: no se pueden crear insumos.<br>`PUT /api/inventory/{id}` → Admin → Inventario: no se pueden editar insumos.<br>`DELETE /api/inventory/{id}` → Admin → Inventario: no se pueden eliminar insumos.<br>`PATCH /api/inventory/{id}/stock` → Admin → Inventario: no se puede sumar o restar stock. |
| `comoInventario()` | `InventoryController::adjustStock()`, `InventoryController::store()`, `InventoryController::update()` | `POST /api/inventory` → Admin → Inventario: no se pueden crear insumos.<br>`PUT /api/inventory/{id}` → Admin → Inventario: no se pueden editar insumos.<br>`PATCH /api/inventory/{id}/stock` → Admin → Inventario: no se puede sumar o restar stock. |
| `crearConStockInicial()` | `InventoryController::store()` | `POST /api/inventory` → Admin → Inventario: no se pueden crear insumos. |
| `actualizar()` | `InventoryController::update()` | `PUT /api/inventory/{id}` → Admin → Inventario: no se pueden editar insumos. |
| `eliminar()` | `InventoryController::destroy()` | `DELETE /api/inventory/{id}` → Admin → Inventario: no se pueden eliminar insumos. |
| `ajustarStock()` | `InventoryController::adjustStock()` | `PATCH /api/inventory/{id}/stock` → Admin → Inventario: no se puede sumar o restar stock. |
| `descontarPorReceta()` | `PedidoService::guardar()` | `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp. |
| `resolverOCrear()` | `Producto::sincronizarReceta()` | `POST /api/products` → Admin → Gestión de Menú: no se pueden crear productos.<br>`PUT /api/products/{id}` → Admin → Gestión de Menú: no se pueden editar productos. |
| `resolverCategoria()` (privado) | `Ingrediente::actualizar()`, `Ingrediente::crearConStockInicial()` | `POST /api/inventory` → Admin → Inventario: no se pueden crear insumos.<br>`PUT /api/inventory/{id}` → Admin → Inventario: no se pueden editar insumos. |
| `registrosDeMovimientos()` | `SyncController::index()` | `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `__construct()` | `new Ingrediente()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa Ingrediente. |

**Si se borra una constante** (`BASE`): sale `Undefined constant Ingrediente::NOMBRE` en lo que la usa.
