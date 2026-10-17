# controllers/CashClosingController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga del cierre de caja.

## ¿Qué hace?
- ver el cierre de caja antes de confirmarlo
- confirmar el cierre de caja

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `preview()` | ver el cierre de caja antes de confirmarlo | `GET /api/cash-closing/preview` |
| `store()` | confirmar el cierre de caja | `POST /api/cash-closing` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** AdminDashboard.tsx (botón "Generar cierre"); AdminDashboard.tsx (confirmar cierre).
- **Usa los modelos:** `CajaService`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Cierre de Caja."* |
| 5 | `require_once __DIR__ . '/../models/CajaService.php';` | Trae el archivo `CajaService.php` para poder usar la clase `CajaService`. |
| 7 | `class CashClosingController` | Crea la clase `CashClosingController`: un grupo de funciones que trabajan juntas. |
| 8 | `{` | Abre la clase `CashClosingController`. |
| 9 | `private $cajaService;` | Cajita `$cajaService` de la clase: aquí se guarda el modelo `CajaService`. |
| 11 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 12 | `{` | Abre la función `__construct()`. |
| 13 | `$this->cajaService = new CajaService();` | Crea el modelo `CajaService` y lo guarda en `$this->cajaService`, para usarlo en las funciones de abajo. |
| 14 | `}` | Cierra la función `__construct()`. |
| 16 | `public function preview()` | Función `preview()`: muestra el cierre de caja **sin guardarlo**. Ruta: `GET /api/cash-closing/preview`. La llama el botón "Generar cierre" (`AdminDashboard.tsx`). |
| 17 | `{` | Abre la función `preview()`. |
| 18 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Vista previa: mismo calculo que 'store' pero sin guardar nada."* |
| 19 | `try {` | `try` = intenta hacer lo de adentro; si falla, va al `catch`. |
| 20 | `responderJson($this->cajaService->previsualizar(Auth::id()));` | Calcula el cierre del administrador que inició sesión (`previsualizar()` de `models/CajaService.php`, con `Auth::id()`) y lo responde. |
| 21 | `} catch (Exception $e) {` | Si falló (por ejemplo, ya se hizo el cierre hoy)... `$e` guarda el error. |
| 22 | `responderError($e->getMessage(), 409);` | ...responde 409 con el mensaje del error (`$e->getMessage()`). |
| 23 | `}` | Cierra el `catch`. |
| 24 | `}` | Cierra la función `preview()`. |
| 26 | `public function store()` | Función `store()`: **guarda** el cierre de caja. Ruta: `POST /api/cash-closing`. La llama "Confirmar cierre". |
| 27 | `{` | Abre la función `store()`. |
| 28 | `try {` | Intenta... |
| 29 | `responderJson($this->cajaService->generar(Auth::id()), 201);` | ...guardar el cierre (`generar()` de `models/CajaService.php`) y responderlo con 201 (creado). |
| 30 | `} catch (Exception $e) {` | Si falló... |
| 31 | `responderError($e->getMessage(), 409);` | ...responde 409 con el mensaje del error. |
| 32 | `}` | Cierra el `catch`. |
| 33 | `}` | Cierra la función `store()`. |
| 34 | `}` | Cierra la clase `CashClosingController`. |
| 36 | `$controller = new CashClosingController();` | Crea el controlador. Al hacer `new CashClosingController()` se ejecuta su `__construct()`. |
| 38 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 40 | `if ($accion === 'preview') {` | Si la acción es `'preview'`... |
| 41 | `$controller->preview();` | ...llama al método `preview()` de arriba. |
| 42 | `} elseif ($accion === 'store') {` | Si no, si la acción es `'store'`... |
| 43 | `$controller->store();` | ...llama al método `store()` de arriba. |
| 44 | `} else {` | Si no es ninguna de las anteriores... |
| 45 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 46 | `}` | Cierra el `else`. |
| 47 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja | `Failed to open stream` |
| el `require_once` de `CajaService.php` | todas sus acciones | `Class "CajaService" not found` |
| el método `preview()` | ver el cierre de caja antes de confirmarlo | `Call to undefined method CashClosingController::preview()` |
| el método `store()` | confirmar el cierre de caja | `Call to undefined method CashClosingController::store()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
