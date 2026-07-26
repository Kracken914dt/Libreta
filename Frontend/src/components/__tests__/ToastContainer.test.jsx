import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { ToastContainer } from '../ToastContainer';
import { useToast, __resetToastsForTest } from '../../hooks/useToast';

// Test harness: ToastContainer consumes useToast directly (no provider).
// This wrapper instantiates the hook and exposes showToast to the test
// via a ref-stored callback, keeping the public API clean.
function Harness({ apiRef }) {
  const { toasts, showToast, dismissToast } = useToast();
  if (apiRef) {
    apiRef.current = { showToast, dismissToast, toasts };
  }
  return <ToastContainer />;
}

describe('ToastContainer', () => {
  beforeEach(() => {
    __resetToastsForTest();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetToastsForTest();
    cleanup();
  });

  it('renders 4 toasts of different types with the right icons and palettes', async () => {
    const apiRef = { current: null };
    render(<Harness apiRef={apiRef} />);

    await act(async () => {
      apiRef.current.showToast({ type: 'success', message: 'OK' });
      apiRef.current.showToast({ type: 'info', message: 'Info msg' });
      apiRef.current.showToast({ type: 'warning', message: 'Warn msg' });
      apiRef.current.showToast({ type: 'error', message: 'Err msg' });
    });

    // 4 toast nodes rendered, all with status/alert roles
    const nodes = [
      ...screen.getAllByRole('status'),
      ...screen.getAllByRole('alert'),
    ];
    expect(nodes).toHaveLength(4);

    // Per-type palette classes land on the right nodes
    expect(nodes[0].className).toMatch(/emerald/);
    expect(nodes[1].className).toMatch(/sky/);
    expect(nodes[2].className).toMatch(/amber/);
    expect(nodes[3].className).toMatch(/rose/);

    // All four messages appear in document order
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Info msg')).toBeInTheDocument();
    expect(screen.getByText('Warn msg')).toBeInTheDocument();
    expect(screen.getByText('Err msg')).toBeInTheDocument();
  });

  it('click on X dismisses the corresponding toast', async () => {
    const apiRef = { current: null };
    render(<Harness apiRef={apiRef} />);

    await act(async () => {
      apiRef.current.showToast({ type: 'info', message: 'closable' });
    });
    expect(screen.getByText('closable')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /cerrar notificaci/i });
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByText('closable')).not.toBeInTheDocument();
    expect(apiRef.current.toasts).toHaveLength(0);
  });

  it('stack cap: 6th toast force-dismisses the oldest', async () => {
    const apiRef = { current: null };
    render(<Harness apiRef={apiRef} />);

    await act(async () => {
      for (let i = 1; i <= 6; i += 1) {
        apiRef.current.showToast({ type: 'info', message: `t${i}` });
      }
    });

    // Cap is 5 visible toasts.
    const visible = screen.getAllByText(/^t[1-6]$/);
    expect(visible).toHaveLength(5);
    // t1 was force-dismissed; t2..t6 remain (most recent last).
    expect(screen.queryByText('t1')).not.toBeInTheDocument();
    expect(screen.getByText('t6')).toBeInTheDocument();
  });

  it('success/info use role=status; warning/error use role=alert with assertive live region', async () => {
    const apiRef = { current: null };
    render(<Harness apiRef={apiRef} />);

    await act(async () => {
      apiRef.current.showToast({ type: 'success', message: 'polite s' });
      apiRef.current.showToast({ type: 'info', message: 'polite i' });
      apiRef.current.showToast({ type: 'warning', message: 'assertive w' });
      apiRef.current.showToast({ type: 'error', message: 'assertive e' });
    });

    const polite = screen.getAllByRole('status');
    const assertive = screen.getAllByRole('alert');
    expect(polite).toHaveLength(2);
    expect(assertive).toHaveLength(2);

    // aria-live ties to role
    expect(polite[0].getAttribute('aria-live')).toBe('polite');
    expect(assertive[0].getAttribute('aria-live')).toBe('assertive');
  });

  it('auto-dismisses a success toast after its 4s duration', async () => {
    const apiRef = { current: null };
    render(<Harness apiRef={apiRef} />);

    act(() => {
      apiRef.current.showToast({ type: 'success', message: 'temporary' });
    });
    expect(screen.getByText('temporary')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4001);
    });
    expect(screen.queryByText('temporary')).not.toBeInTheDocument();
  });

  it('aria-label includes the title when provided', async () => {
    const apiRef = { current: null };
    render(<Harness apiRef={apiRef} />);

    await act(async () => {
      apiRef.current.showToast({
        type: 'success',
        title: 'Éxito',
        message: 'Cliente guardado',
      });
    });

    const node = screen.getByRole('status');
    expect(node.getAttribute('aria-label')).toBe('Éxito: Cliente guardado');
  });
});
