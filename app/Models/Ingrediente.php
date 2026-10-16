<?php
/**
 * Modelo Ingrediente (INGREDIENTE, CATEGORIA y MOVIMIENTO_INVENTARIO).
 * Se usa en dos formas: inventario (/api/inventory) y catalogo de extras (/api/ingredients).
 */
class Ingrediente
{
    private $conn;

    private const BASE = "SELECT i.*, c.nombre AS categoria_nombre
                          FROM INGREDIENTE i
                          JOIN CATEGORIA c ON c.id_categoria = i.id_categoria";

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function listarInventario()
    {
        $stmt = $this->conn->prepare(self::BASE . " WHERE i.activo = 1 ORDER BY i.nombre ASC");
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return array_map('ingrediente_a_inventario', $rows);
    }

    /** Catalogo para personalizar hamburguesas (sin empaques ni desechables). */
    public function listarIngredientes()
    {
        $stmt = $this->conn->prepare(self::BASE . " WHERE i.activo = 1 AND c.ambito != 'empaque_desechable' ORDER BY i.nombre ASC");
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return array_map('ingrediente_a_catalogo', $rows);
    }

    public function buscar($id)
    {
        $stmt = $this->conn->prepare(self::BASE . " WHERE i.id_ingrediente = ? LIMIT 1");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    public function comoInventario($row)
    {
        return ingrediente_a_inventario($row);
    }

    public function comoIngrediente($row)
    {
        return ingrediente_a_catalogo($row);
    }

    /** Crea el insumo y, si trae stock inicial, registra el movimiento de entrada. */
    public function crearConStockInicial($d, $idAdmin)
    {
        $this->conn->begin_transaction();
        try {
            $idCategoria = $this->resolverCategoria($d['category'] ?? null);
            $values = [
                $idCategoria, $d['name'], $d['unit'] ?? 'unidad', $d['stock'] ?? 0,
                $d['unitCost'] ?? 0, $d['totalCost'] ?? null, $d['price'] ?? 0,
                $d['supplier'] ?? null, $d['notes'] ?? null, $d['image'] ?? null,
            ];

            $stmt = $this->conn->prepare(
                "INSERT INTO INGREDIENTE
                    (id_categoria, nombre, unidad_medida, cantidad_stock,
                     costo_unitario, costo_total, precio_extra, proveedor, notas, imagen)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param(tiposDe($values), ...$values);
            $stmt->execute();
            $stmt->close();
            $id = $this->conn->insert_id;

            $stock = (float) ($d['stock'] ?? 0);
            if ($stock > 0) {
                $stmtM = $this->conn->prepare(
                    "INSERT INTO MOVIMIENTO_INVENTARIO (id_ingrediente, id_admin, tipo_movimiento, cantidad, motivo)
                     VALUES (?, ?, 'entrada', ?, 'Stock inicial')"
                );
                $stmtM->bind_param("isd", $id, $idAdmin, $stock);
                $stmtM->execute();
                $stmtM->close();
            }

            $this->conn->commit();
            return $id;
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function actualizar($id, $d)
    {
        $mapa = [
            'name' => 'nombre', 'unit' => 'unidad_medida', 'stock' => 'cantidad_stock',
            'unitCost' => 'costo_unitario', 'totalCost' => 'costo_total', 'price' => 'precio_extra',
            'supplier' => 'proveedor', 'notes' => 'notas', 'image' => 'imagen',
        ];

        $sets = [];
        $values = [];
        foreach ($mapa as $clave => $columna) {
            if (array_key_exists($clave, $d)) {
                $sets[] = "{$columna} = ?";
                $values[] = $d[$clave];
            }
        }
        if (array_key_exists('category', $d)) {
            $sets[] = "id_categoria = ?";
            $values[] = $this->resolverCategoria($d['category']);
        }
        if (empty($sets)) {
            return;
        }
        $values[] = $id;

        $sql = "UPDATE INGREDIENTE SET " . implode(", ", $sets) . " WHERE id_ingrediente = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(tiposDe($values), ...$values);
        $stmt->execute();
        $stmt->close();
    }

    /** Baja logica (activo = 0): el insumo tiene movimientos y recetas que lo referencian. */
    public function eliminar($id)
    {
        $stmt = $this->conn->prepare("UPDATE INGREDIENTE SET activo = 0 WHERE id_ingrediente = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $stmt->close();
    }

    /** Ajuste manual de stock (entrada o salida). Devuelve el nuevo stock. */
    public function ajustarStock($id, $cantidad, $idAdmin)
    {
        $this->conn->begin_transaction();
        try {
            $stmt = $this->conn->prepare("SELECT cantidad_stock FROM INGREDIENTE WHERE id_ingrediente = ? FOR UPDATE");
            $stmt->bind_param("s", $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$row) {
                throw new Exception('Insumo no encontrado.');
            }

            $nuevoStock = max(0, (float) $row['cantidad_stock'] + $cantidad);
            $stmtU = $this->conn->prepare("UPDATE INGREDIENTE SET cantidad_stock = ? WHERE id_ingrediente = ?");
            $stmtU->bind_param("ds", $nuevoStock, $id);
            $stmtU->execute();
            $stmtU->close();

            $tipo = $cantidad > 0 ? 'entrada' : 'salida';
            $absoluta = abs($cantidad);
            $motivo = 'Ajuste manual';
            $stmtM = $this->conn->prepare(
                "INSERT INTO MOVIMIENTO_INVENTARIO (id_ingrediente, id_admin, tipo_movimiento, cantidad, motivo)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmtM->bind_param("sssds", $id, $idAdmin, $tipo, $absoluta, $motivo);
            $stmtM->execute();
            $stmtM->close();

            $this->conn->commit();
            return $nuevoStock;
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    /**
     * Descuenta stock por receta (dentro de la transaccion del pedido).
     * Bloquea los insumos en orden por id, revisa que alcance TODO y despues descuenta.
     */
    public function descontarPorReceta($lineas, $idPedido, $idAdmin = null)
    {
        // Junta las cantidades por insumo.
        $consolidado = [];
        foreach ($lineas as $linea) {
            $id = $linea['id_ingrediente'];
            if (!isset($consolidado[$id])) {
                $consolidado[$id] = ['cantidad' => 0, 'motivos' => []];
            }
            $consolidado[$id]['cantidad'] += $linea['cantidad'];
            $consolidado[$id]['motivos'][] = $linea['motivo'];
        }

        $ids = array_keys($consolidado);
        sort($ids);

        // Bloquea cada insumo y guarda su stock.
        $stock = [];
        $nombre = [];
        foreach ($ids as $id) {
            $stmt = $this->conn->prepare("SELECT id_ingrediente, nombre, cantidad_stock FROM INGREDIENTE WHERE id_ingrediente = ? FOR UPDATE");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if (!$row) {
                throw new Exception("Insumo no encontrado (id $id).");
            }
            $stock[$id] = (float) $row['cantidad_stock'];
            $nombre[$id] = $row['nombre'];
        }

        // Revisa que haya stock suficiente de todo.
        foreach ($ids as $id) {
            $necesario = (float) $consolidado[$id]['cantidad'];
            if ($stock[$id] < $necesario) {
                throw new Exception("Sin stock suficiente de \"{$nombre[$id]}\" (disponible: {$stock[$id]}, requerido: $necesario).");
            }
        }

        // Descuenta y registra la salida.
        foreach ($ids as $id) {
            $necesario = (float) $consolidado[$id]['cantidad'];
            $stmtU = $this->conn->prepare("UPDATE INGREDIENTE SET cantidad_stock = cantidad_stock - ? WHERE id_ingrediente = ?");
            $stmtU->bind_param("di", $necesario, $id);
            $stmtU->execute();
            $stmtU->close();

            $motivo = implode(' + ', array_unique($consolidado[$id]['motivos']));
            $stmtM = $this->conn->prepare(
                "INSERT INTO MOVIMIENTO_INVENTARIO (id_ingrediente, id_admin, id_pedido, tipo_movimiento, cantidad, motivo)
                 VALUES (?, ?, ?, 'salida', ?, ?)"
            );
            $stmtM->bind_param("isids", $id, $idAdmin, $idPedido, $necesario, $motivo);
            $stmtM->execute();
            $stmtM->close();
        }
    }

    /**
     * Busca un insumo activo por nombre; si no existe lo crea con stock 0
     * en la categoria "General" del ambito dado. Lo usa la receta del producto.
     */
    public function resolverOCrear($nombre, $ambito)
    {
        $nombre = trim((string) $nombre);
        if ($nombre === '') {
            return null;
        }

        $stmt = $this->conn->prepare("SELECT id_ingrediente FROM INGREDIENTE WHERE activo = 1 AND LOWER(nombre) = LOWER(?) LIMIT 1");
        $stmt->bind_param("s", $nombre);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($row) {
            return (int) $row['id_ingrediente'];
        }

        $stmtC = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = ? AND nombre = 'General' LIMIT 1");
        $stmtC->bind_param("s", $ambito);
        $stmtC->execute();
        $categoria = $stmtC->get_result()->fetch_assoc();
        $stmtC->close();

        if ($categoria) {
            $idCategoria = $categoria['id_categoria'];
        } else {
            $stmtN = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES ('General', ?)");
            $stmtN->bind_param("s", $ambito);
            $stmtN->execute();
            $stmtN->close();
            $idCategoria = $this->conn->insert_id;
        }

        $stmtI = $this->conn->prepare(
            "INSERT INTO INGREDIENTE (id_categoria, nombre, unidad_medida, cantidad_stock, costo_unitario, precio_extra)
             VALUES (?, ?, 'unidad', 0, 0, 0)"
        );
        $stmtI->bind_param("is", $idCategoria, $nombre);
        $stmtI->execute();
        $stmtI->close();
        return $this->conn->insert_id;
    }

    /**
     * Devuelve el id de una categoria de inventario por nombre; si no existe la crea.
     * "Empaques & Desechables" se crea con ambito 'empaque_desechable', las demas como 'insumo_alimenticio'.
     */
    private function resolverCategoria($nombreCategoria)
    {
        $nombreCategoria = trim((string) $nombreCategoria);
        if ($nombreCategoria === '') {
            $nombreCategoria = 'Sin categoría';
        }

        $stmt = $this->conn->prepare(
            "SELECT id_categoria FROM CATEGORIA
             WHERE nombre = ? AND ambito IN ('insumo_alimenticio', 'empaque_desechable') LIMIT 1"
        );
        $stmt->bind_param("s", $nombreCategoria);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($row) {
            return $row['id_categoria'];
        }

        $ambito = $nombreCategoria === 'Empaques & Desechables' ? 'empaque_desechable' : 'insumo_alimenticio';
        $stmtI = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES (?, ?)");
        $stmtI->bind_param("ss", $nombreCategoria, $ambito);
        $stmtI->execute();
        $stmtI->close();
        return $this->conn->insert_id;
    }

    public function registrosDeMovimientos()
    {
        $stmt = $this->conn->prepare(
            "SELECT m.*, i.nombre AS item_nombre
             FROM MOVIMIENTO_INVENTARIO m
             JOIN INGREDIENTE i ON i.id_ingrediente = m.id_ingrediente
             ORDER BY m.fecha_hora DESC"
        );
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $registros = [];
        foreach ($rows as $row) {
            $cantidad = abs((float) $row['cantidad']);
            if ($row['tipo_movimiento'] === 'salida') {
                $cantidad = -$cantidad;
            }
            $registros[] = [
                'id'       => (string) $row['id_movimiento'],
                'date'     => $row['fecha_hora'],
                'itemId'   => (string) $row['id_ingrediente'],
                'itemName' => $row['item_nombre'],
                'amount'   => $cantidad,
                'type'     => $row['tipo_movimiento'] === 'salida' ? 'Salida' : 'Entrada',
                'reason'   => $row['motivo'],
            ];
        }
        return $registros;
    }
}
