# controllers/SyncController.php

## ¿Para qué sirve?
Mantiene **actualizadas las pantallas sin recargar**. React le pregunta cada pocos segundos
"¿cambió algo?". Si no cambió nada, PHP responde **304** (sin datos, muy rápido). Si cambió, responde
todos los datos nuevos.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| Ruta | `GET /api/sync` → método `index()` (cualquiera) | |
| ← lo llama | `fetchSync()` en `src/servicios/api.ts`, usado por `src/components/SyncDatos.tsx` | Pregunta cada pocos segundos. |
| → los datos van a | `src/store/almacenAplicacion.ts` | El "almacén" de React donde viven productos, pedidos, etc. |
| → usa | `Producto`, `Configuracion`, `Ingrediente`, `Personal`, `Pedido`, `Cliente` | Arma el paquete de datos. |

## Variables importantes
| Variable | De dónde viene | Para qué sirve |
|---|---|---|
| `$rol` | `Auth::rol()` o `'guest'` (invitado) si no hay sesión | Decide qué datos se envían. |
| `$idUsuario` | `Auth::id()` | Filtra los pedidos del cliente o domiciliario. |
| `$payload` | Se va armando | Todos los datos que se enviarán. |
| `$etag` | `md5(json_encode($payload))` | "Huella" de los datos: si los datos no cambian, la huella tampoco. |
| `$_SERVER['HTTP_IF_NONE_MATCH']` | Cabecera que envía React con la huella anterior | Si es igual a `$etag` → no cambió nada → 304. |

## Qué datos recibe cada rol
| Clave | Invitado | Cliente | Cocina | Domiciliario | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| `products`, `settings` | ✔ | ✔ | ✔ | ✔ | ✔ |
| `inventory`, `inventoryLogs`, `staff` | | | ✔ | | ✔ |
| `ingredients` | | ✔ | ✔ | | ✔ |
| `orders` | | sus pedidos | todos | suyos + disponibles | todos |
| `clients` | | solo él | | | todos |

## Código explicado
```php
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}
```
Como aquí solo se **lee** la sesión, se cierra de una vez. Así esta consulta (que se repite mucho)
no bloquea otras peticiones del mismo usuario mientras se arman los datos.

```php
$etag = '"' . md5(json_encode($payload)) . '"';
header("ETag: $etag");
if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? null) === $etag) {
    http_response_code(304);
    exit;
}
responderJson($payload, 200);
```
- `md5` convierte todo el contenido en un código corto. Si un solo dato cambia, el código cambia.
- La cabecera `ETag` le entrega ese código a React, y React lo devuelve en la siguiente consulta.
- Si coincide → **304** sin cuerpo (ahorra mucho tráfico).

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `GET /api/sync`. | `Failed to open stream: No such file or directory` (…`controllers/SyncController.php`) |
| La línea `require_once __DIR__ . '/../models/Producto.php';` | **Todas** sus rutas. | `Class "Producto" not found` |
| La línea `require_once __DIR__ . '/../models/Configuracion.php';` | **Todas** sus rutas. | `Class "Configuracion" not found` |
| La línea `require_once __DIR__ . '/../models/Personal.php';` | **Todas** sus rutas. | `Class "Personal" not found` |
| La línea `require_once __DIR__ . '/../models/Pedido.php';` | **Todas** sus rutas. | `Class "Pedido" not found` |
| La línea `require_once __DIR__ . '/../models/Cliente.php';` | **Todas** sus rutas. | `Class "Cliente" not found` |
| El método `index()` | **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. | `Call to undefined method SyncController::index()` (500) |
| La rama `$accion === 'index'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'GET /api/sync'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
