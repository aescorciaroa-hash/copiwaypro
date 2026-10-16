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

## Opción A: instalación automática (recomendada)
1. Copia el proyecto en `C:\laragon\www\copiwaypro`.
2. Abre Laragon y dale **Iniciar todo** (MySQL debe estar encendido).
3. Haz doble clic en **`install.bat`** (o ejecútalo en una terminal dentro de la carpeta).
4. Cuando pregunte `Cargar datos de DEMO? [s/N]`, responde **`s`** si quieres usuarios y productos de ejemplo.
5. (Opcional) En una terminal dentro de la carpeta: `composer install` (para correo y notificaciones).
6. Abre **http://localhost/copiwaypro/**.

¿Qué hace `install.bat`? (detalle en [documentacion.md/install.md](../install.md))
1. Busca PHP y MySQL de Laragon.
2. Revisa que MySQL esté encendido.
3. Crea la base de datos con `database\schema.sql`. ⚠️ **Si ya existía, la borra.**
4. Si dijiste que sí, carga `database\seed.sql` (datos de ejemplo).
5. Crea el `.env` copiando `.env.example` (solo si no existe).
6. `npm install` (descarga las librerías de React).
7. `npm run build` (compila React a `public/assets/`).

## Ya tenía el sistema instalado (actualizar la base de datos)
Si tu base de datos se creó antes de que existieran el pedido manual, el canje de puntos y los datos
del negocio en el ticket, **no vuelvas a ejecutar `schema.sql`** (borraría tus datos). Ejecuta solo
la migración, una vez:

```powershell
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < database\migraciones\001_pedido_manual_puntos_ticket.sql
```
Si responde `Duplicate column name`, ya estaba aplicada. Detalle en
[la migración 001](../database/migraciones/001_pedido_manual_puntos_ticket.md).

## Opción B: instalación paso a paso
Ejecuta esto en una terminal dentro de `C:\laragon\www\copiwaypro`:

```powershell
# 1. Base de datos (ajusta la versión de MySQL de tu Laragon)
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 < database\schema.sql

# 2. (Opcional) Datos de ejemplo
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < database\seed.sql

# 3. Configuración
copy .env.example .env

# 4. Frontend
npm install
npm run build

# 5. (Opcional) Librerías de PHP
composer install

# 6. (Si no cargaste los datos de ejemplo) Primer administrador
php bin\create-admin.php
```

`--default-character-set=utf8mb4` es importante: sin él, las tildes y la ñ se dañan al importar.

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
php bin\create-admin.php
```
Te pregunta los datos del **Programador** (quien crea administradores) y después los del
**Administrador**. Detalle en [documentacion.md/bin/create-admin.md](../bin/create-admin.md).

## Comprobar que todo quedó bien
| Prueba | Resultado esperado |
|---|---|
| Abrir http://localhost/copiwaypro/ | La página de inicio con el menú. |
| Abrir http://localhost/copiwaypro/api/settings | Un texto JSON con el horario y la tarifa. |
| Iniciar sesión con el administrador | Llega al panel `/admin`. |

Si algo falla, revisa [Problemas comunes](13-problemas-comunes.md).
