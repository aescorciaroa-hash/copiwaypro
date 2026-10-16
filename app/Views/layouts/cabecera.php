<?php
/**
 * Cabecera HTML. $datos y $pagina vienen de la vista que incluye este archivo.
 * ?v=filemtime() hace que el navegador descargue el CSS nuevo cuando cambia.
 */

$rutaAssets = dirname(__DIR__, 3) . '/public/assets';
$verCss = @filemtime($rutaAssets . '/main.css') ?: time();

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
    <link rel="stylesheet" href="<?= rutaBase() ?>/assets/main.css?v=<?= $verCss ?>">
    <script>window.__APP_BASE__=<?= $baseJson ?>;window.__DATOS__=<?= $datosJson ?>;</script>
</head>
<body>
    <div id="app" data-pagina="<?= htmlspecialchars($pagina, ENT_QUOTES) ?>">
