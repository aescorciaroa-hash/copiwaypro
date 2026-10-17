# Glosario: cada palabra y cada símbolo, en palabras sencillas

Todo lo que aparece en el código del proyecto, explicado fácil.

---

## Palabras del sistema

| Palabra | Qué es |
|---|---|
| **Base de datos** | Donde se guarda todo (productos, pedidos, clientes...). Aquí es MySQL. |
| **Tabla** | Una parte de la base de datos, como una hoja de Excel. Ej: la tabla `PRODUCTO`. |
| **Fila** | Un registro de una tabla. Ej: un producto. |
| **Columna** | Un dato de cada fila. Ej: `nombre`, `precio`. |
| **Consulta** | Una orden a la base de datos: traer, guardar, cambiar o borrar datos. |
| **Servidor / PHP** | La parte que no se ve: recibe los pedidos de la pantalla, revisa y guarda. |
| **Pantalla / React** | Lo que ve el usuario en el navegador. Está hecha con React (carpeta `src/`). |
| **API** | Las direcciones que usa la pantalla para pedirle cosas a PHP (todas empiezan con `/api/`). |
| **Ruta** | Una dirección de la API. Ej: `PUT /api/products/6` = "editar el producto 6". |
| **Petición** | Cada vez que la pantalla le pide algo a PHP. |
| **Respuesta** | Lo que PHP le contesta a la pantalla. |
| **JSON** | La forma en que PHP y React se pasan los datos: `{"name": "Hamburguesa", "price": 16000}`. |
| **Sesión** | La memoria que guarda quién inició sesión mientras usa el sistema. |
| **Rol** | El tipo de usuario: `admin` (administrador), `client` (cliente), `kitchen` (cocina), `delivery` (domiciliario). |
| **Token de seguridad (CSRF)** | Una clave secreta que la pantalla manda en cada cambio, para demostrar que viene del sistema y no de otra página. |
| **Compilar** | Convertir el código de React (`src/`) en los archivos que entiende el navegador (`public/assets/`). Se hace con `npm run build`. |
| **Librería** | Código hecho por otras personas que el proyecto usa (ej. PHPMailer para enviar correos). |

## Las partes del MVC

| Palabra | Qué es | Carpeta |
|---|---|---|
| **Modelo** | Habla con la base de datos: trae y guarda datos. | `models/` |
| **Vista** | Lo que se muestra: el HTML de la página. | `views/` |
| **Controlador** | Recibe lo que pide la pantalla, revisa los datos y llama al modelo. | `controllers/` |
| **Servicio (Service)** | Un modelo con reglas más grandes (ej. crear un pedido). | `models/...Service.php` |

---

## Palabras de PHP

| Palabra | Qué hace | Ejemplo |
|---|---|---|
| `<?php` ... `?>` | Abre y cierra el código PHP. | |
| `$algo` | Una **variable**: una cajita con un nombre donde se guarda un dato. Siempre empieza con `$`. | `$precio = 16000;` |
| `=` | **Guarda** un valor en una variable. | `$nombre = 'Ana';` |
| `;` | Termina una instrucción (como el punto al final de una frase). | |
| `'texto'` o `"texto"` | Un texto. | `'Hola'` |
| `[ ]` | Una **lista** (arreglo). | `['moto', 'carro']` |
| `'clave' => valor` | Un dato con nombre dentro de una lista. | `['name' => 'Ana']` |
| `$lista['clave']` | Saca un dato de una lista por su nombre. | `$fila['precio']` |
| `function nombre() { }` | Una **función**: un grupo de instrucciones con un nombre, que se usa cuando se necesita. | |
| `( )` después de un nombre | **Usa** (llama) esa función. Lo de adentro son los datos que se le pasan. | `responderJson($datos)` |
| `return` | Devuelve el resultado de la función a quien la llamó. | `return $producto;` |
| `class Nombre { }` | Una **clase**: un grupo de funciones y datos que trabajan juntos. | `class Producto` |
| **método** | Una función que está dentro de una clase. | `crear()` dentro de `Producto` |
| `new Clase()` | Crea un **objeto** de esa clase para poder usar sus métodos. | `new Producto()` |
| `->` | Usa algo de un objeto. | `$productoModel->crear($datos)` |
| `::` | Usa algo de una clase sin crear el objeto (métodos `static` y constantes). | `Auth::id()` |
| `$this` | "Este objeto": dentro de una clase, se usa para llegar a sus propias cosas. | `$this->conn` |
| `private` | Solo se puede usar dentro de la misma clase. | `private $conn;` |
| `public` | Se puede usar desde afuera de la clase. | `public function crear()` |
| `static` | Se usa con `Clase::metodo()`, sin `new`. | `public static function id()` |
| `const` | Un valor fijo que no cambia. | `const MAXIMO_INTENTOS = 5;` |
| `self::` | "Esta misma clase" (para constantes y métodos `static`). | `self::MAXIMO_INTENTOS` |
| `__construct()` | Método que se ejecuta solo al hacer `new`. Prepara lo que la clase va a usar. | |
| `global $conn;` | Trae la variable `$conn` que está fuera de la función (la conexión a la base de datos). | |
| `require_once 'archivo.php';` | Trae otro archivo para usar lo que tiene. Si ya se trajo, no lo repite. | |
| `__DIR__` | La carpeta donde está el archivo actual. | `__DIR__ . '/../models/Producto.php'` |
| `.` | **Une** textos. | `'Hola ' . $nombre` |
| `if (...) { } elseif (...) { } else { }` | **Si** pasa algo haz esto; **si no**, revisa lo otro; **si nada**, haz lo último. | |
| `foreach ($lista as $cosa) { }` | Recorre la lista: hace lo mismo con cada elemento. | |
| `try { } catch (Exception $e) { }` | **Intenta** hacer algo; si falla, hace lo del `catch` en vez de romperse. | |
| `throw new Exception('...')` | Lanza un error a propósito (lo atrapa el `catch`). | |
| `echo` | Escribe algo en la página. | |
| `exit` | Detiene todo en ese momento. | |
| `die('...')` | Muestra un mensaje y detiene todo. | |
| `true` / `false` | Sí / no. | |
| `null` | "Nada", vacío. | |

## Comparaciones y condiciones

| Símbolo | Qué significa |
|---|---|
| `===` | ¿Es exactamente igual? |
| `!==` | ¿Es diferente? |
| `<` `>` `<=` `>=` | Menor, mayor, menor o igual, mayor o igual. |
| `&&` | **Y**: las dos cosas tienen que cumplirse. |
| `\|\|` | **O**: basta con que se cumpla una. |
| `!` | **No**: invierte. `!$existe` = "no existe". |
| `??` | Si lo de la izquierda no existe, usa lo de la derecha. `$_GET['accion'] ?? ''` |
| `?:` | Si lo de la izquierda está vacío, usa lo de la derecha. `$row ?: null` |
| `condición ? a : b` | Un **si** corto: si se cumple, `a`; si no, `b`. |
| `+=` | Suma a lo que ya tiene. `$total += 5000;` |
| `[] =` | Agrega al final de una lista. `$lista[] = $cosa;` |
| `(int)` `(float)` `(string)` `(bool)` | Convierte a número entero, número con decimales, texto o sí/no. |

## Variables especiales de PHP

| Variable | Qué tiene |
|---|---|
| `$_GET` | Los datos que vienen en la dirección. En este proyecto también la acción (`$_GET['accion']`) y el número (`$_GET['id']`). |
| `$_POST` | Los datos de un formulario. |
| `$_FILES` | Los archivos que se suben (fotos). |
| `$_SESSION` | La memoria de la sesión del usuario (quién es y su rol). |
| `$_SERVER` | Datos de la petición (la dirección, el método, la IP...). |

## Funciones de PHP que más se usan

| Función | Qué hace |
|---|---|
| `empty($x)` | ¿Está vacío? |
| `isset($x)` | ¿Existe? |
| `trim($x)` | Quita los espacios del principio y del final. |
| `strlen($x)` | Cuántas letras tiene. |
| `in_array($x, $lista)` | ¿Está `$x` dentro de la lista? |
| `count($lista)` | Cuántos elementos tiene la lista. |
| `is_numeric($x)` | ¿Es un número? |
| `filter_var($x, FILTER_VALIDATE_EMAIL)` | ¿Es un correo válido? |
| `password_hash($clave, ...)` | Cifra una contraseña para guardarla. |
| `password_verify($clave, $hash)` | Revisa si la contraseña coincide con la cifrada. |
| `json_encode($datos)` | Convierte una lista de PHP en JSON. |
| `json_decode($texto, true)` | Convierte JSON en una lista de PHP. |
| `header('...')` | Manda una instrucción al navegador (ej. "esto es JSON"). |
| `http_response_code(404)` | Pone el número de la respuesta (200 bien, 404 no existe, 500 error). |
| `date('Y-m-d')` | La fecha de hoy. |
| `preg_match('/.../', $x)` | Revisa si un texto cumple un patrón (ej. que el PIN sean 4 números). |
| `random_int(1, 9)` | Un número al azar. |

## La base de datos en PHP (MySQLi)

| Código | Qué hace |
|---|---|
| `new mysqli($host, $user, $password, $bd, $port)` | Abre la conexión a MySQL. |
| `$conn` | La conexión (se crea en `config/database.php`). |
| `$this->conn->prepare("SELECT ... WHERE id = ?")` | Prepara una consulta. Los `?` se llenan después (así nadie puede meter código malo). |
| `$stmt` | La consulta preparada. |
| `$stmt->bind_param("si", $nombre, $id)` | Llena los `?`. Cada letra es el tipo: `s` texto, `i` número entero, `d` número con decimales. |
| `$stmt->execute()` | Ejecuta la consulta. |
| `$stmt->get_result()->fetch_assoc()` | Trae **una** fila. |
| `->fetch_all(MYSQLI_ASSOC)` | Trae **todas** las filas. |
| `$stmt->close()` | Cierra la consulta. |
| `$this->conn->insert_id` | El número (id) de lo último que se guardó. |
| `begin_transaction()` / `commit()` / `rollback()` | Guardar varias cosas juntas: o se guarda todo, o nada. |

## SQL (lo que va dentro de las consultas)

| Palabra | Qué hace |
|---|---|
| `SELECT ... FROM tabla` | Trae datos de una tabla. |
| `WHERE` | Solo las filas que cumplen algo. |
| `INSERT INTO tabla (...) VALUES (...)` | Guarda una fila nueva. |
| `UPDATE tabla SET ...` | Cambia datos. |
| `DELETE FROM tabla` | Borra filas. |
| `JOIN` / `LEFT JOIN` | Une dos tablas (ej. el pedido con su cliente). |
| `ORDER BY` | Ordena. `DESC` = de mayor a menor. |
| `LIMIT 1` | Solo trae una fila. |
| `COUNT(...)`, `SUM(...)` | Cuenta / suma. |

## Respuestas que manda PHP (códigos)

| Número | Significa |
|---|---|
| `200` | Todo bien. |
| `201` | Se creó algo nuevo. |
| `401` | No ha iniciado sesión. |
| `403` | No tiene permiso. |
| `404` | No existe. |
| `405` | La dirección existe, pero no con ese tipo de petición. |
| `409` | No se puede por cómo están las cosas (ej. sin stock). |
| `419` | Falta el token de seguridad. |
| `422` | Los datos vienen mal. |
| `500` | Error en el código. |

## Tipos de petición

| Tipo | Para qué |
|---|---|
| `GET` | Traer datos. |
| `POST` | Crear algo. |
| `PUT` | Editar algo. |
| `PATCH` | Cambiar una parte (ej. el estado de un pedido). |
| `DELETE` | Borrar. |

---

## Palabras de React (carpeta `src/`)

| Palabra | Qué es |
|---|---|
| **Componente** | Una parte de la pantalla hecha como función. Ej: `Navbar`, `Login`. |
| `.tsx` / `.ts` | Archivos de React con TypeScript (`.tsx` tiene pantalla, `.ts` solo código). |
| `import ... from '...'` | Trae algo de otro archivo. |
| `export` | Permite que otro archivo lo use. |
| `const` / `let` | Crea una variable (`const` no cambia, `let` sí). |
| `useState` | Un dato que, cuando cambia, vuelve a dibujar la pantalla. |
| `useEffect` | Código que se ejecuta cuando la pantalla aparece o cuando algo cambia. |
| `props` | Los datos que un componente le pasa a otro. |
| `async` / `await` | Esperar a que algo termine (ej. la respuesta de PHP). |
| `=>` | Una función corta: `(x) => x * 2`. |
| `className="..."` | Los estilos (con Tailwind: `p-4` = espacio, `bg-orange-500` = fondo naranja). |
| `{ ... }` dentro del HTML | Pone un dato de JavaScript en la pantalla. |
| `api.post(...)`, `api.put(...)` | Le pide algo a PHP (en `src/servicios/api.ts`). |
