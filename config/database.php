<?php
/**
 * Lee el archivo .env y abre la conexion a MySQL ($conn).
 * Los modelos usan esta misma conexion (con global $conn en su constructor).
 */

/** Lee un .env simple: CLAVE=VALOR por linea (admite # comentarios y lineas vacias). */
function leerEnv($ruta)
{
    $valores = [];
    if (!is_file($ruta)) {
        return $valores;
    }

    foreach (file($ruta, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
        $linea = trim($linea);
        if ($linea === '' || $linea[0] === '#' || strpos($linea, '=') === false) {
            continue;
        }
        list($clave, $valor) = explode('=', $linea, 2);
        $clave = trim($clave);
        $valor = trim($valor);
        // Quita las comillas que envuelven el valor, si las tiene.
        if (strlen($valor) >= 2 && ($valor[0] === '"' || $valor[0] === "'") && $valor[strlen($valor) - 1] === $valor[0]) {
            $valor = substr($valor, 1, -1);
        }
        $valores[$clave] = $valor;
    }
    return $valores;
}

$raizProyecto = dirname(__DIR__);
$env = array_merge(leerEnv($raizProyecto . '/.env.example'), leerEnv($raizProyecto . '/.env'));

foreach ($env as $clave => $valor) {
    if (getenv($clave) === false) {
        putenv($clave . '=' . $valor);
    }
    if (!isset($_ENV[$clave])) {
        $_ENV[$clave] = $valor;
    }
}

/** Valor de una variable del .env ('true'/'false' se convierten a booleano). */
function env($clave, $porDefecto = null)
{
    $valor = $_ENV[$clave] ?? getenv($clave);
    if ($valor === false || $valor === null || $valor === '') {
        return $porDefecto;
    }
    if ($valor === 'true') return true;
    if ($valor === 'false') return false;
    return $valor;
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli(
        env('DB_HOST', '127.0.0.1'),
        env('DB_USER', 'root'),
        env('DB_PASS', ''),
        env('DB_NAME', 'hamburguer_copiway'),
        (int) env('DB_PORT', 3306)
    );
    $conn->set_charset('utf8mb4');
    $conn->query("SET time_zone = '-05:00'");
} catch (mysqli_sql_exception $e) {
    // Nunca se muestran los datos tecnicos de la conexion al usuario.
    error_log('Error de conexion a la base de datos: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Ocurrio un error interno. Intenta de nuevo mas tarde.']);
    exit;
}
