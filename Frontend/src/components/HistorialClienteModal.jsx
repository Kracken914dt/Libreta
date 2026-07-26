import { useRef } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import { X, FileDown, MessageSquare, Plus, Minus, ShoppingBag } from 'lucide-react';
import { formatMonto, getWhatsAppLink } from '../utils/validation';

/**
 * HistorialClienteModal — Modal centrado con el historial completo de un cliente.
 *
 * Spec: R-hist-1 a R-hist-11
 *  - Layout 2 columnas sticky en lg+, 1 columna en mobile (R-hist-1, R-hist-4)
 *  - Left: stats (Total Fiado / Total Abonado / Saldo / # Préstamos) + acciones (R-hist-2)
 *  - Right: lista de préstamos con abonos anidados (R-hist-2)
 *  - Footer: "Todos los Abonos" tabla plana full-width (R-hist-2)
 *  - Hereda useModalA11y: ESC, focus trap, scroll lock, focus restore, ARIA (R-hist-11)
 *
 * Props:
 *  - isOpen, onClose, cliente: control de apertura
 *  - prestamos, abonos: listas globales (filtradas por cliente dentro del modal)
 *  - user: sesión actual (pasada por props para futura extensión; PDF reusa el handler del padre)
 *  - onExportPdf(clienteId): handler que abre el PDF (mismo que usa la card)
 *  - onCrearPrestamo(cliente): handler que cierra el modal y abre EditPrestamoModal
 *  - onAbonar(cliente): handler que cierra el modal y abre el flujo de abono
 */
export function HistorialClienteModal({
  isOpen,
  onClose,
  cliente,
  prestamos,
  abonos,
  user,
  onExportPdf,
  onCrearPrestamo,
  onAbonar,
}) {
  const modalRef = useRef(null);
  const { titleId } = useModalA11y({ isOpen, onClose, modalRef });

  if (!isOpen || !cliente) return null;

  // ---- Derived data (consumido por left col C8, right col C9, footer C10) ----
  const prestamosCliente = prestamos.filter(p => p.cliente_id === cliente.id);
  const prestamoIds = new Set(prestamosCliente.map(p => p.id));
  const abonosCliente = abonos.filter(a => prestamoIds.has(a.prestamo_id));
  const abonosPorPrestamo = Object.fromEntries(
    prestamosCliente.map(p => [p.id, abonos.filter(a => a.prestamo_id === p.id)])
  );
  const totalFiado = prestamosCliente.reduce((s, p) => s + (p.precio_total || 0), 0);
  const totalAbonado = abonosCliente.reduce((s, a) => s + (a.monto || 0), 0);
  const saldoPendiente = Math.max(0, totalFiado - totalAbonado);
  const saldoAFavor = totalAbonado > totalFiado ? totalAbonado - totalFiado : 0;
  const totalPrestamos = prestamosCliente.length;

  // Iniciales para el avatar (maneja undefined/null y nombres con un solo token).
  const initials = (cliente.nombre || '?')
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  // getWhatsAppLink + formatMonto vienen de utils/validation (testeados, ver __tests__/validation.test.js)

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up"
      >
        {/* Header — sticky top, no scroll */}
        <div className="flex-shrink-0 p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {cliente.nombre}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                C.C. {cliente.cedula || 'No registrada'} · Tel: {cliente.telefono || 'No registrado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onExportPdf(cliente.id)}
              aria-label="Exportar historial completo en PDF"
              title="Exportar historial completo en PDF"
              className="p-2 bg-violet-500/5 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 rounded-lg border border-violet-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            >
              <FileDown size={16} />
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              title="Cerrar modal"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body — 2-col grid (R-hist-1, R-hist-4) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT column — sticky on lg+, 4 stat cards + 3 action buttons (R-hist-2) */}
          <div className="lg:col-span-1 lg:sticky lg:top-0 lg:self-start space-y-4">
            {/* 4 stat cards (2x2 grid) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-xl p-3">
                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Total Fiado</p>
                <p className="text-lg font-bold text-violet-700 dark:text-violet-300 mt-1">$ {formatMonto(totalFiado)}</p>
              </div>
              <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-xl p-3">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">Total Abonado</p>
                <p className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-1">$ {formatMonto(totalAbonado)}</p>
              </div>
              <div className={`${saldoAFavor > 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'} border rounded-xl p-3`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${saldoAFavor > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {saldoAFavor > 0 ? 'Saldo a Favor' : 'Saldo Pendiente'}
                </p>
                <p className={`text-lg font-bold mt-1 ${saldoAFavor > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  $ {formatMonto(saldoAFavor > 0 ? saldoAFavor : saldoPendiente)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Préstamos</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1">{totalPrestamos}</p>
              </div>
            </div>

            {/* Action buttons (R-hist-2) */}
            <div className="space-y-2">
              <button
                onClick={() => onCrearPrestamo(cliente)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
              >
                <Plus size={16} /> Fiar Producto
              </button>
              {saldoPendiente > 0 && (
                <button
                  onClick={() => onAbonar(cliente)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                >
                  <Minus size={16} /> Abonar Deuda
                </button>
              )}
              {cliente.telefono && (
                <a
                  href={getWhatsAppLink(cliente.telefono, cliente.nombre, saldoPendiente) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                >
                  <MessageSquare size={16} /> Recordatorio WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* RIGHT column — lista de préstamos con abonos anidados (R-hist-2) */}
          <div className="lg:col-span-2 space-y-4">
            {prestamosCliente.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center space-y-3">
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Este cliente no tiene préstamos registrados
                </p>
                <button
                  onClick={() => onCrearPrestamo(cliente)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                >
                  <ShoppingBag size={14} /> Fiar Primer Producto
                </button>
              </div>
            ) : (
              prestamosCliente.map(prestamo => {
                const abonosDelPrestamo = abonosPorPrestamo[prestamo.id] || [];
                const abonadoDelPrestamo = abonosDelPrestamo.reduce((s, a) => s + (a.monto || 0), 0);
                const saldoDelPrestamo = Math.max(0, (prestamo.precio_total || 0) - abonadoDelPrestamo);
                const estado = prestamo.estado || 'pendiente';
                const esDevuelto = estado === 'devuelto';
                const esPagado = estado === 'pagado';

                // productos_fiados: array | JSON-string | fallback (R-hist-2)
                let productosLabel = 'Préstamo';
                if (Array.isArray(prestamo.productos_fiados) && prestamo.productos_fiados.length > 0) {
                  productosLabel = prestamo.productos_fiados.map(p => p.nombre).join(', ');
                } else if (typeof prestamo.productos_fiados === 'string' && prestamo.productos_fiados.trim()) {
                  try {
                    const parsed = JSON.parse(prestamo.productos_fiados);
                    if (Array.isArray(parsed) && parsed[0]?.nombre) {
                      productosLabel = parsed.map(p => p.nombre).join(', ');
                    }
                  } catch { /* keep fallback */ }
                } else if (typeof prestamo.producto === 'string' && prestamo.producto) {
                  productosLabel = prestamo.producto;
                }

                // fecha_prestamo || created_at (defensivo: el schema usa fecha_prestamo)
                const fechaPrestamo = prestamo.fecha_prestamo || prestamo.created_at;

                return (
                  <div
                    key={prestamo.id}
                    className={`border rounded-xl overflow-hidden ${
                      esDevuelto
                        ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                        : esPagado
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Prestamo header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${esDevuelto ? 'text-slate-500 dark:text-slate-400 line-through italic' : 'text-slate-900 dark:text-white'}`}>
                            {productosLabel}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {fechaPrestamo ? new Date(fechaPrestamo).toLocaleDateString('es-CO') : '—'}
                            {prestamo.dias_pago_sugeridos && ` · ${prestamo.dias_pago_sugeridos}`}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                          esDevuelto
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            : esPagado
                            ? 'bg-teal-200 dark:bg-teal-800/50 text-teal-800 dark:text-teal-200'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          {esDevuelto ? 'Devuelto' : esPagado ? '✓ Pagado' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Total</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">$ {formatMonto(prestamo.precio_total || 0)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Abonado</p>
                          <p className="font-bold text-teal-600 dark:text-teal-400">$ {formatMonto(abonadoDelPrestamo)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Saldo</p>
                          <p className={`font-bold ${saldoDelPrestamo > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                            $ {formatMonto(saldoDelPrestamo)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Nested abonos (R-hist-2) */}
                    {abonosDelPrestamo.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Abonos ({abonosDelPrestamo.length})
                        </p>
                        <ul className="space-y-1.5">
                          {abonosDelPrestamo.map(abono => {
                            const fechaAbono = abono.fecha_abono || abono.fecha;
                            return (
                              <li key={abono.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400">
                                  {fechaAbono ? new Date(fechaAbono).toLocaleDateString('es-CO') : '—'}
                                  {abono.notas && ` · ${abono.notas}`}
                                </span>
                                <span className="font-semibold text-teal-600 dark:text-teal-400">$ {formatMonto(abono.monto || 0)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* Todos los Abonos - full width (R-hist-2, R-hist-5)
          Sibling del body overflow, dentro del modal container: la tabla es visible
          al fondo, sin importar cuánto scrollee la lista de préstamos. max-h-[40vh]
          evita que la tabla domine la pantalla cuando hay 200+ abonos. */}
      <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 p-6 max-h-[40vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">
          Todos los Abonos ({abonosCliente.length})
        </h3>
        {abonosCliente.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 italic">No hay abonos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Fecha</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Préstamo</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Monto</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Notas</th>
                </tr>
              </thead>
              <tbody>
                {[...abonosCliente]
                  .sort((a, b) => {
                    const fa = new Date(a.fecha_abono || a.fecha || 0).getTime();
                    const fb = new Date(b.fecha_abono || b.fecha || 0).getTime();
                    return fb - fa; // desc: más reciente primero
                  })
                  .map(abono => {
                    const prestamo = prestamosCliente.find(p => p.id === abono.prestamo_id);
                    const fechaAbono = abono.fecha_abono || abono.fecha;
                    // Resolver el nombre del producto del préstamo (mismo patrón
                    // defensivo que el card del préstamo: array | JSON-string | fallback)
                    let prestamoLabel = null;
                    if (prestamo) {
                      const pf = prestamo.productos_fiados;
                      if (Array.isArray(pf) && pf.length > 0) {
                        prestamoLabel = pf.map(p => p.nombre).join(', ');
                      } else if (typeof pf === 'string' && pf.trim()) {
                        try {
                          const parsed = JSON.parse(pf);
                          if (Array.isArray(parsed) && parsed[0]?.nombre) {
                            prestamoLabel = parsed.map(p => p.nombre).join(', ');
                          }
                        } catch { /* keep null */ }
                      }
                      if (!prestamoLabel) prestamoLabel = prestamo.producto || null;
                    }
                    return (
                      <tr key={abono.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                          {fechaAbono ? new Date(fechaAbono).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">
                          {prestamoLabel || '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-teal-600 dark:text-teal-400">
                          $ {formatMonto(abono.monto || 0)}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">
                          {abono.notas || '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default HistorialClienteModal;

// ---------------------------------------------------------------------------
// Dev-only test seam (R-hist-11): expone el componente y un fixture para
// verificación manual en consola sin test runner.
// Uso (en dev):
//   window.__test_historial_modal.Modal    // componente
//   window.__test_historial_modal.fixture  // cliente/prestamos/abonos de ejemplo
// El reviewer puede montar el modal en un portal de testing propio.
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  window.__test_historial_modal = {
    Modal: HistorialClienteModal,
    fixture: {
      cliente: {
        id: 'demo-cliente-1',
        nombre: 'María José Ñoño',
        cedula: '1234567890',
        telefono: '3001234567',
      },
      prestamos: [
        {
          id: 'demo-p1',
          cliente_id: 'demo-cliente-1',
          precio_total: 50000,
          estado: 'pendiente',
          fecha_prestamo: '2026-07-01',
          dias_pago_sugeridos: '15 días',
          productos_fiados: [{ nombre: 'Anillo de plata' }],
        },
        {
          id: 'demo-p2',
          cliente_id: 'demo-cliente-1',
          precio_total: 30000,
          estado: 'pagado',
          fecha_prestamo: '2026-06-15',
          productos_fiados: [{ nombre: 'Cadena de oro' }],
        },
      ],
      abonos: [
        { id: 'demo-a1', prestamo_id: 'demo-p1', monto: 20000, fecha_abono: '2026-07-10', notas: 'Primer abono' },
        { id: 'demo-a2', prestamo_id: 'demo-p1', monto: 10000, fecha_abono: '2026-07-15', notas: 'Segundo abono' },
        { id: 'demo-a3', prestamo_id: 'demo-p2', monto: 30000, fecha_abono: '2026-06-20', notas: 'Pago total' },
      ],
    },
  };
}
