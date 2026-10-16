# models/Cliente.php

## ¿Para qué sirve?
Consultas de los **clientes** (tabla `CLIENTE`) y de sus **notificaciones** (tabla `CLIENTE_NOTIFICACION`).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `AuthController.php` | Registrar, buscar por correo, cambiar contraseña al recuperarla. |
| ← lo usa | `ClientController.php` | Perfil, listado, notificaciones. |
| ← lo usa | `SyncController.php` | Enviar los clientes a React. |
| → usa | `$conn` (`config/database.php`) | La conexión. |
| → usa | `cliente_a_json()` y `notificacion_a_json()` (`views/json/cliente.php`) | Convertir al formato de React. |
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
| `notificacionesDe($idCliente)` | Sus notificaciones, de la más nueva a la más vieja. Con un `foreach` convierte cada fila con `notificacion_a_json()`. | arreglo |
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

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/Cliente.php`).
Lo cargan con `require_once`: `controllers/AuthController.php`, `controllers/ClientController.php`, `controllers/SyncController.php`. Dejan de funcionar:
  - `POST /api/auth/login` → Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario).
  - `POST /api/auth/logout` → El botón "Cerrar sesión" de todos los paneles deja de funcionar.
  - `GET /api/auth/csrf` → React no recibe el token CSRF: ningún formulario puede guardar (todo responde 419).
  - `POST /api/auth/register` → No se pueden crear cuentas de cliente (pantalla "Crear cuenta").
  - `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña.
  - `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código.
  - `PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente.
  - `PUT /api/clients/{id}/password` → Cliente → Mi Perfil: no se puede cambiar la contraseña.
  - … y 1 más: `GET /api/sync`.

**Si se borra un método:** sale `Call to undefined method Cliente::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `listar()` | `SyncController::index()` | `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `buscar()` | `ClientController::update()`, `SyncController::index()` | `PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente.<br>`GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `buscarCrudo()` | `AuthController::register()`, `ClientController::changePassword()`, `Cliente::buscar()` | `POST /api/auth/register` → No se pueden crear cuentas de cliente (pantalla "Crear cuenta").<br>`PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente.<br>`PUT /api/clients/{id}/password` → Cliente → Mi Perfil: no se puede cambiar la contraseña.<br>`GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `buscarIdPorCorreo()` | `AuthController::forgotPasswordRequest()` | `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña. |
| `correoOTelefonoExiste()` | `AuthController::register()` | `POST /api/auth/register` → No se pueden crear cuentas de cliente (pantalla "Crear cuenta"). |
| `comoJson()` | `Cliente::buscar()`, `Cliente::listar()` | `PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente.<br>`GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `notificacionesDe()` | `Cliente::comoJson()` | `PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente.<br>`GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `actualizar()` | `ClientController::update()` | `PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente. |
| `crear()` | `AuthController::register()` | `POST /api/auth/register` → No se pueden crear cuentas de cliente (pantalla "Crear cuenta"). |
| `actualizarContrasena()` | `AuthController::forgotPasswordReset()`, `ClientController::changePassword()` | `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código.<br>`PUT /api/clients/{id}/password` → Cliente → Mi Perfil: no se puede cambiar la contraseña. |
| `__construct()` | `new Cliente()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa Cliente. |
