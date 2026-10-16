# views/json/ — convertir filas de MySQL al JSON de React

## ¿Por qué existen estos archivos?
La base de datos y React usan **nombres distintos** para los mismos datos:

| MySQL (español, `snake_case`) | React (inglés, `camelCase`) |
|---|---|
| `nombre` | `name` |
| `cantidad_stock` | `stock` |
| `fecha_nacimiento` | `birthday` |
| `estado = 'en_preparacion'` | `status = 'En Preparación'` |

Estas funciones son el **traductor**: reciben una fila de MySQL y devuelven un arreglo con los nombres
y tipos que espera React. Son la "vista" de la API (en vez de HTML, devuelven datos).

## ¿Con qué se conectan?
| Dirección | Archivo |
|---|---|
| ← las carga | `config/helpers.php` (al inicio, con `require_once`) |
| ← las usan | los modelos (`Cliente`, `Producto`, `Ingrediente`, `Pedido`, `Personal`) |
| → el resultado va a | `responderJson()` → React (`src/store/almacenAplicacion.ts`, donde están las mismas "formas" escritas en TypeScript: `interface Product`, `interface Order`...) |

## Conversiones que se repiten
| Código | Para qué |
|---|---|
| `(string) $fila['id_producto']` | React trabaja los ids como texto. |
| `(float) $fila['precio']` | MySQL devuelve los DECIMAL como texto (`"15000.00"`); se convierten a número. |
| `(bool) $fila['activo']` | `1`/`0` → `true`/`false`. |
| `$x !== null ? (float) $x : null` | Si el valor existe, se convierte; si es `NULL`, se deja `null`. |
| `$fila['x'] ?? null` | Si la columna no existe en esa consulta, `null`. |

## Archivos
| Archivo | Funciones |
|---|---|
| [cliente.php](cliente.md) | `cliente_a_json()`, `notificacion_a_json()` |
| [ingrediente.php](ingrediente.md) | `ingrediente_a_inventario()`, `ingrediente_a_catalogo()` |
| [pedido.php](pedido.md) | `pedido_a_json()` |
| [personal.php](personal.md) | `personal_cocina_a_json()`, `personal_domicilio_a_json()` |
| [producto.php](producto.md) | `producto_a_json()` |
