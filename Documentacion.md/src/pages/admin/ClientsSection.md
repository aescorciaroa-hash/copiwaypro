# src/pages/admin/ClientsSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Directorio Clientes"**: tabla (en el celular, tarjetas) con todos los clientes, su
cantidad de pedidos, total gastado y puntos, con un buscador.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `AdminDashboard.tsx` cuando `activeTab === 'clients'` | |
| ← los clientes vienen de | `clients` del almacén ← `/api/sync` ← `Cliente::listar()` ← `cliente_a_json()` | |
| → `setSelectedClientInfo(cliente)` | ventana "Cliente" del padre | Ver el detalle. |
| → usa | `formatCOP` | Total gastado. |

## Props
| Prop | Qué es |
|---|---|
| `filteredClients` | Clientes ya filtrados por el padre (por nombre o teléfono). |
| `customerSearch` / `setCustomerSearch` | Texto del buscador. |
| `setSelectedClientInfo` | Abrir el detalle de un cliente. |

| Columna | Sale de (React) | Sale de (MySQL) |
|---|---|---|
| Nombre, teléfono, correo | `name`, `phone`, `email` | `nombre`, `telefono`, `correo` |
| Pedidos | `ordersCount` | `COUNT(*)` en `Cliente::comoJson()` |
| Total gastado | `totalSpent` | `total_gastado` |
| Puntos | `points` | `puntos_fidelidad` |
