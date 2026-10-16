<?php
/**
 * Controlador de Pedidos (listar, crear, cambios de estado y resena).
 * Los roles ya se validan en config/rutas.php.
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../models/PedidoService.php';

class OrderController
{
    private $pedidoModel;
    private $pedidoService;
    private $datos;

    public function __construct()
    {
        $this->pedidoModel = new Pedido();
        $this->pedidoService = new PedidoService();
        $this->datos = entrada();
    }

    /** Busca el pedido por su codigo; si no existe responde 404. */
    private function buscarPedido($id)
    {
        $pedido = $this->pedidoModel->buscarCrudo($id);
        if (!$pedido) {
            responderError('Pedido no encontrado.', 404);
        }
        return $pedido;
    }

    /** Responde con el pedido ya actualizado, como lo ve el usuario actual. */
    private function responderPedido($id)
    {
        responderJson($this->pedidoModel->buscar($id, Auth::rol(), Auth::id()));
    }

    public function index()
    {
        responderJson($this->pedidoModel->porRol(Auth::rol(), Auth::id()));
    }

    public function show()
    {
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        $pedido = $this->pedidoModel->buscar($id, Auth::rol(), Auth::id());
        if (!$pedido) {
            responderError('Pedido no encontrado.', 404);
        }
        responderJson($pedido);
    }

    public function store()
    {
        // Las reglas del negocio (horario, pago, inventario) estan en PedidoService::crear.
        $errores = [];
        if (empty($this->datos['items'])) $errores['items'] = ['El campo items es obligatorio.'];
        if (empty($this->datos['address'])) $errores['address'] = ['El campo address es obligatorio.'];
        if (empty($this->datos['paymentMethod']) || !in_array($this->datos['paymentMethod'], ['cash', 'online'])) $errores['paymentMethod'] = ['El campo paymentMethod no es válido.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        try {
            responderJson($this->pedidoService->crear(Auth::id(), $this->datos), 201);
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

    public function storeManual()
    {
        // Pedido por llamada o WhatsApp: se paga en efectivo al entregar.
        $errores = [];
        if (empty($this->datos['items'])) $errores['items'] = ['Agrega al menos un producto.'];
        if (trim((string) ($this->datos['clientName'] ?? '')) === '') $errores['clientName'] = ['El nombre del cliente es obligatorio.'];
        if (strlen(preg_replace('/\D/', '', (string) ($this->datos['clientPhone'] ?? ''))) < 7) $errores['clientPhone'] = ['El celular del cliente no es válido.'];
        if (trim((string) ($this->datos['address'] ?? '')) === '') $errores['address'] = ['La dirección es obligatoria.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        try {
            responderJson($this->pedidoService->crearManual(Auth::id(), $this->datos), 201);
        } catch (InvalidArgumentException $e) {
            responderError($e->getMessage(), 422);
        } catch (Exception $e) {
            $mensaje = $e->getMessage();
            $cerrada = stripos($mensaje, 'cerrada') !== false || stripos($mensaje, 'pausada') !== false;
            responderError($mensaje, $cerrada ? 403 : 409);
        }
    }

    public function updateAddress()
    {
        // Admin: corrige la direccion de un pedido en curso.
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        $direccion = (string) ($this->datos['address'] ?? '');
        if (trim($direccion) === '') {
            responderError('Datos inválidos.', 422, ['address' => ['La dirección es obligatoria.']]);
        }
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->cambiarDireccion($pedido['id_pedido'], $direccion);
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function updateDestination()
    {
        // Domiciliario: guarda las coordenadas del destino que ubico en su mapa.
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        if (!isset($this->datos['lat'], $this->datos['lng']) || !is_numeric($this->datos['lat']) || !is_numeric($this->datos['lng'])) {
            responderError('Datos inválidos.', 422, ['lat' => ['Las coordenadas deben ser numéricas.']]);
        }
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->guardarDestino($pedido['id_pedido'], Auth::id(), (float) $this->datos['lat'], (float) $this->datos['lng']);
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function markPreparing()
    {
        // Cocina: Pendiente -> En Preparacion
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        $idAyudante = Auth::rol() === 'kitchen' ? Auth::id() : null;
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->marcarPreparando($pedido['id_pedido'], $idAyudante);
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function markReady()
    {
        // Cocina: -> Listos
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        $idAyudante = Auth::rol() === 'kitchen' ? Auth::id() : null;
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->marcarListo($pedido['id_pedido'], $idAyudante);
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function take()
    {
        // Domiciliario toma un pedido 'Listos' (queda asignado, sigue en Listos)
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->tomarPedido($pedido['id_pedido'], Auth::id());
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function release()
    {
        // Domiciliario suelta su pedido (o el admin lo reasigna)
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->liberarPedido($pedido['id_pedido'], Auth::rol(), Auth::id());
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function accept()
    {
        // Domiciliario: Listos -> En Camino
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->aceptarEntrega($pedido['id_pedido'], Auth::id());
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function deliver()
    {
        // Entrega solo con PIN valido -> Entregado
        $id  = $_GET['id'] ?? $_POST['id'] ?? '';
        $pin = (string) ($this->datos['pin'] ?? '');
        if ($pin === '') {
            responderError('El PIN es obligatorio.', 422);
        }
        $pedido = $this->buscarPedido($id);
        try {
            $this->pedidoService->confirmarEntrega($pedido['id_pedido'], Auth::id(), $pin);
        } catch (Exception $e) {
            responderError($e->getMessage(), 409);
        }
        $this->responderPedido($id);
    }

    public function review()
    {
        // El cliente califica un pedido ya entregado.
        $id         = $_GET['id'] ?? $_POST['id'] ?? '';
        $puntaje    = (int) ($this->datos['rating'] ?? 0);
        $comentario = (string) ($this->datos['reviewText'] ?? '');

        $pedido = $this->pedidoModel->buscarCrudo($id);
        if (!$pedido || $pedido['id_cliente'] !== Auth::id()) {
            responderError('Pedido no encontrado.', 404);
        }
        if ($pedido['estado'] !== 'entregado') {
            responderError('Solo puedes calificar un pedido ya entregado.', 409);
        }
        if ($puntaje < 1 || $puntaje > 5) {
            responderError('La calificación debe estar entre 1 y 5.', 422);
        }

        $this->pedidoService->calificar($pedido['id_pedido'], $puntaje, $comentario);
        responderJson($this->pedidoModel->buscar($id, 'client', Auth::id()));
    }
}

$controller = new OrderController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'index') {
    $controller->index();
} elseif ($accion === 'show') {
    $controller->show();
} elseif ($accion === 'store') {
    $controller->store();
} elseif ($accion === 'storeManual') {
    $controller->storeManual();
} elseif ($accion === 'updateAddress') {
    $controller->updateAddress();
} elseif ($accion === 'updateDestination') {
    $controller->updateDestination();
} elseif ($accion === 'markPreparing') {
    $controller->markPreparing();
} elseif ($accion === 'markReady') {
    $controller->markReady();
} elseif ($accion === 'take') {
    $controller->take();
} elseif ($accion === 'release') {
    $controller->release();
} elseif ($accion === 'accept') {
    $controller->accept();
} elseif ($accion === 'deliver') {
    $controller->deliver();
} elseif ($accion === 'review') {
    $controller->review();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>