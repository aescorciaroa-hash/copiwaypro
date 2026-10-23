# sql/seed.sql

## ¿Para qué sirve?
Carga datos de ejemplo para probar el sistema.

## ¿Qué hace?
- crea las categorías del menú, de los insumos y de los empaques
- crea usuarios de prueba (tabla de abajo)
- crea insumos con su stock, productos con su receta, y la bolsa de empaque de cada domicilio
- crea 3 pedidos de ejemplo con sus productos y una reseña

## Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Programador | `programador@copiway.com` | `Copiway2024!` |
| Administrador | `admin@copiway.com` | `Copiway2024!` |
| Cocina | `carlos.mendoza@copiway.com` | `Copiway2024!` |
| Domiciliario | `valentina.rojas@copiway.com` | `Copiway2024!` |
| Cliente | `juan.perez@email.com`, `maria.gomez@email.com`, `carlos.diaz@email.com` | `Cliente2024!` |

Las contraseñas están guardadas cifradas (con `password_hash`); por eso en el archivo se ve un texto
raro que empieza por `$2y$10$`. **Hay que cambiarlas** si el sistema se usa de verdad.

## ¿Con qué se conecta?
- **Se usa:** después de `schema.sql`, solo si quieres datos de ejemplo.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | no afecta el sistema (solo no hay datos de ejemplo para probar) |
| un `INSERT` de una cuenta | ese usuario de prueba no existe y no se puede entrar con él |
