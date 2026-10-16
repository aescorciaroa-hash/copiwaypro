<?php
/**
 * Controlador de Cierre de Caja.
 */
require_once __DIR__ . '/../models/CajaService.php';

class CashClosingController
{
    private $cajaService;

    public function __construct()
    {
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
}

$controller = new CashClosingController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'preview') {
    $controller->preview();
} elseif ($accion === 'store') {
    $controller->store();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>