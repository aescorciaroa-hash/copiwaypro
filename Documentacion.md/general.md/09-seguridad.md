# 9. Seguridad

Resumen de cómo se protege el sistema y dónde está cada protección.

## Contraseñas
- **Nunca** se guarda la contraseña real: se guarda un **hash** con `password_hash()`.
- Para revisar si es correcta se usa `password_verify()`.
- Mínimo **8 caracteres**.
- Lo mismo con el **PIN de acceso** y el **código de recuperación**.

Dónde: `Auth.php`, `Cliente.php`, `Personal.php`, `Usuario.php`, `CodigoVerificacion.php`.

## Sesiones
- Al iniciar sesión, PHP guarda en `$_SESSION` el id y el rol del usuario. El navegador solo guarda una cookie con un identificador.
- La cookie es `httponly` (JavaScript no la puede leer), `samesite=Lax` y `secure` si la página usa HTTPS.
- Al iniciar sesión se **cambia el identificador** (`session_regenerate_id`) para evitar robos de sesión.
- En **cada petición** se vuelve a revisar la cuenta en la base de datos: si fue desactivada, la sesión se cierra en ese momento.

Dónde: `config/Session.php`, `models/Auth.php`, `requiereSesion()` en `helpers.php`.

## Permisos por rol
Cada ruta de `config/rutas.php` dice qué roles la pueden usar. Antes de ejecutar cualquier controlador,
`requiereRol()` revisa la sesión y el rol:
- Sin sesión → **401**.
- Con otro rol → **403**.
- En páginas (no API) → redirige a `/login`.

Además, algunas acciones revisan que el recurso sea **del usuario**:
- Un cliente solo ve y edita **su** perfil y **sus** pedidos.
- Un domiciliario solo ve **sus** pedidos y los disponibles, y solo actualiza **su** ubicación.

## CSRF
**El ataque:** otra página web intenta enviar una petición a tu sistema aprovechando que tienes la
sesión abierta.
**La protección:** cada sesión tiene un **token** secreto (`Session::csrf()`). PHP lo entrega a React
en `window.__DATOS__`, y React lo envía en la cabecera `X-CSRF-Token` en todas las peticiones que
cambian datos. Si no coincide → **419**. Si el token venció, `api.ts` pide uno nuevo y repite la
petición sola.

Dónde: `verificarCsrf()` en `helpers.php`, `src/servicios/api.ts`.

## Inyección SQL
Todas las consultas usan **consultas preparadas**: los datos del usuario nunca se escriben dentro del
texto SQL; van por separado con `bind_param`. Por eso escribir `' OR 1=1 --` en un campo no hace nada.

## Intentos de login
5 fallos en 15 minutos (por correo **o** por IP) → **429** "Demasiados intentos". Cada intento queda en
la tabla `INTENTO_LOGIN`.

## Recuperación de contraseña
- El código vence en **15 minutos**, sirve **una sola vez** y se invalida después de **5 intentos** fallidos.
- La respuesta es la misma exista o no el correo (así nadie puede averiguar qué correos están registrados).

## Datos privados en las respuestas
- El **PIN de entrega** solo lo recibe el cliente dueño del pedido.
- El **teléfono del cliente** solo lo ve el domiciliario asignado cuando el pedido va en camino.
- Los costos y las recetas solo los recibe el administrador.
- Las contraseñas y PIN nunca se envían.

Dónde: `views/json/pedido.php`, `views/json/producto.php`, `Auth::usuarioActual()`.

## Precios y pagos
- El total **siempre** lo calcula el servidor.
- Los pagos digitales llevan una **firma** (HMAC con la clave `CLAVE_FIRMA` de `PagoService`): si alguien cambia el monto en el navegador, la firma no coincide.
- Una transacción solo se puede usar en **un** pedido.
- **Canje de puntos:** el saldo se vuelve a leer y se descuenta dentro de la misma transacción que
  crea el pedido, con la fila del cliente bloqueada (`FOR UPDATE`). Dos pedidos al mismo tiempo no
  pueden gastar los mismos puntos, y si el pedido falla (por ejemplo, sin stock) los puntos no se pierden.
- **Pedido manual y cambio de dirección:** solo el administrador (`POST /api/orders/manual`,
  `PATCH /api/orders/{id}/address`). El domiciliario solo puede guardar el destino de **sus** pedidos.

## Archivos subidos
Las fotos se revisan por su **contenido real** (no por el nombre), solo se aceptan JPG, PNG, WEBP y
GIF de hasta 5 MB, y se guardan con un nombre al azar.

## Cabeceras de seguridad
`configurarSeguridadHttp()` envía cabeceras que impiden mostrar el sitio dentro de otra página,
limitan de dónde se pueden cargar scripts e imágenes, y evitan que el navegador "adivine" tipos de archivo.

## Errores
Si en `config/app.php` está `'debug' => false`, los errores muestran un mensaje genérico ("Ocurrió un error interno") y el
detalle queda solo en el log de PHP. Nunca se muestran datos de la conexión.

## Antes de ponerlo en un servidor real
- [ ] En `config/app.php`: `'debug' => false` y `'entorno' => 'production'`.
- [ ] Una `CLAVE_FIRMA` propia y larga en `models/PagoService.php`.
- [ ] No cargar `seed.sql` (o cambiar todas sus contraseñas).
- [ ] Usuario de MySQL con contraseña (no `root` sin clave).
- [ ] HTTPS.
- [ ] Revisar las observaciones de la sección 4 de [el índice principal](../README.md).
