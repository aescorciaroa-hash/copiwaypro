# models/IntentoLogin.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Bloquea el inicio de sesión después de 5 intentos fallidos.

## ¿Qué hace?
- guarda cada intento de inicio de sesión
- cuenta los intentos fallidos recientes
- dice si ya hubo demasiados intentos

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `registrar()` | guarda cada intento de inicio de sesión | `AuthController::login()` |
| `contarFallosRecientes()` | cuenta los intentos fallidos recientes | `IntentoLogin::excedeLimite()` |
| `excedeLimite()` | dice si ya hubo demasiados intentos | `AuthController::login()` |

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
| 8 | `const VENTANA_MINUTOS = 15;  // ...dentro de estos minutos` | Constante `VENTANA_MINUTOS`: en cuántos minutos se cuentan (15). |
| 10 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 15 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 16 | `}` | Cierra la función `__construct()`. |
| 18 | `public function registrar($identificador, $ip, $exitoso)` | Método `registrar($identificador, $ip, $exitoso)`: guarda un intento de inicio de sesión. |
| 19 | `{` | Abre la función `registrar()`. |
| 20 | `$exito = $exitoso ? 1 : 0;` | Convierte `$exitoso` (sí/no) en `1` o `0` y lo guarda en `$exito`. `? :` = si / si no. |
| 21 | `$stmt = $this->conn->prepare("INSERT INTO INTENTO_LOGIN (identificador, ip, exitoso) VALUES (?, ?, ?)");` | Prepara la consulta: "guarda en `INTENTO_LOGIN` el correo, la IP y si salió bien". |
| 22 | `$stmt->bind_param("ssi", $identificador, $ip, $exito);` | Llena los `?` de la consulta, en orden: `$identificador` (texto), `$ip` (texto), `$exito` (número entero). |
| 23 | `$stmt->execute();` | Ejecuta la consulta. |
| 24 | `$stmt->close();` | Cierra la consulta. |
| 25 | `}` | Cierra la función `registrar()`. |
| 27 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Fallos recientes por correo o por IP dentro de la ventana de minutos configurada."* |
| 28 | `public function contarFallosRecientes($identificador, $ip)` | Método `contarFallosRecientes($identificador, $ip)`: cuenta cuántas veces falló hace poco ese correo o esa IP. |
| 29 | `{` | Abre la función `contarFallosRecientes()`. |
| 30 | `$minutos = self::VENTANA_MINUTOS;` | Guarda en `$minutos` los 15 minutos de la constante. |
| 31 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "cuenta los intentos con ese correo **o** esa IP, que fallaron (`exitoso = 0`) y que fueron en los últimos `?` minutos (`NOW() - INTERVAL ? MINUTE` = hace X minutos)". |
| 32 | `"SELECT COUNT(*) AS total FROM INTENTO_LOGIN` | ↑ (sigue la misma instrucción) |
| 33 | `WHERE (identificador = ? OR ip = ?)` | ↑ (sigue la misma instrucción) |
| 34 | `AND exitoso = 0` | ↑ (sigue la misma instrucción) |
| 35 | `AND fecha_hora > (NOW() - INTERVAL ? MINUTE)"` | ↑ (sigue la misma instrucción) |
| 36 | `);` | ↑ (sigue la misma instrucción) |
| 37 | `$stmt->bind_param("ssi", $identificador, $ip, $minutos);` | Llena los `?` de la consulta, en orden: `$identificador` (texto), `$ip` (texto), `$minutos` (número entero). |
| 38 | `$stmt->execute();` | Ejecuta la consulta. |
| 39 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 40 | `$stmt->close();` | Cierra la consulta. |
| 41 | `return (int) $row['total'];` | Devuelve el total, como número entero. |
| 42 | `}` | Cierra la función `contarFallosRecientes()`. |
| 44 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"true si ya se paso el maximo de intentos fallidos."* |
| 45 | `public function excedeLimite($identificador, $ip)` | Método `excedeLimite($identificador, $ip)`: dice si ya hubo demasiados fallos. Lo usa `AuthController::login()`. |
| 46 | `{` | Abre la función `excedeLimite()`. |
| 47 | `$maximo = self::MAXIMO_INTENTOS;` | Guarda en `$maximo` el máximo de la constante (5). |
| 48 | `return $this->contarFallosRecientes($identificador, $ip) >= $maximo;` | Devuelve `true` si los fallos recientes son 5 o más (`>=`). |
| 49 | `}` | Cierra la función `excedeLimite()`. |
| 50 | `}` | Cierra la clase `IntentoLogin`. |
| 51 | `?>` | Cierra el código PHP. |

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
