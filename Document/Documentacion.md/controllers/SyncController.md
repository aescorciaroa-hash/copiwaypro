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
- antes de responder, cancela los pedidos con link de pago vencido
- si nada cambió, responde "sin cambios" (304)

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `index()` | cargar los datos de todas las pantallas | `GET /api/sync` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** SyncDatos.tsx (cada pocos segundos).
- **Usa los modelos:** `Producto`, `Configuracion`, `Personal`, `Pedido`, `Cliente`.

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta

1. React llama la API (`src/servicios/api.ts`, con `fetch`, la cookie de sesión y el `X-CSRF-Token`).
2. `public/index.php` → `despacharRuta()` busca la ruta en `config/rutas.php`.
3. `verificarCsrf()` (si falla → 419) y `requiereRol()` (sin sesión → 401, otro rol → 403).
4. `cargarControlador()` pone la acción y los `{parametros}` en `$_GET` y hace `require` de este archivo.
5. Al final del archivo: `new SyncController()` y un `if` elige el método según `$_GET['accion']`.
6. El método le pide los datos a `Producto`, `Configuracion`, `Personal`, `Pedido`, `Cliente`, `Ingrediente`, `PedidoService` y estos usan `$conn` para ir a MySQL.
7. Contesta con `responderJson()` o `responderError()` (JSON para React).

**Sus rutas** (de `config/rutas.php`):

| Método | Dirección | Acción | Quién puede |
|---|---|---|---|
| `GET` | `/api/sync` | `index()` | pública (sin sesión) |

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué modelo se conecta `SyncController`?**  
Con `Producto`, `Configuracion`, `Personal`, `Pedido`, `Cliente`, `Ingrediente`, `PedidoService`. Los trae con `require_once __DIR__ . '/../models/...'` y los crea con `new` (los `static`, como `Auth`, se usan con `::`).

**¿El controlador se conecta directo a la base de datos?**  
No. El controlador nunca escribe SQL: se lo pide al modelo, y el modelo usa `$conn`.

**¿Quién llama a este controlador?**  
`cargarControlador()` de `config/helpers.php`, después de que `despacharRuta()` encuentra la ruta en `config/rutas.php`.

**¿Cómo sabe qué método ejecutar?**  
Por `$_GET['accion']`, que lo pone `cargarControlador()`. El `if` del final del archivo llama el método que corresponde.

**¿Cómo recibe los datos?**  
Con `entrada()` (junta `$_GET` y el JSON que mandó React) y el `{id}` de la dirección en `$_GET['id']`.

**¿Para qué sirve si ya hay otros controladores?**  
Es el que trae **todo de una vez** para la pantalla (menú, pedidos, personal, ajustes). `SyncDatos.tsx` lo llama cada pocos segundos para que todo esté al día.

**¿Por qué es pública (`[]`)?**  
Porque la página de inicio también muestra el menú sin sesión. Dentro revisa el rol y solo manda lo que ese rol puede ver.

**¿Qué pasa si se borra este archivo?**  
Las rutas que lo usan dan error 500 (*"Failed opening required"*) y esa parte de la pantalla deja de funcionar.

**¿Qué pasa si se borra una ruta suya de `config/rutas.php`?**  
React recibe **404 Ruta no encontrada** al usar esa acción.

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

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
| 12 | `require_once __DIR__ . '/../models/PedidoService.php';` | Trae el archivo `PedidoService.php` para poder usar la clase `PedidoService` (para cancelar los links de pago vencidos). |
| 14 | `class SyncController` | Crea la clase `SyncController`: un grupo de funciones que trabajan juntas. |
| 15 | `{` | Abre la clase `SyncController`. |
| 16 | `public function index()` | Función `index()`: envía a la pantalla todos los datos que necesita. Ruta: `GET /api/sync`. La llama `SyncDatos.tsx` cada pocos segundos. |
| 17 | `{` | Abre la función `index()`. |
| 18 | `$rol       = Auth::check() ? Auth::rol() : 'guest';` | Guarda en `$rol` el rol del usuario; si no hay sesión, `'guest'` (visitante). |
| 19 | `$idUsuario = Auth::check() ? Auth::id() : null;` | Guarda en `$idUsuario` el número del usuario; si no hay sesión, `null`. |
| 21 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Solo se lee la sesion: se libera ya para no bloquear las demas peticiones del usuario."* |
| 22 | `if (session_status() === PHP_SESSION_ACTIVE) {` | Si la sesión está abierta... |
| 23 | `session_write_close();` | ...la cierra para escritura (`session_write_close`): solo se necesitaba leer, y así no frena las otras peticiones del mismo usuario. |
| 24 | `}` | Cierra el `if`. |
| 26 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cancela los pedidos con link de pago vencido (devuelve su inventario)."* |
| 27 | `if ($rol !== 'guest') {` | Si hay alguien con sesión (no es un visitante)... |
| 28 | `$pedidoService = new PedidoService();` | ...crea el servicio `PedidoService`... |
| 29 | `$pedidoService->cancelarLinksVencidos();` | ...y cancela los pedidos cuyo link de pago ya venció (`cancelarLinksVencidos()` de `models/PedidoService.php`). Así no hace falta una tarea programada: se revisa cada vez que alguien sincroniza. |
| 30 | `}` | Cierra el `if`. |
| 32 | `$productoModel    = new Producto();` | Crea el modelo `Producto` y lo guarda en `$productoModel`. |
| 33 | `$configModel      = new Configuracion();` | Crea el modelo `Configuracion`. |
| 34 | `$ingredienteModel = new Ingrediente();` | Crea el modelo `Ingrediente`. |
| 35 | `$personalModel    = new Personal();` | Crea el modelo `Personal`. |
| 36 | `$pedidoModel      = new Pedido();` | Crea el modelo `Pedido`. |
| 37 | `$clienteModel     = new Cliente();` | Crea el modelo `Cliente`. |
| 39 | `$payload = [` | Crea `$payload` (el paquete de datos que se va a enviar) con lo que ven todos: |
| 40 | `'products' => $productoModel->listar($rol !== 'admin', $rol === 'admin'),` | `'products'`: los productos (`listar()`). Si no es administrador solo van los activos; el administrador los ve completos (con costos). |
| 41 | `'settings' => $configModel->obtener(),` | `'settings'`: los ajustes de la tienda. |
| 42 | `];` | Cierra la lista. |
| 44 | `if (in_array($rol, ['admin', 'kitchen'])) {` | Si es administrador o cocina... |
| 45 | `$payload['inventory']     = $ingredienteModel->listarInventario();` | ...agrega el inventario. |
| 46 | `$payload['ingredients']   = $ingredienteModel->listarIngredientes();` | ...los ingredientes. |
| 47 | `$payload['inventoryLogs'] = $ingredienteModel->registrosDeMovimientos();` | ...los movimientos del inventario. |
| 48 | `$payload['staff']         = $personalModel->listar();` | ...el personal. |
| 49 | `$payload['orders']        = $pedidoModel->porRol($rol, $idUsuario);` | ...los pedidos. |
| 50 | `}` | Cierra el `if`. |
| 52 | `if ($rol === 'admin') {` | Si es administrador... |
| 53 | `$payload['clients'] = $clienteModel->listar();` | ...agrega los clientes. |
| 54 | `}` | Cierra el `if`. |
| 56 | `if ($rol === 'delivery') {` | Si es domiciliario... |
| 57 | `$payload['orders'] = $pedidoModel->porRol($rol, $idUsuario);` | ...agrega sus pedidos. |
| 58 | `}` | Cierra el `if`. |
| 60 | `if ($rol === 'client') {` | Si es cliente... |
| 61 | `$payload['orders']      = $pedidoModel->porRol($rol, $idUsuario);` | ...agrega sus pedidos. |
| 62 | `$payload['ingredients'] = $ingredienteModel->listarIngredientes();` | ...los ingredientes (para armar hamburguesas). |
| 63 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El cliente necesita sus propios datos para "Mi Perfil"."* |
| 64 | `$cliente = $clienteModel->buscar($idUsuario);` | ...y busca sus propios datos (para "Mi Perfil"). |
| 65 | `if ($cliente) {` | Si los encontró... |
| 66 | `$payload['clients'] = [$cliente];` | ...los agrega en `'clients'`. |
| 67 | `}` | Cierra el `if`. |
| 68 | `}` | Cierra el `if`. |
| 70 | `$etag = '"' . md5(json_encode($payload)) . '"';` | Crea una "huella" de los datos (`md5` de todo el paquete) y la guarda en `$etag`. Si los datos no cambian, la huella es la misma. |
| 71 | `header("ETag: $etag");` | Le manda la huella al navegador (cabecera `ETag`). |
| 73 | `if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? null) === $etag) {` | Si el navegador ya tenía esa misma huella (`HTTP_IF_NONE_MATCH`), nada cambió... |
| 74 | `http_response_code(304);` | ...responde 304 (sin cambios), sin enviar los datos otra vez... |
| 75 | `exit;` | ...y termina. |
| 76 | `}` | Cierra el `if`. |
| 77 | `responderJson($payload, 200);` | Si algo cambió, responde con todos los datos. |
| 78 | `}` | Cierra la función `index()`. |
| 79 | `}` | Cierra la clase `SyncController`. |
| 81 | `$controller = new SyncController();` | Crea el controlador. Al hacer `new SyncController()` se ejecuta su `__construct()`. |
| 83 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 85 | `if ($accion === 'index') {` | Si la acción es `'index'`... |
| 86 | `$controller->index();` | ...llama al método `index()` de arriba. |
| 87 | `} else {` | Si no es ninguna de las anteriores... |
| 88 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 89 | `}` | Cierra el `else`. |
| 90 | `?>` | Cierra el código PHP. |

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
