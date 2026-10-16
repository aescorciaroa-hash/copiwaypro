<?php
/**
 * Autenticacion y control de acceso por rol.
 * Roles: admin, kitchen (cocina), delivery (domiciliario) y client (cliente).
 */
class Auth
{
    /** Tabla y llave primaria de cada rol. */
    private const TABLAS = [
        'admin'    => ['ADMINISTRADOR',   'id_admin'],
        'kitchen'  => ['AYUDANTE_COCINA', 'id_ayudante'],
        'delivery' => ['DOMICILIARIO',    'id_domiciliario'],
        'client'   => ['CLIENTE',         'id_cliente'],
    ];

    public static function check()
    {
        return isset($_SESSION['usuario_id'], $_SESSION['usuario_rol']);
    }

    public static function rol()
    {
        return $_SESSION['usuario_rol'] ?? null;
    }

    public static function id()
    {
        return $_SESSION['usuario_id'] ?? null;
    }

    /** Busca una cuenta por correo dentro de una tabla. */
    private static function buscarPorCorreo($tabla, $correo)
    {
        global $conn;
        $correo = (string) $correo;
        $stmt = $conn->prepare("SELECT * FROM {$tabla} WHERE correo = ? LIMIT 1");
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /** Login con correo y contrasena probando las 4 tablas. Devuelve el usuario o null. */
    public static function intentarLogin($correo, $clave)
    {
        foreach (self::TABLAS as $rol => [$tabla]) {
            $fila = self::buscarPorCorreo($tabla, $correo);
            if (!$fila) {
                continue;
            }
            if (!password_verify($clave, $fila['contrasena']) || !$fila['activo']) {
                return null;
            }
            return self::login($rol, $fila);
        }
        return null;
    }

    /**
     * Login con PIN de 4 digitos, solo para cocina y domiciliario.
     * Se puede escribir solo el usuario (lo que va antes del @).
     */
    public static function intentarLoginConPin($correo, $pin)
    {
        $roles = ['kitchen', 'delivery'];

        if (strpos($correo, '@') === false) {
            $correo = self::usuarioSinDominio($correo, $roles);
            if ($correo === null) {
                return null;
            }
        }

        foreach ($roles as $rol) {
            $fila = self::buscarPorCorreo(self::TABLAS[$rol][0], $correo);
            if (!$fila) {
                continue;
            }
            if (empty($fila['pin']) || !password_verify($pin, $fila['pin']) || !$fila['activo']) {
                return null;
            }
            return self::login($rol, $fila);
        }
        return null;
    }

    /** Correo completo cuyo usuario (antes del @) coincide; null si no existe o hay mas de uno. */
    private static function usuarioSinDominio($usuario, $roles)
    {
        global $conn;
        // Se escapan los comodines de LIKE que escriba el usuario.
        $patron = addcslashes($usuario, '%_\\') . '@%';
        $encontrados = [];
        foreach ($roles as $rol) {
            $tabla = self::TABLAS[$rol][0];
            $stmt = $conn->prepare("SELECT correo FROM {$tabla} WHERE correo LIKE ? AND activo = 1");
            $stmt->bind_param("s", $patron);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            foreach ($rows as $row) {
                $encontrados[strtolower($row['correo'])] = $row['correo'];
            }
        }
        return count($encontrados) === 1 ? array_values($encontrados)[0] : null;
    }

    /** Inicia sesion guardando el usuario y su rol (regenerando el id de sesion). */
    public static function login($rol, $fila)
    {
        $idCol = self::TABLAS[$rol][1];
        session_regenerate_id(true);
        $_SESSION['usuario_id'] = $fila[$idCol];
        $_SESSION['usuario_rol'] = $rol;

        return [
            'id'    => (string) $fila[$idCol],
            'role'  => $rol,
            'name'  => $fila['nombre'],
            'email' => $fila['correo'],
        ];
    }

    /**
     * Vuelve a leer al usuario de la base de datos, para que una cuenta desactivada
     * pierda el acceso de inmediato. Si ya no existe o esta inactiva, cierra la sesion.
     */
    public static function usuarioActual()
    {
        global $conn;
        if (!self::check()) {
            return null;
        }

        [$tabla, $idCol] = self::TABLAS[self::rol()];
        $id = (string) self::id();
        $stmt = $conn->prepare("SELECT * FROM {$tabla} WHERE {$idCol} = ? LIMIT 1");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$fila || !$fila['activo']) {
            self::logout();
            return null;
        }

        unset($fila['contrasena'], $fila['pin']);
        $fila['role'] = self::rol();
        return $fila;
    }

    public static function logout()
    {
        unset($_SESSION['usuario_id'], $_SESSION['usuario_rol']);
        Session::destroy();
    }
}
