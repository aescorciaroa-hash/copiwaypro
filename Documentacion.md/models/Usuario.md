# models/Usuario.php

## ¿Para qué sirve?
Consultas de la tabla **ADMINISTRADOR**. Solo lo usa el script de consola `sql/create-admin.php` para
crear el primer administrador.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | `sql/create-admin.php` |
| → tabla | `ADMINISTRADOR` |

El inicio de sesión de los administradores lo hace `models/Auth.php`, no este modelo.

## Columnas de ADMINISTRADOR
| Columna | Qué guarda |
|---|---|
| `nivel_acceso` | `programador` (crea admins, no entra por la web) o `maestro` (el admin normal). |
| `creado_por` | Id del programador que lo creó. |

## Métodos
| Método | Qué hace |
|---|---|
| `buscarPorCorreo($correo)` | Una fila por correo, o `null`. |
| `esUsado($correo, $telefono)` | ¿Ya existe un admin con ese correo o teléfono? |
| `crear($d)` | Inserta el admin (contraseña cifrada con `PASSWORD_BCRYPT`) y devuelve la fila creada usando `buscarPorCorreo()`. |

`$creadoPor = $d['creado_por'] ?? null;` → si no viene quién lo creó, se guarda `NULL`
(el programador inicial no tiene creador).

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/Usuario.php`).
Lo cargan con `require_once`: `sql/create-admin.php`. Dejan de funcionar:
  - Nada directo.

**Si se borra un método:** sale `Call to undefined method Usuario::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `buscarPorCorreo()` | `Usuario::crear()` | Nada directo. |
| `esUsado()` | — | Nada directo. |
| `crear()` | — | Nada directo. |
| `__construct()` | `new Usuario()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa Usuario. |
