# app/Controllers/StaffController.php

## ¿Para qué sirve?
Maneja el **personal**: ayudantes de cocina y domiciliarios. El admin los crea, edita, da de baja y
elimina (solo si no tienen historial). También tiene la ruta con la que el domiciliario guarda su
ubicación GPS.

## ¿Con qué se conecta?
| Ruta | `$action` | Quién | React |
|---|---|---|---|
| `GET /api/staff` | `index` | admin | Llega por `/api/sync` (clave `staff`) |
| `POST /api/staff` | `store` | admin | `almacenAplicacion.ts` ← `admin/StaffSection.tsx` |
| `PUT /api/staff/{id}` | `update` | admin | `almacenAplicacion.ts` (`updateStaff`) ← `StaffSection.tsx` (también **Dar de baja**, con `active: false`) |
| `DELETE /api/staff/{id}?role=...` | `destroy` | admin | `almacenAplicacion.ts` (`deleteStaff`) ← `StaffSection.tsx` (botón **Eliminar**) |
| `PATCH /api/staff/{id}/location` | `updateLocation` | domiciliario | `almacenAplicacion.ts` (`updateDriverLocation`) ← `DeliveryDashboard.tsx` |

- **Modelo:** `Personal` (tablas AYUDANTE_COCINA y DOMICILIARIO).
- **Mapa del admin:** la ubicación guardada aquí la muestran `admin/MapSection.tsx` y
  `admin/OrdersSection.tsx`, junto con el pedido en curso y su destino.

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$vehiculos` | Lista de vehículos válidos: `moto`, `bicicleta`, `carro`, `a_pie`. |
| `$datos['role']` | `'Ayudante de cocina'` o `'Domiciliario'`: dice en qué tabla se guarda. |
| `$_GET['role']` | En `destroy`: indica la tabla, porque el mismo número de id puede existir en las dos tablas. Es **obligatorio**. |
| `$datos['pin']` | PIN de 4 dígitos con el que entran cocina y domiciliario. |

## La función `buscarEnPersonal($personalModel, $id)`
Recorre la lista completa del personal y devuelve el que tenga ese id. La usan `store` y `update`
para responder con el miembro ya guardado. Si no lo encuentra, devuelve solo `['id' => ...]`.

## Acciones
- **`index`**: lista cocina + domiciliarios.
- **`store`**: valida nombre, correo, contraseña (mínimo 8), rol, vehículo y PIN (`preg_match('/^\d{4}$/', ...)` = exactamente 4 dígitos). Revisa que el correo no exista. Crea y responde **201**.
- **`update`**: valida solo los campos que llegan. Si no encuentra a la persona → **404**.
- **`destroy`**: **borra de verdad** a la persona, pero solo si nunca preparó, repartió ni fue
  liquidada en un pedido (`Personal::eliminarPermanente`). Respuestas:
  - sin `role` → **422**
  - tiene historial → **409** con el mensaje "...usa Dar de baja para quitarle el acceso"
  - no existe → **404**

  Para quitarle el acceso a alguien con historial se usa **Dar de baja** (`update` con `active: false`),
  que pone `activo = 0` y conserva su historial.
- **`updateLocation`**: solo el propio domiciliario (`Auth::id()` igual al `{id}`). Valida `lat` y `lng`
  (números) y los guarda. React la llama como máximo cada 10 segundos y solo con la posición real
  del GPS (nunca con la posición simulada).
