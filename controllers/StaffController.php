<?php
/**
 * Controlador de Personal (ayudantes de cocina y domiciliarios).
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../models/Personal.php';

class StaffController
{
    private $personalModel;
    private $datos;
    private $vehiculos;

    public function __construct()
    {
        $this->personalModel = new Personal();
        $this->datos = entrada();
        $this->vehiculos = ['moto', 'bicicleta', 'carro', 'a_pie'];
    }

    /** Busca en la lista del personal al miembro con ese id. */
    private function buscarEnPersonal($personalModel, $id)
    {
        foreach ($personalModel->listar() as $miembro) {
            if ($miembro['id'] === (string) $id) {
                return $miembro;
            }
        }
        return ['id' => (string) $id];
    }

    public function index()
    {
        responderJson($this->personalModel->listar());
    }

    public function store()
    {
        $errores = [];
        if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
        if (empty($this->datos['email']) || !filter_var($this->datos['email'], FILTER_VALIDATE_EMAIL)) $errores['email'] = ['El campo email debe ser un correo válido.'];
        if (empty($this->datos['password']) || strlen((string) $this->datos['password']) < 8) $errores['password'] = ['El campo password debe tener al menos 8 caracteres.'];
        if (empty($this->datos['role']) || !in_array($this->datos['role'], ['Ayudante de cocina', 'Domiciliario'])) $errores['role'] = ['El campo role no es válido.'];
        if (($this->datos['role'] ?? null) === 'Domiciliario' && !empty($this->datos['vehicle']) && !in_array($this->datos['vehicle'], $this->vehiculos)) $errores['vehicle'] = ['El campo vehicle no es válido.'];
        if (empty($this->datos['pin']) || !preg_match('/^\d{4}$/', (string) $this->datos['pin'])) $errores['pin'] = ['El PIN debe tener exactamente 4 dígitos.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        if (correoUsadoEnCualquierTabla($this->datos['email'])) {
            responderError('Ya existe una cuenta con ese correo.', 409);
        }

        try {
            $id = $this->personalModel->crear($this->datos, Auth::id());
        } catch (Exception $e) {
            responderError($e->getMessage(), 422);
        }
        responderJson($this->buscarEnPersonal($this->personalModel, $id), 201);
    }

    public function update()
    {
        $id = $_GET['id'] ?? $_POST['id'] ?? '';

        if (!empty($this->datos['password']) && strlen((string) $this->datos['password']) < 8) {
            responderError('Datos inválidos.', 422, ['password' => ['El campo password debe tener al menos 8 caracteres.']]);
        }
        if (!empty($this->datos['email']) && correoUsadoEnCualquierTabla($this->datos['email'], $id)) {
            responderError('Ya existe una cuenta con ese correo.', 409);
        }
        if (!empty($this->datos['vehicle']) && !in_array($this->datos['vehicle'], $this->vehiculos)) {
            responderError('Datos inválidos.', 422, ['vehicle' => ['El campo vehicle no es válido.']]);
        }
        if (!empty($this->datos['pin']) && !preg_match('/^\d{4}$/', (string) $this->datos['pin'])) {
            responderError('Datos inválidos.', 422, ['pin' => ['El PIN debe tener exactamente 4 dígitos.']]);
        }

        if ($this->personalModel->actualizar($id, $this->datos) === null) {
            responderError('Miembro de staff no encontrado.', 404);
        }
        responderJson($this->buscarEnPersonal($this->personalModel, $id));
    }

    public function destroy()
    {
        // Borrado permanente, solo si no tiene historial (si lo tiene, se da de baja con PUT active=false).
        // 'role' es obligatorio: el mismo id puede existir en cocina y en domicilio.
        $id  = $_GET['id'] ?? $_POST['id'] ?? '';
        $rol = $_GET['role'] ?? null;
        try {
            if (!$this->personalModel->eliminarPermanente($id, $rol)) {
                responderError('Miembro de staff no encontrado.', 404);
            }
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 422);
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        responderJson(['ok' => true]);
    }

    public function updateLocation()
    {
        $id = $_GET['id'] ?? $_POST['id'] ?? '';

        // El domiciliario solo puede actualizar su propia ubicacion.
        if (!Auth::check() || Auth::rol() !== 'delivery' || (string) Auth::id() !== (string) $id) {
            responderError('No autorizado para este recurso.', 403);
        }

        $errores = [];
        if (!isset($this->datos['lat']) || !is_numeric($this->datos['lat'])) $errores['lat'] = ['El campo lat debe ser numérico.'];
        if (!isset($this->datos['lng']) || !is_numeric($this->datos['lng'])) $errores['lng'] = ['El campo lng debe ser numérico.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        if (!$this->personalModel->actualizarUbicacion($id, (float) $this->datos['lat'], (float) $this->datos['lng'])) {
            responderError('Domiciliario no encontrado.', 404);
        }
        responderJson(['ok' => true]);
    }
}

$controller = new StaffController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'index') {
    $controller->index();
} elseif ($accion === 'store') {
    $controller->store();
} elseif ($accion === 'update') {
    $controller->update();
} elseif ($accion === 'destroy') {
    $controller->destroy();
} elseif ($accion === 'updateLocation') {
    $controller->updateLocation();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>