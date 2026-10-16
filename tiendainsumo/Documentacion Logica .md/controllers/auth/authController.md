# controllers/auth/authController.php — Controlador de login

## Conceptos base

- **`session_start()`**: inicia (o retoma) la sesión de PHP. Sin esto no se puede usar `$_SESSION`. Debe ir antes de cualquier salida HTML.
- **`$_SERVER['REQUEST_METHOD']`**: variable superglobal con información de la petición HTTP. Dice si llegó por GET o por POST.
- **`!==`**: "diferente estricto" — compara valor y tipo.
- **`header('Location: ...')`**: envía una cabecera HTTP de redirección al navegador.
- **`exit`**: detiene la ejecución inmediatamente. Siempre debe ir después de un `header('Location: ...')`, o el código de abajo se seguiría ejecutando.

## Validaciones

- **`$_POST`**: superglobal con los datos enviados por un formulario `method="POST"`.
- **`$_POST['email'] ?? ''`**: operador de fusión null (`??`) — si existe y no es null, úsalo; si no, usa `''` como respaldo. Evita errores de índice indefinido.
- **`trim(...)`**: elimina espacios en blanco al inicio y al final del texto.
- **`empty($email)`**: `true` si la variable está vacía (string vacío, 0, null, false, array vacío…).
- **`||`**: operador lógico OR.
- **`$_SESSION['alert'] = [...]`**: guarda un array asociativo en la sesión — persiste entre peticiones, a diferencia de una variable normal.
- **`filter_var($email, FILTER_VALIDATE_EMAIL)`**: valida formato de correo. Devuelve el email si es válido, o `false`.
- **`!`**: negación lógica — "si NO es un correo válido…".

## Verificación de usuario y contraseña

- **`new Usuario()`**: crea un objeto de la clase `Usuario` — el controlador usa al modelo; no sabe nada de SQL, solo le pide "dame el usuario con este correo".
- **`password_verify(...)`**: compara la contraseña escrita contra el hash guardado. Nunca se "desencripta" un hash BCRYPT, solo se puede verificar.

## Login exitoso y redirección por rol

- **`session_regenerate_id(true)`**: genera un nuevo identificador de sesión tras el login exitoso, y borra el anterior. Previene el ataque "session fixation".
- **`$_SESSION['usuario'] = [...]`**: guarda los datos esenciales del usuario logueado — esto es lo que luego usan `header.php` y `sidebaradmin.php` para saber quién está conectado.
- **`switch (...) { case: ... }`**: compara una variable contra varios valores posibles. Aquí decide a qué panel redirigir según el rol.
- **`default`**: se ejecuta si el rol no coincide con ningún `case`.

## `logout()` y enrutamiento manual

- **`session_unset()`**: borra todas las variables guardadas en `$_SESSION` (no destruye la sesión en sí).
- **`session_destroy()`**: destruye por completo los datos de la sesión en el servidor.
- **`$_GET`**: superglobal con los parámetros de la URL (después del `?`). En `authController.php?accion=logout`, `$_GET['accion']` vale `'logout'`.
- El bloque final es un mini enrutador: según `accion`, decide si llamar a `logout()` o a `login()`.

## Conexiones

- Incluye [[../../config/database]] y [[../../models/Usuario]].
- Recibe el POST de [[../../views/auth/login]] (`action="../../controllers/auth/authController.php"`).
- Redirige a [[../../views/admin/dashboard]] / `views/vendedor/dashboard.php` / `views/cliente/dashboard.php` según `id_rol`.
- El link de logout de [[../../views/layouts/sidebaradmin]] apunta a `?accion=logout`.
