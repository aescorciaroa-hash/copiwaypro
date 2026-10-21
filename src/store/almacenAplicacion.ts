import { create } from 'zustand';
import { api } from '../servicios/api';
import type { DatosCheckout } from '../lib/pasarela';

export interface ProductComponent {
  id?: string;
  name: string;
  cost?: number;
  quantity?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
  image?: string;
  ingredients?: ProductComponent[];
  packaging?: ProductComponent[];
  category?: string;
  prepTime?: number;
  badge?: string;
  costPrice?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  totalCost?: number;
  unitCost?: number;
  unit?: string;
  category?: string;
  supplier?: string;
  notes?: string;
  image?: string;
  createdAt?: string;
}
export interface InventoryLog {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  amount: number;
  type: 'Entrada' | 'Salida';
  reason: string;
  totalCost?: number;
  unitCost?: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  password?: string;
  location?: [number, number];
  currentOrderId?: string;
  currentOrderIds?: string[];
  destCoords?: [number, number] | null;
  plate?: string;
  vehicle?: string;
  vehicleModel?: string;
  baseCash?: number;
  pin?: string;
  hasPin?: boolean;
  createdBy?: string | null;
}

export interface NamedRef {
  id: string;
  name: string;
}

export interface OrderItem {
  id?: string;
  product?: Product;
  productId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  basePrice?: number;
  finalPrice?: number;
  isCustom?: boolean;
  stack?: NamedRef[];
  extras?: NamedRef[];
  removed?: NamedRef[];
  modifications?: string[];
}

export interface Order {
  paymentMethod?: string;
  digitalBank?: 'nequi' | 'daviplata' | 'bancolombia' | null;
  paymentStatus?: string;
  id: string;
  status: 'Pendiente' | 'En Preparación' | 'Listos' | 'En Camino' | 'Entregado' | 'Pagado' | 'entregado';
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  driverVehicle?: string;
  deliveryPin?: string | null;
  requiresDeliveryPin?: boolean;
  total: number;
  items: OrderItem[];
  address: string;
  date: string;
  rating?: number;
  reviewText?: string;
  clientPhone?: string;
  client?: string;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  /** Puntos que el cliente canjeó en este pedido y su valor en pesos. */
  pointsRedeemed?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
  /** Por dónde llegó: 'web', 'llamada' o 'whatsapp'. */
  channel?: 'web' | 'llamada' | 'whatsapp';
  /** Pedido manual de alguien sin cuenta de cliente. */
  isGuest?: boolean;
  time?: string;
  readyAt?: string | null;
  paymentTransactionId?: string;
  preparedBy?: string | null;
  lat?: number;
  lng?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  price: number;
  category: string;
  stock?: number;
  image?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  ordersCount?: number;
  totalSpent?: number;
  points?: number;
  lastOrderDate?: string;
  notifications?: Notification[];
  birthday?: string;
  /** Carrito del cliente, con la forma que use la UI de ClientDashboard (CartItem). */
  cart?: unknown[];
  preferences?: {
    theme?: string;
    soundEnabled?: boolean;
  };
}

export interface StoreConfig {
  openTime: string;
  closeTime: string;
  isOpen?: boolean;
  isPaused?: boolean;
  shippingRate: number;
  profitMargin?: number;
  /** Valor en pesos de 1 punto al canjearlo, y mínimo de puntos para poder canjear. */
  pointValue?: number;
  minPointsToRedeem?: number;
  /** Datos del negocio que se imprimen en el ticket de cocina. */
  business?: BusinessInfo;
  categories?: string[];
}

export interface BusinessInfo {
  name: string;
  nit: string;
  address: string;
  phone: string;
  instagram: string;
  website: string;
}

/** Pedido por llamada o WhatsApp que registra el administrador (se paga en efectivo al entregar). */
export interface ManualOrderInput {
  clientName: string;
  clientPhone: string;
  address: string;
  channel: 'llamada' | 'whatsapp';
  items: OrderItem[];
}

// Antes traia 8 categorias de ejemplo ("Hamburguesas de Pan", "Perros
// Calientes", etc.) que se mostraban como fallback en Landing/MenuSection
// cada vez que storeConfig.categories venia vacio -- el admin veia un menu
// "lleno" de categorias que nunca creo. Vacio a proposito: sin categorias
// reales, la UI debe mostrar un estado vacio real, no datos inventados.
export const DEFAULT_MENU_CATEGORIES: string[] = [];

interface AppState {
  products: Product[];
  inventory: InventoryItem[];
  staff: Staff[];
  orders: Order[];
  /** true tras el primer setOrders con datos reales del servidor (ver SyncDatos). Evita que la UI confunda la carga inicial de pedidos con una orden nueva. */
  ordersSynced: boolean;
  ingredients: Ingredient[];
  clients: Client[];
  storeConfig: StoreConfig;
  inventoryLogs: InventoryLog[];

  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  setInventory: (inventory: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  updateInventoryStock: (id: string, amount: number) => Promise<void>;
  setInventoryLogs: (logs: InventoryLog[]) => void;
  addInventoryLog: (log: InventoryLog) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;

  setStaff: (staff: Staff[]) => void;
  addStaff: (employee: Staff) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string, role?: string) => Promise<void>;

  setOrders: (orders: Order[]) => void;
  /** pointsToUse: cuántos puntos quiere canjear el cliente en este pedido (0 = ninguno). */
  addOrder: (order: Order, pointsToUse?: number) => Promise<void>;
  /** Pedido manual del administrador; devuelve el pedido creado (con su número real). */
  addManualOrder: (input: ManualOrderInput) => Promise<Order>;
  /** Pide al servidor monto, referencia y firma para iniciar el pago digital (pasarela de prueba). */
  prepareOnlinePayment: (order: Pick<Order, 'items' | 'address'>, pointsToUse?: number) => Promise<DatosCheckout>;
  /** El admin corrige la dirección de un pedido en curso (se guarda en el servidor). */
  updateOrderAddress: (id: string, address: string) => Promise<void>;
  /** El domiciliario guarda las coordenadas del destino que ubicó en su mapa. */
  saveOrderDestination: (id: string, coords: [number, number]) => Promise<void>;
  /** El domiciliario envía su ubicación GPS real. */
  updateDriverLocation: (id: string, coords: [number, number]) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  takeOrder: (id: string) => Promise<void>;
  releaseOrder: (id: string) => Promise<void>;
  driverName?: string;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  /** Entrega con PIN verificado en el servidor (regla de negocio 8). */
  confirmDelivery: (id: string, pin: string) => Promise<void>;

  setIngredients: (ingredients: Ingredient[]) => void;

  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  changeClientPassword: (id: string, currentPassword: string, newPassword: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  setStoreConfig: (config: StoreConfig) => void;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  removeCategory: (category: string) => Promise<void>;
}

// -- Mapeos entre el status que usa el frontend (español, con mayúsculas) y el
// -- que usan las rutas de transición del backend PHP --
const STATUS_TO_ENDPOINT: Record<string, string> = {
  'En Preparación': 'preparing',
  'Listos': 'ready',
  'En Camino': 'accept',
  'Entregado': 'deliver',
  'entregado': 'deliver',
};

/** Traduce un ítem del carrito de ClientDashboard al contrato que espera POST /api/orders. */
function toApiOrderItem(item: OrderItem) {
  const quantity = item.quantity || 1;

  if (item.isCustom && (item.stack || item.extras) && !item.product) {
    const stack = (item.stack || item.extras || []).map((ing: NamedRef) => ({ id: ing.id, name: ing.name }));
    return { quantity, stack };
  }

  return {
    productId: item.product?.id || item.productId || item.id,
    quantity,
    extras: (item.extras || []).map((e: NamedRef) => ({ id: e.id, name: e.name })),
    removed: (item.removed || []).map((r: NamedRef) => ({ id: r.id, name: r.name })),
  };
}

export const useStore = create<AppState>()((set, get) => ({
  products: [],
  inventory: [],
  staff: [],
  orders: [],
  ordersSynced: false,
  ingredients: [],
  clients: [],
  inventoryLogs: [],
  storeConfig: {
    openTime: '11:00',
    closeTime: '23:00',
    isOpen: true,
    shippingRate: 5000,
    profitMargin: 30,
    categories: DEFAULT_MENU_CATEGORIES
  },

  setProducts: (products) => set({ products }),
  addProduct: async (product) => {
    const created = await api.post<Product>('/products', product);
    set(state => ({ products: [created, ...state.products] }));
  },
  updateProduct: async (id, updates) => {
    const updated = await api.put<Product>(`/products/${id}`, updates);
    set(state => ({ products: state.products.map(p => p.id === id ? updated : p) }));
  },
  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
    set(state => ({ products: state.products.filter(p => p.id !== id) }));
  },

  setInventory: (inventory) => set({ inventory }),
  addInventoryItem: async (item) => {
    const created = await api.post<InventoryItem>('/inventory', item);
    set(state => ({ inventory: [created, ...state.inventory] }));
  },
  updateInventoryItem: async (id, updates) => {
    const updated = await api.put<InventoryItem>(`/inventory/${id}`, updates);
    set(state => ({ inventory: state.inventory.map(i => i.id === id ? updated : i) }));
  },
  updateInventoryStock: async (id, amount) => {
    const updated = await api.patch<InventoryItem>(`/inventory/${id}/stock`, { amount });
    set(state => ({ inventory: state.inventory.map(i => i.id === id ? updated : i) }));
  },
  deleteInventoryItem: async (id) => {
    await api.delete(`/inventory/${id}`);
    set(state => ({ inventory: state.inventory.filter(i => i.id !== id) }));
  },
  setInventoryLogs: (logs) => set({ inventoryLogs: logs }),
  addInventoryLog: async (log) => {
    // Los logs ahora se generan siempre del lado del servidor (altas, ajustes,
    // ventas); no existe un endpoint para insertarlos manualmente desde el cliente.
    set(state => ({ inventoryLogs: [log, ...state.inventoryLogs] }));
  },

  setStaff: (staff) => set({ staff }),
  addStaff: async (employee) => {
    const created = await api.post<Staff>('/staff', employee);
    set(state => ({ staff: [...state.staff, created] }));
  },
  updateStaff: async (id, updates) => {
    const updated = await api.put<Staff>(`/staff/${id}`, updates);
    // id_ayudante e id_domiciliario son autoincrementales POR TABLA: un
    // "Ayudante de cocina" y un "Domiciliario" distintos pueden compartir el
    // mismo id numerico. Filtrar solo por id aqui actualizaria en el estado
    // local (por error) a cualquier otro miembro de staff con ese mismo id
    // pero de otro rol -- por eso tambien se exige que coincida el role.
    set(state => ({ staff: state.staff.map(s => (s.id === id && s.role === updated.role) ? updated : s) }));
  },
  deleteStaff: async (id, role) => {
    // Borrado permanente: el servidor solo lo permite si el colaborador no tiene
    // historial de pedidos (si lo tiene responde 409 y hay que darlo de baja).
    // role es obligatorio: el mismo id puede existir en cocina y en domicilio
    // (ver comentario de updateStaff arriba y Personal::eliminarPermanente).
    await api.delete(`/staff/${id}${role ? `?role=${encodeURIComponent(role)}` : ''}`);
    set(state => ({ staff: state.staff.filter(s => !(s.id === id && (!role || s.role === role))) }));
  },

  setOrders: (orders) => set({ orders, ordersSynced: true }),
  addOrder: async (order, pointsToUse = 0) => {
    const payload = {
      items: (order.items || []).map(toApiOrderItem),
      address: order.address,
      paymentMethod: order.paymentMethod === 'online' ? 'online' : 'cash',
      bank: order.paymentMethod === 'online' ? order.digitalBank : undefined,
      paymentTransactionId: order.paymentMethod === 'online' ? order.paymentTransactionId : undefined,
      usePoints: pointsToUse > 0,
      pointsToUse,
    };
    const created = await api.post<Order>('/orders', payload);
    set(state => ({ orders: [created, ...state.orders] }));
  },
  addManualOrder: async (input) => {
    const created = await api.post<Order>('/orders/manual', {
      ...input,
      items: input.items.map(toApiOrderItem),
    });
    set(state => ({ orders: [created, ...state.orders] }));
    return created;
  },
  prepareOnlinePayment: async (order, pointsToUse = 0) => {
    return api.post<DatosCheckout>('/payments/prepare', {
      items: (order.items || []).map(toApiOrderItem),
      address: order.address,
      usePoints: pointsToUse > 0,
      pointsToUse,
    });
  },
  updateOrderAddress: async (id, address) => {
    const updated = await api.patch<Order>(`/orders/${encodeURIComponent(id)}/address`, { address });
    set(state => ({ orders: state.orders.map(o => o.id === id ? updated : o) }));
  },
  saveOrderDestination: async (id, coords) => {
    await api.patch(`/orders/${encodeURIComponent(id)}/destination`, { lat: coords[0], lng: coords[1] });
  },
  updateDriverLocation: async (id, coords) => {
    await api.patch(`/staff/${encodeURIComponent(id)}/location`, { lat: coords[0], lng: coords[1] });
  },
  updateOrderStatus: async (id, status) => {
    const endpoint = STATUS_TO_ENDPOINT[status];
    if (!endpoint) {
      // Transición no soportada por el backend (p.ej. no existe un endpoint
      // genérico "set status": cada paso del flujo tiene su propia regla).
      return;
    }
    const updated = await api.patch<Order>(`/orders/${encodeURIComponent(id)}/${endpoint}`);
    set(state => ({ orders: state.orders.map(o => o.id === id ? updated : o) }));
  },
  releaseOrder: async (id) => {
    const updated = await api.patch<Order>(`/orders/${encodeURIComponent(id)}/release`);
    set(state => ({ orders: state.orders.map(o => o.id === id ? updated : o) }));
  },
  takeOrder: async (id) => {
    const updated = await api.patch<Order>(`/orders/${encodeURIComponent(id)}/take`);
    set(state => ({ orders: state.orders.map(o => o.id === id ? updated : o) }));
  },
  updateOrder: async (id, updates) => {
    // Único caso soportado hoy por el backend: calificación del cliente (rating/reviewText).
    if ('rating' in updates || 'reviewText' in updates) {
      const updated = await api.patch<Order>(`/orders/${encodeURIComponent(id)}/review`, {
        rating: updates.rating,
        reviewText: updates.reviewText,
      });
      set(state => ({ orders: state.orders.map(o => o.id === id ? updated : o) }));
      return;
    }
    set(state => ({ orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o) }));
  },
  deleteOrder: async (id) => {
    // No existe borrado de pedidos en el backend (regla 11: se archivan, no se
    // borran, en el cierre de caja). Se deja el estado local intacto.
  },
  confirmDelivery: async (id, pin) => {
    const updated = await api.patch<Order>(`/orders/${encodeURIComponent(id)}/deliver`, { pin });
    set(state => ({ orders: state.orders.map(o => o.id === id ? updated : o) }));
  },

  setIngredients: (ingredients) => set({ ingredients }),

  setClients: (clients) => set({ clients }),
  addClient: async (client) => {
    // El alta real de clientes ocurre en /api/auth/register (con Habeas Data).
    // Esta acción queda para compatibilidad de firma y solo actualiza el estado local.
    set(state => ({ clients: [...state.clients, client] }));
  },
  updateClient: async (id, updates) => {
    const updated = await api.put<Client>(`/clients/${id}`, updates);
    set(state => ({ clients: state.clients.map(c => c.id === id ? updated : c) }));
  },
  changeClientPassword: async (id, currentPassword, newPassword) => {
    await api.put(`/clients/${id}/password`, { currentPassword, newPassword });
  },
  deleteClient: async (id) => {
    set(state => ({ clients: state.clients.filter(c => c.id !== id) }));
  },

  setStoreConfig: (config) => set({ storeConfig: config }),

  updateStoreConfig: async (config) => {
    const updated = await api.put<StoreConfig>('/settings', config);
    set({ storeConfig: updated });
  },

  addCategory: async (category: string) => {
    const clean = category.trim();
    if (!clean) return;
    const currentCategories = get().storeConfig.categories || DEFAULT_MENU_CATEGORIES;
    if (!currentCategories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      await api.post('/settings/categories', { category: clean });
      const newCategories = [...currentCategories, clean];
      set(state => ({ storeConfig: { ...state.storeConfig, categories: newCategories } }));
    }
  },

  removeCategory: async (category: string) => {
    await api.delete(`/settings/categories/${encodeURIComponent(category)}`);
    const currentCategories = get().storeConfig.categories || DEFAULT_MENU_CATEGORIES;
    const newCategories = currentCategories.filter(c => c !== category);
    set(state => ({ storeConfig: { ...state.storeConfig, categories: newCategories } }));
  }
}));
