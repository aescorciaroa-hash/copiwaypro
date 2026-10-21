# src/pages/admin/ClientsSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Directorio Clientes"**: la tabla **"Lista de Clientes"** (igual de forma que la Lista de
Personal) con todos los clientes, su cantidad de pedidos, el total gastado y la fecha del último pedido,
con un buscador. En celular, cada cliente se ve como una tarjeta.

Muestra 8 clientes por página, con los botones de página abajo (`<` `1` `2` `>`) y el texto
"Mostrando X de Y clientes encontrados". Al escribir en el buscador vuelve a la página 1.

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

## Variables
| Variable | Qué es |
|---|---|
| `POR_PAGINA` | Cuántos clientes se ven por página (8). |
| `pagina` / `setPagina` | En qué página va la tabla. |
| `totalPaginas` | Cuántas páginas hay (clientes ÷ 8, redondeado hacia arriba). |
| `paginatedClients` | Solo los clientes de la página actual (`slice` corta la lista). |
| `numerosPagina` | Los números de página que se ven abajo (máximo 5 a la vez). |

| Columna | Sale de (React) | Sale de (MySQL) |
|---|---|---|
| Nombre y Contacto (nombre y, debajo, el correo) | `name`, `email` | `nombre`, `correo` |
| Teléfono | `phone` | `telefono` |
| Pedidos | `ordersCount` | `COUNT(*)` en `Cliente::comoJson()` |
| Total Gastado | `totalSpent` | `total_gastado` |
| Último Pedido | `lastOrderDate` | `ultimo` (la fecha del pedido más reciente) en `Cliente::comoJson()` |

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../ClientsSection"` porque lo importan: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
