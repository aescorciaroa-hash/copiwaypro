import React from 'react';
import {
  Wallet, LayoutDashboard, TrendingUp, Users, ShoppingBag, ArrowRight, Activity, ChefHat, Flame, Truck, Clock, Package, MapPin, Plus, Utensils, Calculator, Bell
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { formatCOP, orderCode } from '../../lib/format';
import { Order, Staff, StoreConfig, useStore } from '../../store/almacenAplicacion';
import { CustomSelect } from '../../components/CustomSelect';
import { CustomTooltip } from '../AdminDashboard';

interface TopProductDatum {
  name: string;
  value: number;
  units: number;
  color: string;
}

interface OverviewSectionProps {
  orders: Order[];
  staff: Staff[];
  storeConfig: StoreConfig;
  salesData: Array<{ date: string; amount: number }>;
  periodOrdersCount: number;
  salesFilter: string;
  setSalesFilter: (value: string) => void;
  topProductsData: TopProductDatum[];
  activePieIndex: number | null;
  setActivePieIndex: (index: number | null) => void;
  handleNavigateToOrders: (orderId?: string) => void;
  setActiveTab: (tab: string) => void;
  /** Para el saludo de bienvenida. */
  isStoreOpen: boolean;
  onNuevoPedido: () => void;
}

export default function OverviewSection({
  orders,
  staff,
  storeConfig,
  salesData,
  periodOrdersCount,
  salesFilter,
  setSalesFilter,
  topProductsData,
  activePieIndex,
  setActivePieIndex,
  handleNavigateToOrders,
  setActiveTab,
  isStoreOpen,
  onNuevoPedido,
}: OverviewSectionProps) {
  const products = useStore(state => state.products);
  return (
    <div className="space-y-8">
      {/* Bienvenida: saludo, accesos rápidos y el estado de la cocina en vivo */}
      {(() => {
        // El nombre del administrador viene del servidor en window.__DATOS__ (ver PaginaController).
        const nombre = String(window.__DATOS__?.usuario?.nombre || 'Administrador').split(' ')[0];
        const pendientes = orders.filter(o => o.status === 'Pendiente' || o.status === 'Pagado').length;
        const enCocina = orders.filter(o => o.status === 'En Preparación').length;
        const listos = orders.filter(o => o.status === 'Listos').length;
        const enCamino = orders.filter(o => o.status === 'En Camino').length;
        const hoy = new Date().toDateString();
        const ventasHoy = orders
          .filter(o => (o.status === 'Entregado' || o.status === 'entregado') && new Date(o.date).toDateString() === hoy)
          .reduce((acc, o) => acc + o.total, 0);
        const activos = pendientes + enCocina + listos + enCamino;
        // Foto: la del producto más vendido (guardada en el propio servidor); si no hay, la de cualquier producto.
        const masVendido = products.find(p => p.name === topProductsData[0]?.name && p.image);
        const foto = masVendido?.image || products.find(p => p.active && p.image)?.image || '';

        return (
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-900 via-stone-900 to-[#2a1608] text-white shadow-xl shadow-gray-900/10">
            <div className="absolute -left-16 -bottom-24 w-72 h-72 rounded-full bg-brand-orange/25 blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 -top-20 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-6 p-6 sm:p-8">
              <div className="flex flex-col justify-center">
                <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold tracking-wide">
                  <LayoutDashboard className="w-3.5 h-3.5 text-brand-orange" /> CopiwayPRO · Panel del administrador
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight leading-tight">¡Hola, {nombre}! 👋</h2>
                <p className="mt-2 text-sm sm:text-base text-white/70 max-w-lg">
                  {activos > 0
                    ? `Tienes ${activos} ${activos === 1 ? 'pedido activo' : 'pedidos activos'} en este momento. Revisa las comandas, registra pedidos por llamada o WhatsApp y controla tu caja.`
                    : 'Todo está al día. Desde aquí registras pedidos por llamada o WhatsApp, revisas las comandas y controlas tu caja.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <button
                    onClick={onNuevoPedido}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-bold hover:bg-[#e66500] shadow-lg shadow-brand-orange/30 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Nuevo pedido
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/20 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <Utensils className="w-4 h-4" /> Comandas activas
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/20 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <Calculator className="w-4 h-4" /> Cierre de caja
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" /> Ventas de hoy: {formatCOP(ventasHoy)}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${isStoreOpen ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300' : 'bg-rose-500/10 border-rose-400/20 text-rose-300'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {isStoreOpen ? `Tienda abierta hasta las ${storeConfig.closeTime || '22:00'}` : `Tienda cerrada · abre a las ${storeConfig.openTime || '11:00'}`}
                  </span>
                </div>
              </div>

              {/* Cocina en vivo: foto con los pedidos de cada estado encima */}
              <div className="relative hidden sm:block h-60 lg:h-auto lg:min-h-[270px] rounded-3xl overflow-hidden bg-gradient-to-br from-stone-800 to-[#3a1d08]">
                {foto && (
                  <img loading="lazy" decoding="async"
                    src={foto}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    // Si la foto no carga, se esconde y queda el fondo oscuro (no la imagen rota).
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-3 grid grid-cols-4 gap-2">
                  {[
                    { label: 'Pendientes', valor: pendientes, icono: Bell, color: 'text-brand-orange', tab: 'orders' },
                    { label: 'En cocina', valor: enCocina, icono: ChefHat, color: 'text-blue-400', tab: 'orders' },
                    { label: 'Listos', valor: listos, icono: Package, color: 'text-emerald-400', tab: 'orders' },
                    { label: 'En camino', valor: enCamino, icono: Truck, color: 'text-violet-300', tab: 'map' },
                  ].map(e => (
                    <button
                      key={e.label}
                      onClick={() => setActiveTab(e.tab)}
                      className="rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-2.5 text-left transition-colors cursor-pointer"
                    >
                      <e.icono className={`w-4 h-4 ${e.color}`} />
                      <p className="text-2xl font-black leading-none mt-1.5">{e.valor}</p>
                      <p className="text-[10px] font-semibold text-white/70 mt-0.5 truncate">{e.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
        {(() => {
          const totalVentasPeriodo = salesData.reduce((a, b) => a + b.amount, 0);
          const hoy = new Date();
          const ordenesHoy = orders.filter(o => {
            const fecha = new Date(o.date);
            return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
          }).length;
          return [
            { label: 'Ventas Totales', value: formatCOP(totalVentasPeriodo), icon: <Wallet className="w-5 h-5 text-brand-orange" />, badge: salesFilter, badgeColor: 'text-emerald-600 bg-emerald-50' },
            { label: 'Órdenes Hoy', value: ordenesHoy, icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />, badge: 'Hoy', badgeColor: 'text-gray-600 bg-gray-100' },
            { label: 'Ticket Promedio', value: formatCOP(periodOrdersCount ? totalVentasPeriodo / periodOrdersCount : 0), icon: <TrendingUp className="w-5 h-5 text-gray-600" />, badge: salesFilter, badgeColor: 'text-brand-orange bg-orange-50' },
            { label: 'Empleados Activos', value: staff.filter(s => s.active).length, icon: <Users className="w-5 h-5 text-emerald-500" />, badge: '•', badgeColor: 'text-emerald-500 bg-transparent text-xl leading-none' }
          ];
        })().map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 shadow-sm py-4 px-4 sm:p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-stone-800 flex items-center justify-center">
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.badgeColor}`}>{stat.badge}</span>
            </div>
            <p className="text-gray-500 dark:text-stone-400 text-sm font-bold mb-1">{stat.label}</p>
            <p className="text-[clamp(1.1rem,4.5vw,1.875rem)] sm:text-3xl font-black text-gray-900 dark:text-white break-all sm:break-normal leading-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        <div className="lg:col-span-2 bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 sm:p-8 min-h-[480px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{salesFilter.includes('mes') ? 'Ventas Semanales' : 'Ventas Diarias'}</h3>

            <div className="w-48">
              <CustomSelect
                value={salesFilter}
                onChange={setSalesFilter}
                options={[
                  { value: 'Esta semana', label: 'Esta semana' },
                  { value: 'Semana pasada', label: 'Semana pasada' },
                  { value: 'Este mes', label: 'Este mes' },
                  { value: 'Hace un mes', label: 'Hace un mes' }
                ]}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 min-h-[320px] flex items-center">
            {salesData.length === 0 ? (
              <div className="flex items-center justify-center h-full w-full text-gray-400 font-medium">No hay datos de ventas registrados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
                  <Tooltip cursor={false} content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#f97316" activeBar={{ fill: "#ea580c" }} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 sm:p-8 min-h-[480px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Productos más vendidos</h3>
              <p className="text-xs text-gray-500 dark:text-stone-400 font-medium mt-0.5">Participación por volumen</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-brand-orange flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="h-[210px] w-full relative flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProductsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                >
                  {topProductsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.4}
                      className="transition-opacity duration-200 cursor-pointer"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Display Dinámico y Limpio */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center select-none">
              {activePieIndex !== null && topProductsData[activePieIndex] ? (
                <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center max-w-[120px]">
                  <span className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                    {topProductsData[activePieIndex].value}%
                  </span>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-stone-300 mt-1 truncate max-w-full leading-tight">
                    {topProductsData[activePieIndex].name}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-stone-500 font-medium">
                    {topProductsData[activePieIndex].units} unids
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-[120px]">
                  <span className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                    {topProductsData[0]?.value || 0}%
                  </span>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-stone-300 mt-1 truncate max-w-full leading-tight">
                    {topProductsData[0]?.name || 'Más vendido'}
                  </span>
                  <span className="text-[10px] font-semibold text-brand-orange uppercase tracking-wider">
                    Top #1
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lista de leyenda interactiva */}
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-stone-800">
            {topProductsData.map((item, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setActivePieIndex(idx)}
                onMouseLeave={() => setActivePieIndex(null)}
                className={`flex items-center justify-between text-xs sm:text-sm p-2 rounded-xl transition-all cursor-pointer ${
                  activePieIndex === idx
                    ? 'bg-gray-100/80 dark:bg-stone-800/80 font-bold'
                    : 'hover:bg-gray-50 dark:hover:bg-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 dark:text-stone-300 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400 dark:text-stone-500 font-medium">
                    {item.units} u
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Órdenes Recientes */}
        <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 sm:p-7 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-orange" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-gray-900 dark:text-white">Órdenes Recientes</h3>
            </div>
            <button
              onClick={() => handleNavigateToOrders()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50/80 dark:bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white text-xs font-bold transition-all duration-200 shadow-xs active:scale-95 group cursor-pointer border border-brand-orange/20 hover:border-transparent"
            >
              <span>Ver todas ({orders.length})</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {orders.length > 0 ? (
              orders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => handleNavigateToOrders(ord.id)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 dark:bg-stone-900/50 hover:bg-orange-50/50 dark:hover:bg-stone-900 transition-all border border-gray-100/80 dark:border-stone-800/80 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 text-brand-orange flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-gray-100 dark:border-stone-700">
                      {ord.id.replace(/[^0-9]/g, '').slice(-2) || orderCode(ord.id).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-brand-orange transition-colors">
                        {ord.client || ord.clientPhone || 'Cliente'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{ord.address}</span>
                        <span>•</span>
                        <span className={`font-bold ${
                          ord.status === 'Entregado' || ord.status === 'entregado' ? 'text-emerald-600 dark:text-emerald-400' :
                          ord.status === 'En Camino' ? 'text-blue-600 dark:text-blue-400' :
                          ord.status === 'Listos' ? 'text-purple-600 dark:text-purple-400' :
                          'text-brand-orange'
                        }`}>
                          {ord.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-black text-sm text-gray-900 dark:text-white block">{formatCOP(ord.total)}</span>
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-stone-500 uppercase">{ord.paymentMethod || 'Digital'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm font-medium">No hay órdenes activas registradas.</div>
            )}
          </div>
          <div className="pt-3.5 mt-4 border-t border-gray-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-stone-400">
            <span>Total registradas en el turno:</span>
            <span className="font-bold text-gray-900 dark:text-white">{orders.length} órdenes</span>
          </div>
        </div>

        {/* Monitoreo Operativo y Despacho */}
        <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-orange" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-gray-900 dark:text-white">Despacho y Logística</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                En Vivo
              </span>
            </div>

            {/* Badges de Estado Operativo - Paleta Limpia y Minimalista */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100/80 dark:bg-stone-800/80 text-gray-700 dark:text-stone-300 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-brand-orange" />
                Cocina Operativa
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100/80 dark:bg-stone-800/80 text-gray-700 dark:text-stone-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-brand-orange" />
                <span>{orders.filter(o => o.status === 'En Preparación' || o.status === 'Pagado' || o.status === 'Pendiente').length} en cocina</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100/80 dark:bg-stone-800/80 text-gray-700 dark:text-stone-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-brand-orange" />
                <span>{orders.filter(o => o.status === 'En Camino').length} en ruta</span>
              </span>
            </div>

            {/* Barras de Capacidad y Eficiencia Refinadas */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-medium text-gray-600 dark:text-stone-400">Capacidad de Cocina</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {Math.min(100, Math.max(15, orders.filter(o => o.status !== 'Entregado' && o.status !== 'entregado').length * 15))}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-orange rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, orders.filter(o => o.status !== 'Entregado' && o.status !== 'entregado').length * 15))}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-medium text-gray-600 dark:text-stone-400">Disponibilidad de Repartidores</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {staff.filter(s => s.role === 'Domiciliario' && s.active).length > 0
                      ? `${staff.filter(s => s.role === 'Domiciliario' && s.active).length} activos`
                      : '0 activos'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${staff.filter(s => s.role === 'Domiciliario' && s.active).length > 0 ? 100 : 20}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Grid 2x2 de Indicadores Operativos Armoniosos */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 text-gray-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-xs border border-gray-100 dark:border-stone-700">
                  <Clock className="w-4 h-4 text-brand-orange" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-stone-400 font-medium truncate">Tiempo Promedio</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">25 - 35 min</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 text-gray-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-xs border border-gray-100 dark:border-stone-700">
                  <Package className="w-4 h-4 text-brand-orange" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-stone-400 font-medium truncate">Listos p/ Entrega</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {orders.filter(o => o.status === 'Listos').length} pedido(s)
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 text-gray-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-xs border border-gray-100 dark:border-stone-700">
                  <Truck className="w-4 h-4 text-brand-orange" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-stone-400 font-medium truncate">Tarifa Plana</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{formatCOP(storeConfig.shippingRate || 0)}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 text-gray-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-xs border border-gray-100 dark:border-stone-700">
                  <Users className="w-4 h-4 text-brand-orange" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-stone-400 font-medium truncate">Domiciliarios</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {staff.filter(s => s.role === 'Domiciliario' && s.active).length} disponibles
                  </p>
                </div>
              </div>
            </div>

            {/* Monitor de Despacho en Vivo - Contenedor Neutro Limpio */}
            <div className="pt-1">
              <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-800 dark:text-stone-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                    Estado de Ruta Inmediata
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-stone-400">
                    {orders.filter(o => o.status === 'En Camino').length > 0 ? 'Entregas en curso' : 'Sin demoras'}
                  </span>
                </div>
                {orders.filter(o => o.status === 'En Camino').length > 0 ? (
                  <div className="space-y-1.5">
                    {orders.filter(o => o.status === 'En Camino').slice(0, 2).map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between text-xs bg-white dark:bg-stone-800/80 px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-stone-700">
                        <span className="font-semibold text-gray-800 dark:text-stone-200 truncate max-w-[170px]">
                          {ord.client || orderCode(ord.id)}: {ord.address}
                        </span>
                        <span className="text-[10px] font-bold text-brand-orange bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md shrink-0">
                          En camino
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-stone-400">
                    Todos los domicilios asignados han sido entregados con éxito. Flota lista para nuevos pedidos.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3.5 mt-3 border-t border-gray-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-stone-400 font-medium">Acceso logístico:</span>
            <button
              onClick={() => setActiveTab('map')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50/80 dark:bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white text-xs font-bold transition-all duration-200 shadow-xs active:scale-95 group cursor-pointer border border-brand-orange/20 hover:border-transparent"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-orange group-hover:text-white transition-colors" />
              <span>Ver Mapa de Rutas</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
