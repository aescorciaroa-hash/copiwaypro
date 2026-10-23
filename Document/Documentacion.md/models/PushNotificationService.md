# models/PushNotificationService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Envía la notificación "tu pedido llegó" al celular del cliente.

## ¿Qué hace?
- avisa que el pedido llegó

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `webPush()` (privado) | prepara la librería de notificaciones | `PushNotificationService::enviarATodosLosDispositivos()` |
| `notificarPedidoEntregado()` | avisa que el pedido llegó | `PedidoService::confirmarEntrega()` |
| `enviarATodosLosDispositivos()` (privado) | envía el aviso a todos los celulares del cliente | `PushNotificationService::notificarPedidoEntregado()` |
| `registrarEnvio()` (privado) | guarda que se envió el aviso | `PushNotificationService::enviarATodosLosDispositivos()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/PushController.php`, `models/PedidoService.php`.
- **Usa:** `PushSuscripcion`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-6 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envia notificaciones Web Push (VAPID) a los dispositivos del cliente, para que salgan como notificacion del sistema aunque el navegador este cerrado. Usa la libreria minishlink/web-push (Composer)."* |
| 7 | `require_once __DIR__ . '/PushSuscripcion.php';` | Trae `models/PushSuscripcion.php` (los celulares suscritos). |
| 9 | `use Minishlink\WebPush\WebPush;` | `use` = la clase `WebPush` de la librería de notificaciones (en `vendor/`). |
| 10 | `use Minishlink\WebPush\Subscription;` | `use` = la clase `Subscription` de la misma librería. |
| 12 | `class PushNotificationService` | Crea la clase `PushNotificationService`: envía la notificación "tu pedido llegó" al celular del cliente. La usan `PedidoService` (al entregar) y `PushController` (la clave pública). |
| 13 | `{` | Abre la clase `PushNotificationService`. |
| 14 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Llaves VAPID. Cada instalacion (cada dominio) deberia tener su propio par."* |
| 15 | `const VAPID_PUBLIC_KEY = 'BPzLGFNPSprvi7FA4U_LsU0cIXXAOuNy1QC-6ay1KoW-Ua_Ad9oDDpsYNkKzVsm-ix-ALDVdgwPm8_QF5N1NsaE';` | Constante `VAPID_PUBLIC_KEY`: la clave pública (la necesita el navegador para suscribirse). |
| 16 | `const VAPID_PRIVATE_KEY = '36xY3qG43_1TDAFsBYBplslNz7zffuKmf7ZLPuLs2fI';` | Constante `VAPID_PRIVATE_KEY`: la clave privada (firma las notificaciones). No se comparte. |
| 17 | `const VAPID_SUBJECT = 'mailto:soporte@copiway.com';` | Constante `VAPID_SUBJECT`: un contacto del dueño del sistema. |
| 19 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 20 | `private $suscripcionModel;` | Cajita `$suscripcionModel` de la clase: aquí se guarda el modelo `PushSuscripcion`. |
| 22 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 23 | `{` | Abre la función `__construct()`. |
| 24 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 25 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 26 | `$this->suscripcionModel = new PushSuscripcion();` | Crea el modelo `PushSuscripcion` y lo guarda en `$this->suscripcionModel`, para usarlo en las funciones de abajo. |
| 27 | `}` | Cierra la función `__construct()`. |
| 29 | `private function webPush()` | Método `webPush()` (privado): prepara la librería de notificaciones. |
| 30 | `{` | Abre la función `webPush()`. |
| 31 | `$publicKey = self::VAPID_PUBLIC_KEY;` | Guarda la clave pública. |
| 32 | `$privateKey = self::VAPID_PRIVATE_KEY;` | Guarda la clave privada. |
| 33 | `if ($publicKey === '' \|\| $privateKey === '') {` | Si alguna está vacía... |
| 34 | `return null;` | ...devuelve `null` (no se envían notificaciones). |
| 35 | `}` | Cierra el `if`. |
| 37 | `return new WebPush([` | Crea el objeto `WebPush` con las claves y lo devuelve: |
| 38 | `'VAPID' => [` | `'VAPID'` = los datos de identificación: |
| 39 | `'subject'    => self::VAPID_SUBJECT,` | el contacto, |
| 40 | `'publicKey'  => $publicKey,` | la clave pública, |
| 41 | `'privateKey' => $privateKey,` | la clave privada. |
| 42 | `],` | Cierra los datos. |
| 43 | `]);` | Cierra la configuración. |
| 44 | `}` | Cierra la función `webPush()`. |
| 46 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Avisa al cliente que su pedido llego, con enlace para calificarlo."* |
| 47 | `public function notificarPedidoEntregado($idPedido, $idCliente)` | Método `notificarPedidoEntregado($idPedido, $idCliente)`: avisa al cliente que su pedido llegó. Lo usa `PedidoService::confirmarEntrega()`. |
| 48 | `{` | Abre la función `notificarPedidoEntregado()`. |
| 49 | `$this->enviarATodosLosDispositivos($idCliente, $idPedido, [` | Lo envía a todos sus celulares (`enviarATodosLosDispositivos()` de abajo) con este contenido: |
| 50 | `'title' => '¡Tu pedido ha llegado!',` | el título "¡Tu pedido ha llegado!", |
| 51 | `'body'  => 'Cuéntanos, ¿cómo estuvo tu comida?',` | el texto "Cuéntanos, ¿cómo estuvo tu comida?", |
| 52 | `'tag'   => 'pedido-entregado-' . $idPedido,` | una etiqueta para no repetir la notificación, |
| 53 | `'url'   => rutaBase() . '/?calificarPedido=' . $idPedido,` | y la dirección que se abre al tocarla (para calificar el pedido). |
| 54 | `]);` | Cierra el contenido. |
| 55 | `}` | Cierra la función `notificarPedidoEntregado()`. |
| 57 | `private function enviarATodosLosDispositivos($idCliente, $idPedido, $payload)` | Método `enviarATodosLosDispositivos(...)` (privado): envía la notificación a todos los celulares del cliente. |
| 58 | `{` | Abre la función `enviarATodosLosDispositivos()`. |
| 59 | `$webPush = $this->webPush();` | Prepara la librería (`webPush()` de arriba). |
| 60 | `if ($webPush === null) {` | Si no hay claves... |
| 61 | `return; // VAPID sin configurar.` | ...sale sin enviar nada. |
| 62 | `}` | Cierra el `if`. |
| 64 | `$suscripciones = $this->suscripcionModel->listarPorCliente($idCliente);` | Trae los celulares suscritos del cliente (`listarPorCliente()` de `models/PushSuscripcion.php`). |
| 65 | `if (empty($suscripciones)) {` | Si no tiene ninguno... |
| 66 | `return;` | ...sale. |
| 67 | `}` | Cierra el `if`. |
| 69 | `foreach ($suscripciones as $s) {` | Recorre cada celular (`$s`). |
| 70 | `$webPush->queueNotification(` | Pone en la cola una notificación (`queueNotification`) para ese celular: |
| 71 | `Subscription::create([` | los datos del celular (`Subscription::create`): |
| 72 | `'endpoint'  => $s['endpoint'],` | la dirección del navegador, |
| 73 | `'publicKey' => $s['clave_p256dh'],` | su clave, |
| 74 | `'authToken' => $s['clave_auth'],` | y su otra clave. |
| 75 | `]),` | Cierra los datos. |
| 76 | `json_encode($payload)` | El contenido, convertido a JSON. |
| 77 | `);` | Cierra la instrucción. |
| 78 | `}` | Cierra el `foreach`. |
| 80 | `$huboEnvio = false;` | `$huboEnvio` empieza en `false`. |
| 81 | `foreach ($webPush->flush() as $reporte) {` | Envía todas las notificaciones de la cola (`flush`) y recorre el resultado de cada una (`$reporte`). |
| 82 | `if ($reporte->isSuccess()) {` | Si se envió bien... |
| 83 | `$huboEnvio = true;` | ...`$huboEnvio` pasa a `true`. |
| 84 | `} elseif ($reporte->isSubscriptionExpired()) {` | Si el navegador ya no acepta notificaciones (suscripción vencida)... |
| 85 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El navegador invalido la suscripcion: se borra."* |
| 86 | `$this->suscripcionModel->eliminarPorEndpoint($reporte->getEndpoint());` | ...borra ese celular (`eliminarPorEndpoint()` de `models/PushSuscripcion.php`). |
| 87 | `}` | Cierra el `elseif`. |
| 88 | `}` | Cierra el `foreach`. |
| 90 | `$this->registrarEnvio($idPedido, $huboEnvio);` | Anota si se envió o no (`registrarEnvio()` de abajo). |
| 91 | `}` | Cierra la función `enviarATodosLosDispositivos()`. |
| 93 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Deja registro del envio en NOTIFICACION."* |
| 94 | `private function registrarEnvio($idPedido, $exito)` | Método `registrarEnvio($idPedido, $exito)` (privado): anota el envío en la tabla `NOTIFICACION`. |
| 95 | `{` | Abre la función `registrarEnvio()`. |
| 96 | `$estado = $exito ? 'enviado' : 'fallido';` | `'enviado'` si salió bien; si no, `'fallido'`. |
| 97 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda en `NOTIFICACION` que se envió un push para ese pedido, con su estado". |
| 98 | `"INSERT INTO NOTIFICACION (id_pedido, tipo, mensaje, estado_envio) VALUES (?, 'push', 'Tu pedido ha llegado', ?)"` | ↑ (sigue la misma instrucción) |
| 99 | `);` | ↑ (sigue la misma instrucción) |
| 100 | `$stmt->bind_param("is", $idPedido, $estado);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero), `$estado` (texto). |
| 101 | `$stmt->execute();` | Ejecuta la consulta. |
| 102 | `$stmt->close();` | Cierra la consulta. |
| 103 | `}` | Cierra la función `registrarEnvio()`. |
| 104 | `}` | Cierra la clase `PushNotificationService`. |
| 105 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, activar las notificaciones | `Failed to open stream` |
| el método `webPush()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::webPush()` |
| el método `notificarPedidoEntregado()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::notificarPedidoEntregado()` |
| el método `enviarATodosLosDispositivos()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::enviarATodosLosDispositivos()` |
| el método `registrarEnvio()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::registrarEnvio()` |
| la constante `VAPID_PUBLIC_KEY` | lo que la usa dentro de la clase | `Undefined constant PushNotificationService::VAPID_PUBLIC_KEY` |
| la constante `VAPID_PRIVATE_KEY` | lo que la usa dentro de la clase | `Undefined constant PushNotificationService::VAPID_PRIVATE_KEY` |
| la constante `VAPID_SUBJECT` | lo que la usa dentro de la clase | `Undefined constant PushNotificationService::VAPID_SUBJECT` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
