<?php
/**
 * Router para el servidor de PHP (php -S localhost:8000 -t public public/server-router.php).
 * Los archivos que existen se sirven tal cual; todo lo demas va a index.php.
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Archivo estatico real dentro de public/ (assets compilados por Vite, etc.)
$file = __DIR__ . $uri;
if ($uri !== '/' && is_file($file)) {
    return false; // deja que el servidor embebido lo sirva directamente
}

require __DIR__ . '/index.php';
return true;
