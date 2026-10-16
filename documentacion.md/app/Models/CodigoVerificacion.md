# app/Models/CodigoVerificacion.php

## ¿Para qué sirve?
Guarda y revisa los **códigos de 6 dígitos** para recuperar la contraseña (tabla `CODIGO_VERIFICACION`).

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | `AuthController.php` (acciones `forgotPasswordRequest` y `forgotPasswordReset`) |
| → tabla | `CODIGO_VERIFICACION` (unida con `CLIENTE` para buscar por correo) |

## Columnas
| Columna | Qué guarda |
|---|---|
| `codigo_hash` | El código **cifrado** (nunca el código real). |
| `fecha_expiracion` | Ahora + 15 minutos. |
| `usado` | 1 cuando ya se usó (no sirve dos veces). |
| `intentos` | Intentos fallidos. A los 5 deja de servir. |

## Métodos
| Método | Qué hace |
|---|---|
| `crearParaCliente($idCliente, $codigo)` | Guarda el código cifrado. `DATE_ADD(NOW(), INTERVAL 15 MINUTE)` = vence en 15 minutos. |
| `buscarValidoPorCorreo($correo)` | El código más reciente que siga sirviendo: no usado, no vencido y con menos de 5 intentos. |
| `marcarUsado($idCodigo)` | `usado = 1`. |
| `incrementarIntentos($idCodigo)` | `intentos = intentos + 1`. |
