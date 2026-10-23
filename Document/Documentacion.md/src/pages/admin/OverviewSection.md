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
| `isStoreOpen`, `onNuevoPedido` | Si la tienda está abierta y la función que abre la ventana de pedido manual (para el saludo de bienvenida). |

## Partes de la pantalla
| Parte | Qué muestra |
|---|---|
| Saludo de bienvenida | Recuadro oscuro con **"¡Hola, (primer nombre)! 👋"** (el nombre sale de `window.__DATOS__.usuario.nombre`), una frase con cuántos pedidos activos hay, los botones **Nuevo pedido**, **Comandas activas** y **Cierre de caja**, las **ventas de hoy** y si la tienda está abierta. A la derecha (desde tablet) la foto del **producto más vendido** (está guardada en el propio servidor; si no carga, queda un fondo oscuro) con la marca **"En vivo"** con 4 cuadritos: Pendientes, En cocina, Listos y En camino; al tocarlos lleva a la pestaña correspondiente. Reemplaza el antiguo título "Tablero General". |
| Tarjetas de indicadores | Ventas del período (`salesData.reduce(...)` suma los montos), pedidos de hoy, etc. Se arman dentro de una función que se ejecuta en el momento: `{(() => { ... return [...] })().map(...)}`. |
| Gráfica de ventas | Barras con las ventas del período elegido. |
| Torta de productos | Los más vendidos, con una leyenda que se puede tocar. |
| Órdenes recientes | Últimos pedidos; tocar uno lleva a "Comandas Activas". |
| Monitoreo operativo | Cuántos pedidos hay en cada estado, capacidad de cocina, domiciliarios activos y despachos en vivo. |

Los números se calculan con los pedidos que tiene el navegador (los que llegan por `/api/sync`).

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../OverviewSection"` porque lo importan: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
