# views/paginas/cocina.php

## ¿Para qué sirve?
Es la vista de la dirección **`/kitchen`**. Muestra el panel de cocina (pedidos pendientes y en preparación).

No tiene HTML propio: carga la aplicación de React y le dice que abra la pantalla `kitchen`.
La explicación general de las 8 vistas está en [README.md](README.md).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la configura | `config/paginas.php` (`'/kitchen'`) | Quién puede entrar: **solo el rol kitchen**. Si no tiene permiso, se le redirige a `/login`. |
| ← la carga | `PaginaController.php` con `mostrarVista('cocina', ...)` | Le entrega `$datos`. |
| → incluye | `views/layouts/cabecera.php` y `pie.php` | El HTML y el JavaScript. |
| → abre | `src/pages/KitchenDashboard.tsx` | `src/main.tsx` busca `'kitchen'` en `PAGINAS`. |

## Código
```php
$pagina = 'kitchen';
require dirname(__DIR__) . '/layouts/cabecera.php';
require dirname(__DIR__) . '/layouts/pie.php';
```
| Variable | Para qué sirve | A dónde va |
|---|---|---|
| `$pagina` | Nombre de la pantalla de React | `cabecera.php` lo pone en `<div id="app" data-pagina="kitchen">` |
| `$datos` (no se ve aquí) | Usuario, rol, token y ajustes. Lo deja disponible `mostrarVista()` | `cabecera.php` lo convierte en `window.__DATOS__` |

## ¿Qué pasa si se borra?

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `/kitchen` muestra `Vista no encontrada: cocina` (error 500). Lo revisa `mostrarVista()` en `config/helpers.php`. |
| La línea `$pagina = '...'` | Sale el aviso `Undefined variable $pagina` y en lugar de la pantalla aparece `Pantalla no encontrada` (lo revisa `src/main.tsx`). |
| La línea `require ... cabecera.php` | La página sale en blanco: falta el `<head>`, los estilos y `window.__DATOS__`. |
| La línea `require ... pie.php` | La página sale en blanco: no se carga `main.js` (React). |
