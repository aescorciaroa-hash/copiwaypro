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

## Grupos de rutas
| Grupo | Controlador |
|---|---|
| `/api/auth/...` | AuthController (login, registro, recuperar contraseña) |
| `/api/settings` | SettingController |
| `/api/products` | ProductController |
| `/api/uploads/product-image` | UploadController |
| `/api/ingredients` | IngredientController |
| `/api/inventory`, `/api/inventory-logs` | InventoryController |
| `/api/clients` | ClientController |
| `/api/staff` | StaffController |
| `/api/orders` | OrderController |
| `/api/payments` | PaymentController |
| `/api/cash-closing`, `/api/dashboard` | CashClosingController, DashboardController |
| `/api/sync` | SyncController |
| `/api/push` | PushController |

**El orden importa:** `GET /api/cash-closing/preview` va antes que `GET /api/cash-closing/{id}`.
Si fuera al revés, la palabra `preview` se tomaría como si fuera un `{id}`. Por la misma razón,
`POST /api/orders/manual` (pedido por llamada o WhatsApp que registra el admin) está escrita junto a
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
