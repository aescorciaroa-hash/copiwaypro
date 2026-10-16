# app/Models/Usuario.php

## ¿Para qué sirve?
Consultas de la tabla **ADMINISTRADOR**. Solo lo usa el script de consola `bin/create-admin.php` para
crear el primer administrador.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | `bin/create-admin.php` |
| → tabla | `ADMINISTRADOR` |

El inicio de sesión de los administradores lo hace `app/Core/Auth.php`, no este modelo.

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
