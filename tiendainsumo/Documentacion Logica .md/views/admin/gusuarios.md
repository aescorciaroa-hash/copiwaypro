# views/admin/gusuarios.php — Listado y gestión de usuarios

## Guardián de acceso

- Guardián más estricto que el de [[../layouts/header]]: no solo revisa que haya sesión, sino que el rol sea específicamente Administrador (comparando como número y como string, por la misma inconsistencia de tipos de siempre).
- **`&&`**: operador lógico AND. Toda la condición: "si NO hay sesión, O (si hay sesión pero) el rol no es 1 de ninguna forma → redirige".

## Preparación de datos ("controlador implícito de la vista")

- Prepara los datos antes de imprimir HTML: instancia `Usuario` y `Rol`, llama a `obtenerTodos()` de cada uno.
- Orden importante: primero se define `$titulo`, y DESPUÉS se incluye `header.php` — porque `header.php` usa `$titulo ?? 'Dashboard'` y necesita que la variable ya exista.

## Tabla de usuarios

- **`foreach ($usuarios as $usuario)`**: recorre el array uno por uno. En cada vuelta, `$usuario` toma el valor de la fila actual — esta es una variable local nueva del bucle, distinta a la que `header.php` había creado con los datos de sesión; la sobrescribe temporalmente (y se queda con el último valor tras el bucle, porque PHP no separa el scope dentro de un `foreach`). Ejemplo real de por qué reusar nombres de variables genera confusión.
- **`htmlspecialchars(...)`**: aquí sí se protege correctamente contra XSS.
- **`empty($usuarios)`**: si el array está vacío, muestra un mensaje — buen manejo de caso vacío.

## ✓ Bug histórico resuelto

Antes, los botones "Editar" y "Eliminar" apuntaban a un archivo `AdminUsuarioController.php` que no existía. Ahora apuntan a [[../../controllers/UsuarioController]], que sí existe y sí funciona.

## Los botones Editar/Eliminar — cómo le pasan datos al modal

- **`data-bs-toggle="modal"` / `data-bs-target="#editar"`**: atributos de Bootstrap (JavaScript), no de PHP. Le dicen al navegador "cuando hagan clic aquí, abre el modal cuyo `id="editar"` está más abajo en el HTML".
- **`data-id`, `data-name`, `data-email`, `data-rol`, `data-estado`**: atributos de datos personalizados (`data-*`). PHP los "estampa" con los valores de esa fila específica al generar la tabla — cada botón "Editar" de cada fila termina con datos distintos, aunque todos abran el mismo modal `#editar`. Esto es la clave para que un solo modal en el HTML sirva para editar cualquiera de los usuarios de la tabla.
- Esto es **JavaScript**, no PHP — se ejecuta en el navegador del usuario, no en el servidor.
- **`document.querySelectorAll('.editbtn')`**: selecciona TODOS los botones con la clase `editbtn` (uno por cada fila de la tabla).
- **`.forEach(button => { ... })`**: recorre cada botón encontrado y le agrega un "escuchador" de clics.
- **`this.getAttribute('data-id')`**: cuando alguien hace clic, `this` es el botón exacto que se clickeó. `getAttribute('data-id')` lee el valor que PHP había estampado en ESE botón específico.
- **`document.getElementById('edit-id').value = id`**: copia ese valor dentro del formulario oculto del modal (`<input type="hidden" id="edit-id">`), justo antes de que el modal se muestre — así, cuando el admin le dé clic a "Actualizar Usuario", el formulario ya lleva el ID correcto.

El resto del archivo inicializa DataTables (buscador, paginación y orden para la tabla) — no es PHP.

## Conexiones

- Guardián de sesión + rol propio (más estricto que `header.php`).
- Usa [[../../models/Usuario]]`::obtenerTodos()` y [[../../models/Rol]]`::obtenerTodos()`.
- Incluye [[../layouts/header]] y [[../layouts/sidebaradmin]].
- El modal "Agregar Usuarios" envía POST a [[../../controllers/registerController]].
- Los modales "Editar"/"Eliminar" envían POST a [[../../controllers/UsuarioController]]`?accion=update` / `?accion=delete`.
- Muestra `$_SESSION['alert']` que dejan tanto `registerController.php` como `UsuarioController.php`.
