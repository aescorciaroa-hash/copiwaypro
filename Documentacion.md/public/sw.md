# public/sw.js

## ¿Para qué sirve?
Es el **Service Worker**: un pequeño programa de JavaScript que el navegador deja corriendo **en segundo
plano**, aunque la página esté cerrada. Aquí sirve solo para **recibir las notificaciones push** y
mostrarlas en el celular o computador. No guarda nada en caché.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo registra | `src/lib/pushNotifications.ts` | Lo instala en el navegador cuando el cliente activa las notificaciones. |
| ← le envía mensajes | `PushNotificationService.php` (a través del servicio de push del navegador) | "¡Tu pedido ha llegado!" |
| → abre | la dirección que trae el mensaje (`/?calificarPedido=ID`) | Al tocar la notificación. |
| ← lo entrega | `.htaccess` (regla de archivos sueltos) | Se sirve como archivo normal. |

## Código explicado
`self` = el propio Service Worker. `addEventListener('evento', función)` = "cuando pase esto, haz esto".

| Evento | Qué hace |
|---|---|
| `install` | `self.skipWaiting()`: se activa de inmediato, sin esperar. |
| `activate` | `self.clients.claim()`: empieza a controlar las pestañas abiertas. |
| `push` | Llegó una notificación: la muestra. |
| `notificationclick` | El usuario tocó la notificación: abre la página. |

### Evento `push`
```js
data = event.data ? event.data.json() : {};
```
Lee el mensaje que envió PHP (título, texto, etiqueta y URL). Si no es JSON, usa el texto tal cual.

```js
event.waitUntil(self.registration.showNotification(title, options));
```
Muestra la notificación del sistema. `options` tiene el texto (`body`), el ícono y la URL en `data`.
`tag` evita notificaciones repetidas del mismo pedido.

### Evento `notificationclick`
1. Cierra la notificación.
2. Si ya hay una pestaña de la app abierta, la lleva a la URL y le da el foco.
3. Si no hay ninguna, abre una ventana nueva (`openWindow`).
