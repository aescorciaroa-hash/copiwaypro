# config/database.php

## ¿Para qué sirve?
1. Lee el archivo **`.env`** (donde están el usuario, la clave y el nombre de la base de datos).
2. Crea la función `env()` para leer esos valores desde cualquier parte.
3. Abre la conexión a MySQL y la guarda en la variable **`$conn`**.

Todos los modelos usan esa misma `$conn` con `global $conn;` en su constructor.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `public/index.php`, `bin/create-admin.php`, y cada controlador con `require_once` | Necesitan `$conn` y `env()`. |
| → lee | `.env.example` y `.env` | Los datos de conexión y configuración. |
| → la usan | todos los modelos y services (`global $conn;`) | Para hacer consultas. |
| → la usan | `config/app.php`, `Session.php`, `helpers.php`, `IntentoLogin.php`, `PagoService.php`... | Llaman a `env('...')` para leer valores del `.env`. |

## Variables importantes
| Variable | De dónde viene | Para qué sirve | A dónde va |
|---|---|---|---|
| `$raizProyecto` | `dirname(__DIR__)`: la carpeta de arriba de `config/` | Saber dónde está el `.env` | Solo se usa aquí. |
| `$env` | La unión de `.env.example` + `.env` | Tener todas las claves del `.env` | Se copia a `$_ENV` |
| `$_ENV` | Variable especial de PHP | Guardar los valores para leerlos después | La lee la función `env()` |
| `$conn` | `new mysqli(...)` | **La conexión a MySQL** | Todos los modelos: `global $conn; $this->conn = $conn;` |

## Código explicado

### Función `leerEnv($ruta)`
Lee un archivo `.env` línea por línea y devuelve un arreglo.

Un `.env` se ve así:
```
DB_HOST=127.0.0.1
DB_NAME=hamburguer_copiway
# esto es un comentario
```
```php
foreach (file($ruta, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
```
`file()` lee el archivo y devuelve cada línea en un arreglo, sin las líneas vacías.

```php
if ($linea === '' || $linea[0] === '#' || strpos($linea, '=') === false) {
    continue;
}
```
Salta los comentarios (`#`) y las líneas que no tienen `=`. `continue` pasa a la siguiente línea.

```php
list($clave, $valor) = explode('=', $linea, 2);
```
`explode` corta el texto en el primer `=`: `"DB_HOST=127.0.0.1"` → `$clave = "DB_HOST"`, `$valor = "127.0.0.1"`.

Después se quitan las comillas si el valor las tiene (`"hola"` → `hola`).

### Cargar los valores
```php
$env = array_merge(leerEnv($raizProyecto . '/.env.example'), leerEnv($raizProyecto . '/.env'));
```
Primero lee `.env.example` (valores por defecto) y encima `.env` (tus valores reales).
`array_merge` hace que los del `.env` reemplacen a los del ejemplo.

```php
foreach ($env as $clave => $valor) {
    if (getenv($clave) === false) { putenv($clave . '=' . $valor); }
    if (!isset($_ENV[$clave])) { $_ENV[$clave] = $valor; }
}
```
Guarda cada valor en las variables de entorno de PHP (`$_ENV`) para poder leerlos después.

### Función `env($clave, $porDefecto)`
```php
env('DB_HOST', '127.0.0.1')
```
Devuelve el valor de esa clave o, si no existe, el valor por defecto. Además convierte los textos
`'true'` y `'false'` en booleanos de verdad (`true` / `false`).

### La conexión
```php
try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli(env('DB_HOST', ...), env('DB_USER', ...), env('DB_PASS', ...), env('DB_NAME', ...), (int) env('DB_PORT', 3306));
    $conn->set_charset('utf8mb4');
    $conn->query("SET time_zone = '-05:00'");
} catch (mysqli_sql_exception $e) { ... }
```
| Línea | Qué hace |
|---|---|
| `mysqli_report(...)` | Hace que cualquier error de MySQL lance una excepción (así se puede atrapar con `catch`). |
| `new mysqli(host, usuario, clave, base, puerto)` | Abre la conexión. |
| `set_charset('utf8mb4')` | Permite tildes, ñ y emojis. |
| `SET time_zone = '-05:00'` | MySQL usa la hora de Colombia. |
| `catch` | Si no se pudo conectar: guarda el error en el log y responde un mensaje genérico (nunca muestra la clave ni datos técnicos). |
