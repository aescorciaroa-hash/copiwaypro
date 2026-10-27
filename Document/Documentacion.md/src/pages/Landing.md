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
| 1 | Hero principal (título grande y botones). Abajo tiene un **desvanecido final** (`bg-gradient-to-t from-gray-50`, en oscuro `from-stone-950`) que termina en el color exacto de la página, para que no se vea una raya al pasar a la barra de valores. | — |
| 2 | Barra de valores (4 tarjetas: Entrega Rápida, Ingredientes Frescos, Hecho al Momento, Pago 100% Seguro). Sin franja de color: luces naranja y ámbar borrosas y una cuadrícula de puntos que se desvanece en los bordes (`mask-image`). Las tarjetas no tienen borde; al pasar el mouse suben un poco y les aparece un halo naranja detrás. Se dibujan con un `.map()` sobre una lista de 4 objetos. | — |
| 3 | Nuestro menú: pestañas de categorías + tarjetas de productos con botón para pedir | `menu` |
| 4 | Nuestra historia. Sin franja de color ni líneas arriba y abajo: luces borrosas y cuadrícula de puntos que se desvanece (igual al login). | `nosotros` |
| 5 | Testimonios. Tarjetas sin borde con sombra suave; al pasar el mouse suben un poco y les aparece un halo naranja. | `testimonios` |
| 6 | Contáctanos: 4 tarjetas de datos, formulario y mapa, todos sin borde y con sombra suave. Sin franja de color: luces borrosas de fondo. | `contacto` |

- El **formulario de contacto** solo muestra un `alert(...)`: no envía nada al servidor.
- El **mapa** está centrado en `[2.9273, -75.2818]` (Neiva) con mapas de OpenStreetMap. En modo oscuro usa la clase `leaflet-dark-tiles` de `index.css`.

```tsx
{categories.map(cat => (
  <button onClick={() => setActiveCategory(cat)}>{cat}</button>
))}
```
Dibuja una pestaña por categoría. Al tocarla cambia `activeCategory`, React vuelve a calcular
`filteredProducts` y redibuja la lista.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../Landing"` porque lo importan: `src/main.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
