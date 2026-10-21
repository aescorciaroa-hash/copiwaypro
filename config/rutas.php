<?php
/**
 * Rutas de la API: 'METODO /ruta' => [Controlador, accion, roles].
 * roles = [] significa publica (sin sesion).
 * La accion y los {parametros} llegan al controlador en $_GET (ej. $_GET['id']).
 */

$TODOS_LOS_ROLES = ['admin', 'kitchen', 'delivery', 'client'];

return [

    // ---- Autenticacion ----
    'POST /api/auth/login' => ['AuthController', 'login', []],
    'POST /api/auth/logout' => ['AuthController', 'logout', []],
    'GET /api/auth/csrf' => ['AuthController', 'csrf', []],
    'POST /api/auth/register' => ['AuthController', 'register', []],
    'POST /api/auth/forgot-password/request' => ['AuthController', 'forgotPasswordRequest', []],
    'POST /api/auth/forgot-password/reset' => ['AuthController', 'forgotPasswordReset', []],

    // ---- Configuracion de la tienda ----
    'PUT /api/settings' => ['SettingController', 'update', ['admin']],
    'POST /api/settings/categories' => ['SettingController', 'addCategory', ['admin']],
    'DELETE /api/settings/categories/{category}' => ['SettingController', 'removeCategory', ['admin']],

    // ---- Productos ----
    'POST /api/products' => ['ProductController', 'store', ['admin']],
    'PUT /api/products/{id}' => ['ProductController', 'update', ['admin']],
    'DELETE /api/products/{id}' => ['ProductController', 'destroy', ['admin']],

    // ---- Subida de imagenes ----
    // Guarda el archivo en public/uploads/productos/ y devuelve su URL; evita
    // guardar la foto como base64 en PRODUCTO.imagen (VARCHAR(255) truncaba
    // cualquier imagen real con "Data too long for column 'imagen'").
    'POST /api/uploads/product-image' => ['UploadController', 'productImage', ['admin']],

    // ---- Inventario ----
    'POST /api/inventory' => ['InventoryController', 'store', ['admin']],
    'PUT /api/inventory/{id}' => ['InventoryController', 'update', ['admin']],
    'DELETE /api/inventory/{id}' => ['InventoryController', 'destroy', ['admin']],
    'PATCH /api/inventory/{id}/stock' => ['InventoryController', 'adjustStock', ['admin']],

    // ---- Clientes ----
    'PUT /api/clients/{id}' => ['ClientController', 'update', $TODOS_LOS_ROLES],
    'PUT /api/clients/{id}/password' => ['ClientController', 'changePassword', ['client']],

    // ---- Personal ----
    'POST /api/staff' => ['StaffController', 'store', ['admin']],
    'PUT /api/staff/{id}' => ['StaffController', 'update', ['admin']],
    'DELETE /api/staff/{id}' => ['StaffController', 'destroy', ['admin']],
    'PATCH /api/staff/{id}/location' => ['StaffController', 'updateLocation', ['delivery']],

    // ---- Pedidos ----
    'GET /api/orders' => ['OrderController', 'index', $TODOS_LOS_ROLES],
    'POST /api/orders' => ['OrderController', 'store', ['client']],
    // Pedido por llamada/WhatsApp que registra el admin (va antes de las rutas con {id}).
    'POST /api/orders/manual' => ['OrderController', 'storeManual', ['admin']],
    'PATCH /api/orders/{id}/address' => ['OrderController', 'updateAddress', ['admin']],
    'PATCH /api/orders/{id}/destination' => ['OrderController', 'updateDestination', ['delivery']],
    'PATCH /api/orders/{id}/preparing' => ['OrderController', 'markPreparing', ['admin', 'kitchen']],
    'PATCH /api/orders/{id}/ready' => ['OrderController', 'markReady', ['admin', 'kitchen']],
    'PATCH /api/orders/{id}/take' => ['OrderController', 'take', ['delivery']],
    'PATCH /api/orders/{id}/release' => ['OrderController', 'release', ['delivery']],
    'PATCH /api/orders/{id}/accept' => ['OrderController', 'accept', ['delivery']],
    'PATCH /api/orders/{id}/deliver' => ['OrderController', 'deliver', ['delivery']],
    'PATCH /api/orders/{id}/review' => ['OrderController', 'review', ['client']],

    // ---- Pagos (pasarela de prueba, mecanica tipo Wompi) ----
    'POST /api/payments/prepare' => ['PaymentController', 'prepare', ['client']],
    'POST /api/payments/transactions' => ['PaymentController', 'createTransaction', ['client']],
    'GET /api/payments/transactions/{id}' => ['PaymentController', 'showTransaction', ['client']],

    // ---- Cierre de caja / Dashboard ----
    // El orden importa: /preview debe ir antes de /{id} para que no la capture el patron generico.
    'GET /api/cash-closing/preview' => ['CashClosingController', 'preview', ['admin']],
    'POST /api/cash-closing' => ['CashClosingController', 'store', ['admin']],

    // ---- Sync (reemplaza onSnapshot de Firestore) ----
    'GET /api/sync' => ['SyncController', 'index', []],

    // ---- Push (Web Push / VAPID) ----
    'GET /api/push/public-key' => ['PushController', 'publicKey', []],
    'POST /api/push/subscribe' => ['PushController', 'subscribe', ['client']],

];
?>