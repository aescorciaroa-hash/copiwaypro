# vite.config.ts

## ¿Para qué sirve?
Configura cómo se compila React.

## ¿Qué hace?
- compila `src/` y deja el resultado en `public/assets/` (main.js y main.css)
- en `npm run dev`, manda las llamadas `/api` al Apache de Laragon

## ¿Con qué se conecta?
- **Se usa con:** `npm run build` y `npm run dev`.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | `npm run build` deja de funcionar bien |
