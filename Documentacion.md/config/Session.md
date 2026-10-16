# config/Session.php

## ¿Para qué sirve?
Es la clase **`Session`**: ayudas para manejar la sesión de PHP (`$_SESSION`) y el token CSRF.
Todos sus métodos son **estáticos**, así que se usan sin `new`:
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
| → usa | Sus constantes `NOMBRE` y `DURACION_MINUTOS`, y `rutaBase()` (`helpers.php`) | Nombre, duración y ruta de la cookie. |

## Variables importantes
| Variable | Para qué sirve | Quién la usa |
|---|---|---|
| `$_SESSION` | Arreglo especial de PHP donde se guardan los datos de la sesión | Todo el sistema |
| `$_SESSION['_csrf']` | Token CSRF del usuario | `verificarCsrf()` en `helpers.php` |
| `$_SESSION['usuario_id']`, `$_SESSION['usuario_rol']` | Quién está conectado (los guarda `Auth::login()`) | La clase `Auth` |
| `$https` | `true` si la página se abrió con HTTPS | Opción `secure` de la cookie |

## Constantes
| Constante | Valor | Para qué |
|---|---|---|
| `NOMBRE` | `'copiway_session'` | Nombre de la cookie de sesión. |
| `DURACION_MINUTOS` | `120` | Minutos que dura la sesión. |

Se leen con `self::NOMBRE` y `self::DURACION_MINUTOS`.

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
    'lifetime' => self::DURACION_MINUTOS * 60,
    'path'     => rutaBase() . '/',
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Lax',
]);
```
| Opción | Significado |
|---|---|
| `lifetime` | Cuánto dura la cookie (minutos de `DURACION_MINUTOS` × 60 = segundos). |
| `path` | La cookie solo vale dentro de la carpeta del proyecto. |
| `secure` | Si la página usa HTTPS, la cookie solo viaja por HTTPS. |
| `httponly` | JavaScript no puede leer la cookie (protege contra robo). |
| `samesite` | Otros sitios no pueden enviar la cookie. |

Después pone el nombre de la sesión (`session_name(self::NOMBRE)`) y la arranca (`session_start`).

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

## ¿Qué pasa si se borra?

| Si se borra… | Qué pasa | Error que aparece |
|---|---|---|
| **El archivo completo** | Nada funciona: `public/index.php` llama a `Session::start()` en cada petición. | `Failed to open stream` (…`config/Session.php`) |
| `start()` | Nada funciona. | `Call to undefined method Session::start()` |
| `csrf()` | No abren las páginas y no se puede iniciar sesión (React no recibe el token). | `Call to undefined method Session::csrf()` |
| `destroy()` | El botón "Cerrar sesión" falla. | `Call to undefined method Session::destroy()` (en `Auth::logout()`) |
| Las constantes `NOMBRE` o `DURACION_MINUTOS` | Nada funciona. | `Undefined constant Session::...` |
