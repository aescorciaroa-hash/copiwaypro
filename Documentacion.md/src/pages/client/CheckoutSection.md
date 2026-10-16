# src/pages/client/CheckoutSection.tsx

## ¿Para qué sirve?
Es el **paso de pago**: el cliente confirma la dirección de entrega, elige cómo pagar (**digital** con
Nequi, Daviplata o Bancolombia, o **efectivo**), escribe su celular si es digital, decide si **usa sus
puntos** y confirma el pedido.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` cuando `activeTab === 'checkout'` | |
| → cambia | `userProfile.address` del padre (`setUserProfile`) | La dirección que se envía como `address` en `POST /api/orders`. |
| → cambia | `paymentMethod`, `digitalBank`, `paymentPhone` del padre | |
| → al confirmar | `handleCheckoutSubmit()` del padre | Pide confirmación y después hace el pago (ver `ClientDashboard.md`). |
| → volver | `setActiveTab('cart')` | |

## Props
| Prop | Qué es |
|---|---|
| `userProfile` / `setUserProfile` | Datos del cliente (dirección). |
| `cart`, `cartSubtotal`, `FLAT_SHIPPING_RATE`, `isBirthday`, `birthdayDiscount`, `cartTotal` | Resumen del pedido. |
| `paymentMethod` / `setPaymentMethod` | `'online'` o `'cash'`. |
| `digitalBank` / `setDigitalBank` | `'nequi'`, `'daviplata'` o `'bancolombia'`. |
| `paymentPhone` / `setPaymentPhone` | Celular del pago (los números de prueba están en `Documentacion.md/models/PagoService.md`). |
| `paymentStatus`, `simulationStep` | Estado del pago para mostrar en el botón. |
| `isStoreOpen`, `storeConfig` | Si está cerrado, avisa el horario. |
| `handleCheckoutSubmit` | Función del padre que inicia el pago. |
| `pointsRedemption` | Todo lo del canje de puntos (tipo `PointsRedemption`): `available` (saldo), `minimum` (mínimo para canjear), `pointValue` (pesos por punto), `canRedeem` (si alcanza el mínimo), `use` / `setUse` (la casilla "Usar mis puntos"), `redeemed` y `discount` (puntos y pesos que se descontarían). |

## Partes de la pantalla
| Parte | Qué muestra |
|---|---|
| Dirección de entrega | Campo con la dirección del perfil. |
| Método de pago | Botones Digital / Efectivo. En digital, los 3 bancos y el campo de celular. |
| Usar mis puntos | Casilla con el saldo de puntos. Si el cliente no alcanza el mínimo, aparece desactivada y dice desde cuántos puntos podrá canjear. |
| Resumen del pedido | Productos, subtotal, domicilio, descuento de cumpleaños (si aplica), puntos canjeados (si los usa) y total. Botón para confirmar. |

El descuento por puntos que se ve aquí es una **vista previa**: el servidor lo vuelve a calcular al
pagar (`PedidoService::calcular()`) con el saldo real, y nunca descuenta el domicilio.
