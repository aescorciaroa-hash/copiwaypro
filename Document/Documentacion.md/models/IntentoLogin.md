# models/IntentoLogin.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Bloquea el inicio de sesión de **un correo** después de 5 intentos fallidos en 1 minuto. Pasado ese minuto se desbloquea solo.

## ¿Qué hace?
- guarda cada intento de inicio de sesión
- cuando alguien entra bien, borra sus fallos (el conteo vuelve a 0)
- cuenta los intentos fallidos recientes **de ese correo** (no de todo el computador, así otro perfil puede entrar desde el mismo equipo)
- dice si ya hubo demasiados intentos

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `registrar()` | guarda cada intento de inicio de sesión; si salió bien, borra los fallos de ese correo | `AuthController::login()` |
| `contarFallosRecientes()` | cuenta los intentos fallidos de ese correo en el último minuto | `IntentoLogin::excedeLimite()` |
| `excedeLimite()` | dice si ese correo ya tuvo demasiados intentos | `AuthController::login()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/AuthController.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo IntentoLogin (limite de intentos fallidos de inicio de sesion)."* |
| 5 | `class IntentoLogin` | Crea la clase `IntentoLogin`: guarda los intentos de inicio de sesión y bloquea después de 5 fallos (tabla `INTENTO_LOGIN`). La usa `AuthController::login()`. |
| 6 | `{` | Abre la clase `IntentoLogin`. |
| 7 | `const MAXIMO_INTENTOS = 5;   // intentos fallidos permitidos...` | Constante `MAXIMO_INTENTOS`: cuántos fallos se permiten (5). |
| 8 | `const VENTANA_MINUTOS = 1;   // ...dentro de este minuto (pasado ese tiempo se desbloquea solo)` | Constante `VENTANA_MINUTOS`: en cuántos minutos se cuentan los fallos (1). También es lo que dura el bloqueo: los fallos de hace más de 1 minuto ya no cuentan. |
| 10 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 15 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 16 | `}` | Cierra la función `__construct()`. |
| 18 | `public function registrar($identificador, $ip, $exitoso)` | Método `registrar($identificador, $ip, $exitoso)`: guarda un intento de inicio de sesión. `$identificador` es el correo que se escribió. |
| 19 | `{` | Abre la función `registrar()`. |
| 20 | `$exito = $exitoso ? 1 : 0;` | Convierte `$exitoso` (sí/no) en `1` o `0` y lo guarda en `$exito`. `? :` = si / si no. |
| 21 | `$stmt = $this->conn->prepare("INSERT INTO INTENTO_LOGIN (identificador, ip, exitoso) VALUES (?, ?, ?)");` | Prepara la consulta: "guarda en `INTENTO_LOGIN` el correo, la IP y si salió bien". La IP se guarda solo como registro; ya no se usa para bloquear. |
| 22 | `$stmt->bind_param("ssi", $identificador, $ip, $exito);` | Llena los `?` de la consulta, en orden: `$identificador` (texto), `$ip` (texto), `$exito` (número entero). |
| 23 | `$stmt->execute();` | Ejecuta la consulta. |
| 24 | `$stmt->close();` | Cierra la consulta. |
| 26 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Si entro bien, se borran sus fallos: el conteo vuelve a empezar en 0."* |
| 27 | `if ($exitoso) {` | Si el intento salió bien (entró con la contraseña correcta)... |
| 28 | `$stmt = $this->conn->prepare("DELETE FROM INTENTO_LOGIN WHERE identificador = ? AND exitoso = 0");` | ...prepara la consulta: "borra los intentos **fallidos** (`exitoso = 0`) de ese correo". |
| 29 | `$stmt->bind_param("s", $identificador);` | Llena el `?` con el correo (`s` = texto). |
| 30 | `$stmt->execute();` | Ejecuta la consulta: los fallos se borran. |
| 31 | `$stmt->close();` | Cierra la consulta. |
| 32 | `}` | Cierra el `if`. |
| 33 | `}` | Cierra la función `registrar()`. |
| 35 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Fallos recientes de ese correo (no de todo el computador) dentro de la ventana de minutos."* |
| 36 | `public function contarFallosRecientes($identificador)` | Método `contarFallosRecientes($identificador)`: cuenta cuántas veces falló hace poco ese correo. |
| 37 | `{` | Abre la función `contarFallosRecientes()`. |
| 38 | `$minutos = self::VENTANA_MINUTOS;` | Guarda en `$minutos` el minuto de la constante. |
| 39 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "cuenta los intentos de ese correo que fallaron (`exitoso = 0`) en el último `?` minuto (`NOW() - INTERVAL ? MINUTE` = hace X minutos)". |
| 40 | `"SELECT COUNT(*) AS total FROM INTENTO_LOGIN` | ↑ (sigue la misma instrucción). `COUNT(*)` = cuenta las filas. |
| 41 | `WHERE identificador = ?` | ↑ Solo los de ese correo. Antes también contaba los de la misma IP (el mismo computador), y por eso bloqueaba a todos los perfiles del equipo. |
| 42 | `AND exitoso = 0` | ↑ Solo los fallidos. |
| 43 | `AND fecha_hora > (NOW() - INTERVAL ? MINUTE)"` | ↑ Solo los del último minuto. |
| 44 | `);` | ↑ (sigue la misma instrucción) |
| 45 | `$stmt->bind_param("si", $identificador, $minutos);` | Llena los `?` de la consulta, en orden: `$identificador` (texto) y `$minutos` (número entero). |
| 46 | `$stmt->execute();` | Ejecuta la consulta. |
| 47 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row`. |
| 48 | `$stmt->close();` | Cierra la consulta. |
| 49 | `return (int) $row['total'];` | Devuelve el total, como número entero. |
| 50 | `}` | Cierra la función `contarFallosRecientes()`. |
| 52 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"true si ese correo ya paso el maximo de intentos fallidos."* |
| 53 | `public function excedeLimite($identificador)` | Método `excedeLimite($identificador)`: dice si ese correo ya tuvo demasiados fallos. Lo usa `AuthController::login()`. |
| 54 | `{` | Abre la función `excedeLimite()`. |
| 55 | `$maximo = self::MAXIMO_INTENTOS;` | Guarda en `$maximo` el máximo de la constante (5). |
| 56 | `return $this->contarFallosRecientes($identificador) >= $maximo;` | Devuelve `true` si los fallos recientes son 5 o más (`>=`). |
| 57 | `}` | Cierra la función `excedeLimite()`. |
| 58 | `}` | Cierra la clase `IntentoLogin`. |
| 59 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código | `Failed to open stream` |
| el método `registrar()` | iniciar sesión | `Call to undefined method IntentoLogin::registrar()` |
| el método `contarFallosRecientes()` | iniciar sesión | `Call to undefined method IntentoLogin::contarFallosRecientes()` |
| el método `excedeLimite()` | iniciar sesión | `Call to undefined method IntentoLogin::excedeLimite()` |
| la constante `MAXIMO_INTENTOS` | lo que la usa dentro de la clase | `Undefined constant IntentoLogin::MAXIMO_INTENTOS` |
| la constante `VENTANA_MINUTOS` | lo que la usa dentro de la clase | `Undefined constant IntentoLogin::VENTANA_MINUTOS` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
