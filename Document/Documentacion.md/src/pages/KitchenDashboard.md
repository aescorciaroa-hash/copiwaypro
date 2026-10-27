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
| `showInventory` | Abrir/cerrar la notificación de **stock crítico** (la del ícono de advertencia de la cabecera). |
| `isMobileMenuOpen` | Menú lateral en celular. |
| `confirmModal` | Datos de la ventana de confirmación (al cerrar sesión). |
| `previewOrder` | Pedido cuya comanda se está previsualizando para imprimir. |
| `printError` | Error simulado de impresora. |
| `prevOrdersCountRef`, `initialLoadRef` (`useRef`) | Para detectar pedidos nuevos sin contar la primera carga. |

## Valores calculados
| Valor | Qué calcula |
|---|---|
| `prepStats` (`useMemo`) | **Tiempo promedio de preparación de hoy**: para cada pedido con `readyAt`, los minutos entre que llegó (`date`) y que quedó listo. Color: verde ≤ 10 min, ámbar ≤ 20, rojo más. `readyAt` sale de `fecha_listo` (lo guarda `PedidoService::marcarListo()`). |
| `criticalItems` (`useMemo`) | Insumos en **stock crítico**: los que tienen entre 1 y 10 unidades (la misma regla que usa el admin). |
| `saludoNombre` | En el login: lo que va escribiendo en Usuario, con la primera letra en mayúscula (`maria` → `Maria`). Si escribe el correo, solo toma lo que va antes del `@`. |
| `saludoHora` | "Buenos días" (antes de las 12), "Buenas tardes" (antes de las 7 p. m.) o "Buenas noches". |
| `flujo`, `totalActivas`, `entregadosHoy` | Para el panel del turno de la barra lateral: cuántas comandas hay por hacer, cocinando y listas; la suma de las tres, y cuántos pedidos se entregaron hoy. |
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

## Pantalla de entrada (login)
- **Izquierda** (solo en computador): una **foto de fondo** de un cocinero con la sartén en llamas (de Unsplash, igual que el login principal usa la de una hamburguesa). Encima tiene dos degradados oscuros (`bg-gradient-to-t` y `bg-gradient-to-r`) para que la foto no tape el texto. Sobre eso van el logo (arriba) y, abajo, la frase "Tu cocina, en orden.".
- **Derecha:** botón **Volver**, la hora, el botón de **modo claro / oscuro** (sol o luna, usa `toggleTheme`), y el saludo **"Hola, Maria 👋"**, que cambia mientras el trabajador escribe su usuario (`saludoNombre`).
- El **PIN** se ve como 4 casillas. Truco: hay un `input` invisible (`opacity-0`) encima de las casillas que recibe lo que se escribe; las casillas solo dibujan cada dígito (o un punto si está oculto).
- El saludo y el formulario van **centrados en el alto** de la tarjeta (`flex-1 flex flex-col justify-center`), para que no quede un hueco en blanco antes del botón.
- El botón **Entrar a la cocina** es naranja con degradado, ícono de chef y flecha; al pasar el mouse sube un poquito y le cruza un brillo. Queda en naranja muy claro (apagado) hasta que haya usuario y los 4 dígitos.
- Al entrar sale un aviso **"¡Hola, Leidy!"** con el nombre real que manda el servidor.

## Partes de la pantalla
| Parte | Qué muestra |
|---|---|
| Barra lateral | Logo; **panel del turno** (`panelTurno`): tarjeta oscura **Cocina en servicio** (comandas activas y entregados de hoy) y el **flujo de cocina** en 3 cuadritos (Por hacer / Cocinando / Listos, con una rayita de color abajo). Luego el **resumen de preparación**, que ocupa el espacio que sobra. Abajo, **Oscuro** y **Salir** uno al lado del otro. **Todo cabe sin barra de desplazamiento** (el cocinero no tiene que bajar): el resumen muestra máximo `MAX_RESUMEN` (6) productos y, si hay más, dice "+N productos más". El mismo panel del turno sale en el menú del celular. |
| Cabecera | **Ícono de advertencia** rojo con el número de insumos críticos (solo aparece si hay alguno, igual que en admin). Al tocarlo se abre un **panel lateral por la derecha** (igual al de notificaciones de pedidos del admin) que oscurece el fondo, con cada insumo, sus unidades y una barrita roja; se cierra con la X o tocando el fondo oscuro. Reloj, tiempo promedio de preparación, botón de sonido y de salir. |
| Tablero (Kanban) | Las 3 columnas con tarjetas `OrderCard`. |
| Ventana de impresión | Comanda con los **datos del negocio** (nombre, NIT, dirección, teléfono, Instagram y web, que se editan en Ajustes; los vacíos no se muestran), datos del cliente, productos (con "Sin: ..." y "Extra: ..."), subtotal, envío, descuentos de cumpleaños y de puntos (si los hay), total y un código de barras simulado. |

## Las 3 columnas del tablero
Las columnas se dibujan con un solo `.map()` sobre una lista de 3 objetos (Pendientes, En preparación, Listos).
Cada objeto dice su título, su subtítulo ("Por empezar", "En el fogón", "Para despachar"), su ícono y sus colores.
- **Pendientes:** encabezado con un tinte naranja suave que se desvanece.
- **En preparación:** encabezado naranja **difuminado** (degradado + dos brillos borrosos `blur-3xl`), porque es donde trabaja el cocinero.
- **Listos:** encabezado con un tinte verde suave.
- El número de pedidos va en un cuadrito a la derecha. Si la columna está vacía sale un ícono gris con borde punteado.

## El componente `OrderCard` (al final del archivo)
Tarjeta de un pedido. Recibe `order`, `products`, `onMove`, `onPrint` e `isReady`.
| Cálculo | Qué hace |
|---|---|
| `isNew` | Pendiente y llegó hace menos de 1 minuto → borde naranja y etiqueta "NUEVO". |
| `diffMinutes` / `getRelativeTime()` | Tiempo fácil de leer: "Ahora", "8 min", "5 h 12 min" o "21 d" (antes decía "Hace 31552 min"). |
| `isSlaBreached` | En preparación hace **15 minutos o más** → borde rojo y etiqueta "DEMORADO". |
| `timerTone` | Color del reloj: gris (a tiempo), ámbar (10 min o más), rojo (15 min o más) y verde si ya está listo. |

Cómo se ve, de arriba hacia abajo:
1. **`#ORD-10`**, el cliente (ícono de persona) y el reloj de color a la derecha.
2. Cada producto: foto pequeña (o el dibujo de la hamburguesa personalizada) y la cantidad en naranja antes del nombre (`2× Street Food`).
   Las personalizaciones salen con `modificacionesDe(item)` como **etiquetas**: **"SIN ..."** en rojo (lo que el cliente quitó)
   y **"EXTRA ..."** en verde (lo que agregó). En la hamburguesa del Creador Interactivo se listan sus ingredientes en gris.
3. Una línea punteada y el botón:
   - Pendiente → **Empezar a preparar** (naranja con degradado).
   - En preparación → botón de **imprimir** + **Marcar listo** (verde).
   - Listo → franja ámbar **Esperando domiciliario**.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../KitchenDashboard"` porque lo importan: `src/main.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
