# tsconfig.json

## ¿Para qué sirve?
Configura **TypeScript**: el lenguaje del frontend (`.ts` y `.tsx`). TypeScript es JavaScript con
**tipos** (decir "esta variable es un número", "este objeto tiene `name` y `price`"), lo que ayuda a
encontrar errores antes de ejecutar.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usan | `npm run lint` (`tsc --noEmit`), Vite y el editor (VS Code) |
| → aplica a | todo `src/` |

## Opciones importantes
| Opción | Qué significa |
|---|---|
| `"target": "ES2022"` | Versión de JavaScript que se genera. |
| `"lib": ["ES2022", "DOM", ...]` | Permite usar las funciones del navegador (`document`, `window`, `fetch`). |
| `"jsx": "react-jsx"` | Entiende la sintaxis de React (`<div>...</div>` dentro del código). |
| `"moduleResolution": "bundler"` | Busca los `import` como lo hace Vite. |
| `"paths": {"@/*": ["./*"]}` | El atajo `@/` = raíz del proyecto (igual que en `vite.config.ts`). |
| `"noEmit": true` | TypeScript solo **revisa**; quien compila de verdad es Vite. |
| `"skipLibCheck": true` | No revisa las librerías de `node_modules` (más rápido). |
| `"resolveJsonModule": true` | Permite importar archivos `.json`. |
| `"allowJs": true` | También acepta archivos `.js`. |
