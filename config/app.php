<?php
/**
 * Configuracion general de la app.
 * En tu computador (Windows) es 'local'; en Hostinger (Linux) es 'production'.
 */

$esLocal = (PHP_OS_FAMILY == "Windows");

return [
    'entorno' => $esLocal ? 'local' : 'production',
    'debug' => $esLocal,               // true muestra el detalle de los errores (solo en tu computador)
    'zona_horaria' => 'America/Bogota',
    'ruta_base' => '',                 // ej. '/copiwaypro'. Vacio = se detecta sola (recomendado)
];
?>