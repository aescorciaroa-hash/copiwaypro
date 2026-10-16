# src/components/CustomDatePicker.tsx

## ¿Para qué sirve?
Un **selector de fecha** con calendario desplegable. Se usa para la **fecha de nacimiento** al
registrarse (esa fecha da el descuento de cumpleaños).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `pages/Register.tsx` | Fecha de nacimiento al registrarse. |
| → el valor termina en | la columna `fecha_nacimiento` de CLIENTE (vía `POST /api/auth/register`) | |

`ClientDashboard.tsx` también lo importa, pero no lo dibuja: en "Mi Perfil" la fecha se cambia con
`CalendarModal.tsx`.

## Props
| Prop | Qué es |
|---|---|
| `value` | La fecha elegida en formato `AAAA-MM-DD`. |
| `onChange` | Recibe `{ target: { name, value } }`: el mismo formato que un `<input>`, para funcionar con `handleChange` de `useForm`. |
| `name` | Nombre del campo (ej: `birthday`). |
| `placeholder` | Texto sin fecha ("Seleccionar fecha"). |

## Variables
| Variable | Qué es |
|---|---|
| `isOpen` | Si el calendario está abierto. |
| `currentDate` | El mes que se está viendo. Si no hay fecha, empieza **18 años atrás** (edad típica). |
| `containerRef` | Para cerrar al hacer clic afuera (igual que `CustomSelect`). |
| `daysInMonth` | Días del mes: `new Date(año, mes + 1, 0).getDate()` (el "día 0" del mes siguiente es el último de este). |
| `firstDayOfMonth` | Día de la semana en que empieza el mes (para dejar espacios vacíos). |
| `monthNames` | Nombres de los meses en español. |

## `generateDays()`
1. Agrega cuadros vacíos hasta el primer día del mes.
2. Agrega un botón por cada día, con la fecha en formato `AAAA-MM-DD`. `padStart(2, '0')` pone el cero: `5` → `05`.
3. El día elegido se pinta naranja.
4. Al tocar un día: llama a `onChange` y cierra el calendario.

Tiene botones para mes anterior/siguiente y para cambiar de año.
