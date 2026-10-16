# models/PagoService.php

## ¿Para qué sirve?
Es una **pasarela de pagos de prueba**: imita cómo funciona Wompi (referencia, firma, transacción que
queda pendiente y luego se aprueba o rechaza) **sin cobrar dinero real**. Así, más adelante se puede
cambiar por una pasarela real sin cambiar el resto del sistema.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `PaymentController.php` | Preparar, crear y consultar transacciones. |
| ← lo usa | `PedidoService.php` | `verificarTransaccion()` antes de crear un pedido pagado. |
| → usa | Su constante `CLAVE_FIRMA` | La clave secreta para firmar. |
| → tabla | `PAGO_TRANSACCION` | |
| ← en React | `src/lib/pasarela.ts` (llamado desde `ClientDashboard.tsx`) y `client/PaymentGatewayModal.tsx` | La ventana de pago. |

## Constantes
| Constante | Valor | Para qué |
|---|---|---|
| `MONEDA` | `'COP'` | Pesos colombianos. |
| `SEGUNDOS_PENDIENTE` | `4` | Segundos que la transacción queda "PENDING" (simula que el cliente aprueba en su celular). |

## Celulares de prueba
| Celular | Resultado |
|---|---|
| `3991111111` | Aprobado |
| `3992222222` | Rechazado |
| `3993333333` | Error |
| Cualquier otro | Aprobado |

## Métodos
| Método | Qué hace |
|---|---|
| `firmar($referencia, $centavos, $idCliente)` (privado) | `hash_hmac('sha256', ...)`: crea una firma con la clave secreta `CLAVE_FIRMA`. Si alguien cambia el monto en el navegador, la firma ya no coincide. |
| `prepararCheckout($total, $idCliente)` | Convierte el total a centavos, crea una referencia única (`CW-idCliente-tiempo-aleatorio`) y la firma. |
| `crearTransaccion(...)` | Valida la firma, la referencia, el método y el celular. Si todo está bien, crea la transacción en estado `PENDING` con su `estado_final` según el celular. |
| `obtenerTransaccion($id, $idCliente)` | Lee la transacción. Si ya pasaron 4 segundos y sigue `PENDING`, la cambia a su estado final. |
| `mensaje($estado)` (privado) | Texto para mostrar: "Transacción aprobada.", etc. |
| `verificarTransaccion($id, $total, $idCliente)` | La usa `PedidoService`: revisa formato del id, que exista, que esté `APPROVED` y que el monto sea el mismo. Si algo falla, lanza un error con un mensaje claro. |

## Variables importantes
| Variable | Qué es |
|---|---|
| `$centavos` | El total × 100 (las pasarelas trabajan en centavos). |
| `$referencia` | Código único del pago. |
| `$final` | A qué estado pasará la transacción (según el celular de prueba). |
| `$id` | `'sbx-'` + 16 caracteres al azar. `sbx` = *sandbox* (prueba). |
| `$row['segundos']` | `TIMESTAMPDIFF(SECOND, creado_en, NOW())`: segundos desde que se creó. |

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/PagoService.php`).
Lo cargan con `require_once`: `models/PedidoService.php`. Dejan de funcionar:
  - `GET /api/orders` → Admin: después de confirmar el cierre de caja no se recargan las comandas.
  - `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).
  - `POST /api/orders/manual` → Admin: no se pueden registrar pedidos por llamada o WhatsApp.
  - `PATCH /api/orders/{id}/address` → Admin: no se puede corregir la dirección de un pedido.
  - `PATCH /api/orders/{id}/destination` → Domiciliario: no se guarda el destino que ubica en el mapa.
  - `PATCH /api/orders/{id}/preparing` → Cocina/Admin: el pedido no pasa a "En Preparación".
  - `PATCH /api/orders/{id}/ready` → Cocina/Admin: el pedido no pasa a "Listos".
  - `PATCH /api/orders/{id}/take` → Domiciliario: no puede tomar un pedido listo.
  - … y 7 más: `PATCH /api/orders/{id}/release`, `PATCH /api/orders/{id}/accept`, `PATCH /api/orders/{id}/deliver`, `PATCH /api/orders/{id}/review`, `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}`.

**Si se borra un método:** sale `Call to undefined method PagoService::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `firmar()` (privado) | `PagoService::crearTransaccion()`, `PagoService::prepararCheckout()` | `POST /api/payments/prepare` → Cliente: el pago en línea no arranca (paso 1 de la pasarela).<br>`POST /api/payments/transactions` → Cliente: la pasarela no crea la transacción (paso 2). |
| `prepararCheckout()` | `PaymentController::prepare()` | `POST /api/payments/prepare` → Cliente: el pago en línea no arranca (paso 1 de la pasarela). |
| `crearTransaccion()` | `PaymentController::createTransaction()` | `POST /api/payments/transactions` → Cliente: la pasarela no crea la transacción (paso 2). |
| `obtenerTransaccion()` | `PagoService::crearTransaccion()`, `PagoService::verificarTransaccion()`, `PaymentController::showTransaction()` | `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/payments/transactions` → Cliente: la pasarela no crea la transacción (paso 2).<br>`GET /api/payments/transactions/{id}` → Cliente: la pasarela no sabe si el pago fue aprobado (paso 3). |
| `mensaje()` (privado) | `PagoService::obtenerTransaccion()` | `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout).<br>`POST /api/payments/transactions` → Cliente: la pasarela no crea la transacción (paso 2).<br>`GET /api/payments/transactions/{id}` → Cliente: la pasarela no sabe si el pago fue aprobado (paso 3). |
| `verificarTransaccion()` | `PedidoService::crear()` | `POST /api/orders` → Cliente: no puede hacer pedidos (botón "Confirmar pedido" del checkout). |
| `__construct()` | `new PagoService()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa PagoService. |

**Si se borra una constante** (`MONEDA`, `CLAVE_FIRMA`, `SEGUNDOS_PENDIENTE`): sale `Undefined constant PagoService::NOMBRE` en lo que la usa.
