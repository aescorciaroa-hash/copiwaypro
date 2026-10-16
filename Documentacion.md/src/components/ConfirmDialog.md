# src/components/ConfirmDialog.tsx

## ¿Para qué sirve?
Es la **ventana de confirmación** ("¿Seguro que deseas eliminar...?") con un botón para cancelar y otro
para confirmar. Reemplaza al `confirm()` feo del navegador.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usan | `AdminDashboard.tsx`, `ClientDashboard.tsx`, `KitchenDashboard.tsx`, `DeliveryDashboard.tsx` |
| → usa | `motion` (animaciones de entrada y salida) e íconos de `lucide-react` |

## Props (lo que recibe)
| Prop | Qué es |
|---|---|
| `isOpen` | `true` para mostrarla. |
| `title`, `message` | Título y texto. |
| `details` | (opcional) Contenido extra, por ejemplo una lista. |
| `confirmText`, `cancelText` | Texto de los botones (por defecto "Confirmar" y "Cancelar"). |
| `type` | `'danger'` (rojo, papelera), `'warning'` (ámbar), `'success'` (verde) o `'info'` (naranja). |
| `onConfirm`, `onCancel` | Funciones que se ejecutan al tocar cada botón. |

## Cómo la usa una pantalla
```tsx
const [confirmModal, setConfirmModal] = useState({ isOpen: false, ... });

<ConfirmDialog
  isOpen={confirmModal.isOpen}
  title="Eliminar producto"
  message="Esta acción no se puede deshacer."
  type="danger"
  onConfirm={() => { borrar(); setConfirmModal({ ...confirmModal, isOpen: false }); }}
  onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
/>
```
La ventana no se cierra sola: la pantalla que la usa cambia `isOpen` a `false`.

## Código explicado
| Parte | Qué hace |
|---|---|
| `getIcon()` | Con `switch (type)` elige el ícono y los colores. |
| `getConfirmButtonClasses()` | Elige el color del botón de confirmar. |
| `<AnimatePresence>` | Permite animar también la **salida** (cuando `isOpen` pasa a `false`). |
| Fondo oscuro (`motion.div` con `onClick={onCancel}`) | Tocar fuera de la ventana la cancela. |
| `motion.div` con `initial` / `animate` / `exit` | La ventana aparece creciendo y desaparece encogiéndose. |
| `z-[30000]` | Siempre queda por encima de todo. |
| `React.FC<ConfirmDialogProps>` | "Componente que recibe estas props" (tipo de TypeScript). |
