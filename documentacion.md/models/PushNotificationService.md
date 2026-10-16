# models/PushNotificationService.php

## ¿Para qué sirve?
Envía **notificaciones push** reales al celular o computador del cliente (por ejemplo, "¡Tu pedido ha
llegado!"), aunque tenga la página cerrada. Usa la librería **minishlink/web-push** y el estándar
**VAPID**.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `PedidoService::confirmarEntrega()` | Avisar cuando el pedido se entrega. |
| → usa | `PushSuscripcion` (modelo) | Saber a qué dispositivos enviar. |
| → usa | `vendor/minishlink/web-push` | El envío cifrado. |
| → usa | Sus constantes `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Claves de la app. `PushController` también lee la pública. |
| → escribe en | tabla `NOTIFICACION` | Registro de cada envío (enviado / fallido). |
| → la recibe | `public/sw.js` (en el navegador) | Muestra la notificación. |

## Variables de la clase
| Variable | Para qué |
|---|---|
| `$this->conn` | La conexión. |
| `$this->suscripcionModel` | `new PushSuscripcion()`. |

## Métodos
| Método | Qué hace |
|---|---|
| `webPush()` (privado) | Crea el objeto `WebPush` con las claves VAPID. Si las claves están vacías, devuelve `null` (no se envía nada). |
| `notificarPedidoEntregado($idPedido, $idCliente)` | Arma el mensaje (título, texto, y un enlace `/?calificarPedido=ID` para calificar) y lo envía. |
| `enviarATodosLosDispositivos(...)` (privado) | Envía el mensaje a cada dispositivo del cliente. |
| `registrarEnvio($idPedido, $exito)` (privado) | Guarda en `NOTIFICACION` si se envió o falló. |

## `enviarATodosLosDispositivos()` explicado
```php
$webPush->queueNotification(Subscription::create([...]), json_encode($payload));
```
Pone en cola un mensaje por cada dispositivo.

```php
foreach ($webPush->flush() as $reporte) {
    if ($reporte->isSuccess()) { $huboEnvio = true; }
    elseif ($reporte->isSubscriptionExpired()) { ...eliminarPorEndpoint(...); }
}
```
- `flush()` envía todos los de la cola y devuelve un reporte por cada uno.
- Si el navegador ya no acepta la suscripción (el usuario quitó el permiso), se borra.
