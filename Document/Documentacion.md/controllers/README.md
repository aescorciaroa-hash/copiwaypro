# controllers/ — cómo funciona un controlador

Todos los controladores tienen la **misma forma** (la misma que en los trabajos de clase): una
**clase** con un método por acción y, al final del archivo, el código que decide qué método
ejecutar según `$_GET['accion']`. Si entiendes este, entiendes todos.

```php
<?php
require_once __DIR__ . '/../models/Producto.php';        // 1. cargar el modelo que usa

class ProductController
{
    private $productoModel;                              // 2. propiedades
    private $datos;

    public function __construct()                        // 3. constructor
    {
        $this->productoModel = new Producto();
        $this->datos = entrada();                        //    datos que envió React
    }

    public function index()                              // 4. un método por acción
    {
        responderJson($this->productoModel->listar());
    }

    public function update()
    {
        $id = $_GET['id'];
        ...
    }
}

$controller = new ProductController();                   // 5. crear el controlador

$accion = $_GET['accion'] ?? '';                         // 6. ¿qué acción piden?

if ($accion === 'index') {                               // 7. llamar al método
    $controller->index();
} elseif ($accion === 'update') {
    $controller->update();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>
```

## Paso a paso

| Paso | Qué pasa | Conexión |
|---|---|---|
| 1. `require_once` | Carga los modelos que va a usar. La conexión, las funciones de ayuda, `Session` y `Auth` ya los cargó `public/index.php`. | `models/*` |
| 2. `private $...` | Las propiedades que comparten todos los métodos (modelos y datos). | |
| 3. `__construct()` | Crea los modelos y lee los datos que envió React. | `models/`, `entrada()` en `config/helpers.php`. React los envía desde `src/servicios/api.ts`. |
| 4. `public function ...()` | Un método por cada acción. Dentro se usa `$this->` para llegar a las propiedades. | |
| 5. `new ProductController()` | Crea el objeto del controlador. | |
| 6. `$accion` | Lee qué acción pidió la ruta. | La pone `cargarControlador()` (`config/helpers.php`) a partir de `config/rutas.php`. Ej: `'PUT /api/products/{id}' => ['ProductController', 'update', ...]` → `$_GET['accion'] = 'update'`. |
| 7. `if / elseif` | Llama solo al método que corresponde. | |
| `$id = $_GET['id'] ...` | El valor de `{id}` en la ruta (ej: `/api/products/6` → `'6'`). | Lo pone `cargarControlador()`. |
| `responderJson(...)` | Envía la respuesta a React y **termina** (`exit`). | `config/helpers.php` |
| `responderError(...)` | Envía un error con su código HTTP y termina. | `config/helpers.php` |

## Cada archivo se carga en un solo lugar
Ningún `require_once` está repetido. `public/index.php` carga lo común (conexión, `app.php`,
`helpers.php`, `Session.php` y `Auth.php`) y cada controlador carga solo sus modelos. Así, si se
borra un `require_once` o un método, esa parte deja de funcionar y el error dice exactamente qué
falta (por ejemplo `Class "Producto" not found` o `Call to undefined method ...`).

## Validaciones
Muchas acciones validan así:
```php
$errores = [];
if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
if ($errores) {
    responderError('Datos inválidos.', 422, $errores);
}
```
- `empty()` es `true` si el valor no existe, está vacío, es `0` o `null`.
- Cada error se guarda con el nombre del campo, así React puede mostrar el mensaje debajo del campo correcto.
- `if ($errores)`: un arreglo vacío cuenta como `false`; si tiene algo, como `true`.

## ¿Por qué responden JSON y no usan `header('Location: ...')` como en clase?
Porque la pantalla está hecha en **React**. React espera **JSON** para mostrar los datos; si PHP
redirigiera, React no sabría qué hacer con la respuesta.
