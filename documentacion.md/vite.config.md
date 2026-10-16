# vite.config.ts

## ¿Para qué sirve?
Configura **Vite**, la herramienta que:
1. En desarrollo (`npm run dev`) sirve React con recarga automática.
2. En producción (`npm run build`) **compila** todo `src/` en dos archivos: `public/assets/main.js` y `public/assets/main.css`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usan | `npm run dev` y `npm run build` (`package.json`) | |
| → compila | `index.html` → `src/main.tsx` → todo `src/` | El punto de partida. |
| → escribe en | `public/assets/main.js` y `main.css` | Los cargan `cabecera.php` y `pie.php`. |
| → lee | Variable de entorno `VITE_API_PROXY_TARGET` (opcional) | A dónde reenviar `/api` en desarrollo. |

## Código explicado

### Función `borrarIndexHtmlDelBuild(outDir)`
Vite siempre copia un `index.html` al compilar. Ese archivo **no sirve** en este proyecto (las páginas
las genera PHP), y si queda en `public/`, Apache podría mostrarlo en vez de `index.php`. Este "plugin"
lo borra al terminar la compilación (`closeBundle`).

### Configuración principal
| Opción | Qué hace |
|---|---|
| `process.env.VITE_API_PROXY_TARGET` | Lee la variable de entorno del sistema (si no existe, usa `http://localhost/copiwaypro`, el Apache de Laragon). |
| `base: './'` | Rutas relativas (funciona en subcarpeta). |
| `plugins: [react(), tailwindcss(), ...]` | Activa React, Tailwind y el plugin de arriba. |
| `alias: {'@': ...}` | Permite escribir `@/src/...` en los `import`. |
| `publicDir: false` | No copiar ninguna carpeta extra. |
| `outDir: 'public'` | Compilar dentro de `public/`. |
| `emptyOutDir: false` | **Muy importante:** no borrar `public/` antes de compilar (ahí están `index.php` y `.htaccess`). |
| `entryFileNames: 'assets/main.js'` | Nombre fijo del JavaScript. |
| `assetFileNames` | El CSS siempre se llama `assets/main.css`. |
| `inlineDynamicImports: true` | Todo en un solo archivo JS. |

Los nombres son **fijos** (sin códigos raros) porque `cabecera.php` y `pie.php` los escriben a mano.
Para que el navegador no use una versión vieja, el PHP agrega `?v=fecha` al final.

### `server.proxy`
```ts
proxy: { '/api': { target: process.env.VITE_API_PROXY_TARGET || 'http://localhost/copiwaypro', changeOrigin: true } }
```
Con `npm run dev`, React corre en el puerto 3000 pero la API está en PHP. Esto reenvía cada llamada
`/api/...` al servidor PHP.
