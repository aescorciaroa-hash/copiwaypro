# src/pages/AdminDashboard.tsx

## ¿Para qué sirve?
Es el **panel del administrador** (`/admin`), el archivo más grande del proyecto (unas 2.800 líneas).
Funciona como el **contenedor** de las 8 secciones del admin (cada una en `src/pages/admin/`) y además
tiene las ventanas compartidas: cierre de caja con PDF, detalle de pedidos, editar personal, pedido
manual, ajustar horario y alertas de pedidos nuevos.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="admin"` (`views/paginas/admin.php`). Solo rol `admin`. | |
| → muestra | `admin/OverviewSection`, `OrdersSection`, `MapSection`, `MenuSection`, `InventorySection`, `StaffSection`, `ClientsSection`, `SettingsSection` | Las secciones. |
| → lee del almacén | `products`, `inventory`, `inventoryLogs`, `staff`, `orders`, `ordersSynced`, `clients`, `storeConfig` | Llegan por `/api/sync`. |
| → acciones del almacén | productos, inventario, personal, categorías, ajustes, estados de pedidos, `addManualOrder` (pedido manual), `updateOrderAddress` (cambiar dirección) | Ver la tabla de `Documentacion.md/src/store/almacenAplicacion.md`. |
| → usa | `modificacionesDe` (`lib/format.ts`) | SIN / EXTRA de cada producto en el detalle del pedido. |
| → llama directo a | `GET /api/cash-closing/preview`, `POST /api/cash-closing`, `GET /api/orders`, `POST /api/auth/logout` | Cierre de caja y salir. |
| → usa | `generateCierrePDF` (`utils/generarCierrePdf.ts`) | El PDF del cierre. |
| → usa | `soundFx` (`utils/audio.ts`) | Campana con pedidos nuevos. |
| → usa | `TimePickerModal`, `CustomSelect`, `ConfirmDialog`, `ToastNotification`, `CustomBurgerThumb`, `recharts`, `react-leaflet` | |

## Las pestañas (`activeTab`)
| `activeTab` | Etiqueta del menú | Sección |
|---|---|---|
| `overview` | Tablero Analítico | `OverviewSection` |
| `orders` | Comandas Activas | `OrdersSection` |
| `map` | Rutas & Zonas | `MapSection` |
| `menu` | Gestión de Menú | `MenuSection` |
| `inventory` | Inventario Express | `InventorySection` |
| `staff` | Equipo y Personal | `StaffSection` |
| `clients` | Directorio Clientes | `ClientsSection` |
| `settings` | Ajustes y Caja | `SettingsSection` |

La lista está en la constante `navItems`. Con `{activeTab === 'menu' && <MenuSection ... />}` solo se
dibuja la sección activa.

## Estados principales (agrupados)
| Grupo | Variables | Para qué |
|---|---|---|
| Navegación | `activeTab`, `isMobileMenuOpen`, `highlightedOrderId` | Pestaña actual y resaltar un pedido. |
| Hora y tienda | `currentTime`, `showTimePicker` (`'open'`/`'close'`/`null`) | Reloj y selector de horario. |
| Gráficas | `salesFilter`, `activePieIndex` | Período de ventas y parte resaltada de la torta. |
| Productos | `newProduct`, `editingProductId`, `isProductModalOpen`, `tempIngredientName`, `tempPackagingName`, `isCategoryManagerOpen`, `selectedCatalogCategory`, `newCategoryInput`, `catalogSearch`... | Ventana para crear/editar productos y categorías (los usa `MenuSection`). |
| Inventario | `newItem`, `isInventoryModalOpen`, `inventorySearch`, `inventoryHistorySearch` | Ventana de insumos (la usa `InventorySection`). |
| Personal | `newStaff`, `staffEditData`, `selectedStaffInfo`, `staffModalReadOnly`, `showStaffPassword`, `staffSearch`, `staffRoleFilter`, `staffStatusFilter`, `staffCurrentPage` | Crear, ver y editar personal; filtros y páginas. |
| Clientes | `selectedClientInfo`, `customerSearch` | Ventana de cliente y buscador. |
| Pedidos | `viewingOrder`, `editingAddressOrder`, `newAddress`, `selectedDriverInfo`, `isMapExpanded` | Detalle de pedido, dirección, domiciliario. |
| Pedido manual | `showManualForm`, `manualOrderClient` (nombre, celular, dirección), `manualOrderChannel` (`'llamada'` o `'whatsapp'`), `manualOrderSaving` (mientras se envía), `manualOrderItems`, `manualSelectedProduct`, `manualCustomRemoved`, `manualCustomExtras`, `manualQuantity` | Ventana de pedido por llamada o WhatsApp. |
| Cierre de caja | `showCierre`, `cierreData`, `isGeneratingPDF`, `showPdfPreview`, `pdfPreviewUrl` | Ventana del cierre y PDF. |
| Ajustes | `shippingRateInput`, `profitMarginInput` | Campos de tarifa y margen (se llenan con `storeConfig`). |
| Avisos | `toastData`, `confirmModal`, `showOrderAlert`, `showNotifications` | |

## Valores calculados (filtros)
| Valor | Qué es |
|---|---|
| `filteredProducts` | Productos que coinciden con el buscador y la categoría. |
| `filteredInventory` | Insumos que coinciden con el buscador. |
| `filteredStaff` / `paginatedStaff` / `staffTotalPages` | Personal filtrado por texto, rol y estado, dividido en páginas. |
| `filteredInventoryLogs` | Historial de inventario filtrado. |
| `filteredClients` | Clientes por nombre o teléfono. |
| `topProductsData` (`useMemo`) | Productos más vendidos para la gráfica. |
| `isStoreOpen` | `checkIsStoreOpen()`: misma regla de horario que en PHP. |

## Funciones de las gráficas de ventas
| Función | Qué hace |
|---|---|
| `inicioDeSemana(fecha)` | El lunes de esa semana a las 00:00. |
| `ventasPorDia(inicio)` | Suma las ventas reales de cada día (Lun–Dom). |
| `ventasPorSemanaDelMes(inicioMes)` | Suma las ventas por semana dentro del mes. |
| `getSalesData()` | Elige cuál usar según `salesFilter` ("Esta semana", "Este mes"...). |

## Cierre de caja (paso a paso)
| Paso | Función | Llamada |
|---|---|---|
| 1. Vista previa | `handleGenerarCierre()` | `GET /api/cash-closing/preview` → `CajaService::previsualizar()`. **No guarda nada.** Abre la ventana con los números. |
| 2. Ver o descargar PDF | `handleVerReporte()` / `descargarPDF()` | `generateCierrePDF(cierreData, orders)` |
| 3. Confirmar | `requestConfirmarCierre()` | Pide confirmación (avisa si quedan pedidos activos). |
| 4. Guardar | `confirmarCierre()` | `POST /api/cash-closing` → `CajaService::generar()` y después recarga los pedidos con `GET /api/orders`. |

## Otras funciones
| Función | Qué hace |
|---|---|
| `handleNavigateToOrders(id)` | Va a "Comandas Activas" y baja hasta el pedido, resaltándolo 4 segundos. |
| `handleOpenStaffModal(persona, soloLectura)` | Abre la ventana de un miembro del personal. |
| `handleViewOrder(id)` | Abre el detalle de un pedido. |
| `handleUpdateAddress()` | Guarda la nueva dirección en el servidor (`updateOrderAddress` → `PATCH /api/orders/{id}/address`). Si falla, muestra el motivo y no cierra la ventana. |
| `handleAddProductToManualOrder()` | Agrega un producto (con lo quitado y los extras) a la lista del pedido manual. |
| `handleCreateManualOrder()` | Exige nombre, celular y dirección. Envía el pedido con `addManualOrder` → `POST /api/orders/manual` y **espera la respuesta**: el aviso dice el número real del pedido y si quedó en la cuenta de un cliente o como invitado. Si el servidor lo rechaza (tienda cerrada, sin stock...), muestra el motivo. |
| `handleLogout()` | Confirma y cierra sesión. |
| `showToast(...)` | Muestra un aviso. |

## Efectos
1. **Reloj** para la hora y el estado de la tienda.
2. **Campos de ajustes:** cuando cambia `storeConfig`, actualiza la tarifa y el margen escritos.
3. **Tecla Escape:** cierra cualquier ventana abierta.
4. **Pedido nuevo:** espera a `ordersSynced` (la primera carga real). Si después llegan más pedidos, muestra la alerta 5 segundos y suena la campana.
5. **Pedidos vacíos:** quita del estado local los pedidos sin productos.

## Componentes internos (al inicio del archivo)
`RoutePolyline` (ruta OSRM en el mapa, igual que en `DeliveryDashboard.tsx`) y `CustomTooltip`
(cuadro que aparece al pasar el mouse sobre una barra de la gráfica, con el valor en pesos).

## Barra de arriba (cabecera)
Es la franja blanca que queda fija arriba del panel. Tiene, de izquierda a derecha:
1. **Botón de menú** (solo en celular): abre el menú lateral.
2. **Sección actual:** el ícono y el nombre de la pestaña abierta (`seccionActual`, sale de `navItems`) y, encima, la fecha de hoy.
3. **Estado de la tienda:** un aviso verde "Tienda abierta · Hasta las 23:00" o gris "Tienda cerrada · Abre a las 11:00" (usa `isStoreAutomaticallyOpen` y el horario de `storeConfig`). Solo en pantallas grandes.
4. **Nuevo pedido:** atajo que abre la ventana de pedido manual (`setShowManualForm(true)`).
5. **Botones agrupados:** la campana (se mueve sola cada 5 segundos si hay pedidos nuevos) y el botón de modo claro/oscuro.
6. **Perfil:** cuadro naranja con un escudo, el texto "Administrador" y un puntito verde de "En línea".

### Panel de notificaciones
Al tocar la campana sale un **panel por la derecha** y el resto de la pantalla se oscurece un poco
(así no queda un cuadro encima tapando el contenido). Se cierra con la X, tocando afuera o con Escape.
- `pedidosNuevos`: los pedidos en estado **Pendiente** o **Pagado**.
- Cada pedido muestra cliente, dirección, estado, total y hace cuánto llegó (`haceCuanto(fecha)`: "hace 5 min", "hace 2 h").
- Al tocar un pedido, va a **Comandas Activas** y lo resalta (`handleNavigateToOrders(id)`).
- El botón de abajo, **Ver todas las comandas**, lleva a esa pestaña.

## Pedido manual (ventana "Ingreso de Orden Manual")
La ventana tiene **dos vistas** (`manualView`), para que todo se vea sin tener que bajar:

- **Vista del pedido (`'datos'`):** a la izquierda los datos del cliente y a la derecha los productos ya agregados.
  Si no hay productos, sale un botón grande **"Agregar productos"**.
- **Vista de catálogo (`'catalogo'`):** se abre con ese botón. A la izquierda está la lista del menú con un buscador
  (`manualSearch`) y botones por categoría (`manualCategory`). Al tocar un producto, a la derecha se elige la
  cantidad (con − y +) y se quitan o se añaden ingredientes. El botón **"Agregar"** muestra el precio
  (`manualPrecioSeleccion`) y lo suma a la orden. El numerito naranja de cada producto dice cuántos van en la
  orden (`manualCantidadEnOrden`). Con la flecha o con **"Listo, volver al pedido"** se regresa.
  Para **quitar la selección** se toca la **X** del panel derecho o se vuelve a tocar el mismo producto.
  **Ingredientes:** el **+** agrega un extra cada vez que se toca (se ve "x2", "x3"...) y el **−** quita
  un extra. Si no tiene extras, el **−** lo marca como "sin" (tachado). Cada extra repetido se cobra y se
  descuenta del inventario las veces que se pidió.
  La vista tiene un alto fijo (la ventana no se agranda). El panel derecho tiene 3 partes: arriba,
  fijos, el producto, la cantidad y el título "Personalizar Ingredientes"; en el medio, **solo la lista
  de ingredientes** sube y baja; abajo, fijo, el botón "Agregar".

- **Vista "Pedido Registrado" (`'listo'`):** sale al crear el pedido (`manualCreatedOrder`). Muestra el
  cliente (registrado o invitado), el total, el **código de entrega** y, si es por link, el link con el
  botón **Copiar link**. Botones: **Enviar por WhatsApp** (abre el chat del cliente con el mensaje ya
  escrito, `abrirWhatsApp()`) y **Copiar mensaje**. Si el cliente paga mientras la ventana está abierta,
  cambia sola a "¡El cliente ya pagó!".

**Forma de pago** (`manualPaymentMode`): **Efectivo** (va directo a cocina) o **Link de pago** (queda
"Esperando Pago" hasta que el cliente paga en `/pagar?c=...`; vence en 30 minutos). Los textos de los
mensajes salen de `src/utils/mensajesWhatsApp.ts` (`mensajeDePedido()` elige cuál usar).

Cada vez que se abre la ventana, empieza en la vista del pedido.

### Código de entrega en el detalle del pedido
En los pedidos manuales (llamada o WhatsApp), la ventana de detalle muestra el **código de entrega** y
un botón para **reenviar** la confirmación o el link de pago por WhatsApp (y **copiar link** si aún no
pagan). El servidor solo le manda el código al admin en pedidos manuales (`views/json/pedido.php`).

1. **Datos del cliente:** nombre, celular, dirección y por dónde llegó (**Llamada** o **WhatsApp**).
2. **Productos:** se eligen en la vista de catálogo, con lo que se quita y los extras.
3. **Enviar a Cocina:** el servidor recalcula los precios, descuenta el inventario y busca al cliente
   por su celular. Si está registrado, el pedido queda en su cuenta (y suma puntos al entregarse);
   si no, queda como **cliente invitado**. Se cobra en efectivo al entregar.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../AdminDashboard"` porque lo importan: `src/main.tsx`, `src/pages/admin/InventorySection.tsx`, `src/pages/admin/MapSection.tsx`, `src/pages/admin/MenuSection.tsx`, `src/pages/admin/OrdersSection.tsx`, `src/pages/admin/OverviewSection.tsx`, `src/pages/admin/StaffSection.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
