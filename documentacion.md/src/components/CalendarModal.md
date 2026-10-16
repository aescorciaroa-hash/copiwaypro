# src/components/CalendarModal.tsx

## ¿Para qué sirve?
Una **ventana de calendario** para elegir una fecha, con la semana empezando en lunes y un selector de
año. El cliente la usa para cambiar su **fecha de cumpleaños** en "Mi Perfil".

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la dibuja | `pages/ClientDashboard.tsx` | `<CalendarModal isOpen={showCalendar} ... onSelectDate={(date) => setUserProfile({...userProfile, birthday: date})} />` |
| ← la abre | `pages/client/ProfileSection.tsx` | El botón de la fecha llama a `setShowCalendar(true)`. |
| → el valor termina en | `fecha_nacimiento` de CLIENTE (al guardar el perfil: `PUT /api/clients/{id}`) | Da el 15 % de descuento de cumpleaños (`PedidoService::descuentoCumpleanos()`). |
| → usa | `framer-motion` (viene instalada como parte de `motion`) e íconos de `lucide-react` | |

## Props
| Prop | Qué es |
|---|---|
| `isOpen` / `onClose` | Mostrar / cerrar. |
| `selectedDate` | Fecha elegida (`AAAA-MM-DD`). |
| `onSelectDate` | Recibe la fecha elegida. |

## Variables
| Variable | Qué es |
|---|---|
| `currentDate` | Mes que se está mirando. Al abrir se ubica en la fecha elegida (o hoy). |
| `showYearSelector` | Si se muestra la lista de años. |
| `startDayIndex` | Día de la semana del 1.º del mes, ajustado para que **lunes = 0**. |
| `monthNames`, `dayNames` | Nombres de meses y días (`LU`, `MA`...). |

## Funciones
| Función | Qué hace |
|---|---|
| `handlePrevMonth` / `handleNextMonth` | Mes anterior / siguiente. |
| `handleSelectDay(dia)` | Arma la fecha `AAAA-MM-DD` y la entrega con `onSelectDate`. |

`new Date(selectedDate + 'T00:00:00')`: se agrega la hora para que la fecha no se corra un día por la
zona horaria.

`if (!isOpen) return null;` → cerrada, no dibuja nada.
