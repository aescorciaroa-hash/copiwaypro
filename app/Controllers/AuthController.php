<?php
/**
 * Controlador de Autenticacion (login, registro, sesion y recuperar contrasena).
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Core/Session.php';
require_once __DIR__ . '/../Core/Auth.php';
require_once __DIR__ . '/../Models/Cliente.php';
require_once __DIR__ . '/../Models/CodigoVerificacion.php';
require_once __DIR__ . '/../Models/IntentoLogin.php';
require_once __DIR__ . '/../Services/CorreoService.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$clienteModel = new Cliente();
$codigoModel  = new CodigoVerificacion();
$intentoModel = new IntentoLogin();
$datos        = entrada();

if ($action === 'register') {
    $nombre    = $datos['name'] ?? '';
    $telefono  = trim((string) ($datos['phone'] ?? ''));
    $email     = trim((string) ($datos['email'] ?? ''));
    $birthday  = $datos['birthday'] ?? '';
    $password  = (string) ($datos['password'] ?? '');
    $confirmar = (string) ($datos['confirmPassword'] ?? '');

    $errores = [];
    if (empty($datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];
    if (empty($datos['phone']) || strlen((string) $datos['phone']) < 10) $errores['phone'] = ['El campo phone debe tener al menos 10 caracteres.'];
    if (empty($datos['email']) || !filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) $errores['email'] = ['El campo email debe ser un correo válido.'];
    if (empty($datos['birthday'])) $errores['birthday'] = ['El campo birthday es obligatorio.'];
    if (empty($datos['password']) || strlen($password) < 8) $errores['password'] = ['El campo password debe tener al menos 8 caracteres.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }
    if (empty($datos['terms'])) {
        responderError('Debes aceptar los términos y la política de tratamiento de datos (Habeas Data).', 422);
    }
    if ($password !== $confirmar) {
        responderError('Las contraseñas no coinciden.', 422);
    }
    if ($clienteModel->correoOTelefonoExiste($email, $telefono) || correoUsadoEnCualquierTabla($email)) {
        responderError('Ya existe una cuenta con ese correo o teléfono.', 409);
    }

    $idCliente = $clienteModel->crear([
        'name'     => $nombre,
        'phone'    => $telefono,
        'email'    => $email,
        'birthday' => $birthday,
        'password' => $password,
        'ip'       => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
    ]);

    $usuario = Auth::login('client', $clienteModel->buscarCrudo($idCliente));
    responderJson(['user' => $usuario, 'csrfToken' => Session::csrf()], 201);
}
elseif ($action === 'forgotPasswordRequest') {
    $email     = trim((string) ($datos['email'] ?? ''));
    $idCliente = $clienteModel->buscarIdPorCorreo($email);

    // Se responde igual exista o no la cuenta, para no revelar que correos estan registrados.
    if ($idCliente) {
        $codigo = (string) random_int(100000, 999999);
        $codigoModel->crearParaCliente($idCliente, $codigo);
        $enviado = CorreoService::enviarCodigoRecuperacion($email, $codigo);

        // Solo en local y si el correo no salio: se devuelve el codigo para poder probar.
        if (!$enviado && env('APP_ENV', 'production') === 'local') {
            responderJson(['ok' => true, 'debugCode' => $codigo]);
        }
    }
    responderJson(['ok' => true]);
}
elseif ($action === 'forgotPasswordReset') {
    $errores = [];
    if (empty($datos['email'])) $errores['email'] = ['El campo email es obligatorio.'];
    if (empty($datos['code'])) $errores['code'] = ['El campo code es obligatorio.'];
    if (empty($datos['newPassword']) || strlen((string) $datos['newPassword']) < 8) $errores['newPassword'] = ['El campo newPassword debe tener al menos 8 caracteres.'];
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    $email       = trim((string) $datos['email']);
    $codigo      = (string) $datos['code'];
    $nuevaClave  = (string) $datos['newPassword'];

    $registro = $codigoModel->buscarValidoPorCorreo($email);
    if (!$registro) {
        responderError('Código inválido o expirado.', 422);
    }
    if (!password_verify($codigo, $registro['codigo_hash'])) {
        $codigoModel->incrementarIntentos($registro['id_codigo']);
        responderError('Código inválido o expirado.', 422);
    }

    $codigoModel->marcarUsado($registro['id_codigo']);
    $clienteModel->actualizarContrasena($registro['id_cliente'], password_hash($nuevaClave, PASSWORD_DEFAULT));
    responderJson(['ok' => true]);
}
elseif ($action === 'login') {
    // Cocina y Domiciliario entran con 'pin'; admin y cliente con 'password'.
    $usaPin = !empty($datos['pin']);

    $errores = [];
    // Con PIN tambien se acepta solo el usuario, sin "@dominio".
    $usuarioValido = $usaPin && !empty($datos['email']) && preg_match('/^[A-Za-z0-9._+-]{2,64}$/', (string) $datos['email']);
    if (empty($datos['email']) || (!$usuarioValido && !filter_var($datos['email'], FILTER_VALIDATE_EMAIL))) {
        $errores['email'] = [$usaPin ? 'Ingresa tu usuario (lo que va antes del @) o tu correo.' : 'El campo email debe ser un correo válido.'];
    }
    if ($usaPin) {
        if (!preg_match('/^\d{4}$/', (string) $datos['pin'])) $errores['pin'] = ['El PIN debe tener 4 dígitos.'];
    } else {
        if (empty($datos['password'])) $errores['password'] = ['El campo password es obligatorio.'];
    }
    if ($errores) {
        responderError('Datos inválidos.', 422, $errores);
    }

    $email = trim((string) $datos['email']);
    $ip    = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    if ($intentoModel->excedeLimite($email, $ip)) {
        responderError('Demasiados intentos fallidos. Intenta de nuevo en unos minutos.', 429);
    }

    if ($usaPin) {
        $usuario = Auth::intentarLoginConPin($email, (string) $datos['pin']);
    } else {
        $usuario = Auth::intentarLogin($email, (string) $datos['password']);
    }
    $intentoModel->registrar($email, $ip, (bool) $usuario);

    if (!$usuario) {
        responderError($usaPin ? 'Usuario o PIN incorrectos.' : 'Correo o contraseña incorrectos.', 401);
    }
    responderJson(['user' => $usuario, 'csrfToken' => Session::csrf()]);
}
elseif ($action === 'logout') {
    Auth::logout();
    responderJson(['ok' => true]);
}
elseif ($action === 'me') {
    if (!Auth::check()) {
        responderError('No autenticado.', 401);
    }
    $usuario = Auth::usuarioActual();
    if ($usuario === null) {
        responderError('Sesión inválida.', 401);
    }
    responderJson(['user' => $usuario, 'role' => Auth::rol(), 'csrfToken' => Session::csrf()]);
}
elseif ($action === 'csrf') {
    // No exige sesion: lo usa el visitante para tener su primer token CSRF.
    responderJson(['csrfToken' => Session::csrf()]);
}
else {
    responderError('Ruta no encontrada.', 404);
}
