# vite.config.ts

## ¿Para qué sirve?
Configura cómo se compila React.

## ¿Qué hace?
- compila `src/` y deja el resultado en `public/assets/` (main.js y main.css)
- en `npm run dev`, manda las llamadas `/api` al Apache de Laragon

## Código explicado
| Parte | Qué hace |
|---|---|
| `base: './'` | Las rutas de los archivos compilados son relativas, así funciona dentro de la subcarpeta `/copiwaypro`. |
| `plugins: [react(), tailwindcss(), ...]` | Activa React y Tailwind, más el plugin propio de abajo. |
| `borrarIndexHtmlDelBuild('public')` | Plugin propio. Vite siempre deja una copia de `index.html` en `public/`, pero esa página es solo para `npm run dev`. Si se queda, Apache podría abrirla en vez de `index.php` y el login fallaría (404). Por eso, al terminar de compilar (`closeBundle`), la borra con `fs.unlinkSync`. |
| `publicDir: false` | No usa una carpeta de archivos estáticos aparte (la salida ya es `public/`). |
| `outDir: 'public'` | Compila directo a `public/`, la carpeta que sirve PHP. |
| `emptyOutDir: false` | **Muy importante:** no vacía `public/` antes de compilar. Si fuera `true`, borraría `index.php`, `.htaccess`, `sw.js` y los íconos. |
| `entryFileNames: 'assets/main.js'` y `assetFileNames` | Nombres fijos (`main.js`, `main.css`) sin códigos al azar, porque `cabecera.php` y `pie.php` los cargan por ese nombre. |
| `inlineDynamicImports: true` | Todo React queda en un solo `main.js`. |
| `server.proxy['/api']` | En `npm run dev`, envía `/api/...` a `http://localhost/copiwaypro` (o a `VITE_API_PROXY_TARGET` si existe). |

## ¿Con qué se conecta?
- **Se usa con:** `npm run build` y `npm run dev`.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | `npm run build` deja de funcionar bien |
| el plugin `borrarIndexHtmlDelBuild` | queda un `public/index.html`; Apache puede abrirlo en vez de `index.php` y el login sale con 404 |
| `emptyOutDir: false` (o se cambia a `true`) | al compilar se borran `index.php` y `.htaccess`: **todo el sistema** deja de abrir |
| los nombres fijos de `rollupOptions` | se generan archivos con otro nombre y la página sale en blanco (cabecera y pie buscan `main.js` y `main.css`) |
