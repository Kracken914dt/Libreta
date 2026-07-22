import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Edit3 } from 'lucide-react';

export default function EditPrestamoModal({ isOpen, onClose, prestamo }) {
  const { clientes, updatePrestamo, showAlert } = useApp();
  const [producto, setProducto] = useState('');
  const [precioTotal, setPrecioTotal] = useState('');
  const [diasPagoSugeridos, setDiasPagoSugeridos] = useState('');
  const [notas, setNotas] = useState('');
  const [fechaPrestamo, setFechaPrestamo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (prestamo) {
      setProducto(prestamo.producto || '');
      setPrecioTotal(prestamo.precio_total || '');
      setDiasPagoSugeridos(prestamo.dias_pago_sugeridos || '');
      setNotas(prestamo.notas || '');
      
      // Convertir ISO Date a datetime-local string
      if (prestamo.fecha_prestamo) {
        const d = new Date(prestamo.fecha_prestamo);
        // Formato: YYYY-MM-DDTHH:MM
        const tzoffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
        setFechaPrestamo(localISOTime);
      } else {
        setFechaPrestamo('');
      }
    }
  }, [prestamo, isOpen]);

  if (!isOpen || !prestamo) return null;

  const cliente = clientes.find(c => c.id === prestamo.cliente_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!producto.trim() || !precioTotal) return;

    setSubmitting(true);
    try {
      await updatePrestamo(prestamo.id, {
        producto,
        precio_total: parseFloat(precioTotal),
        dias_pago_sugeridos: diasPagoSugeridos,
        notas,
        fecha_prestamo: fechaPrestamo
      });
      onClose();
    } catch (err) {
      showAlert('Error al actualizar préstamo: ' + err.message, 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Botón cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Edit3 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Préstamo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Modifica el fiado para <strong className="text-violet-600 dark:text-violet-400">{cliente?.nombre || 'Cliente'}</strong></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Producto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Producto prestado / fiado *</label>
            <input 
              type="text" 
              required
              placeholder="Ej. Zapatos, Pantalón, Mercado, etc."
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
            />
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valor Total ($) *</label>
            <input 
              type="number" 
              required
              min="0"
              placeholder="Ej. 120000"
              value={precioTotal}
              onChange={(e) => setPrecioTotal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
            />
          </div>

          {/* Fechas y sugerencia de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fecha y Hora *</label>
              <input 
                type="datetime-local" 
                required
                value={fechaPrestamo}
                onChange={(e) => setFechaPrestamo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Días de Pago Sugeridos</label>
              <select
                value={diasPagoSugeridos}
                onChange={(e) => setDiasPagoSugeridos(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
              >
                <option value="" className="bg-white dark:bg-slate-900">-- Sin especificar --</option>
                <option value="Semanal (Lunes)" className="bg-white dark:bg-slate-900">Semanal (Lunes)</option>
                <option value="Semanal (Martes)" className="bg-white dark:bg-slate-900">Semanal (Martes)</option>
                <option value="Semanal (Miércoles)" className="bg-white dark:bg-slate-900">Semanal (Miércoles)</option>
                <option value="Semanal (Jueves)" className="bg-white dark:bg-slate-900">Semanal (Jueves)</option>
                <option value="Semanal (Viernes)" className="bg-white dark:bg-slate-900">Semanal (Viernes)</option>
                <option value="Semanal (Sábado)" className="bg-white dark:bg-slate-900">Semanal (Sábado)</option>
                <option value="Semanal (Domingo)" className="bg-white dark:bg-slate-900">Semanal (Domingo)</option>
                <option value="Quincenal (15 y 30)" className="bg-white dark:bg-slate-900">Quincenal (15 y 30)</option>
                <option value="Mensual" className="bg-white dark:bg-slate-900">Mensual</option>
                <option value="Fin de mes" className="bg-white dark:bg-slate-900">Fin de mes</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Notas / Detalles adicionales</label>
            <textarea 
              placeholder="Ej. Talla 38, Color azul, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-950/30 dark:shadow-violet-950/45 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
