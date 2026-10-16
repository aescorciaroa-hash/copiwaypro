# app/Controllers/InventoryController.php

## ¿Para qué sirve?
Maneja el **inventario de insumos** (pan, carne, queso, cajas...): ver cuánto hay, crear insumos,
editarlos, ajustar el stock y ver el historial de movimientos.

## ¿Con qué se conecta?
| Ruta | `$action` | Quién | React |
|---|---|---|---|
| `GET /api/inventory` | `index` | admin, cocina | También llega por `/api/sync` (clave `inventory`) |
| `POST /api/inventory` | `store` | admin | `almacenAplicacion.ts` ← `admin/InventorySection.tsx` |
| `PUT /api/inventory/{id}` | `update` | admin | `almacenAplicacion.ts` ← `InventorySection.tsx` |
| `DELETE /api/inventory/{id}` | `destroy` | admin | `almacenAplicacion.ts` ← `InventorySection.tsx` |
| `PATCH /api/inventory/{id}/stock` | `adjustStock` | admin | `almacenAplicacion.ts` (botones + / −) |
| `GET /api/inventory-logs` | `logs` | admin, cocina | También por `/api/sync` (clave `inventoryLogs`) |

- **Modelo:** `Ingrediente` (la misma tabla INGREDIENTE).
- **Formato JSON:** `comoInventario()` → `ingrediente_a_inventario()` en `app/Views/json/ingrediente.php`.

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$datos['amount']` | En `adjustStock`: cuánto sumar (positivo) o restar (negativo). |
| `Auth::id()` | Id del admin que hizo el cambio; queda en MOVIMIENTO_INVENTARIO. |
| `$id` | El insumo (`{id}` de la ruta). |

## Acciones
- **`index`**: lista los insumos activos.
- **`store`**: valida `name` y `category` y crea el insumo con su stock inicial. **201**.
- **`update`**: edita los campos enviados. **404** si no existe.
- **`destroy`**: lo desactiva (no lo borra, porque tiene historial).
- **`adjustStock`**:
  ```php
  if (!isset($datos['amount']) || !is_numeric($datos['amount'])) ...
  $ingredienteModel->ajustarStock($id, (float) $datos['amount'], Auth::id());
  ```
  Suma o resta stock (nunca queda en negativo) y guarda el movimiento en el historial.
- **`logs`**: devuelve el historial de entradas y salidas de inventario.
