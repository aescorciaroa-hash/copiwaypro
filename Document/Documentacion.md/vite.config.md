# vite.config.ts

## ¿Para qué sirve?
Configura cómo se compila React.

## ¿Qué hace?
- compila `src/` y deja el resultado en `public/assets/`: `main.js`, `main.css` y la carpeta `chunks/`
  (un archivo por pantalla y por librería grande)
- crea una copia comprimida (`.gz`) de cada archivo para que viajen más livianos
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
| `cssCodeSplit: false` | Todos los estilos quedan en un solo `main.css` (la cabecera lo carga por nombre). |
| `chunkFileNames: 'assets/chunks/[name]-[hash].js'` | **Cada pantalla va en su propio archivo** dentro de `assets/chunks/` (ej. `Login-CV0yerGf.js`). `main.js` los pide solo cuando hacen falta: el login no descarga el admin. `[hash]` es un código que **cambia cuando cambia el contenido**, así el navegador puede guardarlos para siempre sin quedarse con uno viejo. |
| `manualChunks(id)` | Junta las librerías en pocos archivos compartidos: `iconos` (lucide), `mapas` (leaflet), `graficos` (recharts), `pdf` (jsPDF), `animaciones` (motion). Sin esto saldrían decenas de archivos diminutos (uno por ícono). |
| `limpiarChunksViejos('public')` | Plugin propio. **Antes** de compilar (`buildStart`) borra `public/assets/chunks/`, para que no se acumulen los archivos de compilaciones anteriores. |
| `comprimirAssets('public')` | Plugin propio. **Después** de compilar (`closeBundle`) recorre `public/assets/` y crea una copia `.gz` de cada `.js` y `.css` con `zlib.gzipSync` (nivel 9 = máxima compresión). `public/.htaccess` le entrega esa copia al navegador. `main.js` pasa de ~195 KB a ~62 KB. |
| `server.proxy['/api']` | En `npm run dev`, envía `/api/...` a `http://localhost/copiwaypro` (o a `VITE_API_PROXY_TARGET` si existe). |

## ¿Con qué se conecta?
- **Se usa con:** `npm run build` y `npm run dev`.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | `npm run build` deja de funcionar bien |
| el plugin `borrarIndexHtmlDelBuild` | queda un `public/index.html`; Apache puede abrirlo en vez de `index.php` y el login sale con 404 |
| `emptyOutDir: false` (o se cambia a `true`) | al compilar se borran `index.php` y `.htaccess`: **todo el sistema** deja de abrir |
| `limpiarChunksViejos` | todo funciona, pero `public/assets/chunks/` se llena de archivos viejos en cada compilación |
| `comprimirAssets` | todo funciona, pero los archivos viajan sin comprimir (unas 3 veces más pesados) |
| `chunkFileNames` | los archivos de cada pantalla quedan sueltos en `assets/` con nombres al azar; funciona, pero el Service Worker ya no los reconoce como "nunca cambian" |
| los nombres fijos de `rollupOptions` | se generan archivos con otro nombre y la página sale en blanco (cabecera y pie buscan `main.js` y `main.css`) |
