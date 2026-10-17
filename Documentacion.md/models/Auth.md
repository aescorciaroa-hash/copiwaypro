# models/Auth.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Sabe quién inició sesión y con qué rol.

## ¿Qué hace?
- dice si hay alguien con sesión iniciada
- dice el rol del usuario
- dice el id del usuario
- inicia sesión con correo y contraseña
- inicia sesión con PIN (cocina y domiciliario)
- guarda el usuario en la sesión
- trae los datos del usuario que inició sesión
- cierra la sesión

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `check()` | dice si hay alguien con sesión iniciada | `requiereSesion()`, `Auth::usuarioActual()`, `ClientController::autorizarPropioOAdmin()`, `ClientController::changePassword()`, `PaginaController::mostrar()`, `StaffController::updateLocation()`, `SyncController::index()` |
| `rol()` | dice el rol del usuario | `requiereRol()`, `Auth::usuarioActual()`, `ClientController::autorizarPropioOAdmin()`, `ClientController::changePassword()`, `ClientController::update()`, `OrderController::index()`, `OrderController::markPreparing()`, `OrderController::markReady()`, `OrderController::release()`, `OrderController::responderPedido()`, `PaginaController::mostrar()`, `StaffController::updateLocation()`, `SyncController::index()` |
| `id()` | dice el id del usuario | `Auth::usuarioActual()`, `CashClosingController::preview()`, `CashClosingController::store()`, `ClientController::autorizarPropioOAdmin()`, `ClientController::changePassword()`, `InventoryController::adjustStock()`, `InventoryController::store()`, `OrderController::accept()`, `OrderController::deliver()`, `OrderController::index()`, `OrderController::markPreparing()`, `OrderController::markReady()`, `OrderController::release()`, `OrderController::responderPedido()`, `OrderController::review()`, `OrderController::store()`, `OrderController::storeManual()`, `OrderController::take()`, `OrderController::updateDestination()`, `PaymentController::createTransaction()`, `PaymentController::prepare()`, `PaymentController::showTransaction()`, `PushController::subscribe()`, `StaffController::store()`, `StaffController::updateLocation()`, `SyncController::index()` |
| `buscarPorCorreo()` (privado) | busca una cuenta por su correo | `Auth::intentarLogin()`, `Auth::intentarLoginConPin()` |
| `intentarLogin()` | inicia sesión con correo y contraseña | `AuthController::login()` |
| `intentarLoginConPin()` | inicia sesión con PIN (cocina y domiciliario) | `AuthController::login()` |
| `usuarioSinDominio()` (privado) | permite escribir el usuario sin el @ | `Auth::intentarLoginConPin()` |
| `login()` | guarda el usuario en la sesión | `Auth::intentarLogin()`, `Auth::intentarLoginConPin()`, `AuthController::register()` |
| `usuarioActual()` | trae los datos del usuario que inició sesión | `requiereSesion()`, `PaginaController::mostrar()` |
| `logout()` | cierra la sesión | `Auth::usuarioActual()`, `AuthController::logout()` |

## ¿Con qué se conecta?
- **Lo carga:** `public/index.php` (en todas las peticiones).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Autenticacion y control de acceso por rol. Roles: admin, kitchen (cocina), delivery (domiciliario) y client (cliente)."* |
| 6 | `class Auth` | Crea la clase `Auth`: sabe quién inició sesión y con qué rol. Todos sus métodos son `static` (se usan como `Auth::id()`, sin `new`). La carga `public/index.php`. |
| 7 | `{` | Abre la clase `Auth`. |
| 8 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Tabla y llave primaria de cada rol."* |
| 9 | `const TABLAS = [` | Constante `TABLAS`: para cada rol, en qué tabla está y cómo se llama su columna id. |
| 10 | `'admin'    => ['ADMINISTRADOR',   'id_admin'],` | Administrador → tabla `ADMINISTRADOR`, columna `id_admin`. |
| 11 | `'kitchen'  => ['AYUDANTE_COCINA', 'id_ayudante'],` | Cocina → tabla `AYUDANTE_COCINA`, columna `id_ayudante`. |
| 12 | `'delivery' => ['DOMICILIARIO',    'id_domiciliario'],` | Domiciliario → tabla `DOMICILIARIO`, columna `id_domiciliario`. |
| 13 | `'client'   => ['CLIENTE',         'id_cliente'],` | Cliente → tabla `CLIENTE`, columna `id_cliente`. |
| 14 | `];` | Cierra la lista. |
| 16 | `public static function check()` | Método `check()`: dice si hay alguien con sesión iniciada. Lo usan `helpers.php` y los controladores. |
| 17 | `{` | Abre la función `check()`. |
| 18 | `return isset($_SESSION['usuario_id'], $_SESSION['usuario_rol']);` | Devuelve `true` si en la sesión están guardados el id y el rol del usuario (`isset` = existen). |
| 19 | `}` | Cierra la función `check()`. |
| 21 | `public static function rol()` | Método `rol()`: dice el rol del usuario (`admin`, `client`, `kitchen` o `delivery`). |
| 22 | `{` | Abre la función `rol()`. |
| 23 | `return $_SESSION['usuario_rol'] ?? null;` | Devuelve el rol guardado en la sesión; si no hay, `null`. |
| 24 | `}` | Cierra la función `rol()`. |
| 26 | `public static function id()` | Método `id()`: dice el número del usuario. |
| 27 | `{` | Abre la función `id()`. |
| 28 | `return $_SESSION['usuario_id'] ?? null;` | Devuelve el id guardado en la sesión; si no hay, `null`. |
| 29 | `}` | Cierra la función `id()`. |
| 31 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca una cuenta por correo dentro de una tabla."* |
| 32 | `private static function buscarPorCorreo($tabla, $correo)` | Método `buscarPorCorreo($tabla, $correo)` (privado): busca una cuenta por su correo en una tabla. |
| 33 | `{` | Abre la función `buscarPorCorreo()`. |
| 34 | `global $conn;` | Trae la conexión `$conn` (de `config/database.php`). Como es `static`, no tiene `$this->conn`. |
| 35 | `$correo = (string) $correo;` | Convierte el correo a texto. |
| 36 | `$stmt = $conn->prepare("SELECT * FROM {$tabla} WHERE correo = ? LIMIT 1");` | Prepara la consulta: "trae todo (`*`) de esa tabla donde el correo sea `?`, solo uno (`LIMIT 1`)". `{$tabla}` pone el nombre de la tabla. |
| 37 | `$stmt->bind_param("s", $correo);` | Llena los `?` de la consulta, en orden: `$correo` (texto). |
| 38 | `$stmt->execute();` | Ejecuta la consulta. |
| 39 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 40 | `$stmt->close();` | Cierra la consulta. |
| 41 | `return $row ?: null;` | Devuelve `$row`; si está vacío, devuelve `null` (nada). |
| 42 | `}` | Cierra la función `buscarPorCorreo()`. |
| 44 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Login con correo y contrasena probando las 4 tablas. Devuelve el usuario o null."* |
| 45 | `public static function intentarLogin($correo, $clave)` | Método `intentarLogin($correo, $clave)`: inicia sesión con correo y contraseña. Lo usa `AuthController::login()`. |
| 46 | `{` | Abre la función `intentarLogin()`. |
| 47 | `foreach (self::TABLAS as $rol => $datosTabla) {` | Recorre las 4 tablas de `TABLAS`. `$rol` es el rol y `$datosTabla` es `[tabla, columna id]`. |
| 48 | `$fila = self::buscarPorCorreo($datosTabla[0], $correo);` | Busca el correo en esa tabla (`$datosTabla[0]` = el nombre de la tabla) y guarda la fila en `$fila`. |
| 49 | `if (!$fila) {` | Si no lo encontró en esta tabla... |
| 50 | `continue;` | ...`continue` = sigue con la siguiente tabla. |
| 51 | `}` | Cierra el `if`. |
| 52 | `if (!password_verify($clave, $fila['contrasena']) \|\| !$fila['activo']) {` | Si la contraseña no coincide (`password_verify` la compara con la cifrada) **o** la cuenta está desactivada... |
| 53 | `return null;` | ...devuelve `null` (no entra). |
| 54 | `}` | Cierra el `if`. |
| 55 | `return self::login($rol, $fila);` | Si todo está bien, inicia la sesión (`login()` de abajo) y devuelve sus datos. |
| 56 | `}` | Cierra el `foreach`. |
| 57 | `return null;` | Si no lo encontró en ninguna tabla, devuelve `null`. |
| 58 | `}` | Cierra la función `intentarLogin()`. |
| 60-63 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Login con PIN de 4 digitos, solo para cocina y domiciliario. Se puede escribir solo el usuario (lo que va antes del @)."* |
| 64 | `public static function intentarLoginConPin($correo, $pin)` | Método `intentarLoginConPin($correo, $pin)`: inicia sesión con PIN (solo cocina y domiciliario). Lo usa `AuthController::login()`. |
| 65 | `{` | Abre la función `intentarLoginConPin()`. |
| 66 | `$roles = ['kitchen', 'delivery'];` | Lista de roles que pueden entrar con PIN. |
| 68 | `if (strpos($correo, '@') === false) {` | Si lo que escribió no tiene `@` (escribió solo el usuario)... |
| 69 | `$correo = self::usuarioSinDominio($correo, $roles);` | ...busca el correo completo (`usuarioSinDominio()` de abajo). |
| 70 | `if ($correo === null) {` | Si no lo encontró... |
| 71 | `return null;` | ...devuelve `null`. |
| 72 | `}` | Cierra el `if`. |
| 73 | `}` | Cierra el `if`. |
| 75 | `foreach ($roles as $rol) {` | Recorre los dos roles (cocina y domiciliario). |
| 76 | `$fila = self::buscarPorCorreo(self::TABLAS[$rol][0], $correo);` | Busca el correo en la tabla de ese rol. |
| 77 | `if (!$fila) {` | Si no está... |
| 78 | `continue;` | ...sigue con el otro rol. |
| 79 | `}` | Cierra el `if`. |
| 80 | `if (empty($fila['pin']) \|\| !password_verify($pin, $fila['pin']) \|\| !$fila['activo']) {` | Si no tiene PIN, o el PIN no coincide, o está desactivado... |
| 81 | `return null;` | ...devuelve `null`. |
| 82 | `}` | Cierra el `if`. |
| 83 | `return self::login($rol, $fila);` | Si todo está bien, inicia la sesión y devuelve sus datos. |
| 84 | `}` | Cierra el `foreach`. |
| 85 | `return null;` | Si no lo encontró, devuelve `null`. |
| 86 | `}` | Cierra la función `intentarLoginConPin()`. |
| 88 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Correo completo cuyo usuario (antes del @) coincide; null si no existe o hay mas de uno."* |
| 89 | `private static function usuarioSinDominio($usuario, $roles)` | Método `usuarioSinDominio($usuario, $roles)` (privado): busca el correo completo cuando se escribe solo lo de antes del `@`. |
| 90 | `{` | Abre la función `usuarioSinDominio()`. |
| 91 | `global $conn;` | Trae la conexión `$conn`. |
| 92 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Se escapan los comodines de LIKE que escriba el usuario."* |
| 93 | `$patron = addcslashes($usuario, '%_\\') . '@%';` | Arma el patrón de búsqueda: lo que escribió + `@%` (el `%` significa "lo que sea"). `addcslashes` evita que los símbolos `%` y `_` que escriba el usuario cambien la búsqueda. |
| 94 | `$encontrados = [];` | `$encontrados` empieza como lista vacía. |
| 95 | `foreach ($roles as $rol) {` | Recorre los roles. |
| 96 | `$tabla = self::TABLAS[$rol][0];` | Guarda en `$tabla` el nombre de la tabla de ese rol. |
| 97 | `$stmt = $conn->prepare("SELECT correo FROM {$tabla} WHERE correo LIKE ? AND activo = 1");` | Prepara la consulta: "trae los correos que empiecen así (`LIKE`) y estén activos". |
| 98 | `$stmt->bind_param("s", $patron);` | Llena los `?` de la consulta, en orden: `$patron` (texto). |
| 99 | `$stmt->execute();` | Ejecuta la consulta. |
| 100 | `$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);` | Trae **todas** las filas que encontró y las guarda en `$rows` (una lista). |
| 101 | `$stmt->close();` | Cierra la consulta. |
| 102 | `foreach ($rows as $row) {` | Recorre cada correo encontrado. |
| 103 | `$encontrados[strtolower($row['correo'])] = $row['correo'];` | Lo guarda en `$encontrados` (en minúscula como clave, para no repetirlo). |
| 104 | `}` | Cierra el `foreach`. |
| 105 | `}` | Cierra el `foreach`. |
| 106 | `return count($encontrados) === 1 ? array_values($encontrados)[0] : null;` | Si encontró exactamente uno (`count(...) === 1`), lo devuelve; si encontró cero o varios, devuelve `null`. |
| 107 | `}` | Cierra la función `usuarioSinDominio()`. |
| 109 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Inicia sesion guardando el usuario y su rol (regenerando el id de sesion)."* |
| 110 | `public static function login($rol, $fila)` | Método `login($rol, $fila)`: guarda al usuario en la sesión. Lo usan `intentarLogin()`, `intentarLoginConPin()` y `AuthController::register()`. |
| 111 | `{` | Abre la función `login()`. |
| 112 | `$idCol = self::TABLAS[$rol][1];` | Guarda en `$idCol` el nombre de la columna id de ese rol (ej. `id_cliente`). |
| 113 | `session_regenerate_id(true);` | Cambia el número de la sesión por uno nuevo (`session_regenerate_id`), por seguridad. |
| 114 | `$_SESSION['usuario_id'] = $fila[$idCol];` | Guarda en la sesión el número del usuario. |
| 115 | `$_SESSION['usuario_rol'] = $rol;` | Guarda en la sesión su rol. |
| 117 | `return [` | Devuelve una lista con los datos para React: |
| 118 | `'id'    => (string) $fila[$idCol],` | `'id'`: su número, como texto. |
| 119 | `'role'  => $rol,` | `'role'`: su rol. |
| 120 | `'name'  => $fila['nombre'],` | `'name'`: su nombre. |
| 121 | `'email' => $fila['correo'],` | `'email'`: su correo. |
| 122 | `];` | Cierra la lista. |
| 123 | `}` | Cierra la función `login()`. |
| 125-128 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Vuelve a leer al usuario de la base de datos, para que una cuenta desactivada pierda el acceso de inmediato. Si ya no existe o esta inactiva, cierra la sesion."* |
| 129 | `public static function usuarioActual()` | Método `usuarioActual()`: trae los datos del usuario desde la base de datos. Si lo desactivaron, le cierra la sesión. Lo usan `helpers.php` y `PaginaController`. |
| 130 | `{` | Abre la función `usuarioActual()`. |
| 131 | `global $conn;` | Trae la conexión `$conn`. |
| 132 | `if (!self::check()) {` | Si no hay sesión... |
| 133 | `return null;` | ...devuelve `null`. |
| 134 | `}` | Cierra el `if`. |
| 136 | `$tabla = self::TABLAS[self::rol()][0];` | Guarda en `$tabla` la tabla de su rol. |
| 137 | `$idCol = self::TABLAS[self::rol()][1];` | Guarda en `$idCol` la columna id de su rol. |
| 138 | `$id = (string) self::id();` | Guarda en `$id` su número, como texto. |
| 139 | `$stmt = $conn->prepare("SELECT * FROM {$tabla} WHERE {$idCol} = ? LIMIT 1");` | Prepara la consulta: "trae todo de esa tabla donde el id sea `?`". |
| 140 | `$stmt->bind_param("s", $id);` | Llena los `?` de la consulta, en orden: `$id` (texto). |
| 141 | `$stmt->execute();` | Ejecuta la consulta. |
| 142 | `$fila = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$fila` (si no encontró nada, queda vacía). |
| 143 | `$stmt->close();` | Cierra la consulta. |
| 145 | `if (!$fila \|\| !$fila['activo']) {` | Si ya no existe o está desactivado... |
| 146 | `self::logout();` | ...le cierra la sesión (`logout()` de abajo)... |
| 147 | `return null;` | ...y devuelve `null`. |
| 148 | `}` | Cierra el `if`. |
| 150 | `unset($fila['contrasena'], $fila['pin']);` | Quita la contraseña y el PIN de los datos (`unset` = borrar), para no enviarlos a React. |
| 151 | `$fila['role'] = self::rol();` | Le agrega su rol. |
| 152 | `return $fila;` | Devuelve sus datos. |
| 153 | `}` | Cierra la función `usuarioActual()`. |
| 155 | `public static function logout()` | Método `logout()`: cierra la sesión. Lo usa `AuthController::logout()`. |
| 156 | `{` | Abre la función `logout()`. |
| 157 | `unset($_SESSION['usuario_id'], $_SESSION['usuario_rol']);` | Borra de la sesión el id y el rol. |
| 158 | `Session::destroy();` | Destruye la sesión completa (`Session::destroy()` de `config/Session.php`). |
| 159 | `}` | Cierra la función `logout()`. |
| 160 | `}` | Cierra la clase `Auth`. |
| 161 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** | `Failed to open stream` |
| el método `check()` | **todo el sistema** | `Call to undefined method Auth::check()` |
| el método `rol()` | **todo el sistema** | `Call to undefined method Auth::rol()` |
| el método `id()` | **todo el sistema** | `Call to undefined method Auth::id()` |
| el método `buscarPorCorreo()` | iniciar sesión | `Call to undefined method Auth::buscarPorCorreo()` |
| el método `intentarLogin()` | iniciar sesión | `Call to undefined method Auth::intentarLogin()` |
| el método `intentarLoginConPin()` | iniciar sesión | `Call to undefined method Auth::intentarLoginConPin()` |
| el método `usuarioSinDominio()` | iniciar sesión | `Call to undefined method Auth::usuarioSinDominio()` |
| el método `login()` | iniciar sesión, registrarse | `Call to undefined method Auth::login()` |
| el método `usuarioActual()` | **todo el sistema** | `Call to undefined method Auth::usuarioActual()` |
| el método `logout()` | **todo el sistema** | `Call to undefined method Auth::logout()` |
| la constante `TABLAS` | lo que la usa dentro de la clase | `Undefined constant Auth::TABLAS` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
