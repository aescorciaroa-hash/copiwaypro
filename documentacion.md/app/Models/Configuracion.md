# app/Models/Configuracion.php

## ¿Para qué sirve?
Lee y guarda la **configuración de la tienda** (tabla `CONFIGURACION_SISTEMA`, que tiene **una sola
fila**) y las **categorías del menú** (tabla `CATEGORIA` con `ambito = 'menu'`).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `SettingController.php` | Ver y cambiar ajustes y categorías. |
| ← lo usa | `PaginaController.php` | Mandar los ajustes a React al abrir una página. |
| ← lo usa | `SyncController.php` | Mandar los ajustes en cada sincronización. |
| ← lo usa | `PedidoService.php` | ¿Está abierta la tienda? ¿Cuánto cuesta el domicilio? ¿Qué margen tiene? |

## Columnas de CONFIGURACION_SISTEMA
| Columna | Qué guarda | React |
|---|---|---|
| `horario_apertura`, `horario_cierre` | Horario (ej: `11:00:00`) | `openTime`, `closeTime` (`"11:00"`) |
| `tienda_abierta_manual` | El admin puede cerrar la tienda a mano | `isOpen` |
| `pausa_emergencia_activa` | Pausa de emergencia | `isPaused` |
| `tarifa_plana_domicilio` | Costo del domicilio | `shippingRate` |
| `margen_ganancia_defecto` | % de ganancia sobre el costo de los extras | `profitMargin` |
| `id_ingrediente_bolsa_global` | Insumo "bolsa" que se descuenta en cada pedido | — |

## Métodos
| Método | Qué hace |
|---|---|
| `get($columna = '*')` | Lee la única fila (todas las columnas o solo una). Usa `$this->conn->query()` porque no tiene parámetros. |
| `obtener()` | Arma el formato de React. Si no existe la fila, usa valores por defecto. Agrega la lista de categorías. |
| `actualizar($campos)` | Guarda los campos enviados. Convierte `"11:00"` → `"11:00:00"` y `true/false` → `1/0`. |
| `agregarCategoria($nombre)` | La crea si no existe (compara en minúsculas con `LOWER()`). |
| `eliminarCategoria($nombre)` | La borra, salvo que la use un producto activo (lanza una excepción con el mensaje). |
| `tiendaAbiertaAhora()` | `true` si está abierta, no pausada y la hora actual está dentro del horario. |
| `aMinutos($hhmm)` (privado) | `"18:30"` → `1110` (18×60 + 30). |
| `tarifaDomicilio()`, `margenGanancia()`, `idIngredienteBolsaGlobal()` | Leen un solo valor. |

## `tiendaAbiertaAhora()` explicado
```php
$ahora  = (int) date('G') * 60 + (int) date('i');
```
La hora actual en minutos (`date('G')` = hora 0-23, `date('i')` = minutos).

```php
if ($abre <= $cierra) {
    return $ahora >= $abre && $ahora <= $cierra;
}
return $ahora >= $abre || $ahora <= $cierra;
```
- Horario normal (11:00 a 22:00): abierta si está **entre** las dos horas.
- Horario que pasa la medianoche (18:00 a 02:00): abierta si es **después** de abrir **o antes** de cerrar.

## `array_column()`
```php
$categorias = array_column($rows, 'nombre');
```
De una lista de filas `[['nombre' => 'Bebidas'], ['nombre' => 'Hamburguesas']]` saca solo los
nombres: `['Bebidas', 'Hamburguesas']`.
