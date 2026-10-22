import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  PieChart as PieChartIcon, LayoutDashboard, Utensils, Users, Settings, LogOut, 
  Mail, Sun, Moon, Plus, Minus, Maximize2, Minimize2, Edit2, Trash2, Eye, EyeOff, 
  TrendingUp, Bell, Package, Check, CheckCircle2, X, MapPin, Printer, Calculator, Menu, Search, MoreVertical, BookOpen, Layers, TriangleAlert, Wallet, PlusCircle, UserPlus, IdCard, Download, Filter, ChefHat, Wine, ChevronLeft, ChevronRight, User, ShoppingBag, Clock, ChevronDown,
  Phone, MessageCircle, Link2, Send, Lock, Shield, KeyRound, Copy, Share2, Sparkles, Activity, Flame, Star, Award, DollarSign, Truck, ArrowRight, AlertCircle, Box
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { formatCOP, vehicleWithModel, modificacionesDe, agruparPorNombre } from '../lib/format';

import { useStore, DEFAULT_MENU_CATEGORIES, Product, ProductComponent, Order, OrderItem, Staff, Client, NamedRef } from '../store/almacenAplicacion';
import { api, ApiError, irA } from '../servicios/api';
import { CustomSelect } from '../components/CustomSelect';
import { TimePickerModal } from '../components/TimePickerModal';
import { generateCierrePDF } from '../utils/generarCierrePdf';
import { CustomBurgerThumb } from './client/ingredientArt';
import { ToastNotification, ToastData } from '../components/ToastNotification';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { soundFx } from '../utils/audio';
import { abrirWhatsApp, mensajeLinkPago, mensajeConfirmacionEfectivo, urlLinkPago } from '../utils/mensajesWhatsApp';
import OverviewSection from './admin/OverviewSection';
import MapSection from './admin/MapSection';
import MenuSection from './admin/MenuSection';
import InventorySection from './admin/InventorySection';
import StaffSection from './admin/StaffSection';
import OrdersSection from './admin/OrdersSection';
import ClientsSection from './admin/ClientsSection';
import SettingsSection from './admin/SettingsSection';



export const RoutePolyline = ({ origin, destination, outerColor, innerColor, onRouteLoaded }: { origin: [number, number], destination: [number, number], outerColor: string, innerColor: string, onRouteLoaded?: (coords: [number, number][]) => void }) => {
  const [positions, setPositions] = React.useState<[number, number][]>([]);

  React.useEffect(() => {
    // Fetch route from OSRM (Open Source Routing Machine)
    fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setPositions(coords);
          if (onRouteLoaded) onRouteLoaded(coords);
        }
      })
      .catch(err => console.error("Error fetching route:", err));
  }, [origin[0], origin[1], destination[0], destination[1]]);

  if (!positions.length) return null;

  return (
    <>
      {/* Outer Border */}
      <Polyline positions={positions} pathOptions={{ color: outerColor, weight: 8, lineCap: 'round', lineJoin: 'round', opacity: 1 }} />
      {/* Inner Line */}
      <Polyline positions={positions} pathOptions={{ color: innerColor, weight: 4, lineCap: 'round', lineJoin: 'round', opacity: 1 }} />
    </>
  );
};


export const CustomZoomControl = () => {
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


export interface DriverMockOrder {
  id: string;
  client: string;
  address: string;
  status: string;
  items: string[];
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  raw?: Order;
}

export interface DriverMockInfo {
  name: string;
  status: string;
  phone: string;
  plate: string;
  vehicle: string;
  orders: DriverMockOrder[];
}

interface ManualCustomIngredient extends ProductComponent {
  price?: number;
}

interface ManualOrderItem {
  id: string;
  product: Product;
  name: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  removed: ManualCustomIngredient[];
  extras: ManualCustomIngredient[];
}

interface CashClosingReport {
  date: string;
  totalVentas: number;
  totalOrdenes: number;
  activeOrdersCount: number;
  desglose: { efectivo: number; digital: number };
  insumosConsumidos: Array<{ name: string; used: number; unit?: string; cost?: number }>;
  costoInsumos?: number;
  costoDomicilios?: number;
  ventasProducto?: number;
  gananciaBruta?: number;
  margen?: number;
  driverLiquidations: Array<{ driverName: string; ordersCount: number; cashCollected: number; baseCash: number; totalDue: number }>;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
}

interface CierreData {
  date: string;
  totalVentas: number;
  totalOrdenes: number;
  activeOrdersCount: number;
  desglose: { efectivo: number; digital: number };
  insumosConsumidos: Array<{ name: string; used: number; unit?: string; cost?: number }>;
  costoInsumos: number;
  costoDomicilios: number;
  ventasProducto: number;
  gananciaBruta: number;
  margen: number;
  liquidaciones: Array<{ driverName: string; ordersCount: number; cashCollected: number; base: number; totalDue: number }>;
}

export const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-stone-800 p-3 rounded-[12px] shadow-lg">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="font-black text-brand-orange">
          {formatCOP(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('overview');
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  const handleNavigateToOrders = (orderId?: string) => {
    setActiveTab('orders');
    if (orderId) {
      setHighlightedOrderId(orderId);
      // Wait for tab switch & render to complete
      setTimeout(() => {
        const targetElement = document.getElementById(`order-card-${orderId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (mainContentRef.current) {
          mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);

      // Auto-clear highlight after 4 seconds
      setTimeout(() => {
        setHighlightedOrderId((current) => (current === orderId ? null : current));
      }, 4000);
    } else {
      // When clicking "Ver todas", start view from the very top
      setTimeout(() => {
        if (mainContentRef.current) {
          mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [selectedDriverInfo, setSelectedDriverInfo] = useState<DriverMockInfo | null>(null);
  const [selectedStaffInfo, setSelectedStaffInfo] = useState<Staff | null>(null);
  const [selectedClientInfo, setSelectedClientInfo] = useState<Client | null>(null);
  const [staffEditData, setStaffEditData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    pin: "",
    role: "Ayudante de cocina",
    plate: "",
    vehicle: "moto",
    vehicleModel: "",
    active: true,
    baseCash: 0 as number | ''
  });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [copiedStaffCreds, setCopiedStaffCreds] = useState(false);
  const [staffModalReadOnly, setStaffModalReadOnly] = useState(false);

  const handleOpenStaffModal = (emp: Staff, readOnly: boolean = false) => {
    setSelectedStaffInfo(emp);
    setStaffModalReadOnly(readOnly);
    setStaffEditData({
      name: emp.name || "",
      phone: emp.phone || "",
      email: emp.email || "",
      password: emp.password || "",
      pin: "",
      role: emp.role || "Ayudante de cocina",
      plate: emp.plate || "",
      vehicle: emp.vehicle || "moto",
      vehicleModel: emp.vehicleModel || "",
      active: emp.active !== false,
      baseCash: emp.baseCash || 0
    });
    setShowStaffPassword(false);
    setCopiedStaffCreds(false);
  };

  // Sonido de alerta (HU-20)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showOrderAlert, setShowOrderAlert] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'open' | 'close' | null>(null);

  // Estados Globales (Datos simulados)
  const { 
    products, addProduct, updateProduct, deleteProduct,
    inventory, addInventoryItem, updateInventoryItem, updateInventoryStock, deleteInventoryItem,
    inventoryLogs,
    staff, addStaff, updateStaff, deleteStaff,
    orders, addManualOrder, updateOrderAddress, updateOrderStatus, setOrders, ordersSynced,
    clients, addClient, updateClient, deleteClient,
    storeConfig, updateStoreConfig,
    addCategory, removeCategory
  } = useStore();

  
  const [salesFilter, setSalesFilter] = useState('Esta semana');

  // Lunes de la semana que contiene `d` (semana inicia en lunes).
  const inicioDeSemana = (d: Date) => {
    const date = new Date(d);
    const dia = date.getDay(); // 0=Dom .. 6=Sab
    const diff = dia === 0 ? -6 : 1 - dia;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  /** Suma ventas reales (orders) día por día, empezando en `inicio` (inclusive). */
  const ventasPorDia = (inicio: Date) => {
    return DIAS_SEMANA.map((label, i) => {
      const diaInicio = new Date(inicio);
      diaInicio.setDate(diaInicio.getDate() + i);
      const diaFin = new Date(diaInicio);
      diaFin.setDate(diaFin.getDate() + 1);
      const pedidosDelDia = orders.filter(o => {
        const fecha = new Date(o.date);
        return fecha >= diaInicio && fecha < diaFin;
      });
      const amount = pedidosDelDia.reduce((sum, o) => sum + (o.total || 0), 0);
      return { date: label, amount, orderCount: pedidosDelDia.length };
    });
  };

  /** Suma ventas reales agrupadas por semana dentro del mes que empieza en `inicioMes`. */
  const ventasPorSemanaDelMes = (inicioMes: Date) => {
    const finMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0, 23, 59, 59, 999);
    const semanas: { date: string; amount: number; orderCount: number }[] = [];
    let cursor = new Date(inicioMes);
    let numero = 1;
    while (cursor <= finMes) {
      const semanaInicio = new Date(cursor);
      const semanaFin = new Date(cursor);
      semanaFin.setDate(semanaFin.getDate() + 7);
      if (semanaFin > finMes) semanaFin.setTime(finMes.getTime() + 1);
      const pedidosDeLaSemana = orders.filter(o => {
        const fecha = new Date(o.date);
        return fecha >= semanaInicio && fecha < semanaFin;
      });
      semanas.push({
        date: `Semana ${numero}`,
        amount: pedidosDeLaSemana.reduce((sum, o) => sum + (o.total || 0), 0),
        orderCount: pedidosDeLaSemana.length,
      });
      cursor.setDate(cursor.getDate() + 7);
      numero++;
    }
    return semanas;
  };

  const getSalesData = () => {
    const ahora = new Date();
    const inicioSemanaActual = inicioDeSemana(ahora);

    switch (salesFilter) {
      case 'Esta semana':
        return ventasPorDia(inicioSemanaActual);
      case 'Semana pasada': {
        const inicio = new Date(inicioSemanaActual);
        inicio.setDate(inicio.getDate() - 7);
        return ventasPorDia(inicio);
      }
      case 'Este mes':
        return ventasPorSemanaDelMes(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
      case 'Hace un mes':
        return ventasPorSemanaDelMes(new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1));
      default:
        return [];
    }
  };

  const salesData = getSalesData();
  const periodOrdersCount = salesData.reduce((sum, d) => sum + (d.orderCount || 0), 0);


  // Ajustes

  // Real-time automatic store status calculation
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const checkIsStoreOpen = () => {
    if (storeConfig.isOpen === false) return false;
    
    const now = currentTime;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const [openHours, openMinutes] = (storeConfig.openTime || '11:00').split(':').map(Number);
    const openTotalMinutes = openHours * 60 + openMinutes;

    const [closeHours, closeMinutes] = (storeConfig.closeTime || '23:00').split(':').map(Number);
    const closeTotalMinutes = closeHours * 60 + closeMinutes;

    if (closeTotalMinutes < openTotalMinutes) {
      return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
    } else {
      return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
    }
  };

  const isStoreAutomaticallyOpen = checkIsStoreOpen();

  // States from tabs
  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    price: string;
    image: string;
    category: string;
    badge: string;
    active: boolean;
    ingredients: ProductComponent[];
    packaging: ProductComponent[];
  }>({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Hamburguesas',
    badge: '',
    active: true,
    ingredients: [],
    packaging: []
  });
  const [tempIngredientName, setTempIngredientName] = useState('');
  const [tempPackagingName, setTempPackagingName] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('Todas');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isInlineAddingCategory, setIsInlineAddingCategory] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    stock: '',
    totalCost: '',
    unitCost: '',
    unit: 'Unidades',
    category: 'General',
    supplier: '',
    notes: ''
  });
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Ayudante de cocina', email: '', password: '', phone: '', plate: '', vehicle: 'moto', vehicleModel: '', pin: '', baseCash: 0 as number | '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualOrderClient, setManualOrderClient] = useState({ name: '', address: '', phone: '' });
  const [manualOrderChannel, setManualOrderChannel] = useState<'llamada' | 'whatsapp'>('llamada');
  const [manualOrderSaving, setManualOrderSaving] = useState(false);
  const [manualOrderItems, setManualOrderItems] = useState<ManualOrderItem[]>([]);
  const [manualSelectedProduct, setManualSelectedProduct] = useState<Product | null>(null);
  const [manualCustomRemoved, setManualCustomRemoved] = useState<ManualCustomIngredient[]>([]);
  const [manualCustomExtras, setManualCustomExtras] = useState<ManualCustomIngredient[]>([]);
  const [manualQuantity, setManualQuantity] = useState<number | ''>(1);
  // Pedido manual: 'datos' = formulario, 'catalogo' = elegir productos, 'listo' = pedido creado (enviar por WhatsApp)
  const [manualView, setManualView] = useState<'datos' | 'catalogo' | 'listo'>('datos');
  const [manualPaymentMode, setManualPaymentMode] = useState<'efectivo' | 'link'>('efectivo');
  const [manualCreatedOrder, setManualCreatedOrder] = useState<Order | null>(null);
  const [manualCopied, setManualCopied] = useState<'link' | 'mensaje' | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [manualCategory, setManualCategory] = useState('Todas');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [editingAddressOrder, setEditingAddressOrder] = useState<Order | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [showAddressSuccess, setShowAddressSuccess] = useState(false);
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (type: ToastData['type'] = 'success', message: string, title?: string) => {
    setToastData({ type, message, title });
  };

  const handleUpdateAddress = async () => {
    if (editingAddressOrder && newAddress.trim()) {
      // Se guarda en el servidor: el domiciliario ve la nueva dirección en su próxima sincronización.
      try {
        await updateOrderAddress(editingAddressOrder.id, newAddress.trim());
      } catch (err) {
        showToast('danger', err instanceof ApiError ? err.message : 'No se pudo cambiar la dirección.', 'Dirección no Modificada');
        return;
      }
      setEditingAddressOrder(null);
      setNewAddress('');
      setShowAddressSuccess(true);
      showToast('info', 'La dirección de entrega fue actualizada correctamente.', 'Dirección Modificada');
      setTimeout(() => setShowAddressSuccess(false), 3000);
    }
  };

  const [showCierre, setShowCierre] = useState(false);
  const [cierreData, setCierreData] = useState<CierreData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [inventoryHistorySearch, setInventoryHistorySearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffStatusFilter, setStaffStatusFilter] = useState('all');
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const staffItemsPerPage = 10;
  const [customerSearch, setCustomerSearch] = useState('');
  const [shippingRateInput, setShippingRateInput] = useState(storeConfig?.shippingRate?.toString() || '5000');
  const [profitMarginInput, setProfitMarginInput] = useState(storeConfig?.profitMargin !== undefined ? storeConfig.profitMargin.toString() : '30');
  
  useEffect(() => {
    if (storeConfig) {
      if (storeConfig.shippingRate !== undefined) {
        setShippingRateInput(storeConfig.shippingRate.toString());
      }
      if (storeConfig.profitMargin !== undefined) {
        setProfitMarginInput(storeConfig.profitMargin.toString());
      }
    }
  }, [storeConfig?.shippingRate, storeConfig?.profitMargin]);

  // Tecla Escape para salir de cualquier modal o del mapa expandido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMapExpanded(false);
        setEditingAddressOrder(null);
        setViewingOrder(null);
        setSelectedDriverInfo(null);
        setSelectedStaffInfo(null);
        setSelectedClientInfo(null);
        setShowCierre(false);
        setShowPdfPreview(false);
        setShowManualForm(false);
        setShowNotifications(false);
        setIsInventoryModalOpen(false);
        setIsProductModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered Lists
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || (p.description || '').toLowerCase().includes(catalogSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCatalogCategory === 'Todas') return true;

    const pCat = p.category || (
      p.name.toLowerCase().includes('hamburguesa') ? 'Hamburguesas de Pan' :
      p.name.toLowerCase().includes('perro') || p.name.toLowerCase().includes('salchicha') ? 'Perros Calientes' :
      p.name.toLowerCase().includes('salchipapa') ? 'Salchipapas' :
      p.name.toLowerCase().includes('patacón') ? 'Hamburguesas de Patacón' :
      'Otros'
    );
    if (pCat.toLowerCase() === selectedCatalogCategory.toLowerCase()) return true;
    if ((selectedCatalogCategory === 'Hamburguesas de Pan' || selectedCatalogCategory === 'Hamburguesas') && pCat.toLowerCase().includes('hamburguesa')) return true;
    return false;
  });
  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase()));
  const filteredStaff = staff.filter(s =>
    (s.name.toLowerCase().includes(staffSearch.toLowerCase()) || s.email.toLowerCase().includes(staffSearch.toLowerCase())) &&
    (staffRoleFilter === 'all' || s.role === staffRoleFilter) &&
    (staffStatusFilter === 'all' || (staffStatusFilter === 'active' ? s.active : !s.active))
  );
  const staffTotalPages = Math.max(1, Math.ceil(filteredStaff.length / staffItemsPerPage));
  const paginatedStaff = filteredStaff.slice((staffCurrentPage - 1) * staffItemsPerPage, staffCurrentPage * staffItemsPerPage);
  const filteredInventoryLogs = inventoryLogs ? inventoryLogs.filter(log => log.itemName.toLowerCase().includes(inventoryHistorySearch.toLowerCase()) || log.reason.toLowerCase().includes(inventoryHistorySearch.toLowerCase())) : [];
  const filteredClients = clients ? clients.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)) : [];

  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const topProductsData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      (o.items || []).forEach((item: OrderItem) => {
        const name = item.product?.name || item.name || 'Producto';
        counts[name] = (counts[name] || 0) + (item.quantity || 1);
      });
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalUnits = entries.reduce((acc, curr) => acc + curr[1], 0);

    const palette = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#6b7280'];
    if (entries.length > 0 && totalUnits > 0) {
      return entries.slice(0, 4).map(([name, count], i) => ({
        name,
        value: Math.round((count / totalUnits) * 100),
        units: count,
        color: palette[i % palette.length]
      }));
    }
    return [];
  }, [orders]);


  const handleGenerarCierre = async () => {
    try {
      // Solo lectura: NO archiva nada todavia. El admin revisa estos numeros
      // y recien al confirmar (confirmarCierre) se persiste de verdad.
      const report = await api.get<CashClosingReport>('/cash-closing/preview');
      const newCierre = {
        date: new Date(report.date).toLocaleDateString('es-CO'),
        totalVentas: report.totalVentas,
        totalOrdenes: report.totalOrdenes,
        activeOrdersCount: report.activeOrdersCount,
        desglose: report.desglose,
        insumosConsumidos: report.insumosConsumidos.map((i) => ({ name: i.name, used: i.used, unit: i.unit, cost: i.cost })),
        costoInsumos: report.costoInsumos ?? 0,
        costoDomicilios: report.costoDomicilios ?? 0,
        ventasProducto: report.ventasProducto ?? report.totalVentas,
        gananciaBruta: report.gananciaBruta ?? report.totalVentas,
        margen: report.margen ?? 0,
        liquidaciones: report.driverLiquidations.map((l) => ({
          driverName: l.driverName,
          ordersCount: l.ordersCount,
          cashCollected: l.cashCollected,
          base: l.baseCash,
          totalDue: l.totalDue
        }))
      };
      setCierreData(newCierre);
      setShowCierre(true);
    } catch (err) {
      showToast('danger', err instanceof ApiError ? err.message : 'No se pudo generar el cierre de caja.', 'Error');
    }
  };

  const descargarPDF = () => {
    if (!cierreData) return;
    try {
      setIsGeneratingPDF(true);
      const { download, blobUrl } = generateCierrePDF(cierreData, orders);
      setPdfPreviewUrl(blobUrl);
      download();
      showToast('cierre', 'Reporte PDF oficial generado y descargado', 'Descarga Completada');
      setTimeout(() => setIsGeneratingPDF(false), 300);
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast('danger', 'Error al generar el documento PDF', 'Error');
      setIsGeneratingPDF(false);
    }
  };

  const handleVerReporte = () => {
    if (!cierreData) return;
    try {
      const { blobUrl } = generateCierrePDF(cierreData, orders);
      setPdfPreviewUrl(blobUrl);
      setShowPdfPreview(true);
      showToast('info', 'Vista previa del informe contable cargada', 'Reporte Contable');
    } catch (error) {
      console.error("Error viewing PDF report:", error);
      showToast('danger', 'Error al abrir la vista previa del informe', 'Error');
    }
  };

  const confirmarCierre = async () => {
    // Este es el paso que realmente persiste: archiva los pedidos del turno,
    // liquida domiciliarios y descuenta insumos. Antes de este commit, ese
    // archivado ya habia ocurrido en handleGenerarCierre (la "vista previa"
    // no era una vista previa real); ahora handleGenerarCierre solo hace un
    // GET de solo lectura, y esta es la unica llamada que muta estado.
    try {
      await api.post('/cash-closing');
      const fresh = await api.get<typeof orders>('/orders');
      setOrders(fresh);
    } catch (err) {
      showToast('danger', err instanceof ApiError ? err.message : 'No se pudo confirmar el cierre de caja.', 'Error');
      return;
    }
    setShowCierre(false);
    showToast('cierre', 'El reporte de cierre de caja fue generado correctamente.', 'Cierre Generado');
  };

  const requestConfirmarCierre = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Cierre de Caja del Día',
      message: cierreData?.activeOrdersCount > 0 
        ? `Advertencia: Tienes ${cierreData.activeOrdersCount} órdenes activas aún sin entregar. Al confirmar el cierre, la caja se consolidará y el sistema se reiniciará para el siguiente turno.`
        : '¿Estás seguro de completar el cierre de caja de hoy? Se consolidarán los ingresos en efectivo y digitales, y se descontarán los insumos consumidos.',
      confirmText: 'Sí, cerrar caja',
      cancelText: 'Revisar detalles',
      type: 'warning',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        confirmarCierre();
      }
    });
  };

  // Real-time tracking of new orders to play chime alert (RF-27)
  const prevAdminOrdersCount = useRef<number | null>(null);

  useEffect(() => {
    // Espera al primer setOrders real del polling (ver SyncDatos): antes
    // de eso `orders` está vacío por el estado inicial del store, y compararlo
    // contra el primer fetch real disparaba la alerta en cada login.
    if (!ordersSynced) return;

    if (prevAdminOrdersCount.current === null) {
      prevAdminOrdersCount.current = orders.length;
      return;
    }

    if (orders.length > prevAdminOrdersCount.current) {
      setShowOrderAlert(true);
      soundFx.playOrderBell();
      setTimeout(() => setShowOrderAlert(false), 5000);
    }
    prevAdminOrdersCount.current = orders.length;
  }, [orders, ordersSynced]);

  // Cleanup hook para eliminar órdenes sin artículos
  useEffect(() => {
    const emptyOrders = orders.filter(o => !o.items || o.items.length === 0);
    emptyOrders.forEach(o => {
      if (useStore.getState().deleteOrder) {
        useStore.getState().deleteOrder(o.id);
      }
    });
  }, [orders]);

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cerrar Sesión de Administrador',
      message: '¿Estás seguro de que deseas salir del panel de administración de Hamburguer Copiway?',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Permanecer',
      type: 'info',
      onConfirm: () => {
        api.post('/auth/logout').catch(() => {});
        showToast('warning', 'Cerraste sesión en el panel de administrador.', 'Sesión Finalizada');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        irA('/login');
      }
    });
  };



  // Vistas (Tabs)

  // HU-23, HU-24, HU-26: Pedidos Manuales y Configuración
  // Extracted manual order logic
  const manualOrderTotal = manualOrderItems.reduce((acc, item) => acc + item.finalPrice, 0);

  // Cada vez que se abre la ventana del pedido manual, empieza en el formulario
  useEffect(() => {
    if (showManualForm) {
      setManualView('datos');
      setManualCreatedOrder(null);
      setManualCopied(null);
      setManualSearch('');
      setManualCategory('Todas');
      setManualSelectedProduct(null);
    }
  }, [showManualForm]);

  const manualProductosActivos = products.filter(p => p.active);
  const manualCategorias = ['Todas', ...Array.from(new Set(manualProductosActivos.map(p => p.category || 'Otros')))];
  const manualProductosFiltrados = manualProductosActivos.filter(p =>
    (manualCategory === 'Todas' || (p.category || 'Otros') === manualCategory) &&
    p.name.toLowerCase().includes(manualSearch.trim().toLowerCase())
  );
  const manualCantidadEnOrden = (productId: string) =>
    manualOrderItems.filter(i => i.product.id === productId).reduce((acc, i) => acc + i.quantity, 0);
  const manualPrecioSeleccion = manualSelectedProduct
    ? (manualSelectedProduct.price + manualCustomExtras.reduce((acc, e) => acc + (e.price || 2000), 0)) * ((manualQuantity as number) || 1)
    : 0;

  const handleAddProductToManualOrder = () => {
    if (!manualSelectedProduct) return;
    const prodName = manualSelectedProduct.name;
    const finalPrice = manualSelectedProduct.price * (manualQuantity as number || 1) + manualCustomExtras.reduce((acc, e) => acc + (e.price || 2000), 0) * (manualQuantity as number || 1);
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      product: manualSelectedProduct,
      name: manualSelectedProduct.name,
      quantity: (manualQuantity as number) || 1,
      basePrice: manualSelectedProduct.price,
      finalPrice,
      removed: manualCustomRemoved,
      extras: manualCustomExtras
    };
    setManualOrderItems([...manualOrderItems, newItem]);
    showToast('cart', `"${prodName}" añadido al pedido manual`, 'Pedido Manual');
    setManualSelectedProduct(null);
    setManualCustomRemoved([]);
    setManualCustomExtras([]);
    setManualQuantity(1);
  };

  const handleCreateManualOrder = async () => {
    if (!manualOrderClient.name.trim() || !manualOrderClient.phone.trim() || !manualOrderClient.address.trim() || manualOrderItems.length === 0) {
      showToast('warning', 'Completa el nombre, el celular y la dirección del cliente.', 'Datos Incompletos');
      return;
    }
    // El servidor recalcula los precios, descuenta el inventario y busca al
    // cliente por su celular (si no está registrado, el pedido queda como invitado).
    setManualOrderSaving(true);
    try {
      const created = await addManualOrder({
        clientName: manualOrderClient.name.trim(),
        clientPhone: manualOrderClient.phone.trim(),
        address: manualOrderClient.address.trim(),
        channel: manualOrderChannel,
        paymentMode: manualPaymentMode,
        // Sin id, el servidor busca el ingrediente por su nombre.
        items: manualOrderItems.map(item => ({
          ...item,
          extras: item.extras.map(e => ({ id: e.id || '', name: e.name })),
          removed: item.removed.map(r => ({ id: r.id || '', name: r.name })),
        })),
      });
      const cuenta = created.isGuest ? 'como cliente invitado' : `en la cuenta de ${created.client}`;
      const destino = created.status === 'Esperando Pago' ? 'esperando el pago por link' : 'enviado a cocina';
      showToast('success', `Pedido manual ${created.id} registrado ${cuenta} y ${destino}.`, 'Pedido Manual');
      // En vez de cerrar, se muestra la vista "listo" para enviarle el mensaje al cliente.
      setManualCreatedOrder(created);
      setManualView('listo');
      setManualOrderClient({ name: '', address: '', phone: '' });
      setManualOrderChannel('llamada');
      setManualPaymentMode('efectivo');
      setManualOrderItems([]);
    } catch (err) {
      showToast('danger', err instanceof ApiError ? err.message : 'No se pudo registrar el pedido manual.', 'Pedido no Registrado');
    } finally {
      setManualOrderSaving(false);
    }
  };

  /** Copia el link de pago o el mensaje completo y lo marca como copiado 2 segundos. */
  const copiarTexto = async (texto: string, cual: 'link' | 'mensaje') => {
    try {
      await navigator.clipboard.writeText(texto);
      setManualCopied(cual);
      setTimeout(() => setManualCopied(null), 2000);
    } catch {
      showToast('danger', 'No se pudo copiar. Selecciona el texto y cópialo a mano.', 'Copiar');
    }
  };

  /** Mensaje de WhatsApp según cómo paga el pedido (link o efectivo). */
  const mensajeDePedido = (order: Order) =>
    order.status === 'Esperando Pago' && order.paymentLinkCode ? mensajeLinkPago(order) : mensajeConfirmacionEfectivo(order);

  const handleViewOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) setViewingOrder(order);
  };

  const navItems = [
    { id: 'overview', label: 'Tablero Analítico', icon: LayoutDashboard },
    { id: 'orders', label: 'Comandas Activas', icon: Utensils },
    { id: 'map', label: 'Rutas & Zonas', icon: MapPin },
    { id: 'menu', label: 'Gestión de Menú', icon: BookOpen },
    { id: 'inventory', label: 'Inventario Express', icon: Package },
    { id: 'staff', label: 'Equipo y Personal', icon: Users },
    { id: 'clients', label: 'Directorio Clientes', icon: User },
    { id: 'settings', label: 'Ajustes y Caja', icon: Settings },
  ];

  // Datos de la barra de arriba
  const seccionActual = navItems.find(n => n.id === activeTab) || navItems[0];
  const pedidosNuevos = orders.filter(o => o.status === 'Pendiente' || o.status === 'Pagado');

  // Convierte la fecha de un pedido en "hace 5 min", "hace 2 h"...
  const haceCuanto = (fecha: string) => {
    const minutos = Math.floor((currentTime.getTime() - new Date(fecha).getTime()) / 60000);
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `hace ${minutos} min`;
    if (minutos < 1440) return `hace ${Math.floor(minutos / 60)} h`;
    return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gray-50/50 dark:bg-stone-950 text-gray-900 dark:text-gray-100 font-sans flex transition-colors duration-300 overflow-hidden relative">
      
      {/* Sidebar Admin */}
      
      {/* Desktop/Tablet Sidebar */}
      <aside className="lg:w-[280px] md:w-[88px] bg-white dark:bg-[#151515] border-r border-gray-100 dark:border-stone-800 flex-col hidden md:flex shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-screen sticky top-0 transition-all duration-300">
        <div className="h-24 flex items-center lg:px-8 md:px-0 md:justify-center lg:justify-start gap-3 mb-2 shrink-0 border-b border-gray-50 dark:border-stone-800/50">
          <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-black text-[22px] tracking-tight text-gray-900 dark:text-white leading-none">Copiway<span className="text-brand-orange">PRO</span></h1>
          </div>
        </div>
        <nav className="flex-1 px-3 lg:px-4 py-4 space-y-2 overflow-y-auto overflow-x-hidden min-w-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`w-full flex items-center justify-center lg:justify-start gap-4 lg:px-5 px-0 py-3 lg:py-3 rounded-[16px] font-bold text-[14px] transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' 
                  : 'text-gray-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-900 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon className="w-[20px] h-[20px] shrink-0" />
              <span className="text-left leading-tight whitespace-nowrap truncate hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 lg:p-6 border-t border-gray-100 dark:border-stone-800 mt-auto shrink-0 flex justify-center lg:justify-start">
          <button onClick={handleLogout} title="Cerrar Sesión" className="flex items-center justify-center lg:justify-start gap-4 w-full lg:w-full font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 p-3 lg:px-4 lg:py-3 rounded-[16px] transition-colors text-sm">
            <LogOut className="w-6 h-6 shrink-0" />
            <span className="leading-tight text-left hidden lg:block">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay & Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden w-full h-[100dvh]"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-[#151515] border-r border-gray-100 dark:border-stone-800 flex flex-col md:hidden shadow-2xl h-[100dvh]"
            >
              <div className="h-24 flex items-center justify-between px-8 mb-2 shrink-0 border-b border-gray-50 dark:border-stone-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-[22px] tracking-tight text-gray-900 dark:text-white leading-none">Copiway<span className="text-brand-orange">PRO</span></h1>
                    </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 text-gray-500">
                    <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-w-0">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-[16px] font-bold text-[14px] transition-all ${
                      activeTab === item.id 
                        ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' 
                        : 'text-gray-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-900 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="w-[20px] h-[20px] shrink-0" />
                    <span className="text-left leading-tight whitespace-nowrap truncate">{item.label}</span>
                  </button>
                ))}
              </nav>
              
              <div className="p-6 border-t border-gray-100 dark:border-stone-800 mt-auto shrink-0">
                <button onClick={handleLogout} className="flex items-center gap-4 w-full font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-3 rounded-[16px] transition-colors text-sm">
                  <LogOut className="w-6 h-6 shrink-0" />
                  <span className="leading-tight text-left">Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>


      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative bg-gray-50/50 dark:bg-stone-950 min-w-0">
        <header className="h-[70px] md:h-24 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl flex items-center justify-between gap-3 px-4 md:px-8 shrink-0 z-10 sticky top-0 transition-colors duration-300">

          {/* Izquierda: botón de menú (móvil) + sección actual + fecha */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-stone-900 text-gray-600 dark:text-stone-300 transition-colors shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange/15 to-orange-500/5 dark:from-brand-orange/20 dark:to-orange-500/5 text-brand-orange items-center justify-center shrink-0 ring-1 ring-inset ring-brand-orange/20">
                <seccionActual.icon className="w-[22px] h-[22px]" />
              </div>
              <div className="min-w-0">
                <p className="hidden md:block text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-stone-500">Panel · <span className="capitalize tracking-normal normal-case">{currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
                <h2 className="font-black text-[17px] md:text-[22px] tracking-tight text-gray-900 dark:text-white leading-tight truncate">{seccionActual.label}</h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Estado de la tienda con su horario */}
            <div className={`hidden xl:flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-2xl border ${
              isStoreAutomaticallyOpen
                ? 'bg-emerald-50/80 border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                : 'bg-gray-50 border-gray-200 dark:bg-stone-900 dark:border-stone-800'
            }`}>
              <span className="relative flex w-2.5 h-2.5">
                {isStoreAutomaticallyOpen && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />}
                <span className={`relative w-2.5 h-2.5 rounded-full ${isStoreAutomaticallyOpen ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-stone-600'}`} />
              </span>
              <div className="leading-tight">
                <p className={`text-xs font-black ${isStoreAutomaticallyOpen ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-stone-300'}`}>
                  {isStoreAutomaticallyOpen ? 'Tienda abierta' : 'Tienda cerrada'}
                </p>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-stone-500">
                  {isStoreAutomaticallyOpen ? `Hasta las ${storeConfig.closeTime || '23:00'}` : `Abre a las ${storeConfig.openTime || '11:00'}`}
                </p>
              </div>
            </div>

            {/* Atajo: crear pedido manual */}
            <button
              onClick={() => setShowManualForm(true)}
              title="Nuevo pedido manual"
              className="hidden md:inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold shadow-sm hover:bg-brand-orange dark:hover:bg-brand-orange dark:hover:text-white hover:shadow-md hover:shadow-brand-orange/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Nuevo pedido</span>
            </button>

            {/* Acciones agrupadas */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100/80 dark:bg-stone-900/80 border border-gray-200/60 dark:border-stone-800">
              <button onClick={() => setShowNotifications(true)} title="Notificaciones" className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all relative ${
                showNotifications
                  ? 'bg-white dark:bg-stone-800 text-brand-orange shadow-sm'
                  : 'text-gray-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 hover:text-brand-orange hover:shadow-sm'
              }`}>
                <motion.span
                  animate={pedidosNuevos.length > 0 ? { rotate: [0, -16, 14, -10, 6, 0] } : { rotate: 0 }}
                  transition={pedidosNuevos.length > 0 ? { duration: 0.9, repeat: Infinity, repeatDelay: 5 } : { duration: 0 }}
                  className="flex"
                >
                  <Bell className="w-5 h-5" />
                </motion.span>
                {pedidosNuevos.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-orange text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-gray-100 dark:border-stone-900 shadow-sm shadow-brand-orange/40">
                    {pedidosNuevos.length}
                  </span>
                )}
              </button>
              <button onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl text-gray-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 hover:text-brand-orange hover:shadow-sm transition-all">
                <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="flex">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.span>
              </button>
            </div>

            {/* Perfil del administrador */}
            <div className="hidden md:flex items-center gap-3 pl-1.5 pr-1.5 lg:pr-4 py-1.5 rounded-2xl border border-gray-200/70 dark:border-stone-800 bg-white dark:bg-stone-900/60">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-orange-600 text-white flex items-center justify-center shadow-md shadow-brand-orange/25">
                  <Shield className="w-[18px] h-[18px]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900" />
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-[13px] font-black text-gray-900 dark:text-white">Administrador</p>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-stone-500">En línea</p>
              </div>
            </div>
          </div>
        </header>

        {/* Panel lateral de notificaciones: sale por la derecha y oscurece el fondo */}
        <AnimatePresence>
          {showNotifications && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-[60] bg-gray-900/30 dark:bg-black/60 backdrop-blur-[2px]"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 z-[61] w-full sm:w-[420px] bg-white dark:bg-[#151515] sm:border-l border-gray-100 dark:border-stone-800 shadow-2xl flex flex-col"
              >
                <div className="h-[70px] md:h-24 px-5 md:px-6 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-stone-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center ring-1 ring-inset ring-brand-orange/20">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="leading-tight">
                      <h3 className="font-black text-lg text-gray-900 dark:text-white">Notificaciones</h3>
                      <p className="text-xs font-semibold text-gray-400 dark:text-stone-500">
                        {pedidosNuevos.length === 0 ? 'Todo al día' : `${pedidosNuevos.length} ${pedidosNuevos.length === 1 ? 'pedido espera' : 'pedidos esperan'} atención`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowNotifications(false)} title="Cerrar" className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-800 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {pedidosNuevos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-8">
                      <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-stone-900 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="font-black text-gray-900 dark:text-white">No hay pedidos nuevos</p>
                      <p className="text-sm text-gray-500 dark:text-stone-400 mt-1">Cuando llegue uno, aparecerá aquí.</p>
                    </div>
                  ) : (
                    pedidosNuevos.map((ord, i) => (
                      <motion.button
                        key={ord.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => { setShowNotifications(false); handleNavigateToOrders(ord.id); }}
                        className="w-full text-left p-4 rounded-2xl border border-gray-100 dark:border-stone-800 bg-white dark:bg-stone-900/40 hover:border-brand-orange/40 hover:shadow-lg hover:shadow-brand-orange/5 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5 text-brand-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-brand-orange transition-colors">
                                {ord.client || 'Cliente Copiway'}
                              </p>
                              <span className="text-[10px] font-semibold text-gray-400 dark:text-stone-500 shrink-0">{haceCuanto(ord.date)}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-stone-400 flex items-center gap-1 mt-1 min-w-0">
                              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{ord.address}</span>
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                ord.status === 'Pagado'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                              }`}>
                                {ord.status}
                              </span>
                              <span className="text-sm font-black text-gray-900 dark:text-white">{formatCOP(ord.total)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-stone-800 shrink-0">
                  <button
                    onClick={() => { setShowNotifications(false); handleNavigateToOrders(); }}
                    className="w-full h-12 rounded-2xl bg-brand-orange text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Ver todas las comandas <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        
        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 w-full min-w-0">
          {/* Alerta de Stock Crítico */}
          {inventory.filter(i => i.stock > 0 && i.stock <= 10).length > 0 && (
            <div className="mb-6 relative overflow-hidden bg-gradient-to-br from-red-50 via-red-50 to-orange-50 dark:from-red-950/30 dark:via-red-950/20 dark:to-orange-950/10 border border-red-200/80 dark:border-red-900/40 rounded-[24px] p-5 shadow-sm">
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-red-200/30 dark:bg-red-900/20 blur-2xl pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="relative shrink-0 mt-0.5">
                  <div className="absolute inset-0 rounded-2xl bg-red-500/30 animate-ping" />
                  <div className="relative bg-red-500 text-white p-2.5 rounded-2xl shadow-md shadow-red-500/30">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h4 className="text-red-800 dark:text-red-300 font-black text-sm tracking-tight">Alerta Preventiva: Stock Crítico</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                        {inventory.filter(i => i.stock > 0 && i.stock <= 10).length}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-red-500/15 text-red-700 dark:text-red-200 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white text-xs font-bold transition-all duration-200 shadow-sm shadow-red-500/10 active:scale-95 shrink-0 cursor-pointer border border-red-300 dark:border-red-500/40 hover:border-red-600"
                    >
                      Ir a Inventario <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <p className="text-red-600/90 dark:text-red-400/90 text-sm mt-1 font-medium">
                    Los siguientes insumos están a punto de agotarse. Reabastece pronto para evitar bloqueos en las ventas.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {inventory.filter(i => i.stock > 0 && i.stock <= 10).map(item => (
                      <span key={item.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-stone-900/60 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200/80 dark:border-red-800/40 shadow-xs">
                        {item.name} <span className="text-red-500 dark:text-red-400 font-black">{item.stock} uds</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="w-full">
            {activeTab === 'overview' && (
              <OverviewSection
                orders={orders}
                staff={staff}
                storeConfig={storeConfig}
                salesData={salesData}
                periodOrdersCount={periodOrdersCount}
                salesFilter={salesFilter}
                setSalesFilter={setSalesFilter}
                topProductsData={topProductsData}
                activePieIndex={activePieIndex}
                setActivePieIndex={setActivePieIndex}
                handleNavigateToOrders={handleNavigateToOrders}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersSection
                orders={orders}
                staff={staff}
                theme={theme}
                highlightedOrderId={highlightedOrderId}
                isMapExpanded={isMapExpanded}
                setIsMapExpanded={setIsMapExpanded}
                setSelectedDriverInfo={setSelectedDriverInfo}
                showManualForm={showManualForm}
                setShowManualForm={setShowManualForm}
                setEditingAddressOrder={setEditingAddressOrder}
                setNewAddress={setNewAddress}
                handleViewOrder={handleViewOrder}
              />
            )}
            {activeTab === 'map' && (
              <MapSection
                orders={orders}
                staff={staff}
                theme={theme}
                storeConfig={storeConfig}
                setActiveTab={setActiveTab}
                handleNavigateToOrders={handleNavigateToOrders}
                setEditingAddressOrder={setEditingAddressOrder}
                setNewAddress={setNewAddress}
                handleOpenStaffModal={handleOpenStaffModal}
              />
            )}
            {activeTab === 'menu' && (
              <MenuSection
                products={products}
                filteredProducts={filteredProducts}
                inventory={inventory}
                storeConfig={storeConfig}
                addProduct={addProduct}
                updateProduct={updateProduct}
                deleteProduct={deleteProduct}
                addCategory={addCategory}
                removeCategory={removeCategory}
                newProduct={newProduct}
                setNewProduct={setNewProduct}
                tempIngredientName={tempIngredientName}
                setTempIngredientName={setTempIngredientName}
                tempPackagingName={tempPackagingName}
                setTempPackagingName={setTempPackagingName}
                editingProductId={editingProductId}
                setEditingProductId={setEditingProductId}
                isProductModalOpen={isProductModalOpen}
                setIsProductModalOpen={setIsProductModalOpen}
                isCategoryManagerOpen={isCategoryManagerOpen}
                setIsCategoryManagerOpen={setIsCategoryManagerOpen}
                selectedCatalogCategory={selectedCatalogCategory}
                setSelectedCatalogCategory={setSelectedCatalogCategory}
                newCategoryInput={newCategoryInput}
                setNewCategoryInput={setNewCategoryInput}
                isInlineAddingCategory={isInlineAddingCategory}
                setIsInlineAddingCategory={setIsInlineAddingCategory}
                inlineCategoryName={inlineCategoryName}
                setInlineCategoryName={setInlineCategoryName}
                catalogSearch={catalogSearch}
                setCatalogSearch={setCatalogSearch}
                showToast={showToast}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeTab === 'inventory' && (
              <InventorySection
                inventory={inventory}
                filteredInventory={filteredInventory}
                filteredInventoryLogs={filteredInventoryLogs}
                addInventoryItem={addInventoryItem}
                updateInventoryItem={updateInventoryItem}
                updateInventoryStock={updateInventoryStock}
                deleteInventoryItem={deleteInventoryItem}
                newItem={newItem}
                setNewItem={setNewItem}
                isInventoryModalOpen={isInventoryModalOpen}
                setIsInventoryModalOpen={setIsInventoryModalOpen}
                inventorySearch={inventorySearch}
                setInventorySearch={setInventorySearch}
                inventoryHistorySearch={inventoryHistorySearch}
                setInventoryHistorySearch={setInventoryHistorySearch}
                showToast={showToast}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeTab === 'staff' && (
              <StaffSection
                staff={staff}
                filteredStaff={filteredStaff}
                paginatedStaff={paginatedStaff}
                staffTotalPages={staffTotalPages}
                staffCurrentPage={staffCurrentPage}
                setStaffCurrentPage={setStaffCurrentPage}
                staffSearch={staffSearch}
                staffRoleFilter={staffRoleFilter}
                setStaffRoleFilter={setStaffRoleFilter}
                staffStatusFilter={staffStatusFilter}
                setStaffStatusFilter={setStaffStatusFilter}
                setStaffSearch={setStaffSearch}
                addStaff={addStaff}
                updateStaff={updateStaff}
                deleteStaff={deleteStaff}
                newStaff={newStaff}
                setNewStaff={setNewStaff}
                showStaffPassword={showStaffPassword}
                setShowStaffPassword={setShowStaffPassword}
                handleOpenStaffModal={handleOpenStaffModal}
                showToast={showToast}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeTab === 'clients' && (
              <ClientsSection
                filteredClients={filteredClients}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                setSelectedClientInfo={setSelectedClientInfo}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsSection
                storeConfig={storeConfig}
                updateStoreConfig={updateStoreConfig}
                isStoreAutomaticallyOpen={isStoreAutomaticallyOpen}
                shippingRateInput={shippingRateInput}
                setShippingRateInput={setShippingRateInput}
                profitMarginInput={profitMarginInput}
                setProfitMarginInput={setProfitMarginInput}
                setShowTimePicker={setShowTimePicker}
                handleGenerarCierre={handleGenerarCierre}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </main>

      
      {/* Modal de Cierre de Caja */}
      <AnimatePresence>
        {showCierre && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCierre(false)}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#151515] rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div id="cierre-modal-content" className="flex-1 flex flex-col min-h-0">
              <div className="p-8 border-b border-gray-100 dark:border-stone-800 flex justify-between items-center bg-gray-50/50 dark:bg-stone-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-gray-900 dark:text-white">Cierre de Caja</h2>
                    <p className="text-sm font-bold text-gray-500">{cierreData?.date}</p>
                  </div>
                </div>
                <button onClick={() => setShowCierre(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-white dark:bg-[#151515] min-w-0 text-black dark:text-white">
    {cierreData?.activeOrdersCount > 0 && (
      <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
        <h4 className="font-bold mb-1">Advertencia: Órdenes Activas</h4>
        <p className="text-sm">Tienes {cierreData.activeOrdersCount} órdenes activas. Si cierras la caja ahora, el sistema se reiniciará para el nuevo turno.</p>
      </div>
    )}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-stone-900 rounded-[24px] p-6 sm:p-8 border border-gray-100 dark:border-stone-800 overflow-hidden">
                    <p className="text-sm font-bold text-gray-500 mb-1">Total Ventas</p>
                    <p className="font-black text-[clamp(1.2rem,4vw,1.875rem)] sm:text-3xl text-gray-900 dark:text-white break-all sm:break-normal">{cierreData ? formatCOP(cierreData.totalVentas) : '$0'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-stone-900 rounded-[24px] p-6 sm:p-8 border border-gray-100 dark:border-stone-800 overflow-hidden">
                    <p className="text-sm font-bold text-gray-500 mb-1">Total Órdenes</p>
                    <p className="font-black text-3xl text-gray-900 dark:text-white">{cierreData?.totalOrdenes}</p>
                  </div>
                </div>

                {cierreData && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="rounded-[20px] p-5 border border-amber-100 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/20">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">Costo domicilios</p>
                      <p className="font-black text-xl text-gray-900 dark:text-white">{formatCOP(cierreData.costoDomicilios)}</p>
                    </div>
                    <div className="rounded-[20px] p-5 border border-red-100 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/20">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wider">Insumos gastados</p>
                      <p className="font-black text-xl text-gray-900 dark:text-white">{formatCOP(cierreData.costoInsumos)}</p>
                    </div>
                    <div className="rounded-[20px] p-5 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/20">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wider">Ganancia bruta</p>
                      <p className="font-black text-xl text-gray-900 dark:text-white">{formatCOP(cierreData.gananciaBruta)}</p>
                    </div>
                    <div className="rounded-[20px] p-5 border border-blue-100 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-950/20">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">Margen</p>
                      <p className="font-black text-xl text-gray-900 dark:text-white">{cierreData.margen}%</p>
                    </div>
                  </div>
                )}

                <div className="mb-8 bg-gray-50 dark:bg-stone-900 rounded-[24px] p-6 border border-gray-100 dark:border-stone-800">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">{salesFilter.includes('mes') ? 'Estadísticas de Ventas (Mes)' : 'Estadísticas de Ventas (Semana)'}</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
                        <Tooltip cursor={false} content={<CustomTooltip />} />
                        <Bar dataKey="amount" fill="#f97316" activeBar={{ fill: "#ea580c" }} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Desglose por Método de Pago</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 rounded-[16px] bg-gray-50 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800">
                        <span className="font-medium text-gray-600 dark:text-stone-300">Efectivo</span>
                        <span className="font-black text-gray-900 dark:text-white">{cierreData ? formatCOP(cierreData.desglose.efectivo) : '$0'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-[16px] bg-gray-50 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800">
                        <span className="font-medium text-gray-600 dark:text-stone-300">Tarjetas / Transferencias</span>
                        <span className="font-black text-gray-900 dark:text-white">{cierreData ? formatCOP(cierreData.desglose.digital) : '$0'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Consumo de Insumos</h3>
                    <div className="bg-gray-50 dark:bg-stone-900/50 rounded-[20px] p-5 border border-gray-100 dark:border-stone-800">
                      {cierreData?.insumosConsumidos && cierreData.insumosConsumidos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {cierreData.insumosConsumidos.map((insumo, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 bg-white dark:bg-[#151515] rounded-xl px-4 py-3 border border-gray-100 dark:border-stone-800">
                              <span className="text-sm font-medium text-gray-700 dark:text-stone-300 truncate">{insumo.name}</span>
                              <span className="shrink-0 text-xs font-black text-brand-orange bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-full">
                                {insumo.used} {insumo.unit || 'unid.'}
                              </span>
                              {!!insumo.cost && <span className="shrink-0 text-xs font-bold text-gray-500">{formatCOP(insumo.cost)}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No hay datos de insumos consumidos hoy.</p>
                      )}
                    </div>
                  </div>

                  {cierreData?.liquidaciones && cierreData.liquidaciones.length > 0 && (
                    <div className="mt-8">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Liquidación de Domiciliarios</h3>
                      <div className="bg-gray-50 dark:bg-stone-900/50 rounded-[20px] p-6 border border-gray-100 dark:border-stone-800">
                        <div className="space-y-4">
                          {cierreData.liquidaciones.map((liq, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-[#151515] p-4 rounded-xl border border-gray-100 dark:border-stone-800">
                              <div className="flex justify-between items-center mb-3">
                                <span className="font-black text-gray-900 dark:text-white">{liq.driverName}</span>
                                <span className="text-xs bg-brand-orange/10 text-brand-orange px-2 py-1 rounded-lg font-bold">
                                  {liq.ordersCount} Entregas (Efectivo)
                                </span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-stone-400">
                                  <span>Recaudo (Efectivo)</span>
                                  <span>{formatCOP(liq.cashCollected)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-stone-400">
                                  <span>Base Asignada</span>
                                  <span>{formatCOP(liq.base)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-stone-800 mt-2">
                                  <span>Total a Entregar</span>
                                  <span className="text-brand-orange">{formatCOP(liq.totalDue)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-stone-800 bg-gray-50/70 dark:bg-stone-900/50 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={requestConfirmarCierre}
                  className="flex-1 py-3.5 sm:py-4 px-6 rounded-2xl font-bold transition-all shadow-lg min-w-0 bg-brand-orange text-white hover:bg-[#e66500] shadow-brand-orange/20 cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Confirmar y Cerrar Caja</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerReporte}
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-800 dark:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-700 cursor-pointer active:scale-[0.98]"
                    title="Ver Vista Previa del Reporte"
                  >
                    <Eye className="w-5 h-5 text-gray-600 dark:text-stone-300 shrink-0" />
                    <span>Ver</span>
                  </button>

                  <button 
                    type="button"
                    onClick={descargarPDF}
                    disabled={isGeneratingPDF}
                    className={`flex-1 sm:flex-none px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                      isGeneratingPDF 
                        ? 'bg-gray-400 text-white cursor-wait' 
                        : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-stone-200'
                    }`}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 shrink-0" />
                        <span>Descargar PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Vista Previa del Reporte de Cierre */}
      <AnimatePresence>
        {showPdfPreview && cierreData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[15000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setShowPdfPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 dark:border-stone-800"
            >
              {/* Header Preview */}
              <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-stone-800 flex justify-between items-center bg-gray-50/80 dark:bg-stone-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                      Vista Previa: Reporte de Cierre de Caja
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-stone-400">
                      Fecha: {cierreData.date} • Hamburguer Copiway
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPdfPreview(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-gray-500 dark:text-stone-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* El PDF real: lo que se ve aqui es exactamente lo que se descarga */}
              <div className="flex-1 min-h-[60vh] bg-white overflow-hidden relative">
                {pdfPreviewUrl ? (
                  <iframe
                    title="Vista previa del reporte de cierre"
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
                    className="absolute border-0 max-w-none"
                    style={{ top: -10, left: -10, width: 'calc(100% + 10px)', height: 'calc(100% + 20px)' }}
                  />
                ) : (
                  <div className="h-full min-h-[60vh] flex items-center justify-center text-sm text-gray-500">Generando vista previa...</div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-stone-800 bg-gray-50/80 dark:bg-stone-900/60 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(false)}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    descargarPDF();
                    setShowPdfPreview(false);
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-orange text-white hover:bg-[#e66500] shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo PDF</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detalles del Repartidor */}
      <AnimatePresence>
        {selectedDriverInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedDriverInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-gray-100 dark:border-stone-800 flex flex-col pb-8 md:pb-0"
            >
              <div className="p-8 border-b border-gray-100 dark:border-stone-800 flex justify-between items-center bg-gray-50 dark:bg-[#151515] sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <User className="w-7 h-7 text-brand-orange" />
                    {selectedDriverInfo.name}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedDriverInfo.status === 'EN RUTA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-stone-800 dark:text-stone-300'}`}>
                      {selectedDriverInfo.status}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-stone-400 flex items-center gap-1">
                      <IdCard className="w-4 h-4" /> {selectedDriverInfo.plate}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDriverInfo(null)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-stone-900/50 p-4 rounded-[20px] border border-gray-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Vehículo</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedDriverInfo.vehicle}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-stone-900/50 p-4 rounded-[20px] border border-gray-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Teléfono</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedDriverInfo.phone}</p>
                  </div>
                </div>

                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  Pedidos Asignados ({selectedDriverInfo.orders.length})
                </h3>
                
                <div className="space-y-5">
                  {selectedDriverInfo.orders.length === 0 && (
                    <div className="text-center py-10 rounded-[24px] border border-dashed border-gray-200 dark:border-stone-800 text-sm text-gray-500 dark:text-stone-400">
                      Sin pedidos asignados por ahora.
                    </div>
                  )}
                  {selectedDriverInfo.orders.map((order, idx: number) => {
                    const raw = order.raw;
                    const delivered = order.status === 'Entregado';
                    const paid = (!order.paymentMethod || order.paymentMethod === 'online' || order.paymentStatus === 'Pagado');
                    const items = raw?.items || [];
                    return (
                    <div key={idx} className="rounded-[28px] border border-gray-200 dark:border-stone-800 bg-white dark:bg-[#151515] overflow-hidden shadow-sm">
                      <div className={`px-6 py-4 flex items-center justify-between gap-3 ${delivered ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-gradient-to-r from-brand-orange/10 to-transparent'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${delivered ? 'bg-emerald-500' : 'bg-brand-orange'} text-white`}>
                            {delivered ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-lg leading-none text-gray-900 dark:text-white">{String(order.id).replace(/^#/, '')}</p>
                            {raw?.time && (
                              <p className="text-xs text-gray-500 dark:text-stone-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {raw.time}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-black tracking-wider rounded-full uppercase ${delivered ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="p-6 space-y-5">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-stone-900 p-3 rounded-2xl">
                            <div className="w-9 h-9 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0"><User className="w-4 h-4" /></div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{order.client}</p>
                              {raw?.clientPhone ? (
                                <a href={`tel:${raw.clientPhone}`} className="text-xs text-gray-500 dark:text-stone-400 hover:text-brand-orange">{raw.clientPhone}</a>
                              ) : (
                                <p className="text-xs text-gray-400">Teléfono no disponible</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-3 bg-gray-50 dark:bg-stone-900 p-3 rounded-2xl">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></div>
                            <p className="text-sm font-medium text-gray-700 dark:text-stone-300 self-center">{order.address}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-3">Productos ({items.length || order.items.length})</p>
                          <div className="space-y-3">
                            {items.length > 0 ? items.map((item, i) => {
                              const catProduct = products.find(p => p.id === (item.productId || item.id) || p.name.toLowerCase() === (item.name || item.product?.name || '').toLowerCase());
                              const img = item.product?.image || catProduct?.image;
                              const name = item.name || item.product?.name || catProduct?.name || 'Producto';
                              const qty = item.quantity || 1;
                              const linePrice = (item.finalPrice ?? item.price ?? 0) * qty;
                              return (
                                <div key={item.id || i} className="flex gap-3 items-start">
                                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 dark:bg-stone-800 shrink-0 ring-1 ring-black/5">
                                    {img ? (
                                      <img src={img} alt={name} className="w-full h-full object-cover" />
                                    ) : item.extras && item.extras.length > 0 ? (
                                      <CustomBurgerThumb ingredientNames={item.extras.map(e => e.name)} size={56} className="!rounded-none border-0" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag className="w-5 h-5" /></div>
                                    )}
                                    <span className="absolute bottom-0.5 right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-brand-orange text-white text-[11px] font-black flex items-center justify-center shadow ring-2 ring-white dark:ring-[#151515]">{qty}x</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between gap-2">
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
                                      {linePrice > 0 && <p className="text-sm font-bold text-gray-700 dark:text-stone-300 shrink-0">{formatCOP(linePrice)}</p>}
                                    </div>
                                    {item.extras && item.extras.length > 0 && (
                                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">+ {item.extras.map(e => e.name).join(', ')}</p>
                                    )}
                                    {item.removed && item.removed.length > 0 && (
                                      <p className="text-xs text-red-500 mt-0.5">Sin {item.removed.map(e => e.name).join(', ')}</p>
                                    )}
                                    {item.modifications && item.modifications.length > 0 && (
                                      <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">{item.modifications.join(' · ')}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            }) : order.items.map((item: string, i: number) => (
                              <div key={i} className="text-sm text-gray-600 dark:text-stone-400">{item}</div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 dark:bg-stone-900 p-4 space-y-1.5 text-sm">
                          {raw?.subtotal != null && (
                            <div className="flex justify-between text-gray-600 dark:text-stone-400"><span>Subtotal</span><span>{formatCOP(raw.subtotal)}</span></div>
                          )}
                          {(raw?.shipping ?? 0) > 0 && (
                            <div className="flex justify-between text-gray-600 dark:text-stone-400"><span>Domicilio</span><span>{formatCOP(raw!.shipping!)}</span></div>
                          )}
                          {(raw?.discount ?? 0) > 0 && (
                            <div className="flex justify-between text-emerald-600"><span>Descuento</span><span>-{formatCOP(raw!.discount!)}</span></div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-stone-700">
                            <span className="font-black text-gray-900 dark:text-white">Total</span>
                            <span className="font-black text-lg text-gray-900 dark:text-white">{formatCOP(order.total)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 dark:text-stone-400">Pago</span>
                            {paid ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase">
                                Digital{raw?.digitalBank ? ` · ${raw.digitalBank}` : ''} · Pagado
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-brand-orange text-[10px] font-black uppercase">Cobrar en efectivo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Modal Editar Dirección */}
      <AnimatePresence>
        {editingAddressOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setEditingAddressOrder(null); setNewAddress(''); }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#151515] rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-stone-800 flex flex-col p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">Editar Dirección del Pedido {editingAddressOrder.id}</h3>
                  <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">Actualiza el punto de entrega en tiempo real para el domiciliario</p>
                </div>
                <button 
                  type="button"
                  onClick={() => { setEditingAddressOrder(null); setNewAddress(''); }} 
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors shrink-0 cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-stone-300 mb-2">Dirección de Entrega</label>
                <input 
                  type="text"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder="Ej. Calle 84 # 46-20, Apto 301"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setEditingAddressOrder(null); setNewAddress(''); }}
                  className="flex-1 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 py-3.5 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleUpdateAddress}
                  disabled={!newAddress.trim() || newAddress === editingAddressOrder.address}
                  className="flex-1 bg-brand-orange text-white py-3.5 rounded-2xl font-bold hover:bg-[#e66500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand-orange/20 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Order Modal */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowManualForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-[#151515] w-full max-w-5xl rounded-[28px] border border-gray-100 dark:border-stone-800 overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Encabezado: cambia según la vista */}
              <div className="px-5 py-4 md:px-7 md:py-5 border-b border-gray-100 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {manualView === 'catalogo' ? (
                    <button
                      onClick={() => { setManualView('datos'); setManualSelectedProduct(null); }}
                      title="Volver al pedido"
                      className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-200 hover:bg-brand-orange hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-brand-orange flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                      {manualView === 'catalogo' ? 'Elegir Productos' : manualView === 'listo' ? 'Pedido Registrado' : 'Ingreso de Orden Manual'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-stone-400 truncate">
                      {manualView === 'catalogo' ? 'Toca un producto, ajústalo y agrégalo a la orden.' : manualView === 'listo' ? 'Envíale al cliente la confirmación por WhatsApp.' : 'Registra un pedido tomado por llamada o WhatsApp.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {manualView === 'datos' ? (
                /* ===== Vista 1: datos del cliente + productos de la orden ===== */
                <div className="p-5 md:p-7 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Datos del Cliente */}
                  <div className="bg-gray-50 dark:bg-stone-900/60 p-5 rounded-2xl border border-gray-100 dark:border-stone-800 space-y-3.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-brand-orange">1. Datos del Cliente</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-1.5">Cliente</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input type="text" value={manualOrderClient.name} onChange={e => setManualOrderClient({...manualOrderClient, name: e.target.value})} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all" placeholder="Nombre del cliente" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-1.5">Teléfono</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input type="tel" value={manualOrderClient.phone} onChange={e => setManualOrderClient({...manualOrderClient, phone: e.target.value})} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all" placeholder="Número de celular" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-1.5">Dirección de Entrega</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input type="text" value={manualOrderClient.address} onChange={e => setManualOrderClient({...manualOrderClient, address: e.target.value})} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all" placeholder="Dirección completa" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-1.5">Llegó por</label>
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-200/60 dark:bg-stone-800">
                        {([['llamada', 'Llamada', Phone], ['whatsapp', 'WhatsApp', MessageCircle]] as const).map(([valor, texto, Icono]) => (
                          <button
                            key={valor}
                            type="button"
                            onClick={() => setManualOrderChannel(valor)}
                            className={`py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${manualOrderChannel === valor ? 'bg-white dark:bg-stone-900 text-brand-orange shadow-sm' : 'text-gray-500 dark:text-stone-400 hover:text-gray-800 dark:hover:text-white'}`}
                          >
                            <Icono className="w-4 h-4" /> {texto}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-1.5">Forma de pago</label>
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-200/60 dark:bg-stone-800">
                        {([['efectivo', 'Efectivo', Wallet], ['link', 'Link de pago', Link2]] as const).map(([valor, texto, Icono]) => (
                          <button
                            key={valor}
                            type="button"
                            onClick={() => setManualPaymentMode(valor)}
                            className={`py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${manualPaymentMode === valor ? 'bg-white dark:bg-stone-900 text-brand-orange shadow-sm' : 'text-gray-500 dark:text-stone-400 hover:text-gray-800 dark:hover:text-white'}`}
                          >
                            <Icono className="w-4 h-4" /> {texto}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-500 dark:text-stone-400 flex gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                      {manualPaymentMode === 'link'
                        ? 'Pago por Nequi, Daviplata o Bancolombia. El link vence en 30 minutos.'
                        : 'Pago en efectivo al recibir el pedido.'}
                    </p>
                  </div>

                  {/* Productos de la orden */}
                  <div className="bg-gray-50 dark:bg-stone-900/60 p-5 rounded-2xl border border-gray-100 dark:border-stone-800 flex flex-col min-h-[260px]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand-orange">2. Productos</h3>
                      {manualOrderItems.length > 0 && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange">
                          {manualOrderItems.reduce((acc, i) => acc + i.quantity, 0)} en la orden
                        </span>
                      )}
                    </div>

                    {manualOrderItems.length === 0 ? (
                      <button
                        onClick={() => setManualView('catalogo')}
                        className="flex-1 w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-stone-700 hover:border-brand-orange hover:bg-brand-orange/5 flex flex-col items-center justify-center gap-3 p-6 transition-all group cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-brand-orange text-white flex items-center justify-center shadow-lg shadow-brand-orange/25 group-hover:scale-110 transition-transform">
                          <Plus className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-gray-900 dark:text-white">Agregar productos</p>
                          <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">Abre el catálogo para elegir del menú</p>
                        </div>
                      </button>
                    ) : (
                      <>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px] pr-1 -mr-1">
                          {manualOrderItems.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-stone-800 p-2.5 rounded-xl border border-gray-100 dark:border-stone-700">
                              <img src={item.product?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&h=200&auto=format&fit=crop"} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                  <span className="text-brand-orange">{item.quantity}x</span> {item.name}
                                </p>
                                {(item.removed.length > 0 || item.extras.length > 0) && (
                                  <p className="text-[11px] truncate mt-0.5">
                                    {item.removed.map(r => <span key={r.id} className="text-red-500 mr-2">- Sin {r.name}</span>)}
                                    {agruparPorNombre(item.extras).map(e => <span key={e.name} className="text-emerald-500 mr-2">+ {e.name}{e.veces > 1 ? ` x${e.veces}` : ''}</span>)}
                                  </p>
                                )}
                              </div>
                              <span className="font-black text-sm text-gray-900 dark:text-white shrink-0">{formatCOP(item.finalPrice)}</span>
                              <button onClick={() => setManualOrderItems(manualOrderItems.filter((_, i) => i !== idx))} title="Quitar" className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setManualView('catalogo')}
                          className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-stone-700 text-sm font-bold text-gray-600 dark:text-stone-300 hover:border-brand-orange hover:text-brand-orange flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Agregar más productos
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : manualView === 'catalogo' ? (
                /* ===== Vista 2: catálogo para elegir productos ===== */
                <div className="min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_330px] lg:grid-rows-[minmax(0,1fr)] overflow-y-auto lg:overflow-hidden lg:h-[min(62vh,560px)] lg:shrink-0">
                  {/* Lista de productos */}
                  <div className="flex flex-col min-h-0 p-5 md:p-6 lg:border-r border-gray-100 dark:border-stone-800">
                    <div className="relative mb-3 shrink-0">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={manualSearch}
                        onChange={e => setManualSearch(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-3 shrink-0">
                      {manualCategorias.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setManualCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${manualCategory === cat ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 content-start pr-1 -mr-1">
                      {manualProductosFiltrados.length === 0 && (
                        <p className="sm:col-span-2 text-center text-sm text-gray-500 dark:text-stone-400 py-10">No hay productos con ese nombre.</p>
                      )}
                      {manualProductosFiltrados.map(p => {
                        const enOrden = manualCantidadEnOrden(p.id);
                        const seleccionado = manualSelectedProduct?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => { setManualSelectedProduct(seleccionado ? null : p); setManualCustomRemoved([]); setManualCustomExtras([]); setManualQuantity(1); }}
                            className={`relative flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${seleccionado ? 'border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/20' : 'border-gray-100 dark:border-stone-800 hover:border-gray-300 dark:hover:border-stone-600 bg-white dark:bg-stone-900/40'}`}
                          >
                            <img src={p.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&h=200&auto=format&fit=crop"} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                              <p className="text-[11px] text-gray-400 dark:text-stone-500 truncate">{p.category || 'Otros'}</p>
                            </div>
                            <span className="text-sm font-black text-gray-900 dark:text-white shrink-0">{formatCOP(p.price)}</span>
                            {enOrden > 0 && (
                              <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                                {enOrden}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Panel derecho: personalizar el producto elegido */}
                  <div className="flex flex-col min-h-0 bg-gray-50/70 dark:bg-stone-900/40 border-t lg:border-t-0 border-gray-100 dark:border-stone-800">
                    {manualSelectedProduct ? (
                      <>
                        {/* Parte fija: producto, cantidad y título de ingredientes */}
                        <div className="shrink-0 p-5 pb-3 space-y-4">
                          <div className="flex items-center gap-3">
                            <img src={manualSelectedProduct.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&h=200&auto=format&fit=crop"} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-black text-gray-900 dark:text-white leading-tight">{manualSelectedProduct.name}</p>
                              <p className="text-sm font-bold text-brand-orange mt-0.5">{formatCOP(manualSelectedProduct.price)}</p>
                            </div>
                            <button
                              onClick={() => { setManualSelectedProduct(null); setManualCustomRemoved([]); setManualCustomExtras([]); setManualQuantity(1); }}
                              title="Quitar selección"
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer shrink-0 self-start"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-stone-300 mb-1.5">Cantidad</label>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setManualQuantity(Math.max(1, ((manualQuantity as number) || 1) - 1))} className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 flex items-center justify-center text-gray-700 dark:text-stone-200 hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer">
                                <Minus className="w-4 h-4" />
                              </button>
                              <input type="number" min="1" value={manualQuantity} onChange={e => setManualQuantity(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-16 h-10 text-center rounded-xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-black text-gray-900 dark:text-white outline-none focus:border-brand-orange" />
                              <button onClick={() => setManualQuantity(((manualQuantity as number) || 0) + 1)} className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 flex items-center justify-center text-gray-700 dark:text-stone-200 hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {manualSelectedProduct.ingredients && manualSelectedProduct.ingredients.length > 0 && (
                            <label className="block text-xs font-bold text-gray-700 dark:text-stone-300">Personalizar Ingredientes</label>
                          )}
                        </div>

                        {/* Solo esta parte sube y baja: la lista de ingredientes */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-1.5">
                                {(manualSelectedProduct.ingredients || []).map((ing: ProductComponent) => {
                                  const isRemoved = manualCustomRemoved.some(r => r.id === ing.id);
                                  // Cuántas veces se agregó como extra (puede ser más de una).
                                  const extras = manualCustomExtras.filter(e => e.id === ing.id).length;
                                  return (
                                    <div key={ing.id} className="flex items-center justify-between gap-2 bg-white dark:bg-stone-800 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-stone-700">
                                      <span className={`text-xs font-semibold truncate ${isRemoved ? 'text-gray-400 line-through' : extras > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-stone-300'}`}>
                                        {extras > 0 ? `Extra ${ing.name}` : ing.name}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          title={extras > 0 ? 'Un extra menos' : 'Quitar'}
                                          onClick={() => {
                                            if (extras > 0) {
                                              // Quita uno solo de los extras de este ingrediente.
                                              const i = manualCustomExtras.findIndex(e => e.id === ing.id);
                                              setManualCustomExtras(manualCustomExtras.filter((_, k) => k !== i));
                                            } else if (isRemoved) setManualCustomRemoved(manualCustomRemoved.filter(r => r.id !== ing.id));
                                            else setManualCustomRemoved([...manualCustomRemoved, ing]);
                                          }}
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isRemoved ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-700'}`}
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        {extras > 0 && (
                                          <span className="min-w-[22px] text-center text-xs font-black text-emerald-600 dark:text-emerald-400">x{extras}</span>
                                        )}
                                        <button
                                          title="Agregar extra"
                                          onClick={() => {
                                            setManualCustomExtras([...manualCustomExtras, ing]);
                                            setManualCustomRemoved(manualCustomRemoved.filter(r => r.id !== ing.id));
                                          }}
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${extras > 0 ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-700'}`}
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-stone-800 shrink-0">
                          <button onClick={handleAddProductToManualOrder} className="w-full bg-brand-orange text-white py-3 rounded-xl text-sm font-bold hover:bg-[#e66500] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20">
                            <Plus className="w-4 h-4" /> Agregar · {formatCOP(manualPrecioSeleccion)}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[180px]">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 border border-gray-100 dark:border-stone-700 flex items-center justify-center mb-3">
                          <Utensils className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Elige un producto</p>
                        <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">Aquí podrás cambiar la cantidad y quitar o añadir ingredientes.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : manualCreatedOrder && (
                /* ===== Vista 3: pedido registrado, enviar por WhatsApp ===== */
                (() => {
                  // Se busca la versión más reciente del pedido para ver si ya lo pagaron.
                  const pedido = orders.find(o => o.id === manualCreatedOrder.id) || manualCreatedOrder;
                  const porLink = pedido.status === 'Esperando Pago' && !!pedido.paymentLinkCode;
                  const pagado = manualCreatedOrder.status === 'Esperando Pago' && pedido.status !== 'Esperando Pago' && pedido.status !== 'Cancelado';
                  const mensaje = mensajeDePedido(pedido);
                  return (
                    <div className="p-5 md:p-7 overflow-y-auto">
                      <div className="flex flex-col items-center text-center mb-6">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-3 ${porLink ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>
                          {porLink ? <Clock className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Pedido {pedido.id} registrado</h3>
                        <p className="text-sm text-gray-500 dark:text-stone-400 mt-1 max-w-md">
                          {porLink
                            ? 'Está esperando el pago. Envíale el link al cliente: cuando pague, el pedido pasa a cocina solo.'
                            : pagado
                              ? '¡El cliente ya pagó! El pedido pasó a cocina.'
                              : 'Ya está en cocina. Se cobra en efectivo al entregar.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        <div className="rounded-2xl border border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-stone-900/60 p-4 min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-stone-500">Cliente</p>
                          <p className="font-black text-gray-900 dark:text-white truncate mt-1">{pedido.client}</p>
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ${pedido.isGuest ? 'bg-gray-200 text-gray-600 dark:bg-stone-800 dark:text-stone-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
                            {pedido.isGuest ? 'Invitado · se le invita a registrarse' : `Registrado · suma ${pedido.pointsEarned || 0} puntos`}
                          </span>
                        </div>
                        <div className="rounded-2xl border border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-stone-900/60 p-4">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-stone-500">Total</p>
                          <p className="font-black text-2xl text-brand-orange mt-1">{formatCOP(pedido.total)}</p>
                          <p className="text-[11px] text-gray-500 dark:text-stone-400">{pedido.paymentMethod === 'cash' ? 'Efectivo al entregar' : porLink ? 'Pago por link' : 'Pagado por link'}</p>
                        </div>
                        <div className="rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-4">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">Código de entrega</p>
                          <p className="font-black text-3xl tracking-[0.3em] text-gray-900 dark:text-white mt-1">{pedido.deliveryPin || '----'}</p>
                          <p className="text-[11px] text-gray-500 dark:text-stone-400">{porLink ? 'Se le muestra al pagar' : 'Va en el mensaje'}</p>
                        </div>
                      </div>

                      {porLink && (
                        <div className="flex items-center gap-2 p-2 pl-4 rounded-2xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 mb-5">
                          <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="flex-1 min-w-0 truncate text-sm text-gray-700 dark:text-stone-300">{urlLinkPago(pedido.paymentLinkCode || '')}</span>
                          <button
                            onClick={() => copiarTexto(urlLinkPago(pedido.paymentLinkCode || ''), 'link')}
                            className="shrink-0 px-3 py-2 rounded-xl bg-gray-100 dark:bg-stone-800 text-xs font-bold text-gray-700 dark:text-stone-200 hover:bg-gray-200 dark:hover:bg-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            {manualCopied === 'link' ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar link</>}
                          </button>
                        </div>
                      )}

                      {pedido.status !== 'Cancelado' && !pagado && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => abrirWhatsApp(pedido.clientPhone || '', mensaje)}
                            className="py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/25 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <Send className="w-4 h-4" /> Enviar por WhatsApp
                          </button>
                          <button
                            onClick={() => copiarTexto(mensaje, 'mensaje')}
                            className="py-3.5 rounded-2xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-gray-700 dark:text-stone-200 font-bold text-sm flex items-center justify-center gap-2 hover:border-gray-300 dark:hover:border-stone-600 transition-colors cursor-pointer"
                          >
                            {manualCopied === 'mensaje' ? <><Check className="w-4 h-4 text-emerald-500" /> Mensaje copiado</> : <><Copy className="w-4 h-4" /> Copiar mensaje</>}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Pie: totales + botón según la vista */}
              {manualView === 'listo' ? (
                <div className="px-5 py-4 md:px-7 md:py-5 border-t border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-stone-900/50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                  <p className="text-xs text-gray-500 dark:text-stone-400">El pedido también aparece en Comandas Activas.</p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => { setManualCreatedOrder(null); setManualView('datos'); }}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-full border border-gray-200 dark:border-stone-700 text-sm font-bold text-gray-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Registrar otro
                    </button>
                    <button
                      onClick={() => setShowManualForm(false)}
                      className="flex-1 sm:flex-none px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
              <div className="px-5 py-4 md:px-7 md:py-5 border-t border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-stone-900/50 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
                <div className="flex gap-5 sm:gap-6 items-center flex-wrap">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-stone-400">Subtotal: </span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCOP(manualOrderTotal)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-stone-400">Envío: </span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCOP(storeConfig.shippingRate)}</span>
                  </div>
                  <div className="text-lg">
                    <span className="text-gray-500 dark:text-stone-400">Total: </span>
                    <span className="font-black text-brand-orange">{formatCOP(manualOrderTotal + (manualOrderItems.length > 0 ? storeConfig.shippingRate : 0))}</span>
                  </div>
                </div>
                {manualView === 'catalogo' ? (
                  <button
                    onClick={() => { setManualView('datos'); setManualSelectedProduct(null); }}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 w-full md:w-auto px-8 py-3.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Listo, volver al pedido
                  </button>
                ) : (
                  <button
                    onClick={handleCreateManualOrder}
                    disabled={manualOrderSaving || manualOrderItems.length === 0 || !manualOrderClient.name.trim() || !manualOrderClient.phone.trim() || !manualOrderClient.address.trim()}
                    className="bg-brand-orange text-white w-full md:w-auto px-8 py-3.5 rounded-full font-bold hover:bg-[#e66500] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-orange/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> {manualOrderSaving ? 'Enviando...' : 'Enviar a Cocina'}
                  </button>
                )}
              </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta de Éxito de Ruta */}
      <AnimatePresence>
        {showAddressSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Ruta actualizada
          </motion.div>
        )}
      </AnimatePresence>

{/* Alerta Global de Nueva Orden (HU-20) */}
      {/* Modal Ver Detalles de Orden */}
      <AnimatePresence>
        {viewingOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingOrder(null)}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#151515] rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-stone-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100 dark:border-stone-800 shrink-0 bg-gradient-to-br from-brand-orange/5 to-transparent">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-orange/30">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-2xl text-gray-900 dark:text-white leading-tight">Orden</h3>
                      <span className="px-2.5 py-1 rounded-lg bg-brand-orange/10 text-brand-orange text-sm font-black tracking-wide">
                        {viewingOrder.id.replace(/^#/, '')}
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium text-sm">Detalles completos de la orden</p>
                  </div>
                </div>
                <button onClick={() => setViewingOrder(null)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-500 dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-stone-900 p-4 rounded-2xl border border-gray-100 dark:border-stone-800">
                   <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-stone-400 mb-1">Estado</p>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex ${
                        viewingOrder.status === 'Esperando Pago' ? 'bg-amber-100 text-amber-800' :
                        viewingOrder.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                        viewingOrder.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        viewingOrder.status === 'En Preparación' ? 'bg-blue-100 text-blue-800' :
                        (viewingOrder.status as string) === 'Listo para Entregar' ? 'bg-green-100 text-green-800' :
                        viewingOrder.status === 'Entregado' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingOrder.status}
                      </span>
                   </div>
                   <div className="text-center border-x border-gray-200 dark:border-stone-700 px-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-stone-400 mb-1">Pago</p>
                      {(!viewingOrder.paymentMethod || viewingOrder.paymentMethod === 'online' || viewingOrder.paymentStatus === 'Pagado' || viewingOrder.status === 'Pagado') ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold inline-flex bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Digital
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold inline-flex bg-brand-orange/10 text-brand-orange">
                          Efectivo
                        </span>
                      )}
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-medium text-gray-500 dark:text-stone-400 mb-1">Total</p>
                      <p className="text-lg font-black text-brand-orange">{formatCOP(viewingOrder.total)}</p>
                   </div>
                </div>

                {/* Pedido manual: código de entrega y reenviar mensaje / link de pago */}
                {(() => {
                  const live = orders.find(o => o.id === viewingOrder.id) || viewingOrder;
                  if (!live.channel || live.channel === 'web' || live.status === 'Cancelado' || live.status === 'Entregado') return null;
                  const esperaPago = live.status === 'Esperando Pago' && !!live.paymentLinkCode;
                  return (
                    <div className="rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">Código de entrega</p>
                          <p className="font-black text-2xl tracking-[0.3em] text-gray-900 dark:text-white">{live.deliveryPin || '----'}</p>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-stone-400 text-right max-w-[180px]">
                          {esperaPago ? 'Esperando el pago por link. El cliente ve el código cuando paga.' : 'Díctaselo al cliente si no le llegó el mensaje.'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirWhatsApp(live.clientPhone || '', mensajeDePedido(live))}
                          className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> {esperaPago ? 'Reenviar link de pago' : 'Reenviar confirmación'}
                        </button>
                        {esperaPago && (
                          <button
                            onClick={() => copiarTexto(urlLinkPago(live.paymentLinkCode || ''), 'link')}
                            className="py-2.5 px-3 rounded-xl bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 text-gray-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            {manualCopied === 'link' ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar link</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div>
                   <h4 className="font-bold text-gray-900 dark:text-white mb-4">Información del Cliente</h4>
                   <div className="bg-gray-50/50 dark:bg-stone-900 p-4 rounded-2xl border border-gray-100 dark:border-stone-800 space-y-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 min-w-0">
                         <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0">
                           {(viewingOrder.client || 'Cliente General').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                         </div>
                         <div className="min-w-0">
                           <p className="font-black text-gray-900 dark:text-white text-base leading-tight truncate">{viewingOrder.client || 'Cliente General'}</p>
                           {viewingOrder.clientPhone && (
                             <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">{viewingOrder.clientPhone}</p>
                           )}
                         </div>
                       </div>
                     </div>

                     <div className="grid grid-cols-1 gap-2.5 pt-3 border-t border-gray-200/70 dark:border-stone-800 text-xs">
                       <div className="flex items-start gap-2 text-gray-600 dark:text-stone-400">
                         <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-orange" />
                         <span className="font-semibold text-gray-800 dark:text-stone-200">{viewingOrder.address}</span>
                       </div>
                       <div className="flex items-center gap-2 text-gray-600 dark:text-stone-400">
                         <Clock className="w-3.5 h-3.5 shrink-0 text-brand-orange" />
                         <span className="font-semibold text-gray-800 dark:text-stone-200">{new Date(viewingOrder.date || Date.now()).toLocaleString()}</span>
                       </div>
                     </div>

                     {viewingOrder.clientPhone && (
                       <div className="flex items-center gap-2 pt-1">
                         <a
                           href={`https://wa.me/57${viewingOrder.clientPhone.replace(/\D/g, '')}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                           <span>WhatsApp</span>
                         </a>
                         <a
                           href={`tel:${viewingOrder.clientPhone}`}
                           className="py-2 px-3 bg-white dark:bg-stone-800 hover:bg-gray-100 dark:hover:bg-stone-700 text-gray-700 dark:text-stone-200 border border-gray-200 dark:border-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                         >
                           <span>Llamar</span>
                         </a>
                       </div>
                     )}
                   </div>
                </div>

                <div>
                   <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                     <span>Información del Domiciliario</span>
                     {(() => {
                       const live = orders.find(o => o.id === viewingOrder.id) || viewingOrder;
                       const dName = live.driverName || viewingOrder.driverName;
                       return dName ? (
                         <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                           Asignado
                         </span>
                       ) : (
                         <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                           Por Asignar
                         </span>
                       );
                     })()}
                   </h4>
                   {(() => {
                     const live = orders.find(o => o.id === viewingOrder.id) || viewingOrder;
                     const dName = live.driverName || viewingOrder.driverName;
                     const driverFromStaff = staff.find(s => s.name === dName || s.currentOrderId === live.id);
                     const phone = live.driverPhone || driverFromStaff?.phone || 'Sin teléfono registrado';
                     const plate = live.driverPlate || driverFromStaff?.plate || 'Sin placa';
                     const vehicle = live.driverVehicle || vehicleWithModel(driverFromStaff?.vehicle, driverFromStaff?.vehicleModel) || 'Sin vehículo registrado';

                     if (dName) {
                       return (
                         <div className="bg-orange-50/50 dark:bg-stone-900 p-4 rounded-2xl border border-brand-orange/20 space-y-3">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div className="w-11 h-11 bg-brand-orange text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm">
                                 🛵
                               </div>
                               <div>
                                 <p className="font-black text-gray-900 dark:text-white text-base leading-tight">{dName}</p>
                                 <p className="text-xs text-brand-orange font-bold mt-0.5">Domiciliario Oficial Copiway</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <span className="text-xs font-mono font-bold bg-white dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-stone-700 text-gray-800 dark:text-stone-200">
                                 {plate}
                               </span>
                             </div>
                           </div>

                           <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-orange/10 text-xs">
                             <div className="text-gray-600 dark:text-stone-400">
                               <span className="block text-[10px] text-gray-400 dark:text-stone-500 uppercase font-bold">Vehículo</span>
                               <span className="font-semibold text-gray-800 dark:text-stone-200">{vehicle}</span>
                             </div>
                             <div className="text-gray-600 dark:text-stone-400">
                               <span className="block text-[10px] text-gray-400 dark:text-stone-500 uppercase font-bold">Teléfono</span>
                               <span className="font-semibold text-gray-800 dark:text-stone-200">{phone}</span>
                             </div>
                           </div>

                           <div className="flex items-center gap-2 pt-2">
                             <a
                               href={`https://wa.me/57${phone.replace(/\D/g, '')}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                             >
                               <span>WhatsApp</span>
                             </a>
                             <a
                               href={`tel:${phone}`}
                               className="py-2 px-3 bg-white dark:bg-stone-800 hover:bg-gray-100 dark:hover:bg-stone-700 text-gray-700 dark:text-stone-200 border border-gray-200 dark:border-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                             >
                               <span>Llamar</span>
                             </a>
                           </div>
                         </div>
                       );
                     }

                     return (
                       <div className="bg-gray-50 dark:bg-stone-900 p-4 rounded-xl border border-gray-100 dark:border-stone-800 text-center py-5">
                         <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-stone-800 text-gray-400 flex items-center justify-center mx-auto mb-2">
                           <User className="w-4 h-4" />
                         </div>
                         <p className="text-sm font-bold text-gray-700 dark:text-stone-300">Aún no se ha asignado un repartidor</p>
                         <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">
                           El pedido aparecerá en el módulo de Domiciliarios cuando cocina lo marque como "Listo" o cuando un domiciliario lo tome en su app.
                         </p>
                       </div>
                     );
                   })()}
                </div>

                <div>
                   <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" /> Artículos ({viewingOrder.items.length})
                   </h4>
                   <ul className="space-y-3">
                     {viewingOrder.items.map((item: OrderItem, idx: number) => {
                       const itemImage = item.product?.image || products.find(p => p.id === item.productId)?.image;
                       return (
                        <li key={idx} className="flex items-center gap-4 text-gray-800 dark:text-stone-200 bg-gray-50 dark:bg-stone-900 p-3 rounded-2xl border border-gray-100 dark:border-stone-800">
                          {itemImage ? (
                            <img src={itemImage} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-stone-700" />
                          ) : item.extras && item.extras.length > 0 ? (
                            <CustomBurgerThumb ingredientNames={item.extras.map(e => e.name)} size={64} className="!rounded-xl" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold leading-snug">
                                <span className="text-brand-orange font-black mr-1.5">{item.quantity}x</span> {item.name}
                              </span>
                              {item.price && <span className="font-black shrink-0">{formatCOP(item.price * (item.quantity || 1))}</span>}
                            </div>
                            {modificacionesDe(item).length > 0 && (
                              <ul className="mt-1.5 space-y-0.5">
                                {modificacionesDe(item).map(({ texto, tipo }, mIdx) => (
                                  <li key={mIdx} className={`text-sm font-bold ${tipo === 'sin' ? 'text-red-500' : tipo === 'extra' ? 'text-emerald-500' : 'text-gray-500 dark:text-stone-400'}`}>{texto}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </li>
                       );
                     })}
                   </ul>
                   
                   {(viewingOrder.subtotal || viewingOrder.shipping || viewingOrder.discount) ? (
                     <div className="mt-4 bg-gray-50 dark:bg-stone-900 rounded-2xl border border-gray-100 dark:border-stone-800 p-4 space-y-2.5">
                       {viewingOrder.subtotal ? (
                         <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-500 dark:text-stone-400 font-medium">Subtotal</span>
                           <span className="font-bold text-gray-700 dark:text-stone-300">{formatCOP(viewingOrder.subtotal)}</span>
                         </div>
                       ) : null}
                       {viewingOrder.shipping ? (
                         <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-500 dark:text-stone-400 font-medium flex items-center gap-1.5">
                             <Truck className="w-3.5 h-3.5" /> Domicilio
                           </span>
                           <span className="font-bold text-gray-700 dark:text-stone-300">{formatCOP(viewingOrder.shipping)}</span>
                         </div>
                       ) : null}
                       {viewingOrder.discount > 0 ? (
                         <div className="flex justify-between items-center text-sm">
                           <span className="text-emerald-600 dark:text-emerald-400 font-bold">Descuento</span>
                           <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCOP(viewingOrder.discount)}</span>
                         </div>
                       ) : null}
                       <div className="flex justify-between items-center text-lg font-black text-gray-900 dark:text-white pt-2.5 mt-1 border-t border-dashed border-gray-200 dark:border-stone-700">
                         <span>Total</span>
                         <span className="text-brand-orange">{formatCOP(viewingOrder.total)}</span>
                       </div>
                     </div>
                   ) : null}
                </div>
              </div>
              <div className="p-6 md:p-8 bg-gray-50 dark:bg-stone-900 border-t border-gray-100 dark:border-stone-800 shrink-0">
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="w-full bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta Global de Nueva Orden (HU-20) */}
      <AnimatePresence>
        {showOrderAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-brand-orange text-white shadow-2xl p-4 pr-6 rounded-[20px] w-[90%] max-w-md"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-lg">¡Nueva Orden Recibida!</p>
              <p className="text-sm font-medium text-white/90">El sistema procesó el pago y despachó a cocina.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      
      {/* Staff Modal - Perfil de Empleado (Diseño Tranquilo y Minimalista) */}
      <AnimatePresence>
        {selectedStaffInfo && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedStaffInfo(null)}
          >
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 16 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.96, opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#18181b] w-full max-w-lg rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-stone-800 flex flex-col my-6"
            >
              {/* Cabecera Limpia y Serena */}
              <div className="p-6 pb-5 flex items-center justify-between border-b border-gray-100 dark:border-stone-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-brand-orange border border-orange-100 dark:border-orange-900/30 flex items-center justify-center font-bold text-lg shrink-0">
                    {staffEditData.name ? staffEditData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'EM'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {staffEditData.name || selectedStaffInfo.name}
                      </h3>
                      {staffEditData.active ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-stone-400">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
                      {staffEditData.role} • ID: #{selectedStaffInfo.id || '0'}
                      {selectedStaffInfo.createdBy && ` • Creado por ${selectedStaffInfo.createdBy}`}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedStaffInfo(null)} 
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-gray-500 dark:text-stone-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {staffModalReadOnly ? (
              <>
              {/* Vista de Solo Lectura (Repartidores desde Gestionar Repartidores) */}
              <div className="p-6 space-y-3.5 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Rol Operativo</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {selectedStaffInfo.role === 'Ayudante de cocina' ? <ChefHat className="w-3.5 h-3.5 text-brand-orange" /> : <Package className="w-3.5 h-3.5 text-brand-orange" />}
                      {selectedStaffInfo.role}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Estado</p>
                    {selectedStaffInfo.active ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">Activo</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-stone-400">Inactivo</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Correo Electrónico</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white break-all">{selectedStaffInfo.email || 'Sin registrar'}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Teléfono</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedStaffInfo.phone || 'Sin registrar'}</p>
                </div>

                {selectedStaffInfo.role === 'Domiciliario' && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Placa</p>
                      <p className="text-sm font-bold uppercase text-gray-900 dark:text-white">{selectedStaffInfo.plate || 'Sin placa'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Vehículo</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{selectedStaffInfo.vehicle || 'Moto'}</p>
                    </div>
                    <div className="col-span-2 p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Marca y Modelo</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedStaffInfo.vehicleModel || 'Sin registrar'}</p>
                    </div>
                    <div className="col-span-2 p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-1">Base Efectivo Asignada</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{formatCOP(selectedStaffInfo.baseCash || 0)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Pie: solo lectura -- avisos y contacto, sin edicion */}
              <div className="p-4 px-6 bg-gray-50/70 dark:bg-stone-900/40 border-t border-gray-100 dark:border-stone-800 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStaffInfo(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <div className="flex-1" />
                {selectedStaffInfo.phone && (
                  <>
                    <a
                      href={`tel:${selectedStaffInfo.phone}`}
                      className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 dark:border-stone-700 text-gray-700 dark:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                    >
                      Llamar
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const clean = (selectedStaffInfo.phone || '').replace(/\D/g, '');
                        const text = encodeURIComponent(`Hola ${selectedStaffInfo.name}, te escribimos desde Copiway.`);
                        window.open(`https://wa.me/${clean.startsWith('57') ? clean : '57' + clean}?text=${text}`, '_blank');
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Enviar Aviso
                    </button>
                  </>
                )}
              </div>
              </>
              ) : (
              <>
              {/* Contenido del Formulario */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">

                {/* Nombre y Rol */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1.5">
                      Nombre Completo
                    </label>
                    <input 
                      type="text" 
                      value={staffEditData.name} 
                      onChange={e => setStaffEditData({...staffEditData, name: e.target.value})} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-gray-50/50 dark:bg-stone-900/50 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 transition-colors" 
                      placeholder="Nombre del empleado"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1.5">
                      Rol Operativo
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100/80 dark:bg-stone-900 rounded-xl border border-gray-200 dark:border-stone-700 h-[42px] items-center">
                      <button
                        type="button"
                        onClick={() => setStaffEditData({...staffEditData, role: 'Ayudante de cocina'})}
                        className={`h-full flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          staffEditData.role === 'Ayudante de cocina'
                            ? 'bg-white dark:bg-stone-800 text-brand-orange shadow-sm border border-gray-200/80 dark:border-stone-700'
                            : 'text-gray-500 dark:text-stone-400 hover:text-gray-800 dark:hover:text-stone-200'
                        }`}
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Cocina</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffEditData({...staffEditData, role: 'Domiciliario'})}
                        className={`h-full flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          staffEditData.role === 'Domiciliario'
                            ? 'bg-white dark:bg-stone-800 text-brand-orange shadow-sm border border-gray-200/80 dark:border-stone-700'
                            : 'text-gray-500 dark:text-stone-400 hover:text-gray-800 dark:hover:text-stone-200'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Domiciliario</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Correo y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1.5">
                      Correo Electrónico
                    </label>
                    <input 
                      type="email" 
                      value={staffEditData.email} 
                      onChange={e => setStaffEditData({...staffEditData, email: e.target.value})} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-gray-50/50 dark:bg-stone-900/50 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 transition-colors" 
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1.5">
                      Teléfono
                    </label>
                    <input 
                      type="tel" 
                      value={staffEditData.phone} 
                      onChange={e => setStaffEditData({...staffEditData, phone: e.target.value})} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-gray-50/50 dark:bg-stone-900/50 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 transition-colors" 
                      placeholder="300 123 4567"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300">
                      Contraseña de Acceso
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
                        setStaffEditData({ ...staffEditData, password: randomPass });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-orange/80 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3" /> Generar PIN aleatorio
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showStaffPassword ? "text" : "password"} 
                      value={staffEditData.password} 
                      onChange={e => setStaffEditData({...staffEditData, password: e.target.value})} 
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-gray-50/50 dark:bg-stone-900/50 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 transition-colors" 
                      placeholder="Contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 cursor-pointer"
                    >
                      {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* PIN de Perfil */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1.5">
                    PIN de Perfil (Opcional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={staffEditData.pin}
                    onChange={e => setStaffEditData({...staffEditData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    className="w-full pl-3.5 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-stone-700 bg-gray-50/50 dark:bg-stone-900/50 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange focus:bg-white dark:focus:bg-stone-900 transition-colors tracking-widest"
                    placeholder="Ingresa PIN"
                  />
                </div>

                {/* Si es domiciliario: datos de transporte */}
                {staffEditData.role === 'Domiciliario' && (
                  <div className="space-y-3.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1">
                          Placa
                        </label>
                        <input 
                          type="text" 
                          value={staffEditData.plate || ''} 
                          onChange={e => setStaffEditData({...staffEditData, plate: e.target.value.toUpperCase()})} 
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-semibold uppercase text-gray-900 dark:text-white outline-none focus:border-brand-orange" 
                          placeholder="ABC-123"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1">
                          Vehículo
                        </label>
                        <CustomSelect
                          value={staffEditData.vehicle || 'moto'}
                          onChange={(val) => setStaffEditData({ ...staffEditData, vehicle: val })}
                          options={[
                            { value: 'moto', label: 'Moto' },
                            { value: 'bicicleta', label: 'Bicicleta' },
                            { value: 'carro', label: 'Carro' },
                            { value: 'a_pie', label: 'A pie' },
                          ]}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1">
                        Marca y Modelo del Vehículo
                      </label>
                      <input
                        type="text"
                        value={staffEditData.vehicleModel || ''}
                        onChange={e => setStaffEditData({...staffEditData, vehicleModel: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-orange"
                        placeholder="Ej. GIXXER 155 FI"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-stone-300 mb-1">
                        Base Efectivo Asignada (Sencillo)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">$</span>
                        <input 
                          type="number" 
                          value={staffEditData.baseCash === 0 ? '' : staffEditData.baseCash} 
                          onChange={e => setStaffEditData({...staffEditData, baseCash: e.target.value === '' ? '' : parseInt(e.target.value)})} 
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-black text-gray-900 dark:text-white outline-none focus:border-brand-orange" 
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado de acceso */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-stone-900/40 border border-gray-100 dark:border-stone-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-stone-200">Estado de la cuenta</p>
                    <p className="text-[11px] text-gray-500 dark:text-stone-400">
                      {staffEditData.active ? 'Habilitado para iniciar sesión' : 'Desactivado (Soft delete, conserva historial)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaffEditData({ ...staffEditData, active: !staffEditData.active })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      staffEditData.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-stone-700'
                    }`}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        staffEditData.active ? 'translate-x-4' : 'translate-x-0'
                      }`} 
                    />
                  </button>
                </div>

                {/* Compartir por WhatsApp (Discreto y útil) */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-500 dark:text-stone-400">¿Notificar al empleado?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const text = `Hamburguer Copiway - Credenciales de Acceso\nHola ${staffEditData.name || selectedStaffInfo.name}, tus credenciales son:\nUsuario: ${staffEditData.email}\nContraseña: ${staffEditData.password}\nRol: ${staffEditData.role}`;
                        navigator.clipboard.writeText(text);
                        setCopiedStaffCreds(true);
                        setTimeout(() => setCopiedStaffCreds(false), 2500);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-stone-700 text-xs font-medium text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedStaffCreds ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedStaffCreds ? 'Copiado' : 'Copiar datos'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const text = encodeURIComponent(`Hamburguer Copiway - Credenciales de Acceso\nHola ${staffEditData.name || selectedStaffInfo.name}, tus credenciales son:\nUsuario: ${staffEditData.email}\nContraseña: ${staffEditData.password}\nRol: ${staffEditData.role}`);
                        const phoneClean = (staffEditData.phone || '').replace(/\D/g, '');
                        window.open(`https://wa.me/${phoneClean ? (phoneClean.startsWith('57') ? phoneClean : '57' + phoneClean) : ''}?text=${text}`, '_blank');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/30 text-xs font-medium hover:bg-emerald-100/60 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Botones de Pie */}
              <div className="p-4 px-6 bg-gray-50/70 dark:bg-stone-900/40 border-t border-gray-100 dark:border-stone-800 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedStaffInfo(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateStaff(selectedStaffInfo.id, {
                        name: staffEditData.name,
                        email: staffEditData.email,
                        phone: staffEditData.phone,
                        password: staffEditData.password,
                        pin: staffEditData.pin,
                        role: staffEditData.role,
                        plate: staffEditData.plate,
                        vehicle: staffEditData.vehicle,
                        vehicleModel: staffEditData.vehicleModel,
                        active: staffEditData.active,
                        baseCash: staffEditData.baseCash === '' ? 0 : staffEditData.baseCash
                      });
                      showToast('staff', 'Los datos del empleado han sido actualizados correctamente.', 'Colaborador Actualizado');
                      setSelectedStaffInfo(null);
                    } catch (err) {
                      const mensaje = err instanceof ApiError
                        ? (err.errors ? Object.values(err.errors)[0][0] : err.message)
                        : 'No se pudo actualizar el colaborador.';
                      showToast('danger', mensaje, 'No se Actualizó el Colaborador');
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors shadow-sm cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
              </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Modal */}
      <AnimatePresence>
        {selectedClientInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#151515] w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100 dark:border-stone-800 shrink-0 bg-gradient-to-br from-brand-orange/5 to-transparent">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm shadow-brand-orange/30">
                    {selectedClientInfo.name ? selectedClientInfo.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'CL'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-2xl text-gray-900 dark:text-white leading-tight">Historial del Cliente</h3>
                    <p className="text-gray-500 font-medium text-sm truncate">{selectedClientInfo.name} · {selectedClientInfo.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClientInfo(null)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-500 dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-3 overflow-y-auto">
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand-orange" /> Pedidos Realizados
                </h4>
                {orders.filter(o => o.clientPhone === selectedClientInfo.phone || o.client === selectedClientInfo.name).length === 0 ? (
                   <div className="bg-gray-50 dark:bg-stone-900 p-6 rounded-2xl border border-gray-100 dark:border-stone-800 text-center">
                     <p className="text-gray-500 text-sm font-medium">No hay pedidos registrados.</p>
                   </div>
                ) : (
                   orders.filter(o => o.clientPhone === selectedClientInfo.phone || o.client === selectedClientInfo.name).map(o => (
                     <button
                       type="button"
                       key={o.id}
                       onClick={() => { setViewingOrder(o); setSelectedClientInfo(null); }}
                       className="w-full text-left bg-gray-50 dark:bg-stone-900 border border-gray-100 dark:border-stone-800 p-4 rounded-2xl hover:border-brand-orange/40 hover:bg-orange-50/30 dark:hover:bg-stone-900/60 transition-colors cursor-pointer group"
                     >
                       <div className="flex justify-between items-center mb-2">
                         <span className="px-2.5 py-1 rounded-lg bg-brand-orange/10 text-brand-orange text-xs font-black tracking-wide">
                           {String(o.id).replace(/^#/, '')}
                         </span>
                         <div className="flex items-center gap-2">
                           <span className="font-black text-gray-900 dark:text-white">{formatCOP(o.total)}</span>
                           <ChevronRight className="w-4 h-4 text-gray-300 dark:text-stone-600 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                         </div>
                       </div>
                       <p className="text-sm text-gray-600 dark:text-stone-300 flex items-center gap-1.5">
                         <Clock className="w-3.5 h-3.5 shrink-0" /> {new Date(o.date).toLocaleString()}
                       </p>
                       <p className="text-sm text-gray-600 dark:text-stone-300 mt-1.5 flex items-center gap-1.5">
                         <span className="font-semibold">Entregado por:</span> {o.driverName || 'No asignado'}
                       </p>
                     </button>
                   ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TimePickerModal
        isOpen={showTimePicker !== null}
        onClose={() => setShowTimePicker(null)}
        initialTime={showTimePicker === 'open' ? storeConfig.openTime : storeConfig.closeTime}
        onSave={(time) => {
          if (showTimePicker === 'open') {
            updateStoreConfig({ openTime: time });
            showToast('config', `Hora de apertura actualizada a ${time}`, 'Horario');
          } else if (showTimePicker === 'close') {
            updateStoreConfig({ closeTime: time });
            showToast('config', `Hora de cierre actualizada a ${time}`, 'Horario');
          }
        }}
      />

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

      <ToastNotification 
        toast={toastData} 
        onClose={() => setToastData(null)} 
      />
    </div>
  );
}
