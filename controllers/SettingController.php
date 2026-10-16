<?php
/**
 * Controlador de Ajustes de la tienda (horario, tarifas y categorias del menu).
 */
require_once __DIR__ . '/../models/Configuracion.php';

class SettingController
{
    private $configModel;
    private $datos;

    public function __construct()
    {
        $this->configModel = new Configuracion();
        $this->datos = entrada();
    }

    public function update()
    {
        $errores = [];
        if (array_key_exists('pointValue', $this->datos) && (!is_numeric($this->datos['pointValue']) || $this->datos['pointValue'] < 0)) {
            $errores['pointValue'] = ['El valor del punto debe ser un número mayor o igual a 0.'];
        }
        if (array_key_exists('minPointsToRedeem', $this->datos) && (filter_var($this->datos['minPointsToRedeem'], FILTER_VALIDATE_INT) === false || $this->datos['minPointsToRedeem'] < 0)) {
            $errores['minPointsToRedeem'] = ['El mínimo de puntos debe ser un número entero mayor o igual a 0.'];
        }
        if (isset($this->datos['business']['name']) && trim((string) $this->datos['business']['name']) === '') {
            $errores['business.name'] = ['El nombre del negocio es obligatorio.'];
        }
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        $this->configModel->actualizar($this->datos);
        responderJson($this->configModel->obtener());
    }

    public function addCategory()
    {
        $categoria = trim((string) ($this->datos['category'] ?? ''));
        if ($categoria === '') {
            responderError('Datos inválidos.', 422, ['category' => ['El campo category es obligatorio.']]);
        }
        $this->configModel->agregarCategoria($categoria);
        responderJson($this->configModel->obtener());
    }

    public function removeCategory()
    {
        $categoria = $_GET['category'];
        try {
            $this->configModel->eliminarCategoria(urldecode($categoria));
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        responderJson($this->configModel->obtener());
    }
}

$controller = new SettingController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'update') {
    $controller->update();
} elseif ($accion === 'addCategory') {
    $controller->addCategory();
} elseif ($accion === 'removeCategory') {
    $controller->removeCategory();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>