# src/lib/format.ts

## ¿Para qué sirve?
Funciones pequeñas para **mostrar datos bonitos**: dinero en pesos, el código del pedido, el
nombre del vehículo y las personalizaciones de un producto (SIN / EXTRA).

## ¿Con qué se conecta?
| Función | La usan |
|---|---|
| `formatCOP` | Casi todas las pantallas (admin, cliente, domiciliario, landing) y `utils/generarCierrePdf.ts` |
| `orderCode` | `KitchenDashboard.tsx`, `DeliveryDashboard.tsx`, `ClientDashboard.tsx`, `admin/OverviewSection.tsx`, `client/ActiveOrdersSection.tsx`, `client/HistorySection.tsx` |
| `vehicleWithModel` | `AdminDashboard.tsx`, `admin/MapSection.tsx`, `admin/OrdersSection.tsx`, `DeliveryDashboard.tsx`, `client/HistorySection.tsx` |
| `vehicleLabel` | Lo usa `vehicleWithModel` aquí mismo |
| `modificacionesDe` | `KitchenDashboard.tsx` (tarjetas), `admin/OrdersSection.tsx` (comandas activas), `AdminDashboard.tsx` (detalle del pedido) |

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

### `modificacionesDe(item)`
Arma la lista de personalizaciones de un producto del pedido, a partir de lo que envía el servidor
(`removed` y `extras`):
| Viene en | Se muestra | `tipo` (color) |
|---|---|---|
| `removed` | `SIN Cebolla` | `'sin'` (rojo) |
| `extras` de un producto normal | `EXTRA Queso` | `'extra'` (verde) |
| `extras` de la "Hamburguesa Personalizada" | `Carne` (tal cual) | `'ingrediente'` (gris) |

En la hamburguesa del Creador Interactivo, `extras` es la receta completa que armó el cliente, no un
adicional; por eso no se le pone "EXTRA". Las pantallas eligen el color con `tipo`, no buscando la
palabra "SIN" dentro del texto (así un ingrediente como "Salsa Insignia" no se pinta de rojo).

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../format"` porque lo importan: `src/pages/AdminDashboard.tsx`, `src/pages/ClientDashboard.tsx`, `src/pages/DeliveryDashboard.tsx`, `src/pages/KitchenDashboard.tsx`, `src/pages/Landing.tsx`, `src/pages/admin/ClientsSection.tsx`, `src/pages/admin/InventorySection.tsx`, `src/pages/admin/MapSection.tsx`, `src/pages/admin/MenuSection.tsx`, `src/pages/admin/OrdersSection.tsx`, `src/pages/admin/OverviewSection.tsx`, `src/pages/admin/SettingsSection.tsx`, `src/pages/client/ActiveOrdersSection.tsx`, `src/pages/client/BuilderSection.tsx`, `src/pages/client/CartSection.tsx`, `src/pages/client/CheckoutSection.tsx`, `src/pages/client/HistorySection.tsx`, `src/pages/client/PaymentGatewayModal.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
