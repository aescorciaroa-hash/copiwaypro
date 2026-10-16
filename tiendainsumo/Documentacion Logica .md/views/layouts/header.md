# views/layouts/header.php — Encabezado y guardián de sesión

- **`session_status()`**: dice en qué estado está la sesión. **`PHP_SESSION_NONE`**: constante que significa "todavía no se ha iniciado ninguna sesión en este script".
- Este patrón evita el error de "session already started" si `session_start()` se llama dos veces.
- **`if (!isset($_SESSION['usuario'])) { header(...); exit; }`**: el guardián de acceso. Si nadie ha iniciado sesión, expulsa al visitante de vuelta al login.
- **`$titulo = $titulo ?? 'Dashboard'`**: `$titulo` puede venir ya definido desde el archivo que incluyó a `header.php`. Si no, usa `'Dashboard'` por defecto — técnica de "vista con parámetros".
- **`htmlspecialchars($titulo)`**: convierte caracteres especiales de HTML en su versión escapada — la defensa principal contra ataques XSS.

## Por qué funciona la variable `$titulo`

`dashboard.php` y `gusuarios.php` definen `$titulo` **ANTES** de `require_once header.php`. Esto funciona porque `header.php` se incluye con `require_once`, no se llama como función: al incluir un archivo, todas las variables que ya existían en el archivo que lo llamó siguen visibles adentro — es como si el contenido se "pegara" literalmente en ese punto. Si `header.php` fuera una función normal, `$titulo` tendría que pasarse como parámetro explícito.

## Conexiones

- Lee `$_SESSION['usuario']`, que nace en [[../../controllers/auth/authController]].
- Es incluido (siempre después de definir `$titulo`) por [[../admin/dashboard]] y [[../admin/gusuarios]].
- Justo después de este archivo se incluye [[sidebaradmin]].
