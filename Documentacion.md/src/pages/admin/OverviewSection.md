# src/pages/admin/OverviewSection.tsx

## ¿Para qué sirve?
Es el **"Tablero Analítico"**, la primera pantalla del admin: tarjetas con números del negocio,
gráfica de ventas, torta de productos más vendidos, pedidos recientes y un monitor de la operación
(cocina y reparto en vivo).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `AdminDashboard.tsx` cuando `activeTab === 'overview'` | |
| ← los datos vienen de | `orders` y `staff` del almacén (`/api/sync`) y cálculos del padre (`getSalesData()`, `topProductsData`) | |
| → usa | `recharts` (`BarChart`, `PieChart`) | Gráficas. |
| → usa | `CustomSelect` | Elegir el período. |
| → `handleNavigateToOrders(id)` | del padre | Ir a un pedido en "Comandas Activas". |
| → usa | `formatCOP`, `orderCode` | |

## Props
| Prop | Qué es |
|---|---|
| `orders`, `staff`, `storeConfig` | Datos. |
| `salesData` | Ventas por día o por semana (`[{ date, amount }]`), calculadas por el padre. |
| `periodOrdersCount` | Pedidos del período elegido. |
| `salesFilter` / `setSalesFilter` | Período: "Esta semana", "Este mes", etc. |
| `topProductsData` | Productos más vendidos para la torta. |
| `activePieIndex` / `setActivePieIndex` | Parte de la torta resaltada (al pasar el mouse). |
| `handleNavigateToOrders`, `setActiveTab` | Navegar. |

## Partes de la pantalla
| Parte | Qué muestra |
|---|---|
| Tarjetas de indicadores | Ventas del período (`salesData.reduce(...)` suma los montos), pedidos de hoy, etc. Se arman dentro de una función que se ejecuta en el momento: `{(() => { ... return [...] })().map(...)}`. |
| Gráfica de ventas | Barras con las ventas del período elegido. |
| Torta de productos | Los más vendidos, con una leyenda que se puede tocar. |
| Órdenes recientes | Últimos pedidos; tocar uno lleva a "Comandas Activas". |
| Monitoreo operativo | Cuántos pedidos hay en cada estado, capacidad de cocina, domiciliarios activos y despachos en vivo. |

Los números se calculan con los pedidos que tiene el navegador (los que llegan por `/api/sync`), no con
`GET /api/dashboard`.
