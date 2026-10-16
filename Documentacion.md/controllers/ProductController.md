# controllers/ProductController.php

## ¿Para qué sirve?
Maneja los **productos del menú** (hamburguesas, bebidas...): listarlos, verlos, crearlos, editarlos
y eliminarlos.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
| `POST /api/products` | `store` | admin | `src/store/almacenAplicacion.ts` (desde `admin/MenuSection.tsx`) |
| `PUT /api/products/{id}` | `update` | admin | `almacenAplicacion.ts` (desde `MenuSection.tsx`) |
| `DELETE /api/products/{id}` | `destroy` | admin | `almacenAplicacion.ts` (desde `MenuSection.tsx`) |

| Usa | Para qué |
|---|---|
| `Producto` (modelo) | Todas las consultas a PRODUCTO y RECETA. |
| `Auth` | Saber si quien pregunta es admin. |

## Variables importantes
| Variable | De dónde viene | Para qué sirve |
|---|---|---|
| `$esAdmin` | `Auth::check() && Auth::rol() === 'admin'` | El admin ve más datos (costos, receta y productos ocultos). |
| `$id` | `$_GET['id']` (el `{id}` de la ruta) | Qué producto. |
| `$this->datos` | `entrada()` | Lo que envió el formulario de `MenuSection.tsx`: `name`, `price`, `category`, `ingredients`, `packaging`, `badge`... |

## Acciones
### `index`
```php
responderJson($this->productoModel->listar(!$esAdmin, $esAdmin));
```
- Primer parámetro (`$soloActivos`): si **no** es admin, solo los productos activos.
- Segundo (`$esAdmin`): si es admin, el JSON completo.

### `show`
Busca un producto. Si no existe → **404**.

### `store` (crear)
1. Valida `name`, `price` (debe ser número: `is_numeric`) y `category`.
2. `$this->productoModel->crear($this->datos)` lo guarda junto con su receta.
3. Si el modelo lanza un error (por ejemplo, sin categoría), el `catch` responde **422**.
4. Responde **201** con el producto creado.

### `update` (editar)
1. Si el producto no existe → **404**.
2. Si envían `price`, debe ser número.
3. `$this->productoModel->actualizar($id, $this->datos)` cambia solo los campos que llegaron.

### `destroy` (eliminar)
Si existe, lo borra con `$this->productoModel->eliminar($id)`.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`. | `Failed to open stream: No such file or directory` (…`controllers/ProductController.php`) |
| La línea `require_once __DIR__ . '/../models/Producto.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Producto" not found` |
| El método `store()` | Admin → Gestión de Menú: no se pueden crear productos. | `Call to undefined method ProductController::store()` (500) |
| La rama `$accion === 'store'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/products'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `update()` | Admin → Gestión de Menú: no se pueden editar productos. | `Call to undefined method ProductController::update()` (500) |
| La rama `$accion === 'update'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PUT /api/products/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `destroy()` | Admin → Gestión de Menú: no se pueden eliminar productos. | `Call to undefined method ProductController::destroy()` (500) |
| La rama `$accion === 'destroy'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'DELETE /api/products/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| La línea `$this->productoModel = ...` del constructor | Las acciones que usan `$this->productoModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
