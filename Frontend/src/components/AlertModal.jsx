import React, { useRef } from 'react';
import {
  AlertTriangle,
  XCircle,
  Info,
  HelpCircle,
  X
} from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

export default function AlertModal({ isOpen, alertConfig, onClose }) {
  const modalRef = useRef(null);
  const { titleId } = useModalA11y({ isOpen, onClose, modalRef });

  if (!isOpen || !alertConfig) return null;

  const { title, message, type, onConfirm } = alertConfig;

  // Elegir icono y colores según tipo
  let icon = <Info size={24} className="text-blue-500" />;
  let colorTheme = 'blue';
  let buttonStyle = 'bg-blue-600 hover:bg-blue-500';

  if (type === 'error') {
    icon = <XCircle size={24} className="text-rose-500" />;
    colorTheme = 'rose';
    buttonStyle = 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500/50';
  } else if (type === 'warning') {
    icon = <AlertTriangle size={24} className="text-amber-500" />;
    colorTheme = 'amber';
    buttonStyle = 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50';
  } else if (type === 'confirm') {
    icon = <HelpCircle size={24} className="text-indigo-500" />;
    colorTheme = 'indigo';
    buttonStyle = 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500/50';
  }

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99] flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative animate-slide-up"
      >
        {/* Botón cerrar esquina */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Contenido principal */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-full border border-slate-100 dark:border-slate-800">
            {icon}
          </div>
          <div>
            <h3 id={titleId} className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          {type === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2 px-4 text-white text-xs font-semibold rounded-xl transition-all shadow-md ${buttonStyle}`}
              >
                Aceptar
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-2 px-4 text-white text-xs font-semibold rounded-xl transition-all shadow-md ${buttonStyle}`}
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
