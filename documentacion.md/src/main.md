# src/main.tsx

## ¿Para qué sirve?
Es el **punto de entrada de React**. Es lo primero que se ejecuta cuando el navegador carga
`main.js`. Decide **qué pantalla mostrar** y la dibuja dentro de `<div id="app">`.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo carga | `pie.php` (`main.js` compilado) o `index.html` (en `npm run dev`) | |
| ← lee | `data-pagina` del `<div id="app">` (lo pone `cabecera.php`) | Qué pantalla mostrar. |
| → muestra | una de las 8 pantallas de `src/pages/` | |
| → envuelve todo con | `ThemeProvider` (`context/ThemeContext.tsx`) | Tema claro/oscuro para toda la app. |
| → incluye | `SyncDatos` (`components/SyncDatos.tsx`) | Mantiene los datos actualizados. |
| → importa | `index.css` | Los estilos. |

## Variables
| Variable | Qué es | De dónde sale |
|---|---|---|
| `PAGINAS` | Tabla "nombre → componente": `admin → AdminDashboard`... | Escrita aquí. |
| `contenedor` | El `<div id="app">` | `document.getElementById('app')` |
| `nombrePagina` | Qué pantalla mostrar (`'admin'`, `'login'`...) | `data-pagina` del div (puesto por PHP) |
| `Pagina` | El componente elegido | `PAGINAS[nombrePagina]` |

## Código explicado
```tsx
const PAGINAS: Record<string, ComponentType> = {
  landing: Landing,
  login: Login,
  ...
};
```
`Record<string, ComponentType>` = un objeto cuyas claves son texto y cuyos valores son componentes.
Las claves **deben coincidir** con el `$pagina` de cada vista PHP (`views/paginas/*.php`).

```tsx
const nombrePagina =
  contenedor?.dataset.pagina ||
  new URLSearchParams(window.location.search).get('pagina') ||
  'landing';
```
Busca el nombre en este orden:
1. `contenedor?.dataset.pagina` → el `data-pagina="..."` que puso PHP. (`?.` = "si `contenedor` existe").
2. `?pagina=admin` en la dirección → solo para probar con `npm run dev`.
3. Si no hay nada → `'landing'`.

```tsx
const Pagina = PAGINAS[nombrePagina] || Landing;
```
Si el nombre no existe en la tabla, muestra Landing.

```tsx
createRoot(contenedor!).render(
  <StrictMode>
    <ThemeProvider>
      <SyncDatos />
      <Pagina />
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
| `<SyncDatos />` | No se ve; trae datos del servidor cada pocos segundos. |
| `<Pagina />` | La pantalla elegida. |

**No hay React Router:** para cambiar de pantalla se recarga la página con `irA('/admin')`
(en `servicios/api.ts`), y PHP decide de nuevo qué mostrar.
