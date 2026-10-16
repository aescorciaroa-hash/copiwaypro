# 15. Si algo deja de funcionar (encontrar lo que se borró)

En este proyecto **cada pieza se usa en un solo lugar**: no hay rutas, métodos ni `require_once`
repetidos o de respaldo. Por eso, si se borra algo, **esa parte deja de funcionar** y el error dice
qué falta. Esta guía explica cómo encontrarlo.

## Paso 1: ver el error
| Dónde falla | Dónde mirar |
|---|---|
| Un botón no guarda / sale un aviso rojo | Navegador → **F12 → Red (Network)** → toca la petición `/api/...` en rojo → **Respuesta**. |
| Una página no abre o sale en blanco | La misma página muestra el error de PHP, o **F12 → Consola**. |
| Todas las pantallas sin datos | **F12 → Red** → la petición `sync` → **Respuesta**. |

Con `'debug' => true` (en `config/app.php`) la respuesta trae el mensaje real y el `trace` (la lista de
archivos y líneas por donde pasó el error).

## Paso 2: leer el mensaje
| Mensaje | Qué se borró | Dónde buscar |
|---|---|---|
| `Failed to open stream: No such file or directory` (…`archivo.php`) | Ese **archivo completo**. | El mensaje dice qué archivo falta y cuál lo pedía (`require` o `require_once`). |
| `Class "X" not found` | El `require_once` del modelo `X` (o el archivo `models/X.php`). | El controlador o modelo que usa `X` (ver la ficha de `X` → "¿Qué pasa si se borra?"). |
| `Call to undefined method X::metodo()` | El método `metodo()` de la clase `X`. | `controllers/X.php` o `models/X.php`. |
| `Call to undefined function nombre()` | La función `nombre()` o el `require_once` del archivo que la tiene. | `config/helpers.php` o `views/json/*.php`. |
| `Ruta no encontrada.` (404) | La línea de la ruta en `config/rutas.php`, o la rama `elseif ($accion === '...')` del final del controlador. | `config/rutas.php` y el final del controlador. |
| `Metodo no permitido.` (405) | La línea de la ruta en `config/rutas.php` (la dirección existe, pero con otro método). | `config/rutas.php`. |
| `Pagina no encontrada.` (404) | La línea en `config/paginas.php` o la rama del final de `PaginaController.php`. | `config/paginas.php`, `controllers/PaginaController.php`. |
| `Vista no encontrada: X` | El archivo `views/paginas/X.php`. | `views/paginas/`. |
| `Pantalla no encontrada: "X"` | El `$pagina = 'X'` de la vista, o la línea `X: Componente,` de `src/main.tsx`. | `views/paginas/`, `src/main.tsx`. |
| `Undefined array key "x"` | La clave `'x'` de un arreglo (ej. en `config/app.php`). | El archivo y la línea que dice el mensaje. |
| `Undefined variable $x` | La línea donde se creaba `$x`. | El archivo y la línea que dice el mensaje. |
| `Undefined constant X::NOMBRE` | La constante `const NOMBRE` de la clase `X`. | `models/X.php` o `config/Session.php`. |
| `Call to a member function prepare() on null` | La conexión: `config/database.php`, su `require_once` en `public/index.php`, o el `global $conn` de un modelo. | `config/database.php`, `public/index.php`, el modelo. |
| `Error de Conexion: ...` | Una variable de `config/database.php` (o MySQL está apagado). | `config/database.php`, Laragon. |
| `Unknown column` / `Table ... doesn't exist` | Una columna o tabla en MySQL. | `sql/schema.sql` y el modelo que la usa. |

## Paso 3: ir a la ficha
Cada archivo tiene su ficha en `Documentacion.md/` (misma carpeta y nombre). Al final de cada una está
la sección **"¿Qué pasa si se borra?"**, con lo que deja de funcionar y el error exacto de cada parte
(el archivo completo, cada `require_once`, cada método, cada ruta).

## Paso 4: buscar en el código
- **Ctrl + Shift + F** en VS Code busca un nombre en todo el proyecto (por ejemplo `porRol(` para ver
  quién llama a ese método).
- `git diff` muestra exactamente qué cambió desde el último commit. `git checkout -- archivo.php`
  devuelve un archivo a como estaba (solo si no hiciste commit del cambio).

## Ojo con React (`src/`)
Los cambios en `src/` **no se ven hasta compilar** (`npm run build`): el navegador sigue usando
`public/assets/main.js`. Si se borra algo de React, ejecuta `npm run build` y el error aparece en la
terminal (por ejemplo `Could not resolve "../servicios/api"`).

## Lo único que se borra "sin error"
| Si se borra… | Qué pasa |
|---|---|
| Un rol de una ruta (`['admin']` → `[]`) en `config/rutas.php` o `config/paginas.php` | La ruta queda **pública**: funciona sin iniciar sesión. Es un problema de seguridad, no un error. |
| `$TODOS_LOS_ROLES` en `config/rutas.php` | Sale un aviso y esas rutas también quedan públicas. |
| `configurarSeguridadHttp();` en `public/index.php` | Todo funciona, pero sin las cabeceras de seguridad. |
| `set_charset("utf8mb4")` en `config/database.php` | Las tildes y la ñ se ven dañadas (`Ã±`). |
| `SET time_zone` en `config/database.php` | Las horas guardadas quedan corridas. |
