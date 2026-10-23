# src/pages/client/HistorySection.tsx

## ¿Para qué sirve?
Es la pestaña **"Historial y Recompras"**: lista los pedidos del cliente con buscador y filtros,
permite **calificar** los pedidos entregados (estrellas, etiquetas y comentario), ver el **recibo**
detallado y **volver a pedir** lo mismo con un clic.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` cuando `activeTab === 'history'` | |
| → `updateOrder(id, { rating, reviewText })` | almacén → `PATCH /api/orders/{id}/review` → `PedidoService::calificar()` → tabla RESENA | Guardar la calificación. |
| → `reorder(pedido)` | del padre | Recompra en 1 clic. |
| → usa | `formatCOP`, `orderCode`, `vehicleWithModel` | |
| ← las reseñas se ven en | `Landing.tsx` (testimonios) | Las reseñas con comentario aparecen en la página de inicio. |

## Props
| Prop | Qué es |
|---|---|
| `orders` | Pedidos del cliente. |
| `userProfile` | Para mostrar sus puntos. |
| `historySearch` / `setHistorySearch` | Texto del buscador. |
| `historyFilter` / `setHistoryFilter` | `'all'` (todos), `'unrated'` (sin calificar), `'rated'` (calificados). |
| `reviewingOrderId`, `reviewRating`, `reviewHoverRating`, `reviewText`, `reviewTags` y sus `set...` | La caja de calificación. `reviewHoverRating` = estrella sobre la que está el mouse. |
| `viewingReceiptOrder` / `setViewingReceiptOrder` | El pedido cuyo recibo se está viendo. |
| `updateOrder`, `showToast`, `reorder`, `setActiveTab` | Funciones. |
| `storeConfig`, `catalog` | Ajustes y productos (imágenes). |

## Partes de la pantalla
| Parte | Qué hace |
|---|---|
| Buscador y filtros | Filtra por texto y por si está calificado. |
| Lista de pedidos | Cada pedido con sus productos; los cambios se marcan **SIN** (rojo) y **EXTRA** (verde) leyendo `removed` y `extras`. |
| Datos del domiciliario | Si el pedido tuvo domiciliario. |
| Caja de calificación | Estrellas 1–5, etiquetas rápidas y comentario. Solo para pedidos entregados (PHP también lo exige). |
| Botones | Ver recibo y "Pedir de nuevo". |
| Ventana de recibo | Estado, dirección, productos con personalizaciones, subtotal, domicilio, descuento de cumpleaños, puntos canjeados (si los usó), total y los puntos ganados. |

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../HistorySection"` porque lo importan: `src/pages/ClientDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
