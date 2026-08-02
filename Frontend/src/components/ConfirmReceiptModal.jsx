import React from 'react';
import { MessageSquare, FileText, X, Check } from 'lucide-react';

export default function ConfirmReceiptModal({
  isOpen,
  onClose,
  clienteNombre,
  waUrl,
  onDownloadPdf,
  titulo = '¿Deseas enviar el comprobante?',
  mensaje = 'El registro se ha realizado con éxito. Elige una opción para compartir la información con el cliente.'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Check size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {titulo}
            </h3>
            {clienteNombre && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cliente: <span className="font-semibold text-slate-700 dark:text-slate-300">{clienteNombre}</span>
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {mensaje}
        </p>

        <div className="flex flex-col gap-2.5">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <MessageSquare size={16} /> Enviar Comprobante por WhatsApp
            </a>
          )}

          {onDownloadPdf && (
            <button
              onClick={() => {
                onDownloadPdf();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02]"
            >
              <FileText size={16} /> Descargar Recibo PDF
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-xs transition-colors"
          >
            Omitir / No enviar recibo
          </button>
        </div>
      </div>
    </div>
  );
}
