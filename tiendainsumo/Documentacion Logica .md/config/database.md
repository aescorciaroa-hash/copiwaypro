# config/database.php — Conexión a la base de datos

La conexión a la base de datos.

## Explicación palabra por palabra

- **`<?php`**: abre una etiqueta de PHP. Todo lo que está entre `<?php` y `?>` se interpreta como código PHP; fuera de eso, el servidor lo trata como texto plano (HTML).
- **`$host, $user, $password, $bd, $port`**: son variables. En PHP, toda variable empieza con `$`. No declaras su tipo (PHP es de tipado dinámico).
- **`'127.0.0.1'`**: la IP local ("localhost"). Le dice a PHP "la base de datos vive en esta misma máquina".
- **`$bd = 'bdtienda'`**: el nombre de la base de datos a la que te vas a conectar.
- **`$port = 3320`**: el puerto donde escucha MySQL (por defecto es 3306; aquí usan uno distinto).
- **`try { ... } catch (...) { ... }`**: manejo de excepciones. La idea: "intenta ejecutar esto; si algo sale mal, atrapa el error y haz algo controlado".
- **`new mysqli(...)`**: `mysqli` es una clase incluida en PHP para hablar con MySQL. `new` crea un objeto (instancia) a partir de esa clase. Los parámetros van en orden: host, usuario, contraseña, base de datos, puerto.
- **`$conn`**: la variable que guarda el objeto de conexión. De aquí en adelante, `$conn` es tu canal para enviar consultas SQL.
- **`die(...)`**: función que detiene la ejecución del script inmediatamente e imprime el texto que le pasas.
- **`.` (punto)**: operador de concatenación en PHP — pega dos strings. Aquí junta `'Error de Conexion: '` con `$e->getMessage()`.

## Conexión con el resto del proyecto

`$conn` es la variable clave que conecta este archivo con todo lo demás:

| Archivo | Qué hace con `$conn` |
|---|---|
| `config/database.php` | **Aquí nace**: se crea el objeto `mysqli`. |
| `models/Usuario.php` / `models/Rol.php` | `global $conn;` y luego `$this->conn = $conn;` — desde ahí siempre usan `$this->conn`, nunca `$conn` suelto. |
| `views/admin/dashboard.php` | Incluye `database.php` directamente y usa `$conn->query(...)` sin pasar por un modelo (única excepción a la regla de "las vistas no hacen SQL"). |

Ver [[../models/Usuario]], [[../views/admin/dashboard]].
