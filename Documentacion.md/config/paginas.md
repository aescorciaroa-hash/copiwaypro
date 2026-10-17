# config/paginas.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Es la lista de páginas del sistema.

## ¿Qué hace?
- dice qué página abre cada dirección (/login, /admin...)
- dice qué rol puede entrar a cada página

## ¿Con qué se conecta?
- **Lo lee:** `despacharPagina()` en `config/helpers.php`.
- **Ejemplo:** `'/admin' => ['PaginaController', 'admin', ['admin']]`
- **Las abre:** `PaginaController`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Paginas: 'ruta' => [Controlador, accion, roles]. roles = [] significa publica (sin sesion)."* |
| 7 | `return [` | `return [` = devuelve la lista de páginas. La lee `despacharPagina()` en `helpers.php`. |
| 8 | `'/' => ['PaginaController', 'landing', []],` | La dirección `/` (inicio) → `PaginaController`, función `landing()`. `[]` = cualquiera puede entrar. |
| 9 | `'/login' => ['PaginaController', 'login', []],` | `/login` → `PaginaController::login()`. Cualquiera puede entrar. |
| 10 | `'/register' => ['PaginaController', 'register', []],` | `/register` (crear cuenta) → `PaginaController::register()`. Cualquiera puede entrar. |
| 11 | `'/forgot-password' => ['PaginaController', 'forgotPassword', []],` | `/forgot-password` (recuperar contraseña) → `PaginaController::forgotPassword()`. Cualquiera. |
| 12 | `'/admin' => ['PaginaController', 'admin', ['admin']],` | `/admin` → `PaginaController::admin()`. `['admin']` = solo el administrador. |
| 13 | `'/client' => ['PaginaController', 'client', ['client']],` | `/client` → `PaginaController::client()`. Solo el cliente. |
| 14 | `'/kitchen' => ['PaginaController', 'kitchen', ['kitchen']],` | `/kitchen` → `PaginaController::kitchen()`. Solo cocina. |
| 15 | `'/delivery' => ['PaginaController', 'delivery', ['delivery']],` | `/delivery` → `PaginaController::delivery()`. Solo el domiciliario. |
| 16 | `];` | Cierra la lista. |
| 17 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | ninguna página abre |
| una línea | esa página no abre: sale `Pagina no encontrada.` |
| un rol (`['admin']` → `[]`) | **no sale error**: cualquiera puede abrir ese panel |
