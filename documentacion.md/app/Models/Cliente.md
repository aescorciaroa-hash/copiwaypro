# app/Models/Cliente.php

## ¿Para qué sirve?
Consultas de los **clientes** (tabla `CLIENTE`) y de sus **notificaciones** (tabla `CLIENTE_NOTIFICACION`).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `AuthController.php` | Registrar, buscar por correo, cambiar contraseña al recuperarla. |
| ← lo usa | `ClientController.php` | Perfil, listado, notificaciones. |
| ← lo usa | `SyncController.php` | Enviar los clientes a React. |
| → usa | `$conn` (`config/database.php`) | La conexión. |
| → usa | `cliente_a_json()` y `notificacion_a_json()` (`app/Views/json/cliente.php`) | Convertir al formato de React. |
| → usa | `tiposDe()` (`helpers.php`) | En `actualizar()`. |

## Columnas importantes de CLIENTE
| Columna | Qué guarda | En React se llama |
|---|---|---|
| `id_cliente` | Número único | `id` |
| `nombre`, `telefono`, `correo`, `direccion` | Datos personales | `name`, `phone`, `email`, `address` |
| `contrasena` | Contraseña **cifrada** con `password_hash` | (nunca se envía) |
| `fecha_nacimiento` | Para el descuento de cumpleaños | `birthday` |
| `puntos_fidelidad`, `total_gastado` | Se suman al entregar un pedido | `points`, `totalSpent` |
| `fecha_aceptacion_habeas_data`, `ip_aceptacion_habeas_data` | Prueba de que aceptó el tratamiento de datos | — |
| `tema_preferido` | `light` u `dark` | `preferences.theme` |
| `carrito_guardado` | El carrito en formato JSON | `cart` |

## Métodos
| Método | Qué hace | Devuelve |
|---|---|---|
| `listar()` | Todos los clientes, del más nuevo al más viejo, ya en formato JSON. | arreglo |
| `buscar($id)` | Un cliente en formato JSON. Usa `buscarCrudo()` y después `comoJson()`. | arreglo o `null` |
| `buscarCrudo($id)` | Un cliente tal cual está en la tabla (con la contraseña cifrada). La usan el registro y el cambio de contraseña. | arreglo o `null` |
| `buscarIdPorCorreo($correo)` | Solo el id del cliente con ese correo. | número o `null` |
| `correoOTelefonoExiste($correo, $telefono)` | `SELECT COUNT(*)`: ¿ya hay alguien con ese correo o teléfono? | `true` / `false` |
| `comoJson($row)` | Arma el JSON del cliente: cuenta sus pedidos (`COUNT(*)`), busca la fecha del último (`MAX(fecha_hora)`) y trae sus notificaciones. Después llama a `cliente_a_json()`. | arreglo |
| `notificacionesDe($idCliente)` | Sus notificaciones, de la más nueva a la más vieja. `array_map('notificacion_a_json', $rows)` aplica esa función a cada fila. | arreglo |
| `marcarNotificacionLeida($idCliente, $idNotificacion)` | `UPDATE ... SET leida = 1`, solo si la notificación es de ese cliente. | `true` si cambió algo |
| `actualizar($id, $campos)` | Cambia solo los campos enviados (ver abajo). | — |
| `crear($d)` | Inserta un cliente nuevo. | id nuevo (`insert_id`) |
| `actualizarContrasena($id, $hash)` | Guarda una nueva contraseña ya cifrada. | — |

## `actualizar()` explicado
```php
$mapa = ['name' => 'nombre', 'phone' => 'telefono', ...];
```
Traduce el nombre que manda React (inglés) a la columna de MySQL (español).

```php
foreach ($mapa as $clave => $columna) {
    if (array_key_exists($clave, $campos)) {
        $sets[] = "{$columna} = ?";
        $values[] = $campos[$clave];
    }
}
```
- Recorre el mapa. Si React envió ese campo (`array_key_exists`), agrega `columna = ?` a la lista
  `$sets` y el valor a `$values`.
- Si React solo envió `name`, el SQL queda: `UPDATE CLIENTE SET nombre = ? WHERE id_cliente = ?`.

Casos especiales:
- `cart` se guarda como texto JSON: `json_encode($campos['cart'])`.
- `preferences.theme` se guarda en `tema_preferido`.

```php
$sql = "UPDATE CLIENTE SET " . implode(", ", $sets) . " WHERE id_cliente = ?";
$stmt->bind_param(tiposDe($values), ...$values);
```
`implode` une la lista con comas. Como no se sabe cuántos campos llegan, los tipos los arma `tiposDe()`.

## `crear()` explicado
```php
$hash = password_hash($d['password'], PASSWORD_DEFAULT);
```
**Nunca** se guarda la contraseña real; se guarda un "hash" (texto cifrado de una sola vía).
Para revisar si una contraseña es correcta se usa `password_verify()`.

```php
$stmt->bind_param("ssssssss", $d['name'], $d['phone'], ...);
return $this->conn->insert_id;
```
8 `?` → 8 letras `s`. Al final devuelve el id que MySQL le asignó al cliente nuevo.
