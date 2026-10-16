# src/index.css

## ¿Para qué sirve?
Los **estilos globales** de toda la aplicación: carga Tailwind CSS, la fuente, los colores de la
marca, el modo oscuro, la barra de desplazamiento y el mapa oscuro.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo importa | `src/main.tsx` (`import './index.css'`) |
| → al compilar queda en | `public/assets/main.css` (lo carga `cabecera.php`) |
| → la clase `dark` la pone | `context/ThemeContext.tsx` en la etiqueta `<html>` |
| → `.leaflet-dark-tiles` lo usan | los mapas (`MapSection.tsx`, `OrdersSection.tsx`, `DeliveryDashboard.tsx`) |

## Partes
| Código | Qué hace |
|---|---|
| `@import url('https://fonts.googleapis.com/...Inter...')` | Descarga la fuente **Inter** de Google Fonts. |
| `@import "tailwindcss";` | Activa todas las clases de Tailwind (`p-4`, `bg-orange-500`...). |
| `@variant dark (&:where(.dark, .dark *));` | Las clases `dark:...` funcionan cuando `<html>` tiene la clase `dark`. |
| `@theme { --color-brand-orange: #ff7000; ... }` | **Colores de la marca.** Crean clases como `bg-brand-orange` o `text-brand-brown`. |
| `html, body { ... }` | Fondo, color de texto y fuente de toda la página. |
| `html.dark { ... }` | Fondo casi negro en modo oscuro. |
| `.no-transitions` | Quita las animaciones por un instante al cambiar de tema (para que no "parpadee"). La usa `ThemeContext.tsx`. |
| `transition-duration: 80ms` | Cambios de color suaves y rápidos. |
| `.hide-scrollbar` | Clase para ocultar la barra de desplazamiento en listas horizontales. |
| `@keyframes shimmer`, `@keyframes dash` | Animaciones (brillo que pasa y línea que se dibuja). |
| `input[type="number"]::-webkit-...` | Quita las flechitas de los campos numéricos. |
| `::-webkit-scrollbar...` | Barra de desplazamiento delgada y naranja. |
| `.leaflet-dark-tiles .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) ... }` | **Mapa oscuro gratis:** invierte los colores del mapa de OpenStreetMap; `hue-rotate` hace que el agua siga azul y los parques verdes. |

`var(--color-bg-light)` = usar el valor de esa variable de CSS definida en `@theme`.
