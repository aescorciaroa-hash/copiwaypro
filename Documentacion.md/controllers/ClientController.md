# controllers/ClientController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga del perfil del cliente.

## ¿Qué hace?
- editar el perfil del cliente
- cambiar la contraseña del cliente

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `update()` | editar el perfil del cliente | `PUT /api/clients/{id}` |
| `changePassword()` | cambiar la contraseña del cliente | `PUT /api/clients/{id}/password` |
| `autorizarPropioOAdmin()` (privado) | ayuda a `update()` | — |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** ClientDashboard.tsx (Mi Perfil) y ThemeContext.tsx; ClientDashboard.tsx (Mi Perfil).
- **Usa los modelos:** `Cliente`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Clientes (perfil, contrasena y notificaciones)."* |
| 5 | `require_once __DIR__ . '/../models/Cliente.php';` | Trae el archivo `Cliente.php` para poder usar la clase `Cliente`. |
| 7 | `class ClientController` | Crea la clase `ClientController`: un grupo de funciones que trabajan juntas. |
| 8 | `{` | Abre la clase `ClientController`. |
| 9 | `private $clienteModel;` | Cajita `$clienteModel` de la clase: aquí se guarda el modelo `Cliente`. |
| 10 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `$this->clienteModel = new Cliente();` | Crea el modelo `Cliente` y lo guarda en `$this->clienteModel`, para usarlo en las funciones de abajo. |
| 15 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 16 | `}` | Cierra la función `__construct()`. |
| 18 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Solo el propio cliente o un admin pueden ver/editar este cliente."* |
| 19 | `private function autorizarPropioOAdmin($id)` | Función `autorizarPropioOAdmin($id)` (privada: solo se usa dentro de esta clase): revisa que quien edita sea ese mismo cliente o un administrador. |
| 20 | `{` | Abre la función `autorizarPropioOAdmin()`. |
| 21 | `if (!Auth::check()) {` | Si no hay sesión (`Auth::check()` de `models/Auth.php`)... |
| 22 | `responderError('No autenticado.', 401);` | ...responde 401 "No autenticado.". |
| 23 | `}` | Cierra el `if`. |
| 24 | `$esPropio = Auth::rol() === 'client' && (string) Auth::id() === (string) $id;` | `$esPropio` = es cliente **y** su número es igual a `$id` (es su propia cuenta). |
| 25 | `$esAdmin  = Auth::rol() === 'admin';` | `$esAdmin` = es administrador. |
| 26 | `if (!$esPropio && !$esAdmin) {` | Si no es su cuenta **y** tampoco es administrador... |
| 27 | `responderError('No autorizado para este recurso.', 403);` | ...responde 403 "No autorizado para este recurso.". |
| 28 | `}` | Cierra el `if`. |
| 29 | `}` | Cierra la función `autorizarPropioOAdmin()`. |
| 31 | `public function update()` | Función `update()`: edita el perfil de un cliente. Ruta: `PUT /api/clients/{id}`. La llaman Mi Perfil (`ClientDashboard.tsx`) y `ThemeContext.tsx` (guarda el tema). |
| 32 | `{` | Abre la función `update()`. |
| 33 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 34 | `$this->autorizarPropioOAdmin($id);` | Revisa que sea su propia cuenta o un administrador (función de arriba). |
| 35 | `if (!$this->clienteModel->buscar($id)) {` | Si el cliente no existe (`buscar()` de `models/Cliente.php`)... |
| 36 | `responderError('Cliente no encontrado.', 404);` | ...responde 404 "Cliente no encontrado.". |
| 37 | `}` | Cierra el `if`. |
| 39 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El cliente solo puede cambiar estos campos; puntos y total gastado son solo del admin."* |
| 40 | `if (Auth::rol() !== 'admin') {` | Si quien edita **no** es administrador (`!==` = diferente)... |
| 41 | `$permitidos = ['name', 'email', 'phone', 'address', 'birthday', 'cart', 'preferences'];` | ...crea la lista `$permitidos` con los únicos campos que un cliente puede cambiar. |
| 42 | `$soloPermitidos = [];` | Empieza `$soloPermitidos` vacía. |
| 43 | `foreach ($permitidos as $campo) {` | Recorre cada campo permitido. |
| 44 | `if (array_key_exists($campo, $this->datos)) {` | Si ese campo vino en los datos (`array_key_exists` = ¿existe esta clave?)... |
| 45 | `$soloPermitidos[$campo] = $this->datos[$campo];` | ...lo copia a `$soloPermitidos`. |
| 46 | `}` | Cierra el `if`. |
| 47 | `}` | Cierra el `foreach`. |
| 48 | `$this->datos = $soloPermitidos;` | Reemplaza los datos por solo los permitidos. Así un cliente no puede cambiarse sus puntos ni el total gastado. |
| 49 | `}` | Cierra el `if`. |
| 51 | `if (!empty($this->datos['email']) && correoUsadoEnCualquierTabla($this->datos['email'], $id)) {` | Si mandó un correo y ya lo usa otra cuenta (`correoUsadoEnCualquierTabla()` de `helpers.php`)... |
| 52 | `responderError('Ya existe una cuenta con ese correo.', 409);` | ...responde 409 "Ya existe una cuenta con ese correo.". |
| 53 | `}` | Cierra el `if`. |
| 55 | `$this->clienteModel->actualizar($id, $this->datos);` | Guarda los cambios (`actualizar()` de `models/Cliente.php`). |
| 56 | `responderJson($this->clienteModel->buscar($id));` | Responde con el cliente actualizado. |
| 57 | `}` | Cierra la función `update()`. |
| 59 | `public function changePassword()` | Función `changePassword()`: cambia la contraseña del cliente. Ruta: `PUT /api/clients/{id}/password`. La llama Mi Perfil. |
| 60 | `{` | Abre la función `changePassword()`. |
| 61 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 63 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Solo el propio cliente (el admin no conoce la contrasena actual)."* |
| 64 | `if (!Auth::check() \|\| Auth::rol() !== 'client' \|\| (string) Auth::id() !== (string) $id) {` | Si no hay sesión, o no es cliente, o no es su cuenta (`\|\|` = o)... |
| 65 | `responderError('No autorizado para este recurso.', 403);` | ...responde 403 "No autorizado para este recurso.". |
| 66 | `}` | Cierra el `if`. |
| 68 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 69 | `if (empty($this->datos['currentPassword'])) $errores['currentPassword'] = ['La contraseña actual es obligatoria.'];` | Si falta la contraseña actual, anota el error. |
| 70 | `if (empty($this->datos['newPassword']) \|\| strlen((string) $this->datos['newPassword']) < 8) $errores['newPassword'] = ['La nueva contraseña debe tener al menos 8 caracteres.'];` | Si falta la nueva o tiene menos de 8 caracteres, anota el error. |
| 71 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 72 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 73 | `}` | Cierra el `if`. |
| 75 | `$fila = $this->clienteModel->buscarCrudo($id);` | Trae la fila del cliente (`buscarCrudo()` de `models/Cliente.php`) y la guarda en `$fila`. |
| 76 | `if (!$fila) {` | Si no existe... |
| 77 | `responderError('Cliente no encontrado.', 404);` | ...responde 404 "Cliente no encontrado.". |
| 78 | `}` | Cierra el `if`. |
| 79 | `if (!password_verify((string) $this->datos['currentPassword'], $fila['contrasena'])) {` | Si la contraseña actual que escribió no coincide con la guardada (`password_verify`)... |
| 80 | `responderError('La contraseña actual no es correcta.', 422, ['currentPassword' => ['La contraseña actual no es correcta.']]);` | ...responde 422 "La contraseña actual no es correcta." (y lo marca en el campo `currentPassword`). |
| 81 | `}` | Cierra el `if`. |
| 83 | `$this->clienteModel->actualizarContrasena($id, password_hash((string) $this->datos['newPassword'], PASSWORD_DEFAULT));` | Cifra la nueva (`password_hash`) y la guarda (`actualizarContrasena()`). |
| 84 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 85 | `}` | Cierra la función `changePassword()`. |
| 86 | `}` | Cierra la clase `ClientController`. |
| 88 | `$controller = new ClientController();` | Crea el controlador. Al hacer `new ClientController()` se ejecuta su `__construct()`. |
| 90 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 92 | `if ($accion === 'update') {` | Si la acción es `'update'`... |
| 93 | `$controller->update();` | ...llama al método `update()` de arriba. |
| 94 | `} elseif ($accion === 'changePassword') {` | Si no, si la acción es `'changePassword'`... |
| 95 | `$controller->changePassword();` | ...llama al método `changePassword()` de arriba. |
| 96 | `} else {` | Si no es ninguna de las anteriores... |
| 97 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 98 | `}` | Cierra el `else`. |
| 99 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | editar el perfil del cliente, cambiar la contraseña del cliente | `Failed to open stream` |
| el `require_once` de `Cliente.php` | todas sus acciones | `Class "Cliente" not found` |
| el método `update()` | editar el perfil del cliente | `Call to undefined method ClientController::update()` |
| el método `changePassword()` | cambiar la contraseña del cliente | `Call to undefined method ClientController::changePassword()` |
| el método `autorizarPropioOAdmin()` | editar el perfil del cliente | `Call to undefined method ClientController::autorizarPropioOAdmin()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
