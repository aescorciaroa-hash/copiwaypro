import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  Bell, Bike, Check, ChefHat, Clock, Eye, MapPin, Maximize2, Minimize2, Package, Pencil, Phone, Plus, Utensils
} from 'lucide-react';

import { Order, OrderItem, Staff, useStore } from '../../store/almacenAplicacion';
import { CustomZoomControl, RoutePolyline, DriverMockInfo } from '../AdminDashboard';
import { formatCOP, orderCode, vehicleWithModel } from '../../lib/format';

interface OrdersSectionProps {
  orders: Order[];
  staff: Staff[];
  theme: string;
  highlightedOrderId: string | null;
  isMapExpanded: boolean;
  setIsMapExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedDriverInfo: React.Dispatch<React.SetStateAction<DriverMockInfo | null>>;
  showManualForm: boolean;
  setShowManualForm: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingAddressOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  setNewAddress: React.Dispatch<React.SetStateAction<string>>;
  handleViewOrder: (orderId: string) => void;
}

export default function OrdersSection({
  orders,
  staff,
  theme,
  highlightedOrderId,
  isMapExpanded,
  setIsMapExpanded,
  setSelectedDriverInfo,
  showManualForm,
  setShowManualForm,
  setEditingAddressOrder,
  setNewAddress,
  handleViewOrder,
}: OrdersSectionProps) {
  const products = useStore(state => state.products);

    const pendientes = orders.filter(o => o.status === 'Pendiente' || o.status === 'Pagado').length;
    const enCocina = orders.filter(o => o.status === 'En Preparación').length;
    const listos = orders.filter(o => o.status === 'Listos').length;
    const enCamino = orders.filter(o => o.status === 'En Camino').length;

    /** Arma el detalle del modal de repartidor con sus pedidos reales asignados (antes era 100% mock). */
    const buildDriverInfo = (driver: Staff): DriverMockInfo => {
      const pedidosDelDriver = orders.filter(o => o.id === driver.currentOrderId || (driver.currentOrderIds || []).includes(o.id));
      return {
        name: driver.name,
        status: driver.currentOrderId ? 'EN RUTA' : 'DISPONIBLE',
        phone: driver.phone || 'Sin teléfono registrado',
        plate: driver.plate || 'Sin placa registrada',
        vehicle: vehicleWithModel(driver.vehicle, driver.vehicleModel) || 'Sin vehículo registrado',
        orders: pedidosDelDriver.map(o => ({
          id: o.id,
          client: o.client || 'Cliente',
          address: o.address,
          status: o.status,
          items: (o.items || []).map(it => `${it.quantity || 1}x ${it.product?.name || it.name || 'Producto'}`),
          total: o.total,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          raw: o,
        })),
      };
    };

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Órdenes en Tiempo Real</h2>
            <p className="text-gray-500 dark:text-stone-400 mt-1">Supervisa el flujo de cocina y repartos.</p>
          </div>
          <button onClick={() => setShowManualForm(!showManualForm)} className="bg-brand-orange text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#e66500] transition-colors shadow-lg shadow-brand-orange/20">
            <Plus className="w-5 h-5" /> Registro Manual (Llamada/WhatsApp)
          </button>
        </div>

{/* Manual Order Modal now moved to end of renderOrders */}


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 py-4 px-4 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm text-gray-600 dark:text-stone-400">Pendientes</span>
              <Bell className="w-5 h-5 text-brand-orange" />
            </div>
            <span className="text-3xl sm:text-4xl font-black mt-4 text-gray-900 dark:text-white">{String(pendientes).padStart(2, '0')}</span>
          </div>
          <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 py-4 px-4 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm text-gray-600 dark:text-stone-400">En Cocina</span>
              <Utensils className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-3xl sm:text-4xl font-black mt-4 text-gray-900 dark:text-white">{String(enCocina).padStart(2, '0')}</span>
          </div>
          <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 py-4 px-4 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm text-gray-600 dark:text-stone-400">Listos</span>
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-3xl sm:text-4xl font-black mt-4 text-gray-900 dark:text-white">{String(listos).padStart(2, '0')}</span>
          </div>
          <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 py-4 px-4 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm text-gray-600 dark:text-stone-400">En Camino</span>
              <Package className="w-5 h-5 text-gray-500" />
            </div>
            <span className="text-3xl sm:text-4xl font-black mt-4 text-gray-900 dark:text-white">{String(enCamino).padStart(2, '0')}</span>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-stone-800 text-brand-orange mx-auto flex items-center justify-center mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="font-black text-xl text-gray-900 dark:text-white mb-1.5">No hay comandas activas en este momento</h3>
            <p className="text-sm text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-6">
              Las órdenes realizadas por la web o ingresadas manualmente aparecerán aquí para control de cocina y despacho.
            </p>
            <button
              onClick={() => setShowManualForm(true)}
              className="bg-brand-orange text-white px-6 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:bg-[#e66500] transition-colors shadow-md shadow-brand-orange/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Ingresar Orden Manual
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {orders.map(order => {
              // Colores del estado: chip suave con un puntito y un brillo de fondo arriba de la tarjeta
              let tone = { chip: 'bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-stone-300', dot: 'bg-gray-400', glow: 'from-gray-100/80 dark:from-stone-800/40' };
              let statusText: string = order.status;
              if (order.status === 'Esperando Pago') { tone = { chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500', glow: 'from-amber-50 dark:from-amber-500/10' }; statusText = 'Esperando pago'; }
              if (order.status === 'Cancelado') { tone = { chip: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', dot: 'bg-red-500', glow: 'from-red-50 dark:from-red-500/10' }; statusText = 'Cancelado'; }
              if (order.status === 'Pendiente' || order.status === 'Pagado') { tone = { chip: 'bg-orange-50 text-brand-orange dark:bg-brand-orange/10', dot: 'bg-brand-orange', glow: 'from-orange-50 dark:from-brand-orange/10' }; statusText = 'Pendiente'; }
              if (order.status === 'En Preparación') { tone = { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', dot: 'bg-blue-500', glow: 'from-blue-50 dark:from-blue-500/10' }; statusText = 'Preparando'; }
              if (order.status === 'Listos') { tone = { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500', glow: 'from-emerald-50 dark:from-emerald-500/10' }; statusText = 'Listo'; }
              if (order.status === 'En Camino') { tone = { chip: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', dot: 'bg-violet-500', glow: 'from-violet-50 dark:from-violet-500/10' }; statusText = 'En camino'; }
              const isHighlighted = highlightedOrderId === order.id;
              const isDelivered = order.status === 'Entregado';
              const totalUnidades = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

              return (
                <div
                  key={order.id}
                  id={`order-card-${order.id}`}
                  className={`bg-white dark:bg-[#151515] rounded-[28px] border relative overflow-hidden flex flex-col group transition-all duration-300 ${
                    isHighlighted
                      ? 'border-brand-orange ring-4 ring-brand-orange/30 shadow-xl shadow-brand-orange/20 scale-[1.02] z-10'
                      : 'border-gray-100 dark:border-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-black/40 hover:-translate-y-1'
                  }`}
                >
                  {/* Brillo suave del color del estado */}
                  <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${tone.glow} to-transparent pointer-events-none`}></div>

                  <div className="relative p-5 sm:p-6 flex-1 flex flex-col gap-4">
                    {/* Encabezado: código, hora y estado */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-black text-2xl tracking-tight text-gray-900 dark:text-white leading-none">
                          <span className="text-brand-orange">#</span>{orderCode(order.id)}
                        </h3>
                        <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-stone-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {order.time ? order.time : 'Turno actual'}
                          {order.channel && <><span className="text-gray-300 dark:text-stone-600">•</span><span className="capitalize">{order.channel}</span></>}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${tone.chip}`}>
                        <span className="relative flex w-2 h-2">
                          {!isDelivered && order.status !== 'Cancelado' && <span className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${tone.dot}`}></span>}
                          <span className={`relative inline-flex w-2 h-2 rounded-full ${tone.dot}`}></span>
                        </span>
                        {statusText}
                      </span>
                    </div>

                    {/* Cliente y dirección */}
                    <div className="rounded-2xl border border-gray-100 dark:border-stone-800 bg-white/70 dark:bg-stone-900/50 backdrop-blur-sm divide-y divide-gray-100 dark:divide-stone-800">
                      <div className="flex items-center gap-3 px-3.5 py-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-400 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-gray-400 dark:text-stone-500 uppercase tracking-wider">Cliente</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{order.clientPhone || order.client || 'Cliente Local'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-3.5 py-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-400 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-gray-400 dark:text-stone-500 uppercase tracking-wider">Entregar en</p>
                          <p className="text-sm font-semibold text-gray-700 dark:text-stone-200 truncate" title={order.address}>{order.address}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingAddressOrder(order); setNewAddress(order.address); }}
                          disabled={isDelivered}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isDelivered ? 'text-gray-300 dark:text-stone-700 cursor-not-allowed' : 'text-gray-400 hover:bg-orange-50 dark:hover:bg-stone-800 hover:text-brand-orange cursor-pointer'}`}
                          title="Editar dirección"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Productos */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-gray-500 dark:text-stone-400 uppercase tracking-wider">Pedido</p>
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-stone-500">{totalUnidades} {totalUnidades === 1 ? 'producto' : 'productos'}</span>
                        </div>
                        <ul className="space-y-2">
                          {order.items.map((item: OrderItem, idx: number) => {
                            const foto = products.find(p => p.id === item.productId)?.image;
                            return (
                              <li key={idx} className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  {foto ? (
                                    <img loading="lazy" decoding="async" src={foto} alt={item.name} className="w-12 h-12 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-stone-800 text-gray-400 flex items-center justify-center">
                                      <Utensils className="w-5 h-5" />
                                    </div>
                                  )}
                                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#151515]">
                                    {item.quantity}
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-gray-800 dark:text-stone-100 leading-snug line-clamp-2">{item.name}</p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Equipo: quién cocinó y quién lo lleva */}
                    {(order.preparedBy || order.driverName || order.status === 'En Camino') && (
                      <div className="flex flex-col gap-2 mt-auto">
                        {order.preparedBy && (
                          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-blue-50/60 dark:bg-blue-500/10">
                            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                              <ChefHat className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Preparó</p>
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{order.preparedBy}</p>
                            </div>
                          </div>
                        )}
                        {(order.driverName || order.status === 'En Camino') && (
                          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-orange-50/70 dark:bg-brand-orange/10">
                            <div className="w-8 h-8 rounded-xl bg-brand-orange text-white flex items-center justify-center shrink-0">
                              <Bike className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold text-brand-orange uppercase tracking-wider">{isDelivered ? 'Entregó' : 'Domiciliario'}</p>
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{order.driverName || 'Domiciliario Asignado'}</p>
                            </div>
                            {order.driverPlate && (
                              <span className="text-[10px] font-black tracking-widest px-2 py-1 rounded-lg bg-white dark:bg-stone-900 text-gray-700 dark:text-stone-200 border border-gray-200 dark:border-stone-700 shrink-0">
                                {order.driverPlate}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pie: total y botón de ver */}
                  <div className="relative px-5 sm:px-6 py-4 border-t border-dashed border-gray-200 dark:border-stone-800 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-stone-500 uppercase tracking-wider">Total</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{formatCOP(order.total || 0)}</p>
                    </div>
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="inline-flex items-center gap-2 pl-3.5 pr-4 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-brand-orange dark:hover:bg-brand-orange dark:hover:text-white transition-colors cursor-pointer"
                      title="Ver detalles y domiciliario"
                    >
                      <Eye className="w-4 h-4" /> Ver detalle
                    </button>
                  </div>
                </div>
              );
          })}
        </div>
        )}
        
        <div className="mt-8 mb-4">
          <h3 className="font-black text-xl text-gray-900 dark:text-white mb-1">Mapa de Entregas</h3>
          <p className="text-sm text-gray-500 dark:text-stone-400">Visualiza a tus repartidores en tiempo real.</p>
        </div>
        
        <div className={`bg-[#f1f5f9] dark:bg-[#0f172a] p-8 relative overflow-hidden shadow-sm flex flex-col justify-between border border-gray-200 dark:border-stone-800 transition-all duration-300 ${isMapExpanded ? 'fixed inset-3 sm:inset-6 z-[500] rounded-[32px] sm:rounded-[40px] shadow-2xl ring-1 ring-black/20' : 'h-[300px] rounded-[32px]'}`}>
          {/* Botón flotante destacado para salir de pantalla completa */}
          {isMapExpanded && (
            <button 
              type="button"
              onClick={() => {
                setIsMapExpanded(false);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
              }}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[600] flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/85 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4 text-brand-orange" />
              <span>Salir de Pantalla Completa (ESC)</span>
            </button>
          )}

          {/* Interactive Leaflet Map for Neiva */}
          <div className={`absolute inset-0 z-0 [&_.leaflet-container]:bg-transparent [&_.leaflet-control-container]:z-[500] ${theme === 'dark' ? 'leaflet-dark-tiles' : ''}`}>
            <MapContainer
              center={[2.9273, -75.2818]}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              className="z-0"
            >
              <CustomZoomControl />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Restaurant / Origin */}
              <Marker 
                position={[2.9273, -75.2818]} 
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
                <Popup>Cocina Oculta - Hamburguer Copiway</Popup>
              </Marker>

              {/* Delivery Drivers (posiciones reales, reportadas por cada domiciliario) */}
              {staff.filter(s => s.role === 'Domiciliario' && s.location).map(driver => {
                return (
                  <React.Fragment key={driver.id}>
                    {driver.destCoords && (
                      <RoutePolyline
                        origin={driver.location as [number, number]}
                        destination={driver.destCoords}
                        outerColor="#1e3a8a"
                        innerColor="#3b82f6"
                      />
                    )}
                    <Marker
                      position={driver.location as [number, number]}
                      eventHandlers={{ click: () => setSelectedDriverInfo(buildDriverInfo(driver)) }}
                      icon={L.divIcon({
                        html: `<div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                 <svg viewBox="0 0 32 32" style="width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                                   <path d="M16 0c-5.5 0-10 4.5-10 10 0 7.5 10 22 10 22s10-14.5 10-22c0-5.5-4.5-10-10-10z" fill="#3b82f6"/>
                                   <circle cx="16" cy="10" r="6" fill="#fff"/>
                                   <path d="M16 12.5c-.3 0-1.8-1.5-2.5-2.2-.8-.8-.8-2 0-2.8.8-.8 2-.8 2.8 0 .2.2.4.4.5.7.1-.3.3-.5.5-.7.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8-.7.7-2.2 2.2-2.5 2.2H16z" fill="#3b82f6"/>
                                 </svg>
                               </div>`,
                        className: 'custom-marker',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                      })}
                    >
                      <Popup>
                        <strong>{driver.name}</strong><br/>
                        Estado: {driver.currentOrderId ? 'En Ruta: ' + driver.currentOrderId : 'Disponible'}
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
          
          {!isMapExpanded && (
            <button 
              type="button"
              onClick={() => {
                setIsMapExpanded(true);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
              }}
              title="Expandir mapa"
              className="absolute top-6 right-6 w-10 h-10 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer shadow-sm border border-gray-200 dark:border-white/10 z-[400] hover:scale-110 transition-transform pointer-events-auto text-gray-700 dark:text-white"
            >
              <Maximize2 size={18} />
            </button>
          )}
          
          <div className="flex gap-4 z-10 mt-auto overflow-x-auto pb-2 pointer-events-auto">
            {staff.filter(s => s.role === 'Domiciliario' && s.active).length === 0 ? (
              <div className="bg-white/90 dark:bg-[#151515]/90 backdrop-blur-md rounded-full px-4 py-2 text-xs font-medium text-gray-500 dark:text-stone-400 shadow-sm border border-gray-200 dark:border-stone-800">
                Sin domiciliarios activos
              </div>
            ) : (
              staff.filter(s => s.role === 'Domiciliario' && s.active).map(driver => {
                const enRuta = !!driver.currentOrderId;
                return (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriverInfo(buildDriverInfo(driver))}
                    className={`bg-white/90 dark:bg-[#151515]/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 shadow-sm border cursor-pointer hover:bg-white dark:hover:bg-black transition-colors ${enRuta ? 'border-blue-500/20 dark:border-blue-500/30' : 'border-gray-200 dark:border-stone-800'}`}
                  >
                    <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center ${enRuta ? 'bg-blue-500 shadow-lg shadow-blue-500/20 animate-pulse' : 'bg-gray-400 dark:bg-stone-700'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={enRuta ? 2.5 : 2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{driver.name}</p>
                      <p className={`text-[9px] font-black tracking-wider ${enRuta ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>{enRuta ? 'EN RUTA' : 'DISPONIBLE'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
}
