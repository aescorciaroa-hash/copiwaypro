# app/Controllers/ — cómo funciona un controlador

Todos los controladores tienen la **misma forma**. Si entiendes esta, entiendes todos.

```php
<?php
/**
 * Controlador de Productos (menu).
 */
require_once __DIR__ . '/../../config/database.php';   // 1. cargar lo que necesita
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Models/Producto.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';    // 2. ¿qué acción piden?

$productoModel = new Producto();                         // 3. crear los modelos
$datos         = entrada();                              // 4. datos que envió React

if ($action === 'index') {                               // 5. una rama por acción
    responderJson($productoModel->listar());
}
elseif ($action === 'update') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    ...
}
else {
    responderError('Ruta no encontrada.', 404);
}
```

## Paso a paso

| Paso | Qué pasa | Conexión |
|---|---|---|
| 1. `require_once` | Carga la conexión, las funciones de ayuda y los modelos que va a usar. | `config/database.php`, `app/Core/*`, `app/Models/*` |
| 2. `$action` | Lee qué acción pidió la ruta. | La pone `cargarControlador()` (`helpers.php`) a partir de `config/rutas.php`. Ej: `'PUT /api/products/{id}' => ['ProductController', 'update', ...]` → `$action = 'update'`. |
| 3. `new Modelo()` | Crea los objetos que hablan con MySQL. | `app/Models/` |
| 4. `entrada()` | Junta el JSON que envió React + `$_GET`. | `helpers.php`. React lo envía desde `src/servicios/api.ts`. |
| 5. `if / elseif` | Ejecuta solo la parte que corresponde a `$action`. | |
| `$id = $_GET['id'] ...` | El valor de `{id}` en la ruta (ej: `/api/products/6` → `'6'`). | Lo pone `cargarControlador()`. |
| `responderJson(...)` | Envía la respuesta a React y **termina** (`exit`). | `helpers.php` |
| `responderError(...)` | Envía un error con su código HTTP y termina. | `helpers.php` |

## Validaciones
Muchas acciones validan así:
```php
$errores = [];
if (empty($datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
if ($errores) {
    responderError('Datos inválidos.', 422, $errores);
}
```
- `empty()` es `true` si el valor no existe, está vacío, es `0` o `null`.
- Cada error se guarda con el nombre del campo, así React puede mostrar el mensaje debajo del campo correcto.
- `if ($errores)`: un arreglo vacío cuenta como `false`; si tiene algo, como `true`.

## ¿Por qué no usan `redirect()` como en clase?
Porque la pantalla está hecha en **React**. React espera **JSON** para mostrar los datos; si PHP
redirigiera, React no sabría qué hacer con la respuesta.
