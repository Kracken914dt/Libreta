import { useState, useRef, useCallback, useEffect } from 'react';

// Per-type default durations (ms). Spec R-toast-AutoDismiss:
// success | info -> 4000ms, warning | error -> 6000ms.
const DEFAULT_DURATIONS = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 6000,
};

// Spec R-toast-Position: stack cap = 5. Extras force-dismiss oldest.
const MAX_VISIBLE = 5;

// Module-level counter. Each call bumps a unique id. Counter survives
// remounts within a session (intentional — ids remain unique per app run).
let toastIdCounter = 0;
const nextToastId = () => `toast-${++toastIdCounter}-${Date.now()}`;

/**
 * useToast — non-blocking notification system.
 *
 * Contract (spec R-toast-API, R-toast-AutoDismiss, R-toast-Position):
 *  - showToast({ type, message, title?, duration? }) -> toastId
 *      type: 'success' | 'info' | 'warning' | 'error' (required)
 *      message: string (required)
 *      title: string (optional, omits header when absent)
 *      duration: number (optional, overrides per-type default)
 *  - dismissToast(toastId) removes immediately + clears its timer.
 *  - Stack cap: 5 visible. 6th force-dismisses the oldest.
 *  - Unmount cleanup: all timers cleared (no leaked setTimeout).
 *
 * @returns {{ toasts: Array, showToast: Function, dismissToast: Function }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  // Map<toastId, setTimeoutHandle> for granular cleanup on dismiss/unmount.
  // Per design D6: encapsulated, no external tracking needed.
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', message, title, duration } = {}) => {
      const id = nextToastId();
      const finalDuration = duration ?? DEFAULT_DURATIONS[type] ?? 4000;
      const toast = { id, type, message, title, duration: finalDuration, createdAt: Date.now() };

      setToasts((prev) => {
        const next = [...prev, toast];
        // Stack cap: when adding would exceed MAX_VISIBLE, drop the oldest
        // immediately (and its timer, if any).
        if (next.length > MAX_VISIBLE) {
          const oldest = next[0];
          const oldTimer = timersRef.current.get(oldest.id);
          if (oldTimer) {
            clearTimeout(oldTimer);
            timersRef.current.delete(oldest.id);
          }
          return next.slice(1);
        }
        return next;
      });

      const timerId = setTimeout(() => dismissToast(id), finalDuration);
      timersRef.current.set(id, timerId);

      return id;
    },
    [dismissToast],
  );

  // Unmount cleanup: clear every outstanding timer.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  return { toasts, showToast, dismissToast };
}
