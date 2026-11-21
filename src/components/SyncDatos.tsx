import { useEffect, useRef } from 'react';
import { useStore, Product, InventoryItem, Ingredient, InventoryLog, Staff, Order, Client, StoreConfig } from '../store/almacenAplicacion';
import { api, fetchSync, setCsrfToken } from '../servicios/api';
import { reconciliarLista, reconciliarObjeto } from '../lib/reconciliar';

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
  // Solo las funciones (no el estado): asi este componente no se redibuja con cada cambio del store.
  const setProducts = useStore(st => st.setProducts);
  const setInventory = useStore(st => st.setInventory);
  const setStaff = useStore(st => st.setStaff);
  const setOrders = useStore(st => st.setOrders);
  const setIngredients = useStore(st => st.setIngredients);
  const setInventoryLogs = useStore(st => st.setInventoryLogs);
  const setClients = useStore(st => st.setClients);
  const setStoreConfig = useStore(st => st.setStoreConfig);

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
          // Solo se guarda lo que cambio, reutilizando los elementos iguales:
          // si nada cambio no hay redibujo; si cambio un pedido, solo ese se redibuja.
          const st = useStore.getState();
          const actualizar = <T,>(nuevo: T, previo: T, guardar: (v: T) => void) => { if (nuevo !== previo) guardar(nuevo); };
          if (data.products) actualizar(reconciliarLista(st.products, data.products), st.products, setProducts);
          if (data.settings) actualizar(reconciliarObjeto(st.storeConfig, data.settings), st.storeConfig, setStoreConfig);
          if (data.inventory) actualizar(reconciliarLista(st.inventory, data.inventory), st.inventory, setInventory);
          if (data.ingredients) actualizar(reconciliarLista(st.ingredients, data.ingredients), st.ingredients, setIngredients);
          if (data.inventoryLogs) actualizar(reconciliarLista(st.inventoryLogs, data.inventoryLogs), st.inventoryLogs, setInventoryLogs);
          if (data.staff) actualizar(reconciliarLista(st.staff, data.staff), st.staff, setStaff);
          if (data.orders) actualizar(reconciliarLista(st.orders, data.orders), st.orders, setOrders);
          if (data.clients) actualizar(reconciliarLista(st.clients, data.clients), st.clients, setClients);
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
