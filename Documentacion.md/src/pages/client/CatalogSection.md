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
| `lastOrder` | El pedido más reciente (ordena por fecha). Si existe, aparece el botón redondo **"Pedir lo mismo de la última vez"** a la derecha del título "Catálogo de Productos" (en celular, debajo del título). Al tocarlo llama `reorder()` y mete al carrito los mismos productos. |
| `getProductImage(url)` | Imagen del producto o una de ejemplo. |
| `configuredCategories` | Categorías del admin. Si no hay, usa una lista fija de ejemplo (Hamburguesas de Pan, Perros Calientes...). |
| `availableCategories` | `'Todas'` + las categorías que tienen productos. |
| `filteredCatalog` | Productos de la categoría elegida. Si un producto no tiene categoría, se adivina por su nombre. |

Es la misma lógica de categorías que `Landing.tsx`.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../CatalogSection"` porque lo importan: `src/pages/ClientDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
