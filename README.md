# CopiwayPRO

Sistema para un restaurante de hamburguesas a domicilio con cinco roles: Cliente, Administrador, Ayudante de Cocina, Domiciliario y Programador.

- **Backend:** PHP sin framework, con estructura **MVC** (modelos, vistas y controladores) y MySQL (MySQLi con consultas preparadas).
- **Frontend:** React (compilado con Vite). PHP entrega la página y React dibuja las pantallas.

Corre en local con Laragon en **`http://localhost/copiwaypro/`**.

> 📘 **Guías generales** (instalar, arrancar, cómo funciona, roles, pedidos, seguridad, problemas comunes...): [Documentacion.md/GuiasDelProyecto/General/README.md](Documentacion.md/GuiasDelProyecto/General/README.md).
>
> 🌳 **Estructura completa en forma de árbol:** [Documentacion.md/GuiasDelProyecto/Estructura&Glosario/ESTRUCTURA.md](Documentacion.md/GuiasDelProyecto/Estructura&Glosario/ESTRUCTURA.md).
>
> 📚 **Documentación archivo por archivo:** [Documentacion.md/README.md](Documentacion.md/README.md). Explica qué hace cada archivo, con qué se conecta y para qué sirve cada variable.

## Estructura

```
/config          database.php (conexion $conn), app.php (ajustes generales), rutas.php (API), paginas.php (paginas),
                 helpers.php (funciones de ayuda y el router), Session.php (clase Session)
/controllers     Un controlador por recurso (ProductController, OrderController...) + PaginaController (paginas)
/models          Un modelo por tabla (Usuario, Cliente, Producto, Pedido...), la clase Auth y los servicios
                 con las reglas grandes (PedidoService, CajaService, PagoService, CorreoService, PushNotificationService)
/views
  /layouts       cabecera.php / pie.php (el HTML que carga React)
  /paginas       Una vista por pantalla (landing, login, admin, cliente, cocina, domiciliario...)
  /json          Funciones que convierten filas de MySQL al JSON que espera React
/public          index.php (punto de entrada unico) + el frontend compilado (assets/main.js, assets/main.css)
/sql             schema.sql (crea la base), seed.sql (datos de ejemplo), create-admin.php (crear el primer admin)
/src             Frontend en React
/Documentacion.md Documentacion de cada archivo, con la misma estructura de carpetas
```

## Cómo está escrito el PHP

**Conexión** (`config/database.php`):
```php
<?php
$host = "127.0.0.1";
$user = "root";
$password = "";
$bd = "hamburguer_copiway";
$port = 3306;

try {
    $conn = new mysqli($host, $user, $password, $bd, $port);
    $conn->set_charset("utf8mb4");
    $conn->query("SET time_zone = '-05:00'");
} catch (mysqli_sql_exception $e) {
    die("Error de Conexion: " . $e->getMessage());
}
?>
```

**Modelos** (`private $conn` + `global $conn`, consultas preparadas):
```php
<?php
class Cliente
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    public function buscarCrudo($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM CLIENTE WHERE id_cliente = ? LIMIT 1");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }
}
?>
```

**Controladores** (una clase con un método por acción y, al final, el despachador por `$_GET['accion']`):
```php
<?php
require_once __DIR__ . '/../models/Producto.php';

class ProductController
{
    private $productoModel;
    private $datos;

    public function __construct()
    {
        $this->productoModel = new Producto();
        $this->datos = entrada();
    }

    public function index()
    {
        responderJson($this->productoModel->listar());
    }

    public function update()
    {
        $id = $_GET['id'];
        ...
    }
}

$controller = new ProductController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'index') {
    $controller->index();
} elseif ($accion === 'update') {
    $controller->update();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>
```
**Cada archivo se carga en un solo lugar:** `public/index.php` carga la conexión, `app.php`, `helpers.php`, `Session.php` y `Auth.php`; cada controlador carga solo sus modelos. No hay rutas ni métodos que la pantalla no use. Si se borra algo, esa parte deja de funcionar y el error dice qué falta.

El router (`despacharRuta()` en `config/helpers.php`) busca la ruta en `config/rutas.php`, deja en `$_GET` la acción (`$_GET['accion']`) y los datos de la ruta (`{id}` → `$_GET['id']`) y carga el archivo del controlador.

Los controladores responden **JSON** (con `responderJson()`) en vez de redirigir, porque la pantalla está hecha en React.

**Modelos y servicios**: casi todos los recursos son simples y su modelo hace todo. Los dos procesos grandes tienen su propio servicio dentro de `models/`: el pedido (`PedidoService`: horario, precios, pago, inventario) y el cierre de caja (`CajaService`).

**Recorrido de una petición a la API**: `.htaccess` → `public/index.php` → `despacharRuta()` (revisa CSRF y el rol) → controlador → modelo → `responderJson()`.

**Recorrido de una página**: `.htaccess` → `public/index.php` → `despacharPagina()` (lee `config/paginas.php`) → `PaginaController` → `mostrarVista()` muestra `views/layouts/cabecera.php` + la vista + `pie.php`. La cabecera deja en `window.__DATOS__` el usuario, el token CSRF y los ajustes de la tienda, y React abre la pantalla que indica `data-pagina`. Cambiar de pantalla es una recarga normal de página.

## Instalación

1. **Crea la base de datos**. Importa `sql/schema.sql` desde HeidiSQL o phpMyAdmin de Laragon, o por consola:
   ```powershell
   cd C:\laragon\www\copiwaypro
   "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 < sql\schema.sql
   ```
   (Ajusta la ruta de `mysql.exe` a tu versión. `--default-character-set=utf8mb4` evita que las tildes y la ñ se dañen.) ⚠️ `schema.sql` borra la base si ya existía.

   **(Opcional)** Datos de ejemplo, **nunca en producción**:
   ```powershell
   "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < sql\seed.sql
   ```
   | Rol | Correo | Contraseña |
   |---|---|---|
   | Programador | programador@copiway.com | Copiway2024! |
   | Administrador | admin@copiway.com | Copiway2024! |
   | Ayudante de Cocina | carlos.mendoza@copiway.com | Copiway2024! |
   | Domiciliario | valentina.rojas@copiway.com | Copiway2024! |
   | Cliente | juan.perez@email.com | Cliente2024! |

2. **Conexión**: revisa `config/database.php`. Con Laragon (MySQL sin contraseña) no hay que cambiar nada.

3. **Frontend**: `npm install` y luego `npm run build` (crea `public/assets/main.js` y `public/assets/main.css`).

4. **(Opcional) Librerías de PHP**: `composer install`. Instala PHPMailer (correo de recuperación de contraseña) y `minishlink/web-push` (notificaciones push). Sin esto la app funciona igual, pero sin esas dos funciones.

5. **Primer Administrador** (si no cargaste `seed.sql`): `php sql\create-admin.php`

## Cómo abrir el sitio

Con Laragon encendido (Apache y MySQL), abre **`http://localhost/copiwaypro/`**.

> ⚠️ `http://localhost/` a secas es la página de bienvenida de Laragon, no el sitio. Si ves un 404 en `/login`, revisa que la dirección tenga `/copiwaypro/`.

**Desarrollo con recarga automática:** `npm run dev` abre Vite en `http://localhost:3000` y reenvía `/api/*` al Apache de Laragon (`http://localhost/copiwaypro`). Elige la pantalla con `?pagina=admin` en la dirección.

## Dónde se configura cada cosa

| Qué | Dónde |
|---|---|
| Conexión a MySQL | `config/database.php` (`$host`, `$user`, `$password`, `$bd`, `$port`) |
| Entorno, modo debug, zona horaria, carpeta del proyecto | `config/app.php` (`'entorno'`, `'debug'`, `'zona_horaria'`, `'ruta_base'`) |
| Nombre y duración de la sesión | Constantes de `config/Session.php` |
| Intentos de login permitidos | Constantes de `models/IntentoLogin.php` |
| Clave para firmar los pagos | Constante `CLAVE_FIRMA` de `models/PagoService.php` |
| Claves de las notificaciones push | Constantes `VAPID_*` de `models/PushNotificationService.php` |
| Servidor de correo (SMTP) | Constantes de `models/CorreoService.php` |
| Horario, tarifa, puntos, datos del negocio | El panel del administrador (tabla `CONFIGURACION_SISTEMA`) |

## Rutas de la API

Las rutas que cambian datos (`POST`, `PUT`, `PATCH`, `DELETE`) exigen el token CSRF (cabecera `X-CSRF-Token`). Las que tienen roles en `config/rutas.php` exigen sesión y rol. Las del catálogo (`products`, `ingredients`, `settings` en lectura) son públicas.

- `POST /api/auth/login|register|logout`, `GET /api/auth/csrf`
- `POST /api/auth/forgot-password/request|reset`
- `POST/PUT/DELETE /api/products` y `/api/inventory`; `PATCH /api/inventory/{id}/stock`
- `POST /api/uploads/product-image`
- `POST/PUT /api/staff` (la baja es `PUT` con `active: false`), `DELETE /api/staff/{id}?role=...`, `PATCH /api/staff/{id}/location`
- `PUT /api/clients/{id}`, `PUT /api/clients/{id}/password`
- `GET/POST /api/orders`, `POST /api/orders/manual`, `PATCH /api/orders/{id}/preparing|ready|take|release|accept|deliver|review|address|destination`
- `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}` (pasarela de prueba)
- `PUT /api/settings`, `POST/DELETE /api/settings/categories`
- `GET /api/cash-closing/preview`, `POST /api/cash-closing`
- `GET /api/push/public-key`, `POST /api/push/subscribe`
- `GET /api/sync`: **todos los datos que muestra la pantalla** (productos, inventario, pedidos, clientes, personal, ajustes). Responde `304` si nada cambió.

La lista completa, con el controlador y los roles de cada ruta, está en `config/rutas.php` y en [Documentacion.md/config/rutas.md](Documentacion.md/config/rutas.md).

## Antes de publicar en un servidor real

- Cambia **todas** las contraseñas de ejemplo de `seed.sql` (o no lo ejecutes).
- En `config/app.php` pon `'debug' => false` y `'entorno' => 'production'`.
- Cambia `CLAVE_FIRMA` en `models/PagoService.php` por un texto largo al azar.
- Usa HTTPS (las cookies de sesión se marcan `secure` solas si la conexión es HTTPS).
- La sección **"Observaciones encontradas al documentar"** de [Documentacion.md/README.md](Documentacion.md/README.md) lista las fallas corregidas y los pendientes conocidos.
