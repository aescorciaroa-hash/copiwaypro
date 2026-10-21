<?php
/**
 * Envio de correos por SMTP (PHPMailer). Se configura con las constantes de esta clase.
 * Si no esta configurado, enviar() devuelve false y la app sigue funcionando.
 */

use PHPMailer\PHPMailer\PHPMailer;
require_once __DIR__ . '/Configuracion.php';

class CorreoService
{
    // Servidor SMTP. Ej. Gmail: HOST 'smtp.gmail.com', PUERTO 587, 'tls', y en CLAVE una
    // "contrasena de aplicacion". Sin HOST o REMITENTE el correo no se envia; con
    // 'entorno' => 'local' (config/app.php) la respuesta trae el codigo para poder probar.
    const HOST = 'smtp.gmail.com';
    const PUERTO = 587;
    const CIFRADO = 'tls';
    const USUARIO = 'aescorciaroa@gmail.com';
    const CLAVE = 'gfhyufsjwjyeagmu';
    const REMITENTE = 'aescorciaroa@gmail.com';
    const REMITENTE_NOMBRE = 'CopiwayPRO';

    /** true si hay un servidor SMTP configurado. */
    public static function configurado()
    {
        return self::HOST !== '' && self::REMITENTE !== '';
    }

    /** Envia un correo HTML. Devuelve true si el servidor SMTP lo acepto. */
    public static function enviar($para, $asunto, $html, $textoPlano = '')
    {
        if (!self::configurado()) {
            return false;
        }

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = self::HOST;
            $mail->Port = self::PUERTO;

            $cifrado = strtolower(self::CIFRADO);
            if ($cifrado === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($cifrado === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = '';
                $mail->SMTPAutoTLS = false;
            }

            if (self::USUARIO !== '') {
                $mail->SMTPAuth = true;
                $mail->Username = self::USUARIO;
                $mail->Password = self::CLAVE;
            }
            $mail->Timeout = 10;
            $mail->CharSet = 'UTF-8';

            $mail->setFrom(self::REMITENTE, self::REMITENTE_NOMBRE);
            $mail->addAddress($para);
            $mail->isHTML(true);
            $mail->Subject = $asunto;
            $mail->Body = $html;
            $mail->AltBody = $textoPlano !== '' ? $textoPlano : trim(strip_tags($html));
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('No se pudo enviar el correo a ' . $para . ': ' . $e->getMessage());
            return false;
        }
    }

    /** Correo con el codigo para recuperar la contrasena (vence en 15 min). */
    public static function enviarCodigoRecuperacion($para, $codigo, $nombre)
    {
        // Datos que se ponen dentro del correo
        $codigoSeguro = htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8');
        $correoSeguro = htmlspecialchars($para, ENT_QUOTES, 'UTF-8');
        $partesNombre = explode(' ', trim($nombre));
        $primerNombre = htmlspecialchars($partesNombre[0], ENT_QUOTES, 'UTF-8');
        $anio = date('Y');

        // Fecha y hora en espanol, ej. "20 de octubre de 2026, 10:46 am"
        $meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        $fecha = date('j') . ' de ' . $meses[date('n') - 1] . ' de ' . date('Y') . ', ' . date('g:i a');

        // Enlace a la pagina para cambiar la contrasena
        $protocolo = 'http://';
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            $protocolo = 'https://';
        }
        $servidor = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $enlace = $protocolo . $servidor . rutaBase() . '/forgot-password';

        // Datos del negocio (los que el administrador edita en Ajustes)
        $configuracion = new Configuracion();
        $negocio = $configuracion->get();
        $negocioNombre = htmlspecialchars($negocio['negocio_nombre'], ENT_QUOTES, 'UTF-8');
        $negocioDireccion = htmlspecialchars($negocio['negocio_direccion'], ENT_QUOTES, 'UTF-8');
        $negocioTelefono = htmlspecialchars($negocio['negocio_telefono'], ENT_QUOTES, 'UTF-8');
        $negocioInstagram = htmlspecialchars($negocio['negocio_instagram'], ENT_QUOTES, 'UTF-8');
        $negocioWeb = htmlspecialchars($negocio['negocio_web'], ENT_QUOTES, 'UTF-8');

        // Texto que Gmail muestra en la bandeja de entrada antes de abrir el correo (adentro no se ve)
        $html = '<div style="display:none;max-height:0;overflow:hidden;opacity:0">Tu código es ' . $codigoSeguro . '. Vence en 15 minutos.</div>';

        // Fondo gris y tarjeta blanca centrada (los correos se arman con tablas para que se vean bien en Gmail y Outlook)
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;font-family:Arial,Helvetica,sans-serif">';
        $html .= '<tr><td align="center">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08)">';

        // Encabezado oscuro con el logo y la etiqueta de seguridad
        $html .= '<tr><td style="background:#18181b;padding:24px 36px">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
        $html .= '<td style="font-size:22px;font-weight:800;color:#ffffff">&#127828; Copiway<span style="color:#ff7000">PRO</span></td>';
        $html .= '<td align="right"><span style="display:inline-block;background:#2a2a2e;border:1px solid #3f3f46;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;color:#ffb070">&#128274; SEGURIDAD</span></td>';
        $html .= '</tr></table>';
        $html .= '</td></tr>';

        // Franja naranja debajo del encabezado
        $html .= '<tr><td style="background:#ff7000;height:5px;font-size:0;line-height:0">&nbsp;</td></tr>';

        // Saludo y explicacion
        $html .= '<tr><td style="padding:36px 36px 8px">';
        $html .= '<p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#ff7000">Hola, ' . $primerNombre . ' &#128075;</p>';
        $html .= '<h1 style="margin:0 0 14px;font-size:28px;line-height:34px;color:#18181b">Recupera tu contraseña</h1>';
        $html .= '<p style="margin:0;font-size:15px;line-height:24px;color:#52525b">Recibimos una solicitud para cambiar la contraseña de tu cuenta en CopiwayPRO. Usa este código para crear una contraseña nueva y volver a pedir tus hamburguesas favoritas.</p>';
        $html .= '</td></tr>';

        // El codigo grande en un recuadro naranja
        $html .= '<tr><td style="padding:24px 36px 8px">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:2px dashed #ffb070;border-radius:20px">';
        $html .= '<tr><td align="center" style="padding:28px 12px">';
        $html .= '<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#c2410c">TU CÓDIGO DE VERIFICACIÓN</p>';
        $html .= '<p style="margin:0;font-size:44px;font-weight:800;letter-spacing:12px;color:#ff7000;font-family:Courier New,monospace">' . $codigoSeguro . '</p>';
        $html .= '<p style="margin:14px 0 0"><span style="display:inline-block;background:#ffffff;border-radius:999px;padding:6px 14px;font-size:13px;color:#9a3412">&#9200; Vence en 15 minutos &middot; Sirve una sola vez</span></p>';
        $html .= '</td></tr></table>';
        $html .= '</td></tr>';

        // Boton que lleva a la pagina de recuperar contrasena
        $html .= '<tr><td align="center" style="padding:24px 36px 8px">';
        $html .= '<a href="' . $enlace . '" style="display:inline-block;background:#ff7000;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 36px;border-radius:16px">Cambiar mi contraseña &rarr;</a>';
        $html .= '</td></tr>';

        // Pasos para usar el codigo (circulos naranjas numerados)
        $html .= '<tr><td style="padding:28px 36px 8px">';
        $html .= '<p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#18181b">¿Cómo lo uso?</p>';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0">';
        $html .= '<tr><td width="40" valign="top" style="padding:0 0 12px"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#ff7000;color:#ffffff;font-size:13px;font-weight:700">1</span></td>';
        $html .= '<td style="padding:4px 0 12px;font-size:14px;line-height:21px;color:#52525b">Vuelve a la página de <b style="color:#18181b">Recuperar Contraseña</b> (o toca el botón de arriba).</td></tr>';
        $html .= '<tr><td width="40" valign="top" style="padding:0 0 12px"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#ff7000;color:#ffffff;font-size:13px;font-weight:700">2</span></td>';
        $html .= '<td style="padding:4px 0 12px;font-size:14px;line-height:21px;color:#52525b">Escribe el código de <b style="color:#18181b">6 números</b> que ves en este correo.</td></tr>';
        $html .= '<tr><td width="40" valign="top"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#ff7000;color:#ffffff;font-size:13px;font-weight:700">3</span></td>';
        $html .= '<td style="padding:4px 0 0;font-size:14px;line-height:21px;color:#52525b">Crea tu <b style="color:#18181b">contraseña nueva</b> (mínimo 8 caracteres) y listo.</td></tr>';
        $html .= '</table>';
        $html .= '</td></tr>';

        // Detalles de la solicitud (cuenta y fecha)
        $html .= '<tr><td style="padding:24px 36px 8px">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:16px">';
        $html .= '<tr><td colspan="2" style="padding:14px 20px;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:700;letter-spacing:1px;color:#71717a">DETALLES DE LA SOLICITUD</td></tr>';
        $html .= '<tr><td style="padding:12px 20px 4px;font-size:13px;color:#71717a">&#128231; Cuenta</td><td align="right" style="padding:12px 20px 4px;font-size:13px;font-weight:700;color:#18181b">' . $correoSeguro . '</td></tr>';
        $html .= '<tr><td style="padding:4px 20px 14px;font-size:13px;color:#71717a">&#128197; Fecha</td><td align="right" style="padding:4px 20px 14px;font-size:13px;font-weight:700;color:#18181b">' . $fecha . '</td></tr>';
        $html .= '</table>';
        $html .= '</td></tr>';

        // Avisos de seguridad (cuadro rojo clarito)
        $html .= '<tr><td style="padding:16px 36px 36px">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:12px">';
        $html .= '<tr><td style="padding:16px 20px;font-size:13px;line-height:21px;color:#7f1d1d">';
        $html .= '<b>&#9888;&#65039; ¿No fuiste tú?</b> Ignora este correo: tu contraseña no cambia y tu cuenta sigue protegida.<br>';
        $html .= '<b>&#128683; No compartas este código</b> con nadie. CopiwayPRO nunca te lo va a pedir por llamada, chat ni WhatsApp.';
        $html .= '</td></tr></table>';
        $html .= '</td></tr>';

        // Pie del correo con los datos del negocio (solo se muestran los que no esten vacios)
        $html .= '<tr><td align="center" style="background:#18181b;padding:28px 36px;font-size:12px;line-height:20px;color:#a1a1aa">';
        $html .= '<p style="margin:0 0 4px;font-size:16px;font-weight:800;color:#ffffff">' . $negocioNombre . '</p>';
        $html .= '<p style="margin:0 0 14px;color:#ffb070">El Corazón de tu Cocina</p>';
        if ($negocioDireccion !== '') {
            $html .= '&#128205; ' . $negocioDireccion . '<br>';
        }
        if ($negocioTelefono !== '') {
            $html .= '&#128222; ' . $negocioTelefono . '<br>';
        }
        if ($negocioInstagram !== '') {
            $html .= '&#128248; ' . $negocioInstagram . '<br>';
        }
        if ($negocioWeb !== '') {
            $html .= '&#127760; ' . $negocioWeb . '<br>';
        }
        $html .= '<p style="margin:16px 0 0;padding-top:16px;border-top:1px solid #3f3f46;font-size:11px;color:#71717a">Recibiste este correo porque se pidió cambiar la contraseña de ' . $correoSeguro . '.<br>Es un correo automático, por favor no lo respondas. &copy; ' . $anio . ' CopiwayPRO</p>';
        $html .= '</td></tr>';

        $html .= '</table>';
        $html .= '</td></tr></table>';

        // El mismo mensaje sin diseno, para programas de correo que no muestran HTML
        $texto = 'Hola, ' . $partesNombre[0] . '. Tu código de recuperación de CopiwayPRO es ' . $codigo . '. Vence en 15 minutos y sirve una sola vez. '
            . 'Úsalo aquí: ' . $enlace . ' - Si no lo pediste, ignora este mensaje.';
        return self::enviar($para, 'Tu código de recuperación es ' . $codigo . ' - CopiwayPRO', $html, $texto);
    }
}
?>
