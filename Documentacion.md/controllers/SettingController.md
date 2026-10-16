# controllers/SettingController.php

## ¿Para qué sirve?
Maneja los **ajustes de la tienda**: horario de apertura y cierre, abrir/pausar la tienda, tarifa de
domicilio, margen de ganancia, programa de puntos, datos del negocio para el ticket y las categorías
del menú.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
| `GET /api/settings` | `show` | cualquiera | También llega en `window.__DATOS__.settings` y por `/api/sync` |
| `PUT /api/settings` | `update` | admin | `almacenAplicacion.ts` ← `admin/SettingsSection.tsx` |
| `POST /api/settings/categories` | `addCategory` | admin | `almacenAplicacion.ts` ← `admin/MenuSection.tsx` |
| `DELETE /api/settings/categories/{category}` | `removeCategory` | admin | `almacenAplicacion.ts` ← `MenuSection.tsx` |

- **Modelo:** `Configuracion` (tabla CONFIGURACION_SISTEMA y CATEGORIA).
- Estos ajustes los usa `PedidoService` para decidir si la tienda está abierta, cuánto cobrar de
  domicilio y cuánto vale cada punto canjeado. `KitchenDashboard.tsx` imprime los datos del negocio
  en el ticket.

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$this->datos` | En `update`: `openTime`, `closeTime`, `isOpen`, `isPaused`, `shippingRate`, `profitMargin`, `pointValue` (pesos que vale 1 punto), `minPointsToRedeem` (mínimo de puntos para canjear) y `business` (`name`, `nit`, `address`, `phone`, `instagram`, `website`). |
| `$errores` | En `update`: los campos que no pasaron la validación. |
| `$categoria` | Nombre de la categoría a crear o borrar. |

## Acciones
- **`show`**: devuelve la configuración.
- **`update`**: valida y guarda los campos enviados, y responde la configuración actualizada.
  Responde **422** si `pointValue` es negativo o no es un número, si `minPointsToRedeem` no es un
  entero mayor o igual a 0, o si `business.name` llega vacío.
- **`addCategory`**: `trim()` quita espacios al inicio y al final. Si queda vacío → **422**. Si ya existe (sin importar mayúsculas), no la repite.
- **`removeCategory`**: si algún producto **activo** la usa → **409** con el mensaje del modelo.
