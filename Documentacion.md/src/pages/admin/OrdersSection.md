# src/pages/admin/OrdersSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Comandas Activas"**: el admin ve todos los pedidos con su estado, el domiciliario
asignado, y un mapa de Neiva con la cocina, los domiciliarios y los destinos. Desde aquí puede ver el
detalle de un pedido, cambiar la dirección, soltar un pedido de un domiciliario y abrir el formulario
de pedido manual.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `AdminDashboard.tsx` cuando `activeTab === 'orders'` | |
| ← los pedidos vienen de | `orders` del almacén (`/api/sync`) — el admin recibe **todos** (`Pedido::porRol('admin')`) | |
| → `handleViewOrder(id)` | ventana de detalle en el padre | |
| → `setEditingAddressOrder`, `setNewAddress` | ventana "Editar dirección" del padre | La guarda en el servidor (`PATCH /api/orders/{id}/address`). No se puede en pedidos entregados. |
| → `setShowManualForm(true)` | ventana de pedido manual del padre | |
| → `setSelectedDriverInfo` | ventana de datos del domiciliario | |
| → usa | `react-leaflet`, `RoutePolyline` (rutas OSRM), `vehicleWithModel`, `formatCOP` | |
| → usa | `products` del almacén (`useStore`) | Para buscar la **foto** de cada producto del pedido por su `productId`. |

## Props
| Prop | Qué es |
|---|---|
| `orders`, `staff`, `theme` | Datos y tema (mapa oscuro o claro). |
| `highlightedOrderId` | Pedido a resaltar (cuando se llega desde el Tablero). Cada tarjeta tiene `id="order-card-ID"` para poder bajar hasta ella. |
| `isMapExpanded` / `setIsMapExpanded` | Mapa en pantalla completa. |
| `setSelectedDriverInfo`, `showManualForm` / `setShowManualForm`, `setEditingAddressOrder`, `setNewAddress`, `handleViewOrder` | Funciones del padre. |

## El mapa
- **Origen:** la cocina.
- **Domiciliarios:** los que tienen `location` (la ubicación GPS real que envía su celular).
- **Rutas:** de cada domiciliario a su pedido en curso (`destCoords`, el destino que él ubicó en su
  mapa), dibujadas con OSRM.
- Usa el estilo oscuro `leaflet-dark-tiles` (de `index.css`) cuando el tema es oscuro.

## Detalle del pedido en cada comanda
En cada tarjeta, el "Detalle del Pedido" muestra **solo la foto, la cantidad y el nombre** de cada producto
(ej. `1x Street Food`). No muestra los ingredientes ni los SIN / EXTRA, para que la tarjeta sea más corta.

- La foto se busca así: `products.find(p => p.id === item.productId)?.image` = "en la lista de productos del
  menú, busca el que tenga el mismo número que este producto del pedido, y toma su imagen".
- Si el producto no tiene foto (por ejemplo la **Hamburguesa Personalizada**, que no está en el menú), se ve
  un cuadrito con el ícono de cubiertos (`Utensils`).
- Los ingredientes, SIN y EXTRA **siguen viéndose** en la ventana del ojo (detalle del pedido, en
  `AdminDashboard.tsx`) y en la pantalla de cocina (`KitchenDashboard.tsx`).

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../OrdersSection"` porque lo importan: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
