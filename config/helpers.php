<?php
/**
 * Funciones auxiliares usadas en toda la app.
 */

// Funciones que convierten filas de la base de datos al JSON del frontend.
require_once __DIR__ . '/../views/json/pedido.php';
require_once __DIR__ . '/../views/json/ingrediente.php';
require_once __DIR__ . '/../views/json/cliente.php';
require_once __DIR__ . '/../views/json/producto.php';
require_once __DIR__ . '/../views/json/personal.php';

/**
 * Ruta base de la app (ej. '/copiwaypro'), para que funcione igual en subcarpeta,
 * servidor embebido o raiz. 'ruta_base' en config/app.php la puede forzar.
 */
function rutaBase()
{
    global $config;
    $forzada = $config['ruta_base'];
    if ($forzada !== '') {
        return rtrim($forzada, '/');
    }

    $directorio = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $calculada = rtrim(preg_replace('#/public$#', '', $directorio), '/');

    if ($calculada === '' || $calculada === '.') {
        return '';
    }
    return $calculada;
}

/** Quita la ruta base del inicio de un path. */
function quitarRutaBase($path)
{
    $base = rutaBase();
    if ($base !== '' && strpos($path, $base) === 0) {
        $path = substr($path, strlen($base));
    }
    return $path === '' ? '/' : $path;
}

/** Si algo falla sin capturar: se guarda en el log y se responde un mensaje generico. */
function configurarManejadorErrores()
{
    set_exception_handler('manejarError');
}

/** Guarda el error en el log y responde (con el detalle solo si 'debug' esta activo). */
function manejarError($e)
{
    global $config;
    error_log($e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());

    if ($config['debug']) {
        responderError($e->getMessage(), 500, ['trace' => explode("\n", $e->getTraceAsString())]);
    }
    responderError('Ocurrio un error interno.', 500);
}

/** Cabeceras de seguridad y CORS de mismo origen. */
function configurarSeguridadHttp()
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    // Permite: el script inline del layout, estilos inline de React, Google Fonts,
    // imagenes de Unsplash, mapas de OpenStreetMap, rutas (OSRM), geocodificacion
    // (Nominatim) y el PDF del cierre de caja en un iframe blob:.
    header(
        "Content-Security-Policy: default-src 'self'; " .
        "script-src 'self' 'unsafe-inline'; " .
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
        "font-src 'self' https://fonts.gstatic.com; " .
        "img-src 'self' data: https://images.unsplash.com https://*.tile.openstreetmap.org; " .
        "connect-src 'self' https://router.project-osrm.org https://nominatim.openstreetmap.org; " .
        "frame-src 'self' blob:; object-src 'self' blob:"
    );

    $origen = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = explode(':', $_SERVER['HTTP_HOST'] ?? '')[0];
    if ($origen !== '' && parse_url($origen, PHP_URL_HOST) === $host) {
        header("Access-Control-Allow-Origin: $origen");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Datos que envio el navegador: el query string + el cuerpo
 * (JSON si el Content-Type es application/json, si no $_POST).
 */
function entrada()
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $cuerpo = [];
    if (!in_array($metodo, ['GET', 'HEAD'])) {
        if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
            $json = json_decode(file_get_contents('php://input') ?: '[]', true);
            $cuerpo = is_array($json) ? $json : [];
        } else {
            $cuerpo = $_POST;
        }
    }
    return array_merge($_GET, $cuerpo);
}

/**
 * true si el correo ya existe en cualquiera de las 4 tablas de cuentas.
 * $excluirId ignora la propia cuenta al editar.
 */
function correoUsadoEnCualquierTabla($correo, $excluirId = null)
{
    global $conn;
    $tablas = [
        'ADMINISTRADOR'   => 'id_admin',
        'AYUDANTE_COCINA' => 'id_ayudante',
        'DOMICILIARIO'    => 'id_domiciliario',
        'CLIENTE'         => 'id_cliente',
    ];
    foreach ($tablas as $tabla => $idCol) {
        if ($excluirId !== null) {
            $stmt = $conn->prepare("SELECT {$idCol} FROM {$tabla} WHERE correo = ? AND {$idCol} != ?");
            $stmt->bind_param("ss", $correo, $excluirId);
        } else {
            $stmt = $conn->prepare("SELECT {$idCol} FROM {$tabla} WHERE correo = ?");
            $stmt->bind_param("s", $correo);
        }
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($row) {
            return true;
        }
    }
    return false;
}

/**
 * Tipos para bind_param segun cada valor: "i" (entero), "d" (decimal) o "s" (texto).
 * Se usa en los UPDATE que se arman con los campos que lleguen.
 */
function tiposDe($valores)
{
    $tipos = "";
    foreach ($valores as $v) {
        if (is_int($v)) { $tipos .= "i"; }
        elseif (is_float($v)) { $tipos .= "d"; }
        else { $tipos .= "s"; }
    }
    return $tipos;
}

/** Redirige (con la ruta base) y termina. */
function redirect($ruta)
{
    header('Location: ' . rutaBase() . $ruta);
    exit;
}

/**
 * Verifica el token CSRF (cabecera X-CSRF-Token).
 * Si no coincide responde con error y termina.
 */
function verificarCsrf()
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (in_array($metodo, ['GET', 'HEAD', 'OPTIONS'])) {
        return true;
    }

    $enviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $esperado = $_SESSION['_csrf'] ?? '';

    if ($enviado === '' || $esperado === '' || !hash_equals($esperado, $enviado)) {
        responderError('Token CSRF invalido o ausente.', 419);
    }
    return true;
}

/** Responde en JSON y termina. */
function responderJson($datos, $codigo = 200)
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Responde un error en JSON (con errores de validacion opcionales) y termina. */
function responderError($mensaje, $codigo = 400, $detalles = [])
{
    $cuerpo = ['error' => $mensaje];
    if (!empty($detalles)) {
        $cuerpo['errors'] = $detalles;
    }
    responderJson($cuerpo, $codigo);
}

/** Muestra una vista de views/paginas; la vista recibe $datos. */
function mostrarVista($vista, $datos = [])
{
    // El HTML lleva la sesion y el token CSRF dentro, por eso nunca se cachea.
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');
    $ruta = __DIR__ . '/../views/paginas/' . $vista . '.php';
    if (!is_file($ruta)) {
        http_response_code(500);
        echo 'Vista no encontrada: ' . htmlspecialchars($vista);
        exit;
    }
    require $ruta;
}

/**
 * Exige una sesion activa y vigente (vuelve a leer la cuenta en la base de datos,
 * asi una cuenta desactivada pierde el acceso de inmediato). Devuelve el usuario.
 */
function requiereSesion($esApi = true)
{
    if (!Auth::check()) {
        if ($esApi) {
            responderError('No autenticado.', 401);
        }
        redirect('/login');
    }

    $usuario = Auth::usuarioActual();
    if ($usuario === null) {
        if ($esApi) {
            responderError('Sesion invalida o cuenta inactiva.', 401);
        }
        redirect('/login');
    }
    return $usuario;
}

/** Exige uno de los roles dados (y sesion vigente). Devuelve el usuario. */
function requiereRol($roles, $esApi = true)
{
    $usuario = requiereSesion($esApi);
    if (!in_array(Auth::rol(), $roles)) {
        if ($esApi) {
            responderError('No autorizado para este recurso.', 403);
        }
        redirect('/login');
    }
    return $usuario;
}

/**
 * Carga el archivo del controlador. La accion y los parametros de la ruta
 * quedan en $_GET (ej. $_GET['accion'], $_GET['id']).
 */
function cargarControlador($controlador, $accion, $parametros = [])
{
    $_GET['accion'] = $accion;
    foreach ($parametros as $nombre => $valor) {
        $_GET[$nombre] = $valor;
    }
    require __DIR__ . "/../controllers/{$controlador}.php";
}

/**
 * Busca en config/rutas.php la ruta que coincide con metodo + path,
 * revisa CSRF y rol, y carga el controlador con su accion.
 */
function despacharRuta($metodo, $ruta)
{
    $tabla = require __DIR__ . '/rutas.php';
    $coincidePath = false;

    foreach ($tabla as $clave => $destino) {
        list($metodoRuta, $patron) = explode(' ', $clave, 2);
        $regex = '#^' . preg_replace('#\{[a-zA-Z_]+\}#', '([^/]+)', $patron) . '$#';

        if (!preg_match($regex, $ruta, $valores)) {
            continue;
        }
        $coincidePath = true;

        if ($metodoRuta !== $metodo) {
            continue;
        }

        list($controlador, $accion, $roles) = $destino;
        // CSRF en todas las rutas /api/* (en GET/HEAD/OPTIONS no hace nada).
        verificarCsrf();
        if (!empty($roles)) {
            requiereRol($roles);
        }

        // Nombre de cada {parametro} => su valor ya decodificado (ej. "%23ORD-4" -> "#ORD-4").
        preg_match_all('#\{([a-zA-Z_]+)\}#', $patron, $nombres);
        $parametros = [];
        foreach ($nombres[1] as $i => $nombre) {
            $parametros[$nombre] = urldecode($valores[$i + 1]);
        }

        cargarControlador($controlador, $accion, $parametros);
        return;
    }

    if ($coincidePath) {
        responderError('Metodo no permitido.', 405);
    }
    responderError('Ruta no encontrada.', 404);
}

/**
 * Busca la pagina en config/paginas.php, exige el rol si hace falta
 * (sin sesion o con otro rol redirige a /login) y carga el controlador.
 */
function despacharPagina($ruta)
{
    $tabla = require __DIR__ . '/paginas.php';

    if (!isset($tabla[$ruta])) {
        http_response_code(404);
        echo 'Pagina no encontrada.';
        exit;
    }

    list($controlador, $accion, $roles) = $tabla[$ruta];
    if (!empty($roles)) {
        requiereRol($roles, false);
    }

    cargarControlador($controlador, $accion);
}
?>