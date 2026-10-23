# models/Usuario.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja los administradores (tabla ADMINISTRADOR).

## ¿Qué hace?
- busca un administrador por correo
- revisa si el correo o el teléfono ya existen
- crea un administrador

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `buscarPorCorreo()` | busca un administrador por correo | `Usuario::crear()` |
| `esUsado()` | revisa si el correo o el teléfono ya existen | — |
| `crear()` | crea un administrador | — |

## ¿Con qué se conecta?
- **Lo cargan:** `sql/create-admin.php`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Usuario (administradores, tabla ADMINISTRADOR). El rol 'programador' no entra por la web: solo se usa en sql/create-admin.php."* |
| 6 | `class Usuario` | Crea la clase `Usuario`: maneja los administradores (tabla `ADMINISTRADOR`). La usa `sql/create-admin.php`. |
| 7 | `{` | Abre la clase `Usuario`. |
| 8 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 10 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 11 | `{` | Abre la función `__construct()`. |
| 12 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 13 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 14 | `}` | Cierra la función `__construct()`. |
| 16 | `public function buscarPorCorreo($correo)` | Método `buscarPorCorreo($correo)`: busca un administrador por su correo. |
| 17 | `{` | Abre la función `buscarPorCorreo()`. |
| 18 | `$stmt = $this->conn->prepare("SELECT * FROM ADMINISTRADOR WHERE correo = ? LIMIT 1");` | Prepara la consulta: "trae todo de `ADMINISTRADOR` donde el correo sea `?`, solo uno". |
| 19 | `$stmt->bind_param("s", $correo);` | Llena los `?` de la consulta, en orden: `$correo` (texto). |
| 20 | `$stmt->execute();` | Ejecuta la consulta. |
| 21 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 22 | `$stmt->close();` | Cierra la consulta. |
| 23 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 24 | `}` | Cierra la función `buscarPorCorreo()`. |
| 26 | `public function esUsado($correo, $telefono)` | Método `esUsado($correo, $telefono)`: dice si ya existe un administrador con ese correo o teléfono. |
| 27 | `{` | Abre la función `esUsado()`. |
| 28 | `$stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM ADMINISTRADOR WHERE correo = ? OR telefono = ?");` | Prepara la consulta: "cuenta (`COUNT(*)`) cuántos administradores tienen ese correo **o** ese teléfono". El resultado se llama `total`. |
| 29 | `$stmt->bind_param("ss", $correo, $telefono);` | Llena los `?` de la consulta, en orden: `$correo` (texto), `$telefono` (texto). |
| 30 | `$stmt->execute();` | Ejecuta la consulta. |
| 31 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 32 | `$stmt->close();` | Cierra la consulta. |
| 33 | `return (int) $row['total'] > 0;` | Devuelve `true` si el total es mayor que 0 (ya existe). |
| 34 | `}` | Cierra la función `esUsado()`. |
| 36 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Crea un administrador ('programador' o 'maestro') y devuelve la fila creada."* |
| 37 | `public function crear($d)` | Método `crear($d)`: crea un administrador. `$d` trae sus datos. |
| 38 | `{` | Abre la función `crear()`. |
| 39 | `$hash = password_hash($d['password'], PASSWORD_BCRYPT);` | Cifra la contraseña (`password_hash`) y la guarda en `$hash`. Nunca se guarda la contraseña tal cual. |
| 40 | `$creadoPor = $d['creado_por'] ?? null;` | Guarda en `$creadoPor` quién lo creó; si no se sabe, `null`. |
| 42 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda (`INSERT INTO`) en `ADMINISTRADOR` el nombre, correo, teléfono, contraseña cifrada, nivel y quién lo creó". Cada `?` se llena abajo. |
| 43 | `"INSERT INTO ADMINISTRADOR (nombre, correo, telefono, contrasena, nivel_acceso, creado_por)` | ↑ (sigue la misma instrucción) |
| 44 | `VALUES (?, ?, ?, ?, ?, ?)"` | ↑ (sigue la misma instrucción) |
| 45 | `);` | ↑ (sigue la misma instrucción) |
| 46 | `$stmt->bind_param("ssssss", $d['nombre'], $d['correo'], $d['telefono'], $hash, $d['nivel_acceso'], $creadoPor);` | Llena los `?` de la consulta, en orden: `$d['nombre']` (texto), `$d['correo']` (texto), `$d['telefono']` (texto), `$hash` (texto), `$d['nivel_acceso']` (texto), `$creadoPor` (texto). |
| 47 | `$stmt->execute();` | Ejecuta la consulta. |
| 48 | `$stmt->close();` | Cierra la consulta. |
| 50 | `return $this->buscarPorCorreo($d['correo']);` | Busca el administrador recién creado y lo devuelve. |
| 51 | `}` | Cierra la función `crear()`. |
| 52 | `}` | Cierra la clase `Usuario`. |
| 53 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | nada directo | `Failed to open stream` |
| el método `buscarPorCorreo()` | nada directo | `Call to undefined method Usuario::buscarPorCorreo()` |
| el método `esUsado()` | nada directo | `Call to undefined method Usuario::esUsado()` |
| el método `crear()` | nada directo | `Call to undefined method Usuario::crear()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
