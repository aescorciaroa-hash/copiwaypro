# 16 — ¿Cómo se conecta todo? (y las preguntas que te pueden hacer)

¿No entiendes una palabra? Mira el [glosario](../Estructura&Glosario/GLOSARIO.md).

Esta guía responde preguntas como:
- *"¿Cómo se conecta un modelo?"*
- *"¿Con qué se conecta un modelo?"*
- *"¿Cómo llega el botón de React hasta la base de datos?"*

Al final hay un **banco de preguntas** con su respuesta corta, para que la digas con tus palabras.

---

## 1. La respuesta corta (apréndete esto primero)

> **"El modelo se conecta a la base de datos con la variable `$conn`.
> `$conn` se crea una sola vez en `config/database.php` con `new mysqli(...)`.
> `public/index.php` carga ese archivo al inicio, y cada modelo, en su constructor,
> hace `global $conn;` y la guarda en `$this->conn`.
> Al modelo lo usa el controlador: lo trae con `require_once` y lo crea con `new`."**

En un dibujo:

```
React (botón)  →  public/index.php  →  config/rutas.php  →  Controlador  →  Modelo  →  MySQL
                                                                                ↑
                                                         $conn (config/database.php)
```

---

## 2. Las 3 conexiones de un modelo

Un modelo se conecta con **3 cosas**:

| # | Con qué | Cómo | Ejemplo real |
|---|---|---|---|
| 1 | **La base de datos** (MySQL) | `global $conn;` en el constructor | `models/Producto.php` línea 26 |
| 2 | **El controlador** que lo usa | el controlador hace `require_once` + `new Producto()` | `controllers/ProductController.php` líneas 5 y 14 |
| 3 | **Otros modelos** que necesita | `require_once` del otro modelo + `new` | `Producto` usa `Ingrediente` (línea 6) |

### Conexión 1: modelo ↔ base de datos

**Paso A — se crea la conexión** (`config/database.php`):

```php
$host = "127.0.0.1";          // dónde está MySQL (este mismo computador)
$user = "root";               // el usuario de MySQL
$password = "";               // la clave (en Laragon va vacía)
$bd = "hamburguer_copiway";   // el nombre de la base de datos
$port = 3306;                 // la "puerta" de MySQL

$conn = new mysqli($host, $user, $password, $bd, $port);  // ← aquí nace la conexión
$conn->set_charset("utf8mb4");                            // para que tildes y ñ salgan bien
$conn->query("SET time_zone = '-05:00'");                 // hora de Colombia
```

- `mysqli` = la herramienta de PHP para hablar con MySQL.
- Si falla (MySQL apagado, clave mala, base de datos no existe), el `catch` muestra
  `Error de Conexion: ...` y todo se detiene (`die`).

**Paso B — se carga una sola vez** (`public/index.php`):

```php
require_once __DIR__ . '/../config/database.php';
```

Desde aquí `$conn` ya existe para **todo** el sistema. Por eso los modelos **no** vuelven a cargar
`database.php`.

**Paso C — el modelo la toma** (todos los modelos son así):

```php
class Producto
{
    private $conn;                 // cajita para guardar la conexión

    public function __construct()  // se ejecuta solo al hacer new Producto()
    {
        global $conn;              // "trae la $conn de afuera (la de database.php)"
        $this->conn = $conn;       // la guarda dentro del objeto
    }
}
```

**Paso D — el modelo la usa en cada consulta:**

```php
$stmt = $this->conn->prepare("SELECT * FROM PRODUCTO WHERE id_producto = ?");
$stmt->bind_param("i", $id);   // llena el ? con el número $id
$stmt->execute();              // la manda a MySQL
$fila = $stmt->get_result()->fetch_assoc();  // trae la respuesta
$stmt->close();
```

> **Ojo:** `Auth` y `CorreoService` son distintos.
> - `Auth` tiene métodos `static`, no tiene constructor: hace `global $conn;` **dentro de cada método**.
> - `CorreoService` **no** usa la base de datos directamente; se conecta a **Gmail** (SMTP) con
>   PHP puro (`stream_socket_client`). Solo lee la base de datos a través de `Configuracion` (nombre del negocio).

### Conexión 2: controlador ↔ modelo

```php
require_once __DIR__ . '/../models/Producto.php';   // 1. trae el archivo del modelo

class ProductController
{
    private $productoModel;

    public function __construct()
    {
        $this->productoModel = new Producto();       // 2. crea el modelo (y ahí toma $conn)
        $this->datos = entrada();                    // 3. lee lo que mandó React
    }

    public function store()
    {
        $id = $this->productoModel->crear($this->datos);   // 4. le pide al modelo que guarde
        responderJson($this->productoModel->buscar($id, true), 201); // 5. contesta a React
    }
}
```

- `require_once` = "trae este archivo, pero solo una vez".
- `new Producto()` = crea el objeto; en ese momento corre el `__construct()` y toma `$conn`.
- `->` = "usa este método del objeto".
- **El controlador nunca escribe SQL.** El SQL vive solo en los modelos.

### Conexión 3: modelo ↔ otro modelo

| Modelo | Usa a | Para qué |
|---|---|---|
| `Producto` | `Ingrediente` | la receta de cada producto |
| `PedidoService` | `Pedido`, `Configuracion`, `Ingrediente`, `PagoService`, `PushNotificationService` | crear y mover pedidos, descontar inventario, pagos y avisos |
| `CajaService` | `Caja` | hacer el cierre de caja |
| `PushNotificationService` | `PushSuscripcion` | saber a qué celulares mandar el aviso |
| `CorreoService` | `Configuracion` | el nombre/datos del negocio en el correo |

---

## 3. El viaje completo de un clic (ejemplo: crear un producto)

El admin llena el formulario de **Gestión de Menú** y pulsa **Guardar**.

| Paso | Dónde | Qué pasa |
|---|---|---|
| 1 | `src/store/almacenAplicacion.ts` | React llama `api.post('/products', product)`. |
| 2 | `src/servicios/api.ts` | Hace `fetch` a `/api/products`, método `POST`, con la cookie de sesión (`credentials: 'include'`) y el `X-CSRF-Token`. |
| 3 | `public/.htaccess` | Apache manda **todas** las direcciones a `public/index.php`. |
| 4 | `public/index.php` | Carga `database.php` (crea `$conn`), `app.php`, `helpers.php`, `Session.php`, `Auth.php`. Inicia la sesión. Como la dirección empieza con `/api`, llama `despacharRuta()`. |
| 5 | `config/helpers.php` → `despacharRuta()` | Busca en `config/rutas.php`: `'POST /api/products' => ['ProductController', 'store', ['admin']]`. |
| 6 | `verificarCsrf()` | Revisa que el token CSRF sea el correcto. Si no → error **419**. |
| 7 | `requiereRol(['admin'])` | Revisa que haya sesión (si no → **401**) y que sea admin (si no → **403**). |
| 8 | `cargarControlador()` | Pone `$_GET['accion'] = 'store'` y hace `require` de `controllers/ProductController.php`. |
| 9 | `ProductController.php` | Al final del archivo: `new ProductController()` y como la acción es `store`, llama `store()`. |
| 10 | `store()` | Valida los datos (si faltan → **422**). Llama `$this->productoModel->crear(...)`. |
| 11 | `models/Producto.php` → `crear()` | Usa `$this->conn` para hacer `INSERT INTO PRODUCTO` y guardar la receta en `RECETA` (con una transacción). |
| 12 | MySQL | Guarda la fila y devuelve el id nuevo (`insert_id`). |
| 13 | `responderJson(..., 201)` | El controlador contesta a React en **JSON** con el producto creado. |
| 14 | React | Recibe el JSON y muestra el producto nuevo en la lista. |

Las **páginas** (no `/api`) van distinto: `index.php` → `despacharPagina()` → `config/paginas.php`
→ `PaginaController` → `mostrarVista()` → `views/paginas/*.php` (el HTML que carga React).

---

## 4. Mapa de conexiones de todo el proyecto

### Controladores → modelos → tablas

| Controlador | Usa los modelos | Tablas que terminan tocando |
|---|---|---|
| `AuthController` | `Auth`, `Cliente`, `CodigoVerificacion`, `IntentoLogin`, `CorreoService` | ADMINISTRADOR, AYUDANTE_COCINA, DOMICILIARIO, CLIENTE, CODIGO_VERIFICACION, INTENTO_LOGIN |
| `CashClosingController` | `CajaService` (→ `Caja`) | REPORTE_CAJA, DETALLE_AUDITORIA, LIQUIDACION_DOMICILIARIO, PEDIDO, … |
| `ClientController` | `Cliente` | CLIENTE |
| `InventoryController` | `Ingrediente` | INGREDIENTE, MOVIMIENTO_INVENTARIO, CATEGORIA |
| `OrderController` | `PedidoService`, `Pedido` | PEDIDO, DETALLE_PEDIDO, PERSONALIZACION, INGREDIENTE, RESENA, … |
| `PaginaController` | `Configuracion`, `Auth` | CONFIGURACION_SISTEMA, CATEGORIA |
| `PaymentController` | `PedidoService`, `PagoService` | PAGO_TRANSACCION, PEDIDO |
| `PaymentLinkController` | `PedidoService` | PEDIDO, PAGO_TRANSACCION |
| `ProductController` | `Producto` (→ `Ingrediente`) | PRODUCTO, RECETA, CATEGORIA, INGREDIENTE |
| `PushController` | `PushSuscripcion` | PUSH_SUSCRIPCION |
| `SettingController` | `Configuracion` | CONFIGURACION_SISTEMA, CATEGORIA |
| `StaffController` | `Personal` | ADMINISTRADOR, AYUDANTE_COCINA, DOMICILIARIO |
| `SyncController` | `Producto`, `Configuracion`, `Personal`, `Pedido`, `Cliente`, `Ingrediente`, `PedidoService` | casi todas (es el que trae "todo" para la pantalla) |
| `UploadController` | ninguno | ninguna (guarda la foto en `public/uploads/productos/`) |

### Modelos → tablas

| Modelo | Tablas |
|---|---|
| `Auth` | ADMINISTRADOR, AYUDANTE_COCINA, DOMICILIARIO, CLIENTE |
| `Caja` | REPORTE_CAJA, DETALLE_AUDITORIA, LIQUIDACION_DOMICILIARIO, PEDIDO, CLIENTE, DOMICILIARIO, INGREDIENTE, MOVIMIENTO_INVENTARIO |
| `CajaService` | REPORTE_CAJA, DETALLE_AUDITORIA, LIQUIDACION_DOMICILIARIO, PEDIDO |
| `Cliente` | CLIENTE, CLIENTE_NOTIFICACION, PEDIDO |
| `CodigoVerificacion` | CODIGO_VERIFICACION, CLIENTE |
| `Configuracion` | CONFIGURACION_SISTEMA, CATEGORIA, PRODUCTO |
| `CorreoService` | ninguna (se conecta a Gmail por SMTP) |
| `Ingrediente` | INGREDIENTE, MOVIMIENTO_INVENTARIO, CATEGORIA |
| `IntentoLogin` | INTENTO_LOGIN |
| `PagoService` | PAGO_TRANSACCION |
| `Pedido` | PEDIDO, DETALLE_PEDIDO, PERSONALIZACION, CLIENTE, DOMICILIARIO, AYUDANTE_COCINA |
| `PedidoService` | PEDIDO, DETALLE_PEDIDO, PERSONALIZACION, PRODUCTO, RECETA, INGREDIENTE, CATEGORIA, CLIENTE, RESENA |
| `Personal` | ADMINISTRADOR, AYUDANTE_COCINA, DOMICILIARIO, LIQUIDACION_DOMICILIARIO, PEDIDO |
| `Producto` | PRODUCTO, RECETA, CATEGORIA, INGREDIENTE |
| `PushNotificationService` | NOTIFICACION (y manda avisos al celular con `openssl` + `curl`) |
| `PushSuscripcion` | PUSH_SUSCRIPCION |
| `Usuario` | ADMINISTRADOR (lo usa solo `sql/create-admin.php`) |

### Conexiones con cosas de afuera

| Qué | Archivo | Con qué se conecta |
|---|---|---|
| Correo de recuperación | `models/CorreoService.php` | Gmail (`smtp.gmail.com`, puerto 587) con PHP puro: `stream_socket_client()` + comandos SMTP |
| Notificaciones al celular | `models/PushNotificationService.php` | el servicio push del navegador, con PHP puro (`openssl` cifra y firma, `curl` envía) y las llaves VAPID |
| Librerías de React | `node_modules/` | las instala **npm** (`npm install`). El PHP **no** usa librerías (no hay Composer ni `vendor/`) |
| Pantalla | `src/servicios/api.ts` | habla con la API PHP con `fetch` a `/api/...` |

---

## 5. Banco de preguntas (con respuesta corta)

### Sobre el modelo

**¿Qué es un modelo?**
Una clase de PHP que habla con una o varias tablas de MySQL. Ahí está todo el SQL.

**¿Cómo se conecta un modelo a la base de datos?**
Con `$conn`. Se crea en `config/database.php` con `new mysqli(...)`. El modelo, en su `__construct()`,
hace `global $conn;` y la guarda en `$this->conn`.

**¿Con qué se conecta un modelo?**
Con 3 cosas: la base de datos (`$conn`), el controlador que lo usa (`require_once` + `new`) y, a veces,
otros modelos (por ejemplo `Producto` usa `Ingrediente`).

**¿Por qué el modelo no hace `require` de `database.php`?**
Porque `public/index.php` ya lo cargó al inicio. Si cada modelo lo cargara, se abrirían muchas
conexiones. Así hay **una sola** conexión para todo.

**¿Qué significa `global $conn;`?**
"Usa la variable `$conn` que está afuera de la clase". Sin `global`, dentro de la función `$conn` no existiría.

**¿Qué es `$this->conn`?**
La conexión guardada dentro del objeto. `$this` = "este mismo objeto".

**¿Qué es el `__construct()`?**
Una función que corre sola cuando se hace `new`. El modelo la usa para tomar la conexión.

**¿Qué hace `prepare()` y por qué se usa `?`?**
Prepara la consulta con espacios vacíos (`?`). Después `bind_param()` los llena. Así nadie puede meter
código SQL escribiendo en un formulario (**inyección SQL**).

**¿Qué significa `"si"` en `bind_param("si", ...)`?**
El tipo de cada `?` en orden: `s` = texto, `i` = número entero, `d` = decimal.

**¿Qué diferencia hay entre `fetch_assoc()` y `fetch_all()`?**
`fetch_assoc()` trae **una** fila; `fetch_all(MYSQLI_ASSOC)` trae **todas**.

**¿Qué es `insert_id`?**
El id que MySQL le dio a la fila que se acaba de insertar.

**¿Qué es una transacción (`begin_transaction`)?**
Un "todo o nada": si una parte falla, se deshace todo (`rollback`). Si todo sale bien, se guarda (`commit`).
La usan `Producto`, `Ingrediente`, `PedidoService` y `CajaService` (cuando guardan en varias tablas a la vez).

**¿Qué diferencia hay entre `Pedido` y `PedidoService`?**
`Pedido` solo **lee** pedidos (listas, buscar). `PedidoService` tiene las **reglas del negocio**: crear el
pedido, descontar inventario, cambiar estados, pagos y avisos. Lo mismo pasa con `Caja` / `CajaService`.

**¿Por qué `Auth` es distinto a los otros modelos?**
Sus métodos son `static` (se usan con `Auth::check()`, sin `new`). No tiene constructor, por eso hace
`global $conn;` dentro de cada método. Además guarda el usuario en `$_SESSION`.

**¿Qué modelo no usa la base de datos?**
`CorreoService`: se conecta a Gmail para mandar correos. (Solo lee el nombre del negocio con `Configuracion`.)

### Sobre el controlador

**¿Qué es un controlador?**
El que recibe la petición, revisa los datos, le pide al modelo lo que necesita y contesta en JSON.

**¿Cómo se conecta el controlador con el modelo?**
`require_once '../models/Producto.php'` (trae el archivo) y `new Producto()` (crea el objeto).

**¿Quién llama al controlador?**
`cargarControlador()` en `config/helpers.php`, después de que `despacharRuta()` encuentra la ruta en
`config/rutas.php`.

**¿Cómo sabe el controlador qué método ejecutar?**
`cargarControlador()` pone la acción en `$_GET['accion']` (ej. `'store'`). Al final del controlador hay
`if ($accion === 'store') { $controller->store(); }`.

**¿Cómo le llega el `{id}` de la dirección?**
`despacharRuta()` lo saca de la dirección y lo pone en `$_GET['id']`.

**¿Cómo le llegan los datos del formulario?**
Con `entrada()` (en `helpers.php`): junta `$_GET` y el JSON que mandó React.

**¿Cómo contesta?**
Con `responderJson($datos, $codigo)` o `responderError($mensaje, $codigo)`. Los dos terminan con `exit`.

### Sobre la vista

**¿Dónde están las vistas?**
- `views/paginas/` → el HTML de cada página (admin, cliente, cocina, login…). Las muestra `mostrarVista()`.
- `views/layouts/` → la cabecera y el pie que comparten todas.
- `views/json/` → funciones que organizan los datos para React (ej. `producto_a_json()`). Las carga `helpers.php`.

**¿Dónde está React?**
En `src/`. Vite lo compila y la vista lo carga. React pide los datos a la API con `fetch` (`src/servicios/api.ts`).

### Sobre el recorrido y la seguridad

**¿Cuál es el primer archivo que se ejecuta?**
`public/index.php`. `.htaccess` manda todas las direcciones ahí.

**¿Cómo se sabe si es una página o la API?**
Si la dirección empieza con `/api` → `despacharRuta()`. Si no → `despacharPagina()`.

**¿Dónde se revisa el rol?**
En `config/rutas.php` cada ruta dice sus roles; `requiereRol()` lo revisa antes de abrir el controlador.

**¿Qué es el token CSRF?**
Un código secreto de la sesión. React lo manda en `X-CSRF-Token`. Así otra página no puede hacer
acciones a tu nombre. Lo revisa `verificarCsrf()`.

**¿Cómo sabe el sistema quién está conectado?**
Por la sesión: `Auth::login()` guarda `$_SESSION['usuario_id']` y `$_SESSION['usuario_rol']`.
`Auth::usuarioActual()` vuelve a leer la cuenta en la base de datos en cada petición.

**¿Cómo se guarda la contraseña?**
Cifrada (`password_hash`). Al entrar se compara con `password_verify()`.

### "¿Qué pasa si…?"

| Si… | Pasa… |
|---|---|
| MySQL está apagado | `Error de Conexion: ...` y no carga nada. |
| Cambias el nombre de la base de datos en `database.php` | `Error de Conexion: Unknown database`. |
| Borras `global $conn;` de un modelo | `$this->conn` queda vacío → error *"Call to a member function prepare() on null"*. |
| Borras el `require_once` del modelo en el controlador | *"Class 'Producto' not found"*. |
| Borras la ruta de `config/rutas.php` | React recibe **404 Ruta no encontrada**. |
| Usas otro método (GET en vez de POST) | **405 Método no permitido**. |
| No hay sesión | **401 No autenticado**. |
| Tienes otro rol | **403 No autorizado**. |
| El token CSRF está mal o venció | **419** (React pide uno nuevo y reintenta solo). |
| Faltan datos en el formulario | **422 Datos inválidos**. |
| Escribes mal una tabla en el SQL | *"Table ... doesn't exist"* (error 500). |
| No corriste `npm run build` | la página sale en blanco (falta `public/assets/main.css`). |

### Preguntas "trampa"

**¿Cuántas conexiones a la base de datos hay?** Una sola por petición (`$conn`), compartida por todos los modelos.

**¿El controlador habla directo con la base de datos?** No. Siempre pasa por el modelo.

**¿React habla directo con la base de datos?** No. React → API PHP (`/api/...`) → controlador → modelo → MySQL.

**¿Se usa Laravel o un framework?** No. Es PHP MVC simple: `require_once`, clases y `mysqli`.

**¿Qué es MVC?** Modelo (datos/SQL) – Vista (lo que se ve) – Controlador (el que coordina).

**¿Dónde cambio la clave de MySQL?** En `config/database.php`, variable `$password`.

---

## Para seguir leyendo
- Cada archivo tiene su `.md` con una parte **"¿Con qué se conecta?"** y sus propias preguntas:
  [models/](../../models/README.md), [controllers/](../../controllers/README.md), [config/](../../config/database.md).
- [04 — Cómo funciona](04-como-funciona.md) · [07 — Base de datos](07-base-de-datos.md) · [09 — Seguridad](09-seguridad.md)
