# src/pages/KitchenDashboard.tsx

## ¿Para qué sirve?
Es el **panel de cocina** (`/kitchen`), también llamado KDS (*Kitchen Display System*). Muestra los
pedidos en un tablero de 3 columnas — **Pendientes → En Preparación → Listos** — y permite moverlos,
imprimir la comanda y ver alertas de inventario. Suena una campana cuando llega un pedido nuevo.

## Cómo se entra (dos pasos)
1. El ayudante de cocina inicia sesión en `/login` (correo y contraseña). PHP solo deja abrir `/kitchen` al rol `kitchen` (`config/paginas.php`).
2. El panel pide además **usuario + PIN de 4 dígitos** (`isLoggedIn` empieza en `false`). Sirve para terminales compartidas en la cocina: cada ayudante entra con su PIN.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="kitchen"` (`views/paginas/cocina.php`) | |
| → lee del almacén | `orders`, `inventory`, `staff`, `products`, `storeConfig` | Llegan por `/api/sync` cada pocos segundos. De `storeConfig.business` salen los datos del negocio del ticket. |
| → usa del almacén | `updateOrderStatus()` → `PATCH /api/orders/{id}/preparing` o `/ready` → `OrderController` → `PedidoService::marcarPreparando()` / `marcarListo()` | Mover pedidos. |
| → llama a | `POST /api/auth/login` con `pin` → `Auth::intentarLoginConPin()` | Login con PIN. |
| → llama a | `POST /api/auth/logout` | Cerrar sesión. |
| → usa | `soundFx` (`utils/audio.ts`) | Campana y botón de sonido. |
| → usa | `ConfirmDialog`, `ToastNotification` | Confirmar salida y avisos. |
| → usa | `CustomBurgerThumb` (`client/ingredientArt.tsx`) | Dibujo de la hamburguesa personalizada. |
| → usa | `orderCode`, `modificacionesDe` (`lib/format.ts`) | Mostrar `ORD-12` y el "SIN / EXTRA" de cada producto. |

## Variables (estados)
| Variable | Qué es |
|---|---|
| `time` | Hora actual; se actualiza cada segundo (`setInterval`) para el reloj. |
| `isLoggedIn`, `username`, `pin`, `showPassword`, `loginError` | Pantalla de login con PIN. |
| `soundEnabled` | Si el sonido está activado (empieza con `soundFx.isEnabled()`). |
| `showNewOrderAlert`, `newOrderAlertText` | Banner "¡Comanda ORD-X recibida!". |
| `toastData` | Aviso pequeño (lo muestra `ToastNotification`). |
| `showInventory` | Abrir/cerrar la caja de "Inventario crítico". |
| `isMobileMenuOpen` | Menú lateral en celular. |
| `confirmModal` | Datos de la ventana de confirmación (al cerrar sesión). |
| `previewOrder` | Pedido cuya comanda se está previsualizando para imprimir. |
| `printError` | Error simulado de impresora. |
| `prevOrdersCountRef`, `initialLoadRef` (`useRef`) | Para detectar pedidos nuevos sin contar la primera carga. |

## Valores calculados
| Valor | Qué calcula |
|---|---|
| `prepStats` (`useMemo`) | **Tiempo promedio de preparación de hoy**: para cada pedido con `readyAt`, los minutos entre que llegó (`date`) y que quedó listo. Color: verde ≤ 10 min, ámbar ≤ 20, rojo más. `readyAt` sale de `fecha_listo` (lo guarda `PedidoService::marcarListo()`). |
| `batchSummary` (`useMemo`) | **Resumen por producto** de todos los pedidos activos: "5× Hamburguesa clásica, 3× Perro...". Ayuda a cocinar en lote. `Object.entries(...).sort(...)` lo ordena de más a menos. |

## Funciones
| Función | Qué hace |
|---|---|
| `showToast(tipo, mensaje, titulo)` | Muestra un aviso. |
| `handleLogin(e)` | Envía usuario + PIN. Si la cuenta no es de cocina, cierra la sesión y muestra error. |
| `handleLogout()` | Abre la confirmación; al aceptar: logout y `irA('/login')`. |
| `handleToggleSound()` | Activa/silencia el sonido. |
| `getColumnOrders(columna)` | Pedidos de una columna, del más viejo al más nuevo. "Pendientes" incluye los estados `Pendiente` y `Pagado`. |
| `moveOrder(id, columna)` | Pendientes → `En Preparación`; En Preparación → `Listos` (con `updateOrderStatus`). |
| `printSticker(id)` | Abre la vista previa de la comanda. |
| `handleConfirmPrint()` | Imprime con `window.print()`. Tiene una **falla simulada** del 10 % (`Math.random() > 0.9`) para mostrar el aviso de error de impresora. |

## Efectos (`useEffect`)
1. **Reloj:** `setInterval` cada segundo; se limpia al salir.
2. **Pedido nuevo:** compara la cantidad de pedidos con la anterior. Si aumentó (y no es la primera carga): muestra el banner 5 segundos y suena `soundFx.playOrderBell()`.

## Partes de la pantalla
| Parte | Qué muestra |
|---|---|
| Barra lateral | Logo, **inventario crítico** (los 5 primeros insumos; en rojo si el stock es menor a 20) y el resumen por lotes. |
| Cabecera | Reloj, tiempo promedio de preparación, botón de sonido y de salir. |
| Tablero (Kanban) | Las 3 columnas con tarjetas `OrderCard`. |
| Ventana de impresión | Comanda con los **datos del negocio** (nombre, NIT, dirección, teléfono, Instagram y web, que se editan en Ajustes; los vacíos no se muestran), datos del cliente, productos (con "Sin: ..." y "Extra: ..."), subtotal, envío, descuentos de cumpleaños y de puntos (si los hay), total y un código de barras simulado. |

## El componente `OrderCard` (al final del archivo)
Tarjeta de un pedido. Recibe `order`, `products`, `onMove`, `onPrint` e `isReady`.
| Cálculo | Qué hace |
|---|---|
| `isNew` | Pendiente y llegó hace menos de 1 minuto → etiqueta "NUEVO". |
| `diffMinutes` / `getRelativeTime()` | "Hace instantes" o "Hace X min". |
| `isSlaBreached` | En preparación hace **15 minutos o más** → se marca en rojo (demorado). |

Muestra la foto de cada producto (o el dibujo de la hamburguesa personalizada), la cantidad y sus
personalizaciones con `modificacionesDe(item)`: **"SIN ..."** en rojo (lo que el cliente quitó) y
**"EXTRA ..."** en verde (lo que agregó). En la hamburguesa del Creador Interactivo se listan sus
ingredientes sin color.
