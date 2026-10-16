# controllers/registerController.php — Registro desde el panel admin

Casi idéntico a [[auth/registerController]]: recibe un formulario de registro, valida y crea un usuario. La diferencia es quién lo usa y a dónde redirige al terminar.

| | |
|---|---|
| Lo usa | El modal "Agregar Usuarios" en `views/admin/gusuarios.php` |
| Al terminar redirige a | `views/admin/gusuarios.php` |

## Código duplicado

Mismo cuerpo que `controllers/auth/registerController.php` (`session_start()`, `require_once models/Usuario.php`, validación de campos vacíos, `emailExiste()`, `registrar()`). En un proyecto profesional se resolvería con un solo controlador que reciba un parámetro de "a dónde volver" en vez de tener dos archivos casi iguales.

## Conexiones

- Incluye [[../models/Usuario]].
- Recibe el POST del modal "Agregar Usuarios" de [[../views/admin/gusuarios]].
- Redirige (vía JavaScript) de vuelta a `views/admin/gusuarios.php`.
- Comparar con [[auth/registerController]] — ambos terminan llamando al mismo modelo `Usuario.php`, que es el punto de encuentro común.
