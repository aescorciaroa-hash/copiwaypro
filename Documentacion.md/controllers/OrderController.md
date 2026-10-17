# controllers/OrderController.php
¿No entiendes una palabra? Mira el [glosario](../GLOSARIO.md).

## ¿Para qué sirve?
Se encarga de los pedidos.

## ¿Qué hace?
- recargar los pedidos después del cierre de caja
- hacer pedidos (cliente)
- registrar pedidos por llamada o WhatsApp
- cambiar la dirección de un pedido
- guardar el destino en el mapa del domiciliario
- pasar pedidos a "En preparación"
- pasar pedidos a "Listo"
- tomar pedidos (domiciliario)
- soltar pedidos (domiciliario o administrador)
- salir a entregar ("En camino")
- entregar pedidos con el PIN
- calificar pedidos

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `index()` | recargar los pedidos después del cierre de caja | `GET /api/orders` |
| `store()` | hacer pedidos (cliente) | `POST /api/orders` |
| `storeManual()` | registrar pedidos por llamada o WhatsApp | `POST /api/orders/manual` |
| `updateAddress()` | cambiar la dirección de un pedido | `PATCH /api/orders/{id}/address` |
| `updateDestination()` | guardar el destino en el mapa del domiciliario | `PATCH /api/orders/{id}/destination` |
| `markPreparing()` | pasar pedidos a "En preparación" | `PATCH /api/orders/{id}/preparing` |
| `markReady()` | pasar pedidos a "Listo" | `PATCH /api/orders/{id}/ready` |
| `take()` | tomar pedidos (domiciliario) | `PATCH /api/orders/{id}/take` |
| `release()` | soltar pedidos (domiciliario o administrador) | `PATCH /api/orders/{id}/release` |
| `accept()` | salir a entregar ("En camino") | `PATCH /api/orders/{id}/accept` |
| `deliver()` | entregar pedidos con el PIN | `PATCH /api/orders/{id}/deliver` |
| `review()` | calificar pedidos | `PATCH /api/orders/{id}/review` |
| `buscarPedido()` (privado) | ayuda a `updateAddress()`, `updateDestination()`, `markPreparing()`, `markReady()`, `take()`, `release()`, `accept()`, `deliver()` | — |
| `responderPedido()` (privado) | ayuda a `updateAddress()`, `updateDestination()`, `markPreparing()`, `markReady()`, `take()`, `release()`, `accept()`, `deliver()` | — |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** AdminDashboard.tsx (después del cierre de caja); ClientDashboard.tsx (botón de confirmar pedido); AdminDashboard.tsx; DeliveryDashboard.tsx; KitchenDashboard.tsx y AdminDashboard.tsx; DeliveryDashboard.tsx y OrdersSection.tsx; HistorySection.tsx.
- **Usa los modelos:** `PedidoService`.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Pedidos (listar, crear, cambios de estado y resena). Los roles ya se validan en config/rutas.php."* |
| 6 | `require_once __DIR__ . '/../models/PedidoService.php';` | Trae `models/PedidoService.php`. Ese archivo, a su vez, trae `Pedido.php`, `Configuracion.php` e `Ingrediente.php`; por eso aquí se puede usar `new Pedido()`. |
| 8 | `class OrderController` | Crea la clase `OrderController`: un grupo de funciones que trabajan juntas. |
| 9 | `{` | Abre la clase `OrderController`. |
| 10 | `private $pedidoModel;` | Cajita `$pedidoModel` de la clase: aquí se guarda el modelo `Pedido`. |
| 11 | `private $pedidoService;` | Cajita `$pedidoService` de la clase: aquí se guarda el modelo `PedidoService`. |
| 12 | `private $datos;` | Cajita `$datos` de la clase: aquí se guardan los datos que mandó la pantalla. |
| 14 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 15 | `{` | Abre la función `__construct()`. |
| 16 | `$this->pedidoModel = new Pedido();` | Crea el modelo `Pedido` y lo guarda en `$this->pedidoModel`, para usarlo en las funciones de abajo. |
| 17 | `$this->pedidoService = new PedidoService();` | Crea el modelo `PedidoService` y lo guarda en `$this->pedidoService`, para usarlo en las funciones de abajo. |
| 18 | `$this->datos = entrada();` | Lee lo que mandó la pantalla (`entrada()` de `helpers.php`) y lo guarda en `$this->datos`. |
| 19 | `}` | Cierra la función `__construct()`. |
| 21 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Busca el pedido por su codigo; si no existe responde 404."* |
| 22 | `private function buscarPedido($id)` | Función `buscarPedido($id)` (privada): busca el pedido y, si no existe, responde 404. La usan las funciones de cambio de estado de abajo. |
| 23 | `{` | Abre la función `buscarPedido()`. |
| 24 | `$pedido = $this->pedidoModel->buscarCrudo($id);` | Busca el pedido (`buscarCrudo()` de `models/Pedido.php`) y lo guarda en `$pedido`. |
| 25 | `if (!$pedido) {` | Si no existe... |
| 26 | `responderError('Pedido no encontrado.', 404);` | ...responde 404 "Pedido no encontrado.". |
| 27 | `}` | Cierra el `if`. |
| 28 | `return $pedido;` | Devuelve el pedido. |
| 29 | `}` | Cierra la función `buscarPedido()`. |
| 31 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Responde con el pedido ya actualizado, como lo ve el usuario actual."* |
| 32 | `private function responderPedido($id)` | Función `responderPedido($id)` (privada): responde con el pedido actualizado, como lo ve quien está conectado. |
| 33 | `{` | Abre la función `responderPedido()`. |
| 34 | `responderJson($this->pedidoModel->buscar($id, Auth::rol(), Auth::id()));` | Busca el pedido según el rol y el usuario (`buscar()` de `models/Pedido.php`) y lo responde. |
| 35 | `}` | Cierra la función `responderPedido()`. |
| 37 | `public function index()` | Función `index()`: trae los pedidos. Ruta: `GET /api/orders`. La llama `AdminDashboard.tsx` después del cierre de caja. |
| 38 | `{` | Abre la función `index()`. |
| 39 | `responderJson($this->pedidoModel->porRol(Auth::rol(), Auth::id()));` | Trae los pedidos que puede ver este usuario (`porRol()` de `models/Pedido.php`) y los responde. |
| 40 | `}` | Cierra la función `index()`. |
| 42 | `public function store()` | Función `store()`: crea el pedido del cliente. Ruta: `POST /api/orders`. La llama el checkout del cliente (`ClientDashboard.tsx`). |
| 43 | `{` | Abre la función `store()`. |
| 44 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Las reglas del negocio (horario, pago, inventario) estan en PedidoService::crear."* |
| 45 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 46 | `if (empty($this->datos['items'])) $errores['items'] = ['El campo items es obligatorio.'];` | Si no hay productos, anota el error. |
| 47 | `if (empty($this->datos['address'])) $errores['address'] = ['El campo address es obligatorio.'];` | Si no hay dirección, anota el error. |
| 48 | `if (empty($this->datos['paymentMethod']) \|\| !in_array($this->datos['paymentMethod'], ['cash', 'online'])) $errores['paymentMethod'] = ['El campo paymentMethod no es válido.'];` | Si no hay forma de pago o no es `'cash'` (efectivo) ni `'online'` (en línea) (`in_array` busca en la lista), anota el error. |
| 49 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 50 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 51 | `}` | Cierra el `if`. |
| 53 | `try {` | Intenta... |
| 54 | `responderJson($this->pedidoService->crear(Auth::id(), $this->datos), 201);` | ...crear el pedido (`crear()` de `models/PedidoService.php`): revisa horario, pago e inventario. Responde 201 con el pedido. |
| 55 | `} catch (InvalidArgumentException $e) {` | Si falló porque los datos están mal (`InvalidArgumentException`)... |
| 56 | `responderError($e->getMessage(), 422);` | ...responde 422 con el mensaje. |
| 57 | `} catch (Exception $e) {` | Si falló por otra razón... |
| 58 | `$mensaje = $e->getMessage();` | ...guarda el mensaje en `$mensaje`. |
| 59 | `if (stripos($mensaje, 'cerrada') !== false \|\| stripos($mensaje, 'pausada') !== false) {` | Si el mensaje dice "cerrada" o "pausada" (`stripos` busca un texto; `!== false` = lo encontró)... |
| 60 | `responderError($mensaje, 403);` | ...responde 403 (la tienda está cerrada o pausada). |
| 61 | `} elseif (stripos($mensaje, 'rechazado') !== false) {` | Si el mensaje dice "rechazado"... |
| 62 | `responderError($mensaje, 402);` | ...responde 402 (el pago fue rechazado). |
| 63 | `} else {` | Si es otra cosa (por ejemplo, sin stock)... |
| 64 | `responderError($mensaje, 409);` | ...responde 409. |
| 65 | `}` | Cierra el `else`. |
| 66 | `}` | Cierra el `catch`. |
| 67 | `}` | Cierra la función `store()`. |
| 69 | `public function storeManual()` | Función `storeManual()`: crea un pedido que llegó por llamada o WhatsApp. Ruta: `POST /api/orders/manual`. La llama `AdminDashboard.tsx`. |
| 70 | `{` | Abre la función `storeManual()`. |
| 71 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Pedido por llamada o WhatsApp: se paga en efectivo al entregar."* |
| 72 | `$errores = [];` | Empieza `$errores` como una lista vacía. Ahí se anota cada campo que venga mal. |
| 73 | `if (empty($this->datos['items'])) $errores['items'] = ['Agrega al menos un producto.'];` | Si no hay productos, anota el error. |
| 74 | `if (trim((string) ($this->datos['clientName'] ?? '')) === '') $errores['clientName'] = ['El nombre del cliente es obligatorio.'];` | Si el nombre del cliente está vacío (`trim` quita espacios; `=== ''` = vacío), anota el error. |
| 75 | `if (strlen(preg_replace('/\D/', '', (string) ($this->datos['clientPhone'] ?? ''))) < 7) $errores['clientPhone'] = ['El celular del cliente no es válido.'];` | Deja solo los números del celular (`preg_replace('/\D/', '', ...)` borra todo lo que no sea número). Si quedan menos de 7, anota el error. |
| 76 | `if (trim((string) ($this->datos['address'] ?? '')) === '') $errores['address'] = ['La dirección es obligatoria.'];` | Si la dirección está vacía, anota el error. |
| 77 | `if ($errores) {` | Si se anotó algún error (la lista no está vacía)... |
| 78 | `responderError('Datos inválidos.', 422, $errores);` | ...responde 422 "Datos inválidos." con la lista de errores (React la muestra debajo de cada campo) y termina. |
| 79 | `}` | Cierra el `if`. |
| 81 | `try {` | Intenta... |
| 82 | `responderJson($this->pedidoService->crearManual(Auth::id(), $this->datos), 201);` | ...crear el pedido manual (`crearManual()` de `models/PedidoService.php`) y responder 201. |
| 83 | `} catch (InvalidArgumentException $e) {` | Si los datos están mal... |
| 84 | `responderError($e->getMessage(), 422);` | ...responde 422. |
| 85 | `} catch (Exception $e) {` | Si falló por otra razón... |
| 86 | `$mensaje = $e->getMessage();` | ...guarda el mensaje. |
| 87 | `$cerrada = stripos($mensaje, 'cerrada') !== false \|\| stripos($mensaje, 'pausada') !== false;` | `$cerrada` = `true` si el mensaje dice "cerrada" o "pausada". |
| 88 | `responderError($mensaje, $cerrada ? 403 : 409);` | Responde 403 si la tienda está cerrada; si no, 409 (`? :` = si / si no). |
| 89 | `}` | Cierra el `catch`. |
| 90 | `}` | Cierra la función `storeManual()`. |
| 92 | `public function updateAddress()` | Función `updateAddress()`: cambia la dirección de un pedido. Ruta: `PATCH /api/orders/{id}/address`. Solo el administrador. |
| 93 | `{` | Abre la función `updateAddress()`. |
| 94 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Admin: corrige la direccion de un pedido en curso."* |
| 95 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 96 | `$direccion = (string) ($this->datos['address'] ?? '');` | Guarda en `$direccion` la dirección nueva. |
| 97 | `if (trim($direccion) === '') {` | Si quedó vacía... |
| 98 | `responderError('Datos inválidos.', 422, ['address' => ['La dirección es obligatoria.']]);` | ...responde 422 "La dirección es obligatoria.". |
| 99 | `}` | Cierra el `if`. |
| 100 | `$pedido = $this->buscarPedido($id);` | Busca el pedido (`buscarPedido()` de arriba). Si no existe, ya respondió 404. |
| 101 | `try {` | Intenta... |
| 102 | `$this->pedidoService->cambiarDireccion($pedido['id_pedido'], $direccion);` | ...cambiar la dirección (`cambiarDireccion()` de `models/PedidoService.php`). |
| 103 | `} catch (Exception $e) {` | Si falló (por ejemplo, el pedido ya se entregó)... |
| 104 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 105 | `}` | Cierra el `catch`. |
| 106 | `$this->responderPedido($id);` | Responde con el pedido actualizado (`responderPedido()` de arriba). |
| 107 | `}` | Cierra la función `updateAddress()`. |
| 109 | `public function updateDestination()` | Función `updateDestination()`: guarda el destino que el domiciliario marcó en el mapa. Ruta: `PATCH /api/orders/{id}/destination`. |
| 110 | `{` | Abre la función `updateDestination()`. |
| 111 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Domiciliario: guarda las coordenadas del destino que ubico en su mapa."* |
| 112 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 113 | `if (!isset($this->datos['lat'], $this->datos['lng']) \|\| !is_numeric($this->datos['lat']) \|\| !is_numeric($this->datos['lng'])) {` | Si faltan la latitud o la longitud, o no son números... |
| 114 | `responderError('Datos inválidos.', 422, ['lat' => ['Las coordenadas deben ser numéricas.']]);` | ...responde 422 "Las coordenadas deben ser numéricas.". |
| 115 | `}` | Cierra el `if`. |
| 116 | `$pedido = $this->buscarPedido($id);` | Busca el pedido. |
| 117 | `try {` | Intenta... |
| 118 | `$this->pedidoService->guardarDestino($pedido['id_pedido'], Auth::id(), (float) $this->datos['lat'], (float) $this->datos['lng']);` | ...guardar las coordenadas (`guardarDestino()` de `models/PedidoService.php`). |
| 119 | `} catch (Exception $e) {` | Si falló... |
| 120 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 121 | `}` | Cierra el `catch`. |
| 122 | `$this->responderPedido($id);` | Responde con el pedido actualizado. |
| 123 | `}` | Cierra la función `updateDestination()`. |
| 125 | `public function markPreparing()` | Función `markPreparing()`: pasa el pedido a "En preparación". Ruta: `PATCH /api/orders/{id}/preparing`. La usan cocina y el administrador. |
| 126 | `{` | Abre la función `markPreparing()`. |
| 127 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cocina: Pendiente -> En Preparacion"* |
| 128 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 129 | `$idAyudante = Auth::rol() === 'kitchen' ? Auth::id() : null;` | Si quien lo hace es de cocina, guarda su número en `$idAyudante` (para saber quién lo preparó); si no, `null`. |
| 130 | `$pedido = $this->buscarPedido($id);` | Busca el pedido. |
| 131 | `try {` | Intenta... |
| 132 | `$this->pedidoService->marcarPreparando($pedido['id_pedido'], $idAyudante);` | ...cambiar el estado (`marcarPreparando()` de `models/PedidoService.php`). |
| 133 | `} catch (Exception $e) {` | Si falló (por ejemplo, el pedido no estaba pendiente)... |
| 134 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 135 | `}` | Cierra el `catch`. |
| 136 | `$this->responderPedido($id);` | Responde con el pedido actualizado. |
| 137 | `}` | Cierra la función `markPreparing()`. |
| 139 | `public function markReady()` | Función `markReady()`: pasa el pedido a "Listo". Ruta: `PATCH /api/orders/{id}/ready`. |
| 140 | `{` | Abre la función `markReady()`. |
| 141 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cocina: -> Listos"* |
| 142 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 143 | `$idAyudante = Auth::rol() === 'kitchen' ? Auth::id() : null;` | Guarda quién de cocina lo hace (o `null`). |
| 144 | `$pedido = $this->buscarPedido($id);` | Busca el pedido. |
| 145 | `try {` | Intenta... |
| 146 | `$this->pedidoService->marcarListo($pedido['id_pedido'], $idAyudante);` | ...cambiar el estado (`marcarListo()`). |
| 147 | `} catch (Exception $e) {` | Si falló... |
| 148 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 149 | `}` | Cierra el `catch`. |
| 150 | `$this->responderPedido($id);` | Responde con el pedido actualizado. |
| 151 | `}` | Cierra la función `markReady()`. |
| 153 | `public function take()` | Función `take()`: el domiciliario toma un pedido listo. Ruta: `PATCH /api/orders/{id}/take`. |
| 154 | `{` | Abre la función `take()`. |
| 155 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Domiciliario toma un pedido 'Listos' (queda asignado, sigue en Listos)"* |
| 156 | `$id = $_GET['id'];` | Guarda en `$id` el código del pedido. |
| 157 | `$pedido = $this->buscarPedido($id);` | Busca el pedido. |
| 158 | `try {` | Intenta... |
| 159 | `$this->pedidoService->tomarPedido($pedido['id_pedido'], Auth::id());` | ...asignárselo al domiciliario (`tomarPedido()`). |
| 160 | `} catch (Exception $e) {` | Si falló (por ejemplo, otro ya lo tomó)... |
| 161 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 162 | `}` | Cierra el `catch`. |
| 163 | `$this->responderPedido($id);` | Responde con el pedido actualizado. |
| 164 | `}` | Cierra la función `take()`. |
| 166 | `public function release()` | Función `release()`: suelta un pedido para que lo tome otro domiciliario. Ruta: `PATCH /api/orders/{id}/release`. |
| 167 | `{` | Abre la función `release()`. |
| 168 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Domiciliario suelta su pedido (o el admin lo reasigna)"* |
| 169 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 170 | `$pedido = $this->buscarPedido($id);` | Busca el pedido. |
| 171 | `try {` | Intenta... |
| 172 | `$this->pedidoService->liberarPedido($pedido['id_pedido'], Auth::rol(), Auth::id());` | ...soltarlo (`liberarPedido()`), diciendo quién lo hace (rol y número). |
| 173 | `} catch (Exception $e) {` | Si falló... |
| 174 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 175 | `}` | Cierra el `catch`. |
| 176 | `$this->responderPedido($id);` | Responde con el pedido actualizado. |
| 177 | `}` | Cierra la función `release()`. |
| 179 | `public function accept()` | Función `accept()`: el domiciliario sale a entregar ("En camino"). Ruta: `PATCH /api/orders/{id}/accept`. |
| 180 | `{` | Abre la función `accept()`. |
| 181 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Domiciliario: Listos -> En Camino"* |
| 182 | `$id = $_GET['id'];` | Guarda en `$id` el número que viene en la dirección (ej. el `6` de `/api/products/6`). Lo puso `cargarControlador()` de `helpers.php`. |
| 183 | `$pedido = $this->buscarPedido($id);` | Busca el pedido. |
| 184 | `try {` | Intenta... |
| 185 | `$this->pedidoService->aceptarEntrega($pedido['id_pedido'], Auth::id());` | ...cambiar el estado a "En camino" (`aceptarEntrega()`). |
| 186 | `} catch (Exception $e) {` | Si falló... |
| 187 | `responderError($e->getMessage(), 409);` | ...responde 409. |
| 188 | `}` | Cierra el `catch`. |
| 189 | `$this->responderPedido($id);` | Responde con el pedido actualizado. |
| 190 | `}` | Cierra la función `accept()`. |
| 192 | `public function deliver()` | Función `deliver()`: entrega el pedido con el PIN. Ruta: `PATCH /api/orders/{id}/deliver`. |
| 193 | `{` | Abre la función `deliver()`. |
| 194 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Entrega solo con PIN valido -> Entregado"* |
| 195 | `$id  = $_GET['id'];` | Guarda en `$id` el código del pedido. |
| 196 | `$pin = (string) ($this->datos['pin'] ?? '');` | Guarda en `$pin` el PIN que escribió el domiciliario. |
| 197 | `if ($pin === '') {` | Si no escribió PIN... |
| 198 | `responderError('El PIN es obligatorio.', 422);` | ...responde 422 "El PIN es obligatorio.". |
| 199 | `}` | Cierra el `if`. |
| 200 | `$pedido = $this->buscarPedido($id);` | Busca el pedido. |
| 201 | `try {` | Intenta... |
| 202 | `$this->pedidoService->confirmarEntrega($pedido['id_pedido'], Auth::id(), $pin);` | ...confirmar la entrega (`confirmarEntrega()` de `models/PedidoService.php`): revisa que el PIN sea correcto. |
| 203 | `} catch (Exception $e) {` | Si falló (por ejemplo, PIN incorrecto)... |
| 204 | `responderError($e->getMessage(), 409);` | ...responde 409 con el mensaje. |
| 205 | `}` | Cierra el `catch`. |
| 206 | `$this->responderPedido($id);` | Responde con el pedido actualizado. |
| 207 | `}` | Cierra la función `deliver()`. |
| 209 | `public function review()` | Función `review()`: el cliente califica un pedido. Ruta: `PATCH /api/orders/{id}/review`. La llama `HistorySection.tsx`. |
| 210 | `{` | Abre la función `review()`. |
| 211 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El cliente califica un pedido ya entregado."* |
| 212 | `$id         = $_GET['id'];` | Guarda en `$id` el código del pedido. |
| 213 | `$puntaje    = (int) ($this->datos['rating'] ?? 0);` | Guarda en `$puntaje` las estrellas (número entero; si no mandó, 0). |
| 214 | `$comentario = (string) ($this->datos['reviewText'] ?? '');` | Guarda en `$comentario` el comentario. |
| 216 | `$pedido = $this->pedidoModel->buscarCrudo($id);` | Busca el pedido. |
| 217 | `if (!$pedido \|\| $pedido['id_cliente'] !== Auth::id()) {` | Si no existe o no es de este cliente... |
| 218 | `responderError('Pedido no encontrado.', 404);` | ...responde 404 "Pedido no encontrado.". |
| 219 | `}` | Cierra el `if`. |
| 220 | `if ($pedido['estado'] !== 'entregado') {` | Si el pedido todavía no se entregó... |
| 221 | `responderError('Solo puedes calificar un pedido ya entregado.', 409);` | ...responde 409 "Solo puedes calificar un pedido ya entregado.". |
| 222 | `}` | Cierra el `if`. |
| 223 | `if ($puntaje < 1 \|\| $puntaje > 5) {` | Si las estrellas son menos de 1 o más de 5... |
| 224 | `responderError('La calificación debe estar entre 1 y 5.', 422);` | ...responde 422 "La calificación debe estar entre 1 y 5.". |
| 225 | `}` | Cierra el `if`. |
| 227 | `$this->pedidoService->calificar($pedido['id_pedido'], $puntaje, $comentario);` | Guarda la calificación (`calificar()` de `models/PedidoService.php`). |
| 228 | `responderJson($this->pedidoModel->buscar($id, 'client', Auth::id()));` | Responde con el pedido como lo ve el cliente. |
| 229 | `}` | Cierra la función `review()`. |
| 230 | `}` | Cierra la clase `OrderController`. |
| 232 | `$controller = new OrderController();` | Crea el controlador. Al hacer `new OrderController()` se ejecuta su `__construct()`. |
| 234 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 236 | `if ($accion === 'index') {` | Si la acción es `'index'`... |
| 237 | `$controller->index();` | ...llama al método `index()` de arriba. |
| 238 | `} elseif ($accion === 'store') {` | Si no, si la acción es `'store'`... |
| 239 | `$controller->store();` | ...llama al método `store()` de arriba. |
| 240 | `} elseif ($accion === 'storeManual') {` | Si no, si la acción es `'storeManual'`... |
| 241 | `$controller->storeManual();` | ...llama al método `storeManual()` de arriba. |
| 242 | `} elseif ($accion === 'updateAddress') {` | Si no, si la acción es `'updateAddress'`... |
| 243 | `$controller->updateAddress();` | ...llama al método `updateAddress()` de arriba. |
| 244 | `} elseif ($accion === 'updateDestination') {` | Si no, si la acción es `'updateDestination'`... |
| 245 | `$controller->updateDestination();` | ...llama al método `updateDestination()` de arriba. |
| 246 | `} elseif ($accion === 'markPreparing') {` | Si no, si la acción es `'markPreparing'`... |
| 247 | `$controller->markPreparing();` | ...llama al método `markPreparing()` de arriba. |
| 248 | `} elseif ($accion === 'markReady') {` | Si no, si la acción es `'markReady'`... |
| 249 | `$controller->markReady();` | ...llama al método `markReady()` de arriba. |
| 250 | `} elseif ($accion === 'take') {` | Si no, si la acción es `'take'`... |
| 251 | `$controller->take();` | ...llama al método `take()` de arriba. |
| 252 | `} elseif ($accion === 'release') {` | Si no, si la acción es `'release'`... |
| 253 | `$controller->release();` | ...llama al método `release()` de arriba. |
| 254 | `} elseif ($accion === 'accept') {` | Si no, si la acción es `'accept'`... |
| 255 | `$controller->accept();` | ...llama al método `accept()` de arriba. |
| 256 | `} elseif ($accion === 'deliver') {` | Si no, si la acción es `'deliver'`... |
| 257 | `$controller->deliver();` | ...llama al método `deliver()` de arriba. |
| 258 | `} elseif ($accion === 'review') {` | Si no, si la acción es `'review'`... |
| 259 | `$controller->review();` | ...llama al método `review()` de arriba. |
| 260 | `} else {` | Si no es ninguna de las anteriores... |
| 261 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 262 | `}` | Cierra el `else`. |
| 263 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos | `Failed to open stream` |
| el `require_once` de `PedidoService.php` | todas sus acciones | `Class "Pedido" not found` |
| el método `index()` | recargar los pedidos después del cierre de caja | `Call to undefined method OrderController::index()` |
| el método `store()` | hacer pedidos (cliente) | `Call to undefined method OrderController::store()` |
| el método `storeManual()` | registrar pedidos por llamada o WhatsApp | `Call to undefined method OrderController::storeManual()` |
| el método `updateAddress()` | cambiar la dirección de un pedido | `Call to undefined method OrderController::updateAddress()` |
| el método `updateDestination()` | guardar el destino en el mapa del domiciliario | `Call to undefined method OrderController::updateDestination()` |
| el método `markPreparing()` | pasar pedidos a "En preparación" | `Call to undefined method OrderController::markPreparing()` |
| el método `markReady()` | pasar pedidos a "Listo" | `Call to undefined method OrderController::markReady()` |
| el método `take()` | tomar pedidos (domiciliario) | `Call to undefined method OrderController::take()` |
| el método `release()` | soltar pedidos (domiciliario o administrador) | `Call to undefined method OrderController::release()` |
| el método `accept()` | salir a entregar ("En camino") | `Call to undefined method OrderController::accept()` |
| el método `deliver()` | entregar pedidos con el PIN | `Call to undefined method OrderController::deliver()` |
| el método `review()` | calificar pedidos | `Call to undefined method OrderController::review()` |
| el método `buscarPedido()` | cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN | `Call to undefined method OrderController::buscarPedido()` |
| el método `responderPedido()` | cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario o administrador), salir a entregar ("En camino"), entregar pedidos con el PIN | `Call to undefined method OrderController::responderPedido()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
