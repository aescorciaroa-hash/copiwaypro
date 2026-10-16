# index.html (en la raíz del proyecto)

## ¿Para qué sirve?
Es la página que usa **solo el modo desarrollo** (`npm run dev`). En el sistema real (Laragon) **no se
usa**: allí el HTML lo generan `app/Views/layouts/cabecera.php` y `pie.php`.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | Vite (`npm run dev`, `npm run build`) como punto de partida |
| → carga | `src/main.tsx` |

## Código explicado
```html
<div id="app"></div>
<script type="module" src="/src/main.tsx"></script>
```
- `<div id="app">` es donde React dibuja la pantalla (igual que en `cabecera.php`).
- Aquí **no** hay `data-pagina` ni `window.__DATOS__`. Por eso, en desarrollo, se elige la pantalla
  con la dirección: `http://localhost:3000/?pagina=admin` (lo lee `src/main.tsx`).
- Al compilar, Vite genera una copia en `public/index.html`, pero `vite.config.ts` la borra.
