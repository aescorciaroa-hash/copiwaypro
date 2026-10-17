# public/index.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Es la entrada de todo el sistema: todas las direcciones pasan por aquí.

## ¿Qué hace?
- carga las librerías, la conexión y la configuración
- carga helpers.php, Session.php y Auth.php
- si la dirección empieza con /api, busca la ruta
- si no, busca la página

## ¿Con qué se conecta?
- **Lo llama:** `.htaccess` (Apache manda aquí todas las direcciones).
- **Carga:** `vendor/autoload.php`, `config/database.php`, `config/app.php`, `config/helpers.php`, `config/Session.php` y `models/Auth.php`.
- **Después llama a:** `despacharRuta()` (si es /api) o `despacharPagina()`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Punto de entrada unico de la app (API y paginas)."* |
| 6 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Librerias de Composer (web-push y PHPMailer), instaladas con "composer install"."* |
| 7 | `require_once __DIR__ . '/../vendor/autoload.php';` | Trae las librerías de Composer (PHPMailer y web-push) de la carpeta `vendor/`. `__DIR__` = la carpeta de este archivo (`public/`); `/../` = sube una carpeta. |
| 9 | `require_once __DIR__ . '/../config/database.php';` | Trae `config/database.php`: crea la conexión `$conn` que usan todos los modelos. |
| 10 | `$config = require __DIR__ . '/../config/app.php';` | Trae `config/app.php` y guarda sus ajustes en la variable `$config`. |
| 11 | `require_once __DIR__ . '/../config/helpers.php';` | Trae `config/helpers.php`: las funciones de todo el sistema (y el router). |
| 12 | `require_once __DIR__ . '/../config/Session.php';` | Trae `config/Session.php`: la clase `Session`. |
| 13 | `require_once __DIR__ . '/../models/Auth.php';` | Trae `models/Auth.php`: la clase `Auth` (saber quién inició sesión). |
| 15 | `configurarManejadorErrores();` | Llama a `configurarManejadorErrores()` (de `helpers.php`): prepara qué hacer si ocurre un error. |
| 16 | `date_default_timezone_set($config['zona_horaria']);` | Pone la hora de Colombia en PHP, con el ajuste `'zona_horaria'` de `$config`. |
| 17 | `configurarSeguridadHttp();` | Llama a `configurarSeguridadHttp()` (de `helpers.php`): agrega protecciones al navegador. |
| 18 | `Session::start();` | Inicia la sesión del usuario (`Session::start()` de `config/Session.php`). |
| 20 | `$ruta = quitarRutaBase(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');` | Toma la dirección que se pidió (`$_SERVER['REQUEST_URI']`), le quita lo que no sirve (`parse_url`) y la carpeta del proyecto (`quitarRutaBase` de `helpers.php`). La guarda en `$ruta`. `?: '/'` = si queda vacía, usa `/`. |
| 21 | `$ruta = rtrim($ruta, '/') ?: '/';` | Le quita la `/` del final a `$ruta` (`rtrim`). Si queda vacía, usa `/`. |
| 23 | `if (strpos($ruta, '/api') === 0) {` | Si `$ruta` empieza con `/api` (`strpos(...) === 0` = está al principio)... |
| 24 | `despacharRuta($_SERVER['REQUEST_METHOD'], $ruta);` | ...es una petición de la API: llama a `despacharRuta()` (de `helpers.php`) con el tipo de petición (`GET`, `POST`...) y la ruta. |
| 25 | `} else {` | Si no (`else`)... |
| 26 | `despacharPagina($ruta);` | ...es una página: llama a `despacharPagina()` (de `helpers.php`). |
| 27 | `}` | Cierra el `else`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | nada abre (404 de Apache) |
| el `require_once` de database.php | nada que use la base de datos: `Call to a member function prepare() on null` |
| el `require_once` de helpers.php | nada funciona: `Call to undefined function` |
| el `require_once` de Session.php o Auth.php | nada funciona: `Class "..." not found` |
| el `require_once` de vendor/autoload.php | falla al entregar un pedido (la notificación) |
| `Session::start();` | nadie queda con sesión: `No autenticado.` |
| `configurarSeguridadHttp();` | **no sale error**: solo se pierden protecciones |
