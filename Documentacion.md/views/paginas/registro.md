# views/paginas/registro.php

## ¿Para qué sirve?
Es la vista de la dirección **`/register`**. Muestra el formulario para que un cliente nuevo cree su cuenta.

No tiene HTML propio: carga la aplicación de React y le dice que abra la pantalla `register`.
La explicación general de las 8 vistas está en [README.md](README.md).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la configura | `config/paginas.php` (`'/register'`) | Quién puede entrar: **cualquiera**. Si no tiene permiso, se le redirige a `/login`. |
| ← la carga | `PaginaController.php` con `mostrarVista('registro', ...)` | Le entrega `$datos`. |
| → incluye | `views/layouts/cabecera.php` y `pie.php` | El HTML y el JavaScript. |
| → abre | `src/pages/Register.tsx` | `src/main.tsx` busca `'register'` en `PAGINAS`. |

## Código
```php
$pagina = 'register';
require dirname(__DIR__) . '/layouts/cabecera.php';
require dirname(__DIR__) . '/layouts/pie.php';
```
| Variable | Para qué sirve | A dónde va |
|---|---|---|
| `$pagina` | Nombre de la pantalla de React | `cabecera.php` lo pone en `<div id="app" data-pagina="register">` |
| `$datos` (no se ve aquí) | Usuario, rol, token y ajustes. Lo deja disponible `mostrarVista()` | `cabecera.php` lo convierte en `window.__DATOS__` |

## ¿Qué pasa si se borra?

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `/register` muestra `Vista no encontrada: registro` (error 500). Lo revisa `mostrarVista()` en `config/helpers.php`. |
| La línea `$pagina = '...'` | Sale el aviso `Undefined variable $pagina` y en lugar de la pantalla aparece `Pantalla no encontrada` (lo revisa `src/main.tsx`). |
| La línea `require ... cabecera.php` | La página sale en blanco: falta el `<head>`, los estilos y `window.__DATOS__`. |
| La línea `require ... pie.php` | La página sale en blanco: no se carga `main.js` (React). |
