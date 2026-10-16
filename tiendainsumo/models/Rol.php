<?php
require_once __DIR__ . '/../config/database.php';

class Rol
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function obtenerTodos()
    {
        $query = 'SELECT * FROM roles';
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();
        $roles = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $roles[] = $row;
            }
        }
        return $roles;
    }
}
?>