# controllers/StaffController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga del personal (cocina y domiciliarios).

## ¿Qué hace?
- crear personal
- editar personal o darlo de baja
- eliminar personal
- guardar la ubicación del domiciliario

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `store()` | crear personal | `POST /api/staff` |
| `update()` | editar personal o darlo de baja | `PUT /api/staff/{id}` |
| `destroy()` | eliminar personal | `DELETE /api/staff/{id}` |
| `updateLocation()` | guardar la ubicación del domiciliario | `PATCH /api/staff/{id}/location` |
| `buscarEnPersonal()` (privado) | ayuda a `store()`, `update()` | — |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** StaffSection.tsx (Equipo y Personal); DeliveryDashboard.tsx.
- **Usa los modelos:** `Personal`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Personal (ayudantes de cocina y domiciliarios)."* |
| 5 | `require_once __DIR__ . '/../models/Personal.php';` | Trae el archivo `Personal.php` para poder usar la clase `Personal`. |
| 7 | `class StaffController` | Crea la clase `StaffController`: un grupo de funciones que trabajan juntas. |
| 8 | `{` | Abre la clase `StaffController`. |
| 9 | `private $personalModel;` | Cajita `$personalModel` de la clase: aquí se guarda el modelo `Personal`. |
| 10 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 11 | `private $vehiculos;` | Cajita `$vehiculos` de la clase: la lista de vehículos permitidos. |
| 13 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 14 | `{` | Abre la función `__construct()`. |
| 15 | `$this->personalModel = new Personal();` | Crea el modelo `Personal` y lo guarda en `$this->personalModel`, para usarlo en las funciones de abajo. |
| 16 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 17 | `$this->vehiculos = ['moto', 'bicicleta', 'carro', 'a_pie'];` | Guarda en `$this->vehiculos` los vehículos permitidos: moto, bicicleta, carro y a pie. |
| 18 | `}` | Cierra la función `__construct()`. |
| 20 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca en la lista del personal al miembro con ese id."* |
| 21 | `private function buscarEnPersonal($personalModel, $id)` | Función `buscarEnPersonal($personalModel, $id)` (privada): busca en la lista del personal a la persona con ese número. La usan `store()` y `update()`. |
| 22 | `{` | Abre la función `buscarEnPersonal()`. |
| 23 | `foreach ($personalModel->listar() as $miembro) {` | Recorre toda la lista del personal (`listar()` de `models/Personal.php`). Cada persona queda en `$miembro`. |
| 24 | `if ($miembro['id'] === (string) $id) {` | Si su número es igual a `$id`... |
| 25 | `return $miembro;` | ...la devuelve. |
| 26 | `}` | Cierra el `if`. |
| 27 | `}` | Cierra el `foreach`. |
| 28 | `return ['id' => (string) $id];` | Si no la encontró, devuelve solo el número. |
| 29 | `}` | Cierra la función `buscarEnPersonal()`. |
| 31 | `public function store()` | Función `store()`: crea personal (cocina o domiciliario). Ruta: `POST /api/staff`. La llama `StaffSection.tsx`. |
| 32 | `{` | Abre la función `store()`. |
| 33 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 34 | `if (empty($this->datos['name'])) $errores['name'] = ['El campo name es obligatorio.'];` | Si falta el nombre, anota el error. |
| 35 | `if (empty($this->datos['email']) \|\| !filter_var($this->datos['email'], FILTER_VALIDATE_EMAIL)) $errores['email'] = ['El campo email debe ser un correo válido.'];` | Si falta el correo o no es válido, anota el error. |
| 36 | `if (empty($this->datos['password']) \|\| strlen((string) $this->datos['password']) < 8) $errores['password'] = ['El campo password debe tener al menos 8 caracteres.'];` | Si falta la contraseña o tiene menos de 8 caracteres, anota el error. |
| 37 | `if (empty($this->datos['role']) \|\| !in_array($this->datos['role'], ['Ayudante de cocina', 'Domiciliario'])) $errores['role'] = ['El campo role no es válido.'];` | Si falta el rol o no es "Ayudante de cocina" ni "Domiciliario", anota el error. |
| 38 | `if (($this->datos['role'] ?? null) === 'Domiciliario' && !empty($this->datos['vehicle']) && !in_array($this->datos['vehicle'], $this->vehiculos)) $errores['vehicle'] = ['El campo vehicle no es válido.'];` | Si es domiciliario, mandó vehículo y no está en la lista permitida, anota el error. |
| 39 | `if (empty($this->datos['pin']) \|\| !preg_match('/^\d{4}$/', (string) $this->datos['pin'])) $errores['pin'] = ['El PIN debe tener exactamente 4 dígitos.'];` | Si falta el PIN o no son exactamente 4 números, anota el error. |
| 40 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 41 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 42 | `}` | Cierra el `if`. |
| 44 | `if (correoUsadoEnCualquierTabla($this->datos['email'])) {` | Si el correo ya lo usa otra cuenta (`correoUsadoEnCualquierTabla()` de `helpers.php`)... |
| 45 | `responderError('Ya existe una cuenta con ese correo.', 409);` | ...responde 409 "Ya existe una cuenta con ese correo.". |
| 46 | `}` | Cierra el `if`. |
| 48 | `try {` | Intenta... |
| 49 | `$id = $this->personalModel->crear($this->datos, Auth::id());` | ...crear la persona (`crear()` de `models/Personal.php`) y guarda su número en `$id`. `Auth::id()` = el administrador que la crea. |
| 50 | `} catch (Exception $e) {` | Si falló... |
| 51 | `responderError($e->getMessage(), 422);` | ...responde 422. |
| 52 | `}` | Cierra el `catch`. |
| 53 | `responderJson($this->buscarEnPersonal($this->personalModel, $id), 201);` | Busca a la persona nueva (función de arriba) y responde 201 (creado). |
| 54 | `}` | Cierra la función `store()`. |
| 56 | `public function update()` | Función `update()`: edita personal o lo da de baja. Ruta: `PUT /api/staff/{id}`. |
| 57 | `{` | Abre la función `update()`. |
| 58 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 60 | `if (!empty($this->datos['password']) && strlen((string) $this->datos['password']) < 8) {` | Si mandó contraseña nueva y tiene menos de 8 caracteres... |
| 61 | `responderError('Datos inválidos.', 422, ['password' => ['El campo password debe tener al menos 8 caracteres.']]);` | ...responde 422. |
| 62 | `}` | Cierra el `if`. |
| 63 | `if (!empty($this->datos['email']) && correoUsadoEnCualquierTabla($this->datos['email'], $id)) {` | Si mandó correo y ya lo usa otra cuenta... |
| 64 | `responderError('Ya existe una cuenta con ese correo.', 409);` | ...responde 409. |
| 65 | `}` | Cierra el `if`. |
| 66 | `if (!empty($this->datos['vehicle']) && !in_array($this->datos['vehicle'], $this->vehiculos)) {` | Si mandó vehículo y no está permitido... |
| 67 | `responderError('Datos inválidos.', 422, ['vehicle' => ['El campo vehicle no es válido.']]);` | ...responde 422. |
| 68 | `}` | Cierra el `if`. |
| 69 | `if (!empty($this->datos['pin']) && !preg_match('/^\d{4}$/', (string) $this->datos['pin'])) {` | Si mandó PIN y no son 4 números... |
| 70 | `responderError('Datos inválidos.', 422, ['pin' => ['El PIN debe tener exactamente 4 dígitos.']]);` | ...responde 422. |
| 71 | `}` | Cierra el `if`. |
| 73 | `if ($this->personalModel->actualizar($id, $this->datos) === null) {` | Guarda los cambios (`actualizar()` de `models/Personal.php`). Si devuelve `null`, la persona no existe... |
| 74 | `responderError('Miembro de staff no encontrado.', 404);` | ...responde 404 "Miembro de staff no encontrado.". |
| 75 | `}` | Cierra el `if`. |
| 76 | `responderJson($this->buscarEnPersonal($this->personalModel, $id));` | Responde con la persona actualizada. |
| 77 | `}` | Cierra la función `update()`. |
| 79 | `public function destroy()` | Función `destroy()`: elimina personal. Ruta: `DELETE /api/staff/{id}`. Solo si nunca tuvo pedidos. |
| 80 | `{` | Abre la función `destroy()`. |
| 81 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Borrado permanente, solo si no tiene historial (si lo tiene, se da de baja con PUT active=false)."* |
| 82 | *(comentario)* | Comentario: no se ejecuta. Dice: *"'role' es obligatorio: el mismo id puede existir en cocina y en domicilio."* |
| 83 | `$id  = $_GET['id'];` | Guarda en `$id` el número. |
| 84 | `$rol = $_GET['role'] ?? null;` | Guarda en `$rol` si es de cocina o domiciliario (viene en la dirección: `?role=...`). Si no viene, `null`. |
| 85 | `try {` | Intenta... |
| 86 | `if (!$this->personalModel->eliminarPermanente($id, $rol)) {` | ...eliminar (`eliminarPermanente()` de `models/Personal.php`). Si no lo encontró (`!`)... |
| 87 | `responderError('Miembro de staff no encontrado.', 404);` | ...responde 404. |
| 88 | `}` | Cierra el `if`. |
| 89 | `} catch (InvalidArgumentException $e) {` | Si los datos están mal (por ejemplo, no mandó el rol)... |
| 90 | `responderError($e->getMessage(), 422);` | ...responde 422. |
| 91 | `} catch (Exception $e) {` | Si falló por otra razón (por ejemplo, tiene pedidos)... |
| 92 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 93 | `}` | Cierra el `catch`. |
| 94 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 95 | `}` | Cierra la función `destroy()`. |
| 97 | `public function updateLocation()` | Función `updateLocation()`: guarda la ubicación GPS del domiciliario. Ruta: `PATCH /api/staff/{id}/location`. La llama `DeliveryDashboard.tsx` cada pocos segundos. |
| 98 | `{` | Abre la función `updateLocation()`. |
| 99 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 101 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El domiciliario solo puede actualizar su propia ubicacion."* |
| 102 | `if (!Auth::check() \|\| Auth::rol() !== 'delivery' \|\| (string) Auth::id() !== (string) $id) {` | Si no hay sesión, o no es domiciliario, o no es su propio número... |
| 103 | `responderError('No autorizado para este recurso.', 403);` | ...responde 403 "No autorizado para este recurso.". |
| 104 | `}` | Cierra el `if`. |
| 106 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 107 | `if (!isset($this->datos['lat']) \|\| !is_numeric($this->datos['lat'])) $errores['lat'] = ['El campo lat debe ser numérico.'];` | Si falta la latitud o no es un número, anota el error. |
| 108 | `if (!isset($this->datos['lng']) \|\| !is_numeric($this->datos['lng'])) $errores['lng'] = ['El campo lng debe ser numérico.'];` | Si falta la longitud o no es un número, anota el error. |
| 109 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 110 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 111 | `}` | Cierra el `if`. |
| 113 | `if (!$this->personalModel->actualizarUbicacion($id, (float) $this->datos['lat'], (float) $this->datos['lng'])) {` | Guarda la ubicación (`actualizarUbicacion()` de `models/Personal.php`). Si no lo encontró... |
| 114 | `responderError('Domiciliario no encontrado.', 404);` | ...responde 404 "Domiciliario no encontrado.". |
| 115 | `}` | Cierra el `if`. |
| 116 | `responderJson(['ok' => true]);` | Responde `ok`. |
| 117 | `}` | Cierra la función `updateLocation()`. |
| 118 | `}` | Cierra la clase `StaffController`. |
| 120 | `$controller = new StaffController();` | Crea el controlador. Al hacer `new StaffController()` se ejecuta su `__construct()`. |
| 122 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 124 | `if ($accion === 'store') {` | Si la acción es `'store'`... |
| 125 | `$controller->store();` | ...llama al método `store()` de arriba. |
| 126 | `} elseif ($accion === 'update') {` | Si no, si la acción es `'update'`... |
| 127 | `$controller->update();` | ...llama al método `update()` de arriba. |
| 128 | `} elseif ($accion === 'destroy') {` | Si no, si la acción es `'destroy'`... |
| 129 | `$controller->destroy();` | ...llama al método `destroy()` de arriba. |
| 130 | `} elseif ($accion === 'updateLocation') {` | Si no, si la acción es `'updateLocation'`... |
| 131 | `$controller->updateLocation();` | ...llama al método `updateLocation()` de arriba. |
| 132 | `} else {` | Si no es ninguna de las anteriores... |
| 133 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 134 | `}` | Cierra el `else`. |
| 135 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | crear personal, editar personal o darlo de baja, eliminar personal, guardar la ubicación del domiciliario | `Failed to open stream` |
| el `require_once` de `Personal.php` | todas sus acciones | `Class "Personal" not found` |
| el método `store()` | crear personal | `Call to undefined method StaffController::store()` |
| el método `update()` | editar personal o darlo de baja | `Call to undefined method StaffController::update()` |
| el método `destroy()` | eliminar personal | `Call to undefined method StaffController::destroy()` |
| el método `updateLocation()` | guardar la ubicación del domiciliario | `Call to undefined method StaffController::updateLocation()` |
| el método `buscarEnPersonal()` | crear personal, editar personal o darlo de baja | `Call to undefined method StaffController::buscarEnPersonal()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
