import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { X, Edit3 } from 'lucide-react';
import {
  formatMontoInput,
  parseMontoInputValue,
  formatMonto
} from '../utils/validation';
import { frecuenciaDiasDesdeLabel } from '../utils/planCuotas';
import { useModalA11y } from '../hooks/useModalA11y';

export default function EditPrestamoModal({ isOpen, onClose, prestamo }) {
  const { clientes, updatePrestamo } = useApp();
  const { showToast } = useToast();
  const [producto, setProducto] = useState('');
  const [precioTotal, setPrecioTotal] = useState('');
  const [diasPagoSugeridos, setDiasPagoSugeridos] = useState('');
  const [notas, setNotas] = useState('');
  const [fechaPrestamo, setFechaPrestamo] = useState('');
  
  // Estados de Plan de Cuotas
  const [usarPlanCuotas, setUsarPlanCuotas] = useState(false);
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [montoCuota, setMontoCuota] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);
  const { titleId } = useModalA11y({ isOpen, onClose, modalRef });

  useEffect(() => {
    if (prestamo) {
      setProducto(prestamo.producto || '');
      setPrecioTotal(prestamo.precio_total != null ? formatMontoInput(prestamo.precio_total) : '');
      setDiasPagoSugeridos(prestamo.dias_pago_sugeridos || '');
      setNotas(prestamo.notas || '');

      if (prestamo.plan_cuotas && typeof prestamo.plan_cuotas === 'object') {
        setUsarPlanCuotas(true);
        setNumeroCuotas(prestamo.plan_cuotas.numero_cuotas || '');
        setMontoCuota(prestamo.plan_cuotas.monto_cuota != null ? formatMontoInput(prestamo.plan_cuotas.monto_cuota) : '');
      } else {
        setUsarPlanCuotas(false);
        setNumeroCuotas('');
        setMontoCuota('');
      }

      if (prestamo.fecha_prestamo) {
        const d = new Date(prestamo.fecha_prestamo);
        const tzoffset = d.getTimezoneOffset() * 60000;
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
      let plan_cuotas = null;
      if (usarPlanCuotas && numeroCuotas && montoCuota) {
        const numC = Math.min(200, parseInt(numeroCuotas, 10) || 1);
        const valC = parseMontoInputValue(montoCuota);
        const freqDays = frecuenciaDiasDesdeLabel(diasPagoSugeridos);
        plan_cuotas = {
          numero_cuotas: numC,
          monto_cuota: valC,
          frecuencia_dias: freqDays,
          primera_fecha: fechaPrestamo ? new Date(fechaPrestamo).toISOString() : prestamo.fecha_prestamo
        };
      }

      await updatePrestamo(prestamo.id, {
        producto,
        precio_total: parseMontoInputValue(precioTotal),
        dias_pago_sugeridos: diasPagoSugeridos,
        notas,
        fecha_prestamo: fechaPrestamo,
        plan_cuotas
      });
      onClose();
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Error al actualizar préstamo: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Edit3 size={20} />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white">Editar Préstamo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Modifica el fiado para <strong className="text-violet-600 dark:text-violet-400">{cliente?.nombre || 'Cliente'}</strong></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Producto prestado / fiado *</label>
            <input
              type="text"
              required
              placeholder="Ej. Zapatos, Pantalón, Mercado, etc."
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valor Total ($) *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="Ej. 120000"
              value={precioTotal}
              onChange={(e) => setPrecioTotal(formatMontoInput(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fecha y Hora *</label>
              <input
                type="datetime-local"
                required
                value={fechaPrestamo}
                onChange={(e) => setFechaPrestamo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Días de Pago Sugeridos</label>
              <select
                value={diasPagoSugeridos}
                onChange={(e) => setDiasPagoSugeridos(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
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

          {/* Plan de Cuotas */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="editUsarPlanCuotas"
                checked={usarPlanCuotas}
                onChange={(e) => setUsarPlanCuotas(e.target.checked)}
                className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4 bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 cursor-pointer"
              />
              <label htmlFor="editUsarPlanCuotas" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Habilitar / Modificar plan de cuotas
              </label>
            </div>

            {usarPlanCuotas && (
              <div className="space-y-3 bg-violet-500/5 border border-violet-500/10 rounded-xl p-3.5 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Número de cuotas (Máx. 200) *</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      placeholder="Ej. 4"
                      value={numeroCuotas}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') { setNumeroCuotas(''); return; }
                        const v = parseInt(val, 10);
                        if (isNaN(v) || v <= 0) setNumeroCuotas('');
                        else setNumeroCuotas(Math.min(200, v));
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valor por cuota ($) *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej. 25.000"
                      value={montoCuota}
                      onChange={(e) => setMontoCuota(formatMontoInput(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {(() => {
                  const tot = parseMontoInputValue(precioTotal);
                  const numC = parseInt(numeroCuotas, 10) || 0;
                  const valC = parseMontoInputValue(montoCuota);
                  if (numC > 0 && valC > 0) {
                    const calc = numC * valC;
                    return (
                      <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                        Total plan: {numC} cuotas × ${formatMonto(valC)} = ${formatMonto(calc)}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Notas / Detalles adicionales (Máx. 100 caracteres)</label>
            <textarea
              placeholder="Ej. Talla 38, Color azul, etc."
              maxLength={100}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs h-20 resize-none"
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
