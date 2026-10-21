# models/Configuracion.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Maneja los ajustes de la tienda (tabla CONFIGURACION_SISTEMA).

## ¿Qué hace?
- lee la configuración de la base de datos
- trae los ajustes de la tienda
- guarda los ajustes de la tienda
- agrega una categoría del menú
- elimina una categoría (si ningún producto la usa)
- dice si la tienda está abierta
- dice cuánto cuesta el domicilio
- dice cuál es la bolsa de empaque
- dice cuánto vale un punto y el mínimo para usarlos
- dice el porcentaje de ganancia

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `get()` | lee la configuración de la base de datos | `Configuracion::actualizar()`, `Configuracion::idIngredienteBolsaGlobal()`, `Configuracion::margenGanancia()`, `Configuracion::obtener()`, `Configuracion::reglasPuntos()`, `Configuracion::tarifaDomicilio()` |
| `obtener()` | trae los ajustes de la tienda | `Configuracion::tiendaAbiertaAhora()`, `PaginaController::mostrar()`, `SettingController::addCategory()`, `SettingController::removeCategory()`, `SettingController::update()`, `SyncController::index()` |
| `actualizar()` | guarda los ajustes de la tienda | `SettingController::update()` |
| `agregarCategoria()` | agrega una categoría del menú | `SettingController::addCategory()` |
| `eliminarCategoria()` | elimina una categoría (si ningún producto la usa) | `SettingController::removeCategory()` |
| `tiendaAbiertaAhora()` | dice si la tienda está abierta | `PedidoService::cotizar()`, `PedidoService::crear()`, `PedidoService::crearManual()` |
| `aMinutos()` (privado) | convierte una hora en minutos | `Configuracion::tiendaAbiertaAhora()` |
| `tarifaDomicilio()` | dice cuánto cuesta el domicilio | — |
| `idIngredienteBolsaGlobal()` | dice cuál es la bolsa de empaque | — |
| `reglasPuntos()` | dice cuánto vale un punto y el mínimo para usarlos | — |
| `margenGanancia()` | dice el porcentaje de ganancia | — |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/PaginaController.php`, `controllers/SettingController.php`, `controllers/SyncController.php`, `models/PedidoService.php`, `models/CorreoService.php` (los datos del negocio para el pie del correo de recuperación).
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Modelo Configuracion (CONFIGURACION_SISTEMA y categorias del menu)."* |
| 5 | `class Configuracion` | Crea la clase `Configuracion`: maneja los ajustes de la tienda (tabla `CONFIGURACION_SISTEMA`) y las categorías del menú. |
| 6 | `{` | Abre la clase `Configuracion`. |
| 7 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 9 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 10 | `{` | Abre la función `__construct()`. |
| 11 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 12 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 13 | `}` | Cierra la función `__construct()`. |
| 15 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Fila unica de CONFIGURACION_SISTEMA (todas las columnas o solo una)."* |
| 16 | `public function get($columna = '*')` | Método `get($columna)`: lee la configuración de la base de datos (toda, o solo una columna). Por defecto `'*'` = todas. |
| 17 | `{` | Abre la función `get()`. |
| 18 | `$res = $this->conn->query("SELECT {$columna} FROM CONFIGURACION_SISTEMA LIMIT 1");` | Hace la consulta directamente (`query`, no tiene `?`): "trae esa columna de `CONFIGURACION_SISTEMA`, solo una fila". Lo guarda en `$res`. |
| 19 | `return $res->fetch_assoc();` | Devuelve la fila. |
| 20 | `}` | Cierra la función `get()`. |
| 22 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Configuracion con el formato que usa el frontend."* |
| 23 | `public function obtener()` | Método `obtener()`: trae los ajustes con los nombres que usa React. Lo usan `PaginaController`, `SyncController` y `SettingController`. |
| 24 | `{` | Abre la función `obtener()`. |
| 25 | `$cfg = $this->get();` | Lee toda la configuración y la guarda en `$cfg`. |
| 27 | `$stmt = $this->conn->prepare("SELECT nombre FROM CATEGORIA WHERE ambito = 'menu' ORDER BY nombre ASC");` | Prepara la consulta: "trae los nombres de las categorías del menú, en orden alfabético". |
| 28 | `$stmt->execute();` | Ejecuta la consulta. |
| 29 | `$categorias = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'nombre');` | Trae todas las filas y se queda solo con la columna `nombre` (`array_column`). Queda una lista como `['Bebidas', 'Hamburguesas']`. |
| 30 | `$stmt->close();` | Cierra la consulta. |
| 32 | `return [` | Devuelve una lista con los nombres que usa React: |
| 33 | `'openTime'     => substr((string) $cfg['horario_apertura'], 0, 5),` | `'openTime'`: hora de apertura, solo `HH:MM` (`substr(..., 0, 5)` toma los primeros 5 caracteres). |
| 34 | `'closeTime'    => substr((string) $cfg['horario_cierre'], 0, 5),` | `'closeTime'`: hora de cierre. |
| 35 | `'isOpen'       => (bool) $cfg['tienda_abierta_manual'],` | `'isOpen'`: si la tienda está abierta a mano (sí/no). |
| 36 | `'isPaused'     => (bool) $cfg['pausa_emergencia_activa'],` | `'isPaused'`: si está en pausa de emergencia. |
| 37 | `'shippingRate' => (float) $cfg['tarifa_plana_domicilio'],` | `'shippingRate'`: lo que cuesta el domicilio. |
| 38 | `'profitMargin' => (float) $cfg['margen_ganancia_defecto'],` | `'profitMargin'`: el porcentaje de ganancia. |
| 39 | `'pointValue'   => (float) $cfg['valor_punto'],` | `'pointValue'`: cuánto vale un punto en pesos. |
| 40 | `'minPointsToRedeem' => (int) $cfg['minimo_puntos_canje'],` | `'minPointsToRedeem'`: mínimo de puntos para usarlos. |
| 41 | `'business'     => [` | `'business'`: los datos del negocio (para el ticket): |
| 42 | `'name'      => $cfg['negocio_nombre'],` | nombre, |
| 43 | `'nit'       => $cfg['negocio_nit'],` | NIT, |
| 44 | `'address'   => $cfg['negocio_direccion'],` | dirección, |
| 45 | `'phone'     => $cfg['negocio_telefono'],` | teléfono, |
| 46 | `'instagram' => $cfg['negocio_instagram'],` | Instagram, |
| 47 | `'website'   => $cfg['negocio_web'],` | página web. |
| 48 | `],` | Cierra los datos del negocio. |
| 49 | `'categories'   => $categorias,` | `'categories'`: las categorías del menú (de arriba). |
| 50 | `];` | Cierra la lista. |
| 51 | `}` | Cierra la función `obtener()`. |
| 53 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Actualiza solo los campos que vengan en $campos (claves en camelCase)."* |
| 54 | `public function actualizar($campos)` | Método `actualizar($campos)`: guarda los ajustes. Solo cambia lo que llegó. Lo usa `SettingController::update()`. |
| 55 | `{` | Abre la función `actualizar()`. |
| 56 | `$mapa = [` | Crea `$mapa`: nombre que usa React → columna en la base de datos: |
| 57 | `'openTime' => 'horario_apertura', 'closeTime' => 'horario_cierre',` | hora de apertura y de cierre, |
| 58 | `'isOpen' => 'tienda_abierta_manual', 'isPaused' => 'pausa_emergencia_activa',` | tienda abierta y pausa, |
| 59 | `'shippingRate' => 'tarifa_plana_domicilio', 'profitMargin' => 'margen_ganancia_defecto',` | tarifa de domicilio y margen, |
| 60 | `'pointValue' => 'valor_punto', 'minPointsToRedeem' => 'minimo_puntos_canje',` | valor del punto y mínimo de puntos. |
| 61 | `];` | Cierra el mapa. |
| 63 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Los datos del negocio llegan agrupados en 'business' (ver obtener())."* |
| 64 | `$mapaNegocio = [` | Crea `$mapaNegocio`: lo mismo para los datos del negocio: |
| 65 | `'name' => 'negocio_nombre', 'nit' => 'negocio_nit', 'address' => 'negocio_direccion',` | nombre, NIT, dirección, |
| 66 | `'phone' => 'negocio_telefono', 'instagram' => 'negocio_instagram', 'website' => 'negocio_web',` | teléfono, Instagram, web. |
| 67 | `];` | Cierra el mapa. |
| 69 | `$sets = [];` | `$sets` empieza vacía (columnas a cambiar). |
| 70 | `$values = [];` | `$values` empieza vacía (valores nuevos). |
| 71 | `foreach ($mapa as $clave => $columna) {` | Recorre `$mapa`. |
| 72 | `if (!array_key_exists($clave, $campos)) {` | Si ese dato no llegó... |
| 73 | `continue;` | ...sigue con el siguiente. |
| 74 | `}` | Cierra el `if`. |
| 75 | `$valor = $campos[$clave];` | Guarda en `$valor` el valor que llegó. |
| 76 | `if ($clave === 'openTime' \|\| $clave === 'closeTime') {` | Si es una hora... |
| 77 | `$valor = strlen((string) $valor) === 5 ? $valor . ':00' : $valor;` | ...y tiene 5 caracteres (`14:30`), le agrega `:00` (MySQL guarda `14:30:00`). |
| 78 | `} elseif ($clave === 'isOpen' \|\| $clave === 'isPaused') {` | Si es "abierta" o "pausa"... |
| 79 | `$valor = $valor ? 1 : 0;` | ...lo convierte en `1` (sí) o `0` (no). |
| 80 | `}` | Cierra el `elseif`. |
| 81 | `$sets[] = "{$columna} = ?";` | Anota `columna = ?`. |
| 82 | `$values[] = $valor;` | Anota el valor. |
| 83 | `}` | Cierra el `foreach`. |
| 85 | `$negocio = is_array($campos['business'] ?? null) ? $campos['business'] : [];` | Saca los datos del negocio si llegaron como lista (`is_array`); si no, lista vacía. |
| 86 | `foreach ($mapaNegocio as $clave => $columna) {` | Recorre `$mapaNegocio`. |
| 87 | `if (!array_key_exists($clave, $negocio)) {` | Si ese dato no llegó... |
| 88 | `continue;` | ...sigue. |
| 89 | `}` | Cierra el `if`. |
| 90 | `$sets[] = "{$columna} = ?";` | Anota `columna = ?`. |
| 91 | `$values[] = trim((string) $negocio[$clave]);` | Anota el valor sin espacios. |
| 92 | `}` | Cierra el `foreach`. |
| 94 | `if (empty($sets)) {` | Si no hay nada que cambiar... |
| 95 | `return;` | ...sale. |
| 96 | `}` | Cierra el `if`. |
| 97 | `$values[] = $this->get('id_config')['id_config'];` | Agrega al final el id de la configuración (para el `WHERE`). |
| 99 | `$sql = "UPDATE CONFIGURACION_SISTEMA SET " . implode(", ", $sets) . " WHERE id_config = ?";` | Arma la consulta: "cambia en `CONFIGURACION_SISTEMA` estas columnas donde el id sea `?`". |
| 100 | `$stmt = $this->conn->prepare($sql);` | Prepara la consulta. |
| 101 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 102 | `$stmt->execute();` | Ejecuta la consulta. |
| 103 | `$stmt->close();` | Cierra la consulta. |
| 104 | `}` | Cierra la función `actualizar()`. |
| 106 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Agrega una categoria de menu si no existe (sin importar mayusculas)."* |
| 107 | `public function agregarCategoria($nombre)` | Método `agregarCategoria($nombre)`: agrega una categoría del menú, si no existe. Lo usa `SettingController::addCategory()`. |
| 108 | `{` | Abre la función `agregarCategoria()`. |
| 109 | `$nombre = trim($nombre);` | Le quita los espacios al nombre. |
| 111 | `$stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = 'menu' AND LOWER(nombre) = LOWER(?)");` | Prepara la consulta: "busca una categoría del menú con ese nombre, sin importar mayúsculas (`LOWER` pasa todo a minúscula)". |
| 112 | `$stmt->bind_param("s", $nombre);` | Llena los `?` de la consulta, en orden: `$nombre` (texto). |
| 113 | `$stmt->execute();` | Ejecuta la consulta. |
| 114 | `$existe = $stmt->get_result()->fetch_assoc();` | Guarda lo que encontró en `$existe`. |
| 115 | `$stmt->close();` | Cierra la consulta. |
| 117 | `if (!$existe) {` | Si no existe... |
| 118 | `$stmtI = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES (?, 'menu')");` | ...prepara la consulta: "guarda la categoría nueva en `CATEGORIA`, del menú". |
| 119 | `$stmtI->bind_param("s", $nombre);` | Llena los `?` de la consulta, en orden: `$nombre` (texto). |
| 120 | `$stmtI->execute();` | Ejecuta la consulta. |
| 121 | `$stmtI->close();` | Cierra la consulta. |
| 122 | `}` | Cierra el `if`. |
| 123 | `}` | Cierra la función `agregarCategoria()`. |
| 125 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Elimina una categoria de menu, salvo que la use algun producto activo."* |
| 126 | `public function eliminarCategoria($nombre)` | Método `eliminarCategoria($nombre)`: elimina una categoría, si ningún producto activo la usa. Lo usa `SettingController::removeCategory()`. |
| 127 | `{` | Abre la función `eliminarCategoria()`. |
| 128 | `$stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = 'menu' AND nombre = ?");` | Prepara la consulta: "busca la categoría del menú con ese nombre". |
| 129 | `$stmt->bind_param("s", $nombre);` | Llena los `?` de la consulta, en orden: `$nombre` (texto). |
| 130 | `$stmt->execute();` | Ejecuta la consulta. |
| 131 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 132 | `$stmt->close();` | Cierra la consulta. |
| 134 | `if (!$row) {` | Si no existe... |
| 135 | `throw new Exception('La categoría no existe.');` | ...lanza el error "La categoría no existe." (`throw new Exception` = crea un error a propósito; lo atrapa el `catch` del controlador). |
| 136 | `}` | Cierra el `if`. |
| 137 | `$id = $row['id_categoria'];` | Guarda en `$id` el número de la categoría. |
| 139 | `$stmtC = $this->conn->prepare("SELECT COUNT(*) AS total FROM PRODUCTO WHERE id_categoria = ? AND estado = 'activo'");` | Prepara la consulta: "cuenta los productos activos de esa categoría". |
| 140 | `$stmtC->bind_param("i", $id);` | Llena los `?` de la consulta, en orden: `$id` (número entero). |
| 141 | `$stmtC->execute();` | Ejecuta la consulta. |
| 142 | `$cuenta = $stmtC->get_result()->fetch_assoc();` | Guarda el resultado en `$cuenta`. |
| 143 | `$stmtC->close();` | Cierra la consulta. |
| 145 | `if ((int) $cuenta['total'] > 0) {` | Si hay al menos uno... |
| 146 | `throw new Exception('No se puede eliminar la categoría: hay productos activos que la usan.');` | ...lanza el error "No se puede eliminar la categoría: hay productos activos que la usan.". |
| 147 | `}` | Cierra el `if`. |
| 149 | `$stmtD = $this->conn->prepare("DELETE FROM CATEGORIA WHERE id_categoria = ?");` | Prepara la consulta: "borra la categoría". |
| 150 | `$stmtD->bind_param("i", $id);` | Llena los `?` de la consulta, en orden: `$id` (número entero). |
| 151 | `$stmtD->execute();` | Ejecuta la consulta. |
| 152 | `$stmtD->close();` | Cierra la consulta. |
| 153 | `}` | Cierra la función `eliminarCategoria()`. |
| 155 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"La tienda esta cerrada si isOpen=false, isPaused=true o la hora esta fuera del horario."* |
| 156 | `public function tiendaAbiertaAhora()` | Método `tiendaAbiertaAhora()`: dice si la tienda está abierta en este momento. Lo usa `PedidoService` antes de aceptar un pedido. |
| 157 | `{` | Abre la función `tiendaAbiertaAhora()`. |
| 158 | `$config = $this->obtener();` | Trae los ajustes (`obtener()`). |
| 159 | `if (!$config['isOpen'] \|\| $config['isPaused']) {` | Si está cerrada a mano o en pausa... |
| 160 | `return false;` | ...devuelve `false` (cerrada). |
| 161 | `}` | Cierra el `if`. |
| 163 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Se compara en minutos con la zona horaria de la app ('zona_horaria' de config/app.php)."* |
| 164 | `$ahora  = (int) date('G') * 60 + (int) date('i');` | Calcula la hora actual en minutos (`date('G')` = la hora; `date('i')` = los minutos). Ej. 14:30 → 870. |
| 165 | `$abre   = $this->aMinutos($config['openTime']);` | Convierte la hora de apertura a minutos (`aMinutos()` de abajo). |
| 166 | `$cierra = $this->aMinutos($config['closeTime']);` | Convierte la hora de cierre a minutos. |
| 168 | `if ($abre <= $cierra) {` | Si abre antes de cerrar el mismo día (ej. 11:00 a 22:00)... |
| 169 | `return $ahora >= $abre && $ahora <= $cierra;` | ...está abierta si la hora actual está entre las dos. |
| 170 | `}` | Cierra el `if`. |
| 171 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Horario que cruza la medianoche (ej. 18:00 -> 02:00)."* |
| 172 | `return $ahora >= $abre \|\| $ahora <= $cierra;` | Si el horario pasa la medianoche (ej. 18:00 a 02:00), está abierta si es después de abrir **o** antes de cerrar. |
| 173 | `}` | Cierra la función `tiendaAbiertaAhora()`. |
| 175 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte "HH:MM" a minutos del dia."* |
| 176 | `private function aMinutos($hhmm)` | Método `aMinutos($hhmm)` (privado): convierte `"14:30"` en minutos (870). |
| 177 | `{` | Abre la función `aMinutos()`. |
| 178 | `$partes = explode(':', substr((string) $hhmm, 0, 5));` | Corta el texto en `:` (`explode`) → `['14', '30']`. |
| 179 | `$horas = (int) $partes[0];` | Las horas, como número. |
| 180 | `$minutos = isset($partes[1]) ? (int) $partes[1] : 0;` | Los minutos (si no hay, 0). |
| 181 | `return $horas * 60 + $minutos;` | Devuelve horas × 60 + minutos. |
| 182 | `}` | Cierra la función `aMinutos()`. |
| 184 | `public function tarifaDomicilio()` | Método `tarifaDomicilio()`: dice cuánto cuesta el domicilio. Lo usa `PedidoService`. |
| 185 | `{` | Abre la función `tarifaDomicilio()`. |
| 186 | `return (float) $this->get('tarifa_plana_domicilio')['tarifa_plana_domicilio'];` | Lee esa columna y la devuelve como número. |
| 187 | `}` | Cierra la función `tarifaDomicilio()`. |
| 189 | `public function idIngredienteBolsaGlobal()` | Método `idIngredienteBolsaGlobal()`: dice cuál insumo es la bolsa de empaque (se descuenta en cada pedido). Lo usa `PedidoService`. |
| 190 | `{` | Abre la función `idIngredienteBolsaGlobal()`. |
| 191 | `return $this->get('id_ingrediente_bolsa_global')['id_ingrediente_bolsa_global'] ?: null;` | Lee esa columna; si está vacía, devuelve `null`. |
| 192 | `}` | Cierra la función `idIngredienteBolsaGlobal()`. |
| 194 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Programa de puntos: valor en pesos de 1 punto y minimo de puntos para canjear."* |
| 195 | `public function reglasPuntos()` | Método `reglasPuntos()`: dice cuánto vale un punto y el mínimo para usarlos. Lo usa `PedidoService`. |
| 196 | `{` | Abre la función `reglasPuntos()`. |
| 197 | `$cfg = $this->get('valor_punto, minimo_puntos_canje');` | Lee las dos columnas. |
| 198 | `return [` | Devuelve una lista: |
| 199 | `'valor'  => (float) $cfg['valor_punto'],` | `'valor'`: pesos por punto. |
| 200 | `'minimo' => (int) $cfg['minimo_puntos_canje'],` | `'minimo'`: mínimo de puntos. |
| 201 | `];` | Cierra la lista. |
| 202 | `}` | Cierra la función `reglasPuntos()`. |
| 204 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"% de ganancia que el admin configura en Ajustes (ej. 30)."* |
| 205 | `public function margenGanancia()` | Método `margenGanancia()`: dice el porcentaje de ganancia. Lo usa `PedidoService` para calcular el precio de los ingredientes extra. |
| 206 | `{` | Abre la función `margenGanancia()`. |
| 207 | `return (float) $this->get('margen_ganancia_defecto')['margen_ganancia_defecto'];` | Lee esa columna y la devuelve como número. |
| 208 | `}` | Cierra la función `margenGanancia()`. |
| 209 | `}` | Cierra la clase `Configuracion`. |
| 210 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, cargar los datos de todas las pantallas, abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Failed to open stream` |
| el método `get()` | guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea, cargar los datos de todas las pantallas, abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Call to undefined method Configuracion::get()` |
| el método `obtener()` | guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea, cargar los datos de todas las pantallas, abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Call to undefined method Configuracion::obtener()` |
| el método `actualizar()` | guardar los ajustes de la tienda | `Call to undefined method Configuracion::actualizar()` |
| el método `agregarCategoria()` | agregar categorías del menú | `Call to undefined method Configuracion::agregarCategoria()` |
| el método `eliminarCategoria()` | eliminar categorías del menú | `Call to undefined method Configuracion::eliminarCategoria()` |
| el método `tiendaAbiertaAhora()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method Configuracion::tiendaAbiertaAhora()` |
| el método `aMinutos()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method Configuracion::aMinutos()` |
| el método `tarifaDomicilio()` | nada directo | `Call to undefined method Configuracion::tarifaDomicilio()` |
| el método `idIngredienteBolsaGlobal()` | nada directo | `Call to undefined method Configuracion::idIngredienteBolsaGlobal()` |
| el método `reglasPuntos()` | nada directo | `Call to undefined method Configuracion::reglasPuntos()` |
| el método `margenGanancia()` | nada directo | `Call to undefined method Configuracion::margenGanancia()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
