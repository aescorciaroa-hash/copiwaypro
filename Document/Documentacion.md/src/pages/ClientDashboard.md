# src/pages/ClientDashboard.tsx

## ¿Para qué sirve?
Es el **panel del cliente** (`/client`). Es el "contenedor" de todas las secciones del cliente: ver el
menú, armar una hamburguesa, el carrito, pagar, seguir sus pedidos, el historial y su perfil.

Este archivo guarda **los datos y la lógica**; cada sección es un archivo aparte en
`src/pages/client/` que recibe lo que necesita como props.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="client"` (`views/paginas/cliente.php`). Solo rol `client`. | |
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
| `cartSubtotal`, `birthdayDiscount`, `cartTotal` | Totales del carrito: el descuento es 15 % si hoy es el cumpleaños (`isBirthday`). `cartTotal = subtotal − cumpleaños − puntos + domicilio`. |
| `usePoints` | La casilla "Usar mis puntos" del checkout. Vuelve a `false` después de cada pedido. |
| `pointValue`, `minPointsToRedeem` | Reglas del programa de puntos (de `storeConfig`, se editan en Ajustes). |
| `availablePoints`, `canRedeemPoints`, `redeemPoints` | Saldo del cliente, si alcanza el mínimo, y si de verdad se van a usar (casilla marcada **y** alcanza). |
| `maxPointsToUse` | Lo máximo que el cliente puede usar en este pedido: lo menor entre su saldo y lo que cubre los productos (`(subtotal − cumpleaños) ÷ valor del punto`). |
| `pointsToUseInput` | Lo que el cliente escribió en "¿Cuántos puntos quieres usar?". Al marcar la casilla empieza con el máximo; al desmarcarla o terminar el pedido se borra. |
| `pointsRedeemed`, `pointsDiscount` | Puntos que de verdad se usan: lo que escribió, pero nunca más que `maxPointsToUse` ni menos de 0; y su valor en pesos. |

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
| `handleChangePassword()` | Cambiar la contraseña: con la actual (`changeClientPassword` → `PUT /api/clients/{id}/password`) o con el código del correo (`POST /api/auth/forgot-password/reset`). |
| `enviarCodigoClave()` | Pide el código de 6 dígitos al correo (`POST /api/auth/forgot-password/request`) y pasa la ventana al modo código. |
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
almacén **solo envía** ítems, dirección, método de pago, banco, transacción y cuántos puntos usa
(`pointsToUse`): el id, el PIN y los totales reales los genera el servidor. `prepareOnlinePayment`
también envía `pointsToUse`, para que el monto que se firma en la pasarela sea el mismo que se cobra.

Después de canjear, el saldo de puntos del perfil se actualiza en la siguiente sincronización. Se
lee con `client.points ?? ...` (y no con `||`) para que un saldo de **0** se muestre como 0.

## Efectos (`useEffect`)
1. **Reloj** cada 15 segundos.
2. **Cargar el perfil** con los datos del cliente cuando llegan los clientes; si tiene un carrito guardado en la base de datos, lo usa.
3. **Guardar el carrito** en cada cambio: con sesión → `updateClient(id, { cart })` (columna `carrito_guardado`); sin sesión → `localStorage`.
4. **`?calificarPedido=ID`** en la dirección (llega al tocar la notificación push de `sw.js`): abre directamente la ventana de reseña de ese pedido.
5. **Notificaciones push:** si ya dio permiso, sincroniza en silencio; si nunca respondió, muestra el aviso.

## Ventanas que dibuja este archivo
Aviso de notificaciones, reseña (estrellas y comentario), detalle de un pedido, personalizar producto
(SIN / EXTRA), cambio de contraseña, `CalendarModal` (cumpleaños), `ConfirmDialog` y `ToastNotification`.

### Barra de arriba
- **Izquierda:** el **nombre de la pantalla** en la que está el cliente, con su ícono en un cuadrito naranja
  y una frase corta debajo (ej. "Explorar Menú · Elige lo que se te antoja"). Sale de `secciones`: una lista
  que dice, para cada pestaña (`catalog`, `builder`, `cart`, `activeOrders`, `history`, `profile`), su
  título, su frase y su ícono (los mismos del menú de la izquierda). `seccionActual` es la de la pestaña
  abierta (`activeTab`); si no la encuentra, usa la del menú.
- **Derecha**, en este orden: el indicador de la cocina, una pastilla con las **iniciales, el nombre y los
  puntos** del cliente (al tocarla abre "Mi Perfil" con `setActiveTab('profile')`), la **campana** (con un
  globito naranja que dice cuántas notificaciones no ha leído) y el botón de **modo claro / oscuro**.
- La barra es un poco transparente y difumina lo que pasa por detrás (`backdrop-blur-xl`).

### Indicador "Cocina Abierta / Cerrada" (arriba a la derecha)
Una pastilla blanca con un gorro de chef (`ChefHat`) en un círculo verde (abierta) o rojo (cerrada), con un
puntico que titila cuando está abierta. Al lado dice "Cocina Abierta" y, debajo, el horario con un reloj
(`Clock`): "Hoy 10:10 - 22:00" o "Abre a las 10:10". **Solo se muestra**: el cliente no puede abrir ni
cerrar la tienda (eso lo hace el administrador en Ajustes). Usa `isStoreOpen`, que se calcula con el
horario y el interruptor manual de `storeConfig`.

### Ventana "Cambiar Contraseña"
Tiene **dos formas** de cambiar la contraseña (`modoClave`):

**1. Con la contraseña actual** (`modoClave = 'actual'`, la normal)
- Cajas: **Contraseña Actual** (candado `Lock`), **Nueva** y **Confirmar** (llave `KeyRound`), cada una con su ojito.
- Al tocar "Actualizar" se llama `changeClientPassword` → `PUT /api/clients/{id}/password` →
  `ClientController::changePassword()`. PHP compara la contraseña actual con la guardada (`password_verify`).
  **Si no es igual, no cambia nada** y responde "La contraseña actual no es correcta.".
- Ese error se guarda en `errorClaveActual`: la caja se pone **roja** y el mensaje sale debajo. Al volver a
  escribir en la caja, el error se borra.

**2. Con un código al correo** (`modoClave = 'codigo'`, si no se acuerda)
- Debajo de la contraseña actual está el enlace **"¿No recuerdas tu contraseña actual?"**. Abre la opción
  (`mostrarAyudaClave`) **Recibir un código en mi correo** → `enviarCodigoClave()` →
  `POST /api/auth/forgot-password/request` (lo mismo que usa la página "Olvidé mi contraseña"). PHP crea un
  código de 6 dígitos que vence en 15 minutos y lo manda al correo. La ventana cambia al modo `'codigo'`.
- En modo código, en vez de "Contraseña Actual" aparece **Código de Verificación** (solo deja escribir
  números, máximo 6), con dos botones redondos: "← Usar mi contraseña actual" (flecha `ArrowLeft`) y
  "Reenviar código" (flecha que gira `RotateCcw`; gira mientras se envía).
- Al tocar "Actualizar" se llama `POST /api/auth/forgot-password/reset` con el correo, el código y la
  nueva contraseña → `AuthController::forgotPasswordReset()`. Si el código está mal o venció, no cambia nada.
- `correoCuenta()` = el correo de la cuenta (el guardado en el servidor; si no, el del perfil).
- En local, si el correo no se pudo enviar, PHP devuelve el código (`debugCode`) y se muestra en el aviso
  para poder probar.

**En las dos formas**
- Las cajas nueva y confirmar se dibujan con un `.map()` sobre una lista (título, valor, función que lo
  cambia, si se ve o no), para no repetir el mismo código.
- Lista de **requisitos** que se ponen en **verde** mientras se escribe: "Mínimo 8 caracteres" y "Las
  contraseñas nuevas coinciden". Es solo una ayuda visual: quien revisa de verdad es PHP.
- "Actualizar" está apagado hasta llenar todo (en modo código, el código debe tener 6 números).
- Al cerrar o cancelar, `resetPasswordModalFields()` limpia todo y vuelve al modo normal.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../ClientDashboard"` porque lo importan: `src/main.tsx`, `src/pages/client/BuilderSection.tsx`, `src/pages/client/CartSection.tsx`, `src/pages/client/CheckoutSection.tsx`, `src/pages/client/HistorySection.tsx`, `src/pages/client/ProfileSection.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
