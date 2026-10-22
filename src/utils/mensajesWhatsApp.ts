import { Order } from '../store/almacenAplicacion';
import { formatCOP } from '../lib/format';
import { rutaBase } from '../servicios/api';

/** Dirección completa de una página de la app (ej. "/register"). */
const urlDe = (ruta: string) => window.location.origin + rutaBase() + ruta;

/** Link que abre el cliente para pagar su pedido manual. */
export const urlLinkPago = (codigo: string) => urlDe(`/pagar?c=${codigo}`);

/** Celular en el formato que pide WhatsApp: con el 57 de Colombia y solo números. */
const telefonoWhatsApp = (telefono: string) => {
  const digitos = telefono.replace(/\D/g, '');
  return digitos.length === 10 ? `57${digitos}` : digitos;
};

/** Abre WhatsApp (web o app) con el chat del cliente y el mensaje ya escrito. */
export const abrirWhatsApp = (telefono: string, mensaje: string) => {
  window.open(`https://wa.me/${telefonoWhatsApp(telefono)}?text=${encodeURIComponent(mensaje)}`, '_blank');
};

const listaProductos = (order: Order) =>
  (order.items || []).map(i => `• ${i.quantity}x ${i.name}`).join('\n');

/** Invitación a registrarse para un cliente sin cuenta, con los beneficios. */
export const invitacionRegistro = (puntos: number) =>
  `🎁 *¿Sabías que con este pedido te habrías ganado ${puntos} puntos?*\n` +
  `Regístrate gratis en CopiwayPRO con este mismo celular y obtén:\n` +
  `⭐ Puntos en cada compra para canjear por descuentos\n` +
  `🎂 15% de descuento el día de tu cumpleaños\n` +
  `📍 Seguimiento de tu pedido en tiempo real\n` +
  `👉 ${urlDe('/register')}`;

/** Mensaje con el link de pago (pedido que todavía no va a cocina). */
export const mensajeLinkPago = (order: Order) => {
  const hora = order.paymentLinkExpiresAt
    ? new Date(order.paymentLinkExpiresAt.replace(' ', 'T')).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '';
  let texto =
    `Hola ${order.client || ''} 👋\n` +
    `Gracias por tu pedido en *CopiwayPRO* 🍔\n\n` +
    `*Pedido ${order.id}*\n${listaProductos(order)}\n\n` +
    `*Total a pagar: ${formatCOP(order.total)}*\n` +
    `Paga aquí con Nequi, Daviplata o Bancolombia 👉 ${urlLinkPago(order.paymentLinkCode || '')}\n\n` +
    `⏰ El link vence${hora ? ` a las ${hora}` : ' en 30 minutos'}. Cuando pagues, tu pedido pasa a cocina y te mostramos tu código de entrega.`;
  if (order.isGuest) texto += `\n\n${invitacionRegistro(order.pointsEarned || 0)}`;
  return texto;
};

/** Mensaje de confirmación de un pedido en efectivo, con el código de entrega. */
export const mensajeConfirmacionEfectivo = (order: Order) => {
  let texto =
    `Hola ${order.client || ''} 👋\n` +
    `Tu pedido *${order.id}* de *CopiwayPRO* ya está en cocina 🍔\n\n` +
    `${listaProductos(order)}\n\n` +
    `*Total a pagar en efectivo: ${formatCOP(order.total)}*\n` +
    `📍 ${order.address}\n\n` +
    `🔐 Tu código de entrega es *${order.deliveryPin || ''}*. Dáselo al domiciliario cuando llegue.`;
  if (order.isGuest) texto += `\n\n${invitacionRegistro(order.pointsEarned || 0)}`;
  return texto;
};
