# models/Pedido.php

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
| → usa | `pedido_a_json()` (`views/json/pedido.php`) | Formato de React. |
| → tablas | `PEDIDO`, `CLIENTE`, `DOMICILIARIO`, `AYUDANTE_COCINA`, `DETALLE_PEDIDO`, `PERSONALIZACION` | |

## Tablas de un pedido
```
PEDIDO (uno)                       ← dirección, estado, total, pago, PIN...
 └── DETALLE_PEDIDO (varios)       ← cada producto: nombre, cantidad, precio
      └── PERSONALIZACION (varios) ← "agregar queso", "quitar cebolla"
```

## La constante `BASE`
Un SELECT con **JOIN** que trae el pedido junto con:
- el nombre y teléfono del **cliente** (`LEFT JOIN CLIENTE`). Si el pedido es de un **cliente
  invitado** (pedido manual de alguien sin cuenta, `id_cliente` vacío), se usan el nombre y el
  celular que dictó por teléfono (`nombre_contacto`, `telefono_contacto`). Eso lo hace
  `COALESCE(c.nombre, p.nombre_contacto)`: "el primero que no esté vacío",
- el nombre, teléfono, placa y vehículo del **domiciliario** (`LEFT JOIN DOMICILIARIO`),
- el nombre del **ayudante de cocina** (`LEFT JOIN AYUDANTE_COCINA`).

`LEFT JOIN` = "tráelo si existe". Un pedido nuevo todavía no tiene domiciliario, y un pedido de un
invitado no tiene cliente registrado, y aun así deben aparecer.

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

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/Pedido.php`).
Lo cargan con `require_once`: `controllers/SyncController.php`, `models/PedidoService.php`. Dejan de funcionar:
  - `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.
  - `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).
  - `POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.
  - `PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.
  - `PATCH /api/orders/{id}/destination` → Domiciliario: no se guarda el destino que ubica en el mapa.
  - `PATCH /api/orders/{id}/preparing` → Cocina/Admin: el pedido no pasa a "En Preparación".
  - `PATCH /api/orders/{id}/ready` → Cocina/Admin: el pedido no pasa a "Listos".
  - `PATCH /api/orders/{id}/take` → Domiciliario: no puede tomar un pedido listo.
  - … y 8 más: `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}`, `GET /api/sync`.

**Si se borra un método:** sale `Call to undefined method Pedido::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `porRol()` | `OrderController::index()`, `SyncController::index()` | `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.<br>`GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `buscar()` | `OrderController::responderPedido()`, `OrderController::review()`, `PedidoService::crear()`, `PedidoService::crearManual()` | `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.<br>`PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.<br>`PATCH /api/orders/{id}/destination` → Domiciliario: no se guarda el destino que ubica en el mapa.<br>… y 7 más: `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`. |
| `buscarCrudo()` | `OrderController::buscarPedido()`, `OrderController::review()`, `PedidoService::cambiarDireccion()` | `PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.<br>`PATCH /api/orders/{id}/destination` → Domiciliario: no se guarda el destino que ubica en el mapa.<br>`PATCH /api/orders/{id}/preparing` → Cocina/Admin: el pedido no pasa a "En Preparación".<br>`PATCH /api/orders/{id}/ready` → Cocina/Admin: el pedido no pasa a "Listos".<br>… y 5 más: `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`. |
| `numeroDesdeId()` (privado) | `Pedido::buscar()`, `Pedido::buscarCrudo()` | `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.<br>`PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.<br>`PATCH /api/orders/{id}/destination` → Domiciliario: no se guarda el destino que ubica en el mapa.<br>… y 7 más: `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`. |
| `itemsDe()` | `Pedido::formar()` | `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.<br>`POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.<br>`PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.<br>… y 9 más: `PATCH /api/orders/{id}/destination`, `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `GET /api/sync`. |
| `formar()` (privado) | `Pedido::buscar()`, `Pedido::porRol()` | `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.<br>`POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.<br>`PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.<br>… y 9 más: `PATCH /api/orders/{id}/destination`, `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `GET /api/sync`. |
| `__construct()` | `new Pedido()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa Pedido. |

**Si se borra una constante** (`BASE`): sale `Undefined constant Pedido::NOMBRE` en lo que la usa.
