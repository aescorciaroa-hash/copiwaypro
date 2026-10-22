# src/pages/PagarPedido.tsx

## ¿Para qué sirve?
Es la página del **link de pago** (`/pagar?c=código`). La abre el cliente de un pedido manual desde
el mensaje de WhatsApp para pagar con Nequi, Daviplata o Bancolombia **sin iniciar sesión**. Al pagar,
le muestra su **código de entrega**. Si no tiene cuenta, lo invita a registrarse.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="pagar"` (`views/paginas/pagar.php`) | |
| ← el código del link | la dirección: `?c=...` (`URLSearchParams`) | Saber qué pedido es. |
| → pide | `GET /api/pay-link/{código}` (`PaymentLinkController::show`) | Los datos del pedido. |
| → pide | `POST /api/pay-link/{código}/transactions` (`PaymentLinkController::pay`) | Empezar el pago. |
| → pide | `GET /api/pay-link/{código}/transactions/{id}` (`PaymentLinkController::status`) | Saber si se aprobó. |
| → usa | `api`, `irA` (`servicios/api.ts`), `formatCOP` (`lib/format.ts`) | |

## Diseño
- Arriba, una franja naranja con el logo, el aviso **"Pago seguro"** y el saludo.
- **Computador:** arriba, dos columnas del **mismo alto**: a la izquierda el pedido (con la **foto** de
  cada producto) y a la derecha el pago (o el código de entrega). Debajo, a todo el ancho, **"¿Qué
  sigue?"** (4 pasos en fila, solo si ya pagó) y la **invitación** a registrarse en una sola franja.
- **Celular:** una sola columna. Primero el pago (o el código), después el pedido, los pasos y la invitación.
- Los extras repetidos se ven juntos (ej. "+ Tocino crujiente x2", con `agruparPorNombre`).
- La cuenta regresiva se pone **roja** cuando faltan menos de 5 minutos.
- La foto llega del servidor en `image` (`PedidoService::pedidoPorLink`).

## Lo que ve el cliente
| Estado del pedido | Qué se muestra |
|---|---|
| Cargando | Un círculo girando: "Cargando tu pedido...". |
| `esperando_pago` | "Paga tu pedido", la **cuenta regresiva** (ej. 29:56), los 3 bancos, el celular de la cuenta y el botón **Pagar $...**. Abajo: "Pago de prueba: no se cobra dinero real". |
| `pagado` | "¡Pago aprobado!" con el total y el banco, el **código de entrega** grande, y la tarjeta **"¿Qué sigue?"** con los pasos hasta la entrega (pago recibido → preparamos tu pedido → va en camino → lo recibes con el código). |
| `vencido` (o la cuenta llegó a 0) | "Este link ya venció": el pedido se canceló. |
| Código malo | "Link no válido". |

Siempre se ve el **resumen del pedido** (productos, domicilio, total y dirección). Si el cliente es
**invitado** (`isGuest`), sale la tarjeta naranja: *"Con este pedido te habrías ganado N puntos"*, los
beneficios (puntos, 15 % en el cumpleaños, seguimiento) y el botón **Crear mi cuenta** (`/register`).

## Variables (estado)
| Variable | Qué guarda |
|---|---|
| `codigo` | El código del link (de `?c=`). |
| `pedido` | Los datos del pedido que mandó el servidor (`PedidoLink`). |
| `error` | El mensaje si el link no existe. |
| `metodo` | Banco elegido: `'nequi'`, `'daviplata'` o `'bancolombia'`. |
| `telefono` | El celular de la cuenta (Bancolombia no lo pide). |
| `pagando` | `true` mientras se espera la aprobación. |
| `mensajePago` | El error del pago (rechazado, celular malo...). |
| `ahora` | La hora actual; cambia cada segundo para la cuenta regresiva. |

## Funciones
| Función | Qué hace |
|---|---|
| `cargar()` | Pide el pedido al servidor y lo guarda en `pedido`. |
| `pagar()` | Revisa el celular (10 números que empiezan por 3), crea el pago y pregunta cada 1,5 segundos hasta que deje de estar `PENDING`. Si quedó `APPROVED`, vuelve a cargar el pedido (ya trae el código de entrega). Si no, muestra el error. |
| `Tarjeta` | Cuadro blanco redondeado (o oscuro en modo oscuro) donde va cada parte. |
| `Paso` | Un paso de "¿Qué sigue?": verde si ya pasó, naranja el actual, gris los que faltan. |
| `Beneficio` | Cuadrito de cada beneficio de la invitación (ícono + texto). |
| `Aviso` | Ícono + título + texto de los estados (aprobado, vencido, link no válido). |

## Celulares de prueba
Los mismos de la pasarela: `3991111111` aprobado, `3992222222` rechazado, `3993333333` error
(ver [Pagos de prueba](../../GuiasDelProyecto/General/10-pagos.md)).
