# CopiwayPRO

Plataforma multi-rol para una dark kitchen (Cliente, Administrador, Ayudante de Cocina, Domiciliario y Programador). Backend en **PHP plano** (sin framework, MySQLi con consultas preparadas) + MySQL, y frontend en **React/Vite** que PHP entrega como una SPA (sin React Router).

Corre 100% en local con **`localhost`**, sin dominios `.test` obligatorios y sin tocar el archivo `hosts` de Windows.

> 📚 **Documentación archivo por archivo:** [documentacion.md/README.md](documentacion.md/README.md). Explica qué hace cada archivo del proyecto (PHP, React, base de datos y configuración), con qué se conecta y para qué sirve cada variable.

## Arquitectura

```
/app
  /Controllers   Un archivo por recurso de la API + PaginaController (paginas). Estilo procedural con $action e if/elseif
  /Core          helpers.php (funciones de ayuda y el router), Session.php (clase Session), Auth.php (clase Auth)
  /Models        Acceso a datos: un modelo por tabla (Usuario, Cliente, Producto, Ingrediente, Pedido, Personal, Configuracion, Caja...)
  /Services      Reglas de negocio grandes (PedidoService, CajaService, PagoService, CorreoService, PushNotificationService)
  /Views
    /layouts     cabecera.php / pie.php (el HTML que carga React)
    /paginas     Una vista por pantalla (landing, login, admin, cliente, cocina, domiciliario...)
    /json        Funciones que convierten filas de MySQL al JSON que espera React
/config          database.php (.env + conexion $conn), app.php, rutas.php (API), paginas.php (paginas)
/database        schema.sql (esquema completo) y seed.sql (datos demo opcionales)
/documentacion.md Documentacion de cada archivo del proyecto, con la misma estructura de carpetas
/docs            Documentacion anterior y baseline de verificacion (docs/baseline)
/public          Punto de entrada unico (index.php) + build compilado (assets/main.js, assets/main.css)
/storage         logs/, uploads/
/bin             create-admin.php (consola para el rol Programador)
/src             Frontend React: llamadas a la API solo en src/servicios y src/store
install.bat      Instala todo (BD, dependencias, build) de un solo paso
start.bat        Sirve el sitio en http://localhost:8000/ sin Apache
```

### Cómo está escrito el PHP

No hay `namespace` ni clases de framework (Router/Request/Response). Las rutas son arreglos en `config/` y el despacho lo hace `app/Core/helpers.php` (`despacharRuta()` para `/api/*`, `despacharPagina()` para las páginas). Cada archivo carga lo que necesita con `require_once`.

**Controladores** (procedurales, con `$action`):
```php
<?php
/**
 * Controlador de Productos (menu).
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Core/helpers.php';
require_once __DIR__ . '/../Models/Producto.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$productoModel = new Producto();
$datos         = entrada();

if ($action === 'index') {
    responderJson($productoModel->listar());
}
elseif ($action === 'update') {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    ...
}
else {
    responderError('Ruta no encontrada.', 404);
}
```
El router pone en `$_GET` la acción (`$_GET['action']`) y los parámetros de la ruta (`{id}` → `$_GET['id']`) antes de cargar el archivo.

**Modelos** (`private $conn` + `global $conn`, consultas preparadas escritas completas):
```php
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
```
En los `UPDATE` que se arman con los campos que lleguen, la cadena de tipos de `bind_param` la arma `tiposDe()` (en `helpers.php`).

**Sesión y autenticación**: clases con métodos estáticos (`Session::start()`, `Session::csrf()`, `Auth::check()`, `Auth::id()`, `Auth::rol()`, `Auth::login()`, `Auth::logout()`).

**Model vs Service**: la mayoría de los recursos (Producto, Ingrediente, Cliente, Personal, Configuracion...) son tan simples que su Model hace todo y el Controller lo llama directo. Los casos con reglas de negocio complejas tienen su propio Service en `app/Services/`: el checkout de un pedido (horario, precios recalculados en el servidor, pago, descuento de inventario en una transacción) y el cierre de caja (efectivo vs digital, archivar pedidos, liquidar domiciliarios). Los modelos `Pedido` y `Caja` solo leen; `PedidoService` y `CajaService` deciden y guardan.

**Flujo de una petición API**: `.htaccess` → `public/index.php` → `despacharRuta()` (lee `config/rutas.php`, revisa CSRF y exige sesión/rol si aplica) → archivo del controlador con su `$action` → Model (MySQLi + consultas preparadas) → `responderJson()`.

**Flujo de una petición de página**: `.htaccess` → `public/index.php` → `despacharPagina()` (lee `config/paginas.php`) → `PaginaController.php` → `mostrarVista()` muestra `app/Views/layouts/cabecera.php` + la vista + `pie.php`. El layout inyecta `window.__APP_BASE__` y `window.__DATOS__` (usuario en sesión, token CSRF y ajustes de la tienda) y monta `<div id="app" data-pagina="...">`. `src/main.tsx` lee ese `data-pagina` y monta el componente de React correspondiente. **No hay React Router**: navegar entre pantallas es una recarga normal de página (`window.location.href`, con el helper `irA()` de `src/servicios/api.ts`).

## Instalación (automática)

```powershell
cd C:\laragon\www\copiwaypro
install.bat
```

`install.bat` detecta el PHP y el MySQL de Laragon (cualquier versión instalada), verifica que MySQL esté activo, crea la base de datos desde `database\schema.sql` (⚠️ borra la base si ya existía), ofrece cargar datos de demo (`database\seed.sql`), copia `.env.example` a `.env` si no existe, e instala y compila el frontend (`npm install` + `npm run build`). Al final te indica la URL exacta para abrir.

`install.bat` **no** ejecuta Composer. Para tener correos y notificaciones push, ejecuta también `composer install` (ver el paso 4 de la instalación manual). Sin eso la app funciona igual, pero sin esas dos funciones.

## Instalación manual (paso a paso)

1. **Crea la base de datos**:
   ```powershell
   cd C:\laragon\www\copiwaypro
   "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 < database\schema.sql
   ```
   (Ajusta la ruta de `mysql.exe` a la versión que tengas en `C:\laragon\bin\mysql\`. El flag `--default-character-set=utf8mb4` es importante: sin él, los nombres con tildes/ñ quedan corruptos al importar.) Esto crea la base `hamburguer_copiway` con sus 23 tablas, el trigger que genera el PIN de entrega y la fila inicial de configuración.

   **(Opcional)** Datos de demostración — **nunca en producción**:
   ```powershell
   "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < database\seed.sql
   ```
   | Rol | Correo | Contraseña |
   |---|---|---|
   | Programador | programador@copiway.com | Copiway2024! |
   | Administrador | admin@copiway.com | Copiway2024! |
   | Ayudante de Cocina | carlos.mendoza@copiway.com | Copiway2024! |
   | Domiciliario | valentina.rojas@copiway.com | Copiway2024! |
   | Cliente | juan.perez@email.com | Cliente2024! |

2. **Variables de entorno**: `copy .env.example .env`. Para desarrollo local estándar de Laragon (MySQL sin contraseña en `127.0.0.1:3306`) no hace falta editar nada.

3. **Frontend**: `npm install` y luego `npm run build` (compila a `public/assets/main.js` y `public/assets/main.css` con nombres fijos, sin hash, para que PHP los cargue directo con `?v=filemtime()` como cache-busting).

4. **(Opcional) Librerías de PHP**: `composer install`. Instala PHPMailer (correo de recuperación de contraseña) y `minishlink/web-push` (notificaciones push) en `vendor/`.

5. **Primer Administrador** (opcional si ya cargaste `seed.sql`): `php bin\create-admin.php`

## Cómo abrir el sitio

### A) Vhost de Laragon: `http://copiwaypro.test/`

Si "Auto Virtual Hosts" está activo en Laragon (**Menú → Preferencias → Auto Virtual Hosts**), el proyecto en `C:\laragon\www\copiwaypro` queda disponible automáticamente en **`http://copiwaypro.test/`**.

### B) Subcarpeta bajo `localhost`: `http://localhost/copiwaypro/`

Con el proyecto en `C:\laragon\www\copiwaypro`, también abre en **`http://localhost/copiwaypro/`** (Apache sirve `C:\laragon\www` como raíz, y `copiwaypro/` es la subcarpeta del proyecto).

> ⚠️ **`http://localhost/` a secas NO es el sitio**: es la página de bienvenida de Laragon que lista los proyectos de `www\`. Si ves un 404 en una ruta como `/login`, casi siempre es porque falta el prefijo `/copiwaypro/` (o el dominio `copiwaypro.test`) en la URL. Los enlaces internos de la app (botones, `irA()`, redirecciones del backend) siempre construyen la URL correcta con `window.__APP_BASE__`; el problema solo aparece al escribir la URL a mano u olvidar el prefijo en un marcador.

### C) Servidor embebido de PHP (sin Apache)

```powershell
start.bat
```
Abre **`http://localhost:8000/`**. Usa `public/server-router.php`, que sirve los archivos estáticos ya compilados y envía `/api/*` y el resto de rutas a `index.php`, igual que el `.htaccess`.

### D) Desarrollo con recarga en caliente (Vite)

```powershell
npm run dev
```
Levanta Vite en `http://localhost:3000` con proxy de `/api/*` hacia el backend (por defecto `http://localhost:8000`, es decir, corre `start.bat` en paralelo). Si prefieres usar Apache (A/B) como backend mientras desarrollas, cambia `VITE_API_PROXY_TARGET` en `.env`. Como en este modo no hay PHP generando la página, elige la pantalla con `?pagina=admin` en la URL.

Los métodos A, B y C usan **el mismo build** (`public/assets/main.js` + `public/assets/main.css`): no hay que recompilar para cambiar de método.

### Convenciones de nombres

- Clases y archivos PHP: PascalCase y nombres en español para Modelos y Vistas (`Usuario`, `Cliente`, `Producto`, `Ingrediente`, `Pedido`, `Personal`, `Configuracion`, `Caja`).
- Llaves `{` de clases y funciones en la línea siguiente; los `if / elseif` de los controladores en líneas separadas.
- Archivos de frontend: PascalCase para componentes React.
- Métodos y variables: camelCase descriptivo.

## Rutas 100% portables

- **Ruta base**: `rutaBase()` en `app/Core/helpers.php` la calcula sola a partir de `SCRIPT_NAME` en cada petición (o se puede fijar con `APP_BASE_PATH` en `.env`). Nunca hay una ruta escrita a mano en el backend.
- **Assets (JS/CSS)**: `app/Views/layouts/cabecera.php` y `pie.php` construyen la URL de `main.js`/`main.css` como `rutaBase() . '/assets/...'`, así que cargan igual sin importar la subcarpeta o el dominio.
- **Navegación (sin React Router)**: `src/main.tsx` monta el componente según `data-pagina`; `src/servicios/api.ts` expone `irA(ruta)` (`window.location.href = rutaBase() + ruta`) y `rutaBase()` (lee `window.__APP_BASE__`, inyectado por el layout PHP).
- **Cliente API** (`src/servicios/api.ts`): la URL base de la API es `rutaBase() + '/api'`, nunca un dominio fijo.
- **Cookies de sesión**: sin `Domain` fijo, `Path` según la ruta base detectada, `Secure` solo si la conexión es HTTPS, `SameSite=Lax`. Funcionan en `http://localhost` sin HTTPS.

Si cambias de carpeta o de puerto, no hay que tocar código: todo se recalcula en cada petición.

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `APP_ENV` / `APP_DEBUG` | Entorno y modo debug (nunca `true` en producción). Con `APP_ENV=local`, si el correo no sale, la recuperación de contraseña devuelve el código para poder probar. |
| `APP_KEY` | Clave secreta para firmar los pagos de la pasarela de prueba. Cámbiala por un texto largo al azar. |
| `APP_BASE_PATH` | Ruta base bajo el host. Vacío = autodetectar (recomendado). |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | Conexión MySQL (por defecto: `127.0.0.1`, `3306`, `hamburguer_copiway`, `root`, vacío; la configuración estándar de Laragon) |
| `SESSION_NAME` / `SESSION_LIFETIME` | Cookie de sesión |
| `RATE_LIMIT_LOGIN_MAX_ATTEMPTS` / `RATE_LIMIT_LOGIN_WINDOW_MINUTES` | Límite de intentos de login fallidos |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Claves para las notificaciones push. Sin ellas no se envían. |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_ENCRYPTION` / `MAIL_USER` / `MAIL_PASS` / `MAIL_FROM` / `MAIL_FROM_NAME` | Servidor SMTP para el correo de recuperación de contraseña. |
| `VITE_API_PROXY_TARGET` | Solo para `npm run dev`: a dónde reenviar `/api/*` (por defecto `http://localhost:8000`) |

## Endpoints principales

Todas las rutas que cambian datos (`POST`, `PUT`, `PATCH`, `DELETE`) exigen el token CSRF (cabecera `X-CSRF-Token`). Las que tienen roles en `config/rutas.php` exigen sesión y rol vía `requiereRol()`. Las de catálogo (`products`, `ingredients`, `settings` en lectura) son públicas para que el sitio funcione antes de iniciar sesión.

- `POST /api/auth/login|register|logout`, `GET /api/auth/me`, `GET /api/auth/csrf`
- `POST /api/auth/forgot-password/request|reset`
- `GET/POST/PUT/DELETE /api/products`, `/api/ingredients`, `/api/inventory`; `PATCH /api/inventory/{id}/stock`; `GET /api/inventory-logs`
- `POST /api/uploads/product-image`
- `GET/POST/PUT/DELETE /api/staff` (baja lógica), `PATCH /api/staff/{id}/location`
- `GET/PUT /api/clients`, `PUT /api/clients/{id}/password`, `/api/clients/{id}/notifications`
- `GET/POST /api/orders`, `PATCH /api/orders/{id}/preparing|ready|take|release|accept|deliver|review`
- `POST /api/payments/prepare`, `POST /api/payments/transactions`, `GET /api/payments/transactions/{id}` (pasarela de prueba)
- `GET/PUT /api/settings`, `POST/DELETE /api/settings/categories`
- `GET /api/cash-closing/preview`, `POST/GET /api/cash-closing`, `GET /api/dashboard`
- `GET /api/push/public-key`, `POST /api/push/subscribe|unsubscribe`
- `GET /api/sync`: sincronización con ETag (responde `304` si nada cambió)

La lista completa, con el controlador y los roles de cada ruta, está en `config/rutas.php` y en [documentacion.md/config/rutas.md](documentacion.md/config/rutas.md).

## Migración desde Firebase/Firestore

Este proyecto reemplaza por completo el backend original (Firebase/Firestore) por PHP plano + MySQL (MySQLi, consultas preparadas), manteniendo el frontend visualmente idéntico. Puntos clave:

- **Cero credenciales en el código**: el login original (y los mini-logins de los paneles de cocina/domiciliario) tenían contraseñas y atajos escritos en el código. Todo eso se eliminó; la autenticación es 100% en el servidor con `password_hash`/`password_verify`.
- **Reglas de negocio en el servidor**: horario de atención, tarifa de domicilio, descuento de inventario (con `SELECT ... FOR UPDATE` dentro de una transacción), puntos de fidelización y PIN de entrega se validan y calculan en PHP.
- **Cierre de caja persistente**: `POST /api/cash-closing` calcula el consumo real de insumos, archiva los pedidos del turno (no los borra) y liquida a cada domiciliario.
- **Sin dependencia de Firebase ni de dominios fijos**: no queda ninguna referencia a Firebase ni URLs absolutas escritas a mano. Composer solo se usa para dos librerías opcionales (PHPMailer y web-push).

## Notas de seguridad para producción

- Cambia **todas** las contraseñas demo del `seed.sql` (o no lo ejecutes en producción).
- Pon `APP_DEBUG=false` y `APP_ENV=production` en `.env`, y un `APP_KEY` propio.
- Sirve el sitio por HTTPS (las cookies de sesión se marcan `secure` automáticamente si `HTTPS`/`X-Forwarded-Proto` lo indican).
- Ya están cubiertos: CSRF en todas las rutas que cambian datos, límite de intentos de login, máximo 5 intentos por código de recuperación, y el PIN de entrega visible solo para el cliente.
- Revisa la sección **"Observaciones encontradas al documentar"** de [documentacion.md/README.md](documentacion.md/README.md): lista comportamientos actuales que conviene corregir (por ejemplo, la ubicación GPS del domiciliario y el pedido manual del administrador).
- `docs/baseline/FUNCIONES_Y_VALIDACIONES.md` tiene el checklist de paridad funcional de la migración (algunos de sus pendientes ya fueron resueltos).
