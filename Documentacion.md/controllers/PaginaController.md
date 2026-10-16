# controllers/PaginaController.php

## ¿Para qué sirve?
Muestra las **páginas** (no la API). Todas las páginas cargan la misma aplicación de React; lo único
que cambia es cuál pantalla se abre y qué datos iniciales lleva.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `despacharPagina()` (`helpers.php`) según `config/paginas.php` | `/`, `/login`, `/admin`... |
| → usa | `Auth` | Saber si hay alguien conectado. |
| → usa | `Configuracion` (modelo) | Horario, tarifa y categorías de la tienda. |
| → usa | `Session::csrf()` | Token para que React pueda enviar formularios. |
| → muestra | `views/paginas/*.php` | Con `mostrarVista()`. |
| → termina en | `window.__DATOS__` (lo crea `cabecera.php`) | React lo lee en `src/main.tsx` y `src/servicios/api.ts`. |

## Variables importantes
| Variable | Para qué sirve | A dónde va |
|---|---|---|
| `$accion` | Qué página pidió (`'landing'`, `'admin'`...) | El despachador llama al método con ese nombre. |
| `$datos` | Datos iniciales para React (dentro de `mostrar()`) | Se convierte en `window.__DATOS__` en `cabecera.php` |

## Código explicado
Hay un método público por página y cada uno indica qué archivo de `views/paginas/` usa
(por ejemplo, `register` usa `registro.php`):
```php
public function register()
{
    $this->mostrar('registro');
}
```

El método privado `mostrar($vista)` arma los datos y carga la vista:
```php
$datos = [
    'usuario'   => Auth::check() ? Auth::usuarioActual() : null,
    'rol'       => Auth::check() ? Auth::rol() : null,
    'csrfToken' => Session::csrf(),
    'settings'  => $this->configModel->obtener(),
];
```
- `condición ? a : b` es un **if corto**: si hay sesión, se pone el usuario; si no, `null`.
- Todo esto viaja a React dentro del HTML. Así React no necesita pedirlo apenas abre.

```php
mostrarVista($vista, $datos);
```
Carga la vista. Dentro de ella, `$datos` queda disponible como variable.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `/`, `/login`, `/register`, `/forgot-password`, `/admin`, `/client`, `/kitchen`, `/delivery`. | `Failed to open stream: No such file or directory` (…`controllers/PaginaController.php`) |
| La línea `require_once __DIR__ . '/../models/Configuracion.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Configuracion" not found` |
| El método `landing()` | La página de inicio no abre. | `Call to undefined method PaginaController::landing()` (500) |
| La rama `$accion === 'landing'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método `login()` | La pantalla de login no abre. | `Call to undefined method PaginaController::login()` (500) |
| La rama `$accion === 'login'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/login'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método `register()` | La pantalla "crear cuenta" no abre. | `Call to undefined method PaginaController::register()` (500) |
| La rama `$accion === 'register'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/register'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método `forgotPassword()` | La pantalla "recuperar contraseña" no abre. | `Call to undefined method PaginaController::forgotPassword()` (500) |
| La rama `$accion === 'forgotPassword'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/forgot-password'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método `admin()` | El panel del administrador no abre. | `Call to undefined method PaginaController::admin()` (500) |
| La rama `$accion === 'admin'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/admin'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método `client()` | El panel del cliente no abre. | `Call to undefined method PaginaController::client()` (500) |
| La rama `$accion === 'client'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/client'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método `kitchen()` | El panel de cocina no abre. | `Call to undefined method PaginaController::kitchen()` (500) |
| La rama `$accion === 'kitchen'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/kitchen'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método `delivery()` | El panel del domiciliario no abre. | `Call to undefined method PaginaController::delivery()` (500) |
| La rama `$accion === 'delivery'` del despachador (al final) | Lo mismo. | `Pagina no encontrada.` (404) |
| La línea `'/delivery'` de `config/paginas.php` | Lo mismo. | `Pagina no encontrada.` (404) |
| El método privado `mostrar()` | `/`, `/login`, `/register`, `/forgot-password`, `/admin`, `/client`, `/kitchen`, `/delivery`. | `Call to undefined method PaginaController::mostrar()` (500) |
| La línea `$this->configModel = ...` del constructor | Las acciones que usan `$this->configModel`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
