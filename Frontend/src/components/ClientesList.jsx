import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Edit3,
  Phone, 
  MessageSquare, 
  CreditCard, 
  PlusCircle, 
  ArrowRight, 
  ChevronRight, 
  X,
  History,
  DollarSign,
  FileDown
} from 'lucide-react';
import { exportarCuentaCobroPDF } from '../utils/pdfCliente';

export default function ClientesList({ 
  setOpenNewCliente, 
  setOpenNewPrestamo, 
  setOpenNewAbono, 
  setSelectedClienteForPrestamo, 
  setSelectedPrestamoForAbono,
  onEditCliente, 
  onRequestDeleteCliente 
}) {
  const { clientes, prestamos, abonos, user, loading, showAlert } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  // Limpiar y formatear número para WhatsApp
  const getWhatsAppLink = (telefono, nombre, deuda) => {
    if (!telefono) return null;
    const cleanPhone = telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
    
    let text = `Hola ${nombre}, te saludo de la tienda. `;
    if (deuda > 0) {
      text += `Te escribo para recordarte que tienes un saldo pendiente de ${formatCurrency(deuda)} en tu cuenta. ¡Que tengas un feliz día!`;
    } else {
      text += `¡Gracias por tu compra y estar al día! Que tengas un excelente día.`;
    }
    
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

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
      if (typeof showAlert === 'function') {
        showAlert('No se pudo generar el PDF: ' + (err.message || err), 'Error al exportar', 'error');
      }
    } finally {
      setExportingPdf(false);
    }
  }, [clientes, prestamos, abonos, user, showAlert]);

  // Filtrar clientes
  const filteredClientes = clientes.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(query) ||
      (c.cedula && c.cedula.includes(query)) ||
      (c.telefono && c.telefono.includes(query))
    );
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => {
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

                  {/* Ver Ficha Detalle */}
                  <button 
                    onClick={() => setSelectedCliente(cliente)}
                    className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors py-1.5 px-3 rounded-lg hover:bg-violet-500/5"
                  >
                    Ver Historial
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PANEL DE HISTORIAL DETALLADO (DRAWER/OVERLAY MODAL) */}
      {selectedCliente && (() => {
        const stats = getClienteStats(selectedCliente.id);
        const clientePrestamos = prestamos.filter(p => p.cliente_id === selectedCliente.id);

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex justify-end animate-fade-in">
            <div className="absolute inset-0" onClick={() => setSelectedCliente(null)}></div>
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl z-50 animate-slide-up">
              {/* Encabezado Drawer */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedCliente.nombre}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    C.C. {selectedCliente.cedula || 'No registrada'} | Tel: {selectedCliente.telefono || 'No registrado'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportPdf(selectedCliente.id)}
                    disabled={exportingPdf}
                    aria-label="Exportar historial completo en PDF"
                    title={`Exportar PDF · Estado de cuenta al ${new Date().toLocaleString('es-CO')}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/5 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 text-xs font-semibold rounded-lg border border-violet-500/20 transition-all disabled:opacity-50"
                  >
                    <FileDown size={14} />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => setSelectedCliente(null)}
                    aria-label="Cerrar"
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Contenido Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Resumen Financiero del Cliente */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Fiado</span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalFiado)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Abonado</span>
                    <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">{formatCurrency(stats.totalAbonado)}</p>
                  </div>
                  <div className="bg-rose-500/[0.02] dark:bg-rose-500/[0.01] p-4 rounded-xl border border-rose-500/20">
                    <span className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-300">Deuda Activa</span>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(stats.deudaActiva)}</p>
                  </div>
                </div>

                {/* Acciones Rápidas del Cliente */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setSelectedClienteForPrestamo(selectedCliente);
                      setOpenNewPrestamo(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-lg transition-all"
                  >
                    <PlusCircle size={16} />
                    Fiar Producto
                  </button>
                  {stats.deudaActiva > 0 && (
                    <button 
                      onClick={() => {
                        const primerPendiente = clientePrestamos.find(p => p.estado === 'pendiente');
                        if (primerPendiente) {
                          setSelectedPrestamoForAbono(primerPendiente);
                          setOpenNewAbono(true);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs rounded-lg transition-all"
                    >
                      <DollarSign size={16} />
                      Abonar Deuda
                    </button>
                  )}
                </div>

                {/* Historial de Préstamos / Fiados */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <History size={16} />
                    Historial de Préstamos y Fiados
                  </h3>
                  {clientePrestamos.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm py-4 text-center">Este cliente no registra ningún fiado.</p>
                  ) : (
                    <div className="space-y-4">
                      {clientePrestamos.map((prestamo) => {
                        const abonosPrestamo = abonos.filter(a => a.prestamo_id === prestamo.id);
                        const totalAbonadoPrestamo = abonosPrestamo.reduce((sum, a) => sum + a.monto, 0);
                        const saldoRestante = prestamo.estado === 'devuelto' ? 0 : (prestamo.precio_total - totalAbonadoPrestamo);

                        return (
                          <div 
                            key={prestamo.id}
                            className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{prestamo.producto}</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(prestamo.fecha_prestamo)}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                prestamo.estado === 'pagado'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : prestamo.estado === 'devuelto'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}>
                                {prestamo.estado === 'pagado' ? 'PAGADO' : (prestamo.estado === 'devuelto' ? 'DEVUELTO' : 'PENDIENTE')}
                              </span>
                            </div>

                            {/* Detalle de montos */}
                            <div className="grid grid-cols-3 gap-2 text-xs py-2 bg-slate-100/50 dark:bg-slate-900/40 rounded-lg px-3">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Total</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(prestamo.precio_total)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Abonado</span>
                                <span className="font-semibold text-teal-600 dark:text-teal-400">{formatCurrency(totalAbonadoPrestamo)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Restante</span>
                                <span className={`font-semibold ${saldoRestante > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {formatCurrency(saldoRestante)}
                                </span>
                              </div>
                            </div>

                            {prestamo.dias_pago_sugeridos && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                📅 <strong>Días de Pago:</strong> {prestamo.dias_pago_sugeridos}
                              </p>
                            )}

                            {prestamo.notas && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                📝 <strong>Nota:</strong> {prestamo.notas}
                              </p>
                            )}

                            {/* Historial de abonos para este préstamo específico */}
                            {abonosPrestamo.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/40">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Abonos realizados:</span>
                                <div className="space-y-1">
                                  {abonosPrestamo.map((abono) => (
                                    <div key={abono.id} className="flex justify-between items-center text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/30 p-1.5 rounded">
                                      <div>
                                        <span className="font-semibold text-teal-600 dark:text-teal-400">{formatCurrency(abono.monto)}</span>
                                        {abono.notes && <span className="text-slate-500 italic ml-2">({abono.notes})</span>}
                                        {abono.notas && <span className="text-slate-500 dark:text-slate-400 italic ml-2">({abono.notas})</span>}
                                      </div>
                                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">{formatDate(abono.fecha_abono)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
