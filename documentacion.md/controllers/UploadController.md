# controllers/UploadController.php

## ¿Para qué sirve?
Sube las **fotos de los productos** y de los insumos. La imagen se guarda como archivo en
`public/uploads/productos/` y en la base de datos solo se guarda su dirección (URL).

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| Ruta | `POST /api/uploads/product-image` → método `productImage()` (solo admin) |
| ← lo llama | `subirArchivo()` de `src/servicios/api.ts`, usado en `admin/MenuSection.tsx` e `admin/InventorySection.tsx` |
| → guarda en | `public/uploads/productos/` |
| → la URL va a | el campo `image` del producto o insumo (lo guarda después `ProductController` / `InventoryController`) |

## Variables importantes
| Variable | Para qué sirve |
|---|---|
| `$this->tamanoMaximo` | Límite: 5 MB (`5 * 1024 * 1024` bytes). |
| `$this->extensiones` | Tipos permitidos y su extensión: `image/jpeg → jpg`, `image/png → png`, `webp`, `gif`. |
| `$_FILES['image']` | El archivo enviado (PHP lo llena solo). Trae `tmp_name` (dónde quedó temporalmente), `size`, `error`. |
| `$mime` | El tipo **real** del archivo, leído de su contenido. |
| `$nombreArchivo` | Nombre nuevo al azar, ej: `3fa9...c1.png`. |

## Código explicado
```php
if (empty($_FILES['image']) || ... || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
```
Revisa que sí llegó un archivo y sin errores. `UPLOAD_ERR_OK` = subida correcta.

```php
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $archivo['tmp_name']);
```
Lee el tipo **mirando el contenido**, no el nombre. Así nadie puede subir un programa llamado `foto.jpg`.

```php
$nombreArchivo = bin2hex(random_bytes(16)) . '.' . $this->extensiones[$mime];
```
Inventa un nombre al azar para no pisar otras fotos.

```php
move_uploaded_file($archivo['tmp_name'], $directorio . '/' . $nombreArchivo)
```
Mueve el archivo desde la carpeta temporal de PHP a `public/uploads/productos/`.

Responde **201** con `{"url": "/copiwaypro/uploads/productos/nombre.png"}`.
