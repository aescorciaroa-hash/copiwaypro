# views/auth/register.php — Formulario de registro público

Sigue el mismo patrón de formulario que [[login]], apuntando a `controllers/auth/registerController.php`.

- Mismo patrón de *flash message* que `login.php`, pero usando `$_SESSION['error']` (un string simple) en vez de `$_SESSION['alert']` (un array con icon/title/text).
- Ningún controlador del proyecto llega a asignar `$_SESSION['error']` — es código preparado pero sin usar todavía.

## Resto del archivo

`checkStrength()` y `toggleRegPassword()` son JavaScript puro: validan visualmente qué tan fuerte es la contraseña mientras el usuario escribe — no interactúan con PHP.

## Conexiones

- El formulario envía POST a [[../../controllers/auth/registerController]].
- El link "Inicia sesión" apunta a [[login]].
