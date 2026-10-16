# public/server-router.php

## ¿Para qué sirve?
Solo se usa cuando se ejecuta el proyecto con **`start.bat`**, que usa el servidor que trae PHP
(`php -S localhost:8000`). Con Apache/Laragon este archivo no se usa (ahí hace este trabajo el
`.htaccess`).

Su trabajo: si el navegador pide un archivo que existe (una imagen o el JavaScript), lo entrega tal
cual. Si pide cualquier otra cosa, se la pasa a `index.php`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo llama | `start.bat` | Ejecuta `php -S localhost:8000 -t public public\server-router.php`. |
| → entrega | archivos de `public/` (`assets/main.js`, imágenes...) | Los sirve directamente. |
| → usa | `public/index.php` | Para todo lo demás. |

## Variables importantes
| Variable | De dónde viene | Para qué sirve |
|---|---|---|
| `$uri` | `$_SERVER['REQUEST_URI']` (lo llena PHP) | La ruta pedida, sin `?parametros`. |
| `$file` | `__DIR__` (carpeta `public/`) + `$uri` | Ruta completa del archivo en el disco, para ver si existe. |

## Código explicado
```php
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
```
Toma la ruta pedida, por ejemplo `/assets/main.js`.

```php
$file = __DIR__ . $uri;
if ($uri !== '/' && is_file($file)) {
    return false;
}
```
- Arma la ruta real del archivo dentro de `public/`.
- Si existe, `return false` le dice al servidor de PHP: *"entrégalo tú directamente"*.

```php
require __DIR__ . '/index.php';
return true;
```
Si no es un archivo, carga `index.php` para que la app responda (API o página).
