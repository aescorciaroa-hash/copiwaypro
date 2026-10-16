# app/Services/CorreoService.php

## ¿Para qué sirve?
Envía **correos electrónicos** por SMTP usando la librería **PHPMailer**. Hoy se usa para enviar el
código de recuperación de contraseña.

Si el correo no está configurado en el `.env`, no falla: simplemente devuelve `false` y la app sigue
funcionando.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `AuthController.php` (`forgotPasswordRequest`) | Enviar el código. |
| → usa | PHPMailer (`vendor/`, instalado con Composer) | El envío real. |
| → lee | `.env`: `MAIL_HOST`, `MAIL_PORT`, `MAIL_ENCRYPTION`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_FROM_NAME` | Datos del servidor de correo. |

## `use PHPMailer\PHPMailer\PHPMailer;`
PHPMailer está dentro de un "namespace" (una carpeta de nombres). `use` permite escribir solo
`PHPMailer` en vez del nombre largo `PHPMailer\PHPMailer\PHPMailer`.

## Métodos (todos estáticos: `CorreoService::enviar(...)`)
| Método | Qué hace |
|---|---|
| `configurado()` | `true` si PHPMailer está instalado y existen `MAIL_HOST` y `MAIL_FROM`. |
| `enviar($para, $asunto, $html, $textoPlano)` | Arma y envía el correo. Devuelve `true` si salió. |
| `enviarCodigoRecuperacion($para, $codigo)` | Arma el HTML con el código grande en naranja y llama a `enviar()`. |

## `enviar()` explicado
| Código | Qué hace |
|---|---|
| `new PHPMailer(true)` | Crea el correo. `true` = si algo falla, lanza una excepción. |
| `$mail->isSMTP()` | Enviar por un servidor SMTP (Gmail, Outlook...). |
| `$mail->Host`, `->Port` | Servidor y puerto. |
| `SMTPSecure` | Cifrado: `ssl` o `tls` según `MAIL_ENCRYPTION`. |
| `SMTPAuth`, `Username`, `Password` | Usuario y clave del correo, si se configuraron. |
| `setFrom()` / `addAddress()` | Quién envía / a quién. |
| `isHTML(true)`, `Body`, `AltBody` | Cuerpo en HTML y versión de texto plano. |
| `send()` | Envía. |
| `catch (Throwable $e)` | Si falla, lo anota en el log y devuelve `false` (nunca muestra el error al usuario). |

`htmlspecialchars($codigo, ...)` convierte caracteres especiales para que no se puedan inyectar
etiquetas HTML dentro del correo.
