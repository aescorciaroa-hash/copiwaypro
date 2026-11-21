// Cuando llegan datos nuevos del servidor, reutiliza los objetos que no
// cambiaron (mismo contenido) en vez de reemplazarlos por copias nuevas.
// Asi React solo vuelve a dibujar lo que de verdad cambio: con cientos de
// pedidos, antes cada sincronizacion redibujaba TODOS y el panel se trababa.

function igual(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Devuelve `anterior` tal cual si nada cambio; si cambio algo, un arreglo nuevo
 * que reutiliza los elementos (por `id`) cuyo contenido es identico.
 */
export function reconciliarLista<T extends { id?: string | number }>(anterior: T[] | undefined, nueva: T[]): T[] {
  if (!anterior) return nueva;
  if (anterior.length === 0) return nueva.length === 0 ? anterior : nueva; // [] -> [] no es un cambio
  const porId = new Map<string | number, T>();
  for (const el of anterior) {
    if (el && el.id != null) porId.set(el.id, el);
  }
  let cambio = anterior.length !== nueva.length;
  const resultado = nueva.map((el, i) => {
    const previo = el && el.id != null ? porId.get(el.id) : undefined;
    if (previo !== undefined && igual(previo, el)) {
      if (anterior[i] !== previo) cambio = true; // mismo elemento, otra posicion
      return previo;
    }
    cambio = true;
    return el;
  });
  return cambio ? resultado : anterior;
}

/** Igual que reconciliarLista pero para un objeto suelto (p. ej. la configuracion). */
export function reconciliarObjeto<T>(anterior: T | undefined, nuevo: T): T {
  return anterior !== undefined && igual(anterior, nuevo) ? anterior : nuevo;
}
