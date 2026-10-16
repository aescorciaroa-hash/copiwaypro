# 4. Cómo funciona por dentro

## Las 3 capas
```
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────┐
│  NAVEGADOR (React)   │ ───► │   SERVIDOR (PHP)     │ ───► │    MySQL     │
│  src/                │ ◄─── │   app/ config/       │ ◄─── │  23 tablas   │
│  lo que ve el usuario│ JSON │   reglas del negocio │      │  los datos   │
└──────────────────────┘      └──────────────────────┘      └──────────────┘
```
- **React** no guarda nada importante: solo dibuja y pregunta.
- **PHP** decide todo: quién puede hacer qué, cuánto cuesta, si hay stock, si el PIN es correcto.
- **MySQL** guarda todo.

Por eso los precios **siempre** se recalculan en PHP: aunque alguien cambie un precio en su navegador,
el servidor cobra el precio real.

## 1. Cuando abres una página
Ejemplo: el administrador abre `/copiwaypro/admin`.
```
1. Apache recibe /copiwaypro/admin
2. .htaccess            → todo lo que no es un archivo va a public/index.php
3. public/index.php     → carga la conexión, la sesión y las funciones; ve que NO empieza con /api
4. despacharPagina()    → busca '/admin' en config/paginas.php → solo rol 'admin'
                          ¿hay sesión de admin? si no, redirige a /login
5. PaginaController.php → arma $datos (usuario, rol, token CSRF, ajustes de la tienda)
6. app/Views/paginas/admin.php → $pagina = 'admin' + cabecera.php + pie.php
7. El navegador recibe un HTML casi vacío con:
     <div id="app" data-pagina="admin">
     window.__DATOS__ = { usuario, rol, csrfToken, settings }
     <script src="assets/main.js">
8. src/main.tsx         → lee data-pagina="admin" y dibuja AdminDashboard
```
No hay "rutas de React": cambiar de pantalla recarga la página y PHP vuelve a decidir.

## 2. Cuando React pide o guarda datos
Ejemplo: el administrador cambia el precio de un producto.
```
1. MenuSection.tsx          → llama a updateProduct(6, { price: 16000 })
2. store/almacenAplicacion  → api.put('/products/6', { price: 16000 })
3. servicios/api.ts         → fetch PUT /copiwaypro/api/products/6
                               con la cookie de sesión y la cabecera X-CSRF-Token
4. public/index.php         → la ruta empieza con /api → despacharRuta()
5. despacharRuta()          → busca 'PUT /api/products/{id}' en config/rutas.php
                               revisa el token CSRF y que el rol sea 'admin'
                               pone $_GET['action'] = 'update' y $_GET['id'] = '6'
                               carga app/Controllers/ProductController.php
6. ProductController.php    → if ($action === 'update') → valida el precio
7. app/Models/Producto.php  → UPDATE PRODUCTO SET precio = ? WHERE id_producto = ?
8. app/Views/json/producto.php → convierte la fila (precio, nombre...) al JSON de React (price, name...)
9. responderJson(...)       → React recibe el producto actualizado y redibuja la lista
```

## 3. Cómo se mantiene todo actualizado
Cuando la cocina marca un pedido como listo, ¿cómo se entera el cliente?
```
SyncDatos.tsx (en todas las pantallas)
   └── cada 2,5 s pregunta GET /api/sync  (con la "huella" de la última respuesta)
         ├── nada cambió → PHP responde 304 (vacío, muy rápido)
         └── algo cambió → PHP responde todos los datos → se guardan en el almacén → la pantalla se actualiza
```
- Si no hay cambios por un rato, pregunta cada 6 s; si la pestaña está oculta, cada 20 s.
- Cada rol recibe solo lo suyo: el cliente sus pedidos, el domiciliario los suyos y los disponibles, el admin todo.

Detalle en [SyncController](../app/Controllers/SyncController.md) y [SyncDatos](../src/components/SyncDatos.md).

## 4. Quién hace qué en PHP
| Pieza | Carpeta | Trabajo | Ejemplo |
|---|---|---|---|
| Punto de entrada | `public/index.php` | Prepara todo y reparte. | — |
| Router | `app/Core/helpers.php` | Decide qué controlador atiende. | `despacharRuta()` |
| Rutas | `config/rutas.php` | Lista de direcciones y roles. | `'PUT /api/products/{id}'` |
| Controlador | `app/Controllers/` | Recibe, valida y responde. | `ProductController.php` |
| Modelo | `app/Models/` | Habla con MySQL. | `Producto.php` |
| Service | `app/Services/` | Reglas grandes del negocio. | `PedidoService.php` (crear pedidos) |
| Vista JSON | `app/Views/json/` | Traduce MySQL → React. | `producto_a_json()` |
| Sesión y usuario | `app/Core/Session.php`, `Auth.php` | Quién está conectado. | `Auth::id()` |

## 5. Quién hace qué en React
| Pieza | Carpeta | Trabajo |
|---|---|---|
| Entrada | `src/main.tsx` | Elige la pantalla. |
| Pantallas | `src/pages/` | Admin, cliente, cocina, domiciliario, login... |
| Almacén | `src/store/almacenAplicacion.ts` | Datos compartidos + funciones que llaman a PHP. |
| Conexión | `src/servicios/api.ts` | La única puerta hacia PHP. |
| Sincronización | `src/components/SyncDatos.tsx` | Trae datos nuevos cada pocos segundos. |
| Componentes | `src/components/` | Ventanas, avisos, selectores... |

## 6. Servicios externos que usa
| Servicio | Para qué | Dónde |
|---|---|---|
| OpenStreetMap | Los mapas | Landing, admin, domiciliario |
| Nominatim | Convertir una dirección en coordenadas | Panel del domiciliario |
| OSRM | Calcular el camino en carro | Mapas del admin y del domiciliario |
| WhatsApp (`wa.me`) | Escribir al cliente o al domiciliario | Domiciliario y cliente |
| Google Fonts | La fuente Inter | `src/index.css` |
| Unsplash | Fotos de ejemplo de productos | Si un producto no tiene foto |

Sin internet, el sistema funciona, pero no se ven los mapas ni las fotos de ejemplo.
