# 2. Instalación

Esta guía es para instalar el proyecto **en un computador nuevo**. Si ya lo tienes funcionando, ve a
[Arrancar y detener el sistema](03-arrancar-el-sistema.md).

## Lo que necesitas
| Programa | Para qué | Cómo verificar |
|---|---|---|
| **Laragon** (incluye Apache, PHP 8.1+ y MySQL 8) | Servidor web, PHP y base de datos | Abre Laragon y dale **Iniciar todo** |
| **Node.js** (con npm) | Instalar y compilar React | `node -v` y `npm -v` en una terminal |
| **Composer** (opcional) | Librerías de correo y notificaciones push | `composer --version` |
| **Git** (opcional) | Descargar y versionar el código | `git --version` |

## Instalación paso a paso
1. Copia el proyecto en `C:\laragon\www\copiwaypro`.
2. Abre Laragon y dale **Iniciar todo** (MySQL debe estar encendido).
3. Ejecuta esto en una terminal dentro de `C:\laragon\www\copiwaypro`
   (la base de datos también se puede importar desde HeidiSQL o phpMyAdmin de Laragon):

```powershell
# 1. Base de datos (ajusta la versión de MySQL de tu Laragon). ⚠️ Si ya existía, la borra.
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 < sql\schema.sql

# 2. (Opcional) Datos de ejemplo
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < sql\seed.sql

# 3. Conexión: revisa config\database.php (con Laragon no hay que cambiar nada)

# 4. Frontend
npm install
npm run build

# 5. (Opcional) Librerías de PHP
composer install

# 6. (Si no cargaste los datos de ejemplo) Primer administrador
php sql\create-admin.php
```

`--default-character-set=utf8mb4` es importante: sin él, las tildes y la ñ se dañan al importar.

4. Abre **http://localhost/copiwaypro/**.

## Usuarios de ejemplo (solo si cargaste `seed.sql`)
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@copiway.com | Copiway2024! |
| Cocina | carlos.mendoza@copiway.com | Copiway2024! |
| Domiciliario | valentina.rojas@copiway.com | Copiway2024! |
| Cliente | juan.perez@email.com | Cliente2024! |

Cocina y domiciliario también necesitan un **PIN** para su panel. Los usuarios del `seed.sql` no
traen PIN: el administrador se lo asigna desde **Equipo y Personal** (ver [Roles y usuarios](05-roles-y-usuarios.md)).

## Crear el primer administrador sin datos de ejemplo
```powershell
php sql\create-admin.php
```
Te pregunta los datos del **Programador** (quien crea administradores) y después los del
**Administrador**. Detalle en [Documentacion.md/sql/create-admin.md](../sql/create-admin.md).

## Comprobar que todo quedó bien
| Prueba | Resultado esperado |
|---|---|
| Abrir http://localhost/copiwaypro/ | La página de inicio con el menú. |
| Abrir http://localhost/copiwaypro/api/settings | Un texto JSON con el horario y la tarifa. |
| Iniciar sesión con el administrador | Llega al panel `/admin`. |

Si algo falla, revisa [Problemas comunes](13-problemas-comunes.md).
