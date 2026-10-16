<?php
/**
 * Controlador de Inventario (insumos, ajustes de stock y movimientos).
 */
require_once __DIR__ . '/../models/Ingrediente.php';

class InventoryController
{
    private $ingredienteModel;
    private $datos;

    public function __construct()
    {
        $this->ingredienteModel = new Ingrediente();
        $this->datos = entrada();
    }

    public function store()
    {
        $errores = [];
        if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
        if (empty($this->datos['category'])) $errores['category'] = ['El campo category es obligatorio.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        $id = $this->ingredienteModel->crearConStockInicial($this->datos, Auth::id());
        responderJson($this->ingredienteModel->comoInventario($this->ingredienteModel->buscar($id)), 201);
    }

    public function update()
    {
        $id = $_GET['id'];
        if (!$this->ingredienteModel->buscar($id)) {
            responderError('Insumo no encontrado.', 404);
        }
        $this->ingredienteModel->actualizar($id, $this->datos);
        responderJson($this->ingredienteModel->comoInventario($this->ingredienteModel->buscar($id)));
    }

    public function destroy()
    {
        $id = $_GET['id'];
        if (!$this->ingredienteModel->buscar($id)) {
            responderError('Insumo no encontrado.', 404);
        }
        $this->ingredienteModel->eliminar($id);
        responderJson(['ok' => true]);
    }

    public function adjustStock()
    {
        $id = $_GET['id'];
        if (!$this->ingredienteModel->buscar($id)) {
            responderError('Insumo no encontrado.', 404);
        }
        if (!isset($this->datos['amount']) || !is_numeric($this->datos['amount'])) {
            responderError('Datos inválidos.', 422, ['amount' => ['El campo amount debe ser numérico.']]);
        }

        try {
            $this->ingredienteModel->ajustarStock($id, (float) $this->datos['amount'], Auth::id());
        } catch (Exception $e) {
            responderError($e->getMessage(), 422);
        }
        responderJson($this->ingredienteModel->comoInventario($this->ingredienteModel->buscar($id)));
    }
}

$controller = new InventoryController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'store') {
    $controller->store();
} elseif ($accion === 'update') {
    $controller->update();
} elseif ($accion === 'destroy') {
    $controller->destroy();
} elseif ($accion === 'adjustStock') {
    $controller->adjustStock();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>