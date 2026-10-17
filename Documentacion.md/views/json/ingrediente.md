# views/json/ingrediente.php
¿No entiendes una palabra? Mira el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Organiza los datos del inventario antes de enviarlos a React.
Cambia los nombres de la base de datos a los que usa React (ej. `nombre` → `name`, `precio` → `price`).

## ¿Qué hace?
- organiza un insumo para la pantalla de inventario
- organiza un ingrediente para armar hamburguesas

## Sus funciones
| Función | Qué hace | La usan |
|---|---|---|
| `ingrediente_a_inventario()` | organiza un insumo para la pantalla de inventario | `Ingrediente::comoInventario()`, `Ingrediente::listarInventario()` |
| `ingrediente_a_catalogo()` | organiza un ingrediente para armar hamburguesas | `Ingrediente::listarIngredientes()` |

## ¿Con qué se conecta?
- **Lo carga:** `config/helpers.php` (en todas las peticiones).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte una fila de INGREDIENTE al JSON del frontend. Dos formas: inventario (/api/inventory) y catalogo (/api/ingredients)."* |
| 7 | `function ingrediente_a_inventario($fila)` | Función `ingrediente_a_inventario($fila)`: organiza un insumo para la pantalla de inventario. La usa `Ingrediente::listarInventario()` y `comoInventario()` (en `models/Ingrediente.php`). |
| 8 | `{` | Abre la función `ingrediente_a_inventario()`. |
| 9 | `return [` | Devuelve una lista nueva con los nombres que usa React: |
| 10 | `'id' => (string) $fila['id_ingrediente'],` | `'id'`: el número del insumo, como texto. |
| 11 | `'name' => $fila['nombre'],` | `'name'`: el nombre. |
| 12 | `'stock' => (float) $fila['cantidad_stock'],` | `'stock'`: cuánto hay, como número con decimales. |
| 13 | `'totalCost' => $fila['costo_total'] !== null ? (float) $fila['costo_total'] : null,` | `'totalCost'`: cuánto vale todo lo que hay. Si no tiene, `null`. |
| 14 | `'unitCost' => (float) $fila['costo_unitario'],` | `'unitCost'`: cuánto cuesta una unidad. |
| 15 | `'unit' => $fila['unidad_medida'],` | `'unit'`: la unidad (gramos, unidades...). |
| 16 | `'category' => $fila['categoria_nombre'],` | `'category'`: la categoría. |
| 17 | `'supplier' => $fila['proveedor'],` | `'supplier'`: el proveedor. |
| 18 | `'notes' => $fila['notas'],` | `'notes'`: notas. |
| 19 | `'image' => $fila['imagen'],` | `'image'`: la foto. |
| 20 | `'createdAt' => $fila['creado_en'],` | `'createdAt'`: cuándo se creó. |
| 21 | `];` | Cierra la lista. |
| 22 | `}` | Cierra la función `ingrediente_a_inventario()`. |
| 24 | `function ingrediente_a_catalogo($fila)` | Función `ingrediente_a_catalogo($fila)`: organiza un ingrediente para que el cliente arme su hamburguesa. La usa `Ingrediente::listarIngredientes()`. |
| 25 | `{` | Abre la función `ingrediente_a_catalogo()`. |
| 26 | `$precio = (float) $fila['precio_extra'];` | Guarda en `$precio` el precio extra del ingrediente. |
| 27 | `if ($precio <= 0) {` | Si el precio es 0 o menos (`<=`)... |
| 28 | `$precio = (float) $fila['costo_unitario'];` | ...usa el costo de una unidad como precio. |
| 29 | `}` | Cierra el `if`. |
| 30 | `return [` | Devuelve una lista nueva: |
| 31 | `'id' => (string) $fila['id_ingrediente'],` | `'id'`: el número, como texto. |
| 32 | `'name' => $fila['nombre'],` | `'name'`: el nombre. |
| 33 | `'price' => $precio,` | `'price'`: el precio (de arriba). |
| 34 | `'category' => $fila['categoria_nombre'],` | `'category'`: la categoría. |
| 35 | `'stock' => (float) $fila['cantidad_stock'],` | `'stock'`: cuánto hay. |
| 36 | `'image' => $fila['imagen'],` | `'image'`: la foto. |
| 37 | `];` | Cierra la lista. |
| 38 | `}` | Cierra la función `ingrediente_a_catalogo()`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** (helpers.php no lo encuentra) | `Failed to open stream` |
| la función `ingrediente_a_inventario()` | crear insumos, editar insumos, sumar o restar stock, cargar los datos de todas las pantallas | `Call to undefined function ingrediente_a_inventario()` |
| la función `ingrediente_a_catalogo()` | cargar los datos de todas las pantallas | `Call to undefined function ingrediente_a_catalogo()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
