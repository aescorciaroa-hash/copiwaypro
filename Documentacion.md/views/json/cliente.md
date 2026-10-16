# views/json/cliente.php

## ¿Para qué sirve?
Convierte un **cliente** y sus **notificaciones** al formato que espera React (`interface Client` e
`interface Notification` en `src/store/almacenAplicacion.ts`).

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← la usa | `Cliente::comoJson()` y `Cliente::notificacionesDe()` (`models/Cliente.php`) |
| → el resultado lo usan | `admin/ClientsSection.tsx` (directorio) y `ClientDashboard.tsx` (Mi Perfil) |

## `cliente_a_json($datosCrudos)`
Recibe un arreglo con 4 partes que arma el modelo:
| Clave | Qué es |
|---|---|
| `fila` | La fila de la tabla CLIENTE. |
| `ordersCount` | Cuántos pedidos tiene (ya contado). |
| `lastOrderDate` | Fecha del último pedido. |
| `notifications` | Sus notificaciones (ya convertidas). |

| Campo de React | Sale de |
|---|---|
| `id` | `(string) id_cliente` |
| `name`, `phone`, `email`, `address` | `nombre`, `telefono`, `correo`, `direccion` |
| `totalSpent` | `(float) total_gastado` |
| `points` | `(int) puntos_fidelidad` |
| `birthday` | `fecha_nacimiento` |
| `preferences` | `['theme' => tema_preferido]` o `null` si no eligió tema |
| `cart` | `json_decode(carrito_guardado, true)`: el texto JSON vuelve a ser arreglo. Si no hay, `[]`. |

`json_decode($texto, true)`: el `true` hace que devuelva un arreglo asociativo en vez de un objeto.

## `notificacion_a_json($fila)`
| Campo de React | Sale de |
|---|---|
| `id` | `id_notificacion_cliente` |
| `title`, `message`, `date` | `titulo`, `mensaje`, `fecha` |
| `read` | `(bool) leida` |
| `type` | `tipo` (`order`, `promo` o `system`) |

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** `config/helpers.php` lo carga en cada petición, así que **nada funciona** (`Failed to open stream` …`views/json/cliente.php`).

**Si se borra una función:** sale `Call to undefined function nombre()` en lo que la usa:

| Función | La llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `cliente_a_json()` | `Cliente::comoJson()` | `PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente.<br>`GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
| `notificacion_a_json()` | `Cliente::notificacionesDe()` | `PUT /api/clients/{id}` → Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente.<br>`GET /api/sync` → **Todas las pantallas se quedan sin datos**: menú, pedidos, inventario, clientes, personal y ajustes no aparecen ni se actualizan. |
