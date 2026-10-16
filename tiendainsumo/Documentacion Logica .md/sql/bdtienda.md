# sql/bdtienda.sql — Diseño de la base de datos

No es PHP, es SQL, pero es indispensable para que los modelos tengan sentido.

## Explicación palabra por palabra

- **`CREATE TABLE`**: crea una tabla nueva.
- **`int PRIMARY KEY AUTO_INCREMENT`**: `id_usuario` es la llave primaria (identifica cada fila de forma única) y se autoincrementa.
- **`varchar(100)`**: texto de longitud variable, máximo 100 caracteres.
- **`NOT NULL`**: esa columna es obligatoria.
- **`UNIQUE`**: no puede haber dos filas con el mismo valor ahí (por eso `email` es único).
- **`boolean DEFAULT true`**: si no se especifica, vale `true` por defecto.
- **`ALTER TABLE ... ADD FOREIGN KEY`**: llave foránea — obliga a que cualquier valor en `usuarios.id_rol` exista previamente en `roles.id_rol`. Esto conecta relacionalmente las tablas.

## Resto del archivo

El resto del archivo define tablas para `productos`, `ventas`, `entradas`, `movimientos_inventario`, etc. — la base para módulos que aún no están programados en PHP. El siguiente paso lógico sería crear `models/Producto.php`, `models/Venta.php`, etc., siguiendo el mismo patrón de [[../models/Usuario]].
