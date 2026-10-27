<?php
/**
 * Cabecera HTML. $datos y $pagina vienen de la vista que incluye este archivo.
 * ?v=filemtime() hace que el navegador descargue el CSS nuevo cuando cambia.
 */

$rutaAssets = dirname(__DIR__, 2) . '/public/assets';
$verCss = filemtime($rutaAssets . '/main.css');

$datosJson = json_encode($datos, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$baseJson = json_encode(rutaBase());

header('Content-Type: text/html; charset=utf-8');
?><!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CopiwayPRO</title>
    <link rel="icon" href="<?= rutaBase() ?>/favicon.ico?v=3" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= rutaBase() ?>/favicon-32.png?v=3">
    <link rel="icon" type="image/svg+xml" href="<?= rutaBase() ?>/favicon.svg?v=3">
    <link rel="apple-touch-icon" href="<?= rutaBase() ?>/apple-touch-icon.png?v=3">
    <link rel="manifest" href="<?= rutaBase() ?>/manifest.json">
    <meta name="theme-color" content="#f97316">
    <!-- Abre la conexion con Google Fonts y Unsplash desde el principio (ahorra tiempo al pedir la letra y las fotos) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://images.unsplash.com">
    <!-- Letra Inter: se pide en paralelo con el CSS (antes estaba dentro del CSS y esperaba a que este bajara) -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="<?= rutaBase() ?>/assets/main.css?v=<?= $verCss ?>">
    <!-- El codigo de la app empieza a bajar de una vez, mientras se lee el resto de la pagina (misma direccion que pie.php, sin ?v=) -->
    <link rel="modulepreload" href="<?= rutaBase() ?>/assets/main.js">
    <script>window.__APP_BASE__=<?= $baseJson ?>;window.__DATOS__=<?= $datosJson ?>;</script>
</head>
<body>
    <div id="app" data-pagina="<?= htmlspecialchars($pagina, ENT_QUOTES) ?>">
