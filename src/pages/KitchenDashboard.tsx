import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ToastNotification, ToastData } from '../components/ToastNotification';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ArrowLeft, ArrowRight, User, TriangleAlert, Package,
  ChefHat, LogOut, Sun, Moon, Printer, CheckCircle2, AlertCircle, RefreshCw, Utensils, Volume2, VolumeX, Bell, Menu, X, Eye, EyeOff, ShoppingBag, Clock, Timer, Hourglass, ClipboardList, CookingPot, PackageCheck
 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore, Order, Product } from '../store/almacenAplicacion';
import { orderCode, modificacionesDe, agruparPorNombre } from '../lib/format';
import { CustomBurgerThumb } from './client/ingredientArt';
import { soundFx } from '../utils/audio';
import { api, ApiError, irA } from '../servicios/api';

type KitchenOrderStatus = 'Pendiente' | 'En Preparación' | 'Listos' | 'Pagado';

export default function KitchenDashboard() {
  const { theme, toggleTheme } = useTheme();
  
  const { orders, updateOrderStatus, inventory, staff, products, storeConfig } = useStore();
  // Datos del negocio para el ticket (se editan en Ajustes del administrador).
  const negocio = storeConfig.business;

  const [time, setTime] = useState(new Date());
  const [printError, setPrintError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => soundFx.isEnabled());
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [newOrderAlertText, setNewOrderAlertText] = useState('');
  const [toastData, setToastData] = useState<ToastData | null>(null);

  const showToast = (type: ToastData['type'] = 'info', message: string, title?: string) => {
    setToastData({ type, message, title });
  };
  
  // Track previous orders to detect incoming ones
  const prevOrdersCountRef = useRef<number>(orders.length);
  const initialLoadRef = useRef<boolean>(true);

  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  // Saludo del login: "maria" o "maria@copiway.com" → "Maria"
  const usuarioEscrito = username.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const saludoNombre = usuarioEscrito ? usuarioEscrito.charAt(0).toUpperCase() + usuarioEscrito.slice(1) : '';
  const hora = time.getHours();
  const saludoHora = hora < 12 ? 'Buenos días ☀️' : hora < 19 ? 'Buenas tardes 🌤️' : 'Buenas noches 🌙';

  // Stock crítico: misma regla que en admin (entre 1 y 10 unidades). El ícono de advertencia de la
  // cabecera abre la lista como una notificación desplegable.
  const criticalItems = useMemo(() => inventory.filter(i => i.stock > 0 && i.stock <= 10), [inventory]);
  const [showInventory, setShowInventory] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Tiempo real de preparacion: desde que llega el pedido hasta que cocina lo marca Listo (solo hoy).
  const prepStats = React.useMemo(() => {
    const parse = (v?: string | null) => (v ? new Date(v.replace(' ', 'T')).getTime() : NaN);
    const today = new Date().toDateString();
    const mins = orders
      .filter(o => o.readyAt && new Date(parse(o.date)).toDateString() === today)
      .map(o => (parse(o.readyAt) - parse(o.date)) / 60000)
      .filter(m => Number.isFinite(m) && m >= 0);
    const count = mins.length;
    const avg = count ? Math.round((mins.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
    const tone = count === 0
      ? { bg: 'bg-gray-100 dark:bg-stone-800', text: 'text-gray-400' }
      : avg <= 10
        ? { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' }
        : avg <= 20
          ? { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' }
          : { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' };
    return { avg, count, tone };
  }, [orders]);


  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escuchar nuevos pedidos en tiempo real para disparar sonido de comanda (RF-27 / RF-36)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      prevOrdersCountRef.current = orders.length;
      return;
    }

    if (orders.length > prevOrdersCountRef.current) {
      const latestOrder = orders[0];
      const orderId = latestOrder ? latestOrder.id : 'Nuevo Pedido';
      setNewOrderAlertText(`¡Comanda ${orderId} recibida en cocina!`);
      setShowNewOrderAlert(true);
      soundFx.playOrderBell();
      setTimeout(() => setShowNewOrderAlert(false), 5000);
    }
    prevOrdersCountRef.current = orders.length;
  }, [orders]);

  const handleToggleSound = () => {
    const active = soundFx.toggleSound();
    setSoundEnabled(active);
    showToast('config', active ? 'Alertas sonoras activadas' : 'Alertas sonoras silenciadas', 'Sonido de Alertas');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { user } = await api.post<{ user: { id: string; role: string; name?: string } }>('/auth/login', {
        email: username,
        pin,
      });
      if (user.role !== 'kitchen') {
        await api.post('/auth/logout').catch(() => {});
        setLoginError('Esta cuenta no tiene acceso al panel de cocina.');
        return;
      }
      setIsLoggedIn(true);
      const nombre = (user.name || '').trim().split(/\s+/)[0];
      showToast('success', 'Que tengas un excelente turno en la cocina.', nombre ? `¡Hola, ${nombre}!` : '¡Bienvenido!');
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Usuario o PIN incorrectos.');
    }
  };

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
      title: 'Cerrar Sesión de Cocina',
      message: '¿Estás seguro de que deseas salir del panel de cocina de Hamburguer Copiway?',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Permanecer',
      type: 'info',
      onConfirm: () => {
        api.post('/auth/logout').catch(() => {});
        showToast('warning', 'Cerraste sesión en el panel de cocina.', 'Sesión Finalizada');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoggedIn(false);
        setUsername('');
        setPin('');
        irA('/login');
      }
    });
  };

  const getColumnOrders = (status: string) => {
    return orders
      .filter(o => {
        if (status === 'Pendientes') return o.status === 'Pendiente' || o.status === 'Pagado';
        if (status === 'En Preparación') return o.status === 'En Preparación';
        if (status === 'Listos') return o.status === 'Listos';
        return false;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const batchSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    const activeOrders = orders.filter(o => o.status === 'Pendiente' || o.status === 'Pagado' || o.status === 'En Preparación');
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        if (!summary[item.name]) summary[item.name] = 0;
        summary[item.name] += item.quantity || 1;
      });
    });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const moveOrder = (orderId: string, currentStatus: string) => {
    if (currentStatus === 'Pendientes') {
      updateOrderStatus(orderId, 'En Preparación');
      showToast('info', `El pedido #${orderId} pasó a preparación.`, 'Pedido en Preparación');
    }
    if (currentStatus === 'En Preparación') {
      updateOrderStatus(orderId, 'Listos');
      showToast('success', `El pedido #${orderId} está listo para despacho.`, 'Pedido Listo');
    }
  };

  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const printSticker = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) setPreviewOrder(order);
  };

  const handleConfirmPrint = () => {
    if (Math.random() > 0.9) {
      setPrintError('Error de conexión con la impresora. Revise papel y conexión.');
      setTimeout(() => setPrintError(null), 4000);
    } else {
      showToast('cierre', 'Comanda del pedido enviada a impresión.', 'Ticket Impreso');
      window.print();
    }
    setPreviewOrder(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-[100dvh] bg-[#f6f6f4] dark:bg-stone-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Fondo: manchas de color suaves y una cuadrícula de puntos */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-brand-orange/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-amber-300/25 dark:bg-amber-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.08] pointer-events-none [background-image:radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:22px_22px]"></div>

        <div className="relative w-full max-w-[960px] bg-white dark:bg-[#151515] rounded-[36px] overflow-hidden border border-white dark:border-stone-800 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] dark:shadow-black/60 grid md:grid-cols-[1.05fr_1fr] md:min-h-[600px]">

          {/* Lado izquierdo (solo en pantallas grandes): marca y una comanda de ejemplo */}
          <div className="hidden md:flex relative flex-col justify-between p-10 bg-[#141414] text-white overflow-hidden">
            {/* Foto de fondo (cocinero con la sartén en llamas) con un degradado oscuro encima para que se lea el texto */}
            <img loading="eager" decoding="async"
              src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=1000&auto=format&fit=crop"
              alt="Cocinero preparando un plato"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/45 to-[#141414]/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/50 to-transparent"></div>
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-orange/25 blur-[90px]"></div>
            <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]"></div>

            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/40">
                <ChefHat className="w-6 h-6" />
              </div>
              <div className="leading-tight">
                <span className="font-black text-lg block">Copiway<span className="text-brand-orange">PRO</span></span>
                <span className="text-[11px] font-semibold text-white/50">Panel de Cocina · KDS</span>
              </div>
            </div>

            <div className="relative">
              <h2 className="font-black text-[32px] leading-[1.05] tracking-tight">Tu cocina,<br /><span className="text-brand-orange">en orden.</span></h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { icon: Bell, text: 'Aviso sonoro' },
                  { icon: Timer, text: 'Tiempos en vivo' },
                  { icon: Printer, text: 'Ticket al instante' },
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

            {/* Saludo + formulario centrados en el alto de la tarjeta (así no queda un hueco antes del botón) */}
            <div className="flex-1 flex flex-col justify-center py-6">
            {/* Saludo: usa el usuario que va escribiendo (ej. "maria" → "Maria") */}
            <div className="mb-8 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black transition-all duration-300 ${
                saludoNombre ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30 rotate-0' : 'bg-orange-50 dark:bg-brand-orange/10 text-brand-orange -rotate-6'
              }`}>
                {saludoNombre ? saludoNombre.charAt(0) : <ChefHat className="w-7 h-7" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-500 dark:text-stone-400">{saludoHora}</p>
                <h1 className="font-black text-[28px] leading-tight tracking-tight text-gray-900 dark:text-white truncate">
                  Hola, <span className="text-brand-orange">{saludoNombre || 'chef'}</span> 👋
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
                    placeholder="Tu usuario, ej: maria"
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
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="peer absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                    aria-label="PIN de acceso"
                  />
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map(i => {
                      const digito = pin[i];
                      const esActual = i === Math.min(pin.length, 3);
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
                disabled={!username || pin.length < 4}
                className="group/btn relative !mt-7 w-full h-14 rounded-2xl overflow-hidden font-black text-base text-white inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-orange to-[#ff8a1f] shadow-[0_12px_30px_-8px_rgba(255,107,0,0.6)] hover:shadow-[0_16px_36px_-8px_rgba(255,107,0,0.75)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer disabled:from-orange-100 disabled:to-orange-100 disabled:text-orange-300 dark:disabled:from-brand-orange/10 dark:disabled:to-brand-orange/10 dark:disabled:text-brand-orange/40 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
              >
                {/* Brillo que cruza el botón al pasar el mouse */}
                <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-0 group-hover/btn:translate-x-[300%] group-disabled/btn:hidden transition-transform duration-700"></span>
                <ChefHat className="w-5 h-5" />
                Entrar a la cocina
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

  // Panel del turno para la barra lateral: cuántas comandas hay en cada paso y cuántas se entregaron hoy
  const flujo = [
    { label: 'Por hacer', count: getColumnOrders('Pendientes').length, icon: ClipboardList, bar: 'bg-brand-orange', chip: 'bg-orange-50 text-brand-orange dark:bg-brand-orange/10' },
    { label: 'Cocinando', count: getColumnOrders('En Preparación').length, icon: CookingPot, bar: 'bg-blue-500', chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
    { label: 'Listos', count: getColumnOrders('Listos').length, icon: PackageCheck, bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  ];
  /** Cuántos productos caben en el resumen de la barra lateral sin que salga barra de desplazamiento. */
  const MAX_RESUMEN = 6;
  const totalActivas = flujo.reduce((acc, f) => acc + f.count, 0);
  const entregadosHoy = orders.filter(o =>
    (o.status === 'Entregado' || o.status === 'entregado') && new Date(o.date.replace(' ', 'T')).toDateString() === time.toDateString()
  ).length;

  const panelTurno = (
    <div className="space-y-3">
      {/* Tarjeta oscura del turno (compacta) */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-gray-900 to-stone-800 dark:from-stone-900 dark:to-black px-4 py-3.5 text-white">
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-brand-orange/25 blur-2xl"></div>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400"></span>
            </span>
            Cocina en servicio
          </span>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black leading-none tracking-tight">{totalActivas}</span>
              <span className="text-xs font-semibold text-white/60 leading-tight">{totalActivas === 1 ? 'comanda' : 'comandas'}<br />{totalActivas === 1 ? 'activa' : 'activas'}</span>
            </div>
            <div className="text-right leading-tight">
              <p className="text-lg font-black">{entregadosHoy}</p>
              <p className="text-[10px] font-semibold text-white/50">entregados hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flujo de cocina: 3 cuadritos en una fila */}
      <div>
        <p className="px-1 mb-1.5 text-[10px] font-black text-gray-400 dark:text-stone-500 uppercase tracking-widest">Flujo de cocina</p>
        <div className="grid grid-cols-3 gap-2">
          {flujo.map(({ label, count, icon: Icon, bar, chip }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-stone-800 px-2 pt-2.5 pb-3 flex flex-col items-center text-center">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${chip}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="mt-1 text-xl font-black leading-none text-gray-900 dark:text-white">{count}</span>
              <span className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-stone-400">{label}</span>
              <div className={`absolute bottom-0 left-0 h-1 ${bar} transition-all duration-500`} style={{ width: `${totalActivas ? (count / totalActivas) * 100 : 0}%` }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-gray-50/50 dark:bg-stone-950 text-gray-900 dark:text-gray-100 font-sans flex transition-colors duration-300 overflow-hidden relative">
      <ToastNotification toast={toastData} onClose={() => setToastData(null)} />

      {/* Panel lateral de stock crítico (como las notificaciones del admin): sale por la derecha y oscurece el fondo */}
      <AnimatePresence>
        {showInventory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInventory(false)}
              className="fixed inset-0 z-[60] bg-gray-900/30 dark:bg-black/60 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '110%' }}
              animate={{ x: 0 }}
              exit={{ x: '110%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 sm:top-3 sm:right-3 sm:bottom-3 z-[61] w-full sm:w-[420px] bg-white dark:bg-[#151515] sm:border border-gray-100 dark:border-stone-800 sm:rounded-[28px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="h-[70px] md:h-24 px-5 md:px-6 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center ring-1 ring-inset ring-red-500/20">
                    <TriangleAlert className="w-5 h-5" />
                  </div>
                  <div className="leading-tight">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white">Stock crítico</h3>
                    <p className="text-xs font-semibold text-gray-400 dark:text-stone-500">
                      {criticalItems.length === 0 ? 'Todo al día' : `${criticalItems.length} ${criticalItems.length === 1 ? 'insumo por agotarse' : 'insumos por agotarse'}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowInventory(false)} title="Cerrar" className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-800 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {criticalItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-stone-900 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="font-black text-gray-900 dark:text-white">No hay insumos críticos</p>
                    <p className="text-sm text-gray-500 dark:text-stone-400 mt-1">Cuando uno esté por agotarse, aparecerá aquí.</p>
                  </div>
                ) : (
                  criticalItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="p-4 rounded-2xl border border-gray-100 dark:border-stone-800 bg-white dark:bg-stone-900/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-black text-gray-900 dark:text-white truncate">{item.name}</p>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">{item.stock} uds</span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-stone-800 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400" style={{ width: `${(item.stock / 10) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-stone-800 shrink-0">
                <p className="text-xs text-gray-500 dark:text-stone-400 font-medium text-center">Avisa al administrador para que reabastezca estos insumos.</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
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
      {/* Sidebar - Desktop */}
      <aside className="w-[280px] bg-white dark:bg-[#151515] border-r border-gray-100 dark:border-stone-800 flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-[100dvh] sticky top-0 hidden lg:flex">
        <div className="h-20 flex items-center px-7 gap-3 shrink-0 border-b border-gray-50 dark:border-stone-800/50">
          <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-[22px] tracking-tight text-gray-900 dark:text-white leading-none">Copiway<span className="text-brand-orange">PRO</span></h1>
          </div>
        </div>

        {/* Todo cabe en el alto de la pantalla, sin barra de desplazamiento:
            el panel del turno tiene alto fijo y el resumen ocupa lo que sobra */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 py-3">
          {panelTurno}

          {/* Batching Summary */}
          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#151515] rounded-[16px] border border-gray-100 dark:border-stone-800 shadow-md overflow-hidden">
            <div className="bg-brand-orange/10 px-4 py-2.5 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" /> Resumen de preparación
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-1.5">
              {batchSummary.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No hay pedidos activos.</p>
              ) : (
                <>
                  {batchSummary.slice(0, MAX_RESUMEN).map(([itemName, count], idx) => (
                    <div key={idx} className="flex justify-between items-center px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-medium text-gray-700 dark:text-stone-300 truncate mr-2">{itemName}</span>
                      <span className="text-xs font-black shrink-0 text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                        x{count}
                      </span>
                    </div>
                  ))}
                  {batchSummary.length > MAX_RESUMEN && (
                    <p className="px-3 pt-1 text-[11px] font-bold text-gray-400 dark:text-stone-500">+{batchSummary.length - MAX_RESUMEN} productos más</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modo oscuro y salir, uno al lado del otro para ahorrar espacio */}
        <div className="p-3 border-t border-gray-100 dark:border-stone-800 shrink-0 grid grid-cols-2 gap-2">
          <button onClick={toggleTheme} className="flex items-center justify-center gap-2 text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800 px-3 py-2.5 rounded-[14px] transition-colors text-xs font-bold cursor-pointer">
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 shrink-0" /> : <Moon className="w-4.5 h-4.5 shrink-0" />}
            {theme === 'dark' ? 'Claro' : 'Oscuro'}
          </button>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2.5 rounded-[14px] transition-colors text-xs cursor-pointer">
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            Salir
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 z-[101] w-[280px] bg-white dark:bg-[#151515] border-r border-gray-100 dark:border-stone-800 flex flex-col lg:hidden shadow-2xl h-[100dvh]"
            >
              <div className="h-24 flex items-center justify-between px-8 mb-2 shrink-0 border-b border-gray-50 dark:border-stone-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="font-black text-[22px] tracking-tight text-gray-900 dark:text-white leading-none">Copiway<span className="text-brand-orange">PRO</span></h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar min-w-0">
                {panelTurno}
              </nav>

              <div className="p-6 border-t border-gray-100 dark:border-stone-800 mt-auto space-y-4">
                <button onClick={toggleTheme} className="w-full flex items-center gap-4 text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800 px-4 py-3 rounded-[16px] transition-colors text-sm font-bold">
                  {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                  <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </button>
                <button onClick={handleLogout} className="flex items-center gap-4 w-full font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-3 rounded-[16px] transition-colors text-sm">
                  <LogOut className="w-6 h-6" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative min-w-0">
        

        
        {/* Top Status Header */}
        <header className="shrink-0 bg-white dark:bg-[#151515] border-b border-gray-100 dark:border-stone-800 h-[70px] md:h-24 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 shadow-sm transition-colors">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-500 hover:text-brand-orange transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden xs:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider">Sistema en Línea</span>
            </div>
            
            <div
              className="hidden sm:flex items-center gap-3 pl-2.5 pr-5 py-1.5 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-stone-800 shadow-sm"
              title={prepStats.count > 0 ? `Promedio entre la llegada del pedido y el momento en que cocina lo marca Listo (${prepStats.count} pedidos de hoy)` : 'Aún no hay pedidos listos hoy'}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${prepStats.tone.bg} ${prepStats.tone.text}`}>
                <Timer className="w-4.5 h-4.5" />
              </div>
              <div className="leading-none">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-stone-500">Preparación promedio</p>
                <p className="mt-1 flex items-baseline gap-1 tabular-nums">
                  <span className="font-black text-lg text-gray-900 dark:text-white">{prepStats.count > 0 ? prepStats.avg : '—'}</span>
                  {prepStats.count > 0 && <span className="text-xs font-bold text-gray-500 dark:text-stone-400">min</span>}
                  {prepStats.count > 0 && <span className="text-[10px] font-semibold text-gray-400 dark:text-stone-500 ml-1">· {prepStats.count} hoy</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Ícono de advertencia (como en admin): solo aparece si hay insumos en stock crítico */}
            <AnimatePresence>
              {criticalItems.length > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="relative"
                >
                  <button
                    onClick={() => setShowInventory(!showInventory)}
                    title="Stock crítico"
                    className={`relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-2xl border transition-all cursor-pointer ${
                      showInventory
                        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                        : 'bg-red-50 dark:bg-red-950/30 text-red-500 border-red-100 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/50'
                    }`}
                  >
                    <TriangleAlert className="w-5 h-5" />
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#151515]">
                      {criticalItems.length}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleToggleSound}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-2xl font-bold text-[10px] md:text-xs transition-colors border shadow-xs ${
                soundEnabled 
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100'
                  : 'bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-400 border-gray-200 dark:border-stone-700'
              }`}
              title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar timbre sonoro de cocina'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500 animate-pulse" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              <span className="hidden md:inline">{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
            </button>

            <div className="flex items-center gap-3 pl-3 pr-4 md:pl-4 md:pr-5 py-1.5 md:py-2 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-stone-800 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="leading-none">
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-black text-lg md:text-2xl tracking-tight text-gray-900 dark:text-white">
                    {time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  <span className="font-bold text-xs md:text-sm text-brand-orange w-[1.4em]">
                    {String(time.getSeconds()).padStart(2, '0')}
                  </span>
                </div>
                <p className="hidden md:block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-stone-500 mt-1">
                  {time.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Banner flotante de Alerta Sonora / Visual (RF-27 / RF-36) */}
        <AnimatePresence>
          {showNewOrderAlert && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-20 md:top-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-brand-orange text-white px-4 md:px-6 py-2.5 md:py-3.5 rounded-2xl shadow-2xl border border-white/20 w-[90%] max-w-sm"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/20 flex items-center justify-center animate-bounce shrink-0">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-[10px] md:text-sm uppercase tracking-wide truncate">¡NUEVA COMANDA EN COCINA!</p>
                <p className="text-[10px] md:text-xs text-white/90 font-medium truncate">{newOrderAlertText}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Kanban Board */}
        <main className="flex-1 overflow-x-auto lg:overflow-x-hidden overflow-y-hidden p-4 sm:p-6 lg:p-10 bg-gray-50/50 dark:bg-stone-950 snap-x lg:snap-none snap-mandatory min-w-0 custom-scrollbar">
          <div className="flex gap-4 sm:gap-6 h-full min-w-max lg:min-w-0 lg:grid lg:grid-cols-3">
            {([
              {
                key: 'Pendientes', titulo: 'Pendientes', sub: 'Por empezar', icon: ClipboardList, vacio: 'Sin pedidos pendientes',
                header: 'bg-gradient-to-b from-orange-50 to-transparent dark:from-brand-orange/10', iconBox: 'bg-white dark:bg-stone-900 text-brand-orange shadow-sm', titleColor: 'text-gray-900 dark:text-white', subColor: 'text-gray-400 dark:text-stone-500', badge: 'bg-brand-orange text-white',
              },
              {
                key: 'En Preparación', titulo: 'En preparación', sub: 'En el fogón', icon: CookingPot, vacio: 'Sin pedidos en curso',
                header: 'bg-gradient-to-b from-orange-50 to-transparent dark:from-brand-orange/10', iconBox: 'bg-white dark:bg-stone-900 text-brand-orange shadow-sm', titleColor: 'text-gray-900 dark:text-white', subColor: 'text-gray-400 dark:text-stone-500', badge: 'bg-brand-orange text-white',
              },
              {
                key: 'Listos', titulo: 'Listos', sub: 'Para despachar', icon: PackageCheck, vacio: 'Sin pedidos listos',
                header: 'bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-500/10', iconBox: 'bg-white dark:bg-stone-900 text-emerald-500 shadow-sm', titleColor: 'text-gray-900 dark:text-white', subColor: 'text-gray-400 dark:text-stone-500', badge: 'bg-emerald-500 text-white',
              },
            ] as const).map(col => {
              const lista = getColumnOrders(col.key);
              const Icon = col.icon;
              return (
                <div key={col.key} className="w-[85vw] sm:w-[320px] md:w-[380px] lg:w-auto shrink-0 lg:shrink snap-center h-full flex flex-col bg-white dark:bg-[#151515] rounded-[28px] border border-gray-100 dark:border-stone-800 shadow-sm overflow-hidden">
                  {/* Encabezado de la columna: tinte suave del color de la columna que se desvanece hacia abajo */}
                  <div className={`relative overflow-hidden px-5 py-4 shrink-0 ${col.header}`}>
                    <div className="relative flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${col.iconBox}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 leading-tight">
                        <h2 className={`font-black text-base ${col.titleColor}`}>{col.titulo}</h2>
                        <p className={`text-xs font-semibold ${col.subColor}`}>{col.sub}</p>
                      </div>
                      <span className={`min-w-[32px] h-8 px-2 rounded-xl flex items-center justify-center text-sm font-black tabular-nums ${col.badge}`}>{lista.length}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3 min-w-0 custom-scrollbar">
                    <AnimatePresence>
                      {lista.map(order => (
                        <OrderCard key={order.id} order={order} products={products} onMove={() => moveOrder(order.id, col.key)} onPrint={() => printSticker(order.id)} isReady={col.key === 'Listos'} />
                      ))}
                    </AnimatePresence>
                    {lista.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-stone-900 border border-dashed border-gray-200 dark:border-stone-700 flex items-center justify-center mb-3">
                          <Icon className="w-7 h-7 text-gray-300 dark:text-stone-600" strokeWidth={1.75} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 dark:text-stone-500">{col.vacio}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
        
        
      </div>

      {/* Pop-up de error de impresora (HU-32.2) */}
      <AnimatePresence>
        {printError && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-red-600 text-white shadow-2xl p-4 pr-6 rounded-[20px]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-lg">Error de Hardware</p>
              <p className="text-sm font-medium text-white/90">{printError}</p>
            </div>
          </motion.div>
        )}
        
        {previewOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#151515] rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 dark:border-stone-800 flex justify-between items-center bg-gray-50/50 dark:bg-stone-900/50">
                <h2 className="font-bold text-gray-900 dark:text-white">Vista Previa - Factura</h2>
                <button onClick={() => setPreviewOrder(null)} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors bg-white dark:bg-stone-800 rounded-full shadow-sm border border-gray-200 dark:border-stone-700">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="p-6 pr-4 space-y-5 max-h-[70vh] overflow-y-auto bg-[#fafafa] dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
                {/* Receipt Header */}
                <div className="text-center flex flex-col items-center">
                  <div className="w-14 h-14 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-gray-900 mb-3 shadow-sm">
                     <Utensils className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-lg tracking-tight">{negocio?.name || 'COPIWAY PRO'}</h3>
                  {negocio?.nit && <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">NIT: {negocio.nit}</p>}
                  {negocio?.address && <p className="text-xs text-gray-500 dark:text-stone-400">{negocio.address}</p>}
                  {negocio?.phone && <p className="text-xs text-gray-500 dark:text-stone-400">Tel: {negocio.phone}</p>}
                  <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full mt-3">DOCUMENTO EQUIVALENTE POS</span>
                </div>

                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-stone-400">Ticket</span>
                    <span className="font-bold">{orderCode(previewOrder.id)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-stone-400">Fecha</span>
                    <span className="font-semibold">{new Date(previewOrder.date || Date.now()).toLocaleDateString()} · {new Date(previewOrder.date || Date.now()).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Customer Data */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-gray-500 dark:text-stone-400 shrink-0">Cliente</span>
                    <span className="font-semibold text-right truncate">{previewOrder.client || 'Cliente Local'}</span>
                  </div>
                  {previewOrder.clientPhone && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500 dark:text-stone-400 shrink-0">Teléfono</span>
                      <span className="font-semibold">{previewOrder.clientPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-gray-500 dark:text-stone-400 shrink-0">Dirección</span>
                    <span className="font-semibold text-right">{previewOrder.address || 'Recogida en local'}</span>
                  </div>
                  {previewOrder.paymentMethod && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500 dark:text-stone-400 shrink-0">Método de pago</span>
                      <span className="font-semibold">{previewOrder.paymentMethod === 'cash' ? 'Efectivo' : (previewOrder.digitalBank ? previewOrder.digitalBank.charAt(0).toUpperCase() + previewOrder.digitalBank.slice(1) : 'Digital')}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Productos</h4>
                  {previewOrder.items.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 font-black text-xs flex items-center justify-center shrink-0">{item.quantity || 1}x</span>
                          <span className="font-bold text-sm truncate">{item.name}</span>
                        </div>
                        <span className="font-bold text-sm shrink-0">${((item.finalPrice || item.price || 0) * (item.quantity || 1)).toLocaleString('es-CO')}</span>
                      </div>
                      {item.removed && item.removed.length > 0 && (
                        <div className="pl-[34px] mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium">
                          Sin: {item.removed.map(r => r.name).join(', ')}
                        </div>
                      )}
                      {item.extras && item.extras.length > 0 && (
                        <div className="pl-[34px] mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {/* "Hamburguesa Personalizada" es el producto placeholder del Creador
                              Interactivo (PedidoService::productoPersonalizadoOculto): ahi `extras`
                              es la receta completa armada por el cliente, no un adicional sobre un
                              producto base -- por eso no debe decir "Extra". */}
                          {item.name === 'Hamburguesa Personalizada'
                            ? 'Ingredientes: ' + item.extras.map(e => e.name).join(', ')
                            : 'Extra: ' + agruparPorNombre(item.extras).map(e => e.veces > 1 ? `${e.name} x${e.veces}` : e.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-stone-400">Subtotal</span>
                    <span className="font-semibold">${(previewOrder.subtotal || previewOrder.items.reduce((acc, item) => acc + (item.finalPrice || item.price || 0) * (item.quantity || 1), 0)).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-stone-400">Tarifa de envío</span>
                    <span className="font-semibold">${(previewOrder.shipping || (previewOrder.total - (previewOrder.subtotal || previewOrder.items.reduce((acc, item) => acc + (item.finalPrice || item.price || 0) * (item.quantity || 1), 0))) || 0).toLocaleString('es-CO')}</span>
                  </div>
                  {(previewOrder.discount || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-stone-400">Descuento cumpleaños</span>
                      <span className="font-semibold">-${(previewOrder.discount || 0).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {(previewOrder.pointsDiscount || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-stone-400">Puntos canjeados ({previewOrder.pointsRedeemed})</span>
                      <span className="font-semibold">-${(previewOrder.pointsDiscount || 0).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-black text-lg pt-2.5 mt-1 border-t border-dashed border-gray-200 dark:border-stone-700 text-brand-orange">
                    <span>Total a Pagar</span>
                    <span>${(previewOrder.total || 0).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 pb-2 text-center text-xs text-gray-500 dark:text-stone-400 space-y-1.5">
                  <p className="font-bold text-gray-700 dark:text-stone-300">¡Gracias por su preferencia!</p>
                  {negocio?.instagram && <p>Síguenos en IG: {negocio.instagram}</p>}
                  {negocio?.website && <p>{negocio.website}</p>}

                  {/* Barcode Simulation */}
                  <div className="flex justify-center items-center h-10 mt-4 opacity-70">
                    <div className="w-1 h-full bg-current mx-[1px]"></div>
                    <div className="w-2 h-full bg-current mx-[1px]"></div>
                    <div className="w-1 h-full bg-current mx-[1px]"></div>
                    <div className="w-0.5 h-full bg-current mx-[1px]"></div>
                    <div className="w-3 h-full bg-current mx-[1px]"></div>
                    <div className="w-1 h-full bg-current mx-[1px]"></div>
                    <div className="w-2 h-full bg-current mx-[1px]"></div>
                    <div className="w-0.5 h-full bg-current mx-[1px]"></div>
                    <div className="w-2 h-full bg-current mx-[1px]"></div>
                    <div className="w-1 h-full bg-current mx-[1px]"></div>
                    <div className="w-1 h-full bg-current mx-[1px]"></div>
                    <div className="w-3 h-full bg-current mx-[1px]"></div>
                  </div>
                  <p className="text-[10px] tracking-[0.3em] mt-1 font-mono">{orderCode(previewOrder.id)}</p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-stone-900/50 border-t border-gray-100 dark:border-stone-800 flex gap-4">
                <button onClick={() => setPreviewOrder(null)} className="flex-1 py-3.5 rounded-[16px] font-bold text-gray-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors min-w-0">
                  Cancelar
                </button>
                <button onClick={handleConfirmPrint} className="flex-1 py-3.5 rounded-[16px] font-bold text-white bg-brand-orange hover:bg-brand-orange/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 min-w-0">
                  <Printer className="w-5 h-5" /> Imprimir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de Tarjeta de Orden
function OrderCard({ order, products, onMove, onPrint, isReady = false }: { order: Order, products: Product[], onMove: () => void, onPrint: () => void, isReady?: boolean }) {
  const isNew = order.status === 'Pendiente' && (Date.now() - new Date(order.date).getTime()) < 60000;

  const diffMinutes = Math.floor((Date.now() - new Date(order.date).getTime()) / 60000);
  // Tiempo facil de leer: "Ahora", "8 min", "5 h 12 min" o "21 d"
  const getRelativeTime = () => {
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} h ${diffMinutes % 60} min`;
    return `${Math.floor(diffMinutes / 1440)} d`;
  };

  const isSlaBreached = order.status === 'En Preparación' && diffMinutes >= 15;
  // Color del reloj: verde (listo), ámbar (se está demorando), rojo (demorado) o gris (a tiempo)
  const timerTone = isReady
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    : diffMinutes >= 15
      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
      : diffMinutes >= 10
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        : 'bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-stone-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`relative rounded-[22px] bg-white dark:bg-[#1b1b1b] p-4 flex flex-col transition-shadow hover:shadow-lg hover:shadow-gray-200/60 dark:hover:shadow-black/40 ${
        isNew
          ? 'ring-2 ring-brand-orange shadow-lg shadow-brand-orange/15'
          : isSlaBreached
            ? 'ring-2 ring-red-500 bg-red-50/60 dark:bg-red-950/20 shadow-lg shadow-red-500/15'
            : 'border border-gray-100 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      }`}
    >
      {/* Encabezado: código, cliente y reloj */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-black text-lg leading-none tracking-tight whitespace-nowrap ${isSlaBreached ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              <span className="text-brand-orange">#</span>{orderCode(order.id)}
            </h3>
            {isNew && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange text-white text-[9px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Nuevo
              </span>
            )}
            {isSlaBreached && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-wider">Demorado</span>
            )}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-stone-400 min-w-0">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{order.client || 'Cliente Local'}</span>
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums shrink-0 ${timerTone} ${isSlaBreached ? 'animate-pulse' : ''}`}>
          <Clock className="w-3.5 h-3.5" /> {getRelativeTime()}
        </span>
      </div>

      {/* Productos */}
      <ul className="mt-4 space-y-2.5 flex-1 min-w-0">
        {order.items.map((item, idx) => {
          const catProduct = products.find(p => p.id === (item.productId || item.id) || p.name.toLowerCase() === (item.name || '').toLowerCase());
          const itemImage = item.product?.image || catProduct?.image;
          const modifications = modificacionesDe(item);
          return (
            <li key={idx} className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-stone-900 overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                {itemImage ? (
                  <img loading="lazy" decoding="async" src={itemImage} alt={item.name} className="w-full h-full object-cover object-center" />
                ) : item.extras && item.extras.length > 0 ? (
                  <CustomBurgerThumb ingredientNames={item.extras.map(e => e.name)} size={48} className="!rounded-none border-0" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-stone-700">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[15px] font-bold leading-snug text-gray-900 dark:text-white">
                  <span className="text-brand-orange font-black mr-1">{item.quantity}×</span>{item.name}
                </p>

                {/* HU-30: Alertas visuales (SIN/EXTRA) como etiquetas */}
                {modifications.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {modifications.map(({ texto: mod, tipo }, mIdx) => {
                      const isSin = tipo === 'sin';
                      const isExtra = tipo === 'extra';
                      const chip = isSin
                        ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        : isExtra
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
                      return (
                        <span key={mIdx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${chip}`}>
                          {isSin && <X className="w-3 h-3" strokeWidth={3} />}
                          {isExtra && <span className="font-black leading-none">+</span>}
                          {mod}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Acciones */}
      {!isReady && (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-stone-800">
          {(order.status === 'Pendiente' || order.status === 'Pagado') && (
            <button
              onClick={onMove}
              className="group/btn w-full h-12 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 text-white bg-gradient-to-r from-brand-orange to-[#ff8a1f] shadow-[0_10px_24px_-10px_rgba(255,107,0,0.7)] hover:shadow-[0_14px_28px_-10px_rgba(255,107,0,0.8)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer"
            >
              <ChefHat className="w-5 h-5" /> Empezar a preparar
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
            </button>
          )}

          {order.status === 'En Preparación' && (
            <div className="flex gap-2">
              <button
                onClick={onPrint}
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200 dark:border-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Imprimir Tirilla"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onMove}
                className="flex-1 h-12 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 text-white bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_10px_24px_-10px_rgba(16,185,129,0.7)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all min-w-0 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" /> Marcar listo
              </button>
            </div>
          )}
        </div>
      )}

      {isReady && (
        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-stone-800">
          <div className="flex items-center justify-center gap-2 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-bold">
            <Hourglass className="w-4 h-4 animate-pulse" /> Esperando domiciliario
          </div>
        </div>
      )}
    </motion.div>
  );
}
