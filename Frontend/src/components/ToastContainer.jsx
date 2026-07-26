import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

// Per-type icon mapping (Lucide).
const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

// Per-type palette: light + dark via Tailwind utilities. Chosen for WCAG-AA
// contrast on both themes (emerald-800, sky-800, amber-800, rose-800 on
// their respective -50 / -950/40 backgrounds).
const STYLES = {
  success:
    'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200',
  info:
    'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50 text-sky-800 dark:text-sky-200',
  warning:
    'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200',
  error:
    'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200',
};

/**
 * ToastContainer — non-modal notification surface.
 *
 * Mounted once in App.jsx alongside AlertModal. Fixed top-right, z-[100]
 * (above AlertModal z-[99] so toasts stay visible over destructive dialogs).
 * Container itself is pointer-events-none; each toast opts back in to
 * pointer-events-auto so the X button remains clickable while the rest
 * of the page is unaffected.
 *
 * Spec refs: R-toast-Position, R-toast-A11y, R-toast-ManualDismiss.
 * Does NOT use useModalA11y (toasts are non-modal — no scroll lock, no
 * focus trap, no ESC handling). See design D8.
 */
export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        const isAssertive = toast.type === 'warning' || toast.type === 'error';
        return (
          <div
            key={toast.id}
            role={isAssertive ? 'alert' : 'status'}
            aria-live={isAssertive ? 'assertive' : 'polite'}
            aria-label={toast.title ? `${toast.title}: ${toast.message}` : toast.message}
            className={`pointer-events-auto flex items-start gap-3 p-3 pr-2 rounded-xl border shadow-lg animate-toast-in ${
              STYLES[toast.type] || STYLES.info
            }`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-xs font-bold mb-0.5">{toast.title}</h4>
              )}
              <p className="text-xs leading-snug">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
              aria-label="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
