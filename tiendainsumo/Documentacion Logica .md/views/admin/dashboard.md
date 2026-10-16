# views/admin/dashboard.php — Panel del administrador (única vista con SQL "suelto")

- **`COUNT(*) as total`**: función de agregación SQL que cuenta filas; `as total` le pone alias para leerla como `$row['total']`.
- **`GROUP BY id_rol`**: agrupa los resultados por cada valor distinto de `id_rol`, para contar usuarios por rol.
- Esta es la única excepción a la regla de "las vistas no hacen SQL": aquí se consulta directo con `$conn->query()` en vez de pasar por un modelo.
- Cuando un `if` tiene una sola instrucción, las llaves `{ }` son opcionales en PHP — válido, aunque muchos lineamientos de estilo recomiendan usarlas siempre.
- **`date('H:i:s d/m/Y')`**: formatea la fecha/hora actual del servidor. `Y`=año(4), `m`=mes(2), `d`=día(2), `H`=hora 24h, `i`=minutos, `s`=segundos.

## Conexiones

- Incluye [[../../config/database]] directamente (sin pasar por [[../../models/Usuario]]).
- Define `$titulo` antes de incluir [[../layouts/header]] y [[../layouts/sidebaradmin]].
- Tiene el mismo guardián de sesión que ese patrón repite en [[../layouts/header]] (¿existe `$_SESSION['usuario']`?).
