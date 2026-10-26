# controllers/PaymentController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga de los pagos en línea (de prueba).

## ¿Qué hace?
- empezar un pago en línea
- crear el pago
- saber si el pago fue aprobado

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `prepare()` | empezar un pago en línea | `POST /api/payments/prepare` |
| `createTransaction()` | crear el pago | `POST /api/payments/transactions` |
| `showTransaction()` | saber si el pago fue aprobado | `GET /api/payments/transactions/{id}` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** ClientDashboard.tsx (pago en línea); lib/pasarela.ts.
- **Usa los modelos:** `PedidoService`.

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta

1. React llama la API (`src/servicios/api.ts`, con `fetch`, la cookie de sesión y el `X-CSRF-Token`).
2. `public/index.php` → `despacharRuta()` busca la ruta en `config/rutas.php`.
3. `verificarCsrf()` (si falla → 419) y `requiereRol()` (sin sesión → 401, otro rol → 403).
4. `cargarControlador()` pone la acción y los `{parametros}` en `$_GET` y hace `require` de este archivo.
5. Al final del archivo: `new PaymentController()` y un `if` elige el método según `$_GET['accion']`.
6. El método le pide los datos a `PedidoService`, `PagoService` y estos usan `$conn` para ir a MySQL.
7. Contesta con `responderJson()` o `responderError()` (JSON para React).

**Sus rutas** (de `config/rutas.php`):

| Método | Dirección | Acción | Quién puede |
|---|---|---|---|
| `POST` | `/api/payments/prepare` | `prepare()` | client |
| `POST` | `/api/payments/transactions` | `createTransaction()` | client |
| `GET` | `/api/payments/transactions/{id}` | `showTransaction()` | client |

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué modelo se conecta `PaymentController`?**  
Con `PedidoService`, `PagoService`. Los trae con `require_once __DIR__ . '/../models/...'` y los crea con `new` (los `static`, como `Auth`, se usan con `::`).

**¿El controlador se conecta directo a la base de datos?**  
No. El controlador nunca escribe SQL: se lo pide al modelo, y el modelo usa `$conn`.

**¿Quién llama a este controlador?**  
`cargarControlador()` de `config/helpers.php`, después de que `despacharRuta()` encuentra la ruta en `config/rutas.php`.

**¿Cómo sabe qué método ejecutar?**  
Por `$_GET['accion']`, que lo pone `cargarControlador()`. El `if` del final del archivo llama el método que corresponde.

**¿Cómo recibe los datos?**  
Con `entrada()` (junta `$_GET` y el JSON que mandó React) y el `{id}` de la dirección en `$_GET['id']`.

**¿Cómo se conecta con la pasarela de pago?**  
A través de `PagoService` (ver [10 — Pagos](../GuiasDelProyecto/General/10-pagos.md)).

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
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Pagos (pasarela de prueba, ver PagoService). El total siempre lo calcula el servidor con PedidoService::cotizar()."* |
| 6 | `require_once __DIR__ . '/../models/PedidoService.php';` | Trae `models/PedidoService.php`. Ese archivo también trae `PagoService.php`; por eso aquí se puede usar `new PagoService()`. |
| 8 | `class PaymentController` | Crea la clase `PaymentController`: un grupo de funciones que trabajan juntas. |
| 9 | `{` | Abre la clase `PaymentController`. |
| 10 | `private $pedidoService;` | Cajita `$pedidoService` de la clase: aquí se guarda el modelo `PedidoService`. |
| 11 | `private $pagoService;` | Cajita `$pagoService` de la clase: aquí se guarda el modelo `PagoService`. |
| 12 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 14 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 15 | `{` | Abre la función `__construct()`. |
| 16 | `$this->pedidoService = new PedidoService();` | Crea el modelo `PedidoService` y lo guarda en `$this->pedidoService`, para usarlo en las funciones de abajo. |
| 17 | `$this->pagoService = new PagoService();` | Crea el modelo `PagoService` y lo guarda en `$this->pagoService`, para usarlo en las funciones de abajo. |
| 18 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 19 | `}` | Cierra la función `__construct()`. |
| 21 | `public function prepare()` | Función `prepare()`: paso 1 del pago en línea. Calcula el total y prepara el pago. Ruta: `POST /api/payments/prepare`. La llama el checkout del cliente. |
| 22 | `{` | Abre la función `prepare()`. |
| 23 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Paso 1: recalcula el total del carrito y entrega referencia + firma."* |
| 24 | `if (empty($this->datos['items'])) {` | Si no hay productos... |
| 25 | `responderError('Datos inválidos.', 422, ['items' => ['El campo items es obligatorio.']]);` | ...responde 422 "El campo items es obligatorio.". |
| 26 | `}` | Cierra el `if`. |
| 28 | `try {` | Intenta... |
| 29 | `$total = $this->pedidoService->cotizar(Auth::id(), $this->datos);` | ...calcular el total del carrito en el servidor (`cotizar()` de `models/PedidoService.php`). Lo guarda en `$total`. |
| 30 | `responderJson($this->pagoService->prepararCheckout($total, Auth::id()) + ['total' => $total]);` | Prepara el pago con ese total (`prepararCheckout()` de `models/PagoService.php`): la referencia y la firma. Le suma (`+`) el total y lo responde. |
| 31 | `} catch (InvalidArgumentException $e) {` | Si los datos están mal... |
| 32 | `responderError($e->getMessage(), 422);` | ...responde 422. |
| 33 | `} catch (Exception $e) {` | Si falló por otra razón... |
| 34 | `$mensaje = $e->getMessage();` | ...guarda el mensaje. |
| 35 | `$codigo  = (stripos($mensaje, 'cerrada') !== false \|\| stripos($mensaje, 'pausada') !== false) ? 403 : 409;` | Si dice "cerrada" o "pausada", el código es 403; si no, 409. Lo guarda en `$codigo`. |
| 36 | `responderError($mensaje, $codigo);` | Responde el error con ese código. |
| 37 | `}` | Cierra el `catch`. |
| 38 | `}` | Cierra la función `prepare()`. |
| 40 | `public function createTransaction()` | Función `createTransaction()`: paso 2 del pago. Crea el pago. Ruta: `POST /api/payments/transactions`. La llama `lib/pasarela.ts`. |
| 41 | `{` | Abre la función `createTransaction()`. |
| 42 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Paso 2: crea la transaccion (nace PENDING)."* |
| 43 | `$referencia = (string) ($this->datos['reference'] ?? '');` | Guarda en `$referencia` la referencia del pago (la dio el paso 1). |
| 44 | `$centavos   = (int) ($this->datos['amountInCents'] ?? 0);` | Guarda en `$centavos` el monto en centavos (número entero). |
| 45 | `$firma      = (string) ($this->datos['signature'] ?? '');` | Guarda en `$firma` la firma de seguridad (la dio el paso 1). |
| 46 | `$metodo     = (string) ($this->datos['method'] ?? '');` | Guarda en `$metodo` el banco (Nequi, Daviplata, Bancolombia). |
| 47 | `$telefono   = (string) ($this->datos['phone'] ?? '');` | Guarda en `$telefono` el celular del pago. |
| 49 | `try {` | Intenta... |
| 50 | `$tx = $this->pagoService->crearTransaccion(Auth::id(), $referencia, $centavos, $firma, $metodo, $telefono);` | ...crear el pago (`crearTransaccion()` de `models/PagoService.php`): revisa la firma. Lo guarda en `$tx`. |
| 51 | `responderJson($tx, 201);` | Responde 201 (creado) con el pago. |
| 52 | `} catch (InvalidArgumentException $e) {` | Si los datos están mal (por ejemplo, la firma no coincide)... |
| 53 | `responderError($e->getMessage(), 422);` | ...responde 422. |
| 54 | `}` | Cierra el `catch`. |
| 55 | `}` | Cierra la función `createTransaction()`. |
| 57 | `public function showTransaction()` | Función `showTransaction()`: paso 3 del pago. Consulta si el pago fue aprobado. Ruta: `GET /api/payments/transactions/{id}`. |
| 58 | `{` | Abre la función `showTransaction()`. |
| 59 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Paso 3: consulta el estado hasta que deje de estar PENDING."* |
| 60 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 61 | `$tx = $this->pagoService->obtenerTransaccion($id, Auth::id());` | Busca el pago de este cliente (`obtenerTransaccion()` de `models/PagoService.php`) y lo guarda en `$tx`. |
| 62 | `if (!$tx) {` | Si no existe... |
| 63 | `responderError('Transacción no encontrada.', 404);` | ...responde 404 "Transacción no encontrada.". |
| 64 | `}` | Cierra el `if`. |
| 65 | `responderJson($tx);` | Responde con el pago (su estado: pendiente, aprobado o rechazado). |
| 66 | `}` | Cierra la función `showTransaction()`. |
| 67 | `}` | Cierra la clase `PaymentController`. |
| 69 | `$controller = new PaymentController();` | Crea el controlador. Al hacer `new PaymentController()` se ejecuta su `__construct()`. |
| 71 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 73 | `if ($accion === 'prepare') {` | Si la acción es `'prepare'`... |
| 74 | `$controller->prepare();` | ...llama al método `prepare()` de arriba. |
| 75 | `} elseif ($accion === 'createTransaction') {` | Si no, si la acción es `'createTransaction'`... |
| 76 | `$controller->createTransaction();` | ...llama al método `createTransaction()` de arriba. |
| 77 | `} elseif ($accion === 'showTransaction') {` | Si no, si la acción es `'showTransaction'`... |
| 78 | `$controller->showTransaction();` | ...llama al método `showTransaction()` de arriba. |
| 79 | `} else {` | Si no es ninguna de las anteriores... |
| 80 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 81 | `}` | Cierra el `else`. |
| 82 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | empezar un pago en línea, crear el pago, saber si el pago fue aprobado | `Failed to open stream` |
| el `require_once` de `PedidoService.php` | todas sus acciones | `Class "PedidoService" not found` |
| el método `prepare()` | empezar un pago en línea | `Call to undefined method PaymentController::prepare()` |
| el método `createTransaction()` | crear el pago | `Call to undefined method PaymentController::createTransaction()` |
| el método `showTransaction()` | saber si el pago fue aprobado | `Call to undefined method PaymentController::showTransaction()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
