# models/Personal.php

## ¿Para qué sirve?
Consultas del **personal**: ayudantes de cocina (tabla `AYUDANTE_COCINA`) y domiciliarios (tabla
`DOMICILIARIO`). Para React son una sola lista ("staff").

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `StaffController.php` | Crear, editar, dar de baja, eliminar, guardar ubicación. |
| ← lo usa | `SyncController.php` | Enviar la lista a React (admin y cocina). |
| → usa | `personal_cocina_a_json()` / `personal_domicilio_a_json()` (`views/json/personal.php`) | Formato de React. |
| → usa | `tiposDe()` (`helpers.php`) | En los UPDATE variables. |

## ⚠️ Los ids se repiten entre tablas
Cada tabla cuenta sus ids por separado: puede existir el ayudante **1** y el domiciliario **1**, que
son personas distintas. Por eso varios métodos reciben el **rol** (`'Ayudante de cocina'` o
`'Domiciliario'`) para ir directo a la tabla correcta.

## Métodos
| Método | Qué hace |
|---|---|
| `listar()` | Trae las dos tablas (con el nombre del admin que creó a cada uno, por `LEFT JOIN ADMINISTRADOR`) y las une en una sola lista. |
| `comoJsonCocina($row)` | Formato JSON de un ayudante. |
| `comoJsonDomicilio($row)` | Busca si el domiciliario tiene un pedido "en_camino" y arma su JSON con ese pedido (`currentOrderId`) y las coordenadas de su destino (`destCoords`), para el mapa del admin. |
| `crear($d, $idAdmin)` | Inserta en la tabla según `$d['role']`. La contraseña y el PIN se guardan cifrados. Si el rol no es válido lanza una excepción. |
| `actualizar($id, $d)` | Con rol → va directo a la tabla. Sin rol → busca primero en cocina y después en domicilio. Devuelve `'kitchen'`, `'delivery'` o `null`. |
| `existe($tabla, $idCol, $id)` (privado) | ¿Existe ese id en esa tabla? |
| `actualizarCocina()` / `actualizarDomicilio()` (privados) | Definen qué campos se pueden cambiar en cada tabla y llaman a `guardarCambios()`. |
| `guardarCambios(...)` (privado) | Arma el UPDATE con los campos enviados (y `activo`, contraseña o PIN si llegan). |
| `eliminarPermanente($id, $rol)` | Borra a la persona (`DELETE`) solo si **no tiene historial**: un ayudante que nunca preparó un pedido, o un domiciliario que nunca repartió ni fue liquidado. Si tiene historial lanza una excepción que sugiere "Dar de baja". El rol es obligatorio (si falta lanza `InvalidArgumentException`). Devuelve `false` si no existe. |
| `actualizarUbicacion($id, $lat, $lng)` | Guarda la ubicación GPS del domiciliario y la hora (`NOW()`). Devuelve `true` si el domiciliario existe (aunque la posición no haya cambiado). |

**Dar de baja** no tiene un método propio: es `actualizar()` con `active = false` (pone `activo = 0`
y conserva el historial).

## Variables importantes en `guardarCambios()`
| Variable | Para qué sirve |
|---|---|
| `$tabla`, `$idCol` | Qué tabla y qué columna de id usar (se reciben como parámetros para servir a las dos tablas). |
| `$mapa` | Nombre en React → columna en MySQL (`'plate' => 'placa'`...). |
| `$sets`, `$values` | Las partes del UPDATE (`placa = ?`) y sus valores. |

```php
$sql = "UPDATE {$tabla} SET " . implode(", ", $sets) . " WHERE {$idCol} = ?";
```
`{$tabla}` dentro de comillas dobles se reemplaza por el valor de la variable.

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/Personal.php`).
Lo cargan con `require_once`: `controllers/StaffController.php`, `controllers/SyncController.php`. Dejan de funcionar:
  - `POST /api/staff` → Admin → Equipo y Personal: no se puede agregar personal.
  - `PUT /api/staff/{id}` → Admin → Equipo y Personal: no se puede editar ni dar de baja.
  - `DELETE /api/staff/{id}` → Admin → Equipo y Personal: no se puede eliminar.
  - `PATCH /api/staff/{id}/location` → Domiciliario: su ubicación GPS no se guarda (el admin no lo ve en el mapa).
  - `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan.

**Si se borra un método:** sale `Call to undefined method Personal::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `listar()` | `SyncController::index()` | `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `comoJsonCocina()` | `Personal::listar()` | `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `comoJsonDomicilio()` | `Personal::listar()` | `GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `crear()` | `StaffController::store()` | `POST /api/staff` → Admin → Equipo y Personal: no se puede agregar personal. |
| `actualizar()` | `StaffController::update()` | `PUT /api/staff/{id}` → Admin → Equipo y Personal: no se puede editar ni dar de baja. |
| `existe()` (privado) | `Personal::actualizar()`, `Personal::actualizarUbicacion()`, `Personal::eliminarPermanente()` | `PUT /api/staff/{id}` → Admin → Equipo y Personal: no se puede editar ni dar de baja.<br>`DELETE /api/staff/{id}` → Admin → Equipo y Personal: no se puede eliminar.<br>`PATCH /api/staff/{id}/location` → Domiciliario: su ubicación GPS no se guarda (el admin no lo ve en el mapa). |
| `actualizarCocina()` (privado) | `Personal::actualizar()` | `PUT /api/staff/{id}` → Admin → Equipo y Personal: no se puede editar ni dar de baja. |
| `actualizarDomicilio()` (privado) | `Personal::actualizar()` | `PUT /api/staff/{id}` → Admin → Equipo y Personal: no se puede editar ni dar de baja. |
| `guardarCambios()` (privado) | `Personal::actualizarCocina()`, `Personal::actualizarDomicilio()` | `PUT /api/staff/{id}` → Admin → Equipo y Personal: no se puede editar ni dar de baja. |
| `eliminarPermanente()` | `StaffController::destroy()` | `DELETE /api/staff/{id}` → Admin → Equipo y Personal: no se puede eliminar. |
| `actualizarUbicacion()` | `StaffController::updateLocation()` | `PATCH /api/staff/{id}/location` → Domiciliario: su ubicación GPS no se guarda (el admin no lo ve en el mapa). |
| `__construct()` | `new Personal()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa Personal. |
