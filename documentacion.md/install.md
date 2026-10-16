# install.bat

## ¿Para qué sirve?
**Instala todo el proyecto de una vez** en un computador nuevo con Laragon: crea la base de datos,
crea el `.env`, descarga las librerías de React y compila el frontend.

## ¿Con qué se conecta?
| Paso | Usa |
|---|---|
| Crear la base de datos | `database/schema.sql` |
| Datos de prueba (opcional) | `database/seed.sql` |
| Crear el `.env` | `.env.example` |
| Librerías y compilación | `package.json` (`npm install`, `npm run build`) |
| Al final sugiere | `bin/create-admin.php` y `start.bat` |

## Pasos
| Paso | Qué hace |
|---|---|
| Detectar PHP y MySQL | Los busca en el PATH o en `C:\laragon\bin\...`. Si no los encuentra, muestra un error. |
| [1/5] Verificar MySQL | `mysql -u root -e "SELECT 1;"`: revisa que MySQL esté encendido. |
| [2/5] Crear la base | Ejecuta `schema.sql`. **Ojo:** ese archivo hace `DROP DATABASE`, borra la base si ya existía. |
| [2b/5] Datos demo | Pregunta `[s/N]`. Con `s` carga `seed.sql` (usuario de ejemplo `admin@copiway.com`, contraseña `Copiway2024!`). |
| [3/5] `.env` | Copia `.env.example` a `.env` solo si todavía no existe. |
| [4/5] `npm install` | Descarga las librerías de React. |
| [5/5] `npm run build` | Compila React a `public/assets/`. |
| Final | Muestra cómo crear el primer admin y cómo abrir el sitio. |

| Comando de Windows | Qué significa |
|---|---|
| `set "VAR=valor"` | Crea una variable. Se usa como `%VAR%`. |
| `if errorlevel 1` | "Si el comando anterior falló". |
| `exit /b 1` | Termina con error. |
| `set /p VAR="pregunta"` | Pregunta algo y guarda la respuesta. |
| `call npm ...` | Ejecuta otro programa y vuelve al script. |
| `rem` | Comentario. |
