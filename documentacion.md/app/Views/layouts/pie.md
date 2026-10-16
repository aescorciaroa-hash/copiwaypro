# app/Views/layouts/pie.php

## ¿Para qué sirve?
Es la **segunda mitad del HTML**: cierra el `<div id="app">` que abrió `cabecera.php` y carga el
**JavaScript de React** (`main.js`).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo incluye | cada vista de `app/Views/paginas/*.php` | Después de `cabecera.php`. |
| → carga | `public/assets/main.js` | Toda la aplicación de React, compilada por Vite (`npm run build`). Su código fuente está en `src/`. |
| → usa | `rutaBase()` (`helpers.php`) | Para armar la dirección del archivo. |

## Variables
| Variable | Para qué |
|---|---|
| `$rutaAssets` | Carpeta `public/assets`. |
| `$verJs` | Fecha de modificación de `main.js`; se usa como versión (`main.js?v=...`) para que el navegador descargue el nuevo cuando cambia. |

## Código explicado
```html
    </div>
    <script type="module" src="<?= rutaBase() ?>/assets/main.js?v=<?= $verJs ?>"></script>
</body>
</html>
```
- `</div>` cierra el `<div id="app">`.
- `type="module"` = JavaScript moderno (con `import`).
- Al cargar `main.js`, se ejecuta `src/main.tsx`, que lee `data-pagina` y muestra la pantalla.
