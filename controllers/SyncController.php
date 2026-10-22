<?php
/**
 * Controlador de Sincronizacion: el frontend pregunta cada pocos segundos
 * con If-None-Match; si nada cambio se responde 304 sin datos.
 * Lo que se envia depende del rol.
 */
require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../models/Configuracion.php';
require_once __DIR__ . '/../models/Personal.php';
require_once __DIR__ . '/../models/Pedido.php';
require_once __DIR__ . '/../models/Cliente.php';
require_once __DIR__ . '/../models/PedidoService.php';

class SyncController
{
    public function index()
    {
        $rol       = Auth::check() ? Auth::rol() : 'guest';
        $idUsuario = Auth::check() ? Auth::id() : null;

        // Solo se lee la sesion: se libera ya para no bloquear las demas peticiones del usuario.
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }

        // Cancela los pedidos con link de pago vencido (devuelve su inventario).
        if ($rol !== 'guest') {
            $pedidoService = new PedidoService();
            $pedidoService->cancelarLinksVencidos();
        }

        $productoModel    = new Producto();
        $configModel      = new Configuracion();
        $ingredienteModel = new Ingrediente();
        $personalModel    = new Personal();
        $pedidoModel      = new Pedido();
        $clienteModel     = new Cliente();

        $payload = [
            'products' => $productoModel->listar($rol !== 'admin', $rol === 'admin'),
            'settings' => $configModel->obtener(),
        ];

        if (in_array($rol, ['admin', 'kitchen'])) {
            $payload['inventory']     = $ingredienteModel->listarInventario();
            $payload['ingredients']   = $ingredienteModel->listarIngredientes();
            $payload['inventoryLogs'] = $ingredienteModel->registrosDeMovimientos();
            $payload['staff']         = $personalModel->listar();
            $payload['orders']        = $pedidoModel->porRol($rol, $idUsuario);
        }

        if ($rol === 'admin') {
            $payload['clients'] = $clienteModel->listar();
        }

        if ($rol === 'delivery') {
            $payload['orders'] = $pedidoModel->porRol($rol, $idUsuario);
        }

        if ($rol === 'client') {
            $payload['orders']      = $pedidoModel->porRol($rol, $idUsuario);
            $payload['ingredients'] = $ingredienteModel->listarIngredientes();
            // El cliente necesita sus propios datos para "Mi Perfil".
            $cliente = $clienteModel->buscar($idUsuario);
            if ($cliente) {
                $payload['clients'] = [$cliente];
            }
        }

        $etag = '"' . md5(json_encode($payload)) . '"';
        header("ETag: $etag");

        if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? null) === $etag) {
            http_response_code(304);
            exit;
        }
        responderJson($payload, 200);
    }
}

$controller = new SyncController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'index') {
    $controller->index();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>