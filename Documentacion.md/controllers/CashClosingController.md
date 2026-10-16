# controllers/CashClosingController.php

## ¿Para qué sirve?
Maneja el **cierre de caja** del día: cuánto se vendió en efectivo y en digital, cuánto efectivo
debe entregar cada domiciliario y cuántos insumos se gastaron.

## ¿Con qué se conecta?
| Ruta | Método | React |
|---|---|---|
| `GET /api/cash-closing/preview` | `preview` | `AdminDashboard.tsx` (vista previa antes de confirmar) |
| `POST /api/cash-closing` | `store` | `AdminDashboard.tsx` (botón confirmar cierre) |
| `GET /api/cash-closing` | `index` | — |
| `GET /api/cash-closing/{id}` | `show` | — |

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
