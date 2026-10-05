// Cliente de la pasarela de pagos de PRUEBA (mecanica tipo Wompi, sin cobrar
// nada real). El servidor decide monto, referencia y firma; aqui solo se crea
// la transaccion y se espera su resultado. Ver app/Services/PagoService.php.

import { api } from '../servicios/api';

export interface DatosCheckout {
  currency: string;
  amountInCents: number;
  reference: string;
  signature: string;
  sandbox: boolean;
  total: number;
}

export type EstadoTransaccion = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface TransaccionPago {
  id: string;
  status: EstadoTransaccion;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method: string;
  status_message: string;
}

export function crearTransaccion(datos: DatosCheckout, method: string, phone: string): Promise<TransaccionPago> {
  return api.post<TransaccionPago>('/payments/transactions', {
    reference: datos.reference,
    amountInCents: datos.amountInCents,
    signature: datos.signature,
    method,
    phone,
  });
}

const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Consulta la transaccion cada segundo hasta que deja de estar PENDING (maximo ~40 s). */
export async function esperarResultado(id: string): Promise<TransaccionPago> {
  let tx = await api.get<TransaccionPago>('/payments/transactions/' + encodeURIComponent(id));
  for (let i = 0; i < 40 && tx.status === 'PENDING'; i++) {
    await esperar(1000);
    tx = await api.get<TransaccionPago>('/payments/transactions/' + encodeURIComponent(id));
  }
  return tx;
}
