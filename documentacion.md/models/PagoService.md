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
