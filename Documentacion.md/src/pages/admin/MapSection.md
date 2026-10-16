# src/pages/admin/MapSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Rutas & Zonas"**: un mapa grande con la cocina, la flota de domiciliarios y los
pedidos en reparto, más un panel lateral con la lista de domiciliarios y de pedidos en curso.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `AdminDashboard.tsx` cuando `activeTab === 'map'` | |
| ← datos | `orders`, `staff` (almacén, `/api/sync`) | La ubicación de cada domiciliario es `staff[].location` (columnas `ubicacion_lat` y `ubicacion_lng` de DOMICILIARIO). |
| → `handleNavigateToOrders(id)` | del padre | Ir al pedido. |
| → `handleOpenStaffModal(persona)` | del padre | Ver el perfil de un domiciliario. |
| → `setEditingAddressOrder`, `setNewAddress` | del padre | Editar dirección. |
| → usa | `react-leaflet`, `L.divIcon` (íconos propios), `formatCOP`, `vehicleWithModel` | |

## Variables
| Variable | Qué es |
|---|---|
| `showDriversModal` (`useState`) | Ventana con la lista completa de domiciliarios. |
| `drivers` | Todos los domiciliarios. |
| `activeDrivers` | Domiciliarios activos. |
| `kitchenCoords` | Ubicación fija de la cocina: `[2.9273, -75.2819]` (Neiva). |
| `activeDeliveryOrders`, `enCaminoOrders`, `listosOrders` | Pedidos en reparto, en camino y listos. |
| `kitchenIcon`, `driverIcon`, `clientIcon` | Íconos del mapa hechos con HTML (🍔 cocina, 🛵 domiciliario, punto verde cliente). |

## `getOrderCoords(pedido, indice)`
```ts
if (order.lat && order.lng) return [order.lat, order.lng];
return points[idx % points.length];
```
Si el pedido tiene coordenadas reales (`destino_lat`/`destino_lng` en PHP), las usa. Si no, usa uno
de 6 puntos de ejemplo alrededor de Neiva (`%` = resto de la división, para repetir la lista).

## Partes de la pantalla
| Parte | Qué muestra |
|---|---|
| Cabecera | Botones para ir a otras pestañas. |
| Indicadores | Domiciliarios activos, pedidos en camino y listos. |
| Mapa | Cocina, domiciliarios, destinos y rutas, con su leyenda. |
| Panel lateral | Flota de domiciliarios y pedidos en curso. |
