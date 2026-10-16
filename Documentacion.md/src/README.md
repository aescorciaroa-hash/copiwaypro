# src/ — el frontend (React + TypeScript)

Todo lo que el usuario **ve y toca** está aquí. Esta carpeta **no la ejecuta PHP**: se compila con
`npm run build` y el resultado queda en `public/assets/main.js` y `main.css`.

## Cómo se conecta con PHP
```
PHP (cabecera.php)                    React (src/)
──────────────────                    ────────────
<div id="app" data-pagina="admin">  → main.tsx elige la pantalla AdminDashboard
window.__DATOS__ = {usuario, ...}   → servicios/api.ts y SyncDatos.tsx lo leen
                                      │
/api/... (JSON)                     ← servicios/api.ts hace fetch()
                                    → store/almacenAplicacion.ts guarda los datos
                                    → las pantallas (pages/) los muestran
```

## Carpetas
| Carpeta | Qué contiene |
|---|---|
| [main.tsx](main.md) | Punto de entrada: elige qué pantalla mostrar. |
| [global.d.ts](global.d.md) | Tipos de `window.__DATOS__` y `window.__APP_BASE__`. |
| [index.css](index.css.md) | Estilos globales y Tailwind. |
| [servicios/](servicios/) | `api.ts`: la **única** puerta para hablar con PHP. |
| [store/](store/) | `almacenAplicacion.ts`: los datos compartidos de toda la app. |
| [components/](components/) | Piezas reutilizables (barra de navegación, diálogos, selectores...). |
| [context/](context/) | `ThemeContext.tsx`: tema claro/oscuro. |
| [hooks/](hooks/) | `useForm.ts`: manejo de formularios. |
| [lib/](lib/) | Funciones de ayuda: formato de dinero, pasarela de pago, notificaciones push. |
| [utils/](utils/) | Sonidos y el PDF del cierre de caja. |
| [pages/](pages/) | Las **pantallas**: Landing, Login, paneles de admin, cliente, cocina y domiciliario. |

---

## React en 5 minutos (lo necesario para leer este código)

### 1. Componente
Una **función** que devuelve lo que se ve en pantalla. Su nombre empieza con mayúscula.
```tsx
export default function Footer() {
  return <footer>CopiwayPRO</footer>;
}
```

### 2. JSX
Ese "HTML dentro de JavaScript" se llama **JSX**. Diferencias con HTML:
| HTML | JSX |
|---|---|
| `class="..."` | `className="..."` |
| `onclick="..."` | `onClick={funcion}` |
| texto fijo | `{variable}` muestra el valor de una variable |

### 3. Props (parámetros de un componente)
```tsx
<ConfirmDialog isOpen={true} title="¿Eliminar?" onConfirm={borrar} />
```
El componente las recibe así: `function ConfirmDialog({ isOpen, title, onConfirm }) { ... }`.

### 4. Estado: `useState`
Una variable que, al cambiar, **vuelve a dibujar** la pantalla.
```tsx
const [abierto, setAbierto] = useState(false);
// abierto     → el valor actual
// setAbierto  → función para cambiarlo: setAbierto(true)
```

### 5. Efectos: `useEffect`
Código que se ejecuta **después de dibujar**, por ejemplo para pedir datos o iniciar un temporizador.
```tsx
useEffect(() => {
  // se ejecuta cuando cambia "x"
  return () => { /* limpieza al salir */ };
}, [x]);
```
- `[]` vacío = solo una vez, al aparecer el componente.
- La función que se devuelve (`return () => ...`) se ejecuta al quitar el componente.

### 6. Otros hooks que verás
| Hook | Para qué |
|---|---|
| `useRef` | Guardar un valor que **no** redibuja la pantalla (temporizadores, referencias a elementos). |
| `useMemo` | Guardar un cálculo y solo repetirlo cuando cambian sus datos. |
| `useCallback` | Lo mismo, pero para funciones. |
| `useStore()` | (de Zustand) Leer los datos compartidos de `store/almacenAplicacion.ts`. |
| `useTheme()` | (propio) Leer y cambiar el tema claro/oscuro. |

### 7. TypeScript
Es JavaScript con **tipos**:
```ts
interface Product { id: string; name: string; price: number; }
const precio: number = 15000;
function sumar(a: number, b: number): number { return a + b; }
```
- `interface` describe la forma de un objeto.
- `?` en `image?: string` = opcional.
- `string | null` = puede ser texto o `null`.

### 8. `async` / `await`
Para esperar algo que tarda (como una respuesta del servidor):
```ts
const producto = await api.post('/products', datos);
```

### 9. Tailwind CSS
Los estilos se escriben como **clases** dentro de `className`:
| Clase | Significa |
|---|---|
| `p-4` | padding (relleno) |
| `bg-orange-500` | fondo naranja |
| `text-white` | texto blanco |
| `rounded-xl` | esquinas redondeadas |
| `dark:bg-stone-900` | fondo oscuro **solo en modo oscuro** |
| `md:flex` | `display:flex` solo en pantallas medianas o más grandes |
