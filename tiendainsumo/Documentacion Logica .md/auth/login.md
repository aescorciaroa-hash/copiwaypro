# Flujo de login — views/auth/login.php → controllers/auth/authController.php → models/Usuario.php

> Nota de flujo (no de un solo archivo): a diferencia del resto de la documentación, que tiene un `.md` por cada archivo real, esta cubre los tres archivos que participan en el login de principio a fin.

## El formulario — views/auth/login.php

- El formulario tiene `method="POST"` y dos campos con `name="email"` y `name="password"` — esos `name` son las llaves con las que el controlador va a leer `$_POST['email']` y `$_POST['password']`. Si no coinciden exactamente, el dato llega vacío sin ningún error visible.
- `action="../../controllers/auth/authController.php"`: el botón "Iniciar Sesión" (`type="submit"`) envía el formulario directo a ese controlador.
- El bloque `if (isset($_SESSION['alert']))` lee una alerta guardada en sesión y la muestra con SweetAlert2, luego la borra con `unset()` — patrón "flash message" (mostrar una vez y olvidar). Ver [[../views/auth/login]] para el detalle palabra por palabra.

## El controlador — controllers/auth/authController.php

- `require_once __DIR__ . '/../../models/Usuario.php';`: así es como el controlador queda conectado al modelo.
- La clase `AuthController` agrupa toda la lógica en un método `login()` y otro `logout()`.
- Dentro de `login()`: primero valida que `$_SERVER['REQUEST_METHOD']` sea `POST`, luego que `email` y `password` no vengan vacíos (`empty()`), y que el email tenga formato válido (`filter_var(..., FILTER_VALIDATE_EMAIL)`). Cualquier fallo guarda un `$_SESSION['alert']` y redirige de vuelta a `login.php` con `header('Location: ...') + exit`.
- `new Usuario()` crea el modelo, y `obtenerPorEmail($email)` trae la fila completa del usuario (incluyendo el hash de la contraseña) desde la base de datos.
- `password_verify($password, $usuario['password'])` compara lo escrito contra el hash guardado — nunca se "desencripta" un hash, solo se verifica.
- Si todo es correcto: `session_regenerate_id(true)` (previene session fixation), se guarda `$_SESSION['usuario']` con `id_usuario`, `usuario`, `email`, `id_rol`, y un `switch ($usuario['id_rol'])` con `case '1'`, `'2'`, `'3'` decide a qué dashboard redirigir (admin, vendedor o cliente).

## Conexiones

- El modelo real de este flujo está en [[../models/Usuario]] (método `obtenerPorEmail`).
- El controlador está documentado a fondo en [[../controllers/auth/authController]].
- El `$_SESSION['usuario']` que aquí se crea es el mismo que luego leen [[../views/layouts/header]] y [[../views/layouts/sidebaradmin]] para saber quién está conectado.
