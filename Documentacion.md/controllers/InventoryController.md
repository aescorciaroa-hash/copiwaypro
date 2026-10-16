# controllers/InventoryController.php

## ¿Para qué sirve?
Maneja el **inventario de insumos** (pan, carne, queso, cajas...): ver cuánto hay, crear insumos,
editarlos, ajustar el stock y ver el historial de movimientos.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
| `POST /api/inventory` | `store` | admin | `almacenAplicacion.ts` ← `admin/InventorySection.tsx` |
| `PUT /api/inventory/{id}` | `update` | admin | `almacenAplicacion.ts` ← `InventorySection.tsx` |
| `DELETE /api/inventory/{id}` | `destroy` | admin | `almacenAplicacion.ts` ← `InventorySection.tsx` |
| `PATCH /api/inventory/{id}/stock` | `adjustStock` | admin | `almacenAplicacion.ts` (botones + / −) |

- **Modelo:** `Ingrediente` (la misma tabla INGREDIENTE).
- **Formato JSON:** `comoInventario()` → `ingrediente_a_inventario()` en `views/json/ingrediente.php`.

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$this->datos['amount']` | En `adjustStock`: cuánto sumar (positivo) o restar (negativo). |
| `Auth::id()` | Id del admin que hizo el cambio; queda en MOVIMIENTO_INVENTARIO. |
| `$id` | El insumo (`{id}` de la ruta). |

## Acciones
- **`index`**: lista los insumos activos.
- **`store`**: valida `name` y `category` y crea el insumo con su stock inicial. **201**.
- **`update`**: edita los campos enviados. **404** si no existe.
- **`destroy`**: lo desactiva (no lo borra, porque tiene historial).
- **`adjustStock`**:
  ```php
  if (!isset($this->datos['amount']) || !is_numeric($this->datos['amount'])) ...
  $this->ingredienteModel->ajustarStock($id, (float) $this->datos['amount'], Auth::id());
  ```
  Suma o resta stock (nunca queda en negativo) y guarda el movimiento en el historial.
- **`logs`**: devuelve el historial de entradas y salidas de inventario.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `POST /api/inventory`, `PUT /api/inventory/{id}`, `DELETE /api/inventory/{id}`, `PATCH /api/inventory/{id}/stock`. | `Failed to open stream: No such file or directory` (…`controllers/InventoryController.php`) |
| La línea `require_once __DIR__ . '/../models/Ingrediente.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Ingrediente" not found` |
| El método `store()` | Admin → Inventario: no se pueden crear insumos. | `Call to undefined method InventoryController::store()` (500) |
| La rama `$accion === 'store'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/inventory'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `update()` | Admin → Inventario: no se pueden editar insumos. | `Call to undefined method InventoryController::update()` (500) |
| La rama `$accion === 'update'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PUT /api/inventory/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `destroy()` | Admin → Inventario: no se pueden eliminar insumos. | `Call to undefined method InventoryController::destroy()` (500) |
| La rama `$accion === 'destroy'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'DELETE /api/inventory/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `adjustStock()` | Admin → Inventario: no se puede sumar o restar stock. | `Call to undefined method InventoryController::adjustStock()` (500) |
| La rama `$accion === 'adjustStock'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/inventory/{id}/stock'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| La línea `$this->ingredienteModel = ...` del constructor | Las acciones que usan `$this->ingredienteModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
