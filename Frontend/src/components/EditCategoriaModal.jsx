import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Tag } from 'lucide-react';
import { formatNameInput } from '../utils/validation';
import { useModalA11y } from '../hooks/useModalA11y';

const PRESETS_COLORS = [
  '#8b5cf6', // Violeta
  '#3b82f6', // Azul
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Ámbar/Naranja
  '#ef4444', // Rojo
  '#ec4899', // Rosa
  '#14b8a6', // Teal/Turquesa
  '#6366f1', // Índigo
];

export default function EditCategoriaModal({ isOpen, onClose, categoria }) {
  const { addCategoria, updateCategoria, showAlert } = useApp();
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(PRESETS_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);
  const { titleId } = useModalA11y({ isOpen, onClose, modalRef });

  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre || '');
      setColor(categoria.color || PRESETS_COLORS[0]);
    } else {
      setNombre('');
      setColor(PRESETS_COLORS[0]);
    }
  }, [categoria, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSubmitting(true);
    try {
      if (categoria) {
        await updateCategoria(categoria.id, { nombre, color });
      } else {
        await addCategoria({ nombre, color });
      }
      onClose();
    } catch (err) {
      showAlert('Error al guardar categoría: ' + err.message, 'Error', 'error');
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative animate-slide-up"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2.5 mb-6">
          <div 
            className="p-2 rounded-lg text-white border"
            style={{ backgroundColor: color, borderColor: color + '20' }}
          >
            <Tag size={18} />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-white">
              {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {categoria ? 'Modifica el nombre o color' : 'Agrega una nueva categoría para organizar productos'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nombre de la Categoría *</label>
            <input 
              type="text" 
              required
              placeholder="Ej. Ropa de Invierno, Calzado Deportivo"
              value={nombre}
              onChange={(e) => setNombre(formatNameInput(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
            />
          </div>

          {/* Selector de Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Color Distintivo</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESETS_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all transform active:scale-95 ${
                    color === c ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting || !nombre.trim()}
              className="flex-1 py-2 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : categoria ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
