<?php
/**
 * Controlador de Ingredientes (catalogo de extras para personalizar).
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../models/Ingrediente.php';

class IngredientController
{
    private $ingredienteModel;
    private $datos;

    public function __construct()
    {
        $this->ingredienteModel = new Ingrediente();
        $this->datos = entrada();
    }

    public function index()
    {
        responderJson($this->ingredienteModel->listarIngredientes());
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
        responderJson($this->ingredienteModel->comoIngrediente($this->ingredienteModel->buscar($id)), 201);
    }

    public function update()
    {
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        if (!$this->ingredienteModel->buscar($id)) {
            responderError('Ingrediente no encontrado.', 404);
        }
        $this->ingredienteModel->actualizar($id, $this->datos);
        responderJson($this->ingredienteModel->comoIngrediente($this->ingredienteModel->buscar($id)));
    }

    public function destroy()
    {
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        if (!$this->ingredienteModel->buscar($id)) {
            responderError('Ingrediente no encontrado.', 404);
        }
        $this->ingredienteModel->eliminar($id);
        responderJson(['ok' => true]);
    }
}

$controller = new IngredientController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'index') {
    $controller->index();
} elseif ($accion === 'store') {
    $controller->store();
} elseif ($accion === 'update') {
    $controller->update();
} elseif ($accion === 'destroy') {
    $controller->destroy();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>