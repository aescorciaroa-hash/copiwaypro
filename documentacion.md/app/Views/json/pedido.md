# app/Views/json/pedido.php

## ¿Para qué sirve?
Convierte un **pedido** al formato de React (`interface Order`). Además aplica dos reglas de
**privacidad**: quién puede ver el teléfono del cliente y quién puede ver el PIN de entrega.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← la usa | `Pedido::formar()` (`app/Models/Pedido.php`) |
| → el resultado lo usan | `KitchenDashboard.tsx`, `DeliveryDashboard.tsx`, `ClientDashboard.tsx`, `admin/OrdersSection.tsx`... |

## La constante `PEDIDO_ESTADO_BD_A_APP`
Traduce el estado de MySQL al texto que muestra React:
| MySQL | React |
|---|---|
| `pendiente` | `Pendiente` |
| `en_preparacion` | `En Preparación` |
| `listo` | `Listos` |
| `en_camino` | `En Camino` |
| `entregado` | `Entregado` |
| `cancelado` | `Cancelado` |

`const` crea un valor fijo que no cambia.

## `pedido_a_json($fila, $items, $rolQueVe, $idQueVe)`
| Parámetro | Qué es |
|---|---|
| `$fila` | La fila del pedido con los datos del JOIN (cliente, domiciliario, ayudante). |
| `$items` | Los productos del pedido, ya armados por `Pedido::itemsDe()`. |
| `$rolQueVe`, `$idQueVe` | Rol e id de **quién está pidiendo** los datos. |

### Regla 1: teléfono del cliente
```php
$mostrarTelefono = true;
if ($rolQueVe === 'delivery') {
    $mostrarTelefono = $fila['estado'] === 'en_camino' && $fila['id_domiciliario'] === $idQueVe;
}
```
El domiciliario solo ve el teléfono si el pedido es **suyo** y va **En Camino**. Los demás lo ven siempre.

### Regla 2: PIN de entrega
```php
'deliveryPin' => $rolQueVe === 'client' ? $fila['pin_entrega'] : null,
'requiresDeliveryPin' => !empty($fila['pin_entrega']),
```
- Solo el **cliente** ve el PIN. El domiciliario debe **pedírselo** en la puerta.
- `requiresDeliveryPin` (true/false) le dice al domiciliario que debe pedirlo, sin mostrarlo.

## Campos importantes
| Campo de React | Sale de |
|---|---|
| `id` | `'#ORD-' . id_pedido` |
| `client`, `clientPhone` | nombre y teléfono del cliente |
| `driverName`, `driverPhone`, `driverPlate`, `driverVehicle` | datos del domiciliario |
| `preparedBy` | nombre del ayudante de cocina |
| `total`, `subtotal`, `shipping`, `discount` | montos (convertidos a número) |
| `pointsEarned` | puntos que da el pedido |
| `lat`, `lng` | ubicación de entrega (para el mapa) |
| `time` | `date('H:i', strtotime(fecha_hora))` → solo la hora, ej: `"14:30"` |
| `paymentMethod` | `efectivo` → `'cash'`, `digital` → `'online'` |
| `paymentStatus` | `aprobado` → `'Pagado'`; si no, la primera letra en mayúscula (`ucfirst`) |
