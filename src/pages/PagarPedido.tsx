import React, { useEffect, useState } from 'react';
import { Utensils, CheckCircle2, Clock, AlertCircle, Lock, Smartphone, MapPin, Star, Cake, Navigation, ArrowRight, Loader2, ShieldCheck, Receipt, Gift } from 'lucide-react';
import { api, ApiError, irA } from '../servicios/api';
import { formatCOP, agruparPorNombre } from '../lib/format';

/** Lo que devuelve GET /api/pay-link/{codigo} (ver PedidoService::pedidoPorLink). */
interface PedidoLink {
  id: string;
  status: 'esperando_pago' | 'pagado' | 'vencido';
  client: string;
  address: string;
  items: Array<{ image: string | null; name: string; quantity: number; price: number; extras: { name: string }[]; removed: { name: string }[] }>;
  subtotal: number;
  shipping: number;
  total: number;
  expiresAt: string | null;
  deliveryPin: string | null;
  isGuest: boolean;
  pointsEarned: number;
  bank: string | null;
}

interface Transaccion {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  status_message: string;
}

const METODOS = [
  { id: 'nequi', nombre: 'Nequi', color: 'bg-[#210049] text-white' },
  { id: 'daviplata', nombre: 'Daviplata', color: 'bg-[#ED1C27] text-white' },
  { id: 'bancolombia', nombre: 'Bancolombia', color: 'bg-[#FDDA24] text-gray-900' },
] as const;

const FOTO_POR_DEFECTO = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&h=200&auto=format&fit=crop';

/**
 * Página pública del link de pago (/pagar?c=codigo). El cliente de un pedido
 * manual paga desde su celular sin iniciar sesión. Al aprobarse, el pedido pasa
 * a cocina y aquí se le muestra su código de entrega.
 * En computador: resumen a la izquierda y pago a la derecha. En celular: una columna.
 */
export default function PagarPedido() {
  const codigo = new URLSearchParams(window.location.search).get('c') || '';
  const [pedido, setPedido] = useState<PedidoLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<'nequi' | 'daviplata' | 'bancolombia'>('nequi');
  const [telefono, setTelefono] = useState('');
  const [pagando, setPagando] = useState(false);
  const [mensajePago, setMensajePago] = useState<string | null>(null);
  const [ahora, setAhora] = useState(Date.now());

  const cargar = async () => {
    try {
      setPedido(await api.get<PedidoLink>(`/pay-link/${encodeURIComponent(codigo)}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cargar tu pedido.');
    }
  };

  useEffect(() => { cargar(); }, []);

  // Reloj para la cuenta regresiva del link.
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const segundosRestantes = pedido?.expiresAt
    ? Math.max(0, Math.floor((new Date(pedido.expiresAt.replace(' ', 'T')).getTime() - ahora) / 1000))
    : 0;
  const vencido = pedido?.status === 'vencido' || (pedido?.status === 'esperando_pago' && segundosRestantes === 0);
  const esperando = pedido?.status === 'esperando_pago' && !vencido;

  const pagar = async () => {
    setMensajePago(null);
    const digitos = telefono.replace(/\D/g, '');
    if (metodo !== 'bancolombia' && !/^3\d{9}$/.test(digitos)) {
      setMensajePago('Escribe el celular de tu cuenta: 10 números que empiezan por 3.');
      return;
    }
    setPagando(true);
    try {
      let tx = await api.post<Transaccion>(`/pay-link/${encodeURIComponent(codigo)}/transactions`, { method: metodo, phone: digitos });
      // La pasarela de prueba tarda unos segundos en aprobar (como cuando se acepta en la app del banco).
      while (tx.status === 'PENDING') {
        await new Promise(r => setTimeout(r, 1500));
        tx = await api.get<Transaccion>(`/pay-link/${encodeURIComponent(codigo)}/transactions/${tx.id}`);
      }
      if (tx.status === 'APPROVED') {
        await cargar();
      } else {
        setMensajePago(tx.status === 'ERROR' ? 'Ocurrió un error al procesar el pago. Intenta de nuevo.' : 'El pago fue rechazado. Intenta de nuevo o usa otro método.');
      }
    } catch (err) {
      setMensajePago(err instanceof ApiError ? err.message : 'No se pudo procesar el pago. Intenta de nuevo.');
      await cargar();
    } finally {
      setPagando(false);
    }
  };

  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, '0');
  const segundos = String(segundosRestantes % 60).padStart(2, '0');
  const poco = segundosRestantes < 300; // menos de 5 minutos: la cuenta se pone roja

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-stone-950 text-gray-900 dark:text-white relative overflow-x-hidden">
      {/* Franja naranja de fondo */}
      <div className="absolute inset-x-0 top-0 h-56 sm:h-64 bg-gradient-to-br from-brand-orange to-orange-600" />
      <div className="absolute inset-x-0 top-0 h-56 sm:h-64 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0%,white_0,transparent_35%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        {/* Barra superior */}
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">CopiwayPRO</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Pago seguro
          </span>
        </header>

        {!pedido && !error && (
          <div className="bg-white dark:bg-[#151515] rounded-3xl shadow-xl p-16 flex flex-col items-center text-gray-500 mt-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-orange mb-3" />
            Cargando tu pedido...
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mt-4">
            <Tarjeta><Aviso icono={<AlertCircle className="w-8 h-8" />} color="red" titulo="Link no válido" texto={error} /></Tarjeta>
          </div>
        )}

        {pedido && (
          <>
            {/* Saludo */}
            <div className="text-white mt-2 mb-6">
              <p className="text-white/80 text-sm sm:text-base">Hola {pedido.client} 👋</p>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-0.5">
                {pedido.status === 'pagado' ? '¡Tu pedido ya está en cocina!' : vencido ? 'Este link ya venció' : 'Paga tu pedido'}
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-5 lg:gap-6 items-stretch">
              {/* ---- Columna de pago / estado (en celular va primero) ---- */}
              <div className="lg:order-2 flex flex-col">
                {pedido.status === 'pagado' && (
                  <>
                    <Tarjeta className="flex-1 flex flex-col">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black leading-tight">¡Pago aprobado!</h2>
                          <p className="text-sm text-gray-500 dark:text-stone-400">{formatCOP(pedido.total)}{pedido.bank ? ` con ${METODOS.find(m => m.id === pedido.bank)?.nombre || pedido.bank}` : ''}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex-1 flex flex-col justify-center rounded-2xl border-2 border-dashed border-brand-orange/40 bg-brand-orange/5 p-5 text-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-orange">Tu código de entrega</p>
                        <p className="text-5xl lg:text-6xl font-black tracking-[0.3em] mt-2 pl-[0.3em]">{pedido.deliveryPin}</p>
                        <p className="text-sm text-gray-600 dark:text-stone-300 mt-3">Dáselo al domiciliario cuando llegue. <b>Guárdalo</b> (toma una captura).</p>
                      </div>
                    </Tarjeta>
                  </>
                )}

                {pedido.status !== 'pagado' && vencido && (
                  <Tarjeta className="flex-1 flex flex-col justify-center">
                    <Aviso icono={<Clock className="w-8 h-8" />} color="gray" titulo="Este link ya venció" texto="El pedido se canceló porque no se pagó a tiempo. Escríbenos o llámanos para hacerlo de nuevo." />
                  </Tarjeta>
                )}

                {esperando && (
                  <Tarjeta className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-stone-500">Total a pagar</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{formatCOP(pedido.total)}</p>
                      </div>
                      <div className={`shrink-0 px-3 py-2 rounded-2xl text-center ${poco ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider">Vence en</p>
                        <p className="text-lg font-black tabular-nums flex items-center gap-1"><Clock className="w-4 h-4" />{minutos}:{segundos}</p>
                      </div>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-stone-500 mt-6 mb-2">Paga con</p>
                    <div className="grid grid-cols-3 gap-2">
                      {METODOS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setMetodo(m.id)}
                          className={`relative rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all cursor-pointer ${metodo === m.id ? 'border-brand-orange bg-brand-orange/5 shadow-sm' : 'border-gray-100 dark:border-stone-800 hover:border-gray-300 dark:hover:border-stone-600'}`}
                        >
                          {metodo === m.id && <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-brand-orange" />}
                          <span className={`w-10 h-10 rounded-xl ${m.color} font-black flex items-center justify-center`}>{m.nombre[0]}</span>
                          <span className="text-[11px] sm:text-xs font-bold">{m.nombre}</span>
                        </button>
                      ))}
                    </div>

                    {metodo !== 'bancolombia' ? (
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-1.5">Celular de tu cuenta {metodo === 'nequi' ? 'Nequi' : 'Daviplata'}</label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={telefono}
                            onChange={e => setTelefono(e.target.value)}
                            placeholder="3001234567"
                            className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-stone-500 mt-1.5">Te llegará una notificación a tu app para aprobar el pago.</p>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-gray-500 dark:text-stone-400 bg-gray-50 dark:bg-stone-900 rounded-xl p-3">Te llevaremos a Bancolombia para que apruebes el pago.</p>
                    )}

                    {mensajePago && (
                      <p className="mt-4 text-sm font-semibold text-red-600 dark:text-red-400 flex items-start gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {mensajePago}
                      </p>
                    )}

                    <button
                      onClick={pagar}
                      disabled={pagando}
                      className="mt-5 w-full py-4 rounded-2xl bg-brand-orange text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/25 hover:bg-[#e66500] active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
                    >
                      {pagando ? <><Loader2 className="w-5 h-5 animate-spin" /> Aprueba el pago en tu celular...</> : <><Lock className="w-4 h-4" /> Pagar {formatCOP(pedido.total)}</>}
                    </button>
                    <p className="text-[11px] text-center text-gray-400 dark:text-stone-500 mt-3 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Pago de prueba: no se cobra dinero real.
                    </p>
                  </Tarjeta>
                )}
              </div>

              {/* ---- Columna del pedido ---- */}
              <div className="lg:order-1 flex flex-col">
                <Tarjeta className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-brand-orange" /> Tu pedido</h2>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-400">{pedido.id}</span>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-stone-800">
                    {pedido.items.map((item, i) => (
                      <div key={i} className="flex gap-3 sm:gap-4 py-3 first:pt-0">
                        <img loading="lazy" decoding="async" src={item.image || FOTO_POR_DEFECTO} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 bg-gray-100 dark:bg-stone-800" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-3">
                            <p className="font-bold text-sm sm:text-base leading-tight">{item.name}</p>
                            <span className="font-black text-sm sm:text-base shrink-0">{formatCOP(item.price * item.quantity)}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">Cantidad: {item.quantity}</p>
                          {(item.removed.length > 0 || item.extras.length > 0) && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {item.removed.map(r => (
                                <span key={r.name} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">Sin {r.name}</span>
                              ))}
                              {agruparPorNombre(item.extras).map(e => (
                                <span key={e.name} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">+ {e.name}{e.veces > 1 ? ` x${e.veces}` : ''}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 dark:border-stone-800 mt-2 pt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500 dark:text-stone-400"><span>Productos</span><span>{formatCOP(pedido.subtotal)}</span></div>
                    <div className="flex justify-between text-gray-500 dark:text-stone-400"><span>Domicilio</span><span>{formatCOP(pedido.shipping)}</span></div>
                    <div className="flex justify-between font-black text-lg pt-1"><span>Total</span><span className="text-brand-orange">{formatCOP(pedido.total)}</span></div>
                  </div>

                  <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-gray-50 dark:bg-stone-900 p-3">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-brand-orange" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-stone-500">Entrega en</p>
                      <p className="text-sm font-semibold">{pedido.address}</p>
                    </div>
                  </div>
                </Tarjeta>
              </div>
            </div>

            {/* Qué sigue: los pasos hasta la entrega (a lo ancho) */}
            {pedido.status === 'pagado' && (
              <div className="mt-5 lg:mt-6">
                <Tarjeta>
                  <h2 className="font-black text-lg mb-4">¿Qué sigue?</h2>
                  <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Paso numero={1} icono={<CheckCircle2 className="w-4 h-4" />} titulo="Pago recibido" texto="Listo, ya quedó pagado." hecho />
                    <Paso numero={2} icono={<Utensils className="w-4 h-4" />} titulo="Preparamos tu pedido" texto="La cocina ya lo tiene en la lista." actual />
                    <Paso numero={3} icono={<Navigation className="w-4 h-4" />} titulo="Va en camino" texto="Un domiciliario lo lleva a tu dirección." />
                    <Paso numero={4} icono={<Lock className="w-4 h-4" />} titulo="Lo recibes" texto={`Le das el código ${pedido.deliveryPin} al domiciliario.`} />
                  </ol>
                </Tarjeta>
              </div>
            )}

            {/* Invitación a registrarse (solo invitados), a lo ancho */}
            {pedido.isGuest && !vencido && (
              <div className="mt-5 lg:mt-6 rounded-3xl p-6 sm:p-7 bg-gray-900 dark:bg-[#151515] dark:border dark:border-stone-800 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-brand-orange/30 blur-2xl" />
                <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="lg:w-[280px] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-brand-orange flex items-center justify-center shrink-0"><Gift className="w-5 h-5" /></div>
                      <p className="text-lg font-black leading-tight">Te habrías ganado <span className="text-brand-orange">{pedido.pointsEarned} puntos</span></p>
                    </div>
                    <p className="text-sm text-white/70 mt-2">Regístrate gratis con este mismo celular y obtén:</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                    <Beneficio icono={<Star className="w-4 h-4" />} texto="Puntos en cada compra para canjear" />
                    <Beneficio icono={<Cake className="w-4 h-4" />} texto="15% de descuento en tu cumpleaños" />
                    <Beneficio icono={<Navigation className="w-4 h-4" />} texto="Sigue tu pedido en tiempo real" />
                  </div>
                  <button
                    onClick={() => irA('/register')}
                    className="w-full lg:w-auto shrink-0 px-6 py-3.5 rounded-2xl bg-brand-orange text-white font-black flex items-center justify-center gap-2 hover:bg-[#e66500] transition-colors cursor-pointer"
                  >
                    Crear mi cuenta <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Tarjeta({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-[#151515] rounded-3xl border border-gray-100 dark:border-stone-800 shadow-xl shadow-gray-900/5 p-5 sm:p-6 ${className}`}>{children}</div>;
}

/** Un paso de "¿Qué sigue?": hecho (verde), actual (naranja) o pendiente (gris). */
function Paso({ numero, icono, titulo, texto, hecho, actual }: { numero: number; icono: React.ReactNode; titulo: string; texto: string; hecho?: boolean; actual?: boolean }) {
  const color = hecho
    ? 'bg-emerald-500 text-white'
    : actual
      ? 'bg-brand-orange text-white ring-4 ring-brand-orange/20'
      : 'bg-gray-100 text-gray-400 dark:bg-stone-800 dark:text-stone-500';
  const fondo = actual ? 'border-brand-orange/40 bg-brand-orange/5' : 'border-gray-100 dark:border-stone-800';
  return (
    <li className={`flex gap-3 items-start rounded-2xl border p-3.5 ${fondo}`}>
      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>{icono}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-stone-500">Paso {numero}</p>
        <p className={`text-sm font-bold leading-tight ${hecho || actual ? '' : 'text-gray-500 dark:text-stone-400'}`}>{titulo}</p>
        <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">{texto}</p>
      </div>
    </li>
  );
}

function Beneficio({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 p-3 text-sm font-semibold">
      <span className="text-brand-orange shrink-0">{icono}</span>{texto}
    </div>
  );
}

function Aviso({ icono, color, titulo, texto }: { icono: React.ReactNode; color: 'green' | 'red' | 'gray'; titulo: string; texto: string }) {
  const colores = {
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-500 dark:bg-stone-800 dark:text-stone-400',
  };
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-3 ${colores[color]}`}>{icono}</div>
      <h2 className="text-2xl font-black">{titulo}</h2>
      <p className="text-sm text-gray-500 dark:text-stone-400 mt-1">{texto}</p>
    </div>
  );
}
