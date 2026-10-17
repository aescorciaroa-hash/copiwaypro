# views/layouts/cabecera.php
¿No entiendes una palabra? Mira el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Es la parte de arriba de todas las páginas.

## ¿Qué hace?
- carga los estilos (main.css)
- le pasa a React los datos del usuario y de la tienda
- crea el espacio donde React dibuja la pantalla

## ¿Con qué se conecta?
- **La cargan:** todas las vistas de `views/paginas/`.
- **Le pasa a React:** `window.__APP_BASE__` (la carpeta) y `window.__DATOS__` (usuario, token y ajustes).
- **React dibuja en:** `<div id="app" data-pagina="...">`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Cabecera HTML. $datos y $pagina vienen de la vista que incluye este archivo. ?v=filemtime() hace que el navegador descargue el CSS nuevo cuando cambia."* |
| 7 | `$rutaAssets = dirname(__DIR__, 2) . '/public/assets';` | Guarda en `$rutaAssets` la carpeta `public/assets` (donde está React compilado). `dirname(__DIR__, 2)` = sube dos carpetas desde `views/layouts/`. |
| 8 | `$verCss = filemtime($rutaAssets . '/main.css');` | Guarda en `$verCss` la fecha en que cambió `main.css` (`filemtime`). Se usa abajo para que el navegador baje la versión nueva. |
| 10 | `$datosJson = json_encode($datos, JSON_HEX_TAG \| JSON_HEX_AMP \| JSON_HEX_APOS \| JSON_HEX_QUOT);` | Convierte `$datos` (lo que arma `PaginaController`: usuario, rol, token y ajustes) a JSON y lo guarda en `$datosJson`. Las opciones `JSON_HEX_...` evitan que se cuele código raro. |
| 11 | `$baseJson = json_encode(rutaBase());` | Convierte la carpeta del proyecto (`rutaBase()` de `helpers.php`) a JSON y la guarda en `$baseJson`. |
| 13 | `header('Content-Type: text/html; charset=utf-8');` | Le dice al navegador que lo que sigue es una página HTML con tildes (`utf-8`). |
| 14 | `?><!doctype html>` | `?>` cierra el PHP; desde aquí sigue HTML normal. `<!doctype html>` = "esto es una página web". |
| 15 | `<html lang="es">` | Abre la página. `lang="es"` = está en español. |
| 16 | `<head>` | Abre la cabecera de la página (información que no se ve). |
| 17 | `<meta charset="UTF-8" />` | Usa letras con tildes (`UTF-8`). |
| 18 | `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` | Hace que la página se vea bien en el celular. |
| 19 | `<title>CopiwayPRO</title>` | El título que sale en la pestaña del navegador. |
| 20 | `<link rel="icon" href="<?= rutaBase() ?>/favicon.ico?v=3" sizes="any">` | Ícono de la pestaña. `<?= rutaBase() ?>` = escribe la carpeta del proyecto (con `<?=` se escribe un dato de PHP dentro del HTML). |
| 21 | `<link rel="icon" type="image/png" sizes="32x32" href="<?= rutaBase() ?>/favicon-32.png?v=3">` | Ícono de 32x32 en PNG. |
| 22 | `<link rel="icon" type="image/svg+xml" href="<?= rutaBase() ?>/favicon.svg?v=3">` | Ícono en SVG. |
| 23 | `<link rel="apple-touch-icon" href="<?= rutaBase() ?>/apple-touch-icon.png?v=3">` | Ícono para iPhone. |
| 24 | `<link rel="manifest" href="<?= rutaBase() ?>/manifest.json">` | Enlaza `manifest.json` (para instalar la app en el celular). |
| 25 | `<meta name="theme-color" content="#f97316">` | Color de la barra del celular (naranja). |
| 26 | `<link rel="stylesheet" href="<?= rutaBase() ?>/assets/main.css?v=<?= $verCss ?>">` | Carga los estilos (`main.css`). `?v=<?= $verCss ?>` le agrega la fecha para que el navegador baje siempre la versión nueva. |
| 27 | `<script>window.__APP_BASE__=<?= $baseJson ?>;window.__DATOS__=<?= $datosJson ?>;</script>` | Le pasa datos a React: `window.__APP_BASE__` = la carpeta del proyecto y `window.__DATOS__` = usuario, token de seguridad y ajustes. `src/servicios/api.ts` y `src/main.tsx` los leen. |
| 28 | `</head>` | Cierra la cabecera. |
| 29 | `<body>` | Abre el cuerpo de la página (lo que se ve). |
| 30 | `<div id="app" data-pagina="<?= htmlspecialchars($pagina, ENT_QUOTES) ?>">` | El espacio donde React dibuja la pantalla. `data-pagina` = qué pantalla (sale de `$pagina` de la vista). `htmlspecialchars` evita código raro. Este `<div>` se cierra en `pie.php`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | ninguna página abre |
| el `<link>` de main.css | las páginas salen sin estilos |
| `window.__DATOS__` | React no recibe el usuario ni el token: no se puede guardar nada |
| el `<div id="app">` | la página sale en blanco |
