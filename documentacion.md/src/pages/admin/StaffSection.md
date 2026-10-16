# src/pages/admin/StaffSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Equipo y Personal"**: a la izquierda, el formulario para **crear** un ayudante de
cocina o un domiciliario (con contraseña, PIN de 4 dígitos y, si es domiciliario, vehículo, placa y
base de efectivo); a la derecha, la **lista** con buscador, filtros, páginas, exportar a Excel (CSV),
dar de baja y eliminar.

## ¿Con qué se conecta?
| Acción en pantalla | Función | Ruta PHP | Termina en |
|---|---|---|---|
| Crear | `addStaff()` | `POST /api/staff` | `Personal::crear()` → AYUDANTE_COCINA o DOMICILIARIO |
| Dar de baja | `updateStaff(id, { role, active: false })` | `PUT /api/staff/{id}` | `Personal::actualizar()` → `activo = 0` |
| Eliminar | `deleteStaff(id, role)` | `DELETE /api/staff/{id}?role=...` | `Personal::eliminarPermanente()` → borra la fila **solo si no tiene historial**; si lo tiene, PHP responde 409 |
| Ver / editar | `handleOpenStaffModal(persona)` | ventana en `AdminDashboard.tsx` | |

Siempre se envía el **rol** porque el mismo número de id puede existir en las dos tablas
(ver `documentacion.md/app/Models/Personal.md`).

## Props
| Prop | Qué es |
|---|---|
| `staff` / `filteredStaff` / `paginatedStaff` | Todo el personal / filtrado / la página actual. |
| `staffTotalPages`, `staffCurrentPage` / `setStaffCurrentPage` | Paginación. |
| `staffSearch`, `staffRoleFilter`, `staffStatusFilter` y sus `set...` | Buscador y filtros. |
| `addStaff`, `updateStaff`, `deleteStaff` | Acciones del almacén. |
| `newStaff` / `setNewStaff` | Formulario: nombre, rol, correo, contraseña, teléfono, placa, vehículo, modelo, PIN y base de efectivo. |
| `showStaffPassword` | Mostrar la contraseña escrita. |
| `handleOpenStaffModal`, `showToast`, `setConfirmModal` | Del padre. |

## Variables
| Variable | Qué es |
|---|---|
| `showFilters` | Menú de filtros abierto. Se cierra al hacer clic afuera (efecto con `mousedown`). |
| `activeFilters` | Cuántos filtros están puestos (para el número en el botón). |

## Funciones
| Función | Qué hace |
|---|---|
| `applyFilter(set, valor)` | Aplica un filtro y vuelve a la página 1. |
| `handleExport()` | Crea un archivo **CSV** (se abre en Excel) con el personal filtrado y lo descarga. |
| `handleAddStaff()` | Exige nombre, correo, contraseña de 8 o más y PIN de 4. Crea el miembro y limpia el formulario. Si PHP rechaza (ej: correo repetido → 409), muestra el mensaje. |
| `handleSoftDelete(persona)` | Confirma y lo da de baja (`active: false`). Conserva su historial. |
| `handleHardDelete(persona)` | Aparece en quienes ya están dados de baja. Confirma y lo **borra de verdad**. Solo funciona si nunca preparó ni entregó un pedido; si ya tiene historial, muestra el mensaje de PHP ("...usa Dar de baja...") y la persona sigue en la lista, inactiva. |

## `handleExport()` explicado
```ts
const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const csv = '﻿' + [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
```
- `esc` pone cada valor entre comillas (y duplica las comillas internas), como exige el formato CSV.
- `;` separa columnas y `\r\n` separa filas.
- `﻿` al inicio hace que Excel muestre bien las tildes.
- `URL.createObjectURL(new Blob(...))` crea un archivo en memoria, y un enlace `<a download>` invisible lo descarga.
