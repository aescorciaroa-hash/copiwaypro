# app/Models/Pedido.php

## ¿Para qué sirve?
Consultas de **lectura** de los pedidos: listarlos según quién pregunta, buscar uno y armar sus
productos con las personalizaciones. Crear pedidos y cambiarles el estado está en
`PedidoService.php`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `OrderController.php` | Listar y buscar. |
| ← lo usa | `SyncController.php` | Enviar pedidos a React. |
| ← lo usa | `PedidoService.php` | Devolver el pedido recién creado. |
| → usa | `pedido_a_json()` (`app/Views/json/pedido.php`) | Formato de React. |
| → tablas | `PEDIDO`, `CLIENTE`, `DOMICILIARIO`, `AYUDANTE_COCINA`, `DETALLE_PEDIDO`, `PERSONALIZACION` | |

## Tablas de un pedido
```
PEDIDO (uno)                       ← dirección, estado, total, pago, PIN...
 └── DETALLE_PEDIDO (varios)       ← cada producto: nombre, cantidad, precio
      └── PERSONALIZACION (varios) ← "agregar queso", "quitar cebolla"
```

## La constante `BASE`
Un SELECT con **JOIN** que trae el pedido junto con:
- el nombre y teléfono del **cliente** (`JOIN CLIENTE`),
- el nombre, teléfono, placa y vehículo del **domiciliario** (`LEFT JOIN DOMICILIARIO`),
- el nombre del **ayudante de cocina** (`LEFT JOIN AYUDANTE_COCINA`).

`LEFT JOIN` = "tráelo si existe". Un pedido nuevo todavía no tiene domiciliario, y aun así debe aparecer.

## Métodos
| Método | Qué hace |
|---|---|
| `porRol($rol, $usuarioId)` | Lista pedidos: el **cliente** solo los suyos; el **domiciliario** los suyos + los "listo" sin asignar; el **admin y la cocina** todos. |
| `buscar($id, $rolQueVe, $idQueVe)` | Un pedido, con la misma regla de visibilidad. Si no le corresponde verlo devuelve `null` (el controlador responde 404). |
| `buscarCrudo($id)` | La fila de PEDIDO tal cual (sin JOIN ni formato). |
| `numeroDesdeId($idVisible)` (privado) | Acepta `"#ORD-12"` o `"12"` y devuelve `12`. |
| `itemsDe($idPedido)` | Arma la lista de productos del pedido, cada uno con sus `extras` y `removed`. |
| `formar($row, ...)` (privado) | `itemsDe()` + `pedido_a_json()`. |

## `numeroDesdeId()` explicado
```php
if (preg_match('/^#ORD-(\d+)$/', (string) $idVisible, $m)) {
    return (int) $m[1];
}
```
- `preg_match` busca un patrón. `(\d+)` captura los números del final.
- En `$m[1]` queda lo capturado: `"#ORD-12"` → `"12"` → `(int)` → `12`.
- Si no tiene ese formato pero es un número (`is_numeric`), se usa tal cual; si no, `0` (no existe).

## `itemsDe()` explicado
1. Trae las filas de DETALLE_PEDIDO del pedido.
2. Para cada una, trae sus PERSONALIZACION.
3. Las separa: `accion_modificacion === 'agregar'` → `extras`; si no → `removed`.
4. Arma cada ítem con los nombres que espera React (`productId`, `quantity`, `price`, `isCustom`...).
