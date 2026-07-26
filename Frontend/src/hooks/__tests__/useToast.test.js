import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, __resetToastsForTest } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    __resetToastsForTest();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetToastsForTest();
  });

  it('showToast adds a toast to the array', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ type: 'success', message: 'Hola' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      message: 'Hola',
    });
  });

  it('showToast returns a unique id on every call', () => {
    const { result } = renderHook(() => useToast());

    let id1;
    let id2;
    act(() => {
      id1 = result.current.showToast({ type: 'info', message: 'A' });
      id2 = result.current.showToast({ type: 'info', message: 'B' });
    });

    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(id1).not.toBe(id2);
  });

  it('auto-dismisses a success toast after 4s', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ type: 'success', message: 'OK' });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(4001);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-dismisses a warning toast after 6s', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ type: 'warning', message: 'Cuidado' });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(4001);
    });
    // 4s is the success/info default — warning should still be visible.
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('custom duration overrides the per-type default', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ type: 'error', message: 'Boom', duration: 8000 });
    });
    expect(result.current.toasts).toHaveLength(1);

    // At 6s the default error would have fired; custom 8s keeps it alive.
    act(() => {
      vi.advanceTimersByTime(6001);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('dismissToast removes the toast and clears its timer', () => {
    const { result } = renderHook(() => useToast());

    let id;
    act(() => {
      id = result.current.showToast({ type: 'info', message: 'X' });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismissToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);

    // Advancing past the original 4s must NOT re-fire anything.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('stack cap: the 6th toast force-dismisses the oldest', () => {
    const { result } = renderHook(() => useToast());

    let oldestId;
    act(() => {
      oldestId = result.current.showToast({ type: 'info', message: 'first' });
      for (let i = 2; i <= 6; i += 1) {
        result.current.showToast({ type: 'info', message: `t${i}` });
      }
    });

    // Cap is 5; the oldest (first pushed) was force-dismissed.
    expect(result.current.toasts).toHaveLength(5);
    expect(result.current.toasts.some((t) => t.id === oldestId)).toBe(false);
    // Newest is at the tail.
    expect(result.current.toasts[result.current.toasts.length - 1].message).toBe('t6');
  });

  it('unmounting one consumer does not affect another (singleton state shared)', () => {
    // Two independent consumers, fired in different parts of the tree.
    const a = renderHook(() => useToast());
    const b = renderHook(() => useToast());

    act(() => {
      a.result.current.showToast({ type: 'info', message: 'from-a' });
    });
    // Both consumers see the toast (singleton broadcast).
    expect(a.result.current.toasts).toHaveLength(1);
    expect(b.result.current.toasts).toHaveLength(1);

    // Unmount A — B is unaffected and continues to receive updates.
    a.unmount();
    act(() => {
      b.result.current.showToast({ type: 'info', message: 'from-b' });
    });
    expect(b.result.current.toasts).toHaveLength(2);
    expect(b.result.current.toasts.map((t) => t.message)).toEqual([
      'from-a',
      'from-b',
    ]);
  });
});
