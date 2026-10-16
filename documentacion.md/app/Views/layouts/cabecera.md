# app/Views/layouts/cabecera.php

## ¿Para qué sirve?
Es la **primera mitad del HTML** de todas las páginas: el `<head>` (título, íconos, CSS) y la
apertura del `<div id="app">`, que es donde React dibuja toda la pantalla.

Su trabajo más importante es **pasarle datos de PHP a React** sin hacer una petición extra.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo incluye | cada vista de `app/Views/paginas/*.php` | Con `require`. |
| ← recibe | `$datos` (de `PaginaController.php`) y `$pagina` (de la vista) | Los datos para React. |
| → crea | `window.__DATOS__` y `window.__APP_BASE__` | Los leen `src/servicios/api.ts`, `src/main.tsx` y varios componentes. |
| → crea | `<div id="app" data-pagina="...">` | `src/main.tsx` lee `data-pagina` para saber qué pantalla mostrar. |
| → carga | `public/assets/main.css` | Los estilos compilados por Vite. |
| → carga | íconos y `manifest.json` de `public/` | Ícono de la pestaña y app instalable. |

## Variables
| Variable | De dónde viene | Para qué sirve | A dónde va |
|---|---|---|---|
| `$datos` | `PaginaController.php` → `mostrarVista()` → `extract()` | Usuario, rol, token CSRF y ajustes de la tienda | `window.__DATOS__` |
| `$pagina` | La vista que incluye este archivo (ej: `admin.php` pone `'admin'`) | Qué pantalla de React abrir | `data-pagina` del div |
| `$rutaAssets` | `dirname(__DIR__, 3) . '/public/assets'` (sube 3 carpetas) | Dónde está el CSS compilado | Para leer su fecha |
| `$verCss` | `filemtime()` = fecha en que se modificó `main.css` | Número de versión del CSS | `main.css?v=...` |
| `$datosJson` | `json_encode($datos, ...)` | Los datos convertidos a texto JSON | Dentro del `<script>` |
| `$baseJson` | `json_encode(rutaBase())` | La carpeta del proyecto (`"/copiwaypro"`) | `window.__APP_BASE__` |

## Código explicado
```php
$verCss = @filemtime($rutaAssets . '/main.css') ?: time();
```
- `filemtime` devuelve la fecha de modificación del archivo. El `@` oculta el aviso si el archivo no existe.
- `?: time()` → si no existe, usa la hora actual.
- Se agrega como `?v=...` al final de la dirección del CSS: cuando cambia el CSS, cambia el número, y el
  navegador descarga el nuevo en vez de usar el que tenía guardado.

```php
$datosJson = json_encode($datos, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
```
Los `JSON_HEX_...` convierten `<`, `>`, `&`, `'` y `"` en códigos seguros. Así, si un nombre tuviera
`</script>`, no rompería la página (protección contra XSS).

```php
header('Content-Type: text/html; charset=utf-8');
?><!doctype html>
```
Dice que la respuesta es HTML. `?>` cierra el PHP y empieza el HTML normal.

```html
<script>window.__APP_BASE__=<?= $baseJson ?>;window.__DATOS__=<?= $datosJson ?>;</script>
```
- `<?= ... ?>` es lo mismo que `<?php echo ...; ?>`: imprime el valor.
- Crea dos variables globales de JavaScript que React lee al arrancar.

```html
<div id="app" data-pagina="<?= htmlspecialchars($pagina, ENT_QUOTES) ?>">
```
- React se "monta" dentro de este div.
- `data-pagina` le dice qué pantalla mostrar. `htmlspecialchars` escapa caracteres especiales.
- El div **no se cierra aquí**: lo cierra `pie.php`.
