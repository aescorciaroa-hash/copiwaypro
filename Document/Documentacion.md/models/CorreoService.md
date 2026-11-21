# models/CorreoService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Envía correos (el código para recuperar la contraseña). Se conecta **directo a Gmail** con PHP puro, sin librerías.

## ¿Qué hace?
- lee la clave de Gmail del archivo `datos_correo.php` (afuera del proyecto, no va a GitHub)
- dice si el correo está configurado
- se conecta a Gmail, inicia sesión y envía un correo
- arma el correo (asunto, versión de texto y versión con diseño)
- envía el código para recuperar la contraseña

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `clave()` | lee la clave de Gmail de `datos_correo.php`; si el archivo no existe devuelve `''` | `CorreoService::configurado()` y `enviar()` |
| `configurado()` | dice si el correo está configurado (servidor, remitente y clave) | `CorreoService::enviar()` |
| `enviar()` | se conecta a Gmail y envía un correo | `CorreoService::enviarCodigoRecuperacion()` |
| `comando()` (privado) | manda una línea a Gmail y revisa la respuesta | `CorreoService::enviar()` |
| `leerRespuesta()` (privado) | lee lo que contesta Gmail y revisa el código | `CorreoService::enviar()`, `CorreoService::comando()` |
| `armarMensaje()` (privado) | arma el correo completo con sus cabeceras | `CorreoService::enviar()` |
| `enviarCodigoRecuperacion()` | envía el código para recuperar la contraseña | `AuthController::forgotPasswordRequest()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/AuthController.php`.
- **Carga:** `models/Configuracion.php` (los datos del negocio para el pie del correo) y usa `rutaBase()` de `config/helpers.php` (para armar el enlace del botón).
- **Se conecta con:** el servidor de correo de **Gmail** (`smtp.gmail.com`, puerto 587), con funciones que ya trae PHP: `stream_socket_client()` (abrir la conexión), `stream_socket_enable_crypto()` (cifrarla) y `fwrite()` / `fgets()` (escribir y leer).

**Cómo habla con Gmail (SMTP), paso a paso:**

| Nosotros mandamos | Gmail contesta | Qué significa |
|---|---|---|
| *(conectarse)* | `220` | "Listo, te escucho." |
| `EHLO localhost` | `250` | "Hola." |
| `STARTTLS` | `220` | "Vamos a cifrar la conexión." |
| `AUTH LOGIN` + usuario + clave (en base64) | `334`, `334`, `235` | "¿Usuario?", "¿Clave?", "Sesión iniciada." |
| `MAIL FROM` / `RCPT TO` | `250` | "De quién" / "Para quién." |
| `DATA` + el correo + `.` | `354`, `250` | "Mándalo" / "Recibido." |
| `QUIT` | `221` | "Adiós." |

Si Gmail contesta otro código, `leerRespuesta()` lanza un error, `enviar()` lo escribe en el log y devuelve `false`.

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta
1. **Base de datos:** **no se conecta a MySQL**. Se conecta a **Gmail** por SMTP (`HOST = 'smtp.gmail.com'`, `PUERTO = 587`, cifrado `tls`) con las constantes de la clase.
2. **Tablas que toca:** ninguna directamente.
3. **Quién lo usa:** `controllers/AuthController.php`, con `CorreoService::enviarCodigoRecuperacion(...)` (métodos `static`, sin `new`).
4. **Otros que usa:** `Configuracion` (datos del negocio para el pie del correo) y `rutaBase()` de `helpers.php`. **No usa librerías**: habla con Gmail con funciones de PHP (`stream_socket_client`, `stream_socket_enable_crypto`, `fwrite`, `fgets`).
5. **Sus métodos que otros pueden llamar:** `clave()`, `configurado()`, `enviar()`, `enviarCodigoRecuperacion()`.

```
React (olvidé mi contraseña) → /api/auth/forgot-password/request → AuthController → CorreoService → Gmail (SMTP) → correo del cliente
```

### Preguntas que te pueden hacer sobre este archivo

**¿Cómo se conecta `CorreoService` a la base de datos?**  
No se conecta a MySQL directamente. Se conecta a **Gmail** por SMTP con PHP puro (`stream_socket_client`). Lo único que lee de la base de datos (el nombre del negocio) lo pide a `Configuracion`, y ese sí usa `$conn`.

**¿Con qué se conecta este modelo?**  
Con el servidor de correo de Gmail (SMTP), no con la base de datos. Abre la conexión con `stream_socket_client()`, la cifra con `STARTTLS` y le manda comandos (`EHLO`, `AUTH LOGIN`, `MAIL FROM`, `RCPT TO`, `DATA`, `QUIT`).

**¿Usa PHPMailer o alguna librería?**  
No. Todo está hecho con funciones que ya trae PHP, así no hace falta Composer ni la carpeta `vendor/`.

**¿Qué es SMTP?**  
El "idioma" que usan los servidores de correo para enviar mensajes. Cada paso tiene un código de respuesta: `220` listo, `250` ok, `235` sesión iniciada, `354` mándalo.

**¿Qué pasa si la clave de Gmail está mal?**  
Gmail no contesta `235` al iniciar sesión: `leerRespuesta()` lanza el error, `enviar()` lo atrapa, lo escribe en el log y devuelve `false`; el usuario no recibe el código.

**¿Es un modelo de verdad?**  
Es un **servicio**: está en `models/` porque es lógica del negocio, pero no maneja una tabla.

**¿Qué pasa si se borra este archivo?**  
Los archivos que lo usan fallan con *"Failed opening required '...CorreoService.php'"* o *"Class 'CorreoService' not found"* (error 500).

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envio de correos por SMTP (con PHP puro, sin librerias). Se configura con las constantes de esta clase. Si no esta configurado, enviar() devuelve false y la app sigue funcionando."* |
| 7 | `require_once __DIR__ . '/Configuracion.php';` | Carga el modelo `Configuracion` (`models/Configuracion.php`), para sacar los datos del negocio que van en el pie del correo. |
| 9 | `class CorreoService` | Crea la clase `CorreoService`: envía correos. La usa `AuthController::forgotPasswordRequest()`. |
| 10 | `{` | Abre la clase `CorreoService`. |
| 11-14 | *(comentario)* | Comentario: no se ejecuta. Explica que es el servidor de Gmail y que la clave **no** está aquí sino en `datos_correo.php`, afuera del proyecto, para que no quede en GitHub. |
| 15 | `const HOST = 'smtp.gmail.com';` | Constante `HOST`: el servidor de correo de Gmail (el "cartero"). Si queda vacío, no se envían correos. |
| 16 | `const PUERTO = 587;` | Constante `PUERTO`: el puerto del servidor (587). |
| 17 | `const CIFRADO = 'tls';` | Constante `CIFRADO`: cómo se protege la conexión (`tls`). |
| 18 | `const USUARIO = 'aescorciaroa@gmail.com';` | Constante `USUARIO`: el Gmail con el que se entra al servidor. Gmail revisa la clave con este correo. |
| 19 | `const REMITENTE = 'aescorciaroa@gmail.com';` | Constante `REMITENTE`: el correo que el cliente ve en "De:". Debe ser el mismo de `USUARIO` (Gmail no deja enviar a nombre de otro correo). |
| 20 | `const REMITENTE_NOMBRE = 'CopiwayPRO';` | Constante `REMITENTE_NOMBRE`: el nombre que aparece como "de". |
| 22-25 | *(comentario)* | Comentario: no se ejecuta. Dice que `clave()` lee la clave de `datos_correo.php`, dos carpetas arriba de `models/`, y que si no existe devuelve `''`. |
| 26 | `public static function clave()` | Método `clave()`: trae la "contraseña de aplicación" de Gmail (16 letras, de myaccount.google.com/apppasswords). **No es** la contraseña normal del correo. |
| 27 | `{` | Abre la función `clave()`. |
| 28 | `$archivo = __DIR__ . '/../../datos_correo.php';` | Guarda en `$archivo` la ruta del archivo de la clave. `__DIR__` = la carpeta `models/`; `/../../` = sube dos carpetas, quedando afuera del proyecto (en tu computador: `C:\laragon\www\`; en Hostinger: al lado de `public_html`). |
| 29 | `if (!is_file($archivo)) {` | `is_file` = "¿existe ese archivo?". `!` = "no". Si el archivo **no** existe... |
| 30 | `return '';` | ...devuelve vacío: no hay clave y el correo no se envía (la app sigue funcionando). |
| 31 | `}` | Cierra el `if`. |
| 32 | `require $archivo;` | Trae el archivo `datos_correo.php`, que crea la variable `$claveGmail`. |
| 33 | `return $claveGmail;` | Devuelve la clave. |
| 34 | `}` | Cierra la función `clave()`. |
| 36 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"true si hay un servidor SMTP configurado (con servidor, remitente y clave)."* |
| 37 | `public static function configurado()` | Método `configurado()`: dice si el correo está configurado. |
| 38 | `{` | Abre la función `configurado()`. |
| 39 | `return self::HOST !== '' && self::REMITENTE !== '' && self::clave() !== '';` | Devuelve `true` si `HOST`, `REMITENTE` y la clave no están vacíos. `&&` = "y además". |
| 40 | `}` | Cierra la función `configurado()`. |
| 42 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envia un correo HTML. Devuelve true si el servidor SMTP lo acepto."* |
| 43 | `public static function enviar($para, $asunto, $html, $textoPlano = '')` | Método `enviar(...)`: envía un correo. Recibe para quién, el asunto, el contenido en HTML y en texto normal. |
| 44 | `{` | Abre la función `enviar()`. |
| 45 | `if (!self::configurado()) {` | Si el correo no está configurado... |
| 46 | `return false;` | Devuelve `false`: el correo no salió. |
| 47 | `}` | Cierra el `if`. |
| 49 | `$textoPlano = $textoPlano !== '' ? $textoPlano : trim(strip_tags($html));` | Si no mandaron la versión en texto normal, la saca del HTML quitándole las etiquetas (`strip_tags`). |
| 50 | `$mensaje = self::armarMensaje($para, $asunto, $html, $textoPlano);` | Arma el correo completo (cabeceras + texto + HTML) con `armarMensaje()` de abajo y lo guarda en `$mensaje`. |
| 51 | `$socket = null;` | `$socket` será la conexión con Gmail. Empieza vacía (`null`). |
| 53 | `try {` | Intenta lo siguiente; si algo falla, salta al `catch`. |
| 54 | *(comentario)* | Comentario: no se ejecuta. Dice: *"1. Conectarse al servidor de correo ('ssl' cifra desde el inicio, ej. puerto 465)"* |
| 55 | `$cifrado = strtolower(self::CIFRADO);` | Guarda en `$cifrado` el tipo de cifrado en minúscula (`tls`). |
| 56 | `$servidor = self::HOST . ':' . self::PUERTO;` | Arma la dirección del servidor: `smtp.gmail.com:587`. |
| 57 | `if ($cifrado === 'ssl') {` | Si el cifrado es `ssl` (puerto 465)... |
| 58 | `$servidor = 'ssl://' . $servidor;` | ...la conexión va cifrada desde el principio (`ssl://`). |
| 59 | `}` | Cierra el `if`. |
| 60 | `$socket = stream_socket_client($servidor, $codigoError, $textoError, 10);` | **Se conecta a Gmail** (`stream_socket_client` abre la conexión). Espera máximo 10 segundos. Si falla, el motivo queda en `$textoError`. |
| 61 | `if (!$socket) {` | Si no se pudo conectar... |
| 62 | `throw new Exception('No se pudo conectar a ' . self::HOST . ': ' . $textoError);` | ...lanza un error con el motivo (lo atrapa el `catch`). |
| 63 | `}` | Cierra el `if`. |
| 64 | `stream_set_timeout($socket, 10);` | Si Gmail no contesta en 10 segundos, deja de esperar. |
| 65 | `self::leerRespuesta($socket, 220);` | Lee el saludo de Gmail. Debe ser el código `220` ("listo"). |
| 67 | *(comentario)* | Comentario: no se ejecuta. Dice: *"2. Saludar y, con 'tls', pasar a conexion cifrada (STARTTLS, ej. puerto 587)"* |
| 68 | `$nombreEquipo = $_SERVER['SERVER_NAME'] ?? 'localhost';` | El nombre de nuestro servidor (o `localhost`), para presentarnos. |
| 69 | `self::comando($socket, 'EHLO ' . $nombreEquipo, 250);` | Nos presentamos con `EHLO`. Gmail contesta `250` ("hola"). |
| 70 | `if ($cifrado === 'tls') {` | Si el cifrado es `tls` (puerto 587)... |
| 71 | `self::comando($socket, 'STARTTLS', 220);` | ...le pide a Gmail cifrar la conexión (`STARTTLS`). Contesta `220`. |
| 72 | `if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {` | Activa el cifrado TLS en la conexión. Si no se pudo... |
| 73 | `throw new Exception('No se pudo cifrar la conexion (TLS).');` | ...lanza un error. |
| 74 | `}` | Cierra el `if`. |
| 75 | `self::comando($socket, 'EHLO ' . $nombreEquipo, 250);` | Nos presentamos con `EHLO`. Gmail contesta `250` ("hola"). |
| 76 | `}` | Cierra el `if`. |
| 78 | *(comentario)* | Comentario: no se ejecuta. Dice: *"3. Iniciar sesion con el usuario y la clave (van en base64)"* |
| 79 | `if (self::USUARIO !== '') {` | Si hay usuario configurado... |
| 80 | `self::comando($socket, 'AUTH LOGIN', 334);` | ...pide iniciar sesión (`AUTH LOGIN`). Gmail contesta `334` ("¿usuario?"). |
| 81 | `self::comando($socket, base64_encode(self::USUARIO), 334);` | Manda el usuario en base64. Gmail contesta `334` ("¿clave?"). |
| 82 | `self::comando($socket, base64_encode(self::clave()), 235);` | Manda la clave (de `clave()`) en base64. Gmail contesta `235` ("sesión iniciada"). Si la clave está mal, contesta otro código y salta el error. |
| 83 | `}` | Cierra el `if`. |
| 85 | *(comentario)* | Comentario: no se ejecuta. Dice: *"4. Quien envia, a quien, y el mensaje (termina con una linea que solo tiene un punto)"* |
| 86 | `self::comando($socket, 'MAIL FROM:<' . self::REMITENTE . '>', 250);` | Dice quién envía el correo. |
| 87 | `self::comando($socket, 'RCPT TO:<' . $para . '>', 250);` | Dice para quién es (`$para`). |
| 88 | `self::comando($socket, 'DATA', 354);` | Avisa que va a mandar el mensaje. Gmail contesta `354` ("mándalo"). |
| 89 | `self::comando($socket, $mensaje . "\r\n.", 250);` | Manda el mensaje completo. Una línea con solo un punto (`.`) marca el final. Gmail contesta `250` ("recibido"). |
| 90 | `self::comando($socket, 'QUIT', 221);` | Se despide (`QUIT`). |
| 91 | `fclose($socket);` | Cierra la conexión con Gmail. |
| 92 | `return true;` | Devuelve `true`: el correo salió. |
| 93 | `} catch (Exception $e) {` | Si algo falló en el `try` (`$e` trae el error)... |
| 94 | `if ($socket) {` | ...si la conexión quedó abierta... |
| 95 | `fclose($socket);` | Cierra la conexión con Gmail. |
| 96 | `}` | Cierra el `if`. |
| 97 | `error_log('No se pudo enviar el correo a ' . $para . ': ' . $e->getMessage());` | Escribe el error en el log de PHP (no se lo muestra al usuario). |
| 98 | `return false;` | Devuelve `false`: el correo no salió. |
| 99 | `}` | Cierra el `catch`. |
| 100 | `}` | Cierra la función `enviar()`. |
| 102 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Manda una linea al servidor SMTP y revisa que conteste con el codigo esperado."* |
| 103 | `private static function comando($socket, $linea, $codigoEsperado)` | Método privado `comando(...)`: manda una línea a Gmail y revisa la respuesta. Lo usa `enviar()`. |
| 104 | `{` | Abre la función `comando()`. |
| 105 | `fwrite($socket, $linea . "\r\n");` | Escribe la línea en la conexión. `\r\n` = "enter" (el correo usa este fin de línea). |
| 106 | `return self::leerRespuesta($socket, $codigoEsperado);` | Lee la respuesta y revisa el código (`leerRespuesta()` de abajo). |
| 107 | `}` | Cierra la función `comando()`. |
| 109-112 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Lee la respuesta del servidor. Puede tener varias lineas: "250-..." sigue, "250 ..." es la ultima. Si el codigo no es el esperado lanza un error."* |
| 113 | `private static function leerRespuesta($socket, $codigoEsperado)` | Método privado `leerRespuesta(...)`: lee lo que contesta Gmail y revisa que sea el código esperado. |
| 114 | `{` | Abre la función `leerRespuesta()`. |
| 115 | `$respuesta = '';` | Empieza `$respuesta` vacía. |
| 116 | `while (($linea = fgets($socket, 515)) !== false) {` | Mientras haya líneas para leer (`fgets` lee una línea)... |
| 117 | `$respuesta .= $linea;` | ...la agrega a `$respuesta`. |
| 118 | `if (strlen($linea) < 4 \|\| $linea[3] === ' ') {` | Si la línea tiene un espacio después del código (ej. `250 OK`), es la última. (`250-...` = vienen más.) |
| 119 | `break;` | Sale del `while`. |
| 120 | `}` | Cierra el `if`. |
| 121 | `}` | Cierra el `while`. |
| 122 | `if ((int) substr($respuesta, 0, 3) !== $codigoEsperado) {` | Toma los 3 primeros números (el código). Si no es el esperado... |
| 123 | `throw new Exception('El servidor de correo respondio: ' . trim($respuesta));` | ...lanza un error con lo que contestó Gmail. |
| 124 | `}` | Cierra el `if`. |
| 125 | `return $respuesta;` | Devuelve la respuesta. |
| 126 | `}` | Cierra la función `leerRespuesta()`. |
| 128 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Arma el correo completo: cabeceras + version texto + version HTML."* |
| 129 | `private static function armarMensaje($para, $asunto, $html, $textoPlano)` | Método privado `armarMensaje(...)`: arma el correo completo con sus cabeceras. Lo usa `enviar()`. |
| 130 | `{` | Abre la función `armarMensaje()`. |
| 131 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Separador entre la version de texto y la HTML"* |
| 132 | `$separador = 'copiway-' . bin2hex(random_bytes(8));` | Un texto al azar que separa la versión de texto de la versión HTML dentro del correo. |
| 133 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Los textos con tildes en las cabeceras van asi: =?UTF-8?B?...base64...?="* |
| 134 | `$asuntoCodificado = '=?UTF-8?B?' . base64_encode($asunto) . '?=';` | El asunto en base64 con la marca `=?UTF-8?B?`, para que las tildes salgan bien. |
| 135 | `$nombreCodificado = '=?UTF-8?B?' . base64_encode(self::REMITENTE_NOMBRE) . '?=';` | Lo mismo con el nombre de quien envía (`CopiwayPRO`). |
| 136 | `$dominio = substr(strrchr(self::REMITENTE, '@'), 1);` | Lo que va después de la `@` del remitente (`gmail.com`), para el `Message-ID`. |
| 138 | `$lineas = [` | Lista `$lineas`: cada parte del correo, en orden. |
| 139 | `'Date: ' . date('r'),` | Cabecera `Date`: fecha y hora del envío. |
| 140 | `'From: ' . $nombreCodificado . ' <' . self::REMITENTE . '>',` | Cabecera `From`: quién envía (lo que se ve en "De:"). |
| 141 | `'To: <' . $para . '>',` | Cabecera `To`: para quién. |
| 142 | `'Subject: ' . $asuntoCodificado,` | Cabecera `Subject`: el asunto. |
| 143 | `'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $dominio . '>',` | Cabecera `Message-ID`: un número único del correo (Gmail lo pide para no marcarlo como spam). |
| 144 | `'MIME-Version: 1.0',` | Dice que el correo tiene partes (texto y HTML). |
| 145 | `'Content-Type: multipart/alternative; boundary="' . $separador . '"',` | Dice que trae 2 versiones del mismo mensaje y cuál es el separador. |
| 146 | `'',` | Línea vacía: separa las cabeceras del contenido. |
| 147 | `'--' . $separador,` | Separador: empieza una parte. |
| 148 | `'Content-Type: text/plain; charset=UTF-8',` | Esta parte es texto normal, con tildes (UTF-8). |
| 149 | `'Content-Transfer-Encoding: base64',` | El contenido va en base64. |
| 150 | `'',` | Línea vacía: separa las cabeceras del contenido. |
| 151 | `chunk_split(base64_encode($textoPlano)),` | El texto normal en base64, partido en líneas cortas (`chunk_split`). |
| 152 | `'--' . $separador,` | Separador: empieza una parte. |
| 153 | `'Content-Type: text/html; charset=UTF-8',` | Esta parte es HTML (el diseño), con tildes. |
| 154 | `'Content-Transfer-Encoding: base64',` | El contenido va en base64. |
| 155 | `'',` | Línea vacía: separa las cabeceras del contenido. |
| 156 | `chunk_split(base64_encode($html)),` | El HTML en base64, partido en líneas cortas. |
| 157 | `'--' . $separador . '--',` | Separador final (con `--` al final): no hay más partes. |
| 158 | `];` | Cierra la lista. |
| 159 | `return implode("\r\n", $lineas);` | Une todas las líneas con "enter" (`\r\n`) y devuelve el correo armado. |
| 160 | `}` | Cierra la función `armarMensaje()`. |
| 162 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Correo con el codigo para recuperar la contrasena (vence en 15 min)."* |
| 163 | `public static function enviarCodigoRecuperacion($para, $codigo, $nombre)` | Método `enviarCodigoRecuperacion()`: envía el correo con el código. Recibe 3 datos: `$para` (el correo del cliente), `$codigo` (los 6 números) y `$nombre` (el nombre del cliente, para saludarlo). Lo llama `AuthController::forgotPasswordRequest()`. |
| 164 | `{` | Abre la función `enviarCodigoRecuperacion()`. |
| 165 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Datos que se ponen dentro del correo"* |
| 166 | `$codigoSeguro = htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8');` | Prepara el código para ponerlo en HTML sin riesgo (`htmlspecialchars` cambia símbolos como `<` para que no se vuelvan código). |
| 167 | `$correoSeguro = htmlspecialchars($para, ENT_QUOTES, 'UTF-8');` | Lo mismo con el correo del cliente. |
| 168 | `$partesNombre = explode(' ', trim($nombre));` | Parte el nombre por los espacios (`explode`). Ej. `'Ana María Pérez'` → `['Ana', 'María', 'Pérez']`. `trim` quita espacios sobrantes. |
| 169 | `$primerNombre = htmlspecialchars($partesNombre[0], ENT_QUOTES, 'UTF-8');` | Toma solo el primer nombre (`[0]` = el primero de la lista), para saludar con "Hola, Ana". |
| 170 | `$anio = date('Y');` | Guarda en `$anio` el año actual (ej. `2026`), para el pie del correo. |
| 172 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Fecha y hora en espanol, ej. "20 de octubre de 2026, 10:46 am""* |
| 173 | `$meses = ['enero', 'febrero', …, 'diciembre'];` | Lista con los 12 meses en español (PHP los da en inglés). |
| 174 | `$fecha = date('j') . ' de ' . $meses[date('n') - 1] . ' de ' . date('Y') . ', ' . date('g:i a');` | Arma la fecha: `date('j')` = día, `date('n')` = número del mes (se le resta 1 porque la lista empieza en 0), `date('Y')` = año, `date('g:i a')` = hora. Queda algo como `20 de octubre de 2026, 10:46 am`. |
| 176 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Enlace a la pagina para cambiar la contrasena"* |
| 177 | `$protocolo = 'http://';` | Empieza suponiendo que la página usa `http://`. |
| 178 | `if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {` | Si la página está abierta con conexión segura (HTTPS)... |
| 179 | `$protocolo = 'https://';` | ...cambia a `https://`. |
| 180 | `}` | Cierra el `if`. |
| 181 | `$servidor = $_SERVER['HTTP_HOST'] ?? 'localhost';` | Guarda la dirección del servidor (ej. `localhost`). `??` = si no hay, usa `'localhost'`. |
| 182 | `$enlace = $protocolo . $servidor . rutaBase() . '/forgot-password';` | Arma el enlace completo a la página de recuperar contraseña. `rutaBase()` (de `config/helpers.php`) agrega la carpeta, ej. `http://localhost/copiwaypro/forgot-password`. |
| 184 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Datos del negocio (los que el administrador edita en Ajustes)"* |
| 185 | `$configuracion = new Configuracion();` | Crea el modelo `Configuracion` (de `models/Configuracion.php`). |
| 186 | `$negocio = $configuracion->get();` | Trae la fila de `CONFIGURACION_SISTEMA` con todos los ajustes (`get()`). |
| 187 | `$negocioNombre = htmlspecialchars($negocio['negocio_nombre'], …);` | El nombre del negocio, preparado para HTML. |
| 188 | `$negocioDireccion = htmlspecialchars($negocio['negocio_direccion'], …);` | La dirección del negocio. |
| 189 | `$negocioTelefono = htmlspecialchars($negocio['negocio_telefono'], …);` | El teléfono del negocio. |
| 190 | `$negocioInstagram = htmlspecialchars($negocio['negocio_instagram'], …);` | El Instagram del negocio. |
| 191 | `$negocioWeb = htmlspecialchars($negocio['negocio_web'], …);` | La página web del negocio. |
| 193 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Texto que Gmail muestra en la bandeja de entrada antes de abrir el correo (adentro no se ve)"* |
| 194 | `$html = '<div style="display:none;…">Tu código es ' . $codigoSeguro . '. Vence en 15 minutos.</div>';` | Empieza a armar el correo en `$html`. Este texto está escondido (`display:none`), pero Gmail lo muestra en gris al lado del asunto en la lista de correos. |
| 196 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Fondo gris y tarjeta blanca centrada (los correos se arman con tablas para que se vean bien en Gmail y Outlook)"* |
| 197 | `$html .= '<table width="100%" … style="background:#f4f4f5;…">';` | `.=` **pega** más texto al final de `$html`. Una tabla de todo el ancho con fondo gris claro. |
| 198 | `$html .= '<tr><td align="center">';` | Fila y celda que centran lo de adentro. |
| 199 | `$html .= '<table … style="max-width:560px;background:#ffffff;border-radius:24px;…">';` | La tarjeta blanca: máximo 560 píxeles de ancho, esquinas redondeadas y sombra suave. |
| 201 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Encabezado oscuro con el logo y la etiqueta de seguridad"* |
| 202 | `$html .= '<tr><td style="background:#18181b;padding:24px 36px">';` | Abre el encabezado con fondo casi negro, como el login. |
| 203 | `$html .= '<table width="100%" …><tr>';` | Una tablita de una fila para poner el logo a la izquierda y la etiqueta a la derecha. |
| 204 | `$html .= '<td …>&#127828; Copiway<span style="color:#ff7000">PRO</span></td>';` | El logo: hamburguesa (`&#127828;` = 🍔), "Copiway" en blanco y "PRO" en naranja (`#ff7000`). |
| 205 | `$html .= '<td align="right"><span …>&#128274; SEGURIDAD</span></td>';` | A la derecha, una etiqueta redondeada con candado (`&#128274;` = 🔒) que dice "SEGURIDAD". |
| 206 | `$html .= '</tr></table>';` | Cierra la tablita del logo. |
| 207 | `$html .= '</td></tr>';` | Cierra el encabezado. |
| 209 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Franja naranja debajo del encabezado"* |
| 210 | `$html .= '<tr><td style="background:#ff7000;height:5px;…">&nbsp;</td></tr>';` | Una franja naranja delgada (5 píxeles). `&nbsp;` es un espacio para que la celda no quede vacía. |
| 212 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Saludo y explicacion"* |
| 213 | `$html .= '<tr><td style="padding:36px 36px 8px">';` | Abre la fila del saludo, con espacio alrededor (`padding`). |
| 214 | `$html .= '<p …>Hola, ' . $primerNombre . ' &#128075;</p>';` | El saludo en naranja con el primer nombre y una mano (`&#128075;` = 👋). |
| 215 | `$html .= '<h1 …>Recupera tu contraseña</h1>';` | El título grande. |
| 216 | `$html .= '<p …>Recibimos una solicitud para cambiar la contraseña…</p>';` | El texto que explica por qué le llegó el correo. |
| 217 | `$html .= '</td></tr>';` | Cierra la fila del saludo. |
| 219 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El codigo grande en un recuadro naranja"* |
| 220 | `$html .= '<tr><td style="padding:24px 36px 8px">';` | Abre la fila del código. |
| 221 | `$html .= '<table … style="background:#fff7ed;border:2px dashed #ffb070;border-radius:20px">';` | El recuadro: fondo naranja clarito, borde punteado (`dashed`) y esquinas redondeadas. |
| 222 | `$html .= '<tr><td align="center" style="padding:28px 12px">';` | Celda centrada dentro del recuadro. |
| 223 | `$html .= '<p …>TU CÓDIGO DE VERIFICACIÓN</p>';` | Etiqueta pequeña encima del código. |
| 224 | `$html .= '<p style="…font-size:44px;…letter-spacing:12px;color:#ff7000;…">' . $codigoSeguro . '</p>';` | **El código**: letra muy grande, números separados (`letter-spacing`) y en naranja. |
| 225 | `$html .= '<p …><span …>&#9200; Vence en 15 minutos &middot; Sirve una sola vez</span></p>';` | Una "pastilla" blanca con reloj (`&#9200;` = ⏰). `&middot;` es el puntito `·`. |
| 226 | `$html .= '</td></tr></table>';` | Cierra el recuadro. |
| 227 | `$html .= '</td></tr>';` | Cierra la fila del código. |
| 229 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Boton que lleva a la pagina de recuperar contrasena"* |
| 230 | `$html .= '<tr><td align="center" style="padding:24px 36px 8px">';` | Abre la fila del botón, centrada. |
| 231 | `$html .= '<a href="' . $enlace . '" style="…background:#ff7000;…">Cambiar mi contraseña &rarr;</a>';` | El botón naranja. Es un enlace (`<a href>`) que lleva a `$enlace`. `&rarr;` es la flecha `→`. |
| 232 | `$html .= '</td></tr>';` | Cierra la fila del botón. |
| 234 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pasos para usar el codigo (circulos naranjas numerados)"* |
| 235 | `$html .= '<tr><td style="padding:28px 36px 8px">';` | Abre la fila de los pasos. |
| 236 | `$html .= '<p …>¿Cómo lo uso?</p>';` | El subtítulo. |
| 237 | `$html .= '<table width="100%" …>';` | Tabla de los pasos: cada fila tiene el círculo a la izquierda y el texto a la derecha. |
| 238 | `$html .= '<tr><td width="40" …><span style="…border-radius:50%;background:#ff7000;…">1</span></td>';` | Círculo naranja con el número 1 (`border-radius:50%` lo vuelve redondo). |
| 239 | `$html .= '<td …>Vuelve a la página de <b …>Recuperar Contraseña</b> (o toca el botón de arriba).</td></tr>';` | Texto del paso 1. `<b>` pone en negrita. |
| 240 | `$html .= '<tr><td width="40" …><span …>2</span></td>';` | Círculo con el número 2. |
| 241 | `$html .= '<td …>Escribe el código de <b …>6 números</b> que ves en este correo.</td></tr>';` | Texto del paso 2. |
| 242 | `$html .= '<tr><td width="40" valign="top"><span …>3</span></td>';` | Círculo con el número 3. |
| 243 | `$html .= '<td …>Crea tu <b …>contraseña nueva</b> (mínimo 8 caracteres) y listo.</td></tr>';` | Texto del paso 3. |
| 244 | `$html .= '</table>';` | Cierra la tabla de los pasos. |
| 245 | `$html .= '</td></tr>';` | Cierra la fila de los pasos. |
| 247 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Detalles de la solicitud (cuenta y fecha)"* |
| 248 | `$html .= '<tr><td style="padding:24px 36px 8px">';` | Abre la fila de los detalles. |
| 249 | `$html .= '<table … style="border:1px solid #e4e4e7;border-radius:16px">';` | Un cuadro con borde gris. |
| 250 | `$html .= '<tr><td colspan="2" …>DETALLES DE LA SOLICITUD</td></tr>';` | El título del cuadro. `colspan="2"` = la celda ocupa las 2 columnas. |
| 251 | `$html .= '<tr><td …>&#128231; Cuenta</td><td align="right" …>' . $correoSeguro . '</td></tr>';` | Fila "📧 Cuenta" con el correo del cliente a la derecha. |
| 252 | `$html .= '<tr><td …>&#128197; Fecha</td><td align="right" …>' . $fecha . '</td></tr>';` | Fila "📅 Fecha" con la fecha y hora en que se pidió el código. |
| 253 | `$html .= '</table>';` | Cierra el cuadro. |
| 254 | `$html .= '</td></tr>';` | Cierra la fila de los detalles. |
| 256 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Avisos de seguridad (cuadro rojo clarito)"* |
| 257 | `$html .= '<tr><td style="padding:16px 36px 36px">';` | Abre la fila de los avisos. |
| 258 | `$html .= '<table … style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:12px">';` | Cuadro rojo clarito con una raya roja a la izquierda (`border-left`), para llamar la atención. |
| 259 | `$html .= '<tr><td style="padding:16px 20px;font-size:13px;…">';` | Celda con letra pequeña en rojo oscuro. |
| 260 | `$html .= '<b>&#9888;&#65039; ¿No fuiste tú?</b> Ignora este correo…<br>';` | Primer aviso, con el símbolo ⚠️. `<br>` hace un salto de línea. |
| 261 | `$html .= '<b>&#128683; No compartas este código</b> con nadie…';` | Segundo aviso, con el símbolo 🚫: para que nadie engañe al cliente pidiéndole el código. |
| 262 | `$html .= '</td></tr></table>';` | Cierra el cuadro rojo. |
| 263 | `$html .= '</td></tr>';` | Cierra la fila de los avisos. |
| 265 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pie del correo con los datos del negocio (solo se muestran los que no esten vacios)"* |
| 266 | `$html .= '<tr><td align="center" style="background:#18181b;…">';` | Abre el pie, con fondo oscuro igual al encabezado. |
| 267 | `$html .= '<p …>' . $negocioNombre . '</p>';` | El nombre del negocio en blanco. |
| 268 | `$html .= '<p …>El Corazón de tu Cocina</p>';` | El lema en naranja clarito. |
| 269 | `if ($negocioDireccion !== '') {` | Si la dirección **no** está vacía... |
| 270 | `$html .= '&#128205; ' . $negocioDireccion . '<br>';` | ...la pone con el símbolo 📍. |
| 271 | `}` | Cierra el `if`. |
| 272 | `if ($negocioTelefono !== '') {` | Si el teléfono no está vacío... |
| 273 | `$html .= '&#128222; ' . $negocioTelefono . '<br>';` | ...lo pone con el símbolo 📞. |
| 274 | `}` | Cierra el `if`. |
| 275 | `if ($negocioInstagram !== '') {` | Si el Instagram no está vacío... |
| 276 | `$html .= '&#128248; ' . $negocioInstagram . '<br>';` | ...lo pone con el símbolo 📸. |
| 277 | `}` | Cierra el `if`. |
| 278 | `if ($negocioWeb !== '') {` | Si la página web no está vacía... |
| 279 | `$html .= '&#127760; ' . $negocioWeb . '<br>';` | ...la pone con el símbolo 🌐. |
| 280 | `}` | Cierra el `if`. |
| 281 | `$html .= '<p …>Recibiste este correo porque se pidió cambiar la contraseña de ' . $correoSeguro . '.<br>Es un correo automático… &copy; ' . $anio . ' CopiwayPRO</p>';` | La letra pequeña final: por qué le llegó el correo, que no lo responda, y `©` con el año. |
| 282 | `$html .= '</td></tr>';` | Cierra el pie. |
| 284 | `$html .= '</table>';` | Cierra la tarjeta blanca. |
| 285 | `$html .= '</td></tr></table>';` | Cierra la tabla del fondo gris. El diseño queda completo en `$html`. |
| 287 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El mismo mensaje sin diseno, para programas de correo que no muestran HTML"* |
| 288 | `$texto = 'Hola, ' . $partesNombre[0] . '. Tu código de recuperación de CopiwayPRO es ' . $codigo . '. …'` | Arma en `$texto` el mensaje sin diseño, con el nombre, el código... |
| 289 | `. 'Úsalo aquí: ' . $enlace . ' - Si no lo pediste, ignora este mensaje.';` | ...y el enlace a la página (sigue la misma instrucción de arriba). |
| 290 | `return self::enviar($para, 'Tu código de recuperación es ' . $codigo . ' - CopiwayPRO', $html, $texto);` | Envía el correo (`enviar()` de arriba) y devuelve si salió. El asunto lleva el código, así el cliente lo ve sin abrir el correo. |
| 291 | `}` | Cierra la función `enviarCodigoRecuperacion()`. |
| 292 | `}` | Cierra la clase `CorreoService`. |
| 293 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código | `Failed to open stream` |
| el método `configurado()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::configurado()` |
| el método `enviar()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::enviar()` |
| el método `comando()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::comando()` |
| el método `leerRespuesta()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::leerRespuesta()` |
| el método `armarMensaje()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::armarMensaje()` |
| la línea `stream_socket_enable_crypto(...)` | Gmail rechaza el inicio de sesión sin cifrar: el correo no sale | **no sale error en pantalla**; en el log de PHP: `El servidor de correo respondio: 530 ...` |
| el método `enviarCodigoRecuperacion()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::enviarCodigoRecuperacion()` |
| la constante `HOST` | lo que la usa dentro de la clase | `Undefined constant CorreoService::HOST` |
| la constante `PUERTO` | lo que la usa dentro de la clase | `Undefined constant CorreoService::PUERTO` |
| la constante `CIFRADO` | lo que la usa dentro de la clase | `Undefined constant CorreoService::CIFRADO` |
| la constante `USUARIO` | lo que la usa dentro de la clase | `Undefined constant CorreoService::USUARIO` |
| el método `clave()` | enviar cualquier correo | `Call to undefined method CorreoService::clave()` |
| el archivo `datos_correo.php` | no sale ningún correo (no hay error: la app sigue funcionando; en tu computador la recuperación muestra el código en pantalla) | ninguno |
| la constante `REMITENTE` | lo que la usa dentro de la clase | `Undefined constant CorreoService::REMITENTE` |
| la constante `REMITENTE_NOMBRE` | lo que la usa dentro de la clase | `Undefined constant CorreoService::REMITENTE_NOMBRE` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
