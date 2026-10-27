# public/sw.js

## ¿Para qué sirve?
Es el **Service Worker**: un pequeño programa de JavaScript que el navegador deja corriendo **en segundo
plano**, aunque la página esté cerrada. Hace dos cosas:

1. **Carga rápida y modo sin internet:** guarda en el navegador (en el **Cache Storage**, una especie de
   bodega del navegador) los archivos del sistema. Así cada vista abre más rápido y, si se cae el internet,
   se sigue viendo con lo último que se cargó.
2. **Notificaciones push:** recibe los avisos ("¡Tu pedido ha llegado!") y los muestra en el celular o el
   computador.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo registra | `src/lib/modoSinInternet.ts` | Lo instala en **todas** las páginas, apenas terminan de cargar. |
| ← también lo registra | `src/lib/pushNotifications.ts` | Cuando el cliente activa las notificaciones (es el mismo archivo, no se instala dos veces). |
| ← le envía mensajes | `PushNotificationService.php` (a través del servicio de push del navegador) | "¡Tu pedido ha llegado!" |
| ← lo entrega | `public/.htaccess` | Con `Cache-Control: no-cache`, para que los cambios de este archivo lleguen enseguida. |

## ¿Qué guarda y cómo?
Hay dos formas de usar lo guardado:

| Forma | Qué hace | Se usa para |
|---|---|---|
| **Primero lo guardado** (`primeroGuardado`) | Si ya está guardado, lo entrega **al instante** sin ir al servidor. Si no, lo descarga y lo guarda. | Archivos que **no cambian**: los pedazos de código (`assets/chunks/`), la letra, las fotos de Unsplash y los cuadritos del mapa. |
| **Primero el servidor** (`primeroServidor`) | Pide al servidor (así siempre se ve lo más nuevo). Si **no hay conexión**, entrega lo último guardado. | Cosas que **sí cambian**: las páginas (HTML) y los datos de la API (`/api/...`). |

- `main.js` usa **primero el servidor** (va sin `?v=`, así que hay que preguntar si cambió); sin internet, el guardado.
- `main.css` tiene su propia forma (`codigoVersionado`): como lleva `?v=fecha`, cuando llega una versión nueva
  se guarda y **se borra la vieja**.

`guardar(cache, request, respuesta)` guarda la copia **sin hacer esperar a la página**. Si el guardado falla
(por ejemplo, la página pidió el mismo ícono dos veces a la vez), no pasa nada: el archivo igual se entrega.

Los guardados están separados en "cajones" (caches):

| Cajón | Qué tiene | Máximo |
|---|---|---|
| `copiway-codigo-v2` | `main.js`, `main.css` y `assets/chunks/*` | sin límite (solo hay una versión de cada uno) |
| `copiway-paginas-v2` | El HTML de cada vista | 30 |
| `copiway-api-v2` | Respuestas de la API (solo las de lectura, `GET`) | 150 |
| `copiway-media-v2` | Fotos, letra, íconos | 200 |
| `copiway-mapas-v2` | Cuadritos del mapa (OpenStreetMap) | 600 |

`recortar(nombreCache, max)` borra los más viejos cuando un cajón pasa de su máximo.

## Seguridad: al iniciar o cerrar sesión se borra todo lo personal
```js
if (request.method === 'POST' && url.href.startsWith(BASE + 'api/auth/')) {
  event.waitUntil(Promise.all([caches.delete(CACHE_PAGINAS), caches.delete(CACHE_API)]));
  return;
}
```
Cada vez que alguien **inicia o cierra sesión** (`POST /api/auth/...`), se borran las páginas y los datos
guardados. Así, si otra persona usa el mismo equipo (por ejemplo, la tablet de la cocina), **no ve la
información de la anterior**. El código, las fotos y los mapas sí se quedan, porque no son personales.

Además:
- Solo se guardan peticiones de **lectura** (`GET`). Guardar un pedido, entregar, pagar... siempre van directo
  al servidor (sin internet, esas acciones no se pueden hacer).
- No se guardan **redirecciones** (por ejemplo, cuando la sesión venció y PHP manda a `/login`) ni errores.

## Sin internet y la vista nunca se abrió antes
`paginaSinConexion()` muestra una página sencilla: "Sin conexión a internet" con el botón **Reintentar**.

## Eventos
`self` = el propio Service Worker. `addEventListener('evento', función)` = "cuando pase esto, haz esto".

| Evento | Qué hace |
|---|---|
| `install` | `self.skipWaiting()`: se activa de inmediato, sin esperar. |
| `activate` | Borra los cajones de versiones viejas (si cambia `VERSION`) y empieza a controlar las pestañas abiertas (`clients.claim()`). |
| `fetch` | **Cada vez que la página pide algo** (un archivo, una foto, datos): decide si lo entrega guardado o lo pide al servidor (ver la tabla de arriba). |
| `push` | Llegó una notificación: la muestra. |
| `notificationclick` | El usuario tocó la notificación: abre la página. |

`const VERSION = 'v2';` — si algún día hace falta **borrar todo lo guardado** en los navegadores de todos,
basta con subirlo (`'v3'`). Se subió a `v2` cuando se corrigió el error de `main.js?v=` (página en negro).

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

## ¿Cómo lo pruebo?
1. Abre una vista con internet (por ejemplo `/kitchen`) y espera a que cargue.
2. En el navegador: **F12 → Application → Service Workers** debe salir `sw.js` "activated". En **Cache Storage**
   se ven los cajones `copiway-...`.
3. En **F12 → Network**, marca **Offline** y recarga: la vista abre igual con lo último guardado.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | la app funciona con internet, pero **sin internet no abre** y no llegan notificaciones push (`register(...)` da 404) |
| el evento `fetch` | no se guarda nada: todo se descarga cada vez y sin internet no abre |
| el borrado al iniciar/cerrar sesión | quien use el equipo después, **sin internet**, podría ver datos de la persona anterior |
| el evento `push` | el navegador recibe el mensaje pero no muestra nada |
| el evento `notificationclick` | la notificación sale, pero al tocarla no abre la página |
