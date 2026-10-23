# src/pages/client/ProfileSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Mi Perfil"**: el cliente ve y edita su nombre, teléfono, dirección y fecha de
cumpleaños; ve sus puntos; cambia su contraseña; y (en el celular) cierra sesión.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `ClientDashboard.tsx` cuando `activeTab === 'profile'` | |
| → cambia | `userProfile` del padre (`setUserProfile`) | Mientras escribe. |
| → Guardar | `onSaveProfile` = `handleSaveProfile()` del padre → `updateClient` → `PUT /api/clients/{id}` → `Cliente::actualizar()` | |
| → Descartar | `onDiscardProfile` = `handleDiscardProfile()` del padre | Vuelve a los datos guardados. |
| → fecha | `setShowCalendar(true)` → abre `CalendarModal` | |
| → contraseña | `setShowPasswordModal(true)` → ventana del padre → `PUT /api/clients/{id}/password` | |
| → salir | `handleLogout` | |

## Props
| Prop | Qué es |
|---|---|
| `userProfile` / `setUserProfile` | Datos del perfil. |
| `setShowCalendar` | Abrir el calendario del cumpleaños. |
| `setShowPasswordModal` | Abrir el cambio de contraseña. |
| `handleLogout` | Cerrar sesión. |
| `onSaveProfile`, `onDiscardProfile` | Guardar / descartar. |
| `isSavingProfile` | `true` mientras se guarda (desactiva el botón). |

## Cómo se ve
- **Encabezado naranja:** un círculo con las **iniciales** del cliente, su nombre y correo, y a la derecha
  una tarjeta con sus **puntos** ("Úsalos al pagar tu pedido").
- **Información Personal:** los campos van en dos columnas (en celular, una), cada uno con su ícono
  (persona, sobre, teléfono, calendario, ubicación). Abajo, el aviso del 15 % de cumpleaños: cambia el texto
  si el cliente ya puso su fecha o no.
- **Seguridad:** una fila con el candado, el texto y el botón "Cambiar Contraseña".

## Variables
| Variable | Qué es |
|---|---|
| `campo`, `etiqueta`, `icono` | El estilo (clases de Tailwind) que comparten todas las cajas de texto, sus títulos y sus íconos. Se escriben una sola vez y se reusan. |
| `iniciales` | Las primeras letras del nombre (ej. "Edgar Escorcia" → "EE"), para el círculo del encabezado. `split(' ')` separa las palabras, `map(n => n[0])` toma la primera letra de cada una y `substring(0, 2)` deja solo dos. |

Escribir en los campos **no guarda** nada en el servidor: solo el botón "Guardar Cambios" lo hace.
Cambiar la fecha de cumpleaños cambia el día en que se aplica el 15 % de descuento.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../ProfileSection"` porque lo importan: `src/pages/ClientDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
