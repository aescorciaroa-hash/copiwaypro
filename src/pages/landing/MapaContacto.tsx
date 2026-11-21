import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Plus, Minus } from 'lucide-react';
import { UBICACION_NEGOCIO } from '../../lib/ubicacionNegocio';

// Mapa de la seccion "Contactanos" de la pagina de inicio. Va en un archivo
// aparte para que Landing lo cargue con lazy() solo cuando hace falta.
const CustomZoomControl = () => {
  const map = useMap();
  return (
    <div className="absolute top-8 left-6 flex flex-col gap-2 z-[400] pointer-events-auto">
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }}
        className="w-10 h-10 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-white/10 hover:scale-110 transition-transform text-gray-700 dark:text-white"
        title="Acercar"
      >
        <Plus size={20} />
      </button>
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }}
        className="w-10 h-10 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-white/10 hover:scale-110 transition-transform text-gray-700 dark:text-white"
        title="Alejar"
      >
        <Minus size={20} />
      </button>
    </div>
  );
};

export default function MapaContacto() {
  return (
    <MapContainer
      center={UBICACION_NEGOCIO}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      className="z-0"
    >
      <CustomZoomControl />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker 
        position={UBICACION_NEGOCIO}
        icon={L.divIcon({
          html: `<div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                   <svg viewBox="0 0 32 32" style="width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                     <path d="M16 0c-5.5 0-10 4.5-10 10 0 7.5 10 22 10 22s10-14.5 10-22c0-5.5-4.5-10-10-10z" fill="#ff7000"/>
                     <circle cx="16" cy="10" r="6" fill="#fff"/>
                     <path d="M16 12.5c-.3 0-1.8-1.5-2.5-2.2-.8-.8-.8-2 0-2.8.8-.8 2-.8 2.8 0 .2.2.4.4.5.7.1-.3.3-.5.5-.7.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8-.7.7-2.2 2.2-2.5 2.2H16z" fill="#ff7000"/>
                   </svg>
                 </div>`,
          className: 'custom-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        })}
      >
        <Popup>
          <strong>Hamburguer Copiway</strong><br/>Dark Kitchen Central
        </Popup>
      </Marker>
    </MapContainer>
  );
}
