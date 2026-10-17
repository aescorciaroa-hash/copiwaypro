# views/paginas/domiciliario.php
¿No entiendes una palabra? Mira el [glosario](../../GLOSARIO.md).

## ¿Para qué sirve?
Es la vista de el panel del domiciliario (`/delivery`).

## ¿Qué hace?
- le dice a React qué pantalla abrir: `$pagina = 'delivery'`
- carga la parte de arriba (`cabecera.php`) y la de abajo (`pie.php`)

## ¿Con qué se conecta?
- **La abre:** `PaginaController` (método `delivery()`), cuando alguien entra a `/delivery`.
- **Quién puede entrar:** delivery.
- **React:** `src/main.tsx` busca `'delivery'` y muestra esa pantalla.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pagina: monta la app de React (los datos ya vienen en window.__DATOS__)."* |
| 5 | `$pagina = 'delivery';` | Crea la variable `$pagina` con el nombre de la pantalla de React: `'delivery'` (el panel del domiciliario). La usa `cabecera.php` para escribirla en `data-pagina`, y `src/main.tsx` la lee para saber qué pantalla mostrar. |
| 6 | `require dirname(__DIR__) . '/layouts/cabecera.php';` | Trae `views/layouts/cabecera.php`: la parte de arriba de la página. `dirname(__DIR__)` = la carpeta `views/`. |
| 7 | `require dirname(__DIR__) . '/layouts/pie.php';` | Trae `views/layouts/pie.php`: la parte de abajo, que carga React. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | sale `Vista no encontrada: domiciliario` |
| la línea `$pagina = ...` | sale `Pantalla no encontrada` en vez de la pantalla |
| el `require` de `cabecera.php` | la página sale en blanco |
| el `require` de `pie.php` | la página sale en blanco (no carga React) |
