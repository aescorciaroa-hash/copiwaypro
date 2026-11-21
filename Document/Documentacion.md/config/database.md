# config/database.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Conecta el sistema con la base de datos MySQL.

## ¿Qué hace?
- revisa si corre en Windows (tu computador) o en Linux (Hostinger)
- guarda los datos de conexión que tocan ($host, $user, $password, $bd, $port)
- abre la conexión y la deja en $conn
- permite tildes y ñ (utf8mb4)
- usa la hora de Colombia
- si no se puede conectar, muestra "Error de Conexion"

## ¿Con qué se conecta?
- **Lo carga:** `public/index.php` (una vez para todo el sistema) y `sql/create-admin.php`.
- **Lo usan:** todos los modelos, con `global $conn;`.

<!-- conexiones-y-preguntas:inicio -->

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué se conecta este archivo?**  
Con MySQL usando `new mysqli(...)`. En tu computador: servidor `127.0.0.1`, puerto `3306`, usuario `root`, base de datos `hamburguer_copiway`. En Hostinger: los datos del archivo `datos_bd.php`, que está afuera de `public_html` y no se sube a GitHub.

**¿Cómo llega la conexión a los modelos?**  
`public/index.php` hace `require_once` de este archivo y crea `$conn`. Cada modelo hace `global $conn;` en su constructor.

**¿Por qué una sola conexión?**  
Para no abrir una conexión por cada modelo. Todos comparten la misma `$conn` durante la petición.

**¿Para qué `set_charset("utf8mb4")`?**  
Para que tildes, ñ y emojis se guarden y se lean bien.

**¿Para qué `SET time_zone = '-05:00'`?**  
Para que las fechas de MySQL (`NOW()`) salgan con la hora de Colombia.

**¿Qué pasa si MySQL está apagado o la clave está mal?**  
El `catch` atrapa el error y `die()` muestra *"Error de Conexion: ..."*. No carga nada más.

**¿Dónde cambio la base de datos o la clave?**  
Aquí mismo: variables `$bd` y `$password`. Las de arriba del `if` son las de tu computador. Las de Hostinger se cambian en el archivo `datos_bd.php` del servidor (ver la [guía 19](../GuiasDelProyecto/General/19-subir-a-hostinger.md)).

**¿Cómo sabe si está en mi computador o en Hostinger?**  
Con `PHP_OS_FAMILY`: tu computador usa Windows y el servidor de Hostinger usa Linux.

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica cuándo se usan los datos de Laragon y cuándo los de Hostinger. |
| 5 | `if (PHP_OS_FAMILY == "Windows") {` | `PHP_OS_FAMILY` = el sistema operativo donde corre PHP. Si es `"Windows"` (tu computador con Laragon), usa los datos de abajo. |
| 6 | `$host = "127.0.0.1";` | Crea la variable `$host` con la dirección de MySQL. `127.0.0.1` es tu propio computador. |
| 7 | `$user = "root";` | Crea la variable `$user` con el usuario de MySQL. En Laragon es `root`. |
| 8 | `$password = "";` | Crea la variable `$password` con la contraseña de MySQL. En Laragon está vacía (`""`). |
| 9 | `$bd = "hamburguer_copiway";` | Crea la variable `$bd` con el nombre de la base de datos del proyecto. |
| 10 | `} else {` | `else` = "si no". Si no es Windows, está en Hostinger. |
| 11 | `require __DIR__ . "/../../datos_bd.php";` | Trae el archivo `datos_bd.php`, que crea `$host`, `$user`, `$password` y `$bd` con los datos de Hostinger. `__DIR__` = la carpeta `config/`; `/../../` = sube dos carpetas, quedando afuera de `public_html`. Ese archivo no está en GitHub para que la clave no sea pública. |
| 12 | `}` | Cierra el `if / else`. |
| 13 | `$port = 3306;` | Crea la variable `$port` con el puerto de MySQL (por donde se conecta). Es 3306 en los dos lados. |
| 15 | `try {` | `try` = "intenta hacer lo de adentro". Si algo falla, salta al `catch` de abajo. |
| 16 | `$conn = new mysqli($host, $user, $password, $bd, $port);` | Abre la conexión a MySQL con los 5 datos de arriba y la guarda en `$conn`. **Todos los modelos usan esta `$conn`** (con `global $conn;`). |
| 17 | `$conn->set_charset("utf8mb4");` | Le dice a MySQL que use `utf8mb4`, para que se guarden bien las tildes, la ñ y los emojis. |
| 18 | `$conn->query("SET time_zone = '-05:00'");` | Le dice a MySQL que use la hora de Colombia (`-05:00`), para que las horas de los pedidos salgan bien. |
| 19 | `} catch (mysqli_sql_exception $e) {` | `} catch (...) {` = cierra el `try` y dice qué hacer si la conexión falló. `$e` guarda el error. |
| 20 | `die("Error de Conexion: " . $e->getMessage());` | `die(...)` muestra "Error de Conexion:" más el error, y detiene todo. `.` une los dos textos. `$e->getMessage()` es el mensaje del error. |
| 21 | `}` | Cierra el `catch`. |
| 22 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | nada funciona (`Failed to open stream`) |
| `datos_bd.php` en Hostinger | en Hostinger sale `Failed to open stream ... datos_bd.php`; en tu computador no pasa nada |
| una variable ($host, $user...) | no se conecta: sale `Undefined variable` y `Error de Conexion` |
| `set_charset("utf8mb4")` | las tildes y la ñ se ven dañadas (`Ã±`); no sale error |
| `SET time_zone` | las horas de los pedidos quedan corridas; no sale error |
| el `try / catch` | si MySQL está apagado sale el error largo de PHP |
