<?php
/**
 * Modelo Producto (PRODUCTO y RECETA).
 * El producto oculto "Hamburguesa Personalizada" nunca aparece en el catalogo.
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Ingrediente.php';

class Producto
{
    private $conn;

    /** Texto de la etiqueta en el frontend => valor del ENUM etiqueta_destacada. */
    const BADGE_A_ENUM = [
        'Más Vendido'  => 'mas_vendido',
        'Recomendado'  => 'recomendado',
        'Nuevo'        => 'nuevo',
        'Especialidad' => 'especialidad',
    ];

    const BASE = "SELECT p.*, c.nombre AS categoria_nombre
                          FROM PRODUCTO p
                          JOIN CATEGORIA c ON c.id_categoria = p.id_categoria";

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    /**
     * $soloActivos = true para el catalogo publico.
     * $esAdmin = true devuelve el JSON completo (costos, receta y empaques).
     */
    public function listar($soloActivos = false, $esAdmin = false)
    {
        $sql = self::BASE . " WHERE p.nombre != 'Hamburguesa Personalizada'";
        if ($soloActivos) {
            $sql .= " AND p.estado = 'activo'";
        }
        $sql .= " ORDER BY p.creado_en DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $productos = [];
        foreach ($rows as $row) {
            $productos[] = $this->comoJson($row, $esAdmin);
        }
        return $productos;
    }

    public function buscar($id, $esAdmin = false)
    {
        $stmt = $this->conn->prepare(self::BASE . " WHERE p.id_producto = ? LIMIT 1");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ? $this->comoJson($row, $esAdmin) : null;
    }

    public function comoJson($row, $esAdmin = false)
    {
        $receta = $this->recetaDe($row['id_producto']);
        return producto_a_json($row, $receta['ingredientes'], $receta['empaques'], $esAdmin);
    }

    private function recetaDe($idProducto)
    {
        $stmt = $this->conn->prepare(
            "SELECT r.cantidad_necesaria, i.id_ingrediente, i.nombre, c.ambito
             FROM RECETA r
             JOIN INGREDIENTE i ON i.id_ingrediente = r.id_ingrediente
             JOIN CATEGORIA c ON c.id_categoria = i.id_categoria
             WHERE r.id_producto = ?"
        );
        $stmt->bind_param("i", $idProducto);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $ingredientes = [];
        $empaques = [];
        foreach ($rows as $r) {
            $entrada = ['id' => (string) $r['id_ingrediente'], 'name' => $r['nombre'], 'quantityDeduct' => (float) $r['cantidad_necesaria']];
            if ($r['ambito'] === 'empaque_desechable') {
                $empaques[] = $entrada;
            } else {
                $ingredientes[] = $entrada;
            }
        }
        return ['ingredientes' => $ingredientes, 'empaques' => $empaques];
    }

    private function badgeAEnum($badge)
    {
        if (empty($badge)) {
            return 'ninguna';
        }
        return self::BADGE_A_ENUM[$badge] ?? (in_array($badge, self::BADGE_A_ENUM, true) ? $badge : 'ninguna');
    }

    /** Crea el producto con su receta (ingredientes + empaques) en una transaccion. */
    public function crear($d)
    {
        $this->conn->begin_transaction();
        try {
            $values = [
                $this->resolverCategoria($d['category'] ?? null),
                $d['name'], $d['description'] ?? null, $d['price'],
                $d['costPrice'] ?? null, $d['image'] ?? null, $d['prepTime'] ?? null,
                ($d['active'] ?? true) ? 'activo' : 'oculto',
                $this->badgeAEnum($d['badge'] ?? null),
            ];

            $stmt = $this->conn->prepare(
                "INSERT INTO PRODUCTO
                    (id_categoria, nombre, descripcion, precio, costo_calculado,
                     imagen, tiempo_preparacion, estado, etiqueta_destacada)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param(tiposDe($values), ...$values);
            $stmt->execute();
            $stmt->close();
            $id = $this->conn->insert_id;

            $this->sincronizarReceta($id, $d['ingredients'] ?? [], $d['packaging'] ?? []);

            $this->conn->commit();
            return $id;
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function actualizar($id, $d)
    {
        $this->conn->begin_transaction();
        try {
            $mapa = [
                'name' => 'nombre', 'description' => 'descripcion', 'price' => 'precio',
                'costPrice' => 'costo_calculado', 'image' => 'imagen', 'prepTime' => 'tiempo_preparacion',
            ];

            $sets = [];
            $values = [];
            foreach ($mapa as $clave => $columna) {
                if (array_key_exists($clave, $d)) {
                    $sets[] = "{$columna} = ?";
                    $values[] = $d[$clave];
                }
            }
            if (array_key_exists('active', $d)) {
                $sets[] = "estado = ?";
                $values[] = $d['active'] ? 'activo' : 'oculto';
            }
            if (array_key_exists('badge', $d)) {
                $sets[] = "etiqueta_destacada = ?";
                $values[] = $this->badgeAEnum($d['badge']);
            }
            if (array_key_exists('category', $d)) {
                $sets[] = "id_categoria = ?";
                $values[] = $this->resolverCategoria($d['category']);
            }

            if (!empty($sets)) {
                $values[] = $id;
                $sql = "UPDATE PRODUCTO SET " . implode(", ", $sets) . " WHERE id_producto = ?";
                $stmt = $this->conn->prepare($sql);
                $stmt->bind_param(tiposDe($values), ...$values);
                $stmt->execute();
                $stmt->close();
            }

            if (array_key_exists('ingredients', $d) || array_key_exists('packaging', $d)) {
                $this->sincronizarReceta($id, $d['ingredients'] ?? [], $d['packaging'] ?? []);
            }

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function eliminar($id)
    {
        $stmt = $this->conn->prepare("DELETE FROM PRODUCTO WHERE id_producto = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $stmt->close();
    }

    /**
     * Rehace la receta del producto. Cada insumo se busca por nombre en INGREDIENTE
     * y si no existe se crea (Ingrediente::resolverOCrear).
     */
    private function sincronizarReceta($idProducto, $ingredientes, $empaques)
    {
        $stmtD = $this->conn->prepare("DELETE FROM RECETA WHERE id_producto = ?");
        $stmtD->bind_param("s", $idProducto);
        $stmtD->execute();
        $stmtD->close();

        $lista = [];
        foreach ($ingredientes as $item) {
            $item['ambito'] = 'insumo_alimenticio';
            $lista[] = $item;
        }
        foreach ($empaques as $item) {
            $item['ambito'] = 'empaque_desechable';
            $lista[] = $item;
        }

        $ingredienteModel = new Ingrediente();
        foreach ($lista as $item) {
            if (empty($item['name'])) {
                continue;
            }
            $idIngrediente = $ingredienteModel->resolverOCrear($item['name'], $item['ambito']);
            if ($idIngrediente === null) {
                continue;
            }
            $values = [$idProducto, $idIngrediente, $item['quantity'] ?? 1];
            $stmtI = $this->conn->prepare("INSERT INTO RECETA (id_producto, id_ingrediente, cantidad_necesaria) VALUES (?, ?, ?)");
            $stmtI->bind_param(tiposDe($values), ...$values);
            $stmtI->execute();
            $stmtI->close();
        }
    }

    private function resolverCategoria($nombreCategoria)
    {
        $nombreCategoria = trim((string) $nombreCategoria);
        if ($nombreCategoria === '') {
            throw new Exception('La categoría del producto es obligatoria.');
        }

        $stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE nombre = ? AND ambito = 'menu' LIMIT 1");
        $stmt->bind_param("s", $nombreCategoria);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($row) {
            return $row['id_categoria'];
        }

        $stmtI = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES (?, 'menu')");
        $stmtI->bind_param("s", $nombreCategoria);
        $stmtI->execute();
        $stmtI->close();
        return $this->conn->insert_id;
    }
}
?>