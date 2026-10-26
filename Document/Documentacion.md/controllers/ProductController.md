# controllers/ProductController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga de los productos del menú.

## ¿Qué hace?
- crear productos
- editar productos
- eliminar productos

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `store()` | crear productos | `POST /api/products` |
| `update()` | editar productos | `PUT /api/products/{id}` |
| `destroy()` | eliminar productos | `DELETE /api/products/{id}` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** MenuSection.tsx (Gestión de Menú).
- **Usa los modelos:** `Producto`.

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta

1. React llama la API (`src/servicios/api.ts`, con `fetch`, la cookie de sesión y el `X-CSRF-Token`).
2. `public/index.php` → `despacharRuta()` busca la ruta en `config/rutas.php`.
3. `verificarCsrf()` (si falla → 419) y `requiereRol()` (sin sesión → 401, otro rol → 403).
4. `cargarControlador()` pone la acción y los `{parametros}` en `$_GET` y hace `require` de este archivo.
5. Al final del archivo: `new ProductController()` y un `if` elige el método según `$_GET['accion']`.
6. El método le pide los datos a `Producto` y este usa `$conn` para ir a MySQL.
7. Contesta con `responderJson()` o `responderError()` (JSON para React).

**Sus rutas** (de `config/rutas.php`):

| Método | Dirección | Acción | Quién puede |
|---|---|---|---|
| `POST` | `/api/products` | `store()` | admin |
| `PUT` | `/api/products/{id}` | `update()` | admin |
| `DELETE` | `/api/products/{id}` | `destroy()` | admin |

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué modelo se conecta `ProductController`?**  
Con `Producto`. Lo trae con `require_once __DIR__ . '/../models/...'` y lo crea con `new` (los `static`, como `Auth`, se usan con `::`).

**¿El controlador se conecta directo a la base de datos?**  
No. El controlador nunca escribe SQL: se lo pide al modelo, y el modelo usa `$conn`.

**¿Quién llama a este controlador?**  
`cargarControlador()` de `config/helpers.php`, después de que `despacharRuta()` encuentra la ruta en `config/rutas.php`.

**¿Cómo sabe qué método ejecutar?**  
Por `$_GET['accion']`, que lo pone `cargarControlador()`. El `if` del final del archivo llama el método que corresponde.

**¿Cómo recibe los datos?**  
Con `entrada()` (junta `$_GET` y el JSON que mandó React) y el `{id}` de la dirección en `$_GET['id']`.

**¿Por qué valida antes de llamar al modelo?**  
Para contestar 422 con un mensaje claro ("El campo name es obligatorio") sin ir a la base de datos.

**¿Por qué después de `crear()` llama `buscar()`?**  
Para devolverle a React el producto completo como quedó guardado (con id, categoría y receta).

**¿Qué pasa si se borra este archivo?**  
Las rutas que lo usan dan error 500 (*"Failed opening required"*) y esa parte de la pantalla deja de funcionar.

**¿Qué pasa si se borra una ruta suya de `config/rutas.php`?**  
React recibe **404 Ruta no encontrada** al usar esa acción.

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Productos (menu)."* |
| 5 | `require_once __DIR__ . '/../models/Producto.php';` | Trae el archivo `Producto.php` para poder usar la clase `Producto`. |
| 7 | `class ProductController` | Crea la clase `ProductController`: un grupo de funciones que trabajan juntas. |
| 8 | `{` | Abre la clase `ProductController`. |
| 9 | `private $productoModel;` | Cajita `$productoModel` de la clase: aquí se guarda el modelo `Producto`. |
| 10 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `$this->productoModel = new Producto();` | Crea el modelo `Producto` y lo guarda en `$this->productoModel`, para usarlo en las funciones de abajo. |
| 15 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 16 | `}` | Cierra la función `__construct()`. |
| 18 | `public function store()` | Función `store()`: crea un producto. Ruta: `POST /api/products`. La llama `MenuSection.tsx` (Gestión de Menú). |
| 19 | `{` | Abre la función `store()`. |
| 20 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 21 | `if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];` | Si falta el nombre, anota el error. |
| 22 | `if (!isset($this->datos['price']) \|\| !is_numeric($this->datos['price'])) $errores['price'] = ['El campo price debe ser numérico.'];` | Si falta el precio (`!isset`) o no es un número (`!is_numeric`), anota el error. |
| 23 | `if (empty($this->datos['category'])) $errores['category'] = ['El campo category es obligatorio.'];` | Si falta la categoría, anota el error. |
| 24 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 25 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 26 | `}` | Cierra el `if`. |
| 28 | `try {` | Intenta... |
| 29 | `$id = $this->productoModel->crear($this->datos);` | ...crear el producto con su receta (`crear()` de `models/Producto.php`) y guarda el número nuevo en `$id`. |
| 30 | `} catch (Exception $e) {` | Si falló... |
| 31 | `responderError($e->getMessage(), 422);` | ...responde 422 con el mensaje. |
| 32 | `}` | Cierra el `catch`. |
| 33 | `responderJson($this->productoModel->buscar($id, true), 201);` | Busca el producto nuevo con los datos completos (`buscar($id, true)`; `true` = como lo ve el administrador) y responde 201 (creado). |
| 34 | `}` | Cierra la función `store()`. |
| 36 | `public function update()` | Función `update()`: edita un producto. Ruta: `PUT /api/products/{id}`. |
| 37 | `{` | Abre la función `update()`. |
| 38 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 39 | `if (!$this->productoModel->buscar($id)) {` | Si el producto no existe (`buscar()` de `models/Producto.php`)... |
| 40 | `responderError('Producto no encontrado.', 404);` | ...responde 404 "Producto no encontrado.". |
| 41 | `}` | Cierra el `if`. |
| 42 | `if (array_key_exists('price', $this->datos) && !is_numeric($this->datos['price'])) {` | Si mandó precio (`array_key_exists` = ¿viene este dato?) y no es un número... |
| 43 | `responderError('Datos inválidos.', 422, ['price' => ['El campo price debe ser numérico.']]);` | ...responde 422 "El campo price debe ser numérico.". |
| 44 | `}` | Cierra el `if`. |
| 46 | `try {` | Intenta... |
| 47 | `$this->productoModel->actualizar($id, $this->datos);` | ...guardar los cambios (`actualizar()` de `models/Producto.php`). |
| 48 | `} catch (Exception $e) {` | Si falló... |
| 49 | `responderError($e->getMessage(), 422);` | ...responde 422. |
| 50 | `}` | Cierra el `catch`. |
| 51 | `responderJson($this->productoModel->buscar($id, true));` | Responde con el producto actualizado (como lo ve el administrador). |
| 52 | `}` | Cierra la función `update()`. |
| 54 | `public function destroy()` | Función `destroy()`: elimina un producto. Ruta: `DELETE /api/products/{id}`. |
| 55 | `{` | Abre la función `destroy()`. |
| 56 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 57 | `if (!$this->productoModel->buscar($id)) {` | Si el producto no existe... |
| 58 | `responderError('Producto no encontrado.', 404);` | ...responde 404. |
| 59 | `}` | Cierra el `if`. |
| 60 | `$this->productoModel->eliminar($id);` | Lo elimina (`eliminar()` de `models/Producto.php`). |
| 61 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 62 | `}` | Cierra la función `destroy()`. |
| 63 | `}` | Cierra la clase `ProductController`. |
| 65 | `$controller = new ProductController();` | Crea el controlador. Al hacer `new ProductController()` se ejecuta su `__construct()`. |
| 67 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 69 | `if ($accion === 'store') {` | Si la acción es `'store'`... |
| 70 | `$controller->store();` | ...llama al método `store()` de arriba. |
| 71 | `} elseif ($accion === 'update') {` | Si no, si la acción es `'update'`... |
| 72 | `$controller->update();` | ...llama al método `update()` de arriba. |
| 73 | `} elseif ($accion === 'destroy') {` | Si no, si la acción es `'destroy'`... |
| 74 | `$controller->destroy();` | ...llama al método `destroy()` de arriba. |
| 75 | `} else {` | Si no es ninguna de las anteriores... |
| 76 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 77 | `}` | Cierra el `else`. |
| 78 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | crear productos, editar productos, eliminar productos | `Failed to open stream` |
| el `require_once` de `Producto.php` | todas sus acciones | `Class "Producto" not found` |
| el método `store()` | crear productos | `Call to undefined method ProductController::store()` |
| el método `update()` | editar productos | `Call to undefined method ProductController::update()` |
| el método `destroy()` | eliminar productos | `Call to undefined method ProductController::destroy()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
