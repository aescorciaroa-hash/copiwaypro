# controllers/PushController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga de activar las notificaciones en el celular del cliente.

## ¿Qué hace?
- activar las notificaciones

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `publicKey()` | activar las notificaciones | `GET /api/push/public-key` |
| `subscribe()` | activar las notificaciones | `POST /api/push/subscribe` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** lib/pushNotifications.ts.
- **Usa los modelos:** `PushNotificationService`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Notificaciones Push (suscribir / desuscribir al cliente). El envio lo hace PushNotificationService cuando el pedido se entrega."* |
| 6 | `require_once __DIR__ . '/../models/PushNotificationService.php';` | Trae `models/PushNotificationService.php`. Ese archivo también trae `PushSuscripcion.php`; por eso aquí se puede usar `new PushSuscripcion()`. |
| 8 | `class PushController` | Crea la clase `PushController`: un grupo de funciones que trabajan juntas. |
| 9 | `{` | Abre la clase `PushController`. |
| 10 | `private $suscripcionModel;` | Cajita `$suscripcionModel` de la clase: aquí se guarda el modelo `PushSuscripcion`. |
| 11 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 13 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 14 | `{` | Abre la función `__construct()`. |
| 15 | `$this->suscripcionModel = new PushSuscripcion();` | Crea el modelo `PushSuscripcion` y lo guarda en `$this->suscripcionModel`, para usarlo en las funciones de abajo. |
| 16 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 17 | `}` | Cierra la función `__construct()`. |
| 19 | `public function publicKey()` | Función `publicKey()`: entrega la clave pública de las notificaciones. Ruta: `GET /api/push/public-key`. La llama `lib/pushNotifications.ts`. |
| 20 | `{` | Abre la función `publicKey()`. |
| 21 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Clave publica VAPID: el navegador la necesita para suscribirse."* |
| 22 | `responderJson(['publicKey' => PushNotificationService::VAPID_PUBLIC_KEY]);` | Responde la clave pública (la constante `VAPID_PUBLIC_KEY` de `models/PushNotificationService.php`). El navegador la necesita para activar las notificaciones. |
| 23 | `}` | Cierra la función `publicKey()`. |
| 25 | `public function subscribe()` | Función `subscribe()`: guarda el celular del cliente para enviarle notificaciones. Ruta: `POST /api/push/subscribe`. |
| 26 | `{` | Abre la función `subscribe()`. |
| 27 | `$endpoint = (string) ($this->datos['endpoint'] ?? '');` | Guarda en `$endpoint` la dirección a donde se envían las notificaciones de ese navegador. |
| 28 | `$p256dh   = (string) ($this->datos['keys']['p256dh'] ?? '');` | Guarda en `$p256dh` una de las claves del navegador (`['keys']['p256dh']` = el dato `p256dh` dentro de `keys`). |
| 29 | `$authKey  = (string) ($this->datos['keys']['auth'] ?? '');` | Guarda en `$authKey` la otra clave del navegador. |
| 31 | `if ($endpoint === '' \|\| $p256dh === '' \|\| $authKey === '') {` | Si falta alguno de los tres... |
| 32 | `responderError('Suscripción inválida.', 422);` | ...responde 422 "Suscripción inválida.". |
| 33 | `}` | Cierra el `if`. |
| 35 | `$this->suscripcionModel->guardar(Auth::id(), $endpoint, $p256dh, $authKey);` | Guarda la suscripción del cliente (`guardar()` de `models/PushSuscripcion.php`). |
| 36 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 37 | `}` | Cierra la función `subscribe()`. |
| 38 | `}` | Cierra la clase `PushController`. |
| 40 | `$controller = new PushController();` | Crea el controlador. Al hacer `new PushController()` se ejecuta su `__construct()`. |
| 42 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 44 | `if ($accion === 'publicKey') {` | Si la acción es `'publicKey'`... |
| 45 | `$controller->publicKey();` | ...llama al método `publicKey()` de arriba. |
| 46 | `} elseif ($accion === 'subscribe') {` | Si no, si la acción es `'subscribe'`... |
| 47 | `$controller->subscribe();` | ...llama al método `subscribe()` de arriba. |
| 48 | `} else {` | Si no es ninguna de las anteriores... |
| 49 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 50 | `}` | Cierra el `else`. |
| 51 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | activar las notificaciones | `Failed to open stream` |
| el `require_once` de `PushNotificationService.php` | todas sus acciones | `Class "PushSuscripcion" not found` |
| el método `publicKey()` | activar las notificaciones | `Call to undefined method PushController::publicKey()` |
| el método `subscribe()` | activar las notificaciones | `Call to undefined method PushController::subscribe()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
