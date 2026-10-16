# controllers/auth/registerController.php — Registro público

Recibe el formulario de registro público ([[../../views/auth/register]]) y crea un usuario nuevo. Existe un archivo casi idéntico en `controllers/registerController.php` (usado por el modal "Agregar Usuarios" del admin) — ver [[../registerController]] para las diferencias.

| | |
|---|---|
| Lo usa | El formulario público `views/auth/register.php` |
| Al terminar redirige a | `views/auth/login.php` |

## Código duplicado

No está mal para un proyecto de clase, pero en un proyecto profesional se resolvería con un solo controlador que reciba un parámetro de "a dónde volver".

## Cuerpo del archivo

- **`echo`**: instrucción básica de PHP para imprimir texto en la salida. Aquí construye a mano una página HTML mínima solo para poder mostrar una alerta con SweetAlert2 (librería de JavaScript) y luego redirigir.
- Todo el bloque entre comillas simples `'...'` es un string literal, tratado como texto plano.
- Mismo patrón de validación que en el login.
- **`echo "<script> Swal.fire(...) </script>"`**: imprime código JavaScript dentro de una etiqueta `<script>`, que el navegador ejecutará al recibir la respuesta. Es una técnica para mostrar alertas desde PHP sin usar `$_SESSION` + redirección.
- **`Swal.fire({...})`**: no es PHP, es JavaScript — llama a SweetAlert2 para mostrar el popup.
- **`.then(() => { window.location.href = ...; })`**: en JavaScript, "cuando el usuario cierre la alerta, redirige a esta URL".
- **`exit()`**: termina el script PHP inmediatamente después de imprimir ese HTML/JS.
- Reutiliza los métodos del modelo `Usuario`: `emailExiste()` para evitar duplicados, `registrar()` para crear la cuenta.
- **`// 3 = Cliente`**: comentario de una línea. Todo lo que sigue a `//` en esa línea es ignorado por PHP.
- Este archivo (el público) siempre registra como Cliente (rol 3), que es lo esperado para un registro público. Compárese con [[../registerController]], que se usa en un contexto distinto (el admin).

## Conexiones

- Incluye [[../../models/Usuario]].
- Recibe el POST de [[../../views/auth/register]].
- Redirige (vía JavaScript) a `views/auth/login.php`.
