# sql/create-admin.php

## ¿Para qué sirve?
Es un **programa de consola** (no se abre en el navegador) para crear el **primer administrador**.
Como el admin no se puede registrar desde la web, esta es la única forma de crearlo.

Se ejecuta desde la carpeta del proyecto:
```
php sql/create-admin.php
```

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| → usa | `config/database.php` | `$conn` y las constantes de configuración. |
| → usa | `config/helpers.php` | `correoUsadoEnCualquierTabla()`. |
| → usa | `models/Usuario.php` | Buscar y crear administradores. |
| → tabla | `ADMINISTRADOR` | Donde se guardan. |

## Variables importantes
| Variable | Qué guarda |
|---|---|
| `$usuarioModel` | `new Usuario()`. |
| `$correoProgramador`, `$programador` | El correo escrito y la fila del programador (quien crea admins). |
| `$nombreAdmin`, `$correoAdmin`, `$telefonoAdmin`, `$passwordAdmin` | Datos del nuevo admin. |
| `STDIN` / `STDERR` | Entrada del teclado / salida de errores de la consola. |

## Funciones
### `prompt($etiqueta, $oculto)`
Muestra una pregunta y lee lo que escribe el usuario:
```php
echo $etiqueta;
$valor = trim((string) fgets(STDIN));
```
- `fgets(STDIN)` lee una línea del teclado.
- Si `$oculto` es `true` (contraseñas) y no es Windows, `stty -echo` oculta lo que se escribe.

### `fallar($mensaje)`
Escribe el error y termina el programa con `exit(1)` (1 = terminó con error).

## Paso a paso
1. Pide el correo del **programador**.
2. Si no existe, pide sus datos y lo crea con `nivel_acceso = 'programador'`.
3. Pide los datos del **administrador**.
4. Valida: contraseña de 8 o más caracteres y que el correo/teléfono no existan.
5. Lo crea con `nivel_acceso = 'maestro'` y `creado_por` = id del programador.
6. Ya puede entrar por `/login`.
