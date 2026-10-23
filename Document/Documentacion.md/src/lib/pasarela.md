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

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../pasarela"` porque lo importan: `src/pages/ClientDashboard.tsx`, `src/store/almacenAplicacion.ts`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
