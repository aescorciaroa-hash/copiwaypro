# config/rutas.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Es la lista de rutas de la API.

## ¿Qué hace?
- dice qué controlador atiende cada ruta
- dice qué método del controlador se llama
- dice qué roles pueden usar cada ruta

## ¿Con qué se conecta?
- **Lo lee:** `despacharRuta()` en `config/helpers.php`.
- **Ejemplo de una línea:** `'PUT /api/products/{id}' => ['ProductController', 'update', ['admin']]`
-   = método y dirección → controlador, método y roles que pueden usarla.
- **Roles:** `admin` (administrador), `client` (cliente), `kitchen` (cocina), `delivery` (domiciliario). `[]` = cualquiera.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-6 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Rutas de la API: 'METODO /ruta' => [Controlador, accion, roles]. roles = [] significa publica (sin sesion). La accion y los {parametros} llegan al controlador en $_GET (ej. $_GET['id'])."* |
| 8 | `$TODOS_LOS_ROLES = ['admin', 'kitchen', 'delivery', 'client'];` | Crea la variable `$TODOS_LOS_ROLES` con los 4 roles. Se usa abajo en las rutas que puede usar cualquiera que haya iniciado sesión. |
| 10 | `return [` | `return [` = devuelve la lista de rutas. La lee `despacharRuta()` en `config/helpers.php`. |
| 12 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Autenticacion ----"* |
| 13 | `'POST /api/auth/login' => ['AuthController', 'login', []],` | `POST` (enviar datos) a `/api/auth/login` → `AuthController`, método `login()`: iniciar sesión. Puede usarla: cualquiera, sin iniciar sesión. |
| 14 | `'POST /api/auth/logout' => ['AuthController', 'logout', []],` | `POST` (enviar datos) a `/api/auth/logout` → `AuthController`, método `logout()`: cerrar sesión. Puede usarla: cualquiera, sin iniciar sesión. |
| 15 | `'GET /api/auth/csrf' => ['AuthController', 'csrf', []],` | `GET` (traer datos) a `/api/auth/csrf` → `AuthController`, método `csrf()`: entregar el token de seguridad (sin él no se puede guardar nada). Puede usarla: cualquiera, sin iniciar sesión. |
| 16 | `'POST /api/auth/register' => ['AuthController', 'register', []],` | `POST` (enviar datos) a `/api/auth/register` → `AuthController`, método `register()`: registrarse. Puede usarla: cualquiera, sin iniciar sesión. |
| 17 | `'POST /api/auth/forgot-password/request' => ['AuthController', 'forgotPasswordRequest', []],` | `POST` (enviar datos) a `/api/auth/forgot-password/request` → `AuthController`, método `forgotPasswordRequest()`: pedir el código para recuperar la contraseña. Puede usarla: cualquiera, sin iniciar sesión. |
| 18 | `'POST /api/auth/forgot-password/reset' => ['AuthController', 'forgotPasswordReset', []],` | `POST` (enviar datos) a `/api/auth/forgot-password/reset` → `AuthController`, método `forgotPasswordReset()`: cambiar la contraseña con el código. Puede usarla: cualquiera, sin iniciar sesión. |
| 20 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Configuracion de la tienda ----"* |
| 21 | `'PUT /api/settings' => ['SettingController', 'update', ['admin']],` | `PUT` (editar) a `/api/settings` → `SettingController`, método `update()`: guardar los ajustes de la tienda. Puede usarla: solo el administrador. |
| 22 | `'POST /api/settings/categories' => ['SettingController', 'addCategory', ['admin']],` | `POST` (enviar datos) a `/api/settings/categories` → `SettingController`, método `addCategory()`: agregar categorías del menú. Puede usarla: solo el administrador. |
| 23 | `'DELETE /api/settings/categories/{category}' => ['SettingController', 'removeCategory', ['admin']],` | `DELETE` (borrar) a `/api/settings/categories/{category}` → `SettingController`, método `removeCategory()`: eliminar categorías del menú. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 25 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Productos ----"* |
| 26 | `'POST /api/products' => ['ProductController', 'store', ['admin']],` | `POST` (enviar datos) a `/api/products` → `ProductController`, método `store()`: crear productos. Puede usarla: solo el administrador. |
| 27 | `'PUT /api/products/{id}' => ['ProductController', 'update', ['admin']],` | `PUT` (editar) a `/api/products/{id}` → `ProductController`, método `update()`: editar productos. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 28 | `'DELETE /api/products/{id}' => ['ProductController', 'destroy', ['admin']],` | `DELETE` (borrar) a `/api/products/{id}` → `ProductController`, método `destroy()`: eliminar productos. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 30 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Subida de imagenes ----"* |
| 31 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Guarda el archivo en public/uploads/productos/ y devuelve su URL; evita"* |
| 32 | *(comentario)* | Comentario: no se ejecuta. Dice: *"guardar la foto como base64 en PRODUCTO.imagen (VARCHAR(255) truncaba"* |
| 33 | *(comentario)* | Comentario: no se ejecuta. Dice: *"cualquier imagen real con "Data too long for column 'imagen'")."* |
| 34 | `'POST /api/uploads/product-image' => ['UploadController', 'productImage', ['admin']],` | `POST` (enviar datos) a `/api/uploads/product-image` → `UploadController`, método `productImage()`: subir fotos. Puede usarla: solo el administrador. |
| 36 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Inventario ----"* |
| 37 | `'POST /api/inventory' => ['InventoryController', 'store', ['admin']],` | `POST` (enviar datos) a `/api/inventory` → `InventoryController`, método `store()`: crear insumos. Puede usarla: solo el administrador. |
| 38 | `'PUT /api/inventory/{id}' => ['InventoryController', 'update', ['admin']],` | `PUT` (editar) a `/api/inventory/{id}` → `InventoryController`, método `update()`: editar insumos. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 39 | `'DELETE /api/inventory/{id}' => ['InventoryController', 'destroy', ['admin']],` | `DELETE` (borrar) a `/api/inventory/{id}` → `InventoryController`, método `destroy()`: eliminar insumos. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 40 | `'PATCH /api/inventory/{id}/stock' => ['InventoryController', 'adjustStock', ['admin']],` | `PATCH` (cambiar una parte) a `/api/inventory/{id}/stock` → `InventoryController`, método `adjustStock()`: sumar o restar stock. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 42 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Clientes ----"* |
| 43 | `'PUT /api/clients/{id}' => ['ClientController', 'update', $TODOS_LOS_ROLES],` | `PUT` (editar) a `/api/clients/{id}` → `ClientController`, método `update()`: editar el perfil del cliente. Puede usarla: cualquiera que haya iniciado sesión. `{...}` = un dato que cambia (ej. el número del producto). |
| 44 | `'PUT /api/clients/{id}/password' => ['ClientController', 'changePassword', ['client']],` | `PUT` (editar) a `/api/clients/{id}/password` → `ClientController`, método `changePassword()`: cambiar la contraseña del cliente. Puede usarla: solo el cliente. `{...}` = un dato que cambia (ej. el número del producto). |
| 46 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Personal ----"* |
| 47 | `'POST /api/staff' => ['StaffController', 'store', ['admin']],` | `POST` (enviar datos) a `/api/staff` → `StaffController`, método `store()`: crear personal. Puede usarla: solo el administrador. |
| 48 | `'PUT /api/staff/{id}' => ['StaffController', 'update', ['admin']],` | `PUT` (editar) a `/api/staff/{id}` → `StaffController`, método `update()`: editar personal o darlo de baja. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 49 | `'DELETE /api/staff/{id}' => ['StaffController', 'destroy', ['admin']],` | `DELETE` (borrar) a `/api/staff/{id}` → `StaffController`, método `destroy()`: eliminar personal. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 50 | `'PATCH /api/staff/{id}/location' => ['StaffController', 'updateLocation', ['delivery']],` | `PATCH` (cambiar una parte) a `/api/staff/{id}/location` → `StaffController`, método `updateLocation()`: guardar la ubicación del domiciliario. Puede usarla: solo el domiciliario. `{...}` = un dato que cambia (ej. el número del producto). |
| 52 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Pedidos ----"* |
| 53 | `'GET /api/orders' => ['OrderController', 'index', $TODOS_LOS_ROLES],` | `GET` (traer datos) a `/api/orders` → `OrderController`, método `index()`: recargar los pedidos después del cierre de caja. Puede usarla: cualquiera que haya iniciado sesión. |
| 54 | `'POST /api/orders' => ['OrderController', 'store', ['client']],` | `POST` (enviar datos) a `/api/orders` → `OrderController`, método `store()`: hacer pedidos (cliente). Puede usarla: solo el cliente. |
| 55 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pedido por llamada/WhatsApp que registra el admin (va antes de las rutas con {id})."* |
| 56 | `'POST /api/orders/manual' => ['OrderController', 'storeManual', ['admin']],` | `POST` (enviar datos) a `/api/orders/manual` → `OrderController`, método `storeManual()`: registrar pedidos por llamada o WhatsApp. Puede usarla: solo el administrador. |
| 57 | `'PATCH /api/orders/{id}/address' => ['OrderController', 'updateAddress', ['admin']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/address` → `OrderController`, método `updateAddress()`: cambiar la dirección de un pedido. Puede usarla: solo el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 58 | `'PATCH /api/orders/{id}/destination' => ['OrderController', 'updateDestination', ['delivery']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/destination` → `OrderController`, método `updateDestination()`: guardar el destino en el mapa del domiciliario. Puede usarla: solo el domiciliario. `{...}` = un dato que cambia (ej. el número del producto). |
| 59 | `'PATCH /api/orders/{id}/preparing' => ['OrderController', 'markPreparing', ['admin', 'kitchen']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/preparing` → `OrderController`, método `markPreparing()`: pasar pedidos a "En preparación". Puede usarla: el administrador o cocina. `{...}` = un dato que cambia (ej. el número del producto). |
| 60 | `'PATCH /api/orders/{id}/ready' => ['OrderController', 'markReady', ['admin', 'kitchen']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/ready` → `OrderController`, método `markReady()`: pasar pedidos a "Listo". Puede usarla: el administrador o cocina. `{...}` = un dato que cambia (ej. el número del producto). |
| 61 | `'PATCH /api/orders/{id}/take' => ['OrderController', 'take', ['delivery']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/take` → `OrderController`, método `take()`: tomar pedidos (domiciliario). Puede usarla: solo el domiciliario. `{...}` = un dato que cambia (ej. el número del producto). |
| 62 | `'PATCH /api/orders/{id}/release' => ['OrderController', 'release', ['delivery', 'admin']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/release` → `OrderController`, método `release()`: soltar pedidos (domiciliario o administrador). Puede usarla: el domiciliario o el administrador. `{...}` = un dato que cambia (ej. el número del producto). |
| 63 | `'PATCH /api/orders/{id}/accept' => ['OrderController', 'accept', ['delivery']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/accept` → `OrderController`, método `accept()`: salir a entregar ("En camino"). Puede usarla: solo el domiciliario. `{...}` = un dato que cambia (ej. el número del producto). |
| 64 | `'PATCH /api/orders/{id}/deliver' => ['OrderController', 'deliver', ['delivery']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/deliver` → `OrderController`, método `deliver()`: entregar pedidos con el PIN. Puede usarla: solo el domiciliario. `{...}` = un dato que cambia (ej. el número del producto). |
| 65 | `'PATCH /api/orders/{id}/review' => ['OrderController', 'review', ['client']],` | `PATCH` (cambiar una parte) a `/api/orders/{id}/review` → `OrderController`, método `review()`: calificar pedidos. Puede usarla: solo el cliente. `{...}` = un dato que cambia (ej. el número del producto). |
| 67 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Pagos (pasarela de prueba, mecanica tipo Wompi) ----"* |
| 68 | `'POST /api/payments/prepare' => ['PaymentController', 'prepare', ['client']],` | `POST` (enviar datos) a `/api/payments/prepare` → `PaymentController`, método `prepare()`: empezar un pago en línea. Puede usarla: solo el cliente. |
| 69 | `'POST /api/payments/transactions' => ['PaymentController', 'createTransaction', ['client']],` | `POST` (enviar datos) a `/api/payments/transactions` → `PaymentController`, método `createTransaction()`: crear el pago. Puede usarla: solo el cliente. |
| 70 | `'GET /api/payments/transactions/{id}' => ['PaymentController', 'showTransaction', ['client']],` | `GET` (traer datos) a `/api/payments/transactions/{id}` → `PaymentController`, método `showTransaction()`: saber si el pago fue aprobado. Puede usarla: solo el cliente. `{...}` = un dato que cambia (ej. el número del producto). |
| 72 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Cierre de caja / Dashboard ----"* |
| 73 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El orden importa: /preview debe ir antes de /{id} para que no la capture el patron generico."* |
| 74 | `'GET /api/cash-closing/preview' => ['CashClosingController', 'preview', ['admin']],` | `GET` (traer datos) a `/api/cash-closing/preview` → `CashClosingController`, método `preview()`: ver el cierre de caja antes de confirmarlo. Puede usarla: solo el administrador. |
| 75 | `'POST /api/cash-closing' => ['CashClosingController', 'store', ['admin']],` | `POST` (enviar datos) a `/api/cash-closing` → `CashClosingController`, método `store()`: confirmar el cierre de caja. Puede usarla: solo el administrador. |
| 77 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Sync (reemplaza onSnapshot de Firestore) ----"* |
| 78 | `'GET /api/sync' => ['SyncController', 'index', []],` | `GET` (traer datos) a `/api/sync` → `SyncController`, método `index()`: cargar los datos de todas las pantallas. Puede usarla: cualquiera, sin iniciar sesión. |
| 80 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Push (Web Push / VAPID) ----"* |
| 81 | `'GET /api/push/public-key' => ['PushController', 'publicKey', []],` | `GET` (traer datos) a `/api/push/public-key` → `PushController`, método `publicKey()`: activar las notificaciones. Puede usarla: cualquiera, sin iniciar sesión. |
| 82 | `'POST /api/push/subscribe' => ['PushController', 'subscribe', ['client']],` | `POST` (enviar datos) a `/api/push/subscribe` → `PushController`, método `subscribe()`: activar las notificaciones. Puede usarla: solo el cliente. |
| 84 | `];` | Cierra la lista de rutas. |
| 85 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | ninguna ruta de la API funciona: las pantallas quedan sin datos y nada se guarda |
| una línea | esa acción deja de funcionar: sale `Ruta no encontrada.` o `Metodo no permitido.` |
| un rol (`['admin']` → `[]`) | **no sale error**: la ruta queda abierta para cualquiera |
| `$TODOS_LOS_ROLES` | sale un aviso y esas rutas quedan abiertas para cualquiera |
