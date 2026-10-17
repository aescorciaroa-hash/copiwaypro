# sql/create-admin.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Crea el primer administrador desde la consola.

## ¿Qué hace?
- pide los datos del programador y del administrador
- los guarda en la base de datos
- se usa así: php sql\create-admin.php

## ¿Con qué se conecta?
- **Usa:** `config/database.php`, `config/helpers.php` y el modelo `Usuario`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-8 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Consola para que el Programador cree el primer Administrador (y a si mismo, si todavia no existe). Es la unica forma de crear el primer admin.  Uso (desde la raiz del proyecto): php sql/create-admin.php"* |
| 10 | `require __DIR__ . '/../config/database.php';` | Trae `config/database.php`: crea la conexión `$conn`. |
| 11 | `require __DIR__ . '/../config/helpers.php';` | Trae `config/helpers.php`: para usar `correoUsadoEnCualquierTabla()`. |
| 12 | `require __DIR__ . '/../models/Usuario.php';` | Trae `models/Usuario.php`: la clase que guarda administradores. |
| 14 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Pide un dato por consola ($oculto = no muestra lo que se escribe, salvo en Windows)."* |
| 15 | `function prompt($etiqueta, $oculto = false)` | Función `prompt($etiqueta, $oculto)`: hace una pregunta en la consola y devuelve lo que escribas. Si `$oculto` es `true`, no muestra lo que escribes (para contraseñas). |
| 16 | `{` | Abre la función `prompt()`. |
| 17 | `echo $etiqueta;` | Escribe la pregunta. |
| 18 | `if ($oculto && PHP_OS_FAMILY !== 'Windows') {` | Si hay que ocultarlo y no es Windows... |
| 19 | `system('stty -echo');` | ...apaga lo que se ve en la consola (`stty -echo`). |
| 20 | `$valor = trim((string) fgets(STDIN));` | ...lee lo que escribiste (`fgets(STDIN)`), sin espacios. |
| 21 | `system('stty echo');` | ...vuelve a encender lo que se ve. |
| 22 | `echo PHP_EOL;` | ...hace un salto de línea (`PHP_EOL`). |
| 23 | `} else {` | Si no hay que ocultarlo (o es Windows)... |
| 24 | `$valor = trim((string) fgets(STDIN));` | ...lee lo que escribiste. |
| 25 | `}` | Cierra el `else`. |
| 26 | `return $valor;` | Devuelve lo que escribiste. |
| 27 | `}` | Cierra la función `prompt()`. |
| 29 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Muestra el error y termina."* |
| 30 | `function fallar($mensaje)` | Función `fallar($mensaje)`: muestra un error y termina. |
| 31 | `{` | Abre la función `fallar()`. |
| 32 | `fwrite(STDERR, $mensaje . "\n");` | Escribe el mensaje como error (`STDERR`). |
| 33 | `exit(1);` | Termina con el código 1 (= hubo un error). |
| 34 | `}` | Cierra la función `fallar()`. |
| 36 | `echo "=== CopiwayPRO — Creación del primer Administrador (rol Programador) ===\n\n";` | Escribe el título en la consola. |
| 38 | `$usuarioModel = new Usuario();` | Crea el modelo `Usuario`. |
| 40 | `$correoProgramador = prompt('Correo del Programador (quien crea la cuenta): ');` | Pregunta el correo del programador. |
| 41 | `$programador = $usuarioModel->buscarPorCorreo($correoProgramador);` | Lo busca (`buscarPorCorreo()` de `models/Usuario.php`). |
| 43 | `if (!$programador) {` | Si no existe... |
| 44 | `echo "No existe un Programador con ese correo. Vamos a crearlo primero.\n";` | ...avisa que lo va a crear. |
| 45 | `$nombre   = prompt('Nombre del Programador: ');` | ...pregunta el nombre. |
| 46 | `$telefono = prompt('Teléfono del Programador: ');` | ...pregunta el teléfono. |
| 47 | `$password = prompt('Contraseña del Programador (mínimo 8 caracteres): ', true);` | ...pregunta la contraseña (oculta). |
| 49 | `if (strlen($password) < 8) {` | Si la contraseña tiene menos de 8 caracteres... |
| 50 | `fallar('La contraseña debe tener al menos 8 caracteres.');` | ...muestra el error y termina. |
| 51 | `}` | Cierra el `if`. |
| 52 | `if (correoUsadoEnCualquierTabla($correoProgramador)) {` | Si el correo ya lo usa otra cuenta... |
| 53 | `fallar('Ya existe una cuenta con ese correo.');` | ...muestra el error y termina. |
| 54 | `}` | Cierra el `if`. |
| 56 | `$programador = $usuarioModel->crear([` | Crea el programador (`crear()` de `models/Usuario.php`) con: |
| 57 | `'nombre'       => $nombre,` | el nombre, |
| 58 | `'correo'       => $correoProgramador,` | el correo, |
| 59 | `'telefono'     => $telefono,` | el teléfono, |
| 60 | `'password'     => $password,` | la contraseña, |
| 61 | `'nivel_acceso' => 'programador',` | el nivel `'programador'`, |
| 62 | `'creado_por'   => null,` | y sin creador. |
| 63 | `]);` | Cierra los datos. |
| 64 | `echo "Programador creado.\n\n";` | Avisa "Programador creado.". |
| 65 | `}` | Cierra el `if`. |
| 67 | `echo "Ahora, datos del Administrador (rol 'maestro') que usará el panel /admin:\n";` | Avisa que ahora va a pedir los datos del administrador. |
| 68 | `$nombreAdmin   = prompt('Nombre del Administrador: ');` | Pregunta el nombre del administrador. |
| 69 | `$correoAdmin   = prompt('Correo del Administrador: ');` | Pregunta su correo. |
| 70 | `$telefonoAdmin = prompt('Teléfono del Administrador: ');` | Pregunta su teléfono. |
| 71 | `$passwordAdmin = prompt('Contraseña del Administrador (mínimo 8 caracteres): ', true);` | Pregunta su contraseña (oculta). |
| 73 | `if (strlen($passwordAdmin) < 8) {` | Si la contraseña tiene menos de 8 caracteres... |
| 74 | `fallar('La contraseña debe tener al menos 8 caracteres.');` | ...muestra el error y termina. |
| 75 | `}` | Cierra el `if`. |
| 76 | `if ($usuarioModel->esUsado($correoAdmin, $telefonoAdmin) \|\| correoUsadoEnCualquierTabla($correoAdmin)) {` | Si ya existe un administrador con ese correo o teléfono, o el correo lo usa otra cuenta... |
| 77 | `fallar('Ya existe una cuenta con ese correo o teléfono.');` | ...muestra el error y termina. |
| 78 | `}` | Cierra el `if`. |
| 80 | `$usuarioModel->crear([` | Crea el administrador con: |
| 81 | `'nombre'       => $nombreAdmin,` | el nombre, |
| 82 | `'correo'       => $correoAdmin,` | el correo, |
| 83 | `'telefono'     => $telefonoAdmin,` | el teléfono, |
| 84 | `'password'     => $passwordAdmin,` | la contraseña, |
| 85 | `'nivel_acceso' => 'maestro',` | el nivel `'maestro'` (el que usa el panel `/admin`), |
| 86 | `'creado_por'   => $programador['id_admin'],` | y quién lo creó (el programador). |
| 87 | `]);` | Cierra los datos. |
| 89 | `echo "\nAdministrador '{$nombreAdmin}' creado correctamente. Ya puede iniciar sesión en /login.\n";` | Avisa que el administrador quedó creado y que ya puede iniciar sesión. `{$nombreAdmin}` pone el nombre dentro del texto. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo completo | no afecta el sistema; solo no se puede crear el primer administrador por consola |
