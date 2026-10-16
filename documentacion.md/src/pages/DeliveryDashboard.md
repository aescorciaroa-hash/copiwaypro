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
| ← la abre | `main.tsx` con `data-pagina="delivery"` (`app/Views/paginas/domiciliario.php`) | |
| → lee del almacén | `orders`, `staff` | Llegan por `/api/sync`. PHP solo le envía sus pedidos y los "listo" sin asignar (`Pedido::porRol()`). |
| → `takeOrder` | `PATCH /api/orders/{id}/take` → `PedidoService::tomarPedido()` | Tomar un pedido. |
| → `releaseOrder` | `PATCH /api/orders/{id}/release` → `PedidoService::liberarPedido()` | Soltarlo. |
| → `updateOrderStatus(id, 'En Camino')` | `PATCH /api/orders/{id}/accept` → `PedidoService::aceptarEntrega()` | Iniciar la ruta. |
| → `confirmDelivery(id, pin)` | `PATCH /api/orders/{id}/deliver` → `PedidoService::confirmarEntrega()` | Entregar con PIN. |
| → `updateStaff(...)` | `PUT /api/staff/{id}` | Enviar ubicación GPS y pedido actual. ⚠️ Esa ruta es solo para admin; ver la observación en `documentacion.md/app/Controllers/StaffController.md`. |
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
| `destCoords` | Coordenadas del destino (las encuentra Nominatim). |
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
1. **Buscar el destino:** cuando cambia `activeRoute`, consulta Nominatim con la dirección + ", Neiva, Huila" y guarda las coordenadas.
2. **GPS:** con `navigator.geolocation.watchPosition(...)` sigue la ubicación real y la envía con `updateStaff`. Si el GPS no funciona, **simula** el movimiento cada 2 segundos acercándose un 2 % al destino.

## Componentes internos (al inicio del archivo)
| Componente | Qué hace |
|---|---|
| `RoutePolyline` | Pide el camino a OSRM y lo dibuja con dos líneas (borde y centro). Si falla, dibuja una línea recta. OSRM devuelve `[lng, lat]`; se invierten a `[lat, lng]` para Leaflet. |
| `MapEffect` | Mueve el mapa cuando cambia el centro. |
| `CustomZoomControl` | Botones de acercar y alejar. |

## Botón de WhatsApp
Solo aparece con el pedido **En Camino** (porque PHP solo entrega el teléfono del cliente en ese
estado, ver `app/Views/json/pedido.md`). Arma un mensaje con el nombre del cliente y el código del
pedido y abre `https://wa.me/TELEFONO?text=MENSAJE`.
`encodeURIComponent` convierte el texto para que funcione dentro de una dirección web.
