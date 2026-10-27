# public/index.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Es la entrada de todo el sistema: todas las direcciones pasan por aquí.

## ¿Qué hace?
- carga la conexión y la configuración
- carga helpers.php, Session.php y Auth.php
- comprime las respuestas (para que viajen más livianas)
- si la dirección empieza con /api, busca la ruta
- si no, busca la página

## ¿Con qué se conecta?
- **Lo llama:** `.htaccess` (Apache manda aquí todas las direcciones).
- **Carga:** `config/database.php`, `config/app.php`, `config/helpers.php`, `config/Session.php` y `models/Auth.php`.
- **Después llama a:** `despacharRuta()` (si es /api) o `despacharPagina()`.

<!-- conexiones-y-preguntas:inicio -->

### Preguntas que te pueden hacer sobre este archivo

**¿Cuál es el primer archivo que se ejecuta?**  
Este. `.htaccess` manda todas las direcciones aquí.

**¿Con qué se conecta?**  
Carga `config/database.php` (crea `$conn`), `config/app.php`, `config/helpers.php`, `config/Session.php` y `models/Auth.php`. No carga librerías de afuera: el proyecto no usa Composer.

**¿Cómo decide a dónde mandar la petición?**  
Si la dirección empieza con `/api` → `despacharRuta()`; si no → `despacharPagina()`.

**¿Por qué aquí se carga la base de datos y no en cada modelo?**  
Para crear una sola conexión y que todos los modelos la compartan con `global $conn;`.

**¿Hay que instalar librerías de PHP (Composer)?**  
No. El correo y las notificaciones están hechos con funciones que ya trae PHP (`openssl`, `curl`, `stream_socket_client`). No hay carpeta `vendor/`.

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Punto de entrada unico de la app (API y paginas)."* |
| 6 | `require_once __DIR__ . '/../config/database.php';` | Trae `config/database.php`: crea la conexión `$conn` que usan todos los modelos. |
| 7 | `$config = require __DIR__ . '/../config/app.php';` | Trae `config/app.php` y guarda sus ajustes en la variable `$config`. |
| 8 | `require_once __DIR__ . '/../config/helpers.php';` | Trae `config/helpers.php`: las funciones de todo el sistema (y el router). |
| 9 | `require_once __DIR__ . '/../config/Session.php';` | Trae `config/Session.php`: la clase `Session`. |
| 10 | `require_once __DIR__ . '/../models/Auth.php';` | Trae `models/Auth.php`: la clase `Auth` (saber quién inició sesión). |
| 12-13 | *(comentario)* | Comentario: explica la línea de abajo. |
| 14 | `if (extension_loaded('zlib') && !ini_get('zlib.output_compression')) {` | Si PHP tiene la herramienta de comprimir (`zlib`) y no está comprimiendo ya por su cuenta... |
| 15 | `ob_start('ob_gzhandler');` | ...**comprime todo lo que responda PHP** (páginas y datos de la API) antes de enviarlo. `ob_start` = "guarda lo que vayas a enviar"; `ob_gzhandler` = "comprímelo si el navegador lo acepta". Así los datos de `/api/sync` (que la app pide cada pocos segundos) viajan más livianos. |
| 16 | `}` | Cierra el `if`. |
| 18 | `configurarManejadorErrores();` | Llama a `configurarManejadorErrores()` (de `helpers.php`): prepara qué hacer si ocurre un error. |
| 19 | `date_default_timezone_set($config['zona_horaria']);` | Pone la hora de Colombia en PHP, con el ajuste `'zona_horaria'` de `$config`. |
| 20 | `configurarSeguridadHttp();` | Llama a `configurarSeguridadHttp()` (de `helpers.php`): agrega protecciones al navegador. |
| 21 | `Session::start();` | Inicia la sesión del usuario (`Session::start()` de `config/Session.php`). |
| 23 | `$ruta = quitarRutaBase(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');` | Toma la dirección que se pidió (`$_SERVER['REQUEST_URI']`), le quita lo que no sirve (`parse_url`) y la carpeta del proyecto (`quitarRutaBase` de `helpers.php`). La guarda en `$ruta`. `?: '/'` = si queda vacía, usa `/`. |
| 24 | `$ruta = rtrim($ruta, '/') ?: '/';` | Le quita la `/` del final a `$ruta` (`rtrim`). Si queda vacía, usa `/`. |
| 26 | `if (strpos($ruta, '/api') === 0) {` | Si `$ruta` empieza con `/api` (`strpos(...) === 0` = está al principio)... |
| 27 | `despacharRuta($_SERVER['REQUEST_METHOD'], $ruta);` | ...es una petición de la API: llama a `despacharRuta()` (de `helpers.php`) con el tipo de petición (`GET`, `POST`...) y la ruta. |
| 28 | `} else {` | Si no (`else`)... |
| 29 | `despacharPagina($ruta);` | ...es una página: llama a `despacharPagina()` (de `helpers.php`). |
| 30 | `}` | Cierra el `else`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | nada abre (404 de Apache) |
| el `require_once` de database.php | nada que use la base de datos: `Call to a member function prepare() on null` |
| el `require_once` de helpers.php | nada funciona: `Call to undefined function` |
| el `require_once` de Session.php o Auth.php | nada funciona: `Class "..." not found` |
| `Session::start();` | nadie queda con sesión: `No autenticado.` |
| `configurarSeguridadHttp();` | **no sale error**: solo se pierden protecciones |
| el bloque `ob_start('ob_gzhandler')` | **no sale error**: las respuestas viajan sin comprimir (más lento) |
