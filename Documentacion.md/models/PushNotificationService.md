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

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/PushNotificationService.php`).
Lo cargan con `require_once`: `controllers/PushController.php`, `models/PedidoService.php`. Dejan de funcionar:
  - `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.
  - `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).
  - `POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.
  - `PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.
  - `PATCH /api/orders/{id}/destination` → Domiciliario: no se guarda el destino que ubica en el mapa.
  - `PATCH /api/orders/{id}/preparing` → Cocina/Admin: el pedido no pasa a "En Preparación".
  - `PATCH /api/orders/{id}/ready` → Cocina/Admin: el pedido no pasa a "Listos".
  - `PATCH /api/orders/{id}/take` → Domiciliario: no puede tomar un pedido listo.
  - … y 9 más: `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}`, `GET /api/push/public-key`, `POST /api/push/subscribe`.

**Si se borra un método:** sale `Call to undefined method PushNotificationService::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `webPush()` (privado) | `PushNotificationService::enviarATodosLosDispositivos()` | `PATCH /api/orders/{id}/deliver` → Domiciliario: no puede confirmar la entrega con el PIN. |
| `notificarPedidoEntregado()` | `PedidoService::confirmarEntrega()` | `PATCH /api/orders/{id}/deliver` → Domiciliario: no puede confirmar la entrega con el PIN. |
| `enviarATodosLosDispositivos()` (privado) | `PushNotificationService::notificarPedidoEntregado()` | `PATCH /api/orders/{id}/deliver` → Domiciliario: no puede confirmar la entrega con el PIN. |
| `registrarEnvio()` (privado) | `PushNotificationService::enviarATodosLosDispositivos()` | `PATCH /api/orders/{id}/deliver` → Domiciliario: no puede confirmar la entrega con el PIN. |
| `__construct()` | `new PushNotificationService()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa PushNotificationService. |

**Si se borra una constante** (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`): sale `Undefined constant PushNotificationService::NOMBRE` en lo que la usa.
