# Flujo de registro público — views/auth/register.php → controllers/auth/registerController.php → models/Usuario.php

> Nota de flujo (no de un solo archivo): cubre el registro que hace cualquier visitante desde la página pública, distinto del que hace un Administrador desde el panel (ver [[../admin/registro]]).

## El formulario — views/auth/register.php

- `method="POST"` y `action="../../controllers/auth/registerController.php"` (`id="formRegister"`).
- Campos con `name="usuario"`, `name="email"`, `name="password"` y `name="terminos"` (checkbox de aceptar términos). No hay campo de `rol` ni de `estado` — este formulario solo sirve para crear Clientes, así que el controlador ni los pide.
- Cada `name` debe coincidir exactamente con la llave que el controlador va a leer en `$_POST`. Por ejemplo, `name="usuario"` en el HTML se relaciona con `$usuario_str = $_POST['usuario'] ?? '';` en el controlador.

## El controlador — controllers/auth/registerController.php

- `session_start();` al inicio, para poder guardar sesión más adelante si hiciera falta.
- `require_once __DIR__ . '/../../models/Usuario.php';` conecta este controlador con el modelo.
- Imprime a mano un `<!DOCTYPE html>` mínimo (con el CDN de SweetAlert2) porque este archivo no usa `$_SESSION['alert']` + redirección como el login — en vez de eso, `echo` un `<script>` con `Swal.fire({...})` que se ejecuta en el navegador, y en `.then()` hace `window.location.href = '...'` para redirigir después de que el usuario cierre la alerta.
- Primero valida que ningún campo venga vacío (`empty($usuario_str) || empty($email) || empty($password)`); si falla, alerta de error y `exit()`.
- Luego `$usuarioModel->emailExiste($email)` evita correos duplicados; si ya existe, alerta de advertencia y `exit()`.
- Si todo está bien: `// 3 = Cliente` — el comentario lo dice explícito, `registrar($usuario_str, $email, $password, 3)` siempre crea el usuario con rol 3 (Cliente), con el `3` fijo directamente en el código. Aquí **no es un bug**: como el formulario no ofrece elegir rol, tiene sentido que el controlador tampoco lo intente leer. (Compárese con el registro desde el panel admin, donde el formulario SÍ pregunta el rol pero el controlador lo ignora igual — ese sí es un bug real, ver [[../admin/registro]].)
- Si `registrar()` devuelve `true`: alerta de éxito y redirige a `views/auth/login.php`. Si devuelve `false`: alerta de error interno y redirige de vuelta a `register.php`.

## Conexiones

- El modelo real de este flujo está en [[../models/Usuario]] (métodos `emailExiste` y `registrar`).
- El controlador está documentado a fondo en [[../controllers/auth/registerController]].
- Comparar con [[../admin/registro]] — casi el mismo código, pero usado por el Administrador desde `views/admin/gusuarios.php`, con un formulario que sí pide rol y estado.
