import { jsPDF } from 'jspdf';
import type { Order } from '../store/almacenAplicacion';

export interface CierreDataForPDF {
  date: string;
  totalVentas: number;
  totalOrdenes: number;
  activeOrdersCount: number;
  desglose: {
    efectivo: number;
    digital: number;
  };
  insumosConsumidos: Array<{ name: string; used: number; unit?: string; cost?: number }>;
  costoInsumos?: number;
  costoDomicilios?: number;
  ventasProducto?: number;
  gananciaBruta?: number;
  margen?: number;
  liquidaciones?: Array<{ driverName: string; ordersCount: number; cashCollected: number; base: number; totalDue: number }>;
}

type RGB = [number, number, number];

const C = {
  orange: [234, 88, 12] as RGB,
  orangeSoft: [255, 237, 213] as RGB,
  ink: [28, 25, 23] as RGB,
  text: [68, 64, 60] as RGB,
  muted: [120, 113, 108] as RGB,
  line: [231, 229, 228] as RGB,
  paper: [250, 250, 249] as RGB,
  green: [22, 163, 74] as RGB,
  greenSoft: [220, 252, 231] as RGB,
  blue: [37, 99, 235] as RGB,
  blueSoft: [219, 234, 254] as RGB,
  red: [220, 38, 38] as RGB,
  redSoft: [254, 226, 226] as RGB,
  white: [255, 255, 255] as RGB,
};

export function generateCierrePDF(data: CierreDataForPDF, orders: Order[] = []): { doc: jsPDF; blobUrl: string; download: () => void } {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14; // margen lateral
  const contentW = pageW - M * 2;
  const bottomLimit = pageH - 18;
  let y = 0;

  const formatCOP = (val: number) => `$ ${Math.round(val).toLocaleString('es-CO')}`;
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: 'normal' | 'bold' | 'italic', size: number) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  // ---------------------------------------------------------------- helpers
  const ensureSpace = (h: number) => {
    if (y + h > bottomLimit) {
      doc.addPage();
      y = 18;
    }
  };

  const sectionTitle = (title: string, subtitle?: string) => {
    ensureSpace(16);
    fill(C.orange);
    doc.roundedRect(M, y, 1.6, 8, 0.8, 0.8, 'F');
    font('bold', 11);
    color(C.ink);
    doc.text(title, M + 5, y + 4);
    if (subtitle) {
      font('normal', 8);
      color(C.muted);
      doc.text(subtitle, M + 5, y + 8);
    }
    y += subtitle ? 13 : 11;
  };

  /** Segmento de anillo (donut) como poligono relleno. Angulos en grados, 0 = arriba, sentido horario. */
  const ringSegment = (cx: number, cy: number, rOut: number, rIn: number, a0: number, a1: number, c: RGB) => {
    const steps = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 4));
    const pts: Array<[number, number]> = [];
    const pt = (r: number, a: number): [number, number] => {
      const rad = ((a - 90) * Math.PI) / 180;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };
    for (let i = 0; i <= steps; i++) pts.push(pt(rOut, a0 + ((a1 - a0) * i) / steps));
    for (let i = steps; i >= 0; i--) pts.push(pt(rIn, a0 + ((a1 - a0) * i) / steps));
    const deltas = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
    fill(c);
    stroke(c);
    doc.setLineWidth(0.1);
    doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], 'FD', true);
  };

  // ---------------------------------------------------------------- portada / cabecera
  // Banner naranja redondeado (estilo original)
  fill(C.orange);
  doc.roundedRect(M, 14, contentW, 26, 3, 3, 'F');

  font('bold', 17);
  color(C.white);
  doc.text('HAMBURGUER COPIWAY', M + 6, 24.5);
  font('normal', 8.5);
  color([255, 240, 230]);
  doc.text('DARK KITCHEN — REPORTE OFICIAL DE CIERRE DE CAJA', M + 6, 31.5);

  font('bold', 10);
  color(C.white);
  doc.text(data.date, pageW - M - 6, 23.5, { align: 'right' });
  font('normal', 8);
  color([255, 240, 230]);
  doc.text(`Generado ${timeStr}`, pageW - M - 6, 30, { align: 'right' });

  y = 48;

  if (data.activeOrdersCount > 0) {
    fill(C.redSoft);
    stroke([252, 165, 165]);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, contentW, 11, 2.5, 2.5, 'FD');
    fill(C.red);
    doc.circle(M + 6, y + 5.5, 2.6, 'F');
    font('bold', 9);
    color(C.white);
    doc.text('!', M + 6, y + 6.8, { align: 'center' });
    font('bold', 8.5);
    color([153, 27, 27]);
    doc.text(`Cierre efectuado con ${data.activeOrdersCount} orden(es) aún activa(s).`, M + 12, y + 6.6);
    y += 16;
  }

  // ---------------------------------------------------------------- KPIs
  const ticket = data.totalOrdenes > 0 ? data.totalVentas / data.totalOrdenes : 0;
  const kpis: Array<{ label: string; value: string; accent: RGB; note?: string }> = [
    { label: 'TOTAL VENTAS', value: formatCOP(data.totalVentas), accent: C.orange, note: 'Ingresos del turno' },
    { label: 'ÓRDENES', value: String(data.totalOrdenes), accent: C.ink, note: 'Pedidos procesados' },
    { label: 'TICKET PROMEDIO', value: formatCOP(ticket), accent: C.blue, note: 'Venta por pedido' },
    { label: 'EFECTIVO EN CAJA', value: formatCOP(data.desglose.efectivo), accent: C.green, note: 'Recaudo en cash' },
  ];
  const gap = 4;
  const kW = (contentW - gap * 3) / 4;
  kpis.forEach((k, i) => {
    const x = M + i * (kW + gap);
    fill(C.paper);
    stroke(C.line);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, kW, 24, 2.5, 2.5, 'FD');
    fill(k.accent);
    doc.roundedRect(x, y, kW, 2, 1, 1, 'F');
    font('bold', 6.8);
    color(C.muted);
    doc.text(k.label, x + 4, y + 8);
    font('bold', k.value.length > 11 ? 10.5 : 12.5);
    color(k.accent === C.ink ? C.ink : k.accent);
    doc.text(k.value, x + 4, y + 15.5);
    font('normal', 6.5);
    color(C.muted);
    doc.text(k.note || '', x + 4, y + 20.5);
  });
  y += 30;

  // ---------------------------------------------------------------- Rentabilidad del turno
  {
    const costo = data.costoInsumos ?? 0;
    const domicilios = data.costoDomicilios ?? 0;
    const ventasProd = data.ventasProducto ?? data.totalVentas - domicilios;
    const ganancia = data.gananciaBruta ?? ventasProd - costo;
    const margen = data.margen ?? (ventasProd > 0 ? Math.round((ganancia / ventasProd) * 1000) / 10 : 0);
    sectionTitle('Rentabilidad del turno', 'Ventas de producto menos insumos consumidos y costo de domicilios');

    const cards: Array<{ label: string; value: string; c: RGB; soft: RGB }> = [
      { label: 'INSUMOS GASTADOS', value: formatCOP(costo), c: C.red, soft: C.redSoft },
      { label: 'COSTO DOMICILIOS', value: formatCOP(domicilios), c: [180, 83, 9] as RGB, soft: C.orangeSoft },
      { label: 'GANANCIA BRUTA', value: formatCOP(ganancia), c: C.green, soft: C.greenSoft },
      { label: 'MARGEN', value: `${margen}%`, c: C.blue, soft: C.blueSoft },
    ];
    const cw = (contentW - 12) / 4;
    cards.forEach((k, i) => {
      const x = M + i * (cw + 4);
      fill(k.soft);
      doc.roundedRect(x, y, cw, 17, 2.5, 2.5, 'F');
      font('bold', 6.8);
      color(k.c);
      doc.text(k.label, x + 4, y + 6);
      font('bold', 12.5);
      color(C.ink);
      doc.text(k.value, x + 4, y + 13.5);
    });
    y += 21;

    // barra apilada: de cada peso vendido, cuanto es insumos, domicilio y ganancia
    const total = Math.max(data.totalVentas, 1);
    const wInsumos = Math.min(contentW, (contentW * costo) / total);
    const wDom = Math.min(contentW - wInsumos, (contentW * domicilios) / total);
    fill(C.green);
    doc.roundedRect(M, y, contentW, 5, 2.5, 2.5, 'F');
    if (wInsumos + wDom > 0) {
      fill([245, 158, 11] as RGB);
      doc.roundedRect(M, y, Math.max(2.5, wInsumos + wDom), 5, 2.5, 2.5, 'F');
    }
    if (wInsumos > 0) {
      fill(C.red);
      doc.roundedRect(M, y, Math.max(2.5, wInsumos), 5, 2.5, 2.5, 'F');
    }
    font('normal', 7);
    color(C.muted);
    doc.text(`Insumos ${((costo / total) * 100).toFixed(1)}%  |  Domicilios ${((domicilios / total) * 100).toFixed(1)}%`, M, y + 10);
    doc.text(`Ganancia ${((ganancia / total) * 100).toFixed(1)}%`, pageW - M, y + 10, { align: 'right' });
    y += 17;
  }

  // ---------------------------------------------------------------- Composicion de ingresos (donut)
  sectionTitle('Composición de ingresos', 'Distribución por método de pago');
  {
    const total = data.desglose.efectivo + data.desglose.digital;
    const panelH = 40;
    fill(C.white);
    stroke(C.line);
    doc.setLineWidth(0.25);
    doc.roundedRect(M, y, contentW, panelH, 3, 3, 'FD');

    const cx = M + 30;
    const cy = y + panelH / 2;
    const rOut = 17;
    const rIn = 10.5;

    if (total <= 0) {
      ringSegment(cx, cy, rOut, rIn, 0, 359.9, C.line);
    } else {
      const pctCash = data.desglose.efectivo / total;
      const angCash = pctCash * 360;
      if (pctCash > 0) ringSegment(cx, cy, rOut, rIn, 0, Math.min(angCash, 359.9), C.green);
      if (pctCash < 1) ringSegment(cx, cy, rOut, rIn, angCash, 360, C.blue);
    }
    font('bold', 8);
    color(C.ink);
    doc.text('TOTAL', cx, cy - 0.5, { align: 'center' });
    font('normal', 6.5);
    color(C.muted);
    doc.text(`${data.totalOrdenes} pedidos`, cx, cy + 3.5, { align: 'center' });

    const legend = [
      { label: 'Efectivo', value: data.desglose.efectivo, c: C.green, soft: C.greenSoft },
      { label: 'Digital / Transferencias', value: data.desglose.digital, c: C.blue, soft: C.blueSoft },
    ];
    const lx = M + 62;
    legend.forEach((l, i) => {
      const ly = y + 7 + i * 14;
      const pct = total > 0 ? (l.value / total) * 100 : 0;
      fill(l.c);
      doc.roundedRect(lx, ly, 3.5, 3.5, 0.8, 0.8, 'F');
      font('bold', 9);
      color(C.ink);
      doc.text(l.label, lx + 6, ly + 3);
      font('bold', 11);
      color(l.c);
      doc.text(formatCOP(l.value), pageW - M - 6, ly + 3, { align: 'right' });
      // barra de progreso
      const barW = pageW - M - 6 - lx;
      fill(C.line);
      doc.roundedRect(lx, ly + 6, barW, 2.4, 1.2, 1.2, 'F');
      if (pct > 0) {
        fill(l.c);
        doc.roundedRect(lx, ly + 6, Math.max(2.4, (barW * pct) / 100), 2.4, 1.2, 1.2, 'F');
      }
      font('normal', 7);
      color(C.muted);
      doc.text(`${pct.toFixed(1)}% del total`, lx, ly + 12.5);
    });
    y += panelH + 10;
  }

  // ---------------------------------------------------------------- Consumo de insumos (barras horizontales)
  sectionTitle('Consumo de insumos', 'Escandallo: unidades descontadas del inventario en el turno');
  {
    const list = [...(data.insumosConsumidos || [])].sort((a, b) => b.used - a.used);
    if (list.length === 0) {
      font('italic', 8.5);
      color(C.muted);
      doc.text('No se registraron consumos de insumos en este turno.', M + 2, y + 4);
      y += 12;
    } else {
      const shown = list.slice(0, 12);
      const max = Math.max(...shown.map(i => i.used), 1);
      const rowH = 7.5;
      const labelW = 58;
      const barX = M + labelW;
      const barMaxW = contentW - labelW - 48;

      shown.forEach((ins, i) => {
        ensureSpace(rowH + 2);
        if (i % 2 === 0) {
          fill(C.paper);
          doc.rect(M, y - 1.2, contentW, rowH, 'F');
        }
        font('normal', 8);
        color(C.text);
        const name = ins.name.length > 32 ? ins.name.slice(0, 31) + '…' : ins.name;
        doc.text(name, M + 2, y + 3.6);
        fill(C.orangeSoft);
        doc.roundedRect(barX, y + 0.8, barMaxW, 3.2, 1.6, 1.6, 'F');
        fill(C.orange);
        doc.roundedRect(barX, y + 0.8, Math.max(2, (barMaxW * ins.used) / max), 3.2, 1.6, 1.6, 'F');
        font('bold', 8);
        color(C.ink);
        doc.text(`${ins.used} ${ins.unit || 'u'}`, pageW - M - (ins.cost ? 24 : 2), y + 3.6, { align: 'right' });
        if (ins.cost) {
          font('normal', 7.5);
          color(C.muted);
          doc.text(formatCOP(ins.cost), pageW - M - 2, y + 3.6, { align: 'right' });
        }
        y += rowH;
      });
      if (list.length > shown.length) {
        font('italic', 7.5);
        color(C.muted);
        doc.text(`+ ${list.length - shown.length} insumos adicionales con menor consumo`, M + 2, y + 3);
        y += 6;
      }
      y += 6;
    }
  }

  // ---------------------------------------------------------------- Liquidacion de domiciliarios
  const liqs = data.liquidaciones || [];
  if (liqs.length > 0) {
    ensureSpace(40);
    sectionTitle('Liquidación de domiciliarios', 'Efectivo recaudado y valor a entregar por repartidor');

    const cols = { name: M + 3, orders: M + 78, cash: M + 112, base: M + 144, due: pageW - M - 3 };
    fill(C.ink);
    doc.roundedRect(M, y, contentW, 8, 2, 2, 'F');
    font('bold', 7);
    color(C.white);
    doc.text('DOMICILIARIO', cols.name, y + 5.2);
    doc.text('PEDIDOS', cols.orders, y + 5.2, { align: 'right' });
    doc.text('RECAUDADO', cols.cash, y + 5.2, { align: 'right' });
    doc.text('BASE', cols.base, y + 5.2, { align: 'right' });
    doc.text('A ENTREGAR', cols.due, y + 5.2, { align: 'right' });
    y += 10;

    const maxDue = Math.max(...liqs.map(l => l.totalDue), 1);
    liqs.forEach((l, i) => {
      ensureSpace(13);
      if (i % 2 === 0) {
        fill(C.paper);
        doc.rect(M, y - 1, contentW, 11, 'F');
      }
      font('bold', 8.5);
      color(C.ink);
      doc.text(l.driverName, cols.name, y + 3.6);
      font('normal', 8.5);
      color(C.text);
      doc.text(String(l.ordersCount), cols.orders, y + 3.6, { align: 'right' });
      doc.text(formatCOP(l.cashCollected), cols.cash, y + 3.6, { align: 'right' });
      doc.text(formatCOP(l.base), cols.base, y + 3.6, { align: 'right' });
      font('bold', 8.5);
      color(C.green);
      doc.text(formatCOP(l.totalDue), cols.due, y + 3.6, { align: 'right' });
      // mini barra proporcional al valor a entregar
      fill(C.line);
      doc.roundedRect(cols.name, y + 6, 60, 1.6, 0.8, 0.8, 'F');
      fill(C.green);
      doc.roundedRect(cols.name, y + 6, Math.max(1.6, (60 * l.totalDue) / maxDue), 1.6, 0.8, 0.8, 'F');
      y += 11;
    });
    y += 6;
  }

  // ---------------------------------------------------------------- Detalle de ordenes
  if (orders && orders.length > 0) {
    ensureSpace(40);
    sectionTitle('Detalle de órdenes', 'Últimas órdenes registradas');

    const drawHeader = () => {
      fill(C.ink);
      doc.roundedRect(M, y, contentW, 8, 2, 2, 'F');
      font('bold', 7);
      color(C.white);
      doc.text('PEDIDO', M + 3, y + 5.2);
      doc.text('CLIENTE', M + 30, y + 5.2);
      doc.text('ESTADO', M + 100, y + 5.2);
      doc.text('PAGO', M + 128, y + 5.2);
      doc.text('TOTAL', pageW - M - 3, y + 5.2, { align: 'right' });
      y += 10;
    };
    drawHeader();

    orders.slice(0, 15).forEach((ord, idx) => {
      if (y + 8 > bottomLimit) {
        doc.addPage();
        y = 18;
        drawHeader();
      }
      if (idx % 2 === 0) {
        fill(C.paper);
        doc.rect(M, y - 1, contentW, 7.5, 'F');
      }
      font('bold', 7.5);
      color(C.ink);
      doc.text(ord.id || `#${idx + 1}`, M + 3, y + 3.6);
      font('normal', 7.5);
      color(C.text);
      doc.text((ord.client || 'Cliente').substring(0, 34), M + 30, y + 3.6);
      doc.text(String(ord.status || ''), M + 100, y + 3.6);
      const cash = ord.paymentMethod === 'cash';
      fill(cash ? C.greenSoft : C.blueSoft);
      doc.roundedRect(M + 126.5, y + 0.2, 20, 4.6, 2.3, 2.3, 'F');
      font('bold', 6.5);
      color(cash ? [21, 128, 61] : [29, 78, 216]);
      doc.text(cash ? 'EFECTIVO' : 'DIGITAL', M + 136.5, y + 3.4, { align: 'center' });
      font('bold', 7.5);
      color(C.ink);
      doc.text(formatCOP(ord.total || 0), pageW - M - 3, y + 3.6, { align: 'right' });
      y += 7.5;
    });
    y += 8;
  }

  // ---------------------------------------------------------------- pie de pagina en todas las paginas
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    stroke(C.line);
    doc.setLineWidth(0.25);
    doc.line(M, pageH - 12, pageW - M, pageH - 12);
    font('normal', 7);
    color(C.muted);
    doc.text('Hamburguer Copiway  •  Sistema de Conciliación y Liquidación Automática', M, pageH - 7.5);
    doc.text(`Página ${p} de ${pages}`, pageW - M, pageH - 7.5, { align: 'right' });
  }

  // ---------------------------------------------------------------- salida
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const download = () => {
    const filename = `cierre_caja_${data.date.replace(/\//g, '-')}.pdf`;
    try {
      doc.save(filename);
    } catch {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return { doc, blobUrl, download };
}
