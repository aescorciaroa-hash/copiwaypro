# app/Controllers/PaginaController.php

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
| → muestra | `app/Views/paginas/*.php` | Con `mostrarVista()`. |
| → termina en | `window.__DATOS__` (lo crea `cabecera.php`) | React lo lee en `src/main.tsx` y `src/servicios/api.ts`. |

## Variables importantes
| Variable | Para qué sirve | A dónde va |
|---|---|---|
| `$action` | Qué página pidió (`'landing'`, `'admin'`...) | Se busca en `$vistas` |
| `$vistas` | Tabla "acción → archivo de vista". Ej: `'register' => 'registro'` | `mostrarVista($vistas[$action], ...)` |
| `$datos` | Datos iniciales para React | Se convierte en `window.__DATOS__` en `cabecera.php` |

## Código explicado
```php
$vistas = [
    'landing'  => 'landing',
    'register' => 'registro',
    ...
];
```
Relaciona el nombre de la acción con el nombre del archivo en `app/Views/paginas/`
(por ejemplo, `register` usa `registro.php`).

```php
if (isset($vistas[$action])) {
```
`isset` revisa que esa acción exista en la tabla.

```php
$datos = [
    'usuario'   => Auth::check() ? Auth::usuarioActual() : null,
    'rol'       => Auth::check() ? Auth::rol() : null,
    'csrfToken' => Session::csrf(),
    'settings'  => $configModel->obtener(),
];
```
- `condición ? a : b` es un **if corto**: si hay sesión, se pone el usuario; si no, `null`.
- Todo esto viaja a React dentro del HTML. Así React no necesita pedirlo apenas abre.

```php
mostrarVista($vistas[$action], ['datos' => $datos]);
```
Carga la vista. Dentro de ella, `$datos` queda disponible como variable.
