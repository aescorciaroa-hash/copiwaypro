<?php
// En tu computador (Laragon, Windows) usa los datos de Laragon.
// En Hostinger (Linux) los datos estan en datos_bd.php, afuera de public_html,
// para que la clave no quede en GitHub (el repositorio es publico).
if (PHP_OS_FAMILY == "Windows") {
    $host = "127.0.0.1";
    $user = "root";
    $password = "";
    $bd = "hamburguer_copiway";
} else {
    require __DIR__ . "/../../datos_bd.php";
}
$port = 3306;

try {
    $conn = new mysqli($host, $user, $password, $bd, $port);
    $conn->set_charset("utf8mb4");
    $conn->query("SET time_zone = '-05:00'");
} catch (mysqli_sql_exception $e) {
    die("Error de Conexion: " . $e->getMessage());
}
?>