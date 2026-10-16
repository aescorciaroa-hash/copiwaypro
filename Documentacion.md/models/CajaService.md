# models/CajaService.php

## ¿Para qué sirve?
Calcula y guarda el **cierre de caja del día**: total vendido, cuánto en efectivo y cuánto digital,
cuánto efectivo debe entregar cada domiciliario, qué insumos se gastaron y la ganancia.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `CashClosingController.php` | `previsualizar()` y `generar()`. |
| → usa | `Caja` (modelo) | Todas las consultas de lectura. |
| → escribe en | `REPORTE_CAJA`, `LIQUIDACION_DOMICILIARIO`, `DETALLE_AUDITORIA`, `PEDIDO.id_reporte` | |
| → la respuesta va a | `AdminDashboard.tsx` y `src/utils/generarCierrePdf.ts` | Mostrar el cierre y hacer el PDF. |

## Variables de la clase
| Variable | Para qué |
|---|---|
| `$this->conn` | La conexión. |
| `$this->cajaModel` | `new Caja()`, para las consultas. |

## `previsualizar($idAdmin)` — vista previa
Calcula todo **sin guardar nada**:
1. Si el cierre de hoy ya existe → excepción.
2. `pedidosDelTurno()`: pedidos entregados sin cierre.
3. `calcularTotales()`: suma ventas, domicilios, efectivo y digital.
4. **Liquidación** por domiciliario activo: lo que cobró en efectivo + su base. Si no cobró nada, no aparece.
5. **Insumos consumidos**: de `consumoTeorico()`, con el costo de cada uno.
6. **Ganancia:**
   ```php
   $ventasProducto = $totales['totalVentas'] - $costoDomicilios;
   $ganancia = $ventasProducto - $costoInsumos;
   ```
   Lo cobrado por domicilio no es ganancia (cubre el reparto), por eso se resta.
   `margen` = ganancia ÷ ventas de producto × 100.

## `calcularTotales($pedidos)` (privado)
Recorre los pedidos y va sumando:
| Variable | Suma |
|---|---|
| `$totalVentas` | El total de todos. |
| `$totalDomicilios` | El costo de domicilio de todos. |
| `$totalEfectivo` / `$totalDigital` | Según el método de pago. |
| `$efectivoPorDomiciliario[id]` | Efectivo que cobró cada domiciliario. |

```php
$efectivoPorDomiciliario[$idDom] = ($efectivoPorDomiciliario[$idDom] ?? 0) + $total;
```
"Lo que llevaba ese domiciliario (o 0 si es el primero) más este pedido."

## `generar($idAdmin)` — guardar el cierre
Lo mismo, pero **guardando** dentro de una transacción:
1. `INSERT INTO REPORTE_CAJA` → `$idReporte`.
2. A cada pedido del turno le pone `id_reporte` (queda archivado; no se borra).
3. `INSERT INTO LIQUIDACION_DOMICILIARIO` por cada domiciliario con efectivo.
4. `INSERT INTO DETALLE_AUDITORIA` por cada insumo consumido, con su stock real.
5. `commit()` y devuelve el reporte con `cajaModel->reporte($idReporte)`.

La tabla `REPORTE_CAJA` tiene `UNIQUE (id_admin, fecha)`: un admin no puede hacer dos cierres el mismo día.

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/CajaService.php`).
Lo cargan con `require_once`: `controllers/CashClosingController.php`. Dejan de funcionar:
  - `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.
  - `POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja.

**Si se borra un método:** sale `Call to undefined method CajaService::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `previsualizar()` | `CashClosingController::preview()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa. |
| `calcularTotales()` (privado) | `CajaService::generar()`, `CajaService::previsualizar()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.<br>`POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `generar()` | `CashClosingController::store()` | `POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `__construct()` | `new CajaService()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa CajaService. |
