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
| → `releaseOrder(id)` (almacén) | `PATCH /api/orders/{id}/release` → `PedidoService::liberarPedido()` | Soltar el pedido de un domiciliario. |
| → `handleViewOrder(id)` | ventana de detalle en el padre | |
| → `setEditingAddressOrder`, `setNewAddress` | ventana "Editar dirección" del padre | (Solo cambia la dirección en el navegador; ver la observación en `AdminDashboard.md`.) |
| → `setShowManualForm(true)` | ventana de pedido manual del padre | |
| → `setSelectedDriverInfo` | ventana de datos del domiciliario | |
| → usa | `react-leaflet`, `RoutePolyline` (rutas OSRM), `vehicleWithModel`, `formatCOP` | |

## Props
| Prop | Qué es |
|---|---|
| `orders`, `staff`, `theme` | Datos y tema (mapa oscuro o claro). |
| `highlightedOrderId` | Pedido a resaltar (cuando se llega desde el Tablero). Cada tarjeta tiene `id="order-card-ID"` para poder bajar hasta ella. |
| `isMapExpanded` / `setIsMapExpanded` | Mapa en pantalla completa. |
| `setSelectedDriverInfo`, `showManualForm` / `setShowManualForm`, `setEditingAddressOrder`, `setNewAddress`, `handleViewOrder` | Funciones del padre. |

## El mapa
- **Origen:** la cocina.
- **Domiciliarios:** los que tienen `location` (ubicación guardada).
- **Rutas:** de cada domiciliario a su pedido, dibujadas con OSRM.
- Usa el estilo oscuro `leaflet-dark-tiles` (de `index.css`) cuando el tema es oscuro.
