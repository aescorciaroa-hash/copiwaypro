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
