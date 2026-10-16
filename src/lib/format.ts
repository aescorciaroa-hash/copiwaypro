/** El backend siempre antepone "#" al id visible del pedido (#ORD-1); en toda
 * la UI se muestra sin ese numeral -- solo se conserva internamente porque
 * Pedido::porIdVisible lo usa para reconocer el formato. */
export const orderCode = (id?: string | null): string => String(id ?? '').replace(/^#/, '');

export const formatCOP = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Staff.vehicle guarda el valor crudo del ENUM de la BD ('moto','bicicleta',
// 'carro','a_pie') en minuscula -- el selector ya lo muestra bonito
// ("Moto") pero varias vistas (tarjeta del repartidor, lista de la flota)
// lo imprimian directo sin pasar por esta traduccion.
const VEHICLE_LABELS: Record<string, string> = {
  moto: 'Moto',
  bicicleta: 'Bicicleta',
  carro: 'Carro',
  a_pie: 'A pie',
};

export const vehicleLabel = (vehicle?: string | null): string => {
  if (!vehicle) return '';
  return VEHICLE_LABELS[vehicle] ?? (vehicle.charAt(0).toUpperCase() + vehicle.slice(1));
};

/** "Moto - GIXXER 155 FI" si hay modelo, si no solo "Moto". */
export const vehicleWithModel = (vehicle?: string | null, model?: string | null): string => {
  const label = vehicleLabel(vehicle);
  const modeloLimpio = (model || '').trim();
  if (!label) return modeloLimpio;
  return modeloLimpio ? `${label} - ${modeloLimpio}` : label;
};

export interface Modificacion {
  texto: string;
  tipo: 'sin' | 'extra' | 'ingrediente';
}

/**
 * Personalizaciones de un producto del pedido para mostrar en cocina y en el
 * panel del admin: lo quitado ("SIN Cebolla", en rojo) y lo agregado ("EXTRA
 * Queso", en verde). El servidor las envía en `removed` y `extras`. En la
 * hamburguesa del Creador Interactivo `extras` es su receta completa, así que
 * se listan como ingredientes y no como "EXTRA".
 */
export const modificacionesDe = (item: { name?: string; removed?: { name: string }[]; extras?: { name: string }[] }): Modificacion[] => {
  const esCreador = item.name === 'Hamburguesa Personalizada';
  return [
    ...(item.removed || []).map(r => ({ texto: `SIN ${r.name}`, tipo: 'sin' as const })),
    ...(item.extras || []).map(e => esCreador
      ? { texto: e.name, tipo: 'ingrediente' as const }
      : { texto: `EXTRA ${e.name}`, tipo: 'extra' as const }),
  ];
};
