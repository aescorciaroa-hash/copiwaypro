# config/app.php

## ¿Para qué sirve?
Guarda la configuración general de la aplicación. No ejecuta nada: solo **devuelve un arreglo**.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `public/index.php` (`$config = require ...`) | Para usar `$config['zona_horaria']`. |
| → usa | `env()` de `config/database.php` | Lee valores del `.env` (`APP_ENV`, `APP_DEBUG`, `APP_TIMEZONE`...). |

## Código explicado
```php
return [
    'nombre' => 'CopiwayPRO',
    'entorno' => env('APP_ENV', 'production'),
    'debug' => env('APP_DEBUG', false),
    'zona_horaria' => env('APP_TIMEZONE', 'America/Bogota'),
    'ruta_base' => env('APP_BASE_PATH', ''),
];
```
- `return [...]` hace que quien carga el archivo reciba el arreglo:
  `$config = require 'config/app.php';`
- Cada valor sale del `.env` con `env()`; si no está, usa el valor por defecto (segundo parámetro).

| Clave | Para qué |
|---|---|
| `nombre` | Nombre de la app. |
| `entorno` | `local` (tu computador) o `production` (servidor real). |
| `debug` | Si es `true`, los errores muestran más detalle. |
| `zona_horaria` | Se usa en `public/index.php` con `date_default_timezone_set()`. |
| `ruta_base` | Carpeta del proyecto si no se detecta sola. |

**Importante:** `database.php` se carga antes que este archivo, porque aquí se usa `env()`.
