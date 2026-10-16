# database/migraciones/001_pedido_manual_puntos_ticket.sql

## ¿Para qué sirve?
Agrega a una base de datos **que ya existe** las columnas que necesitan tres funciones:
- **Pedido manual** (llamada o WhatsApp) con **cliente invitado**.
- **Canje de puntos** al pagar.
- **Datos del negocio** editables para el ticket de cocina.

No borra ningún dato. Una instalación nueva **no** la necesita: `schema.sql` ya trae estas columnas.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ↔ igual que | `database/schema.sql` | Deja la base existente igual a una recién instalada. |
| → la usan | `PedidoService.php`, `Pedido.php`, `Caja.php`, `Configuracion.php` | Leen y guardan las columnas nuevas. |

## Cómo ejecutarla (una sola vez)
```powershell
cd C:\laragon\www\copiwaypro
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < database\migraciones\001_pedido_manual_puntos_ticket.sql
```
Si se ejecuta dos veces, MySQL responde `Duplicate column name` y no cambia nada (MySQL 8.0 no
tiene `ADD COLUMN IF NOT EXISTS`). Antes de ejecutarla en un servidor real conviene sacar una
copia de seguridad con `mysqldump`.

## Qué cambia
### Tabla `PEDIDO`
| Cambio | Para qué |
|---|---|
| `id_cliente` pasa a aceptar `NULL` | Pedido de un **cliente invitado** (sin cuenta). |
| `id_admin_registro` (relación con ADMINISTRADOR) | Qué administrador registró el pedido manual. |
| `nombre_contacto`, `telefono_contacto` | Nombre y celular que dictó el cliente por teléfono. |
| `puntos_canjeados` | Puntos que el cliente usó para pagar. |
| `descuento_puntos` | Lo que valieron esos puntos en pesos. |

### Tabla `CONFIGURACION_SISTEMA`
| Columna | Valor por defecto | Para qué |
|---|---|---|
| `valor_punto` | `10` | Pesos que vale 1 punto al canjearlo. |
| `minimo_puntos_canje` | `100` | Puntos mínimos para poder canjear. |
| `negocio_nombre` | `COPIWAY PRO` | Nombre en el ticket. |
| `negocio_nit` | `900.123.456-7` | NIT en el ticket. |
| `negocio_direccion` | `Cra 43 # 79-115, Barranquilla` | Dirección en el ticket. |
| `negocio_telefono` | `(300) 123-4567` | Teléfono en el ticket. |
| `negocio_instagram` | `@copiway_pro` | Instagram en el pie del ticket. |
| `negocio_web` | `www.copiway.com` | Página web en el pie del ticket. |

Los datos del negocio arrancan con los mismos valores de ejemplo que antes estaban escritos en el
código, para que el ticket se vea igual hasta que el administrador los cambie en **Ajustes**.

## Conceptos de SQL
| Código | Significado |
|---|---|
| `ALTER TABLE T ...` | Cambia la estructura de una tabla que ya existe, sin borrar sus filas. |
| `MODIFY columna TIPO NULL` | Cambia el tipo de una columna (aquí, para que acepte vacío). |
| `ADD COLUMN ... AFTER otra` | Agrega una columna y la ubica después de `otra`. |
| `ADD FOREIGN KEY (x) REFERENCES T(y)` | Relación: el valor de `x` debe existir en `T`. |
