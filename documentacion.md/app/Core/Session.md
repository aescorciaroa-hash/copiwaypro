# app/Core/Session.php

## ¿Para qué sirve?
Es la clase **`Session`**: ayudas para manejar la sesión de PHP (`$_SESSION`), el token CSRF y los
mensajes flash. Todos sus métodos son **estáticos**, así que se usan sin `new`:
`Session::start()`, `Session::csrf()`...

**¿Qué es la sesión?** Es un espacio en el servidor donde PHP recuerda datos de cada usuario entre
una petición y otra (por ejemplo, quién inició sesión). El navegador solo guarda una cookie con el
identificador.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← `Session::start()` | `public/index.php` | Inicia la sesión en cada petición. |
| ← `Session::csrf()` | `AuthController.php`, `PaginaController.php` | Le entregan el token a React. |
| ← `Session::destroy()` | `Auth::logout()` en `Auth.php` | Cerrar sesión. |
| ← `Session::flash()` | `verificarCsrf()` en `helpers.php` | Guardar un aviso. |
| → usa | `env()` (`database.php`) y `rutaBase()` (`helpers.php`) | Duración, nombre y ruta de la cookie. |

## Variables importantes
| Variable | Para qué sirve | Quién la usa |
|---|---|---|
| `$_SESSION` | Arreglo especial de PHP donde se guardan los datos de la sesión | Todo el sistema |
| `$_SESSION['_csrf']` | Token CSRF del usuario | `verificarCsrf()` en `helpers.php` |
| `$_SESSION['usuario_id']`, `$_SESSION['usuario_rol']` | Quién está conectado (los guarda `Auth::login()`) | La clase `Auth` |
| `$_SESSION['_flash']` | Mensajes flash pendientes | `Session::pullFlash()` |
| `$https` | `true` si la página se abrió con HTTPS | Opción `secure` de la cookie |

## Métodos

### `Session::start()`
Inicia la sesión con una cookie segura.
```php
if (session_status() === PHP_SESSION_ACTIVE) {
    return;
}
```
Si la sesión ya está iniciada, no hace nada.

```php
session_set_cookie_params([
    'lifetime' => (int) env('SESSION_LIFETIME', 120) * 60,
    'path'     => rutaBase() . '/',
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Lax',
]);
```
| Opción | Significado |
|---|---|
| `lifetime` | Cuánto dura la cookie (minutos del `.env` × 60 = segundos). |
| `path` | La cookie solo vale dentro de la carpeta del proyecto. |
| `secure` | Si la página usa HTTPS, la cookie solo viaja por HTTPS. |
| `httponly` | JavaScript no puede leer la cookie (protege contra robo). |
| `samesite` | Otros sitios no pueden enviar la cookie. |

Después pone el nombre de la sesión (`session_name`) y la arranca (`session_start`).

### `Session::destroy()`
Borra todo: vacía `$_SESSION`, borra la cookie (le pone una fecha pasada) y destruye la sesión.
Lo usa `Auth::logout()`.

### `Session::csrf()`
Devuelve el **token CSRF** del usuario. Si todavía no existe, lo crea:
```php
$_SESSION['_csrf'] = bin2hex(random_bytes(32));
```
`random_bytes(32)` genera 32 bytes al azar y `bin2hex` los convierte en texto (64 caracteres).
React envía este token en cada petición que cambia datos, y `verificarCsrf()` lo revisa.

### `Session::flash($type, $title, $message)` y `Session::pullFlash()`
- `flash` guarda un mensaje para mostrarlo en la siguiente pantalla.
- `pullFlash` lo devuelve y lo borra (para que no se repita al recargar).
