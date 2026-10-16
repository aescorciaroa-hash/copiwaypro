<?php
/**
 * Controlador del Dashboard del administrador.
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Models/Panel.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$panelModel = new Panel();

if ($action === 'summary') {
    responderJson($panelModel->resumenDeHoy());
}
else {
    responderError('Ruta no encontrada.', 404);
}
