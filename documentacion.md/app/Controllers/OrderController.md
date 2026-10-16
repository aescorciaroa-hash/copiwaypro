# app/Controllers/OrderController.php

## ¿Para qué sirve?
Maneja los **pedidos**: listarlos, crearlos (checkout del cliente), moverlos de estado (cocina y
domiciliario) y calificarlos.

## Ciclo de vida de un pedido
```
Pendiente ──(cocina)──► En Preparación ──(cocina)──► Listos ──(domiciliario toma/acepta)──► En Camino ──(PIN)──► Entregado
```

## ¿Con qué se conecta?
| Ruta | `$action` | Quién | React |
|---|---|---|---|
| `GET /api/orders` | `index` | todos | `AdminDashboard.tsx` y `/api/sync` (clave `orders`) |
| `GET /api/orders/{id}` | `show` | todos | — |
| `POST /api/orders` | `store` | cliente | `almacenAplicacion.ts` (`addOrder`) ← `ClientDashboard.tsx` |
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
| `$datos` | En `store`: `items`, `address`, `paymentMethod`, `lat`, `lng`, `paymentTransactionId`... |
| `$idAyudante` | Si quien cambia el estado es de cocina, su id (para guardar quién preparó el pedido). |
| `$pin` | En `deliver`: el PIN que el cliente le dice al domiciliario. |

## La función `cambiarEstado($id, $metodo, ...$argumentos)`
Todos los cambios de estado funcionan igual, así que se juntaron en una sola función:
```php
cambiarEstado($id, 'marcarPreparando', $idAyudante);
```
1. Busca el pedido (`buscarCrudo`). Si no existe → **404**.
2. Llama al método de `PedidoService` cuyo nombre está en `$metodo`:
   ```php
   $pedidoService->$metodo($pedido['id_pedido'], ...$argumentos);
   ```
   - `$pedidoService->$metodo(...)` llama al método **por su nombre guardado en la variable**
     (si `$metodo = 'marcarListo'`, es igual a `$pedidoService->marcarListo(...)`).
   - `...$argumentos` = "todos los demás parámetros que me pasen". Se reciben como arreglo y se
     reenvían igual.
3. Si el servicio lanza un error (ej: "Transición de estado no permitida") → **409**.
4. Responde el pedido actualizado.

## Acciones
- **`index`**: pedidos según el rol (el admin y la cocina ven todos; el domiciliario los suyos y los disponibles; el cliente solo los suyos).
- **`show`**: un pedido, con la misma regla de visibilidad. Si no le corresponde verlo → **404**.
- **`store`**: valida `items`, `address` y `paymentMethod` (`cash` u `online`). Después `PedidoService::crear()` hace todo lo demás. Errores:
  - tienda cerrada o pausada → **403**
  - pago rechazado → **402**
  - datos inválidos (`InvalidArgumentException`) → **422**
  - otros (sin stock, pago ya usado...) → **409**
- **`markPreparing`**, **`markReady`**, **`take`**, **`release`**, **`accept`**: usan `cambiarEstado()`.
- **`deliver`**: exige el PIN; si está vacío → **422**.
- **`review`**: el cliente califica de 1 a 5 un pedido **suyo** y ya **entregado**.
