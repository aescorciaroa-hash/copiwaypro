<?php
/**
 * Controlador de Cierre de Caja.
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../models/Caja.php';
require_once __DIR__ . '/../models/CajaService.php';

class CashClosingController
{
    private $cajaModel;
    private $cajaService;

    public function __construct()
    {
        $this->cajaModel = new Caja();
        $this->cajaService = new CajaService();
    }

    public function preview()
    {
        // Vista previa: mismo calculo que 'store' pero sin guardar nada.
        try {
            responderJson($this->cajaService->previsualizar(Auth::id()));
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
    }

    public function store()
    {
        try {
            responderJson($this->cajaService->generar(Auth::id()), 201);
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
    }

    public function index()
    {
        responderJson($this->cajaModel->historialDeAdmin(Auth::id()));
    }

    public function show()
    {
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        try {
            responderJson($this->cajaModel->reporte($id));
        } catch (Exception $e) {
            responderError('Cierre no encontrado.', 404);
        }
    }
}

$controller = new CashClosingController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'preview') {
    $controller->preview();
} elseif ($accion === 'store') {
    $controller->store();
} elseif ($accion === 'index') {
    $controller->index();
} elseif ($accion === 'show') {
    $controller->show();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>