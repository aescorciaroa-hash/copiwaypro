<?php
/**
 * Controlador de Autenticacion (login, registro, sesion y recuperar contrasena).
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../models/Cliente.php';
require_once __DIR__ . '/../models/CodigoVerificacion.php';
require_once __DIR__ . '/../models/IntentoLogin.php';
require_once __DIR__ . '/../models/CorreoService.php';

class AuthController
{
    private $clienteModel;
    private $codigoModel;
    private $intentoModel;
    private $datos;

    public function __construct()
    {
        $this->clienteModel = new Cliente();
        $this->codigoModel = new CodigoVerificacion();
        $this->intentoModel = new IntentoLogin();
        $this->datos = entrada();
    }

    public function register()
    {
        $nombre    = $this->datos['name'] ?? '';
        $telefono  = trim((string) ($this->datos['phone'] ?? ''));
        $email     = trim((string) ($this->datos['email'] ?? ''));
        $birthday  = $this->datos['birthday'] ?? '';
        $password  = (string) ($this->datos['password'] ?? '');
        $confirmar = (string) ($this->datos['confirmPassword'] ?? '');

        $errores = [];
        if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
        if (empty($this->datos['phone']) || strlen((string) $this->datos['phone']) < 10) $errores['phone'] = ['El campo phone debe tener al menos 10 caracteres.'];
        if (empty($this->datos['email']) || !filter_var($this->datos['email'], FILTER_VALIDATE_EMAIL)) $errores['email'] = ['El campo email debe ser un correo válido.'];
        if (empty($this->datos['birthday'])) $errores['birthday'] = ['El campo birthday es obligatorio.'];
        if (empty($this->datos['password']) || strlen($password) < 8) $errores['password'] = ['El campo password debe tener al menos 8 caracteres.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }
        if (empty($this->datos['terms'])) {
            responderError('Debes aceptar los términos y la política de tratamiento de datos (Habeas Data).', 422);
        }
        if ($password !== $confirmar) {
            responderError('Las contraseñas no coinciden.', 422);
        }
        if ($this->clienteModel->correoOTelefonoExiste($email, $telefono) || correoUsadoEnCualquierTabla($email)) {
            responderError('Ya existe una cuenta con ese correo o teléfono.', 409);
        }

        $idCliente = $this->clienteModel->crear([
            'name'     => $nombre,
            'phone'    => $telefono,
            'email'    => $email,
            'birthday' => $birthday,
            'password' => $password,
            'ip'       => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        ]);

        $usuario = Auth::login('client', $this->clienteModel->buscarCrudo($idCliente));
        responderJson(['user' => $usuario, 'csrfToken' => Session::csrf()], 201);
    }

    public function forgotPasswordRequest()
    {
        $email     = trim((string) ($this->datos['email'] ?? ''));
        $idCliente = $this->clienteModel->buscarIdPorCorreo($email);

        // Se responde igual exista o no la cuenta, para no revelar que correos estan registrados.
        if ($idCliente) {
            $codigo = (string) random_int(100000, 999999);
            $this->codigoModel->crearParaCliente($idCliente, $codigo);
            $enviado = CorreoService::enviarCodigoRecuperacion($email, $codigo);

            // Solo en local y si el correo no salio: se devuelve el codigo para poder probar.
            global $config;
            if (!$enviado && ($config['entorno'] ?? '') === 'local') {
                responderJson(['ok' => true, 'debugCode' => $codigo]);
            }
        }
        responderJson(['ok' => true]);
    }

    public function forgotPasswordReset()
    {
        $errores = [];
        if (empty($this->datos['email'])) $errores['email'] = ['El campo email es obligatorio.'];
        if (empty($this->datos['code'])) $errores['code'] = ['El campo code es obligatorio.'];
        if (empty($this->datos['newPassword']) || strlen((string) $this->datos['newPassword']) < 8) $errores['newPassword'] = ['El campo newPassword debe tener al menos 8 caracteres.'];
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        $email       = trim((string) $this->datos['email']);
        $codigo      = (string) $this->datos['code'];
        $nuevaClave  = (string) $this->datos['newPassword'];

        $registro = $this->codigoModel->buscarValidoPorCorreo($email);
        if (!$registro) {
            responderError('Código inválido o expirado.', 422);
        }
        if (!password_verify($codigo, $registro['codigo_hash'])) {
            $this->codigoModel->incrementarIntentos($registro['id_codigo']);
            responderError('Código inválido o expirado.', 422);
        }

        $this->codigoModel->marcarUsado($registro['id_codigo']);
        $this->clienteModel->actualizarContrasena($registro['id_cliente'], password_hash($nuevaClave, PASSWORD_DEFAULT));
        responderJson(['ok' => true]);
    }

    public function login()
    {
        // Cocina y Domiciliario entran con 'pin'; admin y cliente con 'password'.
        $usaPin = !empty($this->datos['pin']);

        $errores = [];
        // Con PIN tambien se acepta solo el usuario, sin "@dominio".
        $usuarioValido = $usaPin && !empty($this->datos['email']) && preg_match('/^[A-Za-z0-9._+-]{2,64}$/', (string) $this->datos['email']);
        if (empty($this->datos['email']) || (!$usuarioValido && !filter_var($this->datos['email'], FILTER_VALIDATE_EMAIL))) {
            $errores['email'] = [$usaPin ? 'Ingresa tu usuario (lo que va antes del @) o tu correo.' : 'El campo email debe ser un correo válido.'];
        }
        if ($usaPin) {
            if (!preg_match('/^\d{4}$/', (string) $this->datos['pin'])) $errores['pin'] = ['El PIN debe tener 4 dígitos.'];
        } else {
            if (empty($this->datos['password'])) $errores['password'] = ['El campo password es obligatorio.'];
        }
        if ($errores) {
            responderError('Datos inválidos.', 422, $errores);
        }

        $email = trim((string) $this->datos['email']);
        $ip    = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        if ($this->intentoModel->excedeLimite($email, $ip)) {
            responderError('Demasiados intentos fallidos. Intenta de nuevo en unos minutos.', 429);
        }

        if ($usaPin) {
            $usuario = Auth::intentarLoginConPin($email, (string) $this->datos['pin']);
        } else {
            $usuario = Auth::intentarLogin($email, (string) $this->datos['password']);
        }
        $this->intentoModel->registrar($email, $ip, (bool) $usuario);

        if (!$usuario) {
            responderError($usaPin ? 'Usuario o PIN incorrectos.' : 'Correo o contraseña incorrectos.', 401);
        }
        responderJson(['user' => $usuario, 'csrfToken' => Session::csrf()]);
    }

    public function logout()
    {
        Auth::logout();
        responderJson(['ok' => true]);
    }

    public function me()
    {
        if (!Auth::check()) {
            responderError('No autenticado.', 401);
        }
        $usuario = Auth::usuarioActual();
        if ($usuario === null) {
            responderError('Sesión inválida.', 401);
        }
        responderJson(['user' => $usuario, 'role' => Auth::rol(), 'csrfToken' => Session::csrf()]);
    }

    public function csrf()
    {
        // No exige sesion: lo usa el visitante para tener su primer token CSRF.
        responderJson(['csrfToken' => Session::csrf()]);
    }
}

$controller = new AuthController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'register') {
    $controller->register();
} elseif ($accion === 'forgotPasswordRequest') {
    $controller->forgotPasswordRequest();
} elseif ($accion === 'forgotPasswordReset') {
    $controller->forgotPasswordReset();
} elseif ($accion === 'login') {
    $controller->login();
} elseif ($accion === 'logout') {
    $controller->logout();
} elseif ($accion === 'me') {
    $controller->me();
} elseif ($accion === 'csrf') {
    $controller->csrf();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>