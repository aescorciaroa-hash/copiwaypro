# src/pages/Landing.tsx

## ¿Para qué sirve?
Es la **página de inicio** (`/`): presentación del restaurante, el menú con filtros por categoría, la
historia, testimonios, el formulario de contacto y un mapa con la ubicación.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `src/main.tsx` cuando `data-pagina="landing"` (`views/paginas/landing.php`) | |
| → usa | `Navbar.tsx` y `Footer.tsx` | Barra superior y pie. |
| → lee del almacén | `products`, `storeConfig`, `orders` (`useStore()`) | El menú, las categorías y las reseñas. Llegan por `/api/sync` (`SyncDatos.tsx`). |
| → usa | `formatCOP` (`lib/format.ts`) | Precios. |
| → usa | `useTheme()` | Mapa claro u oscuro. |
| → usa | `react-leaflet` | El mapa. |
| → enlaces | `rutaBase() + '/login'` | Botones para pedir (hay que iniciar sesión). |

## Variables
| Variable | Qué es | De dónde sale |
|---|---|---|
| `products`, `storeConfig`, `orders` | Datos del almacén | `useStore()` |
| `activeCategory` (`useState`) | Categoría elegida en las pestañas del menú | Empieza en `'Todas'` |
| `visibleProducts` | Solo productos activos | `products.filter(p => p.active)` |
| `configuredCategories` | Categorías creadas por el admin | `storeConfig.categories` |
| `allCategories` | Las del admin + las que tengan los productos, sin repetir | Se arma con `forEach` e `includes` |
| `categories` | Pestañas que se muestran: `'Todas'` + las que tienen productos | |
| `filteredProducts` | Productos de la categoría elegida | Se filtran con `activeCategory` |
| `dynamicReviews` | Hasta 3 pedidos reales con calificación y comentario | `orders.filter(o => o.rating && o.reviewText)` |
| `reviews` | Las reseñas reales; si no hay ninguna, 3 de ejemplo | |

## Funciones
| Función | Qué hace |
|---|---|
| `CustomZoomControl` | Botones + y − propios para el mapa (`useMap()` da acceso al mapa: `map.zoomIn()`). |
| `getProductImage(url)` | Si el producto no tiene foto, usa una de Unsplash; además reemplaza 3 fotos de ejemplo antiguas. |

Si un producto no tiene categoría, se adivina por el nombre (`'hamburguesa'` → "Hamburguesas de Pan", `'perro'` → "Perros Calientes"...).

## Secciones de la página
| # | Sección | `id` (para los enlaces del Navbar) |
|---|---|---|
| 1 | Hero principal (título grande y botones) | — |
| 2 | Barra de valores (calidad, rapidez...) | — |
| 3 | Nuestro menú: pestañas de categorías + tarjetas de productos con botón para pedir | `menu` |
| 4 | Nuestra historia | `nosotros` |
| 5 | Testimonios | `testimonios` |
| 6 | Contáctanos: formulario + mapa | `contacto` |

- El **formulario de contacto** solo muestra un `alert(...)`: no envía nada al servidor.
- El **mapa** está centrado en `[2.9273, -75.2818]` (Neiva) con mapas de OpenStreetMap. En modo oscuro usa la clase `leaflet-dark-tiles` de `index.css`.

```tsx
{categories.map(cat => (
  <button onClick={() => setActiveCategory(cat)}>{cat}</button>
))}
```
Dibuja una pestaña por categoría. Al tocarla cambia `activeCategory`, React vuelve a calcular
`filteredProducts` y redibuja la lista.
