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
| 7-8 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Categoria interna del producto oculto "Hamburguesa Personalizada" (la crea PedidoService::productoPersonalizadoOculto). No se muestra ni se puede crear a mano."* |
| 9 | `const CATEGORIA_INTERNA = 'Personalizado';` | Constante `CATEGORIA_INTERNA`: el nombre de la categoría que usa el sistema para las hamburguesas que arma el cliente. No es una categoría del menú: el administrador no la ve ni la puede crear. |
| 11 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 13 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 14 | `{` | Abre la función `__construct()`. |
| 15 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 16 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 17 | `}` | Cierra la función `__construct()`. |
| 19 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Fila unica de CONFIGURACION_SISTEMA (todas las columnas o solo una)."* |
| 20 | `public function get($columna = '*')` | Método `get($columna)`: lee la configuración de la base de datos (toda, o solo una columna). Por defecto `'*'` = todas. |
| 21 | `{` | Abre la función `get()`. |
| 22 | `$res = $this->conn->query("SELECT {$columna} FROM CONFIGURACION_SISTEMA LIMIT 1");` | Hace la consulta directamente (`query`, no tiene `?`): "trae esa columna de `CONFIGURACION_SISTEMA`, solo una fila". Lo guarda en `$res`. |
| 23 | `return $res->fetch_assoc();` | Devuelve la fila. |
| 24 | `}` | Cierra la función `get()`. |
| 26 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Configuracion con el formato que usa el frontend."* |
| 27 | `public function obtener()` | Método `obtener()`: trae los ajustes con los nombres que usa React. Lo usan `PaginaController`, `SyncController` y `SettingController`. |
| 28 | `{` | Abre la función `obtener()`. |
| 29 | `$cfg = $this->get();` | Lee toda la configuración y la guarda en `$cfg`. |
| 31 | `$interna = self::CATEGORIA_INTERNA;` | Guarda en `$interna` el nombre de la categoría interna (`'Personalizado'`). |
| 32 | `$stmt = $this->conn->prepare("SELECT nombre FROM CATEGORIA WHERE ambito = 'menu' AND nombre <> ? ORDER BY nombre ASC");` | Prepara la consulta: "trae los nombres de las categorías del menú, **menos** (`<>` = distinto de) la interna, ordenados de la A a la Z". |
| 33 | `$stmt->bind_param("s", $interna);` | Llena el `?` con `$interna` (texto). |
| 34 | `$stmt->execute();` | Ejecuta la consulta. |
| 35 | `$categorias = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'nombre');` | Trae todas las filas y se queda solo con la columna `nombre` (`array_column`). Queda una lista como `['Bebidas', 'Hamburguesas']`. |
| 36 | `$stmt->close();` | Cierra la consulta. |
| 38 | `return [` | Devuelve una lista con los nombres que usa React: |
| 39 | `'openTime'     => substr((string) $cfg['horario_apertura'], 0, 5),` | `'openTime'`: hora de apertura, solo `HH:MM` (`substr(..., 0, 5)` toma los primeros 5 caracteres). |
| 40 | `'closeTime'    => substr((string) $cfg['horario_cierre'], 0, 5),` | `'closeTime'`: hora de cierre. |
| 41 | `'isOpen'       => (bool) $cfg['tienda_abierta_manual'],` | `'isOpen'`: si la tienda está abierta a mano (sí/no). |
| 42 | `'isPaused'     => (bool) $cfg['pausa_emergencia_activa'],` | `'isPaused'`: si está en pausa de emergencia. |
| 43 | `'shippingRate' => (float) $cfg['tarifa_plana_domicilio'],` | `'shippingRate'`: lo que cuesta el domicilio. |
| 44 | `'profitMargin' => (float) $cfg['margen_ganancia_defecto'],` | `'profitMargin'`: el porcentaje de ganancia. |
| 45 | `'pointValue'   => (float) $cfg['valor_punto'],` | `'pointValue'`: cuánto vale un punto en pesos. |
| 46 | `'minPointsToRedeem' => (int) $cfg['minimo_puntos_canje'],` | `'minPointsToRedeem'`: mínimo de puntos para usarlos. |
| 47 | `'business'     => [` | `'business'`: los datos del negocio (para el ticket): |
| 48 | `'name'      => $cfg['negocio_nombre'],` | nombre, |
| 49 | `'nit'       => $cfg['negocio_nit'],` | NIT, |
| 50 | `'address'   => $cfg['negocio_direccion'],` | dirección, |
| 51 | `'phone'     => $cfg['negocio_telefono'],` | teléfono, |
| 52 | `'instagram' => $cfg['negocio_instagram'],` | Instagram, |
| 53 | `'website'   => $cfg['negocio_web'],` | página web. |
| 54 | `],` | Cierra los datos del negocio. |
| 55 | `'categories'   => $categorias,` | `'categories'`: las categorías del menú (de arriba). |
| 56 | `];` | Cierra la lista. |
| 57 | `}` | Cierra la función `obtener()`. |
| 59 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Actualiza solo los campos que vengan en $campos (claves en camelCase)."* |
| 60 | `public function actualizar($campos)` | Método `actualizar($campos)`: guarda los ajustes. Solo cambia lo que llegó. Lo usa `SettingController::update()`. |
| 61 | `{` | Abre la función `actualizar()`. |
| 62 | `$mapa = [` | Crea `$mapa`: nombre que usa React → columna en la base de datos: |
| 63 | `'openTime' => 'horario_apertura', 'closeTime' => 'horario_cierre',` | hora de apertura y de cierre, |
| 64 | `'isOpen' => 'tienda_abierta_manual', 'isPaused' => 'pausa_emergencia_activa',` | tienda abierta y pausa, |
| 65 | `'shippingRate' => 'tarifa_plana_domicilio', 'profitMargin' => 'margen_ganancia_defecto',` | tarifa de domicilio y margen, |
| 66 | `'pointValue' => 'valor_punto', 'minPointsToRedeem' => 'minimo_puntos_canje',` | valor del punto y mínimo de puntos. |
| 67 | `];` | Cierra el mapa. |
| 69 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Los datos del negocio llegan agrupados en 'business' (ver obtener())."* |
| 70 | `$mapaNegocio = [` | Crea `$mapaNegocio`: lo mismo para los datos del negocio: |
| 71 | `'name' => 'negocio_nombre', 'nit' => 'negocio_nit', 'address' => 'negocio_direccion',` | nombre, NIT, dirección, |
| 72 | `'phone' => 'negocio_telefono', 'instagram' => 'negocio_instagram', 'website' => 'negocio_web',` | teléfono, Instagram, web. |
| 73 | `];` | Cierra el mapa. |
| 75 | `$sets = [];` | `$sets` empieza vacía (columnas a cambiar). |
| 76 | `$values = [];` | `$values` empieza vacía (valores nuevos). |
| 77 | `foreach ($mapa as $clave => $columna) {` | Recorre `$mapa`. |
| 78 | `if (!array_key_exists($clave, $campos)) {` | Si ese dato no llegó... |
| 79 | `continue;` | ...sigue con el siguiente. |
| 80 | `}` | Cierra el `if`. |
| 81 | `$valor = $campos[$clave];` | Guarda en `$valor` el valor que llegó. |
| 82 | `if ($clave === 'openTime' \|\| $clave === 'closeTime') {` | Si es una hora... |
| 83 | `$valor = strlen((string) $valor) === 5 ? $valor . ':00' : $valor;` | ...y tiene 5 caracteres (`14:30`), le agrega `:00` (MySQL guarda `14:30:00`). |
| 84 | `} elseif ($clave === 'isOpen' \|\| $clave === 'isPaused') {` | Si es "abierta" o "pausa"... |
| 85 | `$valor = $valor ? 1 : 0;` | ...lo convierte en `1` (sí) o `0` (no). |
| 86 | `}` | Cierra el `elseif`. |
| 87 | `$sets[] = "{$columna} = ?";` | Anota `columna = ?`. |
| 88 | `$values[] = $valor;` | Anota el valor. |
| 89 | `}` | Cierra el `foreach`. |
| 91 | `$negocio = is_array($campos['business'] ?? null) ? $campos['business'] : [];` | Saca los datos del negocio si llegaron como lista (`is_array`); si no, lista vacía. |
| 92 | `foreach ($mapaNegocio as $clave => $columna) {` | Recorre `$mapaNegocio`. |
| 93 | `if (!array_key_exists($clave, $negocio)) {` | Si ese dato no llegó... |
| 94 | `continue;` | ...sigue. |
| 95 | `}` | Cierra el `if`. |
| 96 | `$sets[] = "{$columna} = ?";` | Anota `columna = ?`. |
| 97 | `$values[] = trim((string) $negocio[$clave]);` | Anota el valor sin espacios. |
| 98 | `}` | Cierra el `foreach`. |
| 100 | `if (empty($sets)) {` | Si no hay nada que cambiar... |
| 101 | `return;` | ...sale. |
| 102 | `}` | Cierra el `if`. |
| 103 | `$values[] = $this->get('id_config')['id_config'];` | Agrega al final el id de la configuración (para el `WHERE`). |
| 105 | `$sql = "UPDATE CONFIGURACION_SISTEMA SET " . implode(", ", $sets) . " WHERE id_config = ?";` | Arma la consulta: "cambia en `CONFIGURACION_SISTEMA` estas columnas donde el id sea `?`". |
| 106 | `$stmt = $this->conn->prepare($sql);` | Prepara la consulta. |
| 107 | `$stmt->bind_param(tiposDe($values), ...$values);` | Llena los `?` con los valores de la lista `$values`. `tiposDe()` (de `helpers.php`) arma las letras de tipo de cada valor, y `...` pasa cada elemento de la lista por separado. |
| 108 | `$stmt->execute();` | Ejecuta la consulta. |
| 109 | `$stmt->close();` | Cierra la consulta. |
| 110 | `}` | Cierra la función `actualizar()`. |
| 112 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Agrega una categoria de menu si no existe (sin importar mayusculas)."* |
| 113 | `public function agregarCategoria($nombre)` | Método `agregarCategoria($nombre)`: agrega una categoría del menú, si no existe. Lo usa `SettingController::addCategory()`. |
| 114 | `{` | Abre la función `agregarCategoria()`. |
| 115 | `$nombre = trim($nombre);` | Le quita los espacios al nombre. |
| 116 | `if (strtolower($nombre) === strtolower(self::CATEGORIA_INTERNA)) {` | Si el nombre es "Personalizado" (sin importar mayúsculas: `strtolower` pasa todo a minúscula)... |
| 117 | `throw new InvalidArgumentException('Ese nombre lo usa el sistema para las hamburguesas que arma el cliente. Elige otro.');` | ...lanza el error "Ese nombre lo usa el sistema... Elige otro.". |
| 118 | `}` | Cierra el `if`. |
| 120 | `$stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = 'menu' AND LOWER(nombre) = LOWER(?)");` | Prepara la consulta: "busca una categoría del menú con ese nombre, sin importar mayúsculas (`LOWER` pasa todo a minúscula)". |
| 121 | `$stmt->bind_param("s", $nombre);` | Llena los `?` de la consulta, en orden: `$nombre` (texto). |
| 122 | `$stmt->execute();` | Ejecuta la consulta. |
| 123 | `$existe = $stmt->get_result()->fetch_assoc();` | Guarda lo que encontró en `$existe`. |
| 124 | `$stmt->close();` | Cierra la consulta. |
| 126 | `if (!$existe) {` | Si no existe... |
| 127 | `$stmtI = $this->conn->prepare("INSERT INTO CATEGORIA (nombre, ambito) VALUES (?, 'menu')");` | ...prepara la consulta: "guarda la categoría nueva en `CATEGORIA`, del menú". |
| 128 | `$stmtI->bind_param("s", $nombre);` | Llena los `?` de la consulta, en orden: `$nombre` (texto). |
| 129 | `$stmtI->execute();` | Ejecuta la consulta. |
| 130 | `$stmtI->close();` | Cierra la consulta. |
| 131 | `}` | Cierra el `if`. |
| 132 | `}` | Cierra la función `agregarCategoria()`. |
| 134 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Elimina una categoria de menu, salvo que la use algun producto activo."* |
| 135 | `public function eliminarCategoria($nombre)` | Método `eliminarCategoria($nombre)`: elimina una categoría, si ningún producto activo la usa. Lo usa `SettingController::removeCategory()`. |
| 136 | `{` | Abre la función `eliminarCategoria()`. |
| 137 | `$stmt = $this->conn->prepare("SELECT id_categoria FROM CATEGORIA WHERE ambito = 'menu' AND nombre = ?");` | Prepara la consulta: "busca la categoría del menú con ese nombre". |
| 138 | `$stmt->bind_param("s", $nombre);` | Llena los `?` de la consulta, en orden: `$nombre` (texto). |
| 139 | `$stmt->execute();` | Ejecuta la consulta. |
| 140 | `$row = $stmt->get_result()->fetch_assoc();` | Trae la fila que encontró y la guarda en `$row` (si no encontró nada, queda vacía). |
| 141 | `$stmt->close();` | Cierra la consulta. |
| 143 | `if (!$row) {` | Si no existe... |
| 144 | `throw new Exception('La categoría no existe.');` | ...lanza el error "La categoría no existe." (`throw new Exception` = crea un error a propósito; lo atrapa el `catch` del controlador). |
| 145 | `}` | Cierra el `if`. |
| 146 | `$id = $row['id_categoria'];` | Guarda en `$id` el número de la categoría. |
| 148 | `$stmtC = $this->conn->prepare("SELECT COUNT(*) AS total FROM PRODUCTO WHERE id_categoria = ? AND estado = 'activo'");` | Prepara la consulta: "cuenta los productos activos de esa categoría". |
| 149 | `$stmtC->bind_param("i", $id);` | Llena los `?` de la consulta, en orden: `$id` (número entero). |
| 150 | `$stmtC->execute();` | Ejecuta la consulta. |
| 151 | `$cuenta = $stmtC->get_result()->fetch_assoc();` | Guarda el resultado en `$cuenta`. |
| 152 | `$stmtC->close();` | Cierra la consulta. |
| 154 | `if ((int) $cuenta['total'] > 0) {` | Si hay al menos uno... |
| 155 | `throw new Exception('No se puede eliminar la categoría: hay productos activos que la usan.');` | ...lanza el error "No se puede eliminar la categoría: hay productos activos que la usan.". |
| 156 | `}` | Cierra el `if`. |
| 158 | `$stmtD = $this->conn->prepare("DELETE FROM CATEGORIA WHERE id_categoria = ?");` | Prepara la consulta: "borra la categoría". |
| 159 | `$stmtD->bind_param("i", $id);` | Llena los `?` de la consulta, en orden: `$id` (número entero). |
| 160 | `$stmtD->execute();` | Ejecuta la consulta. |
| 161 | `$stmtD->close();` | Cierra la consulta. |
| 162 | `}` | Cierra la función `eliminarCategoria()`. |
| 164 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"La tienda esta cerrada si isOpen=false, isPaused=true o la hora esta fuera del horario."* |
| 165 | `public function tiendaAbiertaAhora()` | Método `tiendaAbiertaAhora()`: dice si la tienda está abierta en este momento. Lo usa `PedidoService` antes de aceptar un pedido. |
| 166 | `{` | Abre la función `tiendaAbiertaAhora()`. |
| 167 | `$config = $this->obtener();` | Trae los ajustes (`obtener()`). |
| 168 | `if (!$config['isOpen'] \|\| $config['isPaused']) {` | Si está cerrada a mano o en pausa... |
| 169 | `return false;` | ...devuelve `false` (cerrada). |
| 170 | `}` | Cierra el `if`. |
| 172 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Se compara en minutos con la zona horaria de la app ('zona_horaria' de config/app.php)."* |
| 173 | `$ahora  = (int) date('G') * 60 + (int) date('i');` | Calcula la hora actual en minutos (`date('G')` = la hora; `date('i')` = los minutos). Ej. 14:30 → 870. |
| 174 | `$abre   = $this->aMinutos($config['openTime']);` | Convierte la hora de apertura a minutos (`aMinutos()` de abajo). |
| 175 | `$cierra = $this->aMinutos($config['closeTime']);` | Convierte la hora de cierre a minutos. |
| 177 | `if ($abre <= $cierra) {` | Si abre antes de cerrar el mismo día (ej. 11:00 a 22:00)... |
| 178 | `return $ahora >= $abre && $ahora <= $cierra;` | ...está abierta si la hora actual está entre las dos. |
| 179 | `}` | Cierra el `if`. |
| 180 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Horario que cruza la medianoche (ej. 18:00 -> 02:00)."* |
| 181 | `return $ahora >= $abre \|\| $ahora <= $cierra;` | Si el horario pasa la medianoche (ej. 18:00 a 02:00), está abierta si es después de abrir **o** antes de cerrar. |
| 182 | `}` | Cierra la función `tiendaAbiertaAhora()`. |
| 184 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte "HH:MM" a minutos del dia."* |
| 185 | `private function aMinutos($hhmm)` | Método `aMinutos($hhmm)` (privado): convierte `"14:30"` en minutos (870). |
| 186 | `{` | Abre la función `aMinutos()`. |
| 187 | `$partes = explode(':', substr((string) $hhmm, 0, 5));` | Corta el texto en `:` (`explode`) → `['14', '30']`. |
| 188 | `$horas = (int) $partes[0];` | Las horas, como número. |
| 189 | `$minutos = isset($partes[1]) ? (int) $partes[1] : 0;` | Los minutos (si no hay, 0). |
| 190 | `return $horas * 60 + $minutos;` | Devuelve horas × 60 + minutos. |
| 191 | `}` | Cierra la función `aMinutos()`. |
| 193 | `public function tarifaDomicilio()` | Método `tarifaDomicilio()`: dice cuánto cuesta el domicilio. Lo usa `PedidoService`. |
| 194 | `{` | Abre la función `tarifaDomicilio()`. |
| 195 | `return (float) $this->get('tarifa_plana_domicilio')['tarifa_plana_domicilio'];` | Lee esa columna y la devuelve como número. |
| 196 | `}` | Cierra la función `tarifaDomicilio()`. |
| 198 | `public function idIngredienteBolsaGlobal()` | Método `idIngredienteBolsaGlobal()`: dice cuál insumo es la bolsa de empaque (se descuenta en cada pedido). Lo usa `PedidoService`. |
| 199 | `{` | Abre la función `idIngredienteBolsaGlobal()`. |
| 200 | `return $this->get('id_ingrediente_bolsa_global')['id_ingrediente_bolsa_global'] ?: null;` | Lee esa columna; si está vacía, devuelve `null`. |
| 201 | `}` | Cierra la función `idIngredienteBolsaGlobal()`. |
| 203 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Programa de puntos: valor en pesos de 1 punto y minimo de puntos para canjear."* |
| 204 | `public function reglasPuntos()` | Método `reglasPuntos()`: dice cuánto vale un punto y el mínimo para usarlos. Lo usa `PedidoService`. |
| 205 | `{` | Abre la función `reglasPuntos()`. |
| 206 | `$cfg = $this->get('valor_punto, minimo_puntos_canje');` | Lee las dos columnas. |
| 207 | `return [` | Devuelve una lista: |
| 208 | `'valor'  => (float) $cfg['valor_punto'],` | `'valor'`: pesos por punto. |
| 209 | `'minimo' => (int) $cfg['minimo_puntos_canje'],` | `'minimo'`: mínimo de puntos. |
| 210 | `];` | Cierra la lista. |
| 211 | `}` | Cierra la función `reglasPuntos()`. |
| 213 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"% de ganancia que el admin configura en Ajustes (ej. 30)."* |
| 214 | `public function margenGanancia()` | Método `margenGanancia()`: dice el porcentaje de ganancia. Lo usa `PedidoService` para calcular el precio de los ingredientes extra. |
| 215 | `{` | Abre la función `margenGanancia()`. |
| 216 | `return (float) $this->get('margen_ganancia_defecto')['margen_ganancia_defecto'];` | Lee esa columna y la devuelve como número. |
| 217 | `}` | Cierra la función `margenGanancia()`. |
| 218 | `}` | Cierra la clase `Configuracion`. |
| 219 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, cargar los datos de todas las pantallas, abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Failed to open stream` |
| el método `get()` | guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea, cargar los datos de todas las pantallas, abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Call to undefined method Configuracion::get()` |
| el método `obtener()` | guardar los ajustes de la tienda, agregar categorías del menú, eliminar categorías del menú, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea, cargar los datos de todas las pantallas, abrir la página de inicio, abrir la página de login, abrir la página para crear cuenta, abrir la página para recuperar la contraseña, abrir el panel del administrador, abrir el panel del cliente, abrir el panel de cocina, abrir el panel del domiciliario | `Call to undefined method Configuracion::obtener()` |
| el método `actualizar()` | guardar los ajustes de la tienda | `Call to undefined method Configuracion::actualizar()` |
| el método `agregarCategoria()` | agregar categorías del menú | `Call to undefined method Configuracion::agregarCategoria()` |
| la constante `CATEGORIA_INTERNA` | ver los ajustes y agregar categorías | `Undefined constant Configuracion::CATEGORIA_INTERNA` |
| el método `eliminarCategoria()` | eliminar categorías del menú | `Call to undefined method Configuracion::eliminarCategoria()` |
| el método `tiendaAbiertaAhora()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method Configuracion::tiendaAbiertaAhora()` |
| el método `aMinutos()` | hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, empezar un pago en línea | `Call to undefined method Configuracion::aMinutos()` |
| el método `tarifaDomicilio()` | nada directo | `Call to undefined method Configuracion::tarifaDomicilio()` |
| el método `idIngredienteBolsaGlobal()` | nada directo | `Call to undefined method Configuracion::idIngredienteBolsaGlobal()` |
| el método `reglasPuntos()` | nada directo | `Call to undefined method Configuracion::reglasPuntos()` |
| el método `margenGanancia()` | nada directo | `Call to undefined method Configuracion::margenGanancia()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
