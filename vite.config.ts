import fs from 'fs';
import zlib from 'zlib';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// Vite siempre escribe una copia transformada de index.html en outDir (es su
// entrada de build por defecto) -- pero esa index.html es solo la plantilla
// de "npm run dev" y NUNCA debe servirse en produccion: no tiene data-pagina
// ni window.__APP_BASE__/__DATOS__ (eso lo inyecta views/layouts/cabecera.php).
// Si queda en public/, Apache puede preferirla sobre index.php al resolver el
// directory index, rompiendo rutaBase() (login sin el prefijo de subcarpeta,
// 404). Se borra despues de cada build para que public/ solo tenga el front
// controller PHP + los assets compilados.
function borrarIndexHtmlDelBuild(outDir: string): Plugin {
  return {
    name: 'borrar-index-html-post-build',
    closeBundle() {
      const destino = path.resolve(outDir, 'index.html');
      if (fs.existsSync(destino)) {
        fs.unlinkSync(destino);
      }
    },
  };
}

// Cada build genera pedazos nuevos en public/assets/chunks/ (con un codigo en
// el nombre que cambia si el contenido cambia). Antes de compilar se borra la
// carpeta para que no se acumulen los pedazos viejos.
function limpiarChunksViejos(outDir: string): Plugin {
  return {
    name: 'limpiar-chunks-viejos',
    buildStart() {
      const carpeta = path.resolve(outDir, 'assets/chunks');
      if (fs.existsSync(carpeta)) {
        fs.rmSync(carpeta, { recursive: true, force: true });
      }
    },
  };
}

// Despues de compilar crea una copia comprimida (.gz) de cada .js y .css.
// public/.htaccess le entrega al navegador la copia .gz (mucho mas liviana)
// cuando la acepta. Asi funciona aunque Apache no tenga activa la compresion.
function comprimirAssets(outDir: string): Plugin {
  return {
    name: 'comprimir-assets',
    closeBundle() {
      const recorrer = (carpeta: string) => {
        if (!fs.existsSync(carpeta)) return;
        for (const nombre of fs.readdirSync(carpeta)) {
          const ruta = path.join(carpeta, nombre);
          if (fs.statSync(ruta).isDirectory()) {
            recorrer(ruta);
          } else if (/\.(js|css)$/.test(nombre)) {
            fs.writeFileSync(ruta + '.gz', zlib.gzipSync(fs.readFileSync(ruta), { level: 9 }));
          }
        }
      };
      recorrer(path.resolve(outDir, 'assets'));
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), borrarIndexHtmlDelBuild('public'), limpiarChunksViejos('public'), comprimirAssets('public')],
    // Sin carpeta de assets estáticos propia (no hay 'public/' de origen distinta
    // del destino de build); evita que Vite trate public/ como ambas cosas a la vez.
    publicDir: false,
    build: {
      // Compila directamente a la carpeta que sirve el front controller PHP.
      // emptyOutDir:false es critico: public/ ya contiene index.php y .htaccess
      // (el backend), que Vite NO debe borrar al reconstruir el frontend.
      outDir: 'public',
      emptyOutDir: false,
      // Un solo main.css para todo el sistema (la plantilla PHP lo enlaza por nombre).
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          // main.js y main.css tienen nombre FIJO: la plantilla PHP
          // (views/layouts) los enlaza directamente y agrega ?v=filemtime()
          // para que el navegador baje la version nueva.
          entryFileNames: 'assets/main.js',
          assetFileNames: (info) => {
            if (info.name && info.name.endsWith('.css')) {
              return 'assets/main.css';
            }
            return 'assets/[name][extname]';
          },
          // Cada pantalla (y las librerias que comparten) va en su propio
          // archivo dentro de assets/chunks/. main.js los pide solo cuando
          // hacen falta. El [hash] cambia cuando cambia el contenido, asi el
          // navegador puede guardarlos para siempre sin quedarse con uno viejo.
          chunkFileNames: 'assets/chunks/[name]-[hash].js',
          // Agrupa las librerias en pocos archivos compartidos (en vez de
          // decenas de archivos diminutos, uno por icono): menos peticiones
          // y el navegador los guarda una sola vez para todas las pantallas.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('lucide-react')) return 'iconos';
            if (id.includes('leaflet')) return 'mapas';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'graficos';
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify') || id.includes('canvg')) return 'pdf';
            if (id.includes('motion')) return 'animaciones';
            return undefined;
          },
        },
      },
    },
    server: {
      // En desarrollo, las llamadas a /api/* se redirigen al backend PHP de
      // Laragon (Apache). Si el proyecto vive en otra URL, define la variable de
      // entorno VITE_API_PROXY_TARGET antes de "npm run dev".
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost/copiwaypro',
          changeOrigin: true,
        },
      },
    },
  };
});
