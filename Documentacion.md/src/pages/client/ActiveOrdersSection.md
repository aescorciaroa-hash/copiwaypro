# src/pages/client/ActiveOrdersSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Órdenes Activas"**: muestra los pedidos del cliente que todavía no se han entregado,
con su estado (Pendiente, En Preparación, Listos, En Camino), los productos y, cuando va **En Camino**,
los datos del domiciliario con un botón de WhatsApp.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` cuando `activeTab === 'activeOrders'` | |
| ← los pedidos vienen de | `/api/sync` → `Pedido::porRol('client')` | Solo los del cliente. El estado cambia solo cuando cocina o el domiciliario lo mueven. |
| → `setSelectedOrderInfo(pedido)` | ventana "Detalles del pedido" del padre | |
| → servicio externo | WhatsApp (`wa.me`) | Escribirle al domiciliario. |
| → usa | `formatCOP`, `orderCode`, `CustomBurgerThumb` | |

## Props
| Prop | Qué es |
|---|---|
| `activeOrders` | Pedidos activos. El padre los filtra: `orders.filter(o => o.status !== 'Entregado' && ... !== 'Pagado')`. |
| `setSelectedOrderInfo` | Abrir el detalle de un pedido. |
| `setActiveTab` | Ir al menú si no hay pedidos. |
| `catalog` | Productos (para las fotos en miniatura). |

## Datos del domiciliario
Solo cuando el pedido está "En Camino": nombre, vehículo, placa y teléfono (`driverName`,
`driverVehicle`, `driverPlate`, `driverPhone`, que vienen de `pedido_a_json()` en PHP).

El botón de WhatsApp arma el mensaje "¡Hola! Te escribo respecto a mi pedido ... (ORD-X)". Si el
pedido no trae teléfono del domiciliario, usa un número fijo de ejemplo (`3114567890`).

El **PIN de entrega** del pedido (`deliveryPin`) solo lo recibe el cliente: es el que le dice al
domiciliario en la puerta.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../ActiveOrdersSection"` porque lo importan: `src/pages/ClientDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
