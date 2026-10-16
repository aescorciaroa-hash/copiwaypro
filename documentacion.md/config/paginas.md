# config/paginas.php

## ¿Para qué sirve?
Es la lista de **páginas** (las direcciones que se escriben en el navegador, sin `/api`).
La usa la función `despacharPagina()` de `config/helpers.php`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo lee | `despacharPagina()` en `config/helpers.php` | Busca la página pedida y revisa el rol. |
| → apunta a | `controllers/PaginaController.php` | Todas las páginas las muestra ese controlador. |
| → termina en | `views/paginas/*.php` | El HTML que carga React. |

## Código explicado
```php
return [
    '/'                => ['PaginaController', 'landing', []],
    '/login'           => ['PaginaController', 'login', []],
    '/admin'           => ['PaginaController', 'admin', ['admin']],
    ...
];
```
| Parte | Significado |
|---|---|
| `'/admin'` | La dirección en el navegador. |
| `'PaginaController'` | Siempre es el mismo controlador. |
| `'admin'` | La acción: el método de `PaginaController` que se llama (qué página mostrar). |
| `['admin']` | Quién puede entrar. `[]` = pública. |

Si alguien entra a una página protegida sin sesión o con otro rol, se le **redirige a `/login`**.

| Página | Quién entra |
|---|---|
| `/`, `/login`, `/register`, `/forgot-password` | Cualquiera |
| `/admin` | Administrador |
| `/client` | Cliente |
| `/kitchen` | Cocina |
| `/delivery` | Domiciliario |
