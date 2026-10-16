# src/lib/pasarela.ts

## ¿Para qué sirve?
Es la parte de React de la **pasarela de pagos de prueba**: crea la transacción y espera a que se
apruebe o rechace.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `pages/ClientDashboard.tsx` | Cuando el cliente paga con Nequi, Daviplata o Bancolombia. |
| → llama a | `POST /api/payments/transactions` y `GET /api/payments/transactions/{id}` | `PaymentController.php` → `PagoService.php`. |
| ← el tipo `DatosCheckout` lo usa | `store/almacenAplicacion.ts` (`prepareOnlinePayment`) | Lo que devuelve `POST /api/payments/prepare`. |

## Tipos
| Tipo | Qué describe |
|---|---|
| `DatosCheckout` | Lo que entrega el servidor antes de pagar: moneda, centavos, referencia, firma, total. |
| `EstadoTransaccion` | `'PENDING' \| 'APPROVED' \| 'DECLINED' \| 'ERROR'` (solo esos 4 valores). |
| `TransaccionPago` | La transacción que responde PHP (`PagoService::obtenerTransaccion()`). |

## Funciones
### `crearTransaccion(datos, method, phone)`
Envía a PHP la referencia, los centavos y la **firma** que el mismo servidor generó, más el método y el
celular. PHP revisa que la firma coincida (así nadie puede cambiar el monto en el navegador).

### `esperarResultado(id)`
```ts
let tx = await api.get(...);
for (let i = 0; i < 40 && tx.status === 'PENDING'; i++) {
  await esperar(1000);
  tx = await api.get(...);
}
return tx;
```
Pregunta el estado **cada segundo**, máximo 40 veces, mientras siga `PENDING`.
`esperar(ms)` es una pausa: crea una promesa que se cumple después de esos milisegundos (`setTimeout`).
