# models/Usuario.php — El modelo de usuarios

Modelo: acceso a datos de usuarios (capa que habla con MySQL).

## Encabezado y constructor

- **`require_once`**: incluye otro archivo PHP. Si no existe, detiene todo el programa con error fatal (a diferencia de `include`, que solo avisa y sigue). El `_once` evita incluir el mismo archivo dos veces.
- **`__DIR__`**: constante mágica que representa la carpeta del archivo actual. Sirve para construir rutas que funcionen sin importar desde dónde se ejecute el script.
- **`class Usuario { ... }`**: define un nuevo tipo de objeto — Programación Orientada a Objetos (POO).
- **`private $conn`**: propiedad de la clase. `private` significa que solo se puede acceder desde dentro de esta misma clase (encapsulamiento).
- **`public function __construct()`**: método mágico que se ejecuta automáticamente al hacer `new Usuario()`.
- **`global $conn`**: dentro de una función, trae la variable `$conn` creada en `database.php` para poder usarla aquí.
- **`$this`**: dentro de un método, representa al objeto actual. `->` accede a propiedades/métodos de un objeto.

## `registrar()` — crear un usuario nuevo

- **`$id_rol = 3`**: valor por defecto — si no le pasas un cuarto argumento, vale 3 (rol "Cliente").
- **`password_hash($password, PASSWORD_BCRYPT)`**: cifra la contraseña. Cada llamado da un resultado distinto (usa una sal aleatoria); nunca se compara con `==`.
- **Los signos `?`**: placeholders — huecos que se rellenan después de forma segura, en vez de meter variables directo en el texto SQL (eso sería inyección SQL).
- **`prepare($query)`**: le pide a MySQL que precompile la consulta.
- **`bind_param('sssi', ...)`**: une las variables a los `?`, en el mismo orden. Cada letra indica el tipo: `s`=string, `i`=integer, `d`=double, `b`=blob. Esto es lo que protege de inyección SQL.
- **`execute()`**: ejecuta la consulta con los valores ya puestos. **`close()`**: libera los recursos de esa sentencia.

## `emailExiste()` y `obtenerPorEmail()`

- **`store_result()`**: trae los resultados al lado de PHP para poder contarlos.
- **`num_rows`**: propiedad con la cantidad de filas encontradas.
- **`return $num_rows > 0`**: expresión booleana — `true` si el correo ya existe.
- **`get_result()`**: convierte el resultado de la sentencia preparada en un objeto de resultado normal.
- **`fetch_assoc()`**: trae una fila como arreglo asociativo — llaves = nombres de columnas: `$usuario['email']`, `$usuario['password']`, etc.

## `obtenerTodos()`

- **`u, r`**: alias de tabla (`usuarios u`, `roles r`) — menos texto, sin ambigüedad.
- **`LEFT JOIN`**: trae también los usuarios aunque no tengan un rol coincidente (con `INNER JOIN` los perderías).
- **`query()` en vez de `prepare()`**: aquí no hay ninguna variable externa insertada en el SQL, así que no hay riesgo de inyección.
- **`while ($row = $result->fetch_assoc())`**: bucle que se repite mientras haya filas. Aquí `=` es asignación, no comparación — se asigna y ese valor se evalúa como condición.
- **`$usuarios[] = $row`**: agrega un elemento al final del array (como `.push()` en JavaScript).

## `actualizar()` y `eliminar()`

Le dan vida real a los botones "Editar" y "Eliminar" de `gusuarios.php`.

- **`UPDATE usuarios SET ... WHERE id_usuario = ?`**: a diferencia del `INSERT`, un `UPDATE` siempre necesita un `WHERE` — si lo olvidaras, actualizarías **TODAS** las filas de la tabla de una sola vez. El `?` del `WHERE` se agrega al final, después de construir el resto de la consulta.
- **`$query .= '...'`**: el operador `.=` es "concatenar y asignar" — equivale a `$query = $query . '...'`. Se usa para ir agregando pedazos al SQL solo si hace falta.
- **`if (isset($datos['password_hash']))`**: la contraseña es OPCIONAL al editar — el `, password = ?` y su tipo `'s'` solo se agregan a la consulta si el admin escribió una nueva. Así, si deja el campo vacío, la contraseña anterior no se toca.
- **`$types .= 's'` / `$types .= 'i'`**: mismo truco de concatenación, para armar la cadena de tipos de `bind_param()` en el mismo orden en que se van agregando los `?`.
- **`...$params`** (operador *spread*/"splat"): `$params` es un array que se llena dinámicamente (2, 3 o 4 elementos, según si hay contraseña nueva); `bind_param()` no acepta un array directamente, necesita los valores por separado — `...$params` "desempaqueta" el array en argumentos individuales.
- **`return $stmt->error` / `return $this->conn->error`**: en vez de devolver simplemente `false`, se devuelve el mensaje de error real de MySQL — así el controlador puede mostrar al usuario qué salió mal, no solo "algo falló".
- **`DELETE FROM usuarios WHERE id_usuario = ?`**: mismo principio que el `UPDATE` — un `DELETE` sin `WHERE` borraría la tabla completa. El placeholder está protegido con `bind_param('i', $id_usuario)`, así que no hay riesgo de inyección SQL.
- Esto es un **borrado físico** (la fila desaparece para siempre), no un "borrado lógico" (que solo marcaría `estado = 0`). Con el sistema de estados que ya existe (Activo/Inactivo), habría sido una alternativa razonable desactivar en vez de eliminar.

## Conexiones

- Constructor usa `global $conn` → nace en [[../config/database]].
- `registrar()` y `emailExiste()` los usan [[../controllers/auth/registerController]] y [[../controllers/registerController]].
- `obtenerPorEmail()` lo usa [[../controllers/auth/authController]].
- `obtenerTodos()` lo usa [[../views/admin/gusuarios]].
- `actualizar()` y `eliminar()` los usa [[../controllers/UsuarioController]].
