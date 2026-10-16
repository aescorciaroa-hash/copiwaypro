# database/seed.sql

## ¿Para qué sirve?
Llena la base de datos con **datos de ejemplo** (categorías, usuarios, insumos, productos y algunos
pedidos) para poder probar el sistema sin tener que crear todo a mano.

**Solo para desarrollo.** Las contraseñas son públicas y se deben cambiar en un sistema real.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo ejecuta | `install.bat` (si respondes `s` a la pregunta) o a mano: `mysql -u root hamburguer_copiway < database/seed.sql` |
| → necesita | que antes se haya ejecutado `database/schema.sql` |

## Usuarios de ejemplo
| Rol | Correo | Contraseña |
|---|---|---|
| Programador | `programador@copiway.com` | `Copiway2024!` |
| Administrador | `admin@copiway.com` | `Copiway2024!` |
| Cocina | `carlos.mendoza@copiway.com` | `Copiway2024!` |
| Domiciliario | `valentina.rojas@copiway.com` | `Copiway2024!` |
| Clientes | `juan.perez@email.com`, `maria.gomez@email.com`... | `Cliente2024!` |

Las contraseñas están guardadas como **hash** (`$2y$10$...`), igual que lo haría `password_hash()` en PHP.

## Partes del archivo
| Sección | Qué inserta |
|---|---|
| Categorías | Del menú (Hamburguesas, Perros, Bebidas...), de insumos (Carnes, Lácteos...) y Empaques. |
| Cuentas | Programador → Admin → Cocina y Domiciliario, y clientes. |
| Insumos | Ingredientes con stock, costo y proveedor. |
| Bolsa global | Configura qué insumo es la "bolsa" que se descuenta en cada pedido. |
| Productos + receta | Productos del menú y los insumos que gasta cada uno. |
| Pedidos de ejemplo | Algunos pedidos con su detalle y una reseña, para ver el dashboard con datos. |

## SQL que aparece
| Código | Qué hace |
|---|---|
| `INSERT INTO TABLA (col1, col2) VALUES ('a', 'b'), ('c', 'd');` | Inserta varias filas de una vez. |
| `SET @id_admin = LAST_INSERT_ID();` | Guarda en una variable de MySQL el id recién creado, para usarlo en los siguientes INSERT (ej: `creado_por = @id_admin`). |
| `NOW()` | Fecha y hora actual. |
| `INSERT ... SELECT ...` | Inserta filas a partir del resultado de una consulta. |
