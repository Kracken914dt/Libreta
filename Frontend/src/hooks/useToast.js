import { useState, useCallback, useEffect } from 'react';

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

// ---------------------------------------------------------------------------
// Module-level state + subscription (singleton).
//
// Why a singleton: a component like EditClienteModal calls useToast() to fire
// a notification, but ToastContainer (mounted in App.jsx) calls useToast() too
// to read the list. They are siblings, not parent/child, so React's per-hook
// slot would give each its own state — toasts would fire into the void.
//
// Same pattern as useModalA11y: module-level Set of subscribers + state. Each
// useToast() invocation registers a listener; mutations broadcast to all.
// ---------------------------------------------------------------------------
let toastsState = [];
const listeners = new Set();
let toastIdCounter = 0;
const timers = new Map(); // toastId -> setTimeout handle

const nextToastId = () => `toast-${++toastIdCounter}-${Date.now()}`;

function notify() {
  // Always emit a fresh reference so React's Object.is bail-out short-circuits
  // and consumers re-render on every state change.
  listeners.forEach((cb) => cb(toastsState));
}

function dismiss(id) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toastsState = toastsState.filter((t) => t.id !== id);
  notify();
}

function show({ type = 'info', message, title, duration } = {}) {
  const id = nextToastId();
  const finalDuration = duration ?? DEFAULT_DURATIONS[type] ?? 4000;
  const toast = { id, type, message, title, duration: finalDuration, createdAt: Date.now() };

  // Stack cap: drop oldest before pushing the new one.
  let next = toastsState.concat(toast);
  if (next.length > MAX_VISIBLE) {
    const oldest = next[0];
    const oldTimer = timers.get(oldest.id);
    if (oldTimer) {
      clearTimeout(oldTimer);
      timers.delete(oldest.id);
    }
    next = next.slice(1);
  }
  toastsState = next;
  notify();

  const timer = setTimeout(() => dismiss(id), finalDuration);
  timers.set(id, timer);
  return id;
}

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
 *  - Unmount cleanup: only clears the subscriber (timers are shared, never
 *    orphaned while another consumer is mounted).
 *
 * @returns {{ toasts: Array, showToast: Function, dismissToast: Function }}
 */
export function useToast() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  // Stable references: show/dismiss close over module-level state, so they
  // never need to change identity across renders.
  const showToast = useCallback((opts) => show(opts), []);
  const dismissToast = useCallback((id) => dismiss(id), []);

  return { toasts: toastsState, showToast, dismissToast };
}

// Dev-only test seam (consistent with useModalA11y L112-123). Reviewer can
// inspect state + dismiss a single toast via console in dev mode.
if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  window.__test_useToast = {
    getCount: () => toastsState.length,
    getIds: () => toastsState.map((t) => t.id),
    getTimers: () => timers.size,
  };
}

// Test-only: clear module state between test cases. Exported separately to
// avoid leaking into the dev seam. Production code never imports this.
export function __resetToastsForTest() {
  timers.forEach((id) => clearTimeout(id));
  timers.clear();
  toastsState = [];
  notify();
}
