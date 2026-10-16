# app/Core/helpers.php

## ¿Para qué sirve?
Es una "caja de herramientas": funciones sueltas que se usan en todo el proyecto.
También contiene el **router** (`despacharRuta` y `despacharPagina`), que decide qué controlador
atiende cada petición.

Al inicio carga los archivos de `app/Views/json/`, que convierten filas de la base de datos al JSON
que espera React.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `public/index.php` y todos los controladores (`require_once`) | Usan sus funciones. |
| → carga | `app/Views/json/*.php` | Funciones que arman el JSON (`producto_a_json`, etc.). |
| → lee | `config/rutas.php` y `config/paginas.php` | Las tablas del router. |
| → carga | `app/Controllers/*.php` | Con `cargarControlador()`. |
| → usa | `Auth` (`Auth.php`) y `Session` (`Session.php`) | Revisar permisos, sesión y CSRF. |
| → usa | `$conn` (`config/database.php`) | En `correoUsadoEnCualquierTabla()`. |

## Variables importantes
| Variable | Dónde | Para qué sirve | A dónde va |
|---|---|---|---|
| `$_GET['action']` | La crea `cargarControlador()` | Qué acción hacer (`'index'`, `'update'`...) | Cada controlador la lee: `$action = $_GET['action'] ?? ...` |
| `$_GET['id']` (y otros parámetros) | Los crea `cargarControlador()` a partir de `{id}` en la ruta | El id del recurso pedido | Los controladores: `$id = $_GET['id'] ?? ...` |
| `$valores` | `preg_match()` en `despacharRuta()` | Los valores reales de las `{llaves}` de la ruta | Se convierten en `$parametros` |
| `$_SESSION['_csrf']` | `Session::csrf()` | El token CSRF guardado | `verificarCsrf()` lo compara con lo que envía React |
| `$_SERVER['HTTP_X_CSRF_TOKEN']` | La cabecera `X-CSRF-Token` que envía `src/servicios/api.ts` | El token enviado por React | `verificarCsrf()` |

---

## Funciones de rutas

### `rutaBase()`
Devuelve la carpeta donde está instalado el proyecto, por ejemplo `/copiwaypro`.
- Si en el `.env` existe `APP_BASE_PATH`, usa ese valor.
- Si no, la calcula a partir de `$_SERVER['SCRIPT_NAME']` (la ruta de `index.php`).
- `static $base` guarda el resultado para no calcularlo dos veces en la misma petición.

### `quitarRutaBase($path)`
Quita esa carpeta del inicio de una ruta: `/copiwaypro/api/products` → `/api/products`.

---

## Funciones de seguridad

### `configurarManejadorErrores()`
```php
set_exception_handler(function ($e) { ... });
```
Si ocurre un error que nadie atrapó con `try/catch`, esta función:
1. Lo guarda en el log (`error_log`).
2. Responde un JSON con código 500. Si `APP_DEBUG` es `true` muestra el detalle; si no, un mensaje genérico.

### `configurarSeguridadHttp()`
Envía cabeceras (`header(...)`) que protegen al navegador:
| Cabecera | Para qué |
|---|---|
| `X-Content-Type-Options` | Evita que el navegador "adivine" el tipo de archivo. |
| `X-Frame-Options: DENY` | Nadie puede meter la página dentro de un iframe. |
| `Content-Security-Policy` | Lista de sitios de donde se pueden cargar scripts, imágenes, fuentes y mapas. |
| `Access-Control-...` | Permite peticiones solo desde el mismo dominio. |

Si el método es `OPTIONS` (una pregunta previa que hace el navegador), responde 204 y termina.

### `verificarCsrf()`
Protege contra el ataque CSRF (que otra página haga peticiones en tu nombre).
- En `GET`, `HEAD` y `OPTIONS` no revisa nada (solo leen datos).
- En los demás compara el token que envía el navegador (cabecera `X-CSRF-Token`) con el guardado en la sesión.
- `hash_equals()` compara de forma segura. Si no coinciden → error **419**.

---

## Funciones de datos

### `entrada()`
Junta en un solo arreglo **todo lo que envió el navegador**:
```php
return array_merge($_GET, $cuerpo);
```
- `$_GET`: los datos de la dirección (`?role=...`) más la acción y el id que pone el router.
- `$cuerpo`: el JSON del cuerpo (si `Content-Type` es `application/json`) o `$_POST`.

Los controladores la usan así: `$datos = entrada();` y después `$datos['name']`, `$datos['price']`, etc.

### `correoUsadoEnCualquierTabla($correo, $excluirId)`
Revisa si un correo ya existe en **cualquiera** de las 4 tablas de cuentas (ADMINISTRADOR,
AYUDANTE_COCINA, DOMICILIARIO, CLIENTE). Devuelve `true` o `false`.
- `$excluirId` sirve al **editar**: ignora la propia cuenta para que no choque consigo misma.

### `tiposDe($valores)`
Arma el texto de tipos para `bind_param` mirando cada valor:
```php
tiposDe([5, 'Ana', 2.5])   // devuelve "isd"
```
- `is_int` → `i`, `is_float` → `d`, cualquier otra cosa → `s`.
- Se usa en los UPDATE que se arman con **los campos que lleguen** (no se sabe de antemano cuántos son).

---

## Funciones de respuesta

| Función | Qué hace |
|---|---|
| `responderJson($datos, $codigo)` | Pone el código HTTP, la cabecera JSON, imprime `json_encode($datos)` y hace `exit`. |
| `responderError($mensaje, $codigo, $detalles)` | Responde `{"error": "...", "errors": {...}}`. Usa `responderJson`. |
| `redirect($ruta)` | Redirige a otra página (le agrega la ruta base) y hace `exit`. |
| `mostrarVista($vista, $datos)` | Carga un archivo de `app/Views/paginas/`. `extract($datos)` convierte cada clave del arreglo en una variable (`['datos' => ...]` → `$datos`). |

**`exit`** detiene el programa: después de responder no se ejecuta nada más.

---

## Funciones de permisos

### `requiereSesion($esApi)`
Exige que haya alguien conectado **y** que su cuenta siga activa en la base de datos
(`Auth::usuarioActual()`). Si no:
- en la API responde **401**;
- en una página redirige a `/login`.

### `requiereRol($roles, $esApi)`
Primero llama a `requiereSesion()`. Después revisa que el rol del usuario esté en la lista.
Si no está → **403** (API) o redirige a `/login` (página).

---

## El router

### `despacharRuta($metodo, $ruta)`
1. Carga la lista de `config/rutas.php`.
2. Recorre cada ruta. Convierte el patrón a una expresión regular:
   `/api/products/{id}` → `#^/api/products/([^/]+)$#`
3. Si la dirección coincide pero el método no (ej: `DELETE` donde solo existe `GET`) → **405**.
4. Si todo coincide:
   - `verificarCsrf()`
   - `requiereRol($roles)` si la ruta tiene roles
   - toma los valores de las `{llaves}`. `urldecode` convierte `%23ORD-4` en `#ORD-4`.
   - llama a `cargarControlador()`.
5. Si ninguna ruta coincidió → **404**.

### `cargarControlador($controlador, $action, $parametros)`
```php
$_GET['action'] = $action;
foreach ($parametros as $nombre => $valor) {
    $_GET[$nombre] = $valor;
}
require __DIR__ . "/../Controllers/{$controlador}.php";
```
Deja la acción y los parámetros en `$_GET` y carga el archivo del controlador. Por eso los
controladores empiezan con `$action = $_GET['action'] ?? ...` y leen `$_GET['id']`.

### `despacharPagina($ruta)`
Igual que el anterior, pero con `config/paginas.php`. Si la página no existe imprime
"Pagina no encontrada." (404).
