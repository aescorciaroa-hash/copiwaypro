# controllers/AuthController.php

## ¿Para qué sirve?
Maneja todo lo de **cuentas y sesión**: registrarse, iniciar sesión, cerrar sesión, saber quién está
conectado y recuperar la contraseña.

## ¿Con qué se conecta?
| Ruta (config/rutas.php) | Método | Pantalla de React que la usa |
|---|---|---|
| `POST /api/auth/register` | `register` | `src/pages/Register.tsx` |
| `POST /api/auth/login` | `login` | `src/pages/Login.tsx`, `KitchenDashboard.tsx`, `DeliveryDashboard.tsx` |
| `POST /api/auth/logout` | `logout` | Los 4 paneles (botón "Cerrar sesión") |
| `GET /api/auth/csrf` | `csrf` | `src/components/SyncDatos.tsx` y `src/servicios/api.ts` |
| `POST /api/auth/forgot-password/request` | `forgotPasswordRequest` | `src/pages/ForgotPassword.tsx` |
| `POST /api/auth/forgot-password/reset` | `forgotPasswordReset` | `src/pages/ForgotPassword.tsx` |

| Usa | Para qué |
|---|---|
| `Auth` (`models/Auth.php`) | Iniciar/cerrar sesión, saber el rol. |
| `Session::csrf()` | Entregar el token CSRF a React. |
| `Cliente` (modelo) | Crear clientes, buscar por correo, cambiar contraseña. |
| `CodigoVerificacion` (modelo) | Códigos para recuperar la contraseña. |
| `IntentoLogin` (modelo) | Bloquear después de muchos intentos fallidos. |
| `CorreoService` | Enviar el código por correo. |
| `correoUsadoEnCualquierTabla()` | Que nadie se registre con un correo ya usado. |

## Variables importantes
| Variable | De dónde viene | Para qué sirve |
|---|---|---|
| Método | `$_GET['accion']` (lo pone el router) | Saber qué rama ejecutar. |
| `$this->datos` | `entrada()` = lo que envió React | `$this->datos['email']`, `$this->datos['password']`, etc. |
| `$clienteModel`, `$codigoModel`, `$intentoModel` | `new ...()` | Hablar con las tablas CLIENTE, CODIGO_VERIFICACION e INTENTO_LOGIN. |
| `$usuario` | `Auth::login()` / `Auth::intentarLogin()` | Datos del usuario conectado (`id`, `role`, `name`, `email`) que se envían a React. |

---

## Acción `register` (registro de cliente)
1. Lee los datos (`name`, `phone`, `email`, `birthday`, `password`, `confirmPassword`, `terms`).
2. Valida cada campo. Por ejemplo:
   ```php
   if (empty($this->datos['email']) || !filter_var($this->datos['email'], FILTER_VALIDATE_EMAIL)) ...
   ```
   `filter_var(..., FILTER_VALIDATE_EMAIL)` revisa que el correo tenga formato válido.
3. Exige aceptar los términos (`terms`): es la ley de **Habeas Data** (tratamiento de datos personales).
4. Revisa que las dos contraseñas sean iguales.
5. Revisa que el correo/teléfono no existan → si existen, **409**.
6. `$this->clienteModel->crear([...])` guarda al cliente (con su IP y fecha de aceptación).
7. `Auth::login('client', ...)` lo deja conectado de una vez.
8. Responde **201** con el usuario y un token CSRF nuevo.

## Acción `forgotPasswordRequest` (paso 1: pedir código)
```php
$codigo = (string) random_int(100000, 999999);
```
- Genera un código de 6 dígitos al azar.
- `$this->codigoModel->crearParaCliente()` lo guarda **cifrado** (vence en 15 minutos).
- `CorreoService::enviarCodigoRecuperacion()` lo manda por correo.
- Responde lo mismo exista o no el correo: así nadie puede averiguar qué correos están registrados.
- Solo con `'entorno' => 'local'` (en `config/app.php`), si el correo no se pudo enviar, responde el código en `debugCode` para poder probar.

## Acción `forgotPasswordReset` (paso 2: cambiar contraseña)
1. Valida `email`, `code` y `newPassword` (mínimo 8 caracteres).
2. Busca un código válido (no usado, no vencido, menos de 5 intentos).
3. `password_verify($codigo, $registro['codigo_hash'])` compara el código escrito con el guardado.
   - Si está mal: suma un intento y responde **422**.
4. Marca el código como usado y guarda la nueva contraseña con `password_hash()` (cifrada).

## Acción `login`
```php
$usaPin = !empty($this->datos['pin']);
```
- Si llega `pin` → es **cocina o domiciliario** (`Auth::intentarLoginConPin`).
- Si no → es **admin o cliente** (`Auth::intentarLogin`).

Pasos:
1. Valida el correo (con PIN también acepta solo el usuario, sin `@`) y el PIN de 4 dígitos (`preg_match('/^\d{4}$/', ...)`) o la contraseña.
2. `$this->intentoModel->excedeLimite($email, $ip)`: si hubo demasiados intentos fallidos → **429**.
3. Intenta el login.
4. `$this->intentoModel->registrar(...)` guarda el intento (exitoso o no).
5. Si falló → **401**. Si funcionó → responde el usuario y el token CSRF.

## Acción `logout`
`Auth::logout()` borra la sesión.

## Acción `me`
Devuelve quién está conectado. Si no hay sesión → **401**.

## Acción `csrf`
Devuelve un token CSRF sin exigir sesión. Lo necesita el visitante antes de enviar el formulario de
login o registro.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/csrf`, `POST /api/auth/register`, `POST /api/auth/forgot-password/request`, `POST /api/auth/forgot-password/reset`. | `Failed to open stream: No such file or directory` (…`controllers/AuthController.php`) |
| La línea `require_once __DIR__ . '/../models/Cliente.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Cliente" not found` |
| La línea `require_once __DIR__ . '/../models/CodigoVerificacion.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "CodigoVerificacion" not found` |
| La línea `require_once __DIR__ . '/../models/IntentoLogin.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "IntentoLogin" not found` |
| La línea `require_once __DIR__ . '/../models/CorreoService.php';` | `POST /api/auth/forgot-password/request` | `Class "CorreoService" not found` |
| El método `register()` | No se pueden crear cuentas de cliente (pantalla "Crear cuenta"). | `Call to undefined method AuthController::register()` (500) |
| La rama `$accion === 'register'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/auth/register'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `forgotPasswordRequest()` | No llega el código para recuperar la contraseña. | `Call to undefined method AuthController::forgotPasswordRequest()` (500) |
| La rama `$accion === 'forgotPasswordRequest'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/auth/forgot-password/request'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `forgotPasswordReset()` | No se puede cambiar la contraseña con el código. | `Call to undefined method AuthController::forgotPasswordReset()` (500) |
| La rama `$accion === 'forgotPasswordReset'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/auth/forgot-password/reset'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `login()` | Nadie puede iniciar sesión (pantalla de login y PIN de cocina/domiciliario). | `Call to undefined method AuthController::login()` (500) |
| La rama `$accion === 'login'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/auth/login'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `logout()` | El botón "Cerrar sesión" de todos los paneles deja de funcionar. | `Call to undefined method AuthController::logout()` (500) |
| La rama `$accion === 'logout'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'POST /api/auth/logout'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `csrf()` | React no recibe el token CSRF: ningún formulario puede guardar (todo responde 419). | `Call to undefined method AuthController::csrf()` (500) |
| La rama `$accion === 'csrf'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'GET /api/auth/csrf'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| La línea `$this->clienteModel = ...` del constructor | Las acciones que usan `$this->clienteModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->codigoModel = ...` del constructor | Las acciones que usan `$this->codigoModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->intentoModel = ...` del constructor | Las acciones que usan `$this->intentoModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
