import { useEffect, useRef } from 'react';
import { useStore, Product, InventoryItem, Ingredient, InventoryLog, Staff, Order, Client, StoreConfig } from '../store/almacenAplicacion';
import { api, fetchSync, setCsrfToken } from '../servicios/api';

interface SyncData {
  products?: Product[];
  settings?: StoreConfig;
  inventory?: InventoryItem[];
  ingredients?: Ingredient[];
  inventoryLogs?: InventoryLog[];
  staff?: Staff[];
  orders?: Order[];
  clients?: Client[];
}

// Cadencia adaptativa: rapida mientras la pestana esta a la vista y hay cambios,
// y mas lenta cuando nada cambia (304 seguidos) o la pestana esta oculta.
const POLL_ACTIVE_MS = 2500;
const POLL_IDLE_MS = 6000;
const POLL_HIDDEN_MS = 20000;
const IDLE_AFTER_UNCHANGED = 6;

/**
 * Sustituye los onSnapshot de Firestore por polling corto con ETag contra
 * /api/sync (ver src/servicios/api.ts: fetchSync). Mantiene el mismo nombre y
 * posición en el árbol que el componente original (antes FirebaseSync), y llena el store
 * exactamente igual que antes — solo cambia el origen de los datos.
 */
export default function SyncDatos() {
  const {
    setProducts, setInventory, setStaff, setOrders,
    setIngredients, setInventoryLogs, setClients, setStoreConfig
  } = useStore();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const unchangedRef = useRef(0);

  useEffect(() => {
    stoppedRef.current = false;

    // window.__DATOS__ (inyectado por el layout PHP) ya trae el csrfToken y la
    // configuración de la tienda listos; evita la llamada extra a /auth/me que
    // se hacía aquí antes solo para obtener el token. En "npm run dev" (sin
    // PHP) no existe, así que se sigue pidiendo el token por API como antes.
    if (window.__DATOS__) {
      setCsrfToken(window.__DATOS__.csrfToken);
      if (window.__DATOS__.settings) setStoreConfig(window.__DATOS__.settings);
    } else {
      // /auth/csrf (a diferencia de /auth/me) no exige sesion: sin esto, un
      // invitado en "npm run dev" nunca conseguia un primer token y su
      // primer POST (login, registro) siempre fallaba con 419.
      api.get<{ csrfToken: string }>('/auth/csrf')
        .then(res => setCsrfToken(res.csrfToken))
        .catch(() => { /* red caida: el primer POST del usuario fallará y podrá reintentar */ });
    }

    const poll = async () => {
      if (stoppedRef.current) return;
      try {
        const data = await fetchSync<SyncData>();
        unchangedRef.current = data ? 0 : unchangedRef.current + 1;
        if (data) {
          if (data.products) setProducts(data.products);
          if (data.settings) setStoreConfig(data.settings);
          if (data.inventory) setInventory(data.inventory);
          if (data.ingredients) setIngredients(data.ingredients);
          if (data.inventoryLogs) setInventoryLogs(data.inventoryLogs);
          if (data.staff) setStaff(data.staff);
          if (data.orders) setOrders(data.orders);
          if (data.clients) setClients(data.clients);
        }
      } catch {
        // Error de red pasajero: se reintenta en el siguiente ciclo, sin romper la UI.
      } finally {
        if (!stoppedRef.current) {
          const delay = document.hidden
            ? POLL_HIDDEN_MS
            : unchangedRef.current >= IDLE_AFTER_UNCHANGED ? POLL_IDLE_MS : POLL_ACTIVE_MS;
          timerRef.current = setTimeout(poll, delay);
        }
      }
    };

    // Al volver a la pestana se sincroniza de inmediato (no espera el ciclo lento).
    const onVisible = () => {
      if (document.hidden || stoppedRef.current) return;
      unchangedRef.current = 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      poll();
    };
    document.addEventListener('visibilitychange', onVisible);

    poll();

    return () => {
      stoppedRef.current = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [setProducts, setInventory, setStaff, setOrders, setIngredients, setInventoryLogs, setClients, setStoreConfig]);

  return null;
}
