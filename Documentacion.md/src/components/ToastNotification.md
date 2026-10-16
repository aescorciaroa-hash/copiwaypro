# src/components/ToastNotification.tsx

## ¿Para qué sirve?
Es el **aviso pequeño** ("toast") que aparece abajo en la pantalla por unos segundos: "Producto
agregado", "Stock actualizado", "Error"... y desaparece solo.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usan | `AdminDashboard.tsx`, `ClientDashboard.tsx`, `KitchenDashboard.tsx`, `DeliveryDashboard.tsx`, `admin/MenuSection.tsx`, `admin/InventorySection.tsx`, `admin/StaffSection.tsx`, `admin/SettingsSection.tsx`, `client/BuilderSection.tsx`, `client/CartSection.tsx` |
| → usa | `motion` e íconos de `lucide-react` |

## La interface `ToastData`
| Campo | Qué es |
|---|---|
| `type` | Tipo de aviso: `cart`, `success`, `info`, `whatsapp`, `warning`, `danger`, `staff`, `inventory`, `config`, `cierre`. Define el ícono y el color. |
| `title` | (opcional) Título. Si no se pone, se elige uno según el tipo ("Inventario Copiway", "Cierre de Caja"...). |
| `message` | El texto. |
| `duration` | (opcional) Milisegundos visible. Por defecto **3200** (3,2 segundos). |

## Props
| Prop | Qué es |
|---|---|
| `toast` | El aviso a mostrar, o `null` para no mostrar nada. |
| `onClose` | Función para cerrarlo (normalmente pone el estado del toast en `null`). |

## Cómo lo usa una pantalla
```tsx
const [toast, setToast] = useState<ToastData | null>(null);
setToast({ type: 'success', message: 'Producto guardado' });
<ToastNotification toast={toast} onClose={() => setToast(null)} />
```

## Código explicado
```tsx
useEffect(() => {
  if (!toast) return;
  const timer = setTimeout(() => onCloseRef.current(), toast.duration || 3200);
  return () => clearTimeout(timer);
}, [toast]);
```
Cada vez que llega un aviso nuevo, programa su cierre automático. Si llega otro antes, el
`clearTimeout` cancela el temporizador anterior.

`onCloseRef` (`useRef`) guarda siempre la última versión de `onClose`, para que el temporizador no use
una versión vieja.

`if (!toast) return null;` → sin aviso, no se dibuja nada.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../ToastNotification"` porque lo importan: `src/pages/AdminDashboard.tsx`, `src/pages/ClientDashboard.tsx`, `src/pages/DeliveryDashboard.tsx`, `src/pages/KitchenDashboard.tsx`, `src/pages/admin/InventorySection.tsx`, `src/pages/admin/MenuSection.tsx`, `src/pages/admin/SettingsSection.tsx`, `src/pages/admin/StaffSection.tsx`, `src/pages/client/CartSection.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
