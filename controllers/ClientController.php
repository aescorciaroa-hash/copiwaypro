<?php
/**
 * Controlador de Clientes (perfil, contrasena y notificaciones).
 */
require_once __DIR__ . '/../models/Cliente.php';

class ClientController
{
    private $clienteModel;
    private $datos;

    public function __construct()
    {
        $this->clienteModel = new Cliente();
        $this->datos = entrada();
    }

    /** Solo el propio cliente o un admin pueden ver/editar este cliente. */
    private function autorizarPropioOAdmin($id)
    {
        if (!Auth::check()) {
            responderError('No autenticado.', 401);
        }
        $esPropio = Auth::rol() === 'client' && (string) Auth::id() === (string) $id;
        $esAdmin  = Auth::rol() === 'admin';
        if (!$esPropio && !$esAdmin) {
            responderError('No autorizado para este recurso.', 403);
        }
    }

    public function update()
    {
        $id = $_GET['id'];
        $this->autorizarPropioOAdmin($id);
        if (!$this->clienteModel->buscar($id)) {
            responderError('Cliente no encontrado.', 404);
        }

        // El cliente solo puede cambiar estos campos; puntos y total gastado son solo del admin.
        if (Auth::rol() !== 'admin') {
            $permitidos = ['name', 'email', 'phone', 'address', 'birthday', 'cart', 'preferences'];
            $soloPermitidos = [];
            foreach ($permitidos as $campo) {
                if (array_key_exists($campo, $this->datos)) {
                    $soloPermitidos[$campo] = $this->datos[$campo];
                }
            }
            $this->datos = $soloPermitidos;
        }

        if (!empty($this->datos['email']) && correoUsadoEnCualquierTabla($this->datos['email'], $id)) {
            responderError('Ya existe una cuenta con ese correo.', 409);
        }

        $this->clienteModel->actualizar($id, $this->datos);
        responderJson($this->clienteModel->buscar($id));
    }

    public function changePassword()
    {
        $id = $_GET['id'];

        // Solo el propio cliente (el admin no conoce la contrasena actual).
        if (!Auth::check() || Auth::rol() !== 'client' || (string) Auth::id() !== (string) $id) {
            responderError('No autorizado para este recurso.', 403);
        }

        $errores = [];
        if (empty($this->datos['currentPassword'])) $errores['currentPassword'] = ['La contraseña actual es obligatoria.'];
        if (empty($this->datos['newPassword']) || strlen((string) $this->datos['newPassword']) < 8) $errores['newPassword'] = ['La nueva contraseña debe tener al menos 8 caracteres.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        $fila = $this->clienteModel->buscarCrudo($id);
        if (!$fila) {
            responderError('Cliente no encontrado.', 404);
        }
        if (!password_verify((string) $this->datos['currentPassword'], $fila['contrasena'])) {
            responderError('La contraseña actual no es correcta.', 422, ['currentPassword' => ['La contraseña actual no es correcta.']]);
        }

        $this->clienteModel->actualizarContrasena($id, password_hash((string) $this->datos['newPassword'], PASSWORD_DEFAULT));
        responderJson(['ok' => true]);
    }
}

$controller = new ClientController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'update') {
    $controller->update();
} elseif ($accion === 'changePassword') {
    $controller->changePassword();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>