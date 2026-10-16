# Documentación de CopiwayPRO

Esta carpeta explica, **archivo por archivo**, qué hace cada parte del proyecto y **cómo se conecta**
con las demás. Las carpetas tienen **la misma estructura que el proyecto**:

| Archivo del proyecto | Su documentación |
|---|---|
| `app/Models/Cliente.php` | `documentacion.md/app/Models/Cliente.md` |
| `src/pages/Login.tsx` | `documentacion.md/src/pages/Login.md` |
| `config/rutas.php` | `documentacion.md/config/rutas.md` |

Cada documento tiene las mismas partes:
- **¿Para qué sirve?**: la explicación corta.
- **¿Con qué se conecta?**: qué archivos usa (→) y qué archivos lo usan (←).
- **Variables importantes**: de dónde viene cada una, para qué sirve y a dónde va.
- **Código explicado**: las partes del código, con ejemplos.

Algunas carpetas tienen además un `README.md` que explica lo que tienen en común todos sus archivos
(por ejemplo, [app/Controllers/README.md](app/Controllers/README.md) explica la forma de un controlador).

---

## 1. ¿Cómo funciona el sistema?

| Parte | Hecha con | Carpeta | Qué hace |
|---|---|---|---|
| **Frontend** (lo que se ve) | React + TypeScript | `src/` | Pantallas, botones, formularios. Se compila con `npm run build` a `public/assets/`. |
| **Backend** (lo que hay detrás) | PHP | `app/`, `config/`, `public/` | Recibe peticiones, valida, consulta MySQL y responde **JSON**. |
| **Base de datos** | MySQL | `database/` | Guarda todo. |

### Cuando abres una página (ej: `/admin`)
```
Navegador ──► .htaccess ──► public/index.php ──► despacharPagina()  (app/Core/helpers.php)
                                                    │  lee config/paginas.php y revisa el rol
                                                    ▼
                                         PaginaController.php ──► app/Views/paginas/admin.php
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
                                                           pone $_GET['action']='update', $_GET['id']='6'
                ──► app/Controllers/ProductController.php   if ($action === 'update')
                ──► app/Models/Producto.php                 UPDATE en MySQL
                ──► app/Views/json/producto.php             fila → JSON de React
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
| [.env.example](.env.example.md) | Plantilla de la configuración privada (base de datos, claves, correo). |
| [.gitignore](.gitignore.md) | Qué no se sube a GitHub. |
| [.htaccess](.htaccess.md) | Reglas de Apache: todo va a `public/index.php`. |
| [composer.json](composer.md) | Librerías de PHP (PHPMailer, web-push). |
| [package.json](package.md) | Librerías de React y comandos (`npm run build`). |
| [vite.config.ts](vite.config.md) | Configuración de la compilación de React. |
| [tsconfig.json](tsconfig.md) | Configuración de TypeScript. |
| [index.html](index.md) | Página solo para `npm run dev`. |
| [install.bat](install.md) | Instala todo de una vez. |
| [start.bat](start.md) | Arranca el proyecto sin Apache. |

### public/
| Archivo | Para qué |
|---|---|
| [index.php](public/index.md) | **Punto de entrada** de toda la app. |
| [server-router.php](public/server-router.md) | Router para `start.bat`. |
| [.htaccess](public/.htaccess.md) | Reglas de Apache dentro de `public/`. |
| [sw.js](public/sw.md) | Service Worker: muestra las notificaciones push. |
| [manifest.json](public/manifest.md) | Para instalar la app en el celular. |
| [Imágenes e íconos](public/imagenes.md) | Favicons y carpetas que se generan. |

### config/
[database.php](config/database.md) (lee el `.env` y crea `$conn`) · [app.php](config/app.md) ·
[rutas.php](config/rutas.md) (rutas de la API) · [paginas.php](config/paginas.md) (páginas)

### database/
[schema.sql](database/schema.md) (las 23 tablas) · [seed.sql](database/seed.md) (datos de ejemplo)

### bin/
[create-admin.php](bin/create-admin.md) — crear el primer administrador por consola.

### app/Core/
[helpers.php](app/Core/helpers.md) (funciones de ayuda y el router) · [Session.php](app/Core/Session.md) ·
[Auth.php](app/Core/Auth.md)

### app/Controllers/ — [cómo funciona un controlador](app/Controllers/README.md)
| Controlador | Rutas |
|---|---|
| [AuthController](app/Controllers/AuthController.md) | `/api/auth/...` login, registro, recuperar contraseña |
| [PaginaController](app/Controllers/PaginaController.md) | Las páginas (`/`, `/login`, `/admin`...) |
| [ProductController](app/Controllers/ProductController.md) | `/api/products` |
| [IngredientController](app/Controllers/IngredientController.md) | `/api/ingredients` |
| [InventoryController](app/Controllers/InventoryController.md) | `/api/inventory`, `/api/inventory-logs` |
| [ClientController](app/Controllers/ClientController.md) | `/api/clients` |
| [StaffController](app/Controllers/StaffController.md) | `/api/staff` |
| [OrderController](app/Controllers/OrderController.md) | `/api/orders` |
| [PaymentController](app/Controllers/PaymentController.md) | `/api/payments` |
| [CashClosingController](app/Controllers/CashClosingController.md) | `/api/cash-closing` |
| [DashboardController](app/Controllers/DashboardController.md) | `/api/dashboard` |
| [SettingController](app/Controllers/SettingController.md) | `/api/settings` |
| [SyncController](app/Controllers/SyncController.md) | `/api/sync` |
| [PushController](app/Controllers/PushController.md) | `/api/push` |
| [UploadController](app/Controllers/UploadController.md) | `/api/uploads/product-image` |

### app/Models/ — [cómo funciona un modelo](app/Models/README.md)
[Cliente](app/Models/Cliente.md) · [Producto](app/Models/Producto.md) · [Ingrediente](app/Models/Ingrediente.md) ·
[Pedido](app/Models/Pedido.md) · [Personal](app/Models/Personal.md) · [Configuracion](app/Models/Configuracion.md) ·
[Caja](app/Models/Caja.md) · [Panel](app/Models/Panel.md) · [Usuario](app/Models/Usuario.md) ·
[CodigoVerificacion](app/Models/CodigoVerificacion.md) · [IntentoLogin](app/Models/IntentoLogin.md) ·
[PushSuscripcion](app/Models/PushSuscripcion.md)

### app/Services/
[PedidoService](app/Services/PedidoService.md) (crear pedidos, estados, entrega) ·
[CajaService](app/Services/CajaService.md) (cierre de caja) · [PagoService](app/Services/PagoService.md) (pagos de prueba) ·
[CorreoService](app/Services/CorreoService.md) · [PushNotificationService](app/Services/PushNotificationService.md)

### app/Views/
- json/ — [qué son](app/Views/json/README.md): [cliente](app/Views/json/cliente.md) · [ingrediente](app/Views/json/ingrediente.md) · [pedido](app/Views/json/pedido.md) · [personal](app/Views/json/personal.md) · [producto](app/Views/json/producto.md)
- layouts/: [cabecera](app/Views/layouts/cabecera.md) · [pie](app/Views/layouts/pie.md)
- paginas/ — [las 8 páginas](app/Views/paginas/README.md): [admin](app/Views/paginas/admin.md) · [cliente](app/Views/paginas/cliente.md) · [cocina](app/Views/paginas/cocina.md) · [domiciliario](app/Views/paginas/domiciliario.md) · [landing](app/Views/paginas/landing.md) · [login](app/Views/paginas/login.md) · [recuperar](app/Views/paginas/recuperar.md) · [registro](app/Views/paginas/registro.md)

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
| `docs/` | Documentación anterior del proyecto. |
| `README.md` (raíz) | Descripción general del proyecto: arquitectura, instalación, cómo abrir el sitio, variables del `.env` y lista de rutas. Es el resumen; esta carpeta es el detalle. |

---

## 4. Observaciones encontradas al documentar
Comportamientos que ya existían y que **no se cambiaron** (se dejaron anotados para revisarlos):

| Dónde | Qué pasa | Detalle |
|---|---|---|
| Ubicación GPS del domiciliario | `DeliveryDashboard.tsx` la envía con `PUT /api/staff/{id}`, que es solo para admin → 403. La ruta correcta (`PATCH /api/staff/{id}/location`) no la usa nadie. | [StaffController](app/Controllers/StaffController.md) |
| Pedido manual del admin | Usa `POST /api/orders`, que es solo para clientes → 403, pero la pantalla igual dice "creado". | [AdminDashboard](src/pages/AdminDashboard.md) |
| Cambiar dirección de un pedido | Solo cambia en el navegador; no se guarda en el servidor. | [AdminDashboard](src/pages/AdminDashboard.md) |
| Borrar personal sin `role` | Puede desactivar a la persona de cocina que tenga el mismo id. React siempre envía el rol. | [Personal](app/Models/Personal.md) |
| Tarjetas de la cocina | Resaltan SIN/EXTRA leyendo `modifications`, pero el servidor envía `extras` y `removed`. | [KitchenDashboard](src/pages/KitchenDashboard.md) |

---

## 5. Sintaxis de PHP que se repite en todo el proyecto

| Código | Qué significa |
|---|---|
| `require_once __DIR__ . '/../Models/Cliente.php';` | Carga otro archivo PHP **una sola vez**. `__DIR__` es la carpeta del archivo actual. |
| `$action = $_GET['action'] ?? $_POST['action'] ?? '';` | `??` = "si no existe, usa el siguiente valor". |
| `$action === 'update'` | `===` compara valor **y** tipo (más estricto que `==`). |
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
