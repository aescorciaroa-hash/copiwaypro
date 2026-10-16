# public/index.php

## ¿Para qué sirve?
Es la **puerta de entrada** de toda la aplicación. Cada petición (abrir una página o llamar a la
API) pasa primero por este archivo. Él prepara todo lo necesario y después le pasa la petición al
router.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo llama | `.htaccess` (Apache) o `public/server-router.php` (start.bat) | Toda dirección que no sea un archivo real termina aquí. |
| → usa | `vendor/autoload.php` | Carga PHPMailer y web-push (librerías de Composer). |
| → usa | `config/database.php` | Crea `$conn` y la función `env()`. |
| → usa | `config/app.php` | Devuelve `$config` (zona horaria, etc.). |
| → usa | `app/Core/helpers.php` | Funciones de ayuda y el router. |
| → usa | `app/Core/Session.php`, `app/Core/Auth.php` | Sesión y usuario conectado. |
| → envía a | `despacharRuta()` / `despacharPagina()` | Deciden qué controlador responde. |

## Variables importantes
| Variable | De dónde viene | Para qué sirve | A dónde va |
|---|---|---|---|
| `$conn` | Se crea en `config/database.php` | Conexión a MySQL | Todos los modelos la toman con `global $conn;` |
| `$config` | `return [...]` de `config/app.php` | Configuración general | Aquí se usa `$config['zona_horaria']` |
| `$ruta` | Se calcula con `$_SERVER['REQUEST_URI']` | Dirección pedida sin la carpeta del proyecto (`/api/products`) | Se pasa a `despacharRuta()` o `despacharPagina()` |
| `$_SERVER['REQUEST_METHOD']` | Lo llena PHP solo | Método HTTP (`GET`, `POST`...) | Se pasa a `despacharRuta()` |

## Código explicado

### 1. Librerías de Composer
```php
if (is_file(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
}
```
- Composer es el instalador de librerías de PHP. Aquí se usan dos: **PHPMailer** (correos) y
  **web-push** (notificaciones).
- `is_file(...)` revisa si el archivo existe. Si todavía no se ejecutó `composer install`, la app
  funciona igual, pero sin correos ni notificaciones.

### 2. Cargar los archivos base
```php
require_once __DIR__ . '/../config/database.php';
$config = require __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../app/Core/helpers.php';
require_once __DIR__ . '/../app/Core/Session.php';
require_once __DIR__ . '/../app/Core/Auth.php';
```
- `database.php` crea la conexión `$conn` a MySQL.
- `app.php` **devuelve** un arreglo de configuración, por eso se guarda en `$config`.
- `helpers.php`, `Session.php` y `Auth.php` traen las funciones y clases que se usan en todo el sistema.

### 3. Preparar la aplicación
```php
configurarManejadorErrores();
date_default_timezone_set($config['zona_horaria']);
configurarSeguridadHttp();
Session::start();
```
| Línea | Qué hace |
|---|---|
| `configurarManejadorErrores()` | Si ocurre un error inesperado, responde un JSON de error en vez de una pantalla rota. |
| `date_default_timezone_set(...)` | Usa la hora de Colombia (`America/Bogota`). |
| `configurarSeguridadHttp()` | Envía cabeceras de seguridad al navegador. |
| `Session::start()` | Inicia la sesión (para saber quién está conectado). |

### 4. Saber qué ruta pidió el navegador
```php
$ruta = quitarRutaBase(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$ruta = rtrim($ruta, '/') ?: '/';
```
- `$_SERVER['REQUEST_URI']` es la dirección pedida, por ejemplo `/copiwaypro/api/products?x=1`.
- `parse_url(..., PHP_URL_PATH)` se queda solo con la ruta: `/copiwaypro/api/products`.
- `quitarRutaBase()` quita la carpeta del proyecto: `/api/products`.
- `rtrim($ruta, '/')` quita la barra final (`/login/` → `/login`).

### 5. Enviar la petición al lugar correcto
```php
if (strpos($ruta, '/api') === 0) {
    despacharRuta($_SERVER['REQUEST_METHOD'], $ruta);
} else {
    despacharPagina($ruta);
}
```
- Si la ruta empieza con `/api` → es una petición de datos → `despacharRuta()` (usa `config/rutas.php`).
- Si no → es una página → `despacharPagina()` (usa `config/paginas.php`).
- `$_SERVER['REQUEST_METHOD']` es el método HTTP: `GET`, `POST`, `PUT`, `PATCH` o `DELETE`.
