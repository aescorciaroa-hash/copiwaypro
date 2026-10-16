<?php
/**
 * Consola para que el Programador cree el primer Administrador
 * (y a si mismo, si todavia no existe). Es la unica forma de crear el primer admin.
 *
 * Uso (desde la raiz del proyecto):
 *   php bin/create-admin.php
 */

require __DIR__ . '/../config/database.php';
require __DIR__ . '/../app/Core/helpers.php';
require __DIR__ . '/../app/Models/Usuario.php';

/** Pide un dato por consola ($oculto = no muestra lo que se escribe, salvo en Windows). */
function prompt($etiqueta, $oculto = false)
{
    echo $etiqueta;
    if ($oculto && PHP_OS_FAMILY !== 'Windows') {
        system('stty -echo');
        $valor = trim((string) fgets(STDIN));
        system('stty echo');
        echo PHP_EOL;
    } else {
        $valor = trim((string) fgets(STDIN));
    }
    return $valor;
}

/** Muestra el error y termina. */
function fallar($mensaje)
{
    fwrite(STDERR, $mensaje . "\n");
    exit(1);
}

echo "=== CopiwayPRO — Creación del primer Administrador (rol Programador) ===\n\n";

$usuarioModel = new Usuario();

$correoProgramador = prompt('Correo del Programador (quien crea la cuenta): ');
$programador = $usuarioModel->buscarPorCorreo($correoProgramador);

if (!$programador) {
    echo "No existe un Programador con ese correo. Vamos a crearlo primero.\n";
    $nombre   = prompt('Nombre del Programador: ');
    $telefono = prompt('Teléfono del Programador: ');
    $password = prompt('Contraseña del Programador (mínimo 8 caracteres): ', true);

    if (strlen($password) < 8) {
        fallar('La contraseña debe tener al menos 8 caracteres.');
    }
    if (correoUsadoEnCualquierTabla($correoProgramador)) {
        fallar('Ya existe una cuenta con ese correo.');
    }

    $programador = $usuarioModel->crear([
        'nombre'       => $nombre,
        'correo'       => $correoProgramador,
        'telefono'     => $telefono,
        'password'     => $password,
        'nivel_acceso' => 'programador',
        'creado_por'   => null,
    ]);
    echo "Programador creado.\n\n";
}

echo "Ahora, datos del Administrador (rol 'maestro') que usará el panel /admin:\n";
$nombreAdmin   = prompt('Nombre del Administrador: ');
$correoAdmin   = prompt('Correo del Administrador: ');
$telefonoAdmin = prompt('Teléfono del Administrador: ');
$passwordAdmin = prompt('Contraseña del Administrador (mínimo 8 caracteres): ', true);

if (strlen($passwordAdmin) < 8) {
    fallar('La contraseña debe tener al menos 8 caracteres.');
}
if ($usuarioModel->esUsado($correoAdmin, $telefonoAdmin) || correoUsadoEnCualquierTabla($correoAdmin)) {
    fallar('Ya existe una cuenta con ese correo o teléfono.');
}

$usuarioModel->crear([
    'nombre'       => $nombreAdmin,
    'correo'       => $correoAdmin,
    'telefono'     => $telefonoAdmin,
    'password'     => $passwordAdmin,
    'nivel_acceso' => 'maestro',
    'creado_por'   => $programador['id_admin'],
]);

echo "\nAdministrador '{$nombreAdmin}' creado correctamente. Ya puede iniciar sesión en /login.\n";
