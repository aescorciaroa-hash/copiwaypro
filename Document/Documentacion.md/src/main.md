# src/main.tsx

## ¿Para qué sirve?
Es el **punto de entrada de React**. Es lo primero que se ejecuta cuando el navegador carga
`main.js`. Decide **qué pantalla mostrar** y la dibuja dentro de `<div id="app">`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `pie.php` (`main.js` compilado) o `index.html` (en `npm run dev`) | |
| ← lee | `data-pagina` del `<div id="app">` (lo pone `cabecera.php`) | Qué pantalla mostrar. |
| → muestra | una de las 9 pantallas de `src/pages/` (incluye `PagarPedido.tsx`, el link de pago) | |
| → envuelve todo con | `ThemeProvider` (`context/ThemeContext.tsx`) | Tema claro/oscuro para toda la app. |
| → incluye | `SyncDatos` (`components/SyncDatos.tsx`) | Mantiene los datos actualizados. |
| → importa | `index.css` | Los estilos. |
| → llama a | `registrarModoSinInternet()` (`lib/modoSinInternet.ts`) | Instala el Service Worker para la carga rápida y el modo sin internet. |

## Variables
| Variable | Qué es | De dónde sale |
|---|---|---|
| `PAGINAS` | Tabla "nombre → cómo descargar la pantalla": `admin → () => import('./pages/AdminDashboard')`... | Escrita aquí. |
| `contenedor` | El `<div id="app">` | `document.getElementById('app')` |
| `nombrePagina` | Qué pantalla mostrar (`'admin'`, `'login'`...) | `data-pagina` del div (puesto por PHP) |
| `cargarPagina` | La función que descarga la pantalla elegida | `PAGINAS[nombrePagina]` |
| `Pagina` | La pantalla, lista para dibujarse cuando termine de bajar | `lazy(cargarPagina)` |

## Código explicado
```tsx
const PAGINAS: Record<string, () => Promise<{default: ComponentType}>> = {
  landing: () => import('./pages/Landing'),
  login: () => import('./pages/Login'),
  ...
};
```
**Cada pantalla se descarga solo cuando se abre.** `import('./pages/Login')` (con paréntesis) significa
"trae ese archivo **cuando** te lo pida", no al cargar la página. Al compilar, cada pantalla queda en su propio
archivo dentro de `public/assets/chunks/`. Así el login no descarga el admin, ni los mapas, ni los gráficos.
Antes todo iba en un solo `main.js` de 2,4 MB; ahora `main.js` pesa unos 195 KB (62 KB comprimido).

Las claves **deben coincidir** con el `$pagina` de cada vista PHP (`views/paginas/*.php`).

```tsx
function Cargando() { ... }
```
Lo que se ve **el instante** en que la pantalla se está descargando: un círculo naranja girando.

```tsx
const nombrePagina =
  contenedor?.dataset.pagina ||
  new URLSearchParams(window.location.search).get('pagina') ||
  '';
```
Busca el nombre en este orden:
1. `contenedor?.dataset.pagina` → el `data-pagina="..."` que puso PHP. (`?.` = "si `contenedor` existe").
2. `?pagina=admin` en la dirección → solo para probar con `npm run dev`.
3. Si no hay nada → texto vacío `''`.

```tsx
const cargarPagina = PAGINAS[nombrePagina];

if (!cargarPagina) {
  contenedor!.textContent = `Pantalla no encontrada: "${nombrePagina}". ...`;
} else {
  const Pagina = lazy(cargarPagina);
  createRoot(contenedor!).render(...);
}
```
Si el nombre no existe en la tabla, **no** abre otra pantalla en su lugar: muestra
`Pantalla no encontrada: "..."`. `lazy(...)` = convierte la descarga en un componente que React dibuja
cuando termina de bajar.

```tsx
createRoot(contenedor!).render(
  <StrictMode>
    <ThemeProvider>
      <SyncDatos />
      <Suspense fallback={<Cargando />}>
        <Pagina />
      </Suspense>
    </ThemeProvider>
  </StrictMode>,
);
```
| Parte | Qué hace |
|---|---|
| `createRoot(contenedor!)` | Crea la app de React dentro del div. `!` = "confío en que existe". |
| `.render(...)` | Dibuja lo que está adentro. |
| `<StrictMode>` | Modo de React que avisa de errores comunes mientras se programa. |
| `<ThemeProvider>` | Comparte el tema con todos los componentes de adentro. |
| `<SyncDatos />` | No se ve; trae datos del servidor cada pocos segundos. Empieza **mientras** baja la pantalla. |
| `<Suspense fallback={<Cargando />}>` | Mientras la pantalla se descarga, muestra `<Cargando />`. |
| `<Pagina />` | La pantalla elegida. |

```tsx
registrarModoSinInternet();
```
Instala el Service Worker (`public/sw.js`), que guarda los archivos para que la próxima vez todo abra al
instante y funcione sin internet. Ver `lib/modoSinInternet.md`.

**No hay React Router:** para cambiar de pantalla se recarga la página con `irA('/admin')`
(en `servicios/api.ts`), y PHP decide de nuevo qué mostrar.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla (`index.html` lo carga) y ninguna pantalla se dibuja. |
| Una línea de `PAGINAS` (ej. `admin: () => import('./pages/AdminDashboard'),`) | Esa pantalla muestra `Pantalla no encontrada: "admin"`. |
| `<Suspense fallback={<Cargando />}>` | La página sale en blanco con un error de React ("A component suspended..."). |
| `registrarModoSinInternet();` | Todo funciona con internet, pero sin internet no abre. |
| `<SyncDatos />` | Todas las pantallas se quedan sin datos (no se llama a `/api/sync`). |
