# src/pages/ClientDashboard.tsx

## ¿Para qué sirve?
Es el **panel del cliente** (`/client`). Es el "contenedor" de todas las secciones del cliente: ver el
menú, armar una hamburguesa, el carrito, pagar, seguir sus pedidos, el historial y su perfil.

Este archivo guarda **los datos y la lógica**; cada sección es un archivo aparte en
`src/pages/client/` que recibe lo que necesita como props.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="client"` (`app/Views/paginas/cliente.php`). Solo rol `client`. | |
| → muestra | `client/CatalogSection`, `BuilderSection`, `CartSection`, `CheckoutSection`, `ActiveOrdersSection`, `HistorySection`, `ProfileSection`, `PaymentGatewayModal` | Las secciones. |
| → lee del almacén | `products`, `ingredients`, `inventory`, `orders`, `storeConfig`, `clients` | Llegan por `/api/sync`. |
| → acciones del almacén | `addOrder` (`POST /api/orders`), `prepareOnlinePayment` (`POST /api/payments/prepare`), `updateOrder` (reseña), `updateClient` (perfil y carrito), `changeClientPassword` | |
| → usa | `crearTransaccion`, `esperarResultado` (`lib/pasarela.ts`) | Pago digital. |
| → usa | `activarNotificacionesPush`, `sincronizarSuscripcionPush`, `pushDisponible` (`lib/pushNotifications.ts`) | Notificaciones push. |
| → usa | `ConfirmDialog`, `ToastNotification`, `CalendarModal`, `CustomBurgerThumb` / `IngredientThumb` (`client/ingredientArt.tsx`), `formatCOP`, `orderCode` | |
| → guarda en `localStorage` | `olio_cart` (carrito de invitado), `push_prompt_dismissed` | |
| ← lee de `localStorage` | `copiway_auth_user_id` (lo guarda `Login.tsx`) | Saber qué cliente es. |

## Interfaces (tipos) del archivo
| Interface | Qué describe |
|---|---|
| `SyncedIngredient` | Un ingrediente con su **precio de venta** ya calculado (`price`), costo (`rawCost`), stock y unidad. |
| `CartItem` | Un ítem del carrito: producto o hamburguesa personalizada (`isCustom`, `stack`), precio, cantidad, `removed` y `extras`. |
| `UserProfileState` | Datos del perfil que se editan en "Mi Perfil". |
| `UserNotification` | Una notificación del cliente. |
| `ConfirmModalState` | Datos de la ventana de confirmación. |

## Las pestañas (`activeTab`)
| `activeTab` | Etiqueta | Sección (`src/pages/client/`) |
|---|---|---|
| `catalog` | Explorar Menú | `CatalogSection` |
| `builder` | Creador Interactivo | `BuilderSection` |
| `cart` | Carrito de Pedidos | `CartSection` |
| `checkout` | (pago) | `CheckoutSection` |
| `activeOrders` | Órdenes Activas | `ActiveOrdersSection` |
| `history` | Historial y Recompras | `HistorySection` |
| `profile` | Mi Perfil | `ProfileSection` |

`{activeTab === 'catalog' && <CatalogSection ... />}` → solo se dibuja la sección de la pestaña activa.
Las funciones `NavItem` y `MobileNavItem` (al final del archivo) dibujan los botones del menú lateral
y de la barra inferior del celular.

## Variables importantes
| Variable | Qué es |
|---|---|
| `currentTime` | Hora actual, se actualiza cada **15 segundos** para saber si la tienda abrió o cerró. |
| `isStoreOpen` | Resultado de `checkIsStoreOpen()` (misma lógica que `Configuracion::tiendaAbiertaAhora()` en PHP, incluido el horario que pasa la medianoche). |
| `profitMargin` | Margen de ganancia del admin (por defecto 30 %). |
| `syncedIngredients` (`useMemo`) | Ingredientes con precio de venta: `round(costo × (1 + margen/100) / 100) × 100`. Es la **misma fórmula** que usa PHP en `PedidoService::resolverIngredientes()`, así el precio que ve el cliente coincide con el que cobra el servidor. |
| `cart` | El carrito. Empieza con lo guardado en `localStorage` (`olio_cart`). |
| `builderStack` | Capas de la hamburguesa que se está armando. |
| `editingCartItemId` | Si se está editando un ítem del carrito. |
| `selectedProduct`, `customRemoved`, `customExtras` | Ventana para personalizar un producto (quitar o agregar ingredientes). |
| `paymentMethod`, `digitalBank`, `paymentPhone` | Método de pago, banco y celular. |
| `paymentStatus`, `gatewayStep`, `simulationStep`, `gatewayReference` | Estado del pago (los muestra `PaymentGatewayModal`). |
| `userProfile` | Datos del perfil (se llenan con el cliente de `clients`). |
| `reviewingOrderId`, `reviewRating`, `reviewText`, `reviewTags` | Ventana de reseña. |
| `showPushPrompt` | Mostrar el aviso "Activa las notificaciones". |
| `FLAT_SHIPPING_RATE` | Costo del domicilio = `storeConfig.shippingRate`. |
| `cartSubtotal`, `birthdayDiscount`, `cartTotal` | Totales del carrito: el descuento es 15 % si hoy es el cumpleaños (`isBirthday`). |

## Funciones principales
| Función | Qué hace |
|---|---|
| `openCustomizer(producto)` | Abre la ventana para personalizar un producto. |
| `addToCartFromCatalog()` | Agrega (o actualiza, si se está editando) el producto con sus extras y quitados. Precio = precio del producto + extras. |
| `handleCheckoutSubmit()` | Revisa celular (si es digital) y que la tienda esté abierta, y pide confirmación ("punto de no retorno"). |
| `processPayment()` | Si es digital → `payWithGateway()`; si es efectivo → `submitOrder()`. |
| `payWithGateway()` | **Pago digital** (ver abajo). |
| `submitOrder(idTransaccion)` | Crea el pedido con `addOrder()`. Si PHP lo rechaza (tienda cerrada, sin stock, pago inválido), muestra el motivo real. Si funciona, vacía el carrito y va a "Órdenes Activas". |
| `failPayment(mensaje, titulo)` | Muestra el error del pago y vuelve al estado inicial. |
| `reorder(pedido)` | **Recompra en 1 clic**: vuelve a poner en el carrito los productos de un pedido anterior, revisando stock y precios actuales. |
| `handleSaveProfile()` / `handleDiscardProfile()` | Guardar o descartar los cambios de "Mi Perfil" (`updateClient`). |
| `handleChangePassword()` | Cambiar la contraseña (`changeClientPassword` → `PUT /api/clients/{id}/password`). |
| `handleReviewSubmit()` | Envía la calificación (`updateOrder` con `rating` → `PATCH /api/orders/{id}/review`). |
| `handleActivarPush()` / `handleDismissPushPrompt()` | Activar o descartar las notificaciones. |
| `handleLogout()` | Confirma, cierra sesión, borra el carrito local y va a `/login`. |

## El pago digital (`payWithGateway`) paso a paso
| `gatewayStep` | Qué pasa | Llamada |
|---|---|---|
| `connecting` | Pide al servidor el total, referencia y firma. | `prepareOnlinePayment` → `POST /api/payments/prepare` |
| `waiting` | Crea la transacción ("esperando aprobación en tu celular"). | `crearTransaccion` → `POST /api/payments/transactions` |
| `verifying` | Pregunta cada segundo hasta que deje de estar PENDING. | `esperarResultado` → `GET /api/payments/transactions/{id}` |
| `approved` / `declined` | Si se aprobó, crea el pedido con el id de la transacción. | `submitOrder(tx.id)` → `POST /api/orders` |

El servidor **vuelve a verificar** la transacción antes de crear el pedido (`PagoService::verificarTransaccion()`).

`submitOrder` arma un objeto con id, PIN y totales calculados en el navegador, pero `addOrder` del
almacén **solo envía** ítems, dirección, método de pago, banco y transacción: el id, el PIN y los
totales reales los genera el servidor.

## Efectos (`useEffect`)
1. **Reloj** cada 15 segundos.
2. **Cargar el perfil** con los datos del cliente cuando llegan los clientes; si tiene un carrito guardado en la base de datos, lo usa.
3. **Guardar el carrito** en cada cambio: con sesión → `updateClient(id, { cart })` (columna `carrito_guardado`); sin sesión → `localStorage`.
4. **`?calificarPedido=ID`** en la dirección (llega al tocar la notificación push de `sw.js`): abre directamente la ventana de reseña de ese pedido.
5. **Notificaciones push:** si ya dio permiso, sincroniza en silencio; si nunca respondió, muestra el aviso.

## Ventanas que dibuja este archivo
Aviso de notificaciones, reseña (estrellas y comentario), detalle de un pedido, personalizar producto
(SIN / EXTRA), cambio de contraseña, `CalendarModal` (cumpleaños), `ConfirmDialog` y `ToastNotification`.
