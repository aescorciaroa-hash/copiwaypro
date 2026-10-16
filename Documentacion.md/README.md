# Documentación de CopiwayPRO

Esta carpeta explica, **archivo por archivo**, qué hace cada parte del proyecto y **cómo se conecta**
con las demás. Las carpetas tienen **la misma estructura que el proyecto**:

| Archivo del proyecto | Su documentación |
|---|---|
| `models/Cliente.php` | `Documentacion.md/models/Cliente.md` |
| `src/pages/Login.tsx` | `Documentacion.md/src/pages/Login.md` |
| `config/rutas.php` | `Documentacion.md/config/rutas.md` |

Cada documento tiene las mismas partes:
- **¿Para qué sirve?**: la explicación corta.
- **¿Con qué se conecta?**: qué archivos usa (→) y qué archivos lo usan (←).
- **Variables importantes**: de dónde viene cada una, para qué sirve y a dónde va.
- **Código explicado**: las partes del código, con ejemplos.
- **¿Qué pasa si se borra?**: qué deja de funcionar y qué error aparece si se borra el archivo, una
  línea `require_once`, un método o una ruta (ver también [la guía 15](general.md/15-si-algo-deja-de-funcionar.md)).

Algunas carpetas tienen además un `README.md` que explica lo que tienen en común todos sus archivos
(por ejemplo, [controllers/README.md](controllers/README.md) explica la forma de un controlador).

---

## 🌳 Estructura completa
[ESTRUCTURA.md](ESTRUCTURA.md): todo el proyecto en forma de árbol, con lo que hace cada archivo en una línea.

## 📘 Guías generales (empieza aquí)
Si es la primera vez, lee primero las guías por tema en [general.md/](general.md/README.md):
[qué es](general.md/01-que-es-copiwaypro.md) · [instalación](general.md/02-instalacion.md) · [arrancar el sistema](general.md/03-arrancar-el-sistema.md) · [cómo funciona](general.md/04-como-funciona.md) · [roles](general.md/05-roles-y-usuarios.md) · [ciclo de un pedido](general.md/06-ciclo-de-un-pedido.md) · [base de datos](general.md/07-base-de-datos.md) · [configuración](general.md/08-configuracion.md) · [seguridad](general.md/09-seguridad.md) · [pagos](general.md/10-pagos.md) · [notificaciones y correo](general.md/11-notificaciones-y-correo.md) · [hacer cambios](general.md/12-como-hacer-cambios.md) · [problemas comunes](general.md/13-problemas-comunes.md) · [comandos](general.md/14-comandos.md) · [**si algo deja de funcionar**](general.md/15-si-algo-deja-de-funcionar.md)

El resto de esta carpeta documenta **cada archivo** del proyecto.

---

## 1. ¿Cómo funciona el sistema?

| Parte | Hecha con | Carpeta | Qué hace |
|---|---|---|---|
| **Frontend** (lo que se ve) | React + TypeScript | `src/` | Pantallas, botones, formularios. Se compila con `npm run build` a `public/assets/`. |
| **Backend** (lo que hay detrás) | PHP (MVC) | `config/`, `controllers/`, `models/`, `views/`, `public/` | Recibe peticiones, valida, consulta MySQL y responde **JSON**. |
| **Base de datos** | MySQL | `sql/` | Guarda todo. |

### Cuando abres una página (ej: `/admin`)
```
Navegador ──► .htaccess ──► public/index.php ──► despacharPagina()  (config/helpers.php)
                                                    │  lee config/paginas.php y revisa el rol
                                                    ▼
                                         PaginaController.php ──► views/paginas/admin.php
                                                    │                 cabecera.php + pie.php
                                                    ▼
                                    HTML con <div id="app" data-pagina="admin">
                                    y window.__DATOS__ (usuario, token, ajustes)
                                                    ▼
                          src/main.tsx elige AdminDashboard.tsx y lo dibuja
```

### Cuando React pide o guarda datos (ej: editar un producto)
```
MenuSection.tsx ──► store/almacenAplicacion.ts (updateProduct)
                ──► servicios/api.ts  PUT /api/products/6  { "price": 16000 }
                ──► public/index.php ──► despacharRuta()   lee config/rutas.php,
                                                           revisa CSRF y rol "admin",
                                                           pone $_GET['accion']='update', $_GET['id']='6'
                ──► controllers/ProductController.php   $controller->update()
                ──► models/Producto.php                 UPDATE en MySQL
                ──► views/json/producto.php             fila → JSON de React
                ──► responderJson(...) ──► React actualiza la pantalla
```

### Cómo se mantiene todo actualizado
`src/components/SyncDatos.tsx` pregunta cada pocos segundos a `GET /api/sync`
(`SyncController.php`). Si algo cambió (por ejemplo, la cocina marcó un pedido como listo), los datos
nuevos se guardan en `store/almacenAplicacion.ts` y todas las pantallas se actualizan solas.

---

## 2. Índice

### Raíz del proyecto
| Archivo | Para qué |
|---|---|
| [.gitignore](.gitignore.md) | Qué no se sube a GitHub. |
| [.htaccess](.htaccess.md) | Reglas de Apache: todo va a `public/index.php`. |
| [composer.json](composer.md) | Librerías de PHP (PHPMailer, web-push). |
| [package.json](package.md) | Librerías de React y comandos (`npm run build`). |
| [vite.config.ts](vite.config.md) | Configuración de la compilación de React. |
| [tsconfig.json](tsconfig.md) | Configuración de TypeScript. |
| [index.html](index.md) | Página solo para `npm run dev`. |

### public/
| Archivo | Para qué |
|---|---|
| [index.php](public/index.md) | **Punto de entrada** de toda la app. |
| [.htaccess](public/.htaccess.md) | Reglas de Apache dentro de `public/`. |
| [sw.js](public/sw.md) | Service Worker: muestra las notificaciones push. |
| [manifest.json](public/manifest.md) | Para instalar la app en el celular. |
| [Imágenes e íconos](public/imagenes.md) | Favicons y carpetas que se generan. |

### config/
[database.php](config/database.md) (crea `$conn`) · [app.php](config/app.md) (ajustes generales) ·
[rutas.php](config/rutas.md) (rutas de la API) · [paginas.php](config/paginas.md) (páginas) ·
[helpers.php](config/helpers.md) (funciones de ayuda y el router) · [Session.php](config/Session.md)

### sql/
[schema.sql](sql/schema.md) (las 23 tablas) · [seed.sql](sql/seed.md) (datos de ejemplo) ·
[create-admin.php](sql/create-admin.md) (crear el primer administrador por consola)

### controllers/ — [cómo funciona un controlador](controllers/README.md)
| Controlador | Rutas |
|---|---|
| [AuthController](controllers/AuthController.md) | `/api/auth/...` login, registro, recuperar contraseña |
| [PaginaController](controllers/PaginaController.md) | Las páginas (`/`, `/login`, `/admin`...) |
| [ProductController](controllers/ProductController.md) | `/api/products` |
| [InventoryController](controllers/InventoryController.md) | `/api/inventory` |
| [ClientController](controllers/ClientController.md) | `/api/clients` |
| [StaffController](controllers/StaffController.md) | `/api/staff` |
| [OrderController](controllers/OrderController.md) | `/api/orders` |
| [PaymentController](controllers/PaymentController.md) | `/api/payments` |
| [CashClosingController](controllers/CashClosingController.md) | `/api/cash-closing` |
| [SettingController](controllers/SettingController.md) | `/api/settings` |
| [SyncController](controllers/SyncController.md) | `/api/sync` |
| [PushController](controllers/PushController.md) | `/api/push` |
| [UploadController](controllers/UploadController.md) | `/api/uploads/product-image` |

### models/ — [cómo funciona un modelo](models/README.md)
[Cliente](models/Cliente.md) · [Producto](models/Producto.md) · [Ingrediente](models/Ingrediente.md) ·
[Pedido](models/Pedido.md) · [Personal](models/Personal.md) · [Configuracion](models/Configuracion.md) ·
[Caja](models/Caja.md) · [Usuario](models/Usuario.md) ·
[CodigoVerificacion](models/CodigoVerificacion.md) · [IntentoLogin](models/IntentoLogin.md) ·
[PushSuscripcion](models/PushSuscripcion.md) · [Auth](models/Auth.md) (iniciar y cerrar sesión)

Servicios (las reglas grandes, también en `models/`):
[PedidoService](models/PedidoService.md) (crear pedidos, estados, entrega) ·
[CajaService](models/CajaService.md) (cierre de caja) · [PagoService](models/PagoService.md) (pagos de prueba) ·
[CorreoService](models/CorreoService.md) · [PushNotificationService](models/PushNotificationService.md)

### views/
- json/ — [qué son](views/json/README.md): [cliente](views/json/cliente.md) · [ingrediente](views/json/ingrediente.md) · [pedido](views/json/pedido.md) · [personal](views/json/personal.md) · [producto](views/json/producto.md)
- layouts/: [cabecera](views/layouts/cabecera.md) · [pie](views/layouts/pie.md)
- paginas/ — [las 8 páginas](views/paginas/README.md): [admin](views/paginas/admin.md) · [cliente](views/paginas/cliente.md) · [cocina](views/paginas/cocina.md) · [domiciliario](views/paginas/domiciliario.md) · [landing](views/paginas/landing.md) · [login](views/paginas/login.md) · [recuperar](views/paginas/recuperar.md) · [registro](views/paginas/registro.md)

### src/ (React) — [React en 5 minutos](src/README.md)
| Carpeta | Archivos |
|---|---|
| raíz | [main.tsx](src/main.md) · [global.d.ts](src/global.d.md) · [index.css](src/index.css.md) |
| servicios/ | [api.ts](src/servicios/api.md) — la única puerta para hablar con PHP |
| store/ | [almacenAplicacion.ts](src/store/almacenAplicacion.md) — los datos compartidos |
| components/ | [SyncDatos](src/components/SyncDatos.md) · [Navbar](src/components/Navbar.md) · [Footer](src/components/Footer.md) · [ConfirmDialog](src/components/ConfirmDialog.md) · [ToastNotification](src/components/ToastNotification.md) · [CustomSelect](src/components/CustomSelect.md) · [CustomDatePicker](src/components/CustomDatePicker.md) · [CalendarModal](src/components/CalendarModal.md) · [TimePickerModal](src/components/TimePickerModal.md) |
| context/ | [ThemeContext.tsx](src/context/ThemeContext.md) — tema claro/oscuro |
| hooks/ | [useForm.ts](src/hooks/useForm.md) — formularios |
| lib/ | [format.ts](src/lib/format.md) · [pasarela.ts](src/lib/pasarela.md) · [pushNotifications.ts](src/lib/pushNotifications.md) |
| utils/ | [audio.ts](src/utils/audio.md) · [generarCierrePdf.ts](src/utils/generarCierrePdf.md) |
| pages/ | [Landing](src/pages/Landing.md) · [Login](src/pages/Login.md) · [Register](src/pages/Register.md) · [ForgotPassword](src/pages/ForgotPassword.md) · [AdminDashboard](src/pages/AdminDashboard.md) · [ClientDashboard](src/pages/ClientDashboard.md) · [KitchenDashboard](src/pages/KitchenDashboard.md) · [DeliveryDashboard](src/pages/DeliveryDashboard.md) |
| pages/admin/ | [qué son](src/pages/admin/README.md): [Overview](src/pages/admin/OverviewSection.md) · [Orders](src/pages/admin/OrdersSection.md) · [Map](src/pages/admin/MapSection.md) · [Menu](src/pages/admin/MenuSection.md) · [Inventory](src/pages/admin/InventorySection.md) · [Staff](src/pages/admin/StaffSection.md) · [Clients](src/pages/admin/ClientsSection.md) · [Settings](src/pages/admin/SettingsSection.md) |
| pages/client/ | [qué son](src/pages/client/README.md): [Catalog](src/pages/client/CatalogSection.md) · [Builder](src/pages/client/BuilderSection.md) · [Cart](src/pages/client/CartSection.md) · [Checkout](src/pages/client/CheckoutSection.md) · [PaymentGatewayModal](src/pages/client/PaymentGatewayModal.md) · [ActiveOrders](src/pages/client/ActiveOrdersSection.md) · [History](src/pages/client/HistorySection.md) · [Profile](src/pages/client/ProfileSection.md) · [ingredientArt](src/pages/client/ingredientArt.md) |

---

## 3. Lo que no se documenta archivo por archivo
| Qué | Por qué |
|---|---|
| `node_modules/` y `vendor/` | Son librerías descargadas (`npm install`, `composer install`), no código del proyecto. |
| `package-lock.json` y `composer.lock` | Los genera el instalador solo: guardan la versión exacta de cada librería. No se editan a mano. |
| `public/assets/` | Es `src/` compilado por `npm run build`. Se documenta su código fuente (`src/`). |
| `Documentos/`, archivos `.docx` y `.xlsx` | Documentos del proyecto (requerimientos, historias de usuario), no código. |
| [docs/MANUAL_USUARIO_Y_LOGICA.md](docs/MANUAL_USUARIO_Y_LOGICA.md) | Manual de usuario del sistema. |
| `README.md` (raíz) | Descripción general del proyecto: arquitectura, instalación, cómo abrir el sitio, dónde se configura cada cosa y lista de rutas. Es el resumen; esta carpeta es el detalle. |

---

## 4. Observaciones encontradas al documentar
Las fallas que se habían anotado aquí ya se **corrigieron**. Se deja el registro de qué se cambió:

| Dónde | Qué pasaba | Cómo quedó | Detalle |
|---|---|---|---|
| Ubicación GPS del domiciliario | Se enviaba con `PUT /api/staff/{id}` (solo admin) → 403, y nunca se guardaba. | Usa `PATCH /api/staff/{id}/location` cada 10 s con la posición real. La posición simulada (sin GPS) ya no se envía. | [StaffController](controllers/StaffController.md), [DeliveryDashboard](src/pages/DeliveryDashboard.md) |
| Pedido manual del admin | Usaba `POST /api/orders` (solo clientes) → 403, pero la pantalla decía "creado". | Ruta propia `POST /api/orders/manual`. Busca al cliente por celular; si no existe, queda como invitado. | [OrderController](controllers/OrderController.md), [AdminDashboard](src/pages/AdminDashboard.md) |
| Cambiar dirección de un pedido | Solo cambiaba en el navegador. | Se guarda con `PATCH /api/orders/{id}/address`; el domiciliario recibe el aviso "Dirección Actualizada". | [PedidoService](models/PedidoService.md) |
| Borrar personal | El DELETE solo desactivaba (aunque la pantalla decía "eliminado definitivamente") y sin `role` podía tocar a la persona equivocada. | Borra de verdad solo si no tiene historial; si lo tiene, responde 409 y sugiere "Dar de baja". El `role` es obligatorio. | [Personal](models/Personal.md) |
| Tarjetas de la cocina y comandas del admin | Resaltaban SIN/EXTRA leyendo `modifications`, que el servidor no envía, así que no mostraban nada. | Leen `removed` y `extras` con `modificacionesDe()` de `src/lib/format.ts`. | [KitchenDashboard](src/pages/KitchenDashboard.md), [format](src/lib/format.md) |
| Ticket de cocina | Tenía NIT, dirección y teléfono de ejemplo escritos en el código. | Se editan en **Ajustes → Datos del Negocio**. | [SettingsSection](src/pages/admin/SettingsSection.md) |
| Puntos de fidelidad | Se acumulaban pero no se podían usar. | El cliente los canjea en el checkout; el valor y el mínimo se configuran en **Ajustes**. | [PedidoService](models/PedidoService.md) |

Pendientes conocidos (a propósito, para más adelante): no hay pantalla para **cancelar** pedidos y la
**pasarela de pagos** es de prueba.

---

## 5. Sintaxis de PHP que se repite en todo el proyecto

| Código | Qué significa |
|---|---|
| `require_once __DIR__ . '/../models/Cliente.php';` | Carga otro archivo PHP **una sola vez**. `__DIR__` es la carpeta del archivo actual. |
| `$accion = $_GET['accion'] ?? '';` | `??` = "si no existe, usa el siguiente valor". |
| `$accion === 'update'` | `===` compara valor **y** tipo (más estricto que `==`). |
| `$controller->update();` | Llama al método `update()` del objeto controlador. |
| `$this->productoModel` | Dentro de una clase, una propiedad del objeto (se declara con `private $productoModel;`). |
| `(int) $valor`, `(float)`, `(string)`, `(bool)` | Convierte un valor a entero, decimal, texto o verdadero/falso. |
| `$stmt = $this->conn->prepare("... WHERE id = ?");` | Prepara una consulta. El `?` se llena después (evita inyección SQL). |
| `$stmt->bind_param("si", $nombre, $id);` | Llena los `?`. Cada letra es un tipo: `s` texto, `i` entero, `d` decimal. |
| `$stmt->execute();` | Ejecuta la consulta. |
| `$stmt->get_result()->fetch_assoc();` | Trae **una** fila como arreglo (`['nombre' => 'Ana', ...]`). |
| `->fetch_all(MYSQLI_ASSOC)` | Trae **todas** las filas. |
| `$stmt->close();` | Cierra la consulta. |
| `$this->conn->insert_id` | El id de la última fila insertada. |
| `$stmt->affected_rows` | Cuántas filas cambió un UPDATE o DELETE. |
| `global $conn;` | Usa la variable `$conn` creada en `config/database.php`. |
| `Auth::id()` | Llama un método **estático** (sin hacer `new Auth()`). |
| `$this->conn` | Dentro de una clase, la conexión guardada en el objeto. |
| `begin_transaction()` / `commit()` / `rollback()` | Transacción: o se guarda todo, o no se guarda nada. |
| `try { ... } catch (Exception $e) { ... }` | Si algo falla dentro del `try`, se ejecuta el `catch`. |
| `throw new Exception('mensaje');` | Lanza un error a propósito para que lo atrape un `catch`. |
| `responderJson($datos, 201);` | Responde JSON con ese código HTTP y termina. |
| `responderError('mensaje', 404);` | Responde un error en JSON y termina. |

### Códigos HTTP que usa la API
| Código | Significa |
|---|---|
| 200 | Todo bien. |
| 201 | Se creó algo nuevo. |
| 304 | Nada cambió (sincronización). |
| 401 | No has iniciado sesión. |
| 402 | El pago fue rechazado. |
| 403 | No tienes permiso, o la tienda está cerrada. |
| 404 | No se encontró. |
| 405 | Método no permitido en esa ruta. |
| 409 | Conflicto (ya existe, estado no permitido, sin stock). |
| 419 | Token CSRF inválido. |
| 422 | Los datos enviados no son válidos. |
| 429 | Demasiados intentos de login. |
| 500 | Error interno del servidor. |
