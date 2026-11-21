# config/app.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Guarda los ajustes generales del sistema.

## ¿Qué hace?
- revisa si corre en Windows (tu computador) o no (Hostinger)
- 'entorno': 'local' en tu computador, 'production' en Hostinger (se elige solo)
- 'debug': true en tu computador (muestra el detalle de los errores), false en Hostinger
- 'zona_horaria': hora de Colombia
- 'ruta_base': la carpeta del proyecto (vacío = se detecta sola)

## ¿Con qué se conecta?
- **Lo carga:** `public/index.php` y lo deja en la variable `$config`.
- **Lo usan:** `rutaBase()` y `manejarError()` (en `helpers.php`) y `AuthController`.

<!-- conexiones-y-preguntas:inicio -->

### Preguntas que te pueden hacer sobre este archivo

**¿Con qué se conecta?**  
`public/index.php` lo carga en `$config`. Lo usan `rutaBase()` y `manejarError()` (en `helpers.php`) y `AuthController`.

**¿Para qué es `debug`?**  
En `true` muestra el detalle del error; en producción va en `false` para no mostrar datos internos. Ahora se elige solo con `$esLocal`.

**¿Cómo sabe si está en mi computador o en Hostinger?**  
Con `PHP_OS_FAMILY`: tu computador usa Windows y el servidor de Hostinger usa Linux.

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Configuracion general de la app. En tu computador (Windows) es 'local'; en Hostinger (Linux) es 'production'."* |
| 7 | `$esLocal = (PHP_OS_FAMILY == "Windows");` | `PHP_OS_FAMILY` = el sistema operativo donde corre PHP. Si es `"Windows"` (tu computador con Laragon), `$esLocal` queda en `true`. En Hostinger (Linux) queda en `false`. |
| 9 | `return [` | `return [` = devuelve una lista de ajustes. `public/index.php` la recibe y la guarda en `$config`. |
| 10 | `'entorno' => $esLocal ? 'local' : 'production',` | `'entorno'` = dónde corre el sistema. `? :` = "si `$esLocal` es true usa `'local'`, si no usa `'production'`". Lo usa `AuthController` al recuperar la contraseña. |
| 11 | `'debug' => $esLocal,               // true muestra el detalle de los errores (solo en tu computador)` | `'debug'` = si es `true`, cuando hay un error se muestra el detalle. Vale lo mismo que `$esLocal`: `true` en tu computador y `false` en Hostinger. Lo usa `manejarError()` en `helpers.php`. |
| 12 | `'zona_horaria' => 'America/Bogota',` | `'zona_horaria'` = la hora que usa PHP (Colombia). Lo usa `public/index.php`. |
| 13 | `'ruta_base' => '',                 // ej. '/copiwaypro'. Vacio = se detecta sola (recomendado)` | `'ruta_base'` = la carpeta del proyecto. Vacío (`''`) = se detecta sola. Lo usa `rutaBase()` en `helpers.php`. |
| 14 | `];` | Cierra la lista de ajustes. |
| 15 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | nada funciona (`Failed to open stream`) |
| `'zona_horaria'` | sale el aviso `Undefined array key` y las pantallas se quedan sin datos |
| `'ruta_base'` | sale el aviso `Undefined array key` y las pantallas se quedan sin datos |
| `'debug'` | no se nota hasta que haya un error |
| `'entorno'` | sale un aviso al recuperar la contraseña |
| `$esLocal` | sale `Undefined variable` y el sistema no sabe si está en tu computador o en Hostinger |
