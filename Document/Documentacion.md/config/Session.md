# config/Session.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja la sesión del usuario.

## ¿Qué hace?
- inicia la sesión
- cierra la sesión
- crea el token de seguridad

## ¿Con qué se conecta?
- **Lo carga:** `public/index.php` (en todas las peticiones).
- **Lo usan:** `public/index.php` (iniciar), `Auth` (cerrar sesión), `AuthController` y `PaginaController` (token).
- **Sus constantes:** `NOMBRE` (nombre de la sesión) y `DURACION_MINUTOS` (120).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Ayudas sencillas para manejar la sesion PHP y el token CSRF."* |
| 5 | `class Session` | Crea la clase `Session`: un grupo de funciones para manejar la sesión del usuario. |
| 6 | `{` | Abre la clase `Session`. |
| 7 | `const NOMBRE = 'copiway_session';` | Constante `NOMBRE`: el nombre de la sesión (`copiway_session`). Es un valor fijo. Se usa con `self::NOMBRE`. |
| 8 | `const DURACION_MINUTOS = 120;` | Constante `DURACION_MINUTOS`: cuánto dura la sesión (120 minutos = 2 horas). |
| 10 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Inicia la sesion con cookies seguras."* |
| 11 | `public static function start()` | Función `start()`: inicia la sesión. `public static` = se usa desde afuera como `Session::start()` (lo hace `public/index.php`). |
| 12 | `{` | Abre la función `start()`. |
| 13 | `if (session_status() === PHP_SESSION_ACTIVE) {` | `if` = si la sesión ya está iniciada (`session_status()` dice el estado)... |
| 14 | `return;` | ...`return` = sale de la función sin hacer nada más. |
| 15 | `}` | Cierra el `if`. |
| 17 | `$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')` | Crea `$https`: revisa si la página se abrió con `https` (conexión segura). `!empty(...)` = "no está vacío"; `&&` = "y"; `!==` = "es diferente de". |
| 18 | `\|\| (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');` | `\|\|` = "o". También revisa otra forma de saber si es `https`. `?? ''` = si no existe ese dato, usa vacío. |
| 20 | `session_set_cookie_params([` | `session_set_cookie_params([` = configura la "cookie" de la sesión (el dato que el navegador guarda para recordar al usuario). |
| 21 | `'lifetime' => self::DURACION_MINUTOS * 60,` | `'lifetime'` = cuánto dura: `DURACION_MINUTOS * 60` = en segundos. |
| 22 | `'path'     => rutaBase() . '/',` | `'path'` = en qué carpeta vale. `rutaBase()` (de `helpers.php`) da la carpeta del proyecto; `.` le une `/`. |
| 23 | `'domain'   => '',` | `'domain'` = vacío: sirve para cualquier dominio. |
| 24 | `'secure'   => $https,` | `'secure'` = solo se envía por `https` si la página es `https` (usa `$https` de arriba). |
| 25 | `'httponly' => true,` | `'httponly'` = JavaScript no puede leerla (más seguro). |
| 26 | `'samesite' => 'Lax',` | `'samesite'` = otras páginas no la pueden usar. |
| 27 | `]);` | Cierra la lista de la configuración. |
| 29 | `session_name(self::NOMBRE);` | Le pone el nombre a la sesión (`self::NOMBRE` = la constante de arriba). |
| 30 | `session_start();` | `session_start()` = inicia la sesión. Desde aquí se puede usar `$_SESSION`. |
| 31 | `}` | Cierra la función `start()`. |
| 33 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Borra todos los datos de la sesion y su cookie."* |
| 34 | `public static function destroy()` | Función `destroy()`: borra la sesión (cerrar sesión). La usa `Auth::logout()` en `models/Auth.php`. |
| 35 | `{` | Abre la función `destroy()`. |
| 36 | `$_SESSION = [];` | Vacía `$_SESSION` (borra todo lo que se sabía del usuario). |
| 37 | `if (ini_get('session.use_cookies')) {` | Si la sesión usa cookie... |
| 38 | `$p = session_get_cookie_params();` | ...trae la configuración de la cookie y la guarda en `$p`. |
| 39 | `setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);` | `setcookie(...)` borra la cookie del navegador: le pone una fecha del pasado (`time() - 42000`). |
| 40 | `}` | Cierra el `if`. |
| 41 | `session_destroy();` | `session_destroy()` = destruye la sesión en el servidor. |
| 42 | `}` | Cierra la función `destroy()`. |
| 44 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Token CSRF de la sesion; lo crea si no existe."* |
| 45 | `public static function csrf()` | Función `csrf()`: devuelve el token de seguridad. La usan `AuthController` y `PaginaController` para dárselo a React. |
| 46 | `{` | Abre la función `csrf()`. |
| 47 | `if (empty($_SESSION['_csrf'])) {` | Si la sesión todavía no tiene token (`empty` = está vacío)... |
| 48 | `$_SESSION['_csrf'] = bin2hex(random_bytes(32));` | ...lo crea: `random_bytes(32)` hace 32 datos al azar y `bin2hex` los vuelve texto. Lo guarda en `$_SESSION['_csrf']`. |
| 49 | `}` | Cierra el `if`. |
| 50 | `return $_SESSION['_csrf'];` | Devuelve el token. `verificarCsrf()` (en `helpers.php`) lo compara con el que manda React. |
| 51 | `}` | Cierra la función `csrf()`. |
| 52 | `}` | Cierra la clase `Session`. |
| 53 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | nada funciona |
| `start()` | nada funciona |
| `csrf()` | no abren las páginas y no se puede iniciar sesión |
| `destroy()` | no se puede cerrar sesión |
| una constante | nada funciona: `Undefined constant Session::...` |
