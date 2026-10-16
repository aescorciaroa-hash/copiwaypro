# config/app.php

## ¿Para qué sirve?
Guarda la configuración general de la aplicación. No ejecuta nada: solo **devuelve un arreglo**.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `public/index.php` (`$config = require ...`) | Queda en la variable `$config`. |
| → lo leen | `rutaBase()` y `manejarError()` (`config/helpers.php`), `AuthController.php` | Con `global $config;`. |

## Código explicado
```php
return [
    'entorno' => 'local',
    'debug' => true,
    'zona_horaria' => 'America/Bogota',
    'ruta_base' => '',
];
```
- `return [...]` hace que quien carga el archivo reciba el arreglo:
  `$config = require 'config/app.php';`

| Clave | Para qué |
|---|---|
| `entorno` | `'local'` (tu computador) o `'production'` (servidor real). En `local`, si el correo no sale, la recuperación de contraseña devuelve el código para poder probar. |
| `debug` | Si es `true`, los errores muestran el detalle. **`false` en producción.** |
| `zona_horaria` | Se usa en `public/index.php` con `date_default_timezone_set()`. |
| `ruta_base` | Carpeta del proyecto si no se detecta sola (ej. `'/copiwaypro'`). Vacío = se detecta sola. |

## ¿Qué pasa si se borra?

| Si se borra… | Qué pasa | Error que aparece |
|---|---|---|
| **El archivo completo** | Nada funciona: `public/index.php` lo carga en cada petición. | `Failed to open stream` (…`config/app.php`) |
| La clave `'zona_horaria'` | Todas las respuestas salen con un aviso de PHP pegado al inicio: React no las puede leer y las pantallas se quedan sin datos. | `Undefined array key "zona_horaria"` (en `public/index.php`) |
| La clave `'ruta_base'` | Las respuestas salen con un aviso de PHP pegado y React no las puede leer: las pantallas se quedan sin datos. | `Undefined array key "ruta_base"` (en `rutaBase()` de `helpers.php`) |
| La clave `'debug'` | Mientras no haya errores no se nota; cuando ocurre uno, sale un segundo aviso y se pierde el detalle. | `Undefined array key "debug"` (en `manejarError()`) |
| La clave `'entorno'` | Recuperar contraseña sin correo configurado muestra un aviso. | `Undefined array key "entorno"` (en `AuthController::forgotPasswordRequest()`) |
