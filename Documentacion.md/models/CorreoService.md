# models/CorreoService.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

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

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envio de correos por SMTP (PHPMailer). Se configura con las constantes de esta clase. Si no esta configurado, enviar() devuelve false y la app sigue funcionando."* |
| 7 | `use PHPMailer\PHPMailer\PHPMailer;` | `use` = le dice a PHP que `PHPMailer` es la clase de la librería PHPMailer (que está en `vendor/`). Así se puede escribir solo `PHPMailer`. |
| 9 | `class CorreoService` | Crea la clase `CorreoService`: envía correos. La usa `AuthController::forgotPasswordRequest()`. |
| 10 | `{` | Abre la clase `CorreoService`. |
| 11 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Servidor SMTP. Ej. Gmail: HOST 'smtp.gmail.com', PUERTO 587, 'tls', y en CLAVE una"* |
| 12 | *(comentario)* | Comentario: no se ejecuta. Dice: *""contrasena de aplicacion". Sin HOST o REMITENTE el correo no se envia; con"* |
| 13 | *(comentario)* | Comentario: no se ejecuta. Dice: *"'entorno' => 'local' (config/app.php) la respuesta trae el codigo para poder probar."* |
| 14 | `const HOST = '';` | Constante `HOST`: el servidor de correo (ej. `smtp.gmail.com`). Vacío = no se envían correos. |
| 15 | `const PUERTO = 587;` | Constante `PUERTO`: el puerto del servidor (587). |
| 16 | `const CIFRADO = 'tls';` | Constante `CIFRADO`: cómo se protege la conexión (`tls`). |
| 17 | `const USUARIO = '';` | Constante `USUARIO`: el correo con el que se entra al servidor. |
| 18 | `const CLAVE = '';` | Constante `CLAVE`: la contraseña de ese correo. |
| 19 | `const REMITENTE = '';` | Constante `REMITENTE`: el correo que aparece como "de". |
| 20 | `const REMITENTE_NOMBRE = 'CopiwayPRO';` | Constante `REMITENTE_NOMBRE`: el nombre que aparece como "de". |
| 22 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"true si hay un servidor SMTP configurado."* |
| 23 | `public static function configurado()` | Método `configurado()`: dice si el correo está configurado. |
| 24 | `{` | Abre la función `configurado()`. |
| 25 | `return self::HOST !== '' && self::REMITENTE !== '';` | Devuelve `true` si `HOST` y `REMITENTE` no están vacíos. |
| 26 | `}` | Cierra la función `configurado()`. |
| 28 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envia un correo HTML. Devuelve true si el servidor SMTP lo acepto."* |
| 29 | `public static function enviar($para, $asunto, $html, $textoPlano = '')` | Método `enviar(...)`: envía un correo. Recibe para quién, el asunto, el contenido en HTML y en texto normal. |
| 30 | `{` | Abre la función `enviar()`. |
| 31 | `if (!self::configurado()) {` | Si el correo no está configurado... |
| 32 | `return false;` | ...devuelve `false` (no se envió). |
| 33 | `}` | Cierra el `if`. |
| 35 | `try {` | Intenta... |
| 36 | `$mail = new PHPMailer(true);` | ...crear el objeto de PHPMailer y guardarlo en `$mail`. `true` = si algo falla, lanza un error. |
| 37 | `$mail->isSMTP();` | Le dice que use un servidor SMTP. |
| 38 | `$mail->Host = self::HOST;` | El servidor. |
| 39 | `$mail->Port = self::PUERTO;` | El puerto. |
| 41 | `$cifrado = strtolower(self::CIFRADO);` | Guarda en `$cifrado` el tipo de cifrado en minúscula. |
| 42 | `if ($cifrado === 'ssl') {` | Si es `ssl`... |
| 43 | `$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;` | ...usa ese cifrado. |
| 44 | `} elseif ($cifrado === 'tls') {` | Si es `tls`... |
| 45 | `$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;` | ...usa ese cifrado. |
| 46 | `} else {` | Si es otro... |
| 47 | `$mail->SMTPSecure = '';` | ...no usa cifrado... |
| 48 | `$mail->SMTPAutoTLS = false;` | ...ni lo intenta. |
| 49 | `}` | Cierra el `else`. |
| 51 | `if (self::USUARIO !== '') {` | Si hay usuario... |
| 52 | `$mail->SMTPAuth = true;` | ...le dice que hay que iniciar sesión en el servidor... |
| 53 | `$mail->Username = self::USUARIO;` | ...con este usuario... |
| 54 | `$mail->Password = self::CLAVE;` | ...y esta contraseña. |
| 55 | `}` | Cierra el `if`. |
| 56 | `$mail->Timeout = 10;` | Espera máximo 10 segundos. |
| 57 | `$mail->CharSet = 'UTF-8';` | Usa letras con tildes. |
| 59 | `$mail->setFrom(self::REMITENTE, self::REMITENTE_NOMBRE);` | Quién envía. |
| 60 | `$mail->addAddress($para);` | Para quién (`$para`). |
| 61 | `$mail->isHTML(true);` | El contenido es HTML. |
| 62 | `$mail->Subject = $asunto;` | El asunto. |
| 63 | `$mail->Body = $html;` | El contenido en HTML. |
| 64 | `$mail->AltBody = $textoPlano !== '' ? $textoPlano : trim(strip_tags($html));` | El contenido en texto normal: si se pasó, ese; si no, el HTML sin etiquetas (`strip_tags`). |
| 65 | `$mail->send();` | Envía el correo. |
| 66 | `return true;` | Devuelve `true` (se envió). |
| 67 | `} catch (Exception $e) {` | Si falló... |
| 68 | `error_log('No se pudo enviar el correo a ' . $para . ': ' . $e->getMessage());` | ...guarda el error en el archivo de errores de PHP. |
| 69 | `return false;` | ...y devuelve `false`. |
| 70 | `}` | Cierra el `catch`. |
| 71 | `}` | Cierra la función `enviar()`. |
| 73 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Correo con el codigo para recuperar la contrasena (vence en 15 min)."* |
| 74 | `public static function enviarCodigoRecuperacion($para, $codigo)` | Método `enviarCodigoRecuperacion($para, $codigo)`: envía el correo con el código para recuperar la contraseña. |
| 75 | `{` | Abre la función `enviarCodigoRecuperacion()`. |
| 76 | `$codigoSeguro = htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8');` | Prepara el código para ponerlo en HTML sin riesgo (`htmlspecialchars`). |
| 77 | `$html = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1c1917">'` | Arma en `$html` el diseño del correo: el título CopiwayPRO, el texto, el código grande en un recuadro naranja y el aviso de que vence en 15 minutos. Los `.` unen los pedazos de texto. |
| 78 | `. '<h2 style="margin:0 0 4px">Copiway<span style="color:#ea580c">PRO</span></h2>'` | ↑ (sigue la misma instrucción) |
| 79 | `. '<p style="color:#78716c;margin:0 0 24px">Recuperación de contraseña</p>'` | ↑ (sigue la misma instrucción) |
| 80 | `. '<p>Usa este código para restablecer tu contraseña:</p>'` | ↑ (sigue la misma instrucción) |
| 81 | `. '<p style="font-size:34px;font-weight:800;letter-spacing:8px;background:#fff7ed;border:1px solid #fed7aa;'` | ↑ (sigue la misma instrucción) |
| 82 | `. 'border-radius:12px;padding:16px;text-align:center;color:#ea580c;margin:16px 0">' . $codigoSeguro . '</p>'` | ↑ (sigue la misma instrucción) |
| 83 | `. '<p style="color:#78716c;font-size:13px">El código vence en 15 minutos y solo sirve una vez. '` | ↑ (sigue la misma instrucción) |
| 84 | `. 'Si no lo pediste, ignora este correo: tu contraseña no cambia.</p></div>';` | ↑ (sigue la misma instrucción) |
| 85 | `$texto = "Tu código de recuperación de CopiwayPRO es $codigo. Vence en 15 minutos. Si no lo pediste, ignora este mensaje.";` | Arma en `$texto` el mismo mensaje sin diseño. |
| 86 | `return self::enviar($para, 'Tu código de recuperación - CopiwayPRO', $html, $texto);` | Envía el correo (`enviar()` de arriba) y devuelve si salió. |
| 87 | `}` | Cierra la función `enviarCodigoRecuperacion()`. |
| 88 | `}` | Cierra la clase `CorreoService`. |
| 89 | `?>` | Cierra el código PHP. |

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
