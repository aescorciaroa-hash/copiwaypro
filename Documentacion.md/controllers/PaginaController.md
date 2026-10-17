# controllers/PaginaController.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Muestra las páginas del sistema.

## ¿Qué hace?
- abrir la página de inicio
- abrir la página de login
- abrir la página para crear cuenta
- abrir la página para recuperar la contraseña
- abrir el panel del administrador
- abrir el panel del cliente
- abrir el panel de cocina
- abrir el panel del domiciliario

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `landing()` | abrir la página de inicio | `/` |
| `login()` | abrir la página de login | `/login` |
| `register()` | abrir la página para crear cuenta | `/register` |
| `forgotPassword()` | abrir la página para recuperar la contraseña | `/forgot-password` |
| `admin()` | abrir el panel del administrador | `/admin` |
| `client()` | abrir el panel del cliente | `/client` |
| `kitchen()` | abrir el panel de cocina | `/kitchen` |
| `delivery()` | abrir el panel del domiciliario | `/delivery` |
| `mostrar()` (privado) | ayuda a `landing()`, `login()`, `register()`, `forgotPassword()`, `admin()`, `client()`, `kitchen()`, `delivery()` | — |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Usa los modelos:** `Configuracion`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Paginas: prepara los datos iniciales y monta la app de React. El control de sesion/rol ya lo hizo despacharPagina()."* |
| 6 | `require_once __DIR__ . '/../models/Configuracion.php';` | Trae el archivo `Configuracion.php` para poder usar la clase `Configuracion`. |
| 8 | `class PaginaController` | Crea la clase `PaginaController`: un grupo de funciones que trabajan juntas. |
| 9 | `{` | Abre la clase `PaginaController`. |
| 10 | `private $configModel;` | Cajita `$configModel` de la clase: aquí se guarda el modelo `Configuracion`. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `$this->configModel = new Configuracion();` | Crea el modelo `Configuracion` y lo guarda en `$this->configModel`, para usarlo en las funciones de abajo. |
| 15 | `}` | Cierra la función `__construct()`. |
| 17 | `public function landing()` | Función `landing()`: muestra la página de inicio (`/`). |
| 18 | `{` | Abre la función `landing()`. |
| 19 | `$this->mostrar('landing');` | Llama a `mostrar()` (abajo) con la vista `'landing'` (`views/paginas/landing.php`). |
| 20 | `}` | Cierra la función `landing()`. |
| 22 | `public function login()` | Función `login()`: muestra la página de login (`/login`). |
| 23 | `{` | Abre la función `login()`. |
| 24 | `$this->mostrar('login');` | Muestra la vista `'login'`. |
| 25 | `}` | Cierra la función `login()`. |
| 27 | `public function register()` | Función `register()`: muestra la página para crear cuenta (`/register`). |
| 28 | `{` | Abre la función `register()`. |
| 29 | `$this->mostrar('registro');` | Muestra la vista `'registro'`. |
| 30 | `}` | Cierra la función `register()`. |
| 32 | `public function forgotPassword()` | Función `forgotPassword()`: muestra la página para recuperar la contraseña (`/forgot-password`). |
| 33 | `{` | Abre la función `forgotPassword()`. |
| 34 | `$this->mostrar('recuperar');` | Muestra la vista `'recuperar'`. |
| 35 | `}` | Cierra la función `forgotPassword()`. |
| 37 | `public function admin()` | Función `admin()`: muestra el panel del administrador (`/admin`). |
| 38 | `{` | Abre la función `admin()`. |
| 39 | `$this->mostrar('admin');` | Muestra la vista `'admin'`. |
| 40 | `}` | Cierra la función `admin()`. |
| 42 | `public function client()` | Función `client()`: muestra el panel del cliente (`/client`). |
| 43 | `{` | Abre la función `client()`. |
| 44 | `$this->mostrar('cliente');` | Muestra la vista `'cliente'`. |
| 45 | `}` | Cierra la función `client()`. |
| 47 | `public function kitchen()` | Función `kitchen()`: muestra el panel de cocina (`/kitchen`). |
| 48 | `{` | Abre la función `kitchen()`. |
| 49 | `$this->mostrar('cocina');` | Muestra la vista `'cocina'`. |
| 50 | `}` | Cierra la función `kitchen()`. |
| 52 | `public function delivery()` | Función `delivery()`: muestra el panel del domiciliario (`/delivery`). |
| 53 | `{` | Abre la función `delivery()`. |
| 54 | `$this->mostrar('domiciliario');` | Muestra la vista `'domiciliario'`. |
| 55 | `}` | Cierra la función `delivery()`. |
| 57 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Muestra la vista de views/paginas con los datos iniciales de la app."* |
| 58 | `private function mostrar($vista)` | Función `mostrar($vista)` (privada): arma los datos que necesita React y muestra la vista. La usan todas las funciones de arriba. |
| 59 | `{` | Abre la función `mostrar()`. |
| 60 | `$datos = [` | Crea la lista `$datos`: |
| 61 | `'usuario'   => Auth::check() ? Auth::usuarioActual() : null,` | `'usuario'`: si hay sesión (`Auth::check()`), los datos del usuario (`Auth::usuarioActual()`); si no, `null`. `? :` = si / si no. |
| 62 | `'rol'       => Auth::check() ? Auth::rol() : null,` | `'rol'`: si hay sesión, el rol; si no, `null`. |
| 63 | `'csrfToken' => Session::csrf(),` | `'csrfToken'`: el token de seguridad (`Session::csrf()`). |
| 64 | `'settings'  => $this->configModel->obtener(),` | `'settings'`: los ajustes de la tienda (`obtener()` de `models/Configuracion.php`). |
| 65 | `];` | Cierra la lista. |
| 66 | `mostrarVista($vista, $datos);` | Muestra la vista (`mostrarVista()` de `helpers.php`) y le pasa `$datos`. `cabecera.php` los convierte en `window.__DATOS__` para React. |
| 67 | `}` | Cierra la función `mostrar()`. |
| 68 | `}` | Cierra la clase `PaginaController`. |
| 70 | `$controller = new PaginaController();` | Crea el controlador. Al hacer `new PaginaController()` se ejecuta su `__construct()`. |
| 72 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 74 | `if ($accion === 'landing') {` | Si la acción es `'landing'`... |
| 75 | `$controller->landing();` | ...llama al método `landing()` de arriba. |
| 76 | `} elseif ($accion === 'login') {` | Si no, si la acción es `'login'`... |
| 77 | `$controller->login();` | ...llama al método `login()` de arriba. |
| 78 | `} elseif ($accion === 'register') {` | Si no, si la acción es `'register'`... |
| 79 | `$controller->register();` | ...llama al método `register()` de arriba. |
| 80 | `} elseif ($accion === 'forgotPassword') {` | Si no, si la acción es `'forgotPassword'`... |
| 81 | `$controller->forgotPassword();` | ...llama al método `forgotPassword()` de arriba. |
| 82 | `} elseif ($accion === 'admin') {` | Si no, si la acción es `'admin'`... |
| 83 | `$controller->admin();` | ...llama al método `admin()` de arriba. |
| 84 | `} elseif ($accion === 'client') {` | Si no, si la acción es `'client'`... |
| 85 | `$controller->client();` | ...llama al método `client()` de arriba. |
| 86 | `} elseif ($accion === 'kitchen') {` | Si no, si la acción es `'kitchen'`... |
| 87 | `$controller->kitchen();` | ...llama al método `kitchen()` de arriba. |
| 88 | `} elseif ($accion === 'delivery') {` | Si no, si la acción es `'delivery'`... |
| 89 | `$controller->delivery();` | ...llama al método `delivery()` de arriba. |
| 90 | `} else {` | Si la acción no es ninguna de las anteriores... |
| 91 | `http_response_code(404);` | ...pone el código 404 (no existe)... |
| 92 | `echo 'Pagina no encontrada.';` | ...y escribe "Pagina no encontrada.". |
| 93 | `}` | Cierra el `else`. |
| 94 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Failed to open stream` |
| el `require_once` de `Configuracion.php` | todas sus acciones | `Class "Configuracion" not found` |
| el método `landing()` | abrir la página de inicio | `Call to undefined method PaginaController::landing()` |
| el método `login()` | abrir la página de login | `Call to undefined method PaginaController::login()` |
| el método `register()` | abrir la página para crear cuenta | `Call to undefined method PaginaController::register()` |
| el método `forgotPassword()` | abrir la página para recuperar la contraseña | `Call to undefined method PaginaController::forgotPassword()` |
| el método `admin()` | abrir el panel del administrador | `Call to undefined method PaginaController::admin()` |
| el método `client()` | abrir el panel del cliente | `Call to undefined method PaginaController::client()` |
| el método `kitchen()` | abrir el panel de cocina | `Call to undefined method PaginaController::kitchen()` |
| el método `delivery()` | abrir el panel del domiciliario | `Call to undefined method PaginaController::delivery()` |
| el método `mostrar()` | abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Call to undefined method PaginaController::mostrar()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Pagina no encontrada.` |
| su línea en `config/paginas.php` | esa acción | `Pagina no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
