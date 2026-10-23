# index.html

## ¿Para qué sirve?
Página que se usa solo en modo desarrollo (`npm run dev`).

## ¿Qué hace?
- carga `src/main.tsx`
- en el sistema real no se usa: la página la arma PHP (`views/layouts/`)

## ¿Con qué se conecta?
- **Se usa con:** `npm run dev` y `npm run build`.

## ¿Qué pasa si se borra?
| Si se borra… | Qué pasa |
|---|---|
| el archivo | `npm run build` y `npm run dev` fallan |
