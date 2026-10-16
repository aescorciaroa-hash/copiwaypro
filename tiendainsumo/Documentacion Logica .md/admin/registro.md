# Flujo de registro desde el panel admin — views/admin/gusuarios.php (modal "Agregar Usuario") → controllers/registerController.php → models/Usuario.php

> Nota de flujo (no de un solo archivo): este archivo estaba vacío — es la contraparte, desde el panel de Administrador, del registro público documentado en [[../auth/registro]].

## El modal "Agregar Usuario" — views/admin/gusuarios.php

- `<form action="../../controllers/registerController.php" method="POST" id="formRegister">` — nota que apunta a `controllers/registerController.php`, **no** a `controllers/auth/registerController.php`. Son dos archivos casi idénticos pero distintos (ver [[../controllers/registerController]]).
- A diferencia del formulario público, este SÍ tiene dos campos extra:
  - `<select name="rol" id="rol">`, llenado dinámicamente con `<?php foreach ($roles as $rol): ?>` a partir de `Rol::obtenerTodos()`.
  - `<select name="estado" id="estado">`, con opciones fijas `Activo` (`value="1"`) / `Inactivo` (`value="0"`).
- Más los mismos `name="usuario"`, `name="email"`, `name="password"` del registro público.

## El controlador — controllers/registerController.php

- Es casi un copy-paste de `controllers/auth/registerController.php`: mismo `session_start()`, mismo `require_once .../models/Usuario.php`, misma validación de campos vacíos, mismo `emailExiste()`.
- Sí lee `$rol = $_POST['rol'] ?? '';` al principio... pero nunca lo usa. La llamada final sigue siendo `registrar($usuario_str, $email, $password, 3)` con el `3` fijo — exactamente el mismo `// 3 = Cliente` copiado del otro archivo.

## ⚠ Bug real: el rol elegido por el admin se ignora

El Administrador puede abrir el `<select name="rol">`, elegir "Vendedor", y el sistema va a crear al usuario como **Cliente** igual. El dato viaja correctamente hasta `$rol = $_POST['rol']`, pero esa variable nunca se pasa a `registrar()`. Para arreglarlo, la llamada tendría que ser `registrar($usuario_str, $email, $password, (int)$rol)`.

## ⚠ Bug real: el campo "estado" tampoco se lee

El `<select name="estado">` del modal llega a `$_POST['estado']`, pero `controllers/registerController.php` ni siquiera declara una variable para leerlo — el dato se pierde por completo. Además, `Usuario::registrar()` (el método del modelo) no tiene ningún parámetro para `estado`; el `INSERT` que ejecuta no incluye esa columna, así que el usuario nuevo queda con lo que la base de datos ponga por defecto. Corregir esto requeriría tanto leer `$_POST['estado']` aquí como agregar el parámetro a `Usuario::registrar()`.

## ⚠ Bug real: las redirecciones de error apuntan a una ruta rota

Las tres alertas de error de este archivo (campos vacíos, email duplicado, error interno) hacen `window.location.href = '../../views/auth/register.php';` — con **dos** `../`. Ese código se copió tal cual de `controllers/auth/registerController.php`, donde sí es correcto porque ese archivo vive un nivel más adentro (`controllers/auth/`). Pero `controllers/registerController.php` vive directamente en `controllers/`, un nivel más arriba: desde ahí, `../` ya llega a la raíz del proyecto, así que `../../` se pasa un nivel de más y la URL resultante no existe (404). La única ruta que sí se corrigió fue la de éxito, `../views/admin/gusuarios.php`, que tiene un solo `../` y por eso funciona. En resumen: si un admin intenta agregar un usuario con datos inválidos o un correo repetido, la alerta de SweetAlert2 se muestra bien, pero al cerrarla el redirect lo manda a una URL rota en vez de devolverlo al modal.

## Conexiones

- El modelo real de este flujo está en [[../models/Usuario]] (métodos `registrar` y `emailExiste`) y [[../models/Rol]] (llena el `<select name="rol">`).
- El controlador está documentado a fondo en [[../controllers/registerController]].
- Comparar con [[../auth/registro]] — mismo modelo, formulario y controlador distintos, y aquí es donde aparecen los bugs que el flujo público no tiene (porque el público no ofrece elegir rol ni estado).
