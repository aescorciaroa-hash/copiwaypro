<?php
$host = "localhost";
$user = "root";
$password = "";
$bd = "hamburguer_copiway";
$port = 3306;

try {
    $conx = new mysqli($host, $user, $password, $bd, $port);
    $conx->set_charset("utf8mb4");
    $conx->query("SET time_zone = '-05:00'");
} catch (mysqli_sql_exception $e) {
    die("Error de Conexion: " . $e->getMessage());
}
?>