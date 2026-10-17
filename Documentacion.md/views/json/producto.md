# views/json/producto.php
¿No entiendes una palabra? Mira el [glosario](../../GLOSARIO.md).

## ¿Para qué sirve?
Organiza los datos de los productos antes de enviarlos a React.
Cambia los nombres de la base de datos a los que usa React (ej. `nombre` → `name`, `precio` → `price`).

## ¿Qué hace?
- organiza un producto (el administrador también ve el costo)

## Sus funciones
| Función | Qué hace | La usan |
|---|---|---|
| `producto_a_json()` | organiza un producto (el administrador también ve el costo) | `Producto::comoJson()` |

## ¿Con qué se conecta?
- **Lo carga:** `config/helpers.php` (en todas las peticiones).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-6 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte una fila de PRODUCTO al JSON del frontend. $esAdmin = true: JSON completo (costo, receta y empaques). $esAdmin = false: catalogo publico (solo id y nombre de los ingredientes)."* |
| 8 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Valor del ENUM en la base de datos => texto de la etiqueta en el frontend."* |
| 9 | `const PRODUCTO_ENUM_A_BADGE = [` | Crea la constante `PRODUCTO_ENUM_A_BADGE`: traduce la etiqueta del producto de la base de datos al texto que muestra React. |
| 10 | `'mas_vendido' => 'Más Vendido',` | `'mas_vendido'` se muestra como `'Más Vendido'`. |
| 11 | `'recomendado' => 'Recomendado',` | `'recomendado'` → `'Recomendado'`. |
| 12 | `'nuevo' => 'Nuevo',` | `'nuevo'` → `'Nuevo'`. |
| 13 | `'especialidad' => 'Especialidad',` | `'especialidad'` → `'Especialidad'`. |
| 14 | `];` | Cierra la lista. |
| 16 | `function producto_a_json($fila, $ingredients, $packaging, $esAdmin = false)` | Función `producto_a_json(...)`: organiza un producto para React. La usa `Producto::comoJson()` (en `models/Producto.php`). Recibe la fila, los ingredientes, los empaques y si quien mira es el administrador (`$esAdmin`, por defecto `false`). |
| 17 | `{` | Abre la función `producto_a_json()`. |
| 18 | `$etiqueta = PRODUCTO_ENUM_A_BADGE[$fila['etiqueta_destacada']] ?? null;` | Traduce la etiqueta con la lista de arriba y la guarda en `$etiqueta`. Si no tiene, `null`. |
| 20 | `$resultado = [` | Arma `$resultado` con los datos que ven todos: |
| 21 | `'id' => (string) $fila['id_producto'],` | `'id'`: el número, como texto. |
| 22 | `'name' => $fila['nombre'],` | `'name'`: el nombre. |
| 23 | `'description' => $fila['descripcion'],` | `'description'`: la descripción. |
| 24 | `'price' => (float) $fila['precio'],` | `'price'`: el precio. |
| 25 | `'active' => $fila['estado'] === 'activo',` | `'active'`: `true` si el estado es `'activo'` (`===` compara). |
| 26 | `'image' => $fila['imagen'],` | `'image'`: la foto. |
| 27 | `'category' => $fila['categoria_nombre'],` | `'category'`: la categoría. |
| 28 | `'prepTime' => $fila['tiempo_preparacion'] !== null ? (int) $fila['tiempo_preparacion'] : null,` | `'prepTime'`: los minutos de preparación (o `null`). |
| 29 | `'badge' => $etiqueta,` | `'badge'`: la etiqueta traducida. |
| 30 | `];` | Cierra la lista. |
| 32 | `if ($esAdmin) {` | Si quien mira es el administrador... |
| 33 | `$resultado['ingredients'] = $ingredients;` | ...le agrega los ingredientes completos (con cuánto se gasta de cada uno). |
| 34 | `$resultado['packaging'] = $packaging;` | ...los empaques. |
| 35 | `$resultado['costPrice'] = $fila['costo_calculado'] !== null ? (float) $fila['costo_calculado'] : null;` | ...y el costo del producto (`'costPrice'`). |
| 36 | `} else {` | Si no (es un cliente o alguien sin sesión)... |
| 37 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El cliente solo ve el id y el nombre de cada ingrediente."* |
| 38 | `$resultado['ingredients'] = [];` | ...empieza la lista de ingredientes vacía (`[]`)... |
| 39 | `foreach ($ingredients as $ing) {` | ...recorre cada ingrediente (`$ing`)... |
| 40 | `$resultado['ingredients'][] = ['id' => $ing['id'], 'name' => $ing['name']];` | ...y agrega solo su id y su nombre (`[] =` agrega al final). Así el cliente no ve los costos. |
| 41 | `}` | Cierra el `foreach`. |
| 42 | `}` | Cierra el `else`. |
| 44 | `return $resultado;` | Devuelve el producto organizado. |
| 45 | `}` | Cierra la función `producto_a_json()`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** (helpers.php no lo encuentra) | `Failed to open stream` |
| la función `producto_a_json()` | crear productos, editar productos, eliminar productos, cargar los datos de todas las pantallas | `Call to undefined function producto_a_json()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
