# app/Models/Caja.php

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
| `pedidosDelTurno()` | Pedidos **entregados** que todavía no pertenecen a ningún cierre (`id_reporte IS NULL`). |
| `consumoTeorico($idsPedidos)` | Suma, por insumo, las salidas de inventario que generaron esos pedidos. |
| `domiciliariosActivos()` | Domiciliarios activos con su base de efectivo. |
| `stockActual($idIngrediente)` | Stock de un insumo en este momento. |
| `pedidosActivosCount()` | Cuántos pedidos siguen sin entregar ni cancelar (para avisar al admin). |
| `reporte($idReporte)` | Arma el reporte completo de un cierre ya guardado. |
| `historialDeAdmin($idAdmin)` | Cierres de ese admin, del más nuevo al más viejo. |

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
