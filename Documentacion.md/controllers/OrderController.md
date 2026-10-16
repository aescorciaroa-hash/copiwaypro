# controllers/OrderController.php

## ¿Para qué sirve?
Maneja los **pedidos**: listarlos, crearlos (checkout del cliente y pedido manual del
administrador), moverlos de estado (cocina y domiciliario), corregir su dirección, guardar el
destino en el mapa y calificarlos.

## Ciclo de vida de un pedido
```
Pendiente ──(cocina)──► En Preparación ──(cocina)──► Listos ──(domiciliario toma/acepta)──► En Camino ──(PIN)──► Entregado
```

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
| `GET /api/orders` | `index` | todos | `AdminDashboard.tsx` y `/api/sync` (clave `orders`) |
| `POST /api/orders` | `store` | cliente | `almacenAplicacion.ts` (`addOrder`) ← `ClientDashboard.tsx` |
| `POST /api/orders/manual` | `storeManual` | admin | `almacenAplicacion.ts` (`addManualOrder`) ← `AdminDashboard.tsx` (Ingreso de Orden Manual) |
| `PATCH /api/orders/{id}/address` | `updateAddress` | admin | `almacenAplicacion.ts` (`updateOrderAddress`) ← `AdminDashboard.tsx` (Editar Dirección) |
| `PATCH /api/orders/{id}/destination` | `updateDestination` | domiciliario | `almacenAplicacion.ts` (`saveOrderDestination`) ← `DeliveryDashboard.tsx` |
| `PATCH /api/orders/{id}/preparing` | `markPreparing` | admin, cocina | `almacenAplicacion.ts` (`updateOrderStatus`) ← `KitchenDashboard.tsx`, `AdminDashboard.tsx` |
| `PATCH /api/orders/{id}/ready` | `markReady` | admin, cocina | `almacenAplicacion.ts` (`updateOrderStatus`) ← `KitchenDashboard.tsx`, `AdminDashboard.tsx` |
| `PATCH /api/orders/{id}/take` | `take` | domiciliario | `almacenAplicacion.ts` (`takeOrder`) ← `DeliveryDashboard.tsx` |
| `PATCH /api/orders/{id}/release` | `release` | domiciliario, admin | `almacenAplicacion.ts` (`releaseOrder`) ← `DeliveryDashboard.tsx`, `admin/OrdersSection.tsx` |
| `PATCH /api/orders/{id}/accept` | `accept` | domiciliario | `almacenAplicacion.ts` (`updateOrderStatus` con estado "En Camino") ← `DeliveryDashboard.tsx` |
| `PATCH /api/orders/{id}/deliver` | `deliver` | domiciliario | `almacenAplicacion.ts` (`confirmDelivery`) ← `DeliveryDashboard.tsx` |
| `PATCH /api/orders/{id}/review` | `review` | cliente | `almacenAplicacion.ts` (`updateOrder` con `rating`) ← `client/HistorySection.tsx`, `ClientDashboard.tsx` |

| Usa | Para qué |
|---|---|
| `Pedido` (modelo) | Buscar y listar pedidos. |
| `PedidoService` | Crear pedidos y hacer los cambios de estado (las reglas del negocio). |
| `Auth` | Quién es y qué rol tiene. |

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$id` | Id del pedido. Puede venir como `#ORD-12` o `12`. |
| `$this->datos` | En `store`: `items`, `address`, `paymentMethod`, `lat`, `lng`, `paymentTransactionId`, `usePoints` (pagar parte con puntos)... En `storeManual`: `items`, `clientName`, `clientPhone`, `address`, `channel` (`llamada` o `whatsapp`). |
| `$idAyudante` | Si quien cambia el estado es de cocina, su id (para guardar quién preparó el pedido). |
| `$pin` | En `deliver`: el PIN que el cliente le dice al domiciliario. |

## Los cambios de estado
Todos los cambios de estado (`markPreparing`, `markReady`, `take`, `release`, `accept`, `deliver`,
`updateAddress`, `updateDestination`) siguen los mismos pasos:
```php
$pedido = $this->buscarPedido($id);
try {
    $this->pedidoService->marcarListo($pedido['id_pedido'], $idAyudante);
} catch (Exception $e) {
    responderError($e->getMessage(), 409);
}
$this->responderPedido($id);
```
1. `buscarPedido($id)` (método privado) busca el pedido con `buscarCrudo`. Si no existe → **404**.
2. Se llama al método de `PedidoService` que hace el cambio (`marcarPreparando`, `marcarListo`,
   `tomarPedido`, `liberarPedido`, `aceptarEntrega`, `confirmarEntrega`, `cambiarDireccion` o
   `guardarDestino`).
3. Si el servicio lanza un error (ej: "Transición de estado no permitida") → **409**.
4. `responderPedido($id)` (método privado) responde el pedido actualizado.

## Acciones
- **`index`**: pedidos según el rol (el admin y la cocina ven todos; el domiciliario los suyos y los disponibles; el cliente solo los suyos).
- **`store`**: valida `items`, `address` y `paymentMethod` (`cash` u `online`). Después `PedidoService::crear()` hace todo lo demás. Errores:
  - tienda cerrada o pausada → **403**
  - pago rechazado → **402**
  - datos inválidos (`InvalidArgumentException`) → **422**
  - otros (sin stock, pago ya usado...) → **409**
- **`storeManual`**: pedido que llega por llamada o WhatsApp. Valida que haya productos, nombre,
  celular (mínimo 7 dígitos) y dirección (si falta algo → **422**). Después
  `PedidoService::crearManual()` busca al cliente por su celular: si está registrado, el pedido queda
  en su cuenta; si no, queda como **cliente invitado**. Se paga en efectivo al entregar. Tienda
  cerrada o pausada → **403**; sin stock → **409**.
- **`updateAddress`**: el admin corrige la dirección de un pedido que aún no se entrega (llama a
  `cambiarDireccion()` del servicio). Dirección vacía → **422**; pedido ya entregado → **409**.
- **`updateDestination`**: el domiciliario guarda las coordenadas (`lat`, `lng`) del destino que ubicó
  en su mapa, para que el administrador vea la ruta. Solo cambia pedidos asignados a él.
- **`markPreparing`**, **`markReady`**, **`take`**, **`release`**, **`accept`**: los cambios de estado de arriba.
- **`deliver`**: exige el PIN; si está vacío → **422**.
- **`review`**: el cliente califica de 1 a 5 un pedido **suyo** y ya **entregado**.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `GET /api/orders`, `POST /api/orders`, `POST /api/orders/manual`, `PATCH /api/orders/{id}/address`, `PATCH /api/orders/{id}/destination`, `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`. | `Failed to open stream: No such file or directory` (…`controllers/OrderController.php`) |
| La línea `require_once __DIR__ . '/../models/PedidoService.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Pedido" not found` |
| El método `index()` | Admin: después de confirmar el cierre de caja no se recargan las comandas. | `Call to undefined method OrderController::index()` (500) |
| La rama `$accion === 'index'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'GET /api/orders'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `store()` | Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout). | `Call to undefined method OrderController::store()` (500) |
| La rama `$accion === 'store'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/orders'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `storeManual()` | Admin: no se pueden registrar pedidos por llamada o WhatsApp. | `Call to undefined method OrderController::storeManual()` (500) |
| La rama `$accion === 'storeManual'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/orders/manual'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `updateAddress()` | Admin: no se puede corregir la dirección de un pedido. | `Call to undefined method OrderController::updateAddress()` (500) |
| La rama `$accion === 'updateAddress'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/address'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `updateDestination()` | Domiciliario: no se guarda el destino que ubica en el mapa. | `Call to undefined method OrderController::updateDestination()` (500) |
| La rama `$accion === 'updateDestination'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/destination'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `markPreparing()` | Cocina/Admin: el pedido no pasa a "En Preparación". | `Call to undefined method OrderController::markPreparing()` (500) |
| La rama `$accion === 'markPreparing'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/preparing'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `markReady()` | Cocina/Admin: el pedido no pasa a "Listos". | `Call to undefined method OrderController::markReady()` (500) |
| La rama `$accion === 'markReady'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/ready'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `take()` | Domiciliario: no puede tomar un pedido listo. | `Call to undefined method OrderController::take()` (500) |
| La rama `$accion === 'take'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/take'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `release()` | Domiciliario/Admin: no se puede soltar o reasignar un pedido. | `Call to undefined method OrderController::release()` (500) |
| La rama `$accion === 'release'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/release'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `accept()` | Domiciliario: el pedido no pasa a "En Camino". | `Call to undefined method OrderController::accept()` (500) |
| La rama `$accion === 'accept'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/accept'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `deliver()` | Domiciliario: no puede confirmar la entrega con el PIN. | `Call to undefined method OrderController::deliver()` (500) |
| La rama `$accion === 'deliver'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/deliver'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `review()` | Cliente → Historial: no puede calificar un pedido. | `Call to undefined method OrderController::review()` (500) |
| La rama `$accion === 'review'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/orders/{id}/review'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método privado `buscarPedido()` | `PATCH /api/orders/{id}/address`, `PATCH /api/orders/{id}/destination`, `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`. | `Call to undefined method OrderController::buscarPedido()` (500) |
| El método privado `responderPedido()` | `PATCH /api/orders/{id}/address`, `PATCH /api/orders/{id}/destination`, `PATCH /api/orders/{id}/preparing`, `PATCH /api/orders/{id}/ready`, `PATCH /api/orders/{id}/take`, `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`. | `Call to undefined method OrderController::responderPedido()` (500) |
| La línea `$this->pedidoModel = ...` del constructor | Las acciones que usan `$this->pedidoModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->pedidoService = ...` del constructor | Las acciones que usan `$this->pedidoService`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
