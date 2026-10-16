# src/lib/format.ts

## ¿Para qué sirve?
Funciones pequeñas para **mostrar datos bonitos**: dinero en pesos, el código del pedido y el
nombre del vehículo.

## ¿Con qué se conecta?
| Función | La usan |
|---|---|
| `formatCOP` | Casi todas las pantallas (admin, cliente, domiciliario, landing) y `utils/generarCierrePdf.ts` |
| `orderCode` | `KitchenDashboard.tsx`, `DeliveryDashboard.tsx`, `ClientDashboard.tsx`, `admin/OverviewSection.tsx`, `client/ActiveOrdersSection.tsx`, `client/HistorySection.tsx` |
| `vehicleWithModel` | `AdminDashboard.tsx`, `admin/MapSection.tsx`, `admin/OrdersSection.tsx`, `DeliveryDashboard.tsx`, `client/HistorySection.tsx` |
| `vehicleLabel` | Lo usa `vehicleWithModel` aquí mismo |

## Funciones
### `orderCode(id)`
```ts
String(id ?? '').replace(/^#/, '')
```
PHP envía el pedido como `#ORD-12` (ver `pedido_a_json()`). En pantalla se muestra sin el `#`: `ORD-12`.
`/^#/` = "un `#` al inicio".

### `formatCOP(amount)`
```ts
new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
```
`15000` → `$ 15.000`. `Intl.NumberFormat` es la herramienta del navegador para formatear números
según el país (`es-CO` = español de Colombia).

### `vehicleLabel(vehicle)`
Convierte el valor de la base de datos al texto bonito: `a_pie` → `A pie`, `moto` → `Moto`.
Usa la tabla `VEHICLE_LABELS`; si el valor no está, pone la primera letra en mayúscula.

### `vehicleWithModel(vehicle, model)`
`("moto", "GIXXER 155")` → `"Moto - GIXXER 155"`. Si no hay modelo, solo `"Moto"`.
