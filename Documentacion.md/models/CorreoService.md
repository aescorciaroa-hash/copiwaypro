# models/CorreoService.php

## ¿Para qué sirve?
Envía **correos electrónicos** por SMTP usando la librería **PHPMailer**. Hoy se usa para enviar el
código de recuperación de contraseña.

Si el correo no está configurado (constantes de esta clase), no falla: simplemente devuelve `false` y la app sigue
funcionando.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `AuthController.php` (`forgotPasswordRequest`) | Enviar el código. |
| → usa | PHPMailer (`vendor/`, instalado con Composer) | El envío real. |
| → usa | Sus constantes `HOST`, `PUERTO`, `CIFRADO`, `USUARIO`, `CLAVE`, `REMITENTE`, `REMITENTE_NOMBRE` | Datos del servidor de correo. Se editan al inicio de la clase. |

## `use PHPMailer\PHPMailer\PHPMailer;`
PHPMailer está dentro de un "namespace" (una carpeta de nombres). `use` permite escribir solo
`PHPMailer` en vez del nombre largo `PHPMailer\PHPMailer\PHPMailer`.

## Métodos (todos estáticos: `CorreoService::enviar(...)`)
| Método | Qué hace |
|---|---|
| `configurado()` | `true` si `HOST` y `REMITENTE` no están vacíos. |
| `enviar($para, $asunto, $html, $textoPlano)` | Arma y envía el correo. Devuelve `true` si salió. |
| `enviarCodigoRecuperacion($para, $codigo)` | Arma el HTML con el código grande en naranja y llama a `enviar()`. |

## `enviar()` explicado
| Código | Qué hace |
|---|---|
| `new PHPMailer(true)` | Crea el correo. `true` = si algo falla, lanza una excepción. |
| `$mail->isSMTP()` | Enviar por un servidor SMTP (Gmail, Outlook...). |
| `$mail->Host`, `->Port` | Servidor y puerto. |
| `SMTPSecure` | Cifrado: `ssl` o `tls` según `CIFRADO`. |
| `SMTPAuth`, `Username`, `Password` | Usuario y clave del correo, si se configuraron. |
| `setFrom()` / `addAddress()` | Quién envía / a quién. |
| `isHTML(true)`, `Body`, `AltBody` | Cuerpo en HTML y versión de texto plano. |
| `send()` | Envía. |
| `catch (Exception $e)` | Si el servidor de correo falla, lo anota en el log y devuelve `false`. Si falta una clase o un método (porque se borró), el error **sí** se muestra. |

`htmlspecialchars($codigo, ...)` convierte caracteres especiales para que no se puedan inyectar
etiquetas HTML dentro del correo.

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/CorreoService.php`).
Lo cargan con `require_once`: `controllers/AuthController.php`. Dejan de funcionar:
  - `POST /api/auth/login` → Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario).
  - `POST /api/auth/logout` → El botón "Cerrar sesión" de todos los paneles deja de funcionar.
  - `GET /api/auth/csrf` → React no recibe el token CSRF: ningún formulario puede guardar (todo responde 419).
  - `POST /api/auth/register` → No se pueden crear cuentas de cliente (pantalla "Crear cuenta").
  - `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña.
  - `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código.

**Si se borra un método:** sale `Call to undefined method CorreoService::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `configurado()` | `CorreoService::enviar()` | `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña. |
| `enviar()` | `CorreoService::enviarCodigoRecuperacion()` | `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña. |
| `enviarCodigoRecuperacion()` | `AuthController::forgotPasswordRequest()` | `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña. |

**Si se borra una constante** (`HOST`, `PUERTO`, `CIFRADO`, `USUARIO`, `CLAVE`, `REMITENTE`, `REMITENTE_NOMBRE`): sale `Undefined constant CorreoService::NOMBRE` en lo que la usa.
