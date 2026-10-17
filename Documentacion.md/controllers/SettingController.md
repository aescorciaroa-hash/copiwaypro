# controllers/SettingController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga de los ajustes de la tienda.

## ¿Qué hace?
- guardar los ajustes de la tienda
- agregar categorías del menú
- eliminar categorías del menú

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `update()` | guardar los ajustes de la tienda | `PUT /api/settings` |
| `addCategory()` | agregar categorías del menú | `POST /api/settings/categories` |
| `removeCategory()` | eliminar categorías del menú | `DELETE /api/settings/categories/{category}` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** SettingsSection.tsx (Ajustes y Caja); MenuSection.tsx (Gestión de Menú).
- **Usa los modelos:** `Configuracion`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Ajustes de la tienda (horario, tarifas y categorias del menu)."* |
| 5 | `require_once __DIR__ . '/../models/Configuracion.php';` | Trae el archivo `Configuracion.php` para poder usar la clase `Configuracion`. |
| 7 | `class SettingController` | Crea la clase `SettingController`: un grupo de funciones que trabajan juntas. |
| 8 | `{` | Abre la clase `SettingController`. |
| 9 | `private $configModel;` | Cajita `$configModel` de la clase: aquí se guarda el modelo `Configuracion`. |
| 10 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `$this->configModel = new Configuracion();` | Crea el modelo `Configuracion` y lo guarda en `$this->configModel`, para usarlo en las funciones de abajo. |
| 15 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 16 | `}` | Cierra la función `__construct()`. |
| 18 | `public function update()` | Función `update()`: guarda los ajustes de la tienda (horario, tarifa, puntos, datos del negocio). Ruta: `PUT /api/settings`. La llama `SettingsSection.tsx`. |
| 19 | `{` | Abre la función `update()`. |
| 20 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 21 | `if (array_key_exists('pointValue', $this->datos) && (!is_numeric($this->datos['pointValue']) \|\| $this->datos['pointValue'] < 0)) {` | Si mandó el valor del punto (`array_key_exists`) y no es un número o es menor que 0... |
| 22 | `$errores['pointValue'] = ['El valor del punto debe ser un número mayor o igual a 0.'];` | ...anota el error. |
| 23 | `}` | Cierra el `if`. |
| 24 | `if (array_key_exists('minPointsToRedeem', $this->datos) && (filter_var($this->datos['minPointsToRedeem'], FILTER_VALIDATE_INT) === false \|\| $this->datos['minPointsToRedeem'] < 0)) {` | Si mandó el mínimo de puntos y no es un número entero (`FILTER_VALIDATE_INT`) o es menor que 0... |
| 25 | `$errores['minPointsToRedeem'] = ['El mínimo de puntos debe ser un número entero mayor o igual a 0.'];` | ...anota el error. |
| 26 | `}` | Cierra el `if`. |
| 27 | `if (isset($this->datos['business']['name']) && trim((string) $this->datos['business']['name']) === '') {` | Si mandó el nombre del negocio (`['business']['name']` = el dato `name` dentro de `business`) y está vacío... |
| 28 | `$errores['business.name'] = ['El nombre del negocio es obligatorio.'];` | ...anota el error. |
| 29 | `}` | Cierra el `if`. |
| 30 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 31 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 32 | `}` | Cierra el `if`. |
| 34 | `$this->configModel->actualizar($this->datos);` | Guarda los ajustes (`actualizar()` de `models/Configuracion.php`). |
| 35 | `responderJson($this->configModel->obtener());` | Responde con los ajustes actualizados (`obtener()`). |
| 36 | `}` | Cierra la función `update()`. |
| 38 | `public function addCategory()` | Función `addCategory()`: agrega una categoría del menú. Ruta: `POST /api/settings/categories`. La llama `MenuSection.tsx`. |
| 39 | `{` | Abre la función `addCategory()`. |
| 40 | `$categoria = trim((string) ($this->datos['category'] ?? ''));` | Guarda en `$categoria` el nombre, sin espacios. |
| 41 | `if ($categoria === '') {` | Si está vacío... |
| 42 | `responderError('Datos inválidos.', 422, ['category' => ['El campo category es obligatorio.']]);` | ...responde 422 "El campo category es obligatorio.". |
| 43 | `}` | Cierra el `if`. |
| 44 | `$this->configModel->agregarCategoria($categoria);` | La agrega (`agregarCategoria()` de `models/Configuracion.php`). |
| 45 | `responderJson($this->configModel->obtener());` | Responde con los ajustes actualizados (incluyen las categorías). |
| 46 | `}` | Cierra la función `addCategory()`. |
| 48 | `public function removeCategory()` | Función `removeCategory()`: elimina una categoría. Ruta: `DELETE /api/settings/categories/{category}`. |
| 49 | `{` | Abre la función `removeCategory()`. |
| 50 | `$categoria = $_GET['category'];` | Guarda en `$categoria` el nombre que viene en la dirección. |
| 51 | `try {` | Intenta... |
| 52 | `$this->configModel->eliminarCategoria(urldecode($categoria));` | ...eliminarla (`eliminarCategoria()`). `urldecode` arregla los caracteres especiales del nombre (ej. espacios). |
| 53 | `} catch (Exception $e) {` | Si falló (algún producto todavía la usa)... |
| 54 | `responderError($e->getMessage(), 409);` | ...responde 409 con el mensaje. |
| 55 | `}` | Cierra el `catch`. |
| 56 | `responderJson($this->configModel->obtener());` | Responde con los ajustes actualizados. |
| 57 | `}` | Cierra la función `removeCategory()`. |
| 58 | `}` | Cierra la clase `SettingController`. |
| 60 | `$controller = new SettingController();` | Crea el controlador. Al hacer `new SettingController()` se ejecuta su `__construct()`. |
| 62 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 64 | `if ($accion === 'update') {` | Si la acción es `'update'`... |
| 65 | `$controller->update();` | ...llama al método `update()` de arriba. |
| 66 | `} elseif ($accion === 'addCategory') {` | Si no, si la acción es `'addCategory'`... |
| 67 | `$controller->addCategory();` | ...llama al método `addCategory()` de arriba. |
| 68 | `} elseif ($accion === 'removeCategory') {` | Si no, si la acción es `'removeCategory'`... |
| 69 | `$controller->removeCategory();` | ...llama al método `removeCategory()` de arriba. |
| 70 | `} else {` | Si no es ninguna de las anteriores... |
| 71 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 72 | `}` | Cierra el `else`. |
| 73 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú | `Failed to open stream` |
| el `require_once` de `Configuracion.php` | todas sus acciones | `Class "Configuracion" not found` |
| el método `update()` | guardar los ajustes de la tienda | `Call to undefined method SettingController::update()` |
| el método `addCategory()` | agregar categorías del menú | `Call to undefined method SettingController::addCategory()` |
| el método `removeCategory()` | eliminar categorías del menú | `Call to undefined method SettingController::removeCategory()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
