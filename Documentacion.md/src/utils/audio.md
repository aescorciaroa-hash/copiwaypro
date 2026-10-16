# src/utils/audio.ts

## ¿Para qué sirve?
Produce los **sonidos de alerta** (la campana cuando llega un pedido nuevo y una alarma de inventario)
**sin archivos de audio**: los genera con la **Web Audio API** del navegador, como un sintetizador.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `KitchenDashboard.tsx` | Campana con cada pedido nuevo, botón para activar/silenciar el sonido. |
| ← lo usa | `AdminDashboard.tsx` | Campana con cada pedido nuevo. |
| → guarda en | `localStorage` con la clave `copiway_sound_enabled` | Recordar si el sonido está activado. |

## La clase `SoundEffects`
Al final del archivo se crea **un solo objeto** que usa toda la app:
```ts
export const soundFx = new SoundEffects();
```
Las pantallas lo usan así: `soundFx.playOrderBell()`.

| Variable de la clase | Para qué |
|---|---|
| `ctx` | El "AudioContext": el motor de sonido del navegador. Se crea solo cuando se necesita. |
| `soundEnabled` | `true` si el sonido está activado (empieza con lo guardado en `localStorage`). |

| Método | Qué hace |
|---|---|
| `getContext()` (privado) | Crea el motor de sonido la primera vez. Si el navegador lo "pausó", lo reanuda. |
| `isEnabled()` | ¿Está activado el sonido? |
| `setEnabled(valor)` | Activa o desactiva el sonido y lo guarda. |
| `toggleSound()` | Cambia el estado. Si queda activado, suena la campana como prueba. |
| `playOrderBell()` | Campana de 3 notas (Do, Mi y Sol agudos): "llegó un pedido". |
| `playCriticalAlert()` | Sonido corto y áspero para alertas de inventario. Existe, pero hoy ninguna pantalla lo usa. |

## Cómo se genera un sonido
```ts
const osc = ctx.createOscillator();   // genera una onda (el tono)
const gain = ctx.createGain();        // controla el volumen
osc.frequency.setValueAtTime(1046.5, now);                 // nota (en Hz)
gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);  // el volumen baja hasta casi 0
osc.connect(gain);
gain.connect(ctx.destination);        // destination = los parlantes
osc.start(now);
osc.stop(now + 0.5);
```
`type` es la forma de la onda: `sine` (suave), `triangle`, `sawtooth` (áspero).

`try { ... } catch`: muchos navegadores bloquean el sonido hasta que el usuario hace clic en algo;
si falla, solo se avisa en la consola.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../audio"` porque lo importan: `src/pages/AdminDashboard.tsx`, `src/pages/KitchenDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
