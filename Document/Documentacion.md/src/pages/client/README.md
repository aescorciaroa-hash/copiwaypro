# src/pages/client/ — las secciones del panel del cliente

Cada archivo es **una pestaña** (o una ventana) del panel del cliente. Ninguno pide datos al servidor
por su cuenta: todo lo reciben como **props** desde `src/pages/ClientDashboard.tsx`, que es el que
tiene el estado (carrito, perfil, pago...) y llama al almacén.

```
ClientDashboard.tsx  (datos + lógica)
   ├── CatalogSection.tsx        pestaña "Explorar Menú"
   ├── BuilderSection.tsx        pestaña "Creador Interactivo"
   ├── CartSection.tsx           pestaña "Carrito"
   ├── CheckoutSection.tsx       paso de pago
   ├── PaymentGatewayModal.tsx   ventana de la pasarela de pago
   ├── ActiveOrdersSection.tsx   pestaña "Órdenes Activas"
   ├── HistorySection.tsx        pestaña "Historial y Recompras"
   ├── ProfileSection.tsx        pestaña "Mi Perfil"
   └── ingredientArt.tsx         dibujos de ingredientes y hamburguesas
```

**Props que son funciones de estado:** muchas secciones reciben cosas como `setCart` o `setActiveTab`.
Son las funciones `set...` de los `useState` de `ClientDashboard.tsx`: cuando la sección las llama,
cambia el estado del padre y todo se vuelve a dibujar. El tipo
`React.Dispatch<React.SetStateAction<CartItem[]>>` significa justamente "la función set de un
`useState<CartItem[]>`".
