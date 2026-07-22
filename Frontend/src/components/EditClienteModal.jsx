import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, Edit3 } from 'lucide-react';
import { 
  handleNumberKeyDown, 
  formatNameInput, 
  formatDigitsInput 
} from '../utils/validation';

export default function EditClienteModal({ isOpen, onClose, cliente }) {
  const { updateCliente, showAlert } = useApp();
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre || '');
      setCedula(cliente.cedula || '');
      setTelefono(cliente.telefono || '');
    }
  }, [cliente, isOpen]);

  if (!isOpen || !cliente) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (cedula && (cedula.length < 7 || cedula.length > 10)) {
      showAlert('La cédula debe tener entre 7 y 10 dígitos.', 'Cédula inválida', 'warning');
      return;
    }

    if (telefono && telefono.length !== 10) {
      showAlert('El número de celular debe tener exactamente 10 dígitos.', 'Celular inválido', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await updateCliente(cliente.id, { nombre, cedula, telefono });
      onClose();
    } catch (err) {
      showAlert('Error al actualizar cliente: ' + err.message, 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slide-up">
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Cliente</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Modifica los datos personales de {cliente.nombre}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nombre Completo *</label>
            <input 
              type="text" 
              required
              placeholder="Ej. Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(formatNameInput(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cédula / ID</label>
              <input 
                type="text" 
                placeholder="Ej. 1023456"
                value={cedula}
                onChange={(e) => setCedula(formatDigitsInput(e.target.value, 10))}
                onKeyDown={handleNumberKeyDown}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Celular / Teléfono</label>
              <input 
                type="text" 
                placeholder="Ej. 3124567890"
                value={telefono}
                onChange={(e) => setTelefono(formatDigitsInput(e.target.value, 10))}
                onKeyDown={handleNumberKeyDown}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
              />
            </div>
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
