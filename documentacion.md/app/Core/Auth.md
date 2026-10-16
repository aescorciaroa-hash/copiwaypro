# app/Core/Auth.php

## ¿Para qué sirve?
Es la clase **`Auth`**: se encarga del inicio y cierre de sesión y de saber **quién está conectado y
con qué rol**. Todos sus métodos son estáticos: `Auth::id()`, `Auth::check()`...

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usan | casi todos los controladores (`Auth::id()`, `Auth::rol()`, `Auth::check()`) | Saber quién hace la petición. |
| ← lo usa | `AuthController.php` | `intentarLogin`, `intentarLoginConPin`, `login`, `logout`, `usuarioActual`. |
| ← lo usa | `requiereSesion()` / `requiereRol()` en `helpers.php` | Proteger las rutas. |
| → usa | `$conn` (`config/database.php`) | Buscar las cuentas en MySQL. |
| → usa | `Session::destroy()` | Al cerrar sesión. |
| → tablas | `ADMINISTRADOR`, `AYUDANTE_COCINA`, `DOMICILIARIO`, `CLIENTE` | Donde están las cuentas. |

## Variables importantes
| Variable | De dónde viene | Para qué sirve | A dónde va |
|---|---|---|---|
| `$_SESSION['usuario_id']` | La guarda `Auth::login()` | Id del usuario conectado | `Auth::id()` |
| `$_SESSION['usuario_rol']` | La guarda `Auth::login()` | Rol del usuario conectado | `Auth::rol()` |
| `$fila` | Una fila de la tabla del rol | Datos de la cuenta (nombre, correo, contraseña cifrada, activo...) | `Auth::login()` arma la respuesta con ella |
| `$encontrados` | Resultados de la búsqueda `LIKE` | Correos que coinciden con el usuario escrito | Si hay uno solo, se usa para el login con PIN |

## La constante `TABLAS`
```php
private const TABLAS = [
    'admin'    => ['ADMINISTRADOR',   'id_admin'],
    'kitchen'  => ['AYUDANTE_COCINA', 'id_ayudante'],
    'delivery' => ['DOMICILIARIO',    'id_domiciliario'],
    'client'   => ['CLIENTE',         'id_cliente'],
];
```
Cada rol tiene su propia tabla en la base de datos y su propia llave primaria.
`const` es un valor fijo que no cambia; `private` = solo se usa dentro de esta clase.

## Métodos para saber quién está conectado

| Método | Devuelve |
|---|---|
| `Auth::check()` | `true` si hay alguien conectado. |
| `Auth::rol()` | El rol: `'admin'`, `'kitchen'`, `'delivery'` o `'client'` (o `null`). |
| `Auth::id()` | El id del usuario conectado (o `null`). |

Los tres leen `$_SESSION['usuario_id']` y `$_SESSION['usuario_rol']`.

## Métodos de inicio de sesión

### `buscarPorCorreo($tabla, $correo)` (privado)
Busca una cuenta por correo en una tabla. Es una consulta normal:
```php
$stmt = $conn->prepare("SELECT * FROM {$tabla} WHERE correo = ? LIMIT 1");
$stmt->bind_param("s", $correo);
```
`global $conn;` se usa porque los métodos estáticos no tienen `$this`.

### `Auth::intentarLogin($correo, $clave)`
Para **admin** y **cliente** (correo + contraseña).
```php
foreach (self::TABLAS as $rol => [$tabla]) {
```
Recorre las 4 tablas. `[$tabla]` toma solo el primer valor del arreglo (el nombre de la tabla).
- Si encuentra el correo, revisa la contraseña con `password_verify()` (compara con el hash guardado).
- Si la contraseña está mal o la cuenta está inactiva (`activo = 0`) → `null`.
- Si todo está bien → llama a `Auth::login()`.

### `Auth::intentarLoginConPin($correo, $pin)`
Para **cocina** y **domiciliario** (correo o usuario + PIN de 4 dígitos).
- Si lo escrito no tiene `@` (ej: `santiago`), busca el correo completo con `usuarioSinDominio()`.
- Después hace lo mismo que el login normal, pero comparando el PIN.

### `usuarioSinDominio($usuario, $roles)` (privado)
Busca correos que empiecen con lo escrito + `@`:
```php
$patron = addcslashes($usuario, '%_\\') . '@%';
... WHERE correo LIKE ? AND activo = 1
```
- En SQL `LIKE 'santiago@%'` significa "empieza por santiago@".
- `addcslashes` escapa los caracteres `%` y `_` para que el usuario no pueda usarlos como comodines.
- Si encuentra exactamente **uno**, devuelve ese correo. Si hay 0 o más de 1 → `null`.

### `Auth::login($rol, $fila)`
Guarda al usuario en la sesión:
```php
session_regenerate_id(true);
$_SESSION['usuario_id'] = $fila[$idCol];
$_SESSION['usuario_rol'] = $rol;
```
`session_regenerate_id` cambia el identificador de sesión al iniciar sesión (protege contra el robo de sesión).
Devuelve un arreglo con `id`, `role`, `name` y `email` para enviarlo a React.

### `Auth::usuarioActual()`
Vuelve a leer al usuario **desde la base de datos** (no solo desde la sesión). Así, si un
administrador desactiva una cuenta, esa persona pierde el acceso de inmediato.
- Si ya no existe o está inactiva → cierra la sesión y devuelve `null`.
- `unset($fila['contrasena'], $fila['pin'])` quita los datos secretos antes de devolverla.

### `Auth::logout()`
Borra el usuario de la sesión y llama a `Session::destroy()`.
