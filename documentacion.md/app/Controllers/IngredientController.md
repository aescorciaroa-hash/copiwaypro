# app/Controllers/IngredientController.php

## ¿Para qué sirve?
Maneja los **ingredientes vistos como "extras"**: lo que el cliente puede agregar o quitar de su
hamburguesa (por ejemplo, "extra queso"). Usa la misma tabla INGREDIENTE que el inventario, pero
muestra otra forma de los datos (con el precio del extra).

## ¿Con qué se conecta?
| Ruta | `$action` | Quién |
|---|---|---|
| `GET /api/ingredients` | `index` | cualquiera |
| `POST /api/ingredients` | `store` | admin |
| `PUT /api/ingredients/{id}` | `update` | admin |
| `DELETE /api/ingredients/{id}` | `destroy` | admin |

- **React:** la lista llega por `/api/sync` (clave `ingredients`) y la usan `client/BuilderSection.tsx`
  (crear hamburguesa) y el personalizador del catálogo.
- **Modelo:** `Ingrediente` → `listarIngredientes()`, `crearConStockInicial()`, `actualizar()`, `eliminar()`.
- **Formato JSON:** `comoIngrediente()` usa `ingrediente_a_catalogo()` de `app/Views/json/ingrediente.php`.

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$ingredienteModel` | Objeto del modelo `Ingrediente`. |
| `$datos` | Lo enviado: `name`, `category`, `unit`, `stock`, `unitCost`, `price`... |
| `$id` | El `{id}` de la ruta. |
| `Auth::id()` | Id del admin, para registrar quién hizo el movimiento de inventario inicial. |

## Acciones
- **`index`**: lista los ingredientes activos que no son empaques.
- **`store`**: valida `name` y `category`, crea el ingrediente (si trae stock inicial, también registra una "entrada" en el historial) y responde **201**.
- **`update`**: si existe, cambia los campos enviados; si no, **404**.
- **`destroy`**: lo desactiva (`activo = 0`), no lo borra (ver `Ingrediente::eliminar`).
