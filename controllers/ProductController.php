<?php
/**
 * Controlador de Productos (menu).
 */
require_once __DIR__ . '/../models/Producto.php';

class ProductController
{
    private $productoModel;
    private $datos;

    public function __construct()
    {
        $this->productoModel = new Producto();
        $this->datos = entrada();
    }

    public function store()
    {
        $errores = [];
        if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
        if (!isset($this->datos['price']) || !is_numeric($this->datos['price'])) $errores['price'] = ['El campo price debe ser numérico.'];
        if (empty($this->datos['category'])) $errores['category'] = ['El campo category es obligatorio.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        try {
            $id = $this->productoModel->crear($this->datos);
        } catch (Exception $e) {
            responderError($e->getMessage(), 422);
        }
        responderJson($this->productoModel->buscar($id, true), 201);
    }

    public function update()
    {
        $id = $_GET['id'];
        if (!$this->productoModel->buscar($id)) {
            responderError('Producto no encontrado.', 404);
        }
        if (array_key_exists('price', $this->datos) && !is_numeric($this->datos['price'])) {
            responderError('Datos inválidos.', 422, ['price' => ['El campo price debe ser numérico.']]);
        }

        try {
            $this->productoModel->actualizar($id, $this->datos);
        } catch (Exception $e) {
            responderError($e->getMessage(), 422);
        }
        responderJson($this->productoModel->buscar($id, true));
    }

    public function destroy()
    {
        $id = $_GET['id'];
        if (!$this->productoModel->buscar($id)) {
            responderError('Producto no encontrado.', 404);
        }
        $this->productoModel->eliminar($id);
        responderJson(['ok' => true]);
    }
}

$controller = new ProductController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'store') {
    $controller->store();
} elseif ($accion === 'update') {
    $controller->update();
} elseif ($accion === 'destroy') {
    $controller->destroy();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>