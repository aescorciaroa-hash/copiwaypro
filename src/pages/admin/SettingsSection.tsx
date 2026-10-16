import React, { useEffect, useState } from 'react';
import { AlertCircle, Calculator, Clock, Gift, Receipt, Store, TrendingUp, Truck, Utensils } from 'lucide-react';

import { formatCOP } from '../../lib/format';
import { BusinessInfo, StoreConfig } from '../../store/almacenAplicacion';
import { ToastData } from '../../components/ToastNotification';
import { ApiError } from '../../servicios/api';

const NEGOCIO_VACIO: BusinessInfo = { name: '', nit: '', address: '', phone: '', instagram: '', website: '' };

const CAMPOS_NEGOCIO: Array<{ clave: keyof BusinessInfo; etiqueta: string; ejemplo: string }> = [
  { clave: 'name', etiqueta: 'Nombre del negocio', ejemplo: 'COPIWAY PRO' },
  { clave: 'nit', etiqueta: 'NIT', ejemplo: '900.123.456-7' },
  { clave: 'address', etiqueta: 'Dirección', ejemplo: 'Calle 10 # 5-20, Neiva' },
  { clave: 'phone', etiqueta: 'Teléfono', ejemplo: '(300) 123-4567' },
  { clave: 'instagram', etiqueta: 'Instagram', ejemplo: '@copiway_pro' },
  { clave: 'website', etiqueta: 'Página web', ejemplo: 'www.copiway.com' },
];

interface SettingsSectionProps {
  storeConfig: StoreConfig;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
  isStoreAutomaticallyOpen: boolean;
  shippingRateInput: string;
  setShippingRateInput: React.Dispatch<React.SetStateAction<string>>;
  profitMarginInput: string;
  setProfitMarginInput: React.Dispatch<React.SetStateAction<string>>;
  setShowTimePicker: React.Dispatch<React.SetStateAction<'open' | 'close' | null>>;
  handleGenerarCierre: () => Promise<void>;
  showToast: (type: ToastData['type'], message: string, title?: string) => void;
}

export default function SettingsSection({
  storeConfig,
  updateStoreConfig,
  isStoreAutomaticallyOpen,
  shippingRateInput,
  setShippingRateInput,
  profitMarginInput,
  setProfitMarginInput,
  setShowTimePicker,
  handleGenerarCierre,
  showToast,
}: SettingsSectionProps) {
  const [pointValueInput, setPointValueInput] = useState('');
  const [minPointsInput, setMinPointsInput] = useState('');
  const [businessInput, setBusinessInput] = useState<BusinessInfo>(NEGOCIO_VACIO);

  // Se recargan solo cuando cambian los valores guardados (la sincronización
  // periódica no borra lo que el administrador está escribiendo).
  useEffect(() => {
    setPointValueInput(String(storeConfig.pointValue ?? 10));
    setMinPointsInput(String(storeConfig.minPointsToRedeem ?? 100));
  }, [storeConfig.pointValue, storeConfig.minPointsToRedeem]);

  const businessGuardado = JSON.stringify(storeConfig.business || NEGOCIO_VACIO);
  useEffect(() => {
    setBusinessInput({ ...NEGOCIO_VACIO, ...(storeConfig.business || {}) });
  }, [businessGuardado]);

  const guardarPuntos = async () => {
    const valor = parseFloat(pointValueInput);
    const minimo = parseInt(minPointsInput, 10);
    if (!(valor >= 0) || !(minimo >= 0)) {
      showToast('warning', 'Escribe un valor por punto y un mínimo válidos (0 o más).', 'Datos Incompletos');
      return;
    }
    try {
      await updateStoreConfig({ pointValue: valor, minPointsToRedeem: minimo });
      showToast('config', 'Las reglas del programa de puntos fueron guardadas.', 'Puntos Actualizados');
    } catch (err) {
      showToast('danger', err instanceof ApiError ? err.message : 'No se pudieron guardar los puntos.', 'Error');
    }
  };

  const guardarNegocio = async () => {
    if (!businessInput.name.trim()) {
      showToast('warning', 'El nombre del negocio es obligatorio.', 'Datos Incompletos');
      return;
    }
    try {
      await updateStoreConfig({ business: businessInput });
      showToast('config', 'Los datos del negocio para el ticket fueron guardados.', 'Datos del Negocio');
    } catch (err) {
      showToast('danger', err instanceof ApiError ? err.message : 'No se pudieron guardar los datos del negocio.', 'Error');
    }
  };

  const valorPunto = parseFloat(pointValueInput) || 0;
  const minimoPuntos = parseInt(minPointsInput, 10) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Ajustes</h2>
        <p className="text-gray-500 dark:text-stone-400 mt-1">Configuración general.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Envíos, Horario y Datos del Negocio */}
        <div className="space-y-6">
          {/* Tarifa Plana de Domicilio */}
          <div className="bg-white dark:bg-[#151515] rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-orange" />
                Tarifa Plana de Domicilio
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-orange-50 dark:bg-stone-900 text-brand-orange border border-brand-orange/20">
                Tarifa Única: {formatCOP(storeConfig.shippingRate || 0)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-stone-400 mb-4">
              Costo fijo sumado automáticamente en el checkout del cliente.
            </p>

            {/* Presets de Tarifa */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-bold text-gray-400 dark:text-stone-500 uppercase tracking-wider">Sugeridos:</span>
              {[3000, 4000, 5000, 6000, 8000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setShippingRateInput(rate.toString())}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    shippingRateInput === rate.toString()
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700'
                  }`}
                >
                  ${rate.toLocaleString('es-CO')}
                </button>
              ))}
            </div>

            {/* Simulación de Cobro Checkout */}
            <div className="bg-orange-50/60 dark:bg-stone-900/60 rounded-2xl p-4 border border-brand-orange/20 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-gray-600 dark:text-stone-400">
                <span>Subtotal pedido (ejemplo):</span>
                <span className="font-semibold text-gray-800 dark:text-stone-200">$ 25.000</span>
              </div>
              <div className="flex justify-between items-center text-brand-orange font-medium">
                <span>+ Tarifa plana de domicilio:</span>
                <span className="font-bold">+ {formatCOP(parseFloat(shippingRateInput) || 0)}</span>
              </div>
              <div className="pt-2 border-t border-brand-orange/20 flex justify-between items-center font-bold text-gray-900 dark:text-white text-sm">
                <span>Total a pagar cliente:</span>
                <span className="text-brand-orange font-black">
                  {formatCOP(25000 + (parseFloat(shippingRateInput) || 0))}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full min-w-0">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input 
                  type="number" 
                  value={shippingRateInput} 
                  onChange={e => setShippingRateInput(e.target.value)} 
                  className="w-full pl-8 pr-4 py-3 rounded-[16px] border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white outline-none font-bold focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20" 
                  placeholder="5000"
                />
              </div>
              <button 
                onClick={() => {
                  const rate = parseFloat(shippingRateInput) || 0;
                  updateStoreConfig({ shippingRate: rate });
                  showToast('config', 'La tarifa plana de domicilio ha sido guardada.', 'Tarifa Actualizada');
                }} 
                className="bg-brand-orange text-white px-7 py-3 rounded-full font-bold w-full sm:w-auto hover:bg-[#e66500] shadow-md shadow-brand-orange/20 transition-all cursor-pointer shrink-0"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Horario de Atención */}
          <div className="bg-white dark:bg-[#151515] rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-orange shrink-0" />
                <span className="truncate">Horario de Atención</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {/* Real-time automatic status indicator */}
                {storeConfig.isOpen && (
                  <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${isStoreAutomaticallyOpen ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-stone-400'}`}>
                    {isStoreAutomaticallyOpen ? 'En Servicio' : 'Fuera de Horario'}
                  </span>
                )}
                <button 
                  onClick={() => {
                    const willBeOpen = !storeConfig.isOpen;
                    updateStoreConfig({ isOpen: willBeOpen });
                    showToast('config', willBeOpen ? 'Horario automático activado' : 'Local cerrado manualmente (Ignorando horario)', 'Estado del Local');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${storeConfig.isOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                  title={storeConfig.isOpen ? "El sistema está respetando el horario automático" : "El local está forzado a Cerrado"}
                >
                  {storeConfig.isOpen ? 'Automático Activado' : 'Cerrado Manualmente'}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-stone-400 mb-6">
              Bloquea pagos automáticamente fuera del horario configurado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full flex flex-col sm:flex-row gap-4 min-w-0">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-2">Apertura</label>
                  <button 
                    onClick={() => setShowTimePicker('open')}
                    className="w-full px-4 py-3 rounded-[16px] border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white outline-none font-bold flex justify-between items-center hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <span>{storeConfig.openTime ? (() => {
                      const [h, m] = storeConfig.openTime.split(':');
                      const hour = parseInt(h);
                      const period = hour >= 12 ? 'p. m.' : 'a. m.';
                      const h12 = hour % 12 || 12;
                      return h12.toString().padStart(2, '0') + ':' + m + ' ' + period;
                    })() : 'Seleccionar...'}</span>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-2">Cierre</label>
                  <button 
                    onClick={() => setShowTimePicker('close')}
                    className="w-full px-4 py-3 rounded-[16px] border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white outline-none font-bold flex justify-between items-center hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <span>{storeConfig.closeTime ? (() => {
                      const [h, m] = storeConfig.closeTime.split(':');
                      const hour = parseInt(h);
                      const period = hour >= 12 ? 'p. m.' : 'a. m.';
                      const h12 = hour % 12 || 12;
                      return h12.toString().padStart(2, '0') + ':' + m + ' ' + period;
                    })() : 'Seleccionar...'}</span>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => showToast('config', 'El horario de atención ha sido guardado correctamente.', 'Horario Actualizado')} 
                className="bg-brand-orange text-white px-7 py-3 rounded-full font-bold w-full sm:w-auto hover:bg-[#e66500] shadow-md shadow-brand-orange/20 transition-all cursor-pointer shrink-0"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Datos del Negocio (se imprimen en el ticket de cocina) */}
          <div className="bg-white dark:bg-[#151515] rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:p-8">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <Store className="w-5 h-5 text-brand-orange" />
              Datos del Negocio (Ticket)
            </h3>
            <p className="text-sm text-gray-500 dark:text-stone-400 mb-4">
              Aparecen en el ticket que imprime la cocina. Los campos vacíos no se imprimen.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {CAMPOS_NEGOCIO.map(({ clave, etiqueta, ejemplo }) => (
                <div key={clave} className={clave === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-2">{etiqueta}</label>
                  <input
                    type="text"
                    value={businessInput[clave]}
                    onChange={e => setBusinessInput({ ...businessInput, [clave]: e.target.value })}
                    className="w-full px-4 py-3 rounded-[16px] border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white outline-none font-semibold text-sm focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                    placeholder={ejemplo}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={guardarNegocio}
              className="bg-brand-orange text-white px-7 py-3 rounded-full font-bold w-full hover:bg-[#e66500] shadow-md shadow-brand-orange/20 transition-all cursor-pointer"
            >
              Guardar Datos del Negocio
            </button>
          </div>

          {/* Vista previa del ticket: se actualiza mientras se escriben los datos del negocio */}
          <div className="bg-white dark:bg-[#151515] rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-orange" />
                Vista Previa del Ticket
              </h3>
              {JSON.stringify(businessInput) !== businessGuardado && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Sin guardar
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-stone-400 mb-4">
              Así se verán el encabezado y el pie del ticket que imprime la cocina.
            </p>
            <div className="max-w-[300px] mx-auto bg-[#fafafa] dark:bg-[#1a1a1a] border border-dashed border-gray-300 dark:border-stone-700 rounded-2xl px-5 py-5 text-center text-gray-900 dark:text-gray-100">
              <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-gray-900 mx-auto mb-2">
                <Utensils className="w-5 h-5" />
              </div>
              <p className="font-black text-base tracking-tight break-words">{businessInput.name.trim() || 'COPIWAY PRO'}</p>
              {businessInput.nit.trim() && <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">NIT: {businessInput.nit.trim()}</p>}
              {businessInput.address.trim() && <p className="text-xs text-gray-500 dark:text-stone-400 break-words">{businessInput.address.trim()}</p>}
              {businessInput.phone.trim() && <p className="text-xs text-gray-500 dark:text-stone-400">Tel: {businessInput.phone.trim()}</p>}
              <span className="inline-block text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full mt-2">DOCUMENTO EQUIVALENTE POS</span>
              <div className="border-t border-dashed border-gray-300 dark:border-stone-700 my-3" />
              <p className="text-[11px] text-gray-400 dark:text-stone-500 italic">… productos y totales del pedido …</p>
              <div className="border-t border-dashed border-gray-300 dark:border-stone-700 my-3" />
              <div className="text-xs text-gray-500 dark:text-stone-400 space-y-1">
                <p className="font-bold text-gray-700 dark:text-stone-300">¡Gracias por su preferencia!</p>
                {businessInput.instagram.trim() && <p>Síguenos en IG: {businessInput.instagram.trim()}</p>}
                {businessInput.website.trim() && <p className="break-words">{businessInput.website.trim()}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Margen, Puntos, Cierre de Caja y Pausa de Emergencia */}
        <div className="space-y-6">
          {/* Margen de Ganancia (Creador Interactivo / Arma tu Burger) */}
          <div className="bg-white dark:bg-[#151515] rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-orange" />
                Margen de Ganancia (Arma tu Burger)
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-orange/10 text-brand-orange">
                Actual: {storeConfig.profitMargin ?? 30}%
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-stone-400 mb-4">
              Margen comercial aplicado sobre el costo de los insumos del Creador Interactivo.
            </p>

            {/* Presets rápidos */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-bold text-gray-400 dark:text-stone-500 uppercase tracking-wider">Sugeridos:</span>
              {[20, 30, 35, 40, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setProfitMarginInput(preset.toString())}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    profitMarginInput === preset.toString()
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>

            {/* Simulación en vivo */}
            <div className="bg-orange-50/60 dark:bg-stone-900/60 rounded-2xl p-4 border border-brand-orange/20 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-gray-600 dark:text-stone-400">
                <span>Costo base de insumos (ejemplo):</span>
                <span className="font-semibold text-gray-800 dark:text-stone-200">$ 10.000</span>
              </div>
              <div className="flex justify-between items-center text-brand-orange font-medium">
                <span>Ganancia comercial ({profitMarginInput || 0}%):</span>
                <span>+ {formatCOP(Math.round(10000 * ((parseFloat(profitMarginInput) || 0) / 100)))}</span>
              </div>
              <div className="pt-2 border-t border-brand-orange/20 flex justify-between items-center font-bold text-gray-900 dark:text-white text-sm">
                <span>Precio final al cliente:</span>
                <span className="text-brand-orange font-black">
                  {formatCOP(Math.round(10000 * (1 + (parseFloat(profitMarginInput) || 0) / 100)))}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-stone-400 pt-1 leading-relaxed">
                💡 <strong>Rango recomendado:</strong> <strong>30% - 40%</strong> para cubrir costos sin encarecer el producto.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full min-w-0">
                <input 
                  type="number" 
                  min="0"
                  max="200"
                  value={profitMarginInput} 
                  onChange={e => setProfitMarginInput(e.target.value)} 
                  className="w-full pl-4 pr-10 py-3 rounded-[16px] border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white outline-none font-bold focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20" 
                  placeholder="30"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <button 
                onClick={() => {
                  const margin = parseFloat(profitMarginInput) >= 0 ? parseFloat(profitMarginInput) : 30;
                  updateStoreConfig({ profitMargin: margin });
                  showToast('config', 'El margen de ganancia ha sido guardado correctamente.', 'Margen Actualizado');
                }} 
                className="bg-brand-orange text-white px-7 py-3 rounded-full font-bold w-full sm:w-auto hover:bg-[#e66500] shadow-md shadow-brand-orange/20 transition-all cursor-pointer shrink-0"
              >
                Guardar Margen
              </button>
            </div>
          </div>

          {/* Programa de Puntos (canje en el checkout) */}
          <div className="bg-white dark:bg-[#151515] rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-brand-orange" />
                Programa de Puntos
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-orange/10 text-brand-orange">
                1 punto = {formatCOP(storeConfig.pointValue ?? 10)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-stone-400 mb-4">
              El cliente gana 1 punto por cada $1.000 y puede usarlos al pagar. El descuento aplica sobre los productos, no sobre el domicilio.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-2">Valor de 1 punto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    value={pointValueInput}
                    onChange={e => setPointValueInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-[16px] border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white outline-none font-bold focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                    placeholder="10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-2">Mínimo para canjear</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={minPointsInput}
                    onChange={e => setMinPointsInput(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 rounded-[16px] border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white outline-none font-bold focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                    placeholder="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">puntos</span>
                </div>
              </div>
            </div>

            {/* Simulación en vivo */}
            <div className="bg-orange-50/60 dark:bg-stone-900/60 rounded-2xl p-4 border border-brand-orange/20 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-gray-600 dark:text-stone-400">
                <span>Compra de $100.000 gana:</span>
                <span className="font-semibold text-gray-800 dark:text-stone-200">100 puntos</span>
              </div>
              <div className="flex justify-between items-center text-brand-orange font-medium">
                <span>Esos 100 puntos valen al pagar:</span>
                <span className="font-bold">{formatCOP(100 * valorPunto)}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-stone-400 pt-1 leading-relaxed">
                Devuelve el <strong>{((valorPunto / 1000) * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })}%</strong> de lo comprado. Se puede canjear desde <strong>{minimoPuntos} puntos</strong>.
              </p>
            </div>

            <button
              onClick={guardarPuntos}
              className="bg-brand-orange text-white px-7 py-3 rounded-full font-bold w-full hover:bg-[#e66500] shadow-md shadow-brand-orange/20 transition-all cursor-pointer"
            >
              Guardar Puntos
            </button>
          </div>

          {/* Reporte de Cierre de Caja */}
          <div className="bg-gradient-to-br from-[#1a1a1e] to-black rounded-[24px] md:rounded-[32px] border border-gray-800 shadow-sm p-6 md:p-8 text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Calculator className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Calculator className="w-5 h-5"/> 
                </div>
                Reporte de Cierre de Caja
              </h3>
              <p className="text-sm text-gray-300 mb-6 max-w-[320px]">
                Cruza ingresos digitales, cobro en efectivo y consumo exacto de insumos por receta.
              </p>
            </div>
            <button 
              onClick={handleGenerarCierre} 
              className="bg-white text-gray-900 w-full py-3.5 rounded-full font-black hover:bg-gray-100 transition-colors shadow-lg relative z-10 cursor-pointer"
            >
              Generar Cierre del Día
            </button>
          </div>

          {/* Botón de Pánico (Pausa) */}
          <div className="bg-white dark:bg-[#151515] rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pausa de Emergencia (Botón de Pánico)
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-stone-400 mb-6">
              Pausa la recepción de órdenes por contingencias, sin modificar los horarios oficiales.
            </p>
            <button 
              onClick={() => {
                const willBePaused = !storeConfig.isPaused;
                updateStoreConfig({ isPaused: willBePaused });
                showToast('config', willBePaused ? 'Recepción de pedidos pausada' : 'Recepción de pedidos reanudada', 'Estado del Local');
              }}
              className={`w-full py-4 rounded-[16px] font-black text-lg transition-colors flex items-center justify-center gap-2 ${storeConfig.isPaused ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'bg-gray-100 dark:bg-stone-900 text-gray-800 dark:text-stone-200 hover:bg-gray-200 dark:hover:bg-stone-800'}`}
            >
              <AlertCircle className="w-6 h-6" />
              {storeConfig.isPaused ? 'COCINA PAUSADA (Clic para Reanudar)' : 'PAUSAR RECEPCIÓN DE PEDIDOS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
