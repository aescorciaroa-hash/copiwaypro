<?php
/**
 * Controlador de Pedidos (listar, crear, cambios de estado y resena).
 * Los roles ya se validan en config/rutas.php.
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Pedido.php';
require_once __DIR__ . '/../Services/PedidoService.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$pedidoModel   = new Pedido();
$pedidoService = new PedidoService();
$datos         = entrada();

/**
 * Aplica un cambio de estado del PedidoService ($metodo) al pedido $id
 * y responde con el pedido actualizado.
 */
function cambiarEstado($id, $metodo, ...$argumentos)
{
    $pedidoModel   = new Pedido();
    $pedidoService = new PedidoService();

    $pedido = $pedidoModel->buscarCrudo($id);
    if (!$pedido) {
        responderError('Pedido no encontrado.', 404);
    }

    try {
        $pedidoService->$metodo($pedido['id_pedido'], ...$argumentos);
    } catch (Exception $e) {
        responderError($e->getMessage(), 409);
    }

    responderJson($pedidoModel->buscar($id, Auth::rol(), Auth::id()));
}

if ($action === 'index') {
    responderJson($pedidoModel->porRol(Auth::rol(), Auth::id()));
}
elseif ($action === 'show') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    $pedido = $pedidoModel->buscar($id, Auth::rol(), Auth::id());
    if (!$pedido) {
        responderError('Pedido no encontrado.', 404);
    }
    responderJson($pedido);
}
elseif ($action === 'store') {
    // Las reglas del negocio (horario, pago, inventario) estan en PedidoService::crear.
    $errores = [];
    if (empty($datos['items'])) $errores['items'] = ['El campo items es obligatorio.'];
    if (empty($datos['address'])) $errores['address'] = ['El campo address es obligatorio.'];
    if (empty($datos['paymentMethod']) || !in_array($datos['paymentMethod'], ['cash', 'online'])) $errores['paymentMethod'] = ['El campo paymentMethod no es válido.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    try {
        responderJson($pedidoService->crear(Auth::id(), $datos), 201);
    } catch (InvalidArgumentException $e) {
        responderError($e->getMessage(), 422);
    } catch (Exception $e) {
        $mensaje = $e->getMessage();
        if (stripos($mensaje, 'cerrada') !== false || stripos($mensaje, 'pausada') !== false) {
            responderError($mensaje, 403);
        } elseif (stripos($mensaje, 'rechazado') !== false) {
            responderError($mensaje, 402);
        } else {
            responderError($mensaje, 409);
        }
    }
}
elseif ($action === 'storeManual') {
    // Pedido por llamada o WhatsApp: se paga en efectivo al entregar.
    $errores = [];
    if (empty($datos['items'])) $errores['items'] = ['Agrega al menos un producto.'];
    if (trim((string) ($datos['clientName'] ?? '')) === '') $errores['clientName'] = ['El nombre del cliente es obligatorio.'];
    if (strlen(preg_replace('/\D/', '', (string) ($datos['clientPhone'] ?? ''))) < 7) $errores['clientPhone'] = ['El celular del cliente no es válido.'];
    if (trim((string) ($datos['address'] ?? '')) === '') $errores['address'] = ['La dirección es obligatoria.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    try {
        responderJson($pedidoService->crearManual(Auth::id(), $datos), 201);
    } catch (InvalidArgumentException $e) {
        responderError($e->getMessage(), 422);
    } catch (Exception $e) {
        $mensaje = $e->getMessage();
        $cerrada = stripos($mensaje, 'cerrada') !== false || stripos($mensaje, 'pausada') !== false;
        responderError($mensaje, $cerrada ? 403 : 409);
    }
}
elseif ($action === 'updateAddress') {
    // Admin: corrige la direccion de un pedido en curso.
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    $direccion = (string) ($datos['address'] ?? '');
    if (trim($direccion) === '') {
        responderError('Datos inválidos.', 422, ['address' => ['La dirección es obligatoria.']]);
    }
    cambiarEstado($id, 'cambiarDireccion', $direccion);
}
elseif ($action === 'updateDestination') {
    // Domiciliario: guarda las coordenadas del destino que ubico en su mapa.
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    if (!isset($datos['lat'], $datos['lng']) || !is_numeric($datos['lat']) || !is_numeric($datos['lng'])) {
        responderError('Datos inválidos.', 422, ['lat' => ['Las coordenadas deben ser numéricas.']]);
    }
    cambiarEstado($id, 'guardarDestino', Auth::id(), (float) $datos['lat'], (float) $datos['lng']);
}
elseif ($action === 'markPreparing') {
    // Cocina: Pendiente -> En Preparacion
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    $idAyudante = Auth::rol() === 'kitchen' ? Auth::id() : null;
    cambiarEstado($id, 'marcarPreparando', $idAyudante);
}
elseif ($action === 'markReady') {
    // Cocina: -> Listos
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    $idAyudante = Auth::rol() === 'kitchen' ? Auth::id() : null;
    cambiarEstado($id, 'marcarListo', $idAyudante);
}
elseif ($action === 'take') {
    // Domiciliario toma un pedido 'Listos' (queda asignado, sigue en Listos)
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    cambiarEstado($id, 'tomarPedido', Auth::id());
}
elseif ($action === 'release') {
    // Domiciliario suelta su pedido (o el admin lo reasigna)
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    cambiarEstado($id, 'liberarPedido', Auth::rol(), Auth::id());
}
elseif ($action === 'accept') {
    // Domiciliario: Listos -> En Camino
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    cambiarEstado($id, 'aceptarEntrega', Auth::id());
}
elseif ($action === 'deliver') {
    // Entrega solo con PIN valido -> Entregado
    $id  = $_GET['id'] ?? $_POST['id'] ?? '';
    $pin = (string) ($datos['pin'] ?? '');
    if ($pin === '') {
        responderError('El PIN es obligatorio.', 422);
    }
    cambiarEstado($id, 'confirmarEntrega', Auth::id(), $pin);
}
elseif ($action === 'review') {
    // El cliente califica un pedido ya entregado.
    $id         = $_GET['id'] ?? $_POST['id'] ?? '';
    $puntaje    = (int) ($datos['rating'] ?? 0);
    $comentario = (string) ($datos['reviewText'] ?? '');

    $pedido = $pedidoModel->buscarCrudo($id);
    if (!$pedido || $pedido['id_cliente'] !== Auth::id()) {
        responderError('Pedido no encontrado.', 404);
    }
    if ($pedido['estado'] !== 'entregado') {
        responderError('Solo puedes calificar un pedido ya entregado.', 409);
    }
    if ($puntaje < 1 || $puntaje > 5) {
        responderError('La calificación debe estar entre 1 y 5.', 422);
    }

    $pedidoService->calificar($pedido['id_pedido'], $puntaje, $comentario);
    responderJson($pedidoModel->buscar($id, 'client', Auth::id()));
}
else {
    responderError('Ruta no encontrada.', 404);
}
