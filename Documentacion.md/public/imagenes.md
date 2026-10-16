# public/ — imágenes e íconos

Estos archivos no son código, son imágenes. Se documentan juntos.

| Archivo | Para qué | Lo usa |
|---|---|---|
| `favicon.ico` | Ícono de la pestaña (navegadores antiguos). | `cabecera.php` |
| `favicon-32.png` | Ícono de la pestaña en 32×32 píxeles. | `cabecera.php` |
| `favicon.svg` | Ícono en vectores (se ve nítido en cualquier tamaño). | `cabecera.php`, `manifest.json`, `sw.js` |
| `apple-touch-icon.png` | Ícono cuando se agrega la página a la pantalla de inicio de un iPhone. | `cabecera.php` |

En `cabecera.php` se cargan con `?v=3` al final. Si se cambia un ícono, se sube ese número para que el
navegador no siga mostrando el viejo.

## Carpetas que se generan (no están en Git)
| Carpeta | Qué contiene | Quién la crea |
|---|---|---|
| `public/assets/` | `main.js` y `main.css`: todo React compilado. | `npm run build` (ver `vite.config.ts`) |
| `public/uploads/productos/` | Fotos subidas por el admin. | `UploadController.php` |
