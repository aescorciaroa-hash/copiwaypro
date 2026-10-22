import {StrictMode, type ComponentType} from 'react';
import {createRoot} from 'react-dom/client';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import PagarPedido from './pages/PagarPedido';
import {ThemeProvider} from './context/ThemeContext';
import SyncDatos from './components/SyncDatos';
import './index.css';

// Sin BrowserRouter: cada URL la resuelve el backend PHP (config/paginas.php)
// y le dice a esta pagina, via data-pagina, que componente montar. Navegar
// entre paginas es una recarga normal (window.location.href), no un cambio
// de ruta en memoria.
const PAGINAS: Record<string, ComponentType> = {
  landing: Landing,
  login: Login,
  register: Register,
  'forgot-password': ForgotPassword,
  admin: AdminDashboard,
  client: ClientDashboard,
  kitchen: KitchenDashboard,
  delivery: DeliveryDashboard,
  pagar: PagarPedido,
};

const contenedor = document.getElementById('app');

// En "npm run dev" (sin PHP de por medio) no hay data-pagina en el HTML de
// Vite; la pantalla se elige con ?pagina=admin en la URL.
const nombrePagina =
  contenedor?.dataset.pagina ||
  new URLSearchParams(window.location.search).get('pagina') ||
  '';

const Pagina = PAGINAS[nombrePagina];

if (!Pagina) {
  // Sin pantalla valida se muestra el error en vez de abrir otra pantalla.
  contenedor!.textContent = `Pantalla no encontrada: "${nombrePagina}". Revisa $pagina en views/paginas/ (o ?pagina= con npm run dev).`;
} else {
  createRoot(contenedor!).render(
    <StrictMode>
      <ThemeProvider>
        <SyncDatos />
        <Pagina />
      </ThemeProvider>
    </StrictMode>,
  );
}
