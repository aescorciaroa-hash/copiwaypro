# app/Controllers/PushController.php

## ¿Para qué sirve?
Permite que el **cliente se suscriba a notificaciones push**: los avisos que salen en el celular o el
computador aunque la página esté cerrada (por ejemplo, "¡Tu pedido ha llegado!").

Este controlador solo **guarda o borra** la suscripción. Quien envía el aviso es
`PushNotificationService` cuando un pedido se entrega.

## ¿Con qué se conecta?
| Ruta | `$action` | Quién | React |
|---|---|---|---|
| `GET /api/push/public-key` | `publicKey` | cualquiera | `src/lib/pushNotifications.ts` |
| `POST /api/push/subscribe` | `subscribe` | cliente | `src/lib/pushNotifications.ts` |
| `POST /api/push/unsubscribe` | `unsubscribe` | cliente | — |

| Usa | Para qué |
|---|---|
| `PushSuscripcion` (modelo) | Guardar y borrar suscripciones (tabla PUSH_SUSCRIPCION). |
| `env('VAPID_PUBLIC_KEY')` | Clave pública del `.env`. |
| `public/sw.js` | (Navegador) El "service worker" que muestra la notificación cuando llega. |

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$endpoint` | Dirección única del navegador del cliente donde se envían los avisos. |
| `$p256dh`, `$authKey` | Claves del navegador para cifrar el aviso. |

## Acciones
- **`publicKey`**: devuelve la clave pública VAPID. El navegador la necesita para crear la suscripción.
- **`subscribe`**: si falta alguno de los 3 datos → **422**. Si no, guarda la suscripción para el cliente conectado (`Auth::id()`).
- **`unsubscribe`**: borra la suscripción de ese `endpoint`.
