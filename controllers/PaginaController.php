<?php
/**
 * Controlador de Paginas: prepara los datos iniciales y monta la app de React.
 * El control de sesion/rol ya lo hizo despacharPagina().
 */
require_once __DIR__ . '/../models/Configuracion.php';

class PaginaController
{
    private $configModel;

    public function __construct()
    {
        $this->configModel = new Configuracion();
    }

    public function landing()
    {
        $this->mostrar('landing');
    }

    public function login()
    {
        $this->mostrar('login');
    }

    public function register()
    {
        $this->mostrar('registro');
    }

    public function forgotPassword()
    {
        $this->mostrar('recuperar');
    }

    public function admin()
    {
        $this->mostrar('admin');
    }

    public function client()
    {
        $this->mostrar('cliente');
    }

    public function kitchen()
    {
        $this->mostrar('cocina');
    }

    public function delivery()
    {
        $this->mostrar('domiciliario');
    }

    /** Muestra la vista de views/paginas con los datos iniciales de la app. */
    private function mostrar($vista)
    {
        $datos = [
            'usuario'   => Auth::check() ? Auth::usuarioActual() : null,
            'rol'       => Auth::check() ? Auth::rol() : null,
            'csrfToken' => Session::csrf(),
            'settings'  => $this->configModel->obtener(),
        ];
        mostrarVista($vista, $datos);
    }
}

$controller = new PaginaController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'landing') {
    $controller->landing();
} elseif ($accion === 'login') {
    $controller->login();
} elseif ($accion === 'register') {
    $controller->register();
} elseif ($accion === 'forgotPassword') {
    $controller->forgotPassword();
} elseif ($accion === 'admin') {
    $controller->admin();
} elseif ($accion === 'client') {
    $controller->client();
} elseif ($accion === 'kitchen') {
    $controller->kitchen();
} elseif ($accion === 'delivery') {
    $controller->delivery();
} else {
    http_response_code(404);
    echo 'Pagina no encontrada.';
}
?>