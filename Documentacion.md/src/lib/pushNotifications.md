# src/lib/pushNotifications.ts

## ¿Para qué sirve?
Activa las **notificaciones push** en el navegador del cliente: pide permiso, instala el Service Worker
(`public/sw.js`) y le envía a PHP la suscripción para que después pueda enviarle avisos.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `pages/ClientDashboard.tsx` | Botón para activar notificaciones y sincronizar al abrir el panel. |
| → instala | `public/sw.js` | El programa que muestra las notificaciones. |
| → llama a | `GET /api/push/public-key` y `POST /api/push/subscribe` | `PushController.php` → tabla `PUSH_SUSCRIPCION`. |
| → usa | `rutaBase()` de `servicios/api.ts` | Ruta del Service Worker. |

## Funciones
| Función | Qué hace |
|---|---|
| `pushDisponible()` | `true` si el navegador soporta Service Workers y notificaciones push. |
| `base64UrlToUint8Array(texto)` (privada) | Convierte la clave pública (texto en Base64) al formato binario que exige el navegador. |
| `registrarServiceWorker()` (privada) | Instala `sw.js` con `navigator.serviceWorker.register(...)`. |
| `sincronizarSuscripcionPush()` | Si **ya** hay permiso: obtiene o crea la suscripción y la envía a PHP. Nunca pide permiso por sí sola. |
| `activarNotificacionesPush()` | Pide el permiso al usuario (`Notification.requestPermission()`) y, si acepta, suscribe. Debe llamarse desde un clic. |

## `sincronizarSuscripcionPush()` paso a paso
1. Si no hay soporte o no hay permiso (`Notification.permission !== 'granted'`) → `false`.
2. Instala el Service Worker.
3. `registration.pushManager.getSubscription()`: ¿ya existe una suscripción?
4. Si no: pide la clave pública a PHP y crea una con `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
5. Envía a PHP el `endpoint` y las claves `p256dh` y `auth` → se guardan en `PUSH_SUSCRIPCION`.
