# controllers/PushController.php

## ¿Para qué sirve?
Permite que el **cliente se suscriba a notificaciones push**: los avisos que salen en el celular o el
computador aunque la página esté cerrada (por ejemplo, "¡Tu pedido ha llegado!").

Este controlador solo **guarda o borra** la suscripción. Quien envía el aviso es
`PushNotificationService` cuando un pedido se entrega.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
| `GET /api/push/public-key` | `publicKey` | cualquiera | `src/lib/pushNotifications.ts` |
| `POST /api/push/subscribe` | `subscribe` | cliente | `src/lib/pushNotifications.ts` |

| Usa | Para qué |
|---|---|
| `PushSuscripcion` (modelo) | Guardar y borrar suscripciones (tabla PUSH_SUSCRIPCION). |
| `PushNotificationService::VAPID_PUBLIC_KEY` | Clave pública (constante de `PushNotificationService`). |
| `public/sw.js` | (Navegador) El "service worker" que muestra la notificación cuando llega. |

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$endpoint` | Dirección única del navegador del cliente donde se envían los avisos. |
| `$p256dh`, `$authKey` | Claves del navegador para cifrar el aviso. |

## Acciones
- **`publicKey`**: devuelve la clave pública VAPID. El navegador la necesita para crear la suscripción.
- **`subscribe`**: si falta alguno de los 3 datos → **422**. Si no, guarda la suscripción para el cliente conectado (`Auth::id()`).

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `GET /api/push/public-key`, `POST /api/push/subscribe`. | `Failed to open stream: No such file or directory` (…`controllers/PushController.php`) |
| La línea `require_once __DIR__ . '/../models/PushNotificationService.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "PushSuscripcion" not found` |
| El método `publicKey()` | Cliente: no se activan las notificaciones push. | `Call to undefined method PushController::publicKey()` (500) |
| La rama `$accion === 'publicKey'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'GET /api/push/public-key'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `subscribe()` | Cliente: no se activan las notificaciones push. | `Call to undefined method PushController::subscribe()` (500) |
| La rama `$accion === 'subscribe'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/push/subscribe'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| La línea `$this->suscripcionModel = ...` del constructor | Las acciones que usan `$this->suscripcionModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
