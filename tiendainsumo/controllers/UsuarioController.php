<?php
session_start();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../models/Rol.php';

class UsuarioController
{
    private $usuarioModel;

    public function __construct()
    {
        $this->usuarioModel = new Usuario();
    }

    public function update()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: ../views/admin/gusuarios.php');
            exit;
        }

        $id_usuario = $_POST['id'] ?? null;
        if (!$id_usuario) {
            $this->setAlert('error', 'Error', 'ID de usuario no proporcionado');
            header('Location: ../views/admin/gusuarios.php');
            exit;
        }

        $datos = [
            'usuario' => trim($_POST['name'] ?? ''),
            'email' => trim($_POST['email'] ?? ''),
            'id_rol' => trim($_POST['rol'] ?? ''),
            'estado' => $_POST['estado'] ?? ''
        ];

        if (!empty($_POST['password'])) {
            $datos['password_hash'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
        }

        $resultado = $this->usuarioModel->actualizar($id_usuario, $datos);

        if ($resultado === true) {
            $this->setAlert('success', 'Éxito', 'Usuario actualizado correctamente');
        } else {
            $this->setAlert('error', 'Error', $resultado);
        }

        header('Location: ../views/admin/gusuarios.php');
        exit;
    }

    public function delete()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: ../views/admin/gusuarios.php');
            exit;
        }

        $id_usuario = $_POST['id'] ?? null;
        if (!$id_usuario) {
            $this->setAlert('error', 'Error', 'ID de usuario no proporcionado');
            header('Location: ../views/admin/gusuarios.php');
            exit;
        }

        $resultado = $this->usuarioModel->eliminar($id_usuario);

        if ($resultado === true) {
            $this->setAlert('success', 'Éxito', 'Usuario eliminado correctamente');
        } else {
            $this->setAlert('error', 'Error', $resultado);
        }

        header('Location: ../views/admin/gusuarios.php');
        exit;
    }

    private function setAlert($icon, $title, $text)
    {
        $_SESSION['alert'] = [
            'icon' => $icon,
            'title' => $title,
            'text' => $text
        ];
    }
}

if (isset($_GET['accion'])) {
    $controller = new UsuarioController();
    if ($_GET['accion'] === 'update') {
        $controller->update();
    } elseif ($_GET['accion'] === 'delete') {
        $controller->delete();
    }
}
?>