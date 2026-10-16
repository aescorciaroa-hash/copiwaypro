# views/paginas/domiciliario.php

## ¿Para qué sirve?
Es la vista de la dirección **`/delivery`**. Muestra el panel del domiciliario (pedidos para repartir, mapa y entrega con PIN).

No tiene HTML propio: carga la aplicación de React y le dice que abra la pantalla `delivery`.
La explicación general de las 8 vistas está en [README.md](README.md).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la configura | `config/paginas.php` (`'/delivery'`) | Quién puede entrar: **solo el rol delivery**. Si no tiene permiso, se le redirige a `/login`. |
| ← la carga | `PaginaController.php` con `mostrarVista('domiciliario', ...)` | Le entrega `$datos`. |
| → incluye | `views/layouts/cabecera.php` y `pie.php` | El HTML y el JavaScript. |
| → abre | `src/pages/DeliveryDashboard.tsx` | `src/main.tsx` busca `'delivery'` en `PAGINAS`. |

## Código
```php
$pagina = 'delivery';
require dirname(__DIR__) . '/layouts/cabecera.php';
require dirname(__DIR__) . '/layouts/pie.php';
```
| Variable | Para qué sirve | A dónde va |
|---|---|---|
| `$pagina` | Nombre de la pantalla de React | `cabecera.php` lo pone en `<div id="app" data-pagina="delivery">` |
| `$datos` (no se ve aquí) | Usuario, rol, token y ajustes. Lo deja disponible `mostrarVista()` | `cabecera.php` lo convierte en `window.__DATOS__` |

## ¿Qué pasa si se borra?

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `/delivery` muestra `Vista no encontrada: domiciliario` (error 500). Lo revisa `mostrarVista()` en `config/helpers.php`. |
| La línea `$pagina = '...'` | Sale el aviso `Undefined variable $pagina` y en lugar de la pantalla aparece `Pantalla no encontrada` (lo revisa `src/main.tsx`). |
| La línea `require ... cabecera.php` | La página sale en blanco: falta el `<head>`, los estilos y `window.__DATOS__`. |
| La línea `require ... pie.php` | La página sale en blanco: no se carga `main.js` (React). |
