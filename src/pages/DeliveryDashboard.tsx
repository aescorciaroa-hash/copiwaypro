import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ToastNotification, ToastData } from '../components/ToastNotification';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ArrowLeft, ArrowRight, User, Bike, Wallet, Package, Clock, Map as MapIcon,  
  MapPin, LogOut, Navigation, Phone, CheckCircle, CheckCircle2, MessageCircle, AlertCircle, Utensils, Plus, Minus, X, Target
, Sun, Moon, Eye, EyeOff, Undo2 } from 'lucide-react';
import { useStore, Order } from '../store/almacenAplicacion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCOP, orderCode, vehicleWithModel } from '../lib/format';
import { api, ApiError, irA } from '../servicios/api';

const RoutePolyline = ({ origin, destination, outerColor, innerColor, onRouteLoaded }: { origin: [number, number], destination: [number, number], outerColor: string, innerColor: string, onRouteLoaded?: (coords: [number, number][]) => void }) => {
  const [positions, setPositions] = React.useState<[number, number][]>([]);

  React.useEffect(() => {
    fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setPositions(coords);
          if (onRouteLoaded) onRouteLoaded(coords);
        }
      })
      .catch(err => {
        console.warn("Error fetching route, falling back to straight line:", err);
        const fallbackCoords = [origin, destination];
        setPositions(fallbackCoords);
        if (onRouteLoaded) onRouteLoaded(fallbackCoords);
      });
  }, [origin[0], origin[1], destination[0], destination[1]]);

  if (!positions.length) return null;

  return (
    <>
      <Polyline positions={positions} pathOptions={{ color: outerColor, weight: 8, lineCap: 'round', lineJoin: 'round', opacity: 1 }} />
      <Polyline positions={positions} pathOptions={{ color: innerColor, weight: 4, lineCap: 'round', lineJoin: 'round', opacity: 1 }} />
    </>
  );
};


function MapEffect({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

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

export default function DeliveryDashboard() {
    const { theme, toggleTheme } = useTheme();

  const { orders, updateOrderStatus, takeOrder: takeOrderApi, releaseOrder: releaseOrderApi, staff, confirmDelivery, updateDriverLocation, saveOrderDestination } = useStore();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Reloj del login (se actualiza cada 30 segundos) y saludo según la hora
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  // Saludo del login: "santiago" o "santiago@copiway.com" → "Santiago"
  const usuarioEscrito = username.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const saludoNombre = usuarioEscrito ? usuarioEscrito.charAt(0).toUpperCase() + usuarioEscrito.slice(1) : '';
  const hora = time.getHours();
  const saludoHora = hora < 12 ? 'Buenos días ☀️' : hora < 19 ? 'Buenas tardes 🌤️' : 'Buenas noches 🌙';
  const [toastData, setToastData] = useState<ToastData | null>(null);

  const showToast = (type: ToastData['type'] = 'info', message: string, title?: string) => {
    setToastData({ type, message, title });
  };
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTargetOrder, setPinTargetOrder] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [isAvailable, setIsAvailable] = useState(true);
  const [acceptedOrders, setAcceptedOrders] = useState<string[]>([]);

  // Filter deliveries
  // If disconnected, only show already accepted ones, else show all Listos and En Camino
  const deliveries = orders.filter(o => 
    (o.status === 'Listos' || o.status === 'En Camino') &&
    (isAvailable || acceptedOrders.includes(o.id) || o.status === 'En Camino')
  );

  const [activeRoute, setActiveRoute] = useState<Order | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([2.9273, -75.2818]);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (activeRoute) {
      // Si el destino ya está ubicado (lo guardó antes este domiciliario), se usa tal cual.
      if (activeRoute.lat != null && activeRoute.lng != null) {
        const coords: [number, number] = [activeRoute.lat, activeRoute.lng];
        setDestCoords(coords);
        setMapCenter(coords);
        return;
      }
      const searchAddress = async () => {
        try {
          const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(activeRoute.address + ', Neiva, Huila'));
          const data = await res.json();
          if (data && data.length > 0) {
            const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            setDestCoords(coords);
            setMapCenter(coords);
            // Se guarda en el pedido para que el mapa del administrador muestre la ruta.
            saveOrderDestination(activeRoute.id, coords).catch(() => {});
          }
        } catch(e) {}
      };
      searchAddress();
    } else {
      setDestCoords(null);
    }
  }, [activeRoute?.id, activeRoute?.address, activeRoute?.lat, activeRoute?.lng]);

  // Si el administrador corrige la dirección del pedido en curso, la ruta se
  // actualiza sola y se avisa al domiciliario.
  useEffect(() => {
    if (!activeRoute) return;
    const actual = orders.find(o => o.id === activeRoute.id);
    if (actual && actual.address !== activeRoute.address) {
      setActiveRoute(prev => prev ? { ...prev, address: actual.address, lat: actual.lat, lng: actual.lng } : prev);
      showToast('warning', `La nueva dirección de entrega es: ${actual.address}`, 'Dirección Actualizada');
    }
  }, [orders]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { user } = await api.post<{ user: { id: string; role: string; name?: string } }>('/auth/login', {
        email: username,
        pin: loginPin,
      });
      if (user.role !== 'delivery') {
        await api.post('/auth/logout').catch(() => {});
        setLoginError('Esta cuenta no tiene acceso al panel de domiciliarios.');
        return;
      }
      setLoggedInUserId(user.id);
      setIsLoggedIn(true);
      const nombre = (user.name || '').trim().split(/\s+/)[0];
      showToast('success', 'Que tengas un excelente turno de entregas.', nombre ? `¡Hola, ${nombre}!` : '¡Bienvenido!');
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Usuario o PIN incorrectos.');
    }
  };

  
  useEffect(() => {
    let watchId: number;
    let simInterval: number;

    if (isLoggedIn && loggedInUserId) {
      let isUsingMock = false;
      let currentMockLoc: [number, number] = [2.9273, -75.2818];
      // El GPS puede reportar varias veces por segundo: al servidor se envía como máximo cada 10 s.
      let lastSentAt = 0;

      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            isUsingMock = false;
            const { latitude, longitude } = position.coords;
            setMapCenter([latitude, longitude]);
            const now = Date.now();
            if (now - lastSentAt >= 10000) {
              lastSentAt = now;
              updateDriverLocation(loggedInUserId, [latitude, longitude]).catch(() => {});
            }
          },
          (error) => {
            isUsingMock = true;
            console.warn('Error tracking location, using mock fallback:', error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        isUsingMock = true;
      }

      // Simulador de respaldo (sin GPS o sin permiso): solo mueve el mapa de este
      // celular; esa posición inventada NO se envía al servidor.
      simInterval = window.setInterval(() => {
        if (isUsingMock) {
           // If there is an active route and dest coords, move towards it
           if (activeRoute && destCoords && activeRoute.status === 'En Camino') {
             const latDiff = destCoords[0] - currentMockLoc[0];
             const lonDiff = destCoords[1] - currentMockLoc[1];
             // Move 2% of the remaining distance every 2 seconds to simulate driving smoothly
             currentMockLoc = [currentMockLoc[0] + latDiff * 0.02, currentMockLoc[1] + lonDiff * 0.02];
           } else {
             // Idle at kitchen (slightly offset so it doesn't overlap perfectly with the burger icon)
             currentMockLoc = [2.9274, -75.2817];
           }
           setMapCenter(currentMockLoc);
        }
      }, 2000);
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (simInterval) clearInterval(simInterval);
    };
  }, [isLoggedIn, loggedInUserId, updateDriverLocation, activeRoute, destCoords]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    type: 'info',
    onConfirm: () => {},
  });

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cerrar Sesión de Domiciliario',
      message: '¿Estás seguro de que deseas salir del panel de domiciliario de Hamburguer Copiway?',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Permanecer',
      type: 'info',
      onConfirm: () => {
        api.post('/auth/logout').catch(() => {});
        showToast('warning', 'Cerraste sesión en el panel de domiciliario.', 'Sesión Finalizada');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoggedIn(false);
        setUsername('');
        setLoginPin('');
        irA('/login');
      }
    });
  };

  const takeOrder = async (orderId: string) => {
    // La asignación se persiste al tomar el pedido (no al iniciar la ruta).
    try {
      await takeOrderApi(orderId);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo tomar el pedido. Intenta de nuevo.';
      showToast('danger', message, 'No se Pudo Tomar el Pedido');
      return;
    }
    if (!acceptedOrders.includes(orderId)) {
      setAcceptedOrders([...acceptedOrders, orderId]);
      showToast('info', `Tomaste el pedido #${orderId}. Prepárate para iniciar la ruta.`, 'Pedido Asignado');
    }
  };

  const releaseOrder = async (orderId: string) => {
    try {
      await releaseOrderApi(orderId);
      setAcceptedOrders(prev => prev.filter(id => id !== orderId));
      if (activeRoute?.id === orderId) setActiveRoute(null);
      showToast('info', 'Soltaste el pedido. Quedó disponible para otros domiciliarios.', 'Pedido Liberado');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo soltar el pedido. Intenta de nuevo.';
      showToast('danger', message, 'No se Pudo Soltar');
    }
  };

  const startTrip = async (orderId: string) => {
    // updateOrder() NO persiste status/driver en el servidor (solo hace un
    // patch optimista local para 'rating'/'reviewText'); antes esta funcion
    // solo cambiaba el estado local, así que el pedido en la BD se quedaba en
    // 'listo' sin domiciliario asignado. Al llegar al PIN de entrega, el
    // backend rechazaba la confirmación porque, según sus propios datos, el
    // pedido nunca había sido aceptado. Hay que llamar al endpoint real
    // (accept) y esperar su confirmación antes de tratarlo como iniciado.
    try {
      await updateOrderStatus(orderId, 'En Camino');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo iniciar la ruta. Intenta de nuevo.';
      showToast('danger', message, 'No se Pudo Iniciar la Ruta');
      setAcceptedOrders(prev => prev.filter(id => id !== orderId));
      return;
    }

    const currentDriver = staff.find(s => s.id === loggedInUserId && s.role === 'Domiciliario');

    // El pedido en curso del domiciliario lo calcula el servidor (pedido 'en_camino' asignado).
    const order = deliveries.find(d => d.id === orderId) || orders.find(o => o.id === orderId);
    if (order) {
      setActiveRoute({
        ...order,
        status: 'En Camino',
        driverName: order.driverName || currentDriver?.name,
        driverPhone: order.driverPhone || currentDriver?.phone,
        driverPlate: order.driverPlate || currentDriver?.plate,
        driverVehicle: order.driverVehicle || vehicleWithModel(currentDriver?.vehicle, currentDriver?.vehicleModel)
      });
      showToast('cart', `Ruta hacia ${order.address} iniciada.`, 'Ruta Iniciada');
    }
  };

  const markDelivered = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.requiresDeliveryPin) {
      setPinTargetOrder(orderId);
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
      return;
    }
    
    executeDelivery(orderId);
  };

  const executeDelivery = async (orderId: string, pin?: string): Promise<boolean> => {
    // Regla 8: el PIN se verifica en el servidor, no solo en el navegador.
    if (pin) {
      try {
        await confirmDelivery(orderId, pin);
      } catch (err) {
        setPinError(err instanceof ApiError ? err.message : 'No se pudo confirmar la entrega.');
        return false;
      }
    } else {
      updateOrderStatus(orderId, 'Entregado');
    }

    setAcceptedOrders(prev => prev.filter(id => id !== orderId));
    showToast('success', `El pedido #${orderId} fue entregado con éxito.`, 'Pedido Entregado');
    if (activeRoute?.id === orderId) setActiveRoute(null);
    return true;
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-[100dvh] bg-[#f6f6f4] dark:bg-stone-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Fondo: manchas de color suaves y una cuadrícula de puntos (igual al login de cocina) */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-brand-orange/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-amber-300/25 dark:bg-amber-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.08] pointer-events-none [background-image:radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:22px_22px]"></div>

        <div className="relative w-full max-w-[960px] bg-white dark:bg-[#151515] rounded-[36px] overflow-hidden border border-white dark:border-stone-800 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] dark:shadow-black/60 grid md:grid-cols-[1.05fr_1fr] md:min-h-[600px]">

          {/* Lado izquierdo (solo en pantallas grandes): foto, marca y frase */}
          <div className="hidden md:flex relative flex-col justify-between p-10 bg-[#141414] text-white overflow-hidden">
            {/* Foto de fondo (repartidor en moto de noche) con un degradado oscuro encima para que se lea el texto */}
            <img loading="eager" decoding="async"
              src="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?q=80&w=1000&auto=format&fit=crop"
              alt="Domiciliario en moto entregando un pedido"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/45 to-[#141414]/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/50 to-transparent"></div>
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-orange/25 blur-[90px]"></div>
            <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]"></div>

            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/40">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="font-black text-lg block">Copiway<span className="text-brand-orange">PRO</span></span>
                <span className="text-[11px] font-semibold text-white/50">Panel de Domiciliario</span>
              </div>
            </div>

            <div className="relative">
              <h2 className="font-black text-[32px] leading-[1.05] tracking-tight">Cada pedido,<br /><span className="text-brand-orange">a tiempo.</span></h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { icon: MapIcon, text: 'Ruta en el mapa' },
                  { icon: MapPin, text: 'Dirección exacta' },
                  { icon: Phone, text: 'Llama al cliente' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/10 text-xs font-semibold text-white/80">
                    <Icon className="w-3.5 h-3.5 text-brand-orange" /> {text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Lado derecho: formulario */}
          <div className="px-6 py-7 sm:px-10 sm:py-9 flex flex-col">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => irA('/login')}
                className="inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-full border border-gray-200 dark:border-stone-700 text-xs font-bold text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 dark:text-stone-500 tabular-nums">
                  {time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                {/* Cambiar entre modo claro y oscuro */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                  className="w-9 h-9 rounded-full border border-gray-200 dark:border-stone-700 flex items-center justify-center text-gray-500 dark:text-stone-400 hover:text-brand-orange dark:hover:text-brand-orange hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Saludo + formulario centrados en el alto de la tarjeta */}
            <div className="flex-1 flex flex-col justify-center py-6">
            {/* Saludo: usa el usuario que va escribiendo (ej. "santiago" → "Santiago") */}
            <div className="mb-8 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black transition-all duration-300 ${
                saludoNombre ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30 rotate-0' : 'bg-orange-50 dark:bg-brand-orange/10 text-brand-orange -rotate-6'
              }`}>
                {saludoNombre ? saludoNombre.charAt(0) : <Bike className="w-7 h-7" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-500 dark:text-stone-400">{saludoHora}</p>
                <h1 className="font-black text-[28px] leading-tight tracking-tight text-gray-900 dark:text-white truncate">
                  Hola, <span className="text-brand-orange">{saludoNombre || 'equipo'}</span> 👋
                </h1>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-stone-400 mb-2 uppercase tracking-wider">Usuario</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.trim())}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 dark:bg-stone-900 border-2 border-gray-100 dark:border-stone-800 focus:bg-white dark:focus:bg-stone-900 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none transition-all text-base text-gray-900 dark:text-white font-semibold placeholder:font-medium placeholder:text-gray-400"
                    placeholder="Tu usuario, ej: santiago"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-stone-400 uppercase tracking-wider">PIN de acceso</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {/* 4 casillas del PIN: el input real es invisible y está encima de las casillas */}
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={4}
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="peer absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                    aria-label="PIN de acceso"
                  />
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map(i => {
                      const digito = loginPin[i];
                      const esActual = i === Math.min(loginPin.length, 3);
                      return (
                        <div
                          key={i}
                          className={`h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                            digito
                              ? 'bg-orange-50 dark:bg-brand-orange/10 border-brand-orange/40 text-gray-900 dark:text-white'
                              : 'bg-gray-50 dark:bg-stone-900 border-gray-100 dark:border-stone-800 text-gray-300'
                          } ${esActual ? 'group-focus-within:border-brand-orange group-focus-within:bg-white dark:group-focus-within:bg-stone-900 group-focus-within:ring-4 group-focus-within:ring-brand-orange/10' : ''}`}
                        >
                          {digito
                            ? (showPassword ? digito : <span className="w-3.5 h-3.5 rounded-full bg-gray-900 dark:bg-white"></span>)
                            : <span className={`w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-stone-600 ${esActual ? 'group-focus-within:w-0.5 group-focus-within:h-6 group-focus-within:rounded-sm group-focus-within:bg-brand-orange group-focus-within:animate-pulse' : ''}`}></span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100 dark:border-red-900/50">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={!username || loginPin.length < 4}
                className="group/btn relative !mt-7 w-full h-14 rounded-2xl overflow-hidden font-black text-base text-white inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-orange to-[#ff8a1f] shadow-[0_12px_30px_-8px_rgba(255,107,0,0.6)] hover:shadow-[0_16px_36px_-8px_rgba(255,107,0,0.75)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer disabled:from-orange-100 disabled:to-orange-100 disabled:text-orange-300 dark:disabled:from-brand-orange/10 dark:disabled:to-brand-orange/10 dark:disabled:text-brand-orange/40 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
              >
                {/* Brillo que cruza el botón al pasar el mouse */}
                <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-0 group-hover/btn:translate-x-[300%] group-disabled/btn:hidden transition-transform duration-700"></span>
                <Bike className="w-5 h-5" />
                Empezar a repartir
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
              </button>
              <p className="text-center text-[11px] text-gray-400 dark:text-stone-500 font-medium">¿Olvidaste tu PIN? Pídele al administrador que te asigne uno nuevo.</p>
            </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderMap = () => {
    if (!activeRoute) {
      return (
        <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-white dark:bg-[#151515] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] flex flex-col items-center justify-center p-6 text-center">
          {/* Fondo suave: luz naranja borrosa y cuadrícula de puntos que se desvanece */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-brand-orange/10 blur-[100px] pointer-events-none"></div>
          <div className="absolute inset-0 opacity-[0.45] dark:opacity-[0.08] pointer-events-none [background-image:radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"></div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-orange/15 to-amber-400/10 flex items-center justify-center mb-5">
              <MapPin className="w-9 h-9 text-brand-orange" />
            </div>
            <h3 className="font-black text-gray-900 dark:text-white text-xl">Sin ruta activa</h3>
            <p className="text-sm text-gray-500 dark:text-stone-400 mt-2 max-w-xs mx-auto">Toca <span className="font-bold text-gray-700 dark:text-stone-200">Mapa</span> en un pedido para ver su ruta aquí.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#f1f5f9] dark:bg-[#0f172a] rounded-[28px] overflow-hidden relative shadow-[0_20px_50px_-24px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)]">
        <div className={`absolute inset-0 z-0 [&_.leaflet-container]:bg-transparent [&_.leaflet-control-container]:z-[500] ${theme === 'dark' ? 'leaflet-dark-tiles' : ''}`}>
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            className="z-0"
          >
            <CustomZoomControl />
            <MapEffect center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker 
              position={destCoords || mapCenter} 
              icon={L.divIcon({
                html: `<div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                         <svg viewBox="0 0 32 32" style="width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                           <path d="M16 0c-5.5 0-10 4.5-10 10 0 7.5 10 22 10 22s10-14.5 10-22c0-5.5-4.5-10-10-10z" fill="#ea4335"/>
                           <circle cx="16" cy="10" r="6" fill="#fff"/>
                           <path d="M16 12.5c-.3 0-1.8-1.5-2.5-2.2-.8-.8-.8-2 0-2.8.8-.8 2-.8 2.8 0 .2.2.4.4.5.7.1-.3.3-.5.5-.7.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8-.7.7-2.2 2.2-2.5 2.2H16z" fill="#ea4335"/>
                         </svg>
                       </div>`,
                className: 'custom-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })}
            >
              <Popup>Hamburguer Copiway</Popup>
            </Marker>
            
            <RoutePolyline 
               origin={[2.9273, -75.2818]} 
               destination={[2.9380, -75.2900]} 
               outerColor="#1e3a8a" 
               innerColor="#3b82f6" 
             />
            <Marker 
              position={[2.9380, -75.2900]} 
              icon={L.divIcon({
                html: `<div style="width: 24px; height: 24px; background-color: #3b82f6; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6); cursor: pointer;"></div>`,
                className: 'custom-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            />
            {destCoords && (
                <RoutePolyline
                  origin={mapCenter}
                  destination={destCoords}
                  outerColor="#b91c1c"
                  innerColor="#ea4335"
                />
              )}
            </MapContainer>
        </div>
        
        <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between pointer-events-none">
          {/* Tarjeta de destino (vidrio) */}
          <div className="self-start w-full max-w-md bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-[22px] p-4 shadow-xl shadow-black/10 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-orange/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-stone-500 uppercase tracking-wider">Destino · <span className="text-brand-orange">#{orderCode(activeRoute.id)}</span></p>
                <p className="font-black text-base text-gray-900 dark:text-white truncate">{activeRoute.address}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 text-xs font-bold shrink-0">
                <Clock className="w-3.5 h-3.5" /> 12 min
              </span>
            </div>
          </div>

          {activeRoute.status === 'En Camino' && (
            <div className="flex flex-col sm:flex-row gap-2 pointer-events-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    showToast('info', 'Abriendo ruta en el mapa...', 'Navegación');
                    window.open(`https://waze.com/ul?q=${encodeURIComponent(activeRoute.address + ', Neiva, Huila')}`, '_blank');
                  }}
                  className="h-12 px-4 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md text-sky-600 dark:text-sky-400 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:bg-white dark:hover:bg-stone-900 transition-colors cursor-pointer"
                >
                  <MapIcon className="w-4.5 h-4.5" /> Waze
                </button>
                <button
                  onClick={() => {
                    showToast('info', 'Abriendo ruta en el mapa...', 'Navegación');
                    window.open(`https://maps.google.com/?q=${encodeURIComponent(activeRoute.address + ', Neiva, Huila')}`, '_blank');
                  }}
                  className="h-12 px-4 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:bg-white dark:hover:bg-stone-900 transition-colors cursor-pointer"
                >
                  <Navigation className="w-4.5 h-4.5" /> Maps
                </button>
              </div>
              <button
                onClick={() => markDelivered(activeRoute.id)}
                className="flex-1 h-12 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_12px_30px_-10px_rgba(16,185,129,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" /> Marcar entregado
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Cuántos pedidos tiene el domiciliario en cada paso (para la cabecera)
  const enCaminoCount = deliveries.filter(o => o.status === 'En Camino').length;
  const porRecogerCount = deliveries.filter(o => o.status === 'Listos').length;

  return (
    <div className="h-[100dvh] w-full bg-gray-50/50 dark:bg-stone-950 text-gray-900 dark:text-gray-100 font-sans flex flex-col transition-colors duration-300 overflow-hidden relative">
      
      <ToastNotification toast={toastData} onClose={() => setToastData(null)} />
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Cabecera Móvil - Solo visible en celulares */}
      <header className="md:hidden px-6 py-3 border-b border-gray-100 dark:border-stone-800/50 flex flex-col shrink-0 bg-white dark:bg-[#151515] z-30 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tight text-gray-900 dark:text-white leading-none">Copiway<span className="text-brand-orange">PRO</span></h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-stone-400">Estado</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={() => setIsAvailable(!isAvailable)} />
              <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-orange"></div>
              <span className={`ml-2 text-xs font-bold ${isAvailable ? 'text-brand-orange' : 'text-gray-500'}`}>
                {isAvailable ? 'Disponible' : 'Desconectado'}
              </span>
            </label>
          </div>
      </header>

      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative">

      <aside className="w-full md:w-[400px] flex-1 md:flex-none bg-white dark:bg-[#151515] md:shadow-[8px_0_30px_-20px_rgba(0,0,0,0.15)] z-10 flex flex-col shrink-0 overflow-hidden min-w-0">
        
        {/* Cabecera Desktop - Solo visible en laptops */}
        <header className="hidden md:flex px-6 pt-6 pb-4 flex-col gap-4 shrink-0 bg-white dark:bg-[#151515] z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/25 shrink-0">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <h1 className="font-black text-xl tracking-tight text-gray-900 dark:text-white">Copiway<span className="text-brand-orange">PRO</span></h1>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-stone-500">Panel de Domiciliario</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut size={19} />
              </button>
            </div>
          </div>

          {/* Estado: tarjeta con interruptor */}
          <label className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors ${isAvailable ? 'bg-gradient-to-r from-orange-50 to-amber-50/40 dark:from-brand-orange/10 dark:to-transparent' : 'bg-gray-50 dark:bg-stone-900'}`}>
            <div className="flex items-center gap-3">
              <span className="relative flex w-2.5 h-2.5">
                {isAvailable && <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>}
                <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              </span>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-gray-400 dark:text-stone-500 uppercase tracking-wider">Estado</p>
                <p className={`text-sm font-black ${isAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-stone-400'}`}>{isAvailable ? 'Disponible para entregas' : 'Desconectado'}</p>
              </div>
            </div>
            <span className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={() => setIsAvailable(!isAvailable)} />
              <span className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow after:transition-all peer-checked:bg-brand-orange"></span>
            </span>
          </label>

          {/* Contadores */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-stone-900">
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0"><Bike className="w-4 h-4" /></div>
              <div className="leading-tight"><p className="text-lg font-black text-gray-900 dark:text-white">{enCaminoCount}</p><p className="text-[10px] font-bold text-gray-400 dark:text-stone-500">En camino</p></div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-stone-900">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"><Package className="w-4 h-4" /></div>
              <div className="leading-tight"><p className="text-lg font-black text-gray-900 dark:text-white">{porRecogerCount}</p><p className="text-[10px] font-bold text-gray-400 dark:text-stone-500">Por recoger</p></div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3 min-w-0 custom-scrollbar bg-gray-50/70 dark:bg-stone-950/40 md:bg-transparent md:dark:bg-transparent">
          <div className="flex items-center justify-between px-2 pt-2 pb-1">
            <h2 className="font-black text-gray-900 dark:text-white">Mis entregas</h2>
            <span className="min-w-[26px] h-6 px-2 rounded-lg bg-brand-orange text-white text-xs font-black flex items-center justify-center">{deliveries.length}</span>
          </div>
          {deliveries.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gray-50 dark:bg-stone-900 border border-dashed border-gray-200 dark:border-stone-700 flex items-center justify-center mb-3">
                <Package className="w-7 h-7 text-gray-300 dark:text-stone-600" />
              </div>
              <p className="text-sm font-bold text-gray-400 dark:text-stone-500">No hay entregas asignadas en este momento.</p>
            </div>
          ) : (
            deliveries.map(order => {
              const isAccepted = acceptedOrders.includes(order.id) || (order.status === 'Listos' && !!order.driverName);
              const isActive = activeRoute?.id === order.id;
              const isOnlinePayment = order.paymentMethod === 'online' || order.paymentStatus === 'Pagado' || order.status === 'Pagado'; // Fallback logic
              const statusText = order.status === 'Listos' ? (isAccepted ? 'Recepcionado' : 'Listo para recoger') : order.status;
              // Color de la etiqueta del estado
              const statusChip = order.status === 'En Camino'
                ? 'bg-orange-50 text-brand-orange dark:bg-brand-orange/10'
                : order.status === 'Listos'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-stone-300';

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-[22px] bg-white dark:bg-[#1b1b1b] transition-all overflow-hidden ${
                    isActive
                      ? 'ring-2 ring-brand-orange shadow-lg shadow-brand-orange/15'
                      : 'shadow-[0_8px_24px_-14px_rgba(0,0,0,0.18)] dark:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.8)] hover:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.25)]'
                  }`}
                >
                  {/* Encabezado: código, estado y total */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-lg leading-none tracking-tight whitespace-nowrap text-gray-900 dark:text-white"><span className="text-brand-orange">#</span>{orderCode(order.id)}</h3>
                      <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusChip}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {statusText}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-lg block leading-none whitespace-nowrap text-gray-900 dark:text-white">{formatCOP(order.total)}</span>
                      {isOnlinePayment ? (
                        <span className="mt-1.5 inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide whitespace-nowrap">Pagado (Digital)</span>
                      ) : (
                        <span className="mt-1.5 inline-block text-[10px] font-bold text-brand-orange uppercase tracking-wide whitespace-nowrap">Efectivo</span>
                      )}
                    </div>
                  </div>

                  {/* Cobro en efectivo: recuadro ámbar (antes era una barra naranja que parpadeaba entera) */}
                  {!isOnlinePayment && (
                    <div className="mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-orange-50 dark:bg-brand-orange/10 text-orange-900 dark:text-orange-200">
                      <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-brand-orange to-[#ff8a1f] text-white shadow-md shadow-brand-orange/30 flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-orange-50 dark:ring-[#2a1a0e] animate-pulse"></span>
                      </div>
                      <p className="text-xs font-bold leading-tight">Cobrar en efectivo<br /><span className="text-base font-black">{formatCOP(order.total)}</span></p>
                    </div>
                  )}

                  {/* Dirección */}
                  <div className="mt-3 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-stone-200 line-clamp-2 pt-1.5">{order.address}</p>
                  </div>

                  {/* Productos */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-stone-800 space-y-1.5">
                      {order.items.map((it: { quantity?: number; name?: string; finalPrice?: number; price?: number }, iIdx: number) => (
                        <div key={iIdx} className="flex justify-between items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-700 dark:text-stone-300 truncate"><span className="text-brand-orange font-black">{it.quantity}×</span> {it.name}</span>
                          <span className="text-[11px] font-semibold text-gray-400 shrink-0">{formatCOP(it.finalPrice || it.price || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contactar y navegar: 3 botones compactos en una fila */}
                  {order.status === 'En Camino' && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const phone = (order.clientPhone || '').replace(/\D/g, '');
                          const firstName = (order.client || '').trim().split(/\s+/)[0];
                          const greeting = firstName ? `¡Hola, ${firstName}! 👋` : '¡Hola! 👋';
                          const message = encodeURIComponent(`${greeting} Te escribo de Copiway PRO, soy tu domiciliario y ya voy en camino con tu pedido ${orderCode(order.id)}. 🛵\n\nPara llegar más rápido, ¿me confirmas la dirección exacta o alguna referencia? Y por favor avísame si estarás disponible para recibirlo. ¡Gracias!`);
                          window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                        }}
                        title="Escribirle al cliente por WhatsApp"
                        className="h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4.5 h-4.5" /> Cliente
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('info', 'Abriendo ruta en el mapa...', 'Navegación');
                          window.open(`https://waze.com/ul?q=${encodeURIComponent(order.address + ', Neiva, Huila')}`, '_blank');
                        }}
                        className="h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors cursor-pointer"
                      >
                        <MapIcon className="w-4.5 h-4.5" /> Waze
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('info', 'Abriendo ruta en el mapa...', 'Navegación');
                          window.open(`https://maps.google.com/?q=${encodeURIComponent(order.address + ', Neiva, Huila')}`, '_blank');
                        }}
                        className="h-14 rounded-2xl bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                      >
                        <Navigation className="w-4.5 h-4.5" /> Maps
                      </button>
                    </div>
                  )}

                  {/* Botones de acción */}
                  {order.status === 'Listos' && !isAccepted && (
                    <button
                      onClick={() => takeOrder(order.id)}
                      className="mt-3 w-full h-12 rounded-2xl font-black text-white flex items-center justify-center gap-2 bg-gradient-to-r from-brand-orange to-[#ff8a1f] shadow-[0_10px_24px_-10px_rgba(255,107,0,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                    >
                      <Package className="w-4.5 h-4.5" /> Tomar pedido
                    </button>
                  )}

                  {order.status === 'Listos' && isAccepted && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setActiveRoute(order)}
                        disabled={isActive}
                        className="h-12 px-4 rounded-2xl bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Target className="w-4 h-4" /> Mapa
                      </button>
                      <button
                        onClick={() => startTrip(order.id)}
                        className="flex-1 h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm flex items-center justify-center gap-2 hover:bg-brand-orange dark:hover:bg-brand-orange dark:hover:text-white transition-colors shadow-lg cursor-pointer"
                      >
                        <Bike className="w-4.5 h-4.5" /> Iniciar ruta
                      </button>
                    </div>
                  )}

                  {order.status === 'Listos' && isAccepted && (
                    <button
                      onClick={() => releaseOrder(order.id)}
                      className="mt-2 w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Soltar pedido
                    </button>
                  )}

                  {order.status === 'En Camino' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setActiveRoute(order)}
                        disabled={isActive}
                        className="h-12 px-4 rounded-2xl bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Target className="w-4 h-4" /> Mapa
                      </button>
                      <button
                        onClick={() => markDelivered(order.id)}
                        className="flex-1 h-12 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_10px_24px_-10px_rgba(16,185,129,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                      >
                        <CheckCircle className="w-4.5 h-4.5" /> Marcar entregado
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main className="w-full h-[45vh] shrink-0 md:flex-1 md:h-full p-3 md:p-6 bg-[#f6f6f4] dark:bg-stone-950 relative min-w-0">
        {renderMap()}
      </main>

      {/* Modal de PIN de Entrega */}
      {showPinModal && pinTargetOrder && (
        <div className="fixed inset-0 z-[9999] bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPinModal(false)}>
          <div className="relative bg-white dark:bg-[#151515] rounded-[32px] max-w-sm w-full overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]" onClick={e => e.stopPropagation()}>
            {/* Encabezado con brillo verde suave */}
            <div className="relative px-6 pt-7 pb-5 text-center bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-500/10">
              <button
                onClick={() => setShowPinModal(false)}
                title="Cerrar"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-stone-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-xl"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Validar entrega</h3>
              <p className="text-sm text-gray-500 dark:text-stone-400 mt-1.5">
                Pídele al cliente su <strong className="text-brand-orange">PIN de 4 dígitos</strong>.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-stone-900 shadow-sm text-xs font-bold text-gray-700 dark:text-stone-300">
                <Package className="w-3.5 h-3.5 text-brand-orange" /> Pedido <span className="text-brand-orange">#{orderCode(pinTargetOrder)}</span>
              </span>
            </div>

            <div className="px-6 pb-6">
              {/* 4 casillas del PIN: el input real es invisible y está encima de las casillas */}
              <div className="relative group">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                  aria-label="PIN de entrega"
                />
                <div className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map(i => {
                    const digito = pinInput[i];
                    const esActual = i === Math.min(pinInput.length, 3);
                    return (
                      <div
                        key={i}
                        className={`h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all ${
                          pinError
                            ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10 text-red-600'
                            : digito
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400/50 text-gray-900 dark:text-white'
                              : 'bg-gray-50 dark:bg-stone-900 border-gray-100 dark:border-stone-800'
                        } ${esActual && !pinError ? 'group-focus-within:border-emerald-500 group-focus-within:bg-white dark:group-focus-within:bg-stone-900 group-focus-within:ring-4 group-focus-within:ring-emerald-500/10' : ''}`}
                      >
                        {digito
                          ? digito
                          : <span className={`w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-stone-600 ${esActual ? 'group-focus-within:w-0.5 group-focus-within:h-7 group-focus-within:rounded-sm group-focus-within:bg-emerald-500 group-focus-within:animate-pulse' : ''}`}></span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {pinError && (
                <div className="mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {pinError}
                </div>
              )}

              <button
                onClick={async () => {
                  const ok = await executeDelivery(pinTargetOrder, pinInput);
                  if (ok) {
                    setShowPinModal(false);
                  } else {
                    setPinInput('');
                  }
                }}
                disabled={pinInput.length !== 4}
                className="mt-5 w-full h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_12px_30px_-10px_rgba(16,185,129,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 dark:disabled:from-stone-800 dark:disabled:to-stone-800 dark:disabled:text-stone-500 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirmar entrega
              </button>
              <button
                onClick={() => setShowPinModal(false)}
                className="mt-2 w-full h-10 rounded-xl text-sm font-bold text-gray-500 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
