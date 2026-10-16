# models/IntentoLogin.php

## ¿Para qué sirve?
Protege el login contra quien intenta adivinar contraseñas: registra cada intento y bloquea si hubo
**demasiados fallos seguidos** (tabla `INTENTO_LOGIN`).

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | `AuthController.php` (acción `login`) |
| → usa | Sus constantes `MAXIMO_INTENTOS` y `VENTANA_MINUTOS` |
| → tabla | `INTENTO_LOGIN` |

## Constantes de la clase
| Variable | Por defecto | Para qué |
|---|---|---|
| `MAXIMO_INTENTOS` | 5 | Cuántos fallos se permiten. |
| `VENTANA_MINUTOS` | 15 | En cuántos minutos se cuentan. |

## Métodos
| Método | Qué hace |
|---|---|
| `registrar($identificador, $ip, $exitoso)` | Guarda un intento: correo, IP y si funcionó (1) o no (0). |
| `contarFallosRecientes($identificador, $ip)` | Cuenta los fallos de ese correo **o** esa IP en los últimos minutos. |
| `excedeLimite($identificador, $ip)` | `true` si los fallos llegan al máximo. Entonces el login responde **429**. |

```sql
WHERE (identificador = ? OR ip = ?)
  AND exitoso = 0
  AND fecha_hora > (NOW() - INTERVAL ? MINUTE)
```
"Fallos de este correo o de esta IP, desde hace X minutos hasta ahora."

## ¿Qué pasa si se borra?

**Si se borra el archivo completo:** sale `Failed to open stream: No such file or directory` (…`models/IntentoLogin.php`).
Lo cargan con `require_once`: `controllers/AuthController.php`. Dejan de funcionar:
  - `POST /api/auth/login` → Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario).
  - `POST /api/auth/logout` → El botón "Cerrar sesión" de todos los paneles deja de funcionar.
  - `GET /api/auth/csrf` → React no recibe el token CSRF: ningún formulario puede guardar (todo responde 419).
  - `POST /api/auth/register` → No se pueden crear cuentas de cliente (pantalla "Crear cuenta").
  - `POST /api/auth/forgot-password/request` → No llega el código para recuperar la contraseña.
  - `POST /api/auth/forgot-password/reset` → No se puede cambiar la contraseña con el código.

**Si se borra un método:** sale `Call to undefined method IntentoLogin::nombre()` (error 500), solo en lo que usa ese método:

| Método | Lo llaman | Qué deja de funcionar si se borra |
|---|---|---|
| `registrar()` | `AuthController::login()` | `POST /api/auth/login` → Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario). |
| `contarFallosRecientes()` | `IntentoLogin::excedeLimite()` | `POST /api/auth/login` → Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario). |
| `excedeLimite()` | `AuthController::login()` | `POST /api/auth/login` → Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario). |
| `__construct()` | `new IntentoLogin()` | Deja de recibir la conexión `$conn`: sale `Call to a member function prepare() on null` en todo lo que usa IntentoLogin. |

**Si se borra una constante** (`MAXIMO_INTENTOS`, `VENTANA_MINUTOS`): sale `Undefined constant IntentoLogin::NOMBRE` en lo que la usa.
