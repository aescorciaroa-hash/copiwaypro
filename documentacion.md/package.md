# package.json

## ¿Para qué sirve?
Es el equivalente a `composer.json` pero para **JavaScript/React**. Lista las librerías del frontend y
los **comandos** del proyecto. Las librerías se descargan en `node_modules/` con:
```
npm install
```

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| → crea | `node_modules/` | Las librerías descargadas. |
| → `package-lock.json` | (archivo generado) | Versiones exactas instaladas. No se edita a mano. |
| → usa | `vite.config.ts` | Configuración de `npm run dev` y `npm run build`. |
| ← lo usas tú | La terminal | `npm install` y `npm run build`. |

## Comandos (`scripts`)
| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre un servidor de desarrollo en `http://localhost:3000` que recarga solo al guardar cambios en `src/`. |
| `npm run build` | **Compila** todo `src/` en `public/assets/main.js` y `main.css`. Hay que ejecutarlo después de cambiar algo en React para verlo en Laragon. |
| `npm run preview` | Muestra el resultado compilado. |
| `npm run lint` | Revisa errores de TypeScript sin compilar (`tsc --noEmit`). |

## Librerías (`dependencies`)
| Librería | Para qué | Dónde se usa |
|---|---|---|
| `react`, `react-dom` | La librería para construir las pantallas. | Todo `src/` |
| `vite`, `@vitejs/plugin-react` | Compila y sirve el proyecto. | `vite.config.ts` |
| `tailwindcss`, `@tailwindcss/vite` | Estilos con clases (`bg-orange-500`, `p-4`...). | Todo `src/`, `src/index.css` |
| `zustand` | Guardar el estado compartido (productos, pedidos...). | `src/store/almacenAplicacion.ts` |
| `lucide-react` | Íconos. | Casi todos los componentes |
| `motion` | Animaciones. | Componentes con transiciones |
| `leaflet`, `react-leaflet` | Mapas. | `admin/MapSection.tsx`, `admin/OrdersSection.tsx`, `DeliveryDashboard.tsx`, `Landing.tsx` |
| `recharts` | Gráficas. | `admin/OverviewSection.tsx` |
| `jspdf` | Crear PDF. | `src/utils/generarCierrePdf.ts` |

`devDependencies` son herramientas que solo se usan al programar (TypeScript y los "tipos" de las
librerías), no hacen parte del resultado final.
