# config/database.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Conecta el sistema con la base de datos MySQL.

## ¿Qué hace?
- guarda los datos de conexión ($host, $user, $password, $bd, $port)
- abre la conexión y la deja en $conn
- permite tildes y ñ (utf8mb4)
- usa la hora de Colombia
- si no se puede conectar, muestra "Error de Conexion"

## ¿Con qué se conecta?
- **Lo carga:** `public/index.php` (una vez para todo el sistema) y `sql/create-admin.php`.
- **Lo usan:** todos los modelos, con `global $conn;`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2 | `$host = "127.0.0.1";` | Crea la variable `$host` con la dirección de MySQL. `127.0.0.1` es tu propio computador. |
| 3 | `$user = "root";` | Crea la variable `$user` con el usuario de MySQL. En Laragon es `root`. |
| 4 | `$password = "";` | Crea la variable `$password` con la contraseña de MySQL. En Laragon está vacía (`""`). |
| 5 | `$bd = "hamburguer_copiway";` | Crea la variable `$bd` con el nombre de la base de datos del proyecto. |
| 6 | `$port = 3306;` | Crea la variable `$port` con el puerto de MySQL (por donde se conecta). Normalmente es 3306. |
| 8 | `try {` | `try` = "intenta hacer lo de adentro". Si algo falla, salta al `catch` de abajo. |
| 9 | `$conn = new mysqli($host, $user, $password, $bd, $port);` | Abre la conexión a MySQL con los 5 datos de arriba y la guarda en `$conn`. **Todos los modelos usan esta `$conn`** (con `global $conn;`). |
| 10 | `$conn->set_charset("utf8mb4");` | Le dice a MySQL que use `utf8mb4`, para que se guarden bien las tildes, la ñ y los emojis. |
| 11 | `$conn->query("SET time_zone = '-05:00'");` | Le dice a MySQL que use la hora de Colombia (`-05:00`), para que las horas de los pedidos salgan bien. |
| 12 | `} catch (mysqli_sql_exception $e) {` | `} catch (...) {` = cierra el `try` y dice qué hacer si la conexión falló. `$e` guarda el error. |
| 13 | `die("Error de Conexion: " . $e->getMessage());` | `die(...)` muestra "Error de Conexion:" más el error, y detiene todo. `.` une los dos textos. `$e->getMessage()` es el mensaje del error. |
| 14 | `}` | Cierra el `catch`. |
| 15 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | nada funciona (`Failed to open stream`) |
| una variable ($host, $user...) | no se conecta: sale `Undefined variable` y `Error de Conexion` |
| `set_charset("utf8mb4")` | las tildes y la ñ se ven dañadas (`Ã±`); no sale error |
| `SET time_zone` | las horas de los pedidos quedan corridas; no sale error |
| el `try / catch` | si MySQL está apagado sale el error largo de PHP |
