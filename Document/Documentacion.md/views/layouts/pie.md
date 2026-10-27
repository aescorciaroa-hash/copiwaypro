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
| 2-8 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice que `main.js` va **sin `?v=`** a propósito (ver abajo). |
| 9 | `?>` | `?>` cierra el PHP; lo que sigue es HTML. |
| 10 | `</div>` | Cierra el `<div id="app">` que se abrió en `cabecera.php`. |
| 11 | `<script type="module" src="<?= rutaBase() ?>/assets/main.js"></script>` | Carga React (`main.js`). Cuando carga, `src/main.tsx` dibuja la pantalla dentro del `<div id="app">`. |
| 12 | `</body>` | Cierra el cuerpo de la página. |
| 13 | `</html>` | Cierra la página. |

### ¿Por qué `main.js` va sin `?v=fecha`?
Los archivos de cada pantalla (`assets/chunks/...`) **importan `main.js`** para usar React y el tema.
Lo piden con la dirección exacta `assets/main.js`. Si aquí se cargara `main.js?v=123`, para el navegador
serían **dos archivos distintos**: React arrancaría dos veces y la página saldría **en negro** con el error
`useTheme must be used within a ThemeProvider`.

Para que igual llegue la versión nueva después de `npm run build`, `public/.htaccess` le pone a `main.js`
`Cache-Control: no-cache`: el navegador lo guarda, pero **siempre pregunta si cambió**. Si no cambió, el
servidor responde "304, es el mismo" sin volver a enviarlo (es muy rápido).

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | ninguna página abre |
| el `<script>` de main.js | la página sale en blanco (no carga React) |
| si se le vuelve a poner `?v=...` a main.js | **la página sale en negro**: React arranca dos veces (ver arriba) |
