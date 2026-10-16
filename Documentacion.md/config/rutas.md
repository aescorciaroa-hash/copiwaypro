# config/rutas.php

## ¿Para qué sirve?
Es la **lista de todas las direcciones de la API** y a qué controlador va cada una.
La usa la función `despacharRuta()` de `config/helpers.php`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo lee | `despacharRuta()` en `config/helpers.php` | Busca qué ruta coincide con la petición. |
| → apunta a | los archivos de `controllers/` | Cada ruta dice qué controlador cargar y qué método llamar. |
| ← la llama | `src/servicios/api.ts` (React) | Las funciones de React hacen `fetch` a estas mismas direcciones. |

## Cómo se lee una ruta
```php
'PUT /api/products/{id}' => ['ProductController', 'update', ['admin']],
```
| Parte | Significado |
|---|---|
| `PUT` | Método HTTP (GET = leer, POST = crear, PUT = editar, PATCH = editar una parte, DELETE = borrar). |
| `/api/products/{id}` | La dirección. `{id}` es un valor que cambia (ej: `/api/products/6`). |
| `'ProductController'` | Archivo que se carga: `controllers/ProductController.php`. |
| `'update'` | La acción: queda en `$_GET['accion']` y el controlador llama a su método `update()`. |
| `['admin']` | Roles que pueden usarla. `[]` = cualquiera, aunque no haya iniciado sesión. |

Dentro del controlador, `{id}` llega como `$_GET['id']`.

## La variable `$TODOS_LOS_ROLES`
```php
$TODOS_LOS_ROLES = ['admin', 'kitchen', 'delivery', 'client'];
```
Es solo un atajo para no repetir la lista de los 4 roles en varias rutas.

## Los 4 roles
| Rol | Quién es |
|---|---|
| `admin` | Administrador |
| `kitchen` | Ayudante de cocina |
| `delivery` | Domiciliario |
| `client` | Cliente |

Solo existen las rutas que la pantalla de React usa de verdad. Los datos para mostrar (productos,
inventario, pedidos, clientes, personal, ajustes) llegan todos juntos por `GET /api/sync`.

## Grupos de rutas
| Grupo | Controlador |
|---|---|
| `/api/auth/...` | AuthController (login, registro, recuperar contraseña) |
| `/api/settings` | SettingController |
| `/api/products` | ProductController |
| `/api/uploads/product-image` | UploadController |
| `/api/inventory` | InventoryController |
| `/api/clients` | ClientController |
| `/api/staff` | StaffController |
| `/api/orders` | OrderController |
| `/api/payments` | PaymentController |
| `/api/cash-closing` | CashClosingController |
| `/api/sync` | SyncController |
| `/api/push` | PushController |

**El orden importa:** las rutas fijas van antes que las que tienen `{id}`, para que una palabra
como `manual` no se tome como si fuera un `{id}`. Por eso `POST /api/orders/manual` (pedido por llamada o WhatsApp que registra el admin) está escrita junto a
`POST /api/orders` y antes de las rutas de pedidos con `{id}`.

## Rutas de pedidos y personal que más se confunden
| Ruta | Quién | Para qué |
|---|---|---|
| `POST /api/orders` | cliente | Pedido web del cliente (puede incluir `usePoints`). |
| `POST /api/orders/manual` | admin | Pedido por llamada o WhatsApp, a nombre de un cliente registrado o de un invitado. |
| `PATCH /api/orders/{id}/address` | admin | Corregir la dirección de un pedido en curso. |
| `PATCH /api/orders/{id}/destination` | domiciliario | Guardar las coordenadas del destino que ubicó en su mapa. |
| `PUT /api/staff/{id}` | admin | Editar a un colaborador, o darlo de baja (`active: false`). |
| `DELETE /api/staff/{id}?role=...` | admin | Eliminarlo de verdad, solo si no tiene historial de pedidos. |
| `PATCH /api/staff/{id}/location` | domiciliario | Guardar su propia ubicación GPS. |

## ¿Qué pasa si se borra?

| Si se borra… | Qué pasa | Error que aparece |
|---|---|---|
| **El archivo completo** | Ninguna ruta `/api/...` funciona: todas las pantallas se quedan sin datos y nada se guarda. Las páginas sí abren. | `Failed to open stream` (…`config/rutas.php`) |
| Una línea (una ruta) | Solo esa acción deja de funcionar. Qué pantalla se afecta está en la ficha del controlador que aparece en la línea (sección "¿Qué pasa si se borra?"). | `Ruta no encontrada.` (404), o `Metodo no permitido.` (405) si la misma dirección existe con otro método |
| Un rol de la lista (ej. `['admin']` → `[]`) | La ruta queda **pública**: cualquiera la puede usar sin iniciar sesión. No se ve un error, por eso es peligroso. | Ninguno |
| `$TODOS_LOS_ROLES` | Las rutas que la usan (`GET /api/orders`, `PUT /api/clients/{id}`) quedan **públicas**: responden aunque nadie haya iniciado sesión. | `Undefined variable $TODOS_LOS_ROLES` (aviso al inicio de la respuesta) |
