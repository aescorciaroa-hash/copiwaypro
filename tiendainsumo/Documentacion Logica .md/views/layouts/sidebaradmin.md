# views/layouts/sidebaradmin.php — Menú lateral dinámico según el rol

- Reutiliza `$usuario` (la variable que [[header]] ya dejó lista desde `$_SESSION['usuario']`).
- **`switch` sin `default`**: si `$id_rol` no es `'1'`, `'2'` ni `'3'`, `$rol_nombre` se queda como `''` — no genera error.
- **`break`**: corta la ejecución para que no "caiga" al siguiente `case`. Si se olvida, PHP seguiría ejecutando el siguiente caso también (*fall-through*) — error clásico de principiante.
- **`$id_rol === '1' || $id_rol === 1`**: compara tanto contra el string `'1'` como contra el número `1`, usando `===` (estricta). Es un "parche defensivo" porque no siempre `id_rol` llega con el mismo tipo — a veces string desde `$_SESSION`, a veces int desde MySQL.
- Este bloque construye un menú lateral distinto según el rol: control de acceso a nivel de interfaz (complementario al control a nivel de backend).

## El enlace de logout

`href="../../controllers/auth/authController.php?accion=logout"` es el que activa el mini-enrutador de [[../../controllers/auth/authController]] (sección `logout()`).

## Cambio menor reciente

Se agregó `style="text-decoration: none"` a los enlaces del menú (para quitarles el subrayado azul por defecto) y se sumó el CDN de Bootstrap junto al de Tailwind que ya existía — necesario porque los modales de [[../admin/gusuarios]] usan componentes de Bootstrap (`data-bs-toggle`, etc.), que no vienen incluidos en Tailwind.

## Conexiones

- Se incluye siempre justo después de [[header]].
- El link de logout dispara [[../../controllers/auth/authController]]`?accion=logout`.
