# 10. Pagos de prueba

## Qué es
El sistema tiene una **pasarela de pagos de prueba** (sandbox): funciona igual que una pasarela real
(como **Wompi**), pero **no cobra dinero**. Sirve para probar todo el flujo y, el día de mañana,
cambiarla por una real sin tocar el resto del sistema.

Métodos: **Nequi**, **Daviplata** y **Bancolombia**. También se puede pagar en **efectivo** (se cobra
al entregar).

## Cómo funciona (paso a paso)
```
1. PREPARAR      React ── POST /api/payments/prepare ──► PHP calcula el total del carrito
                                                         y devuelve referencia + monto + FIRMA
2. CREAR         React ── POST /api/payments/transactions ──► PHP revisa la firma
                                                              crea la transacción en estado PENDING
3. ESPERAR       React pregunta cada segundo ── GET /api/payments/transactions/{id}
                 después de 4 segundos pasa a APPROVED, DECLINED o ERROR
4. CREAR PEDIDO  si quedó APPROVED ── POST /api/orders con el id de la transacción
                 PHP vuelve a revisar: aprobada, mismo monto, del mismo cliente y sin usar antes
```
Mientras tanto, el cliente ve la ventana de la pasarela (`PaymentGatewayModal.tsx`) con los pasos:
conectando → esperando aprobación → verificando → aprobado (o rechazado).

## Celulares de prueba
| Celular | Resultado |
|---|---|
| `3991111111` | ✅ Aprobado |
| `3992222222` | ❌ Rechazado |
| `3993333333` | ⚠️ Error |
| Cualquier otro celular válido (10 dígitos, empieza en 3) | ✅ Aprobado |

Con Bancolombia el celular no es obligatorio.

## Por qué es seguro (aunque sea de prueba)
| Protección | Qué evita |
|---|---|
| El servidor calcula el total | Que alguien pague menos cambiando el precio en el navegador. |
| Firma HMAC con `APP_KEY` | Que alguien cambie el monto o la referencia entre el paso 1 y el 2. |
| La referencia lleva el id del cliente | Usar la referencia de otro cliente. |
| Se revisa de nuevo al crear el pedido | Crear un pedido con un pago rechazado o pendiente. |
| Una transacción = un pedido | Usar el mismo pago dos veces. |

## Archivos involucrados
| Archivo | Papel |
|---|---|
| `src/pages/ClientDashboard.tsx` (`payWithGateway`) | Ejecuta los 4 pasos. |
| `src/lib/pasarela.ts` | Crea la transacción y espera el resultado. |
| `src/pages/client/PaymentGatewayModal.tsx` | La ventana que ve el cliente. |
| `app/Controllers/PaymentController.php` | Recibe las peticiones de pago. |
| `app/Services/PagoService.php` | Firma, crea, consulta y verifica. |
| `app/Services/PedidoService.php` | Verifica el pago antes de crear el pedido. |
| Tabla `PAGO_TRANSACCION` | Guarda cada transacción. |

## Cambiar a una pasarela real
La idea es reemplazar `PagoService.php` por uno que hable con la pasarela real (por ejemplo, la API
de Wompi), manteniendo los mismos métodos (`prepararCheckout`, `crearTransaccion`,
`obtenerTransaccion`, `verificarTransaccion`). El resto del sistema no tendría que cambiar.
