# public/ — imágenes e íconos

## ¿Para qué sirve?
Son los **íconos** de la app: el de la pestaña del navegador y el que sale al agregarla a la pantalla
de inicio del celular. No son código, son imágenes; por eso se documentan juntos.

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

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| un ícono (`favicon.ico`, `favicon-32.png`, `favicon.svg`) | la página funciona igual; la pestaña muestra el ícono genérico del navegador y la consola marca un 404 |
| `apple-touch-icon.png` | en iPhone, al agregarla a la pantalla de inicio sale una captura de la página en vez del logo |
| `favicon.svg` | además, la app instalada (`manifest.json`) y las notificaciones (`sw.js`) quedan sin ícono |
| `public/assets/` | la página sale **en blanco** hasta volver a ejecutar `npm run build` |
| `public/uploads/productos/` | los productos pierden su foto (se ve la imagen por defecto); se vuelve a crear sola al subir una foto |
