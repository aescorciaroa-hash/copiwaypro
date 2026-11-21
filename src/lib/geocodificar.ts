// Convierte una direccion escrita ("Calle 20 # 30-10") en coordenadas usando
// el buscador gratuito de OpenStreetMap (Nominatim). Sus reglas permiten
// maximo 1 busqueda por segundo, asi que las busquedas van en fila, y cada
// resultado se recuerda para no repetirlo mientras la pagina este abierta.

const CIUDAD = ', Neiva, Huila, Colombia';
const cache = new Map<string, Promise<[number, number] | null>>();
let fila: Promise<unknown> = Promise.resolve();

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));

async function buscar(direccion: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=' +
        encodeURIComponent(direccion + CIUDAD),
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  } catch {
    return null;
  }
}

/** Coordenadas de la direccion, o null si no se encontro. */
export function geocodificar(direccion: string): Promise<[number, number] | null> {
  const clave = direccion.trim().toLowerCase();
  if (!clave) return Promise.resolve(null);
  const previo = cache.get(clave);
  if (previo) return previo;

  const resultado = fila.then(() => buscar(direccion));
  // La siguiente busqueda espera al menos 1,1 s despues de que termine esta.
  fila = resultado.then(() => esperar(1100));
  // Si fallo (sin internet), no se guarda: se podra reintentar despues.
  resultado.then(r => { if (!r) cache.delete(clave); });
  cache.set(clave, resultado);
  return resultado;
}
