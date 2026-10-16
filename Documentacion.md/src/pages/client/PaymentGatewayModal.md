# src/pages/client/PaymentGatewayModal.tsx

## ¿Para qué sirve?
Es la **ventana de la pasarela de pago** que aparece mientras se paga con Nequi, Daviplata o
Bancolombia. Muestra el banco, el monto, la referencia y una barra de progreso con los pasos:
conectando → esperando aprobación → verificando → aprobado (o rechazado).

Solo **muestra** el estado; el pago real lo hace `payWithGateway()` en `ClientDashboard.tsx`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` | Le pasa el paso actual (`gatewayStep`), el banco, el celular, el monto y la referencia. |
| ← la referencia viene de | `POST /api/payments/prepare` → `PagoService::prepararCheckout()` | |
| → exporta el tipo | `GatewayStep` | Lo usa `ClientDashboard.tsx` para su estado. |

## El tipo `GatewayStep`
`'idle' | 'connecting' | 'waiting' | 'verifying' | 'approved' | 'declined'`
Con `'idle'` la ventana está cerrada.

## Props
| Prop | Qué es |
|---|---|
| `step` | Paso actual. |
| `bank` | Banco elegido (cambia el color y el logo: `BankBrand`). |
| `phone` | Celular del pago. |
| `amount` | Total a pagar. |
| `reference` | Referencia que dio el servidor. |
| `declineReason` | Motivo del rechazo. |

## Variables
| Variable | Qué es |
|---|---|
| `referenciaLocal` | Si todavía no llegó la referencia del servidor, muestra una provisional (`COP-123456`) que se crea al empezar cada intento. |
| `reference` | La del servidor si existe; si no, la provisional. |
| `pasoActualIndex` | En qué punto de la barra de progreso va. |
| `fallo` | `true` si el pago fue rechazado. |
