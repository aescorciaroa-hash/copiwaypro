# models/Rol.php — Modelo de roles

Modelo simple, mismo patrón que [[Usuario]].

## Explicación

- Mismo constructor que `Usuario.php` — mismo patrón repetido.
- **`SELECT * FROM roles`**: el `*` trae todas las columnas. Está bien para tablas pequeñas, pero en general se recomienda pedir solo lo que se necesita.
- Aquí sí usa `prepare()` aunque no haya `?` — es innecesario (podría ser `query()` directo), pero no es un error, solo un paso de más.
- El resto es idéntico en lógica a `obtenerTodos()` de `Usuario.php`: array vacío → `while` con `fetch_assoc()` → `return`.

## Para qué sirve

Este modelo llena el `<select>` de roles en el formulario "Agregar Usuario" de [[../views/admin/gusuarios]].

## Conexiones

- `require_once` a [[../config/database]] para obtener `$conn`.
- Instanciado en [[../views/admin/gusuarios]] y en [[../controllers/UsuarioController]].
