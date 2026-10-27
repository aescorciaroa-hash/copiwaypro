# src/lib/modoSinInternet.ts

## ¿Para qué sirve?
Instala el **Service Worker** (`public/sw.js`) en **todas** las páginas. Ese Service Worker guarda los
archivos del sistema en el navegador para que cada vista abra rápido y funcione aunque no haya internet.

Antes solo se instalaba cuando el cliente activaba las notificaciones; ahora se instala siempre.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo llama | `src/main.tsx` | Al final, `registrarModoSinInternet()`. |
| → instala | `public/sw.js` | El Service Worker. |
| → usa | `rutaBase()` de `src/servicios/api.ts` | Para saber la carpeta del proyecto (`/copiwaypro`). |

## Código explicado
```ts
if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
```
Si el navegador no sabe usar Service Workers (muy viejo), no hace nada. La app funciona igual.

```ts
if (!document.getElementById('app')?.dataset.pagina) return;
```
Solo las páginas que entrega PHP traen `data-pagina`. En `npm run dev` no existe `sw.js`, así que no se instala.

```ts
const base = rutaBase() || '/';
const scope = base.endsWith('/') ? base : base + '/';
```
`scope` = la carpeta que controla el Service Worker (ej. `/copiwaypro/`). Se asegura de que termine en `/`.

```ts
window.addEventListener('load', () => {
  navigator.serviceWorker.register(`${base}/sw.js`, { scope }).catch(() => {});
});
```
Espera a que la página termine de cargar (`load`) para no robarle velocidad, y entonces instala `sw.js`.
Si falla, no pasa nada grave: solo no queda guardada para usarse sin internet.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | `npm run build` falla (`main.tsx` lo importa) |
| la línea `register(...)` | todo funciona con internet, pero **sin internet no abre ninguna vista** (salvo para clientes que activaron notificaciones) |
