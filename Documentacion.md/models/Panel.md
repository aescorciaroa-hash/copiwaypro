# models/Panel.php

## ¿Para qué sirve?
Calcula el **resumen del día** para el dashboard del administrador. Solo lee datos.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | `DashboardController.php` (`GET /api/dashboard`) |
| → tablas | `PEDIDO`, `INGREDIENTE`, `DETALLE_PEDIDO` |

## Método `resumenDeHoy()`
Hace 4 consultas:

| Consulta | SQL clave | Resultado en el JSON |
|---|---|---|
| Ventas de hoy | `COALESCE(SUM(total),0)`, `COUNT(*)`, `WHERE DATE(fecha_hora) = ?` | `salesToday`, `ordersToday` |
| Pedidos por estado | `GROUP BY estado` | `ordersByStatus` |
| Stock bajo | `WHERE cantidad_stock <= umbral_minimo` | `lowStockItems` |
| Top 5 productos | `SUM(dp.cantidad) ... ORDER BY quantity DESC LIMIT 5` | `topProducts` |

| Función SQL | Qué hace |
|---|---|
| `SUM(x)` | Suma. |
| `COUNT(*)` | Cuenta filas. |
| `COALESCE(x, 0)` | Si `x` es `NULL` (no hubo ventas), usa `0`. |
| `DATE(fecha_hora)` | Solo la fecha, sin la hora. |
| `GROUP BY` | Agrupa para sumar o contar por grupo. |
| `AS name` | Le pone otro nombre a la columna en el resultado. |

```php
'ordersByStatus' => $pedidosPorEstado,   // armado con un foreach: ['pendiente' => 1, 'listo' => 2, ...]
```
Convierte `[['estado' => 'listo', 'cantidad' => 3], ...]` en `['listo' => 3, ...]`.

La variable `$hoy = date('Y-m-d')` es la fecha de hoy (ej: `2026-10-16`) y se envía con `bind_param("s", $hoy)`.
