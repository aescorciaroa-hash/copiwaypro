# src/pages/client/CatalogSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Explorar Menú"**: muestra los productos por categoría, un botón de **recompra rápida**
del último pedido y, al tocar un producto, abre la ventana para personalizarlo.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` cuando `activeTab === 'catalog'` | |
| → llama a | `openCustomizer(producto)` (del padre) | Abrir la ventana de personalizar. |
| → llama a | `reorder(pedido)` (del padre) | Recompra en 1 clic. |
| → llama a | `setCatalogCategory(cat)` (del padre) | Cambiar de categoría. |
| → usa | `formatCOP` | Precios. |

## Props
| Prop | Qué es | Viene de |
|---|---|---|
| `catalog` | Productos activos | `products` del almacén (vía el padre) |
| `orderHistory` | Pedidos del cliente | `orders` del almacén |
| `inventory` | Insumos con stock | Para avisar si algún ingrediente se agotó. |
| `storeConfig` | Ajustes (categorías) | |
| `catalogCategory` / `setCatalogCategory` | Categoría elegida | Estado del padre |
| `openCustomizer`, `reorder` | Funciones del padre | |

## Variables
| Variable | Qué es |
|---|---|
| `lastOrder` | El pedido más reciente (ordena por fecha). Si existe, aparece el botón "Pedir lo mismo de nuevo". |
| `getProductImage(url)` | Imagen del producto o una de ejemplo. |
| `configuredCategories` | Categorías del admin. Si no hay, usa una lista fija de ejemplo (Hamburguesas de Pan, Perros Calientes...). |
| `availableCategories` | `'Todas'` + las categorías que tienen productos. |
| `filteredCatalog` | Productos de la categoría elegida. Si un producto no tiene categoría, se adivina por su nombre. |

Es la misma lógica de categorías que `Landing.tsx`.
