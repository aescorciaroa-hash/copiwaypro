# controllers/StaffController.php

## ¿Para qué sirve?
Maneja el **personal**: ayudantes de cocina y domiciliarios. El admin los crea, edita, da de baja y
elimina (solo si no tienen historial). También tiene la ruta con la que el domiciliario guarda su
ubicación GPS.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
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
| `$this->vehiculos` | Lista de vehículos válidos: `moto`, `bicicleta`, `carro`, `a_pie`. |
| `$this->datos['role']` | `'Ayudante de cocina'` o `'Domiciliario'`: dice en qué tabla se guarda. |
| `$_GET['role']` | En `destroy`: indica la tabla, porque el mismo número de id puede existir en las dos tablas. Es **obligatorio**. |
| `$this->datos['pin']` | PIN de 4 dígitos con el que entran cocina y domiciliario. |

## El método privado `buscarEnPersonal($personalModel, $id)`
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

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `POST /api/staff`, `PUT /api/staff/{id}`, `DELETE /api/staff/{id}`, `PATCH /api/staff/{id}/location`. | `Failed to open stream: No such file or directory` (…`controllers/StaffController.php`) |
| La línea `require_once __DIR__ . '/../models/Personal.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Personal" not found` |
| El método `store()` | Admin → Equipo y Personal: no se puede agregar personal. | `Call to undefined method StaffController::store()` (500) |
| La rama `$accion === 'store'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/staff'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `update()` | Admin → Equipo y Personal: no se puede editar ni dar de baja. | `Call to undefined method StaffController::update()` (500) |
| La rama `$accion === 'update'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PUT /api/staff/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `destroy()` | Admin → Equipo y Personal: no se puede eliminar. | `Call to undefined method StaffController::destroy()` (500) |
| La rama `$accion === 'destroy'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'DELETE /api/staff/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `updateLocation()` | Domiciliario: su ubicación GPS no se guarda (el admin no lo ve en el mapa). | `Call to undefined method StaffController::updateLocation()` (500) |
| La rama `$accion === 'updateLocation'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PATCH /api/staff/{id}/location'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método privado `buscarEnPersonal()` | `POST /api/staff`, `PUT /api/staff/{id}`. | `Call to undefined method StaffController::buscarEnPersonal()` (500) |
| La línea `$this->personalModel = ...` del constructor | Las acciones que usan `$this->personalModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->vehiculos = ...` del constructor | Las acciones que usan `$this->vehiculos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
