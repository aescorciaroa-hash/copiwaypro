# src/pages/admin/InventorySection.tsx

## ¿Para qué sirve?
Es la pestaña **"Inventario Express"**: lista de insumos con su stock y valor, indicadores (insumos
críticos, unidades totales, valor del inventario), botón para sumar stock, y una ventana para
registrar o editar insumos (con foto, categoría, unidad, cantidad, costo y proveedor). También muestra
el historial de movimientos.

## ¿Con qué se conecta?
| Acción en pantalla | Función | Ruta PHP | Termina en |
|---|---|---|---|
| Registrar insumo | `addInventoryItem()` | `POST /api/inventory` | `Ingrediente::crearConStockInicial()` (crea el insumo y un movimiento de "entrada") |
| Editar insumo | `updateInventoryItem()` | `PUT /api/inventory/{id}` | `Ingrediente::actualizar()` |
| Sumar stock | `updateInventoryStock(id, cantidad)` | `PATCH /api/inventory/{id}/stock` | `Ingrediente::ajustarStock()` + historial |
| Eliminar | `deleteInventoryItem()` | `DELETE /api/inventory/{id}` | Baja lógica (`activo = 0`) |
| Subir foto | `subirArchivo(...)` | `POST /api/uploads/product-image` | `public/uploads/productos/` |

## Props
| Prop | Qué es |
|---|---|
| `inventory` / `filteredInventory` | Todos los insumos / filtrados por el buscador. |
| `filteredInventoryLogs` | Historial filtrado (de `/api/sync`, clave `inventoryLogs`). |
| `addInventoryItem`, `updateInventoryItem`, `updateInventoryStock`, `deleteInventoryItem` | Acciones del almacén. |
| `newItem` / `setNewItem` | El formulario (`NewInventoryItemState`). |
| `isInventoryModalOpen` / `setIsInventoryModalOpen` | Ventana abierta. |
| `inventorySearch`, `inventoryHistorySearch` | Buscadores. |
| `showToast`, `setConfirmModal` | Avisos y confirmaciones. |

## Variables y cálculos
| Variable | Qué es |
|---|---|
| `editingItemId` | Insumo que se está editando (o `null` si es nuevo). |
| `isUploadingImage` | Subiendo la foto. |
| `criticalItemsCount` | Insumos con stock de 10 o menos. |
| `totalInventoryUnits` | Suma de todo el stock. |
| `totalInventoryValuation` | Valor del inventario: `stock × costo unitario` de cada insumo. |

## Funciones
| Función | Qué hace |
|---|---|
| `handleOpenCreateModal()` / `handleOpenEditModal(insumo)` | Abren la ventana vacía o con los datos del insumo. |
| `handleAddItem()` | Guarda. Al **crear**, calcula el **costo unitario = costo total ÷ cantidad** (ej: 10 kg por $50.000 → $5.000 el kg) y exige la cantidad. Al **editar**, no cambia el stock (eso se hace con "sumar stock"). |
| `addStock(id, cantidad)` | Suma stock (debe ser un número mayor que 0). |

La categoría **"Empaques & Desechables"** es especial: PHP la crea como empaque, y así esos insumos
aparecen en el bloque de empaques de la receta de los productos y no en el catálogo de extras del cliente.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../InventorySection"` porque lo importan: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
