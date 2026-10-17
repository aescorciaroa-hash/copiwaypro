# models/CodigoVerificacion.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja los códigos para recuperar la contraseña.

## ¿Qué hace?
- crea el código para recuperar la contraseña
- busca un código que siga sirviendo
- marca el código como usado
- suma un intento fallido (al quinto deja de servir)

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `crearParaCliente()` | crea el código para recuperar la contraseña | `AuthController::forgotPasswordRequest()` |
| `buscarValidoPorCorreo()` | busca un código que siga sirviendo | `AuthController::forgotPasswordReset()` |
| `marcarUsado()` | marca el código como usado | `AuthController::forgotPasswordReset()` |
| `incrementarIntentos()` | suma un intento fallido (al quinto deja de servir) | `AuthController::forgotPasswordReset()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/AuthController.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo CodigoVerificacion (codigos para recuperar la contrasena)."* |
| 5 | `class CodigoVerificacion` | Crea la clase `CodigoVerificacion`: maneja los códigos para recuperar la contraseña (tabla `CODIGO_VERIFICACION`). La usa `AuthController`. |
| 6 | `{` | Abre la clase `CodigoVerificacion`. |
| 7 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 9 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 10 | `{` | Abre la función `__construct()`. |
| 11 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 12 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 13 | `}` | Cierra la función `__construct()`. |
| 15 | `public function crearParaCliente($idCliente, $codigo)` | Método `crearParaCliente($idCliente, $codigo)`: guarda un código nuevo para un cliente. Lo usa `AuthController::forgotPasswordRequest()`. |
| 16 | `{` | Abre la función `crearParaCliente()`. |
| 17 | `$hash = password_hash($codigo, PASSWORD_DEFAULT);` | Cifra el código (`password_hash`) y lo guarda en `$hash`. Así, aunque alguien vea la base de datos, no ve el código. |
| 18 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda el código cifrado del cliente, enviado por correo, que vence en 15 minutos (`DATE_ADD(NOW(), INTERVAL 15 MINUTE)` = ahora + 15 minutos)". |
| 19 | `"INSERT INTO CODIGO_VERIFICACION (id_cliente, codigo_hash, canal_envio, fecha_expiracion)` | ↑ (sigue la misma instrucción) |
| 20 | `VALUES (?, ?, 'email', DATE_ADD(NOW(), INTERVAL 15 MINUTE))"` | ↑ (sigue la misma instrucción) |
| 21 | `);` | ↑ (sigue la misma instrucción) |
| 22 | `$stmt->bind_param("is", $idCliente, $hash);` | Llena los `?` de la consulta, en orden: `$idCliente` (número entero), `$hash` (texto). |
| 23 | `$stmt->execute();` | Ejecuta la consulta. |
| 24 | `$stmt->close();` | Cierra la consulta. |
| 25 | `}` | Cierra la función `crearParaCliente()`. |
| 27 | `public function buscarValidoPorCorreo($correo)` | Método `buscarValidoPorCorreo($correo)`: busca el código que todavía sirve para ese correo. Lo usa `AuthController::forgotPasswordReset()`. |
| 28 | `{` | Abre la función `buscarValidoPorCorreo()`. |
| 29 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "trae el código (`cv`) unido con su cliente (`JOIN CLIENTE c`), donde el correo sea `?`, no se haya usado, no esté vencido y tenga menos de 5 intentos; el más nuevo primero (`ORDER BY ... DESC`)". |
| 30 | `"SELECT cv.* FROM CODIGO_VERIFICACION cv` | ↑ (sigue la misma instrucción) |
| 31 | `JOIN CLIENTE c ON c.id_cliente = cv.id_cliente` | ↑ (sigue la misma instrucción) |
| 32 | `WHERE c.correo = ? AND cv.usado = 0 AND cv.fecha_expiracion > NOW() AND cv.intentos < 5` | ↑ (sigue la misma instrucción) |
| 33 | `ORDER BY cv.fecha_generacion DESC"` | ↑ (sigue la misma instrucción) |
| 34 | `);` | ↑ (sigue la misma instrucción) |
| 35 | `$stmt->bind_param("s", $correo);` | Llena los `?` de la consulta, en orden: `$correo` (texto). |
| 36 | `$stmt->execute();` | Ejecuta la consulta. |
| 37 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 38 | `$stmt->close();` | Cierra la consulta. |
| 39 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 40 | `}` | Cierra la función `buscarValidoPorCorreo()`. |
| 42 | `public function marcarUsado($idCodigo)` | Método `marcarUsado($idCodigo)`: marca el código como usado, para que no sirva otra vez. |
| 43 | `{` | Abre la función `marcarUsado()`. |
| 44 | `$stmt = $this->conn->prepare("UPDATE CODIGO_VERIFICACION SET usado = 1 WHERE id_codigo = ?");` | Prepara la consulta: "cambia (`UPDATE`) `usado` a 1 en ese código". |
| 45 | `$stmt->bind_param("i", $idCodigo);` | Llena los `?` de la consulta, en orden: `$idCodigo` (número entero). |
| 46 | `$stmt->execute();` | Ejecuta la consulta. |
| 47 | `$stmt->close();` | Cierra la consulta. |
| 48 | `}` | Cierra la función `marcarUsado()`. |
| 50 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Suma un intento fallido; al quinto el codigo deja de servir."* |
| 51 | `public function incrementarIntentos($idCodigo)` | Método `incrementarIntentos($idCodigo)`: suma un intento fallido. Al quinto, el código deja de servir. |
| 52 | `{` | Abre la función `incrementarIntentos()`. |
| 53 | `$stmt = $this->conn->prepare("UPDATE CODIGO_VERIFICACION SET intentos = intentos + 1 WHERE id_codigo = ?");` | Prepara la consulta: "a `intentos` súmale 1 en ese código". |
| 54 | `$stmt->bind_param("i", $idCodigo);` | Llena los `?` de la consulta, en orden: `$idCodigo` (número entero). |
| 55 | `$stmt->execute();` | Ejecuta la consulta. |
| 56 | `$stmt->close();` | Cierra la consulta. |
| 57 | `}` | Cierra la función `incrementarIntentos()`. |
| 58 | `}` | Cierra la clase `CodigoVerificacion`. |
| 59 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código | `Failed to open stream` |
| el método `crearParaCliente()` | pedir el código para recuperar la contraseña | `Call to undefined method CodigoVerificacion::crearParaCliente()` |
| el método `buscarValidoPorCorreo()` | cambiar la contraseña con el código | `Call to undefined method CodigoVerificacion::buscarValidoPorCorreo()` |
| el método `marcarUsado()` | cambiar la contraseña con el código | `Call to undefined method CodigoVerificacion::marcarUsado()` |
| el método `incrementarIntentos()` | cambiar la contraseña con el código | `Call to undefined method CodigoVerificacion::incrementarIntentos()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
