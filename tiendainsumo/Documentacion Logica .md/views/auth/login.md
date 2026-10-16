# views/auth/login.php — Formulario de inicio de sesión

Se puede abrir y cerrar PHP en una sola línea (`<?php session_start(); ?>`) y seguir con HTML normal después. Todo lo que sigue es HTML puro hasta que vuelva a aparecer `<?php`.

- **`action="..."`**: le dice al navegador a qué URL enviar los datos del formulario — aquí, directo al controlador de login.
- **`method="POST"`**: los datos viajan en el cuerpo de la petición HTTP (no visibles en la URL), apropiado para contraseñas.
- **`name="email"`, `name="password"`**: nombres que luego llegan a PHP como claves de `$_POST`. Deben coincidir exactamente con lo que el controlador espera leer.

## Patrón "flash message"

- **`isset($_SESSION['alert'])`**: comprueba si esa clave existe y no es null. Se conecta con el `$_SESSION['alert']` que `authController.php` crea cuando hay error de login.
- **`if (...): ... endif;`**: sintaxis alternativa de control de flujo, pensada para mezclarse mejor con HTML.
- **`<?= ... ?>`**: atajo de `<?php echo`. Imprime directamente el valor dentro del HTML.
- **`unset($_SESSION['alert'])`**: borra esa clave de la sesión para que la alerta no se muestre de nuevo al recargar.

> Guardar un mensaje temporal en sesión, mostrarlo una vez, y borrarlo. Muy usado en aplicaciones web reales.

## Conexiones

- El formulario envía POST a [[../../controllers/auth/authController]].
- El `$_SESSION['alert']` que lee viene de ese mismo controlador (campos incompletos, credenciales inválidas).
- El link "Regístrate" apunta a [[register]].
