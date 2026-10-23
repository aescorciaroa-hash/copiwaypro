# models/ — cómo funciona un modelo

Un **modelo** es una clase que habla con **una o varias tablas** de MySQL. Los controladores nunca
escriben SQL: le piden al modelo lo que necesitan.

```
Controlador  ──►  Modelo  ──►  MySQL
   (qué hacer)    (cómo consultar)  (los datos)
```

## La forma de todos los modelos
Los modelos no cargan `config/database.php`: ya lo cargó `public/index.php` y `$conn` existe. Un
modelo solo hace `require_once` de otro modelo que use (por ejemplo `Producto` carga `Ingrediente`).

```php
class Cliente
{
    private $conn;                      // 1. aquí se guarda la conexión

    public function __construct()       // 2. se ejecuta al hacer new Cliente()
    {
        global $conn;                   //    toma la $conn creada en config/database.php
        $this->conn = $conn;            //    y la guarda dentro del objeto
    }

    public function buscarCrudo($id)   // 3. un método = una consulta
    {
        $stmt = $this->conn->prepare("SELECT * FROM CLIENTE WHERE id_cliente = ? LIMIT 1");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }
}
```

## Las líneas de una consulta
| Línea | Qué hace |
|---|---|
| `$stmt = $this->conn->prepare("... WHERE id = ?")` | Prepara la consulta. Cada `?` es un espacio vacío que se llena después. |
| `$stmt->bind_param("s", $id)` | Llena los `?` en orden. La primera cadena dice el tipo de cada uno: `s` = texto, `i` = entero, `d` = decimal. `"si"` = el 1.º texto y el 2.º entero. |
| `$stmt->execute()` | Ejecuta la consulta en MySQL. |
| `$stmt->get_result()->fetch_assoc()` | Trae **una fila** como arreglo: `['id_cliente' => 3, 'nombre' => 'Juan', ...]`. Si no hay, `null`. |
| `->fetch_all(MYSQLI_ASSOC)` | Trae **todas** las filas (un arreglo de arreglos). |
| `$stmt->close()` | Libera la consulta. |
| `return $row ?: null;` | `?:` = "si `$row` tiene algo, devuélvelo; si no, devuelve `null`". |

**¿Por qué `?` y no meter la variable dentro del texto del SQL?** Porque así MySQL nunca confunde los
datos del usuario con código SQL. Esto evita la **inyección SQL** (el ataque más común a bases de datos).

## Otras cosas que verás
| Código | Qué hace |
|---|---|
| `$this->conn->insert_id` | Después de un INSERT: el id que MySQL le asignó a la fila nueva. |
| `$stmt->affected_rows` | Después de un UPDATE/DELETE: cuántas filas cambiaron. |
| `$this->conn->begin_transaction()` | Empieza una transacción: varios cambios que deben guardarse **todos o ninguno**. |
| `$this->conn->commit()` | Confirma la transacción (se guarda todo). |
| `$this->conn->rollback()` | Deshace la transacción (si algo falló a la mitad). |
| `bind_param(tiposDe($values), ...$values)` | Para consultas con una cantidad variable de `?`. `tiposDe()` (en `helpers.php`) arma la cadena de tipos y `...$values` pasa cada valor del arreglo como un parámetro separado. |
| `const BASE = "SELECT ..."` | Un SELECT que se repite en varios métodos, escrito una sola vez. Se usa con `self::BASE`. |
| `FOR UPDATE` | En un SELECT dentro de una transacción: **bloquea** esas filas para que nadie más las cambie al mismo tiempo. |

## Fila "cruda" vs JSON
La base de datos usa nombres en español (`nombre`, `precio`) y React espera nombres en inglés
(`name`, `price`). Por eso varios modelos tienen dos versiones:
- `buscarCrudo()` → la fila tal cual viene de MySQL.
- `buscar()` / `comoJson()` → la fila ya convertida con las funciones de `views/json/`.

## Modelos del proyecto
| Modelo | Tablas |
|---|---|
| [Cliente](Cliente.md) | CLIENTE, CLIENTE_NOTIFICACION |
| [Producto](Producto.md) | PRODUCTO, RECETA |
| [Ingrediente](Ingrediente.md) | INGREDIENTE, CATEGORIA, MOVIMIENTO_INVENTARIO |
| [Pedido](Pedido.md) | PEDIDO, DETALLE_PEDIDO, PERSONALIZACION |
| [Personal](Personal.md) | AYUDANTE_COCINA, DOMICILIARIO |
| [Configuracion](Configuracion.md) | CONFIGURACION_SISTEMA, CATEGORIA |
| [Caja](Caja.md) | REPORTE_CAJA, LIQUIDACION_DOMICILIARIO, DETALLE_AUDITORIA |
| [Usuario](Usuario.md) | ADMINISTRADOR |
| [CodigoVerificacion](CodigoVerificacion.md) | CODIGO_VERIFICACION |
| [IntentoLogin](IntentoLogin.md) | INTENTO_LOGIN |
| [PushSuscripcion](PushSuscripcion.md) | PUSH_SUSCRIPCION |
