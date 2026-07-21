import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, title, message, itemName, onConfirm, onClose }) {
  if (!isOpen) return null;

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

        {/* Contenido */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-rose-600 dark:text-rose-400 font-semibold">{itemName}</strong>?
            </p>
            {message && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-rose-950/30 dark:shadow-rose-950/45"
          >
            Confirmar Eliminación
          </button>
        </div>
      </div>
    </div>
  );
}
