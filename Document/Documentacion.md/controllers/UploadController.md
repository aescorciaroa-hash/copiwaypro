# controllers/UploadController.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Se encarga de subir fotos.

## ¿Qué hace?
- revisa que sea una imagen (JPG, PNG, WEBP o GIF) de máximo 5 MB
- la guarda en public/uploads/productos/ con un nombre nuevo
- devuelve la dirección de la foto

## Sus métodos
| Método | Qué hace | Ruta |
|---|---|---|
| `productImage()` | subir fotos | `POST /api/uploads/product-image` |

## ¿Con qué se conecta?
- **Lo abre:** `config/helpers.php`, cuando la pantalla pide una de sus acciones.
- **Desde la pantalla:** InventorySection.tsx.

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-5 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Controlador de Subida de imagenes (fotos de producto). La imagen se guarda en public/uploads/productos/ y en la base de datos solo va la URL."* |
| 7 | `class UploadController` | Crea la clase `UploadController`: un grupo de funciones que trabajan juntas. |
| 8 | `{` | Abre la clase `UploadController`. |
| 9 | `private $tamanoMaximo;` | Cajita `$tamanoMaximo`: el tamaño máximo de una foto. |
| 10 | `private $extensiones;` | Cajita `$extensiones`: los tipos de imagen permitidos. |
| 12 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 13 | `{` | Abre la función `__construct()`. |
| 14 | `$this->tamanoMaximo = 5 * 1024 * 1024; // 5 MB` | Guarda en `$this->tamanoMaximo` 5 MB (`5 * 1024 * 1024` = en bytes). |
| 15 | `$this->extensiones = [` | Guarda en `$this->extensiones` la lista de tipos permitidos y su extensión: |
| 16 | `'image/jpeg' => 'jpg',` | JPG. |
| 17 | `'image/png'  => 'png',` | PNG. |
| 18 | `'image/webp' => 'webp',` | WEBP. |
| 19 | `'image/gif'  => 'gif',` | GIF. |
| 20 | `];` | Cierra la lista. |
| 21 | `}` | Cierra la función `__construct()`. |
| 23 | `public function productImage()` | Función `productImage()`: sube una foto. Ruta: `POST /api/uploads/product-image`. La llama `InventorySection.tsx`. |
| 24 | `{` | Abre la función `productImage()`. |
| 25 | `if (empty($_FILES['image']) \|\| !isset($_FILES['image']['tmp_name']) \|\| $_FILES['image']['error'] !== UPLOAD_ERR_OK) {` | Si no llegó ninguna imagen (`$_FILES['image']` = el archivo que se subió) o hubo un error al subirla... |
| 26 | `responderError('No se recibió ninguna imagen válida.', 422, ['image' => ['El campo image es obligatorio.']]);` | ...responde 422 "No se recibió ninguna imagen válida.". |
| 27 | `}` | Cierra el `if`. |
| 29 | `$archivo = $_FILES['image'];` | Guarda el archivo en `$archivo`. |
| 30 | `if ($archivo['size'] > $this->tamanoMaximo) {` | Si pesa más de 5 MB... |
| 31 | `responderError('La imagen supera el tamaño máximo permitido (5 MB).', 422, ['image' => ['La imagen es demasiado grande.']]);` | ...responde 422 "La imagen supera el tamaño máximo permitido (5 MB).". |
| 32 | `}` | Cierra el `if`. |
| 34 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El tipo se revisa por el contenido real del archivo, no por su nombre."* |
| 35 | `$finfo = finfo_open(FILEINFO_MIME_TYPE);` | Abre la herramienta que revisa de qué tipo es un archivo por su contenido (`finfo_open`). |
| 36 | `$mime  = finfo_file($finfo, $archivo['tmp_name']);` | Revisa el tipo real del archivo (ej. `image/png`) y lo guarda en `$mime`. |
| 37 | `finfo_close($finfo);` | Cierra la herramienta. |
| 39 | `if (!isset($this->extensiones[$mime])) {` | Si ese tipo no está en la lista permitida... |
| 40 | `responderError('Formato de imagen no soportado. Usa JPG, PNG, WEBP o GIF.', 422, ['image' => ['Formato no soportado.']]);` | ...responde 422 "Formato de imagen no soportado. Usa JPG, PNG, WEBP o GIF.". |
| 41 | `}` | Cierra el `if`. |
| 43 | `$nombreArchivo = bin2hex(random_bytes(16)) . '.' . $this->extensiones[$mime];` | Crea un nombre nuevo al azar para la foto (`random_bytes(16)` vuelto texto con `bin2hex`) más su extensión. Lo guarda en `$nombreArchivo`. |
| 44 | `$directorio    = dirname(__DIR__) . '/public/uploads/productos';` | Guarda en `$directorio` la carpeta `public/uploads/productos`. `dirname(__DIR__)` = la carpeta del proyecto. |
| 45 | `if (!is_dir($directorio)) {` | Si esa carpeta no existe (`!is_dir`)... |
| 46 | `mkdir($directorio, 0755, true);` | ...la crea (`mkdir`). `0755` son los permisos; `true` = crea también las carpetas de adentro. |
| 47 | `}` | Cierra el `if`. |
| 49 | `if (!move_uploaded_file($archivo['tmp_name'], $directorio . '/' . $nombreArchivo)) {` | Mueve la foto a esa carpeta con el nombre nuevo (`move_uploaded_file`). Si no pudo... |
| 50 | `responderError('No se pudo guardar la imagen en el servidor.', 500);` | ...responde 500 "No se pudo guardar la imagen en el servidor.". |
| 51 | `}` | Cierra el `if`. |
| 53 | `responderJson(['url' => rutaBase() . '/uploads/productos/' . $nombreArchivo], 201);` | Responde 201 con la dirección de la foto (`url`), con la carpeta del proyecto adelante (`rutaBase()`). |
| 54 | `}` | Cierra la función `productImage()`. |
| 55 | `}` | Cierra la clase `UploadController`. |
| 57 | `$controller = new UploadController();` | Crea el controlador. Al hacer `new UploadController()` se ejecuta su `__construct()`. |
| 59 | `$accion = $_GET['accion'] ?? '';` | Guarda en `$accion` qué acción pidió la ruta (la puso `cargarControlador()` de `helpers.php`). `?? ''` = si no hay, vacío. |
| 61 | `if ($accion === 'productImage') {` | Si la acción es `'productImage'`... |
| 62 | `$controller->productImage();` | ...llama al método `productImage()` de arriba. |
| 63 | `} else {` | Si no es ninguna de las anteriores... |
| 64 | `responderError('Ruta no encontrada.', 404);` | ...responde 404 "Ruta no encontrada." (la acción no existe). |
| 65 | `}` | Cierra el `else`. |
| 66 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | subir fotos | `Failed to open stream` |
| el método `productImage()` | subir fotos | `Call to undefined method UploadController::productImage()` |
| una línea `elseif ($accion === '...')` del final | esa acción | `Ruta no encontrada.` |
| su línea en `config/rutas.php` | esa acción | `Ruta no encontrada.` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
