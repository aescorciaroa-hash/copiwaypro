# controllers/CashClosingController.php

## ¿Para qué sirve?
Maneja el **cierre de caja** del día: cuánto se vendió en efectivo y en digital, cuánto efectivo
debe entregar cada domiciliario y cuántos insumos se gastaron.

## ¿Con qué se conecta?
| Ruta | Método | React |
|---|---|---|
| `GET /api/cash-closing/preview` | `preview` | `AdminDashboard.tsx` (vista previa antes de confirmar) |
| `POST /api/cash-closing` | `store` | `AdminDashboard.tsx` (botón confirmar cierre) |

Solo el **admin** puede usarlas.

| Usa | Para qué |
|---|---|
| `CajaService` | Calcula (`previsualizar`) y guarda (`generar`) el cierre. |
| `Caja` (modelo) | Historial de cierres y un reporte guardado. |
| `Auth::id()` | El admin que hace el cierre. |
| `src/utils/generarCierrePdf.ts` | (React) Convierte la respuesta en un PDF. |

## Acciones
- **`preview`**: calcula el cierre **sin guardar nada**. Si ya se hizo el cierre hoy → **409**.
- **`store`**: calcula y **guarda** el cierre. Responde **201**. Si ya se hizo hoy → **409**.
- **`index`**: lista los cierres que hizo este admin.
- **`show`**: un cierre por su id.

`try { ... } catch (Exception $e)`: el servicio lanza un error si el cierre ya existe, y aquí se
convierte en una respuesta JSON con el mensaje.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `GET /api/cash-closing/preview`, `POST /api/cash-closing`. | `Failed to open stream: No such file or directory` (…`controllers/CashClosingController.php`) |
| La línea `require_once __DIR__ . '/../models/CajaService.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "CajaService" not found` |
| El método `preview()` | Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa. | `Call to undefined method CashClosingController::preview()` (500) |
| La rama `$accion === 'preview'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'GET /api/cash-closing/preview'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `store()` | Admin: no se puede confirmar el cierre de caja. | `Call to undefined method CashClosingController::store()` (500) |
| La rama `$accion === 'store'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/cash-closing'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| La línea `$this->cajaService = ...` del constructor | Las acciones que usan `$this->cajaService`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
