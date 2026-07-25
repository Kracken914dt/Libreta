import { useRef } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import { X, FileDown, MessageSquare, Plus, Minus } from 'lucide-react';

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

        {/* Body (placeholder — se reemplaza por 2-col grid en C8/C9) */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            Contenido del modal — se completa en C8 (stats), C9 (préstamos) y C10 (tabla abonos)
          </p>
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
