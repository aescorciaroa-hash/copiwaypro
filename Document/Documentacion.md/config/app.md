# config/app.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Guarda los ajustes generales del sistema.

## ¿Qué hace?
- 'entorno': 'local' en tu computador, 'production' en un servidor
- 'debug': true muestra el detalle de los errores
- 'zona_horaria': hora de Colombia
- 'ruta_base': la carpeta del proyecto (vacío = se detecta sola)

## ¿Con qué se conecta?
- **Lo carga:** `public/index.php` y lo deja en la variable `$config`.
- **Lo usan:** `rutaBase()` y `manejarError()` (en `helpers.php`) y `AuthController`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Configuracion general de la app."* |
| 6 | `return [` | `return [` = devuelve una lista de ajustes. `public/index.php` la recibe y la guarda en `$config`. |
| 7 | `'entorno' => 'local',              // 'local' o 'production'` | `'entorno'` = dónde corre el sistema. `'local'` es tu computador. Lo usa `AuthController` al recuperar la contraseña. Lo de después de `//` es un comentario. |
| 8 | `'debug' => true,                   // true muestra el detalle de los errores (false en produccion)` | `'debug'` = si es `true`, cuando hay un error se muestra el detalle. Lo usa `manejarError()` en `helpers.php`. |
| 9 | `'zona_horaria' => 'America/Bogota',` | `'zona_horaria'` = la hora que usa PHP (Colombia). Lo usa `public/index.php`. |
| 10 | `'ruta_base' => '',                 // ej. '/copiwaypro'. Vacio = se detecta sola (recomendado)` | `'ruta_base'` = la carpeta del proyecto. Vacío (`''`) = se detecta sola. Lo usa `rutaBase()` en `helpers.php`. |
| 11 | `];` | Cierra la lista de ajustes. |
| 12 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | nada funciona (`Failed to open stream`) |
| `'zona_horaria'` | sale el aviso `Undefined array key` y las pantallas se quedan sin datos |
| `'ruta_base'` | sale el aviso `Undefined array key` y las pantallas se quedan sin datos |
| `'debug'` | no se nota hasta que haya un error |
| `'entorno'` | sale un aviso al recuperar la contraseña |
