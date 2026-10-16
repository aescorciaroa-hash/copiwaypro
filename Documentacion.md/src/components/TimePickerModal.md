# src/components/TimePickerModal.tsx

## ¿Para qué sirve?
Una ventana con un **reloj** para elegir una hora (como en los celulares Android): primero la hora,
después los minutos, y AM/PM.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `pages/AdminDashboard.tsx` | Elegir la hora de apertura y de cierre de la tienda. |
| → el valor termina en | `horario_apertura` / `horario_cierre` de CONFIGURACION_SISTEMA (vía `PUT /api/settings`) | |

## Props
| Prop | Qué es |
|---|---|
| `isOpen` | Mostrar u ocultar. |
| `initialTime` | Hora inicial en formato 24 h (`"18:30"`). |
| `onSave` | Recibe la hora elegida en formato 24 h (`"HH:mm"`). |
| `onClose` | Cerrar sin guardar. |

## Variables
| Variable | Qué es |
|---|---|
| `hours` | Hora de 1 a 12. |
| `minutes` | Minutos de 0 a 59. |
| `period` | `'AM'` o `'PM'`. |
| `selecting` | Si se está eligiendo `'hours'` o `'minutes'`. |

## Conversiones de hora
Al abrir (24 h → 12 h):
```ts
setPeriod(h >= 12 ? 'PM' : 'AM');
setHours(h % 12 || 12);   // 18 → 6, 0 → 12
```
Al guardar (12 h → 24 h):
```ts
if (period === 'PM' && h !== 12) h += 12;   // 6 PM → 18
if (period === 'AM' && h === 12) h = 0;     // 12 AM → 0
```

## El reloj (`getClockNumbers`)
Coloca 12 números en círculo con trigonometría:
```ts
const angle = (i * 30) - 90;          // 360° / 12 = 30° entre números; -90 para que el 12 quede arriba
const x = radius * Math.cos(rad);
const y = radius * Math.sin(rad);
```
En modo minutos muestra 0, 5, 10... 55.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../TimePickerModal"` porque lo importan: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
