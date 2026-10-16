# app/Controllers/SettingController.php

## ¿Para qué sirve?
Maneja los **ajustes de la tienda**: horario de apertura y cierre, abrir/pausar la tienda, tarifa de
domicilio, margen de ganancia y las categorías del menú.

## ¿Con qué se conecta?
| Ruta | `$action` | Quién | React |
|---|---|---|---|
| `GET /api/settings` | `show` | cualquiera | También llega en `window.__DATOS__.settings` y por `/api/sync` |
| `PUT /api/settings` | `update` | admin | `almacenAplicacion.ts` ← `admin/SettingsSection.tsx` |
| `POST /api/settings/categories` | `addCategory` | admin | `almacenAplicacion.ts` ← `admin/MenuSection.tsx` |
| `DELETE /api/settings/categories/{category}` | `removeCategory` | admin | `almacenAplicacion.ts` ← `MenuSection.tsx` |

- **Modelo:** `Configuracion` (tabla CONFIGURACION_SISTEMA y CATEGORIA).
- Estos ajustes los usa `PedidoService` para decidir si la tienda está abierta y cuánto cobrar de domicilio.

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$datos` | En `update`: `openTime`, `closeTime`, `isOpen`, `isPaused`, `shippingRate`, `profitMargin`. |
| `$categoria` | Nombre de la categoría a crear o borrar. |

## Acciones
- **`show`**: devuelve la configuración.
- **`update`**: guarda los campos enviados y responde la configuración actualizada.
- **`addCategory`**: `trim()` quita espacios al inicio y al final. Si queda vacío → **422**. Si ya existe (sin importar mayúsculas), no la repite.
- **`removeCategory`**: si algún producto **activo** la usa → **409** con el mensaje del modelo.
