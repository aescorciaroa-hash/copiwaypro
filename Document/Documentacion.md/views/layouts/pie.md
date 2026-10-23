# views/layouts/pie.php
¿No entiendes una palabra? Mira el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Es la parte de abajo de todas las páginas.

## ¿Qué hace?
- carga React (main.js)

## ¿Con qué se conecta?
- **La cargan:** todas las vistas de `views/paginas/`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pie HTML: carga el JavaScript de la app de React."* |
| 5 | `$rutaAssets = dirname(__DIR__, 2) . '/public/assets';` | Guarda en `$rutaAssets` la carpeta `public/assets` (donde está React compilado). |
| 6 | `$verJs = filemtime($rutaAssets . '/main.js');` | Guarda en `$verJs` la fecha en que cambió `main.js`, para que el navegador baje la versión nueva. |
| 7 | `?>` | `?>` cierra el PHP; lo que sigue es HTML. |
| 8 | `</div>` | Cierra el `<div id="app">` que se abrió en `cabecera.php`. |
| 9 | `<script type="module" src="<?= rutaBase() ?>/assets/main.js?v=<?= $verJs ?>"></script>` | Carga React (`main.js`). Cuando carga, `src/main.tsx` dibuja la pantalla dentro del `<div id="app">`. `?v=` lleva la fecha para no usar una versión vieja. |
| 10 | `</body>` | Cierra el cuerpo de la página. |
| 11 | `</html>` | Cierra la página. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | ninguna página abre |
| el `<script>` de main.js | la página sale en blanco (no carga React) |
