# config/database.php

## ¿Para qué sirve?
Abre la conexión a MySQL y la guarda en la variable **`$conn`**. Es igual a la de los trabajos de clase.

Todos los modelos usan esa misma `$conn` con `global $conn;` en su constructor.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `public/index.php`, `sql/create-admin.php`, cada controlador y cada modelo con `require_once` | Necesitan `$conn`. |
| → la usan | todos los modelos (`global $conn;`) | Para hacer consultas. |

## Variables importantes
| Variable | Valor | Para qué sirve |
|---|---|---|
| `$host` | `"127.0.0.1"` | Dónde está MySQL (tu computador). |
| `$user` | `"root"` | Usuario de MySQL (así viene Laragon). |
| `$password` | `""` | Contraseña de MySQL (vacía en Laragon). |
| `$bd` | `"hamburguer_copiway"` | Nombre de la base de datos. |
| `$port` | `3306` | Puerto de MySQL. |
| `$conn` | `new mysqli(...)` | **La conexión a MySQL**. Todos los modelos: `global $conn; $this->conn = $conn;` |

## Código explicado
```php
try {
    $conn = new mysqli($host, $user, $password, $bd, $port);
    $conn->set_charset("utf8mb4");
    $conn->query("SET time_zone = '-05:00'");
} catch (mysqli_sql_exception $e) {
    die("Error de Conexion: " . $e->getMessage());
}
```
| Línea | Qué hace |
|---|---|
| `new mysqli($host, $user, $password, $bd, $port)` | Abre la conexión. |
| `set_charset("utf8mb4")` | Permite tildes, ñ y emojis (sin esto los nombres con tilde se dañan). |
| `SET time_zone = '-05:00'` | MySQL usa la hora de Colombia (para los horarios de la tienda y los pedidos). |
| `catch (mysqli_sql_exception $e)` | Si no se pudo conectar (ej: MySQL apagado), `die()` detiene todo y muestra el error. |

Para cambiar de base de datos o de contraseña solo se editan las variables de arriba.
