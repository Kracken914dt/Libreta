import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Module-level state: ref-counted body scroll lock + focus restore.
// This guarantees idempotency when multiple modals stack (e.g. AlertModal
// on top of HistorialClienteModal). The first mount captures the trigger
// element and locks the body; the last cleanup restores both.
let openModalCount = 0;
let previousActiveElement = null;

/**
 * useModalA11y — encapsulates modal accessibility behaviors.
 *
 * Contract (spec R-theme-2):
 *  - ESC keypress while isOpen === true → calls onClose().
 *  - Tab / Shift+Tab are trapped inside modalRef (focus cycles).
 *  - document.body.style.overflow becomes 'hidden' when the first modal opens
 *    and is restored to '' when the last one closes.
 *  - On close, focus is restored to the element that opened the modal.
 *  - ARIA helpers: returns { titleId } for use in aria-labelledby.
 *
 * @param {Object}   params
 * @param {boolean}  params.isOpen
 * @param {Function} params.onClose
 * @param {Object}   params.modalRef - React ref attached to modal container
 * @returns {{ titleId: string }}
 */
export function useModalA11y({ isOpen, onClose, modalRef }) {
  const titleId = useId();
  // Keep a stable ref to the latest onClose so the keydown effect can depend
  // on isOpen only without re-binding on every parent render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Effect 1: lifecycle (open/close) — ref-counted scroll lock + focus restore.
  useEffect(() => {
    if (!isOpen) return undefined;

    if (openModalCount === 0) {
      previousActiveElement = document.activeElement;
      document.body.style.overflow = 'hidden';
    }
    openModalCount += 1;

    // Focus the first focusable element inside the modal after paint.
    const rafId = requestAnimationFrame(() => {
      const focusable = modalRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      focusable?.[0]?.focus();
    });

    return () => {
      cancelAnimationFrame(rafId);
      openModalCount -= 1;
      if (openModalCount === 0) {
        document.body.style.overflow = '';
        if (
          previousActiveElement &&
          typeof previousActiveElement.focus === 'function'
        ) {
          previousActiveElement.focus();
        }
        previousActiveElement = null;
      }
    };
  }, [isOpen, modalRef]);

  // Effect 2: ESC + Tab trap. Listener is bound on document so it fires
  // regardless of which descendant has focus.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = Array.from(
          modalRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [],
        ).filter((el) => el.offsetParent !== null);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, modalRef]);

  return { titleId };
}

// Dev-only test seam: exposes the ref-count so a reviewer can verify
// idempotency in the console without needing a test runner.
// Usage (in dev):
//   window.__test_useModalA11y.getCount()          // current open count
//   window.__test_useModalA11y.getPreviousActive() // saved trigger element
//   window.__test_useModalA11y.getBodyOverflow()   // 'hidden' | ''
if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  window.__test_useModalA11y = {
    getCount: () => openModalCount,
    getPreviousActive: () => previousActiveElement,
    getBodyOverflow: () => document.body.style.overflow,
  };
}
