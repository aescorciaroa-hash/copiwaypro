# app/Views/paginas/recuperar.php

## ¿Para qué sirve?
Es la vista de la dirección **`/forgot-password`**. Muestra los dos pasos para recuperar la contraseña (pedir el código y escribir la nueva).

No tiene HTML propio: carga la aplicación de React y le dice que abra la pantalla `forgot-password`.
La explicación general de las 8 vistas está en [README.md](README.md).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la configura | `config/paginas.php` (`'/forgot-password'`) | Quién puede entrar: **cualquiera**. Si no tiene permiso, se le redirige a `/login`. |
| ← la carga | `PaginaController.php` con `mostrarVista('recuperar', ...)` | Le entrega `$datos`. |
| → incluye | `app/Views/layouts/cabecera.php` y `pie.php` | El HTML y el JavaScript. |
| → abre | `src/pages/ForgotPassword.tsx` | `src/main.tsx` busca `'forgot-password'` en `PAGINAS`. |

## Código
```php
$pagina = 'forgot-password';
require dirname(__DIR__) . '/layouts/cabecera.php';
require dirname(__DIR__) . '/layouts/pie.php';
```
| Variable | Para qué sirve | A dónde va |
|---|---|---|
| `$pagina` | Nombre de la pantalla de React | `cabecera.php` lo pone en `<div id="app" data-pagina="forgot-password">` |
| `$datos` (no se ve aquí) | Usuario, rol, token y ajustes. Lo deja disponible `mostrarVista()` | `cabecera.php` lo convierte en `window.__DATOS__` |
