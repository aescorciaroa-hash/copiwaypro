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
