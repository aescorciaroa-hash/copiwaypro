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
