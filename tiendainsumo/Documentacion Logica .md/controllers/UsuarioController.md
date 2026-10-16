# controllers/UsuarioController.php — Editar y eliminar usuarios

Controlador que hace que los botones "Editar" y "Eliminar" de [[../views/admin/gusuarios]] funcionen de verdad. Sigue el mismo patrón de POO que [[auth/authController]], pero con una particularidad: vive directamente en `controllers/`, no en `controllers/auth/` — así que sus rutas relativas suben un nivel menos (`../views/...` en vez de `../../views/...`).

## ✓ Bug histórico resuelto

En una versión anterior del proyecto, los botones "Editar" y "Eliminar" apuntaban a un archivo `AdminUsuarioController.php` que no existía. Ahora apuntan a este archivo (`controllers/UsuarioController.php`), que sí existe y sí funciona.

## Encabezado y constructor

- **`private $usuarioModel`**: a diferencia de `AuthController` (que crea `new Usuario()` dentro de cada método), aquí el modelo se guarda como propiedad de la clase, inicializada una sola vez en el constructor, y todos los métodos la reutilizan vía `$this->usuarioModel`. Es una forma más ordenada de organizar el mismo patrón.

## Método `update()`

- **`$_POST['id'] ?? null`**: lee el ID que el JavaScript del modal copió al campo oculto `edit-id`. Si no viene, corta la ejecución con un mensaje de error — nunca confía en que el dato siempre va a estar ahí.
- **`$datos = [...]`**: arma un array asociativo con los datos nuevos, listo para pasárselo al modelo. La LLAVE del array es `usuario` (como espera el modelo y la base de datos), pero el VALOR viene de `$_POST['name']` (como se llama el campo en el HTML del modal de editar) — es una "traducción" de nombres, porque el nombre del campo del formulario (`name`) es distinto al de la columna (`usuario`).
- **`password_hash($_POST['password'], PASSWORD_DEFAULT)`**: aquí usa `PASSWORD_DEFAULT` en vez de `PASSWORD_BCRYPT` (que sí se usa en `Usuario::registrar()`). En la práctica, hoy `PASSWORD_DEFAULT` apunta al mismo algoritmo BCRYPT, pero es más a prueba de futuro.
- **`$resultado === true`**: `Usuario::actualizar()` devuelve `true` si todo salió bien, o el mensaje de error de MySQL (un string) si algo falló. Por eso se compara con `===` (estricto) contra `true`, y no simplemente `if ($resultado)` — un string de error también sería "verdadero" en una comparación floja.
- **`$this->setAlert(...)`**: llama a un método privado propio de esta clase para preparar el mensaje que se mostrará con SweetAlert2 en `gusuarios.php`.

## Método `delete()` y `setAlert()`

- Mismo patrón que `update()`, pero llamando a `Usuario::eliminar()`.
- **`private function setAlert(...)`**: al ser `private`, solo `update()` y `delete()` (métodos de la MISMA clase) pueden llamarla — el mundo exterior no. Evita repetir las mismas líneas de `$_SESSION['alert'] = [...]` en cada método.
- Esta alerta usa exactamente la misma estructura (`icon`, `title`, `text`) que ya usa `authController.php` — y `gusuarios.php` ya sabía leerla desde antes (`if (isset($_SESSION['alert']))`), así que no hizo falta tocar la vista para que las alertas de editar/eliminar empezaran a funcionar.

## El mini-enrutador final

Mismo patrón de mini-enrutador que [[auth/authController]] (con `logout`/`login`), pero con dos acciones:

- `action="../../controllers/UsuarioController.php?accion=update"` (formulario de Editar) → llama a `update()`.
- `action="../../controllers/UsuarioController.php?accion=delete"` (formulario de Eliminar) → llama a `delete()`.

## Conexiones

- Incluye [[../config/database]], [[../models/Usuario]] y [[../models/Rol]].
- Recibe los POST de los modales de Editar/Eliminar en [[../views/admin/gusuarios]].
- Redirige de vuelta a `views/admin/gusuarios.php`, dejando `$_SESSION['alert']` listo para mostrarse.
