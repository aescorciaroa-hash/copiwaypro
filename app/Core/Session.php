<?php
/**
 * Ayudas sencillas para manejar la sesion PHP, el token CSRF y los mensajes flash.
 */
class Session
{
    /** Inicia la sesion con cookies seguras. */
    public static function start()
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        session_set_cookie_params([
            'lifetime' => (int) env('SESSION_LIFETIME', 120) * 60,
            'path'     => rutaBase() . '/',
            'domain'   => '',
            'secure'   => $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_name(env('SESSION_NAME', 'copiway_session'));
        session_start();
    }

    /** Borra todos los datos de la sesion y su cookie. */
    public static function destroy()
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }

    /** Token CSRF de la sesion; lo crea si no existe. */
    public static function csrf()
    {
        if (empty($_SESSION['_csrf'])) {
            $_SESSION['_csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf'];
    }

    /** Guarda un mensaje flash para mostrarlo en la siguiente pagina. */
    public static function flash($type, $title, $message = '')
    {
        $_SESSION['_flash'][] = ['type' => $type, 'title' => $title, 'message' => $message];
    }

    /** Devuelve y limpia todos los mensajes flash. */
    public static function pullFlash()
    {
        $flash = $_SESSION['_flash'] ?? [];
        unset($_SESSION['_flash']);
        return $flash;
    }
}
