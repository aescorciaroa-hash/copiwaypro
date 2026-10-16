# views/json/personal.php

## ¿Para qué sirve?
Convierte un **ayudante de cocina** o un **domiciliario** al formato de React (`interface Staff`).
Las dos tablas se muestran en React como una sola lista de personal.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← la usa | `Personal::comoJsonCocina()` y `Personal::comoJsonDomicilio()` (`models/Personal.php`) |
| → el resultado lo usan | `admin/StaffSection.tsx`, `admin/MapSection.tsx` (ubicación), `admin/OrdersSection.tsx` |

## `personal_cocina_a_json($fila)`
| Campo de React | Sale de |
|---|---|
| `id` | `(string) id_ayudante` |
| `name`, `email`, `phone` | `nombre`, `correo`, `telefono` |
| `role` | Siempre `'Ayudante de cocina'` |
| `active` | `(bool) activo` |
| `hasPin` | `!empty($fila['pin'])`: `true` si tiene PIN (nunca se envía el PIN). |
| `createdBy` | Nombre del admin que lo creó |

## `personal_domicilio_a_json($fila, $currentOrderId, $destino)`
Lo mismo, más los datos del domiciliario:
| Campo de React | Sale de |
|---|---|
| `role` | Siempre `'Domiciliario'` |
| `location` | `[lat, lng]` si tiene ubicación guardada; si no, `null` |
| `currentOrderId` | El pedido que lleva "En Camino" (lo busca el modelo) |
| `destCoords` | `[lat, lng]` del destino de ese pedido, si el domiciliario ya lo ubicó en su mapa; si no, `null`. Con esto el mapa del admin dibuja la ruta. |
| `plate`, `vehicle`, `vehicleModel` | `placa`, `tipo_vehiculo`, `modelo_vehiculo` |
| `baseCash` | `(float) base_efectivo_asignada` (efectivo para dar cambio) |
