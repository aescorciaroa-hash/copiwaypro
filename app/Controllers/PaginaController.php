<?php
/**
 * Controlador de Paginas: prepara los datos iniciales y monta la app de React.
 * El control de sesion/rol ya lo hizo despacharPagina().
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Configuracion.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$configModel = new Configuracion();

// $action => vista de app/Views/paginas
$vistas = [
    'landing'        => 'landing',
    'login'          => 'login',
    'register'       => 'registro',
    'forgotPassword' => 'recuperar',
    'admin'          => 'admin',
    'client'         => 'cliente',
    'kitchen'        => 'cocina',
    'delivery'       => 'domiciliario',
];

if (isset($vistas[$action])) {
    $datos = [
        'usuario'   => Auth::check() ? Auth::usuarioActual() : null,
        'rol'       => Auth::check() ? Auth::rol() : null,
        'csrfToken' => Session::csrf(),
        'settings'  => $configModel->obtener(),
    ];
    mostrarVista($vistas[$action], ['datos' => $datos]);
}
else {
    http_response_code(404);
    echo 'Pagina no encontrada.';
}
