// Registra el Service Worker (public/sw.js) en TODAS las paginas, no solo
// cuando el cliente activa las notificaciones. El Service Worker guarda los
// archivos del sistema (codigo, estilos, letra, fotos, mapas) para que cada
// vista abra rapido y siga funcionando sin internet.

import { rutaBase } from '../servicios/api';

export function registrarModoSinInternet(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  // En "npm run dev" no hay sw.js (lo sirve PHP/Apache), asi que no se registra.
  // Solo las paginas servidas por PHP traen data-pagina en el HTML.
  if (!document.getElementById('app')?.dataset.pagina) return;

  const base = rutaBase() || '/';
  const scope = base.endsWith('/') ? base : base + '/';

  // Se registra cuando la pagina ya termino de cargar, para no competir
  // con la descarga de la pantalla.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}/sw.js`, { scope }).catch(() => {
      // Si falla, la app funciona igual; solo no queda guardada sin internet.
    });
  });
}
