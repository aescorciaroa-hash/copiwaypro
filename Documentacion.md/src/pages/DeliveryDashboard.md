# src/pages/DeliveryDashboard.tsx

## ¿Para qué sirve?
Es el **panel del domiciliario** (`/delivery`): ve los pedidos listos para repartir, los toma, inicia
la ruta con un mapa (con el camino dibujado), escribe al cliente por WhatsApp y confirma la entrega
con el **PIN** que le dice el cliente.

## Cómo se entra (dos pasos)
1. Inicia sesión en `/login`; PHP solo deja abrir `/delivery` al rol `delivery`.
2. El panel pide **usuario + PIN** (igual que la cocina). Si la cuenta no es de domiciliario, cierra la sesión.

## ¿Con qué se conecta?
| Dirección | Archivo / servicio | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="delivery"` (`views/paginas/domiciliario.php`) | |
| → lee del almacén | `orders`, `staff` | Llegan por `/api/sync`. PHP solo le envía sus pedidos y los "listo" sin asignar (`Pedido::porRol()`). |
| → `takeOrder` | `PATCH /api/orders/{id}/take` → `PedidoService::tomarPedido()` | Tomar un pedido. |
| → `releaseOrder` | `PATCH /api/orders/{id}/release` → `PedidoService::liberarPedido()` | Soltarlo. |
| → `updateOrderStatus(id, 'En Camino')` | `PATCH /api/orders/{id}/accept` → `PedidoService::aceptarEntrega()` | Iniciar la ruta. |
| → `confirmDelivery(id, pin)` | `PATCH /api/orders/{id}/deliver` → `PedidoService::confirmarEntrega()` | Entregar con PIN. |
| → `updateDriverLocation(id, [lat, lng])` | `PATCH /api/staff/{id}/location` → `Personal::actualizarUbicacion()` | Enviar su ubicación GPS real (como máximo cada 10 s). |
| → `saveOrderDestination(id, [lat, lng])` | `PATCH /api/orders/{id}/destination` → `PedidoService::guardarDestino()` | Guardar el destino que ubicó en el mapa, para que el admin vea la ruta. |
| → servicio externo | **Nominatim** (OpenStreetMap) | Convertir la dirección del pedido en coordenadas. |
| → servicio externo | **OSRM** | Calcular el camino en carro para dibujarlo. |
| → servicio externo | **WhatsApp** (`wa.me`) | Escribirle al cliente. |
| → usa | `react-leaflet`, `ConfirmDialog`, `ToastNotification`, `formatCOP`, `orderCode`, `vehicleWithModel` | |

## Variables (estados)
| Variable | Qué es |
|---|---|
| `isLoggedIn`, `loggedInUserId`, `username`, `loginPin`, `showPassword`, `loginError` | Login con PIN. `loggedInUserId` es el id del domiciliario. |
| `isAvailable` | Interruptor **Disponible / Desconectado**. Desconectado = solo ve sus pedidos ya aceptados. |
| `acceptedOrders` | Ids de pedidos que tomó en esta sesión. |
| `activeRoute` | El pedido con la ruta en curso (o `null`). |
| `mapCenter` | Centro del mapa. Empieza en Neiva `[2.9273, -75.2818]`. |
| `destCoords` | Coordenadas del destino: las del pedido si ya están guardadas (`lat`, `lng`); si no, las encuentra Nominatim. |
| `showPinModal`, `pinTargetOrder`, `pinInput`, `pinError` | Ventana para escribir el PIN de entrega. |
| `toastData`, `confirmModal` | Avisos y ventana de confirmación. |

## Valor calculado `deliveries`
```tsx
const deliveries = orders.filter(o =>
  (o.status === 'Listos' || o.status === 'En Camino') &&
  (isAvailable || acceptedOrders.includes(o.id) || o.status === 'En Camino')
);
```
Pedidos "Listos" o "En Camino". Si está desconectado, solo los suyos.

## Funciones
| Función | Qué hace |
|---|---|
| `handleLogin(e)` | Login con usuario y PIN. |
| `handleLogout()` | Confirma y cierra sesión. |
| `takeOrder(id)` | Toma el pedido en el servidor; si falla (otro lo tomó primero) muestra el mensaje de PHP. |
| `releaseOrder(id)` | Lo suelta para otro domiciliario. |
| `startTrip(id)` | Llama al servidor para pasarlo a **En Camino** y, si funciona, abre la ruta en el mapa con los datos del domiciliario. |
| `markDelivered(id)` | Si el pedido exige PIN (`requiresDeliveryPin`), abre la ventana del PIN. |
| `executeDelivery(id, pin)` | Envía el PIN al servidor. Si está mal, muestra el error de PHP ("PIN incorrecto.") dentro de la ventana. |
| `renderMap()` | Dibuja el mapa: el domiciliario, el destino y la ruta. |

## Efectos
1. **Buscar el destino:** cuando cambia el pedido de `activeRoute` o su dirección. Si el pedido ya
   tiene coordenadas guardadas, las usa; si no, consulta Nominatim con la dirección + ", Neiva, Huila"
   y las guarda en el pedido con `saveOrderDestination`.
2. **Dirección corregida por el admin:** cuando llegan los pedidos por `/api/sync`, compara la
   dirección del pedido en curso. Si cambió, actualiza la ruta y muestra el aviso **"Dirección
   Actualizada"** con la nueva dirección.
3. **GPS:** con `navigator.geolocation.watchPosition(...)` sigue la ubicación real y la envía con
   `updateDriverLocation` (como máximo cada 10 segundos, porque el GPS puede reportar varias veces por
   segundo). Si el GPS no funciona o no hay permiso, **simula** el movimiento cada 2 segundos
   acercándose un 2 % al destino, pero esa posición inventada **solo mueve el mapa de este celular**:
   no se envía al servidor.

El pedido en curso del domiciliario (`currentOrderId`) ya no se envía desde aquí: lo calcula PHP
(`Personal::comoJsonDomicilio()`) con el pedido "en_camino" que tiene asignado.

## Componentes internos (al inicio del archivo)
| Componente | Qué hace |
|---|---|
| `RoutePolyline` | Pide el camino a OSRM y lo dibuja con dos líneas (borde y centro). Si falla, dibuja una línea recta. OSRM devuelve `[lng, lat]`; se invierten a `[lat, lng]` para Leaflet. |
| `MapEffect` | Mueve el mapa cuando cambia el centro. |
| `CustomZoomControl` | Botones de acercar y alejar. |

## Botón de WhatsApp
Solo aparece con el pedido **En Camino** (porque PHP solo entrega el teléfono del cliente en ese
estado, ver `views/json/pedido.md`). Arma un mensaje con el nombre del cliente y el código del
pedido y abre `https://wa.me/TELEFONO?text=MENSAJE`.
`encodeURIComponent` convierte el texto para que funcione dentro de una dirección web.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../DeliveryDashboard"` porque lo importan: `src/main.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
