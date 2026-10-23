# public/manifest.json

## ¿Para qué sirve?
Es el **manifiesto de la aplicación web**: le dice al celular cómo se ve la app si se **instala en la
pantalla de inicio** (nombre, ícono, colores). Así funciona casi como una app normal.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo enlaza | `views/layouts/cabecera.php` (`<link rel="manifest" ...>`) |
| → usa | `public/favicon.svg` como ícono |

## Campos
| Campo | Valor | Significado |
|---|---|---|
| `name` | `CopiwayPRO` | Nombre completo. |
| `short_name` | `Copiway` | Nombre corto (debajo del ícono). |
| `start_url` / `scope` | `.` | Abre en la carpeta del proyecto. |
| `display` | `standalone` | Se abre sin la barra del navegador, como una app. |
| `background_color` | `#ffffff` | Color de fondo al abrir. |
| `theme_color` | `#f97316` | Color naranja de la barra superior (el mismo de `<meta name="theme-color">`). |
| `icons` | `favicon.svg` | Ícono de la app. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | la página sigue funcionando; solo sale un error 404 de `manifest.json` en la consola del navegador y la app ya no se puede **instalar** en el celular con su nombre e ícono |
| un campo (ej. `icons`) | al instalarla, el celular usa un ícono o nombre por defecto |
