# views/paginas/pagar.php
¿No entiendes una palabra? Mira el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Es la vista del **link de pago** (`/pagar?c=codigo`): la página donde el cliente de un pedido manual
paga desde su celular.

## ¿Qué hace?
- le dice a React qué pantalla abrir: `$pagina = 'pagar'`
- carga la parte de arriba (`cabecera.php`) y la de abajo (`pie.php`)

## ¿Con qué se conecta?
- **La abre:** `PaginaController` (método `pagar()`), cuando alguien entra a `/pagar`.
- **Quién puede entrar:** cualquiera (el código del link va en la dirección, después de `?c=`).
- **React:** `src/main.tsx` busca `'pagar'` y muestra `src/pages/PagarPedido.tsx`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pagina: monta la app de React (los datos ya vienen en window.__DATOS__). Link de pago del pedido manual; el codigo llega en la URL (?c=...)."* |
| 6 | `$pagina = 'pagar';` | Crea la variable `$pagina` con el nombre de la pantalla de React: `'pagar'`. La usa `cabecera.php` para escribirla en `data-pagina`, y `src/main.tsx` la lee para saber qué pantalla mostrar. |
| 7 | `require dirname(__DIR__) . '/layouts/cabecera.php';` | Trae `views/layouts/cabecera.php`: la parte de arriba de la página. `dirname(__DIR__)` = la carpeta `views/`. |
| 8 | `require dirname(__DIR__) . '/layouts/pie.php';` | Trae `views/layouts/pie.php`: la parte de abajo, que carga React. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | sale `Vista no encontrada: pagar` y el cliente no puede pagar por link |
| la línea `$pagina = ...` | sale `Pantalla no encontrada` en vez de la pantalla |
| el `require` de `cabecera.php` | la página sale en blanco |
| el `require` de `pie.php` | la página sale en blanco (no carga React) |
