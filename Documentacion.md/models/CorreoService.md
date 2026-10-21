# models/CorreoService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Envía correos (el código para recuperar la contraseña).

## ¿Qué hace?
- dice si el correo está configurado
- envía un correo
- envía el código para recuperar la contraseña

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `configurado()` | dice si el correo está configurado | `CorreoService::enviar()` |
| `enviar()` | envía un correo | `CorreoService::enviarCodigoRecuperacion()` |
| `enviarCodigoRecuperacion()` | envía el código para recuperar la contraseña | `AuthController::forgotPasswordRequest()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/AuthController.php`.
- **Carga:** `models/Configuracion.php` (los datos del negocio para el pie del correo) y usa `rutaBase()` de `config/helpers.php` (para armar el enlace del botón).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envio de correos por SMTP (PHPMailer). Se configura con las constantes de esta clase. Si no esta configurado, enviar() devuelve false y la app sigue funcionando."* |
| 7 | `use PHPMailer\PHPMailer\PHPMailer;` | `use` = le dice a PHP que `PHPMailer` es la clase de la librería PHPMailer (que está en `vendor/`). Así se puede escribir solo `PHPMailer`. |
| 8 | `require_once __DIR__ . '/Configuracion.php';` | Carga el modelo `Configuracion` (`models/Configuracion.php`), para sacar los datos del negocio que van en el pie del correo. |
| 10 | `class CorreoService` | Crea la clase `CorreoService`: envía correos. La usa `AuthController::forgotPasswordRequest()`. |
| 11 | `{` | Abre la clase `CorreoService`. |
| 12 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Servidor SMTP. Ej. Gmail: HOST 'smtp.gmail.com', PUERTO 587, 'tls', y en CLAVE una"* |
| 13 | *(comentario)* | Comentario: no se ejecuta. Dice: *""contrasena de aplicacion". Sin HOST o REMITENTE el correo no se envia; con"* |
| 14 | *(comentario)* | Comentario: no se ejecuta. Dice: *"'entorno' => 'local' (config/app.php) la respuesta trae el codigo para poder probar."* |
| 15 | `const HOST = 'smtp.gmail.com';` | Constante `HOST`: el servidor de correo de Gmail (el "cartero"). Si queda vacío, no se envían correos. |
| 16 | `const PUERTO = 587;` | Constante `PUERTO`: el puerto del servidor (587). |
| 17 | `const CIFRADO = 'tls';` | Constante `CIFRADO`: cómo se protege la conexión (`tls`). |
| 18 | `const USUARIO = 'aescorciaroa@gmail.com';` | Constante `USUARIO`: el Gmail con el que se entra al servidor. Gmail revisa la clave con este correo. |
| 19 | `const CLAVE = '...';` | Constante `CLAVE`: la "contraseña de aplicación" de 16 letras, sin espacios, que da Google en myaccount.google.com/apppasswords. **No es** la contraseña normal del correo. |
| 20 | `const REMITENTE = 'aescorciaroa@gmail.com';` | Constante `REMITENTE`: el correo que el cliente ve en "De:". Debe ser el mismo de `USUARIO` (Gmail no deja enviar a nombre de otro correo). |
| 21 | `const REMITENTE_NOMBRE = 'CopiwayPRO';` | Constante `REMITENTE_NOMBRE`: el nombre que aparece como "de". |
| 23 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"true si hay un servidor SMTP configurado."* |
| 24 | `public static function configurado()` | Método `configurado()`: dice si el correo está configurado. |
| 25 | `{` | Abre la función `configurado()`. |
| 26 | `return self::HOST !== '' && self::REMITENTE !== '';` | Devuelve `true` si `HOST` y `REMITENTE` no están vacíos. |
| 27 | `}` | Cierra la función `configurado()`. |
| 29 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envia un correo HTML. Devuelve true si el servidor SMTP lo acepto."* |
| 30 | `public static function enviar($para, $asunto, $html, $textoPlano = '')` | Método `enviar(...)`: envía un correo. Recibe para quién, el asunto, el contenido en HTML y en texto normal. |
| 31 | `{` | Abre la función `enviar()`. |
| 32 | `if (!self::configurado()) {` | Si el correo no está configurado... |
| 33 | `return false;` | ...devuelve `false` (no se envió). |
| 34 | `}` | Cierra el `if`. |
| 36 | `try {` | Intenta... |
| 37 | `$mail = new PHPMailer(true);` | ...crear el objeto de PHPMailer y guardarlo en `$mail`. `true` = si algo falla, lanza un error. |
| 38 | `$mail->isSMTP();` | Le dice que use un servidor SMTP. |
| 39 | `$mail->Host = self::HOST;` | El servidor. |
| 40 | `$mail->Port = self::PUERTO;` | El puerto. |
| 42 | `$cifrado = strtolower(self::CIFRADO);` | Guarda en `$cifrado` el tipo de cifrado en minúscula. |
| 43 | `if ($cifrado === 'ssl') {` | Si es `ssl`... |
| 44 | `$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;` | ...usa ese cifrado. |
| 45 | `} elseif ($cifrado === 'tls') {` | Si es `tls`... |
| 46 | `$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;` | ...usa ese cifrado. |
| 47 | `} else {` | Si es otro... |
| 48 | `$mail->SMTPSecure = '';` | ...no usa cifrado... |
| 49 | `$mail->SMTPAutoTLS = false;` | ...ni lo intenta. |
| 50 | `}` | Cierra el `else`. |
| 52 | `if (self::USUARIO !== '') {` | Si hay usuario... |
| 53 | `$mail->SMTPAuth = true;` | ...le dice que hay que iniciar sesión en el servidor... |
| 54 | `$mail->Username = self::USUARIO;` | ...con este usuario... |
| 55 | `$mail->Password = self::CLAVE;` | ...y esta contraseña. |
| 56 | `}` | Cierra el `if`. |
| 57 | `$mail->Timeout = 10;` | Espera máximo 10 segundos. |
| 58 | `$mail->CharSet = 'UTF-8';` | Usa letras con tildes. |
| 60 | `$mail->setFrom(self::REMITENTE, self::REMITENTE_NOMBRE);` | Quién envía. |
| 61 | `$mail->addAddress($para);` | Para quién (`$para`). |
| 62 | `$mail->isHTML(true);` | El contenido es HTML. |
| 63 | `$mail->Subject = $asunto;` | El asunto. |
| 64 | `$mail->Body = $html;` | El contenido en HTML. |
| 65 | `$mail->AltBody = $textoPlano !== '' ? $textoPlano : trim(strip_tags($html));` | El contenido en texto normal: si se pasó, ese; si no, el HTML sin etiquetas (`strip_tags`). |
| 66 | `$mail->send();` | Envía el correo. |
| 67 | `return true;` | Devuelve `true` (se envió). |
| 68 | `} catch (Exception $e) {` | Si falló... |
| 69 | `error_log('No se pudo enviar el correo a ' . $para . ': ' . $e->getMessage());` | ...guarda el error en el archivo de errores de PHP. |
| 70 | `return false;` | ...y devuelve `false`. |
| 71 | `}` | Cierra el `catch`. |
| 72 | `}` | Cierra la función `enviar()`. |
| 74 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Correo con el codigo para recuperar la contrasena (vence en 15 min)."* |
| 75 | `public static function enviarCodigoRecuperacion($para, $codigo, $nombre)` | Método `enviarCodigoRecuperacion()`: envía el correo con el código. Recibe 3 datos: `$para` (el correo del cliente), `$codigo` (los 6 números) y `$nombre` (el nombre del cliente, para saludarlo). Lo llama `AuthController::forgotPasswordRequest()`. |
| 76 | `{` | Abre la función `enviarCodigoRecuperacion()`. |
| 77 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Datos que se ponen dentro del correo"*. |
| 78 | `$codigoSeguro = htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8');` | Prepara el código para ponerlo en HTML sin riesgo (`htmlspecialchars` cambia símbolos como `<` para que no se vuelvan código). |
| 79 | `$correoSeguro = htmlspecialchars($para, ENT_QUOTES, 'UTF-8');` | Lo mismo con el correo del cliente. |
| 80 | `$partesNombre = explode(' ', trim($nombre));` | Parte el nombre por los espacios (`explode`). Ej. `'Ana María Pérez'` → `['Ana', 'María', 'Pérez']`. `trim` quita espacios sobrantes. |
| 81 | `$primerNombre = htmlspecialchars($partesNombre[0], ENT_QUOTES, 'UTF-8');` | Toma solo el primer nombre (`[0]` = el primero de la lista), para saludar con "Hola, Ana". |
| 82 | `$anio = date('Y');` | Guarda en `$anio` el año actual (ej. `2026`), para el pie del correo. |
| 84 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Fecha y hora en espanol, ej. "20 de octubre de 2026, 10:46 am""*. |
| 85 | `$meses = ['enero', 'febrero', …, 'diciembre'];` | Lista con los 12 meses en español (PHP los da en inglés). |
| 86 | `$fecha = date('j') . ' de ' . $meses[date('n') - 1] . ' de ' . date('Y') . ', ' . date('g:i a');` | Arma la fecha: `date('j')` = día, `date('n')` = número del mes (se le resta 1 porque la lista empieza en 0), `date('Y')` = año, `date('g:i a')` = hora. Queda algo como `20 de octubre de 2026, 10:46 am`. |
| 88 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Enlace a la pagina para cambiar la contrasena"*. |
| 89 | `$protocolo = 'http://';` | Empieza suponiendo que la página usa `http://`. |
| 90 | `if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {` | Si la página está abierta con conexión segura (HTTPS)... |
| 91 | `$protocolo = 'https://';` | ...cambia a `https://`. |
| 92 | `}` | Cierra el `if`. |
| 93 | `$servidor = $_SERVER['HTTP_HOST'] ?? 'localhost';` | Guarda la dirección del servidor (ej. `localhost`). `??` = si no hay, usa `'localhost'`. |
| 94 | `$enlace = $protocolo . $servidor . rutaBase() . '/forgot-password';` | Arma el enlace completo a la página de recuperar contraseña. `rutaBase()` (de `config/helpers.php`) agrega la carpeta, ej. `http://localhost/copiwaypro/forgot-password`. |
| 96 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Datos del negocio (los que el administrador edita en Ajustes)"*. |
| 97 | `$configuracion = new Configuracion();` | Crea el modelo `Configuracion` (de `models/Configuracion.php`). |
| 98 | `$negocio = $configuracion->get();` | Trae la fila de `CONFIGURACION_SISTEMA` con todos los ajustes (`get()`). |
| 99 | `$negocioNombre = htmlspecialchars($negocio['negocio_nombre'], …);` | El nombre del negocio, preparado para HTML. |
| 100 | `$negocioDireccion = htmlspecialchars($negocio['negocio_direccion'], …);` | La dirección del negocio. |
| 101 | `$negocioTelefono = htmlspecialchars($negocio['negocio_telefono'], …);` | El teléfono del negocio. |
| 102 | `$negocioInstagram = htmlspecialchars($negocio['negocio_instagram'], …);` | El Instagram del negocio. |
| 103 | `$negocioWeb = htmlspecialchars($negocio['negocio_web'], …);` | La página web del negocio. |
| 105 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Texto que Gmail muestra en la bandeja de entrada antes de abrir el correo (adentro no se ve)"*. |
| 106 | `$html = '<div style="display:none;…">Tu código es ' . $codigoSeguro . '. Vence en 15 minutos.</div>';` | Empieza a armar el correo en `$html`. Este texto está escondido (`display:none`), pero Gmail lo muestra en gris al lado del asunto en la lista de correos. |
| 108 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Fondo gris y tarjeta blanca centrada (los correos se arman con tablas para que se vean bien en Gmail y Outlook)"*. Los programas de correo no entienden bien el diseño moderno de las páginas; con tablas (`<table>`, `<tr>` = fila, `<td>` = celda) todo queda en su sitio. |
| 109 | `$html .= '<table width="100%" … style="background:#f4f4f5;…">';` | `.=` **pega** más texto al final de `$html`. Una tabla de todo el ancho con fondo gris claro. |
| 110 | `$html .= '<tr><td align="center">';` | Fila y celda que centran lo de adentro. |
| 111 | `$html .= '<table … style="max-width:560px;background:#ffffff;border-radius:24px;…">';` | La tarjeta blanca: máximo 560 píxeles de ancho, esquinas redondeadas y sombra suave. |
| 113 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Encabezado oscuro con el logo y la etiqueta de seguridad"*. |
| 114 | `$html .= '<tr><td style="background:#18181b;padding:24px 36px">';` | Abre el encabezado con fondo casi negro, como el login. |
| 115 | `$html .= '<table width="100%" …><tr>';` | Una tablita de una fila para poner el logo a la izquierda y la etiqueta a la derecha. |
| 116 | `$html .= '<td …>&#127828; Copiway<span style="color:#ff7000">PRO</span></td>';` | El logo: hamburguesa (`&#127828;` = 🍔), "Copiway" en blanco y "PRO" en naranja (`#ff7000`). |
| 117 | `$html .= '<td align="right"><span …>&#128274; SEGURIDAD</span></td>';` | A la derecha, una etiqueta redondeada con candado (`&#128274;` = 🔒) que dice "SEGURIDAD". |
| 118 | `$html .= '</tr></table>';` | Cierra la tablita del logo. |
| 119 | `$html .= '</td></tr>';` | Cierra el encabezado. |
| 121 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Franja naranja debajo del encabezado"*. |
| 122 | `$html .= '<tr><td style="background:#ff7000;height:5px;…">&nbsp;</td></tr>';` | Una franja naranja delgada (5 píxeles). `&nbsp;` es un espacio para que la celda no quede vacía. |
| 124 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Saludo y explicacion"*. |
| 125 | `$html .= '<tr><td style="padding:36px 36px 8px">';` | Abre la fila del saludo, con espacio alrededor (`padding`). |
| 126 | `$html .= '<p …>Hola, ' . $primerNombre . ' &#128075;</p>';` | El saludo en naranja con el primer nombre y una mano (`&#128075;` = 👋). |
| 127 | `$html .= '<h1 …>Recupera tu contraseña</h1>';` | El título grande. |
| 128 | `$html .= '<p …>Recibimos una solicitud para cambiar la contraseña…</p>';` | El texto que explica por qué le llegó el correo. |
| 129 | `$html .= '</td></tr>';` | Cierra la fila del saludo. |
| 131 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El codigo grande en un recuadro naranja"*. |
| 132 | `$html .= '<tr><td style="padding:24px 36px 8px">';` | Abre la fila del código. |
| 133 | `$html .= '<table … style="background:#fff7ed;border:2px dashed #ffb070;border-radius:20px">';` | El recuadro: fondo naranja clarito, borde punteado (`dashed`) y esquinas redondeadas. |
| 134 | `$html .= '<tr><td align="center" style="padding:28px 12px">';` | Celda centrada dentro del recuadro. |
| 135 | `$html .= '<p …>TU CÓDIGO DE VERIFICACIÓN</p>';` | Etiqueta pequeña encima del código. |
| 136 | `$html .= '<p style="…font-size:44px;…letter-spacing:12px;color:#ff7000;…">' . $codigoSeguro . '</p>';` | **El código**: letra muy grande, números separados (`letter-spacing`) y en naranja. |
| 137 | `$html .= '<p …><span …>&#9200; Vence en 15 minutos &middot; Sirve una sola vez</span></p>';` | Una "pastilla" blanca con reloj (`&#9200;` = ⏰). `&middot;` es el puntito `·`. |
| 138 | `$html .= '</td></tr></table>';` | Cierra el recuadro. |
| 139 | `$html .= '</td></tr>';` | Cierra la fila del código. |
| 141 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Boton que lleva a la pagina de recuperar contrasena"*. |
| 142 | `$html .= '<tr><td align="center" style="padding:24px 36px 8px">';` | Abre la fila del botón, centrada. |
| 143 | `$html .= '<a href="' . $enlace . '" style="…background:#ff7000;…">Cambiar mi contraseña &rarr;</a>';` | El botón naranja. Es un enlace (`<a href>`) que lleva a `$enlace`. `&rarr;` es la flecha `→`. |
| 144 | `$html .= '</td></tr>';` | Cierra la fila del botón. |
| 146 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pasos para usar el codigo (circulos naranjas numerados)"*. |
| 147 | `$html .= '<tr><td style="padding:28px 36px 8px">';` | Abre la fila de los pasos. |
| 148 | `$html .= '<p …>¿Cómo lo uso?</p>';` | El subtítulo. |
| 149 | `$html .= '<table width="100%" …>';` | Tabla de los pasos: cada fila tiene el círculo a la izquierda y el texto a la derecha. |
| 150 | `$html .= '<tr><td width="40" …><span style="…border-radius:50%;background:#ff7000;…">1</span></td>';` | Círculo naranja con el número 1 (`border-radius:50%` lo vuelve redondo). |
| 151 | `$html .= '<td …>Vuelve a la página de <b …>Recuperar Contraseña</b> (o toca el botón de arriba).</td></tr>';` | Texto del paso 1. `<b>` pone en negrita. |
| 152 | `$html .= '<tr><td width="40" …><span …>2</span></td>';` | Círculo con el número 2. |
| 153 | `$html .= '<td …>Escribe el código de <b …>6 números</b> que ves en este correo.</td></tr>';` | Texto del paso 2. |
| 154 | `$html .= '<tr><td width="40" valign="top"><span …>3</span></td>';` | Círculo con el número 3. |
| 155 | `$html .= '<td …>Crea tu <b …>contraseña nueva</b> (mínimo 8 caracteres) y listo.</td></tr>';` | Texto del paso 3. |
| 156 | `$html .= '</table>';` | Cierra la tabla de los pasos. |
| 157 | `$html .= '</td></tr>';` | Cierra la fila de los pasos. |
| 159 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Detalles de la solicitud (cuenta y fecha)"*. |
| 160 | `$html .= '<tr><td style="padding:24px 36px 8px">';` | Abre la fila de los detalles. |
| 161 | `$html .= '<table … style="border:1px solid #e4e4e7;border-radius:16px">';` | Un cuadro con borde gris. |
| 162 | `$html .= '<tr><td colspan="2" …>DETALLES DE LA SOLICITUD</td></tr>';` | El título del cuadro. `colspan="2"` = la celda ocupa las 2 columnas. |
| 163 | `$html .= '<tr><td …>&#128231; Cuenta</td><td align="right" …>' . $correoSeguro . '</td></tr>';` | Fila "📧 Cuenta" con el correo del cliente a la derecha. |
| 164 | `$html .= '<tr><td …>&#128197; Fecha</td><td align="right" …>' . $fecha . '</td></tr>';` | Fila "📅 Fecha" con la fecha y hora en que se pidió el código. |
| 165 | `$html .= '</table>';` | Cierra el cuadro. |
| 166 | `$html .= '</td></tr>';` | Cierra la fila de los detalles. |
| 168 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Avisos de seguridad (cuadro rojo clarito)"*. |
| 169 | `$html .= '<tr><td style="padding:16px 36px 36px">';` | Abre la fila de los avisos. |
| 170 | `$html .= '<table … style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:12px">';` | Cuadro rojo clarito con una raya roja a la izquierda (`border-left`), para llamar la atención. |
| 171 | `$html .= '<tr><td style="padding:16px 20px;font-size:13px;…">';` | Celda con letra pequeña en rojo oscuro. |
| 172 | `$html .= '<b>&#9888;&#65039; ¿No fuiste tú?</b> Ignora este correo…<br>';` | Primer aviso, con el símbolo ⚠️. `<br>` hace un salto de línea. |
| 173 | `$html .= '<b>&#128683; No compartas este código</b> con nadie…';` | Segundo aviso, con el símbolo 🚫: para que nadie engañe al cliente pidiéndole el código. |
| 174 | `$html .= '</td></tr></table>';` | Cierra el cuadro rojo. |
| 175 | `$html .= '</td></tr>';` | Cierra la fila de los avisos. |
| 177 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pie del correo con los datos del negocio (solo se muestran los que no esten vacios)"*. |
| 178 | `$html .= '<tr><td align="center" style="background:#18181b;…">';` | Abre el pie, con fondo oscuro igual al encabezado. |
| 179 | `$html .= '<p …>' . $negocioNombre . '</p>';` | El nombre del negocio en blanco. |
| 180 | `$html .= '<p …>El Corazón de tu Cocina</p>';` | El lema en naranja clarito. |
| 181 | `if ($negocioDireccion !== '') {` | Si la dirección **no** está vacía... |
| 182 | `$html .= '&#128205; ' . $negocioDireccion . '<br>';` | ...la pone con el símbolo 📍. |
| 183 | `}` | Cierra el `if`. |
| 184 | `if ($negocioTelefono !== '') {` | Si el teléfono no está vacío... |
| 185 | `$html .= '&#128222; ' . $negocioTelefono . '<br>';` | ...lo pone con el símbolo 📞. |
| 186 | `}` | Cierra el `if`. |
| 187 | `if ($negocioInstagram !== '') {` | Si el Instagram no está vacío... |
| 188 | `$html .= '&#128248; ' . $negocioInstagram . '<br>';` | ...lo pone con el símbolo 📸. |
| 189 | `}` | Cierra el `if`. |
| 190 | `if ($negocioWeb !== '') {` | Si la página web no está vacía... |
| 191 | `$html .= '&#127760; ' . $negocioWeb . '<br>';` | ...la pone con el símbolo 🌐. |
| 192 | `}` | Cierra el `if`. |
| 193 | `$html .= '<p …>Recibiste este correo porque se pidió cambiar la contraseña de ' . $correoSeguro . '.<br>Es un correo automático… &copy; ' . $anio . ' CopiwayPRO</p>';` | La letra pequeña final: por qué le llegó el correo, que no lo responda, y `©` con el año. |
| 194 | `$html .= '</td></tr>';` | Cierra el pie. |
| 196 | `$html .= '</table>';` | Cierra la tarjeta blanca. |
| 197 | `$html .= '</td></tr></table>';` | Cierra la tabla del fondo gris. El diseño queda completo en `$html`. |
| 199 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El mismo mensaje sin diseno, para programas de correo que no muestran HTML"*. |
| 200 | `$texto = 'Hola, ' . $partesNombre[0] . '. Tu código de recuperación de CopiwayPRO es ' . $codigo . '. …'` | Arma en `$texto` el mensaje sin diseño, con el nombre, el código... |
| 201 | `. 'Úsalo aquí: ' . $enlace . ' - Si no lo pediste, ignora este mensaje.';` | ...y el enlace a la página (sigue la misma instrucción de arriba). |
| 202 | `return self::enviar($para, 'Tu código de recuperación es ' . $codigo . ' - CopiwayPRO', $html, $texto);` | Envía el correo (`enviar()` de arriba) y devuelve si salió. El asunto lleva el código, así el cliente lo ve sin abrir el correo. |
| 203 | `}` | Cierra la función `enviarCodigoRecuperacion()`. |
| 204 | `}` | Cierra la clase `CorreoService`. |
| 205 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | iniciar sesión, cerrar sesión, entregar el token de seguridad (sin él no se puede guardar nada), registrarse, pedir el código para recuperar la contraseña, cambiar la contraseña con el código | `Failed to open stream` |
| el método `configurado()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::configurado()` |
| el método `enviar()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::enviar()` |
| el método `enviarCodigoRecuperacion()` | pedir el código para recuperar la contraseña | `Call to undefined method CorreoService::enviarCodigoRecuperacion()` |
| la constante `HOST` | lo que la usa dentro de la clase | `Undefined constant CorreoService::HOST` |
| la constante `PUERTO` | lo que la usa dentro de la clase | `Undefined constant CorreoService::PUERTO` |
| la constante `CIFRADO` | lo que la usa dentro de la clase | `Undefined constant CorreoService::CIFRADO` |
| la constante `USUARIO` | lo que la usa dentro de la clase | `Undefined constant CorreoService::USUARIO` |
| la constante `CLAVE` | lo que la usa dentro de la clase | `Undefined constant CorreoService::CLAVE` |
| la constante `REMITENTE` | lo que la usa dentro de la clase | `Undefined constant CorreoService::REMITENTE` |
| la constante `REMITENTE_NOMBRE` | lo que la usa dentro de la clase | `Undefined constant CorreoService::REMITENTE_NOMBRE` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
