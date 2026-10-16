# start.bat

## ¿Para qué sirve?
Arranca el proyecto **sin Apache**, con el servidor que trae PHP, en `http://localhost:8000/`.
Se ejecuta con doble clic. Para detenerlo: `Ctrl + C`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| → ejecuta | `php -S localhost:8000 -t public public\server-router.php` | El servidor. |
| → usa | `public/server-router.php` | Decide qué responder (hace el trabajo del `.htaccess`). |
| → necesita | `public/assets/` | Si no existe, avisa que hay que ejecutar `install.bat` o `npm run build`. |

## Partes del script
| Parte | Qué hace |
|---|---|
| `@echo off` | No mostrar cada comando en pantalla. |
| `cd /d "%~dp0"` | Ir a la carpeta donde está el `.bat` (la del proyecto). |
| `where php` | Busca si `php` está en el PATH de Windows. |
| `for /f ... dir "C:\laragon\bin\php\php-*"` | Si no, busca el PHP de Laragon (la versión más nueva). |
| `if not exist "public\index.html"` | Aviso si el frontend no está compilado. |
| `OPENSSL_CONF` | Configura OpenSSL de Laragon; sin esto, en Windows las notificaciones push no pueden generar sus claves. |
| `"%PHP_EXE%" -S localhost:8000 -t public public\server-router.php` | Arranca el servidor: `-S` = dirección, `-t public` = carpeta raíz, último = el router. |
