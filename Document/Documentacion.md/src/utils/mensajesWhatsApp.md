# src/utils/mensajesWhatsApp.ts

## ¿Para qué sirve?
Arma los **mensajes de WhatsApp** del pedido manual y abre el chat del cliente con el mensaje ya
escrito. No necesita ningún servicio pago: usa el enlace `https://wa.me/57...?text=...`, que abre
WhatsApp (web o la app) en el computador del administrador. Él solo le da **enviar**.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `AdminDashboard.tsx` | Vista "Pedido Registrado" y detalle del pedido (reenviar). |
| → usa | `formatCOP` (`lib/format.ts`), `rutaBase` (`servicios/api.ts`) | Precios y direcciones de la app. |

## Funciones
| Función | Qué hace |
|---|---|
| `urlLinkPago(codigo)` | Arma la dirección del link de pago: `https://.../pagar?c=código`. |
| `abrirWhatsApp(telefono, mensaje)` | Abre el chat del cliente con el mensaje escrito. Si el celular tiene 10 números, le pone el `57` de Colombia adelante. |
| `invitacionRegistro(puntos)` | Texto que invita a registrarse, con los puntos que se habría ganado y los beneficios. |
| `mensajeLinkPago(order)` | Mensaje con el **link de pago**: saludo, productos, total, link y a qué hora vence. Si es invitado, le suma la invitación. |
| `mensajeConfirmacionEfectivo(order)` | Mensaje de un pedido en **efectivo**: productos, total a pagar, dirección y el **código de entrega**. Si es invitado, le suma la invitación. |

## Ejemplo (pedido en efectivo de un invitado)
```
Hola Andrés 👋
Tu pedido *#ORD-15* de *CopiwayPRO* ya está en cocina 🍔

• 1x Street Food

*Total a pagar en efectivo: $ 36.000*
📍 Calle 18 Sur #36-52

🔐 Tu código de entrega es *4821*. Dáselo al domiciliario cuando llegue.

🎁 *¿Sabías que con este pedido te habrías ganado 36 puntos?*
Regístrate gratis en CopiwayPRO con este mismo celular y obtén:
⭐ Puntos en cada compra para canjear por descuentos
🎂 15% de descuento el día de tu cumpleaños
📍 Seguimiento de tu pedido en tiempo real
👉 https://.../register
```
Los `*` ponen el texto en **negrita** dentro de WhatsApp.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../mensajesWhatsApp"` porque lo importa: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |

El pedido manual se sigue guardando: lo único que se pierde es el botón que abre WhatsApp con el mensaje ya escrito.
