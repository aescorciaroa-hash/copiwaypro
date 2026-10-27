# 18 · Velocidad y modo sin internet

Esta guía explica, en palabras sencillas, **qué se hizo para que el sistema cargue rápido** y **siga
funcionando aunque se caiga el internet**.

## El problema que había
- **Todo el sistema se descargaba de una vez.** `main.js` pesaba **2,4 MB** y traía la tienda, el admin, la
  cocina, los domiciliarios, los mapas, los gráficos y el generador de PDF. Quien abría el login descargaba
  también el admin completo.
- **Nada viajaba comprimido.** Laragon trae apagada la compresión de Apache.
- **Sin internet no abría nada.** El Service Worker solo servía para las notificaciones.

## Lo que se hizo

| # | Qué | Dónde | Resultado |
|---|---|---|---|
| 1 | **Cada pantalla en su propio archivo** | `src/main.tsx` + `vite.config.ts` | El login baja ~3,5 KB propios (comprimido) en vez de 2,4 MB. |
| 2 | **Librerías pesadas aparte** (mapas, gráficos, PDF) | `vite.config.ts` (`manualChunks`) | Solo las bajan las vistas que las usan. El PDF (785 KB) solo se descarga al generar un cierre de caja. |
| 3 | **Archivos comprimidos (.gz)** | `vite.config.ts` + `public/.htaccess` | `main.js` 195 KB → 62 KB; `main.css` 246 KB → 34 KB. |
| 4 | **Datos de la API comprimidos** | `public/index.php` (`ob_gzhandler`) | `/api/sync` (se pide cada pocos segundos) viaja ~55 % más liviano. |
| 5 | **El navegador guarda los archivos** | `public/.htaccess` (`Cache-Control`) | En la segunda visita, el código no se vuelve a descargar. |
| 6 | **Modo sin internet** | `public/sw.js` + `src/lib/modoSinInternet.ts` | Las vistas ya abiertas antes funcionan sin conexión, con los últimos datos. |
| 7 | **Fotos más livianas y "perezosas"** | Todas las pantallas (`loading="lazy"`) | Las fotos que no se ven todavía se descargan cuando vas llegando a ellas. La de la portada bajó de 2400 px calidad 100 a 1920 px calidad 75. |
| 8 | **La letra Inter se pide en paralelo** | `views/layouts/cabecera.php` | Antes esperaba a que bajara el CSS; ahora se pide al mismo tiempo. |

## ¿Qué funciona sin internet?
| Funciona | No funciona (necesita el servidor) |
|---|---|
| Abrir cualquier vista que ya se haya abierto antes en ese equipo | Iniciar sesión (hay que verificar el usuario y el PIN) |
| Ver los últimos pedidos, productos y datos que se cargaron | Guardar cambios: crear pedidos, marcar listo, entregar, pagar |
| Las fotos y los pedazos del mapa que ya se vieron | Ver datos nuevos (llegan cuando vuelve la conexión) |
| Cambiar entre modo claro y oscuro | |

Cuando vuelve la conexión, `SyncDatos` trae los datos nuevos solo, sin recargar.

**Seguridad:** al iniciar o cerrar sesión se borran las páginas y los datos guardados, para que otra persona
en el mismo equipo no vea la información anterior.

## ¿Cómo lo pruebo?
1. Ejecuta `npm run build`.
2. Abre una vista con internet, por ejemplo `/kitchen`, y espera a que cargue.
3. Presiona **F12 → Network** y marca **Offline** (o desconecta el wifi).
4. Recarga la página: debe abrir igual.
5. En **F12 → Application → Cache Storage** se ven los cajones `copiway-...` con lo guardado.

## ¿Y si algo se ve viejo después de un cambio?
- `main.css` lleva `?v=fecha` y `main.js` se revisa siempre con el servidor (`no-cache`): el navegador baja la versión nueva solo.
- **Ojo:** `main.js` debe ir **sin `?v=`** en `pie.php` y `cabecera.php`. Si se le pone, React arranca dos veces y la página sale en negro (ver [pie.md](../../views/layouts/pie.md)).
- Los archivos de `assets/chunks/` tienen un código en el nombre que cambia con el contenido.
- Si aun así hace falta borrar todo lo guardado en todos los navegadores: en `public/sw.js` cambia
  `const VERSION = 'v2';` por `'v3'`.
- En un solo navegador: **F12 → Application → Storage → Clear site data**.

## Archivos relacionados
- [src/main.tsx](../../src/main.md)
- [src/lib/modoSinInternet.ts](../../src/lib/modoSinInternet.md)
- [public/sw.js](../../public/sw.md)
- [public/.htaccess](../../public/.htaccess.md)
- [public/index.php](../../public/index.md)
- [views/layouts/cabecera.php](../../views/layouts/cabecera.md)
- [vite.config.ts](../../vite.config.md)
