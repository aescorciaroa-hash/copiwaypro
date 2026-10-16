# app/Views/paginas/admin.php

## ¿Para qué sirve?
Es la vista de la dirección **`/admin`**. Muestra el panel del administrador (menú, inventario, pedidos, personal, clientes, mapa, ajustes y cierre de caja).

No tiene HTML propio: carga la aplicación de React y le dice que abra la pantalla `admin`.
La explicación general de las 8 vistas está en [README.md](README.md).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la configura | `config/paginas.php` (`'/admin'`) | Quién puede entrar: **solo el rol admin**. Si no tiene permiso, se le redirige a `/login`. |
| ← la carga | `PaginaController.php` con `mostrarVista('admin', ...)` | Le entrega `$datos`. |
| → incluye | `app/Views/layouts/cabecera.php` y `pie.php` | El HTML y el JavaScript. |
| → abre | `src/pages/AdminDashboard.tsx` | `src/main.tsx` busca `'admin'` en `PAGINAS`. |

## Código
```php
$pagina = 'admin';
require dirname(__DIR__) . '/layouts/cabecera.php';
require dirname(__DIR__) . '/layouts/pie.php';
```
| Variable | Para qué sirve | A dónde va |
|---|---|---|
| `$pagina` | Nombre de la pantalla de React | `cabecera.php` lo pone en `<div id="app" data-pagina="admin">` |
| `$datos` (no se ve aquí) | Usuario, rol, token y ajustes. Lo deja disponible `mostrarVista()` | `cabecera.php` lo convierte en `window.__DATOS__` |
