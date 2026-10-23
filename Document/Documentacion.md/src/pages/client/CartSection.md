# src/pages/client/CartSection.tsx

## ¿Para qué sirve?
Es la pestaña del **carrito**: lista los productos elegidos, permite cambiar cantidades, editar o
quitar ítems, y muestra el resumen (subtotal, descuento de cumpleaños, domicilio y total) con el
botón para ir a pagar.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` cuando `activeTab === 'cart'` | |
| → cambia | `cart` del padre (`setCart`) | Cantidades y quitar ítems. Cada cambio se guarda solo (efecto del padre → `PUT /api/clients/{id}` o `localStorage`). |
| → para editar | `setEditingCartItemId`, `setBuilderStack`, `setSelectedProduct`, `setCustomRemoved`, `setCustomExtras` | Abre el ítem en el Creador o en la ventana de personalizar. |
| → confirmar | `setConfirmModal` | "¿Quitar este producto?" |
| → ir a pagar | `setActiveTab('checkout')` | |

## Props
| Prop | Qué es |
|---|---|
| `cart` / `setCart` | El carrito. |
| `products` | Productos (para buscar la imagen y la receta). |
| `storeConfig`, `isStoreOpen` | Si la tienda está cerrada, no deja continuar. |
| `isCheckingOut` | Si ya se está pagando. |
| `isBirthday`, `cartSubtotal`, `birthdayDiscount`, `cartTotal`, `FLAT_SHIPPING_RATE` | Los totales (los calcula el padre). |
| `showToast` | Avisos. |

## Cambiar la cantidad
```tsx
setCart(cart.map(c => c.id === item.id ? { ...c, quantity: Math.max(1, (c.quantity || 1) - 1) } : c))
```
- `map` recorre el carrito y solo cambia el ítem tocado.
- `{ ...c, quantity: ... }` copia el ítem y cambia la cantidad.
- `Math.max(1, ...)` impide bajar de 1.

Los totales que se ven aquí son una **vista previa**: el valor que se cobra lo recalcula PHP al crear
el pedido.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../CartSection"` porque lo importan: `src/pages/ClientDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
