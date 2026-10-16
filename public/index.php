<?php
/**
 * Punto de entrada unico de la app (API y paginas).
 */

// Librerias de Composer (web-push y PHPMailer). Si aun no se corrio
// "composer install", la app funciona igual pero sin push ni correos.
if (is_file(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
}

require_once __DIR__ . '/../config/database.php';
$config = require __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../app/Core/helpers.php';
require_once __DIR__ . '/../app/Core/Session.php';
require_once __DIR__ . '/../app/Core/Auth.php';

configurarManejadorErrores();
date_default_timezone_set($config['zona_horaria']);
configurarSeguridadHttp();
Session::start();

$ruta = quitarRutaBase(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$ruta = rtrim($ruta, '/') ?: '/';

if (strpos($ruta, '/api') === 0) {
    despacharRuta($_SERVER['REQUEST_METHOD'], $ruta);
} else {
    despacharPagina($ruta);
}
