import React, { useState, useEffect, useMemo } from 'react';
import { CalendarModal } from "../components/CalendarModal";
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Settings, ShoppingBag, Calendar, 
  Sun, Moon, Utensils, LayoutGrid, RotateCcw, 
  ShoppingCart, Gift, AlertCircle, CheckCircle2, Trash2, X,
  ChefHat, Minus, Plus, Star, Smartphone, Layers, CreditCard, Banknote,
  Flame, Sparkles, Award, Search, MapPin, Truck, FileText, Wallet, Bell, Eye, EyeOff, User,
  Clock, Receipt, Percent, Lock, KeyRound, ShieldCheck, Check, Mail, ArrowLeft
} from 'lucide-react';

import { formatCOP, orderCode } from '../lib/format';
import { CustomBurgerThumb, IngredientThumb } from './client/ingredientArt';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { useStore, Product, ProductComponent, Order, NamedRef } from '../store/almacenAplicacion';
import { api, ApiError, irA } from '../servicios/api';
import { crearTransaccion, esperarResultado } from '../lib/pasarela';
import { activarNotificacionesPush, pushDisponible, sincronizarSuscripcionPush } from '../lib/pushNotifications';
import { ToastNotification, ToastData } from '../components/ToastNotification';
import { ConfirmDialog } from '../components/ConfirmDialog';
import CatalogSection from './client/CatalogSection';
import BuilderSection from './client/BuilderSection';
import CartSection from './client/CartSection';
import CheckoutSection from './client/CheckoutSection';
import ActiveOrdersSection from './client/ActiveOrdersSection';
import HistorySection from './client/HistorySection';
import ProfileSection from './client/ProfileSection';
import PaymentGatewayModal, { GatewayStep } from './client/PaymentGatewayModal';

export interface SyncedIngredient {
  id: string;
  name: string;
  rawCost: number;
  price: number;
  category: string;
  stock: number;
  unit: string;
  image?: string;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'promo' | 'system' | 'order';
}

export interface UserProfileState {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  points: number;
  address: string;
  notifications: UserNotification[];
}

export interface CartItem {
  id: string;
  isCustom?: boolean;
  product?: Product;
  name?: string;
  basePrice?: number;
  price?: number;
  finalPrice?: number;
  quantity?: number;
  image?: string;
  removed?: ProductComponent[];
  extras?: SyncedIngredient[];
  stack?: SyncedIngredient[];
}

export default function ClientDashboard() {
  const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('catalog');
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [selectedOrderInfo, setSelectedOrderInfo] = useState<Order | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'unrated' | 'rated'>('all');
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Perfil del Usuario: placeholder vacío hasta que llegue el registro real del
  // cliente vía /api/sync (ver useEffect de abajo que lo sobrescribe).
  const [userProfile, setUserProfile] = useState<UserProfileState>({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    points: 0,
    address: '',
    notifications: []
  });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  // 'actual' = cambia la contraseña escribiendo la actual; 'codigo' = con un código que llega al correo
  const [modoClave, setModoClave] = useState<'actual' | 'codigo'>('actual');
  const [mostrarAyudaClave, setMostrarAyudaClave] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');
  const [errorClaveActual, setErrorClaveActual] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);

  const resetPasswordModalFields = () => {
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setModoClave('actual');
    setMostrarAyudaClave(false);
    setCodigoInput('');
    setErrorClaveActual('');
  };

  // Correo de la cuenta (el guardado; si no, el que se ve en el perfil)
  const correoCuenta = () => clients.find(c => c.id === currentUserId)?.email || userProfile.email || '';

  // "¿No recuerdas tu contraseña?": manda un código de 6 dígitos al correo del cliente
  const enviarCodigoClave = async () => {
    const correo = correoCuenta();
    if (!correo) {
      showToast('danger', 'Tu cuenta no tiene correo. Contacta al restaurante para recuperar tu contraseña.', 'Sin Correo');
      return;
    }
    setEnviandoCodigo(true);
    try {
      const respuesta = await api.post<{ ok: boolean; debugCode?: string }>('/auth/forgot-password/request', { email: correo });
      setModoClave('codigo');
      setMostrarAyudaClave(false);
      setCodigoInput('');
      // debugCode solo llega en local cuando el correo no se pudo enviar (para poder probar)
      showToast('success', respuesta.debugCode ? 'Modo de prueba: tu código es ' + respuesta.debugCode : 'Te enviamos un código de 6 dígitos a ' + correo + '.', 'Código Enviado');
    } catch (err) {
      showToast('danger', err instanceof ApiError ? err.message : 'No se pudo enviar el código.', 'No se Envió el Código');
    } finally {
      setEnviandoCodigo(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUserId || currentUserId === 'guest') return;
    if ((modoClave === 'actual' ? !currentPasswordInput : !codigoInput) || !newPasswordInput) {
      showToast('danger', modoClave === 'actual' ? 'Completa tu contraseña actual y la nueva.' : 'Completa el código y la nueva contraseña.', 'Faltan Datos');
      return;
    }
    if (newPasswordInput.length < 8) {
      showToast('danger', 'La nueva contraseña debe tener al menos 8 caracteres.', 'Contraseña Muy Corta');
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      showToast('danger', 'La confirmación no coincide con la nueva contraseña.', 'No Coinciden');
      return;
    }
    setIsChangingPassword(true);
    try {
      if (modoClave === 'codigo') {
        await api.post('/auth/forgot-password/reset', { email: correoCuenta(), code: codigoInput, newPassword: newPasswordInput });
      } else {
        await changeClientPassword(currentUserId, currentPasswordInput, newPasswordInput);
      }
      showToast('success', 'Tu contraseña se actualizó correctamente.', 'Contraseña Actualizada');
      resetPasswordModalFields();
      setShowPasswordModal(false);
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.';
      // Si la contraseña actual está mal, se marca en rojo debajo de su caja
      if (err instanceof ApiError && err.errors?.currentPassword) {
        setErrorClaveActual(err.errors.currentPassword[0]);
      }
      showToast('danger', mensaje, 'No se Cambió la Contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };
  const [showNotifications, setShowNotifications] = useState(false);
  // Nombre, icono y frase de cada pantalla (se muestran a la izquierda de la barra de arriba)
  const secciones: Record<string, { titulo: string; frase: string; icono: React.ComponentType<{ className?: string }> }> = {
    catalog: { titulo: 'Explorar Menú', frase: 'Elige lo que se te antoja', icono: Utensils },
    builder: { titulo: 'Creador Interactivo', frase: 'Arma tu hamburguesa a tu gusto', icono: Plus },
    cart: { titulo: 'Carrito de Pedidos', frase: 'Revisa y paga tu pedido', icono: ShoppingCart },
    activeOrders: { titulo: 'Órdenes Activas', frase: 'Sigue tus pedidos en camino', icono: CheckCircle2 },
    history: { titulo: 'Historial y Recompras', frase: 'Tus pedidos anteriores', icono: RotateCcw },
    profile: { titulo: 'Mi Perfil', frase: 'Gestión de tu cuenta', icono: Settings },
  };
  const seccionActual = secciones[activeTab] || secciones.catalog;
  const [showCalendar, setShowCalendar] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState('Todas');

  // Datos Simulados & Sincronización en Tiempo Real
  const { products, ingredients, inventory, orders, addOrder, prepareOnlinePayment, updateOrderStatus, storeConfig, updateOrder, clients, updateClient, changeClientPassword } = useStore();
  const catalog = products.filter(p => p.active);
  
  const orderHistory = orders.filter(o => o.status === 'Entregado' || o.status === 'entregado');
  const activeOrders = orders.filter(o => o.status !== 'Entregado' && o.status !== 'entregado' && o.status !== 'Pagado' && o.status !== 'Cancelado');
  const [toastMessage, setToastMessage] = useState<ToastData | null>(null);

  // Reloj en vivo para actualizar automáticamente el estado del local cada 15 segundos
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  
  // HU-11: Alternador para simular negocio abierto/cerrado basado en horario en tiempo real
  const checkIsStoreOpen = () => {
    if (storeConfig.isOpen === false) return false; // Manual override del administrador
    
    const now = currentTime;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const [openHours, openMinutes] = (storeConfig.openTime || '11:00').split(':').map(Number);
    const openTotalMinutes = openHours * 60 + openMinutes;

    const [closeHours, closeMinutes] = (storeConfig.closeTime || '23:00').split(':').map(Number);
    const closeTotalMinutes = closeHours * 60 + closeMinutes;

    if (closeTotalMinutes < openTotalMinutes) {
      // Abre en la noche y cierra en la madrugada (ej: 18:00 a 02:00)
      return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
    } else {
      return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
    }
  };
  
  const isStoreOpen = checkIsStoreOpen();

  // Margen de Ganancia configurado por el Administrador (porcentaje ej. 30%)
  const profitMargin = storeConfig?.profitMargin !== undefined ? storeConfig.profitMargin : 30;

  // Sincronización automática de ingredientes con el Inventario y cálculo de PVP transparente por insumo
  const syncedIngredients = useMemo(() => {
    const defaultIngredientMap: Record<string, { baseCost: number; category: string }> = {
      'Pan de Hamburguesa': { baseCost: 1500, category: 'base' },
      'Pan de Perro': { baseCost: 1200, category: 'base' },
      'Patacón': { baseCost: 2000, category: 'base' },
      'Carne 120g': { baseCost: 4000, category: 'extra' },
      'Salchicha': { baseCost: 2500, category: 'extra' },
      'Tocineta': { baseCost: 3500, category: 'extra' },
      'Queso Cheddar': { baseCost: 2500, category: 'extra' },
      'Lechuga': { baseCost: 800, category: 'vegetal' },
      'Tomate': { baseCost: 800, category: 'vegetal' },
      'Cebolla': { baseCost: 800, category: 'vegetal' }
    };

    const combined: SyncedIngredient[] = [];
    const seenNames = new Set<string>();

    const sourceList = ingredients.length > 0 ? ingredients : Object.entries(defaultIngredientMap).map(([name, val], idx) => ({
      id: `ing-${idx}`,
      name,
      price: val.baseCost,
      category: val.category,
      stock: 50
    }));

    sourceList.forEach(ing => {
      const normName = (ing.name || '').trim().toLowerCase();
      const invMatch = inventory.find(inv => 
        inv.id === ing.id || 
        (inv.name || '').trim().toLowerCase() === normName ||
        (inv.name || '').toLowerCase().includes(normName) ||
        normName.includes((inv.name || '').toLowerCase())
      );

      const actualStock = invMatch !== undefined ? invMatch.stock : (ing.stock !== undefined ? ing.stock : 50);
      const baseCost = invMatch?.unitCost || ing.price || defaultIngredientMap[ing.name]?.baseCost || 1500;
      
      // Aplicar el porcentaje de ganancia directamente al PVP de cada insumo individual
      const pvpPrice = Math.round((baseCost * (1 + profitMargin / 100)) / 100) * 100;

      seenNames.add(normName);
      combined.push({
        id: ing.id || (invMatch ? invMatch.id : normName),
        name: ing.name,
        rawCost: baseCost,
        price: pvpPrice,
        category: ing.category || (invMatch?.category ? invMatch.category.toLowerCase() : 'extra'),
        stock: actualStock,
        unit: invMatch?.unit || 'Und',
        image: ing.image || invMatch?.image
      });
    });

    // Añadir cualquier insumo creado en el módulo de Inventario que no estuviese en la lista base
    inventory.forEach(inv => {
      const normName = (inv.name || '').trim().toLowerCase();
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        const baseCost = inv.unitCost || 2000;
        const pvpPrice = Math.round((baseCost * (1 + profitMargin / 100)) / 100) * 100;
        
        let cat = 'extra';
        if (normName.includes('pan') || normName.includes('patac')) cat = 'base';
        else if (normName.includes('lechuga') || normName.includes('tomate') || normName.includes('cebolla') || normName.includes('pepinillo')) cat = 'vegetal';

        combined.push({
          id: inv.id,
          name: inv.name,
          rawCost: baseCost,
          price: pvpPrice,
          category: cat,
          stock: inv.stock,
          unit: inv.unit || 'Und',
          image: inv.image
        });
      }
    });

    return combined;
  }, [ingredients, inventory, profitMargin]);
  
  // Estado del Creador Interactivo
  const [builderStack, setBuilderStack] = useState<SyncedIngredient[]>([]);
  
  // Estado del Carrito (HU-15 Persistencia)
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('olio_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const currentUserId = localStorage.getItem('copiway_auth_user_id');
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (currentUserId && currentUserId !== 'guest' && clients.length > 0) {
      const client = clients.find(c => c.id === currentUserId);
      if (client) {
        setUserProfile(prev => ({
          ...prev,
          name: client.name || prev.name,
          email: client.email || prev.email,
          phone: client.phone || prev.phone,
          address: client.address || prev.address,
          birthday: client.birthday || prev.birthday,
          // ?? y no ||: tras canjear todos los puntos el saldo real es 0.
          points: client.points ?? prev.points,
          notifications: client.notifications || prev.notifications
        }));
        // [] es "truthy" en JS: sin este length > 0, un cliente nuevo (sin
        // carrito guardado en BD) siempre pisaba el carrito de invitado con
        // uno vacio, perdiendo los productos que ya habia agregado al
        // registrarse o iniciar sesion.
        if (client.cart && (client.cart as CartItem[]).length > 0) {
          setCart(client.cart as CartItem[]);
        }
      }
    }
  }, [currentUserId, clients.length]);

  // Solo el carrito se auto-guarda en cada cambio (HU-15). Los datos del
  // perfil (nombre/telefono/direccion/fecha) YA NO se mandan aqui en cada
  // tecla: "Mi Perfil" tiene su propio botón "Guardar Cambios"/"Descartar",
  // y antes esos botones eran decorativos (solo mostraban un toast, nunca
  // llamaban a la API) mientras este efecto guardaba en silencio de todas
  // formas -- confuso, y sin manejo de errores si la llamada fallaba.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (currentUserId && currentUserId !== 'guest') {
       updateClient(currentUserId, { cart }).catch(() => {
         // Fallo de red guardando el carrito: no interrumpe la compra: al
         // volver a cambiar el carrito se reintenta guardar solo.
       });
    } else {
       localStorage.setItem('olio_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUserId || currentUserId === 'guest') return;
    setIsSavingProfile(true);
    try {
      await updateClient(currentUserId, {
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        birthday: userProfile.birthday,
        address: userProfile.address,
      });
      showToast('success', 'Tus datos personales se guardaron correctamente.', 'Perfil Actualizado');
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : 'No se pudo guardar tu perfil.';
      showToast('danger', mensaje, 'No se Guardó el Perfil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDiscardProfile = () => {
    const client = clients.find(c => c.id === currentUserId);
    if (client) {
      setUserProfile(prev => ({
        ...prev,
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        birthday: client.birthday || '',
      }));
    }
    showToast('info', 'No se guardó ninguna modificación.', 'Cambios Descartados');
  };

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle'|'processing'|'success'|'error'>('idle');
  const [simulationStep, setSimulationStep] = useState<string>('');
  const [gatewayStep, setGatewayStep] = useState<GatewayStep>('idle');
  const [gatewayReference, setGatewayReference] = useState('');

  const showToast = (type: ToastData['type'] = 'cart', message: string, title?: string) => {
    setToastMessage({ type, message, title });
  };

  // Estado del Modal de Personalización (HU-08)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customRemoved, setCustomRemoved] = useState<ProductComponent[]>([]);
  const [customExtras, setCustomExtras] = useState<SyncedIngredient[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [digitalBank, setDigitalBank] = useState<'nequi' | 'daviplata' | 'bancolombia'>('nequi');
  const [paymentPhone, setPaymentPhone] = useState('');

  // Tarifa plana de envío (HU-10)
  const FLAT_SHIPPING_RATE = storeConfig.shippingRate;

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas salir de tu cuenta en Hamburguer Copiway?',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Permanecer',
      type: 'info',
      onConfirm: () => {
        api.post('/auth/logout').catch(() => {});
        showToast('warning', 'Cerraste sesión de tu cuenta.', 'Sesión Finalizada');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        // HU-15: Limpieza de seguridad al cerrar sesión
        localStorage.removeItem('olio_cart');
        irA('/login');
      }
    });
  };

  // -- Utilidades Financieras y de Cumpleaños --
  const getTodayMD = () => {
    const d = new Date();
    return `${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  // HU-04: Descuento de cumpleaños
  const isBirthday = userProfile.birthday && userProfile.birthday.slice(5, 10) === getTodayMD();

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.finalPrice * (item.quantity || 1)), 0);
  const birthdayDiscount = isBirthday ? cartSubtotal * 0.15 : 0; // 15% de descuento

  // Canje de puntos: solo sobre los productos (no el domicilio) y desde el mínimo
  // configurado en Ajustes. Es una vista previa: el servidor lo recalcula al pagar.
  const [usePoints, setUsePoints] = useState(false);
  const pointValue = storeConfig.pointValue ?? 10;
  const minPointsToRedeem = storeConfig.minPointsToRedeem ?? 100;
  const availablePoints = userProfile.points || 0;
  const canRedeemPoints = pointValue > 0 && availablePoints > 0 && availablePoints >= minPointsToRedeem;
  const redeemPoints = usePoints && canRedeemPoints;
  // Lo máximo que se puede usar: los puntos que tiene, sin pasarse del valor de los productos
  const maxPointsToUse = canRedeemPoints
    ? Math.max(0, Math.min(availablePoints, Math.floor((cartSubtotal - birthdayDiscount) / pointValue)))
    : 0;
  // Cuántos puntos escribió el cliente (al marcar la casilla empieza con el máximo)
  const [pointsToUseInput, setPointsToUseInput] = useState('');
  const pointsRedeemed = redeemPoints
    ? Math.max(0, Math.min(maxPointsToUse, parseInt(pointsToUseInput, 10) || 0))
    : 0;
  const pointsDiscount = pointsRedeemed * pointValue;

  const cartTotal = cartSubtotal - birthdayDiscount - pointsDiscount + (cart.length > 0 ? FLAT_SHIPPING_RATE : 0);

  // -- Manejadores --
  const openCustomizer = (product: Product) => {
    setSelectedProduct(product);
    setCustomRemoved([]);
    setCustomExtras([]);
  };

  const addToCartFromCatalog = () => {
    if (!selectedProduct) return;
    const finalPrice = selectedProduct.price + customExtras.reduce((s, e) => s + (e.price || 2000), 0);
    
    if (editingCartItemId) {
      setCart(cart.map(c => c.id === editingCartItemId ? {
        ...c,
        product: selectedProduct,
        name: selectedProduct.name,
        basePrice: selectedProduct.price,
        finalPrice,
        removed: customRemoved,
        extras: customExtras
      } : c));
      setEditingCartItemId(null);
    } else {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        isCustom: false,
        product: selectedProduct,
        name: selectedProduct.name,
        basePrice: selectedProduct.price,
        finalPrice,
        quantity: 1,
        removed: customRemoved,
        extras: customExtras
      };
      setCart([...cart, newItem]);
    }
    
    setSelectedProduct(null);
    setCustomRemoved([]);
    setCustomExtras([]);
    showToast('cart', editingCartItemId ? `${selectedProduct.name} actualizado en el carrito` : `${selectedProduct.name} añadido al carrito`, 'Carrito Copiway');
  };

  // HU-09: Modificar carrito antes de procesar cobro (Punto de no retorno)
  const handleCheckoutSubmit = () => {
    if (paymentMethod === 'online' && !paymentPhone) {
      showToast('warning', 'Ingresa un número de cuenta o celular para procesar el pago digital.', 'Datos Incompletos');
      return;
    }
    
    if (!isStoreOpen) {
      showToast('danger', 'El local se encuentra cerrado en este momento. Transacción pausada.', 'Horario de Atención');
      setIsCheckingOut(false);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: paymentMethod === 'online' ? 'Confirmar Pago y Envío a Cocina' : 'Confirmar Pedido en Efectivo',
      message: `¿Confirmar tu pedido por ${formatCOP(cartTotal)}? Al confirmarse, pasará directamente a preparación en cocina y entrará en el punto de no retorno (no se admiten cancelaciones ni modificaciones).`,
      confirmText: paymentMethod === 'online' ? 'Sí, pagar y enviar' : 'Sí, confirmar pedido',
      cancelText: 'Revisar pedido',
      type: 'warning',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        processPayment();
      }
    });
  };

  const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processPayment = async () => {
    setPaymentStatus('processing');

    if (paymentMethod === 'online') {
      await payWithGateway();
    } else {
      setTimeout(() => { void submitOrder(); }, 1000);
    }
  };

  const failPayment = (message: string, title: string) => {
    setPaymentStatus('error');
    setSimulationStep(message);
    setGatewayStep('idle');
    showToast('danger', message, title);
    setTimeout(() => { setPaymentStatus('idle'); setSimulationStep(''); }, 2500);
  };

  /**
   * Pago digital contra la pasarela de PRUEBA (misma mecanica que Wompi):
   * el servidor emite referencia + firma, se crea la transaccion, se espera a que
   * deje de estar PENDING y el pedido solo se crea si el servidor la verifica APPROVED.
   */
  const payWithGateway = async () => {
    const bankName = digitalBank === 'nequi' ? 'Nequi' : digitalBank === 'daviplata' ? 'Daviplata' : 'Bancolombia';
    setGatewayReference('');
    setGatewayStep('connecting');
    setSimulationStep('Conectando con ' + bankName + '...');

    try {
      const datos = await prepareOnlinePayment({ items: [...cart] as unknown as Order['items'], address: userProfile.address || '' }, pointsRedeemed);
      setGatewayReference(datos.reference);
      await esperar(900);

      const creada = await crearTransaccion(datos, digitalBank, paymentPhone);
      setGatewayStep('waiting');
      setSimulationStep('Esperando aprobación en tu celular...');

      const tx = await esperarResultado(creada.id);
      setGatewayStep('verifying');
      setSimulationStep('Verificando transacción...');
      await esperar(900);

      if (tx.status !== 'APPROVED') {
        setGatewayStep('declined');
        setSimulationStep(tx.status === 'ERROR' ? 'Error al procesar el pago. Intenta de nuevo.' : 'El pago fue rechazado. Intenta de nuevo.');
        setPaymentStatus('error');
        showToast('danger', tx.status === 'ERROR' ? 'La pasarela reportó un error al procesar el pago.' : 'El pago fue rechazado por el banco. Intenta de nuevo.', 'Pago no procesado');
        setTimeout(() => { setPaymentStatus('idle'); setSimulationStep(''); setGatewayStep('idle'); }, 3000);
        return;
      }

      setGatewayStep('approved');
      setSimulationStep('¡Pago aprobado exitosamente!');
      await esperar(900);
      await submitOrder(tx.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo completar el pago. Intenta de nuevo.';
      failPayment(message, 'Pago no procesado');
    }
  };

  /** Crea el pedido en el servidor (que re-verifica el pago digital) y limpia el checkout. */
  const submitOrder = async (paymentTransactionId?: string) => {
    const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newOrder = {
      id: '#ORD-' + Math.floor(1000 + Math.random() * 9000),
      client: userProfile.name,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: cartSubtotal,
      discount: birthdayDiscount,
      pointsRedeemed,
      pointsDiscount,
      shipping: FLAT_SHIPPING_RATE,
      total: cartTotal,
      status: 'Pendiente' as const, // Global Store status
      paymentMethod: paymentMethod,
      digitalBank: paymentMethod === 'online' ? digitalBank : null,
      paymentStatus: paymentMethod === 'online' ? 'Pagado' : 'Pendiente Efectivo',
      paymentTransactionId,
      address: userProfile.address || 'Dirección Cliente Predeterminada',
      clientPhone: userProfile.phone,
      deliveryPin
    };

    try {
      await addOrder(newOrder as unknown as Order, pointsRedeemed);
    } catch (err) {
      // El servidor rechazó el pedido (tienda cerrada, sin stock, pago no
      // confirmado, etc.) — se muestra el motivo real en vez de fingir éxito.
      const message = err instanceof ApiError ? err.message : 'No se pudo procesar tu pedido. Intenta de nuevo.';
      failPayment(message, 'Pedido no procesado');
      return;
    }

    if (paymentMethod === 'online') setGatewayStep('approved');
    setPaymentStatus('success');
    // Los puntos de fidelidad los acredita el servidor al ENTREGAR el pedido.
    showToast('success', '¡Pedido confirmado! Tu orden ha sido enviada a cocina.', 'Copiway - Pedido Recibido');

    // Bloqueo y envío a cocina
    setTimeout(() => {
      setCart([]);
      setUsePoints(false);
      setPointsToUseInput('');
      setIsCheckingOut(false);
      setPaymentStatus('idle');
      setSimulationStep('');
      setGatewayStep('idle');
      setActiveTab('activeOrders');
    }, 2000);
  };

  const formatOrderDate = (order: Order) => {
    const d = new Date(String(order.date || '').replace(' ', 'T'));
    if (isNaN(d.getTime())) return order.date || '';
    const day = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
    return `${day} · ${time}`;
  };

  // RF-08: Recompra en 1 clic con comprobación exhaustiva de stock
  const reorder = (order: Order) => {
    if (!order || !order.items || order.items.length === 0) {
      showToast('warning', 'No se encontraron artículos en la orden previa.', 'Recompra');
      return;
    }

    // Estado de cada artículo frente al sistema actual: descontinuado (ya no se vende),
    // con faltantes (ingredientes agotados, se puede pedir bajo aviso) o disponible.
    type ItemStatus = { discontinued: boolean; missing: string[] };
    const statuses: ItemStatus[] = order.items.map((item) => {
      const missing: string[] = [];
      if (item.isCustom) {
        for (const ing of item.stack || item.extras || []) {
          const invMatch = inventory.find(i =>
            i.id === ing.id ||
            (i.name && ing.name && i.name.trim().toLowerCase() === ing.name.trim().toLowerCase())
          );
          if (invMatch && invMatch.stock <= 0) missing.push(ing.name || 'Ingrediente');
        }
        return { discontinued: false, missing };
      }
      const catProduct = catalog.find(p => p.id === (item.productId || item.id) || p.name.toLowerCase() === (item.name || '').toLowerCase());
      if (!catProduct || catProduct.active === false) return { discontinued: true, missing };
      const removedNames = (item.removed || []).map((r) => ((r.name || r) as string).toLowerCase());
      for (const baseIng of catProduct.ingredients || []) {
        const ingName = (typeof baseIng === 'string' ? baseIng : baseIng.name || '');
        if (removedNames.includes(ingName.toLowerCase())) continue;
        const invMatch = inventory.find(i => (i.name || '').toLowerCase() === ingName.toLowerCase());
        if (invMatch && invMatch.stock <= 0) missing.push(invMatch.name);
      }
      for (const ex of item.extras || []) {
        const invMatch = inventory.find(i => i.id === ex.id || (i.name || '').toLowerCase() === (ex.name || '').toLowerCase());
        if (invMatch && invMatch.stock <= 0) missing.push(invMatch.name);
      }
      return { discontinued: false, missing };
    });

    // Precio vigente de cada artículo: los cambios de precio del catálogo o de los
    // ingredientes se reflejan; los extras conservan el valor con que se pidieron.
    const oldUnit = (item: Order['items'][number]) => Number(item.finalPrice) || Number(item.price) || Number(item.basePrice) || 0;
    const newUnits: number[] = order.items.map((item) => {
      const prev = oldUnit(item);
      if (item.isCustom) {
        const stack = item.stack || item.extras || [];
        if (stack.length === 0) return prev;
        let sum = 0;
        for (const ing of stack) {
          const cur = syncedIngredients.find(si => si.id === ing.id || (si.name || '').toLowerCase() === (ing.name || '').toLowerCase());
          if (!cur) return prev;
          sum += cur.price || 0;
        }
        return sum;
      }
      const cat = catalog.find(p => p.id === (item.productId || item.id) || p.name.toLowerCase() === (item.name || '').toLowerCase());
      if (!cat || item.basePrice === undefined) return prev;
      return prev + (cat.price - Number(item.basePrice));
    });
    const oldShipping = Number(order.shipping) || 0;
    const shippingChanged = order.shipping !== undefined && oldShipping !== FLAT_SHIPPING_RATE;
    const priceChanged = order.items.some((it, i) => statuses[i] && !statuses[i].discontinued && newUnits[i] !== oldUnit(it));

    const orderableCount = statuses.filter(st => !st.discontinued).length;
    if (orderableCount === 0) {
      showToast('warning', 'Los productos de tu último pedido ya no están disponibles en el menú.', 'Producto descontinuado');
      return;
    }
    const hasShortage = statuses.some(st => !st.discontinued && st.missing.length > 0);
    const hasDiscontinued = statuses.some(st => st.discontinued);
    const hasWarnings = hasShortage || hasDiscontinued || priceChanged || shippingChanged;

    setConfirmModal({
      isOpen: true,
      title: 'Repetir Pedido Anterior',
      message: hasWarnings
        ? `El pedido ${orderCode(order.id)} ya no es igual al de la última vez (agotados, precios o domicilio). Revisa los detalles; puedes pedirlo de todas formas.`
        : `¿Deseas duplicar los ${order.items.length} artículos del pedido ${orderCode(order.id)} y añadirlos a tu carrito actual?`,
      details: (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{formatOrderDate(order)}</p>
          {order.items.map((item, idx) => {
            const qty = item.quantity || 1;
            const unit = Number(item.finalPrice) || Number(item.price) || Number(item.basePrice) || 0;
            const nameOf = (r: NamedRef | string) => (typeof r === 'string' ? r : r?.name) || '';
            const layers = (item.stack || item.extras || []).map(nameOf).filter(Boolean);
            const removed = (item.removed || []).map(nameOf).filter(Boolean);
            const catProduct = catalog.find(p => p.id === (item.productId || item.id) || p.name.toLowerCase() === (item.name || '').toLowerCase());
            const image = item.product?.image || catProduct?.image;
            const recipe = (catProduct?.ingredients || item.product?.ingredients || [])
              .map(ing => (typeof ing === 'string' ? ing : ing.name || ''))
              .filter(n => n && !removed.some(r => r.toLowerCase() === n.toLowerCase()));
            const esArmadaDesdeCero = item.name === 'Hamburguesa Personalizada';
            const extras = esArmadaDesdeCero ? [] : (item.extras || []).map(nameOf).filter(Boolean);
            const mods = item.modifications || [];
            return (
              <div key={idx} className="rounded-2xl bg-gray-50 dark:bg-stone-900/60 border border-gray-100 dark:border-stone-800 overflow-hidden">
                {image ? (
                  <img src={image} alt={item.name} className="w-full h-36 object-cover" />
                ) : esArmadaDesdeCero && layers.length > 0 ? (
                  <div className="w-full h-36 flex items-center justify-center bg-white dark:bg-stone-950/40">
                    <CustomBurgerThumb ingredientNames={layers} size={96} className="!rounded-2xl" />
                  </div>
                ) : null}
                <div className="p-3 space-y-2">
                  {statuses[idx]?.discontinued && (
                    <p className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Este producto ya no se vende. No se agregará al carrito.</p>
                  )}
                  {!statuses[idx]?.discontinued && (statuses[idx]?.missing.length ?? 0) > 0 && (
                    <p className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Agotado por ahora: {statuses[idx].missing.join(', ')}</p>
                  )}
                  <div className="flex justify-between gap-3">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{qty}x {item.name || 'Producto'}</p>
                    <p className="font-black text-sm text-brand-orange whitespace-nowrap text-right">
                      {!statuses[idx]?.discontinued && newUnits[idx] !== oldUnit(item) && (
                        <span className="block text-[11px] font-semibold text-gray-400 line-through">{formatCOP(unit * qty)}</span>
                      )}
                      {formatCOP((statuses[idx]?.discontinued ? unit : newUnits[idx]) * qty)}
                    </p>
                  </div>
                  {esArmadaDesdeCero && layers.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Armada con</p>
                      <div className="flex flex-wrap gap-1.5">
                        {layers.map((n, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[11px] font-semibold pr-2 rounded-lg bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 text-gray-700 dark:text-stone-200">
                            <IngredientThumb name={n} size={20} className="!rounded-md !border-0" />{n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {recipe.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lleva</p>
                      <p className="text-xs text-gray-600 dark:text-stone-400">{recipe.join(', ')}</p>
                    </div>
                  )}
                  {(removed.length > 0 || extras.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {removed.map((n, i) => (
                        <span key={`r${i}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/40">✕ SIN {n}</span>
                      ))}
                      {extras.map((n, i) => (
                        <span key={`e${i}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">+ EXTRA {n}</span>
                      ))}
                    </div>
                  )}
                  {mods.length > 0 && <p className="text-xs text-gray-500 dark:text-stone-400">{mods.join(' · ')}</p>}
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-gray-100 dark:border-stone-800 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Domicilio</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {shippingChanged && <span className="text-[11px] font-semibold text-gray-400 line-through mr-2">{formatCOP(oldShipping)}</span>}
                {formatCOP(FLAT_SHIPPING_RATE)}
              </span>
            </div>
            {shippingChanged && (
              <p className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                La tarifa de domicilio cambió {FLAT_SHIPPING_RATE > oldShipping ? 'y ahora es mayor' : 'y ahora es menor'} que la de tu último pedido.
              </p>
            )}
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Total de ese pedido</span>
              <span className="font-bold text-gray-500">{formatCOP(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Total hoy</span>
              <span className="font-black text-brand-orange">
                {formatCOP(order.items.reduce((acc, it, i) => acc + (statuses[i].discontinued ? 0 : newUnits[i] * (it.quantity || 1)), 0) + FLAT_SHIPPING_RATE)}
              </span>
            </div>
          </div>
        </div>
      ),
      confirmText: hasWarnings ? 'Pedir de todas formas' : 'Sí, agregar al carrito',
      cancelText: 'Cancelar',
      type: hasWarnings ? 'warning' : 'info',
      onConfirm: () => {
        // Clonación de la orden histórica al carrito actual con precios actualizados
        const clonedItems = order.items.filter((_, idx) => !statuses[idx].discontinued).map((i) => ({
          ...i,
          id: Math.random().toString(36).substr(2, 9),
          finalPrice: newUnits[order.items.indexOf(i)] || oldUnit(i)
        }));
        setCart([...cart, ...clonedItems] as CartItem[]);
        showToast('cart', '¡Pedido duplicado y listo en tu carrito!', 'Recompra en 1-Clic');
        setActiveTab('cart');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // HU-14: Calificar orden

  // El aviso de "tu pedido llego" ahora es una notificacion push real del
  // sistema operativo (ver PedidoService::confirmarEntrega en el backend),
  // no un banner dentro de la app. Al tocar esa notificacion, el Service
  // Worker abre la app con ?calificarPedido=<id> en la URL; esto la lee una
  // sola vez al montar y abre el modal de reseña directamente.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idPedidoACalificar = params.get('calificarPedido');
    if (idPedidoACalificar) {
      setReviewingOrderId(idPedidoACalificar);
      params.delete('calificarPedido');
      const query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
    }
  }, []);

  // Activa (o reactiva en silencio) las notificaciones push del navegador.
  useEffect(() => {
    if (!pushDisponible()) return;

    if (Notification.permission === 'granted') {
      sincronizarSuscripcionPush();
    } else if (Notification.permission === 'default' && !localStorage.getItem('push_prompt_dismissed')) {
      setShowPushPrompt(true);
    }
  }, []);

  const handleActivarPush = async () => {
    const resultado = await activarNotificacionesPush();
    setShowPushPrompt(false);
    if (resultado === 'granted') {
      showToast('success', 'Te avisaremos apenas tu pedido llegue.', 'Notificaciones Activadas');
    } else if (resultado === 'denied') {
      localStorage.setItem('push_prompt_dismissed', 'true');
    }
  };

  const handleDismissPushPrompt = () => {
    setShowPushPrompt(false);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };


  const handleReviewSubmit = () => {
    if (reviewingOrderId && reviewRating > 0) {
      updateOrder(reviewingOrderId, { rating: reviewRating, reviewText });
      setReviewingOrderId(null);
      setReviewRating(0);
      setReviewText('');
      showToast('success', '¡Muchas gracias! Tu reseña y calificación han sido enviadas.', 'Reseña Registrada');
    }
  };


  return (
    <>
      {/* Aviso para activar notificaciones push reales (no es la notificacion
          de pedido entregado en si -- esa la manda el sistema operativo). */}
      <AnimatePresence>
        {showPushPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-[#151515] p-4 rounded-2xl shadow-2xl border-2 border-brand-orange w-[90%] max-w-md"
          >
            <div className="flex items-center gap-4">
              <div className="bg-brand-orange/20 p-2 rounded-full shrink-0">
                <Bell className="w-6 h-6 text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white">Activa las notificaciones</p>
                <p className="text-sm text-gray-500 dark:text-stone-400">Te avisamos apenas tu pedido llegue, aunque no tengas la app abierta.</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleActivarPush}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-orange text-white hover:bg-[#e66500] transition-colors"
                  >
                    Activar
                  </button>
                  <button
                    onClick={handleDismissPushPrompt}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissPushPrompt}
                className="text-gray-400 hover:text-gray-600 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Reseña */}
      <AnimatePresence>
        {reviewingOrderId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#151515] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative"
            >
              <button
                onClick={() => { setReviewingOrderId(null); setReviewRating(0); setReviewText(''); }}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-gray-500 dark:text-stone-400 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pt-9 pb-6 px-8 text-center bg-gradient-to-b from-brand-orange/10 to-transparent">
                <div className="w-16 h-16 rounded-3xl bg-brand-orange text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-orange/30">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-black text-2xl text-gray-900 dark:text-white">Califica tu Experiencia</h3>
                <p className="text-sm text-gray-500 dark:text-stone-400 mt-1">Tu opinión nos ayuda a mejorar cada pedido.</p>
              </div>

              <div className="px-8 pb-8">
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      onClick={() => setReviewRating(star)}
                      className="hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${(reviewHoverRating || reviewRating) >= star ? 'text-brand-orange fill-current' : 'text-gray-300 dark:text-stone-600'}`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs font-bold uppercase tracking-wider mb-6 h-4 text-brand-orange">
                  {{1:'Malo', 2:'Regular', 3:'Bueno', 4:'Muy Bueno', 5:'¡Excelente!'}[reviewHoverRating || reviewRating] || ''}
                </p>

                <label className="block text-xs font-bold text-gray-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  Reseña (opcional)
                </label>
                <textarea
                  placeholder="Ej. ¡La hamburguesa estaba deliciosa!"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-stone-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white h-24 mb-6 resize-none focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => { setReviewingOrderId(null); setReviewRating(0); setReviewText(''); }}
                    className="flex-1 px-4 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 dark:bg-stone-800 dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewRating === 0}
                    className="flex-1 px-4 py-3.5 rounded-2xl font-bold text-white bg-brand-orange hover:bg-[#e66500] shadow-md shadow-brand-orange/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Modal de Detalles del Pedido */}
      <AnimatePresence>
        {(() => {
          // selectedOrderInfo es una copia tomada al momento del clic; el
          // polling de SyncDatos sigue refrescando `orders` cada 2.5s (p.ej.
          // cuando un domiciliario acepta el pedido), pero esa copia congelada
          // nunca se enteraba, así que el modal mostraba "sin asignar" aunque ya
          // hubiera repartidor. Se resuelve siempre contra el pedido vivo.
          const liveOrder = selectedOrderInfo ? orders.find(o => o.id === selectedOrderInfo.id) || selectedOrderInfo : null;
          return liveOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrderInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#18181b] w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl border border-gray-100 dark:border-stone-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-stone-800 flex items-center justify-between bg-gray-50/50 dark:bg-stone-900/40 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalles del Pedido</h3>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-brand-orange text-white">
                        {orderCode(liveOrder.id)}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedOrderInfo(null)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-gray-500 dark:text-stone-400 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Estado y fecha */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange">
                    {liveOrder.status === 'En Preparación' ? <ChefHat className="w-3.5 h-3.5" /> : liveOrder.status === 'En Camino' ? <Truck className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                    {liveOrder.status === 'Pagado' ? 'Recibido' : liveOrder.status}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-stone-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {liveOrder.date ? new Date(liveOrder.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                {/* Dirección de entrega */}
                {liveOrder.address && (
                  <div className="bg-gray-50 dark:bg-stone-900/60 p-4 rounded-2xl border border-gray-100 dark:border-stone-800/80 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Dirección de Entrega</span>
                      <p className="text-sm font-semibold text-gray-800 dark:text-stone-200 truncate">{liveOrder.address}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-stone-900/60 p-4 rounded-2xl border border-gray-100 dark:border-stone-800/80">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Repartidor</span>
                  {liveOrder.status === 'En Camino' || liveOrder.status === 'Entregado' ? (
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(liveOrder.driverName || 'RA').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{liveOrder.driverName || 'Repartidor Asignado'}</p>
                        <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">{liveOrder.driverVehicle || 'Motocicleta'}{liveOrder.driverPlate ? ` • ${liveOrder.driverPlate}` : ''}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-stone-800 text-gray-400 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-stone-400">Aún no se ha asignado un repartidor.</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Productos ({liveOrder.items.length})
                  </h4>
                  <div className="space-y-2.5">
                    {liveOrder.items.map((item, idx: number) => {
                      const extras = (item.extras || []).map(e => e.name);
                      const removed = (item.removed || []).map(r => r.name);
                      // Los items que vienen del backend (pedidos ya creados) no
                      // traen el objeto `product` embebido, solo `productId` -- hay
                      // que resolver la imagen contra el catálogo cargado. OJO:
                      // `isCustom` aquí significa "tuvo extras/removidos", no "no
                      // tiene producto base" (p.ej. "Street Food sin cebolla" sigue
                      // teniendo productId real), así que no debe filtrar la búsqueda.
                      const catProduct = catalog.find(p => p.id === (item.productId || item.id) || p.name.toLowerCase() === (item.name || '').toLowerCase());
                      const itemImage = item.product?.image || catProduct?.image;
                      return (
                        <div key={item.id || idx} className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-gray-100 dark:border-stone-800 shadow-sm flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-stone-800 overflow-hidden shrink-0 relative">
                            {itemImage ? (
                              <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
                            ) : extras.length > 0 ? (
                              <CustomBurgerThumb ingredientNames={extras} size={44} className="!rounded-none border-0" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag className="w-4 h-4 opacity-50" />
                              </div>
                            )}
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand-orange text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-stone-900">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                            {(extras.length > 0 || removed.length > 0) && (
                              <p className="text-[11px] text-gray-500 dark:text-stone-400 truncate mt-0.5">
                                {extras.length > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{extras.join(', ')}</span>}
                                {extras.length > 0 && removed.length > 0 && ' · '}
                                {removed.length > 0 && <span className="text-red-500 dark:text-red-400">sin {removed.join(', ')}</span>}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm shrink-0">{formatCOP(item.finalPrice)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-stone-900/60 p-4 rounded-2xl border border-gray-100 dark:border-stone-800/80 space-y-2.5">
                  {typeof liveOrder.subtotal === 'number' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-stone-400 font-medium">Subtotal</span>
                      <span className="font-bold text-gray-700 dark:text-stone-300">{formatCOP(liveOrder.subtotal)}</span>
                    </div>
                  )}
                  {typeof liveOrder.shipping === 'number' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-stone-400 font-medium flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> Envío
                      </span>
                      <span className="font-bold text-gray-700 dark:text-stone-300">{formatCOP(liveOrder.shipping)}</span>
                    </div>
                  )}
                  {!!liveOrder.discount && liveOrder.discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> Descuento
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCOP(liveOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm pt-2.5 border-t border-dashed border-gray-200 dark:border-stone-700">
                    <span className="text-gray-500 dark:text-stone-400 font-medium flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" /> Método de Pago
                    </span>
                    <span className="font-bold text-gray-800 dark:text-stone-200">
                      {liveOrder.paymentMethod === 'cash'
                        ? 'Efectivo'
                        : liveOrder.digitalBank === 'nequi' ? 'Nequi'
                        : liveOrder.digitalBank === 'daviplata' ? 'Daviplata'
                        : liveOrder.digitalBank === 'bancolombia' ? 'Bancolombia'
                        : 'Digital'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-stone-400 font-medium">Estado de Pago</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{liveOrder.paymentMethod === 'cash' ? 'Pago al Entregar' : 'Pagado'}</span>
                  </div>
                  <div className="pt-2.5 mt-1 border-t border-dashed border-gray-200 dark:border-stone-700 flex justify-between items-center text-lg font-black text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-brand-orange">{formatCOP(liveOrder.total)}</span>
                  </div>
                </div>

                {liveOrder.deliveryPin && liveOrder.status !== 'Entregado' && (
                  <div className="bg-gradient-to-br from-brand-orange/15 to-orange-500/5 p-4 rounded-2xl border border-dashed border-brand-orange/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider block">PIN de Entrega</span>
                      <p className="text-xl font-black text-brand-orange tracking-[0.2em] leading-tight">{liveOrder.deliveryPin}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-stone-400 text-right max-w-[140px]">Entrégalo al repartidor para confirmar la entrega.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50/50 dark:bg-stone-950 text-gray-900 dark:text-gray-100 font-sans flex transition-colors duration-300">
      {/* Barra Lateral (Sidebar) */}
      <aside className="w-[280px] bg-white dark:bg-[#151515] border-r border-gray-100 dark:border-stone-800 flex-col hidden md:flex shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-300 h-screen sticky top-0">
        <div className="h-24 flex items-center px-8 gap-3 mb-2 shrink-0 border-b border-gray-50 dark:border-stone-800/50">
          <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-[22px] tracking-tight text-gray-900 dark:text-white leading-none">Copiway<span className="text-brand-orange">PRO</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-w-0">
          <NavItem key="catalog" id="catalog" icon={Utensils} label="Explorar Menú" active={activeTab} set={setActiveTab} />
          <NavItem key="builder" id="builder" icon={Plus} label="Creador Interactivo" active={activeTab} set={setActiveTab} />
          <NavItem key="cart" id="cart" icon={ShoppingCart} label="Carrito de Pedidos" active={activeTab} set={setActiveTab} badge={cart.length} />
          <NavItem key="activeOrders" id="activeOrders" icon={CheckCircle2} label="Órdenes Activas" active={activeTab} set={setActiveTab} badge={activeOrders.length} />
          <NavItem key="history" id="history" icon={RotateCcw} label="Historial y Recompras" active={activeTab} set={setActiveTab} />
          <NavItem key="profile" id="profile" icon={Settings} label="Mi Perfil" active={activeTab} set={setActiveTab} />
        </nav>

        <div className="p-6 border-t border-gray-100 dark:border-stone-800 mt-auto shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-4 w-full font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-3 rounded-[16px] transition-colors text-sm">
            <LogOut className="w-6 h-6 shrink-0" />
            <span className="leading-tight text-left">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-50/50 dark:bg-stone-950 pb-20 md:pb-0 min-w-0">
        <header className="h-[70px] md:h-24 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl flex items-center justify-between gap-3 px-4 sm:px-6 md:px-10 shrink-0 sticky top-0 z-50 transition-colors duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="md:hidden w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-orange-50 dark:bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                <seccionActual.icono className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-gray-900 dark:text-white truncate">{seccionActual.titulo}</h1>
                <p className="text-xs font-medium text-gray-500 dark:text-stone-400 truncate">{seccionActual.frase}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Estado del local: solo se muestra (abrir o cerrar lo hace el administrador en Ajustes) */}
            <div
              title={isStoreOpen ? 'Estamos recibiendo pedidos' : 'En este momento no recibimos pedidos'}
              className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 md:pr-4 rounded-full border bg-white dark:bg-[#151515] shadow-sm ${
                isStoreOpen ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-rose-200 dark:border-rose-900/50'
              }`}
            >
              <span className={`relative w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${
                isStoreOpen ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}>
                <ChefHat className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  {isStoreOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border-2 border-white dark:border-[#151515] ${isStoreOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
              </span>
              <span className="flex flex-col leading-tight">
                <span className={`text-xs font-black ${isStoreOpen ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {isStoreOpen ? 'Cocina Abierta' : 'Cocina Cerrada'}
                </span>
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-stone-400">
                  <Clock className="w-3 h-3" />
                  {isStoreOpen ? `Hoy ${storeConfig.openTime || '11:00'} - ${storeConfig.closeTime || '23:00'}` : `Abre a las ${storeConfig.openTime || '11:00'}`}
                </span>
              </span>
            </div>

            {/* Mi perfil: iniciales, nombre y puntos (lleva a "Mi Perfil") */}
            <button
              onClick={() => setActiveTab('profile')}
              title="Mi Perfil"
              className={`hidden md:flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full border transition-colors cursor-pointer ${activeTab === 'profile' ? 'border-brand-orange bg-orange-50 dark:bg-brand-orange/10' : 'border-gray-200 dark:border-stone-800 bg-white dark:bg-[#151515] hover:border-brand-orange/40'}`}
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-orange-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                {(userProfile.name || '?').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-xs font-bold text-gray-900 dark:text-white max-w-[120px] truncate">{(userProfile.name || 'Cliente').split(' ')[0]}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-brand-orange">
                  <Gift className="w-3 h-3" /> {userProfile.points || 0} pts
                </span>
              </span>
            </button>

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} title="Notificaciones" className={`w-10 h-10 md:w-11 md:h-11 relative flex items-center justify-center rounded-full border transition-colors cursor-pointer ${showNotifications ? 'border-brand-orange bg-orange-50 dark:bg-brand-orange/10 text-brand-orange' : 'border-gray-200 dark:border-stone-800 bg-white dark:bg-[#151515] text-gray-600 dark:text-stone-300 hover:border-brand-orange/40 hover:text-brand-orange'}`}>
                <Bell className="w-5 h-5" />
                {userProfile.notifications?.some(n => !n.read) && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-orange text-white text-[10px] font-black rounded-full border-2 border-white dark:border-[#0c0a09] flex items-center justify-center">
                    {userProfile.notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-[320px] sm:w-[380px] bg-white dark:bg-[#151515] rounded-[24px] shadow-2xl border border-gray-100 dark:border-stone-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-stone-800 flex justify-between items-center bg-gray-50/50 dark:bg-stone-900/50">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                        {userProfile.notifications?.some(n => !n.read) && (
                          <button 
                            onClick={() => {
                              const updated = userProfile.notifications?.map(n => ({ ...n, read: true })) || [];
                              setUserProfile({ ...userProfile, notifications: updated });
                            }}
                            className="text-[11px] font-bold text-brand-orange hover:text-brand-orange/80 uppercase tracking-wide"
                          >
                            Marcar todo leído
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2">
                        {(!userProfile.notifications || userProfile.notifications.length === 0) ? (
                          <div className="p-8 text-center flex flex-col items-center justify-center">
                            <Bell className="w-8 h-8 text-gray-300 dark:text-stone-700 mb-3" />
                            <p className="text-sm text-gray-500 dark:text-stone-400 font-medium">No tienes notificaciones</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {userProfile.notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(notif => (
                              <div 
                                key={notif.id} 
                                onClick={() => {
                                  if (!notif.read) {
                                    const updated = userProfile.notifications?.map(n => n.id === notif.id ? { ...n, read: true } : n) || [];
                                    setUserProfile({ ...userProfile, notifications: updated });
                                  }
                                }}
                                className={`p-3 rounded-2xl cursor-pointer transition-colors flex gap-3 ${notif.read ? 'hover:bg-gray-50 dark:hover:bg-stone-900/50' : 'bg-brand-orange/5 dark:bg-brand-orange/10 hover:bg-brand-orange/10 dark:hover:bg-brand-orange/20'}`}
                              >
                                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${notif.read ? 'bg-gray-100 dark:bg-stone-800 text-gray-500' : 'bg-brand-orange/20 text-brand-orange'}`}>
                                  {notif.type === 'promo' ? <Gift className="w-5 h-5" /> : notif.type === 'order' ? <Truck className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                </div>
                                <div>
                                  <p className={`text-sm ${notif.read ? 'text-gray-700 dark:text-stone-300' : 'font-bold text-gray-900 dark:text-white'}`}>{notif.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5 leading-snug">{notif.message}</p>
                                  <p className="text-[10px] text-gray-400 mt-1.5">{new Date(notif.date).toLocaleDateString()} {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full border border-gray-200 dark:border-stone-800 bg-white dark:bg-[#151515] text-gray-600 dark:text-stone-300 hover:border-brand-orange/40 hover:text-brand-orange transition-colors cursor-pointer">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 min-w-0 ${activeTab === 'builder' ? 'lg:overflow-hidden lg:py-6' : ''}`}>
          <div className={`max-w-[1600px] mx-auto w-full ${activeTab === 'builder' ? 'lg:h-full' : ''}`}>
            {activeTab === 'catalog' && (
              <CatalogSection
                catalog={catalog}
                orderHistory={orderHistory}
                inventory={inventory}
                storeConfig={storeConfig}
                catalogCategory={catalogCategory}
                setCatalogCategory={setCatalogCategory}
                openCustomizer={openCustomizer}
                reorder={reorder}
                clientName={userProfile.name || ''}
                points={availablePoints}
                activeOrdersCount={activeOrders.length}
                isStoreOpen={isStoreOpen}
                goToTab={setActiveTab}
              />
            )}
            {activeTab === 'builder' && (
              <BuilderSection
                builderStack={builderStack}
                setBuilderStack={setBuilderStack}
                syncedIngredients={syncedIngredients}
                cart={cart}
                setCart={setCart}
                editingCartItemId={editingCartItemId}
                setEditingCartItemId={setEditingCartItemId}
                setActiveTab={setActiveTab}
                showToast={showToast}
              />
            )}
            {activeTab === 'cart' && (
              <CartSection
                cart={cart}
                setCart={setCart}
                products={products}
                storeConfig={storeConfig}
                isStoreOpen={isStoreOpen}
                isCheckingOut={isCheckingOut}
                isBirthday={isBirthday}
                cartSubtotal={cartSubtotal}
                birthdayDiscount={birthdayDiscount}
                cartTotal={cartTotal}
                FLAT_SHIPPING_RATE={FLAT_SHIPPING_RATE}
                setActiveTab={setActiveTab}
                setEditingCartItemId={setEditingCartItemId}
                setBuilderStack={setBuilderStack}
                setSelectedProduct={setSelectedProduct}
                setCustomRemoved={setCustomRemoved}
                setCustomExtras={setCustomExtras}
                setConfirmModal={setConfirmModal}
                showToast={showToast}
              />
            )}
            {activeTab === 'checkout' && (
              <CheckoutSection
                setActiveTab={setActiveTab}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                cart={cart}
                cartSubtotal={cartSubtotal}
                FLAT_SHIPPING_RATE={FLAT_SHIPPING_RATE}
                isBirthday={isBirthday}
                birthdayDiscount={birthdayDiscount}
                cartTotal={cartTotal}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                digitalBank={digitalBank}
                setDigitalBank={setDigitalBank}
                paymentPhone={paymentPhone}
                setPaymentPhone={setPaymentPhone}
                paymentStatus={paymentStatus}
                isStoreOpen={isStoreOpen}
                storeConfig={storeConfig}
                handleCheckoutSubmit={handleCheckoutSubmit}
                simulationStep={simulationStep}
                pointsRedemption={{
                  available: availablePoints,
                  minimum: minPointsToRedeem,
                  pointValue,
                  canRedeem: canRedeemPoints,
                  use: redeemPoints,
                  setUse: (use: boolean) => { setUsePoints(use); setPointsToUseInput(use ? String(maxPointsToUse) : ''); },
                  maximum: maxPointsToUse,
                  amount: pointsToUseInput,
                  setAmount: setPointsToUseInput,
                  redeemed: pointsRedeemed,
                  discount: pointsDiscount,
                }}
              />
            )}
            {activeTab === 'activeOrders' && (
              <ActiveOrdersSection
                activeOrders={activeOrders}
                setSelectedOrderInfo={setSelectedOrderInfo}
                setActiveTab={setActiveTab}
                catalog={catalog}
              />
            )}
            {activeTab === 'history' && (
              <HistorySection
                orders={orders}
                userProfile={userProfile}
                historySearch={historySearch}
                setHistorySearch={setHistorySearch}
                historyFilter={historyFilter}
                setHistoryFilter={setHistoryFilter}
                setActiveTab={setActiveTab}
                reviewingOrderId={reviewingOrderId}
                setReviewingOrderId={setReviewingOrderId}
                reviewRating={reviewRating}
                setReviewRating={setReviewRating}
                reviewHoverRating={reviewHoverRating}
                setReviewHoverRating={setReviewHoverRating}
                reviewText={reviewText}
                setReviewText={setReviewText}
                reviewTags={reviewTags}
                setReviewTags={setReviewTags}
                updateOrder={updateOrder}
                showToast={showToast}
                reorder={reorder}
                viewingReceiptOrder={viewingReceiptOrder}
                setViewingReceiptOrder={setViewingReceiptOrder}
                storeConfig={storeConfig}
                catalog={catalog}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileSection
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                setShowCalendar={setShowCalendar}
                setShowPasswordModal={setShowPasswordModal}
                handleLogout={handleLogout}
                onSaveProfile={handleSaveProfile}
                onDiscardProfile={handleDiscardProfile}
                isSavingProfile={isSavingProfile}
              />
            )}
          </div>
        </div>
      </main>

      {paymentMethod === 'online' && (
        <PaymentGatewayModal
          step={gatewayStep}
          bank={digitalBank}
          phone={paymentPhone}
          amount={cartTotal}
          reference={gatewayReference}
        />
      )}

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 flex items-center justify-around z-[100] px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe">
        <MobileNavItem id="catalog" icon={Utensils} active={activeTab} set={setActiveTab} label="Menú" />
        <MobileNavItem id="builder" icon={Plus} active={activeTab} set={setActiveTab} label="Crear" />
        <MobileNavItem id="cart" icon={ShoppingCart} active={activeTab} set={setActiveTab} badge={cart.length} label="Carrito" />
        <MobileNavItem id="activeOrders" icon={CheckCircle2} active={activeTab} set={setActiveTab} badge={activeOrders.length} label="Pedidos" />
        <MobileNavItem id="profile" icon={Settings} active={activeTab} set={setActiveTab} label="Perfil" />
      </div>


      {/* HU-13: Toast Overlay */}
      <ToastNotification toast={toastMessage} onClose={() => setToastMessage(null)} />

      {/* HU-08: Modal de Exclusión/Adición Interactiva */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} onClick={e => e.stopPropagation()} className="relative bg-white dark:bg-[#151515] rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 dark:border-stone-800 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 dark:border-stone-800 flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-stone-800/20 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-200 dark:border-stone-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-black text-xl text-gray-900 dark:text-white truncate">{selectedProduct.name}</h3>
                    <p className="text-sm font-bold text-brand-orange mt-0.5">{formatCOP(selectedProduct.price)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-stone-800 flex items-center justify-center transition-colors bg-black/5 dark:bg-white/5 cursor-pointer"><X className="w-5 h-5"/></button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto flex-1">
                {/* HU-08.1: Exclusión (SIN) */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shrink-0">
                      <Minus className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Retirar Ingredientes</h4>
                  </div>
                  {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedProduct.ingredients.map((ing) => {
                        const isRemoved = customRemoved.find(r => r.id === ing.id);
                        return (
                          <div key={ing.id} className="flex items-center justify-between p-3.5 border border-gray-100 dark:border-stone-800 rounded-2xl bg-gray-50/60 dark:bg-stone-900/40">
                            <span className={`flex items-center gap-3 font-semibold text-sm ${isRemoved ? 'line-through text-gray-400' : 'text-gray-700 dark:text-stone-300'}`}>
                              <IngredientThumb name={ing.name} image={syncedIngredients.find(si => si.id === ing.id)?.image} size={40} className={isRemoved ? 'grayscale opacity-60' : ''} />
                              {ing.name}
                            </span>
                            <button
                              onClick={() => {
                                if (isRemoved) setCustomRemoved(customRemoved.filter(r => r.id !== ing.id));
                                else setCustomRemoved([...customRemoved, ing]);
                              }}
                              className={`px-3.5 py-1.5 text-xs rounded-xl font-bold transition-colors cursor-pointer ${isRemoved ? 'bg-gray-200 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-300 dark:hover:bg-stone-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
                            >
                              {isRemoved ? 'Revertir' : 'Quitar (Sin)'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50/60 dark:bg-stone-900/40 rounded-2xl border border-gray-100 dark:border-stone-800 text-sm font-medium text-gray-500">Este producto base no tiene restricciones.</div>
                  )}
                </div>

                {/* HU-08.2: Adición (EXTRA) sincronizada con inventario -- cualquier
                    ingrediente del catálogo que no forme ya parte de la receta base
                    del producto puede añadirse como extra. Antes se filtraba por un
                    nombre de categoría fijo en minúscula ('carnes', 'lacteos'...)
                    que nunca coincidía con las categorías reales tal como las
                    escribe el admin en Inventario ("Carnes & Proteínas", "Quesos &
                    Lácteos"...), así que la lista de extras siempre salía vacía. */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Añadir Extras</h4>
                  </div>
                  {syncedIngredients.filter(i => !selectedProduct.ingredients?.some(base => base.id === i.id)).length > 0 ? (
                    <div className="space-y-2.5">
                      {syncedIngredients.filter(i => !selectedProduct.ingredients?.some(base => base.id === i.id)).map(extra => {
                        const isAdded = customExtras.find(e => e.id === extra.id);
                        const isOutOfStock = extra.stock !== undefined && extra.stock <= 0;
                        return (
                          <div key={extra.id} className={`flex items-center justify-between p-3.5 border border-gray-100 dark:border-stone-800 rounded-2xl bg-gray-50/60 dark:bg-stone-900/40 ${isOutOfStock ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <IngredientThumb name={extra.name} image={extra.image} size={48} />
                              <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-gray-800 dark:text-stone-200">{extra.name}</p>
                                {isOutOfStock && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">AGOTADO</span>
                                )}
                              </div>
                              <p className="text-sm font-black text-brand-orange mt-0.5">+{formatCOP(extra.price)}</p>
                              </div>
                            </div>
                            <button
                              disabled={isOutOfStock && !isAdded}
                              onClick={() => {
                                if (isAdded) setCustomExtras(customExtras.filter(e => e.id !== extra.id));
                                else setCustomExtras([...customExtras, extra]);
                              }}
                              className={`px-3.5 py-1.5 text-xs rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${isAdded ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100'}`}
                            >
                              {isAdded ? 'Quitar' : isOutOfStock ? 'Agotado' : 'Añadir Extra'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50/60 dark:bg-stone-900/40 rounded-2xl border border-gray-100 dark:border-stone-800 text-sm font-medium text-gray-500">No hay extras disponibles en inventario actualmente.</div>
                  )}
                </div>

              </div>

              <div className="p-6 border-t border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-[#151515] shrink-0">
                <button
                  onClick={addToCartFromCatalog}
                  className="w-full bg-brand-orange text-white py-4 rounded-[20px] font-black text-lg hover:bg-[#e66500] flex justify-between px-8 shadow-xl shadow-brand-orange/20 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>{editingCartItemId ? 'Actualizar Pedido' : 'Confirmar Selección'}</span>
                  <span>{formatCOP(selectedProduct.price + customExtras.reduce((s, e) => s + (e.price || 2000), 0))}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cambio de Contraseña */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => { setShowPasswordModal(false); resetPasswordModalFields(); }} className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative bg-white dark:bg-[#151515] rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-stone-800">
              {/* Encabezado */}
              <div className="p-6 md:px-8 border-b border-gray-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-gradient-to-br from-brand-orange/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-brand-orange flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">Cambiar Contraseña</h3>
                    <p className="text-xs text-gray-500 dark:text-stone-400">{modoClave === 'actual' ? 'Escribe tu contraseña actual y elige una nueva.' : 'Escribe el código que te llegó y elige una nueva.'}</p>
                  </div>
                </div>
                <button onClick={() => { setShowPasswordModal(false); resetPasswordModalFields(); }} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 transition-colors cursor-pointer shrink-0"><X className="w-5 h-5"/></button>
              </div>

              {/* Campos */}
              <div className="p-6 md:px-8 space-y-5">
                {modoClave === 'actual' ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-stone-300 mb-2">Contraseña Actual</label>
                    <div className="relative">
                      <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${errorClaveActual ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPasswordInput}
                        onChange={e => { setCurrentPasswordInput(e.target.value); setErrorClaveActual(''); }}
                        placeholder="••••••••"
                        className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border text-sm font-medium outline-none focus:ring-2 transition-all text-gray-900 dark:text-white ${errorClaveActual ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 focus:ring-red-200' : 'border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-900 focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 focus:ring-brand-orange/20'}`}
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors cursor-pointer">
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errorClaveActual && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mt-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {errorClaveActual}
                      </p>
                    )}
                    <button type="button" onClick={() => setMostrarAyudaClave(!mostrarAyudaClave)} className="text-xs font-bold text-brand-orange hover:underline mt-2 cursor-pointer">
                      ¿No recuerdas tu contraseña actual?
                    </button>

                    {/* Opciones para recuperarla */}
                    {mostrarAyudaClave && (
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={enviarCodigoClave}
                          disabled={enviandoCodigo}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-stone-700 hover:border-brand-orange hover:bg-orange-50/50 dark:hover:bg-brand-orange/10 transition-colors text-left cursor-pointer disabled:opacity-50"
                        >
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-brand-orange flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{enviandoCodigo ? 'Enviando código...' : 'Recibir un código en mi correo'}</p>
                            <p className="text-xs text-gray-500 dark:text-stone-400 truncate">{correoCuenta() || 'Tu cuenta no tiene correo'}</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-brand-orange/10 border border-brand-orange/20 mb-4">
                      <Mail className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-700 dark:text-stone-300">
                        Te enviamos un código de 6 dígitos a <strong>{correoCuenta()}</strong>. Vence en 15 minutos.
                      </p>
                    </div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-stone-300 mb-2">Código de Verificación</label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={codigoInput}
                        onChange={e => setCodigoInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-900 text-lg font-black tracking-[0.4em] outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 focus:ring-2 focus:ring-brand-orange/20 transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <button type="button" onClick={() => { setModoClave('actual'); setCodigoInput(''); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-stone-800 text-xs font-bold text-gray-600 dark:text-stone-300 hover:bg-orange-50 hover:text-brand-orange dark:hover:bg-brand-orange/10 transition-colors cursor-pointer">
                        <ArrowLeft className="w-3.5 h-3.5" /> Usar mi contraseña actual
                      </button>
                      <button type="button" onClick={enviarCodigoClave} disabled={enviandoCodigo} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-brand-orange/10 text-xs font-bold text-brand-orange hover:bg-orange-100 dark:hover:bg-brand-orange/20 transition-colors cursor-pointer disabled:opacity-50">
                        <RotateCcw className={`w-3.5 h-3.5 ${enviandoCodigo ? 'animate-spin' : ''}`} /> {enviandoCodigo ? 'Enviando...' : 'Reenviar código'}
                      </button>
                    </div>
                  </div>
                )}

                {[
                  { titulo: 'Nueva Contraseña', valor: newPasswordInput, cambiar: setNewPasswordInput, ver: showNewPassword, setVer: setShowNewPassword },
                  { titulo: 'Confirmar Nueva Contraseña', valor: confirmNewPasswordInput, cambiar: setConfirmNewPasswordInput, ver: showConfirmNewPassword, setVer: setShowConfirmNewPassword },
                ].map(c => (
                  <div key={c.titulo}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-stone-300 mb-2">{c.titulo}</label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={c.ver ? 'text' : 'password'}
                        value={c.valor}
                        onChange={e => c.cambiar(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-900 text-sm font-medium outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 focus:ring-2 focus:ring-brand-orange/20 transition-all text-gray-900 dark:text-white"
                      />
                      <button type="button" onClick={() => c.setVer(!c.ver)} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors cursor-pointer">
                        {c.ver ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Requisitos: se ponen en verde mientras se escribe */}
                <div className="rounded-2xl bg-gray-50 dark:bg-stone-900/60 border border-gray-100 dark:border-stone-800 p-4 space-y-2">
                  {[
                    { texto: 'Mínimo 8 caracteres', cumple: newPasswordInput.length >= 8 },
                    { texto: 'Las contraseñas nuevas coinciden', cumple: newPasswordInput !== '' && newPasswordInput === confirmNewPasswordInput },
                  ].map(r => (
                    <div key={r.texto} className={`flex items-center gap-2 text-xs font-semibold transition-colors ${r.cumple ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-stone-400'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${r.cumple ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-stone-700 text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      {r.texto}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="p-6 md:px-8 border-t border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-stone-900/50 flex gap-3">
                <button onClick={() => { setShowPasswordModal(false); resetPasswordModalFields(); }} className="flex-1 py-3.5 rounded-full font-bold text-gray-700 dark:text-white bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors min-w-0 cursor-pointer">Cancelar</button>
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || (modoClave === 'actual' ? !currentPasswordInput : codigoInput.length !== 6) || !newPasswordInput || !confirmNewPasswordInput}
                  className="flex-1 py-3.5 rounded-full font-bold text-white bg-brand-orange hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20 min-w-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  {isChangingPassword ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CalendarModal isOpen={showCalendar} onClose={() => setShowCalendar(false)} selectedDate={userProfile.birthday} onSelectDate={(date) => setUserProfile({...userProfile, birthday: date})} />
      
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
    </>
  );
}

interface NavItemProps {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: string;
  set: (id: string) => void;
  badge?: number;
}

function NavItem({ id, icon: Icon, label, active, set, badge }: NavItemProps) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => set(id)}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-[16px] transition-all font-bold text-[14px] ${isActive ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' : 'text-gray-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-900 hover:text-gray-900 dark:hover:text-white'}`}
    >
      <div className="flex items-center gap-4">
        <Icon className={`w-[22px] h-[22px] shrink-0 ${isActive ? 'text-white' : 'text-gray-400 dark:text-stone-500'}`} />
        <span className="text-left leading-tight whitespace-pre-line">{label}</span>
      </div>
      {badge > 0 && (
        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black shrink-0 ${isActive ? 'bg-white text-brand-orange' : 'bg-brand-orange text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileNavItem({ id, icon: Icon, active, set, badge, label }: NavItemProps) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => set(id)}
      className={`relative flex flex-col items-center justify-center min-w-[64px] h-full transition-all ${isActive ? 'text-brand-orange' : 'text-gray-400 dark:text-stone-500'}`}
    >
      <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-orange/10 scale-110' : ''}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-[10px] font-bold mt-1 transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-70 scale-95'}`}>{label}</span>
      {badge > 0 && (
        <span className="absolute top-2 right-3 w-4 h-4 flex items-center justify-center rounded-full bg-brand-orange text-white text-[9px] font-black shadow-sm ring-2 ring-white dark:ring-[#0c0a09]">
          {badge}
        </span>
      )}
    </button>
  );
}
