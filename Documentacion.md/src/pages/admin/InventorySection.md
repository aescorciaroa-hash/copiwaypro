# src/pages/admin/InventorySection.tsx

## ¿Para qué sirve?
Es la pestaña **"Inventario Express"**: una **tabla de insumos** (igual de forma que la Lista de
Personal) con su stock y valor, indicadores (insumos críticos, unidades totales, valor del inventario),
botones para sumar o restar stock, y una ventana para registrar o editar insumos (con foto, categoría,
unidad, cantidad, costo y proveedor). Debajo está la **tabla del historial de movimientos**.

Las dos tablas muestran 8 filas por página, con los botones de página abajo (`<` `1` `2` `3` `>`).
La tabla de insumos se ve en pantallas grandes (`xl:`, de 1280 px en adelante). En pantallas más pequeñas
y en celular, cada insumo se ve como una tarjeta. Así nunca hay que mover la tabla de lado a lado.

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
| `POR_PAGINA` | Cuántas filas se ven por página en cada tabla (8). |
| `invPage` / `logPage` | En qué página va la tabla de insumos / la del historial. Vuelven a 1 al escribir en el buscador. |
| `paginatedInventory` / `paginatedLogs` | Solo las filas de la página actual (`slice` corta la lista). |

## Funciones
| Función | Qué hace |
|---|---|
| `handleOpenCreateModal()` / `handleOpenEditModal(insumo)` | Abren la ventana vacía o con los datos del insumo. |
| `handleAddItem()` | Guarda. Al **crear**, calcula el **costo unitario = costo total ÷ cantidad** (ej: 10 kg por $50.000 → $5.000 el kg) y exige la cantidad. Al **editar**, no cambia el stock (eso se hace con "sumar stock"). |
| `addStock(id, cantidad)` | Suma stock (debe ser un número mayor que 0). |
| `costoUnitario(insumo)` | Cuánto cuesta una unidad del insumo. |
| `colorStock(stock)` | Color del puntico: rojo (10 o menos), naranja (30 o menos), verde (más). |
| `fotoInsumo(insumo)` | La foto del insumo, o el cuadrito gris si no tiene. |
| `botonesInsumo(insumo, prefijo)` | La cajita **CANT.** y los botones restar (−), sumar (+), editar y eliminar. El `prefijo` es para que la caja de la tabla y la del celular no tengan el mismo nombre. |
| `datosMovimiento(movimiento)` | Para el historial: si es entrada o salida, la unidad, el costo y la fecha. |
| `iconoMovimiento(esEntrada)` | La flechita verde (entrada) o roja (salida). |
| `cantidadMovimiento(...)` | La pastilla con `+5` o `−1` y la unidad. |
| `paginacion(...)` | El pie de cada tabla: "Mostrando X de Y" y los botones de página. |

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
