# app/Controllers/PaymentController.php

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
| Ruta | `$action` | React |
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
