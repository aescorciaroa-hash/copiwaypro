<?php
/**
 * Configuracion general de la app (necesita database.php cargado antes para usar env()).
 */

return [
    'nombre' => 'CopiwayPRO',
    'entorno' => env('APP_ENV', 'production'),
    'debug' => env('APP_DEBUG', false),
    'zona_horaria' => env('APP_TIMEZONE', 'America/Bogota'),
    'ruta_base' => env('APP_BASE_PATH', ''),
];
