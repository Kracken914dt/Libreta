import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  PlusCircle, 
  Trash2, 
  Edit3,
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';

export default function PrestamosList({ 
  setOpenNewPrestamo, 
  setOpenNewAbono, 
  setSelectedPrestamoForAbono,
  onEditPrestamo,
  onRequestDeletePrestamo,
  onRequestDeleteAbono
}) {
  const { clientes, prestamos, abonos, devolverPrestamo, showConfirm, loading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('pendientes'); // 'todos', 'pendientes', 'pagados'
  const [expandedPrestamoId, setExpandedPrestamoId] = useState(null);

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
    const d = new Date(isoString);
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener abonos de un préstamo
  const getAbonosDePrestamo = (prestamoId) => {
    return abonos.filter(a => a.prestamo_id === prestamoId);
  };

  const getSaldoPrestamo = (prestamo) => {
    const abonosP = getAbonosDePrestamo(prestamo.id);
    const totalAbonado = abonosP.reduce((sum, a) => sum + a.monto, 0);
    return {
      totalAbonado,
      saldoRestante: Math.max(prestamo.precio_total - totalAbonado, 0)
    };
  };

  // Filtrado y búsqueda de préstamos
  const filteredPrestamos = prestamos.filter(p => {
    const cliente = clientes.find(c => c.id === p.cliente_id);
    const clienteNombre = cliente ? cliente.nombre.toLowerCase() : '';
    const producto = p.producto.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = clienteNombre.includes(query) || producto.includes(query);

    if (activeFilter === 'pendientes') {
      return matchesSearch && p.estado === 'pendiente';
    } else if (activeFilter === 'pagados') {
      return matchesSearch && p.estado === 'pagado';
    } else if (activeFilter === 'devueltos') {
      return matchesSearch && p.estado === 'devuelto';
    }
    return matchesSearch; // 'todos'
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado y búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Registro de Préstamos y Fiados</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Registra productos fiados a cuotas sin intereses y gestiona sus abonos.</p>
        </div>
        <button 
          onClick={() => setOpenNewPrestamo(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-all duration-300 active:scale-95 shrink-0 self-start md:self-auto"
        >
          <PlusCircle size={18} />
          Nuevo Préstamo / Fiado
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros de Estado */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Buscador */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search size={20} />
          </span>
          <input 
            type="text" 
            placeholder="Buscar por cliente o producto..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all"
          />
        </div>

        {/* Pestañas de Filtro */}
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800/85 shrink-0 shadow-sm">
          <button
            onClick={() => setActiveFilter('pendientes')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'pendientes'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setActiveFilter('pagados')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'pagados'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pagados
          </button>
          <button
            onClick={() => setActiveFilter('devueltos')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'devueltos'
                ? 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Devueltos
          </button>
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'todos'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Lista de Préstamos */}
      {filteredPrestamos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-400 dark:text-slate-500">
          {prestamos.length === 0
            ? "Aún no hay préstamos registrados. Comienza presionando 'Nuevo Préstamo'."
            : `No se encontraron préstamos ${activeFilter !== 'todos' ? activeFilter : ''} que coincidan.`}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrestamos.map((prestamo) => {
            const cliente = clientes.find(c => c.id === prestamo.cliente_id);
            const { totalAbonado, saldoRestante } = getSaldoPrestamo(prestamo);
            const abonosP = getAbonosDePrestamo(prestamo.id);
            const isExpanded = expandedPrestamoId === prestamo.id;

            return (
              <div 
                key={prestamo.id}
                className={`bg-white dark:bg-slate-900/40 border transition-all duration-300 rounded-2xl shadow-sm ${
                  prestamo.estado === 'pagado' 
                    ? 'border-emerald-500/20 dark:border-emerald-500/20 hover:border-emerald-500/40 dark:hover:border-emerald-500/35' 
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Información Principal */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        prestamo.estado === 'pagado'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : prestamo.estado === 'devuelto'
                            ? 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        {prestamo.estado === 'pagado' ? 'PAGADO' : prestamo.estado === 'devuelto' ? 'DEVUELTO' : 'PENDIENTE'}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(prestamo.fecha_prestamo)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base text-slate-900 dark:text-white truncate mt-1">
                      {prestamo.producto}
                    </h3>
                    
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      Cliente: <strong className="text-violet-700 dark:text-violet-400">{cliente?.nombre || 'Cliente Desconocido'}</strong>
                      {cliente?.cedula && <span className="text-slate-400 dark:text-slate-500 text-xs font-normal"> (C.C. {cliente.cedula})</span>}
                    </p>
                  </div>

                  {/* Resumen de Montos Financieros */}
                  <div className="grid grid-cols-3 gap-6 lg:gap-8 bg-slate-50 dark:bg-slate-950/30 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-900/60 shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider font-sans">Precio</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{formatCurrency(prestamo.precio_total)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider font-sans">Abonado</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400 text-sm">{formatCurrency(totalAbonado)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider font-sans">Saldo</span>
                      <span className={`font-semibold text-sm ${saldoRestante > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatCurrency(saldoRestante)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                    {prestamo.estado === 'pendiente' && (
                      <button 
                        onClick={() => {
                          setSelectedPrestamoForAbono(prestamo);
                          setOpenNewAbono(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                        <DollarSign size={14} />
                        Abonar
                      </button>
                    )}

                    {prestamo.estado !== 'devuelto' && (
                      <button
                        onClick={() => {
                          showConfirm(
                            `¿Estás seguro de registrar la devolución de este préstamo?\n\nDetalle: ${prestamo.producto}\n\nEsto restaurará el stock de los productos correspondientes en el inventario.`,
                            'Confirmar Devolución',
                            () => devolverPrestamo(prestamo.id)
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
                        aria-label="Marcar préstamo como devuelto"
                        title="Registrar devolución de productos"
                      >
                        <RotateCcw size={14} />
                        Devolver
                      </button>
                    )}

                    {/* Botón Editar */}
                    {prestamo.estado !== 'devuelto' && (
                      <button
                        onClick={() => onEditPrestamo(prestamo)}
                        aria-label="Editar préstamo"
                        title="Editar Préstamo"
                        className="p-2 bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => onRequestDeletePrestamo(prestamo)}
                      aria-label="Eliminar préstamo"
                      title="Eliminar Préstamo"
                      className="p-2 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>

                    <button
                      onClick={() => setExpandedPrestamoId(isExpanded ? null : prestamo.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-colors"
                      aria-label={isExpanded ? "Colapsar" : "Expandir"}
                      title={isExpanded ? "Contraer" : "Ver detalles y abonos"}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* DETALLE EXPANDIDO: ABONOS Y NOTAS */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-950/15 p-5 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
                      {prestamo.dias_pago_sugeridos && (
                        <div className="bg-slate-100/40 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                          <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">📅 Días de Pago Acordados:</span>
                          <p>{prestamo.dias_pago_sugeridos}</p>
                        </div>
                      )}
                      {prestamo.notas && (
                        <div className="bg-slate-100/40 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                          <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">📝 Notas Adicionales:</span>
                          <p className="italic">{prestamo.notes || prestamo.notas}</p>
                        </div>
                      )}
                      {prestamo.productos_fiados && (
                        <div className="bg-slate-100/40 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 md:col-span-2">
                          <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">📦 Desglose de Productos Fiados:</span>
                          <div className="mt-2 space-y-1.5">
                            {(Array.isArray(prestamo.productos_fiados)
                              ? prestamo.productos_fiados
                              : (typeof prestamo.productos_fiados === 'string' ? JSON.parse(prestamo.productos_fiados) : [])
                            ).map((p, idx) => (
                              <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200/30 dark:border-slate-800/40 last:border-0 last:pb-0 text-slate-600 dark:text-slate-300">
                                <span>{p.cantidad}x <strong className="text-slate-800 dark:text-slate-200 font-semibold">{p.nombre}</strong></span>
                                <span>Unitario: {formatCurrency(p.precio)} | Subtotal: {formatCurrency(p.precio * p.cantidad)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Historial de Abonos */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Historial de Abonos de este Préstamo</h4>
                      
                      {abonosP.length === 0 ? (
                        <div className="text-slate-400 dark:text-slate-500 text-xs py-2 italic flex items-center gap-1.5">
                          <Info size={14} />
                          No se han registrado abonos para este préstamo todavía.
                        </div>
                      ) : (
                        <div className="border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-3">Fecha del Abono</th>
                                <th className="p-3">Monto Abonado</th>
                                <th className="p-3">Notas</th>
                                <th className="p-3 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {abonosP.map((abono) => (
                                  <tr key={abono.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-200">
                                    <td className="p-3 text-slate-400 dark:text-slate-500">{formatDate(abono.fecha_abono)}</td>
                                    <td className="p-3 font-semibold text-teal-600 dark:text-teal-400">{formatCurrency(abono.monto)}</td>
                                    <td className="p-3 italic text-slate-500 dark:text-slate-400">{abono.notes || abono.notas || '-'}</td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => onRequestDeleteAbono(abono)}
                                        className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 rounded hover:bg-rose-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-colors"
                                        aria-label="Eliminar abono"
                                        title="Eliminar Abono"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
