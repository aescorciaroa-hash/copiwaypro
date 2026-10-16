# app/Views/paginas/domiciliario.php

## ¿Para qué sirve?
Es la vista de la dirección **`/delivery`**. Muestra el panel del domiciliario (pedidos para repartir, mapa y entrega con PIN).

No tiene HTML propio: carga la aplicación de React y le dice que abra la pantalla `delivery`.
La explicación general de las 8 vistas está en [README.md](README.md).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la configura | `config/paginas.php` (`'/delivery'`) | Quién puede entrar: **solo el rol delivery**. Si no tiene permiso, se le redirige a `/login`. |
| ← la carga | `PaginaController.php` con `mostrarVista('domiciliario', ...)` | Le entrega `$datos`. |
| → incluye | `app/Views/layouts/cabecera.php` y `pie.php` | El HTML y el JavaScript. |
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
