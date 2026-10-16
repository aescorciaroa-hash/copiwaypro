# views/json/pedido.php

## ¿Para qué sirve?
Convierte un **pedido** al formato de React (`interface Order`). Además aplica dos reglas de
**privacidad**: quién puede ver el teléfono del cliente y quién puede ver el PIN de entrega.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← la usa | `Pedido::formar()` (`models/Pedido.php`) |
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
| `client`, `clientPhone` | nombre y teléfono del cliente (en un pedido de invitado, los que dictó por teléfono) |
| `driverName`, `driverPhone`, `driverPlate`, `driverVehicle` | datos del domiciliario |
| `preparedBy` | nombre del ayudante de cocina |
| `total`, `subtotal`, `shipping`, `discount` | montos (convertidos a número) |
| `pointsRedeemed`, `pointsDiscount` | puntos que el cliente canjeó en este pedido y cuánto descontaron en pesos |
| `pointsEarned` | puntos que da el pedido |
| `lat`, `lng` | ubicación de entrega (para el mapa) |
| `time` | `date('H:i', strtotime(fecha_hora))` → solo la hora, ej: `"14:30"` |
| `paymentMethod` | `efectivo` → `'cash'`, `digital` → `'online'` |
| `paymentStatus` | `aprobado` → `'Pagado'`; si no, la primera letra en mayúscula (`ucfirst`) |
| `channel` | por dónde llegó: `canal_origen` (`web`, `llamada` o `whatsapp`) |
| `isGuest` | `true` si es un pedido manual de alguien sin cuenta (`id_cliente` vacío) |

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** `config/helpers.php` lo carga en cada petición, así que **nada funciona** (`Failed to open stream` …`views/json/pedido.php`).

**Si se borra una función:** sale `Call to undefined function nombre()` en lo que la usa:

| Función | La llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `pedido_a_json()` | `Pedido::formar()` | `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.<br>`POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.<br>`PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.<br>… y 9 más: `PATCH /api/orders/{id}/destination`, `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `GET /api/sync`. |
