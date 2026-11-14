<?php
$host = "127.0.0.1";
$user = "root";
$password = "";
$bd = "hamburguer_copiway";
$port = 3306;

try {
    $conn = new mysqli($host, $user, $password, $bd, $port);
    $conn->set_charset("utf8mb4");
    $conn->query("SET time_zone = '-05:00'");
} catch (mysqli_sql_exception $e) {
    die("Error de Conexion: " . $e->getMessage());
}
?>