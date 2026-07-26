import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import {
  Search,
  UserPlus,
  Trash2,
  Edit3,
  Phone,
  MessageSquare,
  CreditCard,
  ChevronRight,
  History,
  FileDown
} from 'lucide-react';
import { exportarCuentaCobroPDF } from '../utils/pdfCliente';
import { getWhatsAppLink } from '../utils/validation';
import HistorialClienteModal from './HistorialClienteModal';
import { Pagination } from './Pagination';
import { PAGE_SIZE } from '../constants/ui';

export default function ClientesList({ 
  setOpenNewCliente, 
  setOpenNewPrestamo, 
  setOpenNewAbono, 
  setSelectedClienteForPrestamo, 
  setSelectedPrestamoForAbono,
  onEditCliente, 
  onRequestDeleteCliente 
}) {
  const { clientes, prestamos, abonos, user, loading } = useApp();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Reset a página 1 cuando cambia la búsqueda (R-page-State).
  // Functional update previene stale closure en race conditions (R-page-SearchComposition).
  useEffect(() => {
    setCurrentPage((prev) => 1);
  }, [searchQuery]);

  // Formateador de moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formateador de fecha
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Obtener estadísticas de un cliente
  const getClienteStats = (clienteId) => {
    const prestamosCliente = prestamos.filter(p => p.cliente_id === clienteId);
    const prestamosValidosIds = prestamosCliente.filter(p => p.estado !== 'devuelto').map(p => p.id);
    const abonosCliente = abonos.filter(a => prestamosValidosIds.includes(a.prestamo_id));

    const totalFiado = prestamosCliente
      .filter(p => p.estado !== 'devuelto')
      .reduce((sum, p) => sum + p.precio_total, 0);
    const totalAbonado = abonosCliente.reduce((sum, a) => sum + a.monto, 0);

    let deudaActiva = 0;
    prestamosCliente.forEach(p => {
      if (p.estado === 'pendiente') {
        const abonosDelPrestamo = abonosCliente.filter(a => a.prestamo_id === p.id);
        const totalAbonadoPrestamo = abonosDelPrestamo.reduce((sum, a) => sum + a.monto, 0);
        deudaActiva += Math.max(p.precio_total - totalAbonadoPrestamo, 0);
      }
    });

    const prestamosPendientes = prestamosCliente.filter(p => p.estado === 'pendiente').length;

    return {
      totalFiado,
      totalAbonado,
      deudaActiva,
      prestamosPendientes,
      totalPrestamos: prestamosCliente.length
    };
  };

  // getWhatsAppLink viene de utils/validation (testeado, ver __tests__/validation.test.js)

  // Handler unificado de export PDF (T7): dispara desde card y desde drawer.
  // Snapshot deep-clone en el momento del click (Gap #4) — useCallback memoiza
  // para que el mismo handler se reuse entre mounts y no rompa equality.
  const handleExportPdf = useCallback(async (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    setExportingPdf(true);
    try {
      const prestamosDelCliente = prestamos.filter(p => p.cliente_id === clienteId);
      const abonosPorPrestamo = Object.fromEntries(
        prestamosDelCliente.map(p => [p.id, abonos.filter(a => a.prestamo_id === p.id)])
      );
      const snapshot = JSON.parse(JSON.stringify({
        cliente,
        prestamos: prestamosDelCliente,
        abonosPorPrestamo,
        user,
        isoTimestamp: new Date().toISOString(),
      }));
      await exportarCuentaCobroPDF(snapshot);
    } catch (err) {
      console.error('Error exportando PDF:', err);
      showToast({
        type: 'error',
        title: 'Error al exportar',
        message: 'No se pudo generar el PDF: ' + (err.message || err),
      });
    } finally {
      setExportingPdf(false);
    }
  }, [clientes, prestamos, abonos, user, showToast]);

  // Handlers que invocan el modal siguiente (R-hist-2, R-hist-11):
  // cierran el HistorialClienteModal ANTES de abrir el nuevo modal para evitar
  // stacking (doble scroll-lock, doble focus trap, doble z-index).
  const handleCrearPrestamo = (cliente) => {
    setSelectedCliente(null);
    setSelectedClienteForPrestamo(cliente);
    setOpenNewPrestamo(true);
  };

  const handleAbonar = (cliente) => {
    const clientePrestamos = prestamos.filter(p => p.cliente_id === cliente.id);
    const primerPendiente = clientePrestamos.find(p => p.estado === 'pendiente');
    if (primerPendiente) {
      setSelectedCliente(null);
      setSelectedPrestamoForAbono(primerPendiente);
      setOpenNewAbono(true);
    }
  };

  // Filtrar clientes
  const filteredClientes = clientes.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(query) ||
      (c.cedula && c.cedula.includes(query)) ||
      (c.telefono && c.telefono.includes(query))
    );
  });

  // Paginación client-side (R-page-Slice). safePage es defensivo contra
  // currentPage stale (p.ej. tras un filtro que dejó 0 items en la página actual).
  const totalItems = filteredClientes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedClientes = filteredClientes.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Encabezado e Input de búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Directorio de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Busca clientes, revisa sus estados de cuenta y contáctalos.</p>
        </div>
        <button 
          onClick={() => setOpenNewCliente(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-all duration-300 active:scale-95 shrink-0 self-start md:self-auto"
        >
          <UserPlus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search size={20} />
        </span>
        <input 
          type="text" 
          placeholder="Buscar cliente por nombre, cédula o teléfono..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all duration-300"
        />
      </div>

      {/* Listado Principal de Clientes */}
      {filteredClientes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-400 dark:text-slate-500">
          {clientes.length === 0 
            ? "Aún no has registrado clientes. Haz clic en 'Nuevo Cliente' para empezar."
            : "No se encontraron clientes que coincidan con la búsqueda."}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedClientes.map((cliente) => {
            const stats = getClienteStats(cliente.id);
            const waLink = getWhatsAppLink(cliente.telefono, cliente.nombre, stats.deudaActiva);

            return (
              <div 
                key={cliente.id}
                className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate">{cliente.nombre}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cliente.cedula ? `C.C. ${cliente.cedula}` : 'Sin Cédula'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      stats.deudaActiva > 0 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {stats.deudaActiva > 0 ? `Debe ${formatCurrency(stats.deudaActiva)}` : 'Al Día'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 dark:text-slate-500" />
                      <span>{cliente.telefono || 'Sin teléfono registrado'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span>Préstamos: <strong>{stats.totalPrestamos}</strong></span>
                      <span>Pendientes: <strong className={stats.prestamosPendientes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}>{stats.prestamosPendientes}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Botón Exportar PDF */}
                    <button
                      onClick={() => handleExportPdf(cliente.id)}
                      disabled={exportingPdf}
                      aria-label="Exportar estado de cuenta en PDF"
                      title={`Exportar PDF · Estado de cuenta al ${new Date().toLocaleString('es-CO')}`}
                      className="p-2 bg-violet-500/5 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 rounded-lg border border-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all disabled:opacity-50"
                    >
                      <FileDown size={16} />
                    </button>

                    {/* Botón WhatsApp */}
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Enviar recordatorio por WhatsApp"
                        title="Enviar recordatorio por WhatsApp"
                        className="p-2 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all"
                      >
                        <MessageSquare size={16} />
                      </a>
                    ) : (
                      <button
                        disabled
                        title="Sin número de teléfono"
                        aria-label="Enviar recordatorio por WhatsApp (sin número)"
                        className="p-2 bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-600 rounded-lg border border-slate-200 dark:border-slate-800/50 cursor-not-allowed"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}

                    {/* Botón Editar */}
                    <button
                      onClick={() => onEditCliente(cliente)}
                      aria-label="Editar cliente"
                      title="Editar Cliente"
                      className="p-2 bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all"
                    >
                      <Edit3 size={16} />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => onRequestDeleteCliente(cliente, stats)}
                      aria-label="Eliminar cliente"
                      title="Eliminar Cliente"
                      className="p-2 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Trigger: abre el HistorialClienteModal (R-hist-10) */}
                  <button 
                    onClick={() => setSelectedCliente(cliente)}
                    className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors py-1.5 px-3 rounded-lg hover:bg-violet-500/5"
                  >
                    Ver Historial Completo
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
        </>
      )}

      {/* HistorialClienteModal — modal centrado, reemplaza el drawer lateral (R-hist-10, R-hist-11) */}
      <HistorialClienteModal
        isOpen={!!selectedCliente}
        onClose={() => setSelectedCliente(null)}
        cliente={selectedCliente}
        prestamos={prestamos}
        abonos={abonos}
        user={user}
        onExportPdf={handleExportPdf}
        onCrearPrestamo={handleCrearPrestamo}
        onAbonar={handleAbonar}
      />
    </div>
  );
}
