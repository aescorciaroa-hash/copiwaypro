# controllers/PaymentController.php

## ¿Para qué sirve?
Maneja los **pagos digitales de prueba** (Nequi, Daviplata, Bancolombia). No cobra dinero real:
imita cómo funciona una pasarela como Wompi.

## Flujo completo
```
1. prepare            → el servidor calcula el total y entrega referencia + firma
2. createTransaction  → se crea la transacción (queda "PENDING")
3. showTransaction    → React pregunta varias veces hasta que deje de estar PENDING
4. POST /api/orders   → el pedido se crea solo si la transacción quedó APPROVED
```

## ¿Con qué se conecta?
| Ruta | Método | React |
|---|---|---|
| `POST /api/payments/prepare` | `prepare` | `almacenAplicacion.ts` (`prepareOnlinePayment`) ← `ClientDashboard.tsx` |
| `POST /api/payments/transactions` | `createTransaction` | `crearTransaccion()` de `src/lib/pasarela.ts` ← `ClientDashboard.tsx` (mientras se muestra `client/PaymentGatewayModal.tsx`) |
| `GET /api/payments/transactions/{id}` | `showTransaction` | `esperarResultado()` de `src/lib/pasarela.ts` ← `ClientDashboard.tsx` |

| Usa | Para qué |
|---|---|
| `PedidoService::cotizar()` | Calcular el total **en el servidor** (nunca se confía en el precio que manda el navegador). |
| `PagoService` | Crear, firmar y consultar transacciones. |

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$total` | Total del carrito calculado por el servidor. |
| `$referencia` | Código único del pago (ej: `CW-4-1760000000-A1B2C3`). |
| `$centavos` | El total en centavos (`36000` pesos → `3600000`). |
| `$firma` | Código que demuestra que el monto y la referencia los generó el servidor. |
| `$metodo` | `nequi`, `daviplata` o `bancolombia`. |
| `$telefono` | Celular del pago. Hay números de prueba (ver `PagoService.md`). |

## Acciones
- **`prepare`**: exige `items`. Calcula el total y devuelve referencia, centavos, firma y total. Si la tienda está cerrada → **403**.
- **`createTransaction`**: crea la transacción. Si la firma no coincide o el celular no es válido → **422**. Si todo está bien → **201**.
- **`showTransaction`**: devuelve el estado. Solo el dueño puede verla; si no → **404**.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}`. | `Failed to open stream: No such file or directory` (…`controllers/PaymentController.php`) |
| La línea `require_once __DIR__ . '/../models/PedidoService.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "PedidoService" not found` |
| El método `prepare()` | Cliente: el pago en línea no arranca (paso 1 de la pasarela). | `Call to undefined method PaymentController::prepare()` (500) |
| La rama `$accion === 'prepare'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/payments/prepare'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `createTransaction()` | Cliente: la pasarela no crea la transacción (paso 2). | `Call to undefined method PaymentController::createTransaction()` (500) |
| La rama `$accion === 'createTransaction'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/payments/transactions'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `showTransaction()` | Cliente: la pasarela no sabe si el pago fue aprobado (paso 3). | `Call to undefined method PaymentController::showTransaction()` (500) |
| La rama `$accion === 'showTransaction'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'GET /api/payments/transactions/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| La línea `$this->pedidoService = ...` del constructor | Las acciones que usan `$this->pedidoService`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->pagoService = ...` del constructor | Las acciones que usan `$this->pagoService`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
