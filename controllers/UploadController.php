<?php
/**
 * Controlador de Subida de imagenes (fotos de producto).
 * La imagen se guarda en public/uploads/productos/ y en la base de datos solo va la URL.
 */

class UploadController
{
    private $tamanoMaximo;
    private $extensiones;

    public function __construct()
    {
        $this->tamanoMaximo = 5 * 1024 * 1024; // 5 MB
        $this->extensiones = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];
    }

    public function productImage()
    {
        if (empty($_FILES['image']) || !isset($_FILES['image']['tmp_name']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            responderError('No se recibió ninguna imagen válida.', 422, ['image' => ['El campo image es obligatorio.']]);
        }

        $archivo = $_FILES['image'];
        if ($archivo['size'] > $this->tamanoMaximo) {
            responderError('La imagen supera el tamaño máximo permitido (5 MB).', 422, ['image' => ['La imagen es demasiado grande.']]);
        }

        // El tipo se revisa por el contenido real del archivo, no por su nombre.
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $archivo['tmp_name']);
        finfo_close($finfo);

        if (!isset($this->extensiones[$mime])) {
            responderError('Formato de imagen no soportado. Usa JPG, PNG, WEBP o GIF.', 422, ['image' => ['Formato no soportado.']]);
        }

        $nombreArchivo = bin2hex(random_bytes(16)) . '.' . $this->extensiones[$mime];
        $directorio    = dirname(__DIR__) . '/public/uploads/productos';
        if (!is_dir($directorio)) {
            mkdir($directorio, 0755, true);
        }

        if (!move_uploaded_file($archivo['tmp_name'], $directorio . '/' . $nombreArchivo)) {
            responderError('No se pudo guardar la imagen en el servidor.', 500);
        }

        responderJson(['url' => rutaBase() . '/uploads/productos/' . $nombreArchivo], 201);
    }
}

$controller = new UploadController();

$accion = $_GET['accion'] ?? '';

if ($accion === 'productImage') {
    $controller->productImage();
} else {
    responderError('Ruta no encontrada.', 404);
}
?>