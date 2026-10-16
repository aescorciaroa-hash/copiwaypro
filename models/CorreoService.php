<?php
/**
 * Envio de correos por SMTP (PHPMailer). Se configura con las constantes de esta clase.
 * Si no esta configurado, enviar() devuelve false y la app sigue funcionando.
 */

use PHPMailer\PHPMailer\PHPMailer;

class CorreoService
{
    // Servidor SMTP. Ej. Gmail: HOST 'smtp.gmail.com', PUERTO 587, 'tls', y en CLAVE una
    // "contrasena de aplicacion". Sin HOST o REMITENTE el correo no se envia; con
    // 'entorno' => 'local' (config/app.php) la respuesta trae el codigo para poder probar.
    const HOST = '';
    const PUERTO = 587;
    const CIFRADO = 'tls';
    const USUARIO = '';
    const CLAVE = '';
    const REMITENTE = '';
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
    public static function enviarCodigoRecuperacion($para, $codigo)
    {
        $codigoSeguro = htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8');
        $html = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1c1917">'
            . '<h2 style="margin:0 0 4px">Copiway<span style="color:#ea580c">PRO</span></h2>'
            . '<p style="color:#78716c;margin:0 0 24px">Recuperación de contraseña</p>'
            . '<p>Usa este código para restablecer tu contraseña:</p>'
            . '<p style="font-size:34px;font-weight:800;letter-spacing:8px;background:#fff7ed;border:1px solid #fed7aa;'
            . 'border-radius:12px;padding:16px;text-align:center;color:#ea580c;margin:16px 0">' . $codigoSeguro . '</p>'
            . '<p style="color:#78716c;font-size:13px">El código vence en 15 minutos y solo sirve una vez. '
            . 'Si no lo pediste, ignora este correo: tu contraseña no cambia.</p></div>';
        $texto = "Tu código de recuperación de CopiwayPRO es $codigo. Vence en 15 minutos. Si no lo pediste, ignora este mensaje.";
        return self::enviar($para, 'Tu código de recuperación - CopiwayPRO', $html, $texto);
    }
}
?>