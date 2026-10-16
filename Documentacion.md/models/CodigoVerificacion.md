# models/CodigoVerificacion.php

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

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/CodigoVerificacion.php`).
Lo cargan con `require_once`: `controllers/AuthController.php`. Dejan de funcionar:
  - `POST /api/auth/login` → Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario).
  - `POST /api/auth/logout` → El botón "Cerrar sesión" de todos los paneles deja de funcionar.
  - `GET /api/auth/csrf` → React no recibe el token CSRF: ningún formulario puede guardar (todo responde 419).
  - `POST /api/auth/register` → No se pueden crear cuentas de cliente (pantalla "Crear cuenta").
  - `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña.
  - `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código.

**Si se borra un método:** sale `Call to undefined method CodigoVerificacion::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `crearParaCliente()` | `AuthController::forgotPasswordRequest()` | `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña. |
| `buscarValidoPorCorreo()` | `AuthController::forgotPasswordReset()` | `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código. |
| `marcarUsado()` | `AuthController::forgotPasswordReset()` | `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código. |
| `incrementarIntentos()` | `AuthController::forgotPasswordReset()` | `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código. |
| `__construct()` | `new CodigoVerificacion()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa CodigoVerificacion. |
