# src/pages/client/ingredientArt.tsx

## ¿Para qué sirve?
Contiene los **dibujos** (en SVG, sin imágenes) de cada ingrediente y de las hamburguesas
personalizadas: pan brioche, pan pretzel, carne, pollo, tocino, queso, tomate, lechuga, salsas...

## ¿Con qué se conecta?
| Dirección | Archivo | Qué usa |
|---|---|---|
| ← lo usa | `client/BuilderSection.tsx` | `artKind`, `BUN_KINDS`, `IngredientThumb`, `renderArtLayer`, `renderBunTop`, `renderBunBottom`: todo el dibujo del Creador Interactivo. |
| ← lo usa | `ClientDashboard.tsx` | `CustomBurgerThumb`, `IngredientThumb`. |
| ← lo usan | `client/ActiveOrdersSection.tsx`, `client/CheckoutSection.tsx`, `client/HistorySection.tsx` | `CustomBurgerThumb` para las hamburguesas personalizadas. |
| ← lo usan | `KitchenDashboard.tsx`, `AdminDashboard.tsx` | `CustomBurgerThumb` en las tarjetas de pedidos. |

## Tipos y funciones que exporta
| Nombre | Qué es |
|---|---|
| `ArtKind` | Los 16 tipos de dibujo: `'brioche' \| 'pretzel' \| 'patty' \| 'chicken' \| 'bacon' \| 'cheese' \| 'tomato' \| ...`. |
| `BUN_KINDS` | Los que son pan: `brioche` y `pretzel`. |
| `artKind(nombre)` | **Adivina el dibujo por el nombre del ingrediente** (ver abajo). |
| `renderArtLayer(tipo, indice)` | Dibuja una capa de relleno. |
| `renderBunTop(tipo)` / `renderBunBottom(tipo)` | Pan de arriba / de abajo. |
| `IngredientThumb({ name, image, size })` | Miniatura de un ingrediente: la foto si tiene; si no, el dibujo. |
| `CustomBurgerThumb({ ingredientNames, size })` | Miniatura de una hamburguesa completa a partir de la lista de ingredientes. |

## `artKind(nombre)` explicado
```ts
const n = (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
if (n.includes('brioche') || n.includes('sesamo')) return 'brioche';
if (n.includes('pollo')) return 'chicken';
...
return null;
```
1. Pasa el nombre a minúsculas y **quita las tildes** (`normalize('NFD')` separa la letra de la tilde y el `replace` borra las tildes): "Sésamo" → "sesamo".
2. Busca palabras clave en orden: "pollo" → pollo, "tocino"/"tocineta" → tocino, "carne" → carne, "queso" → queso...
3. Si no reconoce el ingrediente, devuelve `null` (no tiene dibujo).

Por eso los ingredientes nuevos del inventario se dibujan solos si su nombre contiene una de esas palabras.

## Constantes internas
| Constante | Para qué |
|---|---|
| `K` | Escala de las capas. |
| `PAD` | Espacio extra arriba/abajo de algunos dibujos. |
| `rnd(i, max)` | Número "aleatorio" que siempre da lo mismo para el mismo `i` (para que las semillas de ajonjolí no cambien de lugar en cada dibujo). |
| `waveTop`, `waveBack` | Dibujan bordes ondulados (lechuga, queso derretido). |
| `ART` | La tabla con el dibujo SVG de cada tipo. |
| `BUN_BOTTOM` | Colores del pan de abajo. |

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../ingredientArt"` porque lo importan: `src/pages/AdminDashboard.tsx`, `src/pages/ClientDashboard.tsx`, `src/pages/KitchenDashboard.tsx`, `src/pages/client/ActiveOrdersSection.tsx`, `src/pages/client/BuilderSection.tsx`, `src/pages/client/CheckoutSection.tsx`, `src/pages/client/HistorySection.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
