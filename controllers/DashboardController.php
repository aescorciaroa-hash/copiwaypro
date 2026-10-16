<?php
/**
 * Controlador del Dashboard del administrador.
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Panel.php';

class DashboardController
{
    private $panelModel;

    public function __construct()
    {
        $this->panelModel = new Panel();
    }

    public function summary()
    {
        responderJson($this->panelModel->resumenDeHoy());
    }
}

$controller = new DashboardController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'summary') {
    $controller->summary();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>