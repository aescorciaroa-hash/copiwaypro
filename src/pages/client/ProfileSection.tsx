import { Calendar, Gift, Lock, LogOut, Mail, MapPin, Phone, User } from 'lucide-react';

import { UserProfileState } from '../ClientDashboard';

interface ProfileSectionProps {
  userProfile: UserProfileState;
  setUserProfile: (profile: UserProfileState) => void;
  setShowCalendar: (show: boolean) => void;
  setShowPasswordModal: (show: boolean) => void;
  handleLogout: () => void;
  onSaveProfile: () => void;
  onDiscardProfile: () => void;
  isSavingProfile: boolean;
}

// Estilo comun de las cajas de texto (con espacio a la izquierda para el icono)
const campo = 'w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-900 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 focus:ring-2 focus:ring-brand-orange/20 transition-all';
const etiqueta = 'block text-sm font-bold text-gray-700 dark:text-stone-300 mb-2';
const icono = 'w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none';

export default function ProfileSection({
  userProfile, setUserProfile, setShowCalendar, setShowPasswordModal, handleLogout,
  onSaveProfile, onDiscardProfile, isSavingProfile,
}: ProfileSectionProps) {
  // Iniciales para el circulo (ej. "Edgar Escorcia" -> "EE")
  const iniciales = (userProfile.name || '?').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Encabezado: datos del cliente y sus puntos */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-orange to-orange-600 p-6 sm:p-8 text-white shadow-lg shadow-brand-orange/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-20 right-24 w-40 h-40 rounded-full bg-white/10"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-brand-orange font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-md">
              {iniciales}
            </div>
            <div className="min-w-0">
              <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Mi Perfil</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight truncate">{userProfile.name || 'Cliente'}</h2>
              {userProfile.email && <p className="text-white/80 text-sm truncate">{userProfile.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/15 backdrop-blur-sm border border-white/20 rounded-3xl px-5 py-4 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <p className="text-white/80 text-[11px] font-bold uppercase tracking-wider">Fidelidad y Recompensas</p>
              <p className="text-3xl font-black leading-tight">{userProfile.points} <span className="text-base font-bold opacity-80">pts</span></p>
              <p className="text-white/80 text-[11px] font-medium">Úsalos al pagar tu pedido</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informacion personal */}
      <div className="bg-white dark:bg-[#151515] rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-6 md:px-8 border-b border-gray-100 dark:border-stone-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-brand-orange flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Información Personal</h3>
            <p className="text-xs text-gray-500 dark:text-stone-400">Estos datos se usan para tus pedidos y entregas.</p>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={etiqueta}>Nombre Completo</label>
            <div className="relative">
              <User className={icono} />
              <input
                type="text"
                value={userProfile.name}
                onChange={e => setUserProfile({...userProfile, name: e.target.value})}
                className={campo}
              />
            </div>
          </div>
          <div>
            <label className={etiqueta}>Correo Electrónico</label>
            <div className="relative">
              <Mail className={icono} />
              <input
                type="email"
                value={userProfile.email || ''}
                onChange={e => setUserProfile({...userProfile, email: e.target.value})}
                className={campo}
              />
            </div>
          </div>
          <div>
            <label className={etiqueta}>Teléfono Móvil</label>
            <div className="relative">
              <Phone className={icono} />
              <input
                type="tel"
                value={userProfile.phone}
                onChange={e => setUserProfile({...userProfile, phone: e.target.value})}
                className={campo}
              />
            </div>
          </div>
          <div>
            <label className={etiqueta}>Fecha de Nacimiento</label>
            <div className="relative">
              <Calendar className={icono} />
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className={campo + ' text-left cursor-pointer'}
              >
                <span className={userProfile.birthday ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                  {userProfile.birthday || 'Selecciona una fecha'}
                </span>
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={etiqueta}>Dirección Predeterminada</label>
            <div className="relative">
              <MapPin className={icono} />
              <input
                type="text"
                value={userProfile.address || ''}
                onChange={e => setUserProfile({...userProfile, address: e.target.value})}
                className={campo}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3 items-center p-4 rounded-2xl bg-orange-50 dark:bg-brand-orange/10 border border-brand-orange/20">
            <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <p className="text-[13px] font-medium text-gray-700 dark:text-stone-300">
              {userProfile.birthday
                ? <>El día de tu cumpleaños tendrás <strong className="text-brand-orange">15% de descuento</strong> en tus productos.</>
                : <>Configura tu fecha de nacimiento para activar tu <strong className="text-brand-orange">15% de descuento</strong> en tu cumpleaños.</>}
            </p>
          </div>
        </div>

        <div className="px-6 md:px-8 py-5 border-t border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-stone-900/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onDiscardProfile}
            disabled={isSavingProfile}
            className="px-6 py-3 rounded-full font-bold text-sm text-gray-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Descartar
          </button>
          <button
            onClick={onSaveProfile}
            disabled={isSavingProfile}
            className="px-6 py-3 rounded-full font-bold text-sm text-white bg-brand-orange hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-white dark:bg-[#151515] rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Seguridad</h3>
            <p className="text-xs text-gray-500 dark:text-stone-400">Protege tu cuenta y actualiza tu contraseña cuando lo necesites.</p>
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="px-6 py-3 rounded-full font-bold text-sm text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 transition-colors shrink-0 cursor-pointer"
        >
          Cambiar Contraseña
        </button>
      </div>

      {/* Cerrar Sesión (Visible solo en mobile dentro del perfil) */}
      <div className="md:hidden bg-red-50 dark:bg-red-950/20 rounded-[32px] border border-red-100 dark:border-red-900/30 p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-red-700 dark:text-red-400">Sesión</h3>
          <p className="text-sm text-red-600 dark:text-red-400/80">¿Deseas salir de tu cuenta?</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-black text-red-700 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 transition-all uppercase tracking-widest text-xs"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
