# src/pages/client/CheckoutSection.tsx

## ¿Para qué sirve?
Es el **paso de pago**: el cliente confirma la dirección de entrega, elige cómo pagar (**digital** con
Nequi, Daviplata o Bancolombia, o **efectivo**), escribe su celular si es digital y confirma el pedido.

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
| `paymentPhone` / `setPaymentPhone` | Celular del pago (los números de prueba están en `documentacion.md/app/Services/PagoService.md`). |
| `paymentStatus`, `simulationStep` | Estado del pago para mostrar en el botón. |
| `isStoreOpen`, `storeConfig` | Si está cerrado, avisa el horario. |
| `handleCheckoutSubmit` | Función del padre que inicia el pago. |

## Partes de la pantalla
| Parte | Qué muestra |
|---|---|
| Dirección de entrega | Campo con la dirección del perfil. |
| Método de pago | Botones Digital / Efectivo. En digital, los 3 bancos y el campo de celular. |
| Resumen del pedido | Productos, subtotal, descuento de cumpleaños (si aplica), domicilio y total. Botón para confirmar. |
