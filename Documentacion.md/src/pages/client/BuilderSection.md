# src/pages/client/BuilderSection.tsx

## ¿Para qué sirve?
Es el **"Creador Interactivo"**: el cliente arma su propia hamburguesa **capa por capa** tocando
ingredientes, y la ve dibujada en pantalla (pan arriba, rellenos, pan abajo y una tabla de madera).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` cuando `activeTab === 'builder'` | |
| ← recibe | `syncedIngredients` del padre | Ingredientes con precio de venta y stock. |
| → cambia | `builderStack` y `cart` del padre (`setBuilderStack`, `setCart`) | Capas y carrito. |
| → usa | `ToastNotification` (vía `showToast`) | Avisos. |
| → al pagar | el ítem va con `isCustom: true` y `stack: [...]` → `toApiOrderItem()` del almacén lo envía como `{ stack: [{id, name}] }` → `PedidoService::calcular()` lo guarda bajo el producto oculto "Hamburguesa Personalizada". | |

## Props
| Prop | Qué es |
|---|---|
| `builderStack` / `setBuilderStack` | Lista de capas (ingredientes) elegidas. |
| `syncedIngredients` | Todos los ingredientes disponibles. |
| `cart` / `setCart` | El carrito. |
| `editingCartItemId` / `setEditingCartItemId` | Si se está editando una hamburguesa que ya estaba en el carrito. |
| `setActiveTab` | Para ir al carrito al terminar. |
| `showToast` | Mostrar avisos. |

## Variables
| Variable | Qué es |
|---|---|
| `stageRef`, `burgerRef` (`useRef`) | El área de dibujo y la hamburguesa. |
| `fitScale` | Escala para que la hamburguesa **siempre quepa** completa (si es muy alta, se encoge). Se recalcula con un `ResizeObserver` cuando cambia el tamaño. |

## Funciones
| Función | Qué hace |
|---|---|
| `getIngredientVisual(nombre, indice, variante)` | Dibuja cada ingrediente según su nombre: pan con ajonjolí, carne, queso, lechuga, tomate... (`variante`: pan de arriba, de abajo o normal). |
| `renderBurgerLayerWithStock(...)` | Dibuja una capa y la marca si el ingrediente está agotado. |

## Acciones del usuario
| Acción | Código |
|---|---|
| Agregar ingrediente | `setBuilderStack([...builderStack, ing])` — deshabilitado si `stock <= 0`. |
| Quitar una capa | `setBuilderStack(builderStack.filter((_, i) => i !== sIdx))` (quita la de esa posición). |
| Vaciar todo | `setBuilderStack([])` |
| Agregar al carrito | Si se está editando, reemplaza ese ítem; si no, agrega uno nuevo con `isCustom: true`, la lista de capas y el precio total (suma de los precios de cada capa). Después va a la pestaña del carrito. El botón se deshabilita si no hay capas o si alguna está agotada. |
