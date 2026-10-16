# app/Models/Producto.php

## ¿Para qué sirve?
Consultas de los **productos del menú** (tabla `PRODUCTO`) y de su **receta** (tabla `RECETA`:
qué insumos y cuánto de cada uno lleva cada producto).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `ProductController.php` | Listar, crear, editar, borrar. |
| ← lo usa | `SyncController.php` | Enviar el catálogo a React. |
| → usa | `Ingrediente` (modelo) | `resolverOCrear()`: buscar o crear cada insumo de la receta. |
| → usa | `producto_a_json()` (`app/Views/json/producto.php`) | Formato de React. |
| → tablas | `PRODUCTO`, `RECETA`, `CATEGORIA`, `INGREDIENTE` | |

## Constantes
| Constante | Para qué |
|---|---|
| `BADGE_A_ENUM` | Traduce la etiqueta que muestra React (`'Más Vendido'`) al valor que acepta MySQL (`'mas_vendido'`). |
| `BASE` | El SELECT con el JOIN a CATEGORIA, para traer también el nombre de la categoría (`categoria_nombre`). |

## Columnas importantes de PRODUCTO
| Columna | En React |
|---|---|
| `nombre`, `descripcion`, `precio` | `name`, `description`, `price` |
| `costo_calculado` | `costPrice` (solo lo ve el admin) |
| `imagen` | `image` (URL que devolvió `UploadController`) |
| `tiempo_preparacion` | `prepTime` (minutos) |
| `estado` (`activo`/`oculto`) | `active` (true/false) |
| `etiqueta_destacada` | `badge` |
| `id_categoria` | `category` (el nombre) |

## Métodos
| Método | Qué hace |
|---|---|
| `listar($soloActivos, $esAdmin)` | Todos los productos (menos el oculto "Hamburguesa Personalizada"). Con `$soloActivos` solo los activos. |
| `buscar($id, $esAdmin)` | Un producto en formato JSON, o `null`. |
| `comoJson($row, $esAdmin)` | Trae su receta y la pasa por `producto_a_json()`. |
| `recetaDe($idProducto)` (privado) | Lee la receta y la separa en **ingredientes** y **empaques** según `c.ambito` (`empaque_desechable` = empaque). |
| `badgeAEnum($badge)` (privado) | Convierte la etiqueta al valor del ENUM; si no la reconoce, `'ninguna'`. |
| `crear($d)` | Crea el producto y su receta **en una transacción**. |
| `actualizar($id, $d)` | Cambia los campos enviados y, si llegan `ingredients` o `packaging`, rehace la receta. También en transacción. |
| `eliminar($id)` | `DELETE` del producto (su receta se borra sola por `ON DELETE CASCADE`). |
| `sincronizarReceta(...)` (privado) | Borra la receta vieja y la vuelve a escribir. |
| `resolverCategoria($nombre)` (privado) | Busca la categoría por nombre; si no existe, la crea. Devuelve su id. |

## La transacción de `crear()`
```php
$this->conn->begin_transaction();
try {
    ... INSERT INTO PRODUCTO ...
    $this->sincronizarReceta($id, ...);
    $this->conn->commit();
    return $id;
} catch (Exception $e) {
    $this->conn->rollback();
    throw $e;
}
```
Si la receta falla, el `rollback()` deshace también el producto. Así nunca queda un producto a medias.
`throw $e` vuelve a lanzar el error para que el controlador responda el mensaje.

## `sincronizarReceta()` explicado
```php
foreach ($ingredientes as $item) { $item['ambito'] = 'insumo_alimenticio'; $lista[] = $item; }
foreach ($empaques as $item)     { $item['ambito'] = 'empaque_desechable'; $lista[] = $item; }
```
Junta ingredientes y empaques en una sola lista, marcando de qué tipo es cada uno.

```php
$idIngrediente = $ingredienteModel->resolverOCrear($item['name'], $item['ambito']);
```
Busca el insumo **por nombre**. Si el admin escribió un insumo nuevo, se crea con stock 0.
Después se inserta la línea en RECETA con su cantidad (`quantity`, por defecto 1).
