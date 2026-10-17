# controllers/SyncController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Envía a las pantallas todos los datos que necesitan.

## ¿Qué hace?
- envía productos y ajustes a todos
- al administrador y a cocina: también inventario, personal y pedidos
- al administrador: también los clientes
- al domiciliario: sus pedidos
- al cliente: sus pedidos, ingredientes y su perfil
- si nada cambió, responde "sin cambios" (304)

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `index()` | cargar los datos de todas las pantallas | `GET /api/sync` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** SyncDatos.tsx (cada pocos segundos).
- **Usa los modelos:** `Producto`, `Configuracion`, `Personal`, `Pedido`, `Cliente`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-6 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Sincronizacion: el frontend pregunta cada pocos segundos con If-None-Match; si nada cambio se responde 304 sin datos. Lo que se envia depende del rol."* |
| 7 | `require_once __DIR__ . '/../models/Producto.php';` | Trae `models/Producto.php` (que también trae `Ingrediente.php`; por eso abajo se puede usar `new Ingrediente()`). |
| 8 | `require_once __DIR__ . '/../models/Configuracion.php';` | Trae el archivo `Configuracion.php` para poder usar la clase `Configuracion`. |
| 9 | `require_once __DIR__ . '/../models/Personal.php';` | Trae el archivo `Personal.php` para poder usar la clase `Personal`. |
| 10 | `require_once __DIR__ . '/../models/Pedido.php';` | Trae el archivo `Pedido.php` para poder usar la clase `Pedido`. |
| 11 | `require_once __DIR__ . '/../models/Cliente.php';` | Trae el archivo `Cliente.php` para poder usar la clase `Cliente`. |
| 13 | `class SyncController` | Crea la clase `SyncController`: un grupo de funciones que trabajan juntas. |
| 14 | `{` | Abre la clase `SyncController`. |
| 15 | `public function index()` | Función `index()`: envía a la pantalla todos los datos que necesita. Ruta: `GET /api/sync`. La llama `SyncDatos.tsx` cada pocos segundos. |
| 16 | `{` | Abre la función `index()`. |
| 17 | `$rol       = Auth::check() ? Auth::rol() : 'guest';` | Guarda en `$rol` el rol del usuario; si no hay sesión, `'guest'` (visitante). |
| 18 | `$idUsuario = Auth::check() ? Auth::id() : null;` | Guarda en `$idUsuario` el número del usuario; si no hay sesión, `null`. |
| 20 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Solo se lee la sesion: se libera ya para no bloquear las demas peticiones del usuario."* |
| 21 | `if (session_status() === PHP_SESSION_ACTIVE) {` | Si la sesión está abierta... |
| 22 | `session_write_close();` | ...la cierra para escritura (`session_write_close`): solo se necesitaba leer, y así no frena las otras peticiones del mismo usuario. |
| 23 | `}` | Cierra el `if`. |
| 25 | `$productoModel    = new Producto();` | Crea el modelo `Producto` y lo guarda en `$productoModel`. |
| 26 | `$configModel      = new Configuracion();` | Crea el modelo `Configuracion`. |
| 27 | `$ingredienteModel = new Ingrediente();` | Crea el modelo `Ingrediente`. |
| 28 | `$personalModel    = new Personal();` | Crea el modelo `Personal`. |
| 29 | `$pedidoModel      = new Pedido();` | Crea el modelo `Pedido`. |
| 30 | `$clienteModel     = new Cliente();` | Crea el modelo `Cliente`. |
| 32 | `$payload = [` | Crea `$payload` (el paquete de datos que se va a enviar) con lo que ven todos: |
| 33 | `'products' => $productoModel->listar($rol !== 'admin', $rol === 'admin'),` | `'products'`: los productos (`listar()`). Si no es administrador solo van los activos; el administrador los ve completos (con costos). |
| 34 | `'settings' => $configModel->obtener(),` | `'settings'`: los ajustes de la tienda. |
| 35 | `];` | Cierra la lista. |
| 37 | `if (in_array($rol, ['admin', 'kitchen'])) {` | Si es administrador o cocina... |
| 38 | `$payload['inventory']     = $ingredienteModel->listarInventario();` | ...agrega el inventario. |
| 39 | `$payload['ingredients']   = $ingredienteModel->listarIngredientes();` | ...los ingredientes. |
| 40 | `$payload['inventoryLogs'] = $ingredienteModel->registrosDeMovimientos();` | ...los movimientos del inventario. |
| 41 | `$payload['staff']         = $personalModel->listar();` | ...el personal. |
| 42 | `$payload['orders']        = $pedidoModel->porRol($rol, $idUsuario);` | ...los pedidos. |
| 43 | `}` | Cierra el `if`. |
| 45 | `if ($rol === 'admin') {` | Si es administrador... |
| 46 | `$payload['clients'] = $clienteModel->listar();` | ...agrega los clientes. |
| 47 | `}` | Cierra el `if`. |
| 49 | `if ($rol === 'delivery') {` | Si es domiciliario... |
| 50 | `$payload['orders'] = $pedidoModel->porRol($rol, $idUsuario);` | ...agrega sus pedidos. |
| 51 | `}` | Cierra el `if`. |
| 53 | `if ($rol === 'client') {` | Si es cliente... |
| 54 | `$payload['orders']      = $pedidoModel->porRol($rol, $idUsuario);` | ...agrega sus pedidos. |
| 55 | `$payload['ingredients'] = $ingredienteModel->listarIngredientes();` | ...los ingredientes (para armar hamburguesas). |
| 56 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El cliente necesita sus propios datos para "Mi Perfil"."* |
| 57 | `$cliente = $clienteModel->buscar($idUsuario);` | ...y busca sus propios datos (para "Mi Perfil"). |
| 58 | `if ($cliente) {` | Si los encontró... |
| 59 | `$payload['clients'] = [$cliente];` | ...los agrega en `'clients'`. |
| 60 | `}` | Cierra el `if`. |
| 61 | `}` | Cierra el `if`. |
| 63 | `$etag = '"' . md5(json_encode($payload)) . '"';` | Crea una "huella" de los datos (`md5` de todo el paquete) y la guarda en `$etag`. Si los datos no cambian, la huella es la misma. |
| 64 | `header("ETag: $etag");` | Le manda la huella al navegador (cabecera `ETag`). |
| 66 | `if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? null) === $etag) {` | Si el navegador ya tenía esa misma huella (`HTTP_IF_NONE_MATCH`), nada cambió... |
| 67 | `http_response_code(304);` | ...responde 304 (sin cambios), sin enviar los datos otra vez... |
| 68 | `exit;` | ...y termina. |
| 69 | `}` | Cierra el `if`. |
| 70 | `responderJson($payload, 200);` | Si algo cambió, responde con todos los datos. |
| 71 | `}` | Cierra la función `index()`. |
| 72 | `}` | Cierra la clase `SyncController`. |
| 74 | `$controller = new SyncController();` | Crea el controlador. Al hacer `new SyncController()` se ejecuta su `__construct()`. |
| 76 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 78 | `if ($accion === 'index') {` | Si la acción es `'index'`... |
| 79 | `$controller->index();` | ...llama al método `index()` de arriba. |
| 80 | `} else {` | Si no es ninguna de las anteriores... |
| 81 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 82 | `}` | Cierra el `else`. |
| 83 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | cargar los datos de todas las pantallas | `Failed to open stream` |
| el `require_once` de `Producto.php` | todas sus acciones | `Class "Producto" not found` |
| el `require_once` de `Configuracion.php` | todas sus acciones | `Class "Configuracion" not found` |
| el `require_once` de `Personal.php` | todas sus acciones | `Class "Personal" not found` |
| el `require_once` de `Pedido.php` | todas sus acciones | `Class "Pedido" not found` |
| el `require_once` de `Cliente.php` | todas sus acciones | `Class "Cliente" not found` |
| el método `index()` | cargar los datos de todas las pantallas | `Call to undefined method SyncController::index()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
