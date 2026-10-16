# src/pages/admin/MenuSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Gestión de Menú"**: el admin ve los productos por categoría, los crea y edita en una
ventana grande (con foto, precio, etiqueta, descripción y la **receta / escandallo**: qué insumos y
empaques gasta cada producto y cuánto cuesta producirlo), los oculta o los elimina, y administra las
categorías.

**Escandallo** = el cálculo del costo de un plato sumando lo que cuesta cada ingrediente.

## ¿Con qué se conecta?
| Acción en pantalla | Función | Ruta PHP | Termina en |
|---|---|---|---|
| Crear producto | `addProduct()` | `POST /api/products` | `Producto::crear()` → PRODUCTO + RECETA |
| Editar producto | `updateProduct()` | `PUT /api/products/{id}` | `Producto::actualizar()` |
| Ocultar / mostrar | `updateProduct(id, { active })` | `PUT /api/products/{id}` | columna `estado` |
| Cambiar precio rápido | `updateProduct(id, { price })` | `PUT /api/products/{id}` | columna `precio` |
| Eliminar | `deleteProduct()` | `DELETE /api/products/{id}` | `Producto::eliminar()` |
| Subir foto | `subirArchivo('/uploads/product-image', 'image', file)` | `POST /api/uploads/product-image` | `public/uploads/productos/` |
| Crear categoría | `addCategory()` | `POST /api/settings/categories` | tabla CATEGORIA |
| Borrar categoría | `removeCategory()` | `DELETE /api/settings/categories/{nombre}` | 409 si un producto activo la usa |

Las funciones vienen como props desde `AdminDashboard.tsx`, que las toma del almacén
(`store/almacenAplicacion.ts`).

## Props (las más importantes)
| Prop | Qué es |
|---|---|
| `products` / `filteredProducts` | Todos / los filtrados por buscador y categoría. |
| `inventory` | Insumos, para elegir ingredientes de la receta y calcular costos. |
| `storeConfig` | Categorías. |
| `newProduct` / `setNewProduct` | El formulario del producto (`NewProductState`): nombre, descripción, precio, imagen, categoría, etiqueta, activo, ingredientes y empaques. |
| `editingProductId` | Si se está editando (id) o creando (`null`). |
| `isProductModalOpen`, `isCategoryManagerOpen` | Ventanas abiertas. |
| `tempIngredientName`, `tempPackagingName` | Lo escrito para agregar un ingrediente o empaque nuevo. |
| `selectedCatalogCategory`, `catalogSearch` | Filtros. |
| `showToast`, `setConfirmModal` | Avisos y confirmaciones. |

## Funciones
| Función | Qué hace |
|---|---|
| `handleImageFileSelected(file)` | Sube la foto y guarda la URL en el formulario. `isUploadingImage` muestra que está subiendo. |
| `handleAddProduct()` | **Guarda** el producto (ver abajo). |
| `handleEditProduct(producto)` | Llena el formulario con el producto y abre la ventana. |
| `toggleProductStatus(id)` | Activo ↔ Oculto. |
| `updatePrice(id, precio)` | Cambia el precio desde la lista. |

## `handleAddProduct()` paso a paso
1. Si falta nombre o precio, no hace nada.
2. **Costo de la receta:** suma `costo unitario × cantidad` de cada ingrediente y empaque. El costo
   unitario lo busca en el inventario por nombre (`unitCost`, o `totalCost ÷ stock`).
3. **Imagen:** si no se subió foto, usa una de ejemplo según la categoría.
4. Si `editingProductId` existe → `updateProduct(...)`; si no → `addProduct(...)`. Envía también
   `costPrice` (el costo calculado), `ingredients` y `packaging`.
5. Si funcionó: limpia el formulario y cierra la ventana.
6. Si falló: muestra el primer error de validación de PHP (`Object.values(err.errors)[0][0]`) o el mensaje general.

En PHP, cada ingrediente de la receta se busca **por nombre** y, si no existe, se crea con stock 0
(`Ingrediente::resolverOCrear()`).

## Partes de la ventana del producto
Información básica → selector de categoría (con opción de crear una nueva ahí mismo) → precio de venta
→ foto → **receta** (ingredientes con cantidad, selección rápida desde el inventario, costo total) →
**empaques y desechables** → descripción.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../MenuSection"` porque lo importan: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
