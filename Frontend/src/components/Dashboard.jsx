import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  UserPlus, 
  FileText 
} from 'lucide-react';

export default function Dashboard({ setActiveTab, setOpenNewPrestamo, setOpenNewCliente, setOpenNewAbono }) {
  const { clientes, prestamos, abonos, productos, loading } = useApp();

  // Formateador de moneda colombiana / pesos
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formateador de fecha corta
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cálculos de métricas
  const totalFiado = prestamos.reduce((sum, p) => sum + p.precio_total, 0);
  const totalCobrado = abonos.reduce((sum, a) => sum + a.monto, 0);
  
  // Calcular saldo pendiente detallado (sólo préstamos pendientes)
  let totalPendiente = 0;
  const deudoresActivosSet = new Set();
  let prestamosPendientesCount = 0;

  prestamos.forEach(p => {
    const abonosDelPrestamo = abonos.filter(a => a.prestamo_id === p.id);
    const totalAbonado = abonosDelPrestamo.reduce((sum, a) => sum + a.monto, 0);
    const saldoRestante = p.precio_total - totalAbonado;

    if (p.estado === 'pendiente' && saldoRestante > 0) {
      totalPendiente += saldoRestante;
      deudoresActivosSet.add(p.cliente_id);
      prestamosPendientesCount++;
    }
  });

  const deudoresActivosCount = deudoresActivosSet.size;

  // Obtener actividad reciente combinando préstamos y abonos ordenados por fecha
  const actividades = [
    ...prestamos.map(p => ({
      tipo: 'prestamo',
      fecha: p.fecha_prestamo,
      cliente: clientes.find(c => c.id === p.cliente_id)?.nombre || 'Cliente Desconocido',
      monto: p.precio_total,
      detalle: p.producto,
      id: p.id
    })),
    ...abonos.map(a => {
      const prestamo = prestamos.find(p => p.id === a.prestamo_id);
      const cliente = prestamo ? clientes.find(c => c.id === prestamo.cliente_id) : null;
      return {
        tipo: 'abono',
        fecha: a.fecha_abono,
        cliente: cliente?.nombre || 'Cliente Desconocido',
        monto: a.monto,
        detalle: `Abono a: ${prestamo?.producto || 'Producto desconocido'}`,
        id: a.id
      };
    })
  ]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  // Datos para gráfico simple de cobros de la última semana
  const getCobrosUltimosDias = () => {
    const dias = [];
    const hoy = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoy.getDate() - i);
      const dString = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
      
      // Sumar abonos de este día
      const totalDia = abonos
        .filter(a => {
          const fechaAbono = new Date(a.fecha_abono);
          return fechaAbono.getDate() === d.getDate() &&
                 fechaAbono.getMonth() === d.getMonth() &&
                 fechaAbono.getFullYear() === d.getFullYear();
        })
        .reduce((sum, a) => sum + a.monto, 0);

      dias.push({ nombre: dString, valor: totalDia });
    }
    return dias;
  };

  const cobrosUltimosDias = getCobrosUltimosDias();
  const maxCobroDia = Math.max(...cobrosUltimosDias.map(d => d.valor), 1); // evitar división por cero

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-teal-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Resumen</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Monitorea los préstamos, abonos y deudores vigentes de tu libreta.</p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saldo Pendiente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg dark:hover:shadow-violet-950/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/15 dark:group-hover:bg-violet-600/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-violet-600/80 dark:text-violet-300/80">Saldo Pendiente</span>
            <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-600 dark:text-violet-400">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalPendiente)}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-violet-300/60">
              <span>Monto total que te deben actualmente</span>
            </div>
          </div>
        </div>

        {/* Total Cobrado */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg dark:hover:shadow-teal-950/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 dark:bg-teal-600/10 rounded-full blur-2xl group-hover:bg-teal-600/15 dark:group-hover:bg-teal-600/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-teal-600/80 dark:text-teal-300/80">Total Recaudado</span>
            <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-600 dark:text-teal-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalCobrado)}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-teal-300/60">
              <span>Recaudado acumulado en abonos</span>
            </div>
          </div>
        </div>

        {/* Deudores Activos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg dark:hover:shadow-amber-950/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 dark:bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/15 dark:group-hover:bg-amber-600/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-600/80 dark:text-amber-300/80">Deudores Activos</span>
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{deudoresActivosCount}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-amber-300/60">
              <span>Personas con saldo pendiente de pago</span>
            </div>
          </div>
        </div>

        {/* Préstamos Pendientes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg dark:hover:shadow-sky-950/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-600/5 dark:bg-sky-600/10 rounded-full blur-2xl group-hover:bg-sky-600/15 dark:group-hover:bg-sky-600/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-600/80 dark:text-sky-300/80">Fiados Pendientes</span>
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-600 dark:text-sky-400">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{prestamosPendientesCount}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-sky-300/60">
              <span>Préstamos sin terminar de pagar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setOpenNewPrestamo(true)}
          className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <PlusCircle size={20} />
          Registrar Préstamo / Fiado
        </button>
        <button 
          onClick={() => setOpenNewAbono(true)}
          className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <ArrowDownLeft size={20} />
          Registrar un Abono
        </button>
        <button 
          onClick={() => setOpenNewCliente(true)}
          className="flex items-center justify-center gap-3 p-4 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <UserPlus size={20} />
          Registrar Nuevo Cliente
        </button>
      </div>

      {/* Alertas de Stock */}
      {productos && productos.filter(p => p.stock <= 5).length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-500 text-white rounded">⚠️</span>
            <span>Tienes <strong>{productos.filter(p => p.stock <= 5).length} productos</strong> con bajo stock o agotados.</span>
          </div>
          <button 
            onClick={() => setActiveTab('productos')} 
            className="font-bold underline uppercase text-[10px]"
          >
            Ver Inventario
          </button>
        </div>
      )}

      {/* Gráfico y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recaudación Reciente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl lg:col-span-3 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recaudación Últimos 7 Días</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monto diario recolectado por concepto de abonos.</p>
          </div>
          
          <div className="mt-8 flex items-end justify-between h-48 gap-3 px-2">
            {cobrosUltimosDias.map((dia, idx) => {
              const alturaPorcentaje = (dia.valor / maxCobroDia) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 dark:bg-slate-950 border border-slate-800 text-teal-400 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10 whitespace-nowrap">
                    {formatCurrency(dia.valor)}
                  </div>
                  {/* Barra */}
                  <div 
                    style={{ height: `${Math.max(alturaPorcentaje, 4)}%` }} 
                    className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-115 ${
                      dia.valor > 0 
                        ? 'bg-gradient-to-t from-teal-600 to-teal-400 shadow-md shadow-teal-500/10 dark:shadow-teal-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800/40'
                    }`}
                  ></div>
                  {/* Etiqueta del día */}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 text-center truncate w-full">
                    {dia.nombre}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl lg:col-span-2 flex flex-col shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Actividad Reciente</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Últimos movimientos registrados en el sistema.</p>

          <div className="mt-6 flex-1 space-y-4">
            {actividades.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm py-8">
                No hay movimientos registrados
              </div>
            ) : (
              actividades.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${
                    act.tipo === 'prestamo' 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  }`}>
                    {act.tipo === 'prestamo' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-slate-950 dark:text-white truncate">{act.cliente}</p>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0 ml-2">
                        {act.tipo === 'prestamo' ? '-' : '+'}{formatCurrency(act.monto)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{act.detalle}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1">{formatDate(act.fecha)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
