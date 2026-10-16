# controllers/SettingController.php

## ¿Para qué sirve?
Maneja los **ajustes de la tienda**: horario de apertura y cierre, abrir/pausar la tienda, tarifa de
domicilio, margen de ganancia, programa de puntos, datos del negocio para el ticket y las categorías
del menú.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
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

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `PUT /api/settings`, `POST /api/settings/categories`, `DELETE /api/settings/categories/{category}`. | `Failed to open stream: No such file or directory` (…`controllers/SettingController.php`) |
| La línea `require_once __DIR__ . '/../models/Configuracion.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Configuracion" not found` |
| El método `update()` | Admin → Ajustes y Caja: no se guardan horario, tarifa, puntos ni datos del negocio. | `Call to undefined method SettingController::update()` (500) |
| La rama `$accion === 'update'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PUT /api/settings'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `addCategory()` | Admin → Gestión de Menú: no se pueden crear categorías. | `Call to undefined method SettingController::addCategory()` (500) |
| La rama `$accion === 'addCategory'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/settings/categories'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `removeCategory()` | Admin → Gestión de Menú: no se pueden borrar categorías. | `Call to undefined method SettingController::removeCategory()` (500) |
| La rama `$accion === 'removeCategory'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'DELETE /api/settings/categories/{category}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| La línea `$this->configModel = ...` del constructor | Las acciones que usan `$this->configModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
