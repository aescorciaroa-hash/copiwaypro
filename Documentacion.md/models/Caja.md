# models/Caja.php

## ¿Para qué sirve?
Consultas para el **cierre de caja**. Solo lee datos; los cálculos y el guardado del cierre están en
`CajaService.php`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `CajaService.php` | Todas las consultas del cálculo del cierre. |
| ← lo usa | `CashClosingController.php` | Historial y reporte guardado. |
| → tablas | `REPORTE_CAJA`, `LIQUIDACION_DOMICILIARIO`, `DETALLE_AUDITORIA`, `PEDIDO`, `CLIENTE`, `DOMICILIARIO`, `MOVIMIENTO_INVENTARIO`, `INGREDIENTE` | |

## Tablas del cierre
| Tabla | Qué guarda |
|---|---|
| `REPORTE_CAJA` | Un cierre: fecha, admin, total de ventas, total en efectivo y total digital. |
| `LIQUIDACION_DOMICILIARIO` | Cuánto efectivo debe entregar cada domiciliario (base + lo que cobró). |
| `DETALLE_AUDITORIA` | Insumos consumidos en el turno y stock real al cerrar. |
| `PEDIDO.id_reporte` | Al cerrar, cada pedido entregado queda "archivado" en ese reporte. |

## Métodos
| Método | Qué hace |
|---|---|
| `yaGeneradoHoy($idAdmin, $fecha)` | ¿Este admin ya hizo el cierre de hoy? |
| `pedidosDelTurno()` | Pedidos **entregados** que todavía no pertenecen a ningún cierre (`id_reporte IS NULL`). Usa `LEFT JOIN CLIENTE` para incluir también los pedidos de clientes invitados (con el nombre que dictaron). |
| `consumoTeorico($idsPedidos)` | Suma, por insumo, las salidas de inventario que generaron esos pedidos. |
| `domiciliariosActivos()` | Domiciliarios activos con su base de efectivo. |
| `stockActual($idIngrediente)` | Stock de un insumo en este momento. |
| `pedidosActivosCount()` | Cuántos pedidos siguen sin entregar ni cancelar (para avisar al admin). |
| `reporte($idReporte)` | Arma el reporte completo de un cierre ya guardado. |

## `consumoTeorico()` explicado
```php
$marcas = implode(',', array_fill(0, count($idsPedidos), '?'));
```
Si hay 3 pedidos, `array_fill` crea `['?', '?', '?']` e `implode` lo une: `"?,?,?"`.
Así el SQL queda `... IN (?,?,?)` con un `?` por cada pedido.

```php
$stmt->bind_param(str_repeat("i", count($idsPedidos)), ...$idsPedidos);
```
`str_repeat("i", 3)` = `"iii"` (los 3 son enteros). `...$idsPedidos` pasa cada id por separado.

`SUM(m.cantidad) ... GROUP BY i.id_ingrediente` suma lo consumido **por cada insumo**.
El resultado se guarda con el id del insumo como clave: `$resultado[5] = ['nombre' => ..., 'consumido' => ...]`.

## Por qué algunas consultas usan `prepare()` aunque no tengan `?`
`$this->conn->query()` devuelve los números como texto (`"5"`), mientras que `prepare()` los devuelve
como número (`5`). React recibe estos datos en el JSON, así que se usa `prepare()` + `execute()` para
que los tipos lleguen siempre igual.

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/Caja.php`).
Lo cargan con `require_once`: `models/CajaService.php`. Dejan de funcionar:
  - `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.
  - `POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja.

**Si se borra un método:** sale `Call to undefined method Caja::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `yaGeneradoHoy()` | `CajaService::generar()`, `CajaService::previsualizar()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.<br>`POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `pedidosDelTurno()` | `CajaService::generar()`, `CajaService::previsualizar()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.<br>`POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `consumoTeorico()` | `CajaService::generar()`, `CajaService::previsualizar()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.<br>`POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `domiciliariosActivos()` | `CajaService::generar()`, `CajaService::previsualizar()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.<br>`POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `stockActual()` | `CajaService::generar()`, `CajaService::previsualizar()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.<br>`POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `pedidosActivosCount()` | `CajaService::generar()`, `CajaService::previsualizar()` | `GET /api/cash-closing/preview` → Admin → Ajustes y Caja: el botón "Generar cierre" no muestra la vista previa.<br>`POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `reporte()` | `CajaService::generar()` | `POST /api/cash-closing` → Admin: no se puede confirmar el cierre de caja. |
| `__construct()` | `new Caja()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa Caja. |
