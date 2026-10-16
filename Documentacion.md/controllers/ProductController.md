# controllers/ProductController.php

## ¿Para qué sirve?
Maneja los **productos del menú** (hamburguesas, bebidas...): listarlos, verlos, crearlos, editarlos
y eliminarlos.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
| `GET /api/products` | `index` | cualquiera | La lista llega normalmente por `/api/sync` (`SyncDatos.tsx`) |
| `GET /api/products/{id}` | `show` | cualquiera | — |
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
