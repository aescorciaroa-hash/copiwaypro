<?php
/**
 * Modelo Configuracion (CONFIGURACION_SISTEMA y categorias del menu).
 */
class Configuracion
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    /** Fila unica de CONFIGURACION_SISTEMA (todas las columnas o solo una). */
    public function get($columna = '*')
    {
        $res = $this->conn->query("SELECT {$columna} FROM CONFIGURACION_SISTEMA LIMIT 1");
        return $res->fetch_assoc();
    }

    /** Configuracion con el formato que usa el frontend. */
    public function obtener()
    {
        $cfg = $this->get();

        $stmt = $this->conn->prepare("SELECT nombre FROM CATEGORIA WHERE ambito = 'menu' ORDER BY nombre ASC");
        $stmt->execute();
        $categorias = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'nombre');
        $stmt->close();

        return [
            'openTime'     => substr((string) $cfg['horario_apertura'], 0, 5),
            'closeTime'    => substr((string) $cfg['horario_cierre'], 0, 5),
            'isOpen'       => (bool) $cfg['tienda_abierta_manual'],
            'isPaused'     => (bool) $cfg['pausa_emergencia_activa'],
            'shippingRate' => (float) $cfg['tarifa_plana_domicilio'],
            'profitMargin' => (float) $cfg['margen_ganancia_defecto'],
            'pointValue'   => (float) $cfg['valor_punto'],
            'minPointsToRedeem' => (int) $cfg['minimo_puntos_canje'],
            'business'     => [
                'name'      => $cfg['negocio_nombre'],
                'nit'       => $cfg['negocio_nit'],
                'address'   => $cfg['negocio_direccion'],
                'phone'     => $cfg['negocio_telefono'],
                'instagram' => $cfg['negocio_instagram'],
                'website'   => $cfg['negocio_web'],
            ],
            'categories'   => $categorias,
        ];
    }

    /** Actualiza solo los campos que vengan en $campos (claves en camelCase). */
    public function actualizar($campos)
    {
        $mapa = [
            'openTime' => 'horario_apertura', 'closeTime' => 'horario_cierre',
            'isOpen' => 'tienda_abierta_manual', 'isPaused' => 'pausa_emergencia_activa',
            'shippingRate' => 'tarifa_plana_domicilio', 'profitMargin' => 'margen_ganancia_defecto',
            'pointValue' => 'valor_punto', 'minPointsToRedeem' => 'minimo_puntos_canje',
        ];

        // Los datos del negocio llegan agrupados en 'business' (ver obtener()).
        $mapaNegocio = [
            'name' => 'negocio_nombre', 'nit' => 'negocio_nit', 'address' => 'negocio_direccion',
            'phone' => 'negocio_telefono', 'instagram' => 'negocio_instagram', 'website' => 'negocio_web',
        ];

        $sets = [];
        $values = [];
        foreach ($mapa as $clave => $columna) {
            if (!array_key_exists($clave, $campos)) {
                continue;
            }
            $valor = $campos[$clave];
            if ($clave === 'openTime' || $clave === 'closeTime') {
                $valor = strlen((string) $valor) === 5 ? $valor . ':00' : $valor;
            } elseif ($clave === 'isOpen' || $clave === 'isPaused') {
                $valor = $valor ? 1 : 0;
            }
            $sets[] = "{$columna} = ?";
            $values[] = $valor;
        }

        $negocio = is_array($campos['business'] ?? null) ? $campos['business'] : [];
        foreach ($mapaNegocio as $clave => $columna) {
            if (!array_key_exists($clave, $negocio)) {
                continue;
            }
            $sets[] = "{$columna} = ?";
            $values[] = trim((string) $negocio[$clave]);
        }

        if (empty($sets)) {
            return;
        }
        $values[] = $this->get('id_config')['id_config'];

        $sql = "UPDATE CONFIGURACION_SISTEMA SET " . implode(", ", $sets) . " WHERE id_config = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(tiposDe($values), ...$values);
        $stmt->execute();
        $stmt->close();
    }

    /** Agrega una categoria de menu si no existe (sin importar mayusculas). */
    public function agregarCategoria($nombre)
    {
        $nombre = trim($nombre);

        $stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = 'menu' AND LOWER(nombre) = LOWER(?)");
        $stmt->bind_param("s", $nombre);
        $stmt->execute();
        $existe = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$existe) {
            $stmtI = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES (?, 'menu')");
            $stmtI->bind_param("s", $nombre);
            $stmtI->execute();
            $stmtI->close();
        }
    }

    /** Elimina una categoria de menu, salvo que la use algun producto activo. */
    public function eliminarCategoria($nombre)
    {
        $stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = 'menu' AND nombre = ?");
        $stmt->bind_param("s", $nombre);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row) {
            throw new Exception('La categoría no existe.');
        }
        $id = $row['id_categoria'];

        $stmtC = $this->conn->prepare("SELECT COUNT(*) AS total FROM PRODUCTO WHERE id_categoria = ? AND estado = 'activo'");
        $stmtC->bind_param("i", $id);
        $stmtC->execute();
        $cuenta = $stmtC->get_result()->fetch_assoc();
        $stmtC->close();

        if ((int) $cuenta['total'] > 0) {
            throw new Exception('No se puede eliminar la categoría: hay productos activos que la usan.');
        }

        $stmtD = $this->conn->prepare("DELETE FROM CATEGORIA WHERE id_categoria = ?");
        $stmtD->bind_param("i", $id);
        $stmtD->execute();
        $stmtD->close();
    }

    /** La tienda esta cerrada si isOpen=false, isPaused=true o la hora esta fuera del horario. */
    public function tiendaAbiertaAhora()
    {
        $config = $this->obtener();
        if (!$config['isOpen'] || $config['isPaused']) {
            return false;
        }

        // Se compara en minutos con la zona horaria de la app ('zona_horaria' de config/app.php).
        $ahora  = (int) date('G') * 60 + (int) date('i');
        $abre   = $this->aMinutos($config['openTime']);
        $cierra = $this->aMinutos($config['closeTime']);

        if ($abre <= $cierra) {
            return $ahora >= $abre && $ahora <= $cierra;
        }
        // Horario que cruza la medianoche (ej. 18:00 -> 02:00).
        return $ahora >= $abre || $ahora <= $cierra;
    }

    /** Convierte "HH:MM" a minutos del dia. */
    private function aMinutos($hhmm)
    {
        $partes = explode(':', substr((string) $hhmm, 0, 5));
        $horas = (int) $partes[0];
        $minutos = isset($partes[1]) ? (int) $partes[1] : 0;
        return $horas * 60 + $minutos;
    }

    public function tarifaDomicilio()
    {
        return (float) $this->get('tarifa_plana_domicilio')['tarifa_plana_domicilio'];
    }

    public function idIngredienteBolsaGlobal()
    {
        return $this->get('id_ingrediente_bolsa_global')['id_ingrediente_bolsa_global'] ?: null;
    }

    /** Programa de puntos: valor en pesos de 1 punto y minimo de puntos para canjear. */
    public function reglasPuntos()
    {
        $cfg = $this->get('valor_punto, minimo_puntos_canje');
        return [
            'valor'  => (float) $cfg['valor_punto'],
            'minimo' => (int) $cfg['minimo_puntos_canje'],
        ];
    }

    /** % de ganancia que el admin configura en Ajustes (ej. 30). */
    public function margenGanancia()
    {
        return (float) $this->get('margen_ganancia_defecto')['margen_ganancia_defecto'];
    }
}
?>