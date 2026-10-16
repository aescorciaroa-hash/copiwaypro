# app/Controllers/StaffController.php

## ¿Para qué sirve?
Maneja el **personal**: ayudantes de cocina y domiciliarios. El admin los crea, edita y da de baja.
También tiene la ruta para guardar la ubicación GPS del domiciliario (ver la observación al final).

## ¿Con qué se conecta?
| Ruta | `$action` | Quién | React |
|---|---|---|---|
| `GET /api/staff` | `index` | admin | Llega por `/api/sync` (clave `staff`) |
| `POST /api/staff` | `store` | admin | `almacenAplicacion.ts` ← `admin/StaffSection.tsx` |
| `PUT /api/staff/{id}` | `update` | admin | `almacenAplicacion.ts` (`updateStaff`) ← `StaffSection.tsx` |
| `DELETE /api/staff/{id}?role=...` | `destroy` | admin | `almacenAplicacion.ts` ← `StaffSection.tsx` |
| `PATCH /api/staff/{id}/location` | `updateLocation` | domiciliario | Ninguna pantalla la usa hoy (ver la observación al final) |

- **Modelo:** `Personal` (tablas AYUDANTE_COCINA y DOMICILIARIO).
- **Mapa del admin:** la ubicación guardada aquí la muestra `admin/MapSection.tsx`.

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$vehiculos` | Lista de vehículos válidos: `moto`, `bicicleta`, `carro`, `a_pie`. |
| `$datos['role']` | `'Ayudante de cocina'` o `'Domiciliario'`: dice en qué tabla se guarda. |
| `$_GET['role']` | En `destroy`: indica la tabla, porque el mismo número de id puede existir en las dos tablas. |
| `$datos['pin']` | PIN de 4 dígitos con el que entran cocina y domiciliario. |

## La función `buscarEnPersonal($personalModel, $id)`
Recorre la lista completa del personal y devuelve el que tenga ese id. La usan `store` y `update`
para responder con el miembro ya guardado. Si no lo encuentra, devuelve solo `['id' => ...]`.

## Acciones
- **`index`**: lista cocina + domiciliarios.
- **`store`**: valida nombre, correo, contraseña (mínimo 8), rol, vehículo y PIN (`preg_match('/^\d{4}$/', ...)` = exactamente 4 dígitos). Revisa que el correo no exista. Crea y responde **201**.
- **`update`**: valida solo los campos que llegan. Si no encuentra a la persona → **404**.
- **`destroy`**: **no borra**, la desactiva (`activo = 0`) para no perder el historial de pedidos.
- **`updateLocation`**: solo el propio domiciliario (`Auth::id()` igual al `{id}`). Valida `lat` y `lng` (números) y los guarda.

## Observación (comportamiento actual, no se cambió)
`DeliveryDashboard.tsx` envía la ubicación GPS del domiciliario con `updateStaff()`, que hace
`PUT /api/staff/{id}`. Esa ruta es **solo para admin**, así que el servidor le responde **403** al
domiciliario y la ubicación no se guarda. La ruta pensada para eso es `PATCH /api/staff/{id}/location`
(`updateLocation`), pero React no la llama. Si se quiere que el mapa del admin muestre la ubicación
real, habría que cambiar React para que use esa ruta.
