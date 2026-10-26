# controllers/AuthController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga del inicio de sesión y las cuentas.

## ¿Qué hace?
- registrarse
- pedir el código para recuperar la contraseña
- cambiar la contraseña con el código
- iniciar sesión
- cerrar sesión
- entregar el token de seguridad (sin él no se puede guardar nada)

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `register()` | registrarse | `POST /api/auth/register` |
| `forgotPasswordRequest()` | pedir el código para recuperar la contraseña | `POST /api/auth/forgot-password/request` |
| `forgotPasswordReset()` | cambiar la contraseña con el código | `POST /api/auth/forgot-password/reset` |
| `login()` | iniciar sesión | `POST /api/auth/login` |
| `logout()` | cerrar sesión | `POST /api/auth/logout` |
| `csrf()` | entregar el token de seguridad (sin él no se puede guardar nada) | `GET /api/auth/csrf` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** Login.tsx, KitchenDashboard.tsx y DeliveryDashboard.tsx (PIN); el botón "Cerrar sesión" de todos los paneles; SyncDatos.tsx; Register.tsx; ForgotPassword.tsx.
- **Usa los modelos:** `Cliente`, `CodigoVerificacion`, `IntentoLogin`, `CorreoService`.

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta

1. React llama la API (`src/servicios/api.ts`, con `fetch`, la cookie de sesión y el `X-CSRF-Token`).
2. `public/index.php` → `despacharRuta()` busca la ruta en `config/rutas.php`.
3. `verificarCsrf()` (si falla → 419) y `requiereRol()` (sin sesión → 401, otro rol → 403).
4. `cargarControlador()` pone la acción y los `{parametros}` en `$_GET` y hace `require` de este archivo.
5. Al final del archivo: `new AuthController()` y un `if` elige el método según `$_GET['accion']`.
6. El método le pide los datos a `Auth`, `Cliente`, `CodigoVerificacion`, `IntentoLogin`, `CorreoService` y estos usan `$conn` para ir a MySQL.
7. Contesta con `responderJson()` o `responderError()` (JSON para React).

**Sus rutas** (de `config/rutas.php`):

| Método | Dirección | Acción | Quién puede |
|---|---|---|---|
| `POST` | `/api/auth/login` | `login()` | pública (sin sesión) |
| `POST` | `/api/auth/logout` | `logout()` | pública (sin sesión) |
| `GET` | `/api/auth/csrf` | `csrf()` | pública (sin sesión) |
| `POST` | `/api/auth/register` | `register()` | pública (sin sesión) |
| `POST` | `/api/auth/forgot-password/request` | `forgotPasswordRequest()` | pública (sin sesión) |
| `POST` | `/api/auth/forgot-password/reset` | `forgotPasswordReset()` | pública (sin sesión) |

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué modelo se conecta `AuthController`?**  
Con `Auth`, `Cliente`, `CodigoVerificacion`, `IntentoLogin`, `CorreoService`. Los trae con `require_once __DIR__ . '/../models/...'` y los crea con `new` (los `static`, como `Auth`, se usan con `::`).

**¿El controlador se conecta directo a la base de datos?**  
No. El controlador nunca escribe SQL: se lo pide al modelo, y el modelo usa `$conn`.

**¿Quién llama a este controlador?**  
`cargarControlador()` de `config/helpers.php`, después de que `despacharRuta()` encuentra la ruta en `config/rutas.php`.

**¿Cómo sabe qué método ejecutar?**  
Por `$_GET['accion']`, que lo pone `cargarControlador()`. El `if` del final del archivo llama el método que corresponde.

**¿Cómo recibe los datos?**  
Con `entrada()` (junta `$_GET` y el JSON que mandó React) y el `{id}` de la dirección en `$_GET['id']`.

**¿Por qué el login es una ruta pública (`[]`)?**  
Porque para entrar todavía no tienes sesión. Si pidiera rol, nadie podría iniciar sesión.

**¿Cómo se conecta con el correo?**  
Con `CorreoService::enviarCodigoRecuperacion()`, que se conecta directo a Gmail (SMTP) con PHP puro.

**¿Cómo evita que adivinen la clave?**  
Con `IntentoLogin`: si hay muchos fallos, bloquea por un rato.

**¿Qué pasa si se borra este archivo?**  
Las rutas que lo usan dan error 500 (*"Failed opening required"*) y esa parte de la pantalla deja de funcionar.

**¿Qué pasa si se borra una ruta suya de `config/rutas.php`?**  
React recibe **404 Ruta no encontrada** al usar esa acción.

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Autenticacion (login, registro, sesion y recuperar contrasena)."* |
| 5 | `require_once __DIR__ . '/../models/Cliente.php';` | Trae el archivo `Cliente.php` para poder usar la clase `Cliente`. |
| 6 | `require_once __DIR__ . '/../models/CodigoVerificacion.php';` | Trae el archivo `CodigoVerificacion.php` para poder usar la clase `CodigoVerificacion`. |
| 7 | `require_once __DIR__ . '/../models/IntentoLogin.php';` | Trae el archivo `IntentoLogin.php` para poder usar la clase `IntentoLogin`. |
| 8 | `require_once __DIR__ . '/../models/CorreoService.php';` | Trae el archivo `CorreoService.php` para poder usar la clase `CorreoService`. |
| 10 | `class AuthController` | Crea la clase `AuthController`: un grupo de funciones que trabajan juntas. |
| 11 | `{` | Abre la clase `AuthController`. |
| 12 | `private $clienteModel;` | Cajita `$clienteModel` de la clase: aquí se guarda el modelo `Cliente`. |
| 13 | `private $codigoModel;` | Cajita `$codigoModel` de la clase: aquí se guarda el modelo `CodigoVerificacion`. |
| 14 | `private $intentoModel;` | Cajita `$intentoModel` de la clase: aquí se guarda el modelo `IntentoLogin`. |
| 15 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 17 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 18 | `{` | Abre la función `__construct()`. |
| 19 | `$this->clienteModel = new Cliente();` | Crea el modelo `Cliente` y lo guarda en `$this->clienteModel`, para usarlo en las funciones de abajo. |
| 20 | `$this->codigoModel = new CodigoVerificacion();` | Crea el modelo `CodigoVerificacion` y lo guarda en `$this->codigoModel`, para usarlo en las funciones de abajo. |
| 21 | `$this->intentoModel = new IntentoLogin();` | Crea el modelo `IntentoLogin` y lo guarda en `$this->intentoModel`, para usarlo en las funciones de abajo. |
| 22 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 23 | `}` | Cierra la función `__construct()`. |
| 25 | `public function register()` | Función `register()`: crea la cuenta de un cliente nuevo. Ruta: `POST /api/auth/register`. La llama la pantalla `Register.tsx`. |
| 26 | `{` | Abre la función `register()`. |
| 27 | `$nombre    = $this->datos['name'] ?? '';` | Guarda en `$nombre` el nombre que escribió. `?? ''` = si no lo mandó, vacío. |
| 28 | `$telefono  = trim((string) ($this->datos['phone'] ?? ''));` | Guarda en `$telefono` el teléfono, sin espacios al principio ni al final (`trim`). `(string)` = lo vuelve texto. |
| 29 | `$email     = trim((string) ($this->datos['email'] ?? ''));` | Guarda en `$email` el correo, sin espacios. |
| 30 | `$birthday  = $this->datos['birthday'] ?? '';` | Guarda en `$birthday` la fecha de nacimiento. |
| 31 | `$password  = (string) ($this->datos['password'] ?? '');` | Guarda en `$password` la contraseña. |
| 32 | `$confirmar = (string) ($this->datos['confirmPassword'] ?? '');` | Guarda en `$confirmar` la contraseña repetida (para compararlas). |
| 34 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 35 | `if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];` | Si el nombre está vacío, anota el error en `$errores['name']`. |
| 36 | `if (empty($this->datos['phone']) \|\| strlen((string) $this->datos['phone']) < 10) $errores['phone'] = ['El campo phone debe tener al menos 10 caracteres.'];` | Si el teléfono está vacío o tiene menos de 10 números (`strlen` cuenta los caracteres; `<` = menor que), anota el error. |
| 37 | `if (empty($this->datos['email']) \|\| !filter_var($this->datos['email'], FILTER_VALIDATE_EMAIL)) $errores['email'] = ['El campo email debe ser un correo válido.'];` | Si el correo está vacío o no es un correo válido (`filter_var(..., FILTER_VALIDATE_EMAIL)` lo revisa), anota el error. |
| 38 | `if (empty($this->datos['birthday'])) $errores['birthday'] = ['El campo birthday es obligatorio.'];` | Si la fecha de nacimiento está vacía, anota el error. |
| 39 | `if (empty($this->datos['password']) \|\| strlen($password) < 8) $errores['password'] = ['El campo password debe tener al menos 8 caracteres.'];` | Si la contraseña está vacía o tiene menos de 8 caracteres, anota el error. |
| 40 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 41 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 42 | `}` | Cierra el `if`. |
| 43 | `if (empty($this->datos['terms'])) {` | Si no aceptó los términos (la casilla `terms`)... |
| 44 | `responderError('Debes aceptar los términos y la política de tratamiento de datos (Habeas Data).', 422);` | ...responde 422 con el mensaje de los términos (Habeas Data) y termina. |
| 45 | `}` | Cierra el `if`. |
| 46 | `if ($password !== $confirmar) {` | Si las dos contraseñas no son iguales (`!==` = diferentes)... |
| 47 | `responderError('Las contraseñas no coinciden.', 422);` | ...responde 422 "Las contraseñas no coinciden." y termina. |
| 48 | `}` | Cierra el `if`. |
| 49 | `if ($this->clienteModel->correoOTelefonoExiste($email, $telefono) \|\| correoUsadoEnCualquierTabla($email)) {` | Si ya existe un cliente con ese correo o teléfono (`correoOTelefonoExiste()` de `models/Cliente.php`) **o** el correo ya lo usa otra cuenta (`correoUsadoEnCualquierTabla()` de `helpers.php`)... |
| 50 | `responderError('Ya existe una cuenta con ese correo o teléfono.', 409);` | ...responde 409 "Ya existe una cuenta..." y termina. |
| 51 | `}` | Cierra el `if`. |
| 53 | `$idCliente = $this->clienteModel->crear([` | Crea el cliente en la base de datos (`crear()` de `models/Cliente.php`) con estos datos, y guarda su número nuevo en `$idCliente`. |
| 54 | `'name'     => $nombre,` | El nombre. |
| 55 | `'phone'    => $telefono,` | El teléfono. |
| 56 | `'email'    => $email,` | El correo. |
| 57 | `'birthday' => $birthday,` | La fecha de nacimiento. |
| 58 | `'password' => $password,` | La contraseña (el modelo la cifra antes de guardarla). |
| 59 | `'ip'       => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',` | La IP del computador desde donde aceptó los términos. `?? '0.0.0.0'` = si no se sabe, `0.0.0.0`. |
| 60 | `]);` | Cierra la lista de datos y la instrucción. |
| 62 | `$usuario = Auth::login('client', $this->clienteModel->buscarCrudo($idCliente));` | Busca el cliente recién creado (`buscarCrudo()`) e inicia su sesión como cliente (`Auth::login('client', ...)` de `models/Auth.php`). Guarda sus datos en `$usuario`. |
| 63 | `responderJson(['user' => $usuario, 'csrfToken' => Session::csrf()], 201);` | Responde 201 (creado) con el usuario y el token de seguridad (`Session::csrf()`). React lo lleva a su panel. |
| 64 | `}` | Cierra la función `register()`. |
| 66 | `public function forgotPasswordRequest()` | Función `forgotPasswordRequest()`: envía el código para recuperar la contraseña. Ruta: `POST /api/auth/forgot-password/request`. La llama `ForgotPassword.tsx`. |
| 67 | `{` | Abre la función `forgotPasswordRequest()`. |
| 68 | `$email     = trim((string) ($this->datos['email'] ?? ''));` | Guarda en `$email` el correo que escribió. |
| 69 | `$idCliente = $this->clienteModel->buscarIdPorCorreo($email);` | Busca el cliente con ese correo (`buscarIdPorCorreo()` de `models/Cliente.php`) y guarda su número en `$idCliente` (o nada si no existe). |
| 70 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Si el correo no esta registrado, se avisa y no se envia nada."* |
| 71 | `if (!$idCliente) {` | Si **no** se encontró ningún cliente con ese correo (`!` = "no")... |
| 72 | `responderError('El correo es incorrecto o no existe.', 404);` | ...responde el error 404 (no encontrado) con el mensaje *"El correo es incorrecto o no existe."* (`responderError()` de `config/helpers.php`). `ForgotPassword.tsx` lo muestra en rojo debajo de la casilla. Aquí la función se detiene y no se envía nada. |
| 73 | `}` | Cierra el `if`. |
| 75 | `$codigo = (string) random_int(100000, 999999);` | Si llegó hasta aquí, el correo sí existe. Crea un código al azar de 6 números (`random_int(100000, 999999)`) y lo guarda en `$codigo`. |
| 76 | `$this->codigoModel->crearParaCliente($idCliente, $codigo);` | Guarda el código en la base de datos (`crearParaCliente()` de `models/CodigoVerificacion.php`). |
| 77 | `$enviado = CorreoService::enviarCodigoRecuperacion($email, $codigo, $this->clienteModel->buscarCrudo($idCliente)['nombre']);` | Envía el código por correo (`enviarCodigoRecuperacion()` de `models/CorreoService.php`). Le pasa 3 datos: el correo, el código y el nombre del cliente (`buscarCrudo()` de `models/Cliente.php` trae sus datos y `['nombre']` toma solo el nombre, para saludarlo en el correo). `$enviado` queda en `true` si salió. |
| 78 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Solo en local y si el correo no salio: se devuelve el codigo para poder probar."* |
| 79 | `global $config;` | Trae `$config` (los ajustes de `config/app.php`). |
| 80 | `if (!$enviado && $config['entorno'] === 'local') {` | Si el correo **no** salió (`!$enviado`) y estamos en tu computador (`'entorno'` = `'local'`)... |
| 81 | `responderJson(['ok' => true, 'debugCode' => $codigo]);` | ...responde el código en `debugCode`, para poder probar sin correo. |
| 82 | `}` | Cierra el `if`. |
| 83 | `responderJson(['ok' => true]);` | Responde `ok`: el código se envió al correo. |
| 84 | `}` | Cierra la función `forgotPasswordRequest()`. |
| 86 | `public function forgotPasswordReset()` | Función `forgotPasswordReset()`: cambia la contraseña usando el código. Ruta: `POST /api/auth/forgot-password/reset`. |
| 87 | `{` | Abre la función `forgotPasswordReset()`. |
| 88 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 89 | `if (empty($this->datos['email'])) $errores['email'] = ['El campo email es obligatorio.'];` | Si falta el correo, anota el error. |
| 90 | `if (empty($this->datos['code'])) $errores['code'] = ['El campo code es obligatorio.'];` | Si falta el código, anota el error. |
| 91 | `if (empty($this->datos['newPassword']) \|\| strlen((string) $this->datos['newPassword']) < 8) $errores['newPassword'] = ['El campo newPassword debe tener al menos 8 caracteres.'];` | Si falta la contraseña nueva o tiene menos de 8 caracteres, anota el error. |
| 92 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 93 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 94 | `}` | Cierra el `if`. |
| 96 | `$email       = trim((string) $this->datos['email']);` | Guarda en `$email` el correo, sin espacios. |
| 97 | `$codigo      = (string) $this->datos['code'];` | Guarda en `$codigo` el código que escribió. |
| 98 | `$nuevaClave  = (string) $this->datos['newPassword'];` | Guarda en `$nuevaClave` la contraseña nueva. |
| 100 | `$registro = $this->codigoModel->buscarValidoPorCorreo($email);` | Busca un código que siga sirviendo para ese correo (`buscarValidoPorCorreo()` de `models/CodigoVerificacion.php`) y lo guarda en `$registro`. |
| 101 | `if (!$registro) {` | Si no hay ninguno... |
| 102 | `responderError('Código inválido o expirado.', 422);` | ...responde 422 "Código inválido o expirado." y termina. |
| 103 | `}` | Cierra el `if`. |
| 104 | `if (!password_verify($codigo, $registro['codigo_hash'])) {` | Si el código que escribió no coincide con el guardado (`password_verify` compara con la versión cifrada)... |
| 105 | `$this->codigoModel->incrementarIntentos($registro['id_codigo']);` | ...suma un intento fallido (`incrementarIntentos()`; al quinto el código deja de servir)... |
| 106 | `responderError('Código inválido o expirado.', 422);` | ...y responde 422 "Código inválido o expirado.". |
| 107 | `}` | Cierra el `if`. |
| 109 | `$this->codigoModel->marcarUsado($registro['id_codigo']);` | Marca el código como usado (`marcarUsado()`), para que no sirva otra vez. |
| 110 | `$this->clienteModel->actualizarContrasena($registro['id_cliente'], password_hash($nuevaClave, PASSWORD_DEFAULT));` | Cifra la contraseña nueva (`password_hash`) y la guarda (`actualizarContrasena()` de `models/Cliente.php`). |
| 111 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 112 | `}` | Cierra la función `forgotPasswordReset()`. |
| 114 | `public function login()` | Función `login()`: inicia sesión. Ruta: `POST /api/auth/login`. La llaman `Login.tsx` (correo y contraseña) y los paneles de cocina y domiciliario (PIN). |
| 115 | `{` | Abre la función `login()`. |
| 116 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cocina y Domiciliario entran con 'pin'; admin y cliente con 'password'."* |
| 117 | `$usaPin = !empty($this->datos['pin']);` | Guarda en `$usaPin` si mandó un PIN (`true`) o no (`false`). Cocina y domiciliario usan PIN. |
| 119 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 120 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Con PIN tambien se acepta solo el usuario, sin "@dominio"."* |
| 121 | `$usuarioValido = $usaPin && !empty($this->datos['email']) && preg_match('/^[A-Za-z0-9._+-]{2,64}$/', (string) $this->datos['email']);` | Guarda en `$usuarioValido` si escribió un usuario sin `@` válido: solo cuenta con PIN, y `preg_match` revisa que sean letras, números o `. _ + -`, de 2 a 64 caracteres. |
| 122 | `if (empty($this->datos['email']) \|\| (!$usuarioValido && !filter_var($this->datos['email'], FILTER_VALIDATE_EMAIL))) {` | Si el correo está vacío, o no es un usuario válido y tampoco un correo válido... |
| 123 | `$errores['email'] = [$usaPin ? 'Ingresa tu usuario (lo que va antes del @) o tu correo.' : 'El campo email debe ser un correo válido.'];` | ...anota el error. El mensaje cambia si usa PIN (`? :` = si usa PIN, un mensaje; si no, el otro). |
| 124 | `}` | Cierra el `if`. |
| 125 | `if ($usaPin) {` | Si usa PIN... |
| 126 | `if (!preg_match('/^\d{4}$/', (string) $this->datos['pin'])) $errores['pin'] = ['El PIN debe tener 4 dígitos.'];` | ...revisa que sean exactamente 4 números (`/^\d{4}$/`); si no, anota el error. |
| 127 | `} else {` | Si no usa PIN... |
| 128 | `if (empty($this->datos['password'])) $errores['password'] = ['El campo password es obligatorio.'];` | ...revisa que haya escrito la contraseña. |
| 129 | `}` | Cierra el `else`. |
| 130 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 131 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 132 | `}` | Cierra el `if`. |
| 134 | `$email = trim((string) $this->datos['email']);` | Guarda en `$email` el correo (o usuario), sin espacios. |
| 135 | `$ip    = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';` | Guarda en `$ip` la IP del computador. |
| 137 | `if ($this->intentoModel->excedeLimite($email)) {` | Si ese correo ya tuvo 5 intentos fallidos en el último minuto (`excedeLimite()` de `models/IntentoLogin.php`)... Solo cuenta los de ese correo, así otro perfil puede entrar desde el mismo computador. |
| 138 | `responderError('Demasiados intentos fallidos. Espera 1 minuto e intenta de nuevo.', 429);` | ...responde 429 "Demasiados intentos fallidos. Espera 1 minuto..." y termina. |
| 139 | `}` | Cierra el `if`. |
| 141 | `if ($usaPin) {` | Si usa PIN... |
| 142 | `$usuario = Auth::intentarLoginConPin($email, (string) $this->datos['pin']);` | ...intenta entrar con el PIN (`Auth::intentarLoginConPin()` de `models/Auth.php`). Si sale bien, `$usuario` tiene sus datos. |
| 143 | `} else {` | Si no... |
| 144 | `$usuario = Auth::intentarLogin($email, (string) $this->datos['password']);` | ...intenta entrar con correo y contraseña (`Auth::intentarLogin()`). |
| 145 | `}` | Cierra el `else`. |
| 146 | `$this->intentoModel->registrar($email, $ip, (bool) $usuario);` | Guarda el intento (`registrar()` de `models/IntentoLogin.php`): el correo, la IP y si salió bien. `(bool)` = sí/no. |
| 148 | `if (!$usuario) {` | Si no pudo entrar (`!$usuario`)... |
| 149 | `responderError($usaPin ? 'Usuario o PIN incorrectos.' : 'Correo o contraseña incorrectos.', 401);` | ...responde 401 con "Usuario o PIN incorrectos." o "Correo o contraseña incorrectos.". |
| 150 | `}` | Cierra el `if`. |
| 151 | `responderJson(['user' => $usuario, 'csrfToken' => Session::csrf()]);` | Si entró, responde con sus datos y el token de seguridad. React lo lleva a su panel. |
| 152 | `}` | Cierra la función `login()`. |
| 154 | `public function logout()` | Función `logout()`: cierra la sesión. Ruta: `POST /api/auth/logout`. La llama el botón "Cerrar sesión". |
| 155 | `{` | Abre la función `logout()`. |
| 156 | `Auth::logout();` | Cierra la sesión (`Auth::logout()` de `models/Auth.php`). |
| 157 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 158 | `}` | Cierra la función `logout()`. |
| 160 | `public function csrf()` | Función `csrf()`: entrega el token de seguridad. Ruta: `GET /api/auth/csrf`. La llama `SyncDatos.tsx`. |
| 161 | `{` | Abre la función `csrf()`. |
| 162 | *(comentario)* | Comentario: no se ejecuta. Dice: *"No exige sesion: lo usa el visitante para tener su primer token CSRF."* |
| 163 | `responderJson(['csrfToken' => Session::csrf()]);` | Responde el token (`Session::csrf()` de `config/Session.php`). |
| 164 | `}` | Cierra la función `csrf()`. |
| 165 | `}` | Cierra la clase `AuthController`. |
| 167 | `$controller = new AuthController();` | Crea el controlador. Al hacer `new AuthController()` se ejecuta su `__construct()`. |
| 169 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 171 | `if ($accion === 'register') {` | Si la acción es `'register'`... |
| 172 | `$controller->register();` | ...llama al método `register()` de arriba. |
| 173 | `} elseif ($accion === 'forgotPasswordRequest') {` | Si no, si la acción es `'forgotPasswordRequest'`... |
| 174 | `$controller->forgotPasswordRequest();` | ...llama al método `forgotPasswordRequest()` de arriba. |
| 175 | `} elseif ($accion === 'forgotPasswordReset') {` | Si no, si la acción es `'forgotPasswordReset'`... |
| 176 | `$controller->forgotPasswordReset();` | ...llama al método `forgotPasswordReset()` de arriba. |
| 177 | `} elseif ($accion === 'login') {` | Si no, si la acción es `'login'`... |
| 178 | `$controller->login();` | ...llama al método `login()` de arriba. |
| 179 | `} elseif ($accion === 'logout') {` | Si no, si la acción es `'logout'`... |
| 180 | `$controller->logout();` | ...llama al método `logout()` de arriba. |
| 181 | `} elseif ($accion === 'csrf') {` | Si no, si la acción es `'csrf'`... |
| 182 | `$controller->csrf();` | ...llama al método `csrf()` de arriba. |
| 183 | `} else {` | Si no es ninguna de las anteriores... |
| 184 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 185 | `}` | Cierra el `else`. |
| 186 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código | `Failed to open stream` |
| el `require_once` de `Cliente.php` | todas sus acciones | `Class "Cliente" not found` |
| el `require_once` de `CodigoVerificacion.php` | todas sus acciones | `Class "CodigoVerificacion" not found` |
| el `require_once` de `IntentoLogin.php` | todas sus acciones | `Class "IntentoLogin" not found` |
| el `require_once` de `CorreoService.php` | pedir el código para recuperar la contraseña | `Class "CorreoService" not found` |
| el método `register()` | registrarse | `Call to undefined method AuthController::register()` |
| el método `forgotPasswordRequest()` | pedir el código para recuperar la contraseña | `Call to undefined method AuthController::forgotPasswordRequest()` |
| el método `forgotPasswordReset()` | cambiar la contraseña con el código | `Call to undefined method AuthController::forgotPasswordReset()` |
| el método `login()` | iniciar sesión | `Call to undefined method AuthController::login()` |
| el método `logout()` | cerrar sesión | `Call to undefined method AuthController::logout()` |
| el método `csrf()` | entregar el token de seguridad (sin él no se puede guardar nada) | `Call to undefined method AuthController::csrf()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
