# controllers/PaymentLinkController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga del **link de pago** de los pedidos manuales. El cliente abre el link en su celular y paga
**sin iniciar sesión**. En vez de usuario y contraseña, la "llave" es el código secreto del link
(32 letras y números al azar).

## ¿Qué hace?
- mostrar el pedido del link (productos, total, cuánto falta para que venza)
- empezar el pago del link (Nequi, Daviplata o Bancolombia, de prueba)
- saber si el pago fue aprobado; si sí, el pedido pasa a cocina

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `show()` | mostrar el pedido del link | `GET /api/pay-link/{codigo}` |
| `pay()` | empezar el pago del link | `POST /api/pay-link/{codigo}/transactions` |
| `status()` | saber si el pago fue aprobado | `GET /api/pay-link/{codigo}/transactions/{id}` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** `src/pages/PagarPedido.tsx` (la página `/pagar?c=...`).
- **Usa los modelos:** `PedidoService` (y este usa `PagoService` e `Ingrediente`).
- **Quién puede usarlo:** cualquiera (rutas públicas en `config/rutas.php`). Sin el código correcto no se ve nada.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador del Link de Pago: el cliente de un pedido manual paga desde su celular sin iniciar sesion. Todo se busca por el codigo secreto del link."* |
| 6 | `require_once __DIR__ . '/../models/PedidoService.php';` | Trae `models/PedidoService.php`, que tiene las reglas del link de pago. |
| 8 | `class PaymentLinkController` | Crea la clase `PaymentLinkController`: un grupo de funciones que trabajan juntas. |
| 9 | `{` | Abre la clase `PaymentLinkController`. |
| 10 | `private $pedidoService;` | Cajita `$pedidoService` de la clase: aquí se guarda el servicio `PedidoService`. |
| 11 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 13 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 14 | `{` | Abre la función `__construct()`. |
| 15 | `$this->pedidoService = new PedidoService();` | Crea el servicio `PedidoService` y lo guarda en `$this->pedidoService`. |
| 16 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 17 | `}` | Cierra la función `__construct()`. |
| 19 | `public function show()` | Función `show()`: muestra el pedido del link. Ruta: `GET /api/pay-link/{codigo}`. La llama `PagarPedido.tsx` al abrir la página. |
| 20 | `{` | Abre la función `show()`. |
| 21 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Resumen del pedido para la pagina de pago."* |
| 22 | `$pedido = $this->pedidoService->pedidoPorLink($_GET['codigo']);` | Busca el pedido con el código que viene en la dirección (`pedidoPorLink()` de `models/PedidoService.php`). `$_GET['codigo']` lo puso `cargarControlador()` de `helpers.php`. Lo guarda en `$pedido`. |
| 23 | `if (!$pedido) {` | Si no existe... |
| 24 | `responderError('Este link de pago no existe.', 404);` | ...responde 404 "Este link de pago no existe.". |
| 25 | `}` | Cierra el `if`. |
| 26 | `responderJson($pedido);` | Responde con el pedido. |
| 27 | `}` | Cierra la función `show()`. |
| 29 | `public function pay()` | Función `pay()`: empieza el pago. Ruta: `POST /api/pay-link/{codigo}/transactions`. La llama `PagarPedido.tsx` al tocar "Pagar". |
| 30 | `{` | Abre la función `pay()`. |
| 31 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Crea la transaccion de prueba (nace PENDING)."* |
| 32 | `$metodo   = (string) ($this->datos['method'] ?? '');` | Guarda en `$metodo` el banco que eligió el cliente (Nequi, Daviplata, Bancolombia). |
| 33 | `$telefono = (string) ($this->datos['phone'] ?? '');` | Guarda en `$telefono` el celular de su cuenta. |
| 35 | `try {` | Intenta... |
| 36 | `responderJson($this->pedidoService->iniciarPagoLink($_GET['codigo'], $metodo, $telefono), 201);` | ...crear el pago (`iniciarPagoLink()` de `models/PedidoService.php`) y responde 201 (creado) con el pago. El total lo pone el servidor, no la pantalla. |
| 37 | `} catch (InvalidArgumentException $e) {` | Si algo está mal (link vencido, ya pagado, celular inválido)... |
| 38 | `responderError($e->getMessage(), 422);` | ...responde 422 con el mensaje. |
| 39 | `}` | Cierra el `catch`. |
| 40 | `}` | Cierra la función `pay()`. |
| 42 | `public function status()` | Función `status()`: dice cómo va el pago. Ruta: `GET /api/pay-link/{codigo}/transactions/{id}`. La página la llama cada segundo y medio hasta que deje de estar pendiente. |
| 43 | `{` | Abre la función `status()`. |
| 44 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Consulta la transaccion; si quedo aprobada el pedido pasa a cocina."* |
| 45 | `try {` | Intenta... |
| 46 | `responderJson($this->pedidoService->consultarPagoLink($_GET['codigo'], $_GET['id']));` | ...consultar el pago (`consultarPagoLink()` de `models/PedidoService.php`). Si quedó aprobado, el pedido pasa a cocina. Responde con el pago. |
| 47 | `} catch (InvalidArgumentException $e) {` | Si el link o el pago no existen... |
| 48 | `responderError($e->getMessage(), 404);` | ...responde 404 con el mensaje. |
| 49 | `}` | Cierra el `catch`. |
| 50 | `}` | Cierra la función `status()`. |
| 51 | `}` | Cierra la clase `PaymentLinkController`. |
| 53 | `$controller = new PaymentLinkController();` | Crea el controlador. Al hacer `new PaymentLinkController()` se ejecuta su `__construct()`. |
| 55 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 57 | `if ($accion === 'show') {` | Si la acción es `'show'`... |
| 58 | `$controller->show();` | ...llama al método `show()` de arriba. |
| 59 | `} elseif ($accion === 'pay') {` | Si no, si la acción es `'pay'`... |
| 60 | `$controller->pay();` | ...llama al método `pay()` de arriba. |
| 61 | `} elseif ($accion === 'status') {` | Si no, si la acción es `'status'`... |
| 62 | `$controller->status();` | ...llama al método `status()` de arriba. |
| 63 | `} else {` | Si no es ninguna de las anteriores... |
| 64 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 65 | `}` | Cierra el `else`. |
| 66 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | la página del link de pago no carga el pedido ni deja pagar | `Failed to open stream` |
| el `require_once` de `PedidoService.php` | todas sus acciones | `Class "PedidoService" not found` |
| el método `show()` | ver el pedido en la página del link | `Call to undefined method PaymentLinkController::show()` |
| el método `pay()` | empezar el pago del link | `Call to undefined method PaymentLinkController::pay()` |
| el método `status()` | saber si se aprobó (el pedido nunca pasa a cocina) | `Call to undefined method PaymentLinkController::status()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
