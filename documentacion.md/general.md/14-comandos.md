# 14. Comandos útiles

Todos se ejecutan en una terminal (PowerShell o CMD) **dentro de la carpeta del proyecto**:
```powershell
cd C:\laragon\www\copiwaypro
```

## Instalar y arrancar
| Comando | Qué hace |
|---|---|
| `install.bat` | Instala todo (base de datos, `.env`, librerías de React y compilación). ⚠️ Recrea la base de datos. |
| `start.bat` | Arranca el sistema sin Apache en `http://localhost:8000/`. |
| `composer install` | Instala las librerías de PHP (correo y notificaciones) en `vendor/`. |
| `php bin\create-admin.php` | Crea el primer administrador. |

## React (frontend)
| Comando | Qué hace |
|---|---|
| `npm install` | Descarga las librerías de React en `node_modules/`. |
| `npm run build` | **Compila** `src/` a `public/assets/`. Necesario después de cambiar React. |
| `npm run dev` | Modo desarrollo en `http://localhost:3000` (se actualiza al guardar). |
| `npm run lint` | Revisa errores de TypeScript sin compilar. |

## PHP
| Comando | Qué hace |
|---|---|
| `php -v` | Versión de PHP. |
| `php -l archivo.php` | Revisa la sintaxis de un archivo PHP. |
| `php -S localhost:8000 -t public public\server-router.php` | Lo mismo que `start.bat`. |
| `php -r "echo password_hash('Clave1234', PASSWORD_DEFAULT);"` | Genera el hash de una contraseña (para cambiarla a mano en MySQL). |

## MySQL
Ajusta la versión de la ruta a la que tengas en `C:\laragon\bin\mysql\`.
```powershell
set MYSQL=C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin
```
| Comando | Qué hace |
|---|---|
| `"%MYSQL%\mysql.exe" -u root hamburguer_copiway` | Entrar a la base de datos para escribir consultas. |
| `"%MYSQL%\mysql.exe" -u root --default-character-set=utf8mb4 < database\schema.sql` | ⚠️ Crear la base desde cero (borra la anterior). |
| `"%MYSQL%\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < database\seed.sql` | Cargar los datos de ejemplo. |
| `"%MYSQL%\mysqldump.exe" -u root --routines --triggers hamburguer_copiway > respaldo.sql` | Hacer un respaldo. |
| `"%MYSQL%\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < respaldo.sql` | Restaurar un respaldo. |

`set MYSQL=...` y `%MYSQL%` funcionan en **CMD**. En PowerShell usa `$MYSQL = "..."` y `& "$MYSQL\mysql.exe" ...`.

### Consultas útiles (dentro de MySQL)
```sql
SHOW TABLES;
SELECT id_pedido, estado, total, fecha_hora FROM PEDIDO ORDER BY id_pedido DESC LIMIT 10;
SELECT nombre, cantidad_stock, umbral_minimo FROM INGREDIENTE WHERE cantidad_stock <= umbral_minimo;
SELECT correo, activo FROM AYUDANTE_COCINA;
SELECT * FROM CONFIGURACION_SISTEMA;
DELETE FROM INTENTO_LOGIN;   -- desbloquear todos los logins
```

## Git
| Comando | Qué hace |
|---|---|
| `git status` | Qué archivos cambiaron. |
| `git diff` | Qué cambió exactamente. |
| `git add .` | Preparar todos los cambios. |
| `git commit -m "mensaje"` | Guardar los cambios en el historial local. |
| `git push` | Subir a GitHub. |
| `git pull` | Traer los cambios de GitHub. |
| `git log --oneline -10` | Últimos 10 commits. |
