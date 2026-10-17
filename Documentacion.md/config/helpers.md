# config/helpers.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Tiene las funciones que usa todo el sistema.

## ¿Qué hace?
- busca la ruta y carga el controlador (el router)
- responde a React
- revisa la sesión, el rol y el token de seguridad
- muestra las vistas
- carga los archivos de views/json/

## Sus funciones
| Función | Qué hace |
|---|---|
| `rutaBase()` | dice en qué carpeta está el proyecto (ej. /copiwaypro) |
| `quitarRutaBase()` | le quita esa carpeta a la dirección |
| `configurarManejadorErrores()` | prepara qué hacer cuando ocurre un error |
| `manejarError()` | guarda el error y le responde a React |
| `configurarSeguridadHttp()` | agrega protecciones al navegador |
| `entrada()` | lee los datos que envió React |
| `correoUsadoEnCualquierTabla()` | revisa si un correo ya está registrado |
| `tiposDe()` | arma las letras de tipos para bind_param (s, i, d) |
| `redirect()` | manda al usuario a otra página |
| `verificarCsrf()` | revisa el token de seguridad |
| `responderJson()` | le responde a React con datos |
| `responderError()` | le responde a React con un error |
| `mostrarVista()` | muestra una vista de views/paginas/ |
| `requiereSesion()` | exige que el usuario haya iniciado sesión |
| `requiereRol()` | exige un rol (administrador, cliente, cocina o domiciliario) |
| `cargarControlador()` | carga el controlador que toca |
| `despacharRuta()` | busca la ruta de la API y la atiende |
| `despacharPagina()` | busca la página y la abre |

## ¿Con qué se conecta?
- **Lo carga:** `public/index.php` (en todas las peticiones).
- **Carga:** los 5 archivos de `views/json/`.
- **Lee:** `config/rutas.php` y `config/paginas.php`.
- **Carga los controladores** de `controllers/`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Funciones auxiliares usadas en toda la app."* |
| 6 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Funciones que convierten filas de la base de datos al JSON del frontend."* |
| 7 | `require_once __DIR__ . '/../views/json/pedido.php';` | Trae `views/json/pedido.php`: la función `pedido_a_json()` (organiza los pedidos para React). |
| 8 | `require_once __DIR__ . '/../views/json/ingrediente.php';` | Trae `views/json/ingrediente.php`: organiza los insumos e ingredientes. |
| 9 | `require_once __DIR__ . '/../views/json/cliente.php';` | Trae `views/json/cliente.php`: organiza los clientes y sus notificaciones. |
| 10 | `require_once __DIR__ . '/../views/json/producto.php';` | Trae `views/json/producto.php`: organiza los productos. |
| 11 | `require_once __DIR__ . '/../views/json/personal.php';` | Trae `views/json/personal.php`: organiza el personal. |
| 13-16 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Ruta base de la app (ej. '/copiwaypro'), para que funcione igual en subcarpeta, servidor embebido o raiz. 'ruta_base' en config/app.php la puede forzar."* |
| 17 | `function rutaBase()` | Función `rutaBase()`: dice en qué carpeta está el proyecto (por ejemplo `/copiwaypro`). La usan `Session`, las vistas y `redirect()`. |
| 18 | `{` | Abre la función `rutaBase()`. |
| 19 | `global $config;` | Trae la variable `$config` (los ajustes de `config/app.php`) que está fuera de la función. |
| 20 | `$forzada = $config['ruta_base'];` | Guarda en `$forzada` el ajuste `'ruta_base'` de `config/app.php`. |
| 21 | `if ($forzada !== '') {` | Si `$forzada` no está vacía (`!==` = diferente)... |
| 22 | `return rtrim($forzada, '/');` | ...devuelve esa carpeta, quitándole la `/` del final (`rtrim`). |
| 23 | `}` | Cierra el `if`. |
| 25 | `$directorio = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));` | Si no, la calcula: toma la carpeta de `index.php` (`dirname` de `$_SERVER['SCRIPT_NAME']`) y cambia `\` por `/` (`str_replace`). La guarda en `$directorio`. |
| 26 | `$calculada = rtrim(preg_replace('#/public$#', '', $directorio), '/');` | A `$directorio` le quita `/public` del final (`preg_replace`) y la `/` final. Queda la carpeta del proyecto en `$calculada`. |
| 28 | `if ($calculada === '' \|\| $calculada === '.') {` | Si `$calculada` quedó vacía o es `.` (`\|\|` = "o")... |
| 29 | `return '';` | ...devuelve vacío: el proyecto está en la raíz. |
| 30 | `}` | Cierra el `if`. |
| 31 | `return $calculada;` | Si no, devuelve la carpeta calculada. |
| 32 | `}` | Cierra la función `rutaBase()`. |
| 34 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Quita la ruta base del inicio de un path."* |
| 35 | `function quitarRutaBase($path)` | Función `quitarRutaBase($path)`: le quita la carpeta del proyecto a una dirección (`/copiwaypro/api/products` → `/api/products`). La usa `public/index.php`. |
| 36 | `{` | Abre la función `quitarRutaBase()`. |
| 37 | `$base = rutaBase();` | Guarda en `$base` la carpeta del proyecto (`rutaBase()` de arriba). |
| 38 | `if ($base !== '' && strpos($path, $base) === 0) {` | Si hay carpeta y la dirección empieza con ella (`strpos(...) === 0`)... |
| 39 | `$path = substr($path, strlen($base));` | ...le corta ese pedazo del principio (`substr` corta; `strlen` cuenta las letras). |
| 40 | `}` | Cierra el `if`. |
| 41 | `return $path === '' ? '/' : $path;` | Devuelve la dirección. `? :` = si quedó vacía, devuelve `/`; si no, la dirección. |
| 42 | `}` | Cierra la función `quitarRutaBase()`. |
| 44 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Si algo falla sin capturar: se guarda en el log y se responde un mensaje generico."* |
| 45 | `function configurarManejadorErrores()` | Función `configurarManejadorErrores()`: la llama `public/index.php` al empezar. |
| 46 | `{` | Abre la función `configurarManejadorErrores()`. |
| 47 | `set_exception_handler('manejarError');` | Le dice a PHP: "si ocurre un error que nadie atrapó, llama a `manejarError()`". |
| 48 | `}` | Cierra la función `configurarManejadorErrores()`. |
| 50 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Guarda el error en el log y responde (con el detalle solo si 'debug' esta activo)."* |
| 51 | `function manejarError($e)` | Función `manejarError($e)`: qué hacer con un error. `$e` es el error. |
| 52 | `{` | Abre la función `manejarError()`. |
| 53 | `global $config;` | Trae `$config` (los ajustes de `config/app.php`). |
| 54 | `error_log($e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());` | Guarda el error en el archivo de errores de PHP (`error_log`): el mensaje, el archivo y la línea. `.` une los textos. |
| 56 | `if ($config['debug']) {` | Si `'debug'` es `true` (en `config/app.php`)... |
| 57 | `responderError($e->getMessage(), 500, ['trace' => explode("\n", $e->getTraceAsString())]);` | ...le responde a React con el mensaje real del error y el recorrido (`trace`) para encontrarlo. Código 500 = error. |
| 58 | `}` | Cierra el `if`. |
| 59 | `responderError('Ocurrio un error interno.', 500);` | Si no, responde un mensaje general: "Ocurrio un error interno." |
| 60 | `}` | Cierra la función `manejarError()`. |
| 62 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Cabeceras de seguridad y CORS de mismo origen."* |
| 63 | `function configurarSeguridadHttp()` | Función `configurarSeguridadHttp()`: protege el navegador. La llama `public/index.php`. |
| 64 | `{` | Abre la función `configurarSeguridadHttp()`. |
| 65 | `header('X-Content-Type-Options: nosniff');` | `header(...)` manda una instrucción al navegador. Esta: "no adivines el tipo de archivo". |
| 66 | `header('X-Frame-Options: DENY');` | "Nadie puede meter esta página dentro de otra página." |
| 67 | `header('Referrer-Policy: strict-origin-when-cross-origin');` | "No le digas a otras páginas de dónde viene el usuario." |
| 68 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Permite: el script inline del layout, estilos inline de React, Google Fonts,"* |
| 69 | *(comentario)* | Comentario: no se ejecuta. Dice: *"imagenes de Unsplash, mapas de OpenStreetMap, rutas (OSRM), geocodificacion"* |
| 70 | *(comentario)* | Comentario: no se ejecuta. Dice: *"(Nominatim) y el PDF del cierre de caja en un iframe blob:."* |
| 71 | `header(` | Le dice al navegador de dónde puede cargar cosas: código, estilos, letras (Google Fonts), imágenes (Unsplash, mapas de OpenStreetMap) y conexiones (rutas del mapa). Todo lo demás lo bloquea. |
| 72 | `"Content-Security-Policy: default-src 'self'; " .` | ↑ (sigue la misma instrucción) |
| 73 | `"script-src 'self' 'unsafe-inline'; " .` | ↑ (sigue la misma instrucción) |
| 74 | `"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .` | ↑ (sigue la misma instrucción) |
| 75 | `"font-src 'self' https://fonts.gstatic.com; " .` | ↑ (sigue la misma instrucción) |
| 76 | `"img-src 'self' data: https://images.unsplash.com https://*.tile.openstreetmap.org; " .` | ↑ (sigue la misma instrucción) |
| 77 | `"connect-src 'self' https://router.project-osrm.org https://nominatim.openstreetmap.org; " .` | ↑ (sigue la misma instrucción) |
| 78 | `"frame-src 'self' blob:; object-src 'self' blob:"` | ↑ (sigue la misma instrucción) |
| 79 | `);` | ↑ (sigue la misma instrucción) |
| 81 | `$origen = $_SERVER['HTTP_ORIGIN'] ?? '';` | Guarda en `$origen` desde qué página viene la petición. `?? ''` = si no viene, vacío. |
| 82 | `$host = explode(':', $_SERVER['HTTP_HOST'] ?? '')[0];` | Guarda en `$host` el nombre del sitio (sin el puerto: `explode(':', ...)[0]` corta en `:` y toma la primera parte). |
| 83 | `if ($origen !== '' && parse_url($origen, PHP_URL_HOST) === $host) {` | Si la petición viene del mismo sitio... |
| 84 | `header("Access-Control-Allow-Origin: $origen");` | ...le permite al navegador recibir la respuesta. |
| 85 | `header('Access-Control-Allow-Credentials: true');` | ...le permite enviar la cookie de sesión. |
| 86 | `header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');` | ...le permite enviar los datos y el token de seguridad. |
| 87 | `header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');` | ...le permite usar estos tipos de petición. |
| 88 | `}` | Cierra el `if`. |
| 89 | `if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {` | Si la petición es de tipo `OPTIONS` (el navegador solo está preguntando qué puede hacer)... |
| 90 | `http_response_code(204);` | ...responde 204 (bien, sin contenido)... |
| 91 | `exit;` | ...y termina (`exit`). |
| 92 | `}` | Cierra el `if`. |
| 93 | `}` | Cierra la función `configurarSeguridadHttp()`. |
| 95-98 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Datos que envio el navegador: el query string + el cuerpo (JSON si el Content-Type es application/json, si no $_POST)."* |
| 99 | `function entrada()` | Función `entrada()`: lee los datos que mandó la pantalla. La usan todos los controladores en su constructor. |
| 100 | `{` | Abre la función `entrada()`. |
| 101 | `$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';` | Guarda en `$metodo` el tipo de petición (`GET`, `POST`...). Si no hay, `GET`. |
| 102 | `$cuerpo = [];` | Empieza `$cuerpo` como una lista vacía. |
| 103 | `if (!in_array($metodo, ['GET', 'HEAD'])) {` | Si la petición **no** es `GET` ni `HEAD` (esas no traen datos)... |
| 104 | `if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {` | ...y si los datos vienen en JSON (`stripos` busca el texto `application/json`)... |
| 105 | `$json = json_decode(file_get_contents('php://input') ?: '[]', true);` | ...lee los datos (`file_get_contents('php://input')`) y los convierte de JSON a lista de PHP (`json_decode`). Los guarda en `$json`. |
| 106 | `$cuerpo = is_array($json) ? $json : [];` | Si `$json` es una lista, la usa; si no, deja una lista vacía. |
| 107 | `} else {` | Si no vienen en JSON... |
| 108 | `$cuerpo = $_POST;` | ...usa `$_POST` (los datos de un formulario normal). |
| 109 | `}` | Cierra el `else`. |
| 110 | `}` | Cierra el `if`. |
| 111 | `return array_merge($_GET, $cuerpo);` | Devuelve todo junto: los datos de la dirección (`$_GET`) más los del cuerpo (`array_merge` une dos listas). |
| 112 | `}` | Cierra la función `entrada()`. |
| 114-117 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"true si el correo ya existe en cualquiera de las 4 tablas de cuentas. $excluirId ignora la propia cuenta al editar."* |
| 118 | `function correoUsadoEnCualquierTabla($correo, $excluirId = null)` | Función `correoUsadoEnCualquierTabla($correo, $excluirId)`: dice si un correo ya está registrado en cualquier tabla de cuentas. La usan `AuthController`, `ClientController` y `StaffController`. |
| 119 | `{` | Abre la función `correoUsadoEnCualquierTabla()`. |
| 120 | `global $conn;` | Trae la conexión `$conn` (de `config/database.php`). |
| 121 | `$tablas = [` | Crea la lista `$tablas`: cada tabla de cuentas con el nombre de su columna id. |
| 122 | `'ADMINISTRADOR'   => 'id_admin',` | Tabla de administradores → columna `id_admin`. |
| 123 | `'AYUDANTE_COCINA' => 'id_ayudante',` | Tabla de cocina → `id_ayudante`. |
| 124 | `'DOMICILIARIO'    => 'id_domiciliario',` | Tabla de domiciliarios → `id_domiciliario`. |
| 125 | `'CLIENTE'         => 'id_cliente',` | Tabla de clientes → `id_cliente`. |
| 126 | `];` | Cierra la lista. |
| 127 | `foreach ($tablas as $tabla => $idCol) {` | `foreach` = repite lo de adentro con cada tabla. `$tabla` es el nombre y `$idCol` su columna id. |
| 128 | `if ($excluirId !== null) {` | Si hay que ignorar una cuenta (al editar, la propia)... |
| 129 | `$stmt = $conn->prepare("SELECT {$idCol} FROM {$tabla} WHERE correo = ? AND {$idCol} != ?");` | ...prepara la consulta: "busca ese correo en esta tabla, pero que no sea esta cuenta". `{$tabla}` pone el nombre de la tabla dentro del texto. |
| 130 | `$stmt->bind_param("ss", $correo, $excluirId);` | Llena los dos `?` con el correo y el id a ignorar (`"ss"` = dos textos). |
| 131 | `} else {` | Si no hay que ignorar ninguna... |
| 132 | `$stmt = $conn->prepare("SELECT {$idCol} FROM {$tabla} WHERE correo = ?");` | ...prepara la consulta: "busca ese correo en esta tabla". |
| 133 | `$stmt->bind_param("s", $correo);` | Llena el `?` con el correo. |
| 134 | `}` | Cierra el `else`. |
| 135 | `$stmt->execute();` | Ejecuta la consulta. |
| 136 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró (o nada) y la guarda en `$row`. |
| 137 | `$stmt->close();` | Cierra la consulta. |
| 138 | `if ($row) {` | Si encontró algo... |
| 139 | `return true;` | ...devuelve `true`: el correo ya existe. |
| 140 | `}` | Cierra el `if`. |
| 141 | `}` | Cierra el `foreach`. |
| 142 | `return false;` | Si revisó todas las tablas y no lo encontró, devuelve `false`. |
| 143 | `}` | Cierra la función `correoUsadoEnCualquierTabla()`. |
| 145-148 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Tipos para bind_param segun cada valor: "i" (entero), "d" (decimal) o "s" (texto). Se usa en los UPDATE que se arman con los campos que lleguen."* |
| 149 | `function tiposDe($valores)` | Función `tiposDe($valores)`: arma las letras de tipos que pide `bind_param` (`i` número entero, `d` decimal, `s` texto). La usan los modelos al guardar cambios. |
| 150 | `{` | Abre la función `tiposDe()`. |
| 151 | `$tipos = "";` | Empieza `$tipos` como un texto vacío. |
| 152 | `foreach ($valores as $v) {` | Recorre cada valor (`$v`). |
| 153 | `if (is_int($v)) { $tipos .= "i"; }` | Si es un número entero (`is_int`), le agrega una `i` a `$tipos` (`.=` agrega al final). |
| 154 | `elseif (is_float($v)) { $tipos .= "d"; }` | Si es un número con decimales (`is_float`), le agrega una `d`. |
| 155 | `else { $tipos .= "s"; }` | Si no, le agrega una `s` (texto). |
| 156 | `}` | Cierra el `foreach`. |
| 157 | `return $tipos;` | Devuelve las letras, por ejemplo `"ssi"`. |
| 158 | `}` | Cierra la función `tiposDe()`. |
| 160 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Redirige (con la ruta base) y termina."* |
| 161 | `function redirect($ruta)` | Función `redirect($ruta)`: manda al usuario a otra página. La usan `requiereSesion()` y `requiereRol()`. |
| 162 | `{` | Abre la función `redirect()`. |
| 163 | `header('Location: ' . rutaBase() . $ruta);` | Le dice al navegador que vaya a esa dirección (`Location:`), con la carpeta del proyecto adelante (`rutaBase()`). |
| 164 | `exit;` | Termina. |
| 165 | `}` | Cierra la función `redirect()`. |
| 167-170 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Verifica el token CSRF (cabecera X-CSRF-Token). Si no coincide responde con error y termina."* |
| 171 | `function verificarCsrf()` | Función `verificarCsrf()`: revisa el token de seguridad. La usa `despacharRuta()` en cada petición a la API. |
| 172 | `{` | Abre la función `verificarCsrf()`. |
| 173 | `$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';` | Guarda en `$metodo` el tipo de petición. |
| 174 | `if (in_array($metodo, ['GET', 'HEAD', 'OPTIONS'])) {` | Si es `GET`, `HEAD` u `OPTIONS` (solo leen, no cambian nada)... |
| 175 | `return true;` | ...no revisa nada y sigue. |
| 176 | `}` | Cierra el `if`. |
| 178 | `$enviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';` | Guarda en `$enviado` el token que mandó React (en la cabecera `X-CSRF-Token`). |
| 179 | `$esperado = $_SESSION['_csrf'] ?? '';` | Guarda en `$esperado` el token guardado en la sesión (lo crea `Session::csrf()`). |
| 181 | `if ($enviado === '' \|\| $esperado === '' \|\| !hash_equals($esperado, $enviado)) {` | Si falta alguno o no son iguales (`hash_equals` los compara de forma segura)... |
| 182 | `responderError('Token CSRF invalido o ausente.', 419);` | ...responde el error 419 "Token CSRF invalido o ausente." y termina. |
| 183 | `}` | Cierra el `if`. |
| 184 | `return true;` | Si todo está bien, devuelve `true`. |
| 185 | `}` | Cierra la función `verificarCsrf()`. |
| 187 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Responde en JSON y termina."* |
| 188 | `function responderJson($datos, $codigo = 200)` | Función `responderJson($datos, $codigo)`: le contesta a React con datos. `$codigo = 200` = si no se dice el código, usa 200 (todo bien). |
| 189 | `{` | Abre la función `responderJson()`. |
| 190 | `http_response_code($codigo);` | Pone el número de la respuesta (200, 201, 404...). |
| 191 | `header('Content-Type: application/json; charset=utf-8');` | Le dice al navegador que la respuesta es JSON. |
| 192 | `echo json_encode($datos, JSON_UNESCAPED_UNICODE \| JSON_UNESCAPED_SLASHES);` | Convierte `$datos` a JSON (`json_encode`) y lo escribe (`echo`). Las opciones dejan las tildes y las `/` tal cual. |
| 193 | `exit;` | Termina: después de responder no se ejecuta nada más. |
| 194 | `}` | Cierra la función `responderJson()`. |
| 196 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Responde un error en JSON (con errores de validacion opcionales) y termina."* |
| 197 | `function responderError($mensaje, $codigo = 400, $detalles = [])` | Función `responderError($mensaje, $codigo, $detalles)`: le contesta a React con un error. Por defecto código 400. |
| 198 | `{` | Abre la función `responderError()`. |
| 199 | `$cuerpo = ['error' => $mensaje];` | Arma `$cuerpo` con el mensaje de error. |
| 200 | `if (!empty($detalles)) {` | Si hay detalles (por ejemplo, qué campos están mal)... |
| 201 | `$cuerpo['errors'] = $detalles;` | ...los agrega en `'errors'`. |
| 202 | `}` | Cierra el `if`. |
| 203 | `responderJson($cuerpo, $codigo);` | Responde con `responderJson()` (de arriba). |
| 204 | `}` | Cierra la función `responderError()`. |
| 206 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Muestra una vista de views/paginas; la vista recibe $datos."* |
| 207 | `function mostrarVista($vista, $datos = [])` | Función `mostrarVista($vista, $datos)`: muestra una vista de `views/paginas/`. La usa `PaginaController`. |
| 208 | `{` | Abre la función `mostrarVista()`. |
| 209 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El HTML lleva la sesion y el token CSRF dentro, por eso nunca se cachea."* |
| 210 | `header('Cache-Control: no-store, no-cache, must-revalidate');` | Le dice al navegador que no guarde copia de la página (tiene datos de la sesión). |
| 211 | `header('Pragma: no-cache');` | Lo mismo, para navegadores viejos. |
| 212 | `$ruta = __DIR__ . '/../views/paginas/' . $vista . '.php';` | Arma en `$ruta` la dirección del archivo de la vista (ej. `views/paginas/admin.php`). |
| 213 | `if (!is_file($ruta)) {` | Si ese archivo no existe (`!is_file`)... |
| 214 | `http_response_code(500);` | ...pone el código 500 (error)... |
| 215 | `echo 'Vista no encontrada: ' . htmlspecialchars($vista);` | ...escribe "Vista no encontrada:" con el nombre. `htmlspecialchars` evita que se cuele código raro. |
| 216 | `exit;` | ...y termina. |
| 217 | `}` | Cierra el `if`. |
| 218 | `require $ruta;` | Carga la vista. Como se carga dentro de esta función, la vista puede usar `$datos`. |
| 219 | `}` | Cierra la función `mostrarVista()`. |
| 221-224 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Exige una sesion activa y vigente (vuelve a leer la cuenta en la base de datos, asi una cuenta desactivada pierde el acceso de inmediato). Devuelve el usuario."* |
| 225 | `function requiereSesion($esApi = true)` | Función `requiereSesion($esApi)`: exige que el usuario haya iniciado sesión. `$esApi` dice si es la API (true) o una página (false). |
| 226 | `{` | Abre la función `requiereSesion()`. |
| 227 | `if (!Auth::check()) {` | Si no hay sesión (`Auth::check()` de `models/Auth.php`)... |
| 228 | `if ($esApi) {` | ...y es la API... |
| 229 | `responderError('No autenticado.', 401);` | ...responde 401 "No autenticado.". |
| 230 | `}` | Cierra el `if`. |
| 231 | `redirect('/login');` | Si es una página, lo manda al login. |
| 232 | `}` | Cierra el `if`. |
| 234 | `$usuario = Auth::usuarioActual();` | Trae los datos del usuario desde la base de datos (`Auth::usuarioActual()`). |
| 235 | `if ($usuario === null) {` | Si no existe o está desactivado (`null`)... |
| 236 | `if ($esApi) {` | ...y es la API... |
| 237 | `responderError('Sesion invalida o cuenta inactiva.', 401);` | ...responde 401 "Sesion invalida o cuenta inactiva.". |
| 238 | `}` | Cierra el `if`. |
| 239 | `redirect('/login');` | Si es una página, lo manda al login. |
| 240 | `}` | Cierra el `if`. |
| 241 | `return $usuario;` | Devuelve los datos del usuario. |
| 242 | `}` | Cierra la función `requiereSesion()`. |
| 244 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Exige uno de los roles dados (y sesion vigente). Devuelve el usuario."* |
| 245 | `function requiereRol($roles, $esApi = true)` | Función `requiereRol($roles, $esApi)`: exige que el usuario tenga uno de esos roles. La usan `despacharRuta()` y `despacharPagina()`. |
| 246 | `{` | Abre la función `requiereRol()`. |
| 247 | `$usuario = requiereSesion($esApi);` | Primero exige la sesión (función de arriba) y guarda el usuario. |
| 248 | `if (!in_array(Auth::rol(), $roles)) {` | Si su rol (`Auth::rol()`) no está en la lista `$roles` (`in_array` busca en una lista)... |
| 249 | `if ($esApi) {` | ...y es la API... |
| 250 | `responderError('No autorizado para este recurso.', 403);` | ...responde 403 "No autorizado para este recurso.". |
| 251 | `}` | Cierra el `if`. |
| 252 | `redirect('/login');` | Si es una página, lo manda al login. |
| 253 | `}` | Cierra el `if`. |
| 254 | `return $usuario;` | Devuelve el usuario. |
| 255 | `}` | Cierra la función `requiereRol()`. |
| 257-260 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Carga el archivo del controlador. La accion y los parametros de la ruta quedan en $_GET (ej. $_GET['accion'], $_GET['id'])."* |
| 261 | `function cargarControlador($controlador, $accion, $parametros = [])` | Función `cargarControlador($controlador, $accion, $parametros)`: abre el archivo del controlador que toca. |
| 262 | `{` | Abre la función `cargarControlador()`. |
| 263 | `$_GET['accion'] = $accion;` | Guarda la acción en `$_GET['accion']` (ej. `'update'`). El controlador la lee al final para saber qué método usar. |
| 264 | `foreach ($parametros as $nombre => $valor) {` | Recorre los datos de la ruta (ej. `id` → `6`). |
| 265 | `$_GET[$nombre] = $valor;` | Guarda cada uno en `$_GET` (ej. `$_GET['id'] = '6'`). |
| 266 | `}` | Cierra el `foreach`. |
| 267 | `require __DIR__ . "/../controllers/{$controlador}.php";` | Abre el archivo del controlador (ej. `controllers/ProductController.php`). `{$controlador}` pone el nombre dentro del texto. |
| 268 | `}` | Cierra la función `cargarControlador()`. |
| 270-273 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca en config/rutas.php la ruta que coincide con metodo + path, revisa CSRF y rol, y carga el controlador con su accion."* |
| 274 | `function despacharRuta($metodo, $ruta)` | Función `despacharRuta($metodo, $ruta)`: atiende una petición a la API. La llama `public/index.php`. |
| 275 | `{` | Abre la función `despacharRuta()`. |
| 276 | `$tabla = require __DIR__ . '/rutas.php';` | Trae la lista de rutas de `config/rutas.php` y la guarda en `$tabla`. |
| 277 | `$coincidePath = false;` | `$coincidePath` empieza en `false`: todavía no se encontró la dirección. |
| 279 | `foreach ($tabla as $clave => $destino) {` | Recorre cada ruta: `$clave` es `'PUT /api/products/{id}'` y `$destino` es `['ProductController', 'update', ['admin']]`. |
| 280 | `list($metodoRuta, $patron) = explode(' ', $clave, 2);` | Corta `$clave` en el espacio (`explode`): `$metodoRuta` queda con `PUT` y `$patron` con `/api/products/{id}`. `list(...)` guarda cada parte en su variable. |
| 281 | `$regex = '#^' . preg_replace('#\{[a-zA-Z_]+\}#', '([^/]+)', $patron) . '$#';` | Convierte el patrón en una "regla de búsqueda" (`$regex`): cambia `{id}` por "cualquier cosa sin `/`". Así `/api/products/{id}` sirve para `/api/products/6`. |
| 283 | `if (!preg_match($regex, $ruta, $valores)) {` | Si la dirección pedida no cumple la regla (`preg_match`)... Lo que encuentra lo guarda en `$valores`. |
| 284 | `continue;` | ...`continue` = salta a la siguiente ruta. |
| 285 | `}` | Cierra el `if`. |
| 286 | `$coincidePath = true;` | Si llegó aquí, la dirección sí existe: `$coincidePath` pasa a `true`. |
| 288 | `if ($metodoRuta !== $metodo) {` | Si el tipo de petición no es el de la ruta (ej. llegó `GET` y la ruta es `PUT`)... |
| 289 | `continue;` | ...salta a la siguiente ruta. |
| 290 | `}` | Cierra el `if`. |
| 292 | `list($controlador, $accion, $roles) = $destino;` | Saca de `$destino` el controlador, la acción y los roles, cada uno en su variable. |
| 293 | *(comentario)* | Comentario: no se ejecuta. Dice: *"CSRF en todas las rutas /api/* (en GET/HEAD/OPTIONS no hace nada)."* |
| 294 | `verificarCsrf();` | Revisa el token de seguridad (`verificarCsrf()` de arriba). |
| 295 | `if (!empty($roles)) {` | Si la ruta tiene roles (no está vacía)... |
| 296 | `requiereRol($roles);` | ...exige uno de esos roles (`requiereRol()` de arriba). |
| 297 | `}` | Cierra el `if`. |
| 299 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Nombre de cada {parametro} => su valor ya decodificado (ej. "%23ORD-4" -> "#ORD-4")."* |
| 300 | `preg_match_all('#\{([a-zA-Z_]+)\}#', $patron, $nombres);` | Busca los nombres que van entre llaves en el patrón (ej. `id`) y los guarda en `$nombres`. |
| 301 | `$parametros = [];` | Empieza `$parametros` como lista vacía. |
| 302 | `foreach ($nombres[1] as $i => $nombre) {` | Recorre cada nombre (`$i` es su posición). |
| 303 | `$parametros[$nombre] = urldecode($valores[$i + 1]);` | Guarda su valor real (ej. `'6'`). `urldecode` arregla caracteres especiales (`%23` → `#`). |
| 304 | `}` | Cierra el `foreach`. |
| 306 | `cargarControlador($controlador, $accion, $parametros);` | Carga el controlador con la acción y los datos (`cargarControlador()` de arriba). |
| 307 | `return;` | Termina la función: ya se atendió. |
| 308 | `}` | Cierra el `foreach`. |
| 310 | `if ($coincidePath) {` | Si la dirección existía pero con otro tipo de petición... |
| 311 | `responderError('Metodo no permitido.', 405);` | ...responde 405 "Metodo no permitido.". |
| 312 | `}` | Cierra el `if`. |
| 313 | `responderError('Ruta no encontrada.', 404);` | Si no existía ninguna ruta así, responde 404 "Ruta no encontrada.". |
| 314 | `}` | Cierra la función `despacharRuta()`. |
| 316-319 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca la pagina en config/paginas.php, exige el rol si hace falta (sin sesion o con otro rol redirige a /login) y carga el controlador."* |
| 320 | `function despacharPagina($ruta)` | Función `despacharPagina($ruta)`: abre una página. La llama `public/index.php`. |
| 321 | `{` | Abre la función `despacharPagina()`. |
| 322 | `$tabla = require __DIR__ . '/paginas.php';` | Trae la lista de páginas de `config/paginas.php`. |
| 324 | `if (!isset($tabla[$ruta])) {` | Si esa dirección no está en la lista (`!isset` = no existe)... |
| 325 | `http_response_code(404);` | ...pone el código 404... |
| 326 | `echo 'Pagina no encontrada.';` | ...escribe "Pagina no encontrada."... |
| 327 | `exit;` | ...y termina. |
| 328 | `}` | Cierra el `if`. |
| 330 | `list($controlador, $accion, $roles) = $tabla[$ruta];` | Saca el controlador, la acción y los roles de esa página. |
| 331 | `if (!empty($roles)) {` | Si la página tiene roles... |
| 332 | `requiereRol($roles, false);` | ...los exige. `false` = es una página: si no tiene permiso, lo manda al login. |
| 333 | `}` | Cierra el `if`. |
| 335 | `cargarControlador($controlador, $accion);` | Carga el controlador con la acción (`cargarControlador()` de arriba). |
| 336 | `}` | Cierra la función `despacharPagina()`. |
| 337 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** | `Failed to open stream` |
| la función `rutaBase()` | **todo el sistema** | `Call to undefined function rutaBase()` |
| la función `quitarRutaBase()` | **todo el sistema** | `Call to undefined function quitarRutaBase()` |
| la función `configurarManejadorErrores()` | **todo el sistema** | `Call to undefined function configurarManejadorErrores()` |
| la función `manejarError()` | **todo el sistema** | `Call to undefined function manejarError()` |
| la función `configurarSeguridadHttp()` | **todo el sistema** | `Call to undefined function configurarSeguridadHttp()` |
| la función `entrada()` | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código, guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, crear productos, editar productos, eliminar productos, crear insumos, editar insumos, eliminar insumos, sumar o restar stock, editar el perfil del cliente, cambiar la contraseña del cliente, crear personal, editar personal o darlo de baja, eliminar personal, guardar la ubicación del domiciliario, recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, activar las notificaciones | `Call to undefined function entrada()` |
| la función `correoUsadoEnCualquierTabla()` | registrarse, editar el perfil del cliente, crear personal, editar personal o darlo de baja | `Call to undefined function correoUsadoEnCualquierTabla()` |
| la función `tiposDe()` | guardar los ajustes de la tienda, crear productos, editar productos, crear insumos, editar insumos, editar el perfil del cliente, crear personal, editar personal o darlo de baja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp | `Call to undefined function tiposDe()` |
| la función `redirect()` | **todo el sistema** | `Call to undefined function redirect()` |
| la función `verificarCsrf()` | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código, guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, crear productos, editar productos, eliminar productos, subir fotos, crear insumos, editar insumos, eliminar insumos, sumar o restar stock, editar el perfil del cliente, cambiar la contraseña del cliente, crear personal, editar personal o darlo de baja, eliminar personal, guardar la ubicación del domiciliario, recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja, cargar los datos de todas las pantallas, activar las notificaciones | `Call to undefined function verificarCsrf()` |
| la función `responderJson()` | **todo el sistema** | `Call to undefined function responderJson()` |
| la función `responderError()` | **todo el sistema** | `Call to undefined function responderError()` |
| la función `mostrarVista()` | abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Call to undefined function mostrarVista()` |
| la función `requiereSesion()` | **todo el sistema** | `Call to undefined function requiereSesion()` |
| la función `requiereRol()` | **todo el sistema** | `Call to undefined function requiereRol()` |
| la función `cargarControlador()` | **todo el sistema** | `Call to undefined function cargarControlador()` |
| la función `despacharRuta()` | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código, guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, crear productos, editar productos, eliminar productos, subir fotos, crear insumos, editar insumos, eliminar insumos, sumar o restar stock, editar el perfil del cliente, cambiar la contraseña del cliente, crear personal, editar personal o darlo de baja, eliminar personal, guardar la ubicación del domiciliario, recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, ver el cierre de caja antes de confirmarlo, confirmar el cierre de caja, cargar los datos de todas las pantallas, activar las notificaciones | `Call to undefined function despacharRuta()` |
| la función `despacharPagina()` | abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Call to undefined function despacharPagina()` |
| un `require_once` de `views/json/` | lo que usa ese archivo | `Call to undefined function ..._a_json()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
