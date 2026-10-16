# src/store/almacenAplicacion.ts

## ¿Para qué sirve?
Es el **almacén central de datos** de React (hecho con la librería **Zustand**). Aquí viven los
productos, el inventario, el personal, los pedidos, los clientes y la configuración, para que
**cualquier pantalla** pueda leerlos sin pasárselos de componente en componente.

También tiene las **acciones**: funciones que llaman a PHP (`api.post`, `api.put`...) y después
actualizan los datos guardados.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo llena | `components/SyncDatos.tsx` | Con lo que llega de `/api/sync` cada pocos segundos. |
| ← lo leen | casi todas las pantallas con `useStore()` | Mostrar datos. |
| → llama a | `servicios/api.ts` → rutas PHP | Guardar cambios. |
| → usa | `lib/pasarela.ts` (tipo `DatosCheckout`) | Pago digital. |

## Las "interfaces" (la forma de cada dato)
Describen qué campos tiene cada cosa. Coinciden con lo que arman las funciones de `app/Views/json/` en PHP:

| Interface | Qué es | La arma en PHP |
|---|---|---|
| `Product` | Producto del menú | `producto_a_json()` |
| `InventoryItem` | Insumo del inventario | `ingrediente_a_inventario()` |
| `InventoryLog` | Movimiento de inventario | `Ingrediente::registrosDeMovimientos()` |
| `Staff` | Miembro del personal | `personal_cocina_a_json()` / `personal_domicilio_a_json()` |
| `Order`, `OrderItem` | Pedido y sus productos | `pedido_a_json()`, `Pedido::itemsDe()` |
| `Ingredient` | Extra para personalizar | `ingrediente_a_catalogo()` |
| `Client`, `Notification` | Cliente y sus avisos | `cliente_a_json()`, `notificacion_a_json()` |
| `StoreConfig` | Ajustes de la tienda | `Configuracion::obtener()` |
| `ProductComponent`, `NamedRef` | Piezas pequeñas (ingrediente de receta, referencia `{id, name}`) | — |

## El estado (los datos guardados)
| Dato | Qué tiene | Lo llena |
|---|---|---|
| `products` | Productos | `setProducts` (SyncDatos) |
| `inventory` | Insumos | `setInventory` |
| `inventoryLogs` | Historial de inventario | `setInventoryLogs` |
| `staff` | Personal | `setStaff` |
| `orders` | Pedidos | `setOrders` |
| `ordersSynced` | `true` cuando llegaron los pedidos reales por primera vez | `setOrders` |
| `ingredients` | Extras | `setIngredients` |
| `clients` | Clientes | `setClients` |
| `storeConfig` | Ajustes | `setStoreConfig` (de `__DATOS__` y de SyncDatos) |

`ordersSynced` sirve para que las pantallas no confundan la primera carga de pedidos con "¡llegó un pedido nuevo!" (y no suene la alarma).

## Las acciones y su ruta en PHP
| Acción | Petición | Controlador PHP | Pantalla que la usa |
|---|---|---|---|
| `addProduct` | `POST /products` | ProductController `store` | `admin/MenuSection.tsx` |
| `updateProduct` | `PUT /products/{id}` | `update` | `MenuSection.tsx` |
| `deleteProduct` | `DELETE /products/{id}` | `destroy` | `MenuSection.tsx` |
| `addInventoryItem` | `POST /inventory` | InventoryController `store` | `admin/InventorySection.tsx` |
| `updateInventoryItem` | `PUT /inventory/{id}` | `update` | `InventorySection.tsx` |
| `updateInventoryStock` | `PATCH /inventory/{id}/stock` | `adjustStock` | `InventorySection.tsx` |
| `deleteInventoryItem` | `DELETE /inventory/{id}` | `destroy` | `InventorySection.tsx` |
| `addStaff` | `POST /staff` | StaffController `store` | `admin/StaffSection.tsx` |
| `updateStaff` | `PUT /staff/{id}` | `update` | `StaffSection.tsx`, `DeliveryDashboard.tsx` (ver nota) |
| `deleteStaff` | `DELETE /staff/{id}?role=` | `destroy` | `StaffSection.tsx` |
| `addOrder` | `POST /orders` | OrderController `store` | `ClientDashboard.tsx` |
| `prepareOnlinePayment` | `POST /payments/prepare` | PaymentController `prepare` | `ClientDashboard.tsx` |
| `updateOrderStatus` | `PATCH /orders/{id}/preparing·ready·accept·deliver` | OrderController | Cocina, Domiciliario, Admin |
| `takeOrder` | `PATCH /orders/{id}/take` | `take` | `DeliveryDashboard.tsx` |
| `releaseOrder` | `PATCH /orders/{id}/release` | `release` | `DeliveryDashboard.tsx`, `admin/OrdersSection.tsx` |
| `updateOrder` | `PATCH /orders/{id}/review` (si trae `rating`) | `review` | `client/HistorySection.tsx` |
| `confirmDelivery` | `PATCH /orders/{id}/deliver` con `pin` | `deliver` | `DeliveryDashboard.tsx` |
| `updateClient` | `PUT /clients/{id}` | ClientController `update` | `ClientDashboard.tsx`, `ThemeContext.tsx` |
| `changeClientPassword` | `PUT /clients/{id}/password` | `changePassword` | `ClientDashboard.tsx` |
| `updateStoreConfig` | `PUT /settings` | SettingController `update` | `admin/SettingsSection.tsx` |
| `addCategory` | `POST /settings/categories` | `addCategory` | `MenuSection.tsx` |
| `removeCategory` | `DELETE /settings/categories/{nombre}` | `removeCategory` | `MenuSection.tsx` |

Acciones que **no** llaman a PHP (solo cambian el estado local): `addInventoryLog`, `deleteOrder`,
`addClient`, `deleteClient`. Los comentarios del código explican por qué (por ejemplo, los pedidos no
se borran, se archivan en el cierre de caja).

**Nota:** `DeliveryDashboard.tsx` usa `updateStaff` para enviar el GPS, pero `PUT /staff/{id}` es solo
para admin (ver la observación en `documentacion.md/app/Controllers/StaffController.md`).

## Código explicado
```ts
export const useStore = create<AppState>()((set, get) => ({
  products: [],
  ...
  addProduct: async (product) => {
    const created = await api.post<Product>('/products', product);
    set(state => ({ products: [created, ...state.products] }));
  },
}));
```
| Parte | Qué hace |
|---|---|
| `create<AppState>()` | Crea el almacén (función de Zustand). `AppState` describe todo lo que tiene. |
| `set(...)` | Cambia datos del almacén. Todas las pantallas que los usan se vuelven a dibujar. |
| `get()` | Lee el estado actual dentro de una acción. |
| `[created, ...state.products]` | Lista nueva: el producto creado primero y después todos los anteriores (`...` = "esparcir" la lista). |
| `state.products.map(p => p.id === id ? updated : p)` | Lista nueva donde se reemplaza solo el producto editado. |
| `state.products.filter(p => p.id !== id)` | Lista nueva sin el producto borrado. |

En React nunca se modifica una lista directamente: siempre se crea una **nueva**, para que React note el cambio.

### `STATUS_TO_ENDPOINT`
Traduce el estado que muestra React a la ruta de PHP:
`'En Preparación' → 'preparing'`, `'Listos' → 'ready'`, `'En Camino' → 'accept'`, `'Entregado' → 'deliver'`.

### `toApiOrderItem(item)`
Convierte un ítem del carrito al formato que espera `POST /api/orders`:
- Hamburguesa del creador interactivo → `{ quantity, stack: [{id, name}, ...] }`.
- Producto normal → `{ productId, quantity, extras: [...], removed: [...] }`.

Así nunca se envían precios desde el navegador: PHP los recalcula.

### `DEFAULT_MENU_CATEGORIES`
Lista vacía a propósito: si no hay categorías reales, la pantalla muestra "vacío" en vez de categorías inventadas.
