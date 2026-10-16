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
