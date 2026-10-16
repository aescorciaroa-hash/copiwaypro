# src/components/CustomSelect.tsx

## ¿Para qué sirve?
Es una **lista desplegable** (como un `<select>`) con el diseño de la app: esquinas redondeadas,
modo oscuro, íconos opcionales y animación.

## ¿Con qué se conecta?
| Dirección | Archivo | Ejemplo de uso |
|---|---|---|
| ← lo usan | `admin/InventorySection.tsx` | Elegir categoría o unidad del insumo. |
| ← | `admin/StaffSection.tsx` | Elegir rol o vehículo. |
| ← | `admin/OverviewSection.tsx` | Elegir el período del resumen. |
| ← | `AdminDashboard.tsx` | Elegir el vehículo al editar un domiciliario. |

## Props
| Prop | Qué es |
|---|---|
| `value` | El valor elegido actualmente. |
| `onChange` | Función que recibe el nuevo valor al elegir una opción. |
| `options` | Lista de `{ value, label, icon? }`. |
| `placeholder` | Texto si no hay nada elegido (por defecto "Seleccionar..."). |
| `className`, `buttonClassName` | Clases extra para personalizar. |

## Variables
| Variable | Qué es |
|---|---|
| `isOpen` (`useState`) | Si la lista está abierta. |
| `dropdownRef` (`useRef`) | Referencia al elemento, para saber si el clic fue afuera. |
| `selectedOption` | La opción que coincide con `value` (`options.find(...)`). |

## Código explicado
```tsx
useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```
Cierra la lista si se hace clic **fuera** de ella. Al quitar el componente, se borra el evento.

```tsx
{options.map((option) => (
  <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }}>
```
`map` dibuja una fila por opción. `key` es obligatorio en listas de React (identifica cada fila).
La opción elegida se resalta en naranja y muestra un ✓.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../CustomSelect"` porque lo importan: `src/pages/AdminDashboard.tsx`, `src/pages/admin/InventorySection.tsx`, `src/pages/admin/OverviewSection.tsx`, `src/pages/admin/StaffSection.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
