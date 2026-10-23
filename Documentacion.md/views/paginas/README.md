# views/paginas/ — las 9 páginas

Las 9 vistas son **casi iguales**. Ninguna tiene HTML propio: todas cargan la misma aplicación de
React y solo cambian el valor de `$pagina`, que le dice a React qué pantalla mostrar.

## La forma de todas
```php
<?php
/**
 * Pagina: monta la app de React (los datos ya vienen en window.__DATOS__).
 */
$pagina = 'admin';
require dirname(__DIR__) . '/layouts/cabecera.php';
require dirname(__DIR__) . '/layouts/pie.php';
```
| Línea | Qué hace |
|---|---|
| `$pagina = 'admin';` | Nombre de la pantalla de React. |
| `dirname(__DIR__)` | La carpeta de arriba: `views`. |
| `require .../cabecera.php` | Imprime la primera mitad del HTML (usa `$pagina` y `$datos`). |
| `require .../pie.php` | Imprime la segunda mitad y carga React. |

`$datos` no se crea aquí: es el parámetro de `mostrarVista($vista, $datos)` (en `helpers.php`), que carga la vista con `require`.

## Cadena completa (ejemplo: `/admin`)
```
Navegador: /admin
 → config/paginas.php           '/admin' => ['PaginaController', 'admin', ['admin']]
 → PaginaController.php         $vistas['admin'] = 'admin'  → mostrarVista('admin', ...)
 → views/paginas/admin.php  $pagina = 'admin'
 → cabecera.php                 <div id="app" data-pagina="admin">
 → src/main.tsx                 PAGINAS['admin'] = AdminDashboard
 → src/pages/AdminDashboard.tsx (la pantalla que ves)
```

## Tabla de las 9 páginas
| Archivo | `$pagina` | Dirección | Pantalla de React (`src/pages/`) |
|---|---|---|---|
| [landing.php](landing.md) | `landing` | `/` | `Landing.tsx` |
| [login.php](login.md) | `login` | `/login` | `Login.tsx` |
| [registro.php](registro.md) | `register` | `/register` | `Register.tsx` |
| [recuperar.php](recuperar.md) | `forgot-password` | `/forgot-password` | `ForgotPassword.tsx` |
| [admin.php](admin.md) | `admin` | `/admin` | `AdminDashboard.tsx` |
| [cliente.php](cliente.md) | `client` | `/client` | `ClientDashboard.tsx` |
| [cocina.php](cocina.md) | `kitchen` | `/kitchen` | `KitchenDashboard.tsx` |
| [domiciliario.php](domiciliario.md) | `delivery` | `/delivery` | `DeliveryDashboard.tsx` |
| [pagar.php](pagar.md) | `pagar` | `/pagar?c=código` | `PagarPedido.tsx` |

**Importante:** el valor de `$pagina` debe coincidir con una clave de `PAGINAS` en `src/main.tsx`.
Si no coincide, React muestra la página de inicio (Landing).
