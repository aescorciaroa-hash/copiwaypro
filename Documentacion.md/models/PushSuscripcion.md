# models/PushSuscripcion.php

## ¿Para qué sirve?
Guarda los **dispositivos** de cada cliente donde se pueden enviar notificaciones push
(tabla `PUSH_SUSCRIPCION`). Un cliente puede tener varios (celular, computador...).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `PushController.php` | Guardar y borrar suscripciones. |
| ← lo usa | `PushNotificationService.php` | Saber a qué dispositivos enviar y borrar las vencidas. |
| → tabla | `PUSH_SUSCRIPCION` | |

## Columnas
| Columna | Qué guarda |
|---|---|
| `endpoint` | Dirección única del navegador (la entrega el navegador al suscribirse). |
| `clave_p256dh`, `clave_auth` | Claves para cifrar el mensaje para ese navegador. |

## Métodos
| Método | Qué hace |
|---|---|
| `guardar($idCliente, $endpoint, $claveP256dh, $claveAuth)` | Inserta. Si el `endpoint` ya existe, actualiza los datos (`ON DUPLICATE KEY UPDATE`). |
| `eliminarPorEndpoint($endpoint)` | Borra esa suscripción. |
| `listarPorCliente($idCliente)` | Todos los dispositivos del cliente. |

`ON DUPLICATE KEY UPDATE` = "si ya existe una fila con esa llave única, en vez de dar error, actualízala".

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/PushSuscripcion.php`).
Lo cargan con `require_once`: `models/PushNotificationService.php`. Dejan de funcionar:
  - `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.
  - `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).
  - `POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.
  - `PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.
  - `PATCH /api/orders/{id}/destination` → Domiciliario: no se guarda el destino que ubica en el mapa.
  - `PATCH /api/orders/{id}/preparing` → Cocina/Admin: el pedido no pasa a "En Preparación".
  - `PATCH /api/orders/{id}/ready` → Cocina/Admin: el pedido no pasa a "Listos".
  - `PATCH /api/orders/{id}/take` → Domiciliario: no puede tomar un pedido listo.
  - … y 9 más: `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}`, `GET /api/push/public-key`, `POST /api/push/subscribe`.

**Si se borra un método:** sale `Call to undefined method PushSuscripcion::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `guardar()` | `PushController::subscribe()` | `POST /api/push/subscribe` → Cliente: no se activan las notificaciones push. |
| `eliminarPorEndpoint()` | `PushNotificationService::enviarATodosLosDispositivos()` | `PATCH /api/orders/{id}/deliver` → Domiciliario: no puede confirmar la entrega con el PIN. |
| `listarPorCliente()` | `PushNotificationService::enviarATodosLosDispositivos()` | `PATCH /api/orders/{id}/deliver` → Domiciliario: no puede confirmar la entrega con el PIN. |
| `__construct()` | `new PushSuscripcion()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa PushSuscripcion. |
