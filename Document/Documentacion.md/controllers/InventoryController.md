# controllers/InventoryController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga del inventario.

## ¿Qué hace?
- crear insumos
- editar insumos
- eliminar insumos
- sumar o restar stock

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `store()` | crear insumos | `POST /api/inventory` |
| `update()` | editar insumos | `PUT /api/inventory/{id}` |
| `destroy()` | eliminar insumos | `DELETE /api/inventory/{id}` |
| `adjustStock()` | sumar o restar stock | `PATCH /api/inventory/{id}/stock` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** InventorySection.tsx (Inventario).
- **Usa los modelos:** `Ingrediente`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Inventario (insumos, ajustes de stock y movimientos)."* |
| 5 | `require_once __DIR__ . '/../models/Ingrediente.php';` | Trae el archivo `Ingrediente.php` para poder usar la clase `Ingrediente`. |
| 7 | `class InventoryController` | Crea la clase `InventoryController`: un grupo de funciones que trabajan juntas. |
| 8 | `{` | Abre la clase `InventoryController`. |
| 9 | `private $ingredienteModel;` | Cajita `$ingredienteModel` de la clase: aquí se guarda el modelo `Ingrediente`. |
| 10 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `$this->ingredienteModel = new Ingrediente();` | Crea el modelo `Ingrediente` y lo guarda en `$this->ingredienteModel`, para usarlo en las funciones de abajo. |
| 15 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 16 | `}` | Cierra la función `__construct()`. |
| 18 | `public function store()` | Función `store()`: crea un insumo. Ruta: `POST /api/inventory`. La llama `InventorySection.tsx`. |
| 19 | `{` | Abre la función `store()`. |
| 20 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 21 | `if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];` | Si falta el nombre, anota el error. |
| 22 | `if (empty($this->datos['category'])) $errores['category'] = ['El campo category es obligatorio.'];` | Si falta la categoría, anota el error. |
| 23 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 24 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 25 | `}` | Cierra el `if`. |
| 27 | `$id = $this->ingredienteModel->crearConStockInicial($this->datos, Auth::id());` | Crea el insumo con su stock inicial (`crearConStockInicial()` de `models/Ingrediente.php`). `Auth::id()` = el administrador que lo crea. Guarda el número nuevo en `$id`. |
| 28 | `responderJson($this->ingredienteModel->comoInventario($this->ingredienteModel->buscar($id)), 201);` | Busca el insumo nuevo (`buscar()`), lo organiza para React (`comoInventario()`) y responde con 201 (creado). |
| 29 | `}` | Cierra la función `store()`. |
| 31 | `public function update()` | Función `update()`: edita un insumo. Ruta: `PUT /api/inventory/{id}`. |
| 32 | `{` | Abre la función `update()`. |
| 33 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 34 | `if (!$this->ingredienteModel->buscar($id)) {` | Si el insumo no existe (`buscar()` de `models/Ingrediente.php`)... |
| 35 | `responderError('Insumo no encontrado.', 404);` | ...responde 404 "Insumo no encontrado.". |
| 36 | `}` | Cierra el `if`. |
| 37 | `$this->ingredienteModel->actualizar($id, $this->datos);` | Guarda los cambios (`actualizar()`). |
| 38 | `responderJson($this->ingredienteModel->comoInventario($this->ingredienteModel->buscar($id)));` | Responde con el insumo actualizado. |
| 39 | `}` | Cierra la función `update()`. |
| 41 | `public function destroy()` | Función `destroy()`: elimina un insumo. Ruta: `DELETE /api/inventory/{id}`. |
| 42 | `{` | Abre la función `destroy()`. |
| 43 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 44 | `if (!$this->ingredienteModel->buscar($id)) {` | Si el insumo no existe... |
| 45 | `responderError('Insumo no encontrado.', 404);` | ...responde 404. |
| 46 | `}` | Cierra el `if`. |
| 47 | `$this->ingredienteModel->eliminar($id);` | Lo elimina (`eliminar()`; en realidad lo desactiva, porque puede estar en recetas y pedidos). |
| 48 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 49 | `}` | Cierra la función `destroy()`. |
| 51 | `public function adjustStock()` | Función `adjustStock()`: suma o resta stock. Ruta: `PATCH /api/inventory/{id}/stock`. |
| 52 | `{` | Abre la función `adjustStock()`. |
| 53 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 54 | `if (!$this->ingredienteModel->buscar($id)) {` | Si el insumo no existe... |
| 55 | `responderError('Insumo no encontrado.', 404);` | ...responde 404. |
| 56 | `}` | Cierra el `if`. |
| 57 | `if (!isset($this->datos['amount']) \|\| !is_numeric($this->datos['amount'])) {` | Si no mandó la cantidad (`!isset`) o no es un número (`!is_numeric`)... |
| 58 | `responderError('Datos inválidos.', 422, ['amount' => ['El campo amount debe ser numérico.']]);` | ...responde 422 "El campo amount debe ser numérico.". |
| 59 | `}` | Cierra el `if`. |
| 61 | `try {` | Intenta... |
| 62 | `$this->ingredienteModel->ajustarStock($id, (float) $this->datos['amount'], Auth::id());` | ...sumar o restar la cantidad (`ajustarStock()` de `models/Ingrediente.php`). Positivo suma, negativo resta. `(float)` = número con decimales. |
| 63 | `} catch (Exception $e) {` | Si falló (por ejemplo, el insumo ya no existe)...  El stock nunca queda negativo: si se resta de más, queda en 0. |
| 64 | `responderError($e->getMessage(), 422);` | ...responde 422 con el mensaje. |
| 65 | `}` | Cierra el `catch`. |
| 66 | `responderJson($this->ingredienteModel->comoInventario($this->ingredienteModel->buscar($id)));` | Responde con el insumo actualizado. |
| 67 | `}` | Cierra la función `adjustStock()`. |
| 68 | `}` | Cierra la clase `InventoryController`. |
| 70 | `$controller = new InventoryController();` | Crea el controlador. Al hacer `new InventoryController()` se ejecuta su `__construct()`. |
| 72 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 74 | `if ($accion === 'store') {` | Si la acción es `'store'`... |
| 75 | `$controller->store();` | ...llama al método `store()` de arriba. |
| 76 | `} elseif ($accion === 'update') {` | Si no, si la acción es `'update'`... |
| 77 | `$controller->update();` | ...llama al método `update()` de arriba. |
| 78 | `} elseif ($accion === 'destroy') {` | Si no, si la acción es `'destroy'`... |
| 79 | `$controller->destroy();` | ...llama al método `destroy()` de arriba. |
| 80 | `} elseif ($accion === 'adjustStock') {` | Si no, si la acción es `'adjustStock'`... |
| 81 | `$controller->adjustStock();` | ...llama al método `adjustStock()` de arriba. |
| 82 | `} else {` | Si no es ninguna de las anteriores... |
| 83 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 84 | `}` | Cierra el `else`. |
| 85 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | crear insumos, editar insumos, eliminar insumos, sumar o restar stock | `Failed to open stream` |
| el `require_once` de `Ingrediente.php` | todas sus acciones | `Class "Ingrediente" not found` |
| el método `store()` | crear insumos | `Call to undefined method InventoryController::store()` |
| el método `update()` | editar insumos | `Call to undefined method InventoryController::update()` |
| el método `destroy()` | eliminar insumos | `Call to undefined method InventoryController::destroy()` |
| el método `adjustStock()` | sumar o restar stock | `Call to undefined method InventoryController::adjustStock()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
