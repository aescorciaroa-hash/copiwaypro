// Service Worker de CopiwayPRO. Hace dos cosas:
//
// 1) MODO SIN INTERNET Y CARGA RAPIDA: guarda en el navegador (Cache Storage)
//    los archivos del sistema para que cada vista abra rapido y siga
//    funcionando aunque se caiga el internet:
//    - Codigo y estilos (assets/): se guardan la primera vez y despues se
//      sirven al instante desde el navegador.
//    - Paginas y datos de la API: primero se piden al servidor (asi siempre
//      se ve lo mas nuevo); si no hay conexion, se muestra lo ultimo guardado.
//    - Fotos, mapas y la letra Inter: se guardan y se reutilizan.
//    Al iniciar o cerrar sesion se borran las paginas y datos guardados, para
//    que otra persona en el mismo equipo no vea la informacion anterior.
//
// 2) NOTIFICACIONES PUSH (Web Push / VAPID): muestra la notificacion nativa
//    del sistema cuando llega un pedido, aunque la pestaña este cerrada.
//
// Si algo falla aqui, la app normal sigue funcionando igual.

// Cambiar este numero borra todo lo guardado en los navegadores (por si algun dia hace falta).
const VERSION = 'v2';
const CACHE_CODIGO = `copiway-codigo-${VERSION}`;   // assets/main.js, main.css y assets/chunks/*
const CACHE_PAGINAS = `copiway-paginas-${VERSION}`; // HTML de cada vista
const CACHE_API = `copiway-api-${VERSION}`;         // respuestas GET de /api/*
const CACHE_MEDIA = `copiway-media-${VERSION}`;     // fotos, letra, iconos
const CACHE_MAPAS = `copiway-mapas-${VERSION}`;     // cuadritos del mapa (OpenStreetMap)
const CACHES_VALIDOS = [CACHE_CODIGO, CACHE_PAGINAS, CACHE_API, CACHE_MEDIA, CACHE_MAPAS];

// Carpeta donde vive la app (ej. http://localhost/copiwaypro/)
const BASE = self.registration.scope;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Borra lo guardado por versiones anteriores de este archivo
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(n => n.startsWith('copiway-') && !CACHES_VALIDOS.includes(n)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// ---------- Ayudantes ----------

/**
 * Guarda una copia sin hacer esperar a la pagina. Si falla (por ejemplo, la
 * pagina pidio el mismo archivo dos veces a la vez y ya se estaba guardando),
 * no pasa nada: el archivo igual se entrega.
 */
function guardar(cache, request, respuesta) {
  cache.put(request, respuesta.clone()).catch(() => {});
}

/** Deja como maximo `max` archivos en ese cache (borra los mas viejos). */
async function recortar(nombreCache, max) {
  const cache = await caches.open(nombreCache);
  const claves = await cache.keys();
  for (let i = 0; i < claves.length - max; i++) {
    await cache.delete(claves[i]);
  }
}

/** Sirve lo guardado; si no esta, lo descarga y lo guarda. */
async function primeroGuardado(request, nombreCache, max) {
  const cache = await caches.open(nombreCache);
  const guardado = await cache.match(request);
  if (guardado) return guardado;
  const respuesta = await fetch(request);
  // "opaque" = foto de otro sitio (Unsplash, mapas): no se puede leer pero si guardar
  if (respuesta.ok || respuesta.type === 'opaque') {
    guardar(cache, request, respuesta);
    if (max) recortar(nombreCache, max).catch(() => {});
  }
  return respuesta;
}

/** Pide al servidor; si no hay conexion, sirve lo ultimo guardado. */
async function primeroServidor(request, nombreCache, max) {
  const cache = await caches.open(nombreCache);
  try {
    const respuesta = await fetch(request);
    // No se guardan redirecciones (ej. sesion vencida → /login) ni errores
    if (respuesta.ok && !respuesta.redirected && respuesta.type === 'basic') {
      guardar(cache, request, respuesta);
      if (max) recortar(nombreCache, max).catch(() => {});
    }
    return respuesta;
  } catch (error) {
    const guardado = await cache.match(request) || await cache.match(request, { ignoreSearch: true });
    if (guardado) return guardado;
    throw error;
  }
}

/** main.css lleva ?v=fecha: al guardar una version nueva se borran las viejas. */
async function codigoVersionado(request) {
  const cache = await caches.open(CACHE_CODIGO);
  const guardado = await cache.match(request);
  if (guardado) return guardado;
  try {
    const respuesta = await fetch(request);
    if (respuesta.ok) {
      const ruta = new URL(request.url).pathname;
      const claves = await cache.keys();
      await Promise.all(claves.filter(c => new URL(c.url).pathname === ruta).map(c => cache.delete(c)));
      guardar(cache, request, respuesta);
    }
    return respuesta;
  } catch (error) {
    // Sin conexion y sin esa version exacta: sirve la ultima que haya
    const anterior = await cache.match(request, { ignoreSearch: true });
    if (anterior) return anterior;
    throw error;
  }
}

/** Pagina sencilla para cuando no hay internet y esa vista nunca se abrio antes. */
function paginaSinConexion() {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión · CopiwayPRO</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f6f4;font-family:system-ui,sans-serif;color:#1c1917;text-align:center;padding:24px}
@media (prefers-color-scheme:dark){body{background:#0c0a09;color:#fafaf9}}
.c{max-width:340px}.i{width:64px;height:64px;margin:0 auto 16px;border-radius:20px;background:#ff6b00;display:flex;align-items:center;justify-content:center;color:#fff;font-size:30px}
h1{font-size:20px;margin:0 0 8px}p{margin:0 0 20px;color:#78716c;font-size:14px}
button{border:0;border-radius:14px;background:#ff6b00;color:#fff;font-weight:700;padding:12px 20px;font-size:14px;cursor:pointer}</style></head>
<body><div class="c"><div class="i">⚡</div><h1>Sin conexión a internet</h1><p>Esta vista todavía no se había abierto en este equipo. Cuando vuelva la conexión, se cargará normalmente.</p><button onclick="location.reload()">Reintentar</button></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ---------- Peticiones ----------

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Iniciar o cerrar sesion: se borran las paginas y datos guardados de la persona anterior
  if (request.method === 'POST' && url.href.startsWith(BASE + 'api/auth/')) {
    event.waitUntil(Promise.all([caches.delete(CACHE_PAGINAS), caches.delete(CACHE_API)]));
    return;
  }

  // Solo se guardan las peticiones de lectura (GET); el resto va directo al servidor
  if (request.method !== 'GET') return;

  // --- Archivos de la misma app ---
  if (url.href.startsWith(BASE)) {
    // Pedazos de codigo con codigo unico en el nombre: nunca cambian
    if (url.pathname.includes('/assets/chunks/')) {
      event.respondWith(primeroGuardado(request, CACHE_CODIGO));
      return;
    }
    // main.js va sin ?v= (siempre la misma direccion): primero el servidor, sin internet el guardado
    if (url.pathname.endsWith('/assets/main.js')) {
      event.respondWith(primeroServidor(request, CACHE_CODIGO));
      return;
    }
    // main.css (versionado con ?v=)
    if (url.pathname.endsWith('/assets/main.css')) {
      event.respondWith(codigoVersionado(request));
      return;
    }
    // Datos de la API: siempre lo mas nuevo; sin conexion, lo ultimo guardado
    if (url.href.startsWith(BASE + 'api/')) {
      event.respondWith(primeroServidor(request, CACHE_API, 150));
      return;
    }
    // Abrir una vista (pagina completa)
    if (request.mode === 'navigate') {
      event.respondWith(primeroServidor(request, CACHE_PAGINAS, 30).catch(() => paginaSinConexion()));
      return;
    }
    // Iconos, imagenes subidas por el admin, manifest...
    if (/\.(png|jpe?g|webp|gif|svg|ico|json)$/i.test(url.pathname)) {
      event.respondWith(primeroServidor(request, CACHE_MEDIA, 200));
      return;
    }
    return;
  }

  // --- Archivos de otros sitios ---
  // Letra Inter (Google Fonts)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(primeroGuardado(request, CACHE_MEDIA, 200));
    return;
  }
  // Fotos de Unsplash (portada, logins, menu)
  if (url.hostname === 'images.unsplash.com') {
    event.respondWith(primeroGuardado(request, CACHE_MEDIA, 200));
    return;
  }
  // Cuadritos del mapa (OpenStreetMap / CARTO)
  if (url.hostname.endsWith('tile.openstreetmap.org') || url.hostname.endsWith('basemaps.cartocdn.com')) {
    event.respondWith(primeroGuardado(request, CACHE_MAPAS, 600));
    return;
  }
});

// ---------- Notificaciones push ----------

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'CopiwayPRO', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'CopiwayPRO';
  const options = {
    body: data.body || '',
    icon: 'favicon.svg',
    badge: 'favicon.svg',
    tag: data.tag || 'copiway-pedido',
    data: { url: data.url || '.' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '.', self.registration.scope).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
