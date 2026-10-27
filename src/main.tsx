import {StrictMode, Suspense, lazy, type ComponentType} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from './context/ThemeContext';
import SyncDatos from './components/SyncDatos';
import {registrarModoSinInternet} from './lib/modoSinInternet';
import './index.css';

// Sin BrowserRouter: cada URL la resuelve el backend PHP (config/paginas.php)
// y le dice a esta pagina, via data-pagina, que componente montar. Navegar
// entre paginas es una recarga normal (window.location.href), no un cambio
// de ruta en memoria.
//
// Cada pantalla se descarga SOLO cuando se abre (import() = "trae este archivo
// cuando lo pida"): el login no descarga el admin, ni los mapas, ni los
// graficos. Asi la primera carga pesa mucho menos.
const PAGINAS: Record<string, () => Promise<{default: ComponentType}>> = {
  landing: () => import('./pages/Landing'),
  login: () => import('./pages/Login'),
  register: () => import('./pages/Register'),
  'forgot-password': () => import('./pages/ForgotPassword'),
  admin: () => import('./pages/AdminDashboard'),
  client: () => import('./pages/ClientDashboard'),
  kitchen: () => import('./pages/KitchenDashboard'),
  delivery: () => import('./pages/DeliveryDashboard'),
  pagar: () => import('./pages/PagarPedido'),
};

/** Lo que se ve el instante en que la pantalla se esta descargando. */
function Cargando() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f6f6f4] dark:bg-stone-950">
      <div className="w-10 h-10 rounded-full border-4 border-brand-orange/20 border-t-brand-orange animate-spin" />
    </div>
  );
}

const contenedor = document.getElementById('app');

// En "npm run dev" (sin PHP de por medio) no hay data-pagina en el HTML de
// Vite; la pantalla se elige con ?pagina=admin en la URL.
const nombrePagina =
  contenedor?.dataset.pagina ||
  new URLSearchParams(window.location.search).get('pagina') ||
  '';

const cargarPagina = PAGINAS[nombrePagina];

if (!cargarPagina) {
  // Sin pantalla valida se muestra el error en vez de abrir otra pantalla.
  contenedor!.textContent = `Pantalla no encontrada: "${nombrePagina}". Revisa $pagina en views/paginas/ (o ?pagina= con npm run dev).`;
} else {
  const Pagina = lazy(cargarPagina);
  createRoot(contenedor!).render(
    <StrictMode>
      <ThemeProvider>
        <SyncDatos />
        <Suspense fallback={<Cargando />}>
          <Pagina />
        </Suspense>
      </ThemeProvider>
    </StrictMode>,
  );
}

// Guarda los archivos del sistema en el navegador para que abra rapido
// y funcione aunque no haya internet (ver public/sw.js).
registrarModoSinInternet();
