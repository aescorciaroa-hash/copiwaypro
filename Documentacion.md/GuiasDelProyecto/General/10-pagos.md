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
| Firma HMAC con `CLAVE_FIRMA` | Que alguien cambie el monto o la referencia entre el paso 1 y el 2. |
| La referencia lleva el id del cliente | Usar la referencia de otro cliente. |
| Se revisa de nuevo al crear el pedido | Crear un pedido con un pago rechazado o pendiente. |
| Una transacción = un pedido | Usar el mismo pago dos veces. |

## Archivos involucrados
| Archivo | Papel |
|---|---|
| `src/pages/ClientDashboard.tsx` (`payWithGateway`) | Ejecuta los 4 pasos. |
| `src/lib/pasarela.ts` | Crea la transacción y espera el resultado. |
| `src/pages/client/PaymentGatewayModal.tsx` | La ventana que ve el cliente. |
| `controllers/PaymentController.php` | Recibe las peticiones de pago. |
| `models/PagoService.php` | Firma, crea, consulta y verifica. |
| `models/PedidoService.php` | Verifica el pago antes de crear el pedido. |
| Tabla `PAGO_TRANSACCION` | Guarda cada transacción. |

## Pago por link (pedido manual)
Cuando el administrador registra un pedido por llamada o WhatsApp y elige **Link de pago**:
```
1. CREAR PEDIDO   Admin ── POST /api/orders/manual (paymentMode: 'link')
                  el pedido nace "esperando_pago" con un código secreto y vence en 30 minutos
                  (el inventario ya se descuenta, para apartar los productos)
2. ENVIAR LINK    Admin toca "Enviar por WhatsApp": se abre el chat del cliente con el link
                  /pagar?c=código
3. VER PEDIDO     Cliente abre el link ── GET /api/pay-link/{código}   (sin iniciar sesión)
4. PAGAR          Cliente elige banco ── POST /api/pay-link/{código}/transactions
                  PHP crea la transacción con el total GUARDADO en el pedido
5. ESPERAR        La página pregunta cada 1,5 s ── GET /api/pay-link/{código}/transactions/{id}
                  si quedó APPROVED, PHP pasa el pedido a "pendiente" (cocina) y guarda el banco
6. CÓDIGO         La página muestra el código de entrega (y la invitación si no tiene cuenta)
```
Si pasan los 30 minutos sin pagar, el pedido se **cancela solo** y se devuelve el inventario. No hay
una tarea programada: se revisa cada vez que una pantalla sincroniza (`SyncController`) o alguien abre
el link (`PedidoService::cancelarLinksVencidos()`).

| Protección | Qué evita |
|---|---|
| Código de 32 letras y números al azar | Que alguien adivine el link de otro pedido. |
| El total sale del pedido guardado | Pagar menos cambiando el precio en el navegador. |
| La transacción guarda el número del pedido | Usar el pago de un pedido para otro. |
| Solo se marca pagado si sigue "esperando_pago" | Cobrar dos veces el mismo pedido. |
| El código de entrega solo se muestra ya pagado | Recibir el pedido sin haberlo pagado. |

Archivos: `controllers/PaymentLinkController.php`, `models/PedidoService.php` (sección "Pago por link"),
`models/PagoService.php` (`crearTransaccionDePedido`), `src/pages/PagarPedido.tsx`,
`src/utils/mensajesWhatsApp.ts`.

### Si ya tenías la base de datos instalada
`sql/schema.sql` ya trae los cambios para una instalación nueva. En una base que ya existía hay que
ejecutar esto **una vez** (en HeidiSQL o phpMyAdmin):
```sql
ALTER TABLE PEDIDO
  MODIFY estado ENUM('esperando_pago','pendiente','en_preparacion','listo','en_camino','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  ADD COLUMN codigo_pago CHAR(32) NULL AFTER comprobante_pago,
  ADD COLUMN vence_pago DATETIME NULL AFTER codigo_pago,
  ADD UNIQUE KEY uq_pedido_codigo_pago (codigo_pago);
ALTER TABLE PAGO_TRANSACCION
  MODIFY id_cliente INT UNSIGNED NULL,
  ADD COLUMN id_pedido INT UNSIGNED NULL AFTER id_cliente,
  ADD FOREIGN KEY (id_pedido) REFERENCES PEDIDO(id_pedido);
```

## Cambiar a una pasarela real
La idea es reemplazar `PagoService.php` por uno que hable con la pasarela real (por ejemplo, la API
de Wompi), manteniendo los mismos métodos (`prepararCheckout`, `crearTransaccion`,
`obtenerTransaccion`, `verificarTransaccion`). El resto del sistema no tendría que cambiar.
