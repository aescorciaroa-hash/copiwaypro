# controllers/PaginaController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

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

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta

1. El navegador abre una página (ej. `/admin`).
2. `public/index.php` ve que no empieza con `/api` y llama `despacharPagina()`.
3. `despacharPagina()` busca la página en `config/paginas.php` y revisa el rol (si no, manda a `/login`).
4. `cargarControlador()` pone `$_GET['accion']` y hace `require` de este archivo.
5. El controlador arma los datos y llama `mostrarVista()` → `views/paginas/*.php` (HTML).

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué modelo se conecta `PaginaController`?**  
Con `Configuracion`, `Auth`. Los trae con `require_once __DIR__ . '/../models/...'` y los crea con `new` (los `static`, como `Auth`, se usan con `::`).

**¿El controlador se conecta directo a la base de datos?**  
No. El controlador nunca escribe SQL: se lo pide al modelo, y el modelo usa `$conn`.

**¿Quién llama a este controlador?**  
`cargarControlador()` de `config/helpers.php`, después de `despacharPagina()`.

**¿Cómo sabe qué método ejecutar?**  
Por `$_GET['accion']`, que lo pone `cargarControlador()`. El `if` del final del archivo llama el método que corresponde.

**¿Cómo recibe los datos?**  
Con `entrada()` (junta `$_GET` y el JSON que mandó React) y el `{id}` de la dirección en `$_GET['id']`.

**¿Por qué este controlador no está en `rutas.php`?**  
Porque no es de la API: lo abre `despacharPagina()` con `config/paginas.php`, y devuelve HTML, no JSON.

**¿Cómo le pasa datos a React?**  
Mete el usuario, el rol, el `csrfToken` y la configuración en la vista (`window.__DATOS__`), así React no tiene que pedirlos otra vez.

**¿Qué pasa si se borra este archivo?**  
Las rutas que lo usan dan error 500 (*"Failed opening required"*) y esa parte de la pantalla deja de funcionar.

**¿Qué pasa si se borra una ruta suya de `config/rutas.php`?**  
React recibe **404 Ruta no encontrada** al usar esa acción.

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

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
| 37 | `public function pagar()` | Función `pagar()`: muestra la página del link de pago (`/pagar?c=...`), donde el cliente de un pedido manual paga sin iniciar sesión. |
| 38 | `{` | Abre la función `pagar()`. |
| 39 | `$this->mostrar('pagar');` | Muestra la vista `'pagar'` (`views/paginas/pagar.php`). |
| 40 | `}` | Cierra la función `pagar()`. |
| 42 | `public function admin()` | Función `admin()`: muestra el panel del administrador (`/admin`). |
| 43 | `{` | Abre la función `admin()`. |
| 44 | `$this->mostrar('admin');` | Muestra la vista `'admin'`. |
| 45 | `}` | Cierra la función `admin()`. |
| 47 | `public function client()` | Función `client()`: muestra el panel del cliente (`/client`). |
| 48 | `{` | Abre la función `client()`. |
| 49 | `$this->mostrar('cliente');` | Muestra la vista `'cliente'`. |
| 50 | `}` | Cierra la función `client()`. |
| 52 | `public function kitchen()` | Función `kitchen()`: muestra el panel de cocina (`/kitchen`). |
| 53 | `{` | Abre la función `kitchen()`. |
| 54 | `$this->mostrar('cocina');` | Muestra la vista `'cocina'`. |
| 55 | `}` | Cierra la función `kitchen()`. |
| 57 | `public function delivery()` | Función `delivery()`: muestra el panel del domiciliario (`/delivery`). |
| 58 | `{` | Abre la función `delivery()`. |
| 59 | `$this->mostrar('domiciliario');` | Muestra la vista `'domiciliario'`. |
| 60 | `}` | Cierra la función `delivery()`. |
| 62 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Muestra la vista de views/paginas con los datos iniciales de la app."* |
| 63 | `private function mostrar($vista)` | Función `mostrar($vista)` (privada): arma los datos que necesita React y muestra la vista. La usan todas las funciones de arriba. |
| 64 | `{` | Abre la función `mostrar()`. |
| 65 | `$datos = [` | Crea la lista `$datos`: |
| 66 | `'usuario'   => Auth::check() ? Auth::usuarioActual() : null,` | `'usuario'`: si hay sesión (`Auth::check()`), los datos del usuario (`Auth::usuarioActual()`); si no, `null`. `? :` = si / si no. |
| 67 | `'rol'       => Auth::check() ? Auth::rol() : null,` | `'rol'`: si hay sesión, el rol; si no, `null`. |
| 68 | `'csrfToken' => Session::csrf(),` | `'csrfToken'`: el token de seguridad (`Session::csrf()`). |
| 69 | `'settings'  => $this->configModel->obtener(),` | `'settings'`: los ajustes de la tienda (`obtener()` de `models/Configuracion.php`). |
| 70 | `];` | Cierra la lista. |
| 71 | `mostrarVista($vista, $datos);` | Muestra la vista (`mostrarVista()` de `helpers.php`) y le pasa `$datos`. `cabecera.php` los convierte en `window.__DATOS__` para React. |
| 72 | `}` | Cierra la función `mostrar()`. |
| 73 | `}` | Cierra la clase `PaginaController`. |
| 75 | `$controller = new PaginaController();` | Crea el controlador. Al hacer `new PaginaController()` se ejecuta su `__construct()`. |
| 77 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 79 | `if ($accion === 'landing') {` | Si la acción es `'landing'`... |
| 80 | `$controller->landing();` | ...llama al método `landing()` de arriba. |
| 81 | `} elseif ($accion === 'login') {` | Si no, si la acción es `'login'`... |
| 82 | `$controller->login();` | ...llama al método `login()` de arriba. |
| 83 | `} elseif ($accion === 'register') {` | Si no, si la acción es `'register'`... |
| 84 | `$controller->register();` | ...llama al método `register()` de arriba. |
| 85 | `} elseif ($accion === 'forgotPassword') {` | Si no, si la acción es `'forgotPassword'`... |
| 86 | `$controller->forgotPassword();` | ...llama al método `forgotPassword()` de arriba. |
| 87 | `} elseif ($accion === 'pagar') {` | Si no, si la acción es `'pagar'`... |
| 88 | `$controller->pagar();` | ...llama al método `pagar()` de arriba. |
| 89 | `} elseif ($accion === 'admin') {` | Si no, si la acción es `'admin'`... |
| 90 | `$controller->admin();` | ...llama al método `admin()` de arriba. |
| 91 | `} elseif ($accion === 'client') {` | Si no, si la acción es `'client'`... |
| 92 | `$controller->client();` | ...llama al método `client()` de arriba. |
| 93 | `} elseif ($accion === 'kitchen') {` | Si no, si la acción es `'kitchen'`... |
| 94 | `$controller->kitchen();` | ...llama al método `kitchen()` de arriba. |
| 95 | `} elseif ($accion === 'delivery') {` | Si no, si la acción es `'delivery'`... |
| 96 | `$controller->delivery();` | ...llama al método `delivery()` de arriba. |
| 97 | `} else {` | Si la acción no es ninguna de las anteriores... |
| 98 | `http_response_code(404);` | ...pone el código 404 (no existe)... |
| 99 | `echo 'Pagina no encontrada.';` | ...y escribe "Pagina no encontrada.". |
| 100 | `}` | Cierra el `else`. |
| 101 | `?>` | Cierra el código PHP. |

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
