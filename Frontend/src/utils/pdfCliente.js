// =============================================================================
// pdfCliente.js — Generador de "Cuenta de Cobro" (PDF) por cliente
// =============================================================================
//
// Módulo PURO (sin imports React). Recibe un snapshot ya clonado en memoria y
// produce un PDF vectorial con tabla de préstamos + sub-tablas de abonos y
// resumen global. Diseñado para que la carga de jsPDF (~200KB) se haga de
// forma perezosa DENTRO del handler (no al import inicial).
//
// Decisiones del diseño (#188):
//  - Lazy imports: `await import('jspdf')` y `await import('jspdf-autotable')`
//    no se cargan en el bundle inicial. El navegador los pide SOLO cuando el
//    usuario hace click en "Exportar PDF".
//  - Fuente Roboto embebida vía fetch lazy a /fonts/Roboto-Regular.ttf →
//    base64 → doc.addFileToVFS + addFont. Sin esto, los tildes/ñ/Ñ salen
//    rotos en el PDF (la helvetica default es WinAnsi ASCII).
//  - `onExportComplete(blob, filename, folio)` queda como seam para futuro
//    envío por email/WhatsApp (no se usa hoy; R-pdf-3 del spec).
//  - El snapshot es responsabilidad del CALLER (ClientesList.jsx en T7):
//    aquí se asume que los arrays ya están clonado. Si el caller no clona
//    y muta el state durante el render del PDF, pueden aparecer datos
//    inconsistentes.
//
// Uso esperado desde ClientesList.jsx (T7):
//   const snapshot = JSON.parse(JSON.stringify({ cliente, prestamos,
//     abonosPorPrestamo, user, isoTimestamp: new Date().toISOString() }));
//   await exportarCuentaCobroPDF(snapshot);
//
// Dev console test (dev only):
//   window.__test_pdf_cliente({ cliente, prestamos, abonosPorPrestamo, user })
//   → dispara la descarga del PDF y retorna { blob, filename, folio }.
// =============================================================================
import { getNextPaymentDate } from './validation';

// -----------------------------------------------------------------------------
// Helpers locales (sin React, sin Intl, sin I/O)
// -----------------------------------------------------------------------------

const fmtYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const fmtHMS = (d) => {
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}${mi}${s}`;
};

// Moneda en formato es-CO: "$ 1.234.567" (sin decimales, sin "COP")
const formatMonto = (n) => {
  const v = Math.round(Number(n) || 0);
  return '$ ' + v.toLocaleString('es-CO');
};

const formatFechaCorta = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Defensive parse de productos_fiados (idéntico al patrón de PrestamosList.jsx)
const parseProductosFiados = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
};

const productosToString = (raw, fallbackString) => {
  const arr = parseProductosFiados(raw);
  if (arr.length > 0) {
    return arr.map(p => `${p.nombre || ''} × ${p.cantidad || 1}`).filter(Boolean).join(', ');
  }
  return fallbackString || '—';
};

// Slug simple para filename
const slug = (s) => {
  if (!s) return 'cliente';
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'cliente';
};

// Convierte un ArrayBuffer a base64 con chunking para evitar stack overflow
// en archivos grandes (~50KB+). `btoa(String.fromCharCode(...arr))` rompe
// silenciosamente con arrays > ~120KB en V8.
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000; // 32KB
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, slice);
  }
  return btoa(binary);
};

// Carga Roboto-Regular desde /public/fonts/Roboto-Regular.ttf como base64.
// La fuente es un asset estático (bundle lazy, no inicial).
const loadRobotoBase64 = async () => {
  const res = await fetch('/fonts/Roboto-Regular.ttf');
  if (!res.ok) throw new Error(`No se pudo cargar Roboto-Regular.ttf: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return arrayBufferToBase64(buf);
};

// -----------------------------------------------------------------------------
// Cálculo de totales (R-pdf-5): excluye 'devuelto' del fiado, nunca negativo
// -----------------------------------------------------------------------------
function calcularTotales(prestamos, abonosPorPrestamo) {
  let totalFiado = 0;
  let totalAbonado = 0;
  let prestamosActivos = 0;

  for (const p of prestamos) {
    if (p.estado === 'devuelto') continue;
    totalFiado += Number(p.precio_total) || 0;
    prestamosActivos += 1;
    const abs = (abonosPorPrestamo && abonosPorPrestamo[p.id]) || [];
    for (const a of abs) {
      totalAbonado += Number(a.monto) || 0;
    }
  }
  const saldo = Math.max(0, totalFiado - totalAbonado);
  const sobrepago = Math.max(0, totalAbonado - totalFiado);
  return { totalFiado, totalAbonado, saldo, sobrepago, prestamosActivos };
}

// -----------------------------------------------------------------------------
// Layout: helpers de render del documento
// -----------------------------------------------------------------------------

function drawHeader(doc, { user, now, folio }) {
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 210, 6, 'F');

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('La Libreta Digital', 105, 18, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text('Estado de cuenta', 105, 27, { align: 'center' });

  // Folio (izquierda) + Fecha (derecha) — header sticky
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Folio: ${folio}`, 15, 36);
  doc.text(`Fecha: ${now.toLocaleString('es-CO')}`, 195, 36, { align: 'right' });

  // Email del usuario removido a solicitud
  doc.setTextColor(0, 0, 0);
}

function drawClienteBlock(doc, cliente, totales) {
  let y = 50;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, y - 7, 186, 30, 2, 2, 'FD');
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Cliente', 15, y);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Nombre: ${cliente.nombre || '—'}`, 15, y + 7);
  doc.text(`Cédula: ${cliente.cedula || '—'}`, 15, y + 14);
  doc.text(`Teléfono: ${cliente.telefono || '—'}`, 15, y + 21);

  // Columna derecha: totales
  doc.setFont(undefined, 'bold');
  doc.text('Resumen', 120, y);
  doc.setFont(undefined, 'normal');
  doc.text(`Total fiado: ${formatMonto(totales.totalFiado)}`, 120, y + 7);
  doc.text(`Total abonado: ${formatMonto(totales.totalAbonado)}`, 120, y + 14);

  // Saldo pendiente (o saldo a favor si sobrepago)
  if (totales.sobrepago > 0) {
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(`Saldo a favor: ${formatMonto(totales.sobrepago)}`, 120, y + 21);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.setTextColor(225, 29, 72); // rose
    doc.text(`Saldo pendiente: ${formatMonto(totales.saldo)}`, 120, y + 21);
    doc.setTextColor(0, 0, 0);
  }

  return y + 28; // próxima Y disponible
}

function drawResumenGlobal(doc, totales) {
  const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 140;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Resumen Global', 15, y);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, y + 2, 186, 24, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');

  // Fila 1: totales + préstamos activos
  doc.text(`Total fiado: ${formatMonto(totales.totalFiado)}`, 15, y + 9);
  doc.text(`Total abonado: ${formatMonto(totales.totalAbonado)}`, 75, y + 9);
  doc.text(`Préstamos activos: ${totales.prestamosActivos}`, 195, y + 9, { align: 'right' });

  // Fila 2: saldo en su propia línea, separado de los préstamos activos
  if (totales.sobrepago > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text(`Saldo a favor: ${formatMonto(totales.sobrepago)}`, 15, y + 18);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.setTextColor(225, 29, 72);
    doc.text(`Saldo pendiente: ${formatMonto(totales.saldo)}`, 15, y + 18);
    doc.setTextColor(0, 0, 0);
  }
}

function stampFooterOnAllPages(doc, { folio, user, getPageContext }) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const left = `Generado por La Libreta Digital`;
    doc.text(left, 15, 287);
    doc.text(`Folio: ${folio} · Página ${i} de ${pageCount}`, 195, 287, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
}

// -----------------------------------------------------------------------------
// Función principal exportada
// -----------------------------------------------------------------------------

/**
 * Genera y descarga el PDF de cuenta de cobro para un cliente.
 *
 * @param {Object} params
 * @param {Object} params.cliente           - Cliente { id, nombre, cedula, telefono }
 * @param {Array}  params.prestamos         - Préstamos del cliente
 * @param {Object} params.abonosPorPrestamo - { [prestamoId]: Abono[] }
 * @param {Object} [params.user]            - Usuario autenticado (para email en header/footer)
 * @param {Function} [params.onExportComplete] - (blob, filename, folio) => void
 * @returns {Promise<{ blob: Blob, filename: string, folio: string }>}
 */
export async function exportarCuentaCobroPDF({ cliente, prestamos, abonosPorPrestamo, user, onExportComplete }) {
  if (!cliente) throw new Error('exportarCuentaCobroPDF: cliente es requerido');

  // 1. Lazy imports (cierra Gap #1 del spec)
  const { default: jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default;

  // 2. Fuente UTF-8 lazy
  const fontB64 = await loadRobotoBase64();

  // 3. Crear doc
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.addFileToVFS('Roboto-Regular.ttf', fontB64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto', 'normal');

  // 4. Folio determinístico (R-pdf-3, Gap #5)
  const now = new Date();
  const idHex = (cliente.id || '').replace(/-/g, '').slice(0, 6).toUpperCase();
  const folio = `CL-${idHex}-${fmtYMD(now)}-${fmtHMS(now)}`;

  // 5. Calcular totales
  const totales = calcularTotales(prestamos || [], abonosPorPrestamo || {});

  // 6. Header
  drawHeader(doc, { user, now, folio });

  // 7. Bloque cliente
  const afterClienteY = drawClienteBlock(doc, cliente, totales);

  // 8. Tabla de préstamos con autotable (R-pdf-3, R-pdf-4, R-pdf-6, R-pdf-8)
  const prestamosOrdenados = [...(prestamos || [])].sort(
    (a, b) => new Date(b.fecha_prestamo || 0) - new Date(a.fecha_prestamo || 0)
  );

  // Construimos body + flat abonos como filas adicionales
  const body = [];
  prestamosOrdenados.forEach((p, idx) => {
    const abs = (abonosPorPrestamo && abonosPorPrestamo[p.id]) || [];
    const totalAbonadoP = abs.reduce((s, a) => s + (Number(a.monto) || 0), 0);
    const isDevuelto = p.estado === 'devuelto';
    const isPagado = p.estado === 'pagado';
    const saldoP = isDevuelto ? 0 : Math.max(0, (Number(p.precio_total) || 0) - totalAbonadoP);
    const estadoLabel = isDevuelto ? 'Devuelto' : isPagado ? 'Pagado' : 'Pendiente';

    const proximoPagoDate = getNextPaymentDate({
      fechaPrestamo: p.fecha_prestamo,
      diasPagoSugeridos: p.dias_pago_sugeridos,
      abonos: abs,
    });
    const planPago = [
      p.dias_pago_sugeridos || '—',
      proximoPagoDate ? `Próx: ${formatFechaCorta(proximoPagoDate.toISOString())}` : null,
    ].filter(Boolean).join('\n');

    body.push([
      String(idx + 1),
      formatFechaCorta(p.fecha_prestamo),
      productosToString(p.productos_fiados, p.producto),
      planPago,
      formatMonto(p.precio_total),
      formatMonto(totalAbonadoP),
      isPagado ? '$ 0' : formatMonto(saldoP),
      estadoLabel,
    ]);

    // Sub-tabla abonos (R-pdf-3) — una fila vacía o varias filas planas con prefijo
    if (abs.length === 0) {
      body.push([
        { content: 'Sin abonos registrados', colSpan: 8, styles: { fontStyle: 'italic', textColor: [156, 163, 175], fontSize: 8 } },
      ]);
    } else {
      const sortedAbs = [...abs].sort((a, b) => new Date(b.fecha_abono || 0) - new Date(a.fecha_abono || 0));
      body.push([
        { content: 'Abonos registrados', colSpan: 8, styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [6, 95, 70], fontSize: 8 } },
      ]);
      for (const a of sortedAbs) {
        body.push([
          { content: '', styles: { cellPadding: { top: 0.5, bottom: 0.5, left: 0, right: 0 } } },
          formatFechaCorta(a.fecha_abono),
          { content: a.notas || '—', styles: { fontStyle: 'italic', textColor: [100, 116, 139], fontSize: 8, fillColor: [240, 253, 250] } },
          { content: '', styles: { cellPadding: 0 } },
          { content: '', styles: { cellPadding: 0 } },
          { content: formatMonto(a.monto), styles: { fillColor: [240, 253, 250], textColor: [15, 118, 110], fontStyle: 'bold' } },
          { content: '', styles: { cellPadding: 0 } },
          { content: '', styles: { cellPadding: 0 } },
        ]);
      }
    }
  });

  if (body.length === 0) {
    body.push([
      { content: 'Este cliente no tiene préstamos registrados.', colSpan: 8, styles: { fontStyle: 'italic', textColor: [156, 163, 175] } },
    ]);
  }

  doc.autoTable({
    startY: afterClienteY + 4,
    head: [['#', 'Fecha', 'Detalle', 'Plan de pago', 'Total', 'Abonado', 'Saldo', 'Estado']],
    body,
    theme: 'grid',
    styles: { font: 'Roboto', fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [76, 29, 149], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    // didParseCell: diferenciar visualmente la fila del producto (préstamo) del
    // bloque de abonos (R-pdf-4 ampliado a toda la fila, celda por celda:
    // data.row.styles NO existe en jspdf-autotable → evitar ese camino):
    //  - Fila de producto pendiente (con saldo) → fondo violeta suave
    //  - Fila de producto pagado → fondo verde suave
    //  - Fila de producto devuelto → fondo gris + itálico
    //  - Fila individual de abono → fondo verde clarísimo (bloque compacto)
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const col = data.column.index;
      const first = data.row.cells && data.row.cells[0];
      // Para la col 0 la "primera celda" es la propia; para el resto ya está en row.cells
      const firstRaw = col === 0 ? data.cell.raw : first ? first.raw : undefined;
      const firstCell = col === 0 ? data.cell : first;

      const esFilaProducto =
        typeof firstRaw === 'string' && /^\d+$/.test(firstRaw.trim());
      const esFilaAbono =
        !esFilaProducto &&
        firstCell &&
        firstCell.styles &&
        firstCell.styles.cellPadding &&
        firstCell.styles.cellPadding.top <= 1;

      if (esFilaProducto) {
        const st = data.cell.styles;
        const estadoVal = String(
          (data.row.cells && data.row.cells[7] && data.row.cells[7].raw) || ''
        );
        if (estadoVal === 'Devuelto') {
          st.fillColor = [241, 245, 249];
          st.textColor = [100, 116, 139];
        } else if (estadoVal === 'Pagado') {
          st.fillColor = [236, 253, 245];
          st.textColor = [6, 95, 70];
        } else {
          st.fillColor = [237, 233, 254];
        }
        if (col === 7) {
          const estadoActual = String(data.cell.raw || '');
          if (estadoActual === 'Devuelto') st.fontStyle = 'italic';
          else if (estadoActual === 'Pagado') st.fontStyle = 'bold';
          else if (estadoActual === 'Pendiente') st.textColor = [225, 29, 72];
        }
        return;
      }

      if (esFilaAbono) {
        data.cell.styles.fillColor = [240, 253, 250];
      }
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 30 },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'center' },
    },
    pageBreak: 'auto',
    margin: { top: 50, left: 15, right: 15, bottom: 15 },
  });

  // 9. Resumen global
  drawResumenGlobal(doc, totales);

  // 10. Footer sticky en cada página
  stampFooterOnAllPages(doc, { folio, user });

  // 11. Save + hook (Gap #3)
  const filename = `cuenta_cobro_${slug(cliente.nombre)}_${fmtYMD(now)}.pdf`;
  doc.save(filename);

  const blob = doc.output('blob');
  if (typeof onExportComplete === 'function') {
    try { onExportComplete(blob, filename, folio); } catch (e) { console.warn('onExportComplete hook error:', e); }
  }

  return { blob, filename, folio };
}

// -----------------------------------------------------------------------------
// Dev-only test seam (cierra Gap #2 del spec — sin test runner)
// -----------------------------------------------------------------------------
// Solo se expone en build DEV para que el verify manual pueda ejecutarlo desde
// la consola del navegador (sin React, sin async/await en su frontera).
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  if (typeof window !== 'undefined') {
    window.__test_pdf_cliente = async (params) => {
      return await exportarCuentaCobroPDF(params);
    };
  }
}

export default exportarCuentaCobroPDF;
