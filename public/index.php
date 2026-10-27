<?php
/**
 * Punto de entrada unico de la app (API y paginas).
 */

require_once __DIR__ . '/../config/database.php';
$config = require __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Auth.php';

// Comprime lo que responde PHP (paginas y datos de la API) si el navegador lo acepta:
// los listados de pedidos y productos viajan mucho mas livianos.
if (extension_loaded('zlib') && !ini_get('zlib.output_compression')) {
    ob_start('ob_gzhandler');
}

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
