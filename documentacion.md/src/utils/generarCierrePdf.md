# src/utils/generarCierrePdf.ts

## ¿Para qué sirve?
Crea el **PDF del cierre de caja** (tamaño carta/A4) con la librería **jsPDF**: banner naranja,
indicadores, rentabilidad, gráfica de efectivo vs digital, consumo de insumos, liquidación de
domiciliarios y la lista de pedidos.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `AdminDashboard.tsx` | Después de pedir el cierre a PHP, genera el PDF para verlo o descargarlo. |
| ← los datos vienen de | `GET /api/cash-closing/preview` y `POST /api/cash-closing` → `CajaService.php` | |
| → usa | `jspdf` (librería de `package.json`) | Dibujar el PDF. |
| → usa | el tipo `Order` de `store/almacenAplicacion.ts` | La lista de pedidos. |

## La interface `CierreDataForPDF`
Los datos que necesita. Coinciden con lo que devuelve `CajaService::previsualizar()`:
`date`, `totalVentas`, `totalOrdenes`, `activeOrdersCount`, `desglose` (efectivo y digital),
`insumosConsumidos`, `costoInsumos`, `costoDomicilios`, `ventasProducto`, `gananciaBruta`, `margen`
y `liquidaciones`.

## La constante `C` (colores)
Colores en formato RGB: `orange: [234, 88, 12]`, `green`, `blue`, `red`... y sus versiones suaves.

## La función `generateCierrePDF(data, orders)`
Devuelve 3 cosas:
| Valor | Para qué |
|---|---|
| `doc` | El documento jsPDF. |
| `blobUrl` | Una dirección temporal del PDF en memoria, para mostrarlo dentro de la página (en un iframe). |
| `download` | Función que descarga el archivo `cierre_caja_FECHA.pdf`. |

### Variables y ayudas internas
| Nombre | Para qué |
|---|---|
| `pageW`, `pageH` | Ancho y alto de la hoja (en milímetros). |
| `M` | Margen lateral (14 mm). |
| `y` | **Posición vertical actual**: se va sumando a medida que se dibuja hacia abajo. |
| `bottomLimit` | Hasta dónde se puede escribir antes de pasar a otra página. |
| `fill`, `stroke`, `color`, `font` | Atajos para cambiar el color de relleno, de línea, de texto y la fuente. |
| `ensureSpace(h)` | Si lo siguiente no cabe, agrega una página nueva (`doc.addPage()`) y vuelve `y` arriba. |
| `sectionTitle(titulo, subtitulo)` | Dibuja un título de sección con una barrita naranja. |

### Secciones (en orden)
1. **Cabecera:** banner naranja con "HAMBURGUER COPIWAY", la fecha y la hora de generación.
2. **Aviso** si quedaron pedidos activos sin entregar.
3. **Indicadores:** total vendido, número de pedidos, efectivo y digital.
4. **Rentabilidad:** costo de insumos, domicilios, ganancia y margen.
5. **Composición de ingresos:** gráfica de dona efectivo vs digital.
6. **Consumo de insumos:** barras horizontales.
7. **Liquidación de domiciliarios:** tabla con pedidos, recaudado, base y total a entregar.
8. **Detalle de órdenes:** tabla con cada pedido.
9. **Pie de página** en todas las hojas: "Página X de Y".

| Función de jsPDF | Qué hace |
|---|---|
| `doc.text(texto, x, y, {align})` | Escribe texto en esa posición. |
| `doc.roundedRect(x, y, ancho, alto, ...)` | Dibuja un rectángulo con esquinas redondeadas. |
| `doc.line(x1, y1, x2, y2)` | Dibuja una línea. |
| `doc.addPage()` / `doc.setPage(n)` | Nueva página / ir a la página n. |
| `doc.output('blob')` | El PDF en memoria. |
| `doc.save(nombre)` | Descarga el PDF. |
