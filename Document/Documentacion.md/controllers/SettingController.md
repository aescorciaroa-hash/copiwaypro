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

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta

1. React llama la API (`src/servicios/api.ts`, con `fetch`, la cookie de sesión y el `X-CSRF-Token`).
2. `public/index.php` → `despacharRuta()` busca la ruta en `config/rutas.php`.
3. `verificarCsrf()` (si falla → 419) y `requiereRol()` (sin sesión → 401, otro rol → 403).
4. `cargarControlador()` pone la acción y los `{parametros}` en `$_GET` y hace `require` de este archivo.
5. Al final del archivo: `new SettingController()` y un `if` elige el método según `$_GET['accion']`.
6. El método le pide los datos a `Configuracion` y este usa `$conn` para ir a MySQL.
7. Contesta con `responderJson()` o `responderError()` (JSON para React).

**Sus rutas** (de `config/rutas.php`):

| Método | Dirección | Acción | Quién puede |
|---|---|---|---|
| `PUT` | `/api/settings` | `update()` | admin |
| `POST` | `/api/settings/categories` | `addCategory()` | admin |
| `DELETE` | `/api/settings/categories/{category}` | `removeCategory()` | admin |

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué modelo se conecta `SettingController`?**  
Con `Configuracion`. Lo trae con `require_once __DIR__ . '/../models/...'` y lo crea con `new` (los `static`, como `Auth`, se usan con `::`).

**¿El controlador se conecta directo a la base de datos?**  
No. El controlador nunca escribe SQL: se lo pide al modelo, y el modelo usa `$conn`.

**¿Quién llama a este controlador?**  
`cargarControlador()` de `config/helpers.php`, después de que `despacharRuta()` encuentra la ruta en `config/rutas.php`.

**¿Cómo sabe qué método ejecutar?**  
Por `$_GET['accion']`, que lo pone `cargarControlador()`. El `if` del final del archivo llama el método que corresponde.

**¿Cómo recibe los datos?**  
Con `entrada()` (junta `$_GET` y el JSON que mandó React) y el `{id}` de la dirección en `$_GET['id']`.

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
| 44 | `try {` | Intenta... |
| 45 | `$this->configModel->agregarCategoria($categoria);` | ...agregarla (`agregarCategoria()` de `models/Configuracion.php`). |
| 46 | `} catch (InvalidArgumentException $e) {` | Si el nombre no se puede usar (es "Personalizado", la categoría interna)... |
| 47 | `responderError($e->getMessage(), 422);` | ...responde 422 con el mensaje. |
| 48 | `}` | Cierra el `catch`. |
| 49 | `responderJson($this->configModel->obtener());` | Responde con los ajustes actualizados (incluyen las categorías). |
| 50 | `}` | Cierra la función `addCategory()`. |
| 52 | `public function removeCategory()` | Función `removeCategory()`: elimina una categoría. Ruta: `DELETE /api/settings/categories/{category}`. |
| 53 | `{` | Abre la función `removeCategory()`. |
| 54 | `$categoria = $_GET['category'];` | Guarda en `$categoria` el nombre que viene en la dirección. |
| 55 | `try {` | Intenta... |
| 56 | `$this->configModel->eliminarCategoria(urldecode($categoria));` | ...eliminarla (`eliminarCategoria()`). `urldecode` arregla los caracteres especiales del nombre (ej. espacios). |
| 57 | `} catch (Exception $e) {` | Si falló (algún producto todavía la usa)... |
| 58 | `responderError($e->getMessage(), 409);` | ...responde 409 con el mensaje. |
| 59 | `}` | Cierra el `catch`. |
| 60 | `responderJson($this->configModel->obtener());` | Responde con los ajustes actualizados. |
| 61 | `}` | Cierra la función `removeCategory()`. |
| 62 | `}` | Cierra la clase `SettingController`. |
| 64 | `$controller = new SettingController();` | Crea el controlador. Al hacer `new SettingController()` se ejecuta su `__construct()`. |
| 66 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 68 | `if ($accion === 'update') {` | Si la acción es `'update'`... |
| 69 | `$controller->update();` | ...llama al método `update()` de arriba. |
| 70 | `} elseif ($accion === 'addCategory') {` | Si no, si la acción es `'addCategory'`... |
| 71 | `$controller->addCategory();` | ...llama al método `addCategory()` de arriba. |
| 72 | `} elseif ($accion === 'removeCategory') {` | Si no, si la acción es `'removeCategory'`... |
| 73 | `$controller->removeCategory();` | ...llama al método `removeCategory()` de arriba. |
| 74 | `} else {` | Si no es ninguna de las anteriores... |
| 75 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 76 | `}` | Cierra el `else`. |
| 77 | `?>` | Cierra el código PHP. |

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
