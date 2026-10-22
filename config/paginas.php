<?php
/**
 * Paginas: 'ruta' => [Controlador, accion, roles].
 * roles = [] significa publica (sin sesion).
 */

return [
    '/' => ['PaginaController', 'landing', []],
    '/login' => ['PaginaController', 'login', []],
    '/register' => ['PaginaController', 'register', []],
    '/forgot-password' => ['PaginaController', 'forgotPassword', []],
    // Link de pago del pedido manual: /pagar?c=codigo (publica).
    '/pagar' => ['PaginaController', 'pagar', []],
    '/admin' => ['PaginaController', 'admin', ['admin']],
    '/client' => ['PaginaController', 'client', ['client']],
    '/kitchen' => ['PaginaController', 'kitchen', ['kitchen']],
    '/delivery' => ['PaginaController', 'delivery', ['delivery']],
];
?>